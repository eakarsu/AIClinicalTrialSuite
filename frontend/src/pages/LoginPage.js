import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('pi@trials.io');
  const [password, setPassword] = useState('trial2026');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (onLogin) onLogin(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <h1>Clinical Trial Suite</h1>
          <p>Design, Conduct &amp; Matching</p>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <div className="ai-error" style={{ marginBottom: 12 }}>{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <div className="login-hint">
          Demo logins:<br/>
          pi@trials.io / trial2026 (PI — read+write)<br/>
          sponsor@trials.io / sponsor2026 (Sponsor — read+write)<br/>
          monitor@trials.io / monitor2026 (Monitor — read+queries only)
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
