import test from 'node:test'
import assert from 'node:assert/strict'
import { equilibrate, reaction, speciesHS, stable } from './thermo.ts'
import { atoms, BENCH, conversion, outcome, pairId, REACTIONS, run } from './reactions.ts'
import { build, crystal, MOLS } from './structures.ts'

const near = (a: number, b: number, tol: number, what = '') => assert.ok(Math.abs(a - b) <= tol, `${what} ${a} vs ${b} (±${tol})`)
const all = Object.values(REACTIONS)

test('every equation balances', () => {
  for (const r of all) for (const eq of [r.eq, r.then]) if (eq) {
    const t: Record<string, number> = {}
    for (const f in eq) for (const [e, n] of Object.entries(atoms(f))) t[e] = (t[e] ?? 0) + n * eq[f]
    for (const e in t) assert.equal(t[e], 0, `${r.id} ${e}`)
  }
})

// Standard formation values, CRC Handbook / CODATA (kJ per mole of reaction as written).
test('matches reference values at 298.15 K', () => {
  const ref: [string, number, number][] = [['Cl+Na', -822.4, -768.2], ['Mg+O', -1203.2, -1138.6], ['H+O', -571.66, -474.26], ['O+S', -296.8, -300.1], ['Fe+S', -100, -100.4], ['H+N', -91.8, -32.8], ['Hg+O', -181.6, -117.0], ['N+O', 182.6, 175.2], ['H+I', 53.0, 3.4], ['Cu+O', -337.2, -292]]
  for (const [id, H, G] of ref) {
    const v = reaction(REACTIONS[id].eq, 298.15)!
    near(v.H, H, 6, id + ' H'); near(v.G, G, 6, id + ' G')
  }
})

test('phase choice follows real transitions', () => {
  const p = (s: string, T: number) => stable(s, T)!.phase
  assert.equal(p('Na', 360), 's'); assert.equal(p('Na', 400), 'l'); assert.equal(p('Na', 1250), 'g')
  assert.equal(p('H2O', 320), 'l'); assert.equal(p('H2O', 400), 'g')
  assert.equal(p('Br2', 300), 'l'); assert.equal(p('Br2', 350), 'g')
  assert.equal(p('I2', 350), 's'); assert.equal(p('I2', 500), 'g')
  assert.equal(p('Hg', 500), 'l'); assert.equal(p('Hg', 700), 'g')
})

test('never extrapolates', () => {
  assert.equal(speciesHS('HgO(cr)', 1001), null)
  assert.equal(speciesHS('NaCL(cr)', 200), null)
  assert.equal(reaction(REACTIONS['Hg+O'].eq, 1200), null)
  for (const r of all) for (let T = r.T[0]; T <= r.T[1]; T += 5) assert.ok(reaction(r.eq, T) && (!r.then || reaction(r.then, T)), `${r.id} at ${T}`)
})

test('ammonia equilibrium', () => {
  const pct = (T: number, P: number) => { const n = equilibrate(REACTIONS['H+N'].eq, { N2: 1, H2: 3 }, T, P)!; return (100 * n.NH3) / (n.N2 + n.H2 + n.NH3) }
  near(pct(700, 200), 30.0, 0.3); near(pct(500, 10), 38.7, 0.4)
  assert.ok(pct(700, 200) > pct(700, 10), 'pressure favours fewer moles')
  assert.ok(pct(600, 100) > pct(800, 100), 'heat favours reactants')
  // Q equals K at the answer
  const n = equilibrate(REACTIONS['H+N'].eq, { N2: 1, H2: 3 }, 700, 200)!, t = n.N2 + n.H2 + n.NH3
  const lnQ = 2 * Math.log(n.NH3 / t) - Math.log(n.N2 / t) - 3 * Math.log(n.H2 / t) - 2 * Math.log(200)
  near(lnQ, reaction(REACTIONS['H+N'].eq, 700, 200)!.lnK, 1e-6)
})

test('equilibrium conserves atoms and stays in bounds', () => {
  for (const r of all) for (const T of [r.T[0], (r.T[0] + r.T[1]) / 2, r.T[1]]) for (const P of r.P) {
    const n = run(r, r.amounts, T, P)!
    const total = (m: Record<string, number>) => { const t: Record<string, number> = {}; for (const f in m) { assert.ok(m[f] >= 0); for (const [e, k] of Object.entries(atoms(f))) t[e] = (t[e] ?? 0) + k * m[f] } return t }
    const a = total(r.amounts), b = total(n)
    for (const e in a) near(b[e], a[e], 1e-6 * a[e] + 1e-9, `${r.id} ${e} ${T}`)
  }
})

test('limits', () => {
  const c = (id: string, T: number, P = 1) => conversion(REACTIONS[id], REACTIONS[id].amounts, run(REACTIONS[id], REACTIONS[id].amounts, T, P)!)
  assert.ok(c('Cl+Na', 300) > 0.999); assert.ok(c('Fe+S', 300) > 0.999)
  assert.ok(c('N+O', 300) < 1e-6); assert.ok(c('N+O', 2500) > 0.01)
  assert.ok(c('Hg+O', 620) > 0.5); assert.ok(c('Hg+O', 880) < 0.02, 'HgO decomposes')
  const black = run(REACTIONS['Cu+O'], REACTIONS['Cu+O'].amounts, 900, 1)!, red = run(REACTIONS['Cu+O'], REACTIONS['Cu+O'].amounts, 1350, 0.1)!
  assert.ok(black.CuO > 15 && black.Cu2O < 1); assert.ok(red.Cu2O > 5 && red.CuO < 1)
  assert.equal(equilibrate(REACTIONS['Cl+Na'].eq, { Na: 0, Cl2: 5 }, 300)!.NaCl, 0, 'nothing from one reactant')
  assert.equal(equilibrate(REACTIONS['Cl+Na'].eq, {}, 300)!.NaCl, 0)
})

test('outcomes stay distinct', () => {
  const o = (a: string, b: string, p = {}) => { const r = REACTIONS[pairId(a, b)]; return outcome([a, b], { T: r?.start.T ?? 300, P: r?.start.P ?? 1, started: true, catalyst: false, ...p }, r?.amounts ?? {}) }
  assert.equal(o('Na', 'Cl'), 'reacts'); assert.equal(o('Cl', 'Na', { started: false }), 'ready')
  assert.equal(o('H', 'N'), 'blocked'); assert.equal(o('H', 'N', { catalyst: true }), 'reacts')
  assert.equal(o('H', 'O', { started: false }), 'ready'); assert.equal(o('H', 'O', { started: false, catalyst: true }), 'reacts')
  assert.equal(o('N', 'O', { T: 1900 }), 'unfavourable'); assert.equal(o('N', 'O'), 'blocked')
  assert.equal(o('Ne', 'Na'), 'inert'); assert.equal(o('Fe', 'Br'), 'unlisted')
  assert.equal(o('Hg', 'O', { T: 5000 }), 'range')
  for (const a of BENCH) for (const b of BENCH) if (a < b && !REACTIONS[pairId(a, b)]) assert.ok(['inert', 'unlisted'].includes(o(a, b)), a + b)
})

test('atom positions give real bond lengths', () => {
  const shortest = (name: string, x: string, y: string) => { const s = crystal(name); let m = 9; for (const p of s) if (p.e === x) for (const q of s) if (q.e === y && p !== q) m = Math.min(m, Math.hypot(p.p[0] - q.p[0], p.p[1] - q.p[1], p.p[2] - q.p[2])); return m }
  near(shortest('NaCl', 'Na', 'Cl'), 2.82, 0.01); near(shortest('MgO', 'Mg', 'O'), 2.106, 0.01)
  near(shortest('CuO', 'Cu', 'O'), 1.95, 0.03); near(shortest('Cu2O', 'Cu', 'O'), 1.85, 0.02)
  near(shortest('HgO', 'Hg', 'O'), 2.04, 0.04); near(shortest('FeS', 'Fe', 'S'), 2.47, 0.05); near(shortest('Mg', 'Mg', 'Mg'), 3.2, 0.02)
  const d = (m: [string, number, number, number][], i: number, j: number) => Math.hypot(m[i][1] - m[j][1], m[i][2] - m[j][2], m[i][3] - m[j][3])
  near(d(MOLS.S8.m, 0, 1), 2.06, 0.01); near(d(MOLS.NH3.m, 0, 1), 1.012, 0.001); near(d(MOLS.Al2Br6.m, 0, 2), 2.41, 0.02); near(d(MOLS.Al2Br6.m, 0, 4), 2.23, 0.03)
  for (const r of all) for (const c of [r.cells.before, r.cells.after]) assert.ok(build(c).atoms.length > 10, r.id)
})
