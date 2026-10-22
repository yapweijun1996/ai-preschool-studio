import { Fragment, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { MilestoneDots, Notice, StatusLabel, VerifyLabel } from '../components/ui';
import { CLASS_NAME, REPORT_STATUS_LABEL, REVIEWER, TEACHER, TERM, TODAY, domainFull, formatDate, type ReportStatus } from '../data/demo';
import { usePortfolio } from '../store/PortfolioContext';
import { approvalBlock, observationsFor, unverifiedClaims } from '../store/reducer';
import { studentSummary } from '../store/selectors';
import { useVisit } from '../hooks/useNavMemory';
import { NotFound } from './NotFound';

const FLOW: ReportStatus[] = ['draft', 'review', 'changes', 'approved'];

export function ReportPreview() {
  const { id = '' } = useParams();
  const { state, dispatch } = usePortfolio();
  const [changeNote, setChangeNote] = useState('Please check the reading claim in English Language 英语 — I can’t see an observation for it.');
  const [requesting, setRequesting] = useState(false);
  const sum = studentSummary(state, id);
  useVisit(id, !!sum);
  if (!sum) return <NotFound />;
  const { student, report } = sum;
  const paragraphs = state.paragraphs[id] ?? [];
  const claims = unverifiedClaims(state, id);
  const block = approvalBlock(state, id);
  const observations = observationsFor(state, id);
  const status = report.status;
  const cur = FLOW.indexOf(status);

  const approve = () => {
    if (block) return;
    dispatch({ type: 'approve', studentId: id, at: `${formatDate(TODAY)}, ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` });
  };
  const linkFirstCandidate = (sentenceId: string, paragraphId: string) => {
    const domain = paragraphs.find((p) => p.id === paragraphId)!.domain;
    const obs = observations.find((o) => o.domain === domain);
    if (obs) dispatch({ type: 'linkSource', studentId: id, sentenceId, obsId: obs.id });
  };

  const steps = (
    <ol aria-label="Report flow" className="stack" style={{ gap: 4 }}>
      {FLOW.map((st, i) => {
        const skipped = st === 'changes' && status === 'approved' && !report.hadChanges;
        const done = cur > i && !skipped;
        const current = cur === i;
        return (
          <li key={st} className="step" aria-current={current ? 'step' : undefined}>
            <span className={`step-mark${done ? ' done' : current ? ' current' : ''}`}>{done ? <Icon name="check" size={14} /> : i + 1}</span>
            <span className="sec semibold grow">{REPORT_STATUS_LABEL[st]}</span>
            <span className="cap muted">{current ? 'Current' : skipped ? 'Not needed' : done ? 'Done' : ''}</span>
          </li>
        );
      })}
    </ol>
  );

  const actions = (mobile: boolean) => {
    if (status === 'review') {
      return requesting ? (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setRequesting(false)}>Cancel</button>
          <button className="btn btn-primary grow" type="button" onClick={() => { dispatch({ type: 'requestChanges', studentId: id, text: changeNote, date: TODAY }); setRequesting(false); }}>Send request</button>
        </>
      ) : (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setRequesting(true)}>Request changes</button>
          <button className="btn btn-primary grow" type="button" onClick={approve} aria-disabled={!!block} aria-describedby={block ? 'approve-blocked' : undefined}><Icon name="check" size={18} />Approve</button>
        </>
      );
    }
    if (status === 'changes' || status === 'draft' || status === 'notStarted') {
      return (
        <>
          <Link className="btn btn-secondary" to={`/students/${id}/studio`}>{mobile ? 'Edit draft' : 'Open AI Portfolio Studio'}</Link>
          <button className="btn btn-primary grow" type="button" onClick={() => dispatch({ type: 'submitForReview', studentId: id })}>Submit for review</button>
        </>
      );
    }
    return (
      <>
        <Link className="btn btn-secondary" to="/">{mobile ? 'Dashboard' : 'Back to dashboard'}</Link>
        <button className="btn btn-primary grow" type="button" onClick={() => window.print()}><Icon name="printer" size={18} />Export PDF / Print</button>
      </>
    );
  };

  const panel = (mobile: boolean) => (
    <aside className="panel report-panel" aria-label="Review" style={{ overflow: 'visible' }}>
      <div className="panel-head"><h2 className="h2 grow">Report status</h2><StatusLabel status={status} /></div>
      <div className="stack" style={{ padding: 16, gap: 20 }}>
        {steps}
        <div className="stack" style={{ gap: 8 }}>
          <h3 className="sec semibold">Before approval</h3>
          <ul className="sec stack" style={{ gap: 8 }}>
            <li className="row" style={{ flexWrap: 'nowrap' }}><Icon name="check" size={18} className="ic-primary" />Four domains written, bilingual headings</li>
            {claims.length === 0 ? (
              <li className="row" style={{ flexWrap: 'nowrap' }}><Icon name="check" size={18} className="ic-primary" />Every claim links to an observation</li>
            ) : (
              <li className="row semibold" style={{ flexWrap: 'nowrap', color: 'var(--color-warning)' }}><Icon name="alert" size={18} />{claims.length} {claims.length === 1 ? 'claim needs' : 'claims need'} teacher verification</li>
            )}
            <li className="row" style={{ flexWrap: 'nowrap' }}><Icon name="check" size={18} className="ic-primary" />Teacher reflection added</li>
            <li className="row" style={{ flexWrap: 'nowrap' }}><Icon name="check" size={18} className="ic-primary" />Sample data labelled on the page</li>
          </ul>
        </div>
        {report.comment && (status === 'review' || status === 'changes') && (
          <div className="card stack" style={{ padding: '12px 16px', gap: 6, background: 'var(--color-surface-muted)' }}>
            <p className="cap muted num">{report.comment.by} · Reviewer (demo) · {formatDate(report.comment.date)}</p>
            <p className="sec">{report.comment.text}</p>
          </div>
        )}
        {status === 'review' && block?.reason === 'claims' && (
          <Notice tone="warning" icon="lock" id="approve-blocked" role="status">
            <p className="semibold">Approval blocked</p>
            <p className="body-text">{block.count} {block.count === 1 ? 'claim needs' : 'claims need'} teacher verification. Link evidence or remove the claim before approving.</p>
            {claims.map((c) => (
              <div key={c.sentence.id} className="stack" style={{ gap: 6 }}>
                <p className="body-text">“{c.sentence.text}” · {domainFull(paragraphs.find((p) => p.id === c.paragraphId)!.domain)}</p>
                <div className="row">
                  <button className="btn btn-secondary" type="button" onClick={() => linkFirstCandidate(c.sentence.id, c.paragraphId)}><Icon name="link" size={18} />Link evidence</button>
                  <Link className="btn btn-ghost" to={`/students/${id}/studio`}>Fix in studio</Link>
                </div>
              </div>
            ))}
          </Notice>
        )}
        {status === 'review' && requesting && (
          <div className="field">
            <label className="field-label" htmlFor="change-note">What should change?</label>
            <textarea id="change-note" className="input" rows={3} value={changeNote} onChange={(e) => setChangeNote(e.target.value)} />
          </div>
        )}
        {status === 'changes' && <Notice tone="warning" icon="alert" role="status"><p className="body-text">Changes requested. {TEACHER} updates the draft in AI Portfolio Studio, then submits again.</p></Notice>}
        {status === 'approved' && (
          <Notice tone="success" icon="check" role="status">
            <p className="semibold">Approved</p>
            <p className="body-text num">{report.approvedAt ?? formatDate(TODAY)} · {REVIEWER} (demo reviewer)</p>
          </Notice>
        )}
        {!mobile && <div className="row">{actions(false)}</div>}
        {status === 'approved' && <p className="cap muted">Export includes the “Sample report — fictional student” label while demo mode is on.</p>}
      </div>
    </aside>
  );

  const sheet = (
    <article className="a4" aria-label="A4 report page preview">
      <div className="a4-strip">Sample report — fictional student</div>
      <div className="a4-body">
        <div className="row" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'nowrap' }}>
          <div className="grow stack" style={{ gap: 6 }}>
            <p className="cap muted row" style={{ gap: 8 }}><span className="monogram" style={{ width: 24, height: 24, fontSize: 10 }}>AP</span>Learning portfolio · {TERM}</p>
            <h2 className="h1">{student.name}</h2>
            <p className="sec muted">{CLASS_NAME} · Key teacher: {TEACHER}</p>
          </div>
          <div className="ph" style={{ width: 88, height: 88, flex: 'none', padding: 8 }}>Photo placeholder</div>
        </div>
        {paragraphs.length === 0 && <p className="sec muted">No narrative drafted yet.</p>}
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
          <div className="domain-head" style={{ marginBottom: 8 }}><h3 className="strong">Teacher reflection</h3></div>
          <p className="narr">{state.reflections[id] ?? ''}</p>
        </section>
        <div className="grow" />
        <div className="row" style={{ justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <p className="cap muted">Prepared by {TEACHER} · {status === 'approved' ? `Approved by ${REVIEWER} (demo reviewer)` : 'Not yet approved'}</p>
          <p className="cap muted num">Page 1 of 1</p>
        </div>
      </div>
    </article>
  );

  return (
    <AppShell
      module="reports"
      currentStudentId={id}
      mobileTitle="Report preview"
      mobileSubtitle={`${student.name} · ${TERM}`}
      mobileBack={`/students/${id}/studio`}
      mobileTrailing={<StatusLabel status={status} />}
      mobileActions={actions(true)}
    >
      {(bp) => (
        <>
          {bp !== 'mobile' && (
            <div className="page-head">
              <Link className="icon-btn" to={`/students/${id}/studio`} aria-label="Back to AI Portfolio Studio" title="Back to studio"><Icon name="arrowLeft" /></Link>
              <div className="grow">
                <h1 className="h1">Report preview</h1>
                <p className="sec muted">{student.name} · Demo student · {TERM} · A4</p>
              </div>
              <StatusLabel status={status} />
            </div>
          )}
          <div className="report-layout">
            {bp === 'mobile' ? (
              <>
                {panel(true)}
                {sheet}
                <p className="cap muted">The phone view reflows the A4 page. Export PDF shows the exact printed layout.</p>
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
