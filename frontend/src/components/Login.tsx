import React, { useState } from 'react';
import { API_BASE } from '../config';
import { User, Lock, Eye, EyeOff, ShieldAlert, Building2, ChevronDown, ChevronUp, Check, ShieldCheck, UserPlus, LogIn, BadgeCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: { id: number; name: string; username: string; role: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  
  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('SALES');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to authentication server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword) {
      setError('Please complete all registration fields');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          username: regUsername.trim(),
          password: regPassword,
          role: regRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMsg('Account created successfully! Signing you in...');
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoAccount = (roleName: string) => {
    setAuthMode('signin');
    const roleKey = roleName.toLowerCase();
    setUsername(roleKey);
    setPassword(`${roleKey}123`);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Building2 size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Enterprise ERP & CRM
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {authMode === 'signin' ? 'Welcome back! Sign in to access your dashboard.' : 'Create a new employee user account.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-app)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '0.25rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              backgroundColor: authMode === 'signin' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'signin' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: authMode === 'signin' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              backgroundColor: authMode === 'register' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: authMode === 'register' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={15} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-box alert-box-danger" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="alert-box" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(15,118,110,0.2)', animation: 'fadeIn 0.2s ease-out' }}>
            <BadgeCheck size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: Sign In Form */}
        {authMode === 'signin' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  id="username"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. admin or sales"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('For password resets, please contact your System Administrator (Admin).');
                  }}
                  style={{ fontSize: '0.775rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.825rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                Keep me signed in on this device
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Operations Portal'}
            </button>
          </form>
        ) : (
          /* MODE 2: Register Form */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="regName">Full Name</label>
              <input
                type="text"
                id="regName"
                className="form-input"
                placeholder="e.g. Aditya Sharma"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="regUsername">Choose Username</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  id="regUsername"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. aditya_sales"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="regPassword">Set Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="password"
                  id="regPassword"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="regRole">Assign Employee Role</label>
              <select
                id="regRole"
                className="form-select"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                disabled={isLoading}
              >
                <option value="SALES">Sales Executive (CRM & Sales Orders)</option>
                <option value="WAREHOUSE">Warehouse Staff (Inventory & Logs)</option>
                <option value="ACCOUNTS">Accounts Team (Financial Overview)</option>
                <option value="ADMIN">System Administrator (Full Access)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register New Account'}
            </button>
          </form>
        )}

        {/* Discrete Professional Test Account Drawer */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setShowDemoCredentials(!showDemoCredentials)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '0.25rem 0'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
              Pre-Seeded Test Accounts
            </span>
            {showDemoCredentials ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDemoCredentials && (
            <div style={{
              marginTop: '0.75rem',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              fontSize: '0.775rem',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Click a role to populate pre-configured test credentials:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                {[
                  { role: 'Admin', user: 'admin', desc: 'Full Access' },
                  { role: 'Sales', user: 'sales', desc: 'CRM & Challans' },
                  { role: 'Warehouse', user: 'warehouse', desc: 'Stock & Logs' },
                  { role: 'Accounts', user: 'accounts', desc: 'Financial Read' }
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleSelectDemoAccount(item.role)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {item.role}
                      {authMode === 'signin' && username === item.user && <Check size={12} style={{ color: 'var(--success)' }} />}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security Footer Badge */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            🔒 Protected by 256-bit SSL & Role-Based Auth
          </span>
        </div>
      </div>
    </div>
  );
};
