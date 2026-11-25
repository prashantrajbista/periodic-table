import { useState } from 'react'
import { BENCH, pairId, REACTIONS } from './chem/reactions.ts'
import { BY, F, config, credit, ELEMENTS, PHOTO, photo, predicted, type Element } from './elements.tsx'

const RAMP = ['#EEF2F6', '#C3D3E4', '#8FAECE', '#456F9F', '#1D4F8C']
type Key = 'en' | 'ie' | 'mp' | 'radius'
const TRENDS: Record<Key, { label: string; unit: string }> = { en: { label: 'Electronegativity', unit: 'Pauling' }, ie: { label: 'Ionisation energy', unit: 'eV' }, mp: { label: 'Melting point', unit: 'K' }, radius: { label: 'Van der Waals radius', unit: 'pm' } }
const RANGE = Object.fromEntries((Object.keys(TRENDS) as Key[]).map(k => { const v = ELEMENTS.map(e => e[k]).filter((x): x is number => x != null); return [k, [Math.min(...v), Math.max(...v)]] })) as Record<Key, [number, number]>
const isBench = (s: string) => (BENCH as readonly string[]).includes(s)
// Selection and tray survive a visit to another page.
let saved: { sel: string; trend: Key | null; tray: string[] } = { sel: 'Na', trend: null, tray: ['Na', 'Cl'] }

const unit = (v: number | null, u = '') => (v == null ? 'No value' : `${v}${u && ' ' + u}`)
export const facts = (e: Element): [string, string][] => [
  ['Atomic mass', e.mass], ['Configuration', config(e.config)], ['Oxidation states', e.ox || 'No value'], ['State at 298 K', e.state], ['Electronegativity', unit(e.en)],
  ['Ionisation energy', unit(e.ie, 'eV')], ['Electron affinity', unit(e.ea, 'eV')], ['Melting point', unit(e.mp, 'K')], ['Boiling point', unit(e.bp, 'K')], ['Density', unit(e.density, 'g/cm³')], ['Van der Waals radius', unit(e.radius, 'pm')], ['Discovered', e.year],
]

export function TablePage() {
  const [st, set] = useState(saved)
  const up = (p: Partial<typeof saved>) => set(s => (saved = { ...s, ...p }))
  const put = (s: string) => { if (isBench(s) && !(st.tray.length === 1 && st.tray[0] === s)) up({ tray: st.tray.length >= 2 ? [s] : [...st.tray, s], sel: s }) }
  const [over, setOver] = useState(false)
  const e = BY[st.sel], [a, b] = st.tray
  const r = b ? REACTIONS[pairId(a, b)] : undefined
  const note = !a ? 'Drag two elements here, or select one and add it.' : !b ? 'Add a second element.' : r ? r.see.before : [a, b].includes('Ne') ? 'Neon forms no known stable neutral compound.' : 'Not in the library. This does not mean they don’t react.'

  const move = (ev: React.KeyboardEvent, cur: Element) => {
    const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[ev.key]
    if (!d) return
    ev.preventDefault()
    for (let i = 1; i < 18; i++) {
      const n = ELEMENTS.find(x => x.row === cur.row + d[0] * i && x.col === cur.col + d[1] * i)
      if (n) { up({ sel: n.s }); document.getElementById('el-' + n.s)?.focus(); return }
    }
  }
  return (
    <div className="cols">
      <main className="main">
        <div className="bar">
          <div className="seg" role="group" aria-label="Colour the table by">
            <button aria-pressed={!st.trend} onClick={() => up({ trend: null })}>Samples</button>
            {(Object.keys(TRENDS) as Key[]).map(k => <button key={k} aria-pressed={st.trend === k} onClick={() => up({ trend: k })}>{TRENDS[k].label}</button>)}
          </div>
          {st.trend && <div className="legend"><span>{RANGE[st.trend][0]}</span><span aria-hidden="true">{RAMP.map(c => <i key={c} style={{ background: c }} />)}</span><span>{RANGE[st.trend][1]} {TRENDS[st.trend].unit}</span></div>}
        </div>
        <div className="scroll">
          <div className="ptable" role="group" aria-label="Elements. Arrow keys move between them.">
            {ELEMENTS.map(x => {
              let bg = '', ink = ''
              const v = st.trend && x[st.trend]
              if (st.trend) {
                if (v == null) { bg = '#D2D7DB'; ink = '#414B54' }
                else { const [lo, hi] = RANGE[st.trend]; const q = Math.min(4, Math.floor(((v - lo) / (hi - lo)) * 5)); bg = RAMP[q]; ink = q >= 3 ? '#fff' : '' }
              }
              const ph = !st.trend && PHOTO[x.s]
              return (
                <button key={x.s} id={'el-' + x.s} className={'tile' + (ph ? ' photo' : '')} style={{ gridRow: x.row, gridColumn: x.col, background: bg || undefined, color: ink || undefined }} tabIndex={st.sel === x.s ? 0 : -1}
                  aria-pressed={st.sel === x.s} aria-label={`${x.name}, ${x.z}${isBench(x.s) ? ', on the bench' : ''}${st.trend ? `, ${v ?? 'no value'}` : ''}`} draggable={isBench(x.s)}
                  onClick={() => up({ sel: x.s })} onDoubleClick={() => put(x.s)} onKeyDown={k => move(k, x)} onDragStart={d => d.dataTransfer.setData('text/plain', x.s)}>
                  {ph && <img src={photo(x.s)} alt="" draggable={false} />}
                  <span className="z">{x.z}</span><span className="s">{x.s}</span>
                  {isBench(x.s) && <i className="dot" />}
                </button>
              )
            })}
          </div>
        </div>
        <div className="keys"><span><i className="dot" aria-hidden="true" /> On the bench: 14 elements with reactions</span><span>Photographs where the element is visible. Hydrogen, nitrogen and oxygen are colourless, so they have no picture.</span></div>
      </main>
      <aside className="side" aria-label="Bench tray and selected element">
        <section className={'card tray' + (over ? ' over' : '')} aria-label="Bench tray" onDragOver={x => { x.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={x => { x.preventDefault(); setOver(false); put(x.dataTransfer.getData('text/plain')) }}>
          <h2>Bench tray</h2>
          <div className="slots">{[0, 1].map(i => <div key={i} className={'slot' + (st.tray[i] ? ' full' : '')}>{st.tray[i] ?? 'Drop here'}</div>)}</div>
          <div aria-live="polite">{r && <div className="eq"><F t={r.text} /></div>}<div className="muted"><F t={note} /></div></div>
          <div className="row">
            {b && <a className="btn go" href={`#/bench/${a}+${b}`}>Set up on bench</a>}
            {a && <button className="btn text" onClick={() => up({ tray: [] })}>Clear tray</button>}
          </div>
        </section>
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {PHOTO[e.s] && <img className="hero" src={photo(e.s)} alt={PHOTO[e.s][1]} />}
          <div className="pad">
            <div className="name"><span className="sym">{e.s}</span><h1>{e.name}</h1><span className="num">{e.z}</span></div>
            <dl className="kv">{facts(e).filter(f => ['Atomic mass', 'Configuration', 'Oxidation states', 'State at 298 K', 'Electronegativity', 'Ionisation energy', 'Melting point', 'Density'].includes(f[0])).map(([k, v]) => <div key={k}><dt>{k}</dt><dd><F t={v} /></dd></div>)}</dl>
            {predicted(e) && <p className="small">Values for this element are largely predicted, not measured.</p>}
            <div className="row">
              {isBench(e.s) && <button className="btn dark" onClick={() => put(e.s)}>Add to bench</button>}
              <a className="btn line" href={`#/element/${e.s}`}>All properties</a>
            </div>
            {PHOTO[e.s] && <a className="small" href={credit(e.s)}>Photo: images-of-elements.com, CC BY 3.0</a>}
          </div>
        </section>
      </aside>
    </div>
  )
}
