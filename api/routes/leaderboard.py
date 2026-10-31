from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from db.models import Player, PlayerGameStat

router = APIRouter()


@router.get("/leaderboard/top-scorers")
def top_scorers(
    limit: int = Query(10, ge=1, le=50),
    min_games: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Player.player_id,
            Player.full_name,
            func.avg(PlayerGameStat.pts).label("ppg"),
            func.count(PlayerGameStat.id).label("games")
        )
        .join(
            Player,
            Player.player_id == PlayerGameStat.player_id
        )
        .group_by(Player.player_id, Player.full_name)
        .having(func.count(PlayerGameStat.id) >= min_games)
        .order_by(func.avg(PlayerGameStat.pts).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "player_id": row.player_id,
            "player": row.full_name,
            "ppg": round(float(row.ppg), 2) if row.ppg is not None else 0.0,
            "games": row.games
        }
        for row in results
    ]


@router.get("/leaderboard/top-assists")
def top_assists(
    limit: int = Query(10, ge=1, le=50),
    min_games: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Player.player_id,
            Player.full_name,
            func.avg(PlayerGameStat.ast).label("apg"),
            func.count(PlayerGameStat.id).label("games")
        )
        .join(
            Player,
            Player.player_id == PlayerGameStat.player_id
        )
        .group_by(Player.player_id, Player.full_name)
        .having(func.count(PlayerGameStat.id) >= min_games)
        .order_by(func.avg(PlayerGameStat.ast).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "player_id": row.player_id,
            "player": row.full_name,
            "apg": round(float(row.apg), 2) if row.apg is not None else 0.0,
            "games": row.games
        }
        for row in results
    ]


@router.get("/leaderboard/top-rebounders")
def top_rebounders(
    limit: int = Query(10, ge=1, le=50),
    min_games: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Player.player_id,
            Player.full_name,
            func.avg(PlayerGameStat.reb).label("rpg"),
            func.count(PlayerGameStat.id).label("games")
        )
        .join(
            Player,
            Player.player_id == PlayerGameStat.player_id
        )
        .group_by(Player.player_id, Player.full_name)
        .having(func.count(PlayerGameStat.id) >= min_games)
        .order_by(func.avg(PlayerGameStat.reb).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "player_id": row.player_id,
            "player": row.full_name,
            "rpg": round(float(row.rpg), 2) if row.rpg is not None else 0.0,
            "games": row.games
        }
        for row in results
    ]
