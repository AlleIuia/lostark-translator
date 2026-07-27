if (location.search.includes('standalone')) {
  window.addEventListener('DOMContentLoaded', () => {
    const borderX = window.outerWidth - window.innerWidth;
    const borderY = window.outerHeight - window.innerHeight;
    window.resizeTo(450 + borderX, 600 + borderY);
  });
}

const SYNC_URLS = [
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-classes.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-engravings.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-interface.json'
];

const UI_TEXTS = {
  ru: {
    active: 'Активно',
    disabled: 'Выключено',
    searchPlaceholder: 'Поиск...',
    addTitle: 'Добавить',
    syncTitle: 'Синхронизировать',
    exportTitle: 'Экспорт',
    importTitle: 'Импорт',
    saveNewTitle: 'Сохранить',
    cancelAddTitle: 'Отмена',
    detachTitle: 'Открыть в отдельном окне',
    sitesLabel: 'САЙТЫ',
    siteModeEverywhere: 'Везде',
    siteModeAllowlist: 'Только разрешенные',
    siteModeBlocklist: 'Кроме запрещенных',
    sitesPlaceholder: 'По одного домену на строку\nloawa.com\ninven.co.kr',
    syncLoading: 'Загрузка…',
    syncOk: 'Словарь обновлён',
    syncErr: 'Ошибка синхронизации: ',
    importErrorFormat: 'Неверный формат файла. Ожидается объект с полями classes, terms и т.д.',
    importErrorJson: 'Ошибка чтения JSON: '
  },
  en: {
    active: 'Active',
    disabled: 'Disabled',
    searchPlaceholder: 'Search...',
    addTitle: 'Add',
    syncTitle: 'Sync',
    exportTitle: 'Export',
    importTitle: 'Import',
    saveNewTitle: 'Save',
    cancelAddTitle: 'Cancel',
    detachTitle: 'Open in separate window',
    sitesLabel: 'SITES',
    siteModeEverywhere: 'Everywhere',
    siteModeAllowlist: 'Allowed only',
    siteModeBlocklist: 'Except blocked',
    sitesPlaceholder: 'One domain per line\nloawa.com\ninven.co.kr',
    syncLoading: 'Loading…',
    syncOk: 'Dictionary updated',
    syncErr: 'Sync error: ',
    importErrorFormat: 'Invalid file format.',
    importErrorJson: 'JSON read error: '
  },
  kr: {
    active: '활성화',
    disabled: '비활성화',
    searchPlaceholder: '검색...',
    addTitle: '추가',
    syncTitle: '동기화',
    exportTitle: '내보내기',
    importTitle: '가져오기',
    saveNewTitle: '저장',
    cancelAddTitle: '취소',
    detachTitle: '별도 창에서 열기',
    sitesLabel: '사이트',
    siteModeEverywhere: '전체',
    siteModeAllowlist: '허용 목록만',
    siteModeBlocklist: '차단 목록 제외',
    sitesPlaceholder: '줄당 하나의 도메인\nloawa.com\ninven.co.kr',
    syncLoading: '로딩 중…',
    syncOk: '사전 업데이트됨',
    syncErr: '동기화 오류: ',
    importErrorFormat: '잘못된 파일 형식입니다.',
    importErrorJson: 'JSON 읽기 오류: '
  }
};

let fullData = { classes: [], engravings: [], _orphanBuilds: [], terms: [] };
let isEnabled = true;
let targetLang = 'ru';
let currentTheme = 'dark';
let isStandalone = false;
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  isStandalone = new URLSearchParams(location.search).has('standalone');
  if (isStandalone) document.body.classList.add('standalone');
  loadData();
  setupListeners();
  checkTempSelection();
});

function applyLocalization() {
  const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  const addBtn = document.getElementById('addBtn');
  if (addBtn) addBtn.title = t.addTitle;

  const syncBtn = document.getElementById('syncBtn');
  if (syncBtn) syncBtn.title = t.syncTitle;

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.title = t.exportTitle;

  const importBtn = document.getElementById('importBtn');
  if (importBtn) importBtn.title = t.importTitle;

  const detachBtn = document.getElementById('detachBtn');
  if (detachBtn) detachBtn.title = t.detachTitle;

  const saveNewBtn = document.getElementById('saveNewBtn');
  if (saveNewBtn) saveNewBtn.textContent = t.saveNewTitle;

  const cancelAddBtn = document.getElementById('cancelAddBtn');
  if (cancelAddBtn) cancelAddBtn.textContent = t.cancelAddTitle;

  const sitesTitle = document.getElementById('sitesTitle') || document.querySelector('#sitesHeader span');
  if (sitesTitle) sitesTitle.textContent = t.sitesLabel;

  const siteMode = document.getElementById('siteMode');
  if (siteMode) {
    if (siteMode.options[0]) siteMode.options[0].textContent = t.siteModeEverywhere;
    if (siteMode.options[1]) siteMode.options[1].textContent = t.siteModeAllowlist;
    if (siteMode.options[2]) siteMode.options[2].textContent = t.siteModeBlocklist;
  }

  const sitesList = document.getElementById('sitesList');
  if (sitesList) sitesList.placeholder = t.sitesPlaceholder;

  updateStatus();
}

function loadData() {
  chrome.storage.sync.get(['isEnabled','targetLang','theme','siteMode','allowedSites','blockedSites'], (syncResult) => {
    targetLang = syncResult.targetLang || 'ru';
    currentTheme = syncResult.theme || 'dark';
    isEnabled = syncResult.isEnabled !== false;

    document.getElementById('toggleEnabled').checked = isEnabled;
    document.getElementById('themeToggle').checked = currentTheme === 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    const siteMode = syncResult.siteMode || 'everywhere';
    document.getElementById('siteMode').value = siteMode;
    if (siteMode === 'allowlist') {
      document.getElementById('sitesList').value = syncResult.allowedSites || '';
    } else if (siteMode === 'blocklist') {
      document.getElementById('sitesList').value = syncResult.blockedSites || '';
    } else {
      document.getElementById('sitesList').value = '';
    }

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === targetLang);
    });

    applyLocalization();
  });

  chrome.storage.local.get(['fullData'], (localResult) => {
    fullData = localResult.fullData || { classes: [], engravings: [], _orphanBuilds: [], terms: [] };
    renderList();
  });
}

function updateStatus() {
  const statusEl = document.getElementById('status');
  if (!statusEl) return;
  const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;
  statusEl.textContent = isEnabled ? t.active : t.disabled;
  statusEl.className = 'status ' + (isEnabled ? 'active' : 'disabled');
}

function setupListeners() {
  document.getElementById('toggleEnabled').addEventListener('change', (e) => {
    isEnabled = e.target.checked;
    chrome.storage.sync.set({ isEnabled });
    updateStatus();
    chrome.runtime.sendMessage({ action: 'toggle', enabled: isEnabled });
  });

  document.getElementById('themeToggle').addEventListener('change', (e) => {
    currentTheme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    chrome.storage.sync.set({ theme: currentTheme });
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      targetLang = btn.dataset.lang;
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chrome.storage.sync.set({ targetLang });
      applyLocalization();
      chrome.runtime.sendMessage({ action: 'rebuildDictionary' });
      setTimeout(reloadData, 150);
    });
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderList();
  });

  document.getElementById('addBtn').addEventListener('click', () => {
    const form = document.getElementById('addForm');
    form.style.display = form.style.display === 'flex' ? 'none' : 'flex';
    if (form.style.display === 'flex') document.getElementById('newEn').focus();
  });

  document.getElementById('cancelAddBtn').addEventListener('click', () => {
    document.getElementById('addForm').style.display = 'none';
    clearAddForm();
  });

  document.getElementById('saveNewBtn').addEventListener('click', saveNewEntry);

  document.getElementById('syncBtn').addEventListener('click', syncDictionary);
  document.getElementById('exportBtn').addEventListener('click', exportDictionary);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importDictionary);

  document.getElementById('detachBtn').addEventListener('click', () => {
    chrome.windows.create({
     url: 'popup.html?standalone=true',
     type: 'popup',
     width: 450,
     height: 600
    });
  });

  document.getElementById('sitesHeader').addEventListener('click', () => {
    document.getElementById('sitesBody').classList.toggle('open');
    document.getElementById('sitesArrow').classList.toggle('open');
  });

  document.getElementById('siteMode').addEventListener('change', (e) => {
    const mode = e.target.value;
    const updates = { siteMode: mode };
    if (mode === 'allowlist') updates.allowedSites = document.getElementById('sitesList').value;
    else if (mode === 'blocklist') updates.blockedSites = document.getElementById('sitesList').value;
    chrome.storage.sync.set(updates);
  });

  let siteTimeout;
  document.getElementById('sitesList').addEventListener('input', (e) => {
    clearTimeout(siteTimeout);
    siteTimeout = setTimeout(() => {
      const mode = document.getElementById('siteMode').value;
      const updates = {};
      if (mode === 'allowlist') updates.allowedSites = e.target.value;
      else if (mode === 'blocklist') updates.blockedSites = e.target.value;
      if (Object.keys(updates).length) chrome.storage.sync.set(updates);
    }, 500);
  });
}

function clearAddForm() {
  document.getElementById('newEn').value = '';
  document.getElementById('newRu').value = '';
  document.getElementById('newKr').value = '';
}

function reloadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['fullData'], (localResult) => {
      fullData = localResult.fullData || { classes: [], engravings: [], _orphanBuilds: [], terms: [] };
      renderList();
      resolve();
    });
  });
}

function createCell(text, className = '', dataset = {}) {
  const td = document.createElement('td');
  if (className) td.className = className;
  td.textContent = text || '';
  Object.assign(td.dataset, dataset);
  return td;
}

function addDeleteButton(row, type, en, classEn) {
  const td = document.createElement('td');
  td.style.width = '34px';
  td.style.textAlign = 'center';
  
  const btn = document.createElement('button');
  btn.className = 'btn-del';
  btn.textContent = '×';
  btn.title = 'Удалить';
  btn.addEventListener('click', async () => {
    if (!confirm('Удалить запись?')) return;
    try {
      const res = await chrome.runtime.sendMessage({ action: 'deleteEntry', type, en, classEn });
      if (res.success) await reloadData();
    } catch (e) { console.error(e); }
  });
  
  td.appendChild(btn);
  row.appendChild(td);
}

function renderList() {
  const tbody = document.getElementById('wordList');
  tbody.innerHTML = '';
  const search = currentSearch;

  for (const cls of fullData.classes || []) {
    const clsMatch = !search || [cls.en, cls.ru, cls.kr].some(v => v && v.toLowerCase().includes(search));
    const matchedBuilds = (cls.builds || []).filter(b =>
      !search || [b.en, b.ru, b.kr].some(v => v && v.toLowerCase().includes(search))
    );

    if (!clsMatch && matchedBuilds.length === 0) continue;

    const trClass = document.createElement('tr');
    trClass.className = 'class-row';
    trClass.appendChild(createCell(cls.en, 'editable', { type: 'class', field: 'en', class: cls.en }));
    trClass.appendChild(createCell(cls.ru, 'editable', { type: 'class', field: 'ru', class: cls.en }));
    trClass.appendChild(createCell(cls.kr, 'editable kr-cell', { type: 'class', field: 'kr', class: cls.en }));
    tbody.appendChild(trClass);

    const buildsToShow = clsMatch ? (cls.builds || []) : matchedBuilds;
    for (const b of buildsToShow) {
      const trBuild = document.createElement('tr');
      trBuild.className = 'build-row';
      trBuild.appendChild(createCell(b.en, 'editable en-cell', { type: 'build', field: 'en', class: cls.en, build: b.en }));
      trBuild.appendChild(createCell(b.ru, 'editable', { type: 'build', field: 'ru', class: cls.en, build: b.en }));
      trBuild.appendChild(createCell(b.kr, 'editable kr-cell', { type: 'build', field: 'kr', class: cls.en, build: b.en }));
      tbody.appendChild(trBuild);
    }
  }

  for (const o of fullData._orphanBuilds || []) {
    if (search && ![o.en, o.ru, o.kr].some(v => v && v.toLowerCase().includes(search))) continue;

    const tr = document.createElement('tr');
    tr.className = 'orphan-row';
    tr.appendChild(createCell(o.en, 'editable en-cell', { type: 'orphan', field: 'en', en: o.en }));
    tr.appendChild(createCell(o.ru, 'editable', { type: 'orphan', field: 'ru', en: o.en }));
    tr.appendChild(createCell(o.kr, 'editable kr-cell', { type: 'orphan', field: 'kr', en: o.en }));
    tbody.appendChild(tr);
  }

  for (const term of fullData.terms || []) {
    if (search && ![term.en, term.ru, term.kr].some(v => v && v.toLowerCase().includes(search))) continue;

    const tr = document.createElement('tr');
    tr.className = 'orphan-row';
    tr.appendChild(createCell(term.en, 'editable en-cell', { type: 'term', field: 'en', en: term.en }));
    tr.appendChild(createCell(term.ru, 'editable', { type: 'term', field: 'ru', en: term.en }));
    tr.appendChild(createCell(term.kr, 'editable kr-cell', { type: 'term', field: 'kr', en: term.en }));
    tbody.appendChild(tr);
  }

  setupEditableCells();
}

function setupEditableCells() {
  document.querySelectorAll('.editable').forEach(cell => {
    cell.addEventListener('click', function handler() {
      if (this.isContentEditable) return;
      this.contentEditable = true;
      this.focus();
      this.dataset.original = this.textContent;

      const save = async () => {
        this.removeEventListener('blur', onBlur);
        this.removeEventListener('keydown', onKeydown);
        this.contentEditable = false;
        const newVal = this.textContent.trim();
        if (newVal === this.dataset.original) return;

        const type = this.dataset.type;
        const field = this.dataset.field;
        const oldEn = this.dataset.en || this.dataset.build || this.dataset.class;
        const classEn = this.dataset.class;

        let msg;
        if (type === 'orphan') {
          const o = fullData._orphanBuilds.find(x => x.en === oldEn);
          if (!o) return;
          msg = { action: 'updateEntry', oldEn, type: 'orphan', data: { ...o, [field]: newVal } };
        } else if (type === 'class') {
          const c = fullData.classes.find(x => x.en === classEn);
          if (!c) return;
          msg = { action: 'updateEntry', oldEn: classEn, type: 'class', data: { ...c, [field]: newVal } };
        } else if (type === 'build') {
          const c = fullData.classes.find(x => x.en === classEn);
          if (!c) return;
          const b = c.builds.find(x => x.en === oldEn);
          if (!b) return;
          msg = { action: 'updateEntry', oldEn, type: 'build', classEn, data: { ...b, [field]: newVal } };
        } else if (type === 'term') {
          const t = fullData.terms.find(x => x.en === oldEn);
          if (!t) return;
          msg = { action: 'updateEntry', oldEn, type: 'term', data: { ...t, [field]: newVal } };
        }

        if (msg) {
          try {
            const res = await chrome.runtime.sendMessage(msg);
            if (res.success) await reloadData();
          } catch (e) { console.error(e); }
        }
      };

      const onBlur = () => save();
      const onKeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
        else if (e.key === 'Escape') {
          this.textContent = this.dataset.original;
          this.contentEditable = false;
          this.removeEventListener('blur', onBlur);
          this.removeEventListener('keydown', onKeydown);
        }
      };

      this.addEventListener('blur', onBlur, { once: true });
      this.addEventListener('keydown', onKeydown);
    });
  });
}

async function saveNewEntry() {
  const en = document.getElementById('newEn').value.trim();
  const ru = document.getElementById('newRu').value.trim();
  const kr = document.getElementById('newKr').value.trim();
  if (!en) return;

  let msg = { action: 'addEntry', type: 'orphan', data: { en, ru, kr } };
  try {
    const res = await chrome.runtime.sendMessage(msg);
    if (res.success) {
      clearAddForm();
      document.getElementById('addForm').style.display = 'none';
      await reloadData();
    }
  } catch (e) { console.error(e); }
}

async function syncDictionary() {
  const statusEl = document.getElementById('syncStatus');
  const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;
  statusEl.textContent = t.syncLoading;
  statusEl.className = 'sync-status';

  try {
    const res = await chrome.runtime.sendMessage({ action: 'syncUrls', urls: SYNC_URLS });
    if (res.success) {
      statusEl.textContent = t.syncOk + (res.count ? ` (+${res.count})` : '');
      statusEl.className = 'sync-status ok';
      await reloadData();
    } else {
      throw new Error(res.error);
    }
  } catch (e) {
    statusEl.textContent = t.syncErr + e.message;
    statusEl.className = 'sync-status err';
  }
  setTimeout(() => { statusEl.textContent = ''; }, 4000);
}

function exportDictionary() {
  const dataStr = JSON.stringify(fullData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lostark-dictionary-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importDictionary(e) {
  const file = e.target.files[0];
  if (!file) return;
  const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;
  const statusEl = document.getElementById('syncStatus');

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data.classes && !data._orphanBuilds && !data.terms) {
        statusEl.textContent = t.importErrorFormat;
        statusEl.className = 'sync-status err';
        return;
      }
      const res = await chrome.runtime.sendMessage({ action: 'importData', data });
      if (res.success) {
        statusEl.textContent = t.syncOk;
        statusEl.className = 'sync-status ok';
        await reloadData();
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      statusEl.textContent = t.importErrorJson + err.message;
      statusEl.className = 'sync-status err';
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

function checkTempSelection() {
  chrome.storage.sync.get('tempSelection', (result) => {
    if (result.tempSelection) {
      document.getElementById('searchInput').value = result.tempSelection;
      currentSearch = result.tempSelection.toLowerCase();
      renderList();
      chrome.storage.sync.remove('tempSelection');
      document.getElementById('addForm').style.display = 'flex';
      document.getElementById('newEn').value = result.tempSelection;
    }
  });
}
