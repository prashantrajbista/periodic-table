import { useEffect, useMemo, useRef, useState } from 'react'
import { reaction } from './chem/thermo.ts'
import { atoms, BENCH, conversion, outcome, pairId, REACTIONS, run, sub, type Look, type Outcome } from './chem/reactions.ts'
import { build } from './chem/structures.ts'
import { BY, F, PHOTO, photo, pretty, signed, sup } from './elements.tsx'
import { Atoms, GL, Stage } from './gl.tsx'
import { ConversionChart, GibbsChart, Profile } from './Charts.tsx'

const molar = (f: string) => Object.entries(atoms(f)).reduce((t, [e, n]) => t + parseFloat(BY[e].mass) * n, 0)
const isGas = (f: string) => ['H2', 'N2', 'O2', 'Cl2', 'Ne'].includes(f)
const mmol = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)} mol` : `${v < 10 ? v.toFixed(2) : v.toFixed(1)} mmol`)
const kText = (lnK: number) => { const l = lnK / Math.LN10, e = Math.floor(l); return Math.abs(l) < 3 ? Math.exp(lnK).toPrecision(3) : `${(10 ** (l - e)).toFixed(1)} × 10${sup(e)}` }
const DEFAULT: Look = { vessel: 'jar' }
const TITLE: Partial<Record<Outcome, string>> = { blocked: 'Blocked by a barrier', unfavourable: 'Unfavourable at these conditions', inert: 'No known compound', unlisted: 'Not in the library' }

export function BenchPage({ start }: { start: string[] }) {
  const [jar, setJar] = useState(start)
  const r = jar.length === 2 ? REACTIONS[pairId(jar[0], jar[1])] : undefined
  const init = r ? { ...r.start } : { T: 300, P: 1 }
  const [T, setT] = useState(init.T), [P, setP] = useState(init.P)
  const [amounts, setAmounts] = useState<Record<string, number>>(r?.amounts ?? {})
  const [started, setStarted] = useState(false), [catalyst, setCatalyst] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'active' | 'done'>('idle')
  const [view, setView] = useState<'bench' | 'atoms'>('bench')
  const [over, setOver] = useState(false)
  // Composition only changes while the reaction can proceed; cooling freezes it.
  const frozen = useRef<Record<string, number> | null>(null)

  const load = (next: string[]) => {
    const q = next.length === 2 ? REACTIONS[pairId(next[0], next[1])] : undefined
    frozen.current = null
    setJar(next); setStarted(false); setCatalyst(false); setPhase('idle'); setView('bench')
    setT(q?.start.T ?? 300); setP(q?.start.P ?? 1); setAmounts(q?.amounts ?? {})
    history.replaceState(null, '', '#/bench' + (next.length ? '/' + next.join('+') : ''))
  }
  const add = (s: string) => { if (!(BENCH as readonly string[]).includes(s) || jar.includes(s)) return; load(jar.length >= 2 ? [s] : [...jar, s]) }

  const out = outcome(jar, { T, P, started, catalyst }, amounts)
  const th = r ? reaction(r.eq, T, P) : null
  const eqm = useMemo(() => (r ? run(r, amounts, T, P) : null), [r, amounts, T, P])
  if (eqm && (out === 'reacts' || out === 'unfavourable')) frozen.current = eqm
  const now = frozen.current ?? amounts
  const reacted = phase !== 'idle'

  useEffect(() => { if (out === 'reacts' && phase === 'idle') setPhase('active') }, [out, phase])
  useEffect(() => { if (phase !== 'active') return; const t = setTimeout(() => setPhase('done'), r?.look.light ? 6000 : 2500); return () => clearTimeout(t) }, [phase, r])

  const left: Record<string, number> = {}, made: Record<string, number> = {}
  if (r && reacted) {
    for (const e of jar) { const s = sub(e); left[e] = amounts[s] ? Math.min(1, (now[s] ?? 0) / amounts[s]) : 1 }
    const all = { ...r.eq, ...r.then }
    for (const s in all) {
      if (s in amounts || !(all[s] > 0 || s === 'Cu2O')) continue
      const metal = jar.find(e => atoms(s)[e] && !isGas(sub(e))) ?? jar[0]
      const full = Math.max(amounts[sub(metal)] * (atoms(sub(metal))[metal] ?? 1), 1e-9)
      made[s] = Math.min(1, ((now[s] ?? 0) * (atoms(s)[metal] ?? 0)) / full)
    }
  }
  const isDone = phase === 'done'
  const after = r ? (r.id === 'Cu+O' && (now.Cu2O ?? 0) * 2 > (now.CuO ?? 0) ? ['Cu2O'] : r.cells.after) : []
  const limiting = (() => {
    if (!r) return ''
    const total: Record<string, number> = {}
    if (r.then) { total.Cu = -2; total.O2 = -1 } else Object.assign(total, r.eq)
    const q = Object.keys(total).filter(k => total[k] < 0).map(k => [k, (amounts[k] ?? 0) / -total[k]] as const)
    return Math.abs(q[0][1] - q[1][1]) < 1e-9 ? 'Neither, exact ratio' : pretty(q[0][1] < q[1][1] ? q[0][0] : q[1][0])
  })()
  // Heat from the moles that actually changed, step by step.
  const heat = (() => {
    if (!r || !eqm || !th) return 0
    if (!r.then) { const k = Object.keys(r.eq).find(s => r.eq[s] < 0)!; return (((amounts[k] ?? 0) - eqm[k]) / -r.eq[k]) * -th.H / 1000 }
    const h2 = reaction(r.then, T, P)!, x2 = eqm.CuO / 4, x1 = ((amounts.Cu ?? 0) - eqm.Cu) / 4
    return (-x1 * th.H - x2 * h2.H) / 1000
  })()

  const noAmount = !!r && Object.keys(r.amounts).some(k => !(amounts[k] > 0))
  const message = (): string => {
    if (out === 'empty') return 'Empty vessel. Add two elements.'
    if (out === 'one') return `${BY[jar[0]].name} is in. Add a second element.`
    if (out === 'inert') return 'Neon forms no known stable neutral compound. Nothing happens.'
    if (out === 'unlisted') return 'No checked data for this pair. This does not mean they don’t react.'
    if (!r) return ''
    if (reacted && out === 'blocked') return 'Too cold to change further, so the mixture stays as it is.'
    if (reacted && out === 'unfavourable') return 'Conditions now favour the reactants, so the product has broken down.'
    if (noAmount) return 'Set an amount above zero for both elements.'
    if (out === 'blocked') return r.gate.why + (r.gate.minT && T < r.gate.minT ? ` It needs about ${r.gate.minT} K.` : '') + (r.gate.catalyst && !catalyst ? ` Add ${r.gate.catalyst.toLowerCase()}.` : '')
    if (out === 'unfavourable') return 'Free to react, but the equilibrium lies almost entirely with the reactants. A catalyst can’t change that.'
    if (phase === 'active') return r.see.during
    if (phase === 'done') return r.see.after
    return r.see.before
  }
  const canGo = !!r && out !== 'reacts' && !started && !noAmount
  const struct = useMemo(() => (r && view === 'atoms' ? build(isDone ? after : r.cells.before).note : ''), [r, view, isDone, after.join()])
  const look = r?.look ?? (jar.length && jar.every(e => ['Na', 'Mg', 'Al', 'S', 'Fe', 'Cu'].includes(e)) ? ({ vessel: 'crucible' } as Look) : jar.some(e => ['Na', 'Mg', 'Al', 'S', 'Cu', 'Fe'].includes(e)) ? ({ vessel: 'jar', spoon: !jar.includes('Cu') } as Look) : DEFAULT)
  const chips = r && phase === 'done' ? Object.keys(now).filter(k => now[k] > 1e-3 * Math.max(...Object.values(amounts))).map(k => pretty(k)) : jar.map(e => pretty(sub(e)))
  const uphill = !!th && th.H > 0
  const showProfile = (out === 'blocked' && !reacted) || (out === 'unfavourable' && uphill)

  return (
    <main className="cols bench">
      <div className="main">
        <div className={'stage' + (over ? ' over' : '')} style={{ height: 620 }} onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); add(e.dataTransfer.getData('text/plain')) }}>
          <GL>{view === 'atoms' && r ? <Atoms before={r.cells.before} after={after} done={isDone && out !== 'unfavourable'} label={`Illustrative atom view: ${(isDone ? after : r.cells.before).join(', ')}`} /> : <Stage key={look.vessel} jar={jar} look={look} active={phase === 'active'} left={left} made={made} T={T} P={P} label={`3D bench. ${message()}`} />}</GL>
          {r && <div className="seg float tl" role="group" aria-label="View"><button aria-pressed={view === 'bench'} onClick={() => setView('bench')}>Bench</button><button aria-pressed={view === 'atoms'} onClick={() => setView('atoms')}>Atoms</button></div>}
          <div className="float tr chips">{chips.map(c => <span key={c} className="chip serif"><F t={c} /></span>)}</div>
          <div className="float bot">
            <span className="chip note" aria-live="polite">{TITLE[out] && !reacted && <strong>{TITLE[out]}. </strong>}<F t={message()} /></span>
            <span className="row">
              {r?.gate.catalyst && <button className="btn line paper" aria-pressed={catalyst} onClick={() => setCatalyst(c => !c)}>{r.gate.catalyst} catalyst {catalyst ? 'in' : 'out'}</button>}
              {canGo && <button className="btn go big" onClick={() => setStarted(true)}>{r!.gate.label}</button>}
              {jar.length > 0 && !canGo && <button className="btn dark big" onClick={() => load([])}>Empty the vessel</button>}
            </span>
          </div>
        </div>
        <section className="card dock" aria-label="Elements for the bench">
          <div className="between"><h2>Drag into the vessel</h2><span className="muted small">Or press an element to add it</span></div>
          <div className="dockgrid">
            {BENCH.map(s => (
              <button key={s} className={'tile' + (PHOTO[s] ? ' photo' : '')} draggable aria-label={`Add ${BY[s].name}`} aria-pressed={jar.includes(s)} onClick={() => add(s)} onDragStart={e => e.dataTransfer.setData('text/plain', s)}>
                {PHOTO[s] && <img src={photo(s)} alt="" draggable={false} />}<span className="s">{s}</span>
              </button>
            ))}
          </div>
        </section>
        <p className="small">{view === 'atoms' && r ? <F t={`Illustrative, and not in reacting ratio. ${struct}.`} /> : 'Drag to turn, scroll to zoom. Burn speed is illustrative.'}</p>
      </div>

      <div className="main info">
        {r ? (
          <>
            <div><h1 className="serif eqn"><F t={r.text} /></h1>{r.thenText && <div className="serif eqn2">then <F t={r.thenText} /></div>}<p className="muted"><F t={r.ox} /></p></div>
            <section className="card">
              <label className="between big" htmlFor="t"><span>Temperature</span><span className="tn">{T} K</span></label>
              <input id="t" type="range" min={r.T[0]} max={r.T[1]} value={T} onChange={e => setT(+e.target.value)} />
              {r.P[1] > r.P[0] && <><label className="between big" htmlFor="p"><span>{r.id === 'Cu+O' ? 'Oxygen pressure' : 'Pressure'}</span><span className="tn">{P} bar</span></label><input id="p" type="range" min={r.P[0]} max={r.P[1]} step={r.P[1] > 10 ? 1 : 0.01} value={P} onChange={e => setP(+e.target.value)} /></>}
              {th ? (
                <dl className="nums">
                  <div><dt>ΔG°</dt><dd className={th.G < 0 ? 'fav' : 'unf'}>{signed(th.G)} kJ</dd></div>
                  <div><dt>ΔH°</dt><dd>{signed(th.H)} kJ</dd></div>
                  <div><dt>ΔS°</dt><dd>{signed(th.S)} J/K</dd></div>
                  <div><dt>K</dt><dd><F t={kText(th.lnK)} /></dd></div>
                </dl>
              ) : <p>No data at this temperature.</p>}
              <GibbsChart r={r} T={T} P={P} />
              <p className="small">kJ per mole of reaction as written. This record covers {r.T[0]} to {r.T[1]} K.</p>
            </section>
            {showProfile && <section className="card"><h2>Why nothing happens</h2><Profile up={uphill} /><p>{message()}</p></section>}
            {r.reversible && !r.then && <section className="card"><h2>Reactant converted at equilibrium</h2><ConversionChart r={r} amounts={amounts} T={T} P={P} /></section>}
            <section>
              <h2>Amounts</h2>
              <div className="amts">{Object.keys(r.amounts).map(k => (
                <div key={k}><label htmlFor={'a-' + k}><F t={pretty(k)} />, mmol</label>
                  <input id={'a-' + k} type="number" min={0} max={r.amounts[k] * 5} step={r.amounts[k] >= 1000 ? 100 : 1} value={amounts[k]} onChange={e => { const v = Math.max(0, Math.min(r.amounts[k] * 5, Number(e.target.value) || 0)); setAmounts(a => ({ ...a, [k]: v })) }} />
                  <span className="small">{isGas(k) ? `${((amounts[k] * 24.79) / 1000).toFixed(2)} L at 298 K, 1 bar` : `${((amounts[k] * molar(k)) / 1000).toFixed(2)} g`}</span></div>
              ))}</div>
              <dl className="kv">
                <div><dt>Limiting reactant</dt><dd><F t={limiting} /></dd></div>
                {eqm && <div><dt>{r.reversible ? 'Converted at equilibrium' : 'Converted'}</dt><dd>{(100 * conversion(r, amounts, eqm)).toFixed(1)} %</dd></div>}
                {eqm && <div><dt>Heat {heat < 0 ? 'absorbed' : 'released'} at {T} K</dt><dd>{Math.abs(heat).toFixed(2)} kJ</dd></div>}
              </dl>
              {eqm && <><h3>{r.reversible ? 'At equilibrium' : 'When finished'}</h3><div className="comp">{Object.keys(eqm).map(k => { const max = Math.max(...Object.values(amounts), ...Object.values(eqm), 1e-9); return <div key={k}><span className="serif"><F t={pretty(k)} /></span><span className="track" aria-hidden="true"><i style={{ width: `${(100 * eqm[k]) / max}%` }} className={k in amounts ? '' : 'prod'} /></span><span className="tn">{mmol(eqm[k])}</span></div> })}</div></>}
            </section>
            <p className="small">NASA CEA data, ideal gas model{P > 50 ? '. Real gases deviate at this pressure' : ''}. {r.hazard} Never try this outside a fume hood with trained supervision.</p>
          </>
        ) : (
          <>
            <div><h1>{jar.length < 2 ? 'Put two elements together' : `${BY[jar[0]].name} and ${BY[jar[1]].name.toLowerCase()}`}</h1><p>{jar.length < 2 ? 'Drag them into the vessel, or pick a reaction below.' : message()}</p>{out === 'inert' && <p>No ΔG° is shown because there is no product to calculate it for.</p>}</div>
            <section className="card"><h2>Reactions in the library</h2><ul className="rxs">{Object.values(REACTIONS).map(q => <li key={q.id}><span className="serif"><F t={q.text} /></span><button className="btn line" onClick={() => load(q.id.split('+'))}>Set up</button></li>)}</ul></section>
          </>
        )}
      </div>
    </main>
  )
}
