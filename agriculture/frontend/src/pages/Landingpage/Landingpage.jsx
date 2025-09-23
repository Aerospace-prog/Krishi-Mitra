import React from 'react';
import { useTranslation } from 'react-i18next';
import Languageswitcher from '../../Language/Languageswitcher';
import './Landingpage.css';

const Landingpage = () => {
  const { t } = useTranslation();

  return (
    <div className="landing-container">
      <video
        autoPlay
        loop
        muted
        className="bg-video"
        src="/Videos/farm-video.mp4"
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
          <button className="btn get-started">{t('getStarted')}</button>

        </div>
      </div>
    </div>
  );
};

export default Landingpage;
