import { useState } from 'react';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { API_BASE } from '../config';
import { takePendingRedirect } from '../pendingRedirect';
import { enterGuest, clearGuestFlag } from '../guestSession';
import { flushGuestDraft } from '../flushGuestDraft';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme, becomeGuest, refreshUser } = useTheme();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Invalid email or password');
        return;
      }
      clearGuestFlag();
      await refreshUser();
      try {
        const flushed = await flushGuestDraft();
        if (flushed?.tripId) {
          navigate('/trips/details', { state: { tripId: flushed.tripId } });
          return;
        }
      } catch {
        // Draft stays in localStorage; Home will offer a retry.
      }
      navigate(takePendingRedirect() || '/home');
    } catch {
      setError('Could not reach the server. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/github`;
  };

  return (
    <Container fluid className="auth-page p-0">
      <button className="auth-theme-toggle" onClick={toggleTheme} title={theme === 'light' ? 'Switch to Blue' : 'Switch to Light'}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      <Row className="auth-container mx-auto g-0">
        <Col md={6} className="auth-left d-none d-md-flex">
          <div className="auth-overlay">
            <h2 className="auth-quote">
              YOUR NEXT ADVENTURE, PLANNED IN SECONDS
            </h2>
          </div>
          <p className="auth-subtitle">
            Plan and discover amazing places at exclusive deals with Voyago
          </p>
        </Col>

        <Col md={6} xs={12} className="auth-right d-flex flex-column align-items-center justify-content-center p-md-4 p-3">
          <h1 className="auth-brand">VOYAGO</h1>

          <div className="oauth-buttons mb-3">
            <Button variant="light" className="oauth-btn google-btn w-100 mb-2" onClick={handleGoogleLogin}>
              <svg className="oauth-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.77z" transform="translate(0.9,0)"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" transform="translate(0,0.5)"/>
              </svg>
              Continue with Google
            </Button>

            <Button variant="dark" className="oauth-btn github-btn w-100" onClick={handleGithubLogin}>
              <svg className="oauth-icon" viewBox="0 0 24 24" width="20" height="20" fill="white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </Button>
          </div>

          <p className="auth-divider">or use your email account</p>

          <Form className="w-100 px-3" style={{ maxWidth: '320px' }} onSubmit={handleLogin}>
            {error && <div className="auth-error">{error}</div>}

            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Email"
                aria-label="Email address"
                className="auth-input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <InputGroup>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  aria-label="Password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁' : '👁‍🗨'}
                </button>
              </InputGroup>
            </Form.Group>

            <div className="text-end mb-3">
              <a href="#" className="forgot-link">Forgot Your Password?</a>
            </div>

            <Button type="submit" variant="outline-light" className="w-100 auth-submit">
              LOGIN
            </Button>
          </Form>

          <p className="auth-switch mt-3">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-switch-link">Sign Up</Link>
          </p>
          <button
            type="button"
            className="auth-switch-link auth-guest-btn"
            onClick={() => {
              enterGuest();
              becomeGuest();
              navigate('/home');
            }}
          >
            Continue as Guest
          </button>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
