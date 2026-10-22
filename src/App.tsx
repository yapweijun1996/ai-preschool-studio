import { Fragment, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ThemeContext } from './components/AppShell';
import { NavMemoryProvider } from './hooks/useNavMemory';
import { useTheme } from './hooks/useTheme';
import { I18nProvider, type Lang } from './i18n';
import type { Dict } from './i18n/locales/en';
import { Dashboard } from './pages/Dashboard';
import { AddObservation, AuditLog, Catalog, Classes, Coverage, FamilyReport, LearningProgress, NotFound, PortfolioStudio, ReportPreview, Reviews, RouteFallback, RoutePreloadHints, Settings, StudentProfile, Students } from './routes/lazyPages';
import { PwaProvider } from './pwa';
import { PortfolioProvider } from './store/PortfolioContext';
import { RoleProvider } from './roles/RoleContext';

/**
 * Remounts a stateful student page (Studio, Add observation, Report) when the child changes, so no draft,
 * AI or form state carries over. Profile and Progress hold no per-child state and keep focus on navigation.
 */
function PerStudent({ children }: { children: ReactNode }) {
  const { id } = useParams();
  return <Fragment key={id}>{children}</Fragment>;
}

// Hash routing keeps deep links working on static hosts without rewrite rules.
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Suspense fallback={<RouteFallback kind="students" />}><Students /></Suspense>} />
            <Route path="/classes" element={<Suspense fallback={<RouteFallback kind="classes" />}><Classes /></Suspense>} />
            <Route path="/coverage" element={<Suspense fallback={<RouteFallback kind="coverage" />}><Coverage /></Suspense>} />
            <Route path="/reviews" element={<Suspense fallback={<RouteFallback kind="reviews" />}><Reviews /></Suspense>} />
            <Route path="/students/:id" element={<Suspense fallback={<RouteFallback kind="profile" />}><StudentProfile /></Suspense>} />
            <Route path="/students/:id/observe" element={<Suspense fallback={<RouteFallback kind="observe" />}><PerStudent><AddObservation /></PerStudent></Suspense>} />
            <Route path="/students/:id/progress" element={<Suspense fallback={<RouteFallback kind="progress" />}><LearningProgress /></Suspense>} />
            <Route path="/students/:id/studio" element={<Suspense fallback={<RouteFallback kind="studio" />}><PerStudent><PortfolioStudio /></PerStudent></Suspense>} />
            <Route path="/students/:id/report" element={<Suspense fallback={<RouteFallback kind="report" />}><PerStudent><ReportPreview /></PerStudent></Suspense>} />
            <Route path="/students/:id/report/family" element={<Suspense fallback={<RouteFallback kind="family" />}><PerStudent><FamilyReport /></PerStudent></Suspense>} />
            <Route path="/audit" element={<Suspense fallback={<RouteFallback kind="audit" />}><AuditLog /></Suspense>} />
            <Route path="/settings" element={<Navigate to="/settings/appearance" replace />} />
            <Route path="/settings/:section" element={<Suspense fallback={<RouteFallback kind="settings" />}><Settings /></Suspense>} />
            <Route path="/catalog" element={<Suspense fallback={<RouteFallback kind="catalog" />}><Catalog /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<RouteFallback kind="notFound" />}><NotFound /></Suspense>} />
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
