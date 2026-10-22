import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

export function NotFound() {
  return (
    <AppShell module="students" mobileTitle="Not found">
      {() => (
        <div className="page">
          <section className="card empty">
            <div className="state-icon"><Icon name="search" size={24} /></div>
            <h1 className="h2">We couldn’t find that page</h1>
            <p className="sec muted">The student or page may not exist in this demo.</p>
            <Link className="btn btn-primary" to="/students">Go to My Students</Link>
          </section>
        </div>
      )}
    </AppShell>
  );
}
