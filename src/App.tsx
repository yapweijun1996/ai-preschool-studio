import { Fragment, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ThemeContext } from './components/AppShell';
import { NavMemoryProvider } from './hooks/useNavMemory';
import { useTheme } from './hooks/useTheme';
import { I18nProvider, type Lang } from './i18n';
import type { Dict } from './i18n/locales/en';
import { Dashboard } from './pages/Dashboard';
import { AddObservation, AuditLog, Catalog, Classes, Coverage, FamilyReport, LearningProgress, NotFound, pageKindForPath, PortfolioStudio, ReportPreview, Reviews, RouteChunkSuccess, RouteFallback, RoutePreloadHints, Settings, StudentProfile, Students } from './routes/lazyPages';
import { PwaProvider } from './pwa';
import { PortfolioProvider } from './store/PortfolioContext';
import { RoleProvider } from './roles/RoleContext';
import { RouteErrorBoundary } from './routes/RouteErrorBoundary';

/** Remount stateful student pages when the selected child changes. */
function PerStudent({ children }: { children: ReactNode }) {
  const { id } = useParams();
  return <Fragment key={id}>{children}</Fragment>;
}

function RoutedPages() {
  const { pathname } = useLocation();
  const kind = pageKindForPath(pathname);
  return <RouteErrorBoundary key={pathname}>
    <Suspense fallback={kind ? <RouteFallback kind={kind} /> : null}>
      <Routes>
        <Route path="/" element={<RouteChunkSuccess><Dashboard /></RouteChunkSuccess>} />
        <Route path="/students" element={<RouteChunkSuccess><Students /></RouteChunkSuccess>} />
        <Route path="/classes" element={<RouteChunkSuccess><Classes /></RouteChunkSuccess>} />
        <Route path="/coverage" element={<RouteChunkSuccess><Coverage /></RouteChunkSuccess>} />
        <Route path="/reviews" element={<RouteChunkSuccess><Reviews /></RouteChunkSuccess>} />
        <Route path="/students/:id" element={<RouteChunkSuccess><StudentProfile /></RouteChunkSuccess>} />
        <Route path="/students/:id/observe" element={<RouteChunkSuccess><PerStudent><AddObservation /></PerStudent></RouteChunkSuccess>} />
        <Route path="/students/:id/progress" element={<RouteChunkSuccess><LearningProgress /></RouteChunkSuccess>} />
        <Route path="/students/:id/studio" element={<RouteChunkSuccess><PerStudent><PortfolioStudio /></PerStudent></RouteChunkSuccess>} />
        <Route path="/students/:id/report" element={<RouteChunkSuccess><PerStudent><ReportPreview /></PerStudent></RouteChunkSuccess>} />
        <Route path="/students/:id/report/family" element={<RouteChunkSuccess><PerStudent><FamilyReport /></PerStudent></RouteChunkSuccess>} />
        <Route path="/audit" element={<RouteChunkSuccess><AuditLog /></RouteChunkSuccess>} />
        <Route path="/settings" element={<Navigate to="/settings/appearance" replace />} />
        <Route path="/settings/:section" element={<RouteChunkSuccess><Settings /></RouteChunkSuccess>} />
        <Route path="/catalog" element={<RouteChunkSuccess><Catalog /></RouteChunkSuccess>} />
        <Route path="*" element={<RouteChunkSuccess><NotFound /></RouteChunkSuccess>} />
      </Routes>
    </Suspense>
  </RouteErrorBoundary>;
}

// HashRouter defaults to React.startTransition for history updates in React Router v7.
export function App({ initialLang, initialDict }: { initialLang: Lang; initialDict: Dict }) {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>
      <I18nProvider initial={initialLang} initialDict={initialDict}>
        <PwaProvider>
          <PortfolioProvider>
            <RoleProvider>
              <NavMemoryProvider>
                <HashRouter>
                  <RoutePreloadHints />
                  <RoutedPages />
                </HashRouter>
              </NavMemoryProvider>
            </RoleProvider>
          </PortfolioProvider>
        </PwaProvider>
      </I18nProvider>
    </ThemeContext.Provider>
  );
}
