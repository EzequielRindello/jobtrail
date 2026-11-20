import { Link } from 'react-router-dom';
import '../styles/NotFoundPage.css';

export default function NotFoundPage() {
  const isLoggedIn = Boolean(localStorage.getItem('token'));

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

      <Link to={isLoggedIn ? '/dashboard' : '/login'} className="not-found-button">
        {isLoggedIn ? 'Back to Dashboard' : 'Go to Login'}
      </Link>
    </div>
  );
}
