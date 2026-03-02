import React, { useState, useRef, useEffect } from 'react';
import './Record.css';

const API = 'http://localhost:5001';

function SimilarRecordings({ recordingId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  const fetchSimilar = async () => {
    if (!recordingId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/recordings/${recordingId}/similar`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch similar:', err);
    }
    setLoading(false);
    setShown(true);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = (id) => {
    // If already playing this one, stop it
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Play the new one
    const audio = new Audio(`${API}/api/recordings/${id}/audio`);
    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };
    audio.play();
    audioRef.current = audio;
    setPlayingId(id);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!shown) {
    return (
      <button className="btn btn-similar" onClick={fetchSimilar} disabled={loading}>
        {loading ? 'Searching...' : 'Find Similar Recordings'}
      </button>
    );
  }

  return (
    <div className="similar-section">
      <div className="similar-header">Similar Recordings</div>

      {results.length === 0 ? (
        <p className="similar-empty">No similar recordings found yet. Record more to build your library!</p>
      ) : (
        <div className="similar-list">
          {results.map((rec) => (
            <div key={rec.id} className="similar-card">
              <div className="similar-card-top">
                <button
                  className="btn-similar-play"
                  onClick={() => togglePlay(rec.id)}
                >
                  {playingId === rec.id ? '⏸' : '▶'}
                </button>
                <div className="similar-card-info">
                  <div className="similar-card-date">
                    {new Date(rec.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </div>
                  <div className="similar-card-meta">
                    {formatTime(rec.duration)} · {Math.round(rec.similarity * 100)}% match
                  </div>
                </div>
              </div>
              {rec.transcript && (
                <div className="similar-card-transcript">{rec.transcript}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SimilarRecordings;
