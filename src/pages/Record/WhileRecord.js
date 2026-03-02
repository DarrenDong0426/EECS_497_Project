import React, { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar/NavBar';
import Waveform from '../../components/Waveform/Waveform';
import './Record.css';

function WhileRecord({ analyserNode, transcript, onPause, onSave, maxDuration = 180, startTime = 0, onNavigate }) {
  const [elapsed, setElapsed] = useState(startTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= maxDuration) {
          clearInterval(interval);
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [maxDuration]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = (elapsed / maxDuration) * 100;

  return (
    <div className="screen">
      <div className="screen-content">
        <div className="status-banner recording">
          <span className="pulse-dot" />
          Recording Now...
        </div>

        <div className="timer">
          <div className="timer-time">{formatTime(elapsed)}</div>
          <div className="timer-max">out of {formatTime(maxDuration)}</div>
        </div>

        <Waveform analyserNode={analyserNode} mode="recording" />

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="transcript-box">
          <div className="transcript-label">What we're hearing:</div>
          <div className="transcript-text">
            {transcript || <span className="transcript-placeholder">Start speaking...</span>}
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-pause" onClick={() => onPause(elapsed)}>
            Pause
          </button>
          <button className="btn btn-save" onClick={() => onSave(elapsed)}>
            Save
          </button>
        </div>
      </div>
      <NavBar active="record" onNavigate={onNavigate} />
    </div>
  );
}

export default WhileRecord;
