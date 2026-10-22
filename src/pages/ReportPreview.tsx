import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { BrandMark } from '../components/BrandMark';
import { PhotoIllustration } from '../components/EmptyIllustration';
import { ReadinessList, ReportFlow } from '../components/ReportFlow';
import { MilestoneDots, Notice, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, REVIEWER, TEACHER, TODAY } from '../data/demo';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { frameworkFor } from '../framework';
import { useDirtyGuard } from '../pwa';
import { usePortfolio } from '../store/PortfolioContext';
import { approvalBlock, observationsFor, readiness, selectReportHistory, unverifiedClaims } from '../store/reducer';
import { milestonesFor, studentSummary } from '../store/selectors';
import { useVisit } from '../hooks/useNavMemory';
import { NotFound } from './NotFound';
import { useRole } from '../roles/RoleContext';
import { now } from '../utils/clock';

export function ReportPreview() {
  const { id = '' } = useParams();
  const { state, dispatch } = usePortfolio();
  const role = useRole();
  // Undefined until edited: the prefilled note follows the current language.
  const [editedNote, setEditedNote] = useState<string | undefined>(undefined);
  const [requesting, setRequesting] = useState(false);
  const [showChecks, setShowChecks] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenError, setReopenError] = useState(false);
  const [reopenAnnouncement, setReopenAnnouncement] = useState(false);
  const [focusStatusAfterReopen, setFocusStatusAfterReopen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reopenTrigger = useRef<HTMLButtonElement>(null);
  const statusHeading = useRef<HTMLHeadingElement>(null);
  const { t, fmtDate, lang } = useI18n();
  // An approved report keeps the framework labels it was approved with.
  const { domainFull, status: statusLabel, term: periodLabel } = useLabels(state.reports[id]?.frameworkVersion);
  const changeNote = editedNote ?? t('pages.report.defaultChangeNote', { domain: domainFull('en') });
  const sum = studentSummary(state, id);
  useVisit(id, !!sum);
  useEffect(() => {
    if (reopenOpen) dialogRef.current?.querySelector<HTMLElement>('textarea')?.focus();
  }, [reopenOpen]);
  useEffect(() => {
    if (!focusStatusAfterReopen || state.reports[id]?.status !== 'draft') return;
    statusHeading.current?.focus();
    setFocusStatusAfterReopen(false);
  }, [focusStatusAfterReopen, id, state.reports]);
  useEffect(() => {
    if (!reopenOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setReopenOpen(false); reopenTrigger.current?.focus(); }
      if (event.key === 'Tab' && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll<HTMLElement>('button, textarea')].filter((item) => !item.hasAttribute('disabled'));
        if (items.length === 0) return;
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [reopenOpen]);
  // The request-changes note is unsaved work while its editor is open.
  useDirtyGuard(requesting && sum?.report.status === 'review');
  if (!sum) return <NotFound />;
  if (!role.can('report.view')) return <AppShell module="reports" mobileTitle={t('pages.report.title')}>{() => <div className="card card-pad stack"><h1 className="h1">{t('shell.roles.accessDenied')}</h1><Link className="btn btn-secondary" to="/">{t('pages.report.dashboard')}</Link></div>}</AppShell>;
  const { student, report } = sum;
  // An approved report shows the milestones it was approved with; later observations do not change it.
  const versions = report.versions;
  const latestVersion = versions.at(-1);
  const viewingVersion = report.status === 'approved' ? versions.find((version) => version.version === (selectedVersion ?? latestVersion?.version)) : undefined;
  const term4 = viewingVersion?.milestones ?? report.milestones ?? milestonesFor(state, id, 4);
  const ready = readiness(state, id);
  const checksDone = [ready.domainsWritten === ready.domainsTotal, ready.sentences > 0 && ready.unverified === 0, ready.hasReflection, true].filter(Boolean).length;
  const paragraphs = viewingVersion?.paragraphs ?? state.paragraphs[id] ?? [];
  const reflection = viewingVersion?.reflection ?? state.reflections[id] ?? '';
  const claims = unverifiedClaims(state, id);
  const block = approvalBlock(state, id);
  const observations = observationsFor(state, id);
  const decisions = selectReportHistory(state.auditEvents, id);
  const status = report.status;
  const term = periodLabel(4);
  const fw = frameworkFor(viewingVersion?.frameworkVersion ?? report.frameworkVersion);
  const openStudio = t('pages.shared.openStudio');

  const approve = () => {
    if (block) return;
    const at = now();
    dispatch({ type: 'approve', studentId: id, at, approvedBy: REVIEWER, actor: { role: 'reviewer', name: REVIEWER } });
  };
  const release = () => dispatch({ type: 'release', studentId: id, at: now(), releasedBy: REVIEWER, actor: { role: 'reviewer', name: REVIEWER } });
  const reopen = () => {
    if (!reopenReason.trim()) { setReopenError(true); return; }
    dispatch({ type: 'reopen', studentId: id, reason: reopenReason, reopenedBy: REVIEWER, at: now(), actor: { role: 'reviewer', name: REVIEWER } });
    setReopenOpen(false); setReopenReason(''); setSelectedVersion(null); setReopenAnnouncement(true); setFocusStatusAfterReopen(true);
  };
  const linkFirstCandidate = (sentenceId: string, paragraphId: string) => {
    const domain = paragraphs.find((p) => p.id === paragraphId)!.domain;
    const obs = observations.find((o) => o.domain === domain);
    if (obs) dispatch({ type: 'linkSource', studentId: id, sentenceId, obsId: obs.id });
  };

  const steps = <ReportFlow status={status} hadChanges={report.hadChanges} />;

  const actions = (mobile: boolean) => {
    if (status === 'review' && !role.can('report.review')) {
      return <Notice tone="info" icon="lock" role="status">
        <p className="body-text">{t('shell.roles.onlyReviewer')}</p>
        <button className="btn btn-secondary" type="button" onClick={() => role.setRole('reviewer')}>{t('shell.roles.switchReviewer')}</button>
      </Notice>;
    }
    if (status === 'review') {
      return requesting ? (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setRequesting(false)}>{t('pages.shared.cancel')}</button>
          <button className="btn btn-primary grow" type="button" onClick={() => { dispatch({ type: 'requestChanges', studentId: id, text: changeNote, date: now() }); setRequesting(false); }}>{t('pages.report.sendRequest')}</button>
        </>
      ) : (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setRequesting(true)}>{t('pages.report.requestChanges')}</button>
          <button className="btn btn-primary grow" type="button" onClick={approve} aria-disabled={!!block} aria-describedby={block ? 'approve-blocked' : undefined}><Icon name="check" size={18} />{t('pages.report.approve')}</button>
        </>
      );
    }
    if (status === 'notStarted') {
      return <Link className="btn btn-primary grow" to={`/students/${id}/studio`}>{openStudio}</Link>;
    }
    if ((status === 'changes' || status === 'draft') && role.can('report.submit')) {
      return (
        <>
          <Link className="btn btn-secondary" to={`/students/${id}/studio`}>{mobile ? t('pages.report.editDraft') : openStudio}</Link>
          <button
            className="btn btn-primary grow"
            type="button"
            onClick={() => ready.canSubmit && dispatch({ type: 'submitForReview', studentId: id, submittedAt: now() })}
            aria-disabled={!ready.canSubmit}
            aria-describedby={ready.canSubmit ? undefined : 'not-ready'}
          >
            {t('pages.shared.submitForReview')}
          </button>
        </>
      );
    }
    if ((status === 'changes' || status === 'draft') && !role.can('report.submit')) {
      return <Notice tone="info" icon="lock" role="status">
        <p className="body-text">{t('shell.roles.draftBlocked')}</p>
        <button className="btn btn-secondary" type="button" onClick={() => role.setRole('teacher')}>{t('shell.roles.switchTeacher')}</button>
      </Notice>;
    }
    return (
      <>
        <Link className="btn btn-secondary" to="/">{mobile ? t('pages.report.dashboard') : t('pages.report.backToDashboard')}</Link>
        <button className="btn btn-primary grow" type="button" onClick={() => window.print()}><Icon name="printer" size={18} />{t('pages.report.exportPrint')}</button>
        {(status === 'approved' && role.can('report.review')) && (
          <>
            {report.releasedVersion !== latestVersion?.version && <button className="btn btn-primary" type="button" onClick={release}>{t('pages.report.releaseAction')}</button>}
            <button ref={reopenTrigger} className="btn btn-secondary" type="button" onClick={() => { setReopenReason(''); setReopenError(false); setReopenOpen(true); }}>{t('pages.report.reopenAction')}</button>
          </>
        )}
        {role.can('report.view') && <Link className="btn btn-ghost" to={`/students/${id}/report/family`}>{t('pages.report.familyCopy')}</Link>}
      </>
    );
  };

  const panel = (mobile: boolean) => (
    <aside className="panel report-panel" aria-label={t('pages.report.reviewLabel')} style={{ overflow: 'visible' }}>
      <div className="panel-head"><h2 ref={statusHeading} tabIndex={-1} className="h2 grow">{t('pages.report.statusHeading')}</h2><StatusLabel status={status} /></div>
      {reopenAnnouncement && <span className="sr-only" role="status" aria-live="polite">{t('pages.report.reopenedAnnounce')}</span>}
      <div className="stack" style={{ padding: 16, gap: 20 }}>
        {status === 'changes' && report.comment && (
          <Notice tone="warning" icon="alert" role="status">
            <p className="cap num">{t('pages.report.reviewerLine', { name: report.comment.by, date: fmtDate(report.comment.date) })}</p>
            <p className="body-text">{report.comment.text}</p>
            <p className="sec">{t('pages.report.changesNotice', { teacher: TEACHER })}</p>
            <Link className="btn btn-secondary" to={`/students/${id}/studio`} style={{ alignSelf: 'flex-start' }}>{openStudio}</Link>
          </Notice>
        )}
        {steps}
        {viewingVersion && (
          <div className="stack" style={{ gap: 8 }}>
            <p className="sec semibold">{t('pages.report.versionBadge', { version: viewingVersion.version, date: fmtDate(viewingVersion.approvedAt), name: viewingVersion.approvedBy })}</p>
            {report.releasedVersion === viewingVersion.version && <p className="cap semibold" role="status">{t('pages.report.releasedBadge')}</p>}
            {versions.length > 1 && <label className="field"><span className="field-label">{t('pages.report.versions')}</span><select className="input" value={viewingVersion.version} onChange={(event) => setSelectedVersion(Number(event.target.value))}>{versions.map((version) => <option key={version.version} value={version.version}>{t('pages.report.version', { version: version.version })}</option>)}</select></label>}
          </div>
        )}
        {report.releasedVersion !== undefined && <p className="cap muted">{t('pages.report.releasedBadge')} · {t('pages.report.version', { version: report.releasedVersion })}</p>}
        <section className="stack" aria-labelledby="decision-history" style={{ gap: 8 }}>
          <h3 id="decision-history" className="sec semibold">{t('pages.report.history')}</h3>
          {decisions.map((decision, index) => {
            const label = decision.type === 'submitted' ? t('pages.audit.submitted') : decision.type === 'changesRequested' ? t('pages.audit.changesRequested') : decision.type === 'approved' ? t('pages.audit.approved') : decision.type === 'released' ? t('pages.audit.released') : t('pages.audit.reopened');
            return <div className="card stack" style={{ padding: 12, gap: 4 }} key={`${decision.type}-${decision.at}-${index}`}><p className="sec semibold">{label}{'version' in decision ? ` · ${t('pages.report.version', { version: decision.version })}` : ''}</p><p className="cap muted">{fmtDate(decision.at)} · {decision.by}</p>{'comment' in decision && <p className="sec">{decision.comment}</p>}{'reason' in decision && <p className="sec">{decision.reason}</p>}</div>;
          })}
        </section>
        {role.can('audit.view') && <Link className="btn btn-ghost" to="/audit">{t('pages.audit.title')}</Link>}
        <div className="stack" style={{ gap: 8 }}>
          <h3 className="sec semibold">{t('pages.report.beforeApproval')}</h3>
          {mobile ? (
            <>
              <button className="btn btn-ghost checks-toggle" type="button" aria-expanded={showChecks} aria-controls="readiness-list" onClick={() => setShowChecks((v) => !v)}>
                <Icon name={ready.canApprove ? 'check' : 'alert'} size={18} className={ready.canApprove ? 'ic-primary' : undefined} />
                <span className="grow">{t('pages.report.checksSummary', { done: checksDone, total: 4 })}</span>
                <Icon name="chevronRight" size={18} className={showChecks ? 'rot-90' : undefined} />
              </button>
              {showChecks && <ReadinessList r={ready} id="readiness-list" />}
            </>
          ) : (
            <ReadinessList r={ready} />
          )}
        </div>
        {report.comment && status === 'review' && (
          <div className="card stack" style={{ padding: '12px 16px', gap: 6, background: 'var(--color-surface-muted)' }}>
            <p className="cap muted num">{t('pages.report.reviewerLine', { name: report.comment.by, date: fmtDate(report.comment.date) })}</p>
            <p className="sec">{report.comment.text}</p>
          </div>
        )}
        {status === 'review' && block?.reason === 'incomplete' && (
          <Notice tone="warning" icon="lock" id="approve-blocked" role="status">
            <p className="semibold">{t('pages.report.blocked')}</p>
            <p className="body-text">{t('pages.report.notReadyBody')}</p>
          </Notice>
        )}
        {(status === 'draft' || status === 'changes') && !ready.canSubmit && (
          <p id="not-ready" className="sec semibold" style={{ color: 'var(--color-warning)' }}>{t('pages.report.notReady')} · {t('pages.report.notReadyBody')}</p>
        )}
        {status === 'review' && block?.reason === 'claims' && role.can('report.review') && (
          <Notice tone="warning" icon="lock" id="approve-blocked" role="status">
            <p className="semibold">{t('pages.report.blocked')}</p>
            <p className="body-text">{t('pages.report.blockedBody', { count: block.count })}</p>
            {claims.map((c) => (
              <div key={c.sentence.id} className="stack" style={{ gap: 6 }}>
                <p className="body-text">“{c.sentence.text}” · {domainFull(paragraphs.find((p) => p.id === c.paragraphId)!.domain)}</p>
                <div className="row">
                  <button className="btn btn-secondary" type="button" onClick={() => linkFirstCandidate(c.sentence.id, c.paragraphId)}><Icon name="link" size={18} />{t('pages.report.linkEvidence')}</button>
                  <Link className="btn btn-ghost" to={`/students/${id}/studio`}>{t('pages.report.fixInStudio')}</Link>
                </div>
              </div>
            ))}
          </Notice>
        )}
        {status === 'review' && requesting && (
          <div className="field">
            <label className="field-label" htmlFor="change-note">{t('pages.report.whatChange')}</label>
            <textarea id="change-note" className="input" rows={3} value={changeNote} onChange={(e) => setEditedNote(e.target.value)} />
          </div>
        )}
        {status === 'approved' && (
          <Notice tone="success" icon="check" role="status">
            <p className="semibold">{statusLabel('approved')}</p>
            <p className="body-text num">
              {t('pages.report.approvedBy', {
                date: fmtDate(viewingVersion?.approvedAt ?? report.approvedAt ?? TODAY),
                name: viewingVersion?.approvedBy ?? report.approvedBy ?? REVIEWER
              })}
            </p>
          </Notice>
        )}
        {!mobile && <div className="row">{actions(false)}</div>}
        {status === 'approved' && <p className="cap muted">{t('pages.report.exportNote')}</p>}
      </div>
    </aside>
  );

  const sheet = (
    <article className="a4" aria-label={t('pages.report.sheetLabel')}>
      <div className="a4-strip">{t('pages.report.sampleStrip')}</div>
      <div className="a4-body">
        <div className="row" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'nowrap' }}>
          <div className="grow stack" style={{ gap: 6 }}>
            <p className="cap muted row" style={{ gap: 8 }}><BrandMark size={24} />{t('pages.report.portfolioLine', { term })}</p>
            <h2 className="h1">{student.name}</h2>
            <p className="sec muted">{t('pages.report.keyTeacherLine', { class: CLASS_NAME, teacher: TEACHER })}</p>
          </div>
          <PhotoIllustration report />
        </div>
        {paragraphs.length === 0 && <p className="sec muted">{t('pages.report.noNarrative')}</p>}
        {paragraphs.map((p) => (
          <section key={p.id}>
            <div className="domain-head" style={{ marginBottom: 8 }}><h3 className="strong">{domainFull(p.domain)}</h3><MilestoneDots milestone={term4[p.domain]} version={report.frameworkVersion} /></div>
            <p className="narr">
              {p.sentences.map((s) => (
                <Fragment key={s.id}>
                  {s.sources.length === 0 ? (
                    <>
                      <mark className="flag">{s.text}</mark> <span className="no-print"><VerifyLabel /></span>
                    </>
                  ) : (
                    s.text
                  )}{' '}
                </Fragment>
              ))}
            </p>
          </section>
        ))}
        <section>
          <div className="domain-head" style={{ marginBottom: 8 }}><h3 className="strong">{t('pages.report.reflection')}</h3></div>
          <p className="narr">{reflection}</p>
        </section>
        <div className="grow" />
        <div className="row" style={{ justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <p className="cap muted">{t('pages.report.preparedBy', { teacher: TEACHER })} · {status === 'approved' ? t('pages.report.approvedByLine', { name: viewingVersion?.approvedBy ?? report.approvedBy ?? REVIEWER }) : t('pages.report.notApproved')}</p>
          <p className="cap muted num">{t('pages.report.frameworkLine', { name: fw.name[lang], version: viewingVersion?.frameworkVersion ?? report.frameworkVersion ?? fw.version })} · {t('pages.report.pageOf', { page: 1, total: 1 })}</p>
        </div>
      </div>
    </article>
  );

  return (
    <AppShell
      module="reports"
      currentStudentId={id}
      crumbs={[{ label: t('shell.module.students'), to: '/students' }, { label: student.name, to: `/students/${id}` }, { label: t('pages.report.title') }]}
      mobileTitle={t('pages.report.title')}
      mobileSubtitle={`${student.name} · ${term}`}
      mobileBack={`/students/${id}/studio`}
      mobileActions={actions(true)}
    >
      {(bp) => (
        <>
          {bp !== 'mobile' && (
            <div className="page-head">
              <Link className="icon-btn" to={`/students/${id}/studio`} aria-label={t('pages.report.backToStudio')} title={t('pages.report.backToStudioTitle')}><Icon name="arrowLeft" /></Link>
              <div className="grow">
                <h1 className="h1">{t('pages.report.title')}</h1>
                <p className="sec muted">{student.name} · {t('common.demoStudent')} · {term} · {t('pages.report.subtitleA4')}</p>
              </div>
            </div>
          )}
          <div className="report-layout">
            {bp === 'mobile' ? (
              <>
                {panel(true)}
                {sheet}
                <p className="cap muted">{t('pages.report.phoneNote')}</p>
              </>
            ) : (
              <>
                <div className="report-sheet-wrap">{sheet}</div>
                {panel(false)}
              </>
            )}
          </div>
          {reopenOpen && (
            <div className="report-dialog-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) { setReopenOpen(false); reopenTrigger.current?.focus(); } }}>
              <div ref={dialogRef} className="card stack report-dialog" role="dialog" aria-modal="true" aria-labelledby="reopen-title" aria-describedby="reopen-hint">
                <h2 id="reopen-title" className="h2">{t('pages.report.reopenTitle')}</h2>
                <p id="reopen-hint" className="sec muted">{t('pages.report.reopenHint')}</p>
                <label className="field"><span className="field-label">{t('pages.report.reopenReason')}</span><textarea className="input" rows={4} value={reopenReason} aria-invalid={reopenError} onChange={(event) => { setReopenReason(event.target.value); setReopenError(false); }} /></label>
                {reopenError && <p className="sec" role="alert">{t('pages.report.reopenRequired')}</p>}
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" type="button" onClick={() => { setReopenOpen(false); reopenTrigger.current?.focus(); }}>{t('pages.report.close')}</button>
                  <button className="btn btn-primary" type="button" onClick={reopen}>{t('pages.report.reopenConfirm')}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
