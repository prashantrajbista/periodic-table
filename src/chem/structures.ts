// Atom positions in ångström. Crystals from published cells; molecules from published geometry.
export type Atom = { e: string; p: [number, number, number]; r: number }
export type Structure = { atoms: Atom[]; solid: boolean; note: string }

// Radii (pm/100): metallic for metals, Shannon ionic for ionic solids, van der Waals for molecules.
export const VDW: Record<string, number> = { H: 1.2, N: 1.55, O: 1.52, S: 1.8, Cl: 1.75, Br: 1.85, I: 1.98, Al: 1.84, Ne: 1.54, Hg: 1.55 }
export const COLORS: Record<string, string> = { H: '#e8e8e8', N: '#3a55c8', O: '#c22a22', Ne: '#a9cfe0', Na: '#6f5bb0', Mg: '#4f8f2f', Al: '#a89a9a', S: '#d2b41e', Cl: '#4f9a45', Fe: '#b8622f', Cu: '#b9733a', Br: '#8a2a22', I: '#6d2a86', Hg: '#8e94a6' }

type Cell = { a: [number, number, number]; beta?: number; hex?: boolean; basis: [string, number, number, number][]; r: Record<string, number>; reps: [number, number, number]; note: string }
const fcc: [number, number, number][] = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]]
const metal = (e: string, a: number, kind: 'bcc' | 'fcc', r: number, reps: [number, number, number]): Cell => ({ a: [a, a, a], basis: (kind === 'fcc' ? fcc : [[0, 0, 0], [0.5, 0.5, 0.5]]).map(p => [e, p[0], p[1], p[2]]), r: { [e]: r }, reps, note: `${kind} metal, radius ${Math.round(r * 100)} pm` })
const rock = (m: string, x: string, a: number, rm: number, rx: number): Cell => ({ a: [a, a, a], basis: [...fcc.map(p => [m, ...p] as [string, number, number, number]), ...fcc.map(p => [x, (p[0] + 0.5) % 1, p[1], p[2]] as [string, number, number, number])], r: { [m]: rm, [x]: rx }, reps: [3, 3, 2], note: `rock-salt lattice, ionic radii ${m} ${Math.round(rm * 100)} pm, ${x} ${Math.round(rx * 100)} pm` })

export const CELLS: Record<string, Cell> = {
  Na: metal('Na', 4.291, 'bcc', 1.86, [5, 5, 2]),
  Al: metal('Al', 4.05, 'fcc', 1.43, [4, 4, 2]),
  Fe: metal('Fe', 2.867, 'bcc', 1.24, [6, 6, 3]),
  Cu: metal('Cu', 3.615, 'fcc', 1.28, [5, 5, 2]),
  Mg: { a: [3.209, 3.209, 5.211], hex: true, basis: [['Mg', 1 / 3, 2 / 3, 0.25], ['Mg', 2 / 3, 1 / 3, 0.75]], r: { Mg: 1.6 }, reps: [6, 6, 2], note: 'hcp metal, radius 160 pm' },
  NaCl: rock('Na', 'Cl', 5.64, 1.02, 1.81),
  MgO: rock('Mg', 'O', 4.212, 0.72, 1.4),
  FeS: { a: [3.45, 3.45, 5.88], hex: true, basis: [['Fe', 0, 0, 0], ['Fe', 0, 0, 0.5], ['S', 1 / 3, 2 / 3, 0.25], ['S', 2 / 3, 1 / 3, 0.75]], r: { Fe: 0.78, S: 1.84 }, reps: [5, 5, 2], note: 'NiAs-type lattice (idealised troilite), ionic radii' },
  CuO: { a: [4.684, 3.423, 5.129], beta: 99.54, basis: [['Cu', 0.25, 0.25, 0], ['Cu', 0.75, 0.75, 0], ['Cu', 0.75, 0.25, 0.5], ['Cu', 0.25, 0.75, 0.5], ['O', 0, 0.4184, 0.25], ['O', 0.5, 0.9184, 0.25], ['O', 0, 0.5816, 0.75], ['O', 0.5, 0.0816, 0.75]], r: { Cu: 0.73, O: 1.4 }, reps: [4, 4, 2], note: 'tenorite, ionic radii' },
  Cu2O: { a: [4.2696, 4.2696, 4.2696], basis: [['O', 0, 0, 0], ['O', 0.5, 0.5, 0.5], ['Cu', 0.25, 0.25, 0.25], ['Cu', 0.75, 0.75, 0.25], ['Cu', 0.75, 0.25, 0.75], ['Cu', 0.25, 0.75, 0.75]], r: { Cu: 0.77, O: 1.4 }, reps: [4, 4, 2], note: 'cuprite, ionic radii' },
  HgO: { a: [6.612, 5.52, 3.521], basis: ([['Hg', 0.1136, 0.2456], ['O', 0.3592, 0.5955]] as [string, number, number][]).flatMap(([e, x, z]) => [[e, x, 0.25, z], [e, 0.5 - x, 0.75, z + 0.5], [e, 1 - x, 0.75, 1 - z], [e, x + 0.5, 0.25, 0.5 - z]] as [string, number, number, number][]), r: { Hg: 0.69, O: 1.36 }, reps: [3, 3, 4], note: 'montroydite, zigzag O–Hg–O chains, ionic radii' },
}

type Mol = [string, number, number, number][]
const di = (e: string, f: string, d: number): Mol => [[e, 0, 0, -d / 2], [f, 0, 0, d / 2]]
const bent = (c: string, o: string, d: number, deg: number): Mol => { const h = (deg * Math.PI) / 360; return [[c, 0, 0, 0], [o, d * Math.sin(h), 0, d * Math.cos(h)], [o, -d * Math.sin(h), 0, d * Math.cos(h)]] }
const NH3: Mol = (() => { const d = 1.012, hh = 2 * d * Math.sin((106.7 * Math.PI) / 360), rad = hh / Math.sqrt(3), z = Math.sqrt(d * d - rad * rad); return [['N', 0, 0, 0], ...[0, 1, 2].map(i => ['H', rad * Math.cos((i * 2 * Math.PI) / 3), rad * Math.sin((i * 2 * Math.PI) / 3), z] as Mol[0])] })()
const S8: Mol = (() => { const d = 2.06, h = 0.5; const chord = Math.sqrt(d * d - 4 * h * h); const rad = chord / (2 * Math.sin(Math.PI / 8)); return Array.from({ length: 8 }, (_, i) => ['S', rad * Math.cos((i * Math.PI) / 4), rad * Math.sin((i * Math.PI) / 4), i % 2 ? h : -h] as Mol[0]) })()
const AL2BR6: Mol = [['Al', 1.6, 0, 0], ['Al', -1.6, 0, 0], ['Br', 0, 1.8, 0], ['Br', 0, -1.8, 0], ['Br', 2.68, 0, 1.95], ['Br', 2.68, 0, -1.95], ['Br', -2.68, 0, 1.95], ['Br', -2.68, 0, -1.95]]
export const MOLS: Record<string, { m: Mol; n: number; gap: number; liquid?: boolean; note: string }> = {
  H2: { m: di('H', 'H', 0.741), n: 10, gap: 4, note: 'H–H 74 pm' }, O2: { m: di('O', 'O', 1.208), n: 9, gap: 4.4, note: 'O=O 121 pm' },
  N2: { m: di('N', 'N', 1.098), n: 9, gap: 4.4, note: 'N≡N 110 pm' }, Cl2: { m: di('Cl', 'Cl', 1.988), n: 9, gap: 5.4, note: 'Cl–Cl 199 pm' },
  Br2: { m: di('Br', 'Br', 2.281), n: 9, gap: 5.6, note: 'Br–Br 228 pm' }, I2g: { m: di('I', 'I', 2.666), n: 7, gap: 6.2, note: 'I–I 267 pm' },
  HI: { m: di('H', 'I', 1.609), n: 9, gap: 5, note: 'H–I 161 pm' }, NO: { m: di('N', 'O', 1.151), n: 4, gap: 4.4, note: 'N–O 115 pm' },
  SO2: { m: bent('S', 'O', 1.431, 119.3), n: 11, gap: 5, note: 'S–O 143 pm, 119.3°' }, H2O: { m: bent('O', 'H', 0.958, 104.5), n: 30, gap: 2.9, liquid: true, note: 'O–H 96 pm, 104.5°' },
  NH3: { m: NH3, n: 8, gap: 4.4, note: 'N–H 101 pm, 106.7°' }, S8: { m: S8, n: 6, gap: 7.4, liquid: true, note: 'S₈ crown rings, S–S 206 pm' },
  Al2Br6: { m: AL2BR6, n: 6, gap: 8.6, liquid: true, note: 'Al₂Br₆ molecules' }, Hg: { m: [['Hg', 0, 0, 0]], n: 60, gap: 2.95, liquid: true, note: 'liquid metal' }, Ne: { m: [['Ne', 0, 0, 0]], n: 12, gap: 4, note: 'single atoms' },
}

function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 } }

export function crystal(name: string): Atom[] {
  const c = CELLS[name], out: Atom[] = []
  const b = ((c.beta ?? 90) * Math.PI) / 180
  const frac = (x: number, y: number, z: number): [number, number, number] =>
    c.hex ? [c.a[0] * (x - y / 2), c.a[0] * (Math.sqrt(3) / 2) * y, c.a[2] * z] : [c.a[0] * x + c.a[2] * z * Math.cos(b), c.a[1] * y, c.a[2] * z * Math.sin(b)]
  for (let i = 0; i < c.reps[0]; i++) for (let j = 0; j < c.reps[1]; j++) for (let k = 0; k < c.reps[2]; k++)
    for (const [e, x, y, z] of c.basis) out.push({ e, p: frac(i + x, j + y, k + z), r: c.r[e] })
  const mid = [0, 1, 2].map(q => out.reduce((t, a) => t + a.p[q], 0) / out.length)
  for (const a of out) a.p = [a.p[0] - mid[0], a.p[1] - mid[1], a.p[2] - mid[2]]
  return out
}

/** Random, non-overlapping molecules in a box. Deterministic. */
function scatter(name: string, taken: [number, number, number][], box: [number, number, number, number], seed: number): Atom[] {
  const { m, n, gap } = MOLS[name], rand = rng(seed), out: Atom[] = []
  const [w, z0, z1] = box
  let tries = 0, placed = 0
  while (placed < n && tries++ < 6000) {
    const c: [number, number, number] = [(rand() - 0.5) * 2 * w, (rand() - 0.5) * 2 * w, z0 + rand() * (z1 - z0)]
    if (taken.some(t => Math.hypot(t[0] - c[0], t[1] - c[1], t[2] - c[2]) < gap)) continue
    taken.push(c); placed++
    const u = rand() * 2 - 1, th = rand() * 6.2832, ph = rand() * 6.2832
    const s = Math.sqrt(1 - u * u), ax = [s * Math.cos(th), s * Math.sin(th), u]
    const cs = Math.cos(ph), sn = Math.sin(ph)
    for (const [e, x, y, z] of m) {
      const d = ax[0] * x + ax[1] * y + ax[2] * z
      const cr = [ax[1] * z - ax[2] * y, ax[2] * x - ax[0] * z, ax[0] * y - ax[1] * x]
      out.push({ e, p: [c[0] + x * cs + cr[0] * sn + ax[0] * d * (1 - cs), c[1] + y * cs + cr[1] * sn + ax[1] * d * (1 - cs), c[2] + z * cs + cr[2] * sn + ax[2] * d * (1 - cs)], r: VDW[e] })
    }
  }
  return out
}

export function build(names: string[]): Structure {
  const atoms: Atom[] = [], notes: string[] = [], taken: [number, number, number][] = []
  const solids = names.filter(n => CELLS[n]), rest = names.filter(n => !CELLS[n])
  const both = solids.length > 0 && rest.length > 0
  let top = -7
  for (const n of solids) {
    const a = crystal(n)
    const hi = Math.max(...a.map(q => q.p[2] + q.r))
    for (const q of a) atoms.push(both ? { ...q, p: [q.p[0], q.p[1], q.p[2] - hi - 1] } : q)
    top = both ? 2.5 : hi
    notes.push(`${n}: ${CELLS[n].note}`)
  }
  rest.forEach((n, i) => {
    const liq = MOLS[n].liquid
    atoms.push(...scatter(n, taken, liq && !both ? [8, -6, 4, 0] : [9, top, liq ? top + 9 : top + 13, 0], 7 + i * 31))
    notes.push(`${n}: ${MOLS[n].note}`)
  })
  return { atoms, solid: solids.length > 0, note: notes.join('. ') }
}
