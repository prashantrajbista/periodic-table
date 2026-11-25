import { equilibrate, reaction, type Eq } from './thermo.ts'

export const BENCH = ['H', 'N', 'O', 'Ne', 'Na', 'Mg', 'Al', 'S', 'Cl', 'Fe', 'Cu', 'Br', 'I', 'Hg'] as const
/** What an element is on the bench: the substance put in the vessel. */
export const AS: Record<string, string> = { H: 'H2', N: 'N2', O: 'O2', Cl: 'Cl2', Br: 'Br2', I: 'I2' }
export const sub = (el: string) => AS[el] ?? el

export type Look = {
  vessel: 'jar' | 'steel' | 'crucible' | 'none'
  spoon?: boolean
  electrodes?: boolean
  /** Lower the spoon into the liquid when the reaction starts. */
  lower?: boolean
  /** Light while reacting: an emission wavelength (nm) or a glowing temperature (K). */
  light?: { nm?: number; K?: number; power: number; tall: number }
  smoke?: number
  flash?: boolean
}
export type Reaction = {
  id: string
  eq: Eq
  /** A second step that runs after the first, such as Cu2O to CuO. */
  then?: Eq
  text: string
  thenText?: string
  ox: string
  /** Temperatures (K) where this record is trusted. */
  T: [number, number]
  P: [number, number]
  start: { T: number; P: number }
  amounts: Record<string, number> // mmol, stoichiometric
  /** Gate. `minT` and `catalyst` are alternatives to `spark` only where both are listed. */
  gate: { label: string; minT?: number; catalyst?: string; spark?: boolean; why: string }
  reversible?: boolean
  see: { before: string; during: string; after: string }
  hazard: string
  look: Look
  cells: { before: string[]; after: string[] }
}

const list: Reaction[] = [
  {
    id: 'Cl+Na', eq: { Na: -2, Cl2: -1, NaCl: 2 }, text: '2Na + Cl₂ → 2NaCl',
    ox: 'Na 0 to +1, Cl 0 to −1. Each sodium gives one electron to a chlorine.',
    T: [300, 1400], P: [1, 1], start: { T: 300, P: 1 }, amounts: { Na: 20, Cl2: 10 },
    gate: { label: 'Heat the spoon', spark: true, why: 'Cold, dry sodium sits in chlorine almost unchanged. Melting it exposes fresh metal.' },
    see: { before: 'Silver sodium in pale yellow-green chlorine.', during: 'Bright yellow flame from sodium. White smoke is solid NaCl.', after: 'White sodium chloride on the glass and base. The chlorine colour has gone.' },
    hazard: 'Chlorine is toxic and the burn is violent.',
    look: { vessel: 'jar', spoon: true, light: { nm: 589, power: 1, tall: 1 }, smoke: 1 },
    cells: { before: ['Na', 'Cl2'], after: ['NaCl'] },
  },
  {
    id: 'Mg+O', eq: { Mg: -2, O2: -1, MgO: 2 }, text: '2Mg + O₂ → 2MgO',
    ox: 'Mg 0 to +2, O 0 to −2.',
    T: [300, 2000], P: [1, 1], start: { T: 300, P: 1 }, amounts: { Mg: 20, O2: 10 },
    gate: { label: 'Light the ribbon', spark: true, why: 'An oxide skin protects cold magnesium. It must be heated near its melting point.' },
    see: { before: 'Grey magnesium ribbon in colourless oxygen.', during: 'Intense white light from glowing MgO particles. White smoke is MgO.', after: 'White magnesium oxide powder.' },
    hazard: 'The light damages eyes. Burning magnesium cannot be put out with water or CO₂.',
    look: { vessel: 'jar', spoon: true, light: { K: 5600, power: 1.8, tall: 0.7 }, smoke: 0.9 },
    cells: { before: ['Mg', 'O2'], after: ['MgO'] },
  },
  {
    id: 'Al+Br', eq: { Al: -2, Br2: -3, AlBr3: 2 }, text: '2Al + 3Br₂ → 2AlBr₃',
    ox: 'Al 0 to +3, Br 0 to −1. The vapour is the dimer Al₂Br₆.',
    T: [300, 1200], P: [1, 1], start: { T: 300, P: 1 }, amounts: { Al: 20, Br2: 30 },
    gate: { label: 'Drop the foil in', spark: true, why: 'The foil has not touched the bromine yet.' },
    see: { before: 'Dark red-brown bromine with red-brown vapour. Aluminium foil held above it.', during: 'After a short delay the foil glows and sparks orange.', after: 'Pale aluminium bromide solid.' },
    hazard: 'Bromine burns skin and lungs. The reaction is violent.',
    look: { vessel: 'jar', spoon: true, lower: true, light: { K: 1700, power: 0.6, tall: 0.6 }, smoke: 0.5 },
    cells: { before: ['Al', 'Br2'], after: ['Al2Br6'] },
  },
  {
    id: 'H+O', eq: { H2: -2, O2: -1, H2O: 2 }, text: '2H₂ + O₂ → 2H₂O',
    ox: 'H 0 to +1, O 0 to −2.',
    T: [300, 2000], P: [1, 1], start: { T: 300, P: 1 }, amounts: { H2: 20, O2: 10 },
    gate: { label: 'Spark', spark: true, catalyst: 'Platinum', why: 'Strongly favoured, yet nothing happens at room temperature. A spark or a platinum catalyst gets it over the barrier.' },
    see: { before: 'Two colourless gases. Nothing to see.', during: 'A near-colourless flash. Hydrogen flames emit little visible light.', after: 'Water droplets on the glass.' },
    hazard: 'This mixture explodes. Never confine it in glass.',
    look: { vessel: 'jar', electrodes: true, light: { nm: 472, power: 0.22, tall: 1.3 }, flash: true },
    cells: { before: ['H2', 'O2'], after: ['H2O'] },
  },
  {
    id: 'O+S', eq: { S: -1, O2: -1, SO2: 1 }, text: 'S + O₂ → SO₂',
    ox: 'S 0 to +4, O 0 to −2.',
    T: [300, 1500], P: [1, 1], start: { T: 300, P: 1 }, amounts: { S: 10, O2: 10 },
    gate: { label: 'Light the sulfur', spark: true, why: 'Sulfur must melt and reach its ignition temperature before it burns.' },
    see: { before: 'Yellow sulfur in colourless oxygen.', during: 'Melts, then burns with a blue flame.', after: 'Colourless sulfur dioxide. The jar looks empty.' },
    hazard: 'Sulfur dioxide is toxic and triggers asthma.',
    look: { vessel: 'jar', spoon: true, light: { nm: 466, power: 0.5, tall: 0.9 }, smoke: 0.08 },
    cells: { before: ['S8', 'O2'], after: ['SO2'] },
  },
  {
    id: 'Fe+S', eq: { Fe: -1, S: -1, FeS: 1 }, text: 'Fe + S → FeS',
    ox: 'Fe 0 to +2, S 0 to −2.',
    T: [300, 1400], P: [1, 1], start: { T: 300, P: 1 }, amounts: { Fe: 20, S: 20 },
    gate: { label: 'Heat one edge', spark: true, why: 'Cold powders only touch at points. Heating melts the sulfur and starts a glow that feeds itself.' },
    see: { before: 'Grey iron and yellow sulfur powders, mixed.', during: 'A red-orange glow spreads through the heap with no flame.', after: 'Dark iron sulfide. A magnet no longer separates it.' },
    hazard: 'Hot iron sulfide with acid gives poisonous H₂S.',
    look: { vessel: 'crucible', light: { K: 1250, power: 0.5, tall: 0.25 }, smoke: 0.12 },
    cells: { before: ['Fe', 'S8'], after: ['FeS'] },
  },
  {
    id: 'H+N', eq: { N2: -1, H2: -3, NH3: 2 }, text: 'N₂ + 3H₂ ⇌ 2NH₃',
    ox: 'N 0 to −3, H 0 to +1.',
    T: [300, 1000], P: [1, 200], start: { T: 700, P: 200 }, amounts: { N2: 1000, H2: 3000 },
    gate: { label: 'Let it react', catalyst: 'Iron', minT: 600, why: 'The N≡N bond is very strong. Without an iron catalyst and heat the vessel would take far too long.' },
    reversible: true,
    see: { before: 'Colourless gases in a steel vessel. Read the gauge.', during: 'Nothing to watch. The composition shifts while the gauge is held at the set pressure.', after: 'An equilibrium mixture of three colourless gases.' },
    hazard: 'High pressure hydrogen. Ammonia is toxic.',
    look: { vessel: 'steel' },
    cells: { before: ['N2', 'H2'], after: ['NH3', 'N2', 'H2'] },
  },
  {
    id: 'Hg+O', eq: { Hg: -2, O2: -1, HgO: 2 }, text: '2Hg + O₂ ⇌ 2HgO',
    ox: 'Hg 0 to +2, O 0 to −2.',
    T: [300, 900], P: [1, 1], start: { T: 620, P: 1 }, amounts: { Hg: 20, O2: 10 },
    gate: { label: 'Let it react', minT: 570, why: 'Favoured when cold, but far too slow. It needs heat near 600 K.' },
    reversible: true,
    see: { before: 'Mirror-bright mercury under colourless oxygen.', during: 'A red-orange crust creeps over the metal.', after: 'Red mercury(II) oxide. Heat it above about 750 K and it falls apart again.' },
    hazard: 'Mercury vapour and mercury oxide are highly toxic.',
    look: { vessel: 'jar' },
    cells: { before: ['Hg', 'O2'], after: ['HgO'] },
  },
  {
    id: 'H+I', eq: { H2: -1, I2: -1, HI: 2 }, text: 'H₂ + I₂ ⇌ 2HI',
    ox: 'H 0 to +1, I 0 to −1.',
    T: [300, 1000], P: [1, 1], start: { T: 700, P: 1 }, amounts: { H2: 10, I2: 10 },
    gate: { label: 'Let it react', minT: 600, why: 'Below about 600 K the molecules rarely collide hard enough to react.' },
    reversible: true,
    see: { before: 'Violet iodine vapour with colourless hydrogen when hot, dark crystals when cold.', during: 'The violet fades as iodine is used.', after: 'Paler violet. Some iodine always remains at equilibrium.' },
    hazard: 'Hydrogen iodide is corrosive. Hydrogen is explosive in air.',
    look: { vessel: 'jar' },
    cells: { before: ['H2', 'I2g'], after: ['HI', 'I2g'] },
  },
  {
    id: 'Cu+O', eq: { Cu: -4, O2: -1, Cu2O: 2 }, then: { Cu2O: -2, O2: -1, CuO: 4 }, text: '4Cu + O₂ → 2Cu₂O', thenText: '2Cu₂O + O₂ ⇌ 4CuO',
    ox: 'Cu 0 to +1 in red Cu₂O, then +2 in black CuO.',
    T: [300, 1400], P: [0.01, 1], start: { T: 900, P: 1 }, amounts: { Cu: 20, O2: 12 },
    gate: { label: 'Let it react', minT: 500, why: 'A thin oxide film stops cold copper from reacting further.' },
    reversible: true,
    see: { before: 'Bright copper sheet.', during: 'Dull red film, then black.', after: 'Black CuO. Very hot or at low oxygen pressure, red Cu₂O is the stable oxide.' },
    hazard: 'Hot metal.',
    look: { vessel: 'crucible', light: { K: 1150, power: 0.15, tall: 0.1 } },
    cells: { before: ['Cu', 'O2'], after: ['CuO'] },
  },
  {
    id: 'N+O', eq: { N2: -1, O2: -1, NO: 2 }, text: 'N₂ + O₂ ⇌ 2NO',
    ox: 'N 0 to +2, O 0 to −2.',
    T: [300, 2500], P: [1, 1], start: { T: 300, P: 1 }, amounts: { N2: 10, O2: 10 },
    gate: { label: 'Let it react', minT: 1800, why: 'Both bonds are strong, so the mixture is slow below about 1800 K.' },
    reversible: true,
    see: { before: 'Two colourless gases: the same two as in air.', during: 'Nothing to see.', after: 'A small amount of colourless nitric oxide.' },
    hazard: 'Nitric oxide is toxic.',
    look: { vessel: 'jar', electrodes: true },
    cells: { before: ['N2', 'O2'], after: ['N2', 'O2', 'NO'] },
  },
]
export const REACTIONS: Record<string, Reaction> = Object.fromEntries(list.map(r => [r.id, r]))
export const pairId = (a: string, b: string) => [a, b].sort().join('+')

/** Parse "Al2" style formulas into element counts. */
export function atoms(f: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [, e, n] of f.matchAll(/([A-Z][a-z]?)(\d*)/g)) out[e] = (out[e] ?? 0) + Number(n || 1)
  return out
}

/** Moles after the reaction has gone as far as thermodynamics allows. */
export function run(r: Reaction, amounts: Record<string, number>, T: number, P: number): Record<string, number> | null {
  const a = equilibrate(r.eq, amounts, T, P)
  if (!a || !r.then) return a
  const b = equilibrate(r.then, a, T, P)
  return b && { ...a, ...b }
}

export type Control = { T: number; P: number; started: boolean; catalyst: boolean }
export type Outcome = 'empty' | 'one' | 'unlisted' | 'inert' | 'range' | 'ready' | 'blocked' | 'unfavourable' | 'reacts'

/** Fraction of the limiting reactant that is used. */
export function conversion(r: Reaction, amounts: Record<string, number>, after: Record<string, number>): number {
  let best = 0
  for (const k in r.eq) if (r.eq[k] < 0 && amounts[k] > 0) best = Math.max(best, 1 - (after[k] ?? 0) / amounts[k])
  return best
}

/** Is the kinetic gate open once the user has pressed start? */
export function gateOpen(r: Reaction, c: Control): boolean {
  const { minT, catalyst, spark } = r.gate
  if (spark) return c.started || (!!catalyst && c.catalyst)
  return c.started && (!minT || c.T >= minT) && (!catalyst || c.catalyst)
}

export function outcome(jar: string[], c: Control, amounts: Record<string, number>): Outcome {
  if (jar.length === 0) return 'empty'
  if (jar.length === 1) return 'one'
  if (jar.includes('Ne')) return 'inert'
  const r = REACTIONS[pairId(jar[0], jar[1])]
  if (!r) return 'unlisted'
  const after = c.T >= r.T[0] && c.T <= r.T[1] ? run(r, amounts, c.T, c.P) : null
  if (!after || !reaction(r.eq, c.T, c.P)) return 'range'
  if (Object.keys(r.amounts).some(k => !(amounts[k] > 0))) return 'ready'
  if (!gateOpen(r, c)) return c.started ? 'blocked' : 'ready'
  return conversion(r, amounts, after) < 0.02 ? 'unfavourable' : 'reacts'
}
