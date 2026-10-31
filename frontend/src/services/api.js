const API_BASE = 'http://127.0.0.1:8001';

async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    let message = `API Error (${response.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.detail || parsed.error || message;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }
  return response.json();
}

export const api = {
  // System metrics
  getSummary: () => fetch(`${API_BASE}/summary`).then(handleResponse),
  
  // Leaderboards
  getTopScorers: (limit = 10, minGames = 1) =>
    fetch(`${API_BASE}/leaderboard/top-scorers?limit=${limit}&min_games=${minGames}`).then(handleResponse),
  getTopAssists: (limit = 10, minGames = 1) =>
    fetch(`${API_BASE}/leaderboard/top-assists?limit=${limit}&min_games=${minGames}`).then(handleResponse),
  getTopRebounders: (limit = 10, minGames = 1) =>
    fetch(`${API_BASE}/leaderboard/top-rebounders?limit=${limit}&min_games=${minGames}`).then(handleResponse),

  // Player Analytics
  getPlayerStats: (id) => fetch(`${API_BASE}/player/${id}/stats`).then(handleResponse),
  getPlayerDetails: (id) => fetch(`${API_BASE}/player/${id}`).then(handleResponse),
  searchPlayers: (name) => fetch(`${API_BASE}/search/player/${encodeURIComponent(name)}`).then(handleResponse),

  // Teams & Rosters
  getTeams: () => fetch(`${API_BASE}/teams`).then(handleResponse),
  getTeam: (id) => fetch(`${API_BASE}/team/${id}`).then(handleResponse),
  getTeamRoster: (id) => fetch(`${API_BASE}/team/${id}/roster`).then(handleResponse),
  getTeamAnalytics: () => fetch(`${API_BASE}/team-analytics`).then(handleResponse),

  // Machine Learning & Predictions
  getPlayerPropPrediction: (id) => fetch(`${API_BASE}/predict/player/${id}`).then(handleResponse),
  getMatchupPrediction: (homeId, awayId) =>
    fetch(`${API_BASE}/predict/matchup?home_team_id=${homeId}&away_team_id=${awayId}`).then(handleResponse),

  // Head to Head
  comparePlayers: (p1Id, p2Id) =>
    fetch(`${API_BASE}/compare?player1_id=${p1Id}&player2_id=${p2Id}`).then(handleResponse),
};

export const PRESET_PLAYERS = [
  { id: 2544, name: 'LeBron James', team: 'LAL', num: '23' },
  { id: 201939, name: 'Stephen Curry', team: 'GSW', num: '30' },
  { id: 203999, name: 'Nikola Jokić', team: 'DEN', num: '15' },
  { id: 203507, name: 'Giannis Antetokounmpo', team: 'MIL', num: '34' },
  { id: 1628369, name: 'Jayson Tatum', team: 'BOS', num: '0' },
  { id: 1629029, name: 'Luka Dončić', team: 'DAL', num: '77' },
  { id: 201142, name: 'Kevin Durant', team: 'PHX', num: '35' },
  { id: 1628983, name: 'Shai Gilgeous-Alexander', team: 'OKC', num: '2' },
  { id: 203954, name: 'Joel Embiid', team: 'PHI', num: '21' },
  { id: 202331, name: 'Paul George', team: 'PHI', num: '8' },
];
