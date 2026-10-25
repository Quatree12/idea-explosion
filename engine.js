/* ==========================================================================
   IDEA EXPLOSION - engine.js
   MOTEUR LOCAL DE COMBINAISONS.
   --------------------------------------------------------------------------
   HONNETETE TECHNIQUE - A LIRE :
   Ce moteur n'est PAS une IA. C'est un moteur deterministe de combinatorique
   textuelle : il selectionne des fragments de vocabulaire (verbs / nouns /
   tones) portes par les ingredients choisis, puis les assemble selon la
   structure du type de creation.
   ========================================================================== */
(function () {
  "use strict";

  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }

  function pick(arr, rng) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
  function pickN(arr, n, rng) {
    var pool = arr.slice(), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function getIngredient(slot, id) {
    var list = window.IE_DATA.INGREDIENTS[slot] || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function getKind(id) {
    var list = window.IE_DATA.KINDS;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }
  function resolveCombo(combo) {
    return {
      domain: getIngredient("domain", combo.domain),
      object: getIngredient("object", combo.object),
      constraint: getIngredient("constraint", combo.constraint),
      twist: getIngredient("twist", combo.twist),
      kind: getKind(combo.kind)
    };
  }
  function comboIsComplete(combo) {
    if (!combo || !combo.kind) return false;
    var r = resolveCombo(combo);
    return !!(r.domain && r.object && r.constraint);
  }

  function computeADN(combo) {
    var parts = window.IE_DATA.SLOTS.map(function (s) {
      return (combo[s.key] || ".....").replace(/^[a-z]+\./, "");
    });
    return parts.join("-").toUpperCase();
  }

  var HUE_MAP = [
    { tag: "vivant", hue: [120,150] }, { tag: "vibration", hue: [265,300] },
    { tag: "espace", hue: [200,220] }, { tag: "regle", hue: [20,45] },
    { tag: "gout", hue: [10,35] }, { tag: "foule", hue: [285,320] },
    { tag: "souvenir", hue: [320,345] }, { tag: "vide", hue: [220,250] },
    { tag: "flux", hue: [45,70] }, { tag: "fil", hue: [300,330] },
    { tag: "reflet", hue: [195,215] }, { tag: "latence", hue: [95,125] },
    { tag: "preuve", hue: [235,255] }, { tag: "evacuation", hue: [15,30] },
    { tag: "protection", hue: [210,230] }, { tag: "attraction", hue: [340,360] },
    { tag: "portee", hue: [35,55] }, { tag: "trace", hue: [250,270] },
    { tag: "souffle", hue: [15,40] }, { tag: "lien", hue: [30,50] },
    { tag: "acces", hue: [180,200] }, { tag: "dose", hue: [160,185] }
  ];

  function computeSignature(combo, seed) {
    var r = resolveCombo(combo);
    var rng = makeRng(seed ^ 0x9e3779b9);
    var allTags = [];
    ["domain","object","constraint","twist"].forEach(function (k) {
      if (r[k]) allTags = allTags.concat(r[k].tags || []);
    });
    var hues = [];
    allTags.forEach(function (t) {
      for (var i = 0; i < HUE_MAP.length; i++) if (HUE_MAP[i].tag === t) { hues.push(HUE_MAP[i].hue); break; }
    });
    if (hues.length < 2) hues = [[265,290],[185,205]];
    var picked = pickN(hues, Math.min(3, hues.length), rng);
    var h1 = picked[0] ? Math.round((picked[0][0] + picked[0][1]) / 2) : 268;
    var h2 = picked[1] ? Math.round((picked[1][0] + picked[1][1]) / 2) : 190;
    var h3 = picked[2] ? Math.round((picked[2][0] + picked[2][1]) / 2) : h1;
    return { h1: h1, h2: h2, h3: h3, facets: 3 + Math.floor(rng() * 5) };
  }

  var PREFIXES = ["NEO","HYPER","META","ANTI","ULTRA","POLY","ECHO","FRACT"];
  var SUFFIXES = ["LAB","SYNDICAT","PROTOCOLE","RITUEL","ATELIER","CLUB","STATION","BUREAU"];

  function buildName(combo, seed) {
    var r = resolveCombo(combo);
    var rng = makeRng(seed ^ 0x51ed270b);
    var style = Math.floor(rng() * 5);
    var d = r.domain, o = r.object, t = r.twist, c = r.constraint;
    function stem(x) { return x ? x.label.toUpperCase() : "VIDE"; }
    function bare(x) { return x ? x.label : "vide"; }
    switch (style) {
      case 0: return stem(o) + " " + stem(d);
      case 1: return pick(PREFIXES, rng) + "\u00B7" + stem(o);
      case 2: return stem(o) + " \u2014 " + cap(bare(c)) + " " + pick(SUFFIXES, rng);
      case 3: return "LE " + stem(d) + " " + stem(t);
      default: return stem(d) + " / " + stem(o) + " / " + stem(c);
    }
  }

  function bareAdjective(rng) {
    var options = ["Une etrange","Une discrete","Une obstinee","Une lumineuse","Une rugueuse"];
    return options[Math.floor(rng() * options.length)];
  }

  function buildPitch(combo, seed) {
    var r = resolveCombo(combo);
    var rng = makeRng(seed ^ 0x2545f491);
    var d = r.domain, o = r.object, c = r.constraint, t = r.twist, k = r.kind;
    var verb = pick(d.verbs, rng);
    var noun = pick(o.nouns, rng);
    var tone = pick(t ? t.tones : d.tones, rng);
    var forms = [
      "Une " + k.noun + " " + tone + " qui reinvente " + d.label.toLowerCase() + " grace a un " + o.label.toLowerCase() + " : " + verb + " devient une experience " + tone + ", sous contrainte \u00AB " + c.label.toLowerCase() + " \u00BB.",
      "Et si " + verb + " " + noun + " etait la seule facon de " + k.verb + " une " + k.noun + " " + tone + " ? " + cap(o.label) + " rencontre " + d.label.toLowerCase() + ", et \u00AB " + c.label.toLowerCase() + " \u00BB change tout.",
      cap(bareAdjective(rng)) + " " + k.noun + " " + tone + " ou le " + o.label.toLowerCase() + " sert de " + noun + ". Contrainte assumee : " + c.label.toLowerCase() + ". Twist : " + (t ? t.label.toLowerCase() : "aucun") + "."
    ];
    return pick(forms, rng);
  }

  function computeDifficulty(combo) {
    var r = resolveCombo(combo);
    var HEAVY_CONSTRAINTS = { "con.teams": 2, "con.decay": 2, "con.offline": 1, "con.two": 1 };
    var HEAVY_KINDS = { "kin.exp": 2, "kin.universe": 2, "kin.object": 1, "kin.app": 1 };
    var score = 2;
    score += HEAVY_CONSTRAINTS[r.constraint.id] || 0;
    score += HEAVY_KINDS[r.kind.id] || 0;
    if (combo.twist) score += 1;
    if (r.constraint.id === "con.free") score += 1;
    if (r.domain.id === "dom.archi" || r.domain.id === "dom.space") score += 1;
    score = Math.max(1, Math.min(5, score));
    var labels = { 1: "Trivial", 2: "Facile", 3: "Modere", 4: "Exigeant", 5: "Radical" };
    return {
      score: score, max: 5, label: labels[score],
      note: score >= 4 ? "Faisable en solo, mais demande un vrai prototype avant toute promesse." : "Faisable en solo sur quelques semaines, a condition de trancher le perimetre."
    };
  }

  function computeBudget(difficulty, combo) {
    var base = { 1: 2, 2: 6, 3: 14, 4: 30, 5: 60 }[difficulty.score];
    if (combo.constraint === "con.free") base = Math.round(base * 0.7);
    if (combo.kind === "kin.object") base = Math.round(base * 1.4);
    return { min: Math.max(1, base - 3), max: base + 5, unit: "jours de conception", note: "Estimation d'effort creatif, hors production industrielle." };
  }

  function computeMonetization(c, combo, rng) {
    var options = [];
    var k = getKind(combo.kind).id;
    if (c.id === "con.free") {
      options.push("Gratuite totale, financement par mecenat ou collectivite");
      options.push("Version libre + un tirage physique limite");
      options.push("Atelier payant autour du concept (l'objet reste gratuit)");
    } else {
      options.push("Achat unique de l'" + (k === "kin.object" ? "objet" : "acces"));
      options.push("Abonnement pour la continuite (versions, sauvegardes, communaute)");
      options.push("Edition limitee numerotee, faite a la main");
      if (k === "kin.brand" || k === "kin.universe") options.push("Licence du concept a un partenaire");
      if (k === "kin.game" || k === "kin.exp") options.push("Billetterie d'une session, avec version courte gratuite");
    }
    return pickN(options, Math.min(3, options.length), rng);
  }

  function buildRisks(combo, rng) {
    var pool = [
      "Le concept peut sembler gadget s'il est presente sans demonstration.",
      "La contrainte choisie exclut une partie de l'audience : a assumer.",
      "Sans prototype manipulable, la promesse reste abstraite.",
      "Le nom doit etre retravaille avant tout depot de marque.",
      "Le facteur twist peut rendre le mode d'emploi indispensable.",
      "Attention a ne pas confondre originalite et confusion."
    ];
    return pickN(pool, 2, rng);
  }

  function buildBlueprint(idea) {
    var combo = idea.combo;
    var r = resolveCombo(combo);
    var rng = makeRng(idea.seed ^ 0x1b56c4e9);
    var d = r.domain, o = r.object, c = r.constraint, t = r.twist, k = r.kind;
    var verb = pick(d.verbs, rng);
    var noun = pick(o.nouns, rng);

    var problem = "Dans le champ \u00AB " + d.label + " \u00BB, " + d.problem + ". Avec un " + o.label.toLowerCase() + " comme point de depart, " + o.problem + ". La contrainte \u00AB " + c.label.toLowerCase() + " \u00BB rend la solution evidente impossible : il faut donc " + verb + " autrement.";
    var audience = cap(d.audience) + ". Le concept parle aussi a toute personne qui accepte de " + k.verb + " un " + k.noun + " " + pick(d.tones, rng) + " sans mode d'emploi.";

    var featureSeeds = [
      "Un coeur de " + noun + " qui reagit a \u00AB " + c.label.toLowerCase() + " \u00BB",
      "Une entree unique : \u00AB " + verb + " \u00BB - le reste s'en deduit",
      "Une surface " + pick(o.tones, rng) + " manipulable a la main",
      "Un journal personnel de " + d.label.toLowerCase() + ", exportable",
      "Un mode " + (c.id === "con.night" ? "diurne de secours" : "degrade et reparable"),
      "Un partage d'une " + k.noun + " a un proche, sans compte"
    ];
    var features = pickN(featureSeeds, 5, rng);

    var journey = [
      "Decouverte - on tombe sur " + pick(d.nouns, rng) + " par hasard, sans tutoriel.",
      "Premier geste - " + verb + " une fois, et l'objet repond immediatement.",
      "Friction voulue - \u00AB " + c.label.toLowerCase() + " \u00BB empeche la routine.",
      "Moment de bascule - " + (t ? t.problem : "l'usage change de nature") + ".",
      "Sortie - on repart avec un " + pick(o.nouns, rng) + " a montrer."
    ];

    var artDirection = "Matiere " + pick(d.tones, rng) + ", lumiere " + pick(o.tones, rng) + ". Palette dominante tiree des ingredients, contrastes francs, aucune decoration gratuite. Le " + o.label.toLowerCase() + " doit rester reconnaissable meme stylise.";

    var difficulty = computeDifficulty(combo);
    var budget = computeBudget(difficulty, combo);
    var monetization = computeMonetization(c, combo, rng);
    var deliverable = k.deliverable.map(function (label, i) {
      return label + " - " + pickN(o.nouns.concat(d.nouns), 1, makeRng(idea.seed + i))[0];
    });

    return {
      problem: problem, audience: audience, features: features, journey: journey,
      artDirection: artDirection, deliverable: deliverable,
      difficulty: difficulty, budget: budget, risks: buildRisks(combo, rng),
      monetization: monetization
    };
  }

  function generateIdea(input) {
    var combo = { kind: input.kind, domain: input.domain, object: input.object, constraint: input.constraint, twist: input.twist || null };
    var seed = (input.seed || Date.now()) >>> 0;
    var signature = computeSignature(combo, seed);
    var idea = {
      id: input.id || null,
      name: buildName(combo, seed),
      pitch: buildPitch(combo, seed),
      combo: combo, seed: seed, adn: computeADN(combo), signature: signature,
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: input.parentId || null,
      mutationLabel: input.mutationLabel || null,
      favorite: !!input.favorite,
      archived: !!input.archived
    };
    idea.blueprint = buildBlueprint(idea);
    return idea;
  }

  var SLOT_LABELS = { domain: "domaine", object: "objet", constraint: "contrainte", twist: "twist" };

  function mutationOptions(combo) {
    var opts = [];
    ["domain","object","constraint","twist"].forEach(function (slot) {
      var list = window.IE_DATA.INGREDIENTS[slot] || [];
      var alternatives = list.filter(function (i) { return i.id !== combo[slot]; });
      if (!alternatives.length) return;
      opts.push({ op: "swap" + cap(slot), slot: slot, label: "Remplacer " + SLOT_LABELS[slot], pool: alternatives });
    });
    var kinds = window.IE_DATA.KINDS.filter(function (k) { return k.id !== combo.kind; });
    opts.push({ op: "changeKind", slot: "kind", label: "Changer de format", pool: kinds });
    if (!combo.twist) opts.push({ op: "addTwist", slot: "twist", label: "Ajouter un twist", pool: window.IE_DATA.INGREDIENTS.twist });
    opts.push({ op: "remix", slot: null, label: "Tout remelanger", pool: null, random: true });
    return opts;
  }

  function mutate(idea, op, explicitValue) {
    var combo = JSON.parse(JSON.stringify(idea.combo));
    var rng = makeRng((idea.seed ^ 0x7f4a7c15) + hashString(op + (explicitValue || "")));

    if (op === "remix") {
      ["domain","object","constraint","twist"].forEach(function (slot) {
        combo[slot] = pick(window.IE_DATA.INGREDIENTS[slot] || [], rng).id;
      });
    } else if (op === "addTwist") {
      combo.twist = explicitValue || pick(window.IE_DATA.INGREDIENTS.twist, rng).id;
    } else if (op === "changeKind") {
      var kindPool = window.IE_DATA.KINDS.filter(function (k) { return k.id !== combo.kind; });
      combo.kind = explicitValue || pick(kindPool.length ? kindPool : window.IE_DATA.KINDS, rng).id;
    } else {
      var spec = mutationOptions(combo).filter(function (o) { return o.op === op; })[0];
      var slot = spec ? spec.slot : null;
      if (!slot) return null;
      var chosen = explicitValue;
      if (!chosen) {
        var pool = (window.IE_DATA.INGREDIENTS[slot] || []).filter(function (i) { return i.id !== combo[slot]; });
        if (!pool.length) return null;
        chosen = pick(pool, rng).id;
      }
      combo[slot] = chosen;
    }

    return generateIdea({
      id: null, kind: combo.kind, domain: combo.domain, object: combo.object,
      constraint: combo.constraint, twist: combo.twist,
      seed: (idea.seed + hashString(op + Date.now().toString(36))) >>> 0,
      parentId: idea.id,
      mutationLabel: describeMutation(op, idea.combo, combo)
    });
  }

  function describeMutation(op, before, after) {
    var names = { swapDomain: "Domaine remplace", swapObject: "Objet remplace", swapConstraint: "Contrainte remplacee", swapTwist: "Twist remplace", changeKind: "Format change", addTwist: "Twist ajoute", remix: "Remelange complet" };
    var slotOf = { swapDomain: "domain", swapObject: "object", swapConstraint: "constraint", swapTwist: "twist" };
    if (slotOf[op]) {
      var a = getIngredient(slotOf[op], before[slotOf[op]]);
      var b = getIngredient(slotOf[op], after[slotOf[op]]);
      if (a && b) return names[op] + " : " + a.label + " -> " + b.label;
    }
    return names[op] || "Variante";
  }

  function ideaToMarkdown(idea) {
    var r = resolveCombo(idea.combo);
    var b = idea.blueprint;
    var L = [];
    L.push("# " + idea.name);
    L.push("");
    L.push("> " + idea.pitch);
    L.push("");
    L.push("**ADN :** `" + idea.adn + "`  ");
    L.push("**Format :** " + r.kind.label + "  ");
    L.push("**Creee le :** " + new Date(idea.createdAt).toLocaleString("fr-CH"));
    if (idea.mutationLabel) L.push("**Variante :** " + idea.mutationLabel);
    L.push("");
    L.push("## Ingredients");
    L.push("");
    L.push("| Role | Ingredient |");
    L.push("| --- | --- |");
    L.push("| Domaine | " + (r.domain ? r.domain.label : "-") + " |");
    L.push("| Objet | " + (r.object ? r.object.label : "-") + " |");
    L.push("| Contrainte | " + (r.constraint ? r.constraint.label : "-") + " |");
    L.push("| Twist | " + (r.twist ? r.twist.label : "aucun") + " |");
    L.push("");
    L.push("## Probleme");
    L.push("");
    L.push(b.problem);
    L.push("");
    L.push("## Public cible");
    L.push("");
    L.push(b.audience);
    L.push("");
    L.push("## Fonctionnalites");
    L.push("");
    b.features.forEach(function (f) { L.push("- " + f); });
    L.push("");
    L.push("## Parcours utilisateur");
    L.push("");
    b.journey.forEach(function (j, i) { L.push((i + 1) + ". " + j); });
    L.push("");
    L.push("## Direction artistique");
    L.push("");
    L.push(b.artDirection);
    L.push("");
    L.push("## Livrables");
    L.push("");
    b.deliverable.forEach(function (d) { L.push("- " + d); });
    L.push("");
    L.push("## Difficulte");
    L.push("");
    L.push("**" + b.difficulty.label + "** (" + b.difficulty.score + "/" + b.difficulty.max + ") - " + b.difficulty.note);
    L.push("");
    L.push("Effort estime : " + b.budget.min + "-" + b.budget.max + " " + b.budget.unit + ".");
    L.push("");
    L.push("## Pistes de monetisation");
    L.push("");
    b.monetization.forEach(function (m) { L.push("- " + m); });
    L.push("");
    L.push("## Risques");
    L.push("");
    b.risks.forEach(function (x) { L.push("- " + x); });
    L.push("");
    L.push("---");
    L.push("Genere par IDEA EXPLOSION - moteur local de combinaisons (sans IA).");
    return L.join("\n");
  }

  function ideaToPlainText(idea) {
    return ideaToMarkdown(idea).replace(/^#+\s*/gm, "").replace(/\*\*/g, "").replace(/^>\s?/gm, "").replace(/`/g, "");
  }

  window.IE_ENGINE = {
    generateIdea: generateIdea, mutate: mutate, mutationOptions: mutationOptions,
    resolveCombo: resolveCombo, comboIsComplete: comboIsComplete, computeADN: computeADN,
    ideaToMarkdown: ideaToMarkdown, ideaToPlainText: ideaToPlainText,
    makeRng: makeRng, hashString: hashString
  };
})();
