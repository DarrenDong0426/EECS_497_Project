import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../../config';
import './RecordingPlayer.css';

const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function RecordingPlayer({ recording, playingId, onPlay, onStop }) {
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

  return (
    <div className="player-card">
      <div className="player-meta">
        <span className="player-time">
          {new Date(recording.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
        <span className="player-duration">{formatTime(recording.duration)}</span>
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