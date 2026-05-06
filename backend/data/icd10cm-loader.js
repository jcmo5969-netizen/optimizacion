// Carga ICD-10-CM (formato tabular USA/CMS) desde JSON local y expone búsqueda + lookup.
// Las descripciones vienen en inglés (fuente CMS); los códigos son compatibles con CIE-10 MMS para categorías.

(function () {
  /** @type {Array<{ raw: string, codigo: string, descripcion: string, searchIdx: string }>|null} */
  let list = null;
  /** @type {Map<string, { raw: string, codigo: string, descripcion: string }>|null} */
  let byRaw = null;
  let loadPromise = null;

  function formatIcd10CmCode(raw) {
    const c = String(raw || '').replace(/\./g, '').toUpperCase();
    if (c.length <= 3) return c;
    return c.slice(0, 3) + '.' + c.slice(3);
  }

  function normalizeLookupKey(key) {
    return String(key || '').replace(/\./g, '').toUpperCase();
  }

  function heuristicLos(raw) {
    const L = raw[0];
    const map = {
      S: 9, T: 10, V: 8, R: 5, J: 6, I: 7, C: 9, K: 5, N: 4, G: 7, M: 6, P: 5, O: 4, Q: 12,
      D: 4, E: 5, F: 8, H: 4, L: 5, Z: 3, A: 5, B: 5,
    };
    let base = map[L] || 5;
    const tail = parseInt(raw.slice(-2), 10);
    if (!Number.isNaN(tail)) base += (tail % 5) - 2;
    return Math.min(21, Math.max(2, base));
  }

  function heuristicRiskBonus(raw) {
    const L = raw[0];
    let bonus = (raw.length + (raw.charCodeAt(raw.length - 1) || 0)) % 12;
    if (L === 'R' && raw.startsWith('R57')) bonus += 15;
    if (L === 'J' && raw.startsWith('J96')) bonus += 10;
    if (L === 'R' && raw.startsWith('R65')) bonus += 18;
    return Math.min(22, bonus);
  }

  /**
   * @returns {Promise<Array<{ raw: string, codigo: string, descripcion: string, searchIdx: string }>>}
   */
  function ensureLoaded() {
    if (list) return Promise.resolve(list);
    if (loadPromise) return loadPromise;
    loadPromise = fetch('backend/data/icd10cm_raw.json')
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo cargar icd10cm_raw.json');
        return r.json();
      })
      .then(function (obj) {
        list = [];
        byRaw = new Map();
        Object.keys(obj).forEach(function (raw) {
          const descripcion = obj[raw];
          const codigo = formatIcd10CmCode(raw);
          const searchIdx = (codigo + ' ' + raw + ' ' + descripcion).toLowerCase();
          const row = { raw, codigo, descripcion, searchIdx };
          list.push(row);
          byRaw.set(raw.toUpperCase(), row);
        });
        return list;
      })
      .catch(function (e) {
        loadPromise = null;
        throw e;
      });
    return loadPromise;
  }

  /**
   * @param {string} query
   * @param {number} limit
   */
  function search(query, limit) {
    if (!list || !query) return [];
    const lim = Math.min(200, Math.max(20, limit || 80));
    const q = query.trim().toLowerCase();
    const qDotless = q.replace(/\./g, '');
    const out = [];
    for (let i = 0; i < list.length && out.length < lim; i++) {
      const e = list[i];
      if (
        e.raw.toLowerCase().indexOf(qDotless) !== -1 ||
        e.searchIdx.indexOf(q) !== -1 ||
        e.codigo.toLowerCase().indexOf(q) !== -1
      ) {
        out.push(e);
      }
    }
    return out;
  }

  /**
   * @param {string} key — código con o sin puntos (ej. K56.5 o K565)
   * @returns {{ codigo: string, descripcion: string, raw: string, losPredichoTipico: number, riskBonus: number }|undefined}
   */
  function lookupCie10(key) {
    if (!byRaw || !key) return undefined;
    const raw = normalizeLookupKey(key);
    const e = byRaw.get(raw);
    if (!e) return undefined;
    return {
      codigo: e.codigo,
      descripcion: e.descripcion,
      raw: e.raw,
      losPredichoTipico: heuristicLos(e.raw),
      riskBonus: heuristicRiskBonus(e.raw),
    };
  }

  window.ICD10_CM = {
    ensureLoaded: ensureLoaded,
    search: search,
    formatCode: formatIcd10CmCode,
    /** true cuando el índice ya está en memoria */
    isReady: function () {
      return !!list;
    },
  };

  window.lookupCie10 = lookupCie10;
})();
