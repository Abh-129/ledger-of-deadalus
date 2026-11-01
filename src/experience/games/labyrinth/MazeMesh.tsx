import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GRAD } from '../../shared/look';
import { C, Maze, N, WALL_H } from './mazeGen';

function bandTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1d3f73'; g.fillRect(0, 0, 512, 96);
  g.strokeStyle = '#d7e0f0'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 8); g.lineTo(512, 8); g.moveTo(0, 88); g.lineTo(512, 88); g.stroke();
  for (let k = 0; k < 6; k++) { // Minoan running spirals
    const cx = 43 + k * 85, cy = 48;
    g.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.15) { const r = 3 + a * 2.3; const x = cx + Math.cos(a * (k % 2 ? -1 : 1)) * r, y = cy + Math.sin(a * (k % 2 ? -1 : 1)) * r * 0.9; a ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Instanced walls in lapis stone with a painted fresco band at eye level, plus the floor. */
export function MazeMesh({ maze, wall = '#2c5694', floor = '#2b303a' }: { maze: Maze; wall?: string; floor?: string }) {
  const walls = useRef<THREE.InstancedMesh>(null), band = useRef<THREE.InstancedMesh>(null);
  const tex = useMemo(bandTexture, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    maze.walls.forEach((w, i) => {
      o.position.set(w.x, WALL_H / 2, w.z); o.scale.set(w.sx, WALL_H, w.sz); o.updateMatrix(); walls.current!.setMatrixAt(i, o.matrix);
      o.position.set(w.x, 1.6, w.z); o.scale.set(w.sx + 0.04, 0.8, w.sz + 0.04); o.updateMatrix(); band.current!.setMatrixAt(i, o.matrix);
    });
    walls.current!.instanceMatrix.needsUpdate = band.current!.instanceMatrix.needsUpdate = true;
  }, [maze]);
  const n = maze.walls.length;
  return (
    <group>
      <instancedMesh ref={walls} args={[undefined, undefined, n]} key={'w' + n}><boxGeometry /><meshToonMaterial color={wall} gradientMap={GRAD} /></instancedMesh>
      <instancedMesh ref={band} args={[undefined, undefined, n]} key={'b' + n}><boxGeometry /><meshToonMaterial map={tex} gradientMap={GRAD} /></instancedMesh>
      <mesh rotation-x={-Math.PI / 2} position={[N * C / 2, 0, N * C / 2]}><planeGeometry args={[N * C + 40, N * C + 40]} /><meshToonMaterial color={floor} gradientMap={GRAD} /></mesh>
    </group>
  );
}
