import React, { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AudioProvider } from './context/AudioContext';

import Header from './containers/Header';
import Content from './containers/Content';
import ProfilePage from './containers/ProfilePage';
import ArtistPage from './containers/ArtistPage';
import AlbumPage from './containers/AlbumPage';
import ModerationPage from './containers/ModerationPage';
import RolesPage from './containers/RolesPage';
import TrackPage from './containers/TrackPage';
import PlayerPage from './containers/PlayerPage';
import GlobalPlayer from './components/GlobalPlayer';
import FavoritesPage from './containers/FavoritesPage';
import PlaylistsPage from './containers/PlaylistsPage';
import PlaylistPage from './containers/PlaylistPage';

import './styles/App.css';
import { FavoritesProvider } from './context/FavoritesContext';

function AppLayout() {
  const location = useLocation();
  const isPlayerPage = location.pathname === '/player';

  useEffect(() => {
    const updateBodyScrollLock = () => {
      const hasOpenModal = document.querySelector('.modal-background') !== null;
      if (hasOpenModal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    updateBodyScrollLock();

    const observer = new MutationObserver(updateBodyScrollLock);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

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
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/player" element={<PlayerPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlists/:id" element={<PlaylistPage />} />
        </Routes>
      </main>
      {!isPlayerPage && <GlobalPlayer />}
    </>
  );
}

function App() {
  return (
    <FavoritesProvider>
      <AudioProvider>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </AudioProvider>
    </FavoritesProvider>
  );
}

export default App;