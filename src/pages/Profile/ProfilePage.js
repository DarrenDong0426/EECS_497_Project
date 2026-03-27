import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import NavBar from '../../components/NavBar/NavBar';
import '../../pages/Record/Record.css';

export default function ProfilePage({ onNavigate }) {
  const { user, token, login, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setStats);
  }, [token]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const formData = new FormData();
    formData.append('username', username);
    if (avatarFile) formData.append('avatar', avatarFile);

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to save');
    } else {
      login(token, data);
      setEditing(false);
      setAvatarFile(null);
    }
    setSaving(false);
  };

  const avatarUrl = avatarPreview
    || (user?.avatar_filename ? `/api/profile/avatar/${user.avatar_filename}` : null);

  return (
    <div className="screen">
      <div className="screen-content">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
  <h1 className="page-title" style={{ margin: 0, flex: 1 }}>Profile</h1>
  <button
    onClick={() => { setEditing(!editing); setError(''); }}
    style={{ background: 'none', border: 'none', fontSize: 15, cursor: 'pointer', color: '#f4845f', fontWeight: 700, fontFamily: 'Georgia, serif', marginLeft: 16 }}
  >
    {editing ? 'Cancel' : 'Edit'}
  </button>
</div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f4845f' }} />
              : (
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f4845f, #e8506a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, color: 'white', fontWeight: 700, fontFamily: 'Georgia, serif',
                }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )
            }
            {editing && (
              <label style={{
                position: 'absolute', bottom: 0, right: 0,
                background: 'rgba(0,0,0,0.55)', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', fontSize: 14,
              }}>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                📷
              </label>
            )}
          </div>

          {editing ? (
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              style={{
                fontSize: 20, fontWeight: 700, textAlign: 'center',
                border: '1.5px solid #dde1ef', borderRadius: 10,
                padding: '6px 14px', outline: 'none', fontFamily: 'Georgia, serif',
                marginBottom: 4,
              }}
            />
          ) : (
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#1a1a2e' }}>
              {user?.username}
            </h2>
          )}
          <p style={{ margin: 0, color: '#9099b8', fontSize: 14, fontFamily: 'Georgia, serif' }}>{user?.email}</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { value: stats.total_recordings, label: 'Recordings' },
              { value: stats.communities_count, label: 'Shared' },
              { value: stats.member_since, label: 'Member since' },
            ].map(({ value, label }) => (
              <div key={label} style={{
                background: '#fff', borderRadius: 12, padding: '16px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                border: '1.5px solid #eef0f8',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#f4845f', fontFamily: 'Georgia, serif' }}>{value}</span>
                <span style={{ fontSize: 11, color: '#9099b8', marginTop: 4, textAlign: 'center', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        {editing && (
          <>
            {error && <p style={{ color: '#e8506a', fontSize: 14, marginBottom: 8 }}>{error}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #f4845f 0%, #e8506a 100%)',
                color: 'white', border: 'none', cursor: 'pointer', marginBottom: 12,
                fontFamily: 'Georgia, serif', boxShadow: '0 4px 14px rgba(244,132,95,0.35)',
              }}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            width: '100%', padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700,
            background: '#fff', color: '#e8506a',
            border: '1.5px solid #e8506a', cursor: 'pointer',
            fontFamily: 'Georgia, serif',
          }}
        >
          Log out
        </button>

      </div>
      <NavBar active="profile" onNavigate={onNavigate} />
    </div>
  );
}