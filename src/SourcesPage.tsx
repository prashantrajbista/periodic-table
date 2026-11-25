import { BY, PHOTO, thumb } from './elements.tsx'
export const SourcesPage = () => (
  <main className="cols">
    <div className="main">
      <h1>Sources</h1>
      <dl className="src">
        <dt>Reaction thermodynamics</dt><dd><a href="https://github.com/nasa/cea">NASA CEA thermodynamic database</a>, Apache 2.0</dd>
        <dt>Element properties</dt><dd><a href="https://pubchem.ncbi.nlm.nih.gov/periodic-table/">PubChem periodic table</a>. <a href="https://www.ncbi.nlm.nih.gov/home/about/policies/">NCBI</a> places no restrictions of its own on the data; original contributors may hold rights.</dd>
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
    <div className="main" style={{ flexBasis: '100%' }}>
      <h2>Element photographs</h2>
      <p>{Object.keys(PHOTO).length} photographs, each under its own licence. All are resized, and some are cropped to fit. Resized copies of share-alike pictures stay under the same licence.</p>
      <div className="photos">{Object.keys(PHOTO).map(s => <div key={s}><img src={thumb(s)} alt="" loading="lazy" /><strong>{BY[s].name}</strong><span className="small"><a href={PHOTO[s].page}>{PHOTO[s].by}</a>, {PHOTO[s].licUrl ? <a href={PHOTO[s].licUrl}>{PHOTO[s].lic}</a> : PHOTO[s].lic}</span></div>)}</div>
    </div>
  </main>
)
