import React from 'react';
import NavBar from '../../components/NavBar/NavBar';
import Waveform from '../../components/Waveform/Waveform';
import './Record.css';

function PreRecord({ onRecord, error }) {
  return (
    <div className="screen">
      <div className="screen-content">
        <h1 className="page-title">Record Your Voice</h1>
        <p className="page-subtitle">
          Press the big red button below to start recording
        </p>

        <Waveform mode="idle" />

        {error && <p className="error-msg">{error}</p>}

        <div className="btn-record-wrap">
          <div className="btn-record-outer">
            <div className="btn-record-ring" />
            <button className="btn-record" onClick={onRecord}>
              Start
            </button>
          </div>
          <p className="btn-record-hint">Tap to begin</p>
        </div>
      </div>
      <NavBar active="record" />
    </div>
  );
}

export default PreRecord;
