# Casse-code

Mastermind jouable dans le navigateur. Un code de couleurs est caché. Chaque essai dit ce qui est juste, jamais quelle case.

**Jouer :** [pierreg78-maker.github.io/casse_code](https://pierreg78-maker.github.io/casse_code/)

## Règles

- **Pion sombre** — bonne couleur, bonne place
- **Pion clair** — bonne couleur, mauvaise place

L’ordre de ces pions ne correspond pas aux cases. Les chiffres gravés sur les couleurs permettent de jouer sans se fier seulement à la teinte.

## Niveaux

| Niveau | Plateau |
| --- | --- |
| Initiation | 4 cases, 4 couleurs, sans doublon, 8 essais |
| Classique | 4 cases, 6 couleurs, doublons possibles, 10 essais |
| Expert | 5 cases, 8 couleurs, doublons possibles, 12 essais |

Au clavier : touches `1` à `8` pour poser une couleur, Entrée pour valider. Les records et la série restent dans le navigateur.

La page jouable est [`docs/index.html`](docs/index.html). Le code source de l’application se trouve dans `src/`.
