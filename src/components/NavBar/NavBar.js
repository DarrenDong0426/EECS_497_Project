import React from 'react';
import './NavBar.css';

function NavBar({ active = 'record', onNavigate }) {
  const tabs = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'record', label: 'Record' },
    { id: 'community', label: 'Community' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <nav className="navbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`navbar-tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onNavigate && onNavigate(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default NavBar;
