from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from db.models import Player, PlayerGameStat

router = APIRouter()


@router.get("/player/{player_id}/stats")
def player_stats(player_id: int, db: Session = Depends(get_db)):
    player = (
        db.query(Player)
        .filter(Player.player_id == player_id)
        .first()
    )

    if not player:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found")

    stats = (
        db.query(
            func.count(PlayerGameStat.id).label("games"),
            func.avg(PlayerGameStat.pts).label("avg_pts"),
            func.avg(PlayerGameStat.reb).label("avg_reb"),
            func.avg(PlayerGameStat.ast).label("avg_ast"),
            func.avg(PlayerGameStat.stl).label("avg_stl"),
            func.avg(PlayerGameStat.blk).label("avg_blk"),
            func.avg(PlayerGameStat.tov).label("avg_tov"),
            func.avg(PlayerGameStat.fg3m).label("avg_fg3m")
        )
        .filter(PlayerGameStat.player_id == player_id)
        .first()
    )

    total_games = stats.games if stats and stats.games else 0

    return {
        "player_id": player.player_id,
        "player": player.full_name,
        "games": total_games,
        "avg_pts": round(float(stats.avg_pts), 2) if (stats and stats.avg_pts is not None) else 0.0,
        "avg_reb": round(float(stats.avg_reb), 2) if (stats and stats.avg_reb is not None) else 0.0,
        "avg_ast": round(float(stats.avg_ast), 2) if (stats and stats.avg_ast is not None) else 0.0,
        "avg_stl": round(float(stats.avg_stl), 2) if (stats and stats.avg_stl is not None) else 0.0,
        "avg_blk": round(float(stats.avg_blk), 2) if (stats and stats.avg_blk is not None) else 0.0,
        "avg_tov": round(float(stats.avg_tov), 2) if (stats and stats.avg_tov is not None) else 0.0,
        "avg_fg3m": round(float(stats.avg_fg3m), 2) if (stats and stats.avg_fg3m is not None) else 0.0,
    }
