from fastapi import FastAPI

from api.routes.players import router as player_router

from api.routes.player_details import router as player_detail_router

from api.routes.leaderboard import router as leaderboard_router

from api.routes.player_stats import router as player_stats_router


app = FastAPI(
    title="NBA Intelligence Platform"
)

app.include_router(player_router)
app.include_router(player_detail_router)
app.include_router(leaderboard_router)
app.include_router(player_stats_router)

@app.get("/")
def home():
    return {"message": "NBA Intelligence Platform API"}

