from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Player, Team

router = APIRouter()


@router.get("/player/{player_id}")
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = (
        db.query(Player)
        .filter(Player.player_id == player_id)
        .first()
    )

    if not player:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found")

    team = None
    if player.team_id:
        team_obj = db.query(Team).filter(Team.team_id == player.team_id).first()
        if team_obj:
            team = {
                "team_id": team_obj.team_id,
                "name": team_obj.name,
                "abbreviation": team_obj.abbreviation
            }

    return {
        "player_id": player.player_id,
        "full_name": player.full_name,
        "team": team,
        "is_active": player.is_active,
        "headshot_url": f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player.player_id}.png"
    }
