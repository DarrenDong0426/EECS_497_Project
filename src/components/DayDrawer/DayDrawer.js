import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import RecordingPlayer from '../RecordingPlayer/RecordingPlayer';
import './DayDrawer.css';

const formatDateLabel = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
};

export default function DayDrawer({ dateKey, onClose, onRecordingDeleted }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/recordings?date=${dateKey}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load recordings');
        return r.json();
      })
      .then(data => {
        setRecordings(Array.isArray(data) ? data : (data.recordings || []));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [dateKey]);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-container">
        <div className="drawer-handle" />
        <div className="drawer-header">
          <span className="drawer-title">{formatDateLabel(dateKey)}</span>
          <button className="drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="drawer-body">
          {loading && <div className="drawer-state">Loading recordings…</div>}
          {error && <div className="drawer-state drawer-error">{error}</div>}
          {!loading && !error && recordings.length === 0 && (
            <div className="drawer-state">No recordings for this day.</div>
          )}
          {!loading && !error && recordings.map(rec => (
            <RecordingPlayer
              key={rec.id}
              recording={rec}
              playingId={playingId}
              onPlay={() => setPlayingId(rec.id)}
              onStop={() => setPlayingId(null)}
              // NEW: Remove from UI list, and alert the Calendar
              onDelete={(deletedId) => {
                setRecordings(prev => prev.filter(r => r.id !== deletedId));
                if (onRecordingDeleted) onRecordingDeleted(); 
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}