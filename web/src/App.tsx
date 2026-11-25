import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import ToastProvider from './components/toast/ToastProvider';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SkillsPage from './pages/SkillsPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';
import KanbanPage from './pages/KanbanPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import PolicyPage from './pages/PolicyPage';

function App() {
  return (
    <BrowserRouter>
      {/* Above every route, so a toast survives a page change (for example after logging out). */}
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/skills" element={<SkillsPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
              <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
            </Route>

            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/policy" element={<PolicyPage />} />

            {/* Inside the layout, so the 404 page keeps the header and the footer. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
