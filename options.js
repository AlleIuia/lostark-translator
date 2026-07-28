const UI = {
  ru: {
    title: 'Lost Ark Translator Settings',
    secTheme: 'Тема',
    lblThemeDark: 'Тёмная тема',
    lblThemeLight: 'Светлая тема',
    secSites: 'Сайты',
    lblSiteMode: 'Режим',
    siteEverywhere: 'Везде',
    siteAllowlist: 'Только разрешённые',
    siteBlocklist: 'Кроме запрещённых',
    sitesPlaceholder: 'По одному домену на строку\nloawa.com\nmaxroll.gg',
    secSync: 'Автосинхронизация',
    lblAutoSync: 'Включить',
    forceSync: 'Синхронизировать',
    hintAutoSync: 'Выключено по умолчанию. Не чаще раза в 48 часов при запуске браузера.',
    secImportExport: 'Импорт / Экспорт',
    exportBtn: 'Экспорт',
    importBtn: 'Импорт',
    secUserWords: 'Мои слова',
    hintUserWords: 'Записи, которые вы добавили или изменили. В списке словаря они показываются сверху.',
    exportUserBtn: 'Выгрузить мои слова',
    exportUserOk: 'Сохранено в lt-user.json',
    exportUserEmpty: 'Нет пользовательских записей',
    userEmpty: 'Пока ничего не добавлено',
    userCount: 'записей: ',
    secPatterns: 'Свои правила замены',
    hintPatterns: 'Если слово на сайте пишется иначе, чем в словаре, здесь можно задать правило: что искать → на что заменить. Для большинства пользователей не нужно.',
    patPattern: 'Что искать',
    patFlags: 'Флаги',
    patReplacement: 'На что заменить',
    addPattern: 'Добавить',
    thPattern: 'Искать',
    thFlags: 'Флаги',
    thRepl: 'Заменить на',
    syncing: 'Синхронизация…',
    syncOk: 'Готово',
    syncErr: 'Ошибка: ',
    importOk: 'Импорт выполнен',
    importErr: 'Ошибка импорта: ',
    exportOk: 'Экспорт выполнен',
    invalidRegex: 'Неверный regex: ',
    lastPrefix: 'Последний: '
  },
  en: {
    title: 'Lost Ark Translator Settings',
    secTheme: 'Theme',
    lblThemeDark: 'Dark theme',
    lblThemeLight: 'Light theme',
    secSites: 'Sites',
    lblSiteMode: 'Mode',
    siteEverywhere: 'Everywhere',
    siteAllowlist: 'Allowlist only',
    siteBlocklist: 'Except blocklist',
    sitesPlaceholder: 'One domain per line\nloawa.com\nmaxroll.gg',
    secSync: 'Auto sync',
    lblAutoSync: 'Enable',
    forceSync: 'Sync now',
    hintAutoSync: 'Off by default. At most once every 48 hours on browser start.',
    secImportExport: 'Import / Export',
    exportBtn: 'Export',
    importBtn: 'Import',
    secUserWords: 'My words',
    hintUserWords: 'Entries you added or changed. They appear at the top of the dictionary list.',
    exportUserBtn: 'Export my words',
    exportUserOk: 'Saved as lt-user.json',
    exportUserEmpty: 'No user entries',
    userEmpty: 'Nothing added yet',
    userCount: 'entries: ',
    secPatterns: 'Custom replace rules',
    hintPatterns: 'If a word on a site is written differently from the dictionary, set a rule: find → replace. Most users do not need this.',
    patPattern: 'Find',
    patFlags: 'Flags',
    patReplacement: 'Replace with',
    addPattern: 'Add',
    thPattern: 'Find',
    thFlags: 'Flags',
    thRepl: 'Replace with',
    syncing: 'Syncing…',
    syncOk: 'Done',
    syncErr: 'Error: ',
    importOk: 'Import complete',
    importErr: 'Import error: ',
    exportOk: 'Export complete',
    invalidRegex: 'Invalid regex: ',
    lastPrefix: 'Last: '
  },
  kr: {
    title: 'Lost Ark Translator Settings',
    secTheme: '테마',
    lblThemeDark: '다크 테마',
    lblThemeLight: '라이트 테마',
    secSites: '사이트',
    lblSiteMode: '모드',
    siteEverywhere: '전체',
    siteAllowlist: '허용 목록만',
    siteBlocklist: '차단 목록 제외',
    sitesPlaceholder: '줄당 하나의 도메인\nloawa.com\nmaxroll.gg',
    secSync: '자동 동기화',
    lblAutoSync: '사용',
    forceSync: '지금 동기화',
    hintAutoSync: '기본값 꺼짐. 브라우저 시작 시 48시간에 한 번까지.',
    secImportExport: '가져오기 / 내보내기',
    exportBtn: '내보내기',
    importBtn: '가져오기',
    secUserWords: '내 단어',
    hintUserWords: '직접 추가하거나 수정한 항목입니다. 사전 목록 상단에 표시됩니다.',
    exportUserBtn: '내 단어 내보내기',
    exportUserOk: 'lt-user.json으로 저장됨',
    exportUserEmpty: '사용자 항목 없음',
    userEmpty: '아직 추가된 항목 없음',
    userCount: '항목: ',
    secPatterns: '사용자 치환 규칙',
    hintPatterns: '사이트 표기가 사전과 다를 때 찾기 → 바꾸기 규칙을 추가합니다. 대부분 필요하지 않습니다.',
    patPattern: '찾을 내용',
    patFlags: '플래그',
    patReplacement: '바꿀 내용',
    addPattern: '추가',
    thPattern: '찾기',
    thFlags: '플래그',
    thRepl: '바꾸기',
    syncing: '동기화 중…',
    syncOk: '완료',
    syncErr: '오류: ',
    importOk: '가져오기 완료',
    importErr: '가져오기 오류: ',
    exportOk: '내보내기 완료',
    invalidRegex: '잘못된 정규식: ',
    lastPrefix: '최근: '
  }
};

let targetLang = 'ru';
let t = UI.ru;
let lastSyncInfo = { ts: null, status: null };

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['targetLang', 'theme', 'siteMode', 'allowedSites', 'blockedSites'], (sync) => {
    targetLang = sync.targetLang || 'ru';
    t = UI[targetLang] || UI.ru;
    applyLocalization();

    const theme = sync.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').checked = theme === 'dark';

    const mode = sync.siteMode || 'everywhere';
    document.getElementById('siteMode').value = mode;
    if (mode === 'allowlist') {
      document.getElementById('sitesList').value = sync.allowedSites || '';
    } else if (mode === 'blocklist') {
      document.getElementById('sitesList').value = sync.blockedSites || '';
    } else {
      document.getElementById('sitesList').value = '';
    }
  });

  chrome.storage.local.get(['autoSyncEnabled', 'lastAutoSync', 'lastAutoSyncStatus', 'customPatterns'], (local) => {
    document.getElementById('autoSyncToggle').checked = local.autoSyncEnabled === true;
    const st = document.getElementById('autoSyncStatus');
    lastSyncInfo = { ts: local.lastAutoSync || null, status: local.lastAutoSyncStatus || null };
    updateSyncStatusLabel();
    renderPatterns(local.customPatterns || []);
  });

  const verEl = document.getElementById('appVersion');
  if (verEl) {
    const manifest = chrome.runtime.getManifest();
    verEl.textContent = 'v' + (manifest.version || '');
  }
  const gh = document.getElementById('githubLink');
  if (gh) gh.textContent = 'GitHub';

  setupListeners();
});


function updateSyncStatusLabel() {
  const st = document.getElementById('autoSyncStatus');
  if (!st) return;
  if (!lastSyncInfo.ts) {
    if (!st.textContent || st.textContent === t.syncing) return;
    return;
  }
  const d = new Date(lastSyncInfo.ts);
  const status = lastSyncInfo.status || '';
  st.textContent = (t.lastPrefix || 'Last: ') + d.toLocaleString() + (status ? ' (' + status + ')' : '');
  st.className = 'status ' + (String(status).startsWith('err') ? 'err' : 'ok');
}

function applyLocalization() {
  t = UI[targetLang] || UI.ru;
  document.title = t.title;
  document.getElementById('pageTitle').textContent = t.title;
  document.getElementById('secTheme').textContent = t.secTheme;
  const themeOn = document.getElementById('themeToggle').checked;
  document.getElementById('lblTheme').textContent = themeOn ? t.lblThemeDark : t.lblThemeLight;
  document.getElementById('secSites').textContent = t.secSites;
  document.getElementById('lblSiteMode').textContent = t.lblSiteMode;
  const mode = document.getElementById('siteMode');
  if (mode.options[0]) mode.options[0].textContent = t.siteEverywhere;
  if (mode.options[1]) mode.options[1].textContent = t.siteAllowlist;
  if (mode.options[2]) mode.options[2].textContent = t.siteBlocklist;
  document.getElementById('sitesList').placeholder = t.sitesPlaceholder;
  document.getElementById('secSync').textContent = t.secSync;
  document.getElementById('lblAutoSync').textContent = t.lblAutoSync;
  document.getElementById('forceSyncBtn').textContent = t.forceSync;
  document.getElementById('hintAutoSync').textContent = t.hintAutoSync;
  const secUser = document.getElementById('secUserWords');
  if (secUser) secUser.textContent = t.secUserWords;
  const hintUser = document.getElementById('hintUserWords');
  if (hintUser) hintUser.textContent = t.hintUserWords;
  const expUser = document.getElementById('exportUserBtn');
  if (expUser) expUser.textContent = t.exportUserBtn;
  document.getElementById('secImportExport').textContent = t.secImportExport;
  document.getElementById('exportBtn').textContent = t.exportBtn;
  document.getElementById('importBtn').textContent = t.importBtn;
  document.getElementById('secPatterns').textContent = t.secPatterns;
  document.getElementById('hintPatterns').textContent = t.hintPatterns;
  document.getElementById('patPattern').placeholder = t.patPattern;
  document.getElementById('patFlags').placeholder = t.patFlags;
  document.getElementById('patReplacement').placeholder = t.patReplacement;
  document.getElementById('addPatternBtn').textContent = t.addPattern;
  document.getElementById('thPattern').textContent = t.thPattern;
  document.getElementById('thFlags').textContent = t.thFlags;
  document.getElementById('thRepl').textContent = t.thRepl;
  updateSyncStatusLabel();
  loadUserWords();
}

function setupListeners() {
  document.getElementById('themeToggle').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    chrome.storage.sync.set({ theme });
    document.getElementById('lblTheme').textContent = e.target.checked ? t.lblThemeDark : t.lblThemeLight;
  });

  document.getElementById('siteMode').addEventListener('change', saveSites);
  let siteTimeout;
  document.getElementById('sitesList').addEventListener('input', () => {
    clearTimeout(siteTimeout);
    siteTimeout = setTimeout(saveSites, 400);
  });

  document.getElementById('autoSyncToggle').addEventListener('change', (e) => {
    chrome.runtime.sendMessage({ action: 'setAutoSync', enabled: e.target.checked });
  });

  document.getElementById('forceSyncBtn').addEventListener('click', async () => {
    const st = document.getElementById('autoSyncStatus');
    st.textContent = t.syncing;
    st.className = 'status';
    try {
      const res = await chrome.runtime.sendMessage({ action: 'forceAutoSync' });
      if (res && res.success) {
        if (res.lastAutoSync) lastSyncInfo.ts = res.lastAutoSync;
        if (res.status) lastSyncInfo.status = res.status;
        else lastSyncInfo.status = 'ok';
        st.textContent = t.syncOk + (lastSyncInfo.ts ? ' ' + new Date(lastSyncInfo.ts).toLocaleString() : '');
        st.className = 'status ok';
      } else {
        throw new Error(res && res.error ? res.error : 'failed');
      }
    } catch (e) {
      st.textContent = t.syncErr + e.message;
      st.className = 'status err';
    }
  });

  document.getElementById('exportUserBtn').addEventListener('click', exportUserWords);
  loadUserWords();

  document.getElementById('exportBtn').addEventListener('click', exportDictionary);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importDictionary);

  document.getElementById('addPatternBtn').addEventListener('click', addPattern);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      if (changes.targetLang) {
        targetLang = changes.targetLang.newValue || 'ru';
        applyLocalization();
      }
      if (changes.theme) {
        const theme = changes.theme.newValue || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.checked = theme === 'dark';
        document.getElementById('lblTheme').textContent = theme === 'dark' ? t.lblThemeDark : t.lblThemeLight;
      }
    }
    if (area === 'local') {
      if (changes.lastAutoSync || changes.lastAutoSyncStatus) {
        if (changes.lastAutoSync) lastSyncInfo.ts = changes.lastAutoSync.newValue;
        if (changes.lastAutoSyncStatus) lastSyncInfo.status = changes.lastAutoSyncStatus.newValue;
        updateSyncStatusLabel();
      }
      if (changes.userData) {
        loadUserWords();
      }
    }
  });
}

function saveSites() {
  const mode = document.getElementById('siteMode').value;
  const list = document.getElementById('sitesList').value;
  const updates = { siteMode: mode };
  if (mode === 'allowlist') updates.allowedSites = list;
  else if (mode === 'blocklist') updates.blockedSites = list;
  chrome.storage.sync.set(updates);
}

function renderPatterns(patterns) {
  const tbody = document.getElementById('patternsList');
  tbody.innerHTML = '';
  patterns.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td></td><td></td><td></td><td class="pat-actions"></td>';
    tr.cells[0].textContent = p.pattern || '';
    tr.cells[1].textContent = p.flags || 'giu';
    tr.cells[2].textContent = p.replacement || '';
    const btn = document.createElement('button');
    btn.className = 'btn btn-danger';
    btn.textContent = '×';
    btn.addEventListener('click', () => removePattern(i));
    tr.cells[3].appendChild(btn);
    tbody.appendChild(tr);
  });
}

async function getPatterns() {
  const { customPatterns } = await chrome.storage.local.get('customPatterns');
  return customPatterns || [];
}

async function savePatterns(patterns) {
  await chrome.runtime.sendMessage({ action: 'setCustomPatterns', patterns });
  renderPatterns(patterns);
}

async function addPattern() {
  const pattern = document.getElementById('patPattern').value.trim();
  const flags = document.getElementById('patFlags').value.trim() || 'giu';
  const replacement = document.getElementById('patReplacement').value;
  if (!pattern) return;
  try {
    new RegExp(pattern, flags);
  } catch (e) {
    alert(t.invalidRegex + e.message);
    return;
  }
  const patterns = await getPatterns();
  patterns.push({ pattern, flags, replacement });
  await savePatterns(patterns);
  document.getElementById('patPattern').value = '';
  document.getElementById('patReplacement').value = '';
}

async function removePattern(index) {
  const patterns = await getPatterns();
  patterns.splice(index, 1);
  await savePatterns(patterns);
}

function exportDictionary() {
  chrome.storage.local.get(['fullData'], (result) => {
    const data = result.fullData || { classes: [], engravings: [], _orphanBuilds: [], terms: [] };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lostark-dictionary-export.json';
    a.click();
    URL.revokeObjectURL(url);
    const st = document.getElementById('ioStatus');
    st.textContent = t.exportOk;
    st.className = 'status ok';
    setTimeout(() => { st.textContent = ''; }, 3000);
  });
}

function importDictionary(e) {
  const file = e.target.files[0];
  if (!file) return;
  const st = document.getElementById('ioStatus');
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data.classes && !data._orphanBuilds && !data.terms && !data.engravings) {
        throw new Error('format');
      }
      const res = await chrome.runtime.sendMessage({ action: 'importData', data });
      if (!res || !res.success) throw new Error(res && res.error ? res.error : 'failed');
      st.textContent = t.importOk;
      st.className = 'status ok';
    } catch (err) {
      st.textContent = t.importErr + err.message;
      st.className = 'status err';
    }
    e.target.value = '';
    setTimeout(() => { st.textContent = ''; }, 4000);
  };
  reader.readAsText(file);
}


async function loadUserWords() {
  const box = document.getElementById('userWordsList');
  if (!box) return;
  try {
    const res = await chrome.runtime.sendMessage({ action: 'getUserData' });
    const ud = (res && res.userData) || {};
    const lines = [];
    for (const c of ud.classes || []) {
      lines.push(['class', c.en, c.ru || '', c.kr || '']);
      for (const b of c.builds || []) {
        lines.push(['build', b.en, b.ru || '', b.kr || '']);
      }
    }
    for (const e of ud.engravings || []) {
      lines.push(['engraving', e.en, e.ru || '', e.kr || '']);
    }
    for (const o of ud._orphanBuilds || []) {
      lines.push(['orphan', o.en, o.ru || '', o.kr || '']);
    }
    for (const term of ud.terms || []) {
      lines.push(['term', term.en, term.ru || '', term.kr || '']);
    }
    for (const skill of ud.skills || []) {
      lines.push(['skill', skill.en, skill.ru || '', skill.kr || '']);
    }
    for (const sc of ud.skillClasses || []) {
      lines.push(['skillClass', sc.en, sc.ru || '', sc.kr || '']);
      for (const sk of sc.skills || []) {
        if (sk && sk.en) lines.push(['skill', sk.en, sk.ru || '', sk.kr || '']);
      }
    }
    if (!lines.length) {
      box.textContent = t.userEmpty;
      return;
    }
    box.innerHTML = '';
    const head = document.createElement('div');
    head.style.marginBottom = '6px';
    head.style.opacity = '0.7';
    head.textContent = t.userCount + lines.length;
    box.appendChild(head);
    const table = document.createElement('table');
    table.style.width = '100%';
    for (const [type, en, ru, kr] of lines) {
      const tr = document.createElement('tr');
      const td0 = document.createElement('td');
      td0.textContent = type;
      td0.style.opacity = '0.5';
      td0.style.width = '70px';
      const td1 = document.createElement('td');
      td1.textContent = en;
      const td2 = document.createElement('td');
      td2.textContent = ru;
      const td3 = document.createElement('td');
      td3.textContent = kr;
      tr.appendChild(td0);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      table.appendChild(tr);
    }
    box.appendChild(table);
  } catch (e) {
    box.textContent = String(e.message || e);
  }
}

async function exportUserWords() {
  const st = document.getElementById('userExportStatus');
  try {
    const res = await chrome.runtime.sendMessage({ action: 'getUserData' });
    const ud = (res && res.userData) || {};
    const payload = {
      classes: ud.classes || [],
      engravings: ud.engravings || [],
      _orphanBuilds: ud._orphanBuilds || [],
      terms: ud.terms || [],
      skills: ud.skills || [],
      skillClasses: ud.skillClasses || []
    };
    const total = payload.classes.length + payload.engravings.length +
      payload._orphanBuilds.length + payload.terms.length + payload.skills.length +
      payload.skillClasses.length;
    if (!total) {
      st.textContent = t.exportUserEmpty;
      st.className = 'status err';
      setTimeout(() => { st.textContent = ''; }, 3000);
      return;
    }
    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lt-user.json';
    a.click();
    URL.revokeObjectURL(url);
    st.textContent = t.exportUserOk;
    st.className = 'status ok';
    setTimeout(() => { st.textContent = ''; }, 3000);
  } catch (e) {
    st.textContent = String(e.message || e);
    st.className = 'status err';
  }
}
