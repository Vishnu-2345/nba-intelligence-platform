from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Player

router = APIRouter()


@router.get("/players")
def get_players(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Player)

    if is_active is not None:
        query = query.filter(Player.is_active == is_active)

    players = query.offset(skip).limit(limit).all()

    return [
        {
            "player_id": p.player_id,
            "full_name": p.full_name,
            "team_id": p.team_id,
            "is_active": p.is_active
        }
        for p in players
    ]
