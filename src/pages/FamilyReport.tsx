import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { BrandMark } from '../components/BrandMark';
import { EmptyIllustration, PhotoIllustration } from '../components/EmptyIllustration';
import { MilestoneDots } from '../components/ui';
import { CLASS_NAME, TEACHER } from '../data/demo';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import { frameworkFor } from '../framework';
import { usePortfolio } from '../store/PortfolioContext';
import { studentSummary } from '../store/selectors';
import { useRole } from '../roles/RoleContext';
import { NotFound } from './NotFound';

export function FamilyReport() {
  const { id = '' } = useParams();
  const { state } = usePortfolio();
  const role = useRole();
  const summary = studentSummary(state, id);
  const version = summary?.report.versions.find((item) => item.version === summary.report.releasedVersion);
  const { t, lang, fmtDate } = useI18n();
  const labels = useLabels(version?.frameworkVersion);
  const framework = frameworkFor(version?.frameworkVersion);
  const permitted = role.can('report.view');

  if (!summary) return <NotFound />;
  if (!permitted) return <AppShell module="reports" mobileTitle={t('pages.report.familyTitle')}>{() => <div className="card card-pad"><h1 className="h1">{t('shell.roles.accessDenied')}</h1><Link className="btn btn-secondary" to="/">{t('pages.report.dashboard')}</Link></div>}</AppShell>;

  return (
    <AppShell module="reports" currentStudentId={id} crumbs={[{ label: t('shell.module.students'), to: '/students' }, { label: summary.student.name, to: `/students/${id}` }, { label: t('pages.report.familyTitle') }]} mobileTitle={t('pages.report.familyTitle')}>
      {() => <>
      <div className="page-head no-print">
        <div className="grow"><h1 className="h1">{t('pages.report.familyTitle')}</h1><p className="sec muted">{summary.student.name} · {t('pages.report.familyCopy')}</p></div>
        <Link className="btn btn-secondary" to={`/students/${id}/report`}>{t('pages.report.title')}</Link>
        {version && <button className="btn btn-primary" type="button" onClick={() => window.print()}>{t('pages.report.exportPrint')}</button>}
      </div>
      {!version ? (
        <section className="card card-pad stack empty-state" aria-live="polite">
          <EmptyIllustration name="planned-family" />
          <h2 className="h2">{t('pages.report.familyEmpty')}</h2>
        </section>
      ) : (
        <article className="a4 family-copy" aria-label={t('pages.report.sheetLabel')}>
          <div className="a4-strip">{t('pages.report.sampleStrip')}</div>
          <div className="a4-body">
            <div className="row" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'nowrap' }}>
              <div className="grow stack" style={{ gap: 6 }}>
                <p className="cap muted row" style={{ gap: 8 }}><BrandMark size={24} />{t('pages.report.portfolioLine', { term: labels.term(4) })}</p>
                <h2 className="h1">{summary.student.name}</h2>
                <p className="sec muted">{t('pages.report.keyTeacherLine', { class: CLASS_NAME, teacher: TEACHER })}</p>
                <p className="cap muted">{t('pages.report.approvedBy', { date: fmtDate(version.approvedAt), name: version.approvedBy })}</p>
              </div>
              <PhotoIllustration report />
            </div>
            {version.paragraphs.map((paragraph) => (
              <section key={paragraph.id}>
                <div className="domain-head" style={{ marginBottom: 8 }}><h3 className="strong">{labels.domainFull(paragraph.domain)}</h3><MilestoneDots milestone={version.milestones[paragraph.domain]} version={version.frameworkVersion} /></div>
                <p className="narr">{paragraph.sentences.map((sentence) => <span key={sentence.id}>{sentence.text} </span>)}</p>
              </section>
            ))}
            <section><div className="domain-head" style={{ marginBottom: 8 }}><h3 className="strong">{t('pages.report.reflection')}</h3></div><p className="narr">{version.reflection}</p></section>
            <div className="grow" />
            <div className="row" style={{ justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
              <p className="cap muted">{t('pages.report.preparedBy', { teacher: TEACHER })} · {t('pages.report.approvedByLine', { name: version.approvedBy })}</p>
              <p className="cap muted num">{t('pages.report.frameworkLine', { name: framework.name[lang], version: version.frameworkVersion })} · {t('pages.report.pageOf', { page: 1, total: 1 })}</p>
            </div>
          </div>
        </article>
      )}
      </>}
    </AppShell>
  );
}
