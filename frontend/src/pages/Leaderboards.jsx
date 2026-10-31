import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Award, Flame } from 'lucide-react';

export default function Leaderboards({ onSelectPlayer }) {
  const [category, setCategory] = useState('scorers'); // scorers | assists | rebounds
  const [minGames, setMinGames] = useState(5);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaders();
  }, [category, minGames]);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      let data = [];
      if (category === 'scorers') {
        data = await api.getTopScorers(15, minGames);
      } else if (category === 'assists') {
        data = await api.getTopAssists(15, minGames);
      } else {
        data = await api.getTopRebounders(15, minGames);
      }
      setLeaders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const metricKey = category === 'scorers' ? 'ppg' : category === 'assists' ? 'apg' : 'rpg';
  const metricLabel = category === 'scorers' ? 'Points Per Game' : category === 'assists' ? 'Assists Per Game' : 'Rebounds Per Game';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
            STATISTICAL LEADERBOARDS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Official NBA league leaders sorted by per-game efficiency with qualified games filters.
          </p>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Min Games Qualifier:</label>
          <select
            className="select-field"
            value={minGames}
            onChange={(e) => setMinGames(Number(e.target.value))}
          >
            <option value={1}>1+ Games (All)</option>
            <option value={5}>5+ Games</option>
            <option value={15}>15+ Games</option>
            <option value={30}>30+ Games</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        {[
          { key: 'scorers', label: '🔥 Top Scorers (PPG)' },
          { key: 'assists', label: '🎯 Top Playmakers (APG)' },
          { key: 'rebounds', label: '🛡️ Top Rebounders (RPG)' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setCategory(t.key)}
            className={`tab-btn ${category === t.key ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading Official Leaderboard...
        </div>
      ) : leaders.length > 0 ? (
        <div className="grid-cols-2">
          {/* Chart */}
          <div className="card">
            <div className="card-title">
              <span>📊 Top 10 Distribution</span>
            </div>

            <div style={{ height: 350, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaders.slice(0, 10)} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="player" stroke="#64748b" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121826', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                    formatter={(val) => [`${val}`, metricLabel]}
                  />
                  <Bar dataKey={metricKey} radius={[0, 4, 4, 0]}>
                    {leaders.slice(0, 10).map((_, index) => (
                      <Cell key={index} fill={index === 0 ? '#f97316' : index < 3 ? '#fb923c' : '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranked Table */}
          <div className="card">
            <div className="card-title">
              <span>📋 Official Ranking Table</span>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Games</th>
                    <th>{metricLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((row, idx) => (
                    <tr
                      key={row.player_id || idx}
                      onClick={() => onSelectPlayer && row.player_id && onSelectPlayer(row.player_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 700, color: idx === 0 ? '#f97316' : idx < 3 ? '#fb923c' : '#64748b' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>{row.player}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{row.games}</td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 700, color: idx === 0 ? '#f97316' : '#fff' }}>
                          {row[metricKey]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No qualifying players found for this criteria. Try lowering the minimum games filter.
        </div>
      )}
    </div>
  );
}
