import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

type Tab = 'overview' | 'observe' | 'progress' | 'report';

export function StudentTabs({ id, active }: { id: string; active: Tab }) {
  const { t } = useI18n();
  const tabs: { key: Tab; label: string; to: string }[] = [
    { key: 'overview', label: t('pages.tabs.overview'), to: `/students/${id}` },
    { key: 'observe', label: t('pages.tabs.observations'), to: `/students/${id}/observe` },
    { key: 'progress', label: t('pages.tabs.progress'), to: `/students/${id}/progress` },
    { key: 'report', label: t('pages.tabs.reports'), to: `/students/${id}/report` }
  ];
  return (
    <nav className="tabs" aria-label={t('pages.tabs.label')}>
      {tabs.map((tab) => (
        <Link key={tab.key} className="tab" to={tab.to} aria-current={active === tab.key ? 'page' : undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
