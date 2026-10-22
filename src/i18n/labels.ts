import type { ReportStatus } from '../data/demo';
import { NEL_AREAS, frameworkFor, type DomainKey, type Milestone, type NelKey } from '../framework';
import { useI18n } from '.';

/**
 * Labels in the current language. Learning areas, milestone levels and reporting periods come from
 * the Learning Framework (pass a report's framework version to keep the labels it was approved with).
 */
export function useLabels(frameworkVersion?: string) {
  const { t, lang } = useI18n();
  const fw = frameworkFor(frameworkVersion);
  const area = (k: DomainKey) => fw.areas.find((a) => a.key === k)!;
  const period = (term: 3 | 4) => fw.periods.find((p) => p.term === term)!;
  return {
    domainFull: (k: DomainKey) => area(k).full[lang],
    domainShort: (k: DomainKey) => area(k).short[lang],
    milestone: (m: Milestone) => fw.scale.find((x) => x.key === m)!.label[lang],
    term: (term: 3 | 4) => period(term).label[lang],
    termShort: (term: 3 | 4) => period(term).short[lang],
    nel: (k: NelKey) => NEL_AREAS.find((n) => n.key === k)!.label[lang],
    /** The NEL learning area (or core competency) this area maps to. */
    domainNel: (k: DomainKey) => NEL_AREAS.find((n) => n.key === area(k).nel)!.label[lang],
    status: (s: ReportStatus) => t(`common.status.${s}`)
  };
}
