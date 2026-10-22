import { Fragment, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ThemeContext } from './components/AppShell';
import { NavMemoryProvider } from './hooks/useNavMemory';
import { useTheme } from './hooks/useTheme';
import { I18nProvider } from './i18n';
import { AddObservation } from './pages/AddObservation';
import { Dashboard } from './pages/Dashboard';
import { LearningProgress } from './pages/LearningProgress';
import { NotFound } from './pages/NotFound';
import { PortfolioStudio } from './pages/PortfolioStudio';
import { ReportPreview } from './pages/ReportPreview';
import { Settings } from './pages/Settings';
import { StudentProfile } from './pages/StudentProfile';
import { Students } from './pages/Students';
import { PwaProvider } from './pwa';
import { PortfolioProvider } from './store/PortfolioContext';

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
        <NavMemoryProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/students/:id/observe" element={<PerStudent><AddObservation /></PerStudent>} />
            <Route path="/students/:id/progress" element={<LearningProgress />} />
            <Route path="/students/:id/studio" element={<PerStudent><PortfolioStudio /></PerStudent>} />
            <Route path="/students/:id/report" element={<PerStudent><ReportPreview /></PerStudent>} />
            <Route path="/settings" element={<Navigate to="/settings/appearance" replace />} />
            <Route path="/settings/:section" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
        </NavMemoryProvider>
      </PortfolioProvider>
      </PwaProvider>
      </I18nProvider>
    </ThemeContext.Provider>
  );
}
