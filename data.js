/* ==========================================================================
   IDEA EXPLOSION - data.js
   Referentiel des ingredients creatifs.
   Aucune dependance. Expose sur window.IE_DATA.
   ========================================================================== */
(function () {
  "use strict";

  var SLOTS = [
    { key: "domain", label: "Domaine", icon: "\u25C8", weight: 5, help: "Le territoire d'ou part l'idee." },
    { key: "object", label: "Objet", icon: "\u25C6", weight: 3, help: "La matiere, la forme, le support." },
    { key: "constraint", label: "Contrainte", icon: "\u25B2", weight: 2, help: "La regle qui force la creativite." },
    { key: "twist", label: "Twist", icon: "\u2733", weight: 1, help: "La felure qui rend l'idee etrange." }
  ];

  var INGREDIENTS = {
    domain: [
      { id: "dom.bio", label: "Biologie", glyph: "\u274B", tags: ["vivant","organique","croissance","cycle"], problem: "le vivant est imprevisible et se degrade", audience: "chercheurs, jardiniers, curieux du vivant", nouns: ["organisme","symbiose","culture"], verbs: ["cultiver","greffer","faire muter"], tones: ["organique","humide","vivant"] },
      { id: "dom.sound", label: "Son", glyph: "\u266A", tags: ["vibration","rythme","ecoute","frequence"], problem: "le son ne se voit pas et se perd dans le temps", audience: "musiciens, ingenieurs du son, malentendants", nouns: ["frequence","resonance","onde"], verbs: ["accorder","amplifier","enregistrer"], tones: ["resonant","aigu","enveloppant"] },
      { id: "dom.archi", label: "Architecture", glyph: "\u25F1", tags: ["espace","structure","seuil","habiter"], problem: "l'espace bati ne s'adapte pas a ceux qui l'habitent", audience: "architectes, urbanistes, habitants", nouns: ["structure","seuil","module"], verbs: ["batir","habiter","traverser"], tones: ["mineral","brut","sculptural"] },
      { id: "dom.game", label: "Jeu", glyph: "\u25C9", tags: ["regle","tension","recompense","hasard"], problem: "les regles figees finissent par ennuyer", audience: "joueurs, game designers, familles", nouns: ["regle","manche","score"], verbs: ["defier","relancer","bluffer"], tones: ["ludique","nerveux","malin"] },
      { id: "dom.food", label: "Cuisine", glyph: "\u25CD", tags: ["gout","transformation","partage","rituel"], problem: "le gout se transmet mal d'un cuisinier a l'autre", audience: "cuisiniers, restaurateurs, gourmands", nouns: ["saveur","recette","fermentation"], verbs: ["mijoter","assaisonner","transformer"], tones: ["chaleureux","epice","reconfortant"] },
      { id: "dom.urban", label: "Ville", glyph: "\u25A6", tags: ["foule","flux","nuit","systeme"], problem: "la ville produit du mouvement qu'elle ne comprend pas", audience: "citadins, municipalites, militants", nouns: ["flux","trottoir","reseau"], verbs: ["circuler","signaler","occuper"], tones: ["nocturne","dense","electrique"] },
      { id: "dom.memory", label: "Memoire", glyph: "\u25C7", tags: ["souvenir","archive","oubli","recit"], problem: "ce qui est memorise est toujours reecrit", audience: "historiens, familles, archivistes", nouns: ["souvenir","archive","recit"], verbs: ["se rappeler","reecrire","archiver"], tones: ["fane","intime","brumeux"] },
      { id: "dom.space", label: "Espace", glyph: "\u2727", tags: ["vide","distance","silence","immensite"], problem: "la distance rend tout retour impossible", audience: "astronomes, reveurs, ingenieurs", nouns: ["orbite","vide","signal"], verbs: ["orbiter","transmettre","deriver"], tones: ["silencieux","froid","vaste"] },
      { id: "dom.energy", label: "Energie", glyph: "\u26A1", tags: ["flux","reserve","consommation","pic"], problem: "l'energie disponible n'arrive jamais au bon moment", audience: "ingenieurs, collectifs, habitants", nouns: ["reserve","pic","reseau"], verbs: ["stocker","distribuer","capter"], tones: ["tendu","brillant","sourd"] },
      { id: "dom.textile", label: "Textile", glyph: "\u224B", tags: ["fil","trame","peau","usure"], problem: "un tissu ne se repare jamais vraiment", audience: "stylistes, artisans, consommateurs", nouns: ["trame","couture","fibre"], verbs: ["tisser","rapiecer","draper"], tones: ["doux","use","tactile"] }
    ],
    object: [
      { id: "obj.mirror", label: "Miroir", glyph: "\u25A4", tags: ["reflet","inversion","double"], problem: "il ne montre que la surface", audience: "utilisateurs en quete de lucidite", nouns: ["reflet","surface","double"], verbs: ["refleter","inverser","reveler"], tones: ["froid","lisse","tranchant"] },
      { id: "obj.seed", label: "Graine", glyph: "\u2765", tags: ["latence","potentiel","cycle"], problem: "elle ne dit rien de ce qu'elle deviendra", audience: "jardiniers, patients, investisseurs", nouns: ["germe","latence","pousse"], verbs: ["semer","attendre","faire eclore"], tones: ["latent","terrestre","patient"] },
      { id: "obj.ticket", label: "Ticket", glyph: "\u25AD", tags: ["preuve","acces","dechirure"], problem: "il n'a de valeur qu'une fois valide", audience: "spectateurs, voyageurs, collectionneurs", nouns: ["souche","file","preuve"], verbs: ["valider","dechirer","reserver"], tones: ["ephemere","papier","administratif"] },
      { id: "obj.chimney", label: "Cheminee", glyph: "\u2302", tags: ["evacuation","foyer","trace"], problem: "elle evacue ce qu'on voudrait garder", audience: "habitants, artisans, randonneurs", nouns: ["conduit","braise","fumee"], verbs: ["evacuer","fumer","attiser"], tones: ["enfume","chaud","ancien"] },
      { id: "obj.helmet", label: "Casque", glyph: "\u25E0", tags: ["protection","isolement","voix"], problem: "il protege en coupant du monde", audience: "ouvriers, pilotes, joueurs", nouns: ["visiere","coque","sourdine"], verbs: ["proteger","isoler","assourdir"], tones: ["mat","technique","etouffe"] },
      { id: "obj.magnet", label: "Aimant", glyph: "\u2282", tags: ["attraction","invisible","collage"], problem: "il attire sans distinguer le bon du mauvais", audience: "bricoleurs, logisticiens, enfants", nouns: ["champ","pole","attirance"], verbs: ["attirer","coller","repousser"], tones: ["invisible","sec","tenace"] },
      { id: "obj.lantern", label: "Lanterne", glyph: "\u25D0", tags: ["portee","veille","halo"], problem: "elle n'eclaire que tres pres", audience: "veilleurs, marcheurs, pecheurs", nouns: ["halo","meche","portee"], verbs: ["eclairer","veiller","balayer"], tones: ["chaud","tremblant","nocturne"] },
      { id: "obj.ledger", label: "Registre", glyph: "\u25A5", tags: ["trace","compte","preuve"], problem: "il enregistre sans jamais interpreter", audience: "comptables, chercheurs, justiciers", nouns: ["colonne","ligne","solde"], verbs: ["inscrire","compter","reconcilier"], tones: ["rigoureux","sec","administratif"] },
      { id: "obj.accordion", label: "Accordeon", glyph: "\u00A7", tags: ["souffle","pli","nostalgie"], problem: "il depend entierement d'un souffle exterieur", audience: "fetes, ruelles, memoire populaire", nouns: ["soufflet","pli","ballade"], verbs: ["gonfler","plier","chanter"], tones: ["poussierreux","festif","populaire"] },
      { id: "obj.rope", label: "Corde", glyph: "\u223F", tags: ["lien","tension","noeud"], problem: "elle casse toujours a l'endroit le plus use", audience: "grimpeurs, marins, reparateurs", nouns: ["noeud","tension","brin"], verbs: ["nouer","tendre","retenir"], tones: ["rude","rugueux","solide"] },
      { id: "obj.key", label: "Cle", glyph: "\u26BF", tags: ["acces","serrure","secret"], problem: "elle n'ouvre qu'une porte a la fois", audience: "voyageurs, gardiens, enqueteurs", nouns: ["serrure","panneton","trou de serrure"], verbs: ["ouvrir","verrouiller","forger"], tones: ["metallique","precis","discret"] },
      { id: "obj.vial", label: "Fiole", glyph: "\u25E1", tags: ["dose","fragilite","experience"], problem: "elle ne contient qu'une seule tentative", audience: "chimistes, parfumeurs, soignants", nouns: ["dose","goutte","bouchon"], verbs: ["doser","verser","analyser"], tones: ["fragile","limpide","precis"] }
    ],
    constraint: [
      { id: "con.one", label: "Une seule action", glyph: "\u25A3", tags: ["minimal","radical","geste"], problem: "une seule action doit tout porter", nouns: ["geste unique","bouton","impulsion"], verbs: ["appuyer","declencher","tenir"], tones: ["radical","net","minimal"] },
      { id: "con.offline", label: "Hors ligne", glyph: "\u2298", tags: ["autonomie","local","panne"], problem: "tout doit fonctionner sans reseau", nouns: ["cache","carnet","autonomie"], verbs: ["stocker","synchroniser","attendre"], tones: ["sobre","autonome","robuste"] },
      { id: "con.whisper", label: "Tout est murmure", glyph: "\u25D4", tags: ["intime","calme","proximite"], problem: "aucune information ne peut etre criee", nouns: ["murmure","souffle","confidence"], verbs: ["chuchoter","approcher","retenir"], tones: ["sourd","intime","feutre"] },
      { id: "con.teams", label: "Deux equipes", glyph: "\u2297", tags: ["conflit","alliance","tension"], problem: "deux camps doivent cooperer sans se faire confiance", nouns: ["alliance","camp","troc"], verbs: ["negocier","trahir","pactiser"], tones: ["tendu","collectif","theatral"] },
      { id: "con.decay", label: "Tout se degrade", glyph: "\u21AF", tags: ["usure","temps","urgence"], problem: "chaque usage abime un peu plus l'objet", nouns: ["usure","entretien","fissure"], verbs: ["reparer","economiser","remplacer"], tones: ["fievreux","use","urgent"] },
      { id: "con.novoice", label: "Sans texte", glyph: "\u25CC", tags: ["iconique","muet","geste"], problem: "aucun mot ne peut expliquer l'usage", nouns: ["icone","symbole","forme"], verbs: ["montrer","deviner","gestuer"], tones: ["muet","graphique","universel"] },
      { id: "con.night", label: "Uniquement la nuit", glyph: "\u263E", tags: ["nocturne","secret","fenetre"], problem: "l'experience s'arrete a l'aube", nouns: ["fenetre nocturne","secret","lueur"], verbs: ["veiller","se cacher","disparaitre"], tones: ["nocturne","bleu","confidentiel"] },
      { id: "con.two", label: "Deux minutes max", glyph: "\u25F7", tags: ["bref","intense","complet"], problem: "tout doit tenir en deux minutes", nouns: ["minuteur","pulse","manche"], verbs: ["minuter","condenser","conclure"], tones: ["nerveux","compact","urgent"] },
      { id: "con.reversible", label: "Tout est reversible", glyph: "\u21C4", tags: ["annulation","essai","confiance"], problem: "aucune decision ne peut etre definitive", nouns: ["retour","essai","annulation"], verbs: ["annuler","reessayer","comparer"], tones: ["souple","leger","rassurant"] },
      { id: "con.free", label: "Gratuite totale", glyph: "\u2205", tags: ["abondance","partage","modele"], problem: "l'experience ne peut rien couter", nouns: ["don","commun","partage"], verbs: ["donner","partager","financer autrement"], tones: ["ouvert","genereux","collectif"] }
    ],
    twist: [
      { id: "twit.silence", label: "Le silence parle", glyph: "\u25DC", tags: ["silence","presence"], problem: "le vide devient le message principal", nouns: ["silence","pause","blanc"], verbs: ["faire silence","laisser passer"], tones: ["suspendu","epure"] },
      { id: "twit.split", label: "Se dedouble", glyph: "\u22C8", tags: ["double","dedoublement"], problem: "l'idee existe en deux versions simultanees", nouns: ["jumeau","double","miroir"], verbs: ["dedoubler","comparer"], tones: ["troublant","symetrique"] },
      { id: "twit.memory", label: "Memoire propre", glyph: "\u27F2", tags: ["memoire","souvenir"], problem: "l'objet se souvient de son usage precedent", nouns: ["memoire","empreinte","trace"], verbs: ["se souvenir","oublier"], tones: ["nostalgique","intime"] },
      { id: "twit.grow", label: "Grandit tout seul", glyph: "\u2197", tags: ["croissance","autonomie"], problem: "l'idee evolue meme en l'absence d'utilisateur", nouns: ["pousse","derive","expansion"], verbs: ["grandir","deriver"], tones: ["vivant","incontrole"] },
      { id: "twit.invert", label: "S'inverse", glyph: "\u21C5", tags: ["inversion","retournement"], problem: "la fonction principale se retourne contre l'usage", nouns: ["retournement","envers","contre-usage"], verbs: ["retourner","inverser"], tones: ["subversif","ambigu"] },
      { id: "twit.steal", label: "Se fait voler", glyph: "\u27DF", tags: ["appropriation","commun"], problem: "l'idee est meilleure entre les mains des autres", nouns: ["butin","copie","commun"], verbs: ["emprunter","citer"], tones: ["libre","espiegle"] },
      { id: "twit.alive", label: "Prend vie", glyph: "\u2756", tags: ["vivant","agent"], problem: "l'idee prend des decisions sans demander", nouns: ["agent","impulsion","volonte"], verbs: ["decider","s'echapper"], tones: ["inquietant","curieux"] },
      { id: "twit.forget", label: "Oublie tout", glyph: "\u25CC", tags: ["oubli","reset"], problem: "l'experience repart de zero a chaque fois", nouns: ["oubli","page blanche","reset"], verbs: ["effacer","recommencer"], tones: ["radical","pur"] }
    ]
  };

  var KINDS = [
    { id: "kin.app", label: "Application", glyph: "\u25A2", tone: "numerique", noun: "application", artifact: "interface", verb: "utiliser", deliverable: ["Ecrans cles","Parcours principal","Modele d'usage","Stack possible"] },
    { id: "kin.game", label: "Jeu", glyph: "\u25C9", tone: "ludique", noun: "jeu", artifact: "boucle de jeu", verb: "jouer", deliverable: ["Boucle de jeu","Regles","Condition de victoire","Materiel"] },
    { id: "kin.object", label: "Objet", glyph: "\u25C6", tone: "physique", noun: "objet", artifact: "prototype", verb: "manipuler", deliverable: ["Forme","Materiaux","Fabrication","Prix cible"] },
    { id: "kin.brand", label: "Marque", glyph: "\u2733", tone: "narratif", noun: "marque", artifact: "identite", verb: "acheter", deliverable: ["Positionnement","Noms","Univers visuel","Produits"] },
    { id: "kin.exp", label: "Experience", glyph: "\u2727", tone: "sensoriel", noun: "experience", artifact: "mise en scene", verb: "vivre", deliverable: ["Decor","Dramaturgie","Duree","Lieu"] },
    { id: "kin.universe", label: "Univers fictif", glyph: "\u25C7", tone: "mythique", noun: "univers", artifact: "lore", verb: "explorer", deliverable: ["Geographie","Regles du monde","Factions","Recits"] }
  ];

  window.IE_DATA = { SLOTS: SLOTS, INGREDIENTS: INGREDIENTS, KINDS: KINDS, TOTAL_COMBOS: 256 };
})();
