import { Fragment, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { ReportFlow } from '../components/ReportFlow';
import { MilestoneDots, Notice, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, REVIEWER, TEACHER, TODAY } from '../data/demo';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { useDirtyGuard } from '../pwa';
import { usePortfolio } from '../store/PortfolioContext';
import { approvalBlock, observationsFor, unverifiedClaims } from '../store/reducer';
import { studentSummary } from '../store/selectors';
import { useVisit } from '../hooks/useNavMemory';
import { NotFound } from './NotFound';

export function ReportPreview() {
  const { id = '' } = useParams();
  const { state, dispatch } = usePortfolio();
  // Undefined until edited: the prefilled note follows the current language.
  const [editedNote, setEditedNote] = useState<string | undefined>(undefined);
  const [requesting, setRequesting] = useState(false);
  const { t, fmtDate, fmtTime } = useI18n();
  const { domainFull, status: statusLabel } = useLabels();
  const changeNote = editedNote ?? t('pages.report.defaultChangeNote', { domain: domainFull('en') });
  const sum = studentSummary(state, id);
  useVisit(id, !!sum);
  // The request-changes note is unsaved work while its editor is open.
  useDirtyGuard(requesting && sum?.report.status === 'review');
  if (!sum) return <NotFound />;
  const { student, report } = sum;
  const paragraphs = state.paragraphs[id] ?? [];
  const claims = unverifiedClaims(state, id);
  const block = approvalBlock(state, id);
  const observations = observationsFor(state, id);
  const status = report.status;
  const term = t('common.term4');
  const openStudio = t('pages.shared.openStudio');

  const approve = () => {
    if (block) return;
    dispatch({ type: 'approve', studentId: id, at: t('pages.report.approvedAt', { date: fmtDate(TODAY), time: fmtTime(new Date()) }) });
  };
  const linkFirstCandidate = (sentenceId: string, paragraphId: string) => {
    const domain = paragraphs.find((p) => p.id === paragraphId)!.domain;
    const obs = observations.find((o) => o.domain === domain);
    if (obs) dispatch({ type: 'linkSource', studentId: id, sentenceId, obsId: obs.id });
  };

  const steps = <ReportFlow status={status} hadChanges={report.hadChanges} />;

  const actions = (mobile: boolean) => {
    if (status === 'review') {
      return requesting ? (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setRequesting(false)}>{t('pages.shared.cancel')}</button>
          <button className="btn btn-primary grow" type="button" onClick={() => { dispatch({ type: 'requestChanges', studentId: id, text: changeNote, date: TODAY }); setRequesting(false); }}>{t('pages.report.sendRequest')}</button>
        </>
      ) : (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setRequesting(true)}>{t('pages.report.requestChanges')}</button>
          <button className="btn btn-primary grow" type="button" onClick={approve} aria-disabled={!!block} aria-describedby={block ? 'approve-blocked' : undefined}><Icon name="check" size={18} />{t('pages.report.approve')}</button>
        </>
      );
    }
    if (status === 'changes' || status === 'draft' || status === 'notStarted') {
      return (
        <>
          <Link className="btn btn-secondary" to={`/students/${id}/studio`}>{mobile ? t('pages.report.editDraft') : openStudio}</Link>
          <button className="btn btn-primary grow" type="button" onClick={() => dispatch({ type: 'submitForReview', studentId: id })}>{t('pages.shared.submitForReview')}</button>
        </>
      );
    }
    return (
      <>
        <Link className="btn btn-secondary" to="/">{mobile ? t('pages.report.dashboard') : t('pages.report.backToDashboard')}</Link>
        <button className="btn btn-primary grow" type="button" onClick={() => window.print()}><Icon name="printer" size={18} />{t('pages.report.exportPrint')}</button>
      </>
    );
  };

  const panel = (mobile: boolean) => (
    <aside className="panel report-panel" aria-label={t('pages.report.reviewLabel')} style={{ overflow: 'visible' }}>
      <div className="panel-head"><h2 className="h2 grow">{t('pages.report.statusHeading')}</h2><StatusLabel status={status} /></div>
      <div className="stack" style={{ padding: 16, gap: 20 }}>
        {steps}
        <div className="stack" style={{ gap: 8 }}>
          <h3 className="sec semibold">{t('pages.report.beforeApproval')}</h3>
          <ul className="sec stack" style={{ gap: 8 }}>
            <li className="row" style={{ flexWrap: 'nowrap' }}><Icon name="check" size={18} className="ic-primary" />{t('pages.report.checkDomains')}</li>
            {claims.length === 0 ? (
              <li className="row" style={{ flexWrap: 'nowrap' }}><Icon name="check" size={18} className="ic-primary" />{t('pages.report.checkClaims')}</li>
            ) : (
              <li className="row semibold" style={{ flexWrap: 'nowrap', color: 'var(--color-warning)' }}><Icon name="alert" size={18} />{t('pages.shared.claims', { count: claims.length })}</li>
            )}
            <li className="row" style={{ flexWrap: 'nowrap' }}><Icon name="check" size={18} className="ic-primary" />{t('pages.report.checkReflection')}</li>
            <li className="row" style={{ flexWrap: 'nowrap' }}><Icon name="check" size={18} className="ic-primary" />{t('pages.report.checkSample')}</li>
          </ul>
        </div>
        {report.comment && (status === 'review' || status === 'changes') && (
          <div className="card stack" style={{ padding: '12px 16px', gap: 6, background: 'var(--color-surface-muted)' }}>
            <p className="cap muted num">{t('pages.report.reviewerLine', { name: report.comment.by, date: fmtDate(report.comment.date) })}</p>
            <p className="sec">{report.comment.text}</p>
          </div>
        )}
        {status === 'review' && block?.reason === 'claims' && (
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
        {status === 'changes' && <Notice tone="warning" icon="alert" role="status"><p className="body-text">{t('pages.report.changesNotice', { teacher: TEACHER })}</p></Notice>}
        {status === 'approved' && (
          <Notice tone="success" icon="check" role="status">
            <p className="semibold">{statusLabel('approved')}</p>
            <p className="body-text num">{t('pages.report.approvedBy', { date: report.approvedAt ?? fmtDate(TODAY), name: REVIEWER })}</p>
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
            <p className="cap muted row" style={{ gap: 8 }}><span className="monogram" style={{ width: 24, height: 24, fontSize: 10 }}>AP</span>{t('pages.report.portfolioLine', { term })}</p>
            <h2 className="h1">{student.name}</h2>
            <p className="sec muted">{t('pages.report.keyTeacherLine', { class: CLASS_NAME, teacher: TEACHER })}</p>
          </div>
          <div className="ph" style={{ width: 88, height: 88, flex: 'none', padding: 8 }}>{t('pages.shared.photoPlaceholder')}</div>
        </div>
        {paragraphs.length === 0 && <p className="sec muted">{t('pages.report.noNarrative')}</p>}
        {paragraphs.map((p) => (
          <section key={p.id}>
            <div className="domain-head" style={{ marginBottom: 8 }}><h3 className="strong">{domainFull(p.domain)}</h3><MilestoneDots milestone={student.term4[p.domain]} /></div>
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
          <p className="narr">{state.reflections[id] ?? ''}</p>
        </section>
        <div className="grow" />
        <div className="row" style={{ justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <p className="cap muted">{t('pages.report.preparedBy', { teacher: TEACHER })} · {status === 'approved' ? t('pages.report.approvedByLine', { name: REVIEWER }) : t('pages.report.notApproved')}</p>
          <p className="cap muted num">{t('pages.report.pageOf', { page: 1, total: 1 })}</p>
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
      mobileTrailing={<StatusLabel status={status} />}
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
              <StatusLabel status={status} />
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
        </>
      )}
    </AppShell>
  );
}
