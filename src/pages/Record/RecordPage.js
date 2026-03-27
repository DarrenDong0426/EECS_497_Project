import React, { useState, useRef, useEffect } from 'react';
import PreRecord from './PreRecord';
import WhileRecord from './WhileRecord';
import PlayBack from './PlayBack';
import MyRelated from './MyRelated';
import OthersRelated from './OthersRelated';

import API from '../../config';

function RecordPage({ onNavigate, replyTargetRecordingId = null, onReplyComplete }) {
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

  const isReplyMode = !!replyTargetRecordingId;

  useEffect(() => {
    setScreen('pre');
    setRecordedTime(0);
    setAudioBlob(null);
    setTranscript('');
    transcriptRef.current = '';
  }, [replyTargetRecordingId]);

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

  const postReplyRecording = async (blob, dur, text) => {
    if (!blob || !replyTargetRecordingId) return;
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'reply.webm');
      formData.append('duration', dur);
      if (text) {
        formData.append('text', text);
      }
      await fetch(`${API}/api/recordings/${replyTargetRecordingId}/replies`, {
        method: 'POST',
        body: formData,
      });
      if (onReplyComplete) {
        onReplyComplete(replyTargetRecordingId);
      }
    } catch (err) {
      console.error('Reply upload failed:', err);
    }
  };

  const shareRecording = async () => {
    const id = recordingIdRef.current;
    if (!id) {
      console.error('No recording ID to share');
      return;
    }
    try {
      await fetch(`${API}/api/recordings/${id}/share`, {
        method: 'PUT',
      });
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
          finalText += `${result[0].transcript} `;
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
    try {
      recognition.start();
    } catch (e) {
      console.error('Speech recognition failed to start:', e);
    }
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const stopRecordingAndGetBlob = () => new Promise((resolve) => {
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
        stopTranscription();
        resolve(blob);
      };
      mediaRecorderRef.current.stop();
    } else {
      stopTranscription();
      resolve(null);
    }
  });

  const startRecording = async () => {
    try {
      setError('');
      setTranscript('');
      transcriptRef.current = '';
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
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
  console.error('startRecording error:', err.name, err.message);
  setError(`Error: ${err.name} - ${err.message}`);
}
  };

  const reset = () => {
    setRecordedTime(0);
    setAudioBlob(null);
    setTranscript('');
    transcriptRef.current = '';
    recordingIdRef.current = null;
  };

  const handlePause = async (elapsed) => {
    await stopRecordingAndGetBlob();
    setRecordedTime(elapsed);
    setScreen('playback');
  };

  const handleSave = async (elapsed) => {
    const finalTranscript = transcriptRef.current;
    const blob = await stopRecordingAndGetBlob();
    const dur = elapsed !== undefined ? elapsed : recordedTime;
    setRecordedTime(dur);
    await new Promise((r) => setTimeout(r, 300));
    const transcriptText = transcriptRef.current || finalTranscript;

    if (isReplyMode) {
      await postReplyRecording(blob, dur, transcriptText);
      return;
    }

    await uploadRecording(blob, dur, transcriptText);
    setScreen('myrelated');
  };

  const handleContinue = () => startRecording();
  const handleRestart = () => { reset(); setScreen('pre'); };
  const handleNew = () => { reset(); setScreen('pre'); };

  switch (screen) {
    case 'pre':
      return <PreRecord onRecord={startRecording} error={error} onNavigate={onNavigate} />;
    case 'while':
      return (
        <WhileRecord
          analyserNode={analyserNode}
          transcript={transcript}
          onPause={handlePause}
          onSave={handleSave}
          startTime={recordedTime}
          onNavigate={onNavigate}
          saveLabel={isReplyMode ? 'Post Reply' : 'Save'}
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
          onNavigate={onNavigate}
          title={isReplyMode ? 'Review Your Reply' : 'Listen to Your Recording'}
          subtitle={isReplyMode ? 'When ready, post this recording as your reply' : 'Press play to hear what you recorded'}
          saveLabel={isReplyMode ? 'Post Reply' : 'Save Recording'}
        />
      );
    case 'myrelated':
      return (
        <MyRelated
          recordingId={recordingIdRef.current}
          onNavigate={onNavigate}
          onViewOthers={() => setScreen('othersrelated')}
          onNew={handleNew}
          onShare={shareRecording}
        />
      );
    case 'othersrelated':
      return (
        <OthersRelated
          recordingId={recordingIdRef.current}
          onNavigate={onNavigate}
          onBack={() => setScreen('myrelated')}
          onNew={handleNew}
        />
      );
    default:
      return <PreRecord onRecord={startRecording} error={error} onNavigate={onNavigate} />;
  }
}

export default RecordPage;