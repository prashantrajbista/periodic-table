import data from './data/elements.json' with { type: 'json' }
import photos from './data/photos.json' with { type: 'json' }

export type Element = { z: number; s: string; name: string; mass: string; config: string; en: number | null; radius: number | null; ie: number | null; ea: number | null; ox: string; state: string; mp: number | null; bp: number | null; density: number | null; group: string; year: string; row: number; col: number }

const STARTS = [[1, 1], [3, 2], [11, 3], [19, 4], [37, 5], [55, 6], [87, 7]]
function place(z: number): [number, number] {
  if (z >= 57 && z <= 71) return [9, z - 53]
  if (z >= 89 && z <= 103) return [10, z - 85]
  const [z0, row] = STARTS.filter(s => z >= s[0]).pop()!, k = z - z0
  if (row === 1) return [1, k ? 18 : 1]
  if (row <= 3) return [row, k < 2 ? k + 1 : k + 11]
  if (row <= 5) return [row, k + 1]
  return [row, k < 2 ? k + 1 : k - 13]
}
export const ELEMENTS: Element[] = (data as Omit<Element, 'row' | 'col'>[]).map(e => { const [row, col] = place(e.z); return { ...e, row, col } })
export const BY: Record<string, Element> = Object.fromEntries(ELEMENTS.map(e => [e.s, e]))

export type Photo = { alt: string; kind: 'element' | 'glow' | 'related'; by: string; lic: string; licUrl: string; page: string; file: string }
/** One real photograph per element where a usable one exists. `glow` is a gas discharge, `related` is not the pure element. */
export const PHOTO = photos as Record<string, Photo>
export const photo = (s: string) => `./photos/${PHOTO[s].file}.jpg`
export const thumb = (s: string) => `./photos/t/${PHOTO[s].file}.jpg`
export function Credit({ s }: { s: string }) {
  const p = PHOTO[s]
  return <span className="small">Photo: <a href={p.page}>{p.by}</a>, {p.licUrl ? <a href={p.licUrl}>{p.lic}</a> : p.lic}</span>
}

/** Families in reading order, with tile colours that all carry dark text. */
export const FAMILIES: Record<string, { plural: string; color: string }> = {
  'Alkali metal': { plural: 'Alkali metals', color: '#EFA08A' }, 'Alkaline earth metal': { plural: 'Alkaline earth metals', color: '#F3C58B' },
  Lanthanide: { plural: 'Lanthanides', color: '#DDBDE9' }, Actinide: { plural: 'Actinides', color: '#B59BD6' }, 'Transition metal': { plural: 'Transition metals', color: '#A9C4E4' },
  'Post-transition metal': { plural: 'Post-transition metals', color: '#9FD0CF' }, Metalloid: { plural: 'Metalloids', color: '#B9CE9A' }, Nonmetal: { plural: 'Nonmetals', color: '#F4E59A' },
  Halogen: { plural: 'Halogens', color: '#86C58B' }, 'Noble gas': { plural: 'Noble gases', color: '#C5C9D8' },
}
/** Elements with no standard atomic weight show the mass number of a long-lived isotope in brackets. */
const NO_WEIGHT = (z: number) => z === 43 || z === 61 || (z >= 84 && z <= 89) || z >= 93
export const tileMass = (e: Element) => (NO_WEIGHT(e.z) ? `[${Math.round(+e.mass)}]` : e.mass.length > 6 ? (+e.mass).toFixed(3) : e.mass)

const SUP: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' }
export const sup = (n: number | string) => String(n).split('').map(c => SUP[c] ?? c).join('')
/** "[Ne]3s2 3p5" to "[Ne] 3s² 3p⁵" */
export const config = (c: string) => c.replace(/\](?=\d)/, '] ').replace(/(\d)([spdf])(\d+)/g, (_, n, l, e) => n + l + sup(e))
/** Values for the heaviest elements come from theory, not measurement. */
export const predicted = (e: Element) => e.z >= 100
export const stateAt = (e: Element, T: number) => (e.mp == null ? 'unknown' : T < e.mp ? 'solid' : e.bp == null ? 'liquid or gas' : e.bp < e.mp ? 'gas' : T < e.bp ? 'liquid' : 'gas')
const SUBS = '₀₁₂₃₄₅₆₇₈₉'
export const pretty = (f: string) => f.replace(/\d/g, d => SUBS[+d])
export const signed = (v: number, d = 1) => (v < -0.5 * 10 ** -d ? '−' : v > 0.5 * 10 ** -d ? '+' : '') + Math.abs(v).toFixed(d)

/** Text with Unicode sub/superscripts shown as real ones, so every font keeps its own digits. */
export function F({ t }: { t: string }) {
  return <>{t.split(/([₀-₉]+|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/).map((x, i) => {
    if (i % 2 === 0) return x
    const plain = [...x].map(c => { const k = SUBS.indexOf(c); return k >= 0 ? k : Object.keys(SUP).find(d => SUP[d] === c) }).join('').replace('-', '−')
    return SUBS.includes(x[0]) ? <sub key={i}>{plain}</sub> : <sup key={i}>{plain}</sup>
  })}</>
}
