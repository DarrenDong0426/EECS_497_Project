import React, { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar/NavBar';
import RecordingCard from '../../components/RecordingCard/RecordingCard';
import './Record.css';

const API = 'http://localhost:5001';

function OthersRelated({ recordingId, onNavigate, onBack, onNew }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOthers = async () => {
      try {
        const res = await fetch(`${API}/api/recordings?exclude_user=temp_user`);
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
    fetchOthers();
  }, [recordingId]);

  return (
    <div className="screen">
      <div className="screen-content" style={{ justifyContent: 'flex-start', paddingTop: 24 }}>
        <h1 className="page-title">Similar from Others</h1>

        <div className="btn-row">
          <button className="btn btn-save" onClick={onNew} style={{ flex: 1 }}>
            Record Something New
          </button>
        </div>
        <div className="btn-row">
          <button className="btn btn-related" onClick={onBack} style={{ flex: 1 }}>
            Back to My Recordings
          </button>
        </div>

        <p className="page-subtitle" style={{ marginTop: 8 }}>Recordings from other people</p>

        {loading && <p className="page-subtitle">Loading...</p>}

        {!loading && recordings.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-text">No recordings from others yet.</p>
            <p className="empty-state-hint">Check back later as more people share recordings!</p>
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

export default OthersRelated;