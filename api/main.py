from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.players import router as player_router
from api.routes.player_details import router as player_detail_router
from api.routes.leaderboard import router as leaderboard_router
from api.routes.player_stats import router as player_stats_router
from api.routes.summary import router as summary_router
from api.routes.teams import router as teams_router
from api.routes.team_analytics import router as team_analytics_router
from api.routes.search import router as search_router
from api.routes.predictions import router as predictions_router

app = FastAPI(
    title="NBA Intelligence Platform",
    description="Production-grade API for NBA stats, predictive analytics, and machine learning intelligence",
    version="1.0.0"
)

# Enable CORS for local dashboards and external frontend apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(player_router, tags=["Players"])
app.include_router(player_detail_router, tags=["Players"])
app.include_router(leaderboard_router, tags=["Leaderboards"])
app.include_router(player_stats_router, tags=["Player Stats"])
app.include_router(summary_router, tags=["System Summary"])
app.include_router(teams_router, tags=["Teams"])
app.include_router(team_analytics_router, tags=["Team Analytics"])
app.include_router(search_router, tags=["Search"])
app.include_router(predictions_router, tags=["Machine Learning & Predictions"])


@app.get("/", tags=["General"])
def home():
    return {
        "status": "online",
        "service": "NBA Intelligence Platform API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/health", tags=["General"])
def health_check():
    return {"status": "healthy"}
