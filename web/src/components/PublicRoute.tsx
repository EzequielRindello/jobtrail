import { Navigate, Outlet } from 'react-router-dom';
import { isLoggedIn } from '../utils/authSession';

export default function PublicRoute() {
  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
