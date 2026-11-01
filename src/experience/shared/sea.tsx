import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';
import { COL } from './look';

const V = `
uniform float uTime, uAmp; varying vec3 vW; varying float vH;
float wave(vec2 p){ return sin(p.x*0.18+uTime*0.8)*0.5 + sin(p.y*0.23-uTime*0.6+1.7)*0.4 + sin((p.x+p.y)*0.09+uTime*0.4)*0.6 + sin((p.x*1.3-p.y)*0.35+uTime*1.1)*0.15; }
void main(){ vec4 w = modelMatrix*vec4(position,1.); float h = wave(w.xz); w.y += h*uAmp; vH = h/1.65; vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const F = `
uniform vec3 uDeep, uMid, uLine, uFog; uniform float uDens; varying vec3 vW; varying float vH;
void main(){
  float b = floor((vH*0.5+0.5)*3.)/3.; vec3 c = mix(uDeep, uMid, b*0.85);
  float l = abs(fract(vH*2.4 + (vW.x+vW.z)*0.03)-0.5); c = mix(c, uLine, (1.-smoothstep(0.0,0.04,l))*0.65);
  float d = distance(vW, cameraPosition); c = mix(c, uFog, 1.-exp(-pow(d*uDens,2.)));
  gl_FragColor = vec4(c,1.);
  #include <colorspace_fragment>
}`;

/** Fresco-style sea: banded toon colours, painted wave lines, waves fixed in world space. */
export function Sea({ amp = 0.35, size = 700, deep = COL.night, mid = COL.lapis, line = '#6f9bd8', fog = COL.deepSea, dens = 0.012, y = 0 }:
  { amp?: number; size?: number; deep?: string; mid?: string; line?: string; fog?: string; dens?: number; y?: number }) {
  const reduced = useStore((s) => s.settings.reducedMotion);
  const ref = useRef<THREE.Mesh>(null);
  const seg = 180, cell = size / seg;
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: V, fragmentShader: F,
    uniforms: {
      uTime: { value: 0 }, uAmp: { value: amp }, uDens: { value: dens },
      uDeep: { value: new THREE.Color(deep) }, uMid: { value: new THREE.Color(mid) }, uLine: { value: new THREE.Color(line) }, uFog: { value: new THREE.Color(fog) },
    },
  }), [amp, dens, deep, mid, line, fog]);
  useFrame(({ camera, clock }) => {
    if (!reduced) mat.uniforms.uTime.value = clock.elapsedTime;
    ref.current?.position.set(Math.round(camera.position.x / cell) * cell, y, Math.round(camera.position.z / cell) * cell);
  });
  return <mesh ref={ref} rotation-x={-Math.PI / 2} frustumCulled={false}><planeGeometry args={[size, size, seg, seg]} /><primitive object={mat} attach="material" /></mesh>;
}
