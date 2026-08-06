const DEFAULT_DICTIONARY_FILES = [
  'dictionary/lt-classes.json',
  'dictionary/lt-engravings.json',
  'dictionary/lt-interface.json',
  'dictionary/lt-skills.json',
  'dictionary/lt-arkpass.json',
  'dictionary/lt-classcore.json',
  'dictionary/lt-user.json'
];

async function getDictionaryFileList() {
  const result = await chrome.storage.local.get(['dictionaryFiles', 'disabledDictionaries']);
  const all = result.dictionaryFiles || DEFAULT_DICTIONARY_FILES;
  const disabled = Array.isArray(result.disabledDictionaries) ? result.disabledDictionaries : [];
  return all.filter(f => !disabled.includes(f) && !disabled.includes(f.split('/').pop()));
}

function flattenData(data, target) {
  const dict = {};
  const sources = ['en', 'ru', 'kr'].filter(f => f !== target);

  function addEntry(srcVal, tgtVal, meta = {}) {
    if (!srcVal || !tgtVal) return;
    if (!dict[srcVal]) dict[srcVal] = [];
    dict[srcVal].push({
      value: tgtVal,
      parent: meta.parent || null,
      tags: meta.tags || [],
      priority: meta.priority || 0
    });
  }

  (data.classes || []).forEach(cls => {
    sources.forEach(src => {
      if (cls[src]) addEntry(cls[src], cls[target], {
        tags: cls.tags || ['class'],
        priority: 30
      });
    });

    (cls.builds || []).forEach(b => {
      const autoTags = ['class_build', (cls.en || '').toLowerCase()];
      const tags = b.tags ? [...autoTags, ...b.tags] : autoTags;

      sources.forEach(src => {
        if (b[src]) addEntry(b[src], b[target], {
          parent: cls.en,
          tags,
          priority: 25
        });
      });
    });
  });

  (data.engravings || []).forEach(eng => {
    sources.forEach(src => {
      if (eng[src]) addEntry(eng[src], eng[target], {
        tags: eng.tags || ['engraving'],
        priority: 15
      });
    });
  });

  (data.terms || []).forEach(term => {
    sources.forEach(src => {
      if (term[src]) addEntry(term[src], term[target], {
        tags: term.tags || ['interface', 'term'],
        parent: term.parent || null,
        priority: term.priority != null ? term.priority : 22
      });
    });
  });

  (data.skillClasses || []).forEach(sc => {
    sources.forEach(src => {
      if (sc[src]) addEntry(sc[src], sc[target], {
        tags: sc.tags || ['skill_class', 'class'],
        priority: 20
      });
    });
    (sc.skills || []).forEach(skill => {
      if (!skill || !skill.en || !String(skill.en).trim()) return;
      sources.forEach(src => {
        if (skill[src]) addEntry(skill[src], skill[target], {
          parent: sc.en,
          tags: skill.tags || ['skill', (sc.en || '').toLowerCase()],
          priority: 12
        });
      });
      (skill.tripods || []).forEach(tp => {
        if (!tp || !tp.en || !String(tp.en).trim()) return;
        sources.forEach(src => {
          if (tp[src]) addEntry(tp[src], tp[target], {
            parent: skill.en || sc.en,
            tags: ['tripod', 'skill', (sc.en || '').toLowerCase()],
            priority: 11
          });
        });
      });
    });
  });

  (data.skills || []).forEach(skill => {
    if (!skill || !skill.en || !String(skill.en).trim()) return;
    sources.forEach(src => {
      if (skill[src]) addEntry(skill[src], skill[target], {
        tags: skill.tags || ['skill'],
        priority: 12
      });
    });
    (skill.tripods || []).forEach(tp => {
      if (!tp || !tp.en || !String(tp.en).trim()) return;
      sources.forEach(src => {
        if (tp[src]) addEntry(tp[src], tp[target], {
          parent: skill.en,
          tags: ['tripod', 'skill'],
          priority: 11
        });
      });
    });
  });

  (data.arkPassClasses || []).forEach(sc => {
    sources.forEach(src => {
      if (sc[src]) addEntry(sc[src], sc[target], {
        tags: sc.tags || ['arkpass_class', 'class'],
        priority: 20
      });
    });
    (sc.skills || []).forEach(skill => {
      if (!skill || !skill.en || !String(skill.en).trim()) return;
      sources.forEach(src => {
        if (skill[src]) addEntry(skill[src], skill[target], {
          parent: sc.en,
          tags: skill.tags || ['arkpass', (sc.en || '').toLowerCase()],
          priority: 12
        });
      });
    });
  });

  (data.classCoreClasses || []).forEach(sc => {
    sources.forEach(src => {
      if (sc[src]) addEntry(sc[src], sc[target], {
        tags: sc.tags || ['classcore_class', 'class'],
        priority: 20
      });
    });
    (sc.skills || []).forEach(skill => {
      if (!skill || !skill.en || !String(skill.en).trim()) return;
      sources.forEach(src => {
        if (skill[src]) addEntry(skill[src], skill[target], {
          parent: sc.en,
          tags: skill.tags || ['classcore', (sc.en || '').toLowerCase()],
          priority: 12
        });
      });
    });
  });

  if (data._orphanBuilds) {
    data._orphanBuilds.forEach(o => {
      sources.forEach(src => {
        if (o[src]) addEntry(o[src], o[target], {
          tags: o.tags || ['orphan'],
          priority: 5
        });
      });
    });
  }

  for (const key of Object.keys(dict)) {
    dict[key].sort((a, b) => b.priority - a.priority);
  }
  return dict;
}



function normalizeSourceData(data, hint) {
  if (!data) return data;
  const h = (hint || '').toLowerCase();
  if (h.includes('engraving') && data._orphanBuilds && data._orphanBuilds.length && !(data.engravings && data.engravings.length)) {
    data.engravings = data._orphanBuilds;
    data._orphanBuilds = [];
  }
  return data;
}

function cleanEmptyEntries(data) {
  const hasAny = (item) => {
    if (!item || typeof item !== 'object') return false;
    return [item.en, item.ru, item.kr].some(v => v != null && String(v).trim());
  };
  if (data.classes) {
    data.classes = data.classes.filter(c => hasAny(c)).map(c => {
      if (c.builds) c.builds = c.builds.filter(b => hasAny(b));
      return c;
    });
  }
  if (data.engravings) data.engravings = data.engravings.filter(e => hasAny(e));
  if (data._orphanBuilds) data._orphanBuilds = data._orphanBuilds.filter(o => hasAny(o));
  if (data.terms) data.terms = data.terms.filter(t => hasAny(t));
  if (data.skills) data.skills = data.skills.filter(s => hasAny(s));
  if (data.skillClasses) {
    data.skillClasses = data.skillClasses.filter(c => hasAny(c) || (c && c.en)).map(c => {
      if (c.skills) c.skills = c.skills.filter(s => hasAny(s));
      else c.skills = [];
      return c;
    });
  }
  if (data.arkPassClasses) {
    data.arkPassClasses = data.arkPassClasses.filter(c => hasAny(c) || (c && c.en)).map(c => {
      if (c.skills) c.skills = c.skills.filter(s => hasAny(s));
      else c.skills = [];
      return c;
    });
  }
  if (data.classCoreClasses) {
    data.classCoreClasses = data.classCoreClasses.filter(c => hasAny(c) || (c && c.en)).map(c => {
      if (c.skills) c.skills = c.skills.filter(s => hasAny(s));
      else c.skills = [];
      return c;
    });
  }
  return data;
}

function mergeData(target, source) {
  if (!source) return target;

  for (const srcClass of source.classes || []) {
    let existingClass = target.classes.find(c => c.en === srcClass.en);
    if (existingClass) {
      if (srcClass.ru) existingClass.ru = srcClass.ru;
      if (srcClass.kr) existingClass.kr = srcClass.kr;
      if (srcClass.tags) existingClass.tags = srcClass.tags;
      for (const srcBuild of srcClass.builds || []) {
        let existingBuild = existingClass.builds.find(b => b.en === srcBuild.en);
        if (existingBuild) {
          if (srcBuild.ru) existingBuild.ru = srcBuild.ru;
          if (srcBuild.kr) existingBuild.kr = srcBuild.kr;
          if (srcBuild.tags) existingBuild.tags = srcBuild.tags;
        } else {
          existingClass.builds.push({ ...srcBuild });
        }
      }
    } else {
      target.classes.push({
        en: srcClass.en,
        ru: srcClass.ru || '',
        kr: srcClass.kr || '',
        tags: srcClass.tags || undefined,
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
      if (srcEng.tags) existingEng.tags = srcEng.tags;
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
        if (orphan.tags) existing.tags = orphan.tags;
      } else {
        target._orphanBuilds.push({ ...orphan });
      }
    }
  }

  if (!target.terms) target.terms = [];
  for (const srcTerm of source.terms || []) {
    const srcEn = (srcTerm.en || '').trim();
    const srcKr = (srcTerm.kr || '').trim();
    const srcRu = (srcTerm.ru || '').trim();
    let existing = target.terms.find(t => {
      const te = (t.en || '').trim();
      const tk = (t.kr || '').trim();
      if (srcKr && tk) return te === srcEn && tk === srcKr;
      if (srcKr && !tk && te === srcEn) return true;
      if (!srcKr && !tk && te && te === srcEn) return true;
      if (!srcEn && srcKr && tk === srcKr) return true;
      return false;
    });
    if (existing) {
      if (srcRu) existing.ru = srcTerm.ru;
      if (srcKr) existing.kr = srcTerm.kr;
      if (srcEn) existing.en = srcTerm.en;
      if (srcTerm.tags) existing.tags = srcTerm.tags;
      if (srcTerm.parent) existing.parent = srcTerm.parent;
      if (srcTerm.priority != null) existing.priority = srcTerm.priority;
    } else {
      target.terms.push({ ...srcTerm });
    }
  }
  // Keep alternate KR forms that share the same EN but differ by KR text
  for (const srcTerm of source.terms || []) {
    const srcEn = (srcTerm.en || '').trim();
    const srcKr = (srcTerm.kr || '').trim();
    if (!srcEn || !srcKr) continue;
    const has = target.terms.some(t =>
      (t.en || '').trim() === srcEn && (t.kr || '').trim() === srcKr
    );
    if (!has) target.terms.push({ ...srcTerm });
  }

  if (!target.skills) target.skills = [];
  for (const srcSkill of source.skills || []) {
    let existing = target.skills.find(s => s.en === srcSkill.en);
    if (existing) {
      if (srcSkill.ru) existing.ru = srcSkill.ru;
      if (srcSkill.kr) existing.kr = srcSkill.kr;
      if (srcSkill.tags) existing.tags = srcSkill.tags;
    } else {
      target.skills.push({ ...srcSkill });
    }
  }

  if (!target.skillClasses) target.skillClasses = [];
  for (const srcSc of source.skillClasses || []) {
    let existingSc = target.skillClasses.find(c => c.en === srcSc.en);
    if (existingSc) {
      if (srcSc.ru) existingSc.ru = srcSc.ru;
      if (srcSc.kr) existingSc.kr = srcSc.kr;
      if (!existingSc.skills) existingSc.skills = [];
      for (const srcSk of srcSc.skills || []) {
        if (!srcSk || !srcSk.en || !String(srcSk.en).trim()) {
          if (!(srcSk && (srcSk.ru || srcSk.kr))) continue;
        }
        const key = (srcSk.en || '').trim();
        let existingSk = key
          ? existingSc.skills.find(s => s.en === key)
          : null;
        if (existingSk) {
          if (srcSk.ru) existingSk.ru = srcSk.ru;
          if (srcSk.kr) existingSk.kr = srcSk.kr;
        } else {
          existingSc.skills.push({ ...srcSk });
        }
      }
    } else {
      target.skillClasses.push({
        en: srcSc.en,
        ru: srcSc.ru || '',
        kr: srcSc.kr || '',
        skills: (srcSc.skills || []).map(s => ({ ...s }))
      });
    }
  }

  if (!target.arkPassClasses) target.arkPassClasses = [];
  for (const srcSc of source.arkPassClasses || []) {
    let existingSc = target.arkPassClasses.find(c => c.en === srcSc.en);
    if (existingSc) {
      if (srcSc.ru) existingSc.ru = srcSc.ru;
      if (srcSc.kr) existingSc.kr = srcSc.kr;
      if (!existingSc.skills) existingSc.skills = [];
      for (const srcSk of srcSc.skills || []) {
        if (!srcSk || !srcSk.en || !String(srcSk.en).trim()) {
          if (!(srcSk && (srcSk.ru || srcSk.kr))) continue;
        }
        const key = (srcSk.en || '').trim();
        let existingSk = key ? existingSc.skills.find(s => s.en === key) : null;
        if (existingSk) {
          if (srcSk.ru) existingSk.ru = srcSk.ru;
          if (srcSk.kr) existingSk.kr = srcSk.kr;
        } else {
          existingSc.skills.push({ ...srcSk });
        }
      }
    } else {
      target.arkPassClasses.push({
        en: srcSc.en,
        ru: srcSc.ru || '',
        kr: srcSc.kr || '',
        skills: (srcSc.skills || []).map(s => ({ ...s }))
      });
    }
  }

  if (!target.classCoreClasses) target.classCoreClasses = [];
  for (const srcSc of source.classCoreClasses || []) {
    let existingSc = target.classCoreClasses.find(c => c.en === srcSc.en);
    if (existingSc) {
      if (srcSc.ru) existingSc.ru = srcSc.ru;
      if (srcSc.kr) existingSc.kr = srcSc.kr;
      if (!existingSc.skills) existingSc.skills = [];
      for (const srcSk of srcSc.skills || []) {
        if (!srcSk || !srcSk.en || !String(srcSk.en).trim()) {
          if (!(srcSk && (srcSk.ru || srcSk.kr))) continue;
        }
        const key = (srcSk.en || '').trim();
        let existingSk = key ? existingSc.skills.find(s => s.en === key) : null;
        if (existingSk) {
          if (srcSk.ru) existingSk.ru = srcSk.ru;
          if (srcSk.kr) existingSk.kr = srcSk.kr;
        } else {
          existingSc.skills.push({ ...srcSk });
        }
      }
    } else {
      target.classCoreClasses.push({
        en: srcSc.en,
        ru: srcSc.ru || '',
        kr: srcSc.kr || '',
        skills: (srcSc.skills || []).map(s => ({ ...s }))
      });
    }
  }

  return target;
}

function mergeWithDeleted(base, user) {
  const deleted = new Set(user._deleted || []);
  const result = {
    classes: [],
    engravings: [],
    _orphanBuilds: [],
    terms: [],
    skills: [],
    skillClasses: [],
    arkPassClasses: [],
    classCoreClasses: []
  };

  const userClasses = JSON.parse(JSON.stringify(user.classes || []));
  const userEng = JSON.parse(JSON.stringify(user.engravings || []));
  const userOrphans = JSON.parse(JSON.stringify(user._orphanBuilds || []));
  const userTerms = JSON.parse(JSON.stringify(user.terms || []));

  const userClassEns = new Set(userClasses.map(c => c.en));
  const userEngEns = new Set(userEng.map(e => e.en));
  const userOrphanEns = new Set(userOrphans.map(o => o.en));
  const userTermEns = new Set(userTerms.map(t => t.en));

  for (const cls of userClasses) {
    if (deleted.has(cls.en)) continue;
    const baseCls = (base.classes || []).find(c => c.en === cls.en);
    if (baseCls) {
      if (!cls.ru) cls.ru = baseCls.ru || '';
      if (!cls.kr) cls.kr = baseCls.kr || '';
      const userBuildEns = new Set((cls.builds || []).map(b => b.en));
      const mergedBuilds = [...(cls.builds || [])];
      for (const b of baseCls.builds || []) {
        if (deleted.has(b.en)) continue;
        if (!userBuildEns.has(b.en)) mergedBuilds.push(JSON.parse(JSON.stringify(b)));
      }
      cls.builds = mergedBuilds;
    }
    result.classes.push(cls);
  }
  for (const cls of base.classes || []) {
    if (deleted.has(cls.en) || userClassEns.has(cls.en)) continue;
    const copy = JSON.parse(JSON.stringify(cls));
    if (copy.builds) copy.builds = copy.builds.filter(b => !deleted.has(b.en));
    result.classes.push(copy);
  }

  for (const eng of userEng) {
    if (!deleted.has(eng.en)) result.engravings.push(eng);
  }
  for (const eng of base.engravings || []) {
    if (deleted.has(eng.en) || userEngEns.has(eng.en)) continue;
    result.engravings.push(JSON.parse(JSON.stringify(eng)));
  }

  for (const o of userOrphans) {
    if (!deleted.has(o.en)) result._orphanBuilds.push(o);
  }
  for (const o of base._orphanBuilds || []) {
    if (deleted.has(o.en) || userOrphanEns.has(o.en)) continue;
    result._orphanBuilds.push(JSON.parse(JSON.stringify(o)));
  }

  for (const t of userTerms) {
    if (deleted.has(t.en)) continue;
    const baseSame = (base.terms || []).filter(b => b.en === t.en);
    if (baseSame.length) {
      if (!(t.kr || '').trim()) {
        const withKr = baseSame.find(b => (b.kr || '').trim());
        if (withKr) t.kr = withKr.kr;
      }
      if (!(t.ru || '').trim()) {
        const withRu = baseSame.find(b => (b.ru || '').trim());
        if (withRu) t.ru = withRu.ru;
      }
      if (!t.tags && baseSame[0].tags) t.tags = baseSame[0].tags;
      if (t.priority == null && baseSame[0].priority != null) t.priority = baseSame[0].priority;
    }
    result.terms.push(t);
  }
  const userTermKeys = new Set(
    userTerms.map(t => (t.en || '') + '\0' + (t.kr || ''))
  );
  for (const t of base.terms || []) {
    if (deleted.has(t.en)) continue;
    const key = (t.en || '') + '\0' + (t.kr || '');
    if (userTermKeys.has(key)) continue;
    if (userTermEns.has(t.en) && !(t.kr || '').trim()) continue;
    result.terms.push(JSON.parse(JSON.stringify(t)));
  }

  const userSkills = JSON.parse(JSON.stringify(user.skills || []));
  const userSkillEns = new Set(userSkills.map(s => s.en));
  for (const s of userSkills) {
    if (!deleted.has(s.en)) result.skills.push(s);
  }
  for (const s of base.skills || []) {
    if (deleted.has(s.en) || userSkillEns.has(s.en)) continue;
    result.skills.push(JSON.parse(JSON.stringify(s)));
  }

  result.skillClasses = [];
  const userSc = JSON.parse(JSON.stringify(user.skillClasses || []));
  const userScEns = new Set(userSc.map(c => c.en));
  for (const sc of userSc) {
    if (deleted.has(sc.en)) continue;
    const baseSc = (base.skillClasses || []).find(c => c.en === sc.en);
    if (baseSc) {
      if (!sc.ru) sc.ru = baseSc.ru || '';
      if (!sc.kr) sc.kr = baseSc.kr || '';
      const userSkEns = new Set((sc.skills || []).filter(s => s && s.en).map(s => s.en));
      const mergedSk = [...(sc.skills || [])];
      for (const sk of baseSc.skills || []) {
        if (!sk || !sk.en || !String(sk.en).trim()) continue;
        if (deleted.has(sk.en)) continue;
        if (!userSkEns.has(sk.en)) mergedSk.push(JSON.parse(JSON.stringify(sk)));
      }
      sc.skills = mergedSk;
    }
    result.skillClasses.push(sc);
  }
  for (const sc of base.skillClasses || []) {
    if (deleted.has(sc.en) || userScEns.has(sc.en)) continue;
    const copy = JSON.parse(JSON.stringify(sc));
    if (copy.skills) {
      copy.skills = copy.skills.filter(s => !s || !s.en || !deleted.has(s.en));
    }
    result.skillClasses.push(copy);
  }

  result.arkPassClasses = [];
  const userAp = JSON.parse(JSON.stringify(user.arkPassClasses || []));
  const userApEns = new Set(userAp.map(c => c.en));
  for (const sc of userAp) {
    if (deleted.has(sc.en)) continue;
    const baseSc = (base.arkPassClasses || []).find(c => c.en === sc.en);
    if (baseSc) {
      if (!sc.ru) sc.ru = baseSc.ru || '';
      if (!sc.kr) sc.kr = baseSc.kr || '';
      const userSkEns = new Set((sc.skills || []).filter(s => s && s.en).map(s => s.en));
      const mergedSk = [...(sc.skills || [])];
      for (const sk of baseSc.skills || []) {
        if (!sk || !sk.en || !String(sk.en).trim()) continue;
        if (deleted.has(sk.en)) continue;
        if (!userSkEns.has(sk.en)) mergedSk.push(JSON.parse(JSON.stringify(sk)));
      }
      sc.skills = mergedSk;
    }
    result.arkPassClasses.push(sc);
  }
  for (const sc of base.arkPassClasses || []) {
    if (deleted.has(sc.en) || userApEns.has(sc.en)) continue;
    const copy = JSON.parse(JSON.stringify(sc));
    if (copy.skills) {
      copy.skills = copy.skills.filter(s => !s || !s.en || !deleted.has(s.en));
    }
    result.arkPassClasses.push(copy);
  }

  result.classCoreClasses = [];
  const userCc = JSON.parse(JSON.stringify(user.classCoreClasses || []));
  const userCcEns = new Set(userCc.map(c => c.en));
  for (const sc of userCc) {
    if (deleted.has(sc.en)) continue;
    const baseSc = (base.classCoreClasses || []).find(c => c.en === sc.en);
    if (baseSc) {
      if (!sc.ru) sc.ru = baseSc.ru || '';
      if (!sc.kr) sc.kr = baseSc.kr || '';
      const userSkEns = new Set((sc.skills || []).filter(s => s && s.en).map(s => s.en));
      const mergedSk = [...(sc.skills || [])];
      for (const sk of baseSc.skills || []) {
        if (!sk || !sk.en || !String(sk.en).trim()) continue;
        if (deleted.has(sk.en)) continue;
        if (!userSkEns.has(sk.en)) mergedSk.push(JSON.parse(JSON.stringify(sk)));
      }
      sc.skills = mergedSk;
    }
    result.classCoreClasses.push(sc);
  }
  for (const sc of base.classCoreClasses || []) {
    if (deleted.has(sc.en) || userCcEns.has(sc.en)) continue;
    const copy = JSON.parse(JSON.stringify(sc));
    if (copy.skills) {
      copy.skills = copy.skills.filter(s => !s || !s.en || !deleted.has(s.en));
    }
    result.classCoreClasses.push(copy);
  }

  return result;
}

async function loadDefaultDictionaries() {
  const files = await getDictionaryFileList();
  let merged = { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [] };
  for (const file of files) {
    try {
      const res = await fetch(chrome.runtime.getURL(file));
      if (!res.ok) continue;
      const data = await res.json();
      mergeData(merged, normalizeSourceData(data, file));
    } catch (err) {
      console.error('Failed to load:', file, err.message);
    }
  }
  return merged;
}

async function markDeletedIfInBase(ud, en, type, classEn) {
  const { baseData } = await chrome.storage.local.get('baseData');
  if (!baseData) return;
  let inBase = false;
  if (type === 'orphan') inBase = baseData._orphanBuilds?.some(o => o.en === en);
  else if (type === 'class') inBase = baseData.classes?.some(c => c.en === en);
  else if (type === 'build' && classEn) {
    const cls = baseData.classes?.find(c => c.en === classEn);
    inBase = cls?.builds?.some(b => b.en === en);
  } else if (type === 'term') inBase = baseData.terms?.some(t => t.en === en);
  else if (type === 'engraving') inBase = baseData.engravings?.some(e => e.en === en);
  else if (type === 'skill') {
    if (classEn) {
      const sc = baseData.skillClasses?.find(c => c.en === classEn);
      inBase = sc?.skills?.some(s => s.en === en);
    } else {
      inBase = baseData.skills?.some(s => s.en === en) ||
        baseData.skillClasses?.some(c => c.skills?.some(s => s.en === en));
    }
  } else if (type === 'arkpass') {
    if (classEn) {
      const sc = baseData.arkPassClasses?.find(c => c.en === classEn);
      inBase = sc?.skills?.some(s => s.en === en);
    }
  } else if (type === 'classcore') {
    if (classEn) {
      const sc = baseData.classCoreClasses?.find(c => c.en === classEn);
      inBase = sc?.skills?.some(s => s.en === en);
    }
  } else if (type === 'arkPassClass') {
    inBase = baseData.arkPassClasses?.some(c => c.en === en);
  } else if (type === 'classCoreClass') {
    inBase = baseData.classCoreClasses?.some(c => c.en === en);
  }

  if (inBase) {
    if (!ud._deleted) ud._deleted = [];
    if (!ud._deleted.includes(en)) ud._deleted.push(en);
  }
}

async function removeFromUserData(ud, en, type, classEn) {
  if (type === 'orphan') {
    ud._orphanBuilds = (ud._orphanBuilds || []).filter(o => o.en !== en);
  } else if (type === 'class') {
    ud.classes = (ud.classes || []).filter(c => c.en !== en);
  } else if (type === 'build' && classEn) {
    const cls = ud.classes?.find(c => c.en === classEn);
    if (cls) cls.builds = (cls.builds || []).filter(b => b.en !== en);
  } else if (type === 'term') {
    ud.terms = (ud.terms || []).filter(t => t.en !== en && t.kr !== en && t.ru !== en);
  } else if (type === 'engraving') {
    ud.engravings = (ud.engravings || []).filter(e => e.en !== en && e.kr !== en && e.ru !== en);
  } else if (type === 'skill') {
    if (classEn) {
      const sc = ud.skillClasses?.find(c => c.en === classEn);
      if (sc) sc.skills = (sc.skills || []).filter(s => s.en !== en);
    } else {
      ud.skills = (ud.skills || []).filter(s => s.en !== en);
    }
  } else if (type === 'skillClass') {
    ud.skillClasses = (ud.skillClasses || []).filter(c => c.en !== en);
  } else if (type === 'arkpass') {
    if (classEn) {
      const sc = ud.arkPassClasses?.find(c => c.en === classEn);
      if (sc) sc.skills = (sc.skills || []).filter(s => s.en !== en);
    }
  } else if (type === 'classcore') {
    if (classEn) {
      const sc = ud.classCoreClasses?.find(c => c.en === classEn);
      if (sc) sc.skills = (sc.skills || []).filter(s => s.en !== en);
    }
  } else if (type === 'arkPassClass') {
    ud.arkPassClasses = (ud.arkPassClasses || []).filter(c => c.en !== en);
  } else if (type === 'classCoreClass') {
    ud.classCoreClasses = (ud.classCoreClasses || []).filter(c => c.en !== en);
  }
}

async function handleAddEntry(entry) {
  const { userData } = await chrome.storage.local.get('userData');
  const ud = userData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [], _deleted: [] };

  if (entry.type === 'orphan') {
    const existing = (ud._orphanBuilds || []).find(o => o.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud._orphanBuilds) ud._orphanBuilds = [];
      ud._orphanBuilds.unshift(entry.data);
    }
  } else if (entry.type === 'class') {
    const existing = (ud.classes || []).find(c => c.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud.classes) ud.classes = [];
      ud.classes.unshift({ ...entry.data, builds: entry.data.builds || [] });
    }
  } else if (entry.type === 'build') {
    let cls = (ud.classes || []).find(c => c.en === entry.classEn);
    if (cls) {
      const existing = (cls.builds || []).find(b => b.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else {
        if (!cls.builds) cls.builds = [];
        cls.builds.unshift(entry.data);
      }
    } else {
      if (!ud.classes) ud.classes = [];
      ud.classes.push({
        en: entry.classEn,
        ru: entry.classRu || '',
        kr: entry.classKr || '',
        builds: [entry.data]
      });
    }
  } else if (entry.type === 'term') {
    const d = entry.data || {};
    if (!d.en && (d.kr || d.ru)) d.en = d.kr || d.ru;
    const existing = (ud.terms || []).find(t =>
      (d.en && t.en === d.en) ||
      (d.kr && t.kr === d.kr && (!d.en || !t.en || t.en === d.en)) ||
      (d.ru && t.ru === d.ru && d.kr && t.kr === d.kr)
    );
    if (existing) Object.assign(existing, d);
    else {
      if (!ud.terms) ud.terms = [];
      ud.terms.unshift(d);
    }
  } else if (entry.type === 'engraving') {
    const existing = (ud.engravings || []).find(e => e.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud.engravings) ud.engravings = [];
      ud.engravings.unshift(entry.data);
    }
  } else if (entry.type === 'skill') {
    if (entry.classEn) {
      let sc = (ud.skillClasses || []).find(c => c.en === entry.classEn);
      if (!sc) {
        if (!ud.skillClasses) ud.skillClasses = [];
        sc = { en: entry.classEn, ru: entry.classRu || '', kr: entry.classKr || '', skills: [] };
        ud.skillClasses.unshift(sc);
      }
      if (!sc.skills) sc.skills = [];
      const existing = sc.skills.find(s => s.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else sc.skills.unshift(entry.data);
    } else {
      const existing = (ud.skills || []).find(s => s.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else {
        if (!ud.skills) ud.skills = [];
        ud.skills.unshift(entry.data);
      }
    }
  } else if (entry.type === 'arkpass') {
    if (entry.classEn) {
      let sc = (ud.arkPassClasses || []).find(c => c.en === entry.classEn);
      if (!sc) {
        if (!ud.arkPassClasses) ud.arkPassClasses = [];
        sc = { en: entry.classEn, ru: entry.classRu || '', kr: entry.classKr || '', skills: [] };
        ud.arkPassClasses.unshift(sc);
      }
      if (!sc.skills) sc.skills = [];
      const existing = sc.skills.find(s => s.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else sc.skills.unshift(entry.data);
    }
  } else if (entry.type === 'classcore') {
    if (entry.classEn) {
      let sc = (ud.classCoreClasses || []).find(c => c.en === entry.classEn);
      if (!sc) {
        if (!ud.classCoreClasses) ud.classCoreClasses = [];
        sc = { en: entry.classEn, ru: entry.classRu || '', kr: entry.classKr || '', skills: [] };
        ud.classCoreClasses.unshift(sc);
      }
      if (!sc.skills) sc.skills = [];
      const existing = sc.skills.find(s => s.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else sc.skills.unshift(entry.data);
    }
  }

  await chrome.storage.local.set({ userData: ud });
  await rebuildStorage();
}

async function handleUpdateEntry(oldEn, entry) {
  const { userData } = await chrome.storage.local.get('userData');
  const ud = userData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [], _deleted: [] };

  if (entry.type === 'orphan') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'orphan');
    await removeFromUserData(ud, oldEn, 'orphan');
    const existing = (ud._orphanBuilds || []).find(o => o.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud._orphanBuilds) ud._orphanBuilds = [];
      ud._orphanBuilds.unshift(entry.data);
    }
  } else if (entry.type === 'class') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'class');
    await removeFromUserData(ud, oldEn, 'class');
    const existing = (ud.classes || []).find(c => c.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud.classes) ud.classes = [];
      ud.classes.push(entry.data);
    }
  } else if (entry.type === 'build') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'build', entry.classEn);
    await removeFromUserData(ud, oldEn, 'build', entry.classEn);
    let cls = (ud.classes || []).find(c => c.en === entry.classEn);
    if (cls) {
      const existing = (cls.builds || []).find(b => b.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else {
        if (!cls.builds) cls.builds = [];
        cls.builds.unshift(entry.data);
      }
    } else {
      if (!ud.classes) ud.classes = [];
      ud.classes.push({
        en: entry.classEn,
        ru: entry.classRu || '',
        kr: entry.classKr || '',
        builds: [entry.data]
      });
    }
  } else if (entry.type === 'term') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'term');
    await removeFromUserData(ud, oldEn, 'term');
    const existing = (ud.terms || []).find(t => t.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud.terms) ud.terms = [];
      ud.terms.unshift(entry.data);
    }
  } else if (entry.type === 'engraving') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'engraving');
    await removeFromUserData(ud, oldEn, 'engraving');
    const existing = (ud.engravings || []).find(e => e.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud.engravings) ud.engravings = [];
      ud.engravings.unshift(entry.data);
    }
  } else if (entry.type === 'skillClass') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'skillClass');
    await removeFromUserData(ud, oldEn, 'skillClass');
    const existing = (ud.skillClasses || []).find(c => c.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud.skillClasses) ud.skillClasses = [];
      ud.skillClasses.unshift({ ...entry.data, skills: entry.data.skills || [] });
    }
  } else if (entry.type === 'skill') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'skill', entry.classEn);
    await removeFromUserData(ud, oldEn, 'skill', entry.classEn);
    if (entry.classEn) {
      let sc = (ud.skillClasses || []).find(c => c.en === entry.classEn);
      if (!sc) {
        if (!ud.skillClasses) ud.skillClasses = [];
        sc = { en: entry.classEn, ru: entry.classRu || '', kr: entry.classKr || '', skills: [] };
        ud.skillClasses.unshift(sc);
      }
      if (!sc.skills) sc.skills = [];
      const existing = sc.skills.find(s => s.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else sc.skills.unshift(entry.data);
    } else {
      const existing = (ud.skills || []).find(s => s.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else {
        if (!ud.skills) ud.skills = [];
        ud.skills.unshift(entry.data);
      }
    }
  } else if (entry.type === 'arkpass') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'arkpass', entry.classEn);
    await removeFromUserData(ud, oldEn, 'arkpass', entry.classEn);
    if (entry.classEn) {
      let sc = (ud.arkPassClasses || []).find(c => c.en === entry.classEn);
      if (!sc) {
        if (!ud.arkPassClasses) ud.arkPassClasses = [];
        sc = { en: entry.classEn, ru: entry.classRu || '', kr: entry.classKr || '', skills: [] };
        ud.arkPassClasses.unshift(sc);
      }
      if (!sc.skills) sc.skills = [];
      const existing = sc.skills.find(s => s.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else sc.skills.unshift(entry.data);
    }
  } else if (entry.type === 'classcore') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'classcore', entry.classEn);
    await removeFromUserData(ud, oldEn, 'classcore', entry.classEn);
    if (entry.classEn) {
      let sc = (ud.classCoreClasses || []).find(c => c.en === entry.classEn);
      if (!sc) {
        if (!ud.classCoreClasses) ud.classCoreClasses = [];
        sc = { en: entry.classEn, ru: entry.classRu || '', kr: entry.classKr || '', skills: [] };
        ud.classCoreClasses.unshift(sc);
      }
      if (!sc.skills) sc.skills = [];
      const existing = sc.skills.find(s => s.en === entry.data.en);
      if (existing) Object.assign(existing, entry.data);
      else sc.skills.unshift(entry.data);
    }
  } else if (entry.type === 'arkPassClass') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'arkPassClass');
    await removeFromUserData(ud, oldEn, 'arkPassClass');
    const existing = (ud.arkPassClasses || []).find(c => c.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud.arkPassClasses) ud.arkPassClasses = [];
      ud.arkPassClasses.unshift({ ...entry.data, skills: entry.data.skills || [] });
    }
  } else if (entry.type === 'classCoreClass') {
    if (oldEn !== entry.data.en) await markDeletedIfInBase(ud, oldEn, 'classCoreClass');
    await removeFromUserData(ud, oldEn, 'classCoreClass');
    const existing = (ud.classCoreClasses || []).find(c => c.en === entry.data.en);
    if (existing) Object.assign(existing, entry.data);
    else {
      if (!ud.classCoreClasses) ud.classCoreClasses = [];
      ud.classCoreClasses.unshift({ ...entry.data, skills: entry.data.skills || [] });
    }
  }

  await chrome.storage.local.set({ userData: ud });
  await rebuildStorage();
}

async function handleDeleteEntry(en, type, classEn) {
  const { userData, baseData } = await chrome.storage.local.get(['userData', 'baseData']);
  const ud = userData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [], _deleted: [] };

  let inBase = false;
  if (baseData) {
    if (type === 'orphan') inBase = baseData._orphanBuilds?.some(o => o.en === en);
    else if (type === 'class') inBase = baseData.classes?.some(c => c.en === en);
    else if (type === 'build' && classEn) {
      const cls = baseData.classes?.find(c => c.en === classEn);
      inBase = cls?.builds?.some(b => b.en === en);
    } else if (type === 'term') inBase = baseData.terms?.some(t => t.en === en);
    else if (type === 'engraving') inBase = baseData.engravings?.some(e => e.en === en);
    else if (type === 'skill') {
      if (classEn) {
        const sc = baseData.skillClasses?.find(c => c.en === classEn);
        inBase = sc?.skills?.some(s => s.en === en);
      } else {
        inBase = baseData.skills?.some(s => s.en === en) ||
          baseData.skillClasses?.some(c => c.skills?.some(s => s.en === en));
      }
    } else if (type === 'arkpass') {
      if (classEn) {
        const sc = baseData.arkPassClasses?.find(c => c.en === classEn);
        inBase = sc?.skills?.some(s => s.en === en);
      }
    } else if (type === 'classcore') {
      if (classEn) {
        const sc = baseData.classCoreClasses?.find(c => c.en === classEn);
        inBase = sc?.skills?.some(s => s.en === en);
      }
    } else if (type === 'arkPassClass') {
      inBase = baseData.arkPassClasses?.some(c => c.en === en);
    } else if (type === 'classCoreClass') {
      inBase = baseData.classCoreClasses?.some(c => c.en === en);
    }
  }

  if (inBase) {
    if (!ud._deleted) ud._deleted = [];
    if (!ud._deleted.includes(en)) ud._deleted.push(en);
  }

  await removeFromUserData(ud, en, type, classEn);
  await chrome.storage.local.set({ userData: ud });
  await rebuildStorage();
}

async function handleImport(data) {
  const { userData } = await chrome.storage.local.get('userData');
  const ud = userData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [], _deleted: [] };
  mergeData(ud, data);
  await chrome.storage.local.set({ userData: ud });
  await rebuildStorage();
}

async function syncFromUrls(urls) {
  let merged = await loadDefaultDictionaries();
  let totalCount = 0;

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} -> ${res.status}`);
      const data = await res.json();
      mergeData(merged, normalizeSourceData(data, url));
      totalCount += (data.classes?.length || 0) +
                    (data.engravings?.length || 0) +
                    (data._orphanBuilds?.length || 0) +
                    (data.terms?.length || 0) +
                    (data.skills?.length || 0) +
                    (data.skillClasses?.length || 0) +
                    (data.arkPassClasses?.length || 0) +
                    (data.classCoreClasses?.length || 0);
    } catch (e) {
      console.error('Sync failed:', url, e.message);
    }
  }

  if (totalCount === 0 && urls.length > 0) {
    throw new Error('Failed to load any dictionary');
  }

  await chrome.storage.local.set({ baseData: merged });
  await rebuildStorage();

  return { count: totalCount };
}

async function rebuildStorage() {
  const [{ baseData, userData }, syncResult] = await Promise.all([
    chrome.storage.local.get(['baseData', 'userData']),
    chrome.storage.sync.get('targetLang')
  ]);
  const targetLang = syncResult.targetLang || 'ru';
  const fullData = cleanEmptyEntries(mergeWithDeleted(
    baseData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [] },
    userData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [], _deleted: [] }
  ));
  const flatDict = flattenData(fullData, targetLang);
  await chrome.storage.local.set({ fullData, dictionary: flatDict });

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    chrome.tabs.sendMessage(tab.id, { action: 'updateDictionary', dictionary: flatDict }).catch(() => {});
  }
}

const SYNC_URLS = [
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-classes.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-engravings.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-interface.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-skills.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-arkpass.json',
  'https://raw.githubusercontent.com/AlleIuia/lostark-translator/main/dictionary/lt-classcore.json'
];
const AUTO_SYNC_THROTTLE_MS = 48 * 60 * 60 * 1000;

async function tryAutoSync() {
  const { autoSyncEnabled, lastAutoSync } = await chrome.storage.local.get(['autoSyncEnabled', 'lastAutoSync']);
  if (autoSyncEnabled !== true) return;
  const now = Date.now();
  if (lastAutoSync && (now - lastAutoSync) < AUTO_SYNC_THROTTLE_MS) return;
  try {
    await syncFromUrls(SYNC_URLS);
    await chrome.storage.local.set({ lastAutoSync: now, lastAutoSyncStatus: 'ok' });
  } catch (e) {
    await chrome.storage.local.set({ lastAutoSyncStatus: 'err:' + e.message });
  }
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
  'ark.bynn.jp',
  'loatracker.pages.dev',
  'reddit.com',
  'inven.co.kr'
];

async function loadSiteDefaults() {
  try {
    const res = await fetch(chrome.runtime.getURL('dictionary/lt-site-defaults.json'));
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function applySiteDefaults(force) {
  const defaults = await loadSiteDefaults();
  if (!defaults || typeof defaults !== 'object') return;

  const local = await chrome.storage.local.get(['siteProfiles', 'fitText']);
  const profiles = Object.assign({}, local.siteProfiles || {});
  const fit = local.fitText && typeof local.fitText === 'object'
    ? Object.assign({}, local.fitText)
    : { enabled: true, termScale: 100, allowWrap: true, expandParents: true, siteCss: '' };

  let siteCss = fit.siteCss || '';
  let profilesChanged = false;
  let cssChanged = false;

  for (const domain of Object.keys(defaults)) {
    const d = defaults[domain] || {};
    if (!profiles[domain] || force) {
      const prev = profiles[domain] || {};
      profiles[domain] = Object.assign({}, prev);
      if (d.termMode) profiles[domain].termMode = d.termMode;
      profilesChanged = true;
    }
    if (d.siteCss && String(d.siteCss).trim()) {
      const header = '# ' + domain;
      const hasBlock = new RegExp('(^|\\n)#\\s*' + domain.replace(/\./g, '\\.') + '\\s*(\\n|$)', 'i').test(siteCss);
      if (!hasBlock || force) {
        if (hasBlock && force) {
          const lines = siteCss.split('\n');
          const out = [];
          let inBlock = false;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const m = line.match(/^\s*#\s*([a-z0-9.-]+)\s*$/i);
            if (m) {
              const key = m[1].toLowerCase();
              if (inBlock) inBlock = false;
              if (key === domain.toLowerCase()) {
                inBlock = true;
                out.push(header);
                out.push(String(d.siteCss).trim());
                continue;
              }
            }
            if (inBlock) continue;
            out.push(line);
          }
          siteCss = out.join('\n');
        } else {
          siteCss = (siteCss ? siteCss.trim() + '\n\n' : '') + header + '\n' + String(d.siteCss).trim();
        }
        cssChanged = true;
      }
    }
  }

  const patch = {};
  if (profilesChanged) patch.siteProfiles = profiles;
  if (cssChanged) {
    fit.siteCss = siteCss;
    fit.enabled = true;
    patch.fitText = fit;
  }
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
}

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    const patch = {};
    if (details.reason === 'install') {
      patch.siteMode = 'developer';
      patch.developerSites = DEFAULT_DEV_SITES.join('\n');
    } else {
      const sync = await chrome.storage.sync.get(['developerSites', 'siteMode']);
      if (typeof sync.developerSites !== 'string' || !sync.developerSites.trim()) {
        patch.developerSites = DEFAULT_DEV_SITES.join('\n');
      }
      if (!sync.siteMode) {
        patch.siteMode = 'developer';
      }
    }
    if (Object.keys(patch).length) {
      await chrome.storage.sync.set(patch);
    }
  } catch (_) {}

  try {
    const baseData = await loadDefaultDictionaries();
    await chrome.storage.local.set({ baseData });
    await rebuildStorage();
  } catch (_) {}
  try { await applySiteDefaults(false); } catch (_) {}
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    const baseData = await loadDefaultDictionaries();
    await chrome.storage.local.set({ baseData });
    await rebuildStorage();
  } catch (_) {}
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'lt-quick-edit') return;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { action: 'quickEditSelection' }).catch(() => {});
  } catch (_) {}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const reply = (p) => {
    p.then(r => sendResponse({ success: true, ...r }))
     .catch(e => sendResponse({ success: false, error: e.message }));
  };

  if (request.action === 'addEntry') {
    reply(handleAddEntry(request));
    return true;
  }
  if (request.action === 'updateEntry') {
    reply(handleUpdateEntry(request.oldEn, request));
    return true;
  }
  if (request.action === 'deleteEntry') {
    reply(handleDeleteEntry(request.en, request.type, request.classEn));
    return true;
  }
  if (request.action === 'importData') {
    reply(handleImport(request.data));
    return true;
  }
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
  if (request.action === 'pageStats') {
    chrome.storage.session.set({ pageStats: { count: request.count, url: request.url, ts: Date.now() } }).catch(() => {});
    sendResponse({ success: true });
    return true;
  }
  if (request.action === 'getPageStats') {
    reply((async () => {
      const { pageStats } = await chrome.storage.session.get('pageStats');
      return { stats: pageStats || null };
    })());
    return true;
  }
  if (request.action === 'setCustomPatterns') {
    reply((async () => {
      await chrome.storage.local.set({ customPatterns: request.patterns || [] });
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (!tab.id) continue;
        chrome.tabs.sendMessage(tab.id, { action: 'updatePatterns', patterns: request.patterns || [] }).catch(() => {});
      }
    })());
    return true;
  }
  if (request.action === 'reloadBaseDictionaries') {
    reply((async () => {
      const baseData = await loadDefaultDictionaries();
      await chrome.storage.local.set({ baseData });
      await rebuildStorage();
      return {};
    })());
    return true;
  }
  if (request.action === 'getUserData') {
    reply((async () => {
      const { userData } = await chrome.storage.local.get('userData');
      return { userData: userData || { classes: [], engravings: [], _orphanBuilds: [], terms: [], skills: [], skillClasses: [], arkPassClasses: [], classCoreClasses: [], _deleted: [] } };
    })());
    return true;
  }
  if (request.action === 'setAutoSync') {
    reply((async () => {
      await chrome.storage.local.set({ autoSyncEnabled: !!request.enabled });
    })());
    return true;
  }
  if (request.action === 'forceAutoSync') {
    reply((async () => {
      await chrome.storage.local.set({ lastAutoSync: 0 });
      await tryAutoSync();
      const { lastAutoSyncStatus, lastAutoSync } = await chrome.storage.local.get(['lastAutoSyncStatus', 'lastAutoSync']);
      return { status: lastAutoSyncStatus, lastAutoSync };
    })());
    return true;
  }
  if (request.action === 'clearDictionary') {
    reply((async () => {
      const emptyUser = {
        classes: [],
        engravings: [],
        _orphanBuilds: [],
        terms: [],
        skills: [],
        skillClasses: [],
        arkPassClasses: [],
        classCoreClasses: [],
        _deleted: []
      };
      await chrome.storage.local.set({ userData: emptyUser });
      const baseData = await loadDefaultDictionaries();
      await chrome.storage.local.set({ baseData });
      await rebuildStorage();
      return {};
    })());
    return true;
  }
  if (request.action === 'reloadLocalDictionaries') {
    reply((async () => {
      const baseData = await loadDefaultDictionaries();
      await chrome.storage.local.set({ baseData });
      await rebuildStorage();
      const n = (baseData.terms || []).length;
      const has = (baseData.terms || []).some(t => (t.kr || '').includes('상태이상'));
      return { terms: n, hasStatusAilment: has };
    })());
    return true;
  }
});

(async () => {
  try {
    const baseData = await loadDefaultDictionaries();
    await chrome.storage.local.set({ baseData });
    await rebuildStorage();
  } catch (e) {
    console.error('init dict reload failed', e);
  }
})();
