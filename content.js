(function() {
  'use strict';

  let dictionary = new Map();
  let customPatterns = [];
  let compiledRegex = null;
  let isEnabled = true;
  let siteAllowed = true;
  let termMode = 'replace';
  let observer = null;
  let translatedCount = 0;

  const SKIP_TAGS = new Set(['script','style','noscript','iframe','textarea','input','code','pre','head','meta','link']);
  const TRANSLATABLE_ATTRS = ['title','aria-label','placeholder','alt'];
  const PROCESSED = new WeakSet();
  const SVG_ORIG = new WeakMap();

  let mutationQueue = [];
  let rafPending = false;
  let fitText = {
    enabled: true,
    termScale: 100,
    allowWrap: true,
    expandParents: true,
    siteCss: ''
  };

  function parseSiteCss(raw, hostname) {
    if (!raw || !hostname) return '';
    const lines = String(raw).split('\n');
    let currentDomain = '';
    let chunks = [];
    let buf = [];
    function flush() {
      if (!currentDomain || !buf.length) { buf = []; return; }
      const d = currentDomain.toLowerCase();
      if (hostname === d || hostname.endsWith('.' + d)) {
        chunks.push(buf.join('\n'));
      }
      buf = [];
    }
    for (const line of lines) {
      const m = line.match(/^\s*#\s*([a-z0-9.-]+)\s*$/i);
      if (m) {
        flush();
        currentDomain = m[1];
        continue;
      }
      if (currentDomain) buf.push(line);
    }
    flush();
    return chunks.join('\n');
  }

  function buildFitCss() {
    let css = '.lt-term + .lt-term { margin-inline-start: 0.3em; }\n';
    if (!fitText || fitText.enabled === false) return css;
    const scale = Math.min(100, Math.max(50, parseInt(fitText.termScale, 10) || 100));
    css += 'span.lt-term { font-size: ' + (scale / 100) + 'em; }\n';
    if (fitText.allowWrap !== false) {
      css += 'span.lt-term { white-space: normal; overflow-wrap: anywhere; word-break: break-word; }\n';
    }
    if (fitText.expandParents !== false) {
      css += 'span.lt-term { max-width: none; }\n';
      css += ':is(span, div, p, a, button, li, td, th, label):has(> span.lt-term) {\n';
      css += '  white-space: normal !important;\n';
      css += '  overflow: visible !important;\n';
      css += '  text-overflow: unset !important;\n';
      css += '  max-width: none;\n';
      css += '}\n';
    }
    const sitePart = parseSiteCss(fitText.siteCss || '', location.hostname);
    if (sitePart) css += sitePart + '\n';
    return css;
  }

  function injectStyles() {
    let style = document.getElementById('lt-translator-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'lt-translator-style';
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = buildFitCss();
  }

  function applyFitSettings(raw) {
    const f = raw && typeof raw === 'object' ? raw : {};
    fitText = {
      enabled: f.enabled !== false,
      termScale: Math.min(100, Math.max(50, parseInt(f.termScale, 10) || 100)),
      allowWrap: f.allowWrap !== false,
      expandParents: f.expandParents !== false,
      siteCss: typeof f.siteCss === 'string' ? f.siteCss : ''
    };
    injectStyles();
  }

  function init() {
    injectStyles();
    chrome.storage.local.get(['dictionary', 'customPatterns', 'fitText'], (localResult) => {
      updateDictionaryData(localResult.dictionary || {});
      loadCustomPatterns(localResult.customPatterns || []);
      const applyAndStart = (fit) => {
        applyFitSettings(fit);
        chrome.storage.local.get(['siteProfiles'], (loc2) => {
          chrome.storage.sync.get([
            'isEnabled','siteMode','allowedSites','blockedSites','developerSites','termMode',
            'termModeReplaceSites','termModeAnnotateSites','termModeBracketsSites'
          ], (syncResult) => {
            const merged = Object.assign({}, syncResult, { siteProfiles: loc2.siteProfiles || {} });
            isEnabled = merged.isEnabled !== false;
            termMode = resolveTermMode(merged);
            checkSiteAllowed(merged);
            if (isEnabled && siteAllowed) {
              translateDocument();
              startObserver();
            }
            initBlockPicker();
            initQuickEdit();
          });
        });
      };
      if (localResult.fitText) {
        applyAndStart(localResult.fitText);
      } else {
        chrome.storage.sync.get(['fitText'], (sync) => {
          if (sync.fitText) {
            chrome.storage.local.set({ fitText: sync.fitText });
            applyAndStart(sync.fitText);
          } else {
            applyAndStart(null);
          }
        });
      }
    });
  }

  function loadCustomPatterns(patterns) {
    customPatterns = [];
    for (const p of patterns) {
      if (!p || !p.pattern || !p.replacement) continue;
      try {
        customPatterns.push({
          regex: new RegExp(p.pattern, p.flags || 'giu'),
          replacement: p.replacement
        });
      } catch (_) {}
    }
  }

  function updateDictionaryData(newDict) {
    dictionary = new Map();
    const raw = newDict || {};
    const keysForRegex = [];
    for (const [key, variants] of Object.entries(raw)) {
      if (!key || !key.trim()) continue;
      const lower = key.toLowerCase();
      if (!dictionary.has(lower)) {
        dictionary.set(lower, variants);
        keysForRegex.push(key);
      } else {
        const existing = dictionary.get(lower);
        if (Array.isArray(existing) && Array.isArray(variants)) {
          existing.push(...variants);
          existing.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        }
      }
    }
    keysForRegex.sort((a, b) => b.length - a.length);
    if (keysForRegex.length === 0) {
      compiledRegex = null;
      return;
    }
    const escapedKeys = keysForRegex.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    compiledRegex = new RegExp('(?<![\\p{L}\\p{N}_])(' + escapedKeys.join('|') + ')(?![\\p{L}\\p{N}_])', 'giu');
  }

  const DEFAULT_DEV_SITES = [
    'uwuowo.mathi.moe',
    'loawa.com',
    'lostark.ru',
    'docs.google.com',
    'loachart.com',
    'rloa.gg',
    'playlostark.com',
    'lostark.game.onstove.com',
    'lostark.qq.com',
    'lostark.bible',
    'loa-buddy.pages.dev',
    'mokoko.co.kr',
    'loaguard.com',
    'lostbuilds.com',
    'maxroll.gg',
    'loaviewer.github.io',
    'loapattern.com',
    'nexus-guide-site.pages.dev',
    'sites.google.com',
    'mokitoki.ru',
    'lopec.kr',
    'zloa.net',
    'loaup.com',
    'honing-forecast.pages.dev',
    'loatto.jp',
    'icepeng.com',
    'lo4.app',
    'loaclac-doss.vercel.app',
    'la-tools.com',
    'airplaner.github.io',
    'ssbcalc.poyomi.fyi',
    'raimundomedeiros.github.io',
    'loatool.taeu.kr',
    'lostgld.com',
    'ark.bynn.jp',
    'loatracker.pages.dev',
    'reddit.com',
    'inven.co.kr'
  ];

  function parseSiteList(raw, fallbackArr) {
    const list = (raw || '').split('\n').map(s => s.trim()).filter(Boolean);
    if (list.length) return list;
    return fallbackArr || [];
  }

  function checkSiteAllowed(result) {
    const mode = result.siteMode || 'everywhere';
    const hostname = location.hostname;
    if (mode === 'everywhere') {
      siteAllowed = true;
    } else if (mode === 'allowlist') {
      const list = parseSiteList(result.allowedSites);
      siteAllowed = list.some(d => hostname === d || hostname.endsWith('.' + d));
    } else if (mode === 'blocklist') {
      const list = parseSiteList(result.blockedSites);
      siteAllowed = !list.some(d => hostname === d || hostname.endsWith('.' + d));
    } else if (mode === 'developer') {
      const list = parseSiteList(result.developerSites, DEFAULT_DEV_SITES);
      siteAllowed = list.some(d => hostname === d || hostname.endsWith('.' + d));
    } else {
      siteAllowed = true;
    }
  }

  function domainInList(hostname, raw) {
    const list = (raw || '').split('\n').map(s => s.trim()).filter(Boolean);
    return list.some(d => hostname === d || hostname.endsWith('.' + d));
  }

  function hostKey(hostname) {
    return String(hostname || location.hostname || '').replace(/^www\./, '').toLowerCase();
  }

  function getProfileForHost(profiles, hostname) {
    if (!profiles || typeof profiles !== 'object') return null;
    const host = hostKey(hostname);
    if (profiles[host]) return profiles[host];
    for (const key of Object.keys(profiles)) {
      const k = String(key).toLowerCase();
      if (host === k || host.endsWith('.' + k)) return profiles[key];
    }
    return null;
  }

  function resolveTermMode(result) {
    const hostname = location.hostname;
    const profile = getProfileForHost(result.siteProfiles, hostname);
    if (profile && profile.termMode) return profile.termMode;
    if (domainInList(hostname, result.termModeAnnotateSites)) return 'annotate';
    if (domainInList(hostname, result.termModeBracketsSites)) return 'brackets';
    if (domainInList(hostname, result.termModeReplaceSites)) return 'replace';
    return result.termMode || 'replace';
  }

  function shouldSkipNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return true;
    const parent = node.parentElement;
    if (!parent) return true;
    if (SKIP_TAGS.has(parent.tagName.toLowerCase())) return true;
    if (parent.classList.contains('lt-term')) return true;
    if (parent.closest && parent.closest('.lt-term')) return true;
    return false;
  }

  function isInsideSvg(node) {
    const parent = node.parentElement || node;
    if (!parent || !parent.closest) return false;
    if (parent.closest('svg')) return true;
    const tn = (parent.tagName || '').toLowerCase();
    return tn === 'text' || tn === 'tspan' || tn === 'textpath';
  }

  function matchesContext(variant, surrounding) {
    if (!surrounding) return false;
    const text = surrounding.toLowerCase();
    const tags = variant.tags || [];
    const isSkillLike = tags.some(t =>
      t === 'skill' || t === 'tripod' || t === 'arkpass' || t === 'classcore'
    );
    if (variant.parent) {
      const p = String(variant.parent).toLowerCase().trim();
      if (p.length >= 2) {
        if (p.length <= 3) {
          const re = new RegExp('(?:^|[^\\p{L}\\p{N}_])' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:[^\\p{L}\\p{N}_]|$)', 'iu');
          if (re.test(text)) return true;
        } else if (text.includes(p)) {
          return true;
        }
      }
    }
    // Для skill/tripod контекст только по parent (имя умения/класса рядом).
    // Имя класса в tags на странице персонажа даёт ложные срабатывания и
    // перебивает интерфейс (깨달음→Становление, 도약→Прогресс).
    if (isSkillLike) return false;
    if (tags.length) {
      return tags.some(tag => {
        const t = String(tag).toLowerCase();
        if (t === 'skill' || t === 'class_build' || t === 'engraving' || t === 'skill_class') return false;
        if (t === 'arkpass' || t === 'classcore' || t === 'class' || t === 'tripod') return false;
        if (t === 'context' || t === 'interface' || t === 'term' || t === 'rune' || t === 'gem' || t === 'item') return false;
        if (t === 'accessory' || t === 'bracelet' || t === 'grade') return false;
        return t.length > 2 && text.includes(t);
      });
    }
    return false;
  }

  function isBuildVariant(v) {
    const tags = v.tags || [];
    return tags.includes('class_build') || tags.includes('build');
  }

  function isSkillVariant(v) {
    const tags = v.tags || [];
    return tags.includes('skill') || tags.includes('arkpass') || tags.includes('classcore') || tags.includes('tripod');
  }

  function isEngravingVariant(v) {
    const tags = v.tags || [];
    return tags.includes('engraving');
  }

  function isClassVariant(v) {
    const tags = v.tags || [];
    return tags.includes('class') || tags.includes('skill_class') || tags.includes('arkpass_class') || tags.includes('classcore_class');
  }

  function isInterfaceVariant(v) {
    const tags = v.tags || [];
    return tags.includes('interface') || tags.includes('term') || tags.includes('rune') || tags.includes('gem') || tags.includes('item');
  }

  function getLocalSkillContext(node) {
    if (!node) return '';
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el) return '';
    let text = el.textContent || '';
    if (text.trim().length < 40 && el.parentElement) {
      const p = el.parentElement;
      const tag = (p.tagName || '').toUpperCase();
      if (tag === 'TD' || tag === 'TH' || tag === 'A' || tag === 'SPAN' || tag === 'LABEL') {
        text = p.textContent || text;
      }
    }
    return text.slice(0, 150);
  }

  function hasSkillLevelContext(node) {
    const t = getLocalSkillContext(node);
    if (!t) return false;
    if (/(?:lv\.?\s*|lvl\.?\s*|level\s*|레벨\s+)10\b/i.test(t)) return true;
    if (t.trim().length <= 30 && /(?:^|[^\d])10(?=[^\d]|$)/.test(t)) return true;
    return false;
  }

  function hasSkillUiContext(node) {
    if (!node) return false;
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    let depth = 0;
    while (el && depth < 6) {
      if (el.getAttribute) {
        if (el.getAttribute('data-lostark-skill-code')) return true;
        if (el.getAttribute('data-skill-code') || el.getAttribute('data-skill-id')) return true;
      }
      if (el.classList) {
        if (el.classList.contains('skill-icon')) return true;
        if (el.classList.contains('skill-name')) return true;
      }
      if (el.tagName === 'A') {
        const href = el.getAttribute('href') || '';
        if (/\/skill\/|skill\/\d+|code=\d{4,}/i.test(href)) return true;
      }
      if (el.tagName === 'IMG') {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        if (/\/skill|skillicon|skill_icon|tripod_tier/i.test(src) || /스킬|skill/i.test(alt)) return true;
      }
      el = el.parentElement;
      depth++;
    }
    return false;
  }

  function hasArkCoreContext(node, surrounding) {
    let t = surrounding || '';
    if (node) {
      try {
        let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        let depth = 0;
        while (el && depth < 6) {
          t += ' ' + (el.textContent || '').slice(0, 200);
          const img = el.querySelector && el.querySelector('img[alt]');
          if (img) t += ' ' + (img.getAttribute('alt') || '');
          el = el.parentElement;
          depth++;
        }
      } catch (_) {}
    }
    return /코어|core|ядр|혼돈|질서|chaos|order|ark\s*grid|아크\s*그리드|созвезд|그리드|grid/i.test(t);
  }

  function resolveTranslation(match, surrounding, node) {
    const variants = dictionary.get(match.toLowerCase());
    if (!variants || !variants.length) return match;
    if (typeof variants === 'string') return variants;

    for (const v of variants) {
      if (isBuildVariant(v) && matchesContext(v, surrounding)) return v.value;
    }
    // Интерфейс (ветки АРК: Становление/Прогресс/Экспансия) выше skill без жёсткого parent.
    for (const v of variants) {
      if (isInterfaceVariant(v)) return v.value;
    }
    for (const v of variants) {
      if (isSkillVariant(v) && matchesContext(v, surrounding)) return v.value;
    }
    const skillUi = hasSkillLevelContext(node) || hasSkillUiContext(node);
    if (skillUi) {
      for (const v of variants) {
        if (isSkillVariant(v)) return v.value;
      }
    }
    if (hasArkCoreContext(node, surrounding)) {
      for (const v of variants) {
        if (isSkillVariant(v) && (v.tags || []).some(t => t === 'arkpass' || t === 'classcore')) return v.value;
      }
      for (const v of variants) {
        if (isSkillVariant(v)) return v.value;
      }
    }
    for (const v of variants) {
      if (isEngravingVariant(v)) return v.value;
    }
    for (const v of variants) {
      if (isClassVariant(v)) return v.value;
    }
    for (const v of variants) {
      if (!isSkillVariant(v) && !isBuildVariant(v)) return v.value;
    }
    const compactLen = String(match).replace(/\s+/g, '').length;
    if (compactLen >= 3) {
      for (const v of variants) {
        if (isBuildVariant(v)) return v.value;
      }
      for (const v of variants) {
        if (isSkillVariant(v)) return v.value;
      }
    }
    return match;
  }

  function applyCustomPatterns(text) {
    let result = text;
    let changed = false;
    for (const p of customPatterns) {
      p.regex.lastIndex = 0;
      if (p.regex.test(result)) {
        p.regex.lastIndex = 0;
        result = result.replace(p.regex, p.replacement);
        changed = true;
      }
    }
    return changed ? result : null;
  }

  function collectLongestMatches(text) {
    if (!compiledRegex || !text) return [];
    compiledRegex.lastIndex = 0;
    const raw = [];
    let m;
    while ((m = compiledRegex.exec(text)) !== null) {
      raw.push({ index: m.index, text: m[0], length: m[0].length });
      if (m[0].length === 0) compiledRegex.lastIndex++;
    }
    raw.sort((a, b) => b.length - a.length || a.index - b.index);
    const chosen = [];
    for (const cand of raw) {
      const overlaps = chosen.some(c =>
        !(cand.index + cand.length <= c.index || c.index + c.length <= cand.index)
      );
      if (!overlaps) chosen.push(cand);
    }
    chosen.sort((a, b) => a.index - b.index);
    return chosen;
  }

  function doTranslatePlain(text, surrounding) {
    if (!text || !text.trim()) return null;
    let result = text;
    let matchCount = 0;
    if (compiledRegex) {
      const hits = collectLongestMatches(result);
      if (hits.length) {
        let out = '';
        let last = 0;
        for (const hit of hits) {
          out += result.slice(last, hit.index);
          const v = resolveTranslation(hit.text, surrounding || text, null);
          if (v !== hit.text) matchCount++;
          out += v;
          last = hit.index + hit.length;
        }
        out += result.slice(last);
        result = out;
      }
    }
    const custom = applyCustomPatterns(result);
    if (custom !== null) {
      result = custom;
      matchCount = Math.max(matchCount, 1);
    }
    return matchCount > 0 ? { text: result, count: matchCount } : null;
  }

  function getSurroundingText(node) {
    let text = '';
    let el = node.parentElement || node;
    let depth = 0;
    while (el && depth < 5) {
      text += ' ' + (el.textContent || '').slice(0, 800);
      if (el.tagName === 'TR' || el.tagName === 'LI' || el.tagName === 'ARTICLE') break;
      el = el.parentElement;
      depth++;
    }
    if (node.parentElement) {
      const tr = node.parentElement.closest && node.parentElement.closest('tr');
      if (tr) text += ' ' + (tr.textContent || '').slice(0, 800);
      const row = node.parentElement.closest && node.parentElement.closest('[class*="row"], [class*="skill"]');
      if (row && row !== tr) text += ' ' + (row.textContent || '').slice(0, 500);
    }
    return text;
  }

  function makeTermSpan(translated, original) {
    const span = document.createElement('span');
    span.className = 'lt-term notranslate';
    span.setAttribute('translate', 'no');
    span.setAttribute('data-lt-orig', original);
    span.setAttribute('data-lt-tr', translated);
    const mode = termMode || 'replace';
    if (mode === 'annotate') {
      span.textContent = original;
      span.title = translated;
      span.setAttribute('data-lt-mode', 'annotate');
    } else if (mode === 'brackets') {
      span.textContent = original + ' (' + translated + ')';
      span.title = translated;
      span.setAttribute('data-lt-mode', 'brackets');
    } else {
      span.textContent = translated;
      span.title = original;
      span.setAttribute('data-lt-mode', 'replace');
    }
    return span;
  }

  function firstContentChar(node) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent || '';
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== ' ' && t[i] !== '\t' && t[i] !== '\n' && t[i] !== '\r') return t[i];
      }
      return firstContentChar(node.nextSibling);
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'BR') return '';
      return firstContentChar(node.firstChild) || firstContentChar(node.nextSibling);
    }
    return '';
  }

  function lastContentChar(node) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent || '';
      for (let i = t.length - 1; i >= 0; i--) {
        if (t[i] !== ' ' && t[i] !== '\t' && t[i] !== '\n' && t[i] !== '\r') return t[i];
      }
      return lastContentChar(node.previousSibling);
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'BR') return '';
      return lastContentChar(node.lastChild) || lastContentChar(node.previousSibling);
    }
    return '';
  }

  function isWordChar(ch) {
    if (!ch) return false;
    return /[\p{L}\p{N}]/u.test(ch);
  }

  function isTranslatorWrapper(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.tagName === 'FONT') return true;
    const st = el.getAttribute('style') || '';
    if (/vertical-align\s*:\s*inherit/i.test(st)) return true;
    if (el.classList && (el.classList.contains('translated-clickable') || el.classList.contains('goog-text-highlight'))) return true;
    return false;
  }

  function ensureSpaceAroundTerm(span) {
    if ((termMode || 'replace') !== 'replace') return;
    const parent = span.parentNode;
    if (!parent) return;

    const next = span.nextSibling;
    if (next) {
      if (next.nodeType === Node.TEXT_NODE) {
        const t = next.textContent || '';
        if (t.length && !/^\s/.test(t) && isWordChar(t[0])) {
          next.textContent = ' ' + t;
        }
      } else if (next.nodeType === Node.ELEMENT_NODE && isTranslatorWrapper(next)) {
        const ch = firstContentChar(next);
        if (isWordChar(ch)) {
          parent.insertBefore(document.createTextNode(' '), next);
        }
      }
    }

    const prev = span.previousSibling;
    if (prev) {
      if (prev.nodeType === Node.TEXT_NODE) {
        const t = prev.textContent || '';
        if (t.length && !/\s$/.test(t) && isWordChar(t[t.length - 1])) {
          prev.textContent = t + ' ';
        }
      } else if (prev.nodeType === Node.ELEMENT_NODE && isTranslatorWrapper(prev)) {
        const ch = lastContentChar(prev);
        if (isWordChar(ch)) {
          parent.insertBefore(document.createTextNode(' '), span);
        }
      }
    }
  }

  function significantChildren(parent) {
    const out = [];
    if (!parent || !parent.childNodes) return out;
    for (const c of parent.childNodes) {
      if (c.nodeType === Node.COMMENT_NODE) continue;
      if (c.nodeType === Node.TEXT_NODE && !(c.textContent || '').trim()) continue;
      out.push(c);
    }
    return out;
  }

  function canUseHostMode(parent, node) {
    if (!parent || parent.nodeType !== Node.ELEMENT_NODE) return false;
    const sig = significantChildren(parent);
    return sig.length === 1 && sig[0] === node;
  }

  function translateNode(node, force) {
    if (shouldSkipNode(node)) return;
    const parent = node.parentNode;
    if (!parent) return;

    if (force && parent.nodeType === Node.ELEMENT_NODE && parent.hasAttribute('data-lt-host')) {
      const cur = (node.textContent || '').trim();
      const orig = (parent.getAttribute('title') || '').trim();
      if (cur && /[\uac00-\ud7af]/.test(cur) && cur !== orig) {
        parent.removeAttribute('data-lt-host');
        parent.classList.remove('notranslate');
        parent.removeAttribute('translate');
        try { PROCESSED.delete(node); } catch (_) {}
      } else if (cur && cur === orig) {
        parent.removeAttribute('data-lt-host');
        parent.classList.remove('notranslate');
        parent.removeAttribute('translate');
        try { PROCESSED.delete(node); } catch (_) {}
      } else if (!/[\uac00-\ud7af]/.test(cur)) {
        return;
      }
    }

    if (!force && PROCESSED.has(node)) return;

    const text = node.textContent;
    if (!text || !text.trim()) return;
    const surrounding = getSurroundingText(node);

    const trimmed = text.trim();
    if (trimmed && dictionary.has(trimmed.toLowerCase())) {
      const translated = resolveTranslation(trimmed, surrounding || text, node);
      if (translated && translated !== trimmed) {
        const mode = termMode || 'replace';
        if (mode === 'annotate') {
          if (parent.nodeType === Node.ELEMENT_NODE) parent.setAttribute('title', translated);
          PROCESSED.add(node);
          return;
        }
        const lead = text.match(/^\s*/)[0];
        const trail = text.match(/\s*$/)[0];
        let out;
        if (mode === 'brackets') out = lead + trimmed + ' (' + translated + ')' + trail;
        else out = lead + translated + trail;
        if (canUseHostMode(parent, node)) {
          node.textContent = out;
          parent.classList.add('notranslate');
          parent.setAttribute('translate', 'no');
          parent.setAttribute('data-lt-host', '1');
          if (mode === 'replace') parent.setAttribute('title', trimmed);
        } else {
          const span = makeTermSpan(translated, trimmed);
          parent.replaceChild(span, node);
          ensureSpaceAroundTerm(span);
        }
        translatedCount++;
        PROCESSED.add(node);
        return;
      }
    }

    if (!compiledRegex && customPatterns.length === 0) return;

    if (isInsideSvg(node)) {
      if ((termMode || 'replace') !== 'replace') return;
      let out = text;
      let matchCount = 0;
      if (compiledRegex) {
        compiledRegex.lastIndex = 0;
        out = text.replace(compiledRegex, (original) => {
          const translated = resolveTranslation(original, surrounding || text, node);
          if (translated !== original) {
            matchCount++;
            return translated;
          }
          return original;
        });
      }
      if (customPatterns.length) {
        const custom = applyCustomPatterns(out);
        if (custom !== null && custom !== out) {
          out = custom;
          matchCount++;
        }
      }
      if (out !== text) {
        if (!SVG_ORIG.has(node)) SVG_ORIG.set(node, text);
        node.textContent = out;
        translatedCount += matchCount;
      }
      return;
    }

    const parts = [];
    let lastIndex = 0;
    let matchCount = 0;
    let anyChanged = false;

    if (compiledRegex) {
      const chosen = collectLongestMatches(text);
      for (const hit of chosen) {
        if (hit.index > lastIndex) {
          parts.push({ type: 'text', value: text.slice(lastIndex, hit.index) });
        }
        const original = hit.text;
        const translated = resolveTranslation(original, surrounding || text, node);
        if (translated !== original) {
          parts.push({ type: 'term', value: translated, original: original });
          anyChanged = true;
          matchCount++;
        } else {
          parts.push({ type: 'text', value: original });
        }
        lastIndex = hit.index + original.length;
      }
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', value: text.slice(lastIndex) });
    }
    if (parts.length === 0) {
      parts.push({ type: 'text', value: text });
    }

    if (customPatterns.length) {
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].type !== 'text') continue;
        const custom = applyCustomPatterns(parts[i].value);
        if (custom !== null && custom !== parts[i].value) {
          parts[i] = { type: 'term', value: custom, original: parts[i].value };
          anyChanged = true;
          matchCount++;
        }
      }
    }

    if (!anyChanged) return;

    const mode = termMode || 'replace';
    const termParts = parts.filter(p => p.type === 'term');
    const textParts = parts.filter(p => p.type === 'text' && p.value && p.value.trim());
    const wholeNodeIsTerms = textParts.length === 0;

    if (wholeNodeIsTerms || (termParts.length >= 1 && textParts.length === 0)) {
      let out = '';
      for (const part of parts) {
        if (part.type === 'term') {
          if (mode === 'annotate') {
            out += part.original;
          } else if (mode === 'brackets') {
            out += part.original + ' (' + part.value + ')';
          } else {
            out += part.value;
          }
        } else {
          out += part.value || '';
        }
      }
      if (!SVG_ORIG.has(node)) SVG_ORIG.set(node, text);
      node.textContent = out;
      if (parent.nodeType === Node.ELEMENT_NODE) {
        if (mode === 'annotate' && termParts.length === 1) {
          parent.setAttribute('title', termParts[0].value);
        }
        parent.classList.add('notranslate');
        parent.setAttribute('translate', 'no');
        parent.setAttribute('data-lt-host', '1');
      }
      translatedCount += matchCount;
      return;
    }

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].type !== 'term') continue;
      const next = parts[i + 1];
      if (!next) continue;
      if (next.type === 'text') {
        if (next.value && /^[\p{L}\p{N}]/u.test(next.value[0])) {
          next.value = ' ' + next.value;
        }
      } else if (next.type === 'term') {
        parts.splice(i + 1, 0, { type: 'text', value: ' ' });
        i++;
      }
    }

    const frag = document.createDocumentFragment();
    const insertedSpans = [];
    for (const part of parts) {
      if (part.type === 'term') {
        const sp = makeTermSpan(part.value, part.original);
        frag.appendChild(sp);
        insertedSpans.push(sp);
      } else if (part.value) {
        frag.appendChild(document.createTextNode(part.value));
      }
    }
    parent.replaceChild(frag, node);
    for (const sp of insertedSpans) {
      ensureSpaceAroundTerm(sp);
    }
    translatedCount += matchCount;
  }

  function translateAttributes(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(el.tagName.toLowerCase())) return;
    if (el.classList.contains('lt-term')) return;
    if (el.closest && el.closest('svg')) return;
    if (PROCESSED.has(el)) return;

    const surrounding = getSurroundingText(el) || el.textContent || '';
    let any = false;

    for (const attr of TRANSLATABLE_ATTRS) {
      const val = el.getAttribute(attr);
      if (!val || !val.trim()) continue;
      const result = doTranslatePlain(val, surrounding);
      if (result === null || result.text === val) continue;
      const dataKey = 'origAttr_' + attr.replace(/-/g, '_');
      if (!el.dataset[dataKey]) {
        el.dataset[dataKey] = val;
      }
      el.setAttribute(attr, result.text);
      any = true;
      translatedCount += result.count;
    }
    if (any) {
      PROCESSED.add(el);
    }
  }

  function translateElementTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateNode(root);
      return;
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(root);
      const textNodes = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }
      for (const tn of textNodes) {
        translateNode(tn);
      }
      if (root.shadowRoot) {
        const shadowText = [];
        const sw = document.createTreeWalker(root.shadowRoot, NodeFilter.SHOW_TEXT, null, false);
        while ((node = sw.nextNode())) {
          shadowText.push(node);
        }
        for (const tn of shadowText) {
          translateNode(tn);
        }
        root.shadowRoot.querySelectorAll('*').forEach(translateAttributes);
      }
    }
  }

  function translateDocument() {
    if (!siteAllowed) return;
    translatedCount = 0;
    translateElementTree(document.body);
    try {
      document.body.querySelectorAll('span.lt-term').forEach(ensureSpaceAroundTerm);
    } catch (_) {}
    reportStats();
  }

  function restoreDocument() {
    const spans = document.body.querySelectorAll('span.lt-term');
    for (const span of spans) {
      const orig = span.getAttribute('data-lt-orig');
      const text = orig !== null ? orig : span.textContent;
      const textNode = document.createTextNode(text);
      if (span.parentNode) span.parentNode.replaceChild(textNode, span);
    }
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let n;
      while ((n = walker.nextNode())) {
        if (SVG_ORIG.has(n)) {
          n.textContent = SVG_ORIG.get(n);
          SVG_ORIG.delete(n);
        }
      }
    } catch (_) {}
    const allEls = document.body.querySelectorAll('*');
    for (const el of allEls) {
      for (const attr of TRANSLATABLE_ATTRS) {
        const dataKey = 'origAttr_' + attr.replace(/-/g, '_');
        if (el.dataset[dataKey] !== undefined) {
          el.setAttribute(attr, el.dataset[dataKey]);
          delete el.dataset[dataKey];
        }
      }
      if (el.classList.contains('notranslate') && !el.classList.contains('lt-term')) {
        el.classList.remove('notranslate');
      }
      if (el.getAttribute('translate') === 'no' && !el.classList.contains('lt-term')) {
        el.removeAttribute('translate');
      }
      if (el.hasAttribute('data-lt-host') && !el.classList.contains('lt-term')) {
        el.removeAttribute('data-lt-host');
      }
    }
    translatedCount = 0;
    reportStats();
  }

  function reportStats() {
    try {
      chrome.runtime.sendMessage({ action: 'pageStats', count: translatedCount, url: location.href }).catch(() => {});
    } catch (_) {}
  }

  function unwrapStaleTerm(span) {
    if (!span || !span.isConnected || !span.classList.contains('lt-term')) return null;
    const cur = (span.textContent || '').trim();
    const orig = (span.getAttribute('data-lt-orig') || '').trim();
    const tr = (span.getAttribute('data-lt-tr') || '').trim();
    if (!cur) return null;
    if (cur === tr || cur === orig) return null;
    if (!/[\uac00-\ud7af]/.test(cur)) return null;
    const textNode = document.createTextNode(span.textContent);
    if (span.parentNode) span.parentNode.replaceChild(textNode, span);
    return textNode;
  }

  function processMutations() {
    rafPending = false;
    if (!isEnabled || !siteAllowed) return;
    const mutations = mutationQueue;
    mutationQueue = [];
    const elementsToProcess = new Set();
    const charDataNodes = [];
    const seenText = new Set();
    const staleUnwrap = [];

    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const node = mutation.target;
        if (!node || !node.parentElement) continue;
        const pe = node.parentElement;
        if (pe.classList.contains('lt-term')) {
          const unwrapped = unwrapStaleTerm(pe);
          if (unwrapped && !seenText.has(unwrapped)) {
            seenText.add(unwrapped);
            staleUnwrap.push(unwrapped);
          }
          continue;
        }
        if (pe.closest && pe.closest('.lt-term')) {
          const span = pe.closest('.lt-term');
          const unwrapped = unwrapStaleTerm(span);
          if (unwrapped && !seenText.has(unwrapped)) {
            seenText.add(unwrapped);
            staleUnwrap.push(unwrapped);
          }
          continue;
        }
        if (!seenText.has(node)) {
          seenText.add(node);
          charDataNodes.push(node);
        }
      } else if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.parentElement && node.parentElement.classList.contains('lt-term')) {
              const unwrapped = unwrapStaleTerm(node.parentElement);
              if (unwrapped && !seenText.has(unwrapped)) {
                seenText.add(unwrapped);
                staleUnwrap.push(unwrapped);
              }
              continue;
            }
            if (!seenText.has(node)) {
              seenText.add(node);
              charDataNodes.push(node);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList && node.classList.contains('lt-term')) {
              const unwrapped = unwrapStaleTerm(node);
              if (unwrapped && !seenText.has(unwrapped)) {
                seenText.add(unwrapped);
                staleUnwrap.push(unwrapped);
              }
              continue;
            }
            elementsToProcess.add(node);
          }
        }
        if (mutation.target && mutation.target.nodeType === Node.ELEMENT_NODE) {
          const t = mutation.target;
          if (t.classList && t.classList.contains('lt-term')) {
            const unwrapped = unwrapStaleTerm(t);
            if (unwrapped && !seenText.has(unwrapped)) {
              seenText.add(unwrapped);
              staleUnwrap.push(unwrapped);
            }
          } else {
            elementsToProcess.add(t);
            t.querySelectorAll && t.querySelectorAll('span.lt-term').forEach((span) => {
              const unwrapped = unwrapStaleTerm(span);
              if (unwrapped && !seenText.has(unwrapped)) {
                seenText.add(unwrapped);
                staleUnwrap.push(unwrapped);
              }
            });
          }
        }
      }
    }

    for (const node of staleUnwrap) {
      if (node.isConnected) translateNode(node, true);
    }
    for (const node of charDataNodes) {
      if (node.isConnected) translateNode(node, true);
    }
    for (const el of elementsToProcess) {
      if (el.isConnected) translateElementTree(el);
    }
    if (charDataNodes.length || elementsToProcess.size) {
      try {
        document.body.querySelectorAll('span.lt-term').forEach(ensureSpaceAroundTerm);
      } catch (_) {}
      reportStats();
    }
  }

  function startObserver() {
    if (observer) observer.disconnect();
    const target = document.documentElement || document.body;
    if (!target) return;
    observer = new MutationObserver((mutations) => {
      if (!isEnabled || !siteAllowed) return;
      let relevant = false;
      for (const m of mutations) {
        if (m.type === 'characterData') {
          relevant = true;
          break;
        }
        if (m.type === 'childList' && m.addedNodes.length) {
          relevant = true;
          break;
        }
      }
      if (!relevant) return;
      mutationQueue.push(...mutations);
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(processMutations);
      }
    });
    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: false,
      attributes: false
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  const LT_ACCENT = '#f0a020';
  let pickerEl = null;
  let pickerPanel = null;
  let pickerActive = false;
  let pickerFontScale = 100;
  let pickerMinWidth = 0;
  let pickerMinHeight = 0;
  let pickerOrigStyle = null;
  let pickerHoverEl = null;

  function cssPath(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id && /^[a-zA-Z][\w-]*$/.test(el.id) && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) {
      return '#' + CSS.escape(el.id);
    }
    const parts = [];
    let cur = el;
    let depth = 0;
    while (cur && cur.nodeType === 1 && depth < 8 && cur !== document.body && cur !== document.documentElement) {
      let part = cur.tagName.toLowerCase();
      if (cur.id && /^[a-zA-Z][\w-]*$/.test(cur.id)) {
        parts.unshift('#' + CSS.escape(cur.id));
        break;
      }
      const cls = Array.from(cur.classList || []).filter(c => {
        if (!c || c.startsWith('lt-') || /^[0-9]/.test(c)) return false;
        if (c.length > 40) return false;
        return true;
      }).slice(0, 3);
      if (cls.length) part += cls.map(c => '.' + CSS.escape(c)).join('');
      const parent = cur.parentElement;
      if (parent) {
        const same = Array.from(parent.children).filter(ch => {
          if (ch.tagName !== cur.tagName) return false;
          if (!cls.length) return true;
          return cls.every(c => ch.classList && ch.classList.contains(c));
        });
        if (same.length > 1) {
          const idx = same.indexOf(cur) + 1;
          part += ':nth-of-type(' + idx + ')';
        }
      }
      parts.unshift(part);
      cur = parent;
      depth++;
    }
    return parts.join(' > ');
  }

  function setImp(el, prop, value) {
    if (!el) return;
    if (value === '' || value == null) el.style.removeProperty(prop);
    else el.style.setProperty(prop, value, 'important');
  }

  function clearPickerHighlight() {
    if (pickerHoverEl && pickerHoverEl !== pickerEl) {
      pickerHoverEl.style.removeProperty('outline');
      pickerHoverEl.style.removeProperty('outline-offset');
      pickerHoverEl = null;
    }
    if (pickerEl) {
      if (pickerOrigStyle) {
        try {
          pickerEl.setAttribute('style', pickerOrigStyle);
        } catch (_) {
          pickerEl.removeAttribute('style');
        }
        pickerOrigStyle = null;
      } else {
        pickerEl.style.removeProperty('outline');
        pickerEl.style.removeProperty('outline-offset');
      }
      pickerEl = null;
    }
  }

  function highlightPickerEl(el) {
    if (pickerEl && pickerEl !== el) {
      if (pickerOrigStyle != null) {
        try { pickerEl.setAttribute('style', pickerOrigStyle); } catch (_) { pickerEl.removeAttribute('style'); }
      } else {
        pickerEl.style.removeProperty('outline');
        pickerEl.style.removeProperty('outline-offset');
        pickerEl.style.removeProperty('font-size');
        pickerEl.style.removeProperty('min-width');
        pickerEl.style.removeProperty('width');
        pickerEl.style.removeProperty('max-width');
        pickerEl.style.removeProperty('min-height');
        pickerEl.style.removeProperty('height');
        pickerEl.style.removeProperty('max-height');
        pickerEl.style.removeProperty('white-space');
        pickerEl.style.removeProperty('overflow');
        pickerEl.style.removeProperty('text-overflow');
        pickerEl.style.removeProperty('flex-shrink');
      }
      pickerOrigStyle = null;
    }
    if (!el || el === document.body || el === document.documentElement) return;
    pickerEl = el;
    pickerOrigStyle = el.getAttribute('style') || '';
    setImp(pickerEl, 'outline', '2px solid ' + LT_ACCENT);
    setImp(pickerEl, 'outline-offset', '2px');
  }

  function removePickerPanel() {
    if (pickerPanel && pickerPanel.parentNode) pickerPanel.parentNode.removeChild(pickerPanel);
    pickerPanel = null;
    pickerActive = false;
    document.documentElement.classList.remove('lt-picker-mode');
    clearPickerHighlight();
  }

  function applyPickerPreview() {
    if (!pickerEl) return;
    setImp(pickerEl, 'outline', '2px solid ' + LT_ACCENT);
    setImp(pickerEl, 'outline-offset', '2px');
    if (pickerFontScale !== 100) {
      setImp(pickerEl, 'font-size', (pickerFontScale / 100) + 'em');
    } else {
      pickerEl.style.removeProperty('font-size');
    }
    setImp(pickerEl, 'white-space', 'normal');
    setImp(pickerEl, 'overflow', 'visible');
    setImp(pickerEl, 'text-overflow', 'unset');
    setImp(pickerEl, 'flex-shrink', '0');
    if (pickerMinWidth > 0) {
      setImp(pickerEl, 'min-width', pickerMinWidth + 'px');
      setImp(pickerEl, 'width', 'auto');
      setImp(pickerEl, 'max-width', 'none');
    } else {
      pickerEl.style.removeProperty('min-width');
      pickerEl.style.removeProperty('width');
      pickerEl.style.removeProperty('max-width');
    }
    if (pickerMinHeight > 0) {
      setImp(pickerEl, 'min-height', pickerMinHeight + 'px');
      setImp(pickerEl, 'height', 'auto');
      setImp(pickerEl, 'max-height', 'none');
    } else {
      pickerEl.style.removeProperty('min-height');
      pickerEl.style.removeProperty('height');
      pickerEl.style.removeProperty('max-height');
    }
  }

  function buildRuleCss() {
    const rules = [];
    if (pickerFontScale !== 100) rules.push('font-size: ' + (pickerFontScale / 100) + 'em !important');
    rules.push('white-space: normal !important');
    rules.push('overflow: visible !important');
    rules.push('text-overflow: unset !important');
    rules.push('flex-shrink: 0 !important');
    if (pickerMinWidth > 0) {
      rules.push('min-width: ' + pickerMinWidth + 'px !important');
      rules.push('width: auto !important');
      rules.push('max-width: none !important');
    }
    if (pickerMinHeight > 0) {
      rules.push('min-height: ' + pickerMinHeight + 'px !important');
      rules.push('height: auto !important');
      rules.push('max-height: none !important');
    }
    return rules;
  }

  function savePickerRule() {
    if (!pickerEl) return;
    const sel = cssPath(pickerEl);
    if (!sel) return;
    const rules = buildRuleCss();
    if (!rules.length) return;
    const cssLine = sel + ' { ' + rules.join('; ') + '; }';
    const host = location.hostname.replace(/^www\./, '');
    chrome.storage.local.get(['fitText'], (local) => {
      const f = local.fitText && typeof local.fitText === 'object' ? Object.assign({}, local.fitText) : {
        enabled: true, termScale: 100, allowWrap: true, expandParents: true, siteCss: ''
      };
      let siteCss = f.siteCss || '';
      const header = '# ' + host;
      const blockRe = new RegExp('(^|\\n)#\\s*' + host.replace(/\./g, '\\.') + '\\s*(\\n|$)', 'i');
      if (!blockRe.test(siteCss)) {
        siteCss = (siteCss ? siteCss.trim() + '\n\n' : '') + header + '\n' + cssLine;
      } else {
        const lines = siteCss.split('\n');
        const out = [];
        let inBlock = false;
        let inserted = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const m = line.match(/^\s*#\s*([a-z0-9.-]+)\s*$/i);
          if (m) {
            if (inBlock && !inserted) { out.push(cssLine); inserted = true; }
            const d = m[1].toLowerCase();
            inBlock = d === host.toLowerCase() || host.toLowerCase().endsWith('.' + d);
            out.push(line);
            continue;
          }
          if (inBlock) {
            const trimmed = line.trim();
            if (trimmed && trimmed.includes('{') && trimmed.indexOf(sel) === 0) continue;
          }
          out.push(line);
        }
        if (inBlock && !inserted) out.push(cssLine);
        siteCss = out.join('\n');
      }
      f.enabled = true;
      f.siteCss = siteCss;
      pickerOrigStyle = null;
      chrome.storage.local.set({ fitText: f }, () => {
        applyFitSettings(f);
        removePickerPanel();
      });
    });
  }

  function syncPanelLabels(panel) {
    const selLabel = panel.querySelector('#lt-fit-sel');
    if (selLabel && pickerEl) selLabel.textContent = cssPath(pickerEl);
    const fontR = panel.querySelector('#lt-fit-font');
    const widthR = panel.querySelector('#lt-fit-width');
    const heightR = panel.querySelector('#lt-fit-height');
    if (fontR) fontR.value = String(pickerFontScale);
    const fs = panel.querySelector('#lt-fit-fs');
    if (fs) fs.textContent = pickerFontScale + '%';
    if (widthR) widthR.value = String(pickerMinWidth);
    const mw = panel.querySelector('#lt-fit-mw');
    if (mw) mw.textContent = String(pickerMinWidth);
    if (heightR) heightR.value = String(pickerMinHeight);
    const mh = panel.querySelector('#lt-fit-mh');
    if (mh) mh.textContent = String(pickerMinHeight);
  }

  function buildPickerPanel(x, y) {
    if (pickerPanel && pickerPanel.parentNode) pickerPanel.parentNode.removeChild(pickerPanel);
    pickerActive = true;
    document.documentElement.classList.add('lt-picker-mode');
    const rect = pickerEl ? pickerEl.getBoundingClientRect() : { width: 0, height: 0 };
    pickerFontScale = 100;
    pickerMinWidth = Math.max(0, Math.round(rect.width || 0));
    pickerMinHeight = Math.max(0, Math.round(rect.height || 0));
    const panel = document.createElement('div');
    panel.id = 'lt-fit-picker';
    panel.setAttribute('translate', 'no');
    Object.assign(panel.style, {
      position: 'fixed',
      zIndex: '2147483646',
      left: Math.max(8, Math.min(x, window.innerWidth - 280)) + 'px',
      top: Math.max(8, Math.min(y, window.innerHeight - 320)) + 'px',
      width: '268px',
      background: '#161a1e',
      color: '#c2c9d1',
      border: '1px solid ' + LT_ACCENT,
      borderRadius: '8px',
      padding: '10px',
      fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
      fontSize: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      pointerEvents: 'auto'
    });
    const btnCss = 'flex:1;background:#222830;border:1px solid #262c33;color:#fff;border-radius:4px;padding:5px 6px;cursor:pointer;font-size:11px;';
    panel.innerHTML =
      '<div style="color:' + LT_ACCENT + ';font-weight:700;margin-bottom:8px;">LA Translator — блок</div>' +
      '<div style="margin-bottom:6px;opacity:0.85;word-break:break-all;font-size:10px;line-height:1.3;" id="lt-fit-sel"></div>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">' +
      '<button data-nav="parent" type="button" style="' + btnCss + '">Родитель</button>' +
      '<button data-nav="child" type="button" style="' + btnCss + '">Дочерний</button>' +
      '<button data-nav="prev" type="button" style="' + btnCss + '">←</button>' +
      '<button data-nav="next" type="button" style="' + btnCss + '">→</button>' +
      '</div>' +
      '<div style="margin-bottom:4px;">Шрифт <span id="lt-fit-fs">100%</span></div>' +
      '<input id="lt-fit-font" type="range" min="50" max="150" value="100" style="width:100%;accent-color:' + LT_ACCENT + ';">' +
      '<div style="margin:8px 0 4px;">Ширина (min) <span id="lt-fit-mw">0</span>px</div>' +
      '<input id="lt-fit-width" type="range" min="0" max="900" value="0" style="width:100%;accent-color:' + LT_ACCENT + ';">' +
      '<div style="margin:8px 0 4px;">Высота (min) <span id="lt-fit-mh">0</span>px</div>' +
      '<input id="lt-fit-height" type="range" min="0" max="600" value="0" style="width:100%;accent-color:' + LT_ACCENT + ';">' +
      '<div style="display:flex;gap:6px;margin-top:10px;">' +
      '<button data-act="save" type="button" style="flex:1;background:' + LT_ACCENT + ';border:none;color:#111;font-weight:700;border-radius:4px;padding:7px;cursor:pointer;">Сохранить</button>' +
      '<button data-act="close" type="button" style="flex:1;background:#222830;border:1px solid #262c33;color:#fff;border-radius:4px;padding:7px;cursor:pointer;">Закрыть</button>' +
      '</div>' +
      '<div style="margin-top:8px;opacity:0.65;font-size:10px;line-height:1.35;">Ctrl + ПКМ — выбрать блок<br>Превью сразу · Esc — выход</div>';
    document.documentElement.appendChild(panel);
    pickerPanel = panel;
    syncPanelLabels(panel);
    applyPickerPreview();

    const fontR = panel.querySelector('#lt-fit-font');
    const widthR = panel.querySelector('#lt-fit-width');
    const heightR = panel.querySelector('#lt-fit-height');
    fontR.addEventListener('input', () => {
      pickerFontScale = parseInt(fontR.value, 10) || 100;
      syncPanelLabels(panel);
      applyPickerPreview();
    });
    widthR.addEventListener('input', () => {
      pickerMinWidth = parseInt(widthR.value, 10) || 0;
      syncPanelLabels(panel);
      applyPickerPreview();
    });
    heightR.addEventListener('input', () => {
      pickerMinHeight = parseInt(heightR.value, 10) || 0;
      syncPanelLabels(panel);
      applyPickerPreview();
    });

    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const nav = btn.getAttribute('data-nav');
      const act = btn.getAttribute('data-act');
      if (nav && pickerEl) {
        let next = null;
        if (nav === 'parent') next = pickerEl.parentElement;
        else if (nav === 'child') next = pickerEl.firstElementChild;
        else if (nav === 'prev') next = pickerEl.previousElementSibling;
        else if (nav === 'next') next = pickerEl.nextElementSibling;
        if (next && next !== document.body && next !== document.documentElement && next.id !== 'lt-fit-picker') {
          highlightPickerEl(next);
          const r = next.getBoundingClientRect();
          pickerFontScale = 100;
          pickerMinWidth = Math.max(0, Math.round(r.width || 0));
          pickerMinHeight = Math.max(0, Math.round(r.height || 0));
          syncPanelLabels(panel);
          applyPickerPreview();
        }
      }
      if (act === 'save') savePickerRule();
      if (act === 'close') removePickerPanel();
    });
    panel.addEventListener('mousedown', (e) => e.stopPropagation());
    panel.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });
  }

  function openPickerAt(el, x, y) {
    if (!el || el.id === 'lt-fit-picker' || (el.closest && el.closest('#lt-fit-picker'))) return;
    if (el.nodeType === 3) el = el.parentElement;
    if (!el || el === document.body || el === document.documentElement) return;
    highlightPickerEl(el);
    buildPickerPanel(x, y);
  }

  function initBlockPicker() {
    if (window !== window.top) return;
    if (document.documentElement.dataset.ltPickerInit === '1') return;
    document.documentElement.dataset.ltPickerInit = '1';

    document.addEventListener('contextmenu', (e) => {
      if (!(e.ctrlKey || e.metaKey || e.altKey)) return;
      e.preventDefault();
      e.stopPropagation();
      openPickerAt(e.target, e.clientX, e.clientY);
    }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pickerActive) {
        e.preventDefault();
        removePickerPanel();
      }
      if (e.key === 'Escape' && quickEditPanel) {
        e.preventDefault();
        closeQuickEdit();
      }
    }, true);
  }

  let quickEditPanel = null;

  function closeQuickEdit() {
    if (quickEditPanel && quickEditPanel.parentNode) quickEditPanel.parentNode.removeChild(quickEditPanel);
    quickEditPanel = null;
  }

  function getSelectionContext() {
    const sel = window.getSelection && window.getSelection();
    if (!sel || sel.rangeCount === 0) return { text: '', context: '', node: null };
    const text = String(sel.toString() || '').trim();
    let context = '';
    let node = null;
    try {
      const range = sel.getRangeAt(0);
      node = range.commonAncestorContainer;
      if (node && node.nodeType === 3) node = node.parentElement;
      if (node) {
        const block = node.closest ? (node.closest('p,li,td,th,div,span,button,a,h1,h2,h3,h4') || node) : node;
        context = String(block.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      }
    } catch (_) {}
    return { text, context, node };
  }

  function lookupVariants(text) {
    if (!text) return [];
    const v = dictionary.get(String(text).toLowerCase());
    if (!v) return [];
    if (typeof v === 'string') return [{ value: v }];
    return Array.isArray(v) ? v.slice() : [];
  }

  function detectSourceLang(text) {
    if (/[\uac00-\ud7af]/.test(text)) return 'kr';
    if (/[а-яёА-ЯЁ]/.test(text)) return 'ru';
    return 'en';
  }

  function openQuickEditFromSelection() {
    if (window !== window.top) return;
    const { text, context } = getSelectionContext();
    if (!text || text.length > 80) return;
    openQuickEditPanel(text, context);
  }

  function openQuickEditPanel(sourceText, contextText) {
    closeQuickEdit();
    const variants = lookupVariants(sourceText);
    const known = variants.length > 0;
    const srcLang = detectSourceLang(sourceText);
    let existingRu = '';
    let existingEn = '';
    let existingKr = '';
    let existingParent = '';
    let existingPriority = 22;
    if (known) {
      const primary = variants[0];
      const val = primary.value || '';
      if (srcLang === 'kr') { existingKr = sourceText; existingRu = val; }
      else if (srcLang === 'ru') { existingRu = sourceText; existingEn = val; }
      else { existingEn = sourceText; existingRu = val; }
      if (primary.parent) existingParent = String(primary.parent);
      if (primary.priority != null) existingPriority = primary.priority;
    } else {
      if (srcLang === 'kr') existingKr = sourceText;
      else if (srcLang === 'ru') existingRu = sourceText;
      else existingEn = sourceText;
    }

    const panel = document.createElement('div');
    panel.id = 'lt-quick-edit';
    panel.setAttribute('translate', 'no');
    Object.assign(panel.style, {
      position: 'fixed',
      zIndex: '2147483647',
      left: '12px',
      top: '12px',
      width: '340px',
      maxHeight: 'calc(100vh - 24px)',
      overflowY: 'auto',
      background: '#161a1e',
      color: '#c2c9d1',
      border: '1px solid ' + LT_ACCENT,
      borderRadius: '10px',
      padding: '12px',
      fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
      fontSize: '12px',
      boxShadow: '0 10px 28px rgba(0,0,0,0.5)'
    });
    const inputCss = 'width:100%;box-sizing:border-box;background:#0b0d0f;border:1px solid #262c33;color:#fff;border-radius:4px;padding:6px 8px;margin-top:3px;font-size:12px;';
    const labelCss = 'display:block;margin-top:8px;font-weight:600;opacity:0.9;';
    panel.innerHTML =
      '<div style="color:' + LT_ACCENT + ';font-weight:700;font-size:13px;margin-bottom:4px;">LA Translator</div>' +
      '<div style="opacity:0.7;font-size:11px;margin-bottom:8px;">' + (known ? 'Слово уже в словаре — правка' : 'Новое слово') + '</div>' +
      '<label style="' + labelCss + '">EN</label>' +
      '<input id="lt-qe-en" type="text" style="' + inputCss + '" value="">' +
      '<label style="' + labelCss + '">RU</label>' +
      '<input id="lt-qe-ru" type="text" style="' + inputCss + '" value="">' +
      '<label style="' + labelCss + '">KR</label>' +
      '<input id="lt-qe-kr" type="text" style="' + inputCss + '" value="">' +
      '<label style="' + labelCss + '">Тип</label>' +
      '<select id="lt-qe-type" style="' + inputCss + '">' +
      '<option value="term">Термин / интерфейс</option>' +
      '<option value="engraving">Гравировка</option>' +
      '<option value="skill">Умение</option>' +
      '<option value="class">Класс</option>' +
      '<option value="build">Сборка</option>' +
      '</select>' +
      '<label style="display:flex;align-items:center;gap:8px;margin-top:10px;cursor:pointer;">' +
      '<input id="lt-qe-local" type="checkbox" style="accent-color:' + LT_ACCENT + ';">' +
      '<span>Учитывать контекст</span></label>' +
      '<div id="lt-qe-ctx-fields" style="display:none;">' +
      '<label style="' + labelCss + '">Parent (фрагмент рядом)</label>' +
      '<input id="lt-qe-parent" type="text" style="' + inputCss + '" placeholder="слово/фраза из surrounding">' +
      '<label style="' + labelCss + '">Priority</label>' +
      '<input id="lt-qe-prio" type="number" min="0" max="50" style="' + inputCss + '" value="28">' +
      '</div>' +
      '<div style="margin-top:6px;opacity:0.55;font-size:10px;line-height:1.35;word-break:break-word;" id="lt-qe-ctx"></div>' +
      '<div style="display:flex;gap:6px;margin-top:12px;">' +
      '<button id="lt-qe-save" type="button" style="flex:1;background:' + LT_ACCENT + ';border:none;color:#111;font-weight:700;border-radius:4px;padding:8px;cursor:pointer;">Сохранить</button>' +
      '<button id="lt-qe-close" type="button" style="flex:1;background:#222830;border:1px solid #262c33;color:#fff;border-radius:4px;padding:8px;cursor:pointer;">Отмена</button>' +
      '</div>' +
      '<div style="margin-top:8px;opacity:0.5;font-size:10px;">Достаточно 2 из 3 языков · Alt+A · Esc</div>';
    document.documentElement.appendChild(panel);
    quickEditPanel = panel;
    panel.querySelector('#lt-qe-en').value = existingEn;
    panel.querySelector('#lt-qe-ru').value = existingRu;
    panel.querySelector('#lt-qe-kr').value = existingKr;
    if (!existingEn && srcLang === 'en') panel.querySelector('#lt-qe-en').value = sourceText;
    if (!existingKr && srcLang === 'kr') panel.querySelector('#lt-qe-kr').value = sourceText;
    if (!existingRu && srcLang === 'ru') panel.querySelector('#lt-qe-ru').value = sourceText;
    if (existingParent) {
      panel.querySelector('#lt-qe-local').checked = true;
      panel.querySelector('#lt-qe-ctx-fields').style.display = 'block';
      panel.querySelector('#lt-qe-parent').value = existingParent;
      panel.querySelector('#lt-qe-prio').value = String(existingPriority || 28);
    }
    const ctxEl = panel.querySelector('#lt-qe-ctx');
    if (ctxEl) ctxEl.textContent = contextText ? ('Surrounding: ' + contextText) : '';

    panel.querySelector('#lt-qe-local').addEventListener('change', (e) => {
      panel.querySelector('#lt-qe-ctx-fields').style.display = e.target.checked ? 'block' : 'none';
      if (e.target.checked && !panel.querySelector('#lt-qe-parent').value && contextText) {
        panel.querySelector('#lt-qe-parent').value = contextText.slice(0, 80);
      }
    });
    panel.querySelector('#lt-qe-close').addEventListener('click', closeQuickEdit);
    panel.querySelector('#lt-qe-save').addEventListener('click', () => {
      let en = panel.querySelector('#lt-qe-en').value.trim();
      const ru = panel.querySelector('#lt-qe-ru').value.trim();
      const kr = panel.querySelector('#lt-qe-kr').value.trim();
      const type = panel.querySelector('#lt-qe-type').value || 'term';
      const onlyHere = panel.querySelector('#lt-qe-local').checked;
      const filled = [en, ru, kr].filter(Boolean).length;
      if (filled < 2) {
        ctxEl.textContent = 'Нужно заполнить минимум 2 языка';
        ctxEl.style.opacity = '1';
        ctxEl.style.color = '#f66';
        return;
      }
      if (!en) en = kr || ru || sourceText;
      const data = { en, ru, kr };
      if (onlyHere) {
        const parent = (panel.querySelector('#lt-qe-parent').value || '').trim() || (contextText || '').slice(0, 80);
        const prio = parseInt(panel.querySelector('#lt-qe-prio').value, 10);
        data.tags = ['context'];
        if (parent) data.parent = parent;
        data.priority = Number.isFinite(prio) ? prio : 28;
      } else {
        data.tags = type === 'term' ? ['interface', 'term'] : [type];
      }
      const msg = { action: 'addEntry', type: type === 'build' ? 'orphan' : type, data };
      chrome.runtime.sendMessage(msg, (res) => {
        if (res && res.success) {
          closeQuickEdit();
          if (isEnabled && siteAllowed) {
            setTimeout(() => {
              restoreDocument();
              translateDocument();
            }, 200);
          }
        } else {
          const err = (res && res.error) ? res.error : 'error';
          ctxEl.textContent = 'Ошибка: ' + err;
          ctxEl.style.opacity = '1';
          ctxEl.style.color = '#f66';
        }
      });
    });
    panel.addEventListener('mousedown', (e) => e.stopPropagation());
    setTimeout(() => {
      const focusId = !existingRu ? '#lt-qe-ru' : (!existingKr ? '#lt-qe-kr' : '#lt-qe-en');
      const f = panel.querySelector(focusId);
      if (f) f.focus();
    }, 50);
  }

  function initQuickEdit() {
    if (window !== window.top) return;
    if (document.documentElement.dataset.ltQuickEdit === '1') return;
    document.documentElement.dataset.ltQuickEdit = '1';
    document.addEventListener('keydown', (e) => {
      if (!(e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA'))) return;
      const { text } = getSelectionContext();
      if (!text) return;
      e.preventDefault();
      e.stopPropagation();
      openQuickEditFromSelection();
    }, true);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateDictionary') {
      updateDictionaryData(request.dictionary || {});
      if (isEnabled && siteAllowed) {
        restoreDocument();
        translateDocument();
      }
      sendResponse({ success: true });
    } else if (request.action === 'toggle') {
      isEnabled = request.enabled;
      if (isEnabled) {
        if (siteAllowed) {
          translateDocument();
          startObserver();
        }
      } else {
        stopObserver();
        restoreDocument();
      }
      sendResponse({ success: true });
    } else if (request.action === 'getStats') {
      sendResponse({ success: true, count: translatedCount });
    } else if (request.action === 'updatePatterns') {
      loadCustomPatterns(request.patterns || []);
      if (isEnabled && siteAllowed) {
        restoreDocument();
        translateDocument();
      }
      sendResponse({ success: true });
    } else if (request.action === 'applyFitText') {
      applyFitSettings(request.fitText);
      sendResponse({ success: true });
    } else if (request.action === 'quickEditSelection') {
      openQuickEditFromSelection();
      sendResponse({ success: true });
    } else if (request.action === 'getSiteInfo') {
      sendResponse({
        success: true,
        host: hostKey(),
        termMode: termMode,
        enabled: isEnabled && siteAllowed
      });
    }
    return true;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.fitText) {
      applyFitSettings(changes.fitText.newValue);
    }
    if (area === 'local' && changes.siteProfiles) {
      chrome.storage.sync.get([
        'isEnabled','siteMode','allowedSites','blockedSites','developerSites',
        'termMode','termModeReplaceSites','termModeAnnotateSites','termModeBracketsSites'
      ], (r) => {
        const merged = Object.assign({}, r, { siteProfiles: changes.siteProfiles.newValue || {} });
        isEnabled = merged.isEnabled !== false;
        termMode = resolveTermMode(merged);
        checkSiteAllowed(merged);
        if (isEnabled && siteAllowed) {
          restoreDocument();
          translateDocument();
          startObserver();
        } else {
          restoreDocument();
        }
      });
    }
    if (area === 'sync' && (changes.termMode || changes.termModeReplaceSites ||
        changes.termModeAnnotateSites || changes.termModeBracketsSites ||
        changes.siteMode || changes.allowedSites || changes.blockedSites || changes.developerSites ||
        changes.isEnabled)) {
      chrome.storage.local.get(['siteProfiles'], (loc) => {
        chrome.storage.sync.get([
          'isEnabled','siteMode','allowedSites','blockedSites','developerSites',
          'termMode','termModeReplaceSites','termModeAnnotateSites','termModeBracketsSites'
        ], (r) => {
          const merged = Object.assign({}, r, { siteProfiles: loc.siteProfiles || {} });
          isEnabled = merged.isEnabled !== false;
          termMode = resolveTermMode(merged);
          checkSiteAllowed(merged);
          if (isEnabled && siteAllowed) {
            restoreDocument();
            translateDocument();
            startObserver();
          } else {
            restoreDocument();
          }
        });
      });
    }
    if (area === 'local') {
      if (changes.dictionary) {
        updateDictionaryData(changes.dictionary.newValue || {});
        if (isEnabled && siteAllowed) {
          restoreDocument();
          translateDocument();
        }
      }
      if (changes.customPatterns) {
        loadCustomPatterns(changes.customPatterns.newValue || []);
        if (isEnabled && siteAllowed) {
          restoreDocument();
          translateDocument();
        }
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
