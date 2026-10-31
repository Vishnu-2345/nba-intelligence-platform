import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from db.models import Player, PlayerGameStat
from ml.player_predictor import build_player_prop_prediction


# Implied win probability for standard -110 juice (110 / 210 = 52.38%)
BREAK_EVEN_PROB = 0.5238
PROFIT_MULTIPLIER = 0.90909  # Win $90.91 on a $100 bet at -110


def analyze_player_props(db: Session, min_games: int = 5) -> List[Dict[str, Any]]:
    """
    Scans all players with logged games, runs ML prop projections across PTS, REB, AST, 3PM,
    and computes statistical edge, EV, confidence intervals, and L5/L10 hit rates.
    """
    # 1. Find players with sufficient game logs
    qualified_players = (
        db.query(Player.player_id, Player.full_name)
        .join(PlayerGameStat, Player.player_id == PlayerGameStat.player_id)
        .group_by(Player.player_id)
        .having(db.query(PlayerGameStat.id).filter(PlayerGameStat.player_id == Player.player_id).count() >= min_games)
        .all()
    )

    all_opportunities = []

    market_labels = {
        "points": {"name": "Points", "stat_key": "pts", "abbr": "PTS"},
        "rebounds": {"name": "Rebounds", "stat_key": "reb", "abbr": "REB"},
        "assists": {"name": "Assists", "stat_key": "ast", "abbr": "AST"},
        "three_pointers": {"name": "3-Pointers Made", "stat_key": "fg3m", "abbr": "3PM"},
    }

    for pid, player_name in qualified_players:
        # Fetch game logs ordered chronologically
        stats = (
            db.query(PlayerGameStat)
            .filter(PlayerGameStat.player_id == pid)
            .order_by(PlayerGameStat.game_date.asc(), PlayerGameStat.id.asc())
            .all()
        )
        if len(stats) < min_games:
            continue

        # Generate ML projections
        pred_data = build_player_prop_prediction(pid, db)
        if not pred_data.get("has_data"):
            continue

        projections = pred_data.get("projections", {})

        for m_key, m_info in market_labels.items():
            proj = projections.get(m_key)
            if not proj:
                continue

            stat_attr = m_info["stat_key"]
            line = proj["over_under_line"]
            predicted_val = proj["predicted_value"]
            over_prob = proj["over_probability"]
            under_prob = round(1.0 - over_prob, 3)

            # Determine best lean (OVER or UNDER)
            if over_prob >= 0.50:
                pick = "OVER"
                win_prob = over_prob
                raw_edge = (win_prob - BREAK_EVEN_PROB) * 100
            else:
                pick = "UNDER"
                win_prob = under_prob
                raw_edge = (win_prob - BREAK_EVEN_PROB) * 100

            edge = round(raw_edge, 1)

            # Calculate Expected Value %
            ev = round((win_prob * PROFIT_MULTIPLIER - (1.0 - win_prob) * 1.0) * 100, 1)

            # Calculate Empirical Hit Rates (Last 5 & Last 10 games)
            actual_values = [getattr(s, stat_attr, 0) or 0 for s in stats]
            
            l5_values = actual_values[-5:] if len(actual_values) >= 5 else actual_values
            l10_values = actual_values[-10:] if len(actual_values) >= 10 else actual_values

            if pick == "OVER":
                l5_hits = sum(1 for v in l5_values if v > line)
                l10_hits = sum(1 for v in l10_values if v > line)
            else:
                l5_hits = sum(1 for v in l5_values if v < line)
                l10_hits = sum(1 for v in l10_values if v < line)

            l5_rate = round((l5_hits / len(l5_values)) * 100, 1) if l5_values else 0.0
            l10_rate = round((l10_hits / len(l10_values)) * 100, 1) if l10_values else 0.0

            # Grade & Tier
            if edge >= 8.0 and ev >= 12.0:
                grade = "STRONG_EDGE"
                badge_text = "HIGH VALUE"
                badge_color = "#10b981"  # Emerald green
            elif edge >= 4.0 and ev >= 5.0:
                grade = "MODERATE_EDGE"
                badge_text = "SOLID LEAN"
                badge_color = "#06b6d4"  # Cyan
            elif edge >= 1.0:
                grade = "SLIGHT_LEAN"
                badge_text = "VALUE LEAN"
                badge_color = "#f59e0b"  # Amber
            else:
                grade = "FAIR_MARKET"
                badge_text = "NEUTRAL"
                badge_color = "#64748b"  # Slate

            # Volatility rating
            std_dev = np.std(l10_values) if len(l10_values) > 1 else 1.0
            volatility = "LOW" if std_dev < (line * 0.20) else ("HIGH" if std_dev > (line * 0.40) else "MEDIUM")

            # Analytical rationale
            diff = round(predicted_val - line, 1)
            sign = "+" if diff > 0 else ""
            rationale = (
                f"Model projects {predicted_val} {m_info['abbr']} ({sign}{diff} vs {line} line). "
                f"Hit in {l5_hits}/{len(l5_values)} L5 games ({l5_rate}%). L10 strike rate: {l10_rate}%."
            )

            all_opportunities.append({
                "id": f"{pid}_{m_key}",
                "player_id": pid,
                "player_name": player_name,
                "market": m_key,
                "market_name": m_info["name"],
                "stat_abbr": m_info["abbr"],
                "market_line": line,
                "predicted_value": predicted_val,
                "season_avg": proj["season_avg"],
                "recent_3_avg": proj["recent_3_avg"],
                "confidence_interval": proj["confidence_interval"],
                "pick": pick,
                "win_probability": round(win_prob * 100, 1),
                "edge_pct": edge,
                "ev_pct": ev,
                "l5_hits": l5_hits,
                "l5_total": len(l5_values),
                "l5_hit_rate": l5_rate,
                "l10_hits": l10_hits,
                "l10_total": len(l10_values),
                "l10_hit_rate": l10_rate,
                "recent_trend": l5_values,
                "grade": grade,
                "badge_text": badge_text,
                "badge_color": badge_color,
                "volatility": volatility,
                "rationale": rationale
            })

    # Sort opportunities descending by edge percentage
    all_opportunities.sort(key=lambda x: x["edge_pct"], reverse=True)

    return all_opportunities


def get_edge_finder_summary(opportunities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Computes high-level slate KPIs for the dashboard"""
    if not opportunities:
        return {
            "total_props": 0,
            "strong_value_count": 0,
            "avg_edge": 0.0,
            "avg_ev": 0.0,
            "top_pick": None
        }

    strong_count = sum(1 for o in opportunities if o["grade"] == "STRONG_EDGE")
    avg_edge = round(float(np.mean([o["edge_pct"] for o in opportunities])), 1)
    avg_ev = round(float(np.mean([o["ev_pct"] for o in opportunities])), 1)

    top_pick = opportunities[0] if opportunities else None

    return {
        "total_props": len(opportunities),
        "strong_value_count": strong_count,
        "avg_edge": avg_edge,
        "avg_ev": avg_ev,
        "top_pick": top_pick
    }
