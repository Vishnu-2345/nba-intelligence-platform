import os
import streamlit as st
import requests
import pandas as pd
import plotly.express as px

# ==================================
# Page Configuration & Styling
# ==================================

st.set_page_config(
    page_title="NBA Intelligence Platform",
    page_icon="🏀",
    layout="wide",
    initial_sidebar_state="expanded"
)

API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")

# ==================================
# Sidebar Navigation
# ==================================

st.sidebar.title("🏀 NBA Intelligence")
page = st.sidebar.radio(
    "Navigation",
    [
        "Dashboard",
        "Leaderboards",
        "Player Stats & Analytics",
        "Player Search",
        "Teams",
        "Team Analytics"
    ]
)

# ==================================
# View 1: Overview Dashboard
# ==================================

if page == "Dashboard":
    st.title("🏀 NBA Intelligence Platform")
    st.markdown("Real-time data ingestion, box-score analytics, and intelligence platform.")

    try:
        response = requests.get(f"{API_URL}/summary", timeout=5)
        if response.status_code == 200:
            summary = response.json()
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Teams", summary.get("teams", 30))
            with col2:
                st.metric("All-Time Players", summary.get("players", 0))
            with col3:
                st.metric("Active Players", summary.get("active_players", 0))
            with col4:
                st.metric("Game Logs Stored", summary.get("game_logs", 0))

            st.success("✅ NBA Analytics API & Database connected successfully!")
        else:
            st.warning(f"API returned status {response.status_code}")
    except Exception as e:
        st.error(f"⚠️ Could not reach API at {API_URL}: {e}. Ensure FastAPI backend is running.")

    st.markdown("---")
    st.subheader("Platform Architecture")
    st.code(
        """
[ NBA Official Stats API (nba_api) ]
                 ↓
  [ Ingestion Engine / Pipeline ]
                 ↓
   [ PostgreSQL Analytics Store ]
                 ↓
     [ FastAPI Backend (:8000) ]
                 ↓
   [ Streamlit Intelligence Dashboard (:8501) ]
        """,
        language="text"
    )

# ==================================
# View 2: Leaderboards
# ==================================

elif page == "Leaderboards":
    st.title("🏆 NBA Stat Leaderboards")
    category = st.selectbox("Category", ["Top Scorers (PPG)", "Top Playmakers (APG)", "Top Rebounders (RPG)"])

    endpoint_map = {
        "Top Scorers (PPG)": ("/leaderboard/top-scorers", "ppg", "Points Per Game"),
        "Top Playmakers (APG)": ("/leaderboard/top-assists", "apg", "Assists Per Game"),
        "Top Rebounders (RPG)": ("/leaderboard/top-rebounders", "rpg", "Rebounds Per Game")
    }

    endpoint, metric_key, title = endpoint_map[category]

    try:
        response = requests.get(f"{API_URL}{endpoint}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data:
                df = pd.DataFrame(data)
                col_chart, col_table = st.columns([3, 2])

                with col_chart:
                    fig = px.bar(
                        df,
                        x="player",
                        y=metric_key,
                        text=metric_key,
                        title=f"{title} (Top Performers)",
                        color=metric_key,
                        color_continuous_scale="Blues"
                    )
                    fig.update_layout(xaxis_title="Player", yaxis_title=metric_key.upper())
                    st.plotly_chart(fig, use_container_width=True)

                with col_table:
                    st.markdown("### Leaderboard Table")
                    st.dataframe(df, use_container_width=True)
            else:
                st.info("No player game logs found yet. Run an ingestion script to populate data.")
        else:
            st.error(f"API error: {response.text}")
    except Exception as e:
        st.error(f"Failed to fetch leaderboard data: {e}")

# ==================================
# View 3: Player Stats & Analytics
# ==================================

elif page == "Player Stats & Analytics":
    st.title("📊 Player Statistics & Profile")

    # Quick selection presets for popular stars + manual search
    preset_players = {
        "LeBron James": 2544,
        "Stephen Curry": 201939,
        "Nikola Jokić": 203999,
        "Giannis Antetokounmpo": 203507,
        "Jayson Tatum": 1628369,
        "Luka Dončić": 1629029,
        "Kevin Durant": 201142,
        "Joel Embiid": 203954,
        "Shai Gilgeous-Alexander": 1628983
    }

    selected_mode = st.radio("Player Lookup Mode", ["Featured Stars", "Custom Player ID / Search"], horizontal=True)

    if selected_mode == "Featured Stars":
        chosen_name = st.selectbox("Select Player", list(preset_players.keys()))
        player_id = preset_players[chosen_name]
    else:
        player_id = st.number_input("Enter Player ID", min_value=1, value=2544, step=1)

    if st.button("Fetch Player Analytics", type="primary"):
        try:
            stat_res = requests.get(f"{API_URL}/player/{player_id}/stats", timeout=5)
            detail_res = requests.get(f"{API_URL}/player/{player_id}", timeout=5)

            if stat_res.status_code == 404 or detail_res.status_code == 404:
                st.warning(f"Player ID {player_id} was not found in the database.")
            elif stat_res.status_code == 200:
                stats = stat_res.json()
                details = detail_res.json() if detail_res.status_code == 200 else {}

                col_headshot, col_info = st.columns([1, 3])
                with col_headshot:
                    headshot = details.get("headshot_url")
                    if headshot:
                        st.image(headshot, width=180)
                with col_info:
                    st.header(stats.get("player", f"Player #{player_id}"))
                    st.caption(f"NBA ID: {player_id} | Status: {'Active' if details.get('is_active') else 'Alumni'}")

                st.markdown("---")
                m1, m2, m3, m4, m5, m6 = st.columns(6)
                with m1:
                    st.metric("Games Tracked", stats.get("games", 0))
                with m2:
                    st.metric("PPG", stats.get("avg_pts", 0.0))
                with m3:
                    st.metric("RPG", stats.get("avg_reb", 0.0))
                with m4:
                    st.metric("APG", stats.get("avg_ast", 0.0))
                with m5:
                    st.metric("SPG", stats.get("avg_stl", 0.0))
                with m6:
                    st.metric("BPG", stats.get("avg_blk", 0.0))

                # Radar chart visualization of stats
                radar_data = pd.DataFrame(dict(
                    metric=['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks'],
                    value=[stats.get("avg_pts", 0.0), stats.get("avg_reb", 0.0), stats.get("avg_ast", 0.0),
                           stats.get("avg_stl", 0.0) * 5, stats.get("avg_blk", 0.0) * 5]  # scaled for visualization
                ))
                fig_radar = px.line_polar(radar_data, r='value', theta='metric', line_close=True,
                                          title=f"{stats.get('player')} - Stat Profile")
                st.plotly_chart(fig_radar, use_container_width=True)

        except Exception as e:
            st.error(f"Failed to fetch player statistics: {e}")

# ==================================
# View 4: Player Search
# ==================================

elif page == "Player Search":
    st.title("🔍 Player Search")
    st.markdown("Search across all historical and active NBA players.")

    query = st.text_input("Enter player name (e.g., LeBron, Curry, Dončić)", "")

    if query.strip():
        try:
            res = requests.get(f"{API_URL}/search/player/{query.strip()}", timeout=5)
            if res.status_code == 200:
                results = res.json()
                if results:
                    st.success(f"Found {len(results)} player(s):")
                    df = pd.DataFrame(results)
                    st.dataframe(df, use_container_width=True)
                else:
                    st.info("No players matching that name were found.")
            else:
                st.error(f"Search failed: {res.text}")
        except Exception as e:
            st.error(f"Search request failed: {e}")

# ==================================
# View 5: Teams Directory
# ==================================

elif page == "Teams":
    st.title("🏀 NBA Teams Directory")
    try:
        response = requests.get(f"{API_URL}/teams", timeout=5)
        if response.status_code == 200:
            df = pd.DataFrame(response.json())
            st.dataframe(df, use_container_width=True)
        else:
            st.error("Failed to load teams from API.")
    except Exception as e:
        st.error(f"Failed to fetch teams: {e}")

# ==================================
# View 6: Team Analytics
# ==================================

elif page == "Team Analytics":
    st.title("📈 Team Analytics & Output")
    try:
        response = requests.get(f"{API_URL}/team-analytics", timeout=5)
        if response.status_code == 200:
            data = response.json()
            teams_list = data.get("teams", [])

            if teams_list:
                df = pd.DataFrame(teams_list)

                st.metric("Total NBA Teams", data.get("total_teams", len(df)))

                st.markdown("### Team Roster & Stat Distribution")
                st.dataframe(df, use_container_width=True)

                fig = px.bar(
                    df,
                    x="abbreviation",
                    y="roster_size",
                    text="roster_size",
                    title="Player Distribution by Team (Roster Count)",
                    color="roster_size",
                    color_continuous_scale="Viridis"
                )
                fig.update_layout(xaxis_title="Team", yaxis_title="Roster Count")
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No team data found.")
        else:
            st.error("Failed to load team analytics.")
    except Exception as e:
        st.error(f"Failed to load team analytics: {e}")
