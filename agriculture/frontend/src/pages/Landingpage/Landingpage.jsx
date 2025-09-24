import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Languageswitcher from '../../Language/Languageswitcher';
import './Landingpage.css';
import { SignIn, SignUp } from '@clerk/clerk-react';

const Landingpage = () => {
  const { t } = useTranslation();

  const [pulse, setPulse] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState('sign-in');

  const handleGetStarted = () => {
    setPulse(true);
    setShowAuth(true);
    setAuthTab('sign-in');
    setTimeout(() => setPulse(false), 700);
  };

  return (
    <div className="landing-container">
      <video
        autoPlay
        loop
        className="bg-video"
        src="/Videos/landing-page-vedio.mp4"
        type="video/mp4"
      ></video>
      <div className="overlay" />
      <div className="language-switcher">
        <Languageswitcher />
      </div>
      <div className="content">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>



        <div className="button-row">
          <button
            className={`btn get-started ${pulse ? 'pulse' : ''}`}
            onClick={handleGetStarted}
          >
            {t('getStarted')}
          </button>
        </div>
      </div>
      {showAuth && (
        <div className="auth-overlay" onClick={() => setShowAuth(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-tabs">
              <button
                className={authTab === 'sign-in' ? 'active' : ''}
                onClick={() => setAuthTab('sign-in')}
              >
                Sign in
              </button>
              <button
                className={authTab === 'sign-up' ? 'active' : ''}
                onClick={() => setAuthTab('sign-up')}
              >
                Sign up
              </button>
            </div>
            <div className="auth-body">
              {authTab === 'sign-in' ? (
                <SignIn routing="hash" afterSignInUrl="/home" signUpUrl="#/sign-up" />
              ) : (
                <SignUp routing="hash" afterSignUpUrl="/home" signInUrl="#/sign-in" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landingpage;