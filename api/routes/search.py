from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Player

router = APIRouter()


@router.get("/search/player/{name}")
def search_player(
    name: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query_str = name.strip()
    if not query_str:
        return []

    players = (
        db.query(Player)
        .filter(Player.full_name.ilike(f"%{query_str}%"))
        .limit(limit)
        .all()
    )

    return [
        {
            "player_id": player.player_id,
            "name": player.full_name,
            "team_id": player.team_id,
            "is_active": player.is_active
        }
        for player in players
    ]
