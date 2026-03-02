import React, { useState, useRef, useEffect } from 'react';
import './RecordingCard.css';

const API = 'http://localhost:5001';

function RecordingCard({ recording }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(recording.duration || 0);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(`${API}/api/recordings/${recording.id}/audio`);

    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(Math.floor(audio.duration));
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setTime(0);
      clearInterval(intervalRef.current);
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      clearInterval(intervalRef.current);
    };
  }, [recording.id]);

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
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + amt, audioRef.current.duration || audioDuration));
    audioRef.current.currentTime = newTime;
    setTime(Math.floor(newTime));
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="recording-card">
      <div className="recording-card-header">
        <span className="recording-card-date">{formatDate(recording.created_at)}</span>
        <span className="recording-card-duration">{formatTime(audioDuration)}</span>
      </div>

      <div className="recording-card-controls">
        <button className="btn btn-skip" onClick={() => skip(-5)}>Back 5s</button>
        <button className="btn btn-play" onClick={togglePlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="btn btn-skip" onClick={() => skip(5)}>Skip 5s</button>
        <span className="recording-card-time">{formatTime(time)}</span>
      </div>

      {recording.transcript && (
        <div className="recording-card-transcript">
          {recording.transcript}
        </div>
      )}
    </div>
  );
}

export default RecordingCard;
