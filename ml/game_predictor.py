import numpy as np
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.models import Team, Player, PlayerGameStat


def predict_game_matchup(home_team_id: int, away_team_id: int, db: Session) -> Dict[str, Any]:
    """
    Simulates and predicts the outcome of an NBA matchup between
    a Home Team and an Away Team using offensive efficiencies,
    scoring averages, and home-court advantage.
    """
    home_team = db.query(Team).filter(Team.team_id == home_team_id).first()
    away_team = db.query(Team).filter(Team.team_id == away_team_id).first()

    if not home_team or not away_team:
        return {
            "error": "One or both teams not found in database."
        }

    # Fetch aggregate player points for Home Team
    home_stats = (
        db.query(
            func.count(PlayerGameStat.id).label("logged_games"),
            func.avg(PlayerGameStat.pts).label("avg_pts"),
            func.avg(PlayerGameStat.reb).label("avg_reb"),
            func.avg(PlayerGameStat.ast).label("avg_ast")
        )
        .join(Player, Player.player_id == PlayerGameStat.player_id)
        .filter(Player.team_id == home_team_id)
        .first()
    )

    # Fetch aggregate player points for Away Team
    away_stats = (
        db.query(
            func.count(PlayerGameStat.id).label("logged_games"),
            func.avg(PlayerGameStat.pts).label("avg_pts"),
            func.avg(PlayerGameStat.reb).label("avg_reb"),
            func.avg(PlayerGameStat.ast).label("avg_ast")
        )
        .join(Player, Player.player_id == PlayerGameStat.player_id)
        .filter(Player.team_id == away_team_id)
        .first()
    )

    # NBA League Baseline averages (2024-2025 season: ~114.2 PPG)
    LEAGUE_BASELINE_PPG = 114.2
    HOME_COURT_ADVANTAGE = 3.2

    # Estimate team offensive power based on logged star performers or default to baseline
    home_ppg = (
        float(home_stats.avg_pts * 4.8)
        if (home_stats and home_stats.logged_games and home_stats.avg_pts)
        else (LEAGUE_BASELINE_PPG + np.random.uniform(-2.5, 2.5))
    )
    away_ppg = (
        float(away_stats.avg_pts * 4.8)
        if (away_stats and away_stats.logged_games and away_stats.avg_pts)
        else (LEAGUE_BASELINE_PPG + np.random.uniform(-2.5, 2.5))
    )

    # Clamp realistic team scores between 98 and 130
    home_ppg = min(max(home_ppg, 98.0), 130.0)
    away_ppg = min(max(away_ppg, 98.0), 130.0)

    # Point differential including Home Court Advantage
    raw_diff = (home_ppg - away_ppg) + HOME_COURT_ADVANTAGE

    # Logistic Win Probability: P = 1 / (1 + exp(-diff / scale))
    scale = 7.5
    home_win_prob = round(float(1.0 / (1.0 + np.exp(-raw_diff / scale))), 3)
    away_win_prob = round(1.0 - home_win_prob, 3)

    # Projected final scores
    proj_home_score = round(home_ppg + (HOME_COURT_ADVANTAGE / 2), 1)
    proj_away_score = round(away_ppg - (HOME_COURT_ADVANTAGE / 2), 1)

    # Spread (Vegas format: e.g. -4.5 for favored home team)
    spread = round(proj_away_score - proj_home_score * 2) / 2
    spread_text = f"{home_team.abbreviation} -{abs(round(proj_home_score - proj_away_score, 1))}" if proj_home_score >= proj_away_score else f"{away_team.abbreviation} -{abs(round(proj_away_score - proj_home_score, 1))}"
    total_ou = round(proj_home_score + proj_away_score, 1)

    return {
        "home_team": {
            "team_id": home_team.team_id,
            "name": home_team.name,
            "abbreviation": home_team.abbreviation,
            "win_probability": round(home_win_prob * 100, 1),
            "projected_score": proj_home_score
        },
        "away_team": {
            "team_id": away_team.team_id,
            "name": away_team.name,
            "abbreviation": away_team.abbreviation,
            "win_probability": round(away_win_prob * 100, 1),
            "projected_score": proj_away_score
        },
        "odds_and_lines": {
            "favored_team": home_team.name if home_win_prob >= 0.50 else away_team.name,
            "projected_spread": spread_text,
            "total_over_under": total_ou
        },
        "key_factors": [
            f"Home Court Advantage (+{HOME_COURT_ADVANTAGE} pts) favors {home_team.name}",
            f"{'Home' if proj_home_score >= proj_away_score else 'Away'} offense has higher projected offensive efficiency",
            f"Expected game pace points total: {total_ou} PTS"
        ]
    }

