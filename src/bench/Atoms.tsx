import { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { build, COLORS, type Atom } from '../chem/structures.ts'

function Set({ atoms, show }: { atoms: Atom[]; show: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null), k = useRef(show ? 1 : 0)
  const o = useMemo(() => new THREE.Object3D(), [])
  const order = useMemo(() => { const lo = Math.min(...atoms.map(a => a.p[2])), hi = Math.max(...atoms.map(a => a.p[2])); return atoms.map(a => (a.p[2] - lo) / Math.max(hi - lo, 1)) }, [atoms])
  const write = () => {
    const m = ref.current
    if (!m) return
    atoms.forEach((a, i) => {
      const s = a.r * THREE.MathUtils.smoothstep(k.current * 1.5 - order[i] * 0.5, 0, 1)
      o.position.set(a.p[0], a.p[2], -a.p[1])
      o.scale.setScalar(Math.max(s, 1e-4))
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }
  useLayoutEffect(() => {
    const c = new THREE.Color()
    atoms.forEach((a, i) => ref.current?.setColorAt(i, c.set(COLORS[a.e])))
    if (ref.current?.instanceColor) ref.current.instanceColor.needsUpdate = true
    write()
  }, [atoms])
  useFrame((_, dt) => {
    const next = THREE.MathUtils.damp(k.current, show ? 1 : 0, 2.4, Math.min(dt, 0.05))
    if (Math.abs(next - k.current) > 1e-5) { k.current = next; write() }
  })
  return <instancedMesh ref={ref} args={[undefined, undefined, atoms.length]} frustumCulled={false} castShadow receiveShadow><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial roughness={0.4} /></instancedMesh>
}

export function Atoms({ before, after, done, label }: { before: string[]; after: string[]; done: boolean; label: string }) {
  const b = useMemo(() => build(before), [before.join()]), a = useMemo(() => build(after), [after.join()])
  return (
    <div role="img" aria-label={label} style={{ position: 'absolute', inset: 0 }}>
      <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ position: [19, 14, 36], fov: 34, near: 1, far: 200 }} gl={{ toneMapping: THREE.AgXToneMapping }}>
        <color attach="background" args={['#a4a8ac']} />
        <Environment files="./hdri/studio_small_09_1k.hdr" environmentIntensity={0.55} />
        <directionalLight position={[-18, 30, 18]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-normalBias={0.08} />
        <Set atoms={b.atoms} show={!done} />
        <Set atoms={a.atoms} show={done} />
        <OrbitControls enablePan={false} minDistance={16} maxDistance={70} enableDamping />
      </Canvas>
    </div>
  )
}
