from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    abbreviation = Column(String, nullable=False)
    city = Column(String, nullable=True)
    conference = Column(String, nullable=True)


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False, index=True)
    team_id = Column(Integer, nullable=True, index=True)
    is_active = Column(Boolean, default=True)


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, unique=True, index=True)
    game_date = Column(Date, nullable=True, index=True)

    home_team_id = Column(Integer, nullable=True)
    away_team_id = Column(Integer, nullable=True)

    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)


class PlayerGameStat(Base):
    __tablename__ = "player_game_stats"

    id = Column(Integer, primary_key=True, index=True)

    player_id = Column(Integer, nullable=False, index=True)
    game_id = Column(String, nullable=True, index=True)
    game_date = Column(Date, nullable=True, index=True)

    # Core counting stats
    pts = Column(Integer, default=0)
    reb = Column(Integer, default=0)
    ast = Column(Integer, default=0)
    stl = Column(Integer, default=0)
    blk = Column(Integer, default=0)
    tov = Column(Integer, default=0)

    # Shooting splits
    fgm = Column(Integer, default=0)
    fga = Column(Integer, default=0)
    fg_pct = Column(Float, default=0.0)
    fg3m = Column(Integer, default=0)
    fg3a = Column(Integer, default=0)
    fg3_pct = Column(Float, default=0.0)
    ftm = Column(Integer, default=0)
    fta = Column(Integer, default=0)
    ft_pct = Column(Float, default=0.0)

    # Advanced & impact
    plus_minus = Column(Integer, default=0)
    minutes = Column(String, nullable=True)
