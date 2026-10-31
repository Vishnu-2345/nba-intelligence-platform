import React, { useState, useEffect } from 'react';
import { api, PRESET_PLAYERS } from '../services/api';
import { User, Activity, ArrowRight, Sparkles, Swords, Search } from 'lucide-react';

export default function PlayerAnalytics({ selectedPlayerId, onSelectPlayer, onNavigate }) {
  const [playerId, setPlayerId] = useState(selectedPlayerId || PRESET_PLAYERS[0].id);
  const [stats, setStats] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (selectedPlayerId) {
      setPlayerId(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  useEffect(() => {
    fetchPlayerData(playerId);
  }, [playerId]);

  const fetchPlayerData = async (id) => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        api.getPlayerStats(id).catch(() => null),
        api.getPlayerDetails(id).catch(() => null),
      ]);
      setStats(sRes);
      setDetails(dRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.searchPlayers(searchQuery.trim());
      setSearchResults(res.slice(0, 6));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Header & Quick Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
            PLAYER SCOUTING & ANALYTICS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            In-depth statistical profiles, shooting splits, and career indexes.
          </p>
        </div>

        {/* Quick Pick Stars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            className="select-field"
            value={playerId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setPlayerId(id);
              if (onSelectPlayer) onSelectPlayer(id);
            }}
          >
            {PRESET_PLAYERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.team})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search any historical or active player (e.g. Giannis, Jokic, LeBron)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-secondary">
            <Search size={16} /> Scout
          </button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            {searchResults.map((p) => (
              <button
                key={p.player_id}
                onClick={() => {
                  setPlayerId(p.player_id);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading Player Profile...
        </div>
      ) : stats ? (
        <div>
          {/* Hero Profile Banner */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <img
                  src={details?.headshot_url}
                  alt={stats.player}
                  style={{
                    width: '120px',
                    height: '90px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    border: '2px solid rgba(249, 115, 22, 0.4)',
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-orange">NBA STAR</span>
                    <span className="badge badge-green">
                      {details?.is_active ? 'Active' : 'Alumni'}
                    </span>
                  </div>
                  <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                    {stats.player}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    NBA Player ID: <span className="font-mono" style={{ color: '#06b6d4' }}>{stats.player_id}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => onNavigate('predictions')}
                  className="btn-primary"
                >
                  <Sparkles size={16} /> Predict Props
                </button>
                <button
                  onClick={() => onNavigate('head-to-head')}
                  className="btn-secondary"
                >
                  <Swords size={16} /> Head-to-Head
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid-cols-4">
            <div className="metric-box">
              <div className="metric-label">Games Analyzed</div>
              <div className="metric-val" style={{ color: '#fff' }}>{stats.games}</div>
              <div className="metric-sub">Official 2024-25 Season</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Points Per Game</div>
              <div className="metric-val" style={{ color: '#f97316' }}>{stats.avg_pts}</div>
              <div className="metric-sub">Scoring Average (PPG)</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Rebounds Per Game</div>
              <div className="metric-val" style={{ color: '#06b6d4' }}>{stats.avg_reb}</div>
              <div className="metric-sub">Board Crash (RPG)</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Assists Per Game</div>
              <div className="metric-val" style={{ color: '#a855f7' }}>{stats.avg_ast}</div>
              <div className="metric-sub">Playmaking Average (APG)</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Steals Per Game</div>
              <div className="metric-val" style={{ color: '#10b981' }}>{stats.avg_stl}</div>
              <div className="metric-sub">Perimeter Defense (SPG)</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Blocks Per Game</div>
              <div className="metric-val" style={{ color: '#38bdf8' }}>{stats.avg_blk}</div>
              <div className="metric-sub">Rim Protection (BPG)</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">3-Pointers Made</div>
              <div className="metric-val" style={{ color: '#fb923c' }}>{stats.avg_fg3m}</div>
              <div className="metric-sub">Per Game 3PM</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Turnovers Per Game</div>
              <div className="metric-val" style={{ color: '#f43f5e' }}>{stats.avg_tov}</div>
              <div className="metric-sub">Ball Security (TOV)</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Player not found.
        </div>
      )}
    </div>
  );
}

