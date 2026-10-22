import type { ReportStatus } from '../data/demo';
import type { Readiness } from '../store/reducer';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { Icon } from './Icon';

export const FLOW: ReportStatus[] = ['draft', 'review', 'changes', 'approved'];

/** Draft → In review → Changes requested → Approved, with the current step marked. */
export function ReportFlow({ status, hadChanges, compact }: { status: ReportStatus; hadChanges?: boolean; compact?: boolean }) {
  const { t } = useI18n();
  const { status: statusLabel } = useLabels();
  const cur = FLOW.indexOf(status);
  return (
    <ol aria-label={t('pages.report.flowLabel')} className={`stack${compact ? ' flow-compact' : ''}`} style={{ gap: compact ? 0 : 4 }}>
      {FLOW.map((st, i) => {
        const skipped = st === 'changes' && status === 'approved' && !hadChanges;
        const done = cur > i && !skipped;
        const current = cur === i;
        return (
          <li key={st} className="step" aria-current={current ? 'step' : undefined}>
            <span className={`step-mark${done ? ' done' : current ? ' current' : ''}`}>{done ? <Icon name="check" size={14} /> : i + 1}</span>
            <span className={`sec grow${current ? ' semibold' : ''}`}>{statusLabel(st)}</span>
            <span className="cap muted">{current ? t('pages.report.current') : skipped ? t('pages.report.notNeeded') : done ? t('pages.report.done') : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** The "Before approval" checks, computed from the report's real content. */
export function ReadinessList({ r, id }: { r: Readiness; id?: string }) {
  const { t } = useI18n();
  const items: { ok: boolean; text: string }[] = [
    { ok: r.domainsWritten === r.domainsTotal, text: r.domainsWritten === r.domainsTotal ? t('pages.report.checkDomains') : t('pages.report.domainsPartial', { count: r.domainsWritten, total: r.domainsTotal }) },
    r.sentences === 0
      ? { ok: false, text: t('pages.report.noSentences') }
      : { ok: r.unverified === 0, text: r.unverified === 0 ? t('pages.report.checkClaims') : t('pages.shared.claims', { count: r.unverified }) },
    { ok: r.hasReflection, text: r.hasReflection ? t('pages.report.checkReflection') : t('pages.report.reflectionMissing') },
    { ok: true, text: t('pages.report.checkSample') }
  ];
  return (
    <ul id={id} className="sec stack readiness" style={{ gap: 8 }}>
      {items.map((it, i) => (
        <li key={i} className={`row${it.ok ? '' : ' semibold'}`} style={{ flexWrap: 'nowrap', color: it.ok ? undefined : 'var(--color-warning)' }} data-ok={it.ok}>
          <Icon name={it.ok ? 'check' : 'alert'} size={18} className={it.ok ? 'ic-primary' : undefined} />
          <span className="sr-only">{it.ok ? t('pages.report.done') : t('pages.report.todo')}: </span>
          {it.text}
        </li>
      ))}
    </ul>
  );
}
