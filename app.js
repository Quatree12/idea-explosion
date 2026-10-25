/* IDEA EXPLOSION - app.js - fichier complet : routeur + 6 ecrans */
(function () {
  "use strict";
  var el = IE_UI.el, UI = IE_UI, E = IE_ENGINE, S = IE_STORE, D = IE_DATA;
  var ROOT = document.getElementById("app");

  var App = {
    screen: "lab", stack: [],
    labSelection: { kind: "kin.app" },
    labOrbs: [
      { slot: "domain", id: "dom.sound" }, { slot: "domain", id: "dom.game" },
      { slot: "object", id: "obj.mirror" }, { slot: "object", id: "obj.seed" },
      { slot: "constraint", id: "con.two" }, { slot: "constraint", id: "con.one" },
      { slot: "twist", id: "twit.memory" }, { slot: "twist", id: "twit.grow" }
    ],
    fusion: null, fusionSheet: null, fusionSheetTarget: null, armed: null,
    currentIdea: null, vaultQuery: "", vaultFilter: "all", vaultSort: "recent", busy: false
  };

  var SCREENS = ["lab", "fusion", "explosion", "blueprint", "tree", "vault"];

  function go(screen, opts) {
    if (SCREENS.indexOf(screen) === -1) screen = "lab";
    if (!opts || !opts.replace) {
      if (App.screen !== screen) App.stack.push(App.screen);
      if (App.stack.length > 24) App.stack.shift();
    }
    App.screen = screen;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    var prev = App.stack.pop() || "lab";
    App.screen = prev; render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setTab(screen) {
    document.querySelectorAll(".tabbar .tab").forEach(function (t) {
      if (t.getAttribute("data-nav") === screen) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
  }

  function updateBadge() {
    var b = document.getElementById("vaultBadge");
    if (!b) return;
    var n = S.ideas().filter(function (i) { return !i.archived; }).length;
    if (n > 0) { b.hidden = false; b.textContent = n > 99 ? "99" : String(n); }
    else b.hidden = true;
  }

  function screenEl(children, name) {
    var node = el("div", { class: "screen", dataset: { screen: name || App.screen } });
    children.forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function head(title, sub, opts) {
    opts = opts || {};
    var kids = [];
    if (opts.back) kids.push(el("button", { class: "back", type: "button", "aria-label": "Retour", onclick: opts.back === true ? back : opts.back }, [UI.icon("back")]));
    kids.push(el("div", {}, [
      opts.kicker ? el("span", { class: "kicker", text: opts.kicker }) : null,
      el("h1", { text: title }),
      sub ? el("span", { class: "sub", text: sub }) : null
    ]));
    return el("div", { class: "screen-head" }, kids);
  }

  function sectionTitle(text, hint) {
    return el("div", { class: "section-title" }, [el("h2", { text: text }), hint ? el("span", { class: "hint", text: hint }) : null]);
  }

  function note(text, kind) {
    return el("div", { class: "note " + (kind || "") }, [
      el("span", { class: "n-glyph", text: kind === "warn" ? "!" : "\u25C6" }),
      el("span", { text: text })
    ]);
  }

  function chip(ing, selected, onClick, extra) {
    return el("button", {
      class: "chip" + (selected ? " selected" : ""), type: "button",
      "aria-pressed": selected ? "true" : "false", onclick: onClick
    }, [
      el("span", { class: "glyph", text: ing.glyph, "aria-hidden": "true" }),
      el("span", { text: ing.label }),
      extra ? el("span", { class: "faint", text: extra }) : null
    ]);
  }

  function ideaCard(idea) {
    var kind = UI.kindById(idea.combo.kind);
    var tint = IE_UI.tintFor(idea);
    return el("div", {
      class: "idea-card", role: "button", tabindex: "0",
      onclick: function (e) { if (e.target.closest && e.target.closest(".star")) return; openIdea(idea.id); },
      onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIdea(idea.id); } }
    }, [
      el("div", { class: "thumb", style: "background:" + tint.bg, "aria-hidden": "true", text: kind ? kind.glyph : "\u2733" }),
      el("div", { class: "body" }, [
        el("div", { class: "name", text: idea.name }),
        el("div", { class: "pitch", text: idea.pitch }),
        el("div", { class: "tags" }, [
          el("span", { class: "tag", text: kind ? kind.label : "\u2014" }),
          idea.mutationLabel ? el("span", { class: "tag good", text: "variante" }) : null,
          idea.archived ? el("span", { class: "tag warn", text: "archiv\u00e9e" }) : null,
          el("span", { class: "tag", text: UI.relTime(idea.updatedAt || idea.createdAt) })
        ])
      ]),
      el("button", {
        class: "star" + (idea.favorite ? " on" : ""), type: "button",
        "aria-label": idea.favorite ? "Retirer des favoris" : "Ajouter aux favoris",
        "aria-pressed": idea.favorite ? "true" : "false",
        onclick: function (e) { e.stopPropagation(); toggleFavorite(idea.id); }
      }, [UI.icon("star")])
    ]);
  }

  function toggleFavorite(id) {
    var idea = S.get(id);
    if (!idea) { UI.toast("Cette id\u00e9e n'existe plus.", "warn"); render(); return; }
    S.update(id, { favorite: !idea.favorite });
    UI.toast(idea.favorite ? "Retir\u00e9e des favoris." : "Ajout\u00e9e aux favoris.", "ok");
    render();
  }

  function openIdea(id) {
    var idea = S.get(id);
    if (!idea) { UI.toast("Cette id\u00e9e n'existe plus.", "warn"); go("vault"); return; }
    App.currentIdea = idea;
    go("explosion");
  }

  function comboComplete(combo) {
    return !!(combo && combo.kind && combo.domain && combo.object && combo.constraint);
  }

  function slotLabel(key) {
    var s = D.SLOTS.filter(function (x) { return x.key === key; })[0];
    return s ? s.label : key;
  }

  function startExplosion(combo, opts) {
    opts = opts || {};
    if (!comboComplete(combo)) { UI.toast("Il manque encore un ingr\u00e9dient : domaine, objet et contrainte sont requis.", "warn"); return; }
    S.saveLastCombo(combo);
    App.busy = true;
    render();
    var steps = ["Alignement des ingr\u00e9dients\u2026", "Fusion des champs de sens\u2026", "Calcul de l'ADN cr\u00e9atif\u2026", "Recomposition du concept\u2026"];
    var idx = 0;
    var timer = setInterval(function () {
      idx++;
      var bar = document.getElementById("chargeBar");
      var lbl = document.getElementById("chargeLabel");
      if (lbl && idx <= steps.length) lbl.textContent = steps[idx - 1];
      if (bar) bar.style.width = Math.min(100, (idx / steps.length) * 100) + "%";
    }, 340);
    setTimeout(function () {
      clearInterval(timer);
      var idea = E.generateIdea({
        kind: combo.kind, domain: combo.domain, object: combo.object,
        constraint: combo.constraint, twist: combo.twist || null,
        seed: opts.seed || (Date.now() >>> 0),
        parentId: opts.parentId || null, mutationLabel: opts.mutationLabel || null
      });
      App.busy = false;
      App.currentIdea = idea;
      render();
      var stage = document.querySelector(".explosion-stage");
      if (stage) { stage.classList.add("bursting"); setTimeout(function () { stage.classList.remove("bursting"); }, 1200); }
      UI.toast("Id\u00e9e g\u00e9n\u00e9r\u00e9e. Pense \u00e0 l'enregistrer dans le Vault.", "ok");
    }, 1450);
  }

  /* ECRAN 1 - THE LAB */
  function renderLab() {
    var recent = S.ideas().filter(function (i) { return !i.archived; }).slice(0, 3);
    var last = S.loadLastCombo();
    var sel = App.labSelection;
    var kids = [];

    kids.push(el("div", { class: "hero reveal-seq" }, [
      el("span", { class: "kicker", text: "The Creative Chaos Engine" }),
      el("h1", { class: "display" }, [
        document.createTextNode("Fais "), el("span", { class: "accent", text: "exploser" }), document.createTextNode(" une id\u00e9e.")
      ]),
      el("p", { class: "lede", text: "Choisis des fragments, fais-les entrer en collision, et repars avec un concept exploitable \u2014 pas un paragraphe de texte." })
    ]));

    var field = el("div", { class: "orb-field" }, [el("div", { class: "grid-lines", "aria-hidden": "true" })]);
    App.labOrbs.forEach(function (entry, i) {
      var ing = (D.INGREDIENTS[entry.slot] || []).filter(function (x) { return x.id === entry.id; })[0];
      if (!ing) return;
      var pos = [
        { top: "12%", left: "9%" }, { top: "46%", left: "4%" },
        { top: "20%", left: "62%" }, { top: "62%", left: "58%" },
        { top: "7%", left: "36%" }, { top: "75%", left: "26%" },
        { top: "34%", left: "30%" }, { top: "58%", left: "38%" }
      ][i] || { top: "20%", left: "20%" };
      var size = 62 + ((i * 7) % 5) * 8;
      var tint = IE_UI.tintFor({ signature: { h1: 200 + i * 22, h2: 260 + i * 13 } });
      var selected = sel[entry.slot] === entry.id;
      field.appendChild(el("button", {
        class: "float-orb", type: "button",
        style: "top:" + pos.top + ";left:" + pos.left + ";width:" + size + "px;height:" + size +
          "px;--oc1:" + tint.raw + ";--oc2:" + tint.raw2 + ";--dur:" + (6 + (i % 4)) + "s;font-size:" + (size / 3.1) + "px",
        "aria-pressed": selected ? "true" : "false",
        "aria-label": ing.label + " \u2014 " + slotLabel(entry.slot),
        text: ing.glyph,
        onclick: function () {
          if (sel[entry.slot] === entry.id) delete sel[entry.slot]; else sel[entry.slot] = entry.id;
          render();
        }
      }));
    });

    var pickedCount = ["domain", "object", "constraint", "twist"].filter(function (s) { return sel[s]; }).length;
    field.appendChild(el("div", { class: "orb-legend" }, [
      el("span", { class: "faint", text: "Objets s\u00e9lectionnables" }),
      el("span", { style: "flex:1" }),
      el("strong", { text: pickedCount + " fragment" + (pickedCount > 1 ? "s" : "") })
    ]));
    kids.push(field);

    kids.push(el("div", { class: "combo-strip" }, D.SLOTS.map(function (s) {
      var id = sel[s.key];
      var ing = id ? (D.INGREDIENTS[s.key] || []).filter(function (x) { return x.id === id; })[0] : null;
      return el("div", { class: "mini-slot" + (ing ? "" : " empty") }, [
        el("span", { class: "lbl", text: s.label }),
        el("span", { class: "val" }, [
          el("span", { text: ing ? ing.glyph : "\u25CB", "aria-hidden": "true" }),
          el("span", { text: ing ? ing.label : "libre" })
        ])
      ]);
    })));

    kids.push(note("Le Lab ne fait aucune requ\u00eate : tout se calcule sur ton appareil. L'IA n'est pas branch\u00e9e \u2014 le moteur recompose des fragments, il n'invente pas \u00e0 ta place.", ""));
    kids.push(el("div", { style: "height:14px" }));

    kids.push(sectionTitle("Type de cr\u00e9ation", "d\u00e9termine la forme du r\u00e9sultat"));
    kids.push(el("div", { class: "chip-grid" }, D.KINDS.map(function (k) {
      return chip(k, sel.kind === k.id, function () { sel.kind = k.id; render(); });
    })));

    kids.push(el("div", { style: "height:18px" }));
    var canGo = pickedCount >= 3 && !!sel.kind;
    kids.push(el("button", {
      class: "btn " + (canGo ? "btn-primary" : "btn-ghost") + " btn-block",
      type: "button", "aria-disabled": canGo ? "false" : "true",
      onclick: function () {
        if (!canGo) { UI.toast("Ajoute au moins domaine, objet et contrainte pour ouvrir la Fusion Chamber.", "warn"); return; }
        App.fusion = { kind: sel.kind, domain: sel.domain || null, object: sel.object || null, constraint: sel.constraint || null, twist: sel.twist || null };
        go("fusion");
      }
    }, [UI.icon("spark"), document.createTextNode(canGo ? "Cr\u00e9er une explosion" : "S\u00e9lectionne 3 fragments")]));

    kids.push(sectionTitle("Historique r\u00e9cent", recent.length ? recent.length + " sur " + S.ideas().length : "vide"));
    if (!recent.length) {
      kids.push(el("div", { class: "empty" }, [
        el("div", { class: "e-glyph", "aria-hidden": "true", text: "\u2727" }),
        el("h3", { text: "Aucune id\u00e9e encore" }),
        el("p", { text: "Ta premi\u00e8re explosion prendra environ deux minutes : choisis trois fragments ci-dessus." }),
        el("button", { class: "btn btn-primary", type: "button", text: "Ouvrir la Fusion Chamber",
          onclick: function () {
            if (!App.fusion) App.fusion = { kind: sel.kind, domain: sel.domain || null, object: sel.object || null, constraint: sel.constraint || null, twist: sel.twist || null };
            go("fusion");
          }
        })
      ]));
    } else {
      recent.forEach(function (i) { kids.push(ideaCard(i)); });
      kids.push(el("button", { class: "btn btn-ghost btn-block", type: "button", onclick: function () { go("vault"); } },
        [UI.icon("archive"), document.createTextNode("Ouvrir tout le Vault")]));
    }
    if (last) kids.push(el("p", { class: "faint", style: "margin-top:16px;font-size:12.5px;text-align:center", text: "Dernier combo utilis\u00e9 : " + [last.domain, last.object, last.constraint].join(" \u00b7 ") }));
    return screenEl(kids, "lab");
  }

  /* ECRAN 2 - FUSION CHAMBER */
  function renderFusion() {
    var kids = [];
    var f = App.fusion;
    if (!f) f = App.fusion = { kind: App.labSelection.kind || "kin.app", domain: App.labSelection.domain || null, object: App.labSelection.object || null, constraint: App.labSelection.constraint || null, twist: App.labSelection.twist || null };
    var filled = ["domain", "object", "constraint"].filter(function (k) { return f[k]; }).length;

    kids.push(head("Fusion Chamber", filled + "/3 ingr\u00e9dients requis", { back: true }));
    kids.push(el("p", { class: "lede", style: "margin-bottom:16px", text: "Fais glisser un fragment sur le c\u0153ur, ou utilise \u00ab Choisir \u00bb sur chaque ligne. Les deux m\u00e9thodes font exactement la m\u00eame chose." }));

    var core = el("button", {
      class: "core", type: "button", dataset: { charge: String(filled) }, id: "fusionCore",
      "aria-label": "C\u0153ur de fusion \u2014 " + filled + " ingr\u00e9dient(s) sur 3",
      onclick: function () {
        if (filled >= 3) return;
        var next = ["domain", "object", "constraint"].filter(function (k) { return !f[k]; })[0];
        openIngredientSheet(next, "core");
      }
    }, [document.createTextNode(filled >= 3 ? "PR\u00caT" : filled + "/3")]);

    var stage = el("div", { class: "fusion-stage", id: "fusionStage" }, [
      core,
      el("div", { class: "stage-hint", text: filled >= 3 ? "Les trois ingr\u00e9dients sont en place." : "Glisse un fragment ici ou touche le c\u0153ur pour ouvrir la liste." })
    ]);

    ["domain", "object", "constraint"].forEach(function (slot, i) {
      var pool = D.INGREDIENTS[slot] || [];
      var current = f[slot];
      var ing = current ? pool.filter(function (x) { return x.id === current; })[0] : pool[i % pool.length];
      if (!ing) return;
      var dc = el("button", {
        class: "chip drag-chip", type: "button",
        style: "top:" + (58 + i * 26) + "%;left:" + (5 + i * 5) + "%",
        "aria-label": "Fragment " + ing.label + " \u2014 appuyer pour choisir",
        onclick: function () { openIngredientSheet(slot, "core"); }
      }, [
        el("span", { class: "glyph", text: ing.glyph, "aria-hidden": "true" }),
        el("span", { text: ing.label })
      ]);
      makeDraggable(dc, stage, core, slot);
      stage.appendChild(dc);
    });
    kids.push(stage);

    kids.push(el("div", { class: "slot-rail" }, D.SLOTS.filter(function (s) { return s.key !== "kind"; }).map(function (s) {
      var id = f[s.key];
      var ing = id ? (D.INGREDIENTS[s.key] || []).filter(function (x) { return x.id === id; })[0] : null;
      var required = s.key !== "twist";
      return el("div", { class: "slot-row " + (ing ? "filled" : "") + (App.armed === s.key ? " armed" : ""), id: "slotRow-" + s.key }, [
        el("div", { class: "slot-key", "aria-hidden": "true", text: s.icon }),
        el("div", { class: "slot-body" }, [
          el("span", { class: "lbl", text: s.label + (required ? " \u00b7 requis" : " \u00b7 optionnel") }),
          el("span", { class: "val " + (ing ? "" : "muted"), text: ing ? ing.glyph + "  " + ing.label : "\u2014 \u00e0 d\u00e9finir" })
        ]),
        el("div", { class: "slot-actions" }, [
          ing ? el("button", { class: "icon-sm", type: "button", "aria-label": "Remettre \u00e0 z\u00e9ro " + s.label, text: "\u2715",
            onclick: function (e) { e.stopPropagation(); f[s.key] = null; S.saveDraft(f); render(); } }) : null,
          el("button", { class: "icon-sm", type: "button", "aria-label": "Choisir " + s.label,
            onclick: function () { openIngredientSheet(s.key, "core"); } }, [UI.icon("swap")])
        ])
      ]);
    })));

    if (App.fusionSheet && App.fusionSheetTarget) kids.push(ingredientSheet(App.fusionSheet, App.fusionSheetTarget, f));

    kids.push(sectionTitle("Format de sortie", "ce que l'id\u00e9e va devenir"));
    kids.push(el("div", { class: "chip-grid" }, D.KINDS.map(function (k) {
      return chip(k, f.kind === k.id, function () { f.kind = k.id; S.saveDraft(f); render(); });
    })));

    kids.push(el("div", { style: "height:10px" }));
    kids.push(note("Combinaisons possibles : " + D.TOTAL_COMBOS + " avec les ingr\u00e9dients actuels, multipli\u00e9es par les " + D.KINDS.length + " formats. Chaque tirage produit un r\u00e9sultat diff\u00e9rent.", ""));

    var ready = filled >= 3;
    kids.push(el("div", { class: "sticky-cta" }, [
      el("button", {
        class: "btn " + (ready ? "btn-primary" : "btn-ghost") + " btn-block", type: "button",
        "aria-disabled": ready ? "false" : "true",
        onclick: function () {
          if (!ready) { UI.toast("Il manque " + (3 - filled) + " ingr\u00e9dient(s) obligatoire(s).", "warn"); return; }
          S.clearDraft();
          startExplosion(f, {});
        }
      }, [UI.icon("spark"), document.createTextNode(ready ? "D\u00e9clencher l'explosion" : "Encore " + (3 - filled) + " \u00e0 choisir")]),
      el("div", { class: "btn-row", style: "margin-top:10px" }, [
        el("button", { class: "btn btn-ghost btn-sm", type: "button",
          onclick: function () {
            ["domain", "object", "constraint", "twist"].forEach(function (k) {
              var pool = D.INGREDIENTS[k];
              f[k] = pool[Math.floor(Math.random() * pool.length)].id;
            });
            S.saveDraft(f);
            UI.toast("Combo tir\u00e9 au hasard.", "ok");
            render();
          }
        }, [UI.icon("shuffle"), document.createTextNode("Tout au hasard")]),
        el("button", { class: "btn btn-ghost btn-sm", type: "button",
          onclick: function () {
            f.domain = f.object = f.constraint = f.twist = null;
            App.fusionSheet = null; S.saveDraft(f);
            UI.toast("S\u00e9lection vid\u00e9e.", "info");
            render();
          }
        }, [document.createTextNode("Vider")])
      ])
    ]));
    return screenEl(kids, "fusion");
  }

  function openIngredientSheet(slot, target) {
    App.fusionSheet = slot; App.fusionSheetTarget = target; App.armed = slot; render();
  }

  function ingredientSheet(slot, target, f) {
    var s = D.SLOTS.filter(function (x) { return x.key === slot; })[0];
    var wrap = el("div", { class: "sheet" }, [
      el("span", { class: "sheet-title", text: "Choisir un ingr\u00e9dient \u2014 " + s.label }),
      el("p", { class: "faint", style: "font-size:12.5px;width:100%;margin:0 0 6px", text: s.help })
    ]);
    (D.INGREDIENTS[slot] || []).forEach(function (ing) {
      wrap.appendChild(chip(ing, f[slot] === ing.id, function () {
        f[slot] = ing.id;
        App.fusionSheet = null; App.fusionSheetTarget = null; App.armed = null;
        S.saveDraft(f); render();
        UI.toast(s.label + " : " + ing.label, "ok");
      }));
    });
    wrap.appendChild(el("button", { class: "link-btn", type: "button",
      onclick: function () {
        if (slot === "twist") f.twist = null; else f[slot] = null;
        App.fusionSheet = null; App.fusionSheetTarget = null; App.armed = null;
        S.saveDraft(f); render();
      },
      text: slot === "twist" ? "Aucun twist" : "Remettre \u00e0 z\u00e9ro"
    }));
    return wrap;
  }

  function makeDraggable(node, stage, coreEl, slot) {
    var startX = 0, startY = 0, dragging = false, moved = false;
    function onDown(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true; moved = false;
      if (node.setPointerCapture) node.setPointerCapture(e.pointerId);
      var t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY;
      node.classList.add("dragging");
    }
    function onMove(e) {
      if (!dragging) return;
      var t = e.touches ? e.touches[0] : e;
      var dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      node.style.transform = "translate3d(" + dx + "px," + dy + "px,0) scale(1.06)";
      var r = coreEl.getBoundingClientRect();
      coreEl.classList.toggle("dragover", t.clientX > r.left && t.clientX < r.right && t.clientY > r.top && t.clientY < r.bottom);
      if (moved) e.preventDefault();
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      node.classList.remove("dragging");
      node.style.transform = "";
      coreEl.classList.remove("dragover");
      if (moved) {
        var t = e.changedTouches ? e.changedTouches[0] : e;
        var r = coreEl.getBoundingClientRect();
        if (t.clientX > r.left && t.clientX < r.right && t.clientY > r.top && t.clientY < r.bottom) openIngredientSheet(slot, "core");
        else UI.toast("D\u00e9pose le fragment sur le c\u0153ur, ou touche \u00ab Choisir \u00bb sur sa ligne.", "info");
      }
    }
    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onUp);
    node.addEventListener("pointercancel", onUp);
  }

  /* ECRAN 3 - THE EXPLOSION */
  function renderExplosion() {
    var kids = [];
    if (App.busy) {
      kids.push(head("The Explosion", "g\u00e9n\u00e9ration en cours"));
      kids.push(el("div", { class: "explosion-stage" }, [
        el("div", { class: "rays", "aria-hidden": "true" }),
        el("div", { class: "charge-run" }, [
          el("div", { class: "prism", "aria-hidden": "true" }),
          el("span", { class: "charge-label", id: "chargeLabel", text: "Alignement des ingr\u00e9dients\u2026" }),
          el("div", { class: "charge-name", id: "chargeName", text: "\u2026" }),
          el("div", { class: "charge-bar", role: "progressbar", "aria-label": "Progression de la g\u00e9n\u00e9ration" }, [el("i", { id: "chargeBar" })])
        ])
      ]));
      kids.push(el("div", { class: "skeleton" }, [
        el("div", { class: "sk-line w60" }), el("div", { class: "sk-line" }),
        el("div", { class: "sk-line w80" }), el("div", { class: "sk-line w40" })
      ]));
      return screenEl(kids, "explosion");
    }

    var idea = App.currentIdea;
    if (!idea) {
      kids.push(head("The Explosion", "aucune id\u00e9e active"));
      kids.push(el("div", { class: "empty" }, [
        el("div", { class: "e-glyph", "aria-hidden": "true", text: "\u2733" }),
        el("h3", { text: "Rien \u00e0 afficher" }),
        el("p", { text: "Lance une explosion depuis la Fusion Chamber pour voir un concept appara\u00eetre ici." }),
        el("button", { class: "btn btn-primary", type: "button", text: "Aller \u00e0 la Fusion Chamber", onclick: function () { go("fusion"); } })
      ]));
      return screenEl(kids, "explosion");
    }

    var saved = !!S.get(idea.id);
    var kind = UI.kindById(idea.combo.kind);
    var r = E.resolveCombo(idea.combo);

    kids.push(head(idea.mutationLabel ? "Variante" : "The Explosion", idea.adn, { back: true }));
    kids.push(el("div", { class: "explosion-stage" }, [
      el("div", { class: "rays", "aria-hidden": "true" }),
      el("div", { class: "idea-hero" }, [
        el("span", { class: "kicker", text: kind ? kind.label + " \u00b7 " + kind.tone : "concept" }),
        el("h1", { class: "idea-name", text: idea.name }),
        el("p", { class: "idea-pitch", text: idea.pitch }),
        el("div", { class: "adn-row" }, [
          el("span", { class: "adn", text: idea.adn }),
          idea.mutationLabel ? el("span", { class: "tag good", text: idea.mutationLabel }) : null,
          el("span", { class: "tag", text: saved ? "sauvegard\u00e9e" : "non sauvegard\u00e9e" })
        ])
      ])
    ]));
    kids.push(UI.signatureArt(idea));

    kids.push(sectionTitle("Ingr\u00e9dients", "touche pour remplacer"));
    kids.push(el("div", { class: "chip-grid" }, D.SLOTS.map(function (s) {
      var ing = r[s.key];
      return chip(ing || { glyph: "\u25CB", label: "aucun" }, false, function () { openSwapSheet(idea, s.key); }, ing ? null : "\u00e0 d\u00e9finir");
    })));

    kids.push(el("div", { style: "height:8px" }));
    kids.push(el("div", { class: "btn-row" }, [
      el("button", { class: "btn btn-primary", type: "button",
        onclick: function () {
          App.currentIdea = E.generateIdea({ kind: idea.combo.kind, domain: idea.combo.domain, object: idea.combo.object, constraint: idea.combo.constraint, twist: idea.combo.twist, seed: Date.now() >>> 0 });
          render();
          UI.toast("Nouveau tirage avec les m\u00eames ingr\u00e9dients.", "ok");
        }
      }, [UI.icon("shuffle"), document.createTextNode("Relancer")]),
      el("button", { class: "btn btn-ghost", type: "button", onclick: function () { go("tree"); } }, [UI.icon("tree"), document.createTextNode("Muter")])
    ]));

    kids.push(el("div", { class: "btn-row", style: "margin-top:10px" }, [
      el("button", { class: "btn " + (saved ? "btn-ghost" : "btn-coral"), type: "button", onclick: function () { saveIdea(idea); } },
        [UI.icon("archive"), document.createTextNode(saved ? "Enregistrer une copie" : "Enregistrer dans le Vault")]),
      el("button", { class: "btn btn-ghost", type: "button", onclick: function () { go("blueprint"); } },
        [UI.icon("doc"), document.createTextNode("Blueprint")])
    ]));

    kids.push(el("div", { style: "height:14px" }));
    kids.push(note("Le r\u00e9sultat a \u00e9t\u00e9 produit par le moteur local de combinaisons : les fragments viennent des ingr\u00e9dients, la prose est recompos\u00e9e par gabarits. Aucun mod\u00e8le d'IA n'est branch\u00e9.", ""));

    kids.push(sectionTitle("Export rapide", "copier le concept"));
    kids.push(el("div", { class: "btn-row" }, [
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () { UI.copyText(idea.name + " \u2014 " + idea.pitch).then(function (ok) { UI.toast(ok ? "Concept copi\u00e9." : "Copie refus\u00e9e par le navigateur.", ok ? "ok" : "warn"); }); }
      }, [UI.icon("copy"), document.createTextNode("Copier le pitch")]),
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () { UI.copyText(E.ideaToPlainText(idea)).then(function (ok) { UI.toast(ok ? "Blueprint complet copi\u00e9." : "Copie refus\u00e9e par le navigateur.", ok ? "ok" : "warn"); }); }
      }, [document.createTextNode("Copier tout le dossier")])
    ]));
    return screenEl(kids, "explosion");
  }

  function saveIdea(idea) {
    var payload = JSON.parse(JSON.stringify(idea));
    if (S.get(payload.id)) { delete payload.id; payload.name = payload.name + " (copie)"; }
    var res = S.add(payload);
    App.currentIdea = res.idea;
    UI.toast(res.result.persisted ? "Enregistr\u00e9e dans le Vault." : "Id\u00e9e gard\u00e9e en m\u00e9moire seulement : le stockage local est indisponible.", res.result.persisted ? "ok" : "warn");
    render();
    updateBadge();
  }

  function openSwapSheet(idea, slot) {
    var s = D.SLOTS.filter(function (x) { return x.key === slot; })[0];
    var wrap = el("div", {});
    (D.INGREDIENTS[slot] || []).forEach(function (ing) {
      var active = idea.combo[slot] === ing.id;
      wrap.appendChild(el("button", { class: "option-row", type: "button",
        onclick: function () {
          UI.closeModal();
          var c = JSON.parse(JSON.stringify(idea.combo));
          c[slot] = ing.id;
          var rebuilt = E.generateIdea({
            kind: c.kind, domain: c.domain, object: c.object, constraint: c.constraint, twist: c.twist,
            seed: (idea.seed + E.hashString(slot + ing.id)) >>> 0,
            parentId: S.get(idea.id) ? idea.id : null,
            mutationLabel: s.label + " \u2192 " + ing.label,
            favorite: idea.favorite, createdAt: idea.createdAt
          });
          if (idea.id && S.get(idea.id)) rebuilt.id = idea.id;
          App.currentIdea = rebuilt;
          render();
          UI.toast(s.label + " remplac\u00e9 par " + ing.label + ".", "ok");
        }
      }, [
        el("span", { class: "o-glyph", text: ing.glyph }),
        el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: ing.label }),
          el("div", { class: "o-desc", text: active ? "ingr\u00e9dient actuel" : (ing.tags || []).slice(0, 3).join(" \u00b7 ") })
        ]),
        active ? el("span", { class: "tag good", text: "actuel" }) : null
      ]));
    });
    UI.modal({ title: "Remplacer \u2014 " + s.label, subtitle: "L'id\u00e9e se recompose avec ce nouvel ingr\u00e9dient.", body: wrap, actions: [{ label: "Fermer", class: "btn-ghost", onClick: function () {} }] });
  }

  /* ECRAN 4 - IDEA BLUEPRINT */
  function renderBlueprint() {
    var kids = [];
    var idea = App.currentIdea;
    if (!idea) {
      kids.push(head("Idea Blueprint", "aucune id\u00e9e active", { back: true }));
      kids.push(el("div", { class: "empty" }, [
        el("div", { class: "e-glyph", "aria-hidden": "true", text: "\u25A4" }),
        el("h3", { text: "Pas de dossier ouvert" }),
        el("p", { text: "Le Blueprint est le dossier d\u00e9taill\u00e9 d'une id\u00e9e. G\u00e9n\u00e8re une explosion pour en obtenir un." }),
        el("button", { class: "btn btn-primary", type: "button", text: "Cr\u00e9er une id\u00e9e", onclick: function () { go("fusion"); } })
      ]));
      return screenEl(kids, "blueprint");
    }
    var b = idea.blueprint;
    var kind = UI.kindById(idea.combo.kind);
    kids.push(head(idea.name, (kind ? kind.label : "") + " \u00b7 " + idea.adn, { back: true }));

    kids.push(el("div", { class: "card card-glow" }, [el("span", { class: "kicker", text: "R\u00e9sum\u00e9" }), el("p", { class: "bp-text", text: idea.pitch })]));
    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [el("h3", { text: "Probl\u00e8me" }), el("p", { class: "bp-text", text: b.problem })])]));
    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [el("h3", { text: "Public cible" }), el("p", { class: "bp-text", text: b.audience })])]));
    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Fonctionnalit\u00e9s" }),
      el("ul", { class: "bp-list" }, b.features.map(function (f, i) { return el("li", {}, [el("span", { class: "mark", text: String(i + 1) }), el("span", { text: f })]); }))
    ])]));
    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Parcours utilisateur" }),
      el("ol", { class: "steps" }, b.journey.map(function (j) { return el("li", {}, [el("span", { text: j })]); }))
    ])]));
    kids.push(el("div", { class: "card" }, [
      el("div", { class: "bp-block", style: "margin-bottom:14px" }, [el("h3", { text: "Direction artistique" }), el("p", { class: "bp-text", text: b.artDirection })]),
      el("div", { class: "bp-block", style: "margin-bottom:0" }, [
        el("h3", { text: "Livrables du format \u00ab " + (kind ? kind.label : "") + " \u00bb" }),
        el("ul", { class: "bp-list" }, b.deliverable.map(function (d) { return el("li", {}, [el("span", { class: "mark", text: "\u2713" }), el("span", { text: d })]); }))
      ])
    ]));
    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Difficult\u00e9 estim\u00e9e" }),
      el("p", { class: "bp-text", style: "font-weight:750;font-size:16px", text: b.difficulty.label + " (" + b.difficulty.score + " / " + b.difficulty.max + ")" }),
      el("div", { class: "meter", role: "img", "aria-label": "Difficult\u00e9 " + b.difficulty.score + " sur " + b.difficulty.max },
        [1, 2, 3, 4, 5].map(function (i) { return el("i", { class: i <= b.difficulty.score ? "on" : "" }); })),
      el("p", { class: "bp-text muted", text: b.difficulty.note }),
      el("div", { class: "bp-meta" }, [
        el("div", { class: "kv" }, [el("span", { class: "k", text: "Effort" }), el("span", { class: "v", text: b.budget.min + "\u2013" + b.budget.max + " j" })]),
        el("div", { class: "kv" }, [el("span", { class: "k", text: "ADN" }), el("span", { class: "v", text: idea.adn })]),
        el("div", { class: "kv" }, [el("span", { class: "k", text: "Variantes" }), el("span", { class: "v", text: String(S.childrenOf(idea.id).length) })])
      ]),
      el("p", { class: "faint", style: "font-size:12px;margin-top:8px", text: b.budget.note })
    ])]));
    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Pistes de mon\u00e9tisation" }),
      el("ul", { class: "bp-list" }, b.monetization.map(function (m) { return el("li", {}, [el("span", { class: "mark", text: "\u20ac" }), el("span", { text: m })]); }))
    ])]));
    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Risques identifi\u00e9s" }),
      el("ul", { class: "bp-list" }, b.risks.map(function (x) { return el("li", {}, [el("span", { class: "mark", text: "!" }), el("span", { text: x })]); }))
    ])]));

    kids.push(sectionTitle("Export du dossier", "copie, fichier ou partage"));
    kids.push(el("div", { class: "btn-row" }, [
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () { UI.copyText(E.ideaToMarkdown(idea)).then(function (ok) { UI.toast(ok ? "Blueprint en Markdown copi\u00e9." : "Copie refus\u00e9e.", ok ? "ok" : "warn"); }); }
      }, [UI.icon("copy"), document.createTextNode("Copier Markdown")]),
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () { var ok = UI.download(safeName(idea.name) + ".md", E.ideaToMarkdown(idea), "text/markdown;charset=utf-8"); UI.toast(ok ? "Fichier .md pr\u00e9par\u00e9." : "T\u00e9l\u00e9chargement refus\u00e9.", ok ? "ok" : "warn"); }
      }, [document.createTextNode("T\u00e9l\u00e9charger .md")]),
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () {
          UI.share(safeName(idea.name) + ".md", E.ideaToMarkdown(idea), "text/markdown").then(function (st) {
            if (st === "shared") UI.toast("Partag\u00e9.", "ok");
            else if (st === "cancelled") {}
            else { var ok = UI.download(safeName(idea.name) + ".md", E.ideaToMarkdown(idea), "text/markdown;charset=utf-8"); UI.toast(ok ? "Partage indisponible ici \u2014 fichier t\u00e9l\u00e9charg\u00e9." : "Partage et t\u00e9l\u00e9chargement indisponibles ici.", ok ? "info" : "warn"); }
          });
        }
      }, [UI.icon("share"), document.createTextNode("Partager")])
    ]));
    kids.push(el("div", { class: "btn-row", style: "margin-top:10px" }, [
      el("button", { class: "btn btn-primary", type: "button", onclick: function () { go("tree"); } }, [UI.icon("tree"), document.createTextNode("Explorer les mutations")]),
      el("button", { class: "btn btn-ghost", type: "button", onclick: function () { go("explosion"); } }, [document.createTextNode("Retour \u00e0 l'id\u00e9e")])
    ]));
    return screenEl(kids, "blueprint");
  }

  function safeName(name) {
    return (name || "idee").replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 60) || "idee";
  }
