from nba_api.stats.static import teams, players

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

    db.close()


if __name__ == "__main__":
    ingest_static_data()
