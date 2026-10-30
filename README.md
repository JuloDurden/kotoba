# Kotoba · Dojo de japonais

**Kotoba** (言葉, « mot, langage ») est une application web d'apprentissage du japonais pour francophones, inspirée de Duolingo : des leçons courtes, une progression pas à pas, des révisions et des jeux.

> Statut : **v0.2, en développement**. Pas encore de version 1.0 : l'interface et les contenus évoluent.

## Fonctionnalités

| | |
|---|---|
| 📚 **15 thèmes** | Nombres, politesse, jours et mois, heures, couleurs, saisons et météo, fréquence, famille, nourriture, lieux, vêtements, transports, pays et langues, arts et loisirs, sports |
| 🧭 **Parcours progressif** | 4 nouveaux mots par leçon, révisions régulières, leçon de maîtrise ; les exercices n'utilisent que les mots déjà vus |
| ✍️ **Écriture** | Hiragana, katakana et 50 kanji : QCM, écoute, paires, lecture de mots, tracé guidé puis de mémoire, noté automatiquement |
| 🧩 **Exercices variés** | Choix de l'image, traduction par tuiles, phrases à compléter, saisie en rōmaji (aperçu en kana), nombres générés |
| 🔍 **Aides à la lecture** | Kana et rōmaji sous chaque mot, traduction au survol ; désactivables |
| 🗣️ **Prononciation** | Lecture audio (voix japonaise du système) et reconnaissance vocale du micro |
| 🎮 **Jeux** | Mode infini (3 vies) et contre-la-montre (60 s), records par thème |
| 💾 **Sauvegarde** | Automatique dans le navigateur ; export / import par fichier ou code ; synchronisation optionnelle via un Gist GitHub privé |

## Utilisation

Aucune installation : Kotoba est un site statique (HTML, CSS, JavaScript, sans dépendance ni étape de build).

- **En ligne** : via GitHub Pages, à l'adresse du dépôt.
- **En local** : servir le dossier, par exemple `python3 -m http.server`, puis ouvrir `http://localhost:8000`.

### Navigateurs

| Fonction | Chrome / Edge | Safari | Firefox |
|---|---|---|---|
| Leçons, tracé, jeux, sauvegarde | ✅ | ✅ | ✅ |
| Voix japonaise | ✅ si une voix japonaise est installée | ✅ | ✅ selon le système |
| Reconnaissance vocale (micro) | ✅ (HTTPS requis) | ✅ | ❌ (exercice non noté) |

### Retrouver sa progression sur un autre navigateur

1. **Fichier** : Profil › Sauvegarde › *Télécharger un fichier*, puis *Importer un fichier* ailleurs.
2. **Code** : *Copier un code*, puis le coller et *Restaurer* ailleurs.
3. **Synchronisation GitHub (automatique)** : crée un [jeton GitHub](https://github.com/settings/tokens/new?scopes=gist&description=Kotoba) avec uniquement le droit `gist`, colle-le dans Profil › Synchronisation. La sauvegarde est stockée dans un Gist **privé** de ton compte ; la version la plus récente l'emporte. Le jeton reste sur l'appareil.

## Structure du code

```
index.html            Coquille de l'application (en-tête, vues, navigation)
css/style.css         Styles (thèmes clair et sombre)
js/core/utils.js      Outils : mélange, normalisation, rōmaji vers kana
js/data/themes.js     Vocabulaire et phrases des 15 thèmes
js/data/scripts.js    Tables des hiragana, katakana et kanji
js/core/storage.js    Sauvegarde locale, fichier, code, Gist
js/core/audio.js      Voix, effets sonores, reconnaissance vocale
js/core/visuals.js    Infobulles, aides à la lecture, visuels (horloges, couleurs…)
js/learn/engine.js    Générateurs d'exercices et composition des leçons
js/learn/draw.js      Zone de tracé et notation des caractères
js/ui/lesson.js       Déroulé d'une leçon ou d'un jeu
js/ui/screens.js      Écrans (parcours, thème, caractères, révisions, profil) et routeur
js/app.js             Démarrage
```

### Ajouter un thème

Dans `js/data/themes.js`, ajoute une entrée à `DATA` :

```js
monTheme: { t: "Titre", k: "字", d: "Description courte",
  v: [["écrit", "kana", "rōmaji", "français", "e:🙂"], ...],   // l'ordre fixe la progression (groupes de 4)
  s: [{ fr: "Phrase.", tok: ["mot", "は", ...], ka: "kana séparés", ro: "Rōmaji." }] }
```

Ajoute la traduction des mots-outils absents du vocabulaire dans `TOK`, puis place le thème dans une unité (`UNITS`, dans `js/ui/screens.js`). Visuels possibles : `e:` emoji, `c:#hex` couleur, `n:` nombre, `t:h:mm` horloge, `d:` page de calendrier, `f:0-5` fréquence.

## Feuille de route

Voir [ROADMAP.md](ROADMAP.md) et [CHANGELOG.md](CHANGELOG.md).

## Licence

[GPL-3.0](LICENSE)
