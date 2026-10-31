from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from db.database import get_db
from ml.props_analyzer import analyze_player_props, get_edge_finder_summary

router = APIRouter()


@router.get("/props/edge-finder")
def get_edge_finder_opportunities(
    market: Optional[str] = Query(None, description="Filter by market: points, rebounds, assists, three_pointers"),
    pick: Optional[str] = Query(None, description="Filter by pick: OVER or UNDER"),
    grade: Optional[str] = Query(None, description="Filter by tier: STRONG_EDGE, MODERATE_EDGE"),
    min_edge: Optional[float] = Query(None, description="Minimum edge percentage, e.g. 5.0"),
    search: Optional[str] = Query(None, description="Filter by player name substring"),
    sort_by: str = Query("edge_pct", description="Sort field: edge_pct, ev_pct, l5_hit_rate, win_probability"),
    db: Session = Depends(get_db)
):
    """
    Returns high-confidence player prop value opportunities calculated
    by comparing machine learning projections vs implied market lines (-110 odds).
    """
    raw_props = analyze_player_props(db)

    filtered = raw_props

    # Market filter
    if market and market.lower() != "all":
        market_clean = market.lower()
        filtered = [p for p in filtered if p["market"] == market_clean]

    # Pick filter (OVER / UNDER)
    if pick and pick.upper() != "ALL":
        pick_clean = pick.upper()
        filtered = [p for p in filtered if p["pick"] == pick_clean]

    # Grade filter
    if grade and grade.upper() != "ALL":
        grade_clean = grade.upper()
        filtered = [p for p in filtered if p["grade"] == grade_clean]

    # Min Edge filter
    if min_edge is not None:
        filtered = [p for p in filtered if p["edge_pct"] >= min_edge]

    # Player search filter
    if search:
        s_clean = search.strip().lower()
        filtered = [p for p in filtered if s_clean in p["player_name"].lower()]

    # Sorting
    reverse = True
    sort_key = sort_by if sort_by in ["edge_pct", "ev_pct", "l5_hit_rate", "win_probability"] else "edge_pct"
    filtered.sort(key=lambda x: x.get(sort_key, 0), reverse=reverse)

    summary = get_edge_finder_summary(filtered)

    return {
        "status": "success",
        "summary": summary,
        "results_count": len(filtered),
        "opportunities": filtered
    }
