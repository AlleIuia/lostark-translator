(function() {
  'use strict';

  let dictionary = new Map();
  let customPatterns = [];
  let compiledRegex = null;
  let isEnabled = true;
  let siteAllowed = true;
  let observer = null;
  let translatedCount = 0;

  const SKIP_TAGS = new Set(['script','style','noscript','iframe','textarea','input','code','pre','head','meta','link']);
  const TRANSLATABLE_ATTRS = ['title','aria-label','placeholder','alt'];
  const PROCESSED = new WeakSet();

  let mutationQueue = [];
  let rafPending = false;

  function init() {
    chrome.storage.local.get(['dictionary', 'customPatterns'], (localResult) => {
      updateDictionaryData(localResult.dictionary || {});
      loadCustomPatterns(localResult.customPatterns || []);
      chrome.storage.sync.get(['isEnabled','siteMode','allowedSites','blockedSites'], (syncResult) => {
        isEnabled = syncResult.isEnabled !== false;
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
    }
  }

  function shouldSkipNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return true;
    const parent = node.parentElement;
    if (!parent) return true;
    return SKIP_TAGS.has(parent.tagName.toLowerCase());
  }

  function protectElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (!el.hasAttribute('translate')) el.setAttribute('translate', 'no');
    if (!el.classList.contains('notranslate')) el.classList.add('notranslate');
  }

  function matchesContext(variant, surrounding) {
    if (!surrounding) return false;
    const text = surrounding.toLowerCase();
    if (variant.parent && text.includes(variant.parent.toLowerCase())) return true;
    if (variant.tags && variant.tags.length) {
      return variant.tags.some(tag => text.includes(tag.toLowerCase()));
    }
    return false;
  }

  function resolveTranslation(match, surrounding) {
    const variants = dictionary.get(match.toLowerCase());
    if (!variants || !variants.length) return match;
    if (typeof variants === 'string') return variants;
    for (const v of variants) {
      if (matchesContext(v, surrounding)) return v.value;
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

  function doTranslate(text, surrounding) {
    if (!text || !text.trim()) return null;
    let result = text;
    let changed = false;

    if (compiledRegex) {
      compiledRegex.lastIndex = 0;
      if (compiledRegex.test(result)) {
        compiledRegex.lastIndex = 0;
        const replaced = result.replace(compiledRegex, (match) => {
          const v = resolveTranslation(match, surrounding || text);
          if (v !== match) changed = true;
          return v;
        });
        result = replaced;
      }
    }

    const custom = applyCustomPatterns(result);
    if (custom !== null) {
      result = custom;
      changed = true;
    }

    return changed ? result : null;
  }

  function getSurroundingText(node) {
    let text = '';
    let el = node.parentElement || node;
    let depth = 0;
    while (el && depth < 3) {
      text += ' ' + (el.textContent || '').slice(0, 500);
      el = el.parentElement;
      depth++;
    }
    return text;
  }

  function translateNode(node) {
    if (shouldSkipNode(node)) return;
    if (PROCESSED.has(node) && node.__origText !== undefined) return;
    const text = node.textContent;
    if (!text || !text.trim()) return;
    const surrounding = getSurroundingText(node);
    const result = doTranslate(text, surrounding);
    if (result === null || result === text) return;
    if (node.__origText === undefined) {
      node.__origText = text;
    }
    node.textContent = result;
    PROCESSED.add(node);
    translatedCount++;
    if (node.parentElement) protectElement(node.parentElement);
  }

  function translateAttributes(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(el.tagName.toLowerCase())) return;
    if (PROCESSED.has(el)) return;

    const surrounding = getSurroundingText(el) || el.textContent || '';
    let any = false;

    for (const attr of TRANSLATABLE_ATTRS) {
      const val = el.getAttribute(attr);
      if (!val || !val.trim()) continue;
      const result = doTranslate(val, surrounding);
      if (result === null || result === val) continue;
      const dataKey = 'origAttr_' + attr.replace(/-/g, '_');
      if (!el.dataset[dataKey]) {
        el.dataset[dataKey] = val;
      }
      el.setAttribute(attr, result);
      any = true;
      translatedCount++;
    }
    if (any) {
      protectElement(el);
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
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        translateNode(node);
      }
      if (root.shadowRoot) {
        const sw = document.createTreeWalker(root.shadowRoot, NodeFilter.SHOW_TEXT, null, false);
        while ((node = sw.nextNode())) {
          translateNode(node);
        }
        root.shadowRoot.querySelectorAll('*').forEach(translateAttributes);
      }
    }
  }

  function translateDocument() {
    if (!siteAllowed) return;
    translatedCount = 0;
    translateElementTree(document.body);
    reportStats();
  }

  function restoreDocument() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.__origText !== undefined) {
        node.textContent = node.__origText;
        delete node.__origText;
      }
    }
    const allEls = document.body.querySelectorAll('*');
    for (const el of allEls) {
      for (const attr of TRANSLATABLE_ATTRS) {
        const dataKey = 'origAttr_' + attr.replace(/-/g, '_');
        if (el.dataset[dataKey] !== undefined) {
          el.setAttribute(attr, el.dataset[dataKey]);
          delete el.dataset[dataKey];
        }
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
    let charDataNodes = [];

    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const node = mutation.target;
        if (node.__origText !== undefined) {
          delete node.__origText;
        }
        charDataNodes.push(node);
      } else if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            charDataNodes.push(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (!PROCESSED.has(node)) {
              elementsToProcess.add(node);
            }
          }
        }
      }
    }

    for (const node of charDataNodes) {
      translateNode(node);
    }
    for (const el of elementsToProcess) {
      translateElementTree(el);
    }
    if (charDataNodes.length || elementsToProcess.size) {
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
