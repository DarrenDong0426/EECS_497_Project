import React, { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar/NavBar';
import RecordingCard from '../../components/RecordingCard/RecordingCard';
import './Record.css';

const API = 'http://localhost:5001';

function MyRelated({ recordingId, onNavigate, onViewOthers, onNew }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(`${API}/api/recordings?user_id=temp_user`);
        const data = await res.json();
        const others = data
          .filter((r) => String(r.id) !== String(recordingId))
          .slice(0, 10);
        setRecordings(others);
      } catch (err) {
        console.error('Failed to fetch recordings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [recordingId]);

  return (
    <div className="screen">
      <div className="screen-content" style={{ justifyContent: 'flex-start', paddingTop: 24 }}>
        <div className="status-banner saved">Recording Saved!</div>

        <div className="btn-row">
          <button className="btn btn-save" onClick={onNew} style={{ flex: 1 }}>
            Record Something New
          </button>
        </div>
        <div className="btn-row">
          <button className="btn btn-related" onClick={onViewOthers} style={{ flex: 1 }}>
            Find Similar from Others
          </button>
        </div>

        <h2 className="recordings-list-title" style={{ marginTop: 16 }}>Your Past Recordings</h2>

        {loading && <p className="page-subtitle">Loading...</p>}

        {!loading && recordings.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-text">No past recordings yet.</p>
            <p className="empty-state-hint">Record more to see your past recordings here!</p>
          </div>
        )}

        {!loading && recordings.length > 0 && (
          <div className="recordings-list">
            {recordings.map((rec) => (
              <RecordingCard key={rec.id} recording={rec} />
            ))}
          </div>
        )}
      </div>
      <NavBar active="record" onNavigate={onNavigate} />
    </div>
  );
}

export default MyRelated;