import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landingpage/Landingpage';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import DiseaseScan from './pages/DiseaseScan/DiseaseScan';
import './App.css';

function App() {
  return (
    <Router>
      <SignedOut>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/disease-scan" element={<DiseaseScan />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SignedIn>
    </Router>
  );
}

export default App;