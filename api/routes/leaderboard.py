from fastapi import APIRouter
from sqlalchemy import func

from db.database import SessionLocal
from db.models import Player, PlayerGameStat

router = APIRouter()


@router.get("/leaderboard/top-scorers")
def top_scorers():

    db = SessionLocal()

    results = (
        db.query(
            Player.full_name,
            func.avg(PlayerGameStat.pts).label("ppg")
        )
        .join(
            Player,
            Player.player_id == PlayerGameStat.player_id
        )
        .group_by(Player.full_name)
        .order_by(func.avg(PlayerGameStat.pts).desc())
        .limit(10)
        .all()
    )

    db.close()

    return [
        {
            "player": row.full_name,
            "ppg": round(float(row.ppg), 2)
        }
        for row in results
    ]