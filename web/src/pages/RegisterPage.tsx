import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import '../styles/AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get('displayName'));
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const confirmPassword = String(form.get('confirmPassword'));

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const result = await register({ displayName, email, password });
      localStorage.setItem('token', result.token);
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Please check your information.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <p className="auth-eyebrow">GET STARTED</p>
          <h1>Create your account</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="register-name">Display name</label>
            <input
              id="register-name"
              name="displayName"
              type="text"
              placeholder="Enter your name"
              autoComplete="name"
              required
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />

            <label htmlFor="register-confirm-password">Confirm password</label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit">Create Account</button>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Log in</Link>
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
