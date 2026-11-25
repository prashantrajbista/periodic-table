import { Component, lazy, Suspense, type ReactNode } from 'react'

export const Stage = lazy(() => import('./bench/Stage.tsx').then(m => ({ default: m.Stage })))
export const SampleStage = lazy(() => import('./bench/Stage.tsx').then(m => ({ default: m.SampleStage })))
export const Atoms = lazy(() => import('./bench/Atoms.tsx').then(m => ({ default: m.Atoms })))

const ok = (() => { try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false } })()
const Off = () => <div className="nogl"><p>This browser can’t show the 3D view. Turn on hardware acceleration or try another browser. The numbers still work.</p></div>

class Guard extends Component<{ children: ReactNode }, { bad: boolean }> {
  state = { bad: false }
  static getDerivedStateFromError() { return { bad: true } }
  componentDidCatch(e: unknown) { console.error(e) }
  render() { return this.state.bad ? <Off /> : this.props.children }
}
/** 3D view with a fallback, so the rest of the page never depends on WebGL. */
export const GL = ({ children }: { children: ReactNode }) => (ok ? <Guard><Suspense fallback={<div className="nogl"><p>Loading 3D view</p></div>}>{children}</Suspense></Guard> : <Off />)
