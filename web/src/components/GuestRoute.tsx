import { Navigate, Outlet } from 'react-router-dom';
import { isLoggedIn } from '../utils/authSession';

export default function GuestRoute() {
  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
