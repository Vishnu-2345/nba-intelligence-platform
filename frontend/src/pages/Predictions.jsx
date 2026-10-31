import React, { useState, useEffect } from 'react';
import { api, PRESET_PLAYERS } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Sparkles, Swords, Target, TrendingUp, Info } from 'lucide-react';

export default function Predictions() {
  const [activeTab, setActiveTab] = useState('player-props');

  // Player Prop state
  const [selectedPlayerId, setSelectedPlayerId] = useState(PRESET_PLAYERS[0].id);
  const [playerPropData, setPlayerPropData] = useState(null);
  const [loadingProp, setLoadingProp] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('pts');

  // Matchup Simulator state
  const [teams, setTeams] = useState([]);
  const [homeTeamId, setHomeTeamId] = useState(1610612747); // LAL
  const [awayTeamId, setAwayTeamId] = useState(1610612744); // GSW
  const [matchupResult, setMatchupResult] = useState(null);
  const [loadingMatchup, setLoadingMatchup] = useState(false);

  useEffect(() => {
    // Load initial prop prediction
    fetchPlayerProp(selectedPlayerId);

    // Load teams for matchup simulator
    api.getTeams().then((data) => {
      setTeams(data);
      if (data.length >= 2) {
        setHomeTeamId(data[0].team_id);
        setAwayTeamId(data[1].team_id);
      }
    }).catch(console.error);
  }, []);

  const fetchPlayerProp = async (id) => {
    setLoadingProp(true);
    try {
      const data = await api.getPlayerPropPrediction(id);
      setPlayerPropData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProp(false);
    }
  };

  const handleSimulateMatchup = async () => {
    if (homeTeamId === awayTeamId) return;
    setLoadingMatchup(true);
    try {
      const result = await api.getMatchupPrediction(homeTeamId, awayTeamId);
      setMatchupResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatchup(false);
    }
  };

  // Transform historical trend for charting
  const chartData = playerPropData?.history?.dates?.map((date, idx) => ({
    game: date,
    pts: playerPropData.history.pts[idx],
    reb: playerPropData.history.reb[idx],
    ast: playerPropData.history.ast[idx],
  })) || [];

  const currentProp = playerPropData?.projections ? (
    selectedMetric === 'pts' ? playerPropData.projections.points :
    selectedMetric === 'reb' ? playerPropData.projections.rebounds :
    playerPropData.projections.assists
  ) : null;

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
          MACHINE LEARNING INTELLIGENCE
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Predict next-game individual player props and simulate franchise head-to-head outcomes using time-series momentum models.
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          onClick={() => setActiveTab('player-props')}
          className={`tab-btn ${activeTab === 'player-props' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Target size={16} /> Player Prop Forecaster
          </span>
        </button>
        <button
          onClick={() => setActiveTab('matchup-sim')}
          className={`tab-btn ${activeTab === 'matchup-sim' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Swords size={16} /> Game Matchup Simulator
          </span>
        </button>
      </div>

      {/* Tab 1: Player Prop Forecaster */}
      {activeTab === 'player-props' && (
        <div>
          {/* Player Selector Bar */}
          <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Target Player:</span>
              <select
                className="select-field"
                value={selectedPlayerId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedPlayerId(id);
                  fetchPlayerProp(id);
                }}
              >
                {PRESET_PLAYERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.team})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge badge-cyan">Exponential Moving Average (EMA)</span>
              <span className="badge badge-orange">80% Confidence Interval</span>
            </div>
          </div>

          {loadingProp ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Generating ML Projections...
            </div>
          ) : playerPropData?.has_data ? (
            <div>
              {/* 4 Prop Cards */}
              <div className="grid-cols-4">
                {[
                  { key: 'points', label: 'Points (PTS)', data: playerPropData.projections.points, color: '#f97316' },
                  { key: 'rebounds', label: 'Rebounds (REB)', data: playerPropData.projections.rebounds, color: '#06b6d4' },
                  { key: 'assists', label: 'Assists (AST)', data: playerPropData.projections.assists, color: '#a855f7' },
                  { key: 'three_pointers', label: '3-Pointers Made', data: playerPropData.projections.three_pointers, color: '#10b981' },
                ].map(({ key, label, data, color }) => (
                  <div key={key} className="metric-box">
                    <div className="metric-label">{label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span className="metric-val" style={{ color }}>{data.predicted_value}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>PROJ</span>
                    </div>

                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Vegas O/U Line:</span>
                        <span style={{ fontWeight: 700, color: '#fff' }}>{data.over_under_line}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Over Likelihood:</span>
                        <span style={{ fontWeight: 700, color: data.over_probability >= 0.5 ? '#10b981' : '#f43f5e' }}>
                          {Math.round(data.over_probability * 100)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>80% CI Range:</span>
                        <span className="font-mono" style={{ color: 'var(--text-dim)' }}>
                          [{data.confidence_interval[0]} - {data.confidence_interval[1]}]
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart: Trajectory vs AI Projected Line */}
              <div className="card">
                <div className="card-title">
                  <span>📈 Historical Game Trajectory vs. AI Projected Line</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['pts', 'reb', 'ast'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMetric(m)}
                        className={`tab-btn ${selectedMetric === m ? 'active' : ''}`}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                      <XAxis dataKey="game" stroke="#64748b" fontSize={11} interval={Math.floor(chartData.length / 8)} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#121826', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#06b6d4' }}
                        activeDot={{ r: 6 }}
                        name={`Actual ${selectedMetric.toUpperCase()}`}
                      />
                      {currentProp && (
                        <ReferenceLine
                          y={currentProp.over_under_line}
                          stroke="#f97316"
                          strokeDasharray="4 4"
                          label={{
                            value: `AI O/U: ${currentProp.over_under_line}`,
                            fill: '#f97316',
                            position: 'insideTopLeft',
                            fontSize: 12
                          }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No historical games indexed for this player yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Matchup Simulator */}
      {activeTab === 'matchup-sim' && (
        <div>
          {/* Matchup Controls */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  🏠 HOME FRANCHISE
                </label>
                <select
                  className="select-field"
                  style={{ width: '100%' }}
                  value={homeTeamId}
                  onChange={(e) => setHomeTeamId(Number(e.target.value))}
                >
                  {teams.map((t) => (
                    <option key={t.team_id} value={t.team_id}>
                      {t.name} ({t.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontWeight: 700, fontSize: '1.2rem', paddingTop: '1.2rem' }}>
                VS
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  ✈️ AWAY FRANCHISE
                </label>
                <select
                  className="select-field"
                  style={{ width: '100%' }}
                  value={awayTeamId}
                  onChange={(e) => setAwayTeamId(Number(e.target.value))}
                >
                  {teams.map((t) => (
                    <option key={t.team_id} value={t.team_id}>
                      {t.name} ({t.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ paddingTop: '1.2rem' }}>
                <button
                  onClick={handleSimulateMatchup}
                  className="btn-primary"
                  disabled={loadingMatchup || homeTeamId === awayTeamId}
                >
                  <Sparkles size={16} /> {loadingMatchup ? 'Simulating...' : 'Simulate Game'}
                </button>
              </div>
            </div>
          </div>

          {/* Matchup Outcome Display */}
          {matchupResult && (
            <div>
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
                  {/* Home Team */}
                  <div>
                    <div className="badge badge-orange" style={{ marginBottom: '0.5rem' }}>HOME</div>
                    <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                      {matchupResult.home_team.name}
                    </h2>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f97316', fontFamily: 'Chakra Petch' }}>
                      {matchupResult.home_team.projected_score}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Win Prob: <strong style={{ color: '#fff' }}>{matchupResult.home_team.win_probability}%</strong>
                    </div>
                  </div>

                  {/* Vegas Lines Box */}
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                      VEGAS PROJECTION
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#06b6d4', marginBottom: '0.25rem' }}>
                      {matchupResult.odds_and_lines.projected_spread}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Total O/U: <strong style={{ color: '#fff' }}>{matchupResult.odds_and_lines.total_over_under} PTS</strong>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div>
                    <div className="badge badge-cyan" style={{ marginBottom: '0.5rem' }}>AWAY</div>
                    <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                      {matchupResult.away_team.name}
                    </h2>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#06b6d4', fontFamily: 'Chakra Petch' }}>
                      {matchupResult.away_team.projected_score}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Win Prob: <strong style={{ color: '#fff' }}>{matchupResult.away_team.win_probability}%</strong>
                    </div>
                  </div>
                </div>

                {/* Win Probability Bar */}
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    <span style={{ color: '#f97316' }}>{matchupResult.home_team.abbreviation} ({matchupResult.home_team.win_probability}%)</span>
                    <span style={{ color: '#06b6d4' }}>{matchupResult.away_team.abbreviation} ({matchupResult.away_team.win_probability}%)</span>
                  </div>
                  <div style={{ height: '10px', width: '100%', background: '#06b6d4', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${matchupResult.home_team.win_probability}%`,
                        background: '#f97316',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Matchup Factors */}
              <div className="card">
                <div className="card-title">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={16} color="#06b6d4" /> Model Insights & Analytical Edge
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {matchupResult.key_factors?.map((factor, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: '#f97316' }}>•</span> {factor}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
