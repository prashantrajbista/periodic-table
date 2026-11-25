import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { blackbody, noiseTexture } from './materials.ts'

export type SampleKind = 'sodium' | 'magnesium' | 'aluminium' | 'sulfur' | 'iron' | 'mix' | 'copper' | 'mercury' | 'bromine' | 'iodine'

const rand = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
const n3 = (x: number, y: number, z: number) => Math.sin(x * 1.7 + Math.sin(y * 2.3 + z)) * Math.sin(y * 1.9 + Math.sin(z * 2.1 + x * 1.3)) * Math.sin(z * 1.6 + Math.sin(x * 2.7 + y * 0.7))

/** Push each vertex along its direction from the centre. */
function shape(g: THREE.BufferGeometry, f: (v: THREE.Vector3) => number): THREE.BufferGeometry {
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  const m = mergeVertices(g, 1e-4), p = m.attributes.position, v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(f(v)); p.setXYZ(i, v.x, v.y, v.z) }
  m.computeVertexNormals()
  return m
}

/** Many small facets or grains merged into one geometry. */
function scatter(count: number, seed: number, make: (r: () => number) => THREE.BufferGeometry, place: (r: () => number, i: number) => [number, number, number], size: (r: () => number) => number): THREE.BufferGeometry {
  const r = rand(seed), pos: number[] = [], nor: number[] = [], m = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion()
  for (let i = 0; i < count; i++) {
    const g = make(r).toNonIndexed(), s = size(r)
    e.set(r() * 6.28, r() * 6.28, r() * 6.28)
    m.compose(new THREE.Vector3(...place(r, i)), q.setFromEuler(e), new THREE.Vector3(s, s, s))
    g.applyMatrix4(m)
    g.computeVertexNormals()
    pos.push(...g.attributes.position.array)
    nor.push(...g.attributes.normal.array)
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  return out
}

const heapPlace = (rad: number, h: number) => (r: () => number): [number, number, number] => { const a = r() * 6.283, d = Math.sqrt(r()) * rad, top = h * Math.pow(1 - d / rad, 1.2); return [d * Math.cos(a), r() * top, d * Math.sin(a)] }

/** Grains over the surface of a heap, with a filled core below them. */
const surfacePlace = (rad: number, h: number) => (r: () => number): [number, number, number] => { const a = r() * 6.283, d = Math.sqrt(r()) * rad * (0.97 + 0.03 * Math.sin(a * 5) + 0.02 * Math.sin(a * 11)), top = h * Math.pow(Math.max(0, 1 - d / rad), 0.9); return [d * Math.cos(a), top * (0.86 + 0.14 * r()), d * Math.sin(a)] }

type Built = { geo: THREE.BufferGeometry; mat: THREE.MeshPhysicalMaterial; y: number }
function make(kind: SampleKind): Built {
  const bump = () => noiseTexture(256, 5, 6, 1.4, 1)
  const M = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p)
  switch (kind) {
    case 'sodium': {
      const geo = shape(new THREE.BoxGeometry(0.3, 0.2, 0.25, 40, 28, 34), v => { const k = Math.hypot(v.x / 0.15, v.y / 0.1, v.z / 0.125); return (1 / Math.pow(Math.max(k, 0.01), 0.28)) * (1 + 0.07 * n3(v.x * 11, v.y * 11, v.z * 11) + 0.02 * n3(v.x * 27, v.y * 27, v.z * 27)) })
      return { geo, y: 0.088, mat: M({ color: '#cfcbc4', metalness: 1, roughness: 0.38, envMapIntensity: 1.3 }) }
    }
    case 'magnesium': {
      // A coiled ribbon
      const pos: number[] = [], idx: number[] = [], N = 260, W = 0.05
      for (let i = 0; i <= N; i++) { const t = i / N, a = t * 15, r = 0.07 + 0.1 * t, wob = 0.008 * Math.sin(a * 5.3); const y = 0.02 + 0.05 * t + wob; pos.push((r + wob) * Math.cos(a), y, (r + wob) * Math.sin(a), (r - wob) * Math.cos(a), y + W, (r - wob) * Math.sin(a)); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2) } }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      geo.setIndex(idx)
      geo.computeVertexNormals()
      return { geo, y: 0.1, mat: M({ color: '#a5a5a6', metalness: 1, roughness: 0.42, side: THREE.DoubleSide }) }
    }
    case 'aluminium': {
      const g = new THREE.IcosahedronGeometry(0.15, 9), p = g.attributes.position, v = new THREE.Vector3()
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + 0.2 * Math.abs(n3(v.x * 34, v.y * 34, v.z * 34)) - 0.17 * Math.abs(n3(v.x * 61 + 2, v.y * 61, v.z * 61)); v.multiplyScalar(k); p.setXYZ(i, v.x, v.y * 0.8, v.z) }
      g.computeVertexNormals()
      return { geo: g, y: 0.11, mat: M({ color: '#dcdddf', metalness: 1, roughness: 0.2, flatShading: true }) }
    }
    case 'copper': {
      const geo = new THREE.BoxGeometry(0.52, 0.016, 0.4, 60, 1, 40), p = geo.attributes.position
      for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + 0.07 * Math.pow(p.getX(i) / 0.26, 2) + 0.004 * n3(p.getX(i) * 16, 1, p.getZ(i) * 16))
      geo.computeVertexNormals()
      return { geo, y: 0.014, mat: M({ color: '#c9744a', metalness: 1, roughness: 0.3, roughnessMap: bump() }) }
    }
    case 'mercury': {
      const pts: THREE.Vector2[] = []
      for (let i = 0; i <= 40; i++) { const a = (Math.PI / 2) * (1 - i / 40); const r = 0.36; pts.push(new THREE.Vector2(r - 0.05 + 0.05 * Math.cos(a) - (i === 0 ? r : 0) * 1, 0.045 * Math.sin(a) + 0.03)) }
      pts[0] = new THREE.Vector2(0, 0.078)
      for (let i = 1; i < 12; i++) pts.splice(i, 0, new THREE.Vector2((0.31 * i) / 12, 0.078 - 0.003 * (i / 12) ** 2))
      for (let i = 1; i <= 12; i++) { const a = -(Math.PI / 2.6) * (i / 12); pts.push(new THREE.Vector2(0.31 + 0.05 * Math.cos(a), 0.03 + 0.035 * Math.sin(a))) }
      return { geo: new THREE.LatheGeometry(pts.reverse(), 96), y: 0.002, mat: M({ color: '#e6e7ea', metalness: 1, roughness: 0.03, side: THREE.DoubleSide, envMapIntensity: 1.3 }) }
    }
    case 'bromine': return { geo: new THREE.CylinderGeometry(0.585, 0.57, 0.16, 96), y: 0.085, mat: M({ color: '#1c0301', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, ior: 1.66 }) }
    case 'iodine': return { geo: scatter(150, 5, () => new THREE.CylinderGeometry(1, 1, 0.16, 6), heapPlace(0.3, 0.16), r => 0.02 + 0.04 * r()), y: 0.02, mat: M({ color: '#1d1a24', metalness: 0.75, roughness: 0.24, flatShading: true }) }
    case 'sulfur': return { geo: scatter(170, 3, () => new THREE.OctahedronGeometry(1, 0), heapPlace(0.25, 0.22), r => 0.022 + 0.045 * r()), y: 0.02, mat: M({ color: '#d6b512', roughness: 0.34, clearcoat: 0.35, flatShading: true, sheen: 0.3 }) }
    case 'iron': return { geo: scatter(420, 8, r => new THREE.BoxGeometry(1, 0.25 + r(), 0.5), heapPlace(0.3, 0.17), r => 0.012 + 0.02 * r()), y: 0.02, mat: M({ color: '#4c4b4a', metalness: 0.9, roughness: 0.5, flatShading: true }) }
    case 'mix': {
      const N = 9500, geo = scatter(N, 8, () => new THREE.IcosahedronGeometry(1, 0), surfacePlace(0.36, 0.2), r => 0.0055 + 0.0065 * r())
      const per = geo.attributes.position.count / N, col = new Float32Array(N * per * 3), r = rand(4), iron = new THREE.Color('#3b3c3e'), sulfur = new THREE.Color('#c9ad25')
      for (let i = 0; i < N; i++) { const c = (r() < 0.55 ? iron : sulfur).clone().multiplyScalar(0.75 + 0.5 * r()); for (let j = 0; j < per; j++) col.set([c.r, c.g, c.b], (i * per + j) * 3) }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
      const mat = M({ color: '#ffffff', roughness: 0.85, flatShading: true, vertexColors: true })
      // The glow runs through the heap as a front, left to right.
      mat.userData.front = { value: -1 }
      mat.onBeforeCompile = s => {
        s.uniforms.uFront = mat.userData.front
        s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = position;')
        s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vP; uniform float uFront;').replace('#include <emissivemap_fragment>', 'float d = uFront - vP.x + 0.06 * sin(vP.z * 23.0) + 0.05 * sin(vP.z * 61.0 + vP.y * 40.0); totalEmissiveRadiance *= smoothstep(0.0, 0.06, d) * (1.0 - smoothstep(0.1, 0.5, d)) * (0.35 + 2.2 * vColor.r);')
      }
      return { geo, y: 0.02, mat }
    }
  }
}

/** `left` shrinks a sample as it is used. `turn` recolours it as a product forms on it. T makes it glow. */
export function Sample({ kind, position, scale = 1, left, T, turn }: { kind: SampleKind; position: [number, number, number]; scale?: number; left: number; T: number; turn?: { color: string; amount: number; matte?: boolean } }) {
  const b = useMemo(() => make(kind), [kind])
  const base = useMemo(() => ({ c: b.mat.color.clone(), metal: b.mat.metalness, rough: b.mat.roughness }), [b])
  const ref = useRef<THREE.Mesh>(null), k = useRef(left), tk = useRef(0), glow = useRef(0)
  const target = useMemo(() => new THREE.Color(turn?.color ?? '#000'), [turn?.color])
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05)
    k.current = THREE.MathUtils.damp(k.current, left, 0.9, dt)
    tk.current = THREE.MathUtils.damp(tk.current, turn?.amount ?? 0, 0.9, dt)
    // Visible glow starts near 798 K (Draper point).
    glow.current = THREE.MathUtils.damp(glow.current, Math.pow(Math.max(0, (T - 798) / 500), 1.6), 1.6, dt)
    const m = b.mat
    m.color.copy(base.c).lerp(target, tk.current)
    m.metalness = base.metal * (1 - (turn?.matte || kind === 'mix' ? tk.current : 0))
    m.roughness = base.rough + (0.8 - base.rough) * (turn?.matte ? tk.current : 0)
    m.emissive.copy(blackbody(Math.max(900, T)))
    m.emissiveIntensity = glow.current * (kind === 'mix' ? 2.4 : 0.7)
    const front = m.userData.front as { value: number } | undefined
    if (front) front.value = T > 1000 ? Math.min(1.2, front.value < -0.5 ? -0.45 : front.value + dt * 0.2) : -1
    if (ref.current) {
      ref.current.visible = k.current > 0.015
      const s = Math.cbrt(Math.max(k.current, 1e-4)) * scale
      if (kind === 'bromine') ref.current.scale.set(1, Math.max(0.02, k.current), 1)
      else ref.current.scale.setScalar(s)
    }
  })
  return <group position={position}><mesh ref={ref} geometry={b.geo} material={b.mat} position={[0, b.y * scale, 0]} castShadow receiveShadow /></group>
}
