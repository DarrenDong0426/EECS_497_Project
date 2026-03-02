import React, { useState, useRef, useEffect } from 'react';
import NavBar from '../../components/NavBar/NavBar';
import Waveform from '../../components/Waveform/Waveform';
import './Record.css';

function PlayBack({ audioBlob, transcript, duration = 180, currentTime = 0, onContinue, onRestart, onSave }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
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

  return (
    <div className="screen">
      <div className="screen-content">
        <h1 className="page-title">Listen to Your Recording</h1>
        <p className="page-subtitle">Press play to hear what you recorded</p>

        <div className="timer">
          <div className="timer-time">{formatTime(time)}</div>
          <div className="timer-max">Length: {formatTime(currentTime)}</div>
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
          <button className="btn btn-continue" onClick={onContinue}>Keep Recording</button>
          <button className="btn btn-restart" onClick={onRestart}>Start Over</button>
        </div>
        <div className="btn-row">
          <button className="btn btn-save" onClick={onSave} style={{ flex: 1 }}>Save Recording</button>
        </div>
      </div>
      <NavBar active="record" />
    </div>
  );
}

export default PlayBack;
