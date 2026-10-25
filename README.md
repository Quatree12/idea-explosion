# IDEA EXPLOSION

**The Creative Chaos Engine** — une web app mobile-first qui transforme des combinaisons d'idées improbables en concepts créatifs exploitables : applications, jeux, objets, marques, expériences ou univers fictifs.

> ⚠️ **Honnêteté technique.** Cette application n'utilise **aucune IA** et ne fait **aucune requête réseau**. Le moteur est un générateur **déterministe de combinatorique textuelle** : il tire des fragments de vocabulaire portés par les ingrédients choisis, puis les assemble par gabarits. Changer un ingrédient change réellement le résultat, mais la prose **recompose**, elle n'invente pas. L'app le dit elle-même à trois endroits dans l'interface.

## Lancer l'application

Aucune installation, aucune dépendance, aucun build.

**En local :** ouvre `index.html` dans un navigateur.

**En ligne (GitHub Pages) :**
1. `Settings` → `Pages`
2. *Source* : `Deploy from a branch`
3. *Branch* : `main` / `/ (root)` → **Save**
4. Le site sort sur `https://<ton-user>.github.io/idea-explosion/`

**Sur iPhone :** ouvre l'URL dans Safari, puis *Partager → Sur l'écran d'accueil*. L'app se lance en plein écran avec sa propre icône, et les idées survivent à la fermeture.

## Les 6 écrans

| Écran | Rôle |
| --- | --- |
| **The Lab** | Accueil : objets de verre flottants sélectionnables, choix du format, bouton *Créer une explosion*, historique récent |
| **Fusion Chamber** | Trois ingrédients requis + un format. Glisser-déposer tactile **et** alternative par bouton sur chaque ligne |
| **The Explosion** | Animation de fusion, nom, accroche, ADN, illustration dérivée des ingrédients, relancer / muter / enregistrer |
| **Idea Blueprint** | Dossier complet : problème, public, fonctionnalités, parcours, direction artistique, livrables, difficulté, monétisation, risques |
| **Mutation Tree** | Arbre de variantes rattachées à l'originale, qui n'est jamais écrasée |
| **The Vault** | Bibliothèque : recherche, filtres, tris, favoris, renommage, duplication, archivage, export, import, suppression |

## Architecture

```
index.html      structure + barre d'onglets
styles.css      design system « Chaos Glass »
data.js         référentiel des ingrédients (pointeur de données pur)
engine.js       moteur local de combinaisons + export texte
store.js        persistance localStorage + état
ui.js           briques d'interface (toast, modales, illustration SVG)
app.js          routeur d'écrans + les 6 écrans
```

Aucune dépendance externe. Tout tient en ~170 Ko de texte.

### Pourquoi `engine.js` est isolé

C'est la seule couture à remplacer pour brancher une vraie IA plus tard : `IE_ENGINE.generateIdea(combo)` renvoie un objet idée complet, et les écrans ne savent rien de la façon dont il a été produit. Le reste de l'application ne bouge pas.

## Base de combinaisons

**10** domaines × **12** objets × **10** contraintes × **8** twists × **6** formats = **57 600** pistes distinctes.

Chaque ingrédient porte des `tags`, des `nouns`, des `verbs` et des `tones` — ce sont eux qui alimentent réellement le texte généré, ainsi que la signature visuelle (teinte, facettes) de l'illustration.

## Ce qui est disponible / ce qui demanderait un service externe

| Fonction | État |
| --- | --- |
| Génération, mutations, blueprint | ✅ Local, hors ligne |
| Sauvegarde, réouverture, recherche, filtres | ✅ Local (localStorage) |
| Export Markdown / texte / JSON, import | ✅ Local (presse-papiers, fichier, feuille de partage) |
| Illustration | ✅ SVG généré depuis les ingrédients |
| Génération par un modèle d'IA | ⛔ Nécessite une clé API et un backend |
| Illustration par un modèle d'image | ⛔ Nécessite un service externe |
| Comptes, synchronisation entre appareils | ⛔ Nécessite un backend |

## Export

Le Vault exporte un JSON réimportable — menu *Exporter la bibliothèque*. Le dossier d'une idée s'exporte en Markdown (Notion, Obsidian, dépôt Git) ou en texte brut.

## Tests

Un harnais d'assertions couvre le référentiel, la génération, la validation, les mutations, la persistance, l'export et la robustesse. Les sections référentiel → mutations ont été exécutées et passées. Les sections persistance, export et robustesse **n'ont pas pu être exécutées** dans l'environnement de développement utilisé : elles restent à valider dans un navigateur.

## Licence

À définir. Projet personnel.
