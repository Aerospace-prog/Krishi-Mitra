import React, { useState } from 'react';
import './Home.css';
import { useUser, SignOutButton } from '@clerk/clerk-react';

const Home = () => {
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="home-root">
      <video className="home-video" autoPlay loop muted playsInline src="/Videos/farm-video.mp4" />
      <div className="home-overlay" />

      <header className="home-navbar">
        <div className="brand">Krishi Mitra</div>
        <nav className="nav-links" />
        <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)}>
          {user?.firstName ? `Hi, ${user.firstName}` : 'Profile'}
        </button>
      </header>

      {profileOpen && (
        <div className="profile-panel" role="dialog" aria-modal="true">
          <div className="profile-header">
            <div className="avatar">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" />
              ) : (
                <div className="avatar-fallback">{user?.firstName?.[0] || 'U'}</div>
              )}
            </div>
            <div className="identity">
              <div className="name">{user?.fullName || user?.username || 'User'}</div>
              <div className="email">{user?.primaryEmailAddress?.emailAddress || '—'}</div>
            </div>
          </div>
          <div className="profile-body">
            <div className="row"><span>User ID</span><span>{user?.id}</span></div>
            <div className="row"><span>Phone</span><span>{user?.primaryPhoneNumber?.phoneNumber || '—'}</span></div>
            <div className="row"><span>Joined</span><span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
          </div>
          <div className="profile-actions">
            <SignOutButton signOutOptions={{ redirectUrl: '/' }}>
              <button className="signout">Sign out</button>
            </SignOutButton>
          </div>
        </div>
      )}

      <main className="home-content">
        <h1 className="title">AI Crop Recommendation</h1>
        <p className="subtitle">Personalized crop choices for your soil and climate.</p>

        <div className="cta-single">
          <button className="cta primary">Analyse My Farm</button>
        </div>
      </main>
    </div>
  );
};

export default Home;


