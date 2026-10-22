import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { StudentTabs } from '../components/StudentTabs';
import { MilestoneDots, Notice, SourceChip } from '../components/ui';
import { DOMAINS, MILESTONES } from '../framework';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { usePortfolio } from '../store/PortfolioContext';
import { observationsFor } from '../store/reducer';
import { milestonesFor, studentSummary } from '../store/selectors';
import { useVisit } from '../hooks/useNavMemory';
import { NotFound } from './NotFound';

// Teacher-written change notes for the demo student (teacher content, not translated);
// other students show a neutral, translated line.
const NOTES: Record<string, Record<string, string>> = {
  aria: {
    en: 'Now retells familiar stories in order without picture prompts.',
    zh: 'Joins group songs and names familiar animals in 华语.',
    ma: 'Same milestone; counting has extended from 10 to 18 objects.',
    se: 'Takes turns in block play and is beginning to name feelings.'
  }
};

export function LearningProgress() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const { domainFull, milestone: label, term: periodLabel, termShort, domainNel } = useLabels();
  const { state } = usePortfolio();
  const sum = studentSummary(state, id);
  useVisit(id, !!sum);
  // ?domain=<key> (from a profile domain card) highlights that row and moves focus to it.
  const [params] = useSearchParams();
  const focusDomain = params.get('domain');
  useEffect(() => {
    if (!focusDomain) return;
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`domain-${focusDomain}`);
      el?.scrollIntoView({ block: 'center' });
      el?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [focusDomain]);
  if (!sum) return <NotFound />;
  const { student } = sum;
  const t4 = observationsFor(state, id, 4);
  const m3 = milestonesFor(state, id, 3);
  const m4 = milestonesFor(state, id, 4);
  const t3 = observationsFor(state, id, 3);
  const term3 = periodLabel(3);
  const term4 = periodLabel(4);
  const openStudio = t('pages.shared.openStudio');

  return (
    <AppShell
      module="students"
      currentStudentId={id}
      crumbs={[{ label: t('shell.module.students'), to: '/students' }, { label: student.name, to: `/students/${id}` }, { label: t('pages.progress.title') }]}
      mobileTitle={t('pages.progress.title')}
      mobileSubtitle={t('pages.progress.mobileSubtitle', { name: student.name, term3: termShort(3), term4: termShort(4) })}
      mobileBack={`/students/${id}`}
      mobileActions={<Link className="btn btn-primary btn-block" to={`/students/${id}/studio`}>{openStudio}</Link>}
    >
      {(bp) => (
        <div className="page">
          <div className="row" style={{ gap: 16 }}>
            {bp !== 'mobile' && <Link className="icon-btn" to={`/students/${id}`} aria-label={t('pages.shared.backToProfileOf', { name: student.name })} title={t('pages.shared.back')}><Icon name="arrowLeft" /></Link>}
            <div className="grow">
              {bp !== 'mobile' && <h1 className="h1">{t('pages.progress.title')}</h1>}
              <p className="sec muted">{student.name} · {t('common.demoStudent')} · {t('pages.progress.compared', { term3, term4 })}</p>
            </div>
            {bp !== 'mobile' && <Link className="btn btn-primary" to={`/students/${id}/studio`}>{openStudio}</Link>}
          </div>
          <StudentTabs id={id} active="progress" />
          <div className="row" style={{ gap: 20 }} aria-label={t('pages.progress.keyLabel')}>
            <span className="sec semibold">{t('pages.progress.milestones')}</span>
            {MILESTONES.map((m) => <MilestoneDots key={m.key} milestone={m.key} />)}
            <span className="cap muted">{t('pages.progress.keyNote')}</span>
          </div>
          <section className="card" aria-label={t('pages.progress.tableLabel', { term3: termShort(3), term4: termShort(4) })} style={{ overflow: 'hidden' }}>
            {bp !== 'mobile' && (
              <div className="table-head" aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1.6fr', gap: 16 }}>
                <span>{t('pages.progress.colDomain')}</span><span>{term3}</span><span>{term4}</span><span>{t('pages.progress.colChanged')}</span>
              </div>
            )}
            {DOMAINS.map((d) => {
              const sources = t4.filter((o) => o.domain === d.key).map((o) => o.id);
              const n3 = t3.filter((o) => o.domain === d.key).length;
              const n4 = sources.length;
              const before = m3[d.key];
              const after = m4[d.key];
              const note =
                NOTES[id]?.[d.key] ??
                (!after
                  ? t('pages.progress.notYet')
                  : !before
                    ? t('pages.progress.firstSeen', { milestone: label(after) })
                    : before === after
                      ? t('pages.progress.still', { milestone: label(after) })
                      : t('pages.progress.moved', { from: label(before), to: label(after) }));
              return (
                <div key={d.key} id={`domain-${d.key}`} tabIndex={focusDomain === d.key ? -1 : undefined} className={focusDomain === d.key ? 'row-focus' : undefined} style={{ display: 'grid', gridTemplateColumns: bp === 'mobile' ? '1fr 1fr' : '1.3fr 1fr 1fr 1.6fr', gap: 16, padding: 20, borderTop: '1px solid var(--color-border)', alignItems: 'start' }}>
                  <div className="stack" style={{ gap: 4, gridColumn: bp === 'mobile' ? '1 / -1' : undefined }}>
                    <h2 className="strong">{domainFull(d.key)}</h2>
                    <span className="cap muted">{t('pages.progress.nelLine', { area: domainNel(d.key) })}</span>
                  </div>
                  <div className="stack" style={{ gap: 6 }}>
                    <span className={bp === 'mobile' ? 'cap muted' : 'sr-only'}>{termShort(3)}</span>
                    <MilestoneDots milestone={before} />
                    {n3 > 0 && <span className="cap muted num">{t('pages.shared.observations', { count: n3 })}</span>}
                  </div>
                  <div className="stack" style={{ gap: 6 }}>
                    <span className={bp === 'mobile' ? 'cap muted' : 'sr-only'}>{termShort(4)}</span>
                    <MilestoneDots milestone={after} />
                    {n4 > 0 && <span className="cap muted num">{t('pages.shared.observations', { count: n4 })}</span>}
                  </div>
                  <div className="stack" style={{ gap: 8, gridColumn: bp === 'mobile' ? '1 / -1' : undefined }}>
                    <p className="sec measure">{note}</p>
                    {sources.length > 0 && <span className="row" style={{ gap: 6 }}>{sources.map((s) => <SourceChip key={s} id={s} />)}</span>}
                  </div>
                </div>
              );
            })}
          </section>
          <Notice tone="info" icon="info">
            <p className="body-text">{t('pages.progress.notice', { label: t('common.needsVerification'), term: termShort(4) })}</p>
          </Notice>
        </div>
      )}
    </AppShell>
  );
}
