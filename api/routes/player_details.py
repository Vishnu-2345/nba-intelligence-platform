from fastapi import APIRouter
from db.database import SessionLocal
from db.models import Player

router = APIRouter()

@router.get("/player/{player_id}")
def get_player(player_id: int):

    db = SessionLocal()

    player = (
        db.query(Player)
        .filter(Player.player_id == player_id)
        .first()
    )

    db.close()

    if not player:
        return {"error": "Player not found"}

    return {
        "player_id": player.player_id,
        "full_name": player.full_name
    }