import { Link } from 'react-router-dom';
import { CLASS_NAME } from '../data/demo';
import { Avatar } from './ui';

const RECENT = [
  { id: 'rayan', name: 'Rayan Iskandar', initials: 'RI' },
  { id: 'ethan', name: 'Ethan Koh', initials: 'EK' },
  { id: 'meiling', name: 'Mei Ling Chua', initials: 'MC' }
];

/** Context panel for the Students module: class, pinned and recent students. */
export function StudentsPanel({ currentId }: { currentId?: string }) {
  const cur = (id: string) => (currentId === id ? 'page' : undefined);
  return (
    <>
      <p className="cap ctx-label" style={{ paddingTop: 4 }}>My class</p>
      <Link className="nav-link" to="/students" aria-current={currentId ? undefined : 'page'}>{CLASS_NAME}</Link>
      <p className="cap ctx-label">Pinned</p>
      <Link className="nav-link" to="/students/aria" aria-current={cur('aria')}><Avatar initials="AT" size="sm" />Aria Tan</Link>
      <p className="cap ctx-label">Recent</p>
      {RECENT.map((s) => (
        <Link key={s.id} className="nav-link" to={`/students/${s.id}`} aria-current={cur(s.id)}>
          <Avatar initials={s.initials} size="sm" />
          {s.name}
        </Link>
      ))}
    </>
  );
}
