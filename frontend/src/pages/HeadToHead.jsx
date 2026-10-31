import React, { useState, useEffect } from 'react';
import { api, PRESET_PLAYERS } from '../services/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, Swords, Zap, Activity } from 'lucide-react';

export default function HeadToHead({ initialP1, initialP2 }) {
  const [p1Id, setP1Id] = useState(initialP1 || PRESET_PLAYERS[0].id); // LeBron
  const [p2Id, setP2Id] = useState(initialP2 || PRESET_PLAYERS[1].id); // Curry
  const [compData, setCompData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComparison(p1Id, p2Id);
  }, [p1Id, p2Id]);

  const fetchComparison = async (id1, id2) => {
    if (id1 === id2) return;
    setLoading(true);
    try {
      const data = await api.comparePlayers(id1, id2);
      setCompData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const p1 = compData?.player1;
  const p2 = compData?.player2;
  const leaders = compData?.category_leaders || {};

  // Normalize radar stats for equal visual scaling
  const radarData = p1 && p2 ? [
    { subject: 'Scoring (PPG)', A: p1.averages.ppg, B: p2.averages.ppg },
    { subject: 'Rebounding (RPG)', A: p1.averages.rpg * 3, B: p2.averages.rpg * 3 },
    { subject: 'Playmaking (APG)', A: p1.averages.apg * 3, B: p2.averages.apg * 3 },
    { subject: 'Steals (SPG)', A: p1.averages.spg * 15, B: p2.averages.spg * 15 },
    { subject: 'Blocks (BPG)', A: p1.averages.bpg * 15, B: p2.averages.bpg * 15 },
    { subject: '3PT Shooting (3PM)', A: p1.averages.fg3m * 6, B: p2.averages.fg3m * 6 },
  ] : [];

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
          HEAD-TO-HEAD COMPARISON
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Side-by-side star comparison with dual skill radar overlays, category differentials, and True Shooting % (TS%).
        </p>
      </div>

      {/* Selectors */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#f97316', fontWeight: 700, marginBottom: '0.35rem' }}>
            PLAYER A
          </label>
          <select className="select-field" value={p1Id} onChange={(e) => setP1Id(Number(e.target.value))}>
            {PRESET_PLAYERS.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.team})</option>
            ))}
          </select>
        </div>

        <div style={{ paddingTop: '1.2rem', color: 'var(--text-dim)', fontWeight: 700 }}>
          VS
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700, marginBottom: '0.35rem' }}>
            PLAYER B
          </label>
          <select className="select-field" value={p2Id} onChange={(e) => setP2Id(Number(e.target.value))}>
            {PRESET_PLAYERS.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.team})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing Differential Metrics...
        </div>
      ) : p1 && p2 ? (
        <div>
          {/* Dual Profile Card */}
          <div className="card" style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center' }}>
              {/* Player 1 Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <img
                  src={p1.headshot_url}
                  alt={p1.full_name}
                  style={{ width: '90px', height: '68px', objectFit: 'cover', borderRadius: '8px', background: 'var(--bg-secondary)', border: '2px solid rgba(249, 115, 22, 0.4)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f97316' }}>
                    {p1.full_name}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Franchise: <strong style={{ color: '#fff' }}>{p1.team || 'NBA'}</strong> | Games: <strong style={{ color: '#fff' }}>{p1.games_played}</strong>
                  </div>
                </div>
              </div>

              {/* Center Badge */}
              <div style={{ textAlign: 'center' }}>
                <div className="badge badge-orange font-mono" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  MATCHUP
                </div>
              </div>

              {/* Player 2 Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', justifyContent: 'flex-end', textAlign: 'right' }}>
                <div>
                  <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#06b6d4' }}>
                    {p2.full_name}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Franchise: <strong style={{ color: '#fff' }}>{p2.team || 'NBA'}</strong> | Games: <strong style={{ color: '#fff' }}>{p2.games_played}</strong>
                  </div>
                </div>
                <img
                  src={p2.headshot_url}
                  alt={p2.full_name}
                  style={{ width: '90px', height: '68px', objectFit: 'cover', borderRadius: '8px', background: 'var(--bg-secondary)', border: '2px solid rgba(6, 182, 212, 0.4)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
          </div>

          {/* Radar & Advanced Splits */}
          <div className="grid-cols-2">
            {/* Radar Chart */}
            <div className="card">
              <div className="card-title">
                <span>🎯 Skill Impact Radar</span>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#f97316', fontWeight: 600 }}>● {p1.full_name}</span>
                  <span style={{ color: '#06b6d4', fontWeight: 600 }}>● {p2.full_name}</span>
                </div>
              </div>

              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 45]} stroke="#334155" />
                    <Radar name={p1.full_name} dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.35} />
                    <Radar name={p2.full_name} dataKey="B" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} />
                    <Tooltip contentStyle={{ backgroundColor: '#121826', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Advanced Shooting Splits Card */}
            <div className="card">
              <div className="card-title">
                <span>⚡ Shooting Efficiency Splits</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* P1 TS% */}
                <div className="metric-box" style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}>
                  <div className="metric-label" style={{ color: '#f97316' }}>{p1.full_name}</div>
                  <div className="metric-val">{p1.shooting_splits.ts_pct}%</div>
                  <div className="metric-sub">True Shooting % (TS%)</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    eFG%: <strong style={{ color: '#fff' }}>{p1.shooting_splits.efg_pct}%</strong> | FG%: {p1.shooting_splits.fg_pct}%
                  </div>
                </div>

                {/* P2 TS% */}
                <div className="metric-box" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                  <div className="metric-label" style={{ color: '#06b6d4' }}>{p2.full_name}</div>
                  <div className="metric-val">{p2.shooting_splits.ts_pct}%</div>
                  <div className="metric-sub">True Shooting % (TS%)</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    eFG%: <strong style={{ color: '#fff' }}>{p2.shooting_splits.efg_pct}%</strong> | FG%: {p2.shooting_splits.fg_pct}%
                  </div>
                </div>
              </div>

              {/* Shooting splits table */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shooting Zone</th>
                    <th style={{ color: '#f97316' }}>{p1.full_name}</th>
                    <th style={{ color: '#06b6d4' }}>{p2.full_name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Field Goal % (FG%)</td>
                    <td style={{ fontWeight: 600 }}>{p1.shooting_splits.fg_pct}%</td>
                    <td style={{ fontWeight: 600 }}>{p2.shooting_splits.fg_pct}%</td>
                  </tr>
                  <tr>
                    <td>3-Point % (3P%)</td>
                    <td style={{ fontWeight: 600 }}>{p1.shooting_splits.fg3_pct}%</td>
                    <td style={{ fontWeight: 600 }}>{p2.shooting_splits.fg3_pct}%</td>
                  </tr>
                  <tr>
                    <td>Free Throw % (FT%)</td>
                    <td style={{ fontWeight: 600 }}>{p1.shooting_splits.ft_pct}%</td>
                    <td style={{ fontWeight: 600 }}>{p2.shooting_splits.ft_pct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistical Breakdown Table */}
          <div className="card">
            <div className="card-title">
              <span>📋 Stat Differential Breakdown</span>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stat Metric</th>
                    <th style={{ color: '#f97316' }}>{p1.full_name}</th>
                    <th style={{ color: '#06b6d4' }}>{p2.full_name}</th>
                    <th>Category Edge</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Points Per Game (PPG)', key: 'ppg', v1: p1.averages.ppg, v2: p2.averages.ppg },
                    { label: 'Rebounds Per Game (RPG)', key: 'rpg', v1: p1.averages.rpg, v2: p2.averages.rpg },
                    { label: 'Assists Per Game (APG)', key: 'apg', v1: p1.averages.apg, v2: p2.averages.apg },
                    { label: 'Steals Per Game (SPG)', key: 'spg', v1: p1.averages.spg, v2: p2.averages.spg },
                    { label: 'Blocks Per Game (BPG)', key: 'bpg', v1: p1.averages.bpg, v2: p2.averages.bpg },
                    { label: '3-Pointers Made (3PM)', key: 'fg3m', v1: p1.averages.fg3m, v2: p2.averages.fg3m },
                    { label: 'Turnovers (TOV)', key: 'tov', v1: p1.averages.tov, v2: p2.averages.tov },
                    { label: 'Plus-Minus (+/-)', key: 'plus_minus', v1: p1.averages.plus_minus, v2: p2.averages.plus_minus },
                  ].map(({ label, key, v1, v2 }) => {
                    const lead = leaders[key];
                    const isP1Lead = lead?.leader === p1.full_name;
                    const isP2Lead = lead?.leader === p2.full_name;

                    return (
                      <tr key={key}>
                        <td style={{ fontWeight: 600 }}>{label}</td>
                        <td style={{ color: isP1Lead ? '#f97316' : 'var(--text-main)', fontWeight: isP1Lead ? 700 : 500 }}>
                          {v1}
                        </td>
                        <td style={{ color: isP2Lead ? '#06b6d4' : 'var(--text-main)', fontWeight: isP2Lead ? 700 : 500 }}>
                          {v2}
                        </td>
                        <td>
                          {isP1Lead && (
                            <span className="badge badge-orange">🏆 {p1.full_name} (+{lead.margin})</span>
                          )}
                          {isP2Lead && (
                            <span className="badge badge-cyan">🏆 {p2.full_name} (+{lead.margin})</span>
                          )}
                          {!isP1Lead && !isP2Lead && (
                            <span className="badge" style={{ background: '#334155', color: '#94a3b8' }}>Tie</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

