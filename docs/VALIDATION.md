# Validation record

Checked 2026-11-09.

## Passed

- `npm test`: **36 tests passed**, zero failures. Node.js 24.22.1 runs TypeScript core tests without external packages.
- `npm run test:three`: **2 integration tests passed**, zero failures, against the actual Three.js r180 module/core runtime retrieved from its upstream GitHub repository into temporary, untracked test dependencies.
- Every supported base move is a bijection, has order four, cancels with its inverse, preserves import legality and agrees with quaternion endpoints. Quarter, inverse and half-turn endpoints are covered.
- R direction convention is independently checked against expected face colors; six repetitions of the standard R U R' U' sequence return identity.
- 1,500 deterministic mixed legal moves preserve legality and cubie-codec round trips; reversing the entire sequence solves the cube.
- Invalid single edge flips, single corner twists, odd edge swaps, center reflections and malformed color counts are rejected.
- All 216 OLL orientation states yield 58 canonical classes including oriented; all 288 PLL states yield 22 classes including solved/AUF.
- Every starter catalog recommendation is simulated to verify its postcondition, with U setups and rotated side frames tested.
- Atomic move commitment, frame partition independence, pause/resume/step/seek, speed changes, split times and wall-clock freeze behavior are checked.
- Actual Three.js Quaternion/Vector3 operations agree with the integer model and world-space premultiplication convention.

## Not completed in this environment

- `npm install`: blocked by the network policy; registry.npmjs.org returned HTTP 403.
- `npm run build`: attempted, but `tsc` is unavailable because dependency installation failed. Full TypeScript type checking and Vite production bundling have **not** been verified.
- Browser/WebGL visual check: attempted using installed Playwright, but no Chromium executable is installed. Real browser rendering, interaction, layout and accessibility have **not** been verified.
- The user created the repository after initial validation; project publication proceeds through the connected GitHub tools.

The included CI workflow performs dependency installation, both test suites and the production build when run on GitHub. This record does not claim that CI has run. Complete the browser checks below on a machine with the dependencies and a browser before treating this prototype as release-ready.

## Browser acceptance checks

1. `npm install && npm run build && npm run dev`.
2. Open the displayed local URL; verify a colored 3D cube, orbit/zoom controls and no console errors.
3. Play Sune and T permutation; confirm correct animated direction, solved final state, and zero-time precompleted phases.
4. Pause midway through a turn, wait, resume; ensure no jump or extra split time.
5. Step, go back and reset, including during a partial turn; confirm exact states and rebuilt timing.
6. Adjust duration during playback, then test wide, middle-slice and half turns.
7. Enter an invalid token; confirm an inline error and an intact current session.
8. Scramble and play its inverse; confirm solved. This inverse is not a CFOP-generated solution.
9. Check 390px mobile and 1440px desktop widths for readable controls, keyboard focus and no horizontal overflow.
10. Hide the tab during playback; confirm it pauses and does not catch up invisibly.
