from nba_api.stats.static import teams, players

from db.database import SessionLocal
from db.models import Team, Player

db = SessionLocal()

# =====================
# Teams
# =====================

nba_teams = teams.get_teams()

print(f"Found {len(nba_teams)} teams")

for team in nba_teams:

    existing = (
        db.query(Team)
        .filter(Team.team_id == team["id"])
        .first()
    )

    if not existing:

        db_team = Team(
            team_id=team["id"],
            name=team["full_name"],
            abbreviation=team["abbreviation"]
        )

        db.add(db_team)

db.commit()

print("Teams inserted successfully!")

# =====================
# Players
# =====================

nba_players = players.get_players()

print(f"Found {len(nba_players)} players")

for player in nba_players:

    existing = (
        db.query(Player)
        .filter(Player.player_id == player["id"])
        .first()
    )

    if not existing:

        db_player = Player(
            player_id=player["id"],
            full_name=player["full_name"]
        )

        db.add(db_player)

db.commit()

print("Players inserted successfully!")

db.close()