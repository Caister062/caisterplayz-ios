import React, { useState } from 'react';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export const AuthScreen = ({ onOpenEULA, onOpenPrivacy }) => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fortniteIgn, setFortniteIgn] = useState('');
  const [agreeEula, setAgreeEula] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && !agreeEula) {
      setError('You must accept the Community Guidelines and EULA to create an account.');
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error: signinError } = await signIn(email, password);
      if (signinError) setError(signinError.message || 'Login failed');
    } else {
      const { error: signupError } = await signUp({
        email,
        password,
        username,
        displayName: displayName || username,
        fortniteUsername: fortniteIgn,
      });
      if (signupError) setError(signupError.message || 'Sign up failed');
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '1.5rem',
        maxWidth: '460px',
        margin: '0 auto',
      }}
      className="animate-fade"
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--gradient-storm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Sparkles size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '0.04em' }}>
          Caister<span style={{ color: 'var(--accent-cyan)' }}>Playz</span>
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          The Independent Fortnite Gaming Community
        </p>
      </div>

      {/* Auth Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {/* Toggle Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '12px', padding: '4px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="tab-item"
            style={{
              flex: 1,
              borderRadius: '8px',
              background: isLogin ? 'var(--gradient-storm)' : 'transparent',
              color: isLogin ? '#fff' : 'var(--text-secondary)',
              padding: '0.5rem',
            }}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            type="button"
            className="tab-item"
            style={{
              flex: 1,
              borderRadius: '8px',
              background: !isLogin ? 'var(--gradient-storm)' : 'transparent',
              color: !isLogin ? '#fff' : 'var(--text-secondary)',
              padding: '0.5rem',
            }}
            onClick={() => setIsLogin(false)}
          >
            Join 13+
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(255, 59, 48, 0.15)',
              border: '1px solid var(--accent-red)',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              color: 'var(--accent-red)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Username
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. storm_builder"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Storm Builder ⚡"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Fortnite In-Game Name (User-provided)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. StormBuilder_FN"
                  value={fortniteIgn}
                  onChange={(e) => setFortniteIgn(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginTop: '0.25rem',
              }}
            >
              <input
                type="checkbox"
                checked={agreeEula}
                onChange={(e) => setAgreeEula(e.target.checked)}
                style={{ marginTop: '2px', accentColor: 'var(--accent-cyan)' }}
                required
              />
              <span>
                I agree to the{' '}
                <a href="#eula" onClick={(e) => { e.preventDefault(); onOpenEULA(); }} style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>
                  Terms of Service & EULA
                </a>{' '}
                and confirm zero tolerance for abusive content.
              </span>
            </label>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Entering the Storm...' : isLogin ? 'Drop In ⚡' : 'Join CaisterPlayz'}
          </button>
        </form>
      </div>

      {/* Intellectual Property Disclaimer (App Store Guideline 5.2.1) */}
      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: '1.4' }}>
        CaisterPlayz is an independent social platform for gamers. Not affiliated with, sponsored, or endorsed by Epic Games Inc. Fortnite is a registered trademark of Epic Games.
      </p>
    </div>
  );
};
