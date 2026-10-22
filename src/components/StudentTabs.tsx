import { Link } from 'react-router-dom';

type Tab = 'overview' | 'observe' | 'progress' | 'report';

export function StudentTabs({ id, active }: { id: string; active: Tab }) {
  const tabs: { key: Tab; label: string; to: string }[] = [
    { key: 'overview', label: 'Overview', to: `/students/${id}` },
    { key: 'observe', label: 'Observations', to: `/students/${id}/observe` },
    { key: 'progress', label: 'Learning progress', to: `/students/${id}/progress` },
    { key: 'report', label: 'Reports', to: `/students/${id}/report` }
  ];
  return (
    <nav className="tabs" aria-label="Student sections">
      {tabs.map((t) => (
        <Link key={t.key} className="tab" to={t.to} aria-current={active === t.key ? 'page' : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
