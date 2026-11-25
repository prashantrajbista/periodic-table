import data from '../data/thermo.json' with { type: 'json' }

export const R = 8.314462618 // J/mol K
type Fit = number[] // Tlow, Thigh, a1..a7, b1, b2
const FITS = data as Record<string, Fit[]>

/** A substance's possible forms. `n` is how many formula units one NASA species holds (Al2Br6 holds 2 AlBr3). */
type Form = { sp: string; phase: 's' | 'l' | 'g'; n?: number }
const s = (...sp: string[]): Form[] => sp.map(x => ({ sp: x, phase: 's' }))
const l = (sp: string): Form => ({ sp, phase: 'l' })
const g = (sp: string, n = 1): Form => ({ sp, phase: 'g', n })

export const SUBSTANCES: Record<string, Form[]> = {
  H2: [g('H2')], O2: [g('O2')], N2: [g('N2')], Cl2: [g('CL2')], Ne: [g('Ne')],
  Br2: [...s('Br2(cr)'), l('Br2(L)'), g('Br2')],
  I2: [...s('I2(cr)'), l('I2(L)'), g('I2')],
  S: [...s('S(a)', 'S(b)'), l('S(L)'), g('S2', 2), g('S8', 8)],
  Na: [...s('Na(cr)'), l('Na(L)'), g('Na')],
  Mg: [...s('Mg(cr)'), l('Mg(L)'), g('Mg')],
  Al: [...s('AL(cr)'), l('AL(L)'), g('AL')],
  Fe: [...s('Fe(a)', 'Fe(c)', 'Fe(d)'), l('Fe(L)'), g('Fe')],
  Cu: [...s('Cu(cr)'), l('Cu(L)'), g('Cu')],
  Hg: [...s('Hg(cr)'), l('Hg(L)'), g('Hg')],
  NaCl: [...s('NaCL(cr)'), l('NaCL(L)'), g('NaCL'), g('Na2CL2', 2)],
  MgO: [...s('MgO(cr)'), l('MgO(L)'), g('MgO')],
  AlBr3: [...s('ALBr3(cr)'), l('ALBr3(L)'), g('ALBr3'), g('AL2Br6', 2)],
  H2O: [...s('H2O(cr)'), l('H2O(L)'), g('H2O')],
  SO2: [g('SO2')], NH3: [g('NH3')], HI: [g('HI')], NO: [g('NO')],
  FeS: [...s('FeS(a)', 'FeS(b)', 'FeS(c)'), l('FeS(L)')],
  HgO: s('HgO(cr)'), CuO: s('CuO(cr)'),
  Cu2O: [...s('Cu2O(cr)'), l('Cu2O(L)')],
}

/** Molar enthalpy (J/mol) and entropy (J/mol K) at 1 bar, or null outside the fit. Never extrapolates. */
export function speciesHS(sp: string, T: number): { H: number; S: number } | null {
  // The 2 K slack lets 298.15 K use fits that start at 300 K.
  const f = FITS[sp].find(x => T >= x[0] && T <= x[1]) ?? FITS[sp].find(x => T >= x[0] - 2 && T <= x[1])
  if (!f) return null
  const [, , a1, a2, a3, a4, a5, a6, a7, b1, b2] = f
  const t2 = T * T, ln = Math.log(T)
  return {
    H: R * T * (-a1 / t2 + (a2 * ln) / T + a3 + (a4 * T) / 2 + (a5 * t2) / 3 + (a6 * t2 * T) / 4 + (a7 * t2 * t2) / 5 + b1 / T),
    S: R * (-a1 / (2 * t2) - a2 / T + a3 * ln + a4 * T + (a5 * t2) / 2 + (a6 * t2 * T) / 3 + (a7 * t2 * t2) / 4 + b2),
  }
}

export type State = { H: number; S: number; G: number; phase: 's' | 'l' | 'g'; n: number; sp: string }

/** Stable form of a substance at T and P (bar). H, S, G are standard values (1 bar) per formula unit. */
export function stable(sub: string, T: number, P = 1): State | null {
  let best: State | null = null, bestMu = Infinity
  for (const f of SUBSTANCES[sub]) {
    const v = speciesHS(f.sp, T)
    if (!v) continue
    const n = f.n ?? 1, G = v.H - T * v.S
    const mu = (G + (f.phase === 'g' ? R * T * Math.log(P) : 0)) / n
    if (mu < bestMu) { bestMu = mu; best = { H: v.H / n, S: v.S / n, G: G / n, phase: f.phase, n, sp: f.sp } }
  }
  return best
}

/** Stoichiometry: negative for reactants, positive for products. */
export type Eq = Record<string, number>
export type Thermo = { H: number; S: number; G: number; lnK: number; phases: Record<string, State> }

/** Standard reaction functions (kJ, J/K, kJ) using the stable form of everything at T and P. */
export function reaction(eq: Eq, T: number, P = 1): Thermo | null {
  let H = 0, S = 0
  const phases: Record<string, State> = {}
  for (const sub in eq) {
    const v = stable(sub, T, P)
    if (!v) return null
    phases[sub] = v
    H += eq[sub] * v.H
    S += eq[sub] * v.S
  }
  const G = H - T * S
  return { H: H / 1000, S, G: G / 1000, lnK: -G / (R * T), phases }
}

/**
 * Moles at equilibrium for one reaction at fixed T and P, from the amounts given.
 * Ideal gases; pure condensed phases have activity 1.
 * ponytail: phases are those of the pure substances at T and total P, so evaporation into a mixture is ignored.
 */
export function equilibrate(eq: Eq, n0: Record<string, number>, T: number, P = 1): Record<string, number> | null {
  const th = reaction(eq, T, P)
  if (!th) return null
  const subs = Object.keys(eq)
  const at = (x: number) => Object.fromEntries(subs.map(k => [k, Math.max(0, (n0[k] ?? 0) + eq[k] * x)]))
  let hi = Infinity, lo = -Infinity
  for (const k of subs) {
    const lim = (n0[k] ?? 0) / Math.abs(eq[k])
    if (eq[k] < 0) hi = Math.min(hi, lim)
    else lo = Math.max(lo, -lim)
  }
  if (hi - lo < 1e-15) return at(hi)
  // ln Q - ln K rises with extent whenever a gas takes part.
  const f = (x: number) => {
    const n = at(x)
    let tot = 0
    for (const k of subs) if (th.phases[k].phase === 'g') tot += n[k] / th.phases[k].n
    let q = -th.lnK
    for (const k of subs) {
      const st = th.phases[k]
      if (st.phase === 'g') q += (eq[k] / st.n) * Math.log(Math.max(n[k] / st.n, 1e-300) / Math.max(tot, 1e-300) * P)
    }
    return q
  }
  const eps = (hi - lo) * 1e-12
  if (f(hi - eps) <= 0) return at(hi)
  if (f(lo + eps) >= 0) return at(lo)
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2
    if (f(m) < 0) lo = m
    else hi = m
  }
  return at((lo + hi) / 2)
}

/** Temperature where a substance changes form, for labelling steps in a curve. */
export function transitions(eq: Eq, range: [number, number]): { T: number; sub: string; to: string }[] {
  const out: { T: number; sub: string; to: string }[] = []
  const word = { s: 'solid form changes', l: 'melts', g: 'boils' }
  for (const sub in eq) {
    let prev = stable(sub, range[0])
    for (let T = Math.ceil(range[0]); T <= range[1]; T++) {
      const now = stable(sub, T)
      if (prev && now && prev.phase !== now.phase) out.push({ T, sub, to: prev.phase === 's' && now.phase === 'g' ? 'sublimes' : word[now.phase] })
      prev = now
    }
  }
  return out.sort((a, b) => a.T - b.T)
}
