import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from db.models import Player, PlayerGameStat


def build_player_prop_prediction(player_id: int, db: Session) -> Dict[str, Any]:
    """
    Predicts next-game player performance (Points, Rebounds, Assists, 3PM)
    using rolling features, exponential moving average (EMA) momentum,
    and confidence intervals.
    """
    player = db.query(Player).filter(Player.player_id == player_id).first()
    if not player:
        return {"error": f"Player ID {player_id} not found."}

    # Query chronological game logs
    stats = (
        db.query(PlayerGameStat)
        .filter(PlayerGameStat.player_id == player_id)
        .order_by(PlayerGameStat.game_date.asc(), PlayerGameStat.id.asc())
        .all()
    )

    if not stats:
        return {
            "player_id": player_id,
            "player": player.full_name,
            "has_data": False,
            "message": "No historical game logs found in database. Ingest game logs first."
        }

    # Convert to pandas DataFrame
    data: List[Dict[str, Any]] = []
    for s in stats:
        data.append({
            "game_id": s.game_id,
            "game_date": str(s.game_date) if s.game_date else f"Game #{len(data)+1}",
            "pts": float(s.pts or 0),
            "reb": float(s.reb or 0),
            "ast": float(s.ast or 0),
            "stl": float(s.stl or 0),
            "blk": float(s.blk or 0),
            "fg3m": float(s.fg3m or 0),
            "plus_minus": float(s.plus_minus or 0)
        })

    df = pd.DataFrame(data)
    n_games = len(df)

    targets = ["pts", "reb", "ast", "fg3m"]
    predictions = {}
    chart_series = {
        "dates": df["game_date"].tolist(),
        "pts": df["pts"].tolist(),
        "reb": df["reb"].tolist(),
        "ast": df["ast"].tolist()
    }

    # Lazy-load scikit-learn only when running inference to keep startup instantaneous
    Ridge = None
    if n_games >= 5:
        try:
            from sklearn.linear_model import Ridge as SkRidge
            Ridge = SkRidge
        except Exception:
            Ridge = None

    for target in targets:
        series = df[target].values

        if n_games == 1:
            pred = float(series[0])
            std = max(float(series[0] * 0.25), 1.0)
        elif n_games < 4:
            weights = np.linspace(0.8, 1.2, n_games)
            pred = float(np.average(series, weights=weights))
            std = float(np.std(series, ddof=1)) if np.std(series) > 0 else max(pred * 0.2, 1.0)
        else:
            ema_series = pd.Series(series).ewm(span=3, adjust=False).mean().values
            season_mean = float(np.mean(series))
            recent_ema = float(ema_series[-1])

            if Ridge is not None and n_games >= 5:
                X = []
                y = []
                for i in range(2, n_games):
                    feat = [
                        series[i - 1],
                        series[i - 2],
                        float(np.mean(series[:i])),
                        float(ema_series[i - 1])
                    ]
                    X.append(feat)
                    y.append(series[i])

                if len(X) >= 3:
                    model = Ridge(alpha=1.0)
                    model.fit(X, y)
                    next_feat = [[series[-1], series[-2], season_mean, recent_ema]]
                    ml_pred = float(model.predict(next_feat)[0])
                    pred = float(0.50 * ml_pred + 0.35 * recent_ema + 0.15 * season_mean)
                else:
                    pred = float(0.70 * recent_ema + 0.30 * season_mean)
            else:
                pred = float(0.70 * recent_ema + 0.30 * season_mean)

            pred = max(0.0, pred)
            std = float(np.std(series[-5:], ddof=1)) if len(series) >= 5 else float(np.std(series))
            std = max(std, 1.2)

        ou_line = round(pred) - 0.5 if pred < round(pred) else round(pred) + 0.5
        confidence_low = max(0.0, round(pred - 1.28 * std, 1))
        confidence_high = round(pred + 1.28 * std, 1)

        z_score = (ou_line - pred) / (std + 1e-6)
        over_prob = round(float(1.0 / (1.0 + np.exp(-1.6 * (-z_score)))), 3)

        predictions[target] = {
            "predicted_value": round(pred, 1),
            "season_avg": round(float(np.mean(series)), 1),
            "recent_3_avg": round(float(np.mean(series[-3:])), 1),
            "over_under_line": ou_line,
            "over_probability": over_prob,
            "confidence_interval": [confidence_low, confidence_high]
        }

    return {
        "player_id": player_id,
        "player": player.full_name,
        "games_analyzed": n_games,
        "has_data": True,
        "projections": {
            "points": predictions["pts"],
            "rebounds": predictions["reb"],
            "assists": predictions["ast"],
            "three_pointers": predictions["fg3m"]
        },
        "history": chart_series
    }
