import React from 'react';
import NavBar from '../../components/NavBar/NavBar';
import '../../pages/Record/Record.css';

function CalendarPage() {
  return (
    <div className="screen">
      <div className="screen-content">
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">Coming soon</p>
      </div>
      <NavBar active="calendar" />
    </div>
  );
}

export default CalendarPage;
