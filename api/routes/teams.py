from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Team, Player

router = APIRouter()


@router.get("/teams")
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).order_by(Team.name.asc()).all()

    return [
        {
            "team_id": team.team_id,
            "name": team.name,
            "abbreviation": team.abbreviation,
            "city": team.city,
            "conference": team.conference
        }
        for team in teams
    ]


@router.get("/team/{team_id}")
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found")

    players_count = db.query(Player).filter(Player.team_id == team_id).count()

    return {
        "team_id": team.team_id,
        "name": team.name,
        "abbreviation": team.abbreviation,
        "city": team.city,
        "conference": team.conference,
        "total_players": players_count
    }


@router.get("/team/{team_id}/roster")
def get_team_roster(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found")

    roster = (
        db.query(Player)
        .filter(Player.team_id == team_id)
        .order_by(Player.full_name.asc())
        .all()
    )

    return [
        {
            "player_id": p.player_id,
            "full_name": p.full_name,
            "is_active": p.is_active
        }
        for p in roster
    ]
