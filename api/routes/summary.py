from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Team, Player, PlayerGameStat

router = APIRouter()


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    teams = db.query(Team).count()
    players = db.query(Player).count()
    active_players = db.query(Player).filter(Player.is_active == True).count()
    game_logs = db.query(PlayerGameStat).count()

    return {
        "teams": teams,
        "players": players,
        "active_players": active_players,
        "game_logs": game_logs
    }
