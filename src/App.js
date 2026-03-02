import React, { useState } from 'react';
import RecordPage from './pages/Record/RecordPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import CommunityPage from './pages/Community/CommunityPage';
import ProfilePage from './pages/Profile/ProfilePage';

function App() {
  const [page, setPage] = useState('record');

  switch (page) {
    case 'calendar':
      return <CalendarPage onNavigate={setPage} />;
    case 'record':
      return <RecordPage onNavigate={setPage} />;
    case 'community':
      return <CommunityPage onNavigate={setPage} />;
    case 'profile':
      return <ProfilePage onNavigate={setPage} />;
    default:
      return <RecordPage onNavigate={setPage} />;
  }
}

export default App;
