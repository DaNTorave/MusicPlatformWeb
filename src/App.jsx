import React from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AudioProvider } from './context/AudioContext';

import Header from './containers/Header';
import Content from './containers/Content';
import ProfilePage from './containers/ProfilePage';
import ArtistPage from './containers/ArtistPage';
import AlbumPage from './containers/AlbumPage';
import ModerationPage from './containers/ModerationPage';
import TrackPage from './containers/TrackPage';
import PlayerPage from './containers/PlayerPage';
import GlobalPlayer from './components/GlobalPlayer';

import './styles/App.css';

function AppLayout() {
  const location = useLocation();
  const isPlayerPage = location.pathname === '/player';
  return (
    <>
      <Header />
      <main style={{ paddingBottom: isPlayerPage ? '0' : '90px' }}>
        <Routes>
          <Route path="/" element={<Content />} />
          <Route path="/artists/:id/*" element={<ArtistPage />} />
          <Route path="/albums/:id" element={<AlbumPage />} />
          <Route path="/tracks/:id" element={<TrackPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/moderation" element={<ModerationPage />} />
          <Route path="/player" element={<PlayerPage />} />
        </Routes>
      </main>
      {!isPlayerPage && <GlobalPlayer />}
    </>
  );
}

function App() {
  return (
    <AudioProvider>
      <HashRouter>
        <AppLayout />
      </HashRouter>
    </AudioProvider>
  );
}

export default App;
