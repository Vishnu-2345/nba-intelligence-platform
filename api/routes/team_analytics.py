from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from db.models import Team, Player, PlayerGameStat

router = APIRouter()


@router.get("/team-analytics")
def team_analytics(db: Session = Depends(get_db)):
    teams = db.query(Team).all()

    team_data = []
    for team in teams:
        # Calculate roster size
        roster_count = db.query(Player).filter(Player.team_id == team.team_id).count()

        # Calculate team offensive output from logged player stats
        stats_query = (
            db.query(
                func.count(PlayerGameStat.id).label("logged_performances"),
                func.sum(PlayerGameStat.pts).label("total_pts"),
                func.avg(PlayerGameStat.pts).label("avg_pts_per_entry")
            )
            .join(Player, Player.player_id == PlayerGameStat.player_id)
            .filter(Player.team_id == team.team_id)
            .first()
        )

        team_data.append({
            "team_id": team.team_id,
            "name": team.name,
            "abbreviation": team.abbreviation,
            "roster_size": roster_count,
            "logged_performances": stats_query.logged_performances if stats_query and stats_query.logged_performances else 0,
            "total_pts": int(stats_query.total_pts) if (stats_query and stats_query.total_pts) else 0,
            "avg_pts": round(float(stats_query.avg_pts_per_entry), 2) if (stats_query and stats_query.avg_pts_per_entry) else 0.0
        })

    return {
        "total_teams": len(teams),
        "teams": team_data
    }
