# Interactive 3D periodic table

Live: https://prashantrajbista.github.io/periodic-table/

118 elements, a photoreal bench you drag elements into, and live thermodynamics for 12 element + element cases. University level.

    npm install
    npm run dev      # http://localhost:5173
    npm test         # chemistry checks
    npm run build    # static site in dist/
    npm run data     # rebuild src/data from NASA and PubChem

Design: `docs/superpowers/specs/2026-11-25-interactive-periodic-table-design.md`

Adding a reaction: add a record in `src/chem/reactions.ts`, any new substance in `SUBSTANCES` (`src/chem/thermo.ts`) and
`KEEP` (`scripts/build-data.mjs`), and its atom view in `src/chem/structures.ts`. The tests check balance, range and bounds
for every record.

## Third-party material

- NASA CEA thermodynamic data: Apache 2.0, see `licenses/`
- Element photographs: 98, credited one by one in `src/data/photos.json` and on the Sources page (mostly images-of-elements.com, CC BY 3.0; the rest Wikimedia Commons under CC BY, CC BY-SA, Free Art License or public domain). Elements with only artist's impressions are left without a picture.
- Studio lighting: Poly Haven "Studio Small 09", CC0
- Element properties: PubChem. NCBI places no restrictions of its own on the data; original contributors may hold rights.
