import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { Look } from '../chem/reactions.ts'
import { blackbody, fireMaterial, gasMaterial, glassMaterial, noiseTexture, volumeUniforms, wavelength } from './materials.ts'
import { Sample, type SampleKind } from './Sample.tsx'

// Gas jar, in decimetre-like units shared with the approved concept renders.
const R = 0.62, H = 2.05, WALL = 0.016
const GLASS_LAYER = 1 // glass, gas and flame: left out of the depth pass

/** What an element or compound looks like in the vessel. Nothing listed means nothing visible. */
const GAS: Record<string, [number, number, number]> = { Cl: [0.12, 0.11, 0.55], Br: [0.32, 1.25, 2.3], I: [0.5, 1.0, 0.24] }
export const SOLID: Record<string, SampleKind> = { Na: 'sodium', Mg: 'magnesium', Al: 'aluminium', S: 'sulfur', Fe: 'iron', Cu: 'copper', Hg: 'mercury', Br: 'bromine', I: 'iodine' }

export type StageProps = {
  jar: string[]
  look: Look
  active: boolean // burning now
  /** Fraction left of each element's substance, 0 to 1. */
  left: Record<string, number>
  /** Fraction formed of each product, 0 to 1. */
  made: Record<string, number>
  T: number
  P: number
  label: string
}

const damp = THREE.MathUtils.damp

/** HDR render with bloom and AgX, plus a depth pass so smoke sits correctly behind and in front of solids. */
function Pipeline({ u }: { u: ReturnType<typeof volumeUniforms> }) {
  const { gl, scene, camera, size, viewport } = useThree()
  const dpr = viewport.dpr
  const depth = useMemo(() => { const t = new THREE.WebGLRenderTarget(4, 4); t.depthTexture = new THREE.DepthTexture(4, 4); return t }, [])
  const flat = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false }), [])
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }))
    c.addPass(new RenderPass(scene, camera))
    c.addPass(new UnrealBloomPass(new THREE.Vector2(4, 4), 0.3, 0.5, 1.7))
    c.addPass(new OutputPass())
    return c
  }, [gl, scene, camera])
  useEffect(() => {
    composer.setPixelRatio(dpr)
    composer.setSize(size.width, size.height)
    depth.setSize(Math.round(size.width * dpr), Math.round(size.height * dpr))
    u.uRes.value.set(Math.round(size.width * dpr), Math.round(size.height * dpr))
    u.uDepth.value = depth.depthTexture
  }, [composer, depth, size, dpr, u])
  useEffect(() => () => { composer.dispose(); depth.dispose(); flat.dispose() }, [composer, depth, flat])
  useFrame(() => {
    const bg = scene.background
    scene.overrideMaterial = flat
    scene.background = null
    camera.layers.set(0)
    gl.shadowMap.autoUpdate = false
    gl.setRenderTarget(depth)
    gl.clear()
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    scene.overrideMaterial = null
    scene.background = bg
    camera.layers.enable(GLASS_LAYER)
    gl.shadowMap.autoUpdate = true
    u.uProjInv.value.copy(camera.projectionMatrixInverse)
    camera.getWorldDirection(u.uFwd.value)
    composer.render()
  }, 1)
  return null
}

const v2 = (pts: [number, number][]) => pts.map(p => new THREE.Vector2(p[0], p[1]))
const wall = (r: number, a: number, b: number, n = 16): [number, number][] => Array.from({ length: n }, (_, i) => [r, a + ((b - a) * (i + 1)) / (n + 1)])

function Lathe({ pts, children, seg = 128, ...p }: { pts: [number, number][]; children: React.ReactNode; seg?: number } & Record<string, unknown>) {
  const geo = useMemo(() => new THREE.LatheGeometry(v2(pts), seg), [pts, seg])
  return <mesh geometry={geo} {...p}>{children}</mesh>
}

function Glass({ pts }: { pts: [number, number][] }) {
  const geo = useMemo(() => new THREE.LatheGeometry(v2(pts), 160), [pts])
  const [back, front] = useMemo(() => [glassMaterial(THREE.BackSide, 0.3), glassMaterial(THREE.FrontSide, 0.6)], [])
  return (
    <>
      <mesh geometry={geo} material={back} renderOrder={1} layers={GLASS_LAYER} />
      <mesh geometry={geo} material={front} renderOrder={6} layers={GLASS_LAYER} />
    </>
  )
}

/** Solid glass foot. Refracts the tile, which the thin walls do not need to do. */
function Base() {
  return (
    <>
      <Lathe pts={FOOT} layers={GLASS_LAYER} renderOrder={1}><meshPhysicalMaterial transmission={1} roughness={0.02} ior={1.47} thickness={0.12} attenuationColor="#cfe0d8" attenuationDistance={0.9} /></Lathe>
      <Lathe pts={RIM} layers={GLASS_LAYER} renderOrder={1}><meshPhysicalMaterial color="#20262a" roughness={0.03} transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} /></Lathe>
    </>
  )
}
const RIM: [number, number][] = [[R - 0.07, 0.004], [R - 0.03, 0.01], [R - 0.008, 0.03], [R - 0.004, 0.05]]
const FOOT: [number, number][] = [[0, 0.002], [R - 0.1, 0.002], [R - 0.04, 0.008], [R - 0.014, 0.026], [R - 0.003, 0.058], [R - WALL - 0.02, 0.064], [R - WALL - 0.06, 0.053], [0, 0.051]]
const JAR_OUT: [number, number][] = [[0, 0], [R - 0.1, 0], [R - 0.04, 0.006], [R - 0.012, 0.025], [R, 0.06], ...wall(R, 0.06, H - 0.1), [R, H - 0.1], [R + 0.05, H - 0.075], [R + 0.1, H - 0.06], [R + 0.12, H - 0.02], [R + 0.11, H], [R - WALL, H]]
const JAR_IN: [number, number][] = [[R - WALL, H], ...wall(R - WALL, H, 0.1), [R - WALL, 0.1], [R - WALL - 0.02, 0.066], [R - WALL - 0.06, 0.052], [0, 0.05]]
const LID: [number, number][] = [[0.05, H + 0.004], [R + 0.135, H + 0.004], [R + 0.145, H + 0.014], [R + 0.145, H + 0.048], [R + 0.135, H + 0.058], [0.05, H + 0.058]]
const SPOON: [number, number][] = [[0, 0.62], [0.1, 0.625], [0.17, 0.66], [0.205, 0.73], [0.215, 0.8], [0.205, 0.803], [0.19, 0.735], [0.155, 0.675], [0.09, 0.645], [0, 0.64]]
const BODY: [number, number][] = [[0, 0], [0.6, 0], [0.63, 0.012], [0.64, 0.04], ...wall(0.64, 0.04, 1.26, 6), [0.64, 1.26], [0.66, 1.3], [0.86, 1.3], [0.88, 1.32], [0.88, 1.46], [0.86, 1.48], [0, 1.48]]
const HEAD: [number, number][] = [[0, 1.485], [0.86, 1.485], [0.88, 1.505], [0.88, 1.65], [0.85, 1.68], [0.62, 1.7], [0.52, 1.75], [0.36, 1.81], [0.2, 1.85], [0, 1.87]]
const CRUC: [number, number][] = [[0, 0], [0.4, 0], [0.45, 0.014], [0.62, 0.14], [0.65, 0.165], [0.645, 0.18], [0.62, 0.172], [0.585, 0.15], [0.44, 0.052], [0, 0.045]]

function useMaps() {
  return useMemo(() => {
    const rough = noiseTexture(256, 5, 8, 1.2, 2), brushed = noiseTexture(256, 3, 48, 0.3, 1), film = noiseTexture(512, 6, 9, 1.5, 1)
    brushed.repeat.set(1, 40)
    return { rough, brushed, film }
  }, [])
}

function Studio({ dim }: { dim: React.RefObject<number> }) {
  const key = useRef<THREE.SpotLight>(null), fill = useRef<THREE.RectAreaLight>(null), back = useRef<THREE.SpotLight>(null)
  const maps = useMaps()
  const { scene } = useThree()
  // Seamless studio sweep: floor curving into the back wall.
  const cyc = useMemo(() => {
    const prof: [number, number][] = [[12, 0], [0, 0], [-3.5, 0], ...Array.from({ length: 24 }, (_, i): [number, number] => { const a = ((i + 1) / 24) * (Math.PI / 2); return [-3.5 - 5 * Math.sin(a), 5 - 5 * Math.cos(a)] }), [-8.5, 16]]
    const g = new THREE.PlaneGeometry(50, 1, 1, prof.length - 1), p = g.attributes.position
    for (let i = 0; i < p.count; i++) { const [z, y] = prof[Math.floor(i / 2)]; p.setXYZ(i, p.getX(i), y, z) }
    g.computeVertexNormals()
    return g
  }, [])
  useFrame(() => {
    const k = 1 - dim.current * 0.74
    scene.environmentIntensity = 0.75 * k
    if (key.current) key.current.intensity = 72 * k
    if (fill.current) fill.current.intensity = 1.5 * k
    if (back.current) back.current.intensity = 70 * k
  })
  return (
    <>
      <Environment files="./hdri/studio_small_09_1k.hdr" />
      <spotLight ref={key} position={[-3.4, 4.2, 2.2]} angle={0.5} penumbra={0.9} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.02} shadow-radius={9} color="#fff8ee" />
      <spotLight ref={back} position={[2.5, 5.5, -3]} angle={0.9} penumbra={1} target-position={[0, 2, -9]} color="#eef4ff" />
      <rectAreaLight ref={fill} position={[3.4, 2.6, 2]} width={1} height={3} rotation={[0, 1.05, 0]} />
      <mesh geometry={cyc} position={[0, -0.103, 0]} receiveShadow>
        <meshStandardMaterial color="#8b8f93" roughness={0.6} roughnessMap={maps.rough} envMapIntensity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.052, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.1, 0.1, 2.1]} />
        <meshStandardMaterial color="#c4c3c0" roughness={0.34} />
      </mesh>
    </>
  )
}

function Deposit({ amount, color, radius, y, film }: { amount: React.RefObject<number>; color: string; radius: number; y: number; film: number }) {
  const maps = useMaps()
  const bed = useRef<THREE.Mesh>(null), mat = useRef<THREE.MeshStandardMaterial>(null)
  const geo = useMemo(() => {
    const NR = 40, NA = 128, pos: number[] = [0, 1, 0], idx: number[] = []
    for (let a = 1; a <= NR; a++) for (let b = 0; b < NA; b++) {
      const th = (2 * Math.PI * b) / NA, r = (radius * a) / NR
      const h = 0.55 + 0.3 * Math.min(1, a / 14) * Math.sin(7 * r + 2 * Math.cos(2 * th)) * Math.cos(3 * th + 5 * r) + 0.16 * Math.min(1, a / 14) * Math.sin(b * 12.9898 + a * 78.233) * Math.sin(a * 3.7 + b * 1.3)
      pos.push(r * Math.cos(th), h * (1 - 0.6 * Math.pow(a / NR, 6)), r * Math.sin(th))
    }
    for (let b = 0; b < NA; b++) idx.push(0, 1 + ((b + 1) % NA), 1 + b)
    for (let a = 0; a < NR - 1; a++) for (let b = 0; b < NA; b++) { const q = 1 + a * NA, n = (b + 1) % NA; idx.push(q + b, q + n, q + NA + b, q + n, q + NA + n, q + NA + b) }
    const out = new THREE.BufferGeometry()
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    out.setIndex(idx)
    out.computeVertexNormals()
    return out
  }, [radius])
  useFrame(() => {
    const a = amount.current
    if (bed.current) { bed.current.visible = a > 0.02; bed.current.scale.y = Math.max(0.001, 0.07 * a) }
    if (mat.current) mat.current.opacity = film * a
  })
  return (
    <>
      <mesh ref={bed} geometry={geo} position={[0, y, 0]} receiveShadow><meshStandardMaterial color={color} roughness={0.95} /></mesh>
      {film > 0 && (
        <mesh position={[0, H / 2 + 0.02, 0]} renderOrder={5} layers={GLASS_LAYER}>
          <cylinderGeometry args={[R - WALL - 0.004, R - WALL - 0.004, H - 0.12, 128, 1, true]} />
          <meshStandardMaterial ref={mat} color={color} roughness={1} transparent alphaMap={maps.film} side={THREE.DoubleSide} depthWrite={false} opacity={0} />
        </mesh>
      )}
    </>
  )
}

function Drops({ amount }: { amount: React.RefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const mat = useMemo(() => glassMaterial(THREE.FrontSide, 1.6), [])
  const N = 320
  const at = useMemo(() => Array.from({ length: N }, (_, i) => { const f = (k: number) => { const s = Math.sin(i * 91.7 + k * 47.3) * 43758.5; return s - Math.floor(s) }; return { a: f(1) * 6.283, y: 0.15 + f(2) * (H - 0.35), s: 0.007 + 0.022 * f(3) ** 3, t: f(4) } }), [])
  const o = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const m = ref.current
    if (!m) return
    at.forEach((d, i) => {
      const k = THREE.MathUtils.smoothstep(amount.current * 1.6 - d.t * 0.6, 0, 1)
      o.position.set((R - WALL - 0.004) * Math.cos(d.a), d.y, (R - WALL - 0.004) * Math.sin(d.a))
      o.scale.set(d.s * k + 1e-5, d.s * 1.25 * k + 1e-5, d.s * k + 1e-5)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[undefined, undefined, N]} material={mat} renderOrder={5} layers={GLASS_LAYER} frustumCulled={false}><sphereGeometry args={[1, 14, 10]} /></instancedMesh>
}

function Steel(props: { brushed?: THREE.Texture }) {
  return <meshStandardMaterial color="#b4b6b8" metalness={1} roughness={props.brushed ? 0.85 : 0.34} roughnessMap={props.brushed} />
}

function Autoclave({ P }: { P: number }) {
  const maps = useMaps()
  const needle = useRef<THREE.Group>(null)
  const ang = (p: number) => THREE.MathUtils.degToRad(-135 + (270 * Math.min(p, 250)) / 250)
  useFrame((_, dt) => { if (needle.current) needle.current.rotation.z = damp(needle.current.rotation.z, -ang(P), 5, dt) })
  const bolts = Array.from({ length: 10 }, (_, i) => (2 * Math.PI * i) / 10 + 0.15)
  return (
    <group>
      <Lathe pts={BODY} castShadow receiveShadow><Steel brushed={maps.brushed} /></Lathe>
      <Lathe pts={HEAD} castShadow receiveShadow><Steel brushed={maps.brushed} /></Lathe>
      {bolts.map(a => (
        <group key={a} position={[0.76 * Math.cos(a), 0, 0.76 * Math.sin(a)]}>
          <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.035, 0.035, 0.56, 24]} /><Steel /></mesh>
          {[1.265, 1.715].map(y => <mesh key={y} position={[0, y, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.07, 6]} /><Steel /></mesh>)}
        </group>
      ))}
      <mesh position={[0, 2.05, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.46, 32]} /><Steel /></mesh>
      <mesh position={[0, 2.26, 0]} castShadow><cylinderGeometry args={[0.085, 0.085, 0.1, 6]} /><Steel /></mesh>
      <mesh position={[0.25, 2.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.5, 24]} /><Steel /></mesh>
      <group position={[0.64, 2.1, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.19, 0.19, 0.09, 64]} /><Steel /></mesh>
        <mesh position={[0, 0, 0.046]}><circleGeometry args={[0.168, 64]} /><meshStandardMaterial color="#eceae4" roughness={0.6} /></mesh>
        {Array.from({ length: 11 }, (_, i) => { const a = ang(i * 25); return <mesh key={i} position={[0.14 * Math.sin(a), 0.14 * Math.cos(a), 0.049]} rotation={[0, 0, -a]}><boxGeometry args={[0.006, i % 2 ? 0.018 : 0.03, 0.002]} /><meshBasicMaterial color="#15181b" /></mesh> })}
        <group ref={needle} position={[0, 0, 0.053]} rotation={[0, 0, -ang(P)]}>
          <mesh position={[0, 0.045, 0]}><boxGeometry args={[0.009, 0.15, 0.003]} /><meshBasicMaterial color="#15181b" /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.016, 0.016, 0.008, 24]} /><meshBasicMaterial color="#15181b" /></mesh>
        </group>
      </group>
    </group>
  )
}

const POWDER: Record<string, { color: string; film: number }> = { NaCl: { color: '#f4f4f2', film: 0.5 }, MgO: { color: '#f7f7f7', film: 0.36 }, AlBr3: { color: '#ece6da', film: 0.4 }, HgO: { color: '#8c2408', film: 0 } }

function Contents(p: StageProps) {
  const { jar, look, active, left, made, T } = p
  const u = useMemo(() => volumeUniforms(R - WALL - 0.006, 0.055, H - 0.005), [])
  const [gas, fire] = useMemo(() => [gasMaterial(u), fireMaterial(u)], [u])
  useEffect(() => () => { gas.dispose(); fire.dispose() }, [gas, fire])
  const since = useRef(0), dim = useRef(0), powder = useRef(0), drops = useRef(0), flame = useRef<THREE.PointLight>(null), spoon = useRef<THREE.Group>(null)
  const has = (e: string) => jar.includes(e)
  const lightCol = useMemo(() => (look.light?.nm ? wavelength(look.light.nm) : blackbody(look.light?.K ?? 1500)), [look])
  const crucible = look.vessel === 'crucible', glassVessel = look.vessel === 'jar'
  const powderKey = Object.keys(POWDER).find(k => k in made)
  const calm = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), t = clock.elapsedTime, U = u
    if (!calm) U.uTime.value += dt
    const abs = [0, 0, 0]
    for (const e of jar) {
      const g = GAS[e]
      if (!g) continue
      // Bromine and iodine vapour depend on temperature; chlorine is always a gas here.
      const vapour = e === 'I' ? THREE.MathUtils.smoothstep(T, 330, 460) : 1
      for (let i = 0; i < 3; i++) abs[i] += g[i] * vapour * (left[e] ?? 1)
    }
    const a = U.uAbsorb.value
    a.set(damp(a.x, abs[0], 1.1, dt), damp(a.y, abs[1], 1.1, dt), damp(a.z, abs[2], 1.1, dt))
    if (!active) since.current = t
    const power = active && look.light ? look.light.power * (look.flash ? Math.exp(-(t - since.current) * 2.4) : 1) : 0
    const flick = calm ? 1 : 0.9 + 0.1 * Math.sin(t * 13.1) * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 23)
    U.uFlame.value = damp(U.uFlame.value, power, power ? 2.6 : 3.5, dt)
    U.uSmoke.value = damp(U.uSmoke.value, active ? (look.smoke ?? 0) : 0, active ? 0.9 : 0.5, dt)
    U.uTall.value = look.light?.tall ?? 1
    U.uOpen.value = crucible ? 1 : 0
    U.uFlameCol.value.copy(lightCol)
    dim.current = damp(dim.current, Math.min(1, U.uFlame.value * 1.1) * (crucible ? 0.9 : 0.8), 4, dt)
    U.uStudio.value = 1 - dim.current * 0.74
    const sy = look.lower && (active || (made.AlBr3 ?? 0) > 0) ? -0.42 : 0
    if (spoon.current) spoon.current.position.y = damp(spoon.current.position.y, sy, 2.2, dt)
    U.uFlamePos.value.y = crucible ? 0.2 : 0.74 + (spoon.current?.position.y ?? 0)
    if (look.electrodes) U.uFlamePos.value.y = 1.0
    if (flame.current) {
      flame.current.intensity = U.uFlame.value * 5.5 * flick
      flame.current.position.copy(U.uFlamePos.value).y += 0.26
      flame.current.color.copy(lightCol)
    }
    powder.current = damp(powder.current, powderKey ? made[powderKey] : 0, 0.8, dt)
    drops.current = damp(drops.current, made.H2O ?? 0, 0.9, dt)
  })

  const solids = jar.filter(e => SOLID[e])
  const both = has('Fe') && has('S')
  const at = (e: string): [number, number, number] => {
    if (crucible) return [0, 0.045, 0]
    if (e === 'Br' || e === 'Hg' || e === 'I') return [0, 0.052, 0]
    return look.spoon ? [0, 0.665, 0] : [solids.indexOf(e) ? 0.24 : solids.length > 1 ? -0.24 : 0, 0.055, 0]
  }
  return (
    <>
      <Studio dim={dim} />
      <Pipeline u={u} />
      <pointLight ref={flame} intensity={0} distance={14} decay={2} />
      {glassVessel && (
        <>
          <Glass pts={JAR_OUT} /><Glass pts={JAR_IN} /><Glass pts={LID} /><Base />
          <mesh position={[0, H + 0.07, 0]} castShadow><cylinderGeometry args={[0.1, 0.085, 0.18, 48]} /><meshStandardMaterial color="#26282a" roughness={0.7} /></mesh>
          <mesh material={gas} renderOrder={2} layers={GLASS_LAYER} position={[0, H / 2 + 0.025, 0]}><cylinderGeometry args={[R - WALL - 0.006, R - WALL - 0.006, H - 0.06, 64]} /></mesh>
          <mesh material={fire} renderOrder={3} layers={GLASS_LAYER} position={[0, H / 2 + 0.025, 0]}><cylinderGeometry args={[R - WALL - 0.006, R - WALL - 0.006, H - 0.06, 64]} /></mesh>
        </>
      )}
      {crucible && (
        <>
          <Lathe pts={CRUC} castShadow receiveShadow><meshPhysicalMaterial color="#dedbd4" roughness={0.45} clearcoat={0.4} side={THREE.DoubleSide} /></Lathe>
          <mesh material={fire} renderOrder={3} layers={GLASS_LAYER} position={[0, H / 2 + 0.025, 0]}><cylinderGeometry args={[R - 0.02, R - 0.02, H - 0.06, 64]} /></mesh>
        </>
      )}
      {look.vessel === 'steel' && <Autoclave P={p.P} />}
      {look.electrodes && glassVessel && [-0.1, 0.1].map(x => (
        <group key={x}>
          <mesh position={[x * 0.35, 1.85, 0]}><cylinderGeometry args={[0.012, 0.012, 1.5, 16]} /><Steel /></mesh>
          <mesh position={[x * 0.35, 1.06, 0]}><sphereGeometry args={[0.02, 24, 16]} /><Steel /></mesh>
        </group>
      ))}
      <group ref={spoon}>
        {look.spoon && glassVessel && (
          <>
            <mesh position={[0, 1.78, 0]} castShadow><cylinderGeometry args={[0.018, 0.018, 1.96, 24]} /><Steel /></mesh>
            <mesh position={[0.1, 0.81, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.016, 0.016, 0.22, 24]} /><Steel /></mesh>
            <mesh position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.06, 0.016, 16, 48]} /><Steel /></mesh>
            <Lathe pts={SPOON} castShadow><meshStandardMaterial color="#9a9c9e" metalness={1} roughness={0.32} side={THREE.DoubleSide} /></Lathe>
          </>
        )}
        {look.spoon && solids.filter(e => !['Br', 'Hg', 'I'].includes(e)).map(e => <Sample key={e} kind={SOLID[e]} position={at(e)} scale={['S', 'Fe'].includes(e) ? 0.6 : 0.95} left={left[e] ?? 1} T={active ? 1100 : 300} />)}
      </group>
      {solids.filter(e => !look.spoon || ['Br', 'Hg', 'I'].includes(e)).map(e => both && e === 'S' ? null : (
        <Sample key={e} kind={both ? 'mix' : SOLID[e]} position={at(e)} scale={1}
          left={e === 'I' ? Math.min(left.I ?? 1, 1 - THREE.MathUtils.smoothstep(T, 345, 460)) : crucible ? 1 : (left[e] ?? 1)}
          T={crucible ? (active && both ? 1250 : made.CuO || made.Cu2O || active ? T : 300) : 300}
          turn={both ? { color: '#14120f', amount: made.FeS ?? 0 } : e === 'Cu' ? { color: (made.CuO ?? 0) >= (made.Cu2O ?? 0) ? '#0c0b0b' : '#8a2417', amount: Math.max(made.CuO ?? 0, made.Cu2O ?? 0), matte: true } : undefined} />
      ))}
      {glassVessel && powderKey && <Deposit key={powderKey} amount={powder} color={POWDER[powderKey].color} film={POWDER[powderKey].film} radius={R - WALL - 0.07} y={0.053} />}
      {glassVessel && <Drops amount={drops} />}
    </>
  )
}

export function Stage(p: StageProps) {
  const close = p.look.vessel === 'crucible'
  return (
    <div role="img" aria-label={p.label} style={{ position: 'absolute', inset: 0 }}>
      <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ position: close ? [0.9, 1.75, 3.6] : [1.2, 2.1, 7.2], fov: 27, near: 0.5, far: 60 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95, antialias: false, powerPreference: 'high-performance' }}>
        <Contents {...p} />
        <OrbitControls target={[0, close ? 0.2 : 1.22, 0]} enablePan={false} minDistance={2.4} maxDistance={9} minPolarAngle={0.5} maxPolarAngle={1.53} minAzimuthAngle={-1.2} maxAzimuthAngle={1.2} enableDamping />
      </Canvas>
    </div>
  )
}

/** One element's sample on the white tile. */
export function SampleStage({ el, T, label }: { el: string; T: number; label: string }) {
  const gasOnly = !SOLID[el]
  return (
    <div role="img" aria-label={label} style={{ position: 'absolute', inset: 0 }}>
      <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ position: gasOnly || el === 'Br' || el === 'I' ? [1.35, 2.15, 7.4] : [1.1, 1.5, 3.1], fov: 27, near: 0.3, far: 60 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95, antialias: false }}>
        <Contents jar={[el]} look={{ vessel: gasOnly || el === 'Br' || el === 'I' ? 'jar' : 'none' }} active={false} left={{}} made={{}} T={T} P={1} label={label} />
        <OrbitControls target={[0, gasOnly || el === 'Br' || el === 'I' ? 1.22 : 0.18, 0]} enablePan={false} minDistance={1.6} maxDistance={9} maxPolarAngle={1.53} enableDamping />
      </Canvas>
    </div>
  )
}
