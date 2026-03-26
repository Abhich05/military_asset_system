import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sword, AlertTriangle, Lock } from 'lucide-react';
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page" aria-label="Login page">
      <div className="login-bg-grid" aria-hidden="true" />
      <div className="login-bg-radial" aria-hidden="true" />

      <div className="login-card animate-slide-up">
        <div className="login-logo">
          <div className="login-logo-icon" aria-hidden="true"><Sword size={48} /></div>
          <h1 className="login-title">Military Asset Management</h1>
          <p className="login-subtitle">Secure Operations Command Portal</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--sp-4)' }}>
            <span className="alert-icon"><AlertTriangle size={18} /></span>
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              className="form-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              aria-required="true"
            />
          </div>

          <button
            id="login-submit"
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading || !username || !password}
            aria-busy={loading}
            style={{ marginTop: 'var(--sp-2)' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" />
                Authenticating…
              </>
            ) : (
              <><span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '8px' }}><Lock size={18} /></span> Authenticate</>
            )}
          </button>
        </form>

        <div className="login-creds-hint" style={{ marginTop: 'var(--sp-6)' }}>
          <div style={{ marginBottom: 4, color: 'var(--clr-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Demo Credentials</div>
          <div><strong>admin</strong> / admin@2024 &nbsp;→ Admin</div>
          <div><strong>cmdr_alpha</strong> / password123 &nbsp;→ Base Commander</div>
          <div><strong>logistics_01</strong> / password123 &nbsp;→ Logistics Officer</div>
        </div>
      </div>
    </main>
  );
}
