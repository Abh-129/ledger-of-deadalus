import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export const COL = {
  night: '#0A121C', deepSea: '#10283A', lapis: '#2457A0', ochre: '#E0A73E', red: '#B3372B',
  limestone: '#E8E1D2', ink: '#15110E', olive: '#6F7A4E', dim: '#8A97A6', wood: '#8a5a34', skin: '#7a5a45',
};
// Every colour, light and fog value chambers use. Direction C, Moonlit Lapis (T5).
export const LOOK = {
  stone: { wall: '#3A5F7E', floor: '#2F5472', ceiling: '#16273A', ambient: 0.9, hemiSky: '#C9D6E8', hemiGround: '#10283A', fog: '#10283A', fogDensity: 0.03, minAmbient: 0.85 },
  moon: { color: '#C9D6E8', intensity: 26, distance: 10 },
  craft: { color: COL.ochre, emissive: 2.2 },
  cost: { color: '#D4584A', intensity: 26, distance: 10, shaft: { intensity: 80, distance: 16, angle: 0.5, penumbra: 0.6, attenuation: 9, anglePower: 5, opacity: 0.5 } },
  sun: { color: '#F4F8FF', intensity: 900, distance: 15, angle: 0.13, penumbra: 0.4, attenuation: 14, anglePower: 3, opacity: 0.55 },
  dawn: { key: { color: '#E8E1D2', min: 0.6, range: 2.2 }, hemi: { sky: '#e8c9a0', ground: '#8f7a5c', intensity: 1.3 } },
  sky: { day: ['#6f9fd6', '#a9c8e8', '#e8e1d2'] as [string, string, string], dawn: ['#16304a', '#8a97a6', '#e8c9a0'] as [string, string, string] },
  fresco: { plaster: '#E8E1D2', line: '#15110E', blue: '#2457A0', earth: '#8f7a5c', skin: '#a98a6c', skinPale: '#d6c8b0', green: '#6F7A4E', sea: '#10283A', pxPerM: 256 },
};
// >1 so the bloom pass picks up ochre emissives (warm light = Daedalus's craft)
export const GLOW = new THREE.Color(COL.ochre).multiplyScalar(2.2);
export const RED_GLOW = new THREE.Color(COL.red).multiplyScalar(2.4);

// 4-band gradient for toon shading
export const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([60, 120, 190, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();

type Shape = 'box' | 'cyl' | 'sphere' | 'cone' | 'torus';
export interface PrimProps {
  shape?: Shape; args?: number[]; color?: string; emissive?: string; glow?: boolean; outline?: boolean;
  pos?: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number] | number;
  wire?: boolean; opacity?: number; children?: React.ReactNode;
}
function Geo({ shape, args }: { shape: Shape; args?: number[] }) {
  const a = args as never;
  switch (shape) {
    case 'cyl': return <cylinderGeometry args={a ?? [0.5, 0.5, 1, 12]} />;
    case 'sphere': return <sphereGeometry args={a ?? [0.5, 14, 10]} />;
    case 'cone': return <coneGeometry args={a ?? [0.5, 1, 10]} />;
    case 'torus': return <torusGeometry args={a ?? [0.5, 0.05, 6, 20]} />;
    default: return <boxGeometry args={a ?? [1, 1, 1]} />;
  }
}
/** Flat-shaded toon mesh with an inverted-hull outline in fresco black. */
export function Prim({ shape = 'box', args, color = COL.limestone, emissive, glow, outline = true, pos, rot, scale, wire, opacity, children }: PrimProps) {
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <mesh>
        <Geo shape={shape} args={args} />
        {glow ? <meshBasicMaterial color={GLOW} toneMapped={false} wireframe={wire} />
          : <meshToonMaterial color={color} gradientMap={GRAD} emissive={emissive ?? '#000'} wireframe={wire} transparent={opacity !== undefined} opacity={opacity ?? 1} />}
      </mesh>
      {outline && !glow && !wire && (
        <mesh scale={1.07}><Geo shape={shape} args={args} /><meshBasicMaterial color={COL.ink} side={THREE.BackSide} transparent={opacity !== undefined} opacity={opacity ?? 1} /></mesh>
      )}
      {children}
    </group>
  );
}

const skyV = `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const skyF = `
uniform vec3 uTop, uMid, uBot, uSun; uniform float uStars; uniform vec3 uSunDir; uniform float uSunSize;
varying vec3 vD;
void main(){
  vec3 d = normalize(vD); float h = d.y;
  vec3 c = mix(uBot, uMid, smoothstep(-0.05, 0.22, h)); c = mix(c, uTop, smoothstep(0.2, 0.85, h));
  vec3 q = floor(d*240.); float r = fract(sin(dot(q, vec3(12.9898,78.233,37.719)))*43758.5453);
  c += step(0.9985, r) * smoothstep(0.12, 0.5, h) * uStars * 0.9;
  float s = dot(d, normalize(uSunDir));
  c += uSun * (smoothstep(uSunSize, uSunSize + 0.002, s) * 1.6 + pow(max(s, 0.), 24.) * 0.35);
  gl_FragColor = vec4(c, 1.);
  #include <colorspace_fragment>
}`;
export function SkyDome({ top = COL.night, mid = COL.night, bottom = COL.deepSea, stars = 1, sun, sunDir = [0, 0.3, -1], sunSize = 0.995 }:
  { top?: string; mid?: string; bottom?: string; stars?: number; sun?: THREE.Color; sunDir?: number[]; sunSize?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: skyV, fragmentShader: skyF,
    uniforms: {
      uTop: { value: new THREE.Color(top) }, uMid: { value: new THREE.Color(mid) }, uBot: { value: new THREE.Color(bottom) },
      uSun: { value: sun ?? new THREE.Color(0, 0, 0) }, uStars: { value: stars }, uSunDir: { value: new THREE.Vector3(...sunDir) }, uSunSize: { value: sunSize },
    },
  }), [top, mid, bottom, stars, sun, sunDir.join(), sunSize]);
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  return <mesh ref={ref} renderOrder={-10} frustumCulled={false}><sphereGeometry args={[400, 24, 16]} /><primitive object={mat} attach="material" /></mesh>;
}
