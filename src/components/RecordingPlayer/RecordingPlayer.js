import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../../config';
import { useAuth } from '../../context/AuthContext';
import './RecordingPlayer.css';

const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const STOP_WORDS = new Set([
  'the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you',
  'this', 'for', 'but', 'with', 'are', 'have', 'be', 'at', 'or', 'as', 'was',
  'so', 'if', 'out', 'not', 'my', 'me', 'we', 'they', 'your', 'about', 'just',
  'like', 'can', 'do', 'what', 'all', 'get', 'got', 'there', 'really'
]);

const extractKeywords = (text) => {
  if (!text) return "None found";
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g);
  if (!words) return "None found";
  const counts = {};
  words.forEach(w => {
    if (!STOP_WORDS.has(w)) counts[w] = (counts[w] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topWords = sorted.slice(0, 3).map(entry => entry[0]);
  if (topWords.length === 0) return "None found";
  return topWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ');
};

export default function RecordingPlayer({ recording, playingId, onPlay, onStop, onDelete }) {
  const { authFetch } = useAuth();
  const [time, setTime] = useState(0);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const isPlaying = playingId === recording.id;
  const audioUrl = `${API_BASE_URL}/api/recordings/${recording.id}/audio`;

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => {
      clearInterval(intervalRef.current);
      setTime(0);
      if (onStop) onStop();
    };
    return () => {
      audio.pause();
      clearInterval(intervalRef.current);
    };
  }, [audioUrl, onStop]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play();
      intervalRef.current = setInterval(() => {
        setTime(Math.floor(audioRef.current.currentTime));
      }, 200);
    } else {
      audioRef.current.pause();
      clearInterval(intervalRef.current);
    }
  }, [isPlaying]);

  const skip = (amt) => {
    if (!audioRef.current) return;
    const next = Math.max(0, Math.min(
      audioRef.current.currentTime + amt,
      audioRef.current.duration || recording.duration,
    ));
    audioRef.current.currentTime = next;
    setTime(Math.floor(next));
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this diary entry?");
    if (!confirmDelete) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/api/recordings/${recording.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (onDelete) onDelete(recording.id);
      } else {
        alert("Failed to delete recording.");
      }
    } catch (err) {
      console.error("Error deleting recording:", err);
    }
  };

  const keywords = extractKeywords(recording.transcript);

  return (
    <div className="player-card">
      <div className="player-meta">
        <div className="meta-left">
          <span className="player-time">
            {new Date(recording.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
          <span className="player-duration">{formatTime(recording.duration)}</span>
        </div>
        <button className="delete-btn" onClick={handleDelete} title="Delete entry">
          Delete
        </button>
      </div>

      <div className="player-keywords">
        <strong>Keywords:</strong> {keywords}
      </div>

      {recording.transcript ? (
        <p className="player-transcript">{recording.transcript}</p>
      ) : null}

      <div className="player-controls">
        <button className="skip-btn" onClick={() => skip(-5)}>−5s</button>
        <button className="play-btn" onClick={() => isPlaying ? onStop() : onPlay()}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="skip-btn" onClick={() => skip(5)}>+5s</button>
        <span className="player-clock">{formatTime(time)}</span>
      </div>
    </div>
  );
}