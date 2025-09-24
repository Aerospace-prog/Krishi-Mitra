import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import LandingPage from './pages/Landingpage/Landingpage';
import Home from './pages/Home/Home';

function App() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <Home />
      </SignedIn>
    </>
  );
}

export default App;