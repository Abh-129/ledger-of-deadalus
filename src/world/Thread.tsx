import { useEffect, useRef } from 'react';
import { ORDER, useStore } from '../store';
import { COL, LOOK } from '../experience/shared/look';
import { PolyHandle, Polyline } from '../experience/shared/lines';
import { ROOMS, THREAD, threadIndexNear } from './layout';

const PTS = THREAD.map(([x, z]) => [x, 0.02, z]);
const AT_ROOM = ORDER.map((k) => threadIndexNear(ROOMS[k].center));

/** Ariadne's thread on the floor: ochre up to the next room, dim beyond; it glows for good once the thread chamber weaves it. */
export default function Thread() {
  const reach = useStore((s) => Math.max(s.doors.length, s.current ? ORDER.indexOf(s.current) : 0));
  const woven = useStore((s) => s.doors.includes('thread') || (s.current === 'thread' && s.step >= 2) || (!!s.current && ORDER.indexOf(s.current) > 3));
  const lit = useRef<PolyHandle>(null), litGlow = useRef<PolyHandle>(null), dim = useRef<PolyHandle>(null);
  useEffect(() => {
    const i = AT_ROOM[Math.min(reach, ORDER.length - 2)];
    // ponytail: the thread ends at the wings tower; the beach (VI) has none
    (woven ? litGlow : lit).current?.set(PTS.slice(0, i + 1));
    (woven ? lit : litGlow).current?.set([]);
    dim.current?.set(PTS.slice(i));
  }, [reach, woven]);
  return (
    <>
      <Polyline ref={lit} max={PTS.length} thick={0.07} glow={false} color={LOOK.craft.color} />
      <Polyline ref={litGlow} max={PTS.length} thick={0.07} />
      <Polyline ref={dim} max={PTS.length} thick={0.05} glow={false} color={COL.dim} />
    </>
  );
}
