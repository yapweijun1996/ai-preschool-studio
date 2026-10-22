import type { Dict } from '../en';

export const common: Dict['common'] = {
  domains: {
    en: { full: '英语 English Language', short: '英语 English' },
    zh: { full: '华语 Chinese Language', short: '华语 Chinese' },
    ma: { full: '数学 Mathematics', short: '数学 Math' },
    se: { full: '社交与情绪发展 Social-Emotional Development', short: '社交与情绪 Social-Emotional' }
  },
  milestones: {
    emerging: '初现',
    developing: '发展中',
    consistent: '稳定表现'
  },
  status: {
    notStarted: '未开始',
    draft: '草稿',
    review: '审核中',
    changes: '需修改',
    approved: '已批准'
  },
  needsVerification: '需教师核实',
  mockProvider: '模拟服务（Mock provider）',
  demoStudent: '示范学生',
  term4: '2026 年第 4 学期',
  term3: '2026 年第 3 学期'
};
