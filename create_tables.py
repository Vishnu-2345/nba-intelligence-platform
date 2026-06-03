from db.database import engine, Base

# Import models so SQLAlchemy registers them
from db.models import Team, Player, Game, PlayerGameStat

print("Creating tables...")

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")