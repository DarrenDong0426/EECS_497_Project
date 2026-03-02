import React from 'react';
import NavBar from '../../components/NavBar/NavBar';
import '../../pages/Record/Record.css';

function ProfilePage() {
  return (
    <div className="screen">
      <div className="screen-content">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Coming soon</p>
      </div>
      <NavBar active="profile" />
    </div>
  );
}

export default ProfilePage;
