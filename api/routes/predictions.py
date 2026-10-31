from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from ml.player_predictor import build_player_prop_prediction
from ml.game_predictor import predict_game_matchup

router = APIRouter()


@router.get("/predict/player/{player_id}")
def predict_player(player_id: int, db: Session = Depends(get_db)):
    """
    Predict next-game performance lines (PTS, REB, AST, 3PM)
    with Over/Under probability and 80% confidence interval.
    """
    result = build_player_prop_prediction(player_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/predict/matchup")
def predict_matchup(
    home_team_id: int = Query(..., description="NBA Team ID for home franchise"),
    away_team_id: int = Query(..., description="NBA Team ID for away franchise"),
    db: Session = Depends(get_db)
):
    """
    Predict game winner, win probability, projected score,
    point spread, and total over/under line for a team matchup.
    """
    if home_team_id == away_team_id:
        raise HTTPException(status_code=400, detail="Home and away teams must be different.")

    result = predict_game_matchup(home_team_id, away_team_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
