import React, { useState, useRef, useEffect } from 'react';
import NavBar from '../../components/NavBar/NavBar';
import Waveform from '../../components/Waveform/Waveform';
import RecordingCard from '../../components/RecordingCard/RecordingCard';
import './Record.css';

const API = 'http://localhost:5001';

function Share({ audioBlob, transcript, duration = 0, recordingId, onShare, onNew, onNavigate }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [relatedRecordings, setRelatedRecordings] = useState(null);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        clearInterval(intervalRef.current);
      };
      return () => {
        URL.revokeObjectURL(url);
        if (audioRef.current) audioRef.current.pause();
        clearInterval(intervalRef.current);
      };
    }
  }, [audioBlob]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setTime(Math.floor(audioRef.current.currentTime));
      }, 200);
    }
  };

  const skip = (amt) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + amt, audioRef.current.duration || duration));
    audioRef.current.currentTime = newTime;
    setTime(Math.floor(newTime));
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleFindRelated = async () => {
    setLoadingRelated(true);
    try {
      const res = await fetch(`${API}/api/recordings?user_id=temp_user`);
      const data = await res.json();
      const others = data.filter((r) => String(r.id) !== String(recordingId));
      setRelatedRecordings(others);
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
      setRelatedRecordings([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  return (
    <div className="screen">
      <div className="screen-content" style={{ justifyContent: 'flex-start', paddingTop: 24 }}>
        <div className="status-banner saved">Your Recording Was Saved!</div>
        <p className="page-subtitle">You can listen to it again or share it with the community</p>

        <div className="timer">
          <div className="timer-time">{formatTime(time)}</div>
          <div className="timer-max">Length: {formatTime(duration)}</div>
        </div>

        <Waveform mode="static" />

        <div className="playback-controls">
          <button className="btn btn-skip" onClick={() => skip(-5)}>Back 5s</button>
          <button className="btn btn-play" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="btn btn-skip" onClick={() => skip(5)}>Skip 5s</button>
        </div>

        {transcript && (
          <div className="transcript-box">
            <div className="transcript-label">Transcript:</div>
            <div className="transcript-text">{transcript}</div>
          </div>
        )}

        <div className="btn-row">
          <button className="btn btn-share" onClick={onShare}>Share with Community</button>
        </div>
        <div className="btn-row">
          <button className="btn btn-new" onClick={onNew} style={{ flex: 1 }}>Record Something New</button>
        </div>

        {relatedRecordings === null && (
          <div className="btn-row">
            <button
              className="btn btn-related"
              onClick={handleFindRelated}
              disabled={loadingRelated}
              style={{ flex: 1 }}
            >
              {loadingRelated ? 'Searching...' : 'View Related Past Recordings'}
            </button>
          </div>
        )}

        {relatedRecordings !== null && (
          <div className="recordings-list">
            <h2 className="recordings-list-title">Related Past Recordings</h2>
            {relatedRecordings.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No related past recordings found.</p>
              </div>
            ) : (
              relatedRecordings.map((rec) => (
                <RecordingCard key={rec.id} recording={rec} />
              ))
            )}
          </div>
        )}
      </div>
      <NavBar active="record" onNavigate={onNavigate} />
    </div>
  );
}

export default Share;
