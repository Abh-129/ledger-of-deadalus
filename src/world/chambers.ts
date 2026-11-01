import type { ChapterKey } from '../content/copy';
import SawChamber from '../chambers/SawChamber';
import CowChamber from '../chambers/CowChamber';
import MinotaurChamber from '../chambers/MinotaurChamber';
import ThreadChamber from '../chambers/ThreadChamber';
import WingsChamber from '../chambers/WingsChamber';
import PartridgeChamber from '../chambers/PartridgeChamber';

// step: store.step while current; last caption index when done; -1 when ahead
export interface ChamberProps { step: number; state: 'ahead' | 'current' | 'done' }
export const CHAMBERS: Record<ChapterKey, (p: ChamberProps) => JSX.Element> = {
  saw: SawChamber, cow: CowChamber, labyrinth: MinotaurChamber, thread: ThreadChamber, wings: WingsChamber, partridge: PartridgeChamber,
};
