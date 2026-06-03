from sqlalchemy import Column, Integer, String, Float, Date
from db.database import Base
from sqlalchemy import Column, Integer, String, Float, Date


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, unique=True, nullable=False)
    name = Column(String, nullable=False)
    abbreviation = Column(String, nullable=False)


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    team_id = Column(Integer)


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True)
    game_id = Column(String, unique=True)
    game_date = Column(Date)

    home_team_id = Column(Integer)
    away_team_id = Column(Integer)

    home_score = Column(Integer)
    away_score = Column(Integer)

class PlayerGameStat(Base):
    __tablename__ = "player_game_stats"

    id = Column(Integer, primary_key=True)

    player_id = Column(Integer)
    game_id = Column(String)

    game_date = Column(Date)

    pts = Column(Integer)
    reb = Column(Integer)
    ast = Column(Integer)

    minutes = Column(String)