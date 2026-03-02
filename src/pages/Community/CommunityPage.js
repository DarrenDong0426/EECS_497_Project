import React from 'react';
import NavBar from '../../components/NavBar/NavBar';
import '../../pages/Record/Record.css';

function CommunityPage() {
  return (
    <div className="screen">
      <div className="screen-content">
        <h1 className="page-title">Community</h1>
        <p className="page-subtitle">Coming soon</p>
      </div>
      <NavBar active="community" />
    </div>
  );
}

export default CommunityPage;
