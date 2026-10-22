import { lazy, Suspense, useContext } from 'react';
import { AppShell, ThemeContext } from '../components/AppShell';

const CatalogContent = lazy(() => import('../catalog/CatalogContent').then((m) => ({ default: m.CatalogContent })));

function CatalogFallback({ showHeading }: { showHeading: boolean }) {
  return (
    <div className="page catalog-loading" role="status" aria-label="Loading catalog">
      {showHeading && (
        <header className="catalog-loading-title">
          <p className="cap muted">Design reference</p>
          <h1>Component catalog</h1>
          <p>Rendered shared UI examples and copyable markup. Theme and language follow the app.</p>
        </header>
      )}
      <div className="catalog-loading-toc" aria-hidden="true" />
      <section className="catalog-loading-section" aria-hidden="true">
        <h2>Tokens</h2>
        <div className="catalog-loading-grid">
          {Array.from({ length: 6 }, (_, index) => <div className="skel" key={index} />)}
        </div>
      </section>
    </div>
  );
}

export function Catalog() {
  const { theme } = useContext(ThemeContext);
  return (
    <AppShell module="settings" mobileTitle="Component catalog">
      {(bp) => (
        <Suspense fallback={<CatalogFallback showHeading={bp !== 'mobile'} />}>
          <CatalogContent theme={theme} showHeading={bp !== 'mobile'} />
        </Suspense>
      )}
    </AppShell>
  );
}
