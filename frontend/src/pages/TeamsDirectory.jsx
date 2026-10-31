import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Users, Search, ArrowRight, X } from 'lucide-react';

export default function TeamsDirectory({ onSelectPlayer }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeRoster, setActiveRoster] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    api.getTeams().then((data) => {
      setTeams(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleOpenRoster = async (team) => {
    setSelectedTeam(team);
    setRosterLoading(true);
    try {
      const roster = await api.getTeamRoster(team.team_id);
      setActiveRoster(roster);
    } catch (err) {
      console.error(err);
      setActiveRoster([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    t.abbreviation.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
            FRANCHISE DIRECTORY
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            All 30 active NBA franchises with complete roster rosters and conference affiliations.
          </p>
        </div>

        {/* Search */}
        <div style={{ width: 280 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Filter franchises (e.g. Lakers, GSW)..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading NBA Franchises...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filteredTeams.map((team) => (
            <div
              key={team.team_id}
              className="card"
              onClick={() => handleOpenRoster(team)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-orange font-mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {team.abbreviation}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    ID: {team.team_id}
                  </span>
                </div>

                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                  {team.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Location: {team.city || 'United States'}
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} /> View Roster
                </span>
                <ArrowRight size={14} color="#64748b" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roster Modal */}
      {selectedTeam && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', border: '1px solid var(--border-active)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-orange" style={{ marginRight: '0.5rem' }}>{selectedTeam.abbreviation}</span>
                <span className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  {selectedTeam.name} Roster
                </span>
              </div>
              <button onClick={() => setSelectedTeam(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {rosterLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading Roster...
                </div>
              ) : activeRoster && activeRoster.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Player Name</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRoster.map((p) => (
                      <tr key={p.player_id}>
                        <td style={{ fontWeight: 600 }}>{p.full_name}</td>
                        <td>
                          <span className={`badge ${p.is_active ? 'badge-green' : 'badge-orange'}`}>
                            {p.is_active ? 'Active' : 'Alumni'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedTeam(null);
                              onSelectPlayer && onSelectPlayer(p.player_id);
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Scout
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No player records linked to this franchise yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

