import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  SlidersHorizontal,
  Search,
  ExternalLink,
  DollarSign,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function PropEdgeFinder({ onSelectPlayer }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [marketFilter, setMarketFilter] = useState('all');
  const [pickFilter, setPickFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('edge_pct');
  const [searchQuery, setSearchQuery] = useState('');

  // Bet calculator state
  const [wagerAmount, setWagerAmount] = useState(100);
  const [selectedPropForCalc, setSelectedPropForCalc] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    api.getEdgeFinderProps({
      market: marketFilter !== 'all' ? marketFilter : undefined,
      pick: pickFilter !== 'ALL' ? pickFilter : undefined,
      grade: gradeFilter !== 'ALL' ? gradeFilter : undefined,
      sort_by: sortBy,
      search: searchQuery.trim() || undefined
    })
      .then((res) => {
        setData(res);
        setLoading(false);
        if (res.opportunities && res.opportunities.length > 0 && !selectedPropForCalc) {
          setSelectedPropForCalc(res.opportunities[0]);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load prop edge opportunities');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [marketFilter, pickFilter, gradeFilter, sortBy]);

  // Debounced or direct search trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const opportunities = data?.opportunities || [];
  const summary = data?.summary || {};
  const topPick = summary?.top_pick;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-orange font-mono">+EV EDGE DETECTOR</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Standard -110 Implied Probability vs Ridge/EMA ML</span>
          </div>
          <h1 className="font-display" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            AI Prop Value & Edge Finder
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '700px', marginTop: '0.25rem' }}>
            Identifies mispriced player props across PTS, REB, AST, and 3PM by comparing machine learning projections against Vegas market lines.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh Slate
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="card stat-card">
          <div className="stat-label">
            <Target size={14} color="#f97316" /> Slate Opportunities
          </div>
          <div className="stat-val font-mono">
            {summary.total_props || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Scanned active star prop lines
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">
            <Flame size={14} color="#10b981" /> High Value Picks
          </div>
          <div className="stat-val font-mono" style={{ color: '#10b981' }}>
            {summary.strong_value_count || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            &ge; +8.0% Edge & &ge; +12% EV
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">
            <Percent size={14} color="#06b6d4" /> Average Slate EV
          </div>
          <div className="stat-val font-mono" style={{ color: (summary.avg_ev || 0) >= 0 ? '#06b6d4' : '#ef4444' }}>
            {summary.avg_ev > 0 ? `+${summary.avg_ev}%` : `${summary.avg_ev || 0}%`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Expected return per wager unit
          </div>
        </div>

        {topPick && (
          <div
            className="card stat-card"
            style={{
              borderColor: 'rgba(249, 115, 22, 0.4)',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(15, 23, 42, 0.8))',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedPropForCalc(topPick)}
          >
            <div className="stat-label" style={{ color: '#f97316', fontWeight: 600 }}>
              ★ Slate Top Pick
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.35rem' }}>
              {topPick.player_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span className={`badge ${topPick.pick === 'OVER' ? 'badge-green' : 'badge-orange'}`} style={{ fontWeight: 800 }}>
                {topPick.pick} {topPick.market_line} {topPick.stat_abbr}
              </span>
              <span className="font-mono" style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                +{topPick.edge_pct}% Edge
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Layout: Filters & Prop Cards + Sidebar Calculator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Filter Bar & Opportunities */}
        <div>
          {/* Controls Bar */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Market Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'all', label: 'All Props' },
                  { id: 'points', label: 'Points (PTS)' },
                  { id: 'rebounds', label: 'Rebounds (REB)' },
                  { id: 'assists', label: 'Assists (AST)' },
                  { id: 'three_pointers', label: '3-Pointers (3PM)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMarketFilter(m.id)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: marketFilter === m.id ? 'var(--accent-orange)' : 'rgba(255,255,255,0.05)',
                      color: marketFilter === m.id ? '#fff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 200px', maxWidth: '280px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search star (e.g. Curry, Jokic)..."
                    className="input-field"
                    style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.82rem' }}
                  />
                  <Search size={14} color="#64748b" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </form>
            </div>

            {/* Sub-Filters Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', alignItems: 'center', fontSize: '0.82rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Pick:</span>
                {['ALL', 'OVER', 'UNDER'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPickFilter(p)}
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: pickFilter === p ? 'var(--accent-orange)' : 'var(--border-subtle)',
                      background: pickFilter === p ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                      color: pickFilter === p ? '#f97316' : 'var(--text-muted)'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Tier:</span>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.78rem'
                  }}
                >
                  <option value="ALL">All Tiers</option>
                  <option value="STRONG_EDGE">High Value Only (+8% Edge)</option>
                  <option value="MODERATE_EDGE">Solid Leans (+4% Edge)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                <span style={{ color: 'var(--text-dim)' }}>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.78rem'
                  }}
                >
                  <option value="edge_pct">Highest Edge %</option>
                  <option value="ev_pct">Highest Expected Value (EV)</option>
                  <option value="l5_hit_rate">Best L5 Hit Rate</option>
                  <option value="win_probability">Model Win Probability</option>
                </select>
              </div>

            </div>
          </div>

          {/* Opportunities List */}
          {loading ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#f97316' }} />
              <div>Running Ridge regression & calculating market implied lines...</div>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
              <AlertTriangle size={24} style={{ margin: '0 auto 0.5rem' }} />
              <div>{error}</div>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No prop lines matched the current filter criteria. Try selecting "All Props" or reset filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {opportunities.map((prop) => {
                const isSelected = selectedPropForCalc?.id === prop.id;
                const isOver = prop.pick === 'OVER';
                const isStrong = prop.grade === 'STRONG_EDGE';

                return (
                  <div
                    key={prop.id}
                    onClick={() => setSelectedPropForCalc(prop)}
                    className="card"
                    style={{
                      padding: '1.15rem',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--accent-orange)' : (isStrong ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)'),
                      background: isSelected ? 'rgba(249, 115, 22, 0.05)' : (isStrong ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.04), transparent)' : 'var(--bg-secondary)'),
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      
                      {/* Player & Stat Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
                              {prop.player_name}
                            </span>
                            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                              {prop.stat_abbr}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                            Season Avg: <strong style={{ color: 'var(--text-main)' }}>{prop.season_avg}</strong> | L3 Momentum: <strong style={{ color: 'var(--text-main)' }}>{prop.recent_3_avg}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Pick & Edge Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: isOver ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                          border: `1px solid ${isOver ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 115, 22, 0.4)'}`,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px'
                        }}>
                          {isOver ? <ArrowUpRight size={16} color="#10b981" /> : <ArrowDownRight size={16} color="#f97316" />}
                          <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: isOver ? '#10b981' : '#f97316' }}>
                            {prop.pick} {prop.market_line}
                          </span>
                        </div>

                        <div style={{
                          background: prop.badge_color ? `${prop.badge_color}20` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${prop.badge_color || '#64748b'}`,
                          color: prop.badge_color || '#fff',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textAlign: 'center'
                        }}>
                          {prop.badge_text} (+{prop.edge_pct}%)
                        </div>
                      </div>

                    </div>

                    {/* Metric Breakdown Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', padding: '0.65rem', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                      
                      <div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Model Projection</div>
                        <div className="font-mono" style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                          {prop.predicted_value} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>({prop.stat_abbr})</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Win Probability</div>
                        <div className="font-mono" style={{ fontWeight: 700, color: prop.win_probability >= 58 ? '#10b981' : '#06b6d4', fontSize: '0.95rem' }}>
                          {prop.win_probability}%
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Expected Value (EV)</div>
                        <div className="font-mono" style={{ fontWeight: 700, color: prop.ev_pct > 10 ? '#10b981' : '#f59e0b', fontSize: '0.95rem' }}>
                          +{prop.ev_pct}%
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>L5 Strike Rate</div>
                        <div className="font-mono" style={{ fontWeight: 700, color: prop.l5_hit_rate >= 60 ? '#10b981' : 'var(--text-main)', fontSize: '0.95rem' }}>
                          {prop.l5_hits}/{prop.l5_total} ({prop.l5_hit_rate}%)
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>L10 Strike Rate</div>
                        <div className="font-mono" style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                          {prop.l10_hits}/{prop.l10_total} ({prop.l10_hit_rate}%)
                        </div>
                      </div>

                    </div>

                    {/* Rationale & Action Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <div style={{ color: 'var(--text-muted)', flex: 1, minWidth: '240px' }}>
                        {prop.rationale}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPlayer) onSelectPlayer(prop.player_id);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        Scout Logs <ExternalLink size={12} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: EV Bet Sizing & Simulation Calculator */}
        <div style={{ position: 'sticky', top: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-active)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <Calculator size={18} color="#f97316" />
              <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                EV Profit Simulator
              </h3>
            </div>

            {selectedPropForCalc ? (
              <div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Selected Prop</div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                    {selectedPropForCalc.player_name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#f97316', fontWeight: 600, marginTop: '0.2rem' }}>
                    {selectedPropForCalc.pick} {selectedPropForCalc.market_line} {selectedPropForCalc.stat_abbr}
                  </div>
                </div>

                {/* Wager Input */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                    Simulated Wager ($)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>$</span>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={wagerAmount}
                        onChange={(e) => setWagerAmount(Math.max(1, Number(e.target.value)))}
                        className="input-field"
                        style={{ paddingLeft: '1.6rem', height: '36px', fontSize: '0.9rem', fontWeight: 700 }}
                      />
                    </div>
                    {[25, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setWagerAmount(amt)}
                        style={{
                          padding: '0 0.5rem',
                          background: wagerAmount === amt ? 'var(--accent-orange)' : 'rgba(255,255,255,0.05)',
                          color: wagerAmount === amt ? '#fff' : 'var(--text-muted)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Returns Calculation */}
                {(() => {
                  const winProb = selectedPropForCalc.win_probability / 100.0;
                  const winPayout = wagerAmount * 0.90909; // -110 odds
                  const expectedProfit = (winProb * winPayout) - ((1.0 - winProb) * wagerAmount);
                  const kellyCriterion = Math.max(0, ((winProb * 1.90909 - 1) / 0.90909) * 100);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Standard Odds</span>
                        <span className="font-mono" style={{ color: '#fff', fontWeight: 600 }}>-110 (1.91x)</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Net Payout on Win</span>
                        <span className="font-mono" style={{ color: '#10b981', fontWeight: 700 }}>+${winPayout.toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Expected Value (ROI)</span>
                        <span className="font-mono" style={{ color: expectedProfit >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                          {expectedProfit >= 0 ? `+$${expectedProfit.toFixed(2)}` : `-$${Math.abs(expectedProfit).toFixed(2)}`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Model Edge</span>
                        <span className="font-mono" style={{ color: '#06b6d4', fontWeight: 700 }}>+{selectedPropForCalc.edge_pct}%</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Kelly Bankroll %</span>
                        <span className="font-mono" style={{ color: '#f59e0b', fontWeight: 700 }}>{kellyCriterion.toFixed(1)}% size</span>
                      </div>

                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.65rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)'
                      }}>
                        💡 <strong>Kelly Criterion:</strong> Optimal bankroll allocation based on model edge and $-110$ variance.
                      </div>
                    </div>
                  );
                })()}

              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
                Select any prop opportunity to view payout and expected value breakdown.
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
