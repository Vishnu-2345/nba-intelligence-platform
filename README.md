# 🏀 NBA Intelligence Platform

An end-to-end analytics, machine learning, and sports intelligence platform delivering automated data ingestion, relational box-score modeling, predictive ML modeling (player props & game outcomes), high-throughput REST APIs, and an interactive data visualization dashboard.

---

## 🏗️ Architecture

```text
[ NBA Official Stats API (nba_api) ]
                 ↓
  [ Ingestion Engine / Pipeline ]
                 ↓
   [ PostgreSQL Analytics Store ]
                 ↓
[ Machine Learning Engine (ml/) ] ←→ [ FastAPI Backend (:8000) ]
                                              ↓
                        [ Streamlit Intelligence Dashboard (:8501) ]
```

---

## ⚡ Key Features

- **Machine Learning & Predictive Analytics (`ml/`)**:
  - **Player Prop Forecaster**: Ensembles Exponential Moving Averages (EMA), season momentum, and regression models to project next-game Points, Rebounds, Assists, and 3-Pointers Made with 80% confidence intervals and Vegas Over/Under lines.
  - **Game Matchup Simulator**: Predicts win probabilities, projected scores, point spreads, and total over/under lines using offensive ratings, defensive efficiencies, and home-court advantage.
- **Automated Data Ingestion**:
  - Bulk ingestion of all 30 NBA franchises and 5,100+ active/historical players.
  - Multi-stat box score ingestion (PTS, REB, AST, STL, BLK, TOV, shooting percentages, and +/-).
- **Relational PostgreSQL Data Layer**:
  - Indexed schemas in SQLAlchemy with connection pooling and pre-ping safety.
  - Supports player profiles, box-score aggregations, and team rosters.
- **Production-Grade FastAPI REST API**:
  - Dependency-injected database sessions (`get_db`) to prevent connection leaks.
  - CORS-enabled for cross-origin dashboards and mobile clients.
  - Comprehensive statistical leaderboards with configurable minimum game qualifiers.
  - Instant substring search across 5,000+ players.
- **Interactive Streamlit Dashboard**:
  - **AI Predictions & Props Tab**: Player prop lines, over/under gauges, and historical trajectory vs. projected line charts.
  - **Matchup Simulator Tab**: Dynamic win probability split bars and Vegas lines.
  - **Stat Leaderboards**: Multi-category leaderboards (Scoring, Playmaking, Rebounding) with Plotly charts.
  - **Player Analytics**: Radar profile charts, official NBA headshots, and stat breakdowns.
  - **Team Directory & Analytics**: Franchise rosters and player distributions.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- PostgreSQL (or Docker Desktop)

### 2. Environment Setup
Clone the repository and copy the example environment configuration:
```bash
cp .env.example .env
```
Ensure your PostgreSQL database `nba` is created and matching credentials in `.env`:
```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nba
```

### 3. Install Dependencies
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Initialize Database Tables
```bash
python create_tables.py
```

### 5. Ingest NBA Data
```bash
# Ingest static teams and players (run once)
python ingestion/ingest.py

# Ingest recent game logs for top stars
python ingestion/load_top_players.py
```

### 6. Run the FastAPI Backend
```bash
uvicorn api.main:app --reload --port 8000
```
API Documentation will be accessible at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 7. Launch the Streamlit Intelligence Dashboard
```bash
streamlit run dashboard/app.py
```
Open [http://localhost:8501](http://localhost:8501) in your browser.

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status and root metadata |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/predict/player/{player_id}` | **ML**: Next-game player prop forecasts (PTS, REB, AST, 3PM, O/U) |
| `GET` | `/predict/matchup` | **ML**: Game matchup simulator (win prob, spread, projected score) |
| `GET` | `/summary` | System statistics (teams, players, game logs) |
| `GET` | `/players` | Paginated player listing (`skip`, `limit`, `is_active`) |
| `GET` | `/player/{player_id}` | Player details, team affiliation, and headshot URL |
| `GET` | `/player/{player_id}/stats` | Averaged box-score stats (PPG, RPG, APG, SPG, BPG) |
| `GET` | `/leaderboard/top-scorers` | Top scorers by PPG (`limit`, `min_games`) |
| `GET` | `/leaderboard/top-assists` | Top playmakers by APG (`limit`, `min_games`) |
| `GET` | `/leaderboard/top-rebounders` | Top rebounders by RPG (`limit`, `min_games`) |
| `GET` | `/teams` | All NBA franchises |
| `GET` | `/team/{team_id}` | Franchise information and total players |
| `GET` | `/team/{team_id}/roster` | Full player roster for a franchise |
| `GET` | `/team-analytics` | Franchise offensive output and player distributions |
| `GET` | `/search/player/{name}` | Substring player search (`limit`) |

---

## 🔮 Roadmap

- [x] **Machine Learning Engine (`ml/`)**: Player prop forecasting and game matchup simulation.
- [ ] **Nightly Automated Ingestion**: APScheduler background daemon for daily box-score updates.
- [ ] **Docker Orchestration**: Complete `docker-compose` bundle running PostgreSQL, Redis, FastAPI, and Streamlit.
