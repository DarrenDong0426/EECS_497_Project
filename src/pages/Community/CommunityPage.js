import React, { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar/NavBar';
import RecordingCard from '../../components/RecordingCard/RecordingCard';
import '../../components/RecordingCard/RecordingCard.css';
import '../../pages/Record/Record.css';

const API = 'http://localhost:5001';

function CommunityPage({ onNavigate }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await fetch(`${API}/api/recordings`);
        const data = await res.json();
        const shared = data.filter((r) => r.shared);
        setRecordings(shared);
      } catch (err) {
        console.error('Failed to fetch recordings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, []);

  return (
    <div className="screen">
      <div className="screen-content community-content">
        <h1 className="page-title">Community Recordings</h1>
        <p className="page-subtitle">Listen to what others have shared</p>

        {loading && <p className="page-subtitle">Loading...</p>}

        {!loading && recordings.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-text">No recordings shared yet.</p>
            <p className="empty-state-hint">
              Record something and share it with the community!
            </p>
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
      <NavBar active="community" onNavigate={onNavigate} />
    </div>
  );
}

export default CommunityPage;
