import React, { useState, useRef, useCallback } from 'react';
import PreRecord from './PreRecord';
import WhileRecord from './WhileRecord';
import PlayBack from './PlayBack';
import Share from './Share';
import SaveConfirm from './SaveConfirm';

const API = 'http://localhost:5001';

function RecordPage() {
  const [screen, setScreen] = useState('pre');
  const [recordedTime, setRecordedTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [analyserNode, setAnalyserNode] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const recordingIdRef = useRef(null);

  const uploadRecording = async (blob, dur, text) => {
    if (!blob) return null;
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('transcript', text);
      formData.append('duration', dur);
      const res = await fetch(`${API}/api/recordings`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.recording) {
        recordingIdRef.current = data.recording.id;
        return data.recording.id;
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    return null;
  };

  const shareRecording = async () => {
    const id = recordingIdRef.current;
    if (!id) {
      console.error('No recording ID to share');
      return;
    }
    try {
      const res = await fetch(`${API}/api/recordings/${id}/share`, {
        method: 'PUT',
      });
      const data = await res.json();
      console.log('Share response:', data);
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const startTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = transcriptRef.current;
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
          transcriptRef.current = finalText;
        } else {
          interimText += result[0].transcript;
        }
      }
      setTranscript(finalText + interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognition.onend = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const stopRecordingAndGetBlob = () => {
    return new Promise((resolve) => {
      stopTranscription();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAnalyserNode(null);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      setAnalyserNode(analyser);

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      startTranscription();
      setScreen('while');
    } catch (err) {
      setError('We need permission to use your microphone. Please allow access and try again.');
    }
  };

  const reset = () => {
    setRecordedTime(0);
    setAudioBlob(null);
    setTranscript('');
    transcriptRef.current = '';
    recordingIdRef.current = null;
  };

  const handleRecord = () => { reset(); startRecording(); };

  const handlePause = async (elapsed) => {
    await stopRecordingAndGetBlob();
    setRecordedTime(elapsed);
    setScreen('playback');
  };

  const handleSave = async (elapsed) => {
    const blob = await stopRecordingAndGetBlob();
    const dur = elapsed !== undefined ? elapsed : recordedTime;
    setRecordedTime(dur);
    await uploadRecording(blob, dur, transcriptRef.current);
    setScreen('share');
  };

  const handleContinue = () => startRecording();
  const handleRestart = () => { reset(); setScreen('pre'); };

  const handleShare = async () => {
    await shareRecording();
    setScreen('save');
  };

  const handleNew = () => { reset(); setScreen('pre'); };

  switch (screen) {
    case 'pre':
      return <PreRecord onRecord={handleRecord} error={error} />;
    case 'while':
      return (
        <WhileRecord
          analyserNode={analyserNode}
          transcript={transcript}
          onPause={handlePause}
          onSave={handleSave}
          startTime={recordedTime}
        />
      );
    case 'playback':
      return (
        <PlayBack
          audioBlob={audioBlob}
          transcript={transcript}
          currentTime={recordedTime}
          onContinue={handleContinue}
          onRestart={handleRestart}
          onSave={() => handleSave(recordedTime)}
        />
      );
    case 'share':
      return (
        <Share
          audioBlob={audioBlob}
          transcript={transcript}
          duration={recordedTime}
          onShare={handleShare}
          onNew={handleNew}
        />
      );
    case 'save':
      return (
        <SaveConfirm
          audioBlob={audioBlob}
          transcript={transcript}
          duration={recordedTime}
          onNew={handleNew}
        />
      );
    default:
      return <PreRecord onRecord={handleRecord} error={error} />;
  }
}

export default RecordPage;
