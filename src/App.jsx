import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import Header from './containers/Header';
import Content from './containers/Content';
import ProfilePage from './containers/ProfilePage'

import './styles/App.css';

function App() {
  return (
    <HashRouter>
      <Header />
      <main>
        <Routes>
          <Route path='/' element={<Content />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;