import type { DomainKey, Milestone, ReportStatus } from '../data/demo';
import { useI18n } from '.';

/** Glossary labels in the current language (domains stay bilingual with 中文). */
export function useLabels() {
  const { t } = useI18n();
  return {
    domainFull: (k: DomainKey) => t(`common.domains.${k}.full`),
    domainShort: (k: DomainKey) => t(`common.domains.${k}.short`),
    milestone: (m: Milestone) => t(`common.milestones.${m}`),
    status: (s: ReportStatus) => t(`common.status.${s}`)
  };
}
