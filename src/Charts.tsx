import { useMemo } from 'react'
import { reaction, transitions, type Eq } from './chem/thermo.ts'
import { conversion, run, type Reaction } from './chem/reactions.ts'
import { F, pretty } from './elements.tsx'

const W = 560, L = 62, RT = 534, TOP = 14, BOT = 190
function nice(lo: number, hi: number, n = 4): number[] {
  const raw = (hi - lo) / n || 1, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(s => s >= raw)!
  const out: number[] = []
  for (let v = Math.floor(lo / step) * step; v < hi + step * 0.999; v += step) out.push(+v.toFixed(6))
  return out
}
const num = (v: number) => (v < 0 ? '−' : '') + Math.abs(v)

function Frame({ T, range, ys, unit, children, label, x, y }: { T: number; range: [number, number]; ys: number[]; unit: string; children: React.ReactNode; label: string; x: (t: number) => number; y: (v: number) => number }) {
  const xs = nice(range[0], range[1], 6).filter(t => t >= range[0] && t <= range[1])
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${W} 236`} className="chart">
      {ys.map(v => <g key={v}><path d={`M${L} ${y(v)}H${RT}`} stroke={v === 0 ? '#171C21' : '#C9CFD4'} strokeWidth={v === 0 ? 1.5 : 1} /><text x={L - 8} y={y(v) + 5} textAnchor="end">{num(v)}</text></g>)}
      {xs.map(t => <text key={t} x={x(t)} y={BOT + 20} textAnchor="middle">{t}</text>)}
      <text x={(L + RT) / 2} y={BOT + 41} textAnchor="middle">Temperature, K</text>
      <text x={L} y={BOT + 41} textAnchor="start">{unit}</text>
      <path d={`M${x(T)} ${TOP}V${BOT}`} stroke="#171C21" strokeWidth="1.5" />
      {children}
    </svg>
  )
}
const line = (pts: [number, number][], x: (t: number) => number, y: (v: number) => number) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join('')

export function GibbsChart({ r, T, P }: { r: Reaction; T: number; P: number }) {
  const d = useMemo(() => {
    const series = (eq: Eq, k: 'G' | 'H') => {
      const out: [number, number][] = []
      const N = 220
      for (let i = 0; i <= N; i++) { const t = r.T[0] + ((r.T[1] - r.T[0]) * i) / N, v = reaction(eq, t); if (v) out.push([t, v[k]]) }
      return out
    }
    return { G: series(r.eq, 'G'), H: series(r.eq, 'H'), G2: r.then ? series(r.then, 'G') : null, steps: transitions(r.eq, r.T) }
  }, [r])
  const vals = [...d.G, ...d.H, ...(d.G2 ?? [])].map(p => p[1])
  const ys = nice(Math.min(...vals), Math.max(...vals)), lo = ys[0], hi = ys[ys.length - 1]
  const x = (t: number) => L + ((t - r.T[0]) / (r.T[1] - r.T[0])) * (RT - L), y = (v: number) => BOT - ((v - lo) / (hi - lo)) * (BOT - TOP)
  const now = reaction(r.eq, T, P), now2 = r.then && reaction(r.then, T, P)
  return (
    <div>
      <Frame T={T} range={r.T} ys={ys} unit="kJ" x={x} y={y} label={`Standard Gibbs energy and enthalpy against temperature. At ${T} kelvin Gibbs energy is ${now ? now.G.toFixed(1) : 'not available'} kilojoules.`}>
        <path d={line(d.H, x, y)} className="h" />
        <path d={line(d.G, x, y)} className="g" />
        {d.G2 && <path d={line(d.G2, x, y)} className="g2" />}
        {now2 && <circle cx={x(T)} cy={y(now2.G)} r="6" className="pt" />}
        {now && <circle cx={x(T)} cy={y(now.G)} r="6" className="pt" />}
      </Frame>
      <div className="chartkey"><span><i className="kg" />ΔG°</span><span><i className="kh" />ΔH°</span>{d.G2 && <span><i className="kg2" />ΔG° of <F t={r.thenText!} /></span>}</div>
      {d.steps.length > 0 && <p className="small">Steps: <F t={d.steps.map(s => `${pretty(s.sub)} ${s.to} near ${s.T} K`).join(', ') + '.'} /></p>}
    </div>
  )
}

const REFS = [1, 10, 100]
export function ConversionChart({ r, amounts, T, P }: { r: Reaction; amounts: Record<string, number>; T: number; P: number }) {
  const curve = (p: number) => { const out: [number, number][] = []; for (let i = 0; i <= 110; i++) { const t = r.T[0] + ((r.T[1] - r.T[0]) * i) / 110, n = run(r, amounts, t, p); if (n) out.push([t, 100 * conversion(r, amounts, n)]) } return out }
  const refs = useMemo(() => (r.P[1] > 10 ? REFS.map(curve) : []), [r, amounts])
  const cur = useMemo(() => curve(P), [r, amounts, P])
  const n = run(r, amounts, T, P), v = n ? 100 * conversion(r, amounts, n) : 0
  const x = (t: number) => L + ((t - r.T[0]) / (r.T[1] - r.T[0])) * (RT - L), y = (q: number) => BOT - (q / 100) * (BOT - TOP)
  return (
    <div>
      <Frame T={T} range={r.T} ys={[0, 25, 50, 75, 100]} unit="%" x={x} y={y} label={`Equilibrium conversion against temperature. At ${T} kelvin it is ${v.toFixed(1)} percent.`}>
        {refs.map((c, i) => <path key={i} d={line(c, x, y)} className="h" />)}
        <path d={line(cur, x, y)} className="g" />
        <circle cx={x(T)} cy={y(v)} r="6" className="pt" />
        <text x={x(T) > RT - 70 ? x(T) - 12 : x(T) + 12} y={Math.max(30, Math.min(y(v) - 10, BOT - 8))} textAnchor={x(T) > RT - 70 ? 'end' : 'start'} className="val">{v.toFixed(1)} %</text>
      </Frame>
      {refs.length > 0 && <p className="small">Solid line: your pressure. Dashed, left to right: 1, 10 and 100 bar.</p>}
    </div>
  )
}

/** Schematic only: shows why nothing happens. */
export function Profile({ up }: { up: boolean }) {
  return up ? (
    <svg role="img" aria-label="The product lies above the reactants in energy. Not to scale." viewBox="0 0 560 130" className="chart"><path d="M10 100H130C210 100 240 18 320 18C380 18 370 42 420 42H550" fill="none" stroke="#8A3A00" strokeWidth="3" /><circle cx="70" cy="100" r="7" className="pt" /><text x="10" y="78">Reactants</text><text x="450" y="66">Products</text><text x="300" y="122">Not to scale</text></svg>
  ) : (
    <svg role="img" aria-label="A barrier separates the reactants from lower-energy products. Not to scale." viewBox="0 0 560 130" className="chart"><path d="M10 56H110C170 56 180 14 225 14S285 112 345 112H550" fill="none" stroke="#1D4F8C" strokeWidth="3" /><circle cx="70" cy="56" r="7" className="pt" /><text x="10" y="84">Reactants</text><text x="252" y="24">Activation energy</text><text x="460" y="102">Products</text><text x="10" y="122">Not to scale</text></svg>
  )
}
