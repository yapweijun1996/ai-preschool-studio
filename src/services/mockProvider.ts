// Mock AI provider. Returns canned, fictional suggestions after a short delay.
// It never calls a network service; the UI must label it "Mock provider".
import type { Paragraph, Sentence } from '../data/demo';

export const PROVIDER_LABEL = 'Mock provider';

export type AiAction = 'clearer' | 'shorten';

export const AI_ACTION_LABEL: Record<AiAction, string> = {
  clearer: 'Make clearer',
  shorten: 'Shorten'
};

export interface Suggestion {
  id: string;
  paragraphId: string;
  action: AiAction;
  variant: number;
  before: Sentence[];
  after: Sentence[];
}

export class ProviderUnavailableError extends Error {
  constructor() {
    super('The Mock provider did not respond.');
    this.name = 'ProviderUnavailableError';
  }
}

const s = (id: string, text: string, ...sources: string[]): Sentence => ({ id, text, sources });

// Every suggested sentence cites the observation it rests on; the provider
// never invents a fact without a source. Hand-written suggestions exist for
// Aria only; other students get rewrites of their own sentences (same sources).
const ARIA_LIBRARY: Record<string, Record<AiAction, Sentence[][]>> = {
  'p-en': {
    clearer: [
      [s('s-en-a', 'Aria retells familiar stories in order, linking events with “then” and “after that”.', 'OBS-0142'), s('s-en-b', 'She reads a simple sentence aloud while pointing to each word.', 'OBS-0149')],
      [s('s-en-c', 'Using picture cards, Aria retells a familiar story in the right order.', 'OBS-0142'), s('s-en-d', 'She reads short sentences from class books, pointing to each word.', 'OBS-0149')]
    ],
    shorten: [[s('s-en-e', 'Aria retells familiar stories in sequence and reads simple sentences aloud.', 'OBS-0142', 'OBS-0149')]]
  },
  'p-zh': {
    clearer: [
      [s('s-zh-a', 'At circle time, Aria sings 《两只老虎》 with the group and names five animals in 华语.', 'OBS-0145')],
      [s('s-zh-b', 'Aria joins 华语 songs confidently and can name familiar animals in Chinese.', 'OBS-0145')]
    ],
    shorten: [[s('s-zh-c', 'Aria sings and names animals in 华语 with growing confidence.', 'OBS-0145')]]
  },
  'p-ma': {
    clearer: [
      [s('s-ma-a', 'Aria counts 18 blocks one by one and says “eighteen” as the total, extending one-to-one counting beyond ten.', 'OBS-0147')],
      [s('s-ma-b', 'When counting blocks, Aria touches each one and states the total, up to 18.', 'OBS-0147')]
    ],
    shorten: [[s('s-ma-c', 'Aria counts objects to 18 and states the total.', 'OBS-0147')]]
  },
  'p-se': {
    clearer: [
      [s('s-se-a', 'Aria takes turns at the block corner and offers materials to peers without being asked.', 'OBS-0151'), s('s-se-b', 'She is beginning to name her feelings when play does not go her way.', 'OBS-0156')],
      [s('s-se-c', 'During block play, Aria waits for her turn and hands a friend the piece they need.', 'OBS-0151'), s('s-se-d', 'When her tower fell, she said “I feel sad” and asked a friend to help rebuild.', 'OBS-0156')]
    ],
    shorten: [[s('s-se-e', 'Aria takes turns, shares materials and is starting to name her feelings.', 'OBS-0151', 'OBS-0156')]]
  }
};

// Sentences start with the child's name, so the lead keeps the original casing.
const LEADS = ['This term, ', 'In class, '];

/** Canned rewrites of a paragraph's own sentences; sources are kept, nothing new is claimed. */
function genericOptions(paragraph: Paragraph, action: AiAction): Sentence[][] {
  const cited = paragraph.sentences.filter((x) => x.sources.length > 0);
  if (cited.length === 0) return [];
  if (action === 'shorten') return cited.length > 1 ? [[{ ...cited[0], id: `${cited[0].id}-short` }]] : [];
  return LEADS.map((lead, v) => cited.map((x) => ({ id: `${x.id}-c${v}`, text: `${lead}${x.text}`, sources: x.sources })));
}

function optionsFor(studentId: string, paragraph: Paragraph, action: AiAction): Sentence[][] {
  return studentId === 'aria' ? (ARIA_LIBRARY[paragraph.id]?.[action] ?? []) : genericOptions(paragraph, action);
}

export function variantCount(studentId: string, paragraph: Paragraph, action: AiAction): number {
  return optionsFor(studentId, paragraph, action).length;
}

export async function requestSuggestion(opts: {
  studentId: string;
  paragraph: Paragraph;
  action: AiAction;
  variant: number;
  available: boolean;
  delayMs?: number;
}): Promise<Suggestion | null> {
  const { studentId, paragraph, action, variant, available, delayMs = 900 } = opts;
  await new Promise((r) => setTimeout(r, delayMs));
  if (!available) throw new ProviderUnavailableError();
  const options = optionsFor(studentId, paragraph, action);
  if (!options || options.length === 0) return null;
  const index = variant % options.length;
  return {
    id: `${paragraph.id}:${action}:${index}`,
    paragraphId: paragraph.id,
    action,
    variant: index,
    before: paragraph.sentences,
    after: options[index]
  };
}
