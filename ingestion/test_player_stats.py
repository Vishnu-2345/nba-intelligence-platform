from nba_api.stats.endpoints import playergamelog

from db.database import SessionLocal
from db.models import PlayerGameStat

db = SessionLocal()

logs = playergamelog.PlayerGameLog(
    player_id="2544",
    season="2024-25"
)

df = logs.get_data_frames()[0]

print(f"Found {len(df)} games")

for _, row in df.iterrows():

    existing = (
        db.query(PlayerGameStat)
        .filter(PlayerGameStat.game_id == row["Game_ID"])
        .first()
    )

    if not existing:

        stat = PlayerGameStat(
            player_id=row["Player_ID"],
            game_id=row["Game_ID"],
            pts=row["PTS"],
            reb=row["REB"],
            ast=row["AST"],
            minutes=row["MIN"]
        )

        db.add(stat)

db.commit()

print("Game stats inserted successfully!")

db.close()