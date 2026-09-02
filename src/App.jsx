import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AudioProvider } from './context/AudioContext';

import Header from './containers/Header';
import Content from './containers/Content';
import ProfilePage from './containers/ProfilePage';
import ArtistPage from './containers/ArtistPage';
import AlbumPage from './containers/AlbumPage';
import ModerationPage from './containers/ModerationPage';
import GlobalPlayer from './components/GlobalPlayer';

import './styles/App.css';

function App() {
  return (
    <AudioProvider>
      <HashRouter>
        <Header />
        <main style={{ paddingBottom: '90px' }}>
          <Routes>
            <Route path="/" element={<Content />} />
            <Route path="/artists/:id" element={<ArtistPage />} />
            <Route path="/albums/:id" element={<AlbumPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/moderation" element={<ModerationPage />} />
          </Routes>
        </main>
        <GlobalPlayer />
      </HashRouter>
    </AudioProvider>
  );
}

export default App;