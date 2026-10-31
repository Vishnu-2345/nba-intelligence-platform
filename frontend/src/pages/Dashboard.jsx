import React, { useEffect, useState } from 'react';
import { api, PRESET_PLAYERS } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, Shield, Database, TrendingUp, Search, ArrowRight } from 'lucide-react';

export default function Dashboard({ onSelectPlayer, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [topScorers, setTopScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, scorersRes] = await Promise.all([
          api.getSummary().catch(() => null),
          api.getTopScorers(6, 1).catch(() => []),
        ]);
        setSummary(sumRes);
        setTopScorers(scorersRes);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.searchPlayers(searchQuery.trim());
      setSearchResults(results.slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
            NBA INTELLIGENCE PLATFORM
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Real-time analytics, machine learning prop predictions, and relational box-score modeling.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onNavigate('predictions')} className="btn-primary">
            Run AI Matchup <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid-cols-4">
        <div className="metric-box">
          <div className="metric-label">Active Franchises</div>
          <div className="metric-val">{summary ? summary.teams : '30'}</div>
          <div className="metric-sub">
            <Shield size={14} color="#f97316" /> Eastern & Western Conferences
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">Active Roster Players</div>
          <div className="metric-val" style={{ color: '#06b6d4' }}>
            {summary ? summary.active_players : '519'}
          </div>
          <div className="metric-sub">
            <Users size={14} color="#06b6d4" /> Current 2024-25 Season
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">Historical Player Index</div>
          <div className="metric-val">{summary ? summary.players.toLocaleString() : '5,198'}</div>
          <div className="metric-sub">
            <Database size={14} color="#a855f7" /> 1946 to Present Day
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">Game Logs Indexed</div>
          <div className="metric-val" style={{ color: '#10b981' }}>
            {summary ? summary.game_logs.toLocaleString() : '597'}
          </div>
          <div className="metric-sub">
            <Activity size={14} color="#10b981" /> Full box-score counting stats
          </div>
        </div>
      </div>

      {/* Main Grid: Top Scorers Chart & Quick Search */}
      <div className="grid-cols-2">
        {/* Top Performers Chart */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#f97316" /> Scoring Leaders (PPG)
            </span>
            <button onClick={() => onNavigate('leaderboards')} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              View All
            </button>
          </div>

          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topScorers} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="player" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 36]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121826', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  formatter={(val) => [`${val} PPG`, 'Points Per Game']}
                />
                <Bar dataKey="ppg" radius={[4, 4, 0, 0]}>
                  {topScorers.map((_, index) => (
                    <Cell key={index} fill={index === 0 ? '#f97316' : index === 1 ? '#fb923c' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Player Search & Quick Roster */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} color="#06b6d4" /> Instant Player Scout
            </span>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input
              type="text"
              placeholder="Search by name (e.g. Curry, Doncic, Tatum)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={searching}>
              {searching ? 'Scouting...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 ? (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              <table className="data-table">
                <tbody>
                  {searchResults.map((p) => (
                    <tr
                      key={p.player_id}
                      onClick={() => onSelectPlayer(p.player_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>
                        <span className={`badge ${p.is_active ? 'badge-green' : 'badge-orange'}`}>
                          {p.is_active ? 'Active' : 'Alumni'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ArrowRight size={14} color="#64748b" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                Featured Stars for Instant Analytics:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {PRESET_PLAYERS.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlayer(p.id)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                  >
                    <span style={{ color: '#f97316', fontWeight: 700 }}>#{p.num}</span> {p.name} ({p.team})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

