from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from db.models import Player, PlayerGameStat, Team

router = APIRouter()


def compute_player_averages(player_id: int, db: Session) -> Dict[str, Any]:
    player = db.query(Player).filter(Player.player_id == player_id).first()
    if not player:
        return None

    team_name = None
    if player.team_id:
        team_obj = db.query(Team).filter(Team.team_id == player.team_id).first()
        if team_obj:
            team_name = team_obj.name

    stats = (
        db.query(
            func.count(PlayerGameStat.id).label("games"),
            func.avg(PlayerGameStat.pts).label("avg_pts"),
            func.avg(PlayerGameStat.reb).label("avg_reb"),
            func.avg(PlayerGameStat.ast).label("avg_ast"),
            func.avg(PlayerGameStat.stl).label("avg_stl"),
            func.avg(PlayerGameStat.blk).label("avg_blk"),
            func.avg(PlayerGameStat.tov).label("avg_tov"),
            func.avg(PlayerGameStat.fg3m).label("avg_fg3m"),
            func.sum(PlayerGameStat.pts).label("total_pts"),
            func.sum(PlayerGameStat.fga).label("total_fga"),
            func.sum(PlayerGameStat.fgm).label("total_fgm"),
            func.sum(PlayerGameStat.fta).label("total_fta"),
            func.sum(PlayerGameStat.ftm).label("total_ftm"),
            func.sum(PlayerGameStat.fg3a).label("total_fg3a"),
            func.avg(PlayerGameStat.plus_minus).label("avg_plus_minus")
        )
        .filter(PlayerGameStat.player_id == player_id)
        .first()
    )

    total_games = stats.games if stats and stats.games else 0
    total_pts = float(stats.total_pts or 0)
    total_fga = float(stats.total_fga or 0)
    total_fgm = float(stats.total_fgm or 0)
    total_fta = float(stats.total_fta or 0)
    total_ftm = float(stats.total_ftm or 0)
    total_fg3a = float(stats.total_fg3a or 0)
    total_fg3m = float((stats.avg_fg3m or 0) * total_games)

    # Advanced shooting efficiency metrics:
    # True Shooting % = PTS / (2 * (FGA + 0.44 * FTA))
    ts_denominator = 2 * (total_fga + 0.44 * total_fta)
    ts_pct = round((total_pts / ts_denominator) * 100, 1) if ts_denominator > 0 else 0.0

    # Effective FG% = (FGM + 0.5 * FG3M) / FGA
    efg_pct = round(((total_fgm + 0.5 * total_fg3m) / total_fga) * 100, 1) if total_fga > 0 else 0.0

    # Standard Shooting %
    fg_pct = round((total_fgm / total_fga) * 100, 1) if total_fga > 0 else 0.0
    fg3_pct = round((total_fg3m / total_fg3a) * 100, 1) if total_fg3a > 0 else 0.0
    ft_pct = round((total_ftm / total_fta) * 100, 1) if total_fta > 0 else 0.0

    return {
        "player_id": player.player_id,
        "full_name": player.full_name,
        "team": team_name,
        "headshot_url": f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player.player_id}.png",
        "games_played": total_games,
        "averages": {
            "ppg": round(float(stats.avg_pts or 0.0), 1),
            "rpg": round(float(stats.avg_reb or 0.0), 1),
            "apg": round(float(stats.avg_ast or 0.0), 1),
            "spg": round(float(stats.avg_stl or 0.0), 1),
            "bpg": round(float(stats.avg_blk or 0.0), 1),
            "tov": round(float(stats.avg_tov or 0.0), 1),
            "fg3m": round(float(stats.avg_fg3m or 0.0), 1),
            "plus_minus": round(float(stats.avg_plus_minus or 0.0), 1)
        },
        "shooting_splits": {
            "fg_pct": fg_pct,
            "fg3_pct": fg3_pct,
            "ft_pct": ft_pct,
            "ts_pct": ts_pct,
            "efg_pct": efg_pct
        }
    }


@router.get("/compare")
def compare_players(
    player1_id: int = Query(..., description="NBA Player ID for first player"),
    player2_id: int = Query(..., description="NBA Player ID for second player"),
    db: Session = Depends(get_db)
):
    """
    Compare two NBA players side-by-side with counting averages,
    advanced shooting metrics (TS%, eFG%), and category winners.
    """
    if player1_id == player2_id:
        raise HTTPException(status_code=400, detail="Cannot compare a player to themselves. Provide two different IDs.")

    p1 = compute_player_averages(player1_id, db)
    p2 = compute_player_averages(player2_id, db)

    if not p1:
        raise HTTPException(status_code=404, detail=f"Player with ID {player1_id} not found.")
    if not p2:
        raise HTTPException(status_code=404, detail=f"Player with ID {player2_id} not found.")

    # Determine category leaders
    categories = ["ppg", "rpg", "apg", "spg", "bpg", "fg3m"]
    leaders = {}
    for cat in categories:
        v1 = p1["averages"][cat]
        v2 = p2["averages"][cat]
        if v1 > v2:
            leaders[cat] = {"leader": p1["full_name"], "margin": round(v1 - v2, 1)}
        elif v2 > v1:
            leaders[cat] = {"leader": p2["full_name"], "margin": round(v2 - v1, 1)}
        else:
            leaders[cat] = {"leader": "Tie", "margin": 0.0}

    # Advanced efficiency leader
    ts1 = p1["shooting_splits"]["ts_pct"]
    ts2 = p2["shooting_splits"]["ts_pct"]
    leaders["ts_pct"] = {
        "leader": p1["full_name"] if ts1 > ts2 else (p2["full_name"] if ts2 > ts1 else "Tie"),
        "margin": round(abs(ts1 - ts2), 1)
    }

    return {
        "player1": p1,
        "player2": p2,
        "category_leaders": leaders
    }

