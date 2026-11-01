import { LOOK } from '../experience/shared/look';
import type { ChamberProps } from '../world/chambers';

// Stub from T2: one fresco-sized plane, no hero. The chamber's lane replaces this file.
export default function PartridgeChamber(_: ChamberProps) {
  return (
    <mesh position={[0, 1.5, 0]}>
      <planeGeometry args={[3, 2]} />
      <meshLambertMaterial color={LOOK.fresco.plaster} />
    </mesh>
  );
}
