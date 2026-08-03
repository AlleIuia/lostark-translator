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
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-interface.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-skills.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-arkpass.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-classcore.json'
];

const UI_TEXTS = {
  ru: {
    active: 'Активно', disabled: 'Выключено', searchPlaceholder: 'Поиск...',
    addTitle: 'Добавить', syncTitle: 'Синхронизировать', exportTitle: 'Экспорт',
    importTitle: 'Импорт', saveNewTitle: 'Сохранить', cancelAddTitle: 'Отмена',
    deleteModeTitle: 'Удаление',
    deleteConfirm: 'Удалить запись?',
    detachTitle: 'Открыть в отдельном окне', optionsTitle: 'Настройки',
    filterAll: 'Все', filterClasses: 'Классы', filterEngravings: 'Гравировки',
    filterTerms: 'Термины', filterSkills: 'Умения', filterArkpass: 'Система А.Р.К.', filterClasscore: 'Ядра', filterOrphans: 'Прочее',
    sectionClasses: 'Классы / Сборки', sectionEngravings: 'Гравировки',
    sectionTerms: 'Термины', sectionSkills: 'Умения', sectionArkpass: 'Система А.Р.К.', sectionClasscore: 'Ядра', sectionOrphans: 'Прочее',
    typeOrphan: 'Прочее', typeTerm: 'Термин', typeSkill: 'Умение',
    typeEngraving: 'Гравировка', typeBuild: 'Сборка', typeClass: 'Класс',
    typeArkpass: 'Система А.Р.К.', typeClasscore: 'Ядра',
    statsLabel: 'переведено: ',
    termModeReplace: 'ЗА', termModeAnnotate: 'ПД', termModeBrackets: 'СК',
    termModeReplaceTitle: 'Замена', termModeAnnotateTitle: 'Подсказка', termModeBracketsTitle: 'Скобки',
    syncLoading: 'Загрузка…', syncOk: 'Словарь обновлён', syncErr: 'Ошибка синхронизации: ',
    importErrorFormat: 'Неверный формат файла.', importErrorJson: 'Ошибка чтения JSON: '
  },
  en: {
    active: 'Active', disabled: 'Disabled', searchPlaceholder: 'Search...',
    addTitle: 'Add', syncTitle: 'Sync', exportTitle: 'Export',
    importTitle: 'Import', saveNewTitle: 'Save', cancelAddTitle: 'Cancel',
    deleteModeTitle: 'Delete',
    deleteConfirm: 'Delete this entry?',
    detachTitle: 'Open in separate window', optionsTitle: 'Settings',
    filterAll: 'All', filterClasses: 'Classes', filterEngravings: 'Engravings',
    filterTerms: 'Terms', filterSkills: 'Skills', filterArkpass: 'Ark Passive', filterClasscore: 'Cores', filterOrphans: 'Other',
    sectionClasses: 'Classes / Builds', sectionEngravings: 'Engravings',
    sectionTerms: 'Terms', sectionSkills: 'Skills', sectionArkpass: 'Ark Passive', sectionClasscore: 'Cores', sectionOrphans: 'Other',
    typeOrphan: 'Other', typeTerm: 'Term', typeSkill: 'Skill',
    typeEngraving: 'Engraving', typeBuild: 'Build', typeClass: 'Class',
    typeArkpass: 'Ark Passive', typeClasscore: 'Core',
    statsLabel: 'translated: ',
    termModeReplace: 'RE', termModeAnnotate: 'TT', termModeBrackets: 'BR',
    termModeReplaceTitle: 'Replace', termModeAnnotateTitle: 'Tooltip', termModeBracketsTitle: 'Brackets',
    syncLoading: 'Loading…', syncOk: 'Dictionary updated', syncErr: 'Sync error: ',
    importErrorFormat: 'Invalid file format.', importErrorJson: 'JSON read error: '
  },
  kr: {
    active: '활성화', disabled: '비활성화', searchPlaceholder: '검색...',
    addTitle: '추가', syncTitle: '동기화', exportTitle: '내보내기',
    importTitle: '가져오기', saveNewTitle: '저장', cancelAddTitle: '취소',
    deleteModeTitle: '삭제',
    deleteConfirm: '이 항목을 삭제할까요?',
    detachTitle: '별도 창에서 열기', optionsTitle: '설정',
    filterAll: '전체', filterClasses: '직업', filterEngravings: '각인',
    filterTerms: '용어', filterSkills: '스킬', filterArkpass: '아크 패시브', filterClasscore: '코어', filterOrphans: '기타',
    sectionClasses: '직업 / 빌드', sectionEngravings: '각인',
    sectionTerms: '용어', sectionSkills: '스킬', sectionArkpass: '아크 패시브', sectionClasscore: '코어', sectionOrphans: '기타',
    typeOrphan: '기타', typeTerm: '용어', typeSkill: '스킬',
    typeEngraving: '각인', typeBuild: '빌드', typeClass: '직업',
    typeArkpass: '아크 패시브', typeClasscore: '코어',
    statsLabel: '번역됨: ',
    termModeReplace: '교', termModeAnnotate: '팁', termModeBrackets: '괄',
    termModeReplaceTitle: '교체', termModeAnnotateTitle: '툴팁', termModeBracketsTitle: '괄호',
    syncLoading: '로딩 중…', syncOk: '사전 업데이트됨', syncErr: '동기화 오류: ',
    importErrorFormat: '잘못된 파일 형식입니다.', importErrorJson: 'JSON 읽기 오류: '
  }
};

let fullData = { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [] };
let isEnabled = true;
let targetLang = 'ru';
let termMode = 'replace';
let currentTheme = 'dark';
let isStandalone = false;
let currentSearch = '';
let currentFilter = 'all';
let deleteMode = false;


function installPlainPaste(root) {
  const target = root || document;
  target.addEventListener('paste', (e) => {
    const el = e.target;
    if (!el) return;
    const isEditable = el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
    if (!isEditable) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (el.isContentEditable) {
      document.execCommand('insertText', false, text);
    } else {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const val = el.value || '';
      el.value = val.slice(0, start) + text + val.slice(end);
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  isStandalone = new URLSearchParams(location.search).has('standalone');
  if (isStandalone) {
    document.body.classList.add('standalone');
    document.title = 'LA Translator';
  }
  loadData();
  setupListeners();
  installPlainPaste(document);
  checkTempSelection();
  refreshPageStats();
});

function applyLocalization() {
  const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
  const map = {
    addBtn: t.addTitle, syncBtn: t.syncTitle, deleteModeBtn: t.deleteModeTitle,
    detachBtn: t.detachTitle, optionsBtn: t.optionsTitle,
    saveNewBtn: t.saveNewTitle, cancelAddBtn: t.cancelAddTitle
  };
  for (const [id, title] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (id === 'saveNewBtn' || id === 'cancelAddBtn') el.textContent = title;
    else el.title = title;
  }
  const filters = {
    all: t.filterAll, classes: t.filterClasses, engravings: t.filterEngravings,
    terms: t.filterTerms, skills: t.filterSkills, arkpass: t.filterArkpass,
    classcore: t.filterClasscore, orphans: t.filterOrphans
  };
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const f = btn.dataset.filter;
    if (filters[f]) btn.textContent = filters[f];
  });
  document.querySelectorAll('.term-mode-btn').forEach(btn => {
    const m = btn.dataset.termMode;
    if (m === 'replace') {
      btn.textContent = t.termModeReplace;
      btn.title = t.termModeReplaceTitle;
    } else if (m === 'annotate') {
      btn.textContent = t.termModeAnnotate;
      btn.title = t.termModeAnnotateTitle;
    } else if (m === 'brackets') {
      btn.textContent = t.termModeBrackets;
      btn.title = t.termModeBracketsTitle;
    }
    btn.classList.toggle('active', m === termMode);
  });

  const typeSel = document.getElementById('newType');
  if (typeSel) {
    const typeLabels = {
      orphan: t.typeOrphan,
      term: t.typeTerm,
      skill: t.typeSkill,
      engraving: t.typeEngraving,
      build: t.typeBuild,
      class: t.typeClass,
      arkpass: t.typeArkpass,
      classcore: t.typeClasscore
    };
    for (const opt of typeSel.options) {
      if (typeLabels[opt.value]) opt.textContent = typeLabels[opt.value];
    }
  }
  updateStatus();
}

function loadData() {
  chrome.storage.sync.get(['isEnabled', 'targetLang', 'theme', 'termMode'], (syncResult) => {
    targetLang = syncResult.targetLang || 'ru';
    termMode = syncResult.termMode || 'replace';
    currentTheme = syncResult.theme || 'dark';
    isEnabled = syncResult.isEnabled !== false;
    document.getElementById('toggleEnabled').checked = isEnabled;
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.dataset.lang) btn.classList.toggle('active', btn.dataset.lang === targetLang);
    });
    document.querySelectorAll('.term-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.termMode === termMode);
    });
    applyLocalization();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.url) return;
      let host = '';
      try { host = new URL(tab.url).hostname.replace(/^www\./, '').toLowerCase(); } catch (_) { return; }
      if (!host) return;
      chrome.storage.local.get(['siteProfiles'], (local) => {
        const profiles = local.siteProfiles || {};
        const p = profiles[host];
        if (p && p.termMode) {
          termMode = p.termMode;
          document.querySelectorAll('.term-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.termMode === termMode);
          });
        }
        const stats = document.getElementById('pageStats');
        if (stats && host) {
          const base = stats.textContent || '';
          if (!base.includes(host)) {
            /* keep stats; domain shown via title on mode buttons context */
          }
        }
        const statusBar = document.querySelector('.status-bar');
        let siteLabel = document.getElementById('siteProfileLabel');
        if (!siteLabel && statusBar) {
          siteLabel = document.createElement('span');
          siteLabel.id = 'siteProfileLabel';
          siteLabel.style.cssText = 'opacity:0.75;font-size:10px;margin-left:6px;';
          statusBar.appendChild(siteLabel);
        }
        if (siteLabel) siteLabel.textContent = host + (p && p.termMode ? ' · site' : '');
      });
    });
  });
  chrome.runtime.sendMessage({ action: 'reloadLocalDictionaries' }, () => {
    chrome.storage.local.get(['fullData'], (localResult) => {
      fullData = localResult.fullData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [] };
      renderList();
    });
  });
}

function updateStatus() {
  const statusEl = document.getElementById('status');
  if (!statusEl) return;
  const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;
  statusEl.textContent = isEnabled ? t.active : t.disabled;
  statusEl.className = 'status ' + (isEnabled ? 'active' : 'disabled');
}

function refreshPageStats() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const el = document.getElementById('pageStats');
    if (!el) return;
    const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;
    if (!tabs[0] || !tabs[0].id) {
      el.textContent = '';
      return;
    }
    try {
      const res = await chrome.tabs.sendMessage(tabs[0].id, { action: 'getStats' });
      if (res && res.success) {
        el.textContent = t.statsLabel + (res.count || 0);
      } else {
        el.textContent = '';
      }
    } catch (_) {
      el.textContent = '';
    }
  });
}

function setupListeners() {
  document.getElementById('toggleEnabled').addEventListener('change', (e) => {
    isEnabled = e.target.checked;
    chrome.storage.sync.set({ isEnabled });
    updateStatus();
    chrome.runtime.sendMessage({ action: 'toggle', enabled: isEnabled });
    setTimeout(refreshPageStats, 300);
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (!btn.dataset.lang) return;
    btn.addEventListener('click', () => {
      targetLang = btn.dataset.lang;
      document.querySelectorAll('.lang-btn').forEach(b => {
        if (b.dataset.lang) b.classList.remove('active');
      });
      btn.classList.add('active');
      chrome.storage.sync.set({ targetLang });
      applyLocalization();
      chrome.runtime.sendMessage({ action: 'rebuildDictionary' });
      setTimeout(reloadData, 150);
    });
  });

  document.querySelectorAll('.term-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      termMode = btn.dataset.termMode;
      document.querySelectorAll('.term-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chrome.storage.sync.set({ termMode });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        if (!tab || !tab.url) return;
        let host = '';
        try { host = new URL(tab.url).hostname.replace(/^www\./, '').toLowerCase(); } catch (_) { return; }
        if (!host || host.startsWith('chrome')) return;
        chrome.storage.local.get(['siteProfiles'], (local) => {
          const profiles = Object.assign({}, local.siteProfiles || {});
          const prev = profiles[host] || {};
          profiles[host] = Object.assign({}, prev, { termMode: termMode });
          chrome.storage.local.set({ siteProfiles: profiles });
        });
      });
    });
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderList();
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderList();
    });
  });

  document.getElementById('deleteModeBtn').addEventListener('click', () => {
    deleteMode = !deleteMode;
    document.getElementById('deleteModeBtn').classList.toggle('delete-mode-on', deleteMode);
    renderList();
  });

  document.getElementById('addBtn').addEventListener('click', () => {
    const form = document.getElementById('addForm');
    form.style.display = form.style.display === 'flex' ? 'none' : 'flex';
    if (form.style.display === 'flex') {
      const type = document.getElementById('newType').value;
      if (type === 'build' || type === 'skill' || type === 'arkpass' || type === 'classcore') {
        document.getElementById('newParent').style.display = '';
        populateParentSelect(type);
      }
      document.getElementById('newEn').focus();
    }
  });

  document.getElementById('newType').addEventListener('change', () => {
    const type = document.getElementById('newType').value;
    const parentSel = document.getElementById('newParent');
    if (type === 'build' || type === 'skill' || type === 'arkpass' || type === 'classcore') {
      parentSel.style.display = '';
      populateParentSelect(type);
    } else {
      parentSel.style.display = 'none';
    }
  });

  document.getElementById('cancelAddBtn').addEventListener('click', () => {
    document.getElementById('addForm').style.display = 'none';
    clearAddForm();
  });

  document.getElementById('saveNewBtn').addEventListener('click', saveNewEntry);
  document.getElementById('syncBtn').addEventListener('click', syncDictionary);

  document.getElementById('detachBtn').addEventListener('click', () => {
    chrome.windows.create({
      url: 'popup.html?standalone=true',
      type: 'popup',
      width: 450,
      height: 600
    });
  });

  document.getElementById('optionsBtn').addEventListener('click', () => {
    chrome.windows.create({
      url: 'options.html',
      type: 'popup',
      width: 520,
      height: 640
    });
  });
}

function populateParentSelect(type) {
  const sel = document.getElementById('newParent');
  sel.innerHTML = '';
  let list;
  if (type === 'skill') {
    list = (fullData.skillClasses || []).concat(
      (fullData.classes || []).filter(c => !(fullData.skillClasses || []).some(s => s.en === c.en))
    );
  } else if (type === 'arkpass') {
    list = fullData.arkPassClasses || fullData.classes || [];
  } else if (type === 'classcore') {
    list = fullData.classCoreClasses || fullData.classes || [];
  } else {
    list = fullData.classes || [];
  }
  for (const cls of list) {
    const opt = document.createElement('option');
    opt.value = cls.en;
    opt.textContent = (cls[targetLang] && String(cls[targetLang]).trim()) ? cls[targetLang] : cls.en;
    sel.appendChild(opt);
  }
}

function clearAddForm() {
  document.getElementById('newEn').value = '';
  document.getElementById('newRu').value = '';
  document.getElementById('newKr').value = '';
  document.getElementById('newType').value = 'orphan';
  document.getElementById('newParent').style.display = 'none';
}

function reloadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['fullData'], (localResult) => {
      fullData = localResult.fullData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [] };
      renderList();
      resolve();
    });
  });
}


function createDeleteCell(type, en, classEn) {
  const td = document.createElement('td');
  td.className = 'col-actions';
  const btn = document.createElement('button');
  btn.className = 'btn-del';
  btn.textContent = '×';
  btn.title = (UI_TEXTS[targetLang] || UI_TEXTS.ru).deleteModeTitle;
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await chrome.runtime.sendMessage({
        action: 'deleteEntry',
        type,
        en,
        classEn: classEn || undefined
      });
      if (res && res.success) await reloadData();
    } catch (err) { console.error(err); }
  });
  td.appendChild(btn);
  return td;
}

function createCell(text, className = '', dataset = {}) {
  const td = document.createElement('td');
  if (className) td.className = className;
  td.textContent = text || '';
  Object.assign(td.dataset, dataset);
  return td;
}

function addSectionRow(tbody, label) {
  const tr = document.createElement('tr');
  tr.className = 'section-row';
  const td = document.createElement('td');
  td.colSpan = deleteMode ? 4 : 3;
  td.textContent = label;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

function matchesSearch(obj) {
  if (!currentSearch) return true;
  return [obj.en, obj.ru, obj.kr].some(v => v && v.toLowerCase().includes(currentSearch));
}

function renderList() {
  const tbody = document.getElementById('wordList');
  tbody.innerHTML = '';
  const theadRow = document.querySelector('table thead tr');
  if (theadRow) {
    const existing = theadRow.querySelector('th.col-actions');
    if (deleteMode && !existing) {
      const th = document.createElement('th');
      th.className = 'col-actions';
      th.textContent = '';
      theadRow.appendChild(th);
    } else if (!deleteMode && existing) {
      existing.remove();
    }
  }
  const t = UI_TEXTS[targetLang] || UI_TEXTS.ru;
  const showClasses = currentFilter === 'all' || currentFilter === 'classes';
  const showEngravings = currentFilter === 'all' || currentFilter === 'engravings';
  const showTerms = currentFilter === 'all' || currentFilter === 'terms';
  const showOrphans = currentFilter === 'all' || currentFilter === 'orphans';

  if (showClasses) {
    let anyClass = false;
    for (const cls of fullData.classes || []) {
      const clsMatch = matchesSearch(cls);
      const matchedBuilds = (cls.builds || []).filter(matchesSearch);
      if (!clsMatch && matchedBuilds.length === 0) continue;
      if (!anyClass) {
        addSectionRow(tbody, t.sectionClasses);
        anyClass = true;
      }
      const trClass = document.createElement('tr');
      trClass.className = 'class-row';
      trClass.appendChild(createCell(cls.en, 'editable', { type: 'class', field: 'en', class: cls.en }));
      trClass.appendChild(createCell(cls.ru, 'editable', { type: 'class', field: 'ru', class: cls.en }));
      trClass.appendChild(createCell(cls.kr, 'editable kr-cell', { type: 'class', field: 'kr', class: cls.en }));
      if (deleteMode) trClass.appendChild(createDeleteCell('class', cls.en));
      tbody.appendChild(trClass);
      const buildsToShow = clsMatch ? (cls.builds || []) : matchedBuilds;
      for (const b of buildsToShow) {
        const trBuild = document.createElement('tr');
        trBuild.className = 'build-row';
        trBuild.appendChild(createCell(b.en, 'editable en-cell', { type: 'build', field: 'en', class: cls.en, build: b.en }));
        trBuild.appendChild(createCell(b.ru, 'editable', { type: 'build', field: 'ru', class: cls.en, build: b.en }));
        trBuild.appendChild(createCell(b.kr, 'editable kr-cell', { type: 'build', field: 'kr', class: cls.en, build: b.en }));
        if (deleteMode) trBuild.appendChild(createDeleteCell('build', b.en, cls.en));
        tbody.appendChild(trBuild);
      }
    }
  }

  if (showEngravings) {
    const list = (fullData.engravings || []).filter(matchesSearch);
    if (list.length) {
      addSectionRow(tbody, t.sectionEngravings);
      for (const eng of list) {
        const tr = document.createElement('tr');
        tr.className = 'orphan-row';
        tr.appendChild(createCell(eng.en, 'editable en-cell', { type: 'engraving', field: 'en', en: eng.en }));
        tr.appendChild(createCell(eng.ru, 'editable', { type: 'engraving', field: 'ru', en: eng.en }));
        tr.appendChild(createCell(eng.kr, 'editable kr-cell', { type: 'engraving', field: 'kr', en: eng.en }));
        if (deleteMode) tr.appendChild(createDeleteCell('engraving', eng.en));
        tbody.appendChild(tr);
      }
    }
  }

  if (showTerms) {
    const list = (fullData.terms || []).filter(matchesSearch);
    if (list.length) {
      addSectionRow(tbody, t.sectionTerms);
      for (const term of list) {
        const tr = document.createElement('tr');
        tr.className = 'orphan-row';
        tr.appendChild(createCell(term.en, 'editable en-cell', { type: 'term', field: 'en', en: term.en }));
        tr.appendChild(createCell(term.ru, 'editable', { type: 'term', field: 'ru', en: term.en }));
        tr.appendChild(createCell(term.kr, 'editable kr-cell', { type: 'term', field: 'kr', en: term.en }));
        if (deleteMode) tr.appendChild(createDeleteCell('term', term.en));
        tbody.appendChild(tr);
      }
    }
  }

  const showSkills = currentFilter === 'all' || currentFilter === 'skills';
  if (showSkills) {
    let anySkill = false;
    for (const sc of fullData.skillClasses || []) {
      const clsMatch = matchesSearch(sc);
      const filledSkills = (sc.skills || []).filter(s => s && s.en && String(s.en).trim());
      const skillsWithMatch = filledSkills.filter(s => {
        if (matchesSearch(s)) return true;
        return (s.tripods || []).some(tp => tp && matchesSearch(tp));
      });
      if (!clsMatch && skillsWithMatch.length === 0 && !(currentSearch === '' && filledSkills.length)) continue;
      if (!anySkill) {
        addSectionRow(tbody, t.sectionSkills);
        anySkill = true;
      }
      const trClass = document.createElement('tr');
      trClass.className = 'class-row';
      trClass.appendChild(createCell(sc.en, 'editable', { type: 'skillClass', field: 'en', class: sc.en }));
      trClass.appendChild(createCell(sc.ru, 'editable', { type: 'skillClass', field: 'ru', class: sc.en }));
      trClass.appendChild(createCell(sc.kr, 'editable kr-cell', { type: 'skillClass', field: 'kr', class: sc.en }));
      if (deleteMode) trClass.appendChild(createDeleteCell('skillClass', sc.en));
      tbody.appendChild(trClass);

      const skillsToShow = (!currentSearch || clsMatch) ? filledSkills : skillsWithMatch;
      for (const sk of skillsToShow) {
        const tr = document.createElement('tr');
        tr.className = 'build-row';
        tr.appendChild(createCell(sk.en, 'editable en-cell', { type: 'skill', field: 'en', class: sc.en, build: sk.en }));
        tr.appendChild(createCell(sk.ru, 'editable', { type: 'skill', field: 'ru', class: sc.en, build: sk.en }));
        tr.appendChild(createCell(sk.kr, 'editable kr-cell', { type: 'skill', field: 'kr', class: sc.en, build: sk.en }));
        if (deleteMode) tr.appendChild(createDeleteCell('skill', sk.en, sc.en));
        tbody.appendChild(tr);

        const tripods = sk.tripods || [];
        const skillMatch = !currentSearch || matchesSearch(sk) || clsMatch;
        const tripodsToShow = skillMatch
          ? tripods.filter(tp => tp && tp.en && String(tp.en).trim())
          : tripods.filter(tp => tp && tp.en && String(tp.en).trim() && matchesSearch(tp));
        for (const tp of tripodsToShow) {
          const trTp = document.createElement('tr');
          trTp.className = 'tripod-row';
          trTp.appendChild(createCell(tp.en || '', 'editable en-cell', { type: 'tripod', field: 'en', class: sc.en, build: sk.en, tripod: tp.en }));
          trTp.appendChild(createCell(tp.ru || '', 'editable', { type: 'tripod', field: 'ru', class: sc.en, build: sk.en, tripod: tp.en }));
          trTp.appendChild(createCell(tp.kr || '', 'editable kr-cell', { type: 'tripod', field: 'kr', class: sc.en, build: sk.en, tripod: tp.en }));
          if (deleteMode) trTp.appendChild(createDeleteCell('tripod', tp.en, sc.en));
          tbody.appendChild(trTp);
        }
      }
    }
    const flatList = (fullData.skills || []).filter(s => s && s.en && matchesSearch(s));
    if (flatList.length) {
      if (!anySkill) {
        addSectionRow(tbody, t.sectionSkills);
        anySkill = true;
      }
      for (const skill of flatList) {
        const tr = document.createElement('tr');
        tr.className = 'orphan-row';
        tr.appendChild(createCell(skill.en, 'editable en-cell', { type: 'skill', field: 'en', en: skill.en }));
        tr.appendChild(createCell(skill.ru, 'editable', { type: 'skill', field: 'ru', en: skill.en }));
        tr.appendChild(createCell(skill.kr, 'editable kr-cell', { type: 'skill', field: 'kr', en: skill.en }));
        if (deleteMode) tr.appendChild(createDeleteCell('skill', skill.en));
        tbody.appendChild(tr);
      }
    }
  }


  const showArkpass = currentFilter === 'all' || currentFilter === 'arkpass';
  if (showArkpass) {
    let any = false;
    for (const sc of fullData.arkPassClasses || []) {
      const clsMatch = matchesSearch(sc);
      const filled = (sc.skills || []).filter(s => s && s.en && String(s.en).trim());
      const matched = filled.filter(matchesSearch);
      if (!clsMatch && matched.length === 0 && !(currentSearch === '' && filled.length)) continue;
      if (!any) {
        addSectionRow(tbody, t.sectionArkpass);
        any = true;
      }
      const trClass = document.createElement('tr');
      trClass.className = 'class-row';
      trClass.appendChild(createCell(sc.en, 'editable', { type: 'arkPassClass', field: 'en', class: sc.en }));
      trClass.appendChild(createCell(sc.ru, 'editable', { type: 'arkPassClass', field: 'ru', class: sc.en }));
      trClass.appendChild(createCell(sc.kr, 'editable kr-cell', { type: 'arkPassClass', field: 'kr', class: sc.en }));
      if (deleteMode) trClass.appendChild(createDeleteCell('arkPassClass', sc.en));
      tbody.appendChild(trClass);
      const toShow = (!currentSearch || clsMatch) ? filled : matched;
      for (const sk of toShow) {
        const tr = document.createElement('tr');
        tr.className = 'build-row';
        tr.appendChild(createCell(sk.en, 'editable en-cell', { type: 'arkpass', field: 'en', class: sc.en, build: sk.en }));
        tr.appendChild(createCell(sk.ru, 'editable', { type: 'arkpass', field: 'ru', class: sc.en, build: sk.en }));
        tr.appendChild(createCell(sk.kr, 'editable kr-cell', { type: 'arkpass', field: 'kr', class: sc.en, build: sk.en }));
        if (deleteMode) tr.appendChild(createDeleteCell('arkpass', sk.en, sc.en));
        tbody.appendChild(tr);
      }
    }
  }

  const showClasscore = currentFilter === 'all' || currentFilter === 'classcore';
  if (showClasscore) {
    let any = false;
    for (const sc of fullData.classCoreClasses || []) {
      const clsMatch = matchesSearch(sc);
      const filled = (sc.skills || []).filter(s => s && s.en && String(s.en).trim());
      const matched = filled.filter(matchesSearch);
      if (!clsMatch && matched.length === 0 && !(currentSearch === '' && filled.length)) continue;
      if (!any) {
        addSectionRow(tbody, t.sectionClasscore);
        any = true;
      }
      const trClass = document.createElement('tr');
      trClass.className = 'class-row';
      trClass.appendChild(createCell(sc.en, 'editable', { type: 'classCoreClass', field: 'en', class: sc.en }));
      trClass.appendChild(createCell(sc.ru, 'editable', { type: 'classCoreClass', field: 'ru', class: sc.en }));
      trClass.appendChild(createCell(sc.kr, 'editable kr-cell', { type: 'classCoreClass', field: 'kr', class: sc.en }));
      if (deleteMode) trClass.appendChild(createDeleteCell('classCoreClass', sc.en));
      tbody.appendChild(trClass);
      const toShow = (!currentSearch || clsMatch) ? filled : matched;
      for (const sk of toShow) {
        const tr = document.createElement('tr');
        tr.className = 'build-row';
        tr.appendChild(createCell(sk.en, 'editable en-cell', { type: 'classcore', field: 'en', class: sc.en, build: sk.en }));
        tr.appendChild(createCell(sk.ru, 'editable', { type: 'classcore', field: 'ru', class: sc.en, build: sk.en }));
        tr.appendChild(createCell(sk.kr, 'editable kr-cell', { type: 'classcore', field: 'kr', class: sc.en, build: sk.en }));
        if (deleteMode) tr.appendChild(createDeleteCell('classcore', sk.en, sc.en));
        tbody.appendChild(tr);
      }
    }
  }

  if (showOrphans) {
    const list = (fullData._orphanBuilds || []).filter(matchesSearch);
    if (list.length) {
      addSectionRow(tbody, t.sectionOrphans);
      for (const o of list) {
        const tr = document.createElement('tr');
        tr.className = 'orphan-row';
        tr.appendChild(createCell(o.en, 'editable en-cell', { type: 'orphan', field: 'en', en: o.en }));
        tr.appendChild(createCell(o.ru, 'editable', { type: 'orphan', field: 'ru', en: o.en }));
        tr.appendChild(createCell(o.kr, 'editable kr-cell', { type: 'orphan', field: 'kr', en: o.en }));
        if (deleteMode) tr.appendChild(createDeleteCell('orphan', o.en));
        tbody.appendChild(tr);
      }
    }
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
        } else if (type === 'skill') {
          const classEn = this.dataset.class;
          if (classEn) {
            const sc = (fullData.skillClasses || []).find(x => x.en === classEn);
            if (!sc) return;
            const s = (sc.skills || []).find(x => x.en === oldEn);
            if (!s) return;
            msg = { action: 'updateEntry', oldEn, type: 'skill', classEn, data: { ...s, [field]: newVal } };
          } else {
            const s = (fullData.skills || []).find(x => x.en === oldEn);
            if (!s) return;
            msg = { action: 'updateEntry', oldEn, type: 'skill', data: { ...s, [field]: newVal } };
          }
        } else if (type === 'skillClass') {
          const sc = (fullData.skillClasses || []).find(x => x.en === classEn);
          if (!sc) return;
          msg = { action: 'updateEntry', oldEn: classEn, type: 'skillClass', data: { ...sc, [field]: newVal } };
        } else if (type === 'arkpass') {
          const classEn = this.dataset.class;
          const sc = (fullData.arkPassClasses || []).find(x => x.en === classEn);
          if (!sc) return;
          const s = (sc.skills || []).find(x => x.en === oldEn);
          if (!s) return;
          msg = { action: 'updateEntry', oldEn, type: 'arkpass', classEn, data: { ...s, [field]: newVal } };
        } else if (type === 'classcore') {
          const classEn = this.dataset.class;
          const sc = (fullData.classCoreClasses || []).find(x => x.en === classEn);
          if (!sc) return;
          const s = (sc.skills || []).find(x => x.en === oldEn);
          if (!s) return;
          msg = { action: 'updateEntry', oldEn, type: 'classcore', classEn, data: { ...s, [field]: newVal } };
        } else if (type === 'arkPassClass') {
          const sc = (fullData.arkPassClasses || []).find(x => x.en === classEn);
          if (!sc) return;
          msg = { action: 'updateEntry', oldEn: classEn, type: 'arkPassClass', data: { ...sc, [field]: newVal } };
        } else if (type === 'classCoreClass') {
          const sc = (fullData.classCoreClasses || []).find(x => x.en === classEn);
          if (!sc) return;
          msg = { action: 'updateEntry', oldEn: classEn, type: 'classCoreClass', data: { ...sc, [field]: newVal } };
        } else if (type === 'engraving') {
          const e = (fullData.engravings || []).find(x => x.en === oldEn);
          if (!e) return;
          msg = { action: 'updateEntry', oldEn, type: 'engraving', data: { ...e, [field]: newVal } };
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
  let en = document.getElementById('newEn').value.trim();
  const ru = document.getElementById('newRu').value.trim();
  const kr = document.getElementById('newKr').value.trim();
  const type = document.getElementById('newType').value;
  const filled = [en, ru, kr].filter(Boolean).length;
  if (filled < 2) return;
  if (!en) en = kr || ru;

  let msg;
  if (type === 'build') {
    const classEn = document.getElementById('newParent').value;
    if (!classEn) return;
    msg = { action: 'addEntry', type: 'build', classEn, data: { en, ru, kr } };
  } else if (type === 'class') {
    msg = { action: 'addEntry', type: 'class', data: { en, ru, kr, builds: [] } };
  } else if (type === 'term') {
    msg = { action: 'addEntry', type: 'term', data: { en, ru, kr } };
  } else if (type === 'skill') {
    const classEn = document.getElementById('newParent').value;
    msg = { action: 'addEntry', type: 'skill', classEn, data: { en, ru, kr } };
  } else if (type === 'arkpass') {
    const classEn = document.getElementById('newParent').value;
    if (!classEn) return;
    msg = { action: 'addEntry', type: 'arkpass', classEn, data: { en, ru, kr } };
  } else if (type === 'classcore') {
    const classEn = document.getElementById('newParent').value;
    if (!classEn) return;
    msg = { action: 'addEntry', type: 'classcore', classEn, data: { en, ru, kr } };
  } else if (type === 'engraving') {
    msg = { action: 'addEntry', type: 'engraving', data: { en, ru, kr } };
  } else {
    msg = { action: 'addEntry', type: 'orphan', data: { en, ru, kr } };
  }

  try {
    const res = await chrome.runtime.sendMessage(msg);
    if (res.success) {
      document.getElementById('newEn').value = '';
      document.getElementById('newRu').value = '';
      document.getElementById('newKr').value = '';
      document.getElementById('newEn').focus();
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
  setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'sync-status'; }, 4000);
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
      if (!data.classes && !data._orphanBuilds && !data.terms && !data.engravings && !data.skills) {
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


chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.theme) {
    currentTheme = changes.theme.newValue || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
  }
  if (changes.targetLang) {
    targetLang = changes.targetLang.newValue || 'ru';
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.dataset.lang) btn.classList.toggle('active', btn.dataset.lang === targetLang);
    });
    applyLocalization();
    renderList();
  }
  if (changes.termMode) {
    termMode = changes.termMode.newValue || 'replace';
    document.querySelectorAll('.term-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.termMode === termMode);
    });
  }
  if (changes.isEnabled) {
    isEnabled = changes.isEnabled.newValue !== false;
    const toggle = document.getElementById('toggleEnabled');
    if (toggle) toggle.checked = isEnabled;
    updateStatus();
  }
});

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
