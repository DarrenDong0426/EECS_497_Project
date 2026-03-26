import React, { useState, useCallback } from 'react';
import RecordPage from './pages/Record/RecordPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import CommunityPage from './pages/Community/CommunityPage';
import ProfilePage from './pages/Profile/ProfilePage';

function App() {
  const [page, setPage] = useState('record');
  const [replyTargetRecordingId, setReplyTargetRecordingId] = useState(null);
  const [communitySelectedRecordingId, setCommunitySelectedRecordingId] = useState(null);

  const handleNavigate = useCallback((destination) => {
    if (typeof destination === 'string') {
      setPage(destination);
      if (destination !== 'record') {
        setReplyTargetRecordingId(null);
      }
      return;
    }

    if (destination?.type === 'reply-recording') {
      setReplyTargetRecordingId(destination.recordingId);
      setPage('record');
    }
  }, []);

  const handleReplyComplete = useCallback((recordingId) => {
    setReplyTargetRecordingId(null);
    setCommunitySelectedRecordingId(recordingId);
    setPage('community');
  }, []);

  const handleStartReplyRecording = useCallback((recordingId) => {
    handleNavigate({ type: 'reply-recording', recordingId });
  }, [handleNavigate]);

  const clearInitialSelection = useCallback(() => {
    setCommunitySelectedRecordingId(null);
  }, []);

  switch (page) {
    case 'calendar':
      return <CalendarPage onNavigate={handleNavigate} />;
    case 'record':
      return (
        <RecordPage
          onNavigate={handleNavigate}
          replyTargetRecordingId={replyTargetRecordingId}
          onReplyComplete={handleReplyComplete}
        />
      );
    case 'community':
      return (
        <CommunityPage
          onNavigate={handleNavigate}
          onStartReplyRecording={handleStartReplyRecording}
          initialSelectedRecordingId={communitySelectedRecordingId}
          onInitialSelectionConsumed={clearInitialSelection}
        />
      );
    case 'profile':
      return <ProfilePage onNavigate={handleNavigate} />;
    default:
      return <RecordPage onNavigate={handleNavigate} />;
  }
}

export default App;
