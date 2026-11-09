# 3D Rubik's Cube Trainer

An architecture-first TypeScript + Three.js CFOP trainer. Exact cube mathematics is independent of WebGL. The demo offers orbit controls, six teaching algorithms, inverse-algorithm practice states, training scrambles, step/play/pause/back/reset, adjustable duration, a CFOP inspector and playback splits.

Read **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the mathematical model, slice quaternion derivation, OLL/PLL matching and controller contracts.

## Run

Node.js 24 or newer is required (the test runner uses native TypeScript stripping).

```sh
npm install
npm test
npm run test:three
npm run build
npm run dev
```

The core tests have no installed dependencies and can run immediately with `npm test`. The app and Three.js integration tests require dependencies. Versions are pinned in package.json; generate and commit a package-lock.json after a successful installation. CI uses npm install until that lockfile exists.

## Capabilities and boundaries

- 54 exact facelets; legal face, slice, wide and whole-cube moves. Imported states are checked for color counts, center frame, piece uniqueness, corner twist, edge flip and permutation parity.
- Cube → cubie-coordinate conversion (`cp`, `co`, `ep`, `eo`) and back.
- Center-relative D cross and four F2L slots, including pair locations and adjacency/alignment.
- Full canonical OLL/PLL signatures. Exhaustive tests find **57 non-solved OLL classes** and **21 non-solved PLL classes**. Signatures are structural identifiers, **not standard OLL numbers or PLL names**.
- Six verified algorithm entries: Sune, Anti-Sune, an edge-line orientation case, T, Ua and Ub. A case outside this catalog still has a signature but no named recommendation. The line algorithm fixture is one full OLL case; it is not promised to solve every case with line-shaped edges.
- Quaternion interpolation is presentation only. Logical moves commit once at animation boundaries.
- Playback splits use active animation time. `SolveTimer` separately measures human wall-clock time including thinking time; that clock is an API, not wired to the demo UI.
- Training scrambles use random moves, not uniform random-state competition scrambles. Replaying their inverse is not a CFOP solver.
- No exhaustive F2L case catalog, automatic CFOP solver, standard 57/21 named algorithm database, persistence, undo tree, touch sticker picking, or official timing/inspection workflow yet.

## Notation

Space-separated tokens: `U D R L F B M E S`, `Rw Lw Uw Dw Fw Bw`, `x y z`; append `'` or `2`. For example:

```text
R U R' U R U2 R'
```

Parenthesized repetition, lowercase wide-turn aliases and concatenated tokens are intentionally rejected. “Prepare case” sets the cube to the inverse of the input sequence, so playing it returns to solved. It does not apply the sequence to an arbitrary existing scramble.

White is initially U and yellow D. Recognition uses the **current center frame**; x/z rotations can change the chosen cross color. Camera orbiting never changes the mathematical cube.

## Source map

| File | Responsibility |
|---|---|
| `src/cube.ts` | Permutation model, notation, cubie codec, legality |
| `src/quaternion.ts` | Signed axis-angle interpolation |
| `src/cfop.ts` | Stage predicates, signatures, catalog matching |
| `src/playback.ts` | Atomic commits, play/pause/step/seek, active-time splits |
| `src/solve-timer.ts` | Monotonic human solve clock |
| `src/view.ts` | Three.js scene and reconstruction from committed state |
| `src/main.ts` | Demo composition and controls |
| `tests/` | Algebra, exhaustive case classification, timing, Three.js integration |

## Validation in the authoring environment

See [docs/VALIDATION.md](docs/VALIDATION.md) for exactly what ran and what remains unverified. The GitHub Actions workflow runs core tests, Three.js integration tests, type checking and the Vite build once pushed.

## Repository

Published to https://github.com/jacobparkk/3D-Rubiks-Cube-Trainer.

See the validation record for the checks completed before publication. GitHub Actions runs the full checks after pushing.
