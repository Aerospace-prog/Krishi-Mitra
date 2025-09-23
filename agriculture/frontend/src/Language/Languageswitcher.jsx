import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Languageswitcher.css';

const indianLanguages = [
  { code: 'EN', name: 'English', flag: '🌐' },
  { code: 'HI', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'TA', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'TE', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'KN', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ML', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'MR', name: 'मराठी', flag: '🇮🇳' },
  { code: 'GU', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'PA', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'BN', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'OR', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'AS', name: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'UR', name: 'اردو', flag: '🇮🇳' },
];

const Languageswitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang.toLowerCase()); // lowercase for i18n
    localStorage.setItem('lang', lang.toLowerCase());
    setOpen(false);
  };

  return (
    <div className="language-switcher-dropdown" ref={dropdownRef}>
      <button className="lang-btn" onClick={() => setOpen(!open)}>
        <span className="globe-icon" role="img" aria-label="language">🌐</span>
        <span className="highlight-text">Select Language</span>
        <span className="arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="lang-dropdown">
          {indianLanguages.map((lang) => (
            <div
              key={lang.code}
              className={`lang-option ${i18n.language === lang.code.toLowerCase() ? 'selected' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-code">{lang.code}</span>
              <span className="lang-native">{lang.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Languageswitcher;
