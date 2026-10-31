from nba_api.stats.static import teams, players
from nba_api.stats.endpoints import commonallplayers

from db.database import SessionLocal
from db.models import Team, Player


def ingest_static_data():
    db = SessionLocal()

    # =====================
    # Teams
    # =====================
    nba_teams = teams.get_teams()
    print(f"Found {len(nba_teams)} NBA teams in static dataset.")

    existing_team_ids = {t[0] for t in db.query(Team.team_id).all()}

    new_teams = []
    for team in nba_teams:
        if team["id"] not in existing_team_ids:
            new_teams.append(
                Team(
                    team_id=team["id"],
                    name=team["full_name"],
                    abbreviation=team["abbreviation"],
                    city=team.get("city"),
                    conference=team.get("state")  # state / location info
                )
            )

    if new_teams:
        db.add_all(new_teams)
        db.commit()
        print(f"Inserted {len(new_teams)} new teams successfully!")
    else:
        print("All teams already exist in the database.")

    # =====================
    # Players
    # =====================
    nba_players = players.get_players()
    print(f"Found {len(nba_players)} players in static dataset.")

    existing_player_ids = {p[0] for p in db.query(Player.player_id).all()}

    new_players = []
    for p in nba_players:
        if p["id"] not in existing_player_ids:
            new_players.append(
                Player(
                    player_id=p["id"],
                    full_name=p["full_name"],
                    is_active=bool(p.get("is_active", True))
                )
            )

    if new_players:
        # Bulk insert in batches of 500 for maximum performance
        batch_size = 500
        for i in range(0, len(new_players), batch_size):
            db.bulk_save_objects(new_players[i:i + batch_size])
            db.commit()
        print(f"Inserted {len(new_players)} new players successfully!")
    else:
        print("All players already exist in the database.")

    # =====================
    # Link Active Rosters to Franchises
    # =====================
    print("Fetching active season rosters via CommonAllPlayers...")
    try:
        cap = commonallplayers.CommonAllPlayers(is_only_current_season=1, league_id="00")
        df = cap.get_data_frames()[0]
        team_id_set = {t[0] for t in db.query(Team.team_id).all()}
        updated = 0

        for _, row in df.iterrows():
            pid = int(row["PERSON_ID"])
            raw_tid = row.get("TEAM_ID")
            tid = int(raw_tid) if raw_tid and int(raw_tid) in team_id_set else None
            
            p = db.query(Player).filter(Player.player_id == pid).first()
            if p:
                p.team_id = tid
                p.is_active = True
                updated += 1
            elif tid:
                db.add(Player(player_id=pid, full_name=row["DISPLAY_FIRST_LAST"], team_id=tid, is_active=True))
                updated += 1

        db.commit()
        print(f"Successfully linked {updated} active players to their NBA franchise rosters.")
    except Exception as e:
        print(f"Warning: Could not link active rosters: {e}")

    db.close()


if __name__ == "__main__":
    ingest_static_data()
