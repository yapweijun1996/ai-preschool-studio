// Learning Framework: the single owner of learning areas, the milestone scale and reporting periods.
// Every other module reads these keys and labels; none redefines them (ADR 0001).
import type { Lang } from '../i18n';

export type DomainKey = 'en' | 'zh' | 'ma' | 'se';
export type Milestone = 'emerging' | 'developing' | 'consistent';
type L = Record<Lang, string>;

/**
 * Nurturing Early Learners (NEL) Framework 2022: five learning areas plus the core
 * social and emotional competencies. Mapping to be confirmed against the NEL documents.
 */
export type NelKey = 'aesthetics' | 'discovery' | 'health' | 'language' | 'numeracy' | 'sec';

export const NEL_AREAS: { key: NelKey; label: L }[] = [
  { key: 'aesthetics', label: { en: 'Aesthetics and Creative Expression', zh: '美感与创意表达', ms: 'Estetika dan Ekspresi Kreatif' } },
  { key: 'discovery', label: { en: 'Discovery of the World', zh: '探索世界', ms: 'Penerokaan Dunia' } },
  { key: 'health', label: { en: 'Health, Safety and Motor Skills Development', zh: '健康、安全与动作技能发展', ms: 'Kesihatan, Keselamatan dan Perkembangan Kemahiran Motor' } },
  { key: 'language', label: { en: 'Language and Literacy', zh: '语言与读写', ms: 'Bahasa dan Literasi' } },
  { key: 'numeracy', label: { en: 'Numeracy', zh: '数理', ms: 'Numerasi' } },
  { key: 'sec', label: { en: 'Social and Emotional Competencies (core)', zh: '社交与情绪能力（核心）', ms: 'Kecekapan Sosial dan Emosi (teras)' } }
];

export interface LearningArea {
  key: DomainKey;
  /** Always bilingual with 中文. */
  full: L;
  short: L;
  nel: NelKey;
}

export interface MilestoneLevel {
  key: Milestone;
  /** Dots shown, out of the scale length. Words + dots only: never a score. */
  filled: number;
  label: L;
}

export interface ReportingPeriod {
  term: 3 | 4;
  start: string;
  end: string;
  label: L;
  short: L;
}

export interface Framework {
  id: string;
  version: string;
  name: L;
  areas: LearningArea[];
  scale: MilestoneLevel[];
  periods: ReportingPeriod[];
  /** Evidence sufficiency policy for derived coverage views. */
  coverage: { minPerArea: number; staleAfterDays: number };
}

const K2_DEMO_2026_1: Framework = {
  id: 'k2-demo',
  version: '2026.1',
  name: { en: 'K2 demo framework', zh: 'K2 示范框架', ms: 'Rangka kerja demo K2' },
  areas: [
    { key: 'en', nel: 'language', full: { en: 'English Language 英语', zh: '英语 English Language', ms: 'Bahasa Inggeris 英语' }, short: { en: 'English 英语', zh: '英语 English', ms: 'Inggeris 英语' } },
    { key: 'zh', nel: 'language', full: { en: 'Chinese Language 华语', zh: '华语 Chinese Language', ms: 'Bahasa Cina 华语' }, short: { en: 'Chinese 华语', zh: '华语 Chinese', ms: 'Cina 华语' } },
    { key: 'ma', nel: 'numeracy', full: { en: 'Mathematics 数学', zh: '数学 Mathematics', ms: 'Matematik 数学' }, short: { en: 'Math 数学', zh: '数学 Math', ms: 'Matematik 数学' } },
    {
      key: 'se',
      nel: 'sec',
      full: { en: 'Social-Emotional Development 社交与情绪发展', zh: '社交与情绪发展 Social-Emotional Development', ms: 'Perkembangan Sosio-Emosi 社交与情绪发展' },
      short: { en: 'Social-Emotional 社交与情绪', zh: '社交与情绪 Social-Emotional', ms: 'Sosio-Emosi 社交与情绪' }
    }
  ],
  scale: [
    { key: 'emerging', filled: 1, label: { en: 'Emerging', zh: '初现', ms: 'Baru muncul' } },
    { key: 'developing', filled: 2, label: { en: 'Developing', zh: '发展中', ms: 'Sedang berkembang' } },
    { key: 'consistent', filled: 3, label: { en: 'Consistently demonstrated', zh: '稳定表现', ms: 'Ditunjukkan secara konsisten' } }
  ],
  periods: [
    { term: 3, start: '2026-06-29', end: '2026-09-06', label: { en: '2026 Term 3', zh: '2026 年第 3 学期', ms: 'Penggal 3 2026' }, short: { en: 'Term 3', zh: '第 3 学期', ms: 'Penggal 3' } },
    { term: 4, start: '2026-09-14', end: '2026-11-20', label: { en: '2026 Term 4', zh: '2026 年第 4 学期', ms: 'Penggal 4 2026' }, short: { en: 'Term 4', zh: '第 4 学期', ms: 'Penggal 4' } }
  ],
  coverage: { minPerArea: 2, staleAfterDays: 21 }
};

/** Every published version stays available, so an approved report keeps the labels it was approved with. */
export const FRAMEWORKS: Record<string, Framework> = { [K2_DEMO_2026_1.version]: K2_DEMO_2026_1 };
export const CURRENT_FRAMEWORK = K2_DEMO_2026_1;

export const frameworkFor = (version: string | undefined): Framework => (version && FRAMEWORKS[version]) || CURRENT_FRAMEWORK;

/** Area keys in display order. */
export const DOMAINS: { key: DomainKey }[] = CURRENT_FRAMEWORK.areas.map((a) => ({ key: a.key }));
export const MILESTONES: { key: Milestone; filled: number }[] = CURRENT_FRAMEWORK.scale.map((m) => ({ key: m.key, filled: m.filled }));

const period = (term: 3 | 4) => CURRENT_FRAMEWORK.periods.find((p) => p.term === term)!;
/** First and last day of Term 4 (the current reporting period). */
export const TERM4_START = period(4).start;
export const TERM4_END = period(4).end;
/** The reporting period a date falls in; undefined between terms or outside every period. */
export const periodOf = (date: string): ReportingPeriod | undefined => CURRENT_FRAMEWORK.periods.find((p) => date >= p.start && date <= p.end);
export const termOf = (date: string): 3 | 4 | undefined => periodOf(date)?.term;
