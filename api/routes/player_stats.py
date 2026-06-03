from fastapi import APIRouter
from sqlalchemy import func

from db.database import SessionLocal
from db.models import Player, PlayerGameStat

router = APIRouter()


@router.get("/player/{player_id}/stats")
def player_stats(player_id: int):

    db = SessionLocal()

    player = (
        db.query(Player)
        .filter(Player.player_id == player_id)
        .first()
    )

    if not player:
        return {"error": "Player not found"}

    stats = (
        db.query(
            func.avg(PlayerGameStat.pts).label("avg_pts"),
            func.avg(PlayerGameStat.reb).label("avg_reb"),
            func.avg(PlayerGameStat.ast).label("avg_ast"),
            func.count(PlayerGameStat.id).label("games")
        )
        .filter(PlayerGameStat.player_id == player_id)
        .first()
    )

    db.close()

    return {
        "player": player.full_name,
        "games": stats.games,
        "avg_pts": round(float(stats.avg_pts), 2),
        "avg_reb": round(float(stats.avg_reb), 2),
        "avg_ast": round(float(stats.avg_ast), 2)
    }