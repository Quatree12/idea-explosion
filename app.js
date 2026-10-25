/* ==========================================================================
   IDEA EXPLOSION - app.js
   Routeur d'ecrans + les 6 ecrans + toutes les interactions.
   --------------------------------------------------------------------------
   Correctif de navigation : apres la generation, l'application NAVIGUE vers
   l'ecran de resultat. Auparavant l'idee etait creee et le toast s'affichait,
   mais l'utilisateur restait bloque sur la Fusion Chamber d'ou venait l'appel.
   ========================================================================== */
(function () {
  "use strict";

  var el = IE_UI.el;
  var UI = IE_UI;
  var E = IE_ENGINE;
  var S = IE_STORE;
  var D = IE_DATA;

  var ROOT = document.getElementById("app");

  var App = {
    screen: "lab",
    stack: [],
    labSelection: { kind: "kin.app" },
    labOrbs: [
      { slot: "domain", id: "dom.sound" },
      { slot: "domain", id: "dom.game" },
      { slot: "object", id: "obj.mirror" },
      { slot: "object", id: "obj.seed" },
      { slot: "constraint", id: "con.two" },
      { slot: "constraint", id: "con.one" },
      { slot: "twist", id: "twit.memory" },
      { slot: "twist", id: "twit.grow" }
    ],
    fusion: null,
    fusionSheet: null,
    fusionSheetTarget: null,
    armed: null,
    currentIdea: null,
    vaultQuery: "",
    vaultFilter: "all",
    vaultSort: "recent",
    busy: false
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
    App.screen = prev;
    render();
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
    if (opts.back) {
      kids.push(el("button", {
        class: "back", type: "button", "aria-label": "Retour",
        onclick: opts.back === true ? back : opts.back
      }, [UI.icon("back")]));
    }
    kids.push(el("div", {}, [
      opts.kicker ? el("span", { class: "kicker", text: opts.kicker }) : null,
      el("h1", { text: title }),
      sub ? el("span", { class: "sub", text: sub }) : null
    ]));
    return el("div", { class: "screen-head" }, kids);
  }

  function sectionTitle(text, hint) {
    return el("div", { class: "section-title" }, [
      el("h2", { text: text }),
      hint ? el("span", { class: "hint", text: hint }) : null
    ]);
  }

  function note(text, kind) {
    return el("div", { class: "note " + (kind || "") }, [
      el("span", { class: "n-glyph", text: kind === "warn" ? "!" : "\u25C6" }),
      el("span", { text: text })
    ]);
  }

  function chip(ing, selected, onClick, extra) {
    return el("button", {
      class: "chip" + (selected ? " selected" : ""),
      type: "button",
      "aria-pressed": selected ? "true" : "false",
      onclick: onClick
    }, [
      el("span", { class: "glyph", text: ing.glyph, "aria-hidden": "true" }),
      el("span", { text: ing.label }),
      extra ? el("span", { class: "faint", text: extra }) : null
    ]);
  }

  function ideaCard(idea) {
    var tint = UI.tintFor(idea);
    var kind = UI.kindById(idea.combo.kind);
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

  function describeComboShort(combo) {
    var r = E.resolveCombo(combo);
    return [r.domain, r.object, r.constraint].filter(Boolean).map(function (x) { return x.label; }).join(" \u00b7 ");
  }

  function startExplosion(combo, opts) {
    opts = opts || {};
    if (!comboComplete(combo)) {
      UI.toast("Il manque encore un domaine, un objet et une contrainte.", "warn");
      return;
    }
    S.saveLastCombo(combo);

    App.busy = true;
    render();

    var idea;
    try {
      idea = E.generateIdea({
        kind: combo.kind, domain: combo.domain, object: combo.object,
        constraint: combo.constraint, twist: combo.twist || null,
        seed: opts.seed || (Date.now() >>> 0),
        parentId: opts.parentId || null,
        mutationLabel: opts.mutationLabel || null
      });
    } catch (err) {
      App.busy = false;
      render();
      UI.toast("La generation a echoue : " + err.message, "warn");
      return;
    }

    if (!idea || !idea.name) {
      App.busy = false;
      render();
      UI.toast("La generation n'a rien produit.", "warn");
      return;
    }

    var steps = ["Alignement des ingredients\u2026", "Fusion des champs de sens\u2026", "Calcul de l'ADN creatif\u2026", "Recomposition du concept\u2026"];
    var idx = 0;
    var timer = setInterval(function () {
      idx++;
      var bar = document.getElementById("chargeBar");
      var lbl = document.getElementById("chargeLabel");
      if (lbl && idx <= steps.length) lbl.textContent = steps[idx - 1];
      if (bar) bar.style.width = Math.min(100, (idx / steps.length) * 100) + "%";
      if (idx >= steps.length) clearInterval(timer);
    }, 120);

    var show = function () {
      clearInterval(timer);
      App.busy = false;
      App.currentIdea = idea;
      App.lastGenerated = idea;
      App.stack.push("fusion");
      App.screen = "explosion";
      render();
      var stage = document.querySelector(".explosion-stage");
      if (stage) {
        stage.classList.add("bursting");
        setTimeout(function () { stage.classList.remove("bursting"); }, 1200);
      }
      UI.toast("Idee generee : sauvegarde-la dans le Vault.", "ok");
    };

    if (typeof requestAnimationFrame === "function") requestAnimationFrame(show);
    else show();
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
        document.createTextNode("Fais "),
        el("span", { class: "accent", text: "exploser" }),
        document.createTextNode(" une id\u00e9e.")
      ]),
      el("p", { class: "lede", text: "Choisis des fragments, fais-les entrer en collision, et repars avec un concept exploitable \u2014 pas un paragraphe de texte." })
    ]));

    var field = el("div", { class: "orb-field" }, [
      el("div", { class: "grid-lines", "aria-hidden": "true" })
    ]);

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
        class: "float-orb",
        type: "button",
        style: "top:" + pos.top + ";left:" + pos.left + ";width:" + size + "px;height:" + size +
          "px;--oc1:" + tint.raw + ";--oc2:" + tint.raw2 + ";--dur:" + (6 + (i % 4)) + "s;font-size:" + (size / 3.1) + "px",
        "aria-pressed": selected ? "true" : "false",
        "aria-label": ing.label + " \u2014 " + slotLabel(entry.slot),
        text: ing.glyph,
        onclick: function () {
          if (sel[entry.slot] === entry.id) delete sel[entry.slot];
          else sel[entry.slot] = entry.id;
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

    kids.push(note("Le Lab ne fait aucune requ\u00eate : tout se calcule sur ton appareil. L'IA n'est pas branch\u00e9e \u2014 le moteur recompose des fragments.", ""));
    kids.push(el("div", { style: "height:14px" }));

    kids.push(sectionTitle("Type de cr\u00e9ation", "d\u00e9termine la forme du r\u00e9sultat"));
    kids.push(el("div", { class: "chip-grid" }, D.KINDS.map(function (k) {
      return chip(k, sel.kind === k.id, function () { sel.kind = k.id; render(); });
    })));

    kids.push(el("div", { style: "height:18px" }));
    var canGo = pickedCount >= 3 && !!sel.kind;
    kids.push(el("button", {
      class: "btn " + (canGo ? "btn-primary" : "btn-ghost") + " btn-block",
      type: "button",
      "aria-disabled": canGo ? "false" : "true",
      onclick: function () {
        if (!canGo) { UI.toast("Ajoute au moins domaine, objet et contrainte.", "warn"); return; }
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
        el("button", {
          class: "btn btn-primary", type: "button", text: "Ouvrir la Fusion Chamber",
          onclick: function () {
            if (!App.fusion) App.fusion = { kind: sel.kind, domain: sel.domain || null, object: sel.object || null, constraint: sel.constraint || null, twist: sel.twist || null };
            go("fusion");
          }
        })
      ]));
    } else {
      recent.forEach(function (i) { kids.push(ideaCard(i)); });
      kids.push(el("button", {
        class: "btn btn-ghost btn-block", type: "button",
        onclick: function () { go("vault"); }
      }, [UI.icon("archive"), document.createTextNode("Ouvrir tout le Vault")]));
    }

    if (last) {
      kids.push(el("p", { class: "faint", style: "margin-top:16px;font-size:12.5px;text-align:center",
        text: "Dernier combo utilis\u00e9 : " + describeComboShort(last) }));
    }

    return screenEl(kids, "lab");
  }

  /* ECRAN 2 - FUSION CHAMBER */
  function renderFusion() {
    var kids = [];
    var f = App.fusion;
    if (!f) {
      f = App.fusion = {
        kind: App.labSelection.kind || "kin.app",
        domain: App.labSelection.domain || null,
        object: App.labSelection.object || null,
        constraint: App.labSelection.constraint || null,
        twist: App.labSelection.twist || null
      };
    }

    var draft = S.loadDraft();
    var filled = ["domain", "object", "constraint"].filter(function (k) { return f[k]; }).length;

    kids.push(head("Fusion Chamber", filled + "/3 ingr\u00e9dients requis", { back: true }));
    kids.push(el("p", { class: "lede", style: "margin-bottom:16px",
      text: "Fais glisser un fragment sur le c\u0153ur, ou utilise \u00ab Choisir \u00bb sur chaque ligne." }));

    var core = el("button", {
      class: "core", type: "button",
      dataset: { charge: String(filled) },
      id: "fusionCore",
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
      return el("div", {
        class: "slot-row " + (ing ? "filled" : "") + (App.armed === s.key ? " armed" : ""),
        id: "slotRow-" + s.key
      }, [
        el("div", { class: "slot-key", "aria-hidden": "true", text: s.icon }),
        el("div", { class: "slot-body" }, [
          el("span", { class: "lbl", text: s.label + (required ? " \u00b7 requis" : " \u00b7 optionnel") }),
          el("span", { class: "val " + (ing ? "" : "muted"), text: ing ? ing.glyph + "  " + ing.label : "\u2014 \u00e0 d\u00e9finir" })
        ]),
        el("div", { class: "slot-actions" }, [
          ing ? el("button", {
            class: "icon-sm", type: "button", "aria-label": "Remettre \u00e0 z\u00e9ro " + s.label,
            text: "\u2715",
            onclick: function (e) { e.stopPropagation(); f[s.key] = null; S.saveDraft(f); render(); }
          }) : null,
          el("button", {
            class: "icon-sm", type: "button", "aria-label": "Choisir " + s.label,
            onclick: function () { openIngredientSheet(s.key, "core"); }
          }, [UI.icon("swap")])
        ])
      ]);
    })));

    if (App.fusionSheet && App.fusionSheetTarget) {
      kids.push(ingredientSheet(App.fusionSheet, App.fusionSheetTarget, f));
    }

    kids.push(sectionTitle("Format de sortie", "ce que l'id\u00e9e va devenir"));
    kids.push(el("div", { class: "chip-grid" }, D.KINDS.map(function (k) {
      return chip(k, f.kind === k.id, function () { f.kind = k.id; S.saveDraft(f); render(); });
    })));

    kids.push(el("div", { style: "height:10px" }));
    kids.push(note("Combinaisons possibles : " + D.TOTAL_COMBOS + " avec les ingr\u00e9dients actuels, multipli\u00e9es par les " + D.KINDS.length + " formats.", ""));

    var ready = filled >= 3;
    kids.push(el("div", { class: "sticky-cta" }, [
      el("button", {
        class: "btn " + (ready ? "btn-primary" : "btn-ghost") + " btn-block",
        type: "button",
        "aria-disabled": ready ? "false" : "true",
        onclick: function () {
          if (!ready) { UI.toast("Il manque " + (3 - filled) + " ingr\u00e9dient(s) obligatoire(s).", "warn"); return; }
          S.clearDraft();
          startExplosion(f, {});
        }
      }, [UI.icon("spark"), document.createTextNode(ready ? "D\u00e9clencher l'explosion" : "Encore " + (3 - filled) + " \u00e0 choisir")]),
      el("div", { class: "btn-row", style: "margin-top:10px" }, [
        el("button", {
          class: "btn btn-ghost btn-sm", type: "button",
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
        el("button", {
          class: "btn btn-ghost btn-sm", type: "button",
          onclick: function () {
            f.domain = f.object = f.constraint = f.twist = null;
            App.fusionSheet = null;
            S.saveDraft(f);
            UI.toast("S\u00e9lection vid\u00e9e.", "info");
            render();
          }
        }, [document.createTextNode("Vider")])
      ])
    ]));

    if (draft) {
      kids.push(el("p", { class: "faint", style: "text-align:center;font-size:12px;margin-top:12px",
        text: "Ton brouillon est sauvegard\u00e9 automatiquement." }));
    }

    return screenEl(kids, "fusion");
  }

  function openIngredientSheet(slot, target) {
    App.fusionSheet = slot;
    App.fusionSheetTarget = target;
    App.armed = slot;
    render();
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
        App.fusionSheet = null;
        App.fusionSheetTarget = null;
        App.armed = null;
        S.saveDraft(f);
        render();
        UI.toast(s.label + " : " + ing.label, "ok");
      }));
    });
    wrap.appendChild(el("button", {
      class: "link-btn", type: "button",
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
        else UI.toast("D\u00e9pose le fragment sur le c\u0153ur.", "info");
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
          el("div", { class: "charge-bar", role: "progressbar", "aria-label": "Progression" }, [el("i", { id: "chargeBar" })])
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
      el("button", {
        class: "btn btn-primary", type: "button",
        onclick: function () {
          App.currentIdea = E.generateIdea({
            kind: idea.combo.kind, domain: idea.combo.domain, object: idea.combo.object,
            constraint: idea.combo.constraint, twist: idea.combo.twist, seed: Date.now() >>> 0
          });
          render();
          UI.toast("Nouveau tirage avec les m\u00eames ingr\u00e9dients.", "ok");
        }
      }, [UI.icon("shuffle"), document.createTextNode("Relancer")]),
      el("button", { class: "btn btn-ghost", type: "button", onclick: function () { go("tree"); } },
        [UI.icon("tree"), document.createTextNode("Muter")])
    ]));

    kids.push(el("div", { class: "btn-row", style: "margin-top:10px" }, [
      el("button", {
        class: "btn " + (saved ? "btn-ghost" : "btn-coral"), type: "button",
        onclick: function () { saveIdea(idea); }
      }, [UI.icon("archive"), document.createTextNode(saved ? "Enregistrer une copie" : "Enregistrer dans le Vault")]),
      el("button", { class: "btn btn-ghost", type: "button", onclick: function () { go("blueprint"); } },
        [UI.icon("doc"), document.createTextNode("Blueprint")])
    ]));

    kids.push(el("div", { style: "height:14px" }));
    kids.push(note("Le r\u00e9sultat vient du moteur local de combinaisons : les fragments viennent des ingr\u00e9dients, la prose est recompos\u00e9e par gabarits. Aucun mod\u00e8le d'IA n'est branch\u00e9.", ""));

    kids.push(sectionTitle("Export rapide", "copier le concept"));
    kids.push(el("div", { class: "btn-row" }, [
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () {
          UI.copyText(idea.name + " \u2014 " + idea.pitch).then(function (ok) {
            UI.toast(ok ? "Concept copi\u00e9." : "Copie refus\u00e9e par le navigateur.", ok ? "ok" : "warn");
          });
        }
      }, [UI.icon("copy"), document.createTextNode("Copier le pitch")]),
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () {
          UI.copyText(E.ideaToPlainText(idea)).then(function (ok) {
            UI.toast(ok ? "Blueprint complet copi\u00e9." : "Copie refus\u00e9e par le navigateur.", ok ? "ok" : "warn");
          });
        }
      }, [document.createTextNode("Copier tout le dossier")])
    ]));

    return screenEl(kids, "explosion");
  }

  function saveIdea(idea) {
    var payload = JSON.parse(JSON.stringify(idea));
    if (S.get(payload.id)) {
      delete payload.id;
      payload.name = payload.name + " (copie)";
    }
    var res = S.add(payload);
    App.currentIdea = res.idea;
    UI.toast(res.result.persisted ? "Enregistr\u00e9e dans le Vault." : "Id\u00e9e gard\u00e9e en m\u00e9moire seulement.", res.result.persisted ? "ok" : "warn");
    render();
    updateBadge();
  }

  function openSwapSheet(idea, slot) {
    var s = D.SLOTS.filter(function (x) { return x.key === slot; })[0];
    var wrap = el("div", {});
    (D.INGREDIENTS[slot] || []).forEach(function (ing) {
      var active = idea.combo[slot] === ing.id;
      wrap.appendChild(el("button", {
        class: "option-row", type: "button",
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

    UI.modal({
      title: "Remplacer \u2014 " + s.label,
      subtitle: "L'id\u00e9e se recompose avec ce nouvel ingr\u00e9dient.",
      body: wrap,
      actions: [{ label: "Fermer", class: "btn-ghost", onClick: function () {} }]
    });
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

    kids.push(el("div", { class: "card card-glow" }, [
      el("span", { class: "kicker", text: "R\u00e9sum\u00e9" }),
      el("p", { class: "bp-text", text: idea.pitch })
    ]));

    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Probl\u00e8me" }), el("p", { class: "bp-text", text: b.problem })
    ])]));

    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Public cible" }), el("p", { class: "bp-text", text: b.audience })
    ])]));

    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Fonctionnalit\u00e9s" }),
      el("ul", { class: "bp-list" }, b.features.map(function (f, i) {
        return el("li", {}, [el("span", { class: "mark", text: String(i + 1) }), el("span", { text: f })]);
      }))
    ])]));

    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Parcours utilisateur" }),
      el("ol", { class: "steps" }, b.journey.map(function (j) { return el("li", {}, [el("span", { text: j })]); }))
    ])]));

    kids.push(el("div", { class: "card" }, [
      el("div", { class: "bp-block", style: "margin-bottom:14px" }, [
        el("h3", { text: "Direction artistique" }), el("p", { class: "bp-text", text: b.artDirection })
      ]),
      el("div", { class: "bp-block", style: "margin-bottom:0" }, [
        el("h3", { text: "Livrables du format \u00ab " + (kind ? kind.label : "") + " \u00bb" }),
        el("ul", { class: "bp-list" }, b.deliverable.map(function (d) {
          return el("li", {}, [el("span", { class: "mark", text: "\u2713" }), el("span", { text: d })]);
        }))
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
      el("ul", { class: "bp-list" }, b.monetization.map(function (m) {
        return el("li", {}, [el("span", { class: "mark", text: "\u20ac" }), el("span", { text: m })]);
      }))
    ])]));

    kids.push(el("div", { class: "card" }, [el("div", { class: "bp-block", style: "margin-bottom:0" }, [
      el("h3", { text: "Risques identifi\u00e9s" }),
      el("ul", { class: "bp-list" }, b.risks.map(function (x) {
        return el("li", {}, [el("span", { class: "mark", text: "!" }), el("span", { text: x })]);
      }))
    ])]));

    kids.push(sectionTitle("Export du dossier", "copie, fichier ou partage"));
    kids.push(el("div", { class: "btn-row" }, [
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () {
          UI.copyText(E.ideaToMarkdown(idea)).then(function (ok) { UI.toast(ok ? "Blueprint en Markdown copi\u00e9." : "Copie refus\u00e9e.", ok ? "ok" : "warn"); });
        }
      }, [UI.icon("copy"), document.createTextNode("Copier Markdown")]),
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () {
          var ok = UI.download(safeName(idea.name) + ".md", E.ideaToMarkdown(idea), "text/markdown;charset=utf-8");
          UI.toast(ok ? "Fichier .md pr\u00e9par\u00e9." : "T\u00e9l\u00e9chargement refus\u00e9.", ok ? "ok" : "warn");
        }
      }, [document.createTextNode("T\u00e9l\u00e9charger .md")]),
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () {
          UI.share(safeName(idea.name) + ".md", E.ideaToMarkdown(idea), "text/markdown").then(function (st) {
            if (st === "shared") UI.toast("Partag\u00e9.", "ok");
            else if (st === "cancelled") {}
            else {
              var ok = UI.download(safeName(idea.name) + ".md", E.ideaToMarkdown(idea), "text/markdown;charset=utf-8");
              UI.toast(ok ? "Partage indisponible ici \u2014 fichier t\u00e9l\u00e9charg\u00e9." : "Partage et t\u00e9l\u00e9chargement indisponibles ici.", ok ? "info" : "warn");
            }
          });
        }
      }, [UI.icon("share"), document.createTextNode("Partager")])
    ]));

    kids.push(el("div", { class: "btn-row", style: "margin-top:10px" }, [
      el("button", { class: "btn btn-primary", type: "button", onclick: function () { go("tree"); } },
        [UI.icon("tree"), document.createTextNode("Explorer les mutations")]),
      el("button", { class: "btn btn-ghost", type: "button", onclick: function () { go("explosion"); } },
        [document.createTextNode("Retour \u00e0 l'id\u00e9e")])
    ]));

    return screenEl(kids, "blueprint");
  }

  function safeName(name) {
    return (name || "idee").replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 60) || "idee";
  }

  /* ECRAN 5 - MUTATION TREE */
  function renderTree() {
    var kids = [];
    var idea = App.currentIdea;

    if (!idea) {
      kids.push(head("Mutation Tree", "aucune id\u00e9e active", { back: true }));
      kids.push(el("div", { class: "empty" }, [
        el("div", { class: "e-glyph", "aria-hidden": "true", text: "\u22d4" }),
        el("h3", { text: "Aucun arbre \u00e0 explorer" }),
        el("p", { text: "L'arbre de mutation cr\u00e9e des variantes \u00e0 partir d'une id\u00e9e, sans jamais \u00e9craser l'originale." }),
        el("button", { class: "btn btn-primary", type: "button", text: "Cr\u00e9er une id\u00e9e", onclick: function () { go("fusion"); } })
      ]));
      return screenEl(kids, "tree");
    }

    var stored = S.get(idea.id);
    var rootId = idea.parentId && stored ? idea.parentId : idea.id;
    var root = S.get(rootId) || idea;
    var children = S.childrenOf(rootId);

    kids.push(head("Mutation Tree", children.length + " variante" + (children.length > 1 ? "s" : ""), { back: true }));
    kids.push(el("p", { class: "lede", style: "margin-bottom:16px",
      text: "Chaque mutation cr\u00e9e une id\u00e9e ind\u00e9pendante rattach\u00e9e \u00e0 l'originale. L'originale n'est jamais modifi\u00e9e." }));

    kids.push(el("div", { class: "tree" }, [
      el("div", { class: "tree-root" }, [
        el("div", { class: "t", text: root.name }),
        el("div", { class: "s", text: "Id\u00e9e originale \u00b7 " + root.adn + (S.get(root.id) ? "" : " \u00b7 non sauvegard\u00e9e") })
      ])
    ]));

    var branch = el("div", { class: "branch" });
    if (!children.length) {
      branch.appendChild(el("p", { class: "faint", style: "font-size:13.5px;margin:12px 0",
        text: "Aucune variante pour l'instant. Utilise les actions ci-dessous." }));
    } else {
      children.forEach(function (child) {
        branch.appendChild(el("div", { class: "node" }, [
          el("div", { class: "n-body" }, [
            el("div", { class: "n-name", text: child.name }),
            el("div", { class: "n-meta", text: (child.mutationLabel || "variante") + " \u00b7 " + UI.relTime(child.createdAt) })
          ]),
          el("button", { class: "icon-sm", type: "button", "aria-label": "Ouvrir la variante " + child.name,
            onclick: function () { openIdea(child.id); } }, [UI.icon("doc")]),
          el("button", { class: "icon-sm", type: "button", "aria-label": "Supprimer la variante " + child.name,
            onclick: function () {
              UI.confirm({ title: "Supprimer cette variante ?", subtitle: child.name, confirmLabel: "Supprimer", danger: true }).then(function (yes) {
                if (!yes) return;
                S.remove(child.id);
                UI.toast("Variante supprim\u00e9e.", "info");
                render(); updateBadge();
              });
            }
          }, [UI.icon("trash")])
        ]));
      });
    }
    kids.push(branch);

    kids.push(el("div", { style: "height:18px" }));
    kids.push(sectionTitle("Cr\u00e9er une variante", "choisis l'axe de mutation"));
    if (!S.get(rootId)) {
      kids.push(note("L'id\u00e9e originale n'est pas encore sauvegard\u00e9e : sauvegarde-la d'abord pour rattacher les variantes.", "warn"));
      kids.push(el("div", { style: "height:6px" }));
    }

    var options = E.mutationOptions(root.combo);
    kids.push(el("div", { class: "chip-grid" }, options.map(function (opt) {
      return el("button", { class: "chip", type: "button", onclick: function () { runMutation(root, opt); } }, [
        el("span", { class: "glyph", text: opt.random ? "\u2733" : "\u21C4", "aria-hidden": "true" }),
        el("span", { text: opt.label })
      ]);
    })));

    kids.push(el("div", { class: "btn-row", style: "margin-top:16px" }, [
      el("button", { class: "btn btn-ghost", type: "button",
        onclick: function () { openIdea(root.id); } }, [document.createTextNode("Voir l'originale")]),
      S.get(rootId) ? el("button", { class: "btn btn-ghost", type: "button",
        onclick: function () { go("vault"); } }, [document.createTextNode("Vault")]) : null
    ]));

    kids.push(el("div", { style: "height:16px" }));
    kids.push(note("Une variante est g\u00e9n\u00e9r\u00e9e localement \u00e0 partir d'un axe de mutation : le moteur d\u00e9place un ingr\u00e9dient puis recompose le concept.", ""));

    return screenEl(kids, "tree");
  }

  function runMutation(root, opt) {
    if (!S.get(root.id)) {
      UI.confirm({
        title: "Sauvegarder l'originale d'abord ?",
        subtitle: "Les variantes se rattachent \u00e0 une id\u00e9e enregistr\u00e9e.",
        confirmLabel: "Enregistrer et muter"
      }).then(function (yes) {
        if (!yes) return;
        var copy = JSON.parse(JSON.stringify(root));
        delete copy.id;
        var res = S.add(copy);
        App.currentIdea = res.idea;
        updateBadge();
        doMutate(res.idea, opt);
      });
      return;
    }
    doMutate(root, opt);
  }

  function doMutate(root, opt) {
    if (opt.random || opt.pool === null) { finishMutation(root, E.mutate(root, "remix")); return; }
    if (opt.op === "addTwist") { openPicker(root, opt, "Choisir un twist \u00e0 ajouter"); return; }
    if (opt.op === "changeKind") { openPicker(root, opt, "Choisir le nouveau format"); return; }
    finishMutation(root, E.mutate(root, opt.op));
  }

  function openPicker(root, opt, title) {
    var wrap = el("div", {});
    opt.pool.forEach(function (item) {
      wrap.appendChild(el("button", { class: "option-row", type: "button",
        onclick: function () { UI.closeModal(); finishMutation(root, E.mutate(root, opt.op, item.id)); }
      }, [
        el("span", { class: "o-glyph", text: item.glyph }),
        el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: item.label }),
          el("div", { class: "o-desc", text: (item.tags || []).slice(0, 3).join(" \u00b7 ") })
        ])
      ]));
    });
    UI.modal({ title: title, body: wrap, actions: [{ label: "Annuler", class: "btn-ghost", onClick: function () {} }] });
  }

  function finishMutation(root, variant) {
    if (!variant) { UI.toast("Mutation impossible sur cette id\u00e9e.", "warn"); return; }
    variant.parentId = root.id;
    var res = S.add(variant);
    App.currentIdea = res.idea;
    updateBadge();
    UI.toast("Variante cr\u00e9\u00e9e : " + res.idea.name, "ok");
    render();
  }

  /* ECRAN 6 - THE VAULT */
  function renderVault() {
    var kids = [];
    var stats = S.stats();

    kids.push(head("The Vault", stats.total + " id\u00e9e" + (stats.total > 1 ? "s" : "") + " enregistr\u00e9e" + (stats.total > 1 ? "s" : ""), { back: true }));

    if (stats.total === 0) {
      kids.push(el("div", { class: "empty" }, [
        el("div", { class: "e-glyph", "aria-hidden": "true", text: "\u25A3" }),
        el("h3", { text: "Ton Vault est vide" }),
        el("p", { text: "Les id\u00e9es enregistr\u00e9es appara\u00eetront ici, et resteront apr\u00e8s fermeture de l'application." }),
        el("div", { class: "btn-row" }, [
          el("button", { class: "btn btn-primary", type: "button", text: "Cr\u00e9er une premi\u00e8re id\u00e9e", onclick: function () { go("fusion"); } }),
          el("button", { class: "btn btn-ghost", type: "button", text: "Importer un fichier", onclick: function () { importIdeas(); } })
        ])
      ]));
      kids.push(note("Le Vault utilise le stockage local de l'appareil. Rien n'est envoy\u00e9 sur un serveur."));
      return screenEl(kids, "vault");
    }

    kids.push(el("div", { class: "vault-stats" }, [
      el("div", { class: "stat" }, [el("div", { class: "n", text: String(stats.active) }), el("div", { class: "l", text: "Actives" })]),
      el("div", { class: "stat" }, [el("div", { class: "n", text: String(stats.favorite) }), el("div", { class: "l", text: "Favoris" })]),
      el("div", { class: "stat" }, [el("div", { class: "n", text: String(stats.variants) }), el("div", { class: "l", text: "Variantes" })])
    ]));

    var input = el("input", {
      type: "search", value: App.vaultQuery, placeholder: "Rechercher un nom, un ingr\u00e9dient, un ADN\u2026",
      "aria-label": "Rechercher dans le Vault",
      oninput: function () { App.vaultQuery = input.value; refreshList(); }
    });
    kids.push(el("div", { class: "vault-tools" }, [
      el("div", { class: "field" }, [
        el("span", { class: "field-icon" }, [UI.icon("doc")]),
        input,
        el("button", { class: "clear", type: "button", "aria-label": "Effacer la recherche",
          text: "\u2715",
          onclick: function () { App.vaultQuery = ""; input.value = ""; refreshList(); }
        })
      ])
    ]));

    var filters = [
      { id: "all", label: "Tout" },
      { id: "favorite", label: "Favoris" },
      { id: "variant", label: "Variantes" },
      { id: "archived", label: "Archiv\u00e9es" }
    ].concat(D.KINDS.map(function (k) { return { id: k.id, label: k.label }; }));

    kids.push(el("div", { class: "filters", role: "group", "aria-label": "Filtres" }, filters.map(function (f) {
      return chip({ glyph: "", label: f.label }, App.vaultFilter === f.id, function () { App.vaultFilter = f.id; render(); });
    })));

    var sorts = [
      { id: "recent", label: "R\u00e9centes" },
      { id: "name", label: "A\u2192Z" },
      { id: "difficulty", label: "Difficult\u00e9" }
    ];
    kids.push(el("div", { class: "filters", style: "margin-top:10px", role: "group", "aria-label": "Tri" },
      sorts.map(function (s) {
        return chip({ glyph: "", label: "Tri : " + s.label }, App.vaultSort === s.id, function () { App.vaultSort = s.id; render(); });
      })));

    kids.push(el("div", { id: "vaultList" }));
    kids.push(sectionTitle("Biblioth\u00e8que", "actions sur l'ensemble"));
    kids.push(el("div", { class: "btn-row" }, [
      el("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: function () { importIdeas(); } }, [document.createTextNode("Importer")]),
      el("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: function () { exportLibrary(); } }, [UI.icon("share"), document.createTextNode("Exporter la biblioth\u00e8que")]),
      el("button", { class: "btn btn-ghost btn-sm", type: "button",
        onclick: function () {
          UI.confirm({
            title: "Vider tout le Vault ?",
            subtitle: stats.total + " id\u00e9e(s) seront supprim\u00e9es d\u00e9finitivement.",
            confirmLabel: "Tout supprimer", danger: true
          }).then(function (yes) {
            if (!yes) return;
            var n = S.clearAll();
            App.currentIdea = null;
            updateBadge();
            UI.toast(n + " id\u00e9e(s) supprim\u00e9e(s).", "info");
            render();
          });
        }
      }, [UI.icon("trash"), document.createTextNode("Vider")])
    ]));

    kids.push(el("div", { style: "height:12px" }));
    kids.push(note("Stockage local de l'appareil" + (S.storageAvailable() ? " (persistant)" : " indisponible") + ". Rien n'est envoy\u00e9 sur un serveur.", S.storageAvailable() ? "" : "warn"));

    var node = screenEl(kids, "vault");
    setTimeout(refreshList, 0);
    return node;
  }

  function computeList() {
    var q = App.vaultQuery.trim().toLowerCase();
    var list = S.ideas().slice();

    if (App.vaultFilter === "favorite") list = list.filter(function (i) { return i.favorite && !i.archived; });
    else if (App.vaultFilter === "variant") list = list.filter(function (i) { return !!i.parentId && !i.archived; });
    else if (App.vaultFilter === "archived") list = list.filter(function (i) { return i.archived; });
    else if (App.vaultFilter === "all") list = list.filter(function (i) { return !i.archived; });
    else list = list.filter(function (i) { return i.combo.kind === App.vaultFilter && !i.archived; });

    if (q) {
      list = list.filter(function (i) {
        var r = E.resolveCombo(i.combo);
        var hay = [i.name, i.pitch, i.adn, i.mutationLabel || "",
          r.domain ? r.domain.label : "", r.object ? r.object.label : "",
          r.constraint ? r.constraint.label : "", r.twist ? r.twist.label : "",
          r.kind ? r.kind.label : ""].join(" ").toLowerCase();
        return hay.indexOf(q) !== -1;
      });
    }

    if (App.vaultSort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name, "fr"); });
    else if (App.vaultSort === "difficulty") {
      list.sort(function (a, b) {
        var da = a.blueprint && a.blueprint.difficulty ? a.blueprint.difficulty.score : 0;
        var db = b.blueprint && b.blueprint.difficulty ? b.blueprint.difficulty.score : 0;
        return db - da;
      });
    } else {
      list.sort(function (a, b) { return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt); });
    }
    return list;
  }

  function refreshList() {
    var host = document.getElementById("vaultList");
    if (!host) return;
    UI.clear(host);
    var list = computeList();

    if (!list.length) {
      host.appendChild(el("div", { class: "empty" }, [
        el("div", { class: "e-glyph", "aria-hidden": "true", text: "\u25CB" }),
        el("h3", { text: App.vaultQuery ? "Aucun r\u00e9sultat" : "Rien dans ce filtre" }),
        el("p", { text: App.vaultQuery
          ? "Aucune id\u00e9e ne correspond \u00e0 \u00ab " + App.vaultQuery + " \u00bb."
          : "Ce filtre ne contient aucune id\u00e9e. Reviens \u00e0 \u00ab Tout \u00bb ou cr\u00e9e une nouvelle explosion." }),
        el("div", { class: "btn-row" }, [
          App.vaultQuery ? el("button", { class: "btn btn-ghost", type: "button", text: "Effacer la recherche",
            onclick: function () { App.vaultQuery = ""; render(); } }) : null,
          el("button", { class: "btn btn-primary", type: "button", text: "Nouvelle explosion",
            onclick: function () { go("fusion"); } })
        ])
      ]));
      return;
    }

    list.forEach(function (idea) {
      var wrap = el("div", { style: "position:relative" });
      wrap.appendChild(ideaCard(idea));
      wrap.appendChild(el("div", { class: "btn-row", style: "margin:-4px 0 12px;gap:7px" }, [
        el("button", { class: "btn btn-ghost btn-sm", type: "button",
          onclick: function () { renameIdea(idea); } }, [UI.icon("edit"), document.createTextNode("Renommer")]),
        el("button", { class: "btn btn-ghost btn-sm", type: "button",
          onclick: function () { duplicateIdea(idea); } }, [UI.icon("copy"), document.createTextNode("Dupliquer")]),
        el("button", { class: "btn btn-ghost btn-sm", type: "button",
          onclick: function () { toggleArchive(idea); } }, [UI.icon("archive"), document.createTextNode(idea.archived ? "D\u00e9sarchiver" : "Archiver")]),
        el("button", { class: "btn btn-ghost btn-sm", type: "button",
          onclick: function () { exportOne(idea); } }, [UI.icon("share"), document.createTextNode("Exporter")]),
        el("button", { class: "btn btn-ghost btn-sm", type: "button",
          onclick: function () { deleteIdea(idea); } }, [UI.icon("trash"), document.createTextNode("Supprimer")])
      ]));
      host.appendChild(wrap);
    });
  }

  function renameIdea(idea) {
    UI.prompt({
      title: "Renommer l'id\u00e9e",
      subtitle: "Le nom est modifiable librement ; l'ADN des ingr\u00e9dients ne change pas.",
      value: idea.name, maxlength: "80", confirmLabel: "Renommer"
    }).then(function (v) {
      if (v === null || !v) return;
      S.update(idea.id, { name: v });
      if (App.currentIdea && App.currentIdea.id === idea.id) App.currentIdea.name = v;
      UI.toast("Renomm\u00e9e.", "ok");
      render();
    });
  }

  function duplicateIdea(idea) {
    var copy = JSON.parse(JSON.stringify(idea));
    delete copy.id;
    copy.name = idea.name + " (copie)";
    copy.parentId = null;
    copy.mutationLabel = "Duplication";
    var res = S.add(copy);
    updateBadge();
    UI.toast(res.result.persisted ? "Id\u00e9e dupliqu\u00e9e." : "Dupliqu\u00e9e en m\u00e9moire seulement.", res.result.persisted ? "ok" : "warn");
    render();
  }

  function toggleArchive(idea) {
    S.update(idea.id, { archived: !idea.archived });
    UI.toast(idea.archived ? "D\u00e9sarchiv\u00e9e." : "Archiv\u00e9e \u2014 retrouve-la via le filtre \u00ab Archiv\u00e9es \u00bb.", "ok");
    updateBadge();
    render();
  }

  function exportOne(idea) {
    var md = E.ideaToMarkdown(idea);
    UI.modal({
      title: "Exporter \u00ab " + idea.name + " \u00bb",
      subtitle: "Choisis le format. Aucune donn\u00e9e ne quitte l'appareil.",
      body: el("div", {}, [
        el("button", { class: "option-row", type: "button",
          onclick: function () {
            UI.copyText(md).then(function (ok) { UI.toast(ok ? "Markdown copi\u00e9." : "Copie refus\u00e9e.", ok ? "ok" : "warn"); });
            UI.closeModal();
          }
        }, [el("span", { class: "o-glyph", text: "\u25A4" }), el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: "Copier en Markdown" }),
          el("div", { class: "o-desc", text: "Pour Notion, Obsidian, un d\u00e9p\u00f4t Git\u2026" })])]),
        el("button", { class: "option-row", type: "button",
          onclick: function () {
            UI.copyText(E.ideaToPlainText(idea)).then(function (ok) { UI.toast(ok ? "Texte copi\u00e9." : "Copie refus\u00e9e.", ok ? "ok" : "warn"); });
            UI.closeModal();
          }
        }, [el("span", { class: "o-glyph", text: "\u25A5" }), el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: "Copier en texte brut" }),
          el("div", { class: "o-desc", text: "Pour un e-mail, un message, une note rapide." })])]),
        el("button", { class: "option-row", type: "button",
          onclick: function () {
            var ok = UI.download(safeName(idea.name) + ".md", md, "text/markdown;charset=utf-8");
            UI.toast(ok ? "Fichier .md pr\u00e9par\u00e9." : "T\u00e9l\u00e9chargement refus\u00e9.", ok ? "ok" : "warn");
            UI.closeModal();
          }
        }, [el("span", { class: "o-glyph", text: "\u21E9" }), el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: "T\u00e9l\u00e9charger un fichier .md" }),
          el("div", { class: "o-desc", text: safeName(idea.name) + ".md" })])]),
        el("button", { class: "option-row", type: "button",
          onclick: function () {
            UI.closeModal();
            UI.share(safeName(idea.name) + ".md", md, "text/markdown").then(function (st) {
              if (st === "shared") UI.toast("Partag\u00e9.", "ok");
              else if (st === "cancelled") {}
              else {
                var ok = UI.download(safeName(idea.name) + ".md", md, "text/markdown;charset=utf-8");
                UI.toast(ok ? "Partage indisponible ici \u2014 fichier t\u00e9l\u00e9charg\u00e9." : "Partage et t\u00e9l\u00e9chargement indisponibles ici.", ok ? "info" : "warn");
              }
            });
          }
        }, [el("span", { class: "o-glyph", text: "\u2197" }), el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: "Partager (feuille iOS)" }),
          el("div", { class: "o-desc", text: "Envoie le dossier dans une autre app." })])])
      ]),
      actions: [{ label: "Fermer", class: "btn-ghost", onClick: function () {} }]
    });
  }

  function deleteIdea(idea) {
    UI.confirm({
      title: "Supprimer cette id\u00e9e ?",
      subtitle: "\u00ab " + idea.name + " \u00bb sera retir\u00e9e d\u00e9finitivement du Vault.",
      confirmLabel: "Supprimer", danger: true
    }).then(function (yes) {
      if (!yes) return;
      S.remove(idea.id);
      if (App.currentIdea && App.currentIdea.id === idea.id) App.currentIdea = null;
      updateBadge();
      UI.toast("Id\u00e9e supprim\u00e9e.", "info");
      render();
    });
  }

  function exportLibrary() {
    var json = S.exportJSON();
    UI.modal({
      title: "Exporter la biblioth\u00e8que",
      subtitle: S.ideas().length + " id\u00e9e(s) \u2014 fichier JSON r\u00e9importable.",
      body: el("div", {}, [
        el("button", { class: "option-row", type: "button",
          onclick: function () {
            var ok = UI.download("idea-explosion-vault.json", json, "application/json;charset=utf-8");
            UI.toast(ok ? "Sauvegarde .json pr\u00e9par\u00e9e." : "T\u00e9l\u00e9chargement refus\u00e9.", ok ? "ok" : "warn");
            UI.closeModal();
          }
        }, [el("span", { class: "o-glyph", text: "\u21E9" }), el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: "T\u00e9l\u00e9charger idea-explosion-vault.json" }),
          el("div", { class: "o-desc", text: "\u00c0 garder en lieu s\u00fbr : c'est ta sauvegarde." })])]),
        el("button", { class: "option-row", type: "button",
          onclick: function () {
            UI.copyText(json).then(function (ok) { UI.toast(ok ? "JSON copi\u00e9." : "Copie refus\u00e9e.", ok ? "ok" : "warn"); });
            UI.closeModal();
          }
        }, [el("span", { class: "o-glyph", text: "\u25A4" }), el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: "Copier le JSON" }),
          el("div", { class: "o-desc", text: json.length + " caract\u00e8res" })])]),
        el("button", { class: "option-row", type: "button",
          onclick: function () {
            UI.closeModal();
            UI.share("idea-explosion-vault.json", json, "application/json").then(function (st) {
              if (st === "shared") UI.toast("Partag\u00e9.", "ok");
              else if (st === "cancelled") {}
              else {
                var ok = UI.download("idea-explosion-vault.json", json, "application/json;charset=utf-8");
                UI.toast(ok ? "Partage indisponible ici \u2014 fichier t\u00e9l\u00e9charg\u00e9." : "Partage et t\u00e9l\u00e9chargement indisponibles ici.", ok ? "info" : "warn");
              }
            });
          }
        }, [el("span", { class: "o-glyph", text: "\u2197" }), el("div", { class: "o-body" }, [
          el("div", { class: "o-title", text: "Partager" }),
          el("div", { class: "o-desc", text: "Via la feuille de partage iOS." })])])
      ]),
      actions: [{ label: "Fermer", class: "btn-ghost", onClick: function () {} }]
    });
  }

  function importIdeas() {
    var ta = el("textarea", { class: "area", placeholder: "Colle ici le contenu d'une sauvegarde JSON\u2026", "aria-label": "Contenu JSON \u00e0 importer" });
    var fileInput = el("input", { type: "file", accept: ".json,application/json", class: "sr", "aria-label": "Choisir un fichier de sauvegarde" });

    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { ta.value = String(reader.result || ""); UI.toast("Fichier lu \u2014 v\u00e9rifie puis importe.", "info"); };
      reader.onerror = function () { UI.toast("Lecture du fichier impossible.", "warn"); };
      reader.readAsText(file);
    });

    UI.modal({
      title: "Importer des id\u00e9es",
      subtitle: "Choisis un fichier de sauvegarde ou colle le JSON directement.",
      body: el("div", {}, [
        el("button", { class: "option-row", type: "button", onclick: function () { fileInput.click(); } },
          [el("span", { class: "o-glyph", text: "\u21E7" }), el("div", { class: "o-body" }, [
            el("div", { class: "o-title", text: "Choisir un fichier .json" }),
            el("div", { class: "o-desc", text: "S\u00e9lection depuis l'app Fichiers" })])]),
        fileInput,
        ta
      ]),
      actions: [
        { label: "Ajouter", class: "btn-ghost", onClick: function () {
            var text = ta.value.trim();
            if (!text) { UI.toast("Rien \u00e0 importer.", "warn"); return; }
            var r = S.importJSON(text, "merge");
            if (!r.ok) { UI.toast(r.error, "warn"); return; }
            updateBadge();
            UI.toast(r.count + " id\u00e9e(s) ajout\u00e9e(s).", "ok");
            render();
          } },
        { label: "Remplacer tout", class: "btn-coral", onClick: function () {
            var text = ta.value.trim();
            if (!text) { UI.toast("Rien \u00e0 importer.", "warn"); return; }
            var r = S.importJSON(text, "replace");
            if (!r.ok) { UI.toast(r.error, "warn"); return; }
            App.currentIdea = null;
            updateBadge();
            UI.toast(r.count + " id\u00e9e(s) import\u00e9e(s) en remplacement.", "ok");
            render();
          } }
      ]
    });
  }

  /* ROUTEUR DE RENDU */
  function render() {
    var node;
    switch (App.screen) {
      case "fusion": node = renderFusion(); break;
      case "explosion": node = renderExplosion(); break;
      case "blueprint": node = renderBlueprint(); break;
      case "tree": node = renderTree(); break;
      case "vault": node = renderVault(); break;
      default: node = renderLab(); break;
    }
    UI.clear(ROOT);
    ROOT.appendChild(node);
    setTab(App.screen);
    updateBadge();
  }

  /* INITIALISATION */
  function init() {
    document.querySelectorAll("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-nav");
        if (target === App.screen) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
        go(target);
      });
    });

    document.addEventListener("keydown", function (e) { if (e.key === "Escape") UI.closeModal(); });

    var draft = S.loadDraft();
    var last = S.loadLastCombo();
    if (last) App.labSelection = Object.assign({ kind: "kin.app" }, last);
    if (draft) App.fusion = draft;

    var stats = S.stats();
    render();

    setTimeout(function () {
      if (stats.total > 0) UI.toast(stats.total + " id\u00e9e(s) retrouv\u00e9e(s) dans ton Vault.", "info");
      else if (draft && (draft.domain || draft.object || draft.constraint)) UI.toast("Brouillon de fusion restaur\u00e9.", "info");
    }, 700);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.IE_APP = { go: go, back: back, render: render, state: App };
})();
