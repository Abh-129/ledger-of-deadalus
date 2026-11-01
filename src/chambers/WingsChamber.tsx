import { LOOK } from '../experience/shared/look';
import { ROOMS } from '../world/layout';
import type { ChamberProps } from '../world/chambers';

// Stub from T2: one fresco-sized plane, no hero. The chamber's lane replaces this file.
export default function WingsChamber(_: ChamberProps) {
  return (
    <mesh position={[-ROOMS.wings.size[0] / 2 + 0.05, 2, 0]} rotation-y={Math.PI / 2}>
      <planeGeometry args={[3, 2]} />
      <meshLambertMaterial color={LOOK.fresco.plaster} />
    </mesh>
  );
}
