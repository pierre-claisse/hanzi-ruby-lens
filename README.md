# hanzi-ruby-lens

Application desktop Windows pour lire des textes chinois (simplifié ou
traditionnel) avec annotations pinyin en *ruby*. Le découpage en mots et l'attribution du pinyin sont effectués
hors-ligne par des bibliothèques Rust natives. Les données sont stockées
localement en SQLite ; un mécanisme de synchronisation optionnel via un Gist
GitHub privé permet de partager la bibliothèque entre deux machines.

## Technologies

- **Frontend** : TypeScript, React 19, Vite 8, Tailwind CSS 3.
- **Backend** : Rust (stable), Tauri 2.
- **Base de données** : SQLite (rusqlite, fichier dans
  `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`).
- **Traitement du chinois** : `jieba-rs`, `chinese_dictionary`, `pinyin`.
- **Tests** : Vitest + Testing Library (frontend), `cargo test` (Rust).

## Prérequis

- Node.js et npm.
- Toolchain Rust (via [rustup](https://rustup.rs/)).

## Commandes

```sh
npm install              # installation initiale des dépendances Node
npm test                 # vite build + Vitest + cargo test
npm run build            # build release : .exe et installeur NSIS
cd src-tauri && cargo test
cd src-tauri && cargo clippy
```

L'exécutable et l'installeur sont produits dans
`src-tauri/target/release/` et `src-tauri/target/release/bundle/nsis/`.

## Variables d'environnement de build

Quatre variables — toutes optionnelles — modifient le comportement du binaire
produit. Elles sont lues *au moment de `npm run build`* et ne sont pas
persistées dans le dépôt.

| Variable | Effet quand définie |
|---|---|
| `AUTHORIZED_MACHINE_ID` | Identifie une machine « propriétaire ». Sur les autres machines, les actions destructrices locales (Delete, Export, Import, Reset) sont masquées. Comparée à `machine_uid::get()` au runtime. |
| `SYNC_PASSWORD` | Mot de passe partagé hors-bande. Sert à chiffrer/déchiffrer le PAT et l'ID du Gist au build (Argon2id + AES-256-GCM). Demandé à l'utilisateur à chaque Save / Pull. |
| `SYNC_PAT` | Personal Access Token GitHub (scope `gist`) utilisé pour lire/écrire le Gist. Chiffré dans le binaire. |
| `SYNC_GIST_ID` | Identifiant du Gist secret utilisé comme support de synchronisation. Chiffré dans le binaire. |

Sans `SYNC_*`, la fonctionnalité de synchronisation est désactivée et les
contrôles correspondants sont masqués dans l'interface. Sans
`AUTHORIZED_MACHINE_ID`, aucune machine n'est considérée comme autorisée.

Exemple PowerShell :

```powershell
$env:AUTHORIZED_MACHINE_ID = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Cryptography').MachineGuid
$env:SYNC_PASSWORD = "..."
$env:SYNC_PAT      = "..."
$env:SYNC_GIST_ID  = "..."
npm run build
```

## Fonctionnalités principales

- Saisie d'un texte chinois ; segmentation et annotation pinyin automatiques.
- Bibliothèque multi-textes avec tags, tri, filtres, dates de création et de
  modification.
- Correction inline du pinyin et de la segmentation (split / merge de mots).
- Commentaires par mot, affichés dans un panneau latéral.
- Verrou par texte pour bloquer les corrections accidentelles.
- 6 palettes de couleurs avec polices CJK dédiées, modes clair / sombre,
  zoom et plein écran.
- Export / Import JSON local et reset complet, restreints à la machine
  autorisée.
- Synchronisation Save / Pull à deux utilisateurs via un Gist GitHub
  chiffré, avec détection de conflit applicative (la chronologie du dernier
  sync est comparée avant chaque écriture).

## Stockage des données

- Base SQLite : `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`.
- Préférences UI (thème, palette, zoom, tri, dirty flag, dernier sync,
  nom d'utilisateur) : `localStorage` du WebView2.
- Aucune donnée transmise à un service distant en dehors de l'API GitHub
  Gists lorsque la synchronisation est utilisée.

## Structure du dépôt

```text
src/                React + TypeScript : vues, composants, hooks, utils.
src-tauri/          Rust + Tauri 2 : commandes IPC, accès SQLite,
                    traitement du chinois, synchronisation HTTP.
scripts/            Scripts utilitaires (génération d'icônes…).
tests/              Tests d'intégration et de contrat (Vitest).
```

## Licence

Projet privé.
