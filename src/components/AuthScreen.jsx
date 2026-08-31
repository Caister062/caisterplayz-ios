import React, { useState } from 'react';
import { Shield, Sparkles, AlertCircle, Database, Check, Key } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { isSupabaseConfigured, getStoredSupabaseConfig, setStoredSupabaseConfig, reinitializeSupabase } from '../lib/supabase';

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

  // Supabase Configuration Setup State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const initialConfig = getStoredSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(initialConfig.url || '');
  const [sbAnonKey, setSbAnonKey] = useState(initialConfig.key || '');
  const [configSuccess, setConfigSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if Supabase Project is plugged in
    if (!isSupabaseConfigured()) {
      setShowConfigModal(true);
      setError('Please connect your Supabase Project URL and Anon Key to enable live sign in and sign up.');
      return;
    }

    if (!isLogin && !agreeEula) {
      setError('You must accept the Community Guidelines and EULA to create an account.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error: signinError } = await signIn(email, password);
        if (signinError) {
          if (signinError.message === 'Failed to fetch') {
            setError('Could not connect to Supabase. Please verify your Project URL and Anon Key in Database Settings below.');
            setShowConfigModal(true);
          } else {
            setError(signinError.message || 'Login failed');
          }
        }
      } else {
        const { error: signupError } = await signUp({
          email,
          password,
          username,
          displayName: displayName || username,
          fortniteUsername: fortniteIgn,
        });
        if (signupError) {
          if (signupError.message === 'Failed to fetch') {
            setError('Could not connect to Supabase. Please verify your Project URL and Anon Key in Database Settings below.');
            setShowConfigModal(true);
          } else {
            setError(signupError.message || 'Sign up failed');
          }
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!sbUrl.trim() || !sbAnonKey.trim()) return;

    setStoredSupabaseConfig(sbUrl.trim(), sbAnonKey.trim());
    reinitializeSupabase(sbUrl.trim(), sbAnonKey.trim());
    setConfigSuccess(true);
    setError('');

    setTimeout(() => {
      setConfigSuccess(false);
      setShowConfigModal(false);
      window.location.reload();
    }, 1000);
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
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
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
            {loading ? 'Connecting to Supabase...' : isLogin ? 'Drop In ⚡' : 'Join CaisterPlayz'}
          </button>
        </form>

        {/* Database Credentials Trigger */}
        <div style={{ marginTop: '1.25rem', borderTop: 'var(--border-subtle)', paddingTop: '0.75rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', gap: '0.4rem', justifyContent: 'center' }}
            onClick={() => setShowConfigModal(true)}
          >
            <Database size={15} color="var(--accent-cyan)" /> Connect Supabase Project
          </button>
        </div>
      </div>

      {/* Supabase Connection Setup Modal */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-sheet animate-fade" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Supabase Project Setup</h3>
              </div>
              <button className="icon-btn" onClick={() => setShowConfigModal(false)} style={{ width: '32px', height: '32px' }}>
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
              Enter your real <strong>Supabase Project URL</strong> and <strong>Anon Public API Key</strong> from your Supabase Dashboard (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>Project Settings &gt; API</a>).
            </p>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Project URL
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://xyzcompany.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Project API Anon / Public Key
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={sbAnonKey}
                  onChange={(e) => setSbAnonKey(e.target.value)}
                  required
                  style={{ minHeight: '70px', fontSize: '0.8rem', wordBreak: 'break-all' }}
                />
              </div>

              {configSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--accent-green)', padding: '0.65rem', borderRadius: '8px', color: 'var(--accent-green)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={16} /> Supabase project connected successfully!
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Save & Connect Supabase
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Intellectual Property Disclaimer */}
      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: '1.4' }}>
        CaisterPlayz is an independent social platform for gamers. Not affiliated with, sponsored, or endorsed by Epic Games Inc. Fortnite is a registered trademark of Epic Games.
      </p>
    </div>
  );
};
