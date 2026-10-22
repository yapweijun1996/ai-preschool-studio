import { Link } from 'react-router-dom';
import { useI18n, type TKey } from '../i18n';

/** Consistent translated content for module-level access denials. */
export function AccessDenied({ title = 'pages.children.accessTitle', back = 'pages.shared.back' }: { title?: TKey; back?: TKey }) {
  const { t } = useI18n();
  return (
    <div className="page">
      <section className="card card-pad stack">
        <h1 className="h1">{t(title)}</h1>
        <p className="sec muted">{t('shell.roles.accessDenied')}</p>
        <Link className="btn btn-secondary" to="/">{t(back)}</Link>
      </section>
    </div>
  );
}
