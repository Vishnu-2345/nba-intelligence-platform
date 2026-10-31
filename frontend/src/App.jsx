import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Target,
  Sparkles,
  Swords,
  Trophy,
  User,
  Shield,
  Activity,
  CircleDot
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import PropEdgeFinder from './pages/PropEdgeFinder';
import Predictions from './pages/Predictions';
import HeadToHead from './pages/HeadToHead';
import Leaderboards from './pages/Leaderboards';
import PlayerAnalytics from './pages/PlayerAnalytics';
import TeamsDirectory from './pages/TeamsDirectory';
import { api } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedPlayerId, setSelectedPlayerId] = useState(2544); // LeBron default
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    // Health check poll
    api.getSummary()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    const timer = setInterval(() => {
      api.getSummary()
        .then(() => setApiOnline(true))
        .catch(() => setApiOnline(false));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectPlayer = (id) => {
    setSelectedPlayerId(id);
    setCurrentPage('player-analytics');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'edge-finder', label: 'Prop Edge Finder', icon: Target, badge: '+EV' },
    { id: 'predictions', label: 'AI Predictions & Props', icon: Sparkles, badge: 'ML' },
    { id: 'head-to-head', label: 'Head-to-Head', icon: Swords },
    { id: 'leaderboards', label: 'Stat Leaderboards', icon: Trophy },
    { id: 'player-analytics', label: 'Player Analytics', icon: User },
    { id: 'teams', label: 'Franchises', icon: Shield },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-badge">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1rem',
            fontFamily: 'Chakra Petch'
          }}>
            🏀
          </div>
          <div>
            <div className="font-display" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', lineHeight: 1.2 }}>
              COURT<span style={{ color: '#f97316' }}>IQ</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
              INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} color={isActive ? '#f97316' : '#94a3b8'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span className="badge badge-orange font-mono" style={{ padding: '0.15rem 0.45rem', fontSize: '0.65rem' }}>
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div style={{
          padding: '0.75rem',
          borderRadius: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CircleDot size={12} color={apiOnline ? '#10b981' : '#f43f5e'} />
          <span style={{ color: 'var(--text-muted)' }}>
            API Engine: <strong style={{ color: apiOnline ? '#10b981' : '#f43f5e' }}>{apiOnline ? 'ONLINE (:8001)' : 'OFFLINE'}</strong>
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navbar */}
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Platform</span>
            <span style={{ color: 'var(--border-active)' }}>/</span>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
              {navItems.find((n) => n.id === currentPage)?.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-cyan font-mono" style={{ fontSize: '0.75rem' }}>
              SEASON 2024-25
            </span>
          </div>
        </header>

        {/* Dynamic Page Component */}
        <div className="content-body">
          {currentPage === 'dashboard' && (
            <Dashboard
              onSelectPlayer={handleSelectPlayer}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'edge-finder' && (
            <PropEdgeFinder
              onSelectPlayer={handleSelectPlayer}
            />
          )}

          {currentPage === 'predictions' && (
            <Predictions />
          )}

          {currentPage === 'head-to-head' && (
            <HeadToHead
              initialP1={selectedPlayerId}
            />
          )}

          {currentPage === 'leaderboards' && (
            <Leaderboards
              onSelectPlayer={handleSelectPlayer}
            />
          )}

          {currentPage === 'player-analytics' && (
            <PlayerAnalytics
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={setSelectedPlayerId}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'teams' && (
            <TeamsDirectory
              onSelectPlayer={handleSelectPlayer}
            />
          )}
        </div>
      </main>
    </div>
  );
}
