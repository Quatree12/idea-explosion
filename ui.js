/* IDEA EXPLOSION - ui.js - Briques d'interface reutilisables */
(function () {
  "use strict";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "dataset") Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
        else if (k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, "");
        else node.setAttribute(k, v);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  var ICONS = {
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.3 6.3l3.2 3.2M14.5 14.5l3.2 3.2M17.7 6.3l-3.2 3.2M9.5 14.5l-3.2 3.2"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.8l5.9-.9z"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l8 10h4M4 17h4l3-3.7M16 7h4M18 4.5l2.5 2.5L18 9.5M18 14.5l2.5 2.5L18 19.5"/></svg>',
    tree: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.4 6.8L15.6 11M8.4 17.2L15.6 13"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L20 8l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
    archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="4" rx="1.5"/><path d="M5 8v12h14V8M10 12h4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  };

  function icon(name) {
    var span = document.createElement("span");
    span.innerHTML = ICONS[name] || ICONS.spark;
    return span.firstChild;
  }

  var toastRoot = null;
  function toast(message, kind) {
    if (!toastRoot) toastRoot = document.getElementById("toastRoot");
    var marks = { ok: "\u2713", warn: "!", info: "\u25C6" };
    var node = el("div", { class: "toast " + (kind || "info") }, [
      el("span", { class: "t-mark", text: marks[kind] || "\u25C6" }),
      el("span", { text: message })
    ]);
    toastRoot.appendChild(node);
    setTimeout(function () {
      node.classList.add("leaving");
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 260);
    }, 3200);
  }

  var openModalNode = null;
  var lastFocused = null;

  function closeModal() {
    if (!openModalNode) return;
    var n = openModalNode;
    openModalNode = null;
    n.classList.add("leaving");
    setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 180);
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function modal(opts) {
    var root = document.getElementById("modalRoot");
    lastFocused = document.activeElement;
    var card = el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": opts.title || "Boite de dialogue" }, [
      el("div", { class: "grabber", "aria-hidden": "true" }),
      opts.title ? el("h2", { text: opts.title }) : null,
      opts.subtitle ? el("p", { class: "modal-sub", text: opts.subtitle }) : null,
      opts.body || null,
      opts.actions ? el("div", { class: "modal-actions" }, opts.actions.map(function (a) {
        return el("button", {
          class: "btn " + (a.class || ""), type: "button", text: a.label,
          onclick: function () { if (!a.keepOpen) closeModal(); if (a.onClick) a.onClick(); }
        });
      })) : null
    ]);

    var backdrop = el("div", {
      class: "sheet-backdrop",
      onclick: function (e) { if (e.target === backdrop && opts.dismissible !== false) closeModal(); }
    }, [card]);

    root.appendChild(backdrop);
    openModalNode = backdrop;

    if (opts.body) {
      var first = card.querySelector("input, textarea, button.btn-primary");
      if (first) setTimeout(function () { first.focus(); }, 60);
    }
    return backdrop;
  }

  function confirm(opts) {
    return new Promise(function (resolve) {
      modal({
        title: opts.title, subtitle: opts.subtitle, body: opts.body || null,
        actions: [
          { label: opts.cancelLabel || "Annuler", class: "btn-ghost", onClick: function () { resolve(false); } },
          { label: opts.confirmLabel || "Confirmer", class: opts.danger ? "btn-coral" : "btn-primary", onClick: function () { resolve(true); } }
        ]
      });
    });
  }

  function prompt(opts) {
    return new Promise(function (resolve) {
      var input = el("input", { type: "text", value: opts.value || "", placeholder: opts.placeholder || "", maxlength: opts.maxlength || "120" });
      modal({
        title: opts.title, subtitle: opts.subtitle,
        body: el("div", { class: "field" }, [input]),
        actions: [
          { label: "Annuler", class: "btn-ghost", onClick: function () { resolve(null); } },
          { label: opts.confirmLabel || "Enregistrer", class: "btn-primary", onClick: function () { var v = input.value.trim(); resolve(v || (opts.value || "")); } }
        ]
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); var v = input.value.trim(); closeModal(); resolve(v || (opts.value || "")); }
      });
    });
  }

  function copyText(text) {
    return new Promise(function (resolve) {
      var fail = function () {
        try {
          var ta = document.createElement("textarea");
          ta.value = text; ta.setAttribute("readonly", "");
          ta.style.position = "fixed"; ta.style.top = "-1000px";
          document.body.appendChild(ta); ta.select();
          var done = document.execCommand("copy");
          document.body.removeChild(ta);
          resolve(!!done);
        } catch (e) { resolve(false); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { resolve(true); }).catch(fail);
      else fail();
    });
  }

  function download(filename, content, mime) {
    try {
      var blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1200);
      return true;
    } catch (e) { return false; }
  }

  function share(filename, content, mime) {
    var canShareFiles = false;
    try {
      canShareFiles = !!(navigator.canShare && navigator.share && navigator.canShare({ files: [new File([""], "x.txt", { type: "text/plain" })] }));
    } catch (e) { canShareFiles = false; }

    if (navigator.share) {
      if (canShareFiles) {
        var file = new File([content], filename, { type: mime || "text/plain" });
        return navigator.share({ files: [file], title: filename }).then(function () { return "shared"; }).catch(function (err) {
          if (err && err.name === "AbortError") return "cancelled";
          return "unsupported";
        });
      }
      return navigator.share({ title: filename, text: content }).then(function () { return "shared"; }).catch(function (err) {
        if (err && err.name === "AbortError") return "cancelled";
        return "unsupported";
      });
    }
    return Promise.resolve("unsupported");
  }

  function relTime(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "date inconnue";
    var diff = Date.now() - d.getTime();
    var min = Math.round(diff / 60000);
    if (min < 1) return "a l'instant";
    if (min < 60) return "il y a " + min + " min";
    var h = Math.round(min / 60);
    if (h < 24) return "il y a " + h + " h";
    var j = Math.round(h / 24);
    if (j < 30) return "il y a " + j + " j";
    return d.toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" });
  }

  function kindById(id) {
    var list = window.IE_DATA.KINDS;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function signatureArt(idea) {
    var s = idea.signature || { h1: 268, h2: 190, h3: 40, facets: 4 };
    var facets = s.facets || 4;
    var polys = [];
    for (var i = 0; i < facets; i++) {
      var a = (i / facets) * Math.PI * 2;
      var cx = 50 + Math.cos(a) * 24;
      var cy = 50 + Math.sin(a) * 24;
      var r = 22 + (i % 3) * 6;
      var pts = [];
      for (var j = 0; j < 3; j++) {
        var b = (j / 3) * Math.PI * 2 + a;
        pts.push((cx + Math.cos(b) * r).toFixed(1) + "," + (cy + Math.sin(b) * r).toFixed(1));
      }
      var op = (0.13 + (i % 3) * 0.07).toFixed(2);
      polys.push('<polygon points="' + pts.join(" ") + '" fill="hsl(' + ((i % 2 ? s.h2 : s.h1) + i * 9) + ' 90% 68%)" opacity="' + op + '"/>');
    }
    var dom = document.createElement("div");
    dom.className = "sig-art";
    dom.innerHTML =
      '<div class="sig-layer" style="background:radial-gradient(58% 70% at 22% 24%, hsl(' + s.h1 + ' 95% 70% / 0.65), transparent 62%),' +
      'radial-gradient(52% 62% at 82% 30%, hsl(' + s.h2 + ' 92% 66% / 0.55), transparent 64%),' +
      'radial-gradient(70% 70% at 50% 110%, hsl(' + s.h3 + ' 90% 64% / 0.5), transparent 66%)"></div>' +
      '<svg class="sig-facets" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + polys.join("") + '</svg>' +
      '<span class="sig-glyph" aria-hidden="true">' + (kindById(idea.combo.kind) ? kindById(idea.combo.kind).glyph : "\u2733") + '</span>' +
      '<span class="sig-caption">Illustration derivee des ingredients</span>';
    return dom;
  }

  function tintFor(idea) {
    var s = idea.signature || { h1: 268, h2: 190 };
    return {
      bg: "linear-gradient(140deg, hsl(" + s.h1 + " 88% 66%), hsl(" + s.h2 + " 84% 62%))",
      raw: "hsl(" + s.h1 + " 88% 66%)",
      raw2: "hsl(" + s.h2 + " 84% 62%)"
    };
  }

  window.IE_UI = {
    el: el, clear: clear, icon: icon, ICONS: ICONS,
    toast: toast, modal: modal, closeModal: closeModal, confirm: confirm, prompt: prompt,
    copyText: copyText, download: download, share: share,
    relTime: relTime, kindById: kindById, signatureArt: signatureArt, tintFor: tintFor
  };
})();
