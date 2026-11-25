import { Link } from 'react-router-dom';
import { isLoggedIn as hasSession } from '../utils/authSession';
import '../styles/Applications.css';
import '../styles/NotFoundPage.css';

export default function NotFoundPage() {
  const isLoggedIn = hasSession();

  return (
    <div className="not-found-page">
      <img
        src="/images/not-found.png"
        alt="Illustration of a map with a question mark location pin"
        className="not-found-image"
      />
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>Sorry, the page you're looking for doesn't exist.</p>

      {/* Signed in it goes back to the board, signed out to the login page. */}
      <Link
        to={isLoggedIn ? '/kanban' : '/login'}
        className="applications-text-button not-found-link"
      >
        Go back
      </Link>
    </div>
  );
}
