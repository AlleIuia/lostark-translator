(function() {
  'use strict';

  let dictionary = {};
  let compiledRegex = null;
  let isEnabled = true;
  let siteAllowed = true;
  let observer = null;

  const SKIP_TAGS = new Set(['script','style','noscript','iframe','textarea','input','code','pre','head','meta','link']);
  const TRANSLATABLE_ATTRS = ['title','aria-label','placeholder','alt'];

  let mutationQueue = [];
  let rafPending = false;

  function init() {
    chrome.storage.local.get(['dictionary'], (localResult) => {
      updateDictionaryData(localResult.dictionary || {});
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

  function updateDictionaryData(newDict) {
    dictionary = newDict || {};
    const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
    if (keys.length === 0) {
      compiledRegex = null;
      return;
    }
    const escapedKeys = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
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

  function doTranslate(text) {
    if (!compiledRegex || !text || !text.trim()) return null;
    compiledRegex.lastIndex = 0;
    if (!compiledRegex.test(text)) return null;

    compiledRegex.lastIndex = 0;
    return text.replace(compiledRegex, (match) => {
      const key = Object.keys(dictionary).find(k => k.toLowerCase() === match.toLowerCase());
      return key ? dictionary[key] : match;
    });
  }

  function translateNode(node) {
    if (shouldSkipNode(node)) return;

    const text = node.textContent;
    const result = doTranslate(text);
    if (result === null || result === text) return;

    if (node.__origText === undefined) {
      node.__origText = text;
    }

    node.textContent = result;
    if (node.parentElement) protectElement(node.parentElement);
  }

  function translateAttributes(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(el.tagName.toLowerCase())) return;

    for (const attr of TRANSLATABLE_ATTRS) {
      const val = el.getAttribute(attr);
      if (!val || !val.trim()) continue;

      const result = doTranslate(val);
      if (result === null || result === val) continue;

      if (!el.dataset['origAttr_' + attr]) {
        el.dataset['origAttr_' + attr] = val;
      }

      el.setAttribute(attr, result);
      protectElement(el);
    }
  }

  function translateDocument() {
    if (!siteAllowed || !compiledRegex) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) translateNode(node);

    const allEls = document.body.querySelectorAll('*');
    for (const el of allEls) {
      translateAttributes(el);
      if (el.shadowRoot) {
        const sw = document.createTreeWalker(el.shadowRoot, NodeFilter.SHOW_TEXT, null, false);
        while (sw.nextNode()) translateNode(sw.currentNode);
        const shadowEls = el.shadowRoot.querySelectorAll('*');
        for (const sel of shadowEls) translateAttributes(sel);
      }
    }
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
        if (el.dataset['origAttr_' + attr] !== undefined) {
          el.setAttribute(attr, el.dataset['origAttr_' + attr]);
          delete el.dataset['origAttr_' + attr];
        }
      }
    }
  }

  function processMutations() {
    rafPending = false;
    if (!isEnabled || !siteAllowed || !compiledRegex) return;

    const mutations = mutationQueue;
    mutationQueue = [];

    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        translateNode(mutation.target);
      } else if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            translateNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateAttributes(node);
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
            while (walker.nextNode()) translateNode(walker.currentNode);
          }
        }
      }
    }
  }

  function startObserver() {
    if (observer) observer.disconnect();
    const target = document.documentElement || document.body;
    if (!target) return;

    observer = new MutationObserver((mutations) => {
      if (!isEnabled || !siteAllowed) return;
      mutationQueue.push(...mutations);
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(processMutations);
      }
    });

    observer.observe(target, { childList: true, subtree: true, characterData: true });
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
    }
    return true;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.dictionary) {
      updateDictionaryData(changes.dictionary.newValue || {});
      if (isEnabled && siteAllowed) {
        restoreDocument();
        translateDocument();
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
