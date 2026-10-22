import { Fragment, lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppShell, ThemeContext } from './components/AppShell';
import { NavMemoryProvider } from './hooks/useNavMemory';
import { useTheme } from './hooks/useTheme';
import { I18nProvider, useI18n } from './i18n';
import { AddObservation } from './pages/AddObservation';
import { AuditLog } from './pages/AuditLog';
import { Coverage } from './pages/Coverage';
import { Catalog } from './pages/Catalog';
import { Dashboard } from './pages/Dashboard';
import { LearningProgress } from './pages/LearningProgress';
import { NotFound } from './pages/NotFound';
import { PortfolioStudio } from './pages/PortfolioStudio';
import { ReportPreview } from './pages/ReportPreview';
import { FamilyReport } from './pages/FamilyReport';
import { Reviews } from './pages/Reviews';
import { Settings } from './pages/Settings';
import { StudentProfile } from './pages/StudentProfile';
import { Students } from './pages/Students';
import { PwaProvider } from './pwa';
import { PortfolioProvider } from './store/PortfolioContext';
import { RoleProvider } from './roles/RoleContext';

const Classes = lazy(() => import('./pages/Classes'));

function ClassesFallback() {
  const { t } = useI18n();
  return (
    <AppShell module="students" mobileTitle={t('pages.children.classesTitle')}>
      {() => (
        <div className="page" aria-busy="true" aria-label={t('pages.children.loading')}>
          <div className="page-title-row">
            <div className="grow stack">
              <span className="skel" style={{ width: 220, height: 34 }} />
              <span className="skel" style={{ width: 300, height: 20 }} />
            </div>
            <span className="skel" style={{ width: 150, height: 40 }} />
          </div>
          <section className="card card-pad row class-summary" aria-hidden="true">
            <div className="grow stack"><span className="skel" style={{ width: 160, height: 24 }} /><span className="skel" style={{ width: 110, height: 20 }} /></div>
            <span className="skel" style={{ width: 130, height: 42 }} />
            <span className="skel" style={{ width: 70, height: 42 }} />
          </section>
          <div className="row class-filters" aria-hidden="true">
            <span className="skel" style={{ width: 112, height: 36 }} />
            <span className="skel" style={{ width: 126, height: 36 }} />
          </div>
          <section className="card" aria-hidden="true" style={{ minHeight: 460 }}>
            {Array.from({ length: 6 }, (_, index) => (
              <div className="row-link" key={index}>
                <span className="skel" style={{ width: 40, height: 40, borderRadius: 999 }} />
                <span className="grow skel" style={{ height: 16, maxWidth: 220 }} />
                <span className="skel" style={{ width: 88, height: 24 }} />
              </div>
            ))}
          </section>
        </div>
      )}
    </AppShell>
  );
}

/**
 * Remounts a stateful student page (Studio, Add observation, Report) when the child changes, so no draft,
 * AI or form state carries over. Profile and Progress hold no per-child state and keep focus on navigation.
 */
function PerStudent({ children }: { children: ReactNode }) {
  const { id } = useParams();
  return <Fragment key={id}>{children}</Fragment>;
}

// Hash routing keeps deep links working on static hosts without rewrite rules.
export function App() {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>
      <I18nProvider>
      <PwaProvider>
      <PortfolioProvider>
      <RoleProvider>
        <NavMemoryProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route
              path="/classes"
              element={
                <Suspense fallback={<ClassesFallback />}>
                  <Classes />
                </Suspense>
              }
            />
            <Route path="/coverage" element={<Coverage />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/students/:id/observe" element={<PerStudent><AddObservation /></PerStudent>} />
            <Route path="/students/:id/progress" element={<LearningProgress />} />
            <Route path="/students/:id/studio" element={<PerStudent><PortfolioStudio /></PerStudent>} />
            <Route path="/students/:id/report" element={<PerStudent><ReportPreview /></PerStudent>} />
            <Route path="/students/:id/report/family" element={<PerStudent><FamilyReport /></PerStudent>} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/settings" element={<Navigate to="/settings/appearance" replace />} />
            <Route path="/settings/:section" element={<Settings />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
        </NavMemoryProvider>
      </RoleProvider>
      </PortfolioProvider>
      </PwaProvider>
      </I18nProvider>
    </ThemeContext.Provider>
  );
}
