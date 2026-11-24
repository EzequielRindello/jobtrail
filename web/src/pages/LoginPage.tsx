import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../api/authApi';
import '../styles/AuthPages.css';
import { setToken } from '../utils/authSession';
import { validateEmail } from '../utils/authValidation';

export default function LoginPage() {
  const navigate = useNavigate();

  const location = useLocation();
  const redirectLocation = location.state?.from;

  const [error, setError] = useState('');

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));

    if (!validateEmail(email)) {
      setError('Enter a valid email');
      return;
    }

    try {
      const result = await login({ email, password });
      setToken(result.token, result.expiresAt);
      navigate(
        redirectLocation
          ? `${redirectLocation.pathname}${redirectLocation.search}${redirectLocation.hash}`
          : '/dashboard',
        {
          replace: true,
        },
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <p className="auth-eyebrow">WELCOME BACK</p>
          <h1>Log in to JobTrail</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit">Log In</button>

            <p className="auth-switch">
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </form>
        </div>

        <div className="auth-visual">
          <img
            src="/images/login-illustration.png"
            alt="Laptop showing a job application tracker"
          />
        </div>
      </div>
    </div>
  );
}
