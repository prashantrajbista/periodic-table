import { BY, credit, PHOTO, photo } from './elements.tsx'
export const SourcesPage = () => (
  <main className="cols">
    <div className="main">
      <h1>Sources</h1>
      <dl className="src">
        <dt>Reaction thermodynamics</dt><dd><a href="https://github.com/nasa/cea">NASA CEA thermodynamic database</a>, Apache 2.0</dd>
        <dt>Element properties</dt><dd><a href="https://pubchem.ncbi.nlm.nih.gov/periodic-table/">PubChem periodic table</a>. Reuse terms to be confirmed before public release.</dd>
        <dt>Emission lines</dt><dd><a href="https://www.nist.gov/pml/atomic-spectra-database">NIST Atomic Spectra Database</a>, wavelengths only</dd>
        <dt>Crystal cells and molecules</dt><dd>Published unit cells and gas-phase geometries; radii are metallic, Shannon ionic or van der Waals as captioned</dd>
        <dt>Studio lighting</dt><dd><a href="https://polyhaven.com/a/studio_small_09">Poly Haven, Studio Small 09</a>, CC0</dd>
      </dl>
      <h2>What is calculated and what is not</h2>
      <ul className="plain">
        <li>ΔH°, ΔS°, ΔG°, K and equilibrium amounts are calculated from NASA data at your temperature and pressure.</li>
        <li>Gases are treated as ideal, and pure solids and liquids have activity 1. Side reactions and vapour over liquids are ignored.</li>
        <li>Burn speed, start temperatures and atom views are illustrative.</li>
        <li>Flame colours follow an emission wavelength or a glowing temperature. Shapes of flame and smoke are modelled for looks.</li>
      </ul>
    </div>
    <div className="main">
      <h2>Element photographs</h2>
      <p>From <a href="https://images-of-elements.com/">images-of-elements.com</a> under <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Resized.</p>
      <div className="photos">{Object.keys(PHOTO).map(s => <a key={s} href={credit(s)}><img src={photo(s)} alt="" /><span>{BY[s].name}</span></a>)}</div>
    </div>
  </main>
)
