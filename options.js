const UI = {
  ru: {
    title: 'LA Translator Settings',
    secTheme: 'Тема',
    lblThemeDark: 'Тёмная тема',
    lblThemeLight: 'Светлая тема',
    secTermMode: 'Режим терминов',
    lblTermMode: 'Режим',
    termReplace: 'Замена',
    termAnnotate: 'Подсказка',
    termBrackets: 'Скобки',
    hintTermMode: 'Режим переключается в главном меню (ЗА / ПД / СК). Списки ниже задают режим автоматически при открытии сайта (Подсказка → Скобки → Замена → последний режим из меню).',
    lblTermReplaceSites: 'Сайты: Замена',
    lblTermAnnotateSites: 'Сайты: Подсказка',
    lblTermBracketsSites: 'Сайты: Скобки',
    hintTermModeSites: 'По одному домену на строку. При открытии сайта режим берётся из списка (Подсказка → Скобки → Замена → по умолчанию).',
    secSites: 'Сайты',
    lblSiteMode: 'Режим',
    siteEverywhere: 'Везде',
    siteAllowlist: 'Только разрешённые',
    siteBlocklist: 'Кроме запрещённых',
    siteDeveloper: 'Список разработчика',
    sitesPlaceholder: 'По одному домену на строку\nloawa.com\nmaxroll.gg',
    hintSitesAllow: 'По одному домену на строку. Расширение работает только на этих сайтах.',
    hintSitesBlock: 'По одному домену на строку. На этих сайтах расширение не работает.',
    hintSitesDev: 'Список разработчика. Редактируется здесь; по умолчанию задан при установке.',
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
    lastPrefix: 'Последний: ',
    exportSettingsBtn: 'Экспорт настроек',
    importSettingsBtn: 'Импорт настроек',
    hintExportSettings: 'Экспорт: списки сайтов режимов терминов, списки сайтов расширения и свои regex-правила.',
    exportSettingsOk: 'Настройки экспортированы',
    importSettingsOk: 'Настройки импортированы',
    clearDictBtn: 'Удалить весь словарь',
    hintClearDict: 'Удаляет все пользовательские записи и восстанавливает словарь по умолчанию из расширения.',
    clearDictConfirm: 'Удалить весь пользовательский словарь и сбросить к встроенному? Это нельзя отменить.',
    clearDictOk: 'Словарь очищен',
    clearDictErr: 'Ошибка: '
  },
  en: {
    title: 'LA Translator Settings',
    secTheme: 'Theme',
    lblThemeDark: 'Dark theme',
    lblThemeLight: 'Light theme',
    secTermMode: 'Term mode',
    lblTermMode: 'Mode',
    termReplace: 'Replace',
    termAnnotate: 'Tooltip',
    termBrackets: 'Brackets',
    hintTermMode: 'Mode is switched in the popup (RE / TT / BR). Lists below set the mode automatically when you open a matching site (Tooltip → Brackets → Replace → last popup mode).',
    lblTermReplaceSites: 'Replace sites',
    lblTermAnnotateSites: 'Tooltip sites',
    lblTermBracketsSites: 'Brackets sites',
    hintTermModeSites: 'One domain per line. On visit, mode is taken from lists (Tooltip → Brackets → Replace → default).',
    secSites: 'Sites',
    lblSiteMode: 'Mode',
    siteEverywhere: 'Everywhere',
    siteAllowlist: 'Allowlist only',
    siteBlocklist: 'Except blocklist',
    siteDeveloper: 'Developer list',
    sitesPlaceholder: 'One domain per line\nloawa.com\nmaxroll.gg',
    hintSitesAllow: 'One domain per line. Extension runs only on these sites.',
    hintSitesBlock: 'One domain per line. Extension does not run on these sites.',
    hintSitesDev: 'Developer list. Editable here; default is set on install.',
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
    lastPrefix: 'Last: ',
    exportSettingsBtn: 'Export settings',
    importSettingsBtn: 'Import settings',
    hintExportSettings: 'Exports term-mode site lists, extension site lists, and custom regex rules.',
    exportSettingsOk: 'Settings exported',
    importSettingsOk: 'Settings imported',
    clearDictBtn: 'Clear dictionary',
    hintClearDict: 'Removes all user entries and restores the bundled default dictionary.',
    clearDictConfirm: 'Delete all user dictionary data and reset to bundled defaults? This cannot be undone.',
    clearDictOk: 'Dictionary cleared',
    clearDictErr: 'Error: '
  },
  kr: {
    title: 'LA Translator Settings',
    secTheme: '테마',
    lblThemeDark: '다크 테마',
    lblThemeLight: '라이트 테마',
    secTermMode: '용어 모드',
    lblTermMode: '모드',
    termReplace: '교체',
    termAnnotate: '툴팁',
    termBrackets: '괄호',
    hintTermMode: '모드는 팝업에서 전환합니다(교 / 팁 / 괄). 아래 목록은 사이트 접속 시 모드를 자동 설정합니다(툴팁 → 괄호 → 교체 → 팝업 마지막 모드).',
    lblTermReplaceSites: '교체 사이트',
    lblTermAnnotateSites: '툴팁 사이트',
    lblTermBracketsSites: '괄호 사이트',
    hintTermModeSites: '줄당 하나의 도메인. 사이트 접속 시 목록에서 모드 선택 (툴팁 → 괄호 → 교체 → 기본값).',
    secSites: '사이트',
    lblSiteMode: '모드',
    siteEverywhere: '전체',
    siteAllowlist: '허용 목록만',
    siteBlocklist: '차단 목록 제외',
    siteDeveloper: '개발자 목록',
    sitesPlaceholder: '줄당 하나의 도메인\nloawa.com\nmaxroll.gg',
    hintSitesAllow: '줄당 하나의 도메인. 이 사이트에서만 확장 프로그램이 동작합니다.',
    hintSitesBlock: '줄당 하나의 도메인. 이 사이트에서는 확장 프로그램이 동작하지 않습니다.',
    hintSitesDev: '개발자 목록. 여기서 편집할 수 있으며, 설치 시 기본값이 설정됩니다.',
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
    lastPrefix: '최근: ',
    exportSettingsBtn: '설정 내보내기',
    importSettingsBtn: '설정 가져오기',
    hintExportSettings: '용어 모드 사이트 목록, 확장 사이트 목록, 사용자 정규식 규칙을 내보냅니다.',
    exportSettingsOk: '설정 내보냄',
    importSettingsOk: '설정 가져옴',
    clearDictBtn: '사전 전체 삭제',
    hintClearDict: '사용자 항목을 모두 삭제하고 확장 프로그램 기본 사전으로 복원합니다.',
    clearDictConfirm: '모든 사용자 사전 데이터를 삭제하고 기본값으로 재설정할까요? 되돌릴 수 없습니다.',
    clearDictOk: '사전이 초기화됨',
    clearDictErr: '오류: '
  }
};

let targetLang = 'ru';
let t = UI.ru;


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
  'loatto.kr',
  'icepeng.com',
  'lo4.app',
  'loaclac-doss.vercel.app',
  'la-tools.com',
  'airplaner.github.io',
  'ssbcalc.poyomi.fyi',
  'raimundomedeiros.github.io',
  'loatool.taeu.kr',
  'lostgld.com',
  'ark.bynn.kr',
  'loatracker.pages.dev',
  'reddit.com'
];

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['targetLang', 'theme', 'siteMode', 'allowedSites', 'blockedSites', 'developerSites', 'termMode', 'termModeReplaceSites', 'termModeAnnotateSites', 'termModeBracketsSites'], (sync) => {
    targetLang = sync.targetLang || 'ru';
    t = UI[targetLang] || UI.ru;
    applyLocalization();

    const theme = sync.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').checked = theme === 'dark';

    const trs = document.getElementById('termModeReplaceSites');
    if (trs) trs.value = sync.termModeReplaceSites || '';
    const tas = document.getElementById('termModeAnnotateSites');
    if (tas) tas.value = sync.termModeAnnotateSites || '';
    const tbs = document.getElementById('termModeBracketsSites');
    if (tbs) tbs.value = sync.termModeBracketsSites || '';

    const mode = sync.siteMode || 'everywhere';
    document.getElementById('siteMode').value = mode;
    updateSitesListUI(mode, sync);
  });

  chrome.storage.local.get(['customPatterns'], (local) => {
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

function updateSitesListUI(mode, sync) {
  const ta = document.getElementById('sitesList');
  const row = document.getElementById('sitesListRow');
  const hint = document.getElementById('hintSitesList');
  if (!ta) return;
  const show = mode === 'allowlist' || mode === 'blocklist' || mode === 'developer';
  if (row) row.style.display = show ? '' : 'none';
  if (!show) {
    ta.value = '';
    if (hint) hint.textContent = '';
    return;
  }
  if (mode === 'allowlist') {
    ta.value = (sync && typeof sync.allowedSites === 'string') ? sync.allowedSites : '';
    if (hint) hint.textContent = t.hintSitesAllow || '';
  } else if (mode === 'blocklist') {
    ta.value = (sync && typeof sync.blockedSites === 'string') ? sync.blockedSites : '';
    if (hint) hint.textContent = t.hintSitesBlock || '';
  } else if (mode === 'developer') {
    const raw = sync && typeof sync.developerSites === 'string' ? sync.developerSites : '';
    ta.value = raw.trim() ? raw : DEFAULT_DEV_SITES.join('\n');
    if (hint) hint.textContent = t.hintSitesDev || '';
  }
}

function applyLocalization() {
  t = UI[targetLang] || UI.ru;
  document.title = t.title;
  document.getElementById('pageTitle').textContent = t.title;
  document.getElementById('secTheme').textContent = t.secTheme;
  const themeOn = document.getElementById('themeToggle').checked;
  document.getElementById('lblTheme').textContent = themeOn ? t.lblThemeDark : t.lblThemeLight;
  const secTerm = document.getElementById('secTermMode');
  if (secTerm) secTerm.textContent = t.secTermMode;
  const hintTerm = document.getElementById('hintTermMode');
  if (hintTerm) hintTerm.textContent = t.hintTermMode;
  const lr = document.getElementById('lblTermReplaceSites');
  if (lr) lr.textContent = t.lblTermReplaceSites;
  const la = document.getElementById('lblTermAnnotateSites');
  if (la) la.textContent = t.lblTermAnnotateSites;
  const lb = document.getElementById('lblTermBracketsSites');
  if (lb) lb.textContent = t.lblTermBracketsSites;
  const hs = document.getElementById('hintTermModeSites');
  if (hs) hs.textContent = t.hintTermModeSites;
  document.getElementById('secSites').textContent = t.secSites;
  document.getElementById('lblSiteMode').textContent = t.lblSiteMode;
  const mode = document.getElementById('siteMode');
  if (mode.options[0]) mode.options[0].textContent = t.siteEverywhere;
  if (mode.options[1]) mode.options[1].textContent = t.siteAllowlist;
  if (mode.options[2]) mode.options[2].textContent = t.siteBlocklist;
  if (mode.options[3]) mode.options[3].textContent = t.siteDeveloper;
  document.getElementById('sitesList').placeholder = t.sitesPlaceholder;
  const modeEl = document.getElementById('siteMode');
  if (modeEl) {
    const m = modeEl.value;
    const hint = document.getElementById('hintSitesList');
    if (hint) {
      if (m === 'allowlist') hint.textContent = t.hintSitesAllow || '';
      else if (m === 'blocklist') hint.textContent = t.hintSitesBlock || '';
      else if (m === 'developer') hint.textContent = t.hintSitesDev || '';
      else hint.textContent = '';
    }
  }
  const secUser = document.getElementById('secUserWords');
  if (secUser) secUser.textContent = t.secUserWords;
  const hintUser = document.getElementById('hintUserWords');
  if (hintUser) hintUser.textContent = t.hintUserWords;
  const expUser = document.getElementById('exportUserBtn');
  if (expUser) expUser.textContent = t.exportUserBtn;
  document.getElementById('secImportExport').textContent = t.secImportExport;
  document.getElementById('exportBtn').textContent = t.exportBtn;
  document.getElementById('importBtn').textContent = t.importBtn;
  const esb = document.getElementById('exportSettingsBtn');
  if (esb) esb.textContent = t.exportSettingsBtn;
  const isb = document.getElementById('importSettingsBtn');
  if (isb) isb.textContent = t.importSettingsBtn;
  const hes = document.getElementById('hintExportSettings');
  if (hes) hes.textContent = t.hintExportSettings;
  const clearBtn = document.getElementById('clearDictBtn');
  if (clearBtn) clearBtn.textContent = t.clearDictBtn;
  const hintClear = document.getElementById('hintClearDict');
  if (hintClear) hintClear.textContent = t.hintClearDict;
  document.getElementById('secPatterns').textContent = t.secPatterns;
  document.getElementById('hintPatterns').textContent = t.hintPatterns;
  document.getElementById('patPattern').placeholder = t.patPattern;
  document.getElementById('patFlags').placeholder = t.patFlags;
  document.getElementById('patReplacement').placeholder = t.patReplacement;
  document.getElementById('addPatternBtn').textContent = t.addPattern;
  document.getElementById('thPattern').textContent = t.thPattern;
  document.getElementById('thFlags').textContent = t.thFlags;
  document.getElementById('thRepl').textContent = t.thRepl;
  loadUserWords();
}

function setupListeners() {
  document.getElementById('themeToggle').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    chrome.storage.sync.set({ theme });
    document.getElementById('lblTheme').textContent = e.target.checked ? t.lblThemeDark : t.lblThemeLight;
  });

  let termSitesTimer;
  function saveTermModeSites() {
    chrome.storage.sync.set({
      termModeReplaceSites: (document.getElementById('termModeReplaceSites') || {}).value || '',
      termModeAnnotateSites: (document.getElementById('termModeAnnotateSites') || {}).value || '',
      termModeBracketsSites: (document.getElementById('termModeBracketsSites') || {}).value || ''
    });
  }
  ['termModeReplaceSites','termModeAnnotateSites','termModeBracketsSites'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      clearTimeout(termSitesTimer);
      termSitesTimer = setTimeout(saveTermModeSites, 400);
    });
  });

  document.getElementById('siteMode').addEventListener('change', () => {
    const mode = document.getElementById('siteMode').value;
    chrome.storage.sync.get(['allowedSites', 'blockedSites', 'developerSites'], (sync) => {
      updateSitesListUI(mode, sync);
      const updates = { siteMode: mode };
      if (mode === 'developer') {
        const ta = document.getElementById('sitesList');
        if (ta && !((sync.developerSites || '').trim())) {
          updates.developerSites = DEFAULT_DEV_SITES.join('\n');
        }
      }
      chrome.storage.sync.set(updates);
    });
  });
  let siteTimeout;
  document.getElementById('sitesList').addEventListener('input', () => {
    clearTimeout(siteTimeout);
    siteTimeout = setTimeout(saveSites, 400);
  });

  document.getElementById('exportUserBtn').addEventListener('click', exportUserWords);
  loadUserWords();

  document.getElementById('exportBtn').addEventListener('click', exportDictionary);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importDictionary);
  const exportSettingsBtn = document.getElementById('exportSettingsBtn');
  if (exportSettingsBtn) exportSettingsBtn.addEventListener('click', exportSettings);
  const importSettingsBtn = document.getElementById('importSettingsBtn');
  if (importSettingsBtn) importSettingsBtn.addEventListener('click', () => {
    document.getElementById('importSettingsFile').click();
  });
  const importSettingsFile = document.getElementById('importSettingsFile');
  if (importSettingsFile) importSettingsFile.addEventListener('change', importSettings);

  const clearDictBtn = document.getElementById('clearDictBtn');
  if (clearDictBtn) clearDictBtn.addEventListener('click', clearDictionary);

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
  else if (mode === 'developer') updates.developerSites = list;
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
    for (const sc of ud.arkPassClasses || []) {
      lines.push(['arkPass', sc.en, sc.ru || '', sc.kr || '']);
      for (const sk of sc.skills || []) {
        if (sk && sk.en) lines.push(['arkpass', sk.en, sk.ru || '', sk.kr || '']);
      }
    }
    for (const sc of ud.classCoreClasses || []) {
      lines.push(['classCore', sc.en, sc.ru || '', sc.kr || '']);
      for (const sk of sc.skills || []) {
        if (sk && sk.en) lines.push(['classcore', sk.en, sk.ru || '', sk.kr || '']);
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

async function exportSettings() {
  const st = document.getElementById('ioStatus');
  try {
    const sync = await chrome.storage.sync.get([
      'termMode', 'termModeReplaceSites', 'termModeAnnotateSites', 'termModeBracketsSites',
      'siteMode', 'allowedSites', 'blockedSites', 'developerSites'
    ]);
    const local = await chrome.storage.local.get(['customPatterns']);
    const payload = {
      type: 'lost-ark-translator-settings',
      version: 1,
      termMode: sync.termMode || 'replace',
      termModeReplaceSites: sync.termModeReplaceSites || '',
      termModeAnnotateSites: sync.termModeAnnotateSites || '',
      termModeBracketsSites: sync.termModeBracketsSites || '',
      siteMode: sync.siteMode || 'everywhere',
      allowedSites: sync.allowedSites || '',
      blockedSites: sync.blockedSites || '',
      developerSites: sync.developerSites || DEFAULT_DEV_SITES.join('\n'),
      customPatterns: local.customPatterns || []
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lost-ark-translator-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    if (st) {
      st.textContent = t.exportSettingsOk;
      st.className = 'status ok';
      setTimeout(() => { st.textContent = ''; }, 3000);
    }
  } catch (e) {
    if (st) {
      st.textContent = (t.clearDictErr || 'Error: ') + (e.message || e);
      st.className = 'status err';
    }
  }
}

async function importSettings(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const st = document.getElementById('ioStatus');
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || data.type !== 'lost-ark-translator-settings') {
      throw new Error('invalid settings file');
    }
    const syncUpdates = {};
    if (data.termMode) syncUpdates.termMode = data.termMode;
    if (typeof data.termModeReplaceSites === 'string') syncUpdates.termModeReplaceSites = data.termModeReplaceSites;
    if (typeof data.termModeAnnotateSites === 'string') syncUpdates.termModeAnnotateSites = data.termModeAnnotateSites;
    if (typeof data.termModeBracketsSites === 'string') syncUpdates.termModeBracketsSites = data.termModeBracketsSites;
    if (data.siteMode) syncUpdates.siteMode = data.siteMode;
    if (typeof data.allowedSites === 'string') syncUpdates.allowedSites = data.allowedSites;
    if (typeof data.blockedSites === 'string') syncUpdates.blockedSites = data.blockedSites;
    if (typeof data.developerSites === 'string') syncUpdates.developerSites = data.developerSites;
    await chrome.storage.sync.set(syncUpdates);
    if (Array.isArray(data.customPatterns)) {
      await chrome.storage.local.set({ customPatterns: data.customPatterns });
      await chrome.runtime.sendMessage({ action: 'setCustomPatterns', patterns: data.customPatterns });
    }
    const trs = document.getElementById('termModeReplaceSites');
    if (trs && typeof data.termModeReplaceSites === 'string') trs.value = data.termModeReplaceSites;
    const tas = document.getElementById('termModeAnnotateSites');
    if (tas && typeof data.termModeAnnotateSites === 'string') tas.value = data.termModeAnnotateSites;
    const tbs = document.getElementById('termModeBracketsSites');
    if (tbs && typeof data.termModeBracketsSites === 'string') tbs.value = data.termModeBracketsSites;
    const siteModeEl = document.getElementById('siteMode');
    if (siteModeEl && data.siteMode) siteModeEl.value = data.siteMode;
    updateSitesListUI(data.siteMode || 'everywhere', {
      allowedSites: data.allowedSites,
      blockedSites: data.blockedSites,
      developerSites: data.developerSites
    });
    renderPatterns(Array.isArray(data.customPatterns) ? data.customPatterns : []);
    if (st) {
      st.textContent = t.importSettingsOk;
      st.className = 'status ok';
      setTimeout(() => { st.textContent = ''; }, 3000);
    }
  } catch (err) {
    if (st) {
      st.textContent = (t.clearDictErr || 'Error: ') + (err.message || err);
      st.className = 'status err';
    }
  }
}

async function clearDictionary() {
  if (!confirm(t.clearDictConfirm)) return;
  const st = document.getElementById('clearDictStatus');
  try {
    const res = await chrome.runtime.sendMessage({ action: 'clearDictionary' });
    if (!res || !res.success) throw new Error(res && res.error ? res.error : 'failed');
    if (st) {
      st.textContent = t.clearDictOk;
      st.className = 'status ok';
      setTimeout(() => { st.textContent = ''; }, 3000);
    }
    loadUserWords();
  } catch (e) {
    if (st) {
      st.textContent = t.clearDictErr + (e.message || e);
      st.className = 'status err';
    }
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
      skillClasses: ud.skillClasses || [],
      arkPassClasses: ud.arkPassClasses || [],
      classCoreClasses: ud.classCoreClasses || []
    };
    const total = payload.classes.length + payload.engravings.length +
      payload._orphanBuilds.length + payload.terms.length + payload.skills.length +
      payload.skillClasses.length + payload.arkPassClasses.length + payload.classCoreClasses.length;
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
