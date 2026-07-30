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

  function injectStyles() {
    if (document.getElementById('lt-translator-style')) return;
    const style = document.createElement('style');
    style.id = 'lt-translator-style';
    style.textContent = '.lt-term + .lt-term { margin-inline-start: 0.3em; }';
    (document.head || document.documentElement).appendChild(style);
  }

  function init() {
    injectStyles();
    chrome.storage.local.get(['dictionary', 'customPatterns'], (localResult) => {
      updateDictionaryData(localResult.dictionary || {});
      loadCustomPatterns(localResult.customPatterns || []);
      chrome.storage.sync.get([
        'isEnabled','siteMode','allowedSites','blockedSites','termMode',
        'termModeReplaceSites','termModeAnnotateSites','termModeBracketsSites'
      ], (syncResult) => {
        isEnabled = syncResult.isEnabled !== false;
        termMode = resolveTermMode(syncResult);
        checkSiteAllowed(syncResult);
        if (isEnabled && siteAllowed) {
          translateDocument();
          startObserver();
        }
      });
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

  const DEV_SITES = [
    'lostark.bible',
    'maxroll.gg',
    'loawa.com',
    'reddit.com',
    'www.reddit.com'
  ];

  function checkSiteAllowed(result) {
    const mode = result.siteMode || 'everywhere';
    const hostname = location.hostname;
    if (mode === 'everywhere') {
      siteAllowed = true;
    } else if (mode === 'allowlist') {
      const list = (result.allowedSites || '').split('\n').map(s => s.trim()).filter(Boolean);
      siteAllowed = list.some(d => hostname === d || hostname.endsWith('.' + d));
    } else if (mode === 'blocklist') {
      const list = (result.blockedSites || '').split('\n').map(s => s.trim()).filter(Boolean);
      siteAllowed = !list.some(d => hostname === d || hostname.endsWith('.' + d));
    } else if (mode === 'developer') {
      siteAllowed = DEV_SITES.some(d => hostname === d || hostname.endsWith('.' + d));
    } else {
      siteAllowed = true;
    }
  }

  function domainInList(hostname, raw) {
    const list = (raw || '').split('\n').map(s => s.trim()).filter(Boolean);
    return list.some(d => hostname === d || hostname.endsWith('.' + d));
  }

  function resolveTermMode(result) {
    const hostname = location.hostname;
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
    if (variant.parent && text.includes(String(variant.parent).toLowerCase())) return true;
    if (variant.tags && variant.tags.length) {
      return variant.tags.some(tag => {
        const t = String(tag).toLowerCase();
        if (t === 'skill' || t === 'class_build' || t === 'engraving' || t === 'skill_class') return false;
        if (t === 'arkpass' || t === 'classcore' || t === 'class') return false;
        return t.length > 1 && text.includes(t);
      });
    }
    return false;
  }

  function isBuildVariant(v) {
    const tags = v.tags || [];
    if (tags.includes('class_build') || tags.includes('engraving')) return true;
    return (v.priority || 0) >= 25;
  }

  function isSkillVariant(v) {
    const tags = v.tags || [];
    return tags.includes('skill') || tags.includes('arkpass') || tags.includes('classcore') || tags.includes('tripod');
  }

  function hasSkillLevelContext(surrounding) {
    if (!surrounding) return false;
    const t = String(surrounding);
    if (/(?:^|[^\d])(?:lv\.?\s*|lvl\.?\s*|level\s*|레벨\s*)?10(?=[^\d]|$)/i.test(t)) return true;
    if (/(?:^|[\s\[\(·:|/+])10(?=[\s\]\)·:|.,/+]|$)/.test(t)) return true;
    return false;
  }

  function hasSkillUiContext(node) {
    if (!node) return false;
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    let depth = 0;
    while (el && depth < 8) {
      if (el.getAttribute) {
        if (el.getAttribute('data-lostark-skill-code')) return true;
        if (el.getAttribute('data-skill-code') || el.getAttribute('data-skill-id')) return true;
        if (el.getAttribute('data-skill')) return true;
      }
      if (el.classList) {
        if (el.classList.contains('skill-icon')) return true;
        if (el.classList.contains('skill-name')) return true;
      }
      if (el.tagName === 'A') {
        const href = el.getAttribute('href') || '';
        if (/skill|code=\d+/i.test(href)) return true;
      }
      if (el.tagName === 'IMG') {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        if (/skill/i.test(src) || /스킬|skill/i.test(alt)) return true;
      }
      el = el.parentElement;
      depth++;
    }
    return false;
  }

  // Руны/гемы/предметы: иконки из /use/ (use_7_200 и т.п.)
  function hasRuneOrItemContext(node) {
    if (!node) return false;
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    let depth = 0;
    while (el && depth < 6) {
      if (el.tagName === 'IMG') {
        const src = el.getAttribute('src') || '';
        if (/\/use\//i.test(src) || /use_\d/i.test(src)) return true;
      }
      if (el.parentElement) {
        for (const sib of el.parentElement.children) {
          if (sib === el) continue;
          if (sib.tagName === 'IMG') {
            const src = sib.getAttribute('src') || '';
            if (/\/use\//i.test(src) || /use_\d/i.test(src)) return true;
          }
        }
      }
      el = el.parentElement;
      depth++;
    }
    return false;
  }

  function resolveTranslation(match, surrounding, node) {
    const variants = dictionary.get(match.toLowerCase());
    if (!variants || !variants.length) return match;
    if (typeof variants === 'string') return variants;

    for (const v of variants) {
      if (isBuildVariant(v) && matchesContext(v, surrounding)) return v.value;
    }
    for (const v of variants) {
      if (!isSkillVariant(v) && !isBuildVariant(v) && matchesContext(v, surrounding)) return v.value;
    }
    for (const v of variants) {
      if (isSkillVariant(v) && matchesContext(v, surrounding)) return v.value;
    }

    // Рядом с иконкой руны/гема/предмета (/use/) — приоритет у терминов (Focus → Марх)
    if (hasRuneOrItemContext(node)) {
      for (const v of variants) {
        if (!isSkillVariant(v) && !isBuildVariant(v)) return v.value;
      }
    }

    if (hasSkillLevelContext(surrounding) || hasSkillUiContext(node)) {
      for (const v of variants) {
        if (isSkillVariant(v)) return v.value;
      }
    }
    for (const v of variants) {
      if (isBuildVariant(v)) return v.value;
    }
    return variants[0].value;
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

  function doTranslatePlain(text, surrounding) {
    if (!text || !text.trim()) return null;
    let result = text;
    let matchCount = 0;
    if (compiledRegex) {
      compiledRegex.lastIndex = 0;
      if (compiledRegex.test(result)) {
        compiledRegex.lastIndex = 0;
        const replaced = result.replace(compiledRegex, (match) => {
          const v = resolveTranslation(match, surrounding || text, null);
          if (v !== match) matchCount++;
          return v;
        });
        result = replaced;
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

  function translateNode(node) {
    if (shouldSkipNode(node)) return;
    if (PROCESSED.has(node)) return;
    const text = node.textContent;
    if (!text || !text.trim()) return;
    const parent = node.parentNode;
    if (!parent) return;
    const surrounding = getSurroundingText(node);

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
      compiledRegex.lastIndex = 0;
      let m;
      while ((m = compiledRegex.exec(text)) !== null) {
        if (m.index > lastIndex) {
          parts.push({ type: 'text', value: text.slice(lastIndex, m.index) });
        }
        const original = m[0];
        const translated = resolveTranslation(original, surrounding || text, node);
        if (translated !== original) {
          parts.push({ type: 'term', value: translated, original: original });
          anyChanged = true;
          matchCount++;
        } else {
          parts.push({ type: 'text', value: original });
        }
        lastIndex = m.index + original.length;
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
    }
    translatedCount = 0;
    reportStats();
  }

  function reportStats() {
    try {
      chrome.runtime.sendMessage({ action: 'pageStats', count: translatedCount, url: location.href }).catch(() => {});
    } catch (_) {}
  }

  function processMutations() {
    rafPending = false;
    if (!isEnabled || !siteAllowed) return;
    const mutations = mutationQueue;
    mutationQueue = [];
    const elementsToProcess = new Set();
    const charDataNodes = [];
    const seenText = new Set();

    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const node = mutation.target;
        if (!node || !node.parentElement) continue;
        if (node.parentElement.classList.contains('lt-term')) continue;
        if (node.parentElement.closest && node.parentElement.closest('.lt-term')) continue;
        if (!seenText.has(node)) {
          seenText.add(node);
          charDataNodes.push(node);
        }
      } else if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.parentElement && node.parentElement.classList.contains('lt-term')) continue;
            if (!seenText.has(node)) {
              seenText.add(node);
              charDataNodes.push(node);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList && node.classList.contains('lt-term')) continue;
            elementsToProcess.add(node);
          }
        }
        if (mutation.target && mutation.target.nodeType === Node.ELEMENT_NODE) {
          const t = mutation.target;
          if (!(t.classList && t.classList.contains('lt-term'))) {
            elementsToProcess.add(t);
          }
        }
      }
    }

    for (const node of charDataNodes) {
      if (node.isConnected) translateNode(node);
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
    }
    return true;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.termMode || changes.termModeReplaceSites ||
        changes.termModeAnnotateSites || changes.termModeBracketsSites)) {
      chrome.storage.sync.get([
        'termMode','termModeReplaceSites','termModeAnnotateSites','termModeBracketsSites'
      ], (r) => {
        termMode = resolveTermMode(r || {});
        if (isEnabled && siteAllowed) {
          restoreDocument();
          translateDocument();
        }
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
