import os
import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

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
        "🔮 AI Predictions & Props",
        "Leaderboards",
        "Player Stats & Analytics",
        "Player Search",
        "Teams",
        "Team Analytics"
    ]
)

# Featured preset players for quick selection
PRESET_PLAYERS = {
    "LeBron James": 2544,
    "Stephen Curry": 201939,
    "Nikola Jokić": 203999,
    "Giannis Antetokounmpo": 203507,
    "Jayson Tatum": 1628369,
    "Luka Dončić": 1629029,
    "Kevin Durant": 201142,
    "Joel Embiid": 203954,
    "Shai Gilgeous-Alexander": 1628983,
    "Paul George": 202331
}

# ==================================
# View 1: Overview Dashboard
# ==================================

if page == "Dashboard":
    st.title("🏀 NBA Intelligence Platform")
    st.markdown("Real-time data ingestion, box-score analytics, and machine learning intelligence platform.")

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
[ Machine Learning Engine (ml/) ] ←→ [ FastAPI Backend (:8000) ]
                                              ↓
                        [ Streamlit Intelligence Dashboard (:8501) ]
        """,
        language="text"
    )

# ==================================
# View 2: AI Predictions & Props (ML)
# ==================================

elif page == "🔮 AI Predictions & Props":
    st.title("🔮 Machine Learning Predictions & Props")
    st.markdown("Predict next-game player prop lines and simulate franchise matchup outcomes using machine learning.")

    ml_tab1, ml_tab2 = st.tabs(["🎯 Player Prop Forecaster", "⚔️ Game Matchup Simulator"])

    # Tab 1: Player Prop Forecaster
    with ml_tab1:
        st.subheader("Next-Game Player Prop Forecaster")
        st.caption("Combines rolling exponential moving averages, season momentum, and regression models to forecast next-game lines.")

        p_mode = st.radio("Player Selection", ["Featured Stars", "Custom Player ID"], horizontal=True, key="ml_player_mode")
        if p_mode == "Featured Stars":
            ml_player_name = st.selectbox("Select Star Player", list(PRESET_PLAYERS.keys()), key="ml_p_name")
            ml_player_id = PRESET_PLAYERS[ml_player_name]
        else:
            ml_player_id = st.number_input("Enter Player ID", min_value=1, value=2544, step=1, key="ml_p_id")

        if st.button("Generate AI Projections", type="primary", key="btn_ml_player"):
            try:
                res = requests.get(f"{API_URL}/predict/player/{ml_player_id}", timeout=8)
                if res.status_code == 200:
                    data = res.json()
                    if not data.get("has_data", False):
                        st.info(data.get("message", "No games logged for this player yet."))
                    else:
                        st.success(f"Generated AI Projections for **{data['player']}** (based on {data['games_analyzed']} games analyzed):")

                        proj = data["projections"]
                        c1, c2, c3, c4 = st.columns(4)

                        metrics_cards = [
                            (c1, "Points (PTS)", proj["points"]),
                            (c2, "Rebounds (REB)", proj["rebounds"]),
                            (c3, "Assists (AST)", proj["assists"]),
                            (c4, "3-Pointers Made", proj["three_pointers"])
                        ]

                        for col, label, metric in metrics_cards:
                            with col:
                                st.metric(
                                    label=label,
                                    value=f"{metric['predicted_value']} Proj",
                                    delta=f"O/U Line: {metric['over_under_line']}"
                                )
                                st.caption(
                                    f"Over Likelihood: **{int(metric['over_probability'] * 100)}%**  \n"
                                    f"80% CI: `[{metric['confidence_interval'][0]} - {metric['confidence_interval'][1]}]`"
                                )

                        # Historical trendline vs AI Projected Line
                        st.markdown("---")
                        st.subheader(f"📈 {data['player']} - Historical Performance vs. AI Projected Line")
                        hist = data.get("history", {})
                        if hist and "dates" in hist:
                            df_hist = pd.DataFrame({
                                "Game": hist["dates"],
                                "Points": hist["pts"],
                                "Rebounds": hist["reb"],
                                "Assists": hist["ast"]
                            })

                            stat_to_plot = st.selectbox("Select Stat to Chart", ["Points", "Rebounds", "Assists"])
                            proj_line = proj["points"]["over_under_line"] if stat_to_plot == "Points" else (
                                proj["rebounds"]["over_under_line"] if stat_to_plot == "Rebounds" else proj["assists"]["over_under_line"]
                            )

                            fig_trend = go.Figure()
                            fig_trend.add_trace(go.Scatter(
                                x=df_hist["Game"],
                                y=df_hist[stat_to_plot],
                                mode='lines+markers',
                                name=f"Actual {stat_to_plot}",
                                line=dict(color='#1f77b4', width=3)
                            ))
                            fig_trend.add_hline(
                                y=proj_line,
                                line_dash="dash",
                                line_color="red",
                                annotation_text=f"AI O/U Line: {proj_line}",
                                annotation_position="top left"
                            )
                            fig_trend.update_layout(
                                title=f"{stat_to_plot} Trajectory with Projected Line",
                                xaxis_title="Recent Games",
                                yaxis_title=stat_to_plot
                            )
                            st.plotly_chart(fig_trend, use_container_width=True)

                else:
                    st.error(f"API Error: {res.text}")
            except Exception as e:
                st.error(f"Failed to generate prediction: {e}")

    # Tab 2: Game Matchup Simulator
    with ml_tab2:
        st.subheader("⚔️ Game Matchup & Win Probability Simulator")
        st.caption("Simulates game pace, offensive efficiencies, and home court advantage to output projected scores and spread.")

        # Fetch teams list for dropdowns
        try:
            teams_res = requests.get(f"{API_URL}/teams", timeout=5)
            teams_data = teams_res.json() if teams_res.status_code == 200 else []
            team_dict = {t["name"]: t["team_id"] for t in teams_data}
        except Exception:
            team_dict = {}

        if not team_dict:
            team_dict = {
                "Los Angeles Lakers": 1610612747,
                "Golden State Warriors": 1610612744,
                "Boston Celtics": 1610612738,
                "Denver Nuggets": 1610612743,
                "Milwaukee Bucks": 1610612749,
                "Dallas Mavericks": 1610612742
            }

        col_home, col_away = st.columns(2)
        with col_home:
            home_choice = st.selectbox("🏠 Home Team", list(team_dict.keys()), index=0)
            home_id = team_dict[home_choice]
        with col_away:
            # Default to second team
            away_choice = st.selectbox("✈️ Away Team", list(team_dict.keys()), index=min(1, len(team_dict)-1))
            away_id = team_dict[away_choice]

        if st.button("Run Matchup Simulation", type="primary", key="btn_ml_matchup"):
            if home_id == away_id:
                st.warning("Please choose two different teams.")
            else:
                try:
                    sim_res = requests.get(f"{API_URL}/predict/matchup?home_team_id={home_id}&away_team_id={away_id}", timeout=6)
                    if sim_res.status_code == 200:
                        sim = sim_res.json()
                        home_info = sim["home_team"]
                        away_info = sim["away_team"]
                        odds = sim["odds_and_lines"]

                        st.markdown("### Matchup Outcome Projection")

                        col_h_card, col_odds, col_a_card = st.columns([2, 2, 2])
                        with col_h_card:
                            st.subheader(f"🏠 {home_info['name']}")
                            st.metric("Win Probability", f"{home_info['win_probability']}%")
                            st.metric("Projected Score", home_info['projected_score'])

                        with col_odds:
                            st.subheader("📊 Vegas Lines")
                            st.info(f"**Favorite**: {odds['favored_team']}")
                            st.markdown(f"**Spread**: `{odds['projected_spread']}`")
                            st.markdown(f"**Total O/U**: `{odds['total_over_under']} PTS`")

                        with col_a_card:
                            st.subheader(f"✈️ {away_info['name']}")
                            st.metric("Win Probability", f"{away_info['win_probability']}%")
                            st.metric("Projected Score", away_info['projected_score'])

                        # Win probability split bar
                        st.markdown("#### Win Probability Split")
                        prob_df = pd.DataFrame({
                            "Team": [home_info['abbreviation'], away_info['abbreviation']],
                            "Win %": [home_info['win_probability'], away_info['win_probability']]
                        })
                        fig_prob = px.bar(
                            prob_df,
                            x="Win %",
                            y="Team",
                            orientation='h',
                            text="Win %",
                            color="Team",
                            color_discrete_sequence=['#1f77b4', '#ff7f0e']
                        )
                        fig_prob.update_layout(height=220)
                        st.plotly_chart(fig_prob, use_container_width=True)

                        st.markdown("#### Key Matchup Insights")
                        for factor in sim.get("key_factors", []):
                            st.write(f"• {factor}")

                    else:
                        st.error(f"Simulation failed: {sim_res.text}")
                except Exception as e:
                    st.error(f"Failed to run matchup simulation: {e}")

# ==================================
# View 3: Leaderboards
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
# View 4: Player Stats & Analytics
# ==================================

elif page == "Player Stats & Analytics":
    st.title("📊 Player Statistics & Profile")

    selected_mode = st.radio("Player Lookup Mode", ["Featured Stars", "Custom Player ID / Search"], horizontal=True)

    if selected_mode == "Featured Stars":
        chosen_name = st.selectbox("Select Player", list(PRESET_PLAYERS.keys()))
        player_id = PRESET_PLAYERS[chosen_name]
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
                           stats.get("avg_stl", 0.0) * 5, stats.get("avg_blk", 0.0) * 5]
                ))
                fig_radar = px.line_polar(radar_data, r='value', theta='metric', line_close=True,
                                          title=f"{stats.get('player')} - Stat Profile")
                st.plotly_chart(fig_radar, use_container_width=True)

        except Exception as e:
            st.error(f"Failed to fetch player statistics: {e}")

# ==================================
# View 5: Player Search
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
# View 6: Teams Directory
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
# View 7: Team Analytics
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
