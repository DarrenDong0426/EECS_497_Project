import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin
      ? { email: form.email, password: form.password }
      : { email: form.email, username: form.username, password: form.password };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      return;
    }

    login(data.token, data.user);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</h2>

        {!isLogin && (
          <input
            style={styles.input}
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        )}
        <input
          style={styles.input}
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleSubmit}>
          {isLogin ? 'Log in' : 'Sign up'}
        </button>

        <p style={styles.toggle}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span style={styles.link} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', backgroundColor: '#f5f5f5',
  },
  card: {
    background: 'white', borderRadius: 12, padding: 40,
    width: 360, boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  title: { margin: 0, marginBottom: 8, fontSize: 24, fontWeight: 700 },
  input: {
    padding: '10px 14px', borderRadius: 8, fontSize: 15,
    border: '1px solid #ddd', outline: 'none',
  },
  button: {
    padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 600,
    backgroundColor: '#4f46e5', color: 'white', border: 'none',
    cursor: 'pointer', marginTop: 4,
  },
  error: { color: '#dc2626', fontSize: 14, margin: 0 },
  toggle: { textAlign: 'center', fontSize: 14, color: '#666', margin: 0 },
  link: { color: '#4f46e5', cursor: 'pointer', fontWeight: 600 },
};