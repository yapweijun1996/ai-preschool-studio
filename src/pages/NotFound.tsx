import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyIllustration } from '../components/EmptyIllustration';
import { useI18n } from '../i18n';

export function NotFound() {
  const { t } = useI18n();
  return (
    <AppShell module="students" mobileTitle={t('shell.notFound.title')}>
      {() => (
        <div className="page">
          <section className="card empty">
            <EmptyIllustration name="not-found" />
            <h1 className="h2">{t('shell.notFound.heading')}</h1>
            <p className="sec muted">{t('shell.notFound.body')}</p>
            <Link className="btn btn-primary" to="/students">{t('shell.notFound.cta')}</Link>
          </section>
        </div>
      )}
    </AppShell>
  );
}
