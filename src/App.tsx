import { HashRouter, Route, Routes } from 'react-router-dom';
import { ThemeContext } from './components/AppShell';
import { useTheme } from './hooks/useTheme';
import { AddObservation } from './pages/AddObservation';
import { Dashboard } from './pages/Dashboard';
import { LearningProgress } from './pages/LearningProgress';
import { NotFound } from './pages/NotFound';
import { PortfolioStudio } from './pages/PortfolioStudio';
import { ReportPreview } from './pages/ReportPreview';
import { StudentProfile } from './pages/StudentProfile';
import { Students } from './pages/Students';
import { PortfolioProvider } from './store/PortfolioContext';

// Hash routing keeps deep links working on static hosts without rewrite rules.
export function App() {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>
      <PortfolioProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/students/:id/observe" element={<AddObservation />} />
            <Route path="/students/:id/progress" element={<LearningProgress />} />
            <Route path="/students/:id/studio" element={<PortfolioStudio />} />
            <Route path="/students/:id/report" element={<ReportPreview />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </PortfolioProvider>
    </ThemeContext.Provider>
  );
}
