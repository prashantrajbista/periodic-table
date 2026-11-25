import { useState } from 'react'
import { BENCH, pairId, REACTIONS } from './chem/reactions.ts'
import { BY, F, config, credit, ELEMENTS, FAMILIES, PHOTO, photo, predicted, tileMass, type Element } from './elements.tsx'

const RAMP = ['#EEF2F6', '#C3D3E4', '#8FAECE', '#456F9F', '#1D4F8C']
type Key = 'en' | 'ie' | 'mp' | 'radius'
const TRENDS: Record<Key, { label: string; unit: string }> = { en: { label: 'Electronegativity', unit: 'Pauling' }, ie: { label: 'Ionisation energy', unit: 'eV' }, mp: { label: 'Melting point', unit: 'K' }, radius: { label: 'Van der Waals radius', unit: 'pm' } }
const RANGE = Object.fromEntries((Object.keys(TRENDS) as Key[]).map(k => { const v = ELEMENTS.map(e => e[k]).filter((x): x is number => x != null); return [k, [Math.min(...v), Math.max(...v)]] })) as Record<Key, [number, number]>
const isBench = (s: string) => (BENCH as readonly string[]).includes(s)
// Selection and tray survive a visit to another page.
type View = 'standard' | 'families' | 'samples' | Key
let saved: { sel: string; view: View; family: string | null; tray: string[] } = { sel: 'Na', view: 'families', family: null, tray: ['Na', 'Cl'] }
const PANEL = 'panel-hidden'
const readPanel = () => { try { return localStorage.getItem(PANEL) !== '1' } catch { return true } }

const unit = (v: number | null, u = '') => (v == null ? 'No value' : `${v}${u && ' ' + u}`)
export const facts = (e: Element): [string, string][] => [
  ['Atomic mass', e.mass], ['Configuration', config(e.config)], ['Oxidation states', e.ox || 'No value'], ['State at 298 K', e.state], ['Electronegativity', unit(e.en)],
  ['Ionisation energy', unit(e.ie, 'eV')], ['Electron affinity', unit(e.ea, 'eV')], ['Melting point', unit(e.mp, 'K')], ['Boiling point', unit(e.bp, 'K')], ['Density', unit(e.density, 'g/cm³')], ['Van der Waals radius', unit(e.radius, 'pm')], ['Discovered', e.year],
]

const COUNT = Object.fromEntries(Object.keys(FAMILIES).map(k => [k, ELEMENTS.filter(e => e.group === k).length]))

export function TablePage() {
  const [st, set] = useState(saved)
  const up = (p: Partial<typeof saved>) => set(s => (saved = { ...s, ...p }))
  const put = (s: string) => { if (isBench(s) && !(st.tray.length === 1 && st.tray[0] === s)) up({ tray: st.tray.length >= 2 ? [s] : [...st.tray, s], sel: s }) }
  const [over, setOver] = useState(false)
  const [panel, setPanel] = useState(readPanel)
  const togglePanel = () => setPanel(p => { try { localStorage.setItem(PANEL, p ? '1' : '0') } catch { /* private window: keep it for this visit */ } return !p })
  const trend = st.view in TRENDS ? (st.view as Key) : null
  const plain = st.view === 'standard' || st.view === 'families'
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
          <div className="seg" role="group" aria-label="Table view">
            {([['standard', 'Standard'], ['families', 'Families'], ['samples', 'Samples']] as [View, string][]).map(([k, t]) => <button key={k} aria-pressed={st.view === k} onClick={() => up({ view: k, family: null })}>{t}</button>)}
            {(Object.keys(TRENDS) as Key[]).map(k => <button key={k} aria-pressed={st.view === k} onClick={() => up({ view: k, family: null })}>{TRENDS[k].label}</button>)}
          </div>
          <button className="btn line panelbtn" aria-expanded={panel} aria-controls="side-panel" onClick={togglePanel}>{panel ? 'Hide panel' : 'Show panel'}</button>
        </div>
        {st.view === 'families' && (
          <div className="fams" role="group" aria-label="Highlight a family">
            {Object.entries(FAMILIES).map(([k, f]) => <button key={k} aria-pressed={st.family === k} onClick={() => up({ family: st.family === k ? null : k })}><i style={{ background: f.color }} />{f.plural}<span>{COUNT[k]}</span></button>)}
          </div>
        )}
        {trend && <div className="legend"><span>{RANGE[trend][0]}</span><span aria-hidden="true">{RAMP.map(c => <i key={c} style={{ background: c }} />)}</span><span>{RANGE[trend][1]} {TRENDS[trend].unit}</span></div>}
        <div className="scroll">
          <div className="ptable" role="group" aria-label="Elements. Arrow keys move between them.">
            {Array.from({ length: 18 }, (_, i) => <span key={'g' + i} className="gp" style={{ gridRow: 1, gridColumn: i + 2 }}><span className="sr">Group </span>{i + 1}</span>)}
            {Array.from({ length: 7 }, (_, i) => <span key={'p' + i} className="gp" style={{ gridRow: i + 2, gridColumn: 1 }}><span className="sr">Period </span>{i + 1}</span>)}
            {[['Lanthanide', '57–71', 7, 10], ['Actinide', '89–103', 8, 11]].map(([k, range, row, frow]) => {
              const f = FAMILIES[k as string], style = { background: st.view === 'families' ? f.color : undefined, opacity: st.family && st.family !== k ? 0.3 : 1 }
              return [
                <span key={k + 'a'} className="slotref" style={{ ...style, gridRow: row as number, gridColumn: 4 }}>{range}</span>,
                <span key={k + 'b'} className="rowname" style={{ gridRow: frow as number, gridColumn: '2 / 5', opacity: style.opacity }}>{f.plural}</span>,
              ]
            })}
            {ELEMENTS.map(x => {
              let bg = st.view === 'families' ? FAMILIES[x.group].color : '', ink = ''
              const v = trend && x[trend]
              if (trend) {
                if (v == null) { bg = '#D2D7DB'; ink = '#414B54' }
                else { const [lo, hi] = RANGE[trend]; const q = Math.min(4, Math.floor(((v - lo) / (hi - lo)) * 5)); bg = RAMP[q]; ink = q >= 3 ? '#fff' : '' }
              }
              const ph = st.view === 'samples' && PHOTO[x.s]
              return (
                <button key={x.s} id={'el-' + x.s} className={'tile' + (ph ? ' photo' : '') + (plain ? ' plain' : '') + (st.family && st.family !== x.group ? ' dim' : '')} style={{ gridRow: x.row + 1, gridColumn: x.col + 1, background: bg || undefined, color: ink || undefined }} tabIndex={st.sel === x.s ? 0 : -1}
                  aria-pressed={st.sel === x.s} aria-label={`${x.name}, ${x.z}, ${x.group.toLowerCase()}${isBench(x.s) ? ', on the bench' : ''}${trend ? `, ${v ?? 'no value'}` : ''}`} draggable={panel && isBench(x.s)}
                  onClick={() => up({ sel: x.s })} onDoubleClick={() => put(x.s)} onKeyDown={k => move(k, x)} onDragStart={d => d.dataTransfer.setData('text/plain', x.s)}>
                  {ph && <img src={photo(x.s)} alt="" draggable={false} />}
                  <span className="z">{x.z}</span><span className="s">{x.s}</span>
                  {plain && <><span className={'n' + (x.name.length > 9 ? ' long' : '')}>{x.name}</span><span className="m">{tileMass(x)}</span></>}
                  {isBench(x.s) && <i className="dot" />}
                </button>
              )
            })}
          </div>
        </div>
        {!panel && <div className="picked"><strong>{e.name}</strong><span>{e.z}</span><span>{e.group}</span><a href={`#/element/${e.s}`}>All properties</a><span className="muted">Show the panel to use the bench tray.</span></div>}
        <div className="keys"><span><i className="dot" aria-hidden="true" /> On the bench: 14 elements with reactions</span>{st.view === 'samples' && <span>Photographs of the visible bench elements. Hydrogen, nitrogen and oxygen are colourless, so they have no picture.</span>}{plain && <span>Mass in square brackets: no standard atomic weight, so an isotope’s mass number is shown.</span>}{st.view === 'families' && <span>Families follow PubChem. Borderline cases differ between tables, and the heaviest elements are predicted.</span>}</div>
      </main>
      {panel && <aside className="side" id="side-panel" aria-label="Bench tray and selected element">
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
            <div className="fam"><i style={{ background: FAMILIES[e.group].color }} />{e.group}</div>
            <dl className="kv">{facts(e).filter(f => ['Atomic mass', 'Configuration', 'Oxidation states', 'State at 298 K', 'Electronegativity', 'Ionisation energy', 'Melting point', 'Density'].includes(f[0])).map(([k, v]) => <div key={k}><dt>{k}</dt><dd><F t={v} /></dd></div>)}</dl>
            {predicted(e) && <p className="small">Values for this element are largely predicted, not measured.</p>}
            <div className="row">
              {isBench(e.s) && <button className="btn dark" onClick={() => put(e.s)}>Add to bench</button>}
              <a className="btn line" href={`#/element/${e.s}`}>All properties</a>
            </div>
            {PHOTO[e.s] && <a className="small" href={credit(e.s)}>Photo: images-of-elements.com, CC BY 3.0</a>}
          </div>
        </section>
      </aside>}
    </div>
  )
}
