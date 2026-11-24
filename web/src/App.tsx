import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SkillsPage from './pages/SkillsPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';
import KanbanPage from './pages/KanbanPage';

function App() {
  return (
    <BrowserRouter>
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
          </Route>

          <Route path="/privacy" element={<PrivacyPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
