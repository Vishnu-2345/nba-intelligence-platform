import streamlit as st
import requests
import pandas as pd
import plotly.express as px

# ==================================
# Page Configuration
# ==================================

st.set_page_config(
    page_title="NBA Intelligence Platform",
    page_icon="🏀",
    layout="wide"
)

# ==================================
# Sidebar
# ==================================

page = st.sidebar.selectbox(
    "Navigation",
    [
        "Dashboard",
        "Leaderboard",
        "Player Stats",
        "Teams"
    ]
)

# ==================================
# Dashboard
# ==================================

if page == "Dashboard":

    st.title("🏀 NBA Intelligence Platform")

    st.markdown("### Overview")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Teams", 30)

    with col2:
        st.metric("Players", 5103)

    with col3:
        st.metric("Game Logs", 70)

    st.success("NBA Analytics Platform is running successfully!")

    st.markdown("---")

    st.subheader("Project Architecture")

    st.code(
        """
NBA API
   ↓
PostgreSQL
   ↓
FastAPI
   ↓
Streamlit Dashboard
        """
    )

# ==================================
# Leaderboard
# ==================================

elif page == "Leaderboard":

    st.title("🏆 Top Scorers Leaderboard")

    try:

        response = requests.get(
            "http://127.0.0.1:8000/leaderboard/top-scorers"
        )

        data = response.json()

        df = pd.DataFrame(data)

        st.dataframe(
            df,
            use_container_width=True
        )

        fig = px.bar(
            df,
            x="player",
            y="ppg",
            text="ppg",
            title="Points Per Game"
        )

        fig.update_layout(
            xaxis_title="Player",
            yaxis_title="PPG"
        )

        st.plotly_chart(
            fig,
            use_container_width=True
        )

    except Exception as e:
        st.error(
            f"Failed to fetch leaderboard data: {e}"
        )

# ==================================
# Player Stats
# ==================================

elif page == "Player Stats":

    st.title("📊 Player Statistics")

    player_id = st.number_input(
        "Enter Player ID",
        min_value=1,
        value=2544
    )

    if st.button("Get Stats"):

        try:

            response = requests.get(
                f"http://127.0.0.1:8000/player/{player_id}/stats"
            )

            stats = response.json()

            if "error" in stats:

                st.error(stats["error"])

            else:

                st.subheader(stats["player"])

                col1, col2, col3, col4 = st.columns(4)

                with col1:
                    st.metric(
                        "Games",
                        stats["games"]
                    )

                with col2:
                    st.metric(
                        "PPG",
                        stats["avg_pts"]
                    )

                with col3:
                    st.metric(
                        "RPG",
                        stats["avg_reb"]
                    )

                with col4:
                    st.metric(
                        "APG",
                        stats["avg_ast"]
                    )

        except Exception as e:

            st.error(
                f"Failed to fetch player statistics: {e}"
            )

# ==================================
# Teams
# ==================================

elif page == "Teams":

    st.title("🏀 NBA Teams")

    teams = [
        "Atlanta Hawks",
        "Boston Celtics",
        "Brooklyn Nets",
        "Charlotte Hornets",
        "Chicago Bulls",
        "Cleveland Cavaliers",
        "Dallas Mavericks",
        "Denver Nuggets",
        "Detroit Pistons",
        "Golden State Warriors",
        "Houston Rockets",
        "Indiana Pacers",
        "LA Clippers",
        "Los Angeles Lakers",
        "Memphis Grizzlies",
        "Miami Heat",
        "Milwaukee Bucks",
        "Minnesota Timberwolves",
        "New Orleans Pelicans",
        "New York Knicks",
        "Oklahoma City Thunder",
        "Orlando Magic",
        "Philadelphia 76ers",
        "Phoenix Suns",
        "Portland Trail Blazers",
        "Sacramento Kings",
        "San Antonio Spurs",
        "Toronto Raptors",
        "Utah Jazz",
        "Washington Wizards"
    ]

    team_df = pd.DataFrame(
        {"Team": teams}
    )

    st.dataframe(
        team_df,
        use_container_width=True
    )