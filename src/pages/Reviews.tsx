import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { useRole } from '../roles/RoleContext';
import { useDataPort, usePortfolio } from '../store/PortfolioContext';
import type { QueuedReport } from '../coverage';

export function Reviews() {
  const role = useRole();
  if (!role.can('reviews.view') && role.role !== 'teacher') return <Navigate to="/" replace />;
  return <ReviewsContent />;
}

function ReviewsContent() {
  const { t, fmtDate } = useI18n();
  const labels = useLabels();
  const role = useRole();
  const { state } = usePortfolio();
  const dataPort = useDataPort();
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof dataPort.getReviewQueue>>>();
  const [failed, setFailed] = useState(false);
  const load = () => {
    setFailed(false);
    void dataPort.getReviewQueue().then(setQueue).catch(() => setFailed(true));
  };
  useEffect(load, [dataPort, state]);

  const teacher = role.role === 'teacher';
  const reason = (item: QueuedReport) => {
    const block = item.approvalBlock;
    if (!block) return t('pages.reviews.blockNone');
    if (block.reason === 'claims') return t('pages.reviews.blockClaims', { count: block.count });
    if (block.reason === 'incomplete') return t('pages.reviews.blockIncomplete');
    return t('pages.reviews.blockStatus', { status: labels.status(block.status) });
  };

  return (
    <AppShell module="reports" crumbs={[{ label: t('shell.module.reports'), to: '/students?status=review' }, { label: t('pages.reviews.title') }]} mobileTitle={t('pages.reviews.title')}>
      {() => (
        <div className="page reviews-page">
          <h1 className="h1">{teacher ? t('pages.reviews.changesHeading') : t('pages.reviews.title')}</h1>
          {failed && <div className="notice notice-error" role="alert"><span>{t('pages.reviews.error')}</span><button className="btn btn-secondary" type="button" onClick={load}>{t('pages.reviews.retry')}</button></div>}
          {!queue && !failed && <p role="status" className="sec muted">{t('pages.reviews.loading')}</p>}
          {queue && teacher && queue.changesRequested.length === 0 && <p className="card card-pad sec" role="status">{t('pages.reviews.changesEmpty')}</p>}
          {queue && teacher && <div className="stack">
            {queue.changesRequested.map(({ student, commentDate }) => <article className="card review-row" key={student.id}>
              <Avatar initials={student.initials} />
              <div className="grow"><h2 className="h2">{student.name}</h2>{commentDate && <p className="sec muted">{t('pages.reviews.submitted', { date: fmtDate(commentDate) })}</p>}</div>
              <Link className="btn btn-secondary" to={`/students/${student.id}/studio`}>{t('pages.reviews.open')}</Link>
            </article>)}
          </div>}
          {queue && !teacher && queue.inReview.length === 0 && <p className="card card-pad sec" role="status">{t('pages.reviews.empty')}</p>}
          {queue && !teacher && <div className="stack">
            {queue.inReview.map((item) => <article className="card review-row" key={item.student.id}>
              <Avatar initials={item.student.initials} />
              <div className="grow review-copy">
                <h2 className="h2">{item.student.name}</h2>
                <p className="sec muted">{t('pages.reviews.submitted', { date: fmtDate(item.submittedAt) })} · {t('pages.reviews.waiting', { count: item.daysWaiting })}</p>
                <p className="sec">{t('pages.reviews.readiness', { written: item.readiness.domainsWritten, total: item.readiness.domainsTotal })} · {t('pages.reviews.claims', { count: item.unverifiedClaimCount })}</p>
                <p className="sec review-block"><Icon name={item.approvalBlock ? 'alertCircle' : 'check'} size={16} />{t('pages.reviews.block', { reason: reason(item) })}</p>
              </div>
              <Link className="btn btn-secondary" to={`/students/${item.student.id}/report`}>{t('pages.reviews.open')}</Link>
            </article>)}
          </div>}
        </div>
      )}
    </AppShell>
  );
}
