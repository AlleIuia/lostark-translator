const DEFAULT_DICTIONARY_FILES = [
  'dictionary/lt-classes.json',
  'dictionary/lt-engravings.json',
  'dictionary/lt-interface.json'
];

async function getDictionaryFileList() {
  const result = await chrome.storage.local.get('dictionaryFiles');
  return result.dictionaryFiles || DEFAULT_DICTIONARY_FILES;
}

function flattenData(data, target) {
  const dict = {};
  const sources = ['en','ru','kr'].filter(f => f !== target);
  
  (data.classes || []).forEach(cls => {
    sources.forEach(src => { if (cls[src]) dict[cls[src]] = cls[target]; });
    (cls.builds || []).forEach(b => {
      sources.forEach(src => { if (b[src]) dict[b[src]] = b[target]; });
    });
  });

  (data.engravings || []).forEach(eng => {
    sources.forEach(src => { if (eng[src]) dict[eng[src]] = eng[target]; });
  });

  (data.terms || []).forEach(term => {
    sources.forEach(src => { if (term[src]) dict[term[src]] = term[target]; });
  });

  if (data._orphanBuilds) {
    data._orphanBuilds.forEach(o => {
      sources.forEach(src => { if (o[src]) dict[o[src]] = o[target]; });
    });
  }
  return dict;
}

function mergeData(target, source) {
  if (!source) return target;

  for (const srcClass of source.classes || []) {
    let existingClass = target.classes.find(c => c.en === srcClass.en);
    if (existingClass) {
      if (srcClass.ru) existingClass.ru = srcClass.ru;
      if (srcClass.kr) existingClass.kr = srcClass.kr;
      for (const srcBuild of srcClass.builds || []) {
        let existingBuild = existingClass.builds.find(b => b.en === srcBuild.en);
        if (existingBuild) {
          if (srcBuild.ru) existingBuild.ru = srcBuild.ru;
          if (srcBuild.kr) existingBuild.kr = srcBuild.kr;
        } else {
          existingClass.builds.push({ ...srcBuild });
        }
      }
    } else {
      target.classes.push({
        en: srcClass.en,
        ru: srcClass.ru || '',
        kr: srcClass.kr || '',
        builds: (srcClass.builds || []).map(b => ({ ...b }))
      });
    }
  }

  if (!target.engravings) target.engravings = [];
  for (const srcEng of source.engravings || []) {
    let existingEng = target.engravings.find(e => e.en === srcEng.en);
    if (existingEng) {
      if (srcEng.ru) existingEng.ru = srcEng.ru;
      if (srcEng.kr) existingEng.kr = srcEng.kr;
    } else {
      target.engravings.push({ ...srcEng });
    }
  }

  if (source._orphanBuilds) {
    for (const orphan of source._orphanBuilds) {
      let existing = target._orphanBuilds.find(o => o.en === orphan.en);
      if (existing) {
        if (orphan.ru) existing.ru = orphan.ru;
        if (orphan.kr) existing.kr = orphan.kr;
      } else {
        target._orphanBuilds.push({ ...orphan });
      }
    }
  }

  if (!target.terms) target.terms = [];
  for (const srcTerm of source.terms || []) {
    let existing = target.terms.find(t => t.en === srcTerm.en);
    if (existing) {
      if (srcTerm.ru) existing.ru = srcTerm.ru;
      if (srcTerm.kr) existing.kr = srcTerm.kr;
    } else {
      target.terms.push({ ...srcTerm });
    }
  }

  return target;
}

function mergeWithDeleted(base, user) {
  const deleted = new Set(user._deleted || []);
  const result = { classes: [], engravings: [], _orphanBuilds: [], terms: [] };

  for (const cls of base.classes || []) {
    if (!deleted.has(cls.en)) result.classes.push(JSON.parse(JSON.stringify(cls)));
  }
  for (const eng of base.engravings || []) {
    if (!deleted.has(eng.en)) result.engravings.push(JSON.parse(JSON.stringify(eng)));
  }
  for (const o of base._orphanBuilds || []) {
    if (!deleted.has(o.en)) result._orphanBuilds.push(JSON.parse(JSON.stringify(o)));
  }
  for (const t of base.terms || []) {
    if (!deleted.has(t.en)) result.terms.push(JSON.parse(JSON.stringify(t)));
  }

  mergeData(result, user);
  return result;
}

async function loadDefaultDictionaries() {
  const files = await getDictionaryFileList();
  let merged = { classes: [], engravings: [], _orphanBuilds: [], terms: [] };
  for (const file of files) {
    try {
      const res = await fetch(chrome.runtime.getURL(file));
      if (!res.ok) continue;
      const data = await res.json();
      mergeData(merged, data);
    } catch (err) {
      console.error('Failed to load:', file, err.message);
    }
  }
  return merged;
}

async function syncFromUrls(urls) {
  let merged = { classes: [], engravings: [], _orphanBuilds: [], terms: [] };
  let totalCount = 0;

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} -> ${res.status}`);
      const data = await res.json();
      mergeData(merged, data);
      totalCount += (data.classes?.length || 0) +
                    (data.engravings?.length || 0) +
                    (data._orphanBuilds?.length || 0) +
                    (data.terms?.length || 0);
    } catch (e) {
      console.error('Sync failed:', url, e.message);
    }
  }

  if (totalCount === 0 && urls.length > 0) {
    throw new Error('Failed to load any dictionary');
  }

  const { userData } = await chrome.storage.local.get('userData');
  const existing = userData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], _deleted: [] };
  mergeData(existing, merged);
  await chrome.storage.local.set({ userData: existing });
  await rebuildStorage();

  return { count: totalCount };
}

async function rebuildStorage() {
  const [{ baseData, userData }, syncResult] = await Promise.all([
    chrome.storage.local.get(['baseData', 'userData']),
    chrome.storage.sync.get('targetLang')
  ]);
  const targetLang = syncResult.targetLang || 'ru';
  const fullData = mergeWithDeleted(
    baseData || { classes: [], engravings: [], _orphanBuilds: [], terms: [] },
    userData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], _deleted: [] }
  );
  const flatDict = flattenData(fullData, targetLang);
  await chrome.storage.local.set({ fullData, dictionary: flatDict });

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    chrome.tabs.sendMessage(tab.id, { action: 'updateDictionary', dictionary: flatDict }).catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const baseData = await loadDefaultDictionaries();
  await chrome.storage.local.set({ baseData });
  await rebuildStorage();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const reply = (p) => {
    p.then(r => sendResponse({ success: true, ...r }))
     .catch(e => sendResponse({ success: false, error: e.message }));
  };

  if (request.action === 'rebuildDictionary') {
    reply(rebuildStorage());
    return true;
  }

  if (request.action === 'toggle') {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        chrome.tabs.sendMessage(tab.id, { action: 'toggle', enabled: request.enabled }).catch(() => {});
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'updateDictionaryFiles') {
    reply((async () => {
      await chrome.storage.local.set({ dictionaryFiles: request.files });
      const baseData = await loadDefaultDictionaries();
      await chrome.storage.local.set({ baseData });
      return rebuildStorage();
    })());
    return true;
  }

  if (request.action === 'syncUrls') {
    reply(syncFromUrls(request.urls));
    return true;
  }

  if (request.action === 'syncUrl') {
    reply(syncFromUrls([request.url]));
    return true;
  }
});
