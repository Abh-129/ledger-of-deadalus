// Every caption, ledger entry and label lives here (spec section 6 + 11). Components never hardcode myth text.

export type Roman = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type ChapterKey = 'saw' | 'cow' | 'labyrinth' | 'thread' | 'wings' | 'partridge';

interface Caption { t: string; latin?: boolean; gloss?: string }
export interface ChapterCopy {
  id: Roman;
  key: ChapterKey;
  name: string;
  game: boolean; // has a playable beat after the commission captions
  captions: Caption[];
  source: string;
  solved: string;
  solvedNote?: string;
  cost: string;
}

const c = (t: string, extra: Partial<Caption> = {}): Caption => ({ t, ...extra });

export const CHAPTERS: ChapterCopy[] = [
  {
    id: 'I', key: 'saw', name: 'The Saw', game: false,
    captions: [
      c('Athens. Daedalus, the greatest craftsman alive, takes on a student: his sister’s son, Perdix, twelve years old.'),
      c('The boy studies the spine of a fish and cuts its teeth into iron. He has invented the saw.'),
      c('He joins two iron arms at one end. He has invented the compass.'),
      c('Daedalus cannot bear it. He throws the boy from Athena’s citadel.'),
      c('Athena catches him in the air and turns him into a partridge. To this day the partridge nests on the ground and never flies high.'),
    ],
    source: 'Ovid, Metamorphoses 8.236–259 · Apollodorus, Library 3.15.8 (names the boy Talos)',
    solved: 'Wood can be cut. A circle can be drawn.', solvedNote: 'not his invention',
    cost: 'Perdix. Daedalus is tried for murder and flees to Crete.',
  },
  {
    id: 'II', key: 'cow', name: 'The Cow', game: false,
    captions: [
      c('Crete. Minos asked Poseidon for a bull from the sea and promised to sacrifice it. He kept it instead.'),
      c('Poseidon’s punishment: Queen Pasiphaë falls in love with the bull. She brings her problem to the palace craftsman.'),
      c('Daedalus builds a hollow wooden cow on wheels and covers it in real hide. The queen climbs inside.'),
      c('It works exactly as designed.'),
      c('The child is born with a man’s body and a bull’s head. They call him the Minotaur. He eats human flesh.'),
    ],
    source: 'Apollodorus, Library 3.1.3–4 · Ovid, Metamorphoses 8.131–137, 155–156',
    solved: 'The queen’s request, delivered in full.', cost: 'The Minotaur.',
  },
  {
    id: 'III', key: 'labyrinth', name: 'The Labyrinth', game: true,
    captions: [
      c('Minos needs somewhere to hide the evidence. Daedalus builds a prison with no way out.'),
      c('The passages twist like the river Meander. Ovid says Daedalus himself barely found the exit.'),
      c('A monster needs feeding. Athens is forced to send seven young men and seven young women as tribute.'),
      c('One of them is Theseus, prince of Athens. Ariadne, the king’s daughter, has given him a ball of thread.'),
    ],
    source: 'Ovid, Metamorphoses 8.157–168 · Apollodorus, Epitome 1.7–9',
    solved: 'The king’s shame is out of sight.', cost: 'Fourteen Athenians with every tribute.',
  },
  {
    id: 'IV', key: 'thread', name: 'The Thread', game: false,
    captions: [
      c('Ariadne had asked Daedalus how anyone could escape his labyrinth. His answer was the simplest thing he ever made.'),
      c('Tie a thread at the door. Let it out as you go. Follow it home.'),
      c('That was your path.'),
      c('The man who built the trap had sold the key. Minos finds out.'),
      c('He locks Daedalus and his son Icarus inside the Labyrinth.'),
    ],
    source: 'Apollodorus, Epitome 1.8–9, 1.12 · Ovid, Metamorphoses 8.172–173',
    solved: 'Theseus kills the Minotaur and escapes. The tribute ends.',
    cost: 'Daedalus and Icarus imprisoned in his own maze.',
  },
  {
    id: 'V', key: 'wings', name: 'The Wings', game: true,
    captions: [
      c('Minos rules the land and the sea. He does not rule the sky.'),
      c('Daedalus lays out feathers from shortest to longest, ties them with thread, and seals them with wax.'),
      c('His son plays with the feathers and softens the wax with his thumb.'),
      c('One instruction before takeoff. Fly the middle course. Too low, the spray will soak the feathers. Too high, the sun will melt the wax.'),
      c('medio ut limite curras', { latin: true, gloss: '“run the middle path”' }),
    ],
    source: 'Ovid, Metamorphoses 8.183–230 · Apollodorus, Epitome 1.12–13',
    solved: 'Escape from Crete.', cost: 'Icarus.',
  },
  {
    id: 'VI', key: 'partridge', name: 'The Partridge', game: false,
    // captions[0] is the branching line, replaced at runtime (see partridgeOpening)
    captions: [
      c(''),
      c('Daedalus sees feathers on the waves. He carries his son to shore and buries him. The island is named Icaria.'),
      c('At the grave, Ovid says, he cursed his own skill.'),
      c('In a ditch nearby, a partridge beats its wings and sings for joy.'),
      c('It is Perdix. The boy who learned to stay low is watching the boy who flew too high go into the ground.'),
    ],
    source: 'Ovid, Metamorphoses 8.231–259',
    solved: 'Nothing.', cost: 'The account is closed.',
  },
];

export const partridgeOpening = {
  fell: 'That is how the story goes.',
  win: 'You held the middle course. Icarus didn’t. The Ledger records what happened, not what you did.',
};

export const UI = {
  title: 'THE LABYRINTH OF DAEDALUS',
  subtitle: 'Six inventions. Every one of them worked.',
  begin: 'Begin', soundOn: 'Sound on', soundOff: 'Sound off', sources: 'Sources',
  cont: 'Continue', pause: 'Paused', resume: 'Click to resume',
  skip: 'Skip, tell me what happens',
  use: 'Look closer', useKey: 'E or click', follow: 'Follow the thread',
  controls: 'WASD or arrows to walk. Drag to look. E or click to use.',
  controlsTouch: 'Drag to look. Tap Follow the thread to walk.', takeOff: 'Take off',
  loading: ['Sharpening the saw', 'Stretching the hide', 'Winding the thread', 'Warming the wax'],
  solvedHead: 'SOLVED', costHead: 'COST',
  assemble: 'Assemble', parts: ['FRAME', 'PANELS', 'WHEELS', 'HIDE'],
  noWebgl: 'Your browser could not start 3D graphics, so here is the whole myth as a page.',
};

export const GAME = {
  minotaurDead: 'The Minotaur is dead. Now follow the thread back.',
  flightPrompt: 'Hold to fly. Release to glide.',
  flightControls: 'Mouse button, Space, or touch to flap',
  wax: 'WAX', spray: 'SPRAY', distance: 'DISTANCE TO SICILY', glory: 'GLORY',
  fisherman: 'Below, a fisherman looks up and takes them for gods.',
  ploughman: 'A ploughman stops, shades his eyes, and stares.',
  shepherd: 'A shepherd lets go of his crook.',
  outcome: {
    melt: 'The wax gave out. Icarus fell into the sea that still carries his name.',
    sea: 'The spray soaked the feathers and dragged him under. Daedalus warned about the low road too. Nobody tells that version.',
    win: 'You reached Sicily on the middle course, the way Daedalus did.',
    winAfter: 'But this is a myth, and myths have already happened.',
  },
  islands: { samos: 'SAMOS', delos: 'DELOS', paros: 'PAROS', lebinthos: 'LEBINTHOS', calymne: 'CALYMNE', sicily: 'SICILY' },
};

export const FINAL = {
  rows: [
    ['PROBLEMS SOLVED', 5],
    ['PROBLEMS CREATED', 5],
    ['FALLS FROM A HEIGHT', 2],
  ] as [string, number][],
  body: 'The usual moral of this myth is aimed at Icarus: don’t fly too high. Read as a ledger, the story is about his father. Every one of Daedalus’s inventions did exactly what it was built to do, and every one handed the next person a disaster. The only inventor in the story who ends up safe is the boy who learned to fly low, and he only learned it because Daedalus pushed him.',
  playAgain: 'Play again', walk: 'Walk the Labyrinth again',
};

export const SETTINGS_LABELS = {
  sound: 'Sound', quality: 'Graphics quality', reducedMotion: 'Reduced motion',
};
