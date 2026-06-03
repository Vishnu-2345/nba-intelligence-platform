from fastapi import APIRouter
from db.database import SessionLocal
from db.models import Player

router = APIRouter()

@router.get("/players")
def get_players():

    db = SessionLocal()

    players = db.query(Player).limit(20).all()

    result = []

    for player in players:
        result.append(
            {
                "player_id": player.player_id,
                "full_name": player.full_name
            }
        )

    db.close()

    return result