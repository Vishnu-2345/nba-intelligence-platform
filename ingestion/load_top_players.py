import time
from datetime import datetime
from nba_api.stats.endpoints import playergamelog

from db.database import SessionLocal
from db.models import PlayerGameStat

TOP_PLAYERS = [
    2544,      # LeBron James
    201939,    # Stephen Curry
    203999,    # Nikola Jokic
    203507,    # Giannis Antetokounmpo
    1628369,   # Jayson Tatum
    1629029,   # Luka Doncic
    201142,    # Kevin Durant
    203954,    # Joel Embiid
    1628983,   # Shai Gilgeous-Alexander
    202331     # Paul George
]


def load_top_players_gamelogs(season="2024-25"):
    db = SessionLocal()

    for player_id in TOP_PLAYERS:
        print(f"Fetching logs for player_id: {player_id} (Season: {season})...")

        try:
            logs = playergamelog.PlayerGameLog(
                player_id=player_id,
                season=season,
                timeout=30
            )

            df = logs.get_data_frames()[0]
            print(f"  -> Found {len(df)} games for player {player_id}")

            for _, row in df.iterrows():
                game_id = str(row.get("Game_ID", ""))
                existing = (
                    db.query(PlayerGameStat)
                    .filter(
                        PlayerGameStat.player_id == player_id,
                        PlayerGameStat.game_id == game_id
                    )
                    .first()
                )

                # Parse date if available
                date_val = None
                raw_date = row.get("GAME_DATE")
                if raw_date:
                    try:
                        date_val = datetime.strptime(raw_date, "%b %d, %Y").date()
                    except Exception:
                        date_val = None

                if not existing:
                    stat = PlayerGameStat(
                        player_id=player_id,
                        game_id=game_id,
                        game_date=date_val,
                        pts=int(row.get("PTS", 0)),
                        reb=int(row.get("REB", 0)),
                        ast=int(row.get("AST", 0)),
                        stl=int(row.get("STL", 0)),
                        blk=int(row.get("BLK", 0)),
                        tov=int(row.get("TOV", 0)),
                        fgm=int(row.get("FGM", 0)),
                        fga=int(row.get("FGA", 0)),
                        fg_pct=float(row.get("FG_PCT", 0.0) or 0.0),
                        fg3m=int(row.get("FG3M", 0)),
                        fg3a=int(row.get("FG3A", 0)),
                        fg3_pct=float(row.get("FG3_PCT", 0.0) or 0.0),
                        ftm=int(row.get("FTM", 0)),
                        fta=int(row.get("FTA", 0)),
                        ft_pct=float(row.get("FT_PCT", 0.0) or 0.0),
                        plus_minus=int(row.get("PLUS_MINUS", 0) or 0),
                        minutes=str(row.get("MIN", ""))
                    )
                    db.add(stat)

            db.commit()

        except Exception as e:
            print(f"  [ERROR] Failed to fetch data for player {player_id}: {e}")
            db.rollback()

        # Respect NBA API rate limits with polite delay
        time.sleep(0.6)

    print("Finished loading top player game logs!")
    db.close()


if __name__ == "__main__":
    load_top_players_gamelogs()
