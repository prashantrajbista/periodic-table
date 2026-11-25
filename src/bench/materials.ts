import * as THREE from 'three'

/** Colour of a hot body (K), linear RGB, brightest channel 1. Tanner Helland's fit. */
export function blackbody(K: number): THREE.Color {
  const t = Math.min(40000, Math.max(800, K)) / 100
  const c = (v: number) => Math.min(255, Math.max(0, v)) / 255
  const r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332)
  const g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755)
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04
  return new THREE.Color().setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace)
}

/** Colour of one wavelength (nm), linear sRGB clipped to gamut, brightest channel 1. CIE fit by Wyman et al. 2013. */
export function wavelength(nm: number): THREE.Color {
  const g = (m: number, s1: number, s2: number) => Math.exp(-0.5 * ((nm - m) * (nm < m ? s1 : s2)) ** 2)
  const X = 0.362 * g(442, 0.0624, 0.0374) + 1.056 * g(599.8, 0.0264, 0.0323) - 0.065 * g(501.1, 0.049, 0.0382)
  const Y = 0.821 * g(568.8, 0.0213, 0.0247) + 0.286 * g(530.9, 0.0613, 0.0322)
  const Z = 1.217 * g(437, 0.0845, 0.0278) + 0.681 * g(459, 0.0385, 0.0725)
  const rgb = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z].map(v => Math.max(0, v))
  // Camera-like channel overlap, so the sodium line reads yellow-orange as it does in photographs.
  rgb[1] += 0.17 * rgb[0]
  rgb[2] += 0.02 * rgb[1]
  const m = Math.max(...rgb)
  return new THREE.Color(rgb[0] / m, rgb[1] / m, rgb[2] / m)
}

/**
 * Thin laboratory glass: reflections add on top of what is behind, with edges that absorb more.
 * three's own transmission pass skips transparent objects, which would hide the gas and flame.
 */
export function glassMaterial(side: THREE.Side, strength = 1): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x000000, roughness: 0.02, ior: 1.47, transparent: true, opacity: 0.02, side, depthWrite: false, envMapIntensity: 1.1 * strength,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  })
  m.onBeforeCompile = s => {
    s.fragmentShader = s.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
      gl_FragColor.a = clamp(0.015 + 0.72 * pow(rim, 5.0), 0.0, 1.0);`)
  }
  return m
}

const hash = (n: number) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s) }

let tex: THREE.Data3DTexture | null = null
/** Tileable 3D value noise, three octaves. */
export function noise3D(): THREE.Data3DTexture {
  if (tex) return tex
  const N = 48, out = new Uint8Array(N * N * N)
  const oct = (x: number, y: number, z: number, f: number) => {
    const q = (v: number) => { const i = Math.floor(v), t = v - i; return [((i % f) + f) % f, (i + 1) % f, t * t * (3 - 2 * t)] as const }
    const [x0, x1, u] = q(x * f), [y0, y1, v] = q(y * f), [z0, z1, w] = q(z * f)
    const h = (a: number, b: number, c: number) => hash(a * 12.99 + b * 78.23 + c * 37.72 + f * 3.1)
    const L = (a: number, b: number, t: number) => a + (b - a) * t
    return L(L(L(h(x0, y0, z0), h(x1, y0, z0), u), L(h(x0, y1, z0), h(x1, y1, z0), u), v), L(L(h(x0, y0, z1), h(x1, y0, z1), u), L(h(x0, y1, z1), h(x1, y1, z1), u), v), w)
  }
  for (let k = 0, i = 0; k < N; k++) for (let j = 0; j < N; j++) for (let l = 0; l < N; l++, i++) {
    const x = l / N, y = j / N, z = k / N
    out[i] = 255 * (0.53 * oct(x, y, z, 4) + 0.3 * oct(x, y, z, 8) + 0.17 * oct(x, y, z, 16))
  }
  tex = new THREE.Data3DTexture(out, N, N, N)
  tex.format = THREE.RedFormat
  tex.minFilter = tex.magFilter = THREE.LinearFilter
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}

/** Greyscale canvas noise for roughness, bump and alpha maps. */
export function noiseTexture(size = 256, octaves = 5, base = 6, contrast = 1, repeat = 1): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!, img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, a = 0.5, t = 0
    for (let o = 0, f = base; o < octaves; o++, f *= 2, a *= 0.5) {
      const px = (x / size) * f, py = (y / size) * f, i = Math.floor(px), j = Math.floor(py), s = (n: number) => n * n * (3 - 2 * n)
      const u = s(px - i), w = s(py - j), h = (p: number, q: number) => hash((p % f) * 27.1 + (q % f) * 61.7 + f)
      v += a * ((h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - w) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * w)
      t += a
    }
    const g = Math.max(0, Math.min(255, ((v / t - 0.5) * contrast + 0.5) * 255))
    img.data.set([g, g, g, 255], (y * size + x) * 4)
  }
  ctx.putImageData(img, 0, 0)
  const tx = new THREE.CanvasTexture(c)
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping
  tx.repeat.set(repeat, repeat)
  return tx
}

const CYL = /* glsl */ `
  uniform float uR, uY0, uY1; uniform sampler2D uDepth; uniform vec2 uRes; uniform mat4 uProjInv; uniform vec3 uFwd;
  varying vec3 vW;
  // Enter and leave distances through an upright cylinder, stopped at solid objects.
  vec2 span(vec3 o, vec3 d) {
    float a = max(dot(d.xz, d.xz), 1e-6), b = dot(o.xz, d.xz), c = dot(o.xz, o.xz) - uR * uR, h = b * b - a * c;
    if (h < 0.0) return vec2(1.0, 0.0);
    h = sqrt(h);
    float t0 = (-b - h) / a, t1 = (-b + h) / a;
    float y0 = (uY0 - o.y) / d.y, y1 = (uY1 - o.y) / d.y;
    t0 = max(max(t0, min(y0, y1)), 0.0); t1 = min(t1, max(y0, y1));
    float z = texture2D(uDepth, gl_FragCoord.xy / uRes).x;
    if (z < 1.0) {
      vec4 v = uProjInv * vec4(gl_FragCoord.xy / uRes * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
      t1 = min(t1, (-v.z / v.w) / dot(d, uFwd));
    }
    return vec2(t0, t1);
  }`
const VERT = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`

export type VolumeUniforms = ReturnType<typeof volumeUniforms>
export function volumeUniforms(R: number, y0: number, y1: number) {
  return {
    uR: { value: R }, uY0: { value: y0 }, uY1: { value: y1 }, uDepth: { value: null as THREE.Texture | null }, uRes: { value: new THREE.Vector2(1, 1) },
    uProjInv: { value: new THREE.Matrix4() }, uFwd: { value: new THREE.Vector3() }, uTime: { value: 0 },
    uAbsorb: { value: new THREE.Vector3() }, uSmoke: { value: 0 }, uFlame: { value: 0 }, uFlameCol: { value: new THREE.Color(1, 0.5, 0.05) },
    uFlamePos: { value: new THREE.Vector3(0, 0.75, 0) }, uTall: { value: 1 }, uOpen: { value: 0 }, uStudio: { value: 1 }, uNoise: { value: noise3D() },
  }
}

/** Coloured gas: multiplies what is behind it by exp(-absorption x path). */
export const gasMaterial = (uniforms: VolumeUniforms) => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT, side: THREE.BackSide, transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
  fragmentShader: CYL + `uniform vec3 uAbsorb;
  void main(){ vec3 d = normalize(vW - cameraPosition); vec2 s = span(cameraPosition, d);
    gl_FragColor = vec4(exp(-uAbsorb * max(s.y - s.x, 0.0) / uR), 1.0); }`,
})

/** Smoke that scatters studio and flame light, plus a glowing flame. Ray marched. */
export const fireMaterial = (uniforms: VolumeUniforms) => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT, side: THREE.BackSide, transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  fragmentShader: CYL + `
  precision highp sampler3D;
  uniform sampler3D uNoise; uniform float uTime, uSmoke, uFlame, uTall, uStudio, uOpen; uniform vec3 uFlameCol, uFlamePos;
  float n3(vec3 p){ return texture(uNoise, p).r; }
  void main(){
    if (uSmoke + uFlame < 0.003) discard;
    vec3 d = normalize(vW - cameraPosition); vec2 s = span(cameraPosition, d);
    if (s.y <= s.x) discard;
    const int N = 44;
    float dt = (s.y - s.x) / float(N);
    float jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 L = vec3(0.0); float T = 1.0;
    for (int i = 0; i < N; i++) {
      vec3 p = cameraPosition + d * (s.x + (float(i) + jit) * dt);
      // swirl: gas rises on the axis and turns over near the lid
      float a = 0.35 * sin(p.y * 2.3 + uTime * 0.3); mat2 r = mat2(cos(a), -sin(a), sin(a), cos(a));
      vec3 q = p; q.xz = r * q.xz;
      float w = n3(q * 0.42 + vec3(0.0, -uTime * 0.05, 0.0));
      float f = n3(q * vec3(0.62, 0.42, 0.62) + w * 0.55 + vec3(0.03 * uTime, -0.09 * uTime, 0.0));
      float smoke = uSmoke * 2.1 * smoothstep(0.36, 0.8, f) * mix(0.55, 1.25, smoothstep(uY0, uY1, p.y));
      if (uOpen > 0.5) smoke *= (1.0 - smoothstep(0.05, 0.2 + 0.3 * p.y, length(p.xz + 0.2 * (f - 0.5)))) * (1.0 - smoothstep(0.35, 1.5, p.y));
      vec3 rel = p - uFlamePos;
      float ht = rel.y / (0.62 * uTall);
      float fl = 0.0;
      if (uFlame > 0.003 && ht > -0.12 && ht < 1.25) {
        vec3 fp = rel * vec3(1.5, 0.85, 1.5) - vec3(0.0, uTime * 1.15, 0.0);
        float wob = n3(fp * 0.75) - n3(fp * 0.75 + 0.5), wob2 = n3(fp * 0.75 + 0.27) - n3(fp * 0.75 + 0.77);
        vec2 ax = rel.xz + vec2(wob, wob2) * 0.2 * clamp(ht, 0.0, 1.0);
        float width = 0.165 * (0.55 + 0.75 * smoothstep(-0.12, 0.18, ht)) * (1.0 - smoothstep(0.15, 1.15, ht + wob * 0.5));
        float rr = length(ax) / max(width, 1e-3);
        fl = exp(-rr * rr * 1.7) * smoothstep(-0.12, 0.02, ht) * (0.6 + 0.9 * n3(fp * 1.3)) * step(1e-3, width);
      }
      float dist2 = dot(rel - vec3(0.0, 0.2, 0.0), rel - vec3(0.0, 0.2, 0.0));
      vec3 inL = vec3(0.62, 0.63, 0.65) * uStudio * (0.7 + 0.5 * smoothstep(-0.6, 0.6, -p.x)) + uFlameCol * uFlame * 0.2 / (0.1 + dist2 * 2.2);
      float st = smoke * dt;
      L += T * (inL * 0.9 * st + uFlameCol * fl * uFlame * 17.0 * dt + mix(uFlameCol, vec3(1.0), 0.22) * pow(fl, 3.0) * uFlame * 16.0 * dt * dot(uFlameCol, vec3(0.34)));
      T *= exp(-st);
      if (T < 0.02) break;
    }
    gl_FragColor = vec4(L, 1.0 - T);
  }`,
})
