import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../utils/authSession';

export default function ProtectedRoute() {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
