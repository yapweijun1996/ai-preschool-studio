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

export interface Student {
  id: string;
  name: string;
  initials: string;
  age: number;
  homeLanguages: string;
  term3: Record<DomainKey, Milestone>;
  term4: Record<DomainKey, Milestone>;
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

const m = (en: Milestone, zh: Milestone, ma: Milestone, se: Milestone) => ({ en, zh, ma, se });

export const STUDENTS: Student[] = [
  { id: 'aria', name: 'Aria Tan', initials: 'AT', age: 5, homeLanguages: 'English, 华语', term3: m('developing', 'emerging', 'developing', 'emerging'), term4: m('consistent', 'developing', 'developing', 'developing'), reportStatus: 'draft' },
  { id: 'ethan', name: 'Ethan Koh', initials: 'EK', age: 5, homeLanguages: 'English', term3: m('developing', 'developing', 'emerging', 'developing'), term4: m('developing', 'developing', 'developing', 'consistent'), reportStatus: 'review' },
  { id: 'meiling', name: 'Mei Ling Chua', initials: 'MC', age: 5, homeLanguages: '华语, English', term3: m('developing', 'consistent', 'developing', 'developing'), term4: m('consistent', 'consistent', 'developing', 'consistent'), reportStatus: 'approved' },
  { id: 'rayan', name: 'Rayan Iskandar', initials: 'RI', age: 5, homeLanguages: 'Malay, English', term3: m('emerging', 'emerging', 'developing', 'developing'), term4: m('developing', 'emerging', 'developing', 'developing'), reportStatus: 'changes' },
  { id: 'sofia', name: 'Sofia Fernandez', initials: 'SF', age: 5, homeLanguages: 'Spanish, English', term3: m('developing', 'emerging', 'emerging', 'developing'), term4: m('developing', 'developing', 'developing', 'developing'), reportStatus: 'draft' },
  { id: 'daniel', name: 'Daniel Wong', initials: 'DW', age: 5, homeLanguages: 'English, 华语', term3: m('developing', 'developing', 'developing', 'emerging'), term4: m('consistent', 'developing', 'consistent', 'developing'), reportStatus: 'review' },
  { id: 'hana', name: 'Hana Goh', initials: 'HG', age: 5, homeLanguages: 'English', term3: m('consistent', 'developing', 'developing', 'developing'), term4: m('consistent', 'developing', 'consistent', 'consistent'), reportStatus: 'approved' },
  { id: 'arjun', name: 'Arjun Nair', initials: 'AN', age: 4, homeLanguages: 'Tamil, English', term3: m('emerging', 'emerging', 'emerging', 'developing'), term4: m('emerging', 'emerging', 'developing', 'developing'), reportStatus: 'notStarted' },
  { id: 'zoe', name: 'Zoe Teo', initials: 'ZT', age: 5, homeLanguages: 'English', term3: m('developing', 'emerging', 'developing', 'developing'), term4: m('developing', 'developing', 'developing', 'consistent'), reportStatus: 'draft' },
  { id: 'lucas', name: 'Lucas Ong', initials: 'LO', age: 5, homeLanguages: 'English, 华语', term3: m('emerging', 'developing', 'developing', 'emerging'), term4: m('developing', 'developing', 'developing', 'developing'), reportStatus: 'draft' },
  { id: 'nuraisyah', name: 'Nur Aisyah', initials: 'NA', age: 5, homeLanguages: 'Malay, English', term3: m('developing', 'emerging', 'developing', 'developing'), term4: m('consistent', 'developing', 'developing', 'consistent'), reportStatus: 'approved' },
  { id: 'kai', name: 'Kai Chen', initials: 'KC', age: 4, homeLanguages: '华语', term3: m('emerging', 'developing', 'emerging', 'emerging'), term4: m('emerging', 'developing', 'emerging', 'emerging'), reportStatus: 'notStarted' }
];

// Summary figures for students whose individual observations are not seeded.
export const SEED_SUMMARY: Record<string, { lastObserved: string; count: number }> = {
  ethan: { lastObserved: '2026-10-20', count: 11 },
  meiling: { lastObserved: '2026-10-19', count: 12 },
  rayan: { lastObserved: '2026-10-06', count: 6 },
  sofia: { lastObserved: '2026-10-18', count: 9 },
  daniel: { lastObserved: '2026-10-17', count: 10 },
  hana: { lastObserved: '2026-10-21', count: 13 },
  arjun: { lastObserved: '2026-10-03', count: 4 },
  zoe: { lastObserved: '2026-10-20', count: 12 },
  lucas: { lastObserved: '2026-10-16', count: 8 },
  nuraisyah: { lastObserved: '2026-10-19', count: 11 },
  kai: { lastObserved: '2026-10-01', count: 0 }
};

const o = (id: string, studentId: string, date: string, domain: DomainKey, milestone: Milestone, text: string, hasPhoto = false, term: 3 | 4 = 4): Observation =>
  ({ id, studentId, date, domain, milestone, text, hasPhoto, term });

export const OBSERVATIONS: Observation[] = [
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
  o('OBS-0150', 'rayan', '2026-10-06', 'ma', 'developing', 'Matched number cards 1–5 to sets of shells.')
];

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
