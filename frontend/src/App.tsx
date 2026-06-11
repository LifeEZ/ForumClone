import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './layout/AppShell';
import { Home } from './pages/Home';
import { CommunityPage } from './pages/CommunityPage';
import { PostDetail } from './pages/PostDetail';
import { Compose } from './pages/Compose';
import { useScreenInit } from './useScreenInit';
// A simple placeholder for routes we haven't built yet
const PlaceholderPage = ({ title }: {title: string;}) =>
<div className="text-center py-20">
    <h2 className="text-2xl font-bold text-forest-text">{title}</h2>
    <p className="text-forest-muted mt-2">This page is under construction.</p>
  </div>;

export function App() {
  useScreenInit();
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="r/:handle" element={<CommunityPage />} />
            <Route path="post/:id" element={<PostDetail />} />
            <Route path="compose" element={<Compose />} />
            <Route
              path="popular"
              element={<PlaceholderPage title="Popular" />} />
            
            <Route
              path="explore"
              element={<PlaceholderPage title="Explore" />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>);

}