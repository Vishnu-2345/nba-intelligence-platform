# 🏀 CourtIQ - NBA Intelligence Platform

An elite, full-stack analytics, machine learning, and sports intelligence platform delivering automated data ingestion, relational box-score modeling, predictive ML modeling (player props & game outcomes), dual-player head-to-head comparisons, high-throughput REST APIs, and a modern **React + Vite** intelligence dashboard.

---

## 🏗️ Architecture

```text
[ NBA Official Stats API (nba_api) ]
                 ↓
  [ Ingestion Engine / Pipeline ]
                 ↓
   [ PostgreSQL / SQLite Store ]
                 ↓
[ Machine Learning Engine (ml/) ] ←→ [ FastAPI Backend (:8001) ]
                                              ↓
                     [ Modern React Intelligence UI (:5173) ]
```

---

## ⚡ Key Features

- **Pro-Level React Analytics Dashboard (`frontend/`)**:
  - **No AI-Slop UI**: Clean midnight palette (`#07090e`), crisp typography, basketball orange/cyan accents, and responsive layout.
  - **Interactive Visualizations with Recharts**:
    - **Dual-Layer Skill Radars**: Overlapping polygons comparing two NBA stars across 5 key skill dimensions.
    - **Historical Trajectory Line Charts**: Past performance vs. AI Vegas Over/Under threshold lines.
    - **Vertical & Horizontal Stat Bars**: League leaders and win probability split meters.
  - **Machine Learning & Props Studio**:
    - **Next-Game Player Prop Forecaster**: Ensembles Exponential Moving Averages (EMA), season momentum, and regression models to project next-game Points, Rebounds, Assists, and 3-Pointers Made with 80% confidence intervals and Vegas Over/Under lines.
    - **Game Matchup Simulator**: Simulates franchise pace, offensive efficiencies, and home-court advantage ($+3.2$ pts) to generate win probabilities, projected scores, and spreads.
  - **Head-to-Head Star Comparison**:
    - Side-by-side profile cards with official NBA headshots.
    - True Shooting Percentage ($TS\%$) and Effective Field Goal Percentage ($eFG\%$) breakdowns.
    - Automatic category winner detection with differential margin badges (`+3.4 PPG`, `+1.8 RPG`).
  - **Franchise Directory & Roster Modals**:
    - All 30 NBA teams with click-to-view active player rosters.
  - **Statistical Leaderboards**:
    - Filterable by PPG, APG, and RPG with customizable minimum-games qualification sliders.
- **FastAPI REST API Engine (`api/`)**:
  - Dependency-injected database sessions (`get_db`) to prevent connection leaks.
  - CORS-enabled for seamless frontend communication.
  - Sub-second endpoint responses with pre-ping connection pool safety.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 2. Environment Setup
```bash
cp .env.example .env
```
Default configuration connects to SQLite (`sqlite:///./nba.db`) or PostgreSQL (`postgresql://postgres:postgres@127.0.0.1:5435/nba`).

### 3. Initialize Database & Ingest NBA Data
```bash
python create_tables.py
python -m ingestion.ingest
python -m ingestion.load_top_players
```

### 4. Start the FastAPI Backend
```bash
python -m uvicorn api.main:app --host 127.0.0.1 --port 8001
```
- API Docs: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

### 5. Launch the React Intelligence Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/summary` | System statistics (teams, players, active players, game logs) |
| `GET` | `/predict/player/{player_id}` | **ML**: Next-game player prop forecasts (PTS, REB, AST, 3PM, O/U, 80% CI) |
| `GET` | `/predict/matchup` | **ML**: Game matchup simulator (win prob, spread, projected score) |
| `GET` | `/compare` | Head-to-head comparison between two players with TS% & eFG% |
| `GET` | `/players` | Paginated player listing (`skip`, `limit`, `is_active`) |
| `GET` | `/player/{player_id}` | Player details, team affiliation, and headshot URL |
| `GET` | `/player/{player_id}/stats` | Averaged box-score stats (PPG, RPG, APG, SPG, BPG, FG3M) |
| `GET` | `/leaderboard/top-scorers` | Top scorers by PPG (`limit`, `min_games`) |
| `GET` | `/leaderboard/top-assists` | Top playmakers by APG (`limit`, `min_games`) |
| `GET` | `/leaderboard/top-rebounders` | Top rebounders by RPG (`limit`, `min_games`) |
| `GET` | `/teams` | All 30 NBA franchises |
| `GET` | `/team/{team_id}/roster` | Full franchise player roster |
| `GET` | `/search/player/{name}` | Substring player search |
