import type { Dict } from '../en';

export const common: Dict['common'] = {
  domains: {
    en: { full: 'Bahasa Inggeris 英语', short: 'Inggeris 英语' },
    zh: { full: 'Bahasa Cina 华语', short: 'Cina 华语' },
    ma: { full: 'Matematik 数学', short: 'Matematik 数学' },
    se: { full: 'Perkembangan Sosio-Emosi 社交与情绪发展', short: 'Sosio-Emosi 社交与情绪' }
  },
  milestones: {
    emerging: 'Baru muncul',
    developing: 'Sedang berkembang',
    consistent: 'Ditunjukkan secara konsisten'
  },
  status: {
    notStarted: 'Belum dimulakan',
    draft: 'Draf',
    review: 'Dalam semakan',
    changes: 'Perubahan diminta',
    approved: 'Diluluskan'
  },
  notObserved: 'Belum diperhatikan',
  needsVerification: 'Perlu pengesahan guru',
  mockProvider: 'Penyedia simulasi (Mock provider)',
  demoStudent: 'Murid demo',
  term4: 'Penggal 4 2026',
  term3: 'Penggal 3 2026'
};
