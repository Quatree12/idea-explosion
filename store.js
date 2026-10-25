/* IDEA EXPLOSION - store.js - Persistance locale + etat de l'application */
(function () {
  "use strict";

  var KEY = "idea-explosion.v1";
  var memoryFallback = null;
  var storageOK = true;

  try {
    var probe = "__ie_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch (e) { storageOK = false; }

  function emptyState() {
    return { version: 1, ideas: [], draft: null, lastCombo: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  function normalize(parsed) {
    var s = emptyState();
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.ideas)) s.ideas = parsed.ideas.filter(function (i) { return i && i.id && i.combo; });
      if (parsed.draft && typeof parsed.draft === "object") s.draft = parsed.draft;
      if (parsed.lastCombo && typeof parsed.lastCombo === "object") s.lastCombo = parsed.lastCombo;
      if (parsed.createdAt) s.createdAt = parsed.createdAt;
      if (parsed.version) s.version = parsed.version;
    }
    return s;
  }

  function read() {
    if (!storageOK) return memoryFallback || emptyState();
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return emptyState();
      return normalize(JSON.parse(raw));
    } catch (e) { return emptyState(); }
  }

  function write(state) {
    state.updatedAt = new Date().toISOString();
    if (!storageOK) { memoryFallback = state; return { ok: true, persisted: false }; }
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return { ok: true, persisted: true };
    } catch (e) {
      memoryFallback = state;
      return { ok: false, persisted: false, error: "Stockage local plein ou refuse par le navigateur." };
    }
  }

  function uid() { return "idea_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); }
  function countBy(list, fn) { var out = {}; list.forEach(function (i) { var k = fn(i); out[k] = (out[k] || 0) + 1; }); return out; }

  var listeners = [];
  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  window.IE_STORE = {
    storageAvailable: function () { return storageOK; },
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    all: function () { return read(); },
    ideas: function () { return read().ideas; },
    get: function (id) {
      var list = read().ideas;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    },
    add: function (idea) {
      var s = read();
      if (!idea.id) idea.id = uid();
      idea.createdAt = idea.createdAt || new Date().toISOString();
      idea.updatedAt = new Date().toISOString();
      s.ideas.unshift(idea);
      var res = write(s);
      emit();
      return { idea: idea, result: res };
    },
    update: function (id, patch) {
      var s = read();
      for (var i = 0; i < s.ideas.length; i++) {
        if (s.ideas[i].id === id) {
          s.ideas[i] = Object.assign({}, s.ideas[i], patch, { updatedAt: new Date().toISOString() });
          var res = write(s);
          emit();
          return { idea: s.ideas[i], found: true, result: res };
        }
      }
      return { found: false };
    },
    remove: function (id) {
      var s = read();
      var before = s.ideas.length;
      s.ideas = s.ideas.filter(function (i) { return i.id !== id; });
      write(s); emit();
      return before !== s.ideas.length;
    },
    removeMany: function (ids) {
      var set = {};
      ids.forEach(function (id) { set[id] = true; });
      var s = read();
      var before = s.ideas.length;
      s.ideas = s.ideas.filter(function (i) { return !set[i.id]; });
      write(s); emit();
      return before - s.ideas.length;
    },
    clearAll: function () {
      var s = read();
      var n = s.ideas.length;
      s.ideas = [];
      write(s); emit();
      return n;
    },
    childrenOf: function (parentId) {
      return read().ideas.filter(function (i) { return i.parentId === parentId; });
    },
    saveDraft: function (draft) { var s = read(); s.draft = draft; write(s); },
    loadDraft: function () { return read().draft; },
    clearDraft: function () { var s = read(); s.draft = null; write(s); },
    saveLastCombo: function (combo) { var s = read(); s.lastCombo = combo; write(s); },
    loadLastCombo: function () { return read().lastCombo; },
    exportJSON: function () {
      var s = read();
      return JSON.stringify({ app: "IDEA EXPLOSION", version: 1, exportedAt: new Date().toISOString(), ideas: s.ideas }, null, 2);
    },
    importJSON: function (raw, mode) {
      var parsed;
      try { parsed = JSON.parse(raw); } catch (e) { return { ok: false, error: "Fichier JSON illisible." }; }
      if (!parsed || !Array.isArray(parsed.ideas)) return { ok: false, error: "Aucune liste d'idees trouvee dans ce fichier." };
      var incoming = parsed.ideas.filter(function (i) { return i && i.combo && i.name; });
      if (!incoming.length) return { ok: false, error: "Aucune idee valide dans ce fichier." };
      var s = read();
      if (mode === "replace") {
        s.ideas = incoming.map(function (i) { i.id = i.id || uid(); return i; });
      } else {
        var existing = {};
        s.ideas.forEach(function (i) { existing[i.id] = true; });
        incoming.forEach(function (i) { if (!i.id || existing[i.id]) i.id = uid(); s.ideas.unshift(i); });
      }
      write(s); emit();
      return { ok: true, count: incoming.length, mode: mode || "merge" };
    },
    stats: function () {
      var list = read().ideas;
      var active = list.filter(function (i) { return !i.archived; });
      return {
        total: list.length,
        active: active.length,
        favorite: list.filter(function (i) { return i.favorite; }).length,
        archived: list.filter(function (i) { return i.archived; }).length,
        variants: list.filter(function (i) { return !!i.parentId; }).length,
        kinds: countBy(list, function (i) { return i.combo.kind; }),
        domains: countBy(list, function (i) { return i.combo.domain; })
      };
    }
  };
})();
