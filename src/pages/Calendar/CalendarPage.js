import React from 'react';
import NavBar from '../../components/NavBar/NavBar';
import '../../pages/Record/Record.css';

function CalendarPage({ onNavigate }) {
  return (
    <div className="screen">
      <div className="screen-content">
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">Coming soon</p>
      </div>
      <NavBar active="calendar" onNavigate={onNavigate} />
    </div>
  );
}

export default CalendarPage;
