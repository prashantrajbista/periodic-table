import { useState } from 'react'
import { BENCH, REACTIONS } from './chem/reactions.ts'
import { BY, config, Credit, F, PHOTO, photo, stateAt, predicted, type Element } from './elements.tsx'
import { facts, noPhoto } from './TablePage.tsx'
import { GL, SampleStage } from './gl.tsx'

// Subshell filling for boxes: noble-gas cores are expanded so every electron is shown.
const CAP: Record<string, number> = { s: 1, p: 3, d: 5, f: 7 }
function boxes(e: Element): { n: string; cells: string[] }[] {
  let c = e.config.replace(/\(.*\)/, '').trim()
  for (let i = 0; i < 7; i++) { const m = c.match(/^\[(\w+)\]/); if (!m || !BY[m[1]]) break; c = BY[m[1]].config + ' ' + c.slice(m[0].length) }
  return [...c.matchAll(/(\d)([spdf])(\d+)/g)].map(([, n, l, k]) => { const cap = CAP[l], el = +k; return { n: n + l, cells: Array.from({ length: cap }, (_, i) => (i < el - cap ? '↑↓' : i < el ? '↑' : '')) } })
}
// Strongest visible lines (nm), NIST Atomic Spectra Database.
const LINES: Record<string, [number, string][]> = {
  H: [[656.28, '#d8001c'], [486.13, '#00a5d8'], [434.05, '#3a30e0'], [410.17, '#5a12c8']], Na: [[589.0, '#ffc21a'], [589.59, '#ffc21a']],
  Hg: [[435.83, '#3c2ce6'], [546.07, '#58e01e'], [576.96, '#f0d800'], [579.07, '#f4d000']],
  Ne: [[585.25, '#ffcf1a'], [614.31, '#ff8a00'], [640.22, '#ff3a00'], [703.24, '#b00000']],
}

export function ElementPage({ e }: { e: Element }) {
  const bench = (BENCH as readonly string[]).includes(e.s)
  const [view, setView] = useState(PHOTO[e.s] ? 'photo' : '3d')
  const [T, setT] = useState(298)
  const rx = Object.values(REACTIONS).filter(r => r.id.split('+').includes(e.s))
  const bx = boxes(e), outer = bx.slice(-3), top = bx.reduce((m, b) => (b.n[0] > m ? b.n[0] : m), '0')
  const hasState = e.mp != null && e.bp != null && e.bp > e.mp
  const max = hasState ? Math.max(350, Math.ceil((e.bp! * 1.2) / 50) * 50) : 0
  const pc = (v: number) => `${(100 * v) / max}%`
  return (
    <main className="cols elem">
      <div className="main">
        {(PHOTO[e.s] || bench) ? (
          <div className="stage" style={{ height: 620 }}>
            {view === 'photo' && PHOTO[e.s] ? <img className="fill" src={photo(e.s)} alt={PHOTO[e.s].alt} /> : <GL><SampleStage el={e.s} T={298} label={`3D view of ${e.name}`} /></GL>}
            {PHOTO[e.s] && bench && <div className="seg float tl" role="group" aria-label="View"><button aria-pressed={view === 'photo'} onClick={() => setView('photo')}>Photo</button><button aria-pressed={view === '3d'} onClick={() => setView('3d')}>3D</button></div>}
            {PHOTO[e.s]?.kind === 'glow' && view === '3d' && <span className="chip float tr">Colourless gas, {e.name.toLowerCase()}</span>}
            {PHOTO[e.s]?.kind === 'related' && <span className="chip float tr">Not the pure element</span>}
          </div>
        ) : <div className="stage plain" style={{ height: 420 }}><span className="giant">{e.s}</span><p>No photograph: {noPhoto(e)}</p></div>}
        {PHOTO[e.s] && view === 'photo' && <div className="caption"><span className="small">{PHOTO[e.s].alt}.</span><Credit s={e.s} /></div>}
        {view === '3d' && bench && <p className="small">Drag to turn, scroll to zoom. Modelled sample, not to scale.</p>}
      </div>
      <div className="main info">
        <div className="ehead"><span className="giant">{e.s}</span><div><h1>{e.name}</h1><span className="muted">Element {e.z}, {e.group.toLowerCase()}</span></div></div>
        {hasState && (
          <section>
            <div className="between"><h2>State at temperature</h2><span className="tn">{T} K, {stateAt(e, T)}</span></div>
            <label htmlFor="temp" className="muted">Temperature at 1 bar</label>
            <input id="temp" type="range" min={0} max={max} value={T} onChange={x => setT(+x.target.value)} />
            <div className="states" aria-hidden="true"><i style={{ width: pc(e.mp!), background: '#6C7781' }} /><i style={{ width: pc(e.bp! - e.mp!), background: '#A3AEB8' }} /><i style={{ flex: 1, background: '#F6F7F8' }} /></div>
            <div className="between muted small"><span>Solid</span><span>Melts at {e.mp} K</span><span>Boils at {e.bp} K</span></div>
          </section>
        )}
        <section>
          <h2>Properties</h2>
          <dl className="kv two">{facts(e).map(([k, v]) => <div key={k}><dt>{k}</dt><dd><F t={v} /></dd></div>)}</dl>
          {predicted(e) && <p className="small">Values for this element are largely predicted, not measured.</p>}
        </section>
        <section>
          <h2>Electrons</h2>
          <p className="serif" style={{ fontSize: 20, margin: 0 }}><F t={config(e.config)} /></p>
          <div className="orbs">{outer.map(o => <div key={o.n}><div className="boxes">{o.cells.map((c, j) => <span key={j} className={o.n[0] === top ? 'hot' : ''}>{c}</span>)}</div><span className="serif">{o.n}</span></div>)}</div>
          {bx.length > 3 && <p className="small">Last three subshells. The highest shell is marked.</p>}
        </section>
        {LINES[e.s] && (
          <section>
            <h2>Visible emission</h2>
            <svg role="img" aria-label={`Emission lines at ${LINES[e.s].map(l => l[0]).join(', ')} nanometres`} viewBox="0 0 640 54" className="spec">
              <rect width="640" height="34" fill="#101418" />
              {LINES[e.s].map(([nm, c]) => <rect key={nm} x={((nm - 380) / 340) * 640 - 1.5} width="3" height="34" fill={c} />)}
              <g fontSize="14" fill="#414B54"><text x="0" y="51">380 nm</text><text x="640" y="51" textAnchor="end">720 nm</text></g>
            </svg>
            <p className="small">{LINES[e.s].map(l => l[0]).join(', ')} nm. NIST Atomic Spectra Database.</p>
          </section>
        )}
        {rx.length > 0 && (
          <section className="card">
            <h2>In the library</h2>
            <ul className="rxs">{rx.map(r => <li key={r.id}><span className="serif"><F t={r.text} /></span><a className="btn go" href={`#/bench/${r.id}`}>Set up on bench</a></li>)}</ul>
          </section>
        )}
      </div>
    </main>
  )
}
