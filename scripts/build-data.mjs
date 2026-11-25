// Rebuilds src/data from primary sources. Run: npm run data
import { writeFileSync } from 'node:fs'

const CEA = 'https://raw.githubusercontent.com/nasa/cea/2f79a647e85737742fb08a127da00d1ea1d069da/data/thermo.inp'
const PUBCHEM = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON'

// NASA names we use. Several records share a name when a phase has more than one form.
const KEEP = new Set(`H2 O2 N2 CL2 Br2 I2 Ne S S2 S8 Na Mg AL Fe Cu Hg Zn HI NO NH3 H2O SO2 NaCL Na2CL2 MgO ALBr3 AL2Br6
Na(cr) Na(L) Mg(cr) Mg(L) AL(cr) AL(L) Fe(a) Fe(c) Fe(d) Fe(L) Cu(cr) Cu(L) Hg(cr) Hg(L) S(a) S(b) S(L) Br2(cr) Br2(L) I2(cr) I2(L)
NaCL(cr) NaCL(L) MgO(cr) MgO(L) ALBr3(cr) ALBr3(L) H2O(cr) H2O(L) FeS(a) FeS(b) FeS(c) FeS(L) HgO(cr) CuO(cr) Cu2O(cr) Cu2O(L)`.split(/\s+/))

const num = s => (s.trim() ? Number(s.replace(/[dD]/, 'e')) : 0)
const get = async u => { const r = await fetch(u); if (!r.ok) throw new Error(`${u}: ${r.status}`); return r }

const lines = (await (await get(CEA)).text()).split(/\r?\n/)
const thermo = {}
for (let i = 0; i < lines.length - 1; i++) {
  const name = lines[i].slice(0, 16).trim().split(/\s+/)[0]
  if (!name || '!#-'.includes(name[0]) || /^\s/.test(lines[i]) || !/^ ?\d /.test(lines[i + 1].slice(0, 3))) continue
  const k = parseInt(lines[i + 1].slice(0, 2), 10)
  if (KEEP.has(name)) for (let j = 0; j < k; j++) {
    const [a, b, c] = lines.slice(i + 2 + 3 * j, i + 5 + 3 * j)
    ;(thermo[name] ??= []).push([
      num(a.slice(0, 11)), num(a.slice(11, 22)),
      ...[0, 1, 2, 3, 4].map(q => num(b.slice(16 * q, 16 * q + 16))),
      num(c.slice(0, 16)), num(c.slice(16, 32)), num(c.slice(48, 64)), num(c.slice(64, 80)),
    ])
  }
  i += k ? 1 + 3 * k : 2
}
const missing = [...KEEP].filter(n => !thermo[n])
if (missing.length) throw new Error('missing from NASA file: ' + missing)
for (const n in thermo) thermo[n].sort((x, y) => x[0] - y[0])
writeFileSync('src/data/thermo.json', JSON.stringify(thermo))

const { Columns, Row } = (await (await get(PUBCHEM)).json()).Table
const SPELL = { Aluminum: 'Aluminium', Cesium: 'Caesium' }
const opt = s => (s === '' ? null : Number(s))
const elements = Row.map(r => {
  const x = Object.fromEntries(Columns.Column.map((c, i) => [c, r.Cell[i]]))
  return {
    z: Number(x.AtomicNumber), s: x.Symbol, name: SPELL[x.Name] ?? x.Name, mass: x.AtomicWeight,
    config: x.ElectronConfiguration, en: opt(x.Electronegativity), radius: opt(x.AtomicRadius),
    ie: opt(x.IonizationEnergy), ea: opt(x.ElectronAffinity), ox: x.OxidationStates, state: x.StandardState,
    mp: opt(x.MeltingPoint), bp: opt(x.BoilingPoint), density: opt(x.Density), group: x.GroupBlock, year: x.YearDiscovered,
  }
})
if (elements.length !== 118) throw new Error('expected 118 elements, got ' + elements.length)
writeFileSync('src/data/elements.json', JSON.stringify(elements))
console.log(Object.keys(thermo).length, 'species,', elements.length, 'elements')
