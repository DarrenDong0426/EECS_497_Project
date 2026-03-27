import React, { useState, useMemo, useEffect } from 'react';
import NavBar from '../../components/NavBar/NavBar';
import DayDrawer from '../../components/DayDrawer/DayDrawer';
import API_BASE_URL from '../../config';
import './Calendar.css'; 

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const YEARS = Array.from({ length: 10 }, (_, i) => 2022 + i);

export default function CalendarPage({ onNavigate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [monthCounts, setMonthCounts] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  

  useEffect(() => {
    const month = String(viewMonth + 1).padStart(2, '0');
    fetch(`${API_BASE_URL}/api/recordings/counts?year=${viewYear}&month=${month}`)
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const normalizedCounts = {};
        for (const [key, value] of Object.entries(data)) {
          const cleanKey = key.split(' ')[0]; 
          normalizedCounts[cleanKey] = (normalizedCounts[cleanKey] || 0) + value;
        }
        setMonthCounts(normalizedCounts);
      })
      .catch(() => setMonthCounts({}));
  }, [viewYear, viewMonth]);

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth, refreshCount]);

  const dateKey = (day) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  const isToday = (day) => day && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  
  const isPast = (day) => {
    if (!day) return false;
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  const handleDayClick = (day) => {
    if (!day) return;
    if (!isPast(day) && !isToday(day)) return;
    const key = dateKey(day);
    setSelectedDateKey(prev => (prev === key ? null : key));
  };

  return (
    <div className="calendar-screen">
      <div className="calendar-content">

        <h1 className="page-title">Audio Diary</h1>

        <div className="calendar-controls">
          <button className="arrow-btn" onClick={goToPrevMonth} aria-label="Previous month">‹</button>
          <div className="selectors">
            <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} className="calendar-select">
              {MONTHS.map((m, i) => {
                const isFuture = viewYear === today.getFullYear() && i > today.getMonth();
                return <option key={m} value={i} disabled={isFuture}>{m}</option>;
              })}
            </select>
            <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} className="calendar-select">
              {YEARS.filter(y => y <= today.getFullYear()).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button className="arrow-btn" onClick={goToNextMonth} disabled={isCurrentMonth} aria-label="Next month">›</button>
        </div>

        <div className="dow-row">
          {DAYS_OF_WEEK.map(d => <div key={d} className="dow-cell">{d}</div>)}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day, idx) => {
            const todayFlag = isToday(day);
            const pastFlag = isPast(day);
            const count = day ? (monthCounts[dateKey(day)] || 0) : 0;
            const isSelected = day && selectedDateKey === dateKey(day);

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(day)}
                className={`calendar-cell ${!day ? 'empty' : ''} ${todayFlag ? 'today' : ''} ${pastFlag || todayFlag ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
              >
                {day && (
                  <>
                    <span className={`day-num ${todayFlag ? 'today' : ''} ${isSelected ? 'selected' : ''}`}>
                      {day}
                    </span>

                    {(pastFlag || todayFlag) && count > 0 && (
                      <div className="count-badge-wrap">
                        <span className={`count-badge ${isSelected ? 'selected' : ''}`}>{count}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="record-wrap">
          <button className="record-btn" onClick={() => onNavigate && onNavigate('record')} aria-label="Start recording">
            <span className="mic-icon">🎙</span>
            <span className="record-label">Record Entry</span>
          </button>
          <p className="record-hint">Tap to add today's diary entry</p>
        </div>

      </div>

      {selectedDateKey && (
        <DayDrawer 
          dateKey={selectedDateKey} 
          onClose={() => setSelectedDateKey(null)} 
          onRecordingDeleted={() => setRefreshCount(prev => prev + 1)} // <-- Add this!
        />
      )}

      <NavBar active="calendar" onNavigate={onNavigate} />
    </div>
  );
}