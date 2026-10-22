// Fictional demo data only. No real children, schools or staff.

export type DomainKey = 'en' | 'zh' | 'ma' | 'se';
export type Milestone = 'emerging' | 'developing' | 'consistent';
export type ReportStatus = 'notStarted' | 'draft' | 'review' | 'changes' | 'approved';

export const DOMAINS: { key: DomainKey; full: string; short: string }[] = [
  { key: 'en', full: 'English Language 英语', short: 'English 英语' },
  { key: 'zh', full: 'Chinese Language 华语', short: 'Chinese 华语' },
  { key: 'ma', full: 'Mathematics 数学', short: 'Math 数学' },
  { key: 'se', full: 'Social-Emotional Development 社交与情绪发展', short: 'Social-Emotional 社交与情绪' }
];

export const domainFull = (k: DomainKey) => DOMAINS.find((d) => d.key === k)!.full;
export const domainShort = (k: DomainKey) => DOMAINS.find((d) => d.key === k)!.short;

export const MILESTONES: { key: Milestone; label: string; filled: number }[] = [
  { key: 'emerging', label: 'Emerging', filled: 1 },
  { key: 'developing', label: 'Developing', filled: 2 },
  { key: 'consistent', label: 'Consistently demonstrated', filled: 3 }
];

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  notStarted: 'Not started',
  draft: 'Draft',
  review: 'In review',
  changes: 'Changes requested',
  approved: 'Approved'
};

export const CLASS_NAME = 'K2 Sunflower';
export const TERM = '2026 Term 4';
export const TEACHER = 'Ms. Lim';
export const REVIEWER = 'Ms. Tan';
// Fixed "today" keeps relative dates stable in the demo and in tests.
export const TODAY = '2026-10-22';
/** First day of Term 4; earlier observations belong to Term 3. */
export const TERM4_START = '2026-09-14';
export const termOf = (date: string): 3 | 4 => (date >= TERM4_START ? 4 : 3);

export interface Student {
  id: string;
  name: string;
  initials: string;
  age: number;
  homeLanguages: string;
  reportStatus: ReportStatus;
}

export interface Observation {
  id: string;
  studentId: string;
  date: string;
  domain: DomainKey;
  text: string;
  milestone: Milestone;
  hasPhoto: boolean;
  term: 3 | 4;
}

export interface Sentence {
  id: string;
  text: string;
  sources: string[];
}

export interface Paragraph {
  id: string;
  domain: DomainKey;
  sentences: Sentence[];
}

const s = (id: string, name: string, initials: string, age: number, homeLanguages: string, reportStatus: ReportStatus): Student => ({ id, name, initials, age, homeLanguages, reportStatus });

export const STUDENTS: Student[] = [
  s('aria', 'Aria Tan', 'AT', 5, 'English, 华语', 'draft'),
  s('ethan', 'Ethan Koh', 'EK', 5, 'English', 'review'),
  s('meiling', 'Mei Ling Chua', 'MC', 5, '华语, English', 'approved'),
  s('rayan', 'Rayan Iskandar', 'RI', 5, 'Malay, English', 'changes'),
  s('sofia', 'Sofia Fernandez', 'SF', 5, 'Spanish, English', 'draft'),
  s('daniel', 'Daniel Wong', 'DW', 5, 'English, 华语', 'review'),
  s('hana', 'Hana Goh', 'HG', 5, 'English', 'approved'),
  s('arjun', 'Arjun Nair', 'AN', 4, 'Tamil, English', 'notStarted'),
  s('zoe', 'Zoe Teo', 'ZT', 5, 'English', 'draft'),
  s('lucas', 'Lucas Ong', 'LO', 5, 'English, 华语', 'draft'),
  s('nuraisyah', 'Nur Aisyah', 'NA', 5, 'Malay, English', 'approved'),
  s('kai', 'Kai Chen', 'KC', 4, '华语', 'notStarted'),
  s('priya', 'Priya Raman', 'PR', 5, 'Tamil, English', 'review'),
  s('aiden', 'Aiden Lee', 'AL', 5, 'English, 华语', 'draft'),
  s('siti', 'Siti Aminah', 'SA', 5, 'Malay, English', 'approved'),
  s('chloe', 'Chloe Ng', 'CN', 5, 'English, 华语', 'draft'),
  s('irfan', 'Muhammad Irfan', 'MI', 4, 'Malay', 'notStarted'),
  s('weiming', 'Wei Ming Ho', 'WH', 5, '华语', 'review'),
  s('isabelle', 'Isabelle Chan', 'IC', 5, 'English', 'approved'),
  s('rohan', 'Rohan Menon', 'RM', 5, 'Malayalam, English', 'draft')
];

const o = (id: string, studentId: string, date: string, domain: DomainKey, milestone: Milestone, text: string, hasPhoto = false, term: 3 | 4 = 4): Observation =>
  ({ id, studentId, date, domain, milestone, text, hasPhoto, term });

// Hand-written observations (Aria's full portfolio plus a few others the demo script points at).
const HAND_OBSERVATIONS: Observation[] = [
  o('OBS-0156', 'aria', '2026-10-21', 'se', 'developing', 'Said “I feel sad because my tower fell” and asked a friend to help rebuild it.'),
  o('OBS-0151', 'aria', '2026-10-20', 'se', 'developing', 'Took turns at the block corner and handed a peer the last arch block without being asked.', true),
  o('OBS-0149', 'aria', '2026-10-17', 'en', 'consistent', 'Read “I can see a red bus” aloud from a class book, pointing to each word.'),
  o('OBS-0147', 'aria', '2026-10-16', 'ma', 'developing', 'Counted 18 blocks one by one and said “eighteen” as the total.', true),
  o('OBS-0145', 'aria', '2026-10-15', 'zh', 'developing', 'Sang 《两只老虎》 with the group and named five animals in 华语 at circle time.'),
  o('OBS-0142', 'aria', '2026-10-14', 'en', 'consistent', 'Retold a familiar story in order using four picture cards, adding “then” and “after that”.'),
  o('OBS-0101', 'aria', '2026-08-12', 'en', 'developing', 'Retold a familiar story with picture prompts from the teacher.', false, 3),
  o('OBS-0155', 'hana', '2026-10-21', 'ma', 'consistent', 'Sorted counters into groups of five and counted on to 20.'),
  o('OBS-0154', 'ethan', '2026-10-20', 'zh', 'developing', 'Answered “你叫什么名字？” with his full name during role play.'),
  o('OBS-0153', 'zoe', '2026-10-20', 'en', 'developing', 'Wrote the first letter of her name on a drawing label.'),
  // Rayan's only Mathematics observation: the reviewer asks for a second one.
  o('OBS-0150', 'rayan', '2026-10-06', 'ma', 'consistent', 'Matched number cards 1–5 to sets of shells.')
];

// Fictional observation texts per domain (verb phrases, so a narrative sentence is "<First name> <text>").
const POOL: Record<DomainKey, string[]> = {
  en: [
    'Retold a picture book to a friend using “first”, “next” and “last”.',
    'Pointed to each word while reading the class big book aloud.',
    'Wrote the first letter of a friend’s name on a birthday card.',
    'Asked “why” questions about a story and listened to the answer.',
    'Named three things that start with the sound /s/ at circle time.',
    'Described a drawing in two full sentences to the teacher.',
    'Joined in the repeated line of a rhyme without a prompt.',
    'Made a sign for the block corner that read “DO NOT TOUCH”.'
  ],
  zh: [
    'Greeted the 华语 teacher with “早安” and answered “你好吗？”.',
    'Named six fruits in 华语 during a market role play.',
    'Sang 《小星星》 with the group and did the actions.',
    'Counted from 一 to 十 in 华语 while setting the table.',
    'Used “我要…” to ask for a crayon in 华语.',
    'Pointed to the 大 and 小 picture cards when asked in 华语.',
    'Retold the start of a 华语 picture book with prompts.'
  ],
  ma: [
    'Counted 12 cups one by one and said the total.',
    'Sorted buttons by colour and then by size.',
    'Continued a red-blue-red-blue bead pattern to the end of the string.',
    'Compared two towers and said which one was taller.',
    'Matched number cards 1–10 to sets of shells.',
    'Shared eight crackers equally between two plates.',
    'Found three triangles in the playground and named them.'
  ],
  se: [
    'Waited for a turn on the slide and let a younger child go first.',
    'Said “I am angry” and took a break in the calm corner.',
    'Helped a friend zip a bag without being asked.',
    'Joined a new group at the sand tray and suggested a game.',
    'Brought a tissue to a classmate who was crying.',
    'Tidied the block corner with two friends after play.',
    'Said sorry after bumping into a friend and checked they were fine.'
  ]
};

type Plan = {
  /** Date of the most recent generated Term 4 observation. */
  last: string;
  /** Term 3 milestones (en, zh, ma, se); one observation each. */
  t3: [Milestone, Milestone, Milestone, Milestone];
  /** Term 4: [milestone, number of generated observations] per domain; missing = not yet observed. */
  t4: Partial<Record<DomainKey, [Milestone, number]>>;
  /** Draft/review content: write a narrative and (optionally) a reflection. */
  narrative?: boolean;
  reflection?: string;
};

const E: Milestone = 'emerging';
const D: Milestone = 'developing';
const C: Milestone = 'consistent';

const PLANS: Record<string, Plan> = {
  aria: { last: '', t3: [D, E, D, E], t4: {} },
  ethan: { last: '2026-10-19', t3: [D, E, D, D], t4: { en: [D, 2], zh: [D, 1], ma: [C, 2], se: [D, 2] }, narrative: true, reflection: 'turn-taking games and longer conversations in 华语' },
  meiling: { last: '2026-10-19', t3: [D, D, D, D], t4: { en: [C, 3], zh: [C, 2], ma: [D, 3], se: [C, 3] }, narrative: true, reflection: 'measuring and comparing activities' },
  rayan: { last: '2026-10-03', t3: [E, E, D, E], t4: { en: [D, 2], zh: [E, 1], se: [D, 2] }, narrative: true, reflection: 'counting games and a second look at number matching' },
  sofia: { last: '2026-10-18', t3: [D, E, E, D], t4: { en: [D, 2], zh: [D, 1], ma: [D, 2] }, narrative: true },
  daniel: { last: '2026-10-17', t3: [E, D, D, E], t4: { en: [D, 2], zh: [C, 2], ma: [D, 3], se: [D, 2] }, narrative: true, reflection: 'story-telling in English' },
  hana: { last: '2026-10-20', t3: [D, D, D, D], t4: { en: [C, 3], zh: [D, 3], ma: [C, 2], se: [C, 3] }, narrative: true, reflection: 'leading small-group games' },
  arjun: { last: '2026-10-03', t3: [E, D, E, E], t4: { en: [E, 1], zh: [D, 1], ma: [D, 1], se: [E, 1] } },
  zoe: { last: '2026-10-19', t3: [E, E, D, D], t4: { en: [D, 1], zh: [E, 2], ma: [D, 2], se: [D, 2] }, narrative: true, reflection: 'name-writing and labelling' },
  lucas: { last: '2026-10-16', t3: [D, E, D, E], t4: { en: [D, 2], zh: [D, 1], ma: [C, 2], se: [D, 2] }, narrative: true, reflection: 'calm-corner routines and naming feelings' },
  nuraisyah: { last: '2026-10-19', t3: [D, D, E, D], t4: { en: [C, 2], zh: [D, 3], ma: [D, 3], se: [C, 3] }, narrative: true, reflection: 'pattern and shape games' },
  kai: { last: '2026-10-01', t3: [E, D, E, E], t4: { zh: [D, 1], ma: [E, 1] } },
  priya: { last: '2026-10-19', t3: [D, E, D, D], t4: { en: [C, 3], zh: [D, 2], ma: [D, 2], se: [C, 2] }, narrative: true, reflection: 'listening games in 华语' },
  aiden: { last: '2026-10-15', t3: [E, D, E, D], t4: { en: [D, 2], zh: [D, 2], se: [D, 1] }, narrative: true },
  siti: { last: '2026-10-18', t3: [D, E, D, D], t4: { en: [D, 3], zh: [D, 2], ma: [C, 3], se: [C, 2] }, narrative: true, reflection: 'reading aloud with a partner' },
  chloe: { last: '2026-10-21', t3: [D, D, D, E], t4: { en: [C, 2], zh: [C, 2], ma: [D, 1], se: [D, 2] }, narrative: true },
  irfan: { last: '2026-10-12', t3: [E, E, D, E], t4: { en: [E, 1], ma: [D, 1], se: [D, 1] } },
  weiming: { last: '2026-10-20', t3: [E, D, D, D], t4: { en: [D, 2], zh: [C, 3], ma: [D, 2], se: [D, 2] }, narrative: true, reflection: 'English rhymes and songs' },
  isabelle: { last: '2026-10-17', t3: [D, D, D, D], t4: { en: [C, 3], zh: [D, 2], ma: [D, 2], se: [C, 3] }, narrative: true, reflection: 'counting on beyond 20' },
  rohan: { last: '2026-10-14', t3: [D, E, E, D], t4: { en: [D, 1], zh: [E, 1], ma: [D, 2], se: [D, 1] }, narrative: true }
};

const KEYS: DomainKey[] = ['en', 'zh', 'ma', 'se'];

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Deterministic fictional observations: Term 3 (one per domain, August) and Term 4 per plan. */
function generateObservations(): Observation[] {
  const t3: Omit<Observation, 'id'>[] = [];
  const t4: Omit<Observation, 'id'>[] = [];
  STUDENTS.forEach((st, si) => {
    const plan = PLANS[st.id];
    KEYS.forEach((k, ki) => {
      if (st.id === 'aria' && k === 'en') return; // OBS-0101 is hand-written
      const pool = POOL[k];
      t3.push({ studentId: st.id, date: shiftDate('2026-08-03', si + ki * 5), domain: k, milestone: plan.t3[ki], text: pool[(si + 5) % pool.length], hasPhoto: false, term: 3 });
    });
    // Term 4: walk back from `last`, three days apart, cycling through the planned domains.
    const slots: { k: DomainKey; m: Milestone }[] = [];
    const left = KEYS.map((k) => plan.t4[k]?.[1] ?? 0);
    while (left.some((n) => n > 0)) KEYS.forEach((k, ki) => { if (left[ki] > 0) { left[ki]--; slots.push({ k, m: plan.t4[k]![0] }); } });
    // Per-domain counter keeps a child's texts distinct (pools hold at least 7, plans use at most 3 + Term 3's offset 5).
    const used: Record<DomainKey, number> = { en: 0, zh: 0, ma: 0, se: 0 };
    slots.forEach(({ k, m }, i) => {
      const pool = POOL[k];
      t4.push({ studentId: st.id, date: shiftDate(plan.last, -3 * i), domain: k, milestone: m, text: pool[(si + used[k]++) % pool.length], hasPhoto: i % 4 === 1, term: 4 });
    });
  });
  // Term 3 ids sit below Aria's OBS-0101; Term 4 ids start after the hand-written range.
  const byDate = (a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date);
  const ids3 = [...t3].sort(byDate).map((x, i) => ({ ...x, id: `OBS-${String(i + 1).padStart(4, '0')}` }));
  const ids4 = [...t4].sort(byDate).map((x, i) => ({ ...x, id: `OBS-${String(i + 157).padStart(4, '0')}` }));
  return [...ids3, ...ids4];
}

export const OBSERVATIONS: Observation[] = [...HAND_OBSERVATIONS, ...generateObservations()].sort((a, b) => b.date.localeCompare(a.date));

/** First id for observations added in the demo (after every seeded id). */
export const NEXT_OBS_NUMBER = Math.max(...OBSERVATIONS.map((x) => Number(x.id.slice(4)))) + 1;

const lcFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/**
 * A draft built from observations: one cited sentence per observation, at most two per domain.
 * Deterministic template text, not AI; used for seeded drafts and the Studio "Start draft" action.
 */
export function draftFromObservations(student: Student, observations: Observation[]): Paragraph[] {
  const first = student.name.split(' ')[0];
  return KEYS.flatMap((k) => {
    const list = observations.filter((x) => x.domain === k && x.term === 4).sort((a, b) => a.date.localeCompare(b.date)).slice(-2);
    if (list.length === 0) return [];
    // A note that already starts with the child's name is used as written.
    const sentence = (text: string) => (text.toLowerCase().startsWith(first.toLowerCase() + ' ') ? text : `${first} ${lcFirst(text)}`);
    return [{ id: `p-${k}`, domain: k, sentences: list.map((x) => ({ id: `s-${student.id}-${x.id}`, text: sentence(x.text), sources: [x.id] })) }];
  });
}

/** Seeded narratives and reflections for every student except Aria (hand-written below). */
export function seededDrafts(): { paragraphs: Record<string, Paragraph[]>; reflections: Record<string, string> } {
  const paragraphs: Record<string, Paragraph[]> = {};
  const reflections: Record<string, string> = {};
  for (const st of STUDENTS) {
    const plan = PLANS[st.id];
    if (st.id === 'aria' || !plan.narrative) continue;
    paragraphs[st.id] = draftFromObservations(st, OBSERVATIONS.filter((x) => x.studentId === st.id));
    if (plan.reflection) reflections[st.id] = `${st.name.split(' ')[0]} has settled well into K2 this term and joins group activities with more confidence. Next term I will offer more ${plan.reflection}.`;
  }
  return { paragraphs, reflections };
}

export const ARIA_PARAGRAPHS: Paragraph[] = [
  {
    id: 'p-en',
    domain: 'en',
    sentences: [
      { id: 's-en-1', text: 'Aria retells familiar stories in sequence, using linking words such as “then” and “after that”.', sources: ['OBS-0142'] },
      // Unsupported on purpose: shows the "Needs teacher verification" flow.
      { id: 's-en-2', text: 'She reads simple sentences independently.', sources: [] }
    ]
  },
  {
    id: 'p-zh',
    domain: 'zh',
    sentences: [
      { id: 's-zh-1', text: 'Aria joins group songs in 华语 with growing confidence and names familiar animals in Chinese during circle time.', sources: ['OBS-0145'] }
    ]
  },
  {
    id: 'p-ma',
    domain: 'ma',
    sentences: [
      { id: 's-ma-1', text: 'Aria counts objects one by one up to 18 and says the total aloud.', sources: ['OBS-0147'] }
    ]
  },
  {
    id: 'p-se',
    domain: 'se',
    sentences: [
      { id: 's-se-1', text: 'Aria is good at sharing and plays nicely with friends most of the time.', sources: [] }
    ]
  }
];

export const ARIA_REFLECTION =
  'Aria has grown in confidence this term, especially in group play. Next term I will offer more name-writing and labelling activities in both English and 华语.';

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysAgo(iso: string, today = TODAY): number {
  const ms = new Date(today + 'T00:00:00').getTime() - new Date(iso + 'T00:00:00').getTime();
  return Math.round(ms / 86400000);
}

export function lastObservedLabel(iso: string | undefined): string {
  if (!iso) return 'Not observed this term';
  const n = daysAgo(iso);
  if (n <= 0) return 'Last observed today';
  return `Last observed ${n} ${n === 1 ? 'day' : 'days'} ago`;
}
