# Interactive 3D periodic table: design

Audience: university chemistry. Depth: thermodynamics first. Desktop browser first.
Visual design: https://claude.ai/artifact/NcFSHp277pZuLwbCJmpLKx (approved 2026-11-25).

## Scope

- 118 elements with sourced properties and trend colouring.
- 14 bench elements: H N O Ne Na Mg Al S Cl Fe Cu Br I Hg.
- 12 cases, element + element only: NaCl, MgO, AlBr3, H2O, SO2, FeS, NH3, HgO, HI,
  Cu oxides (two steps), NO, and Ne (inert).
- Out: accounts, backend, VR, AI prediction, live quantum simulation, organic chemistry, quizzes.

## Rules

1. Reactions are curated. A pair outside the library says "Not in the library"; it never invents one.
2. Four separate no-result messages: blocked by a barrier, unfavourable, no known compound, not in the library.
3. H, S and G come from NASA CEA polynomials, using the stable phase at T and P. Outside a
   fit's range there is no value; fits are never extrapolated. Each reaction also has its own
   temperature range, because NASA liquid fits run past boiling points.
4. Equilibrium: one reaction extent, ideal gases, pure condensed phases at activity 1. Copper
   runs two extents in sequence.
5. Kinetics gates (heat, spark, catalyst) decide whether a reaction starts. Timing is illustrative.
6. Colourless gases stay colourless. Flame colour comes from an emission wavelength or a
   temperature. Vessel follows pressure: glass near 1 bar, steel above.
7. Atom views use published crystal cells and molecular geometry, and are labelled illustrative.
8. Dragging always has a button alternative. Without WebGL, table and thermodynamics still work.

## Code

- `scripts/build-data.mjs`: pinned NASA file and PubChem to `src/data/*.json`.
- `src/chem/thermo.ts`: species functions, phase choice, reaction functions, equilibrium.
- `src/chem/reactions.ts`: the 12 records. `src/chem/structures.ts`: atom positions.
- `src/bench/`: 3D. `src/*.tsx`: pages, hash routes.
- `npm test` covers balance, reference values, equilibrium limits, ranges, pairs, bond lengths.
