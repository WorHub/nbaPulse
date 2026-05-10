const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

export function calcFantasyPoints({ pts = 0, reb = 0, ast = 0, stl = 0, blk = 0, to = 0 } = {}) {
  return parseFloat((pts * 1 + reb * 1.2 + ast * 1.5 + stl * 3 + blk * 3 - to * 1).toFixed(1));
}

export async function fetchScoreboard(date) {
  const params = date ? `?dates=${date}` : "";
  const res = await fetch(`${BASE}/scoreboard${params}`);
  return res.json();
}

export async function fetchNews() {
  const res = await fetch(`${BASE}/news`);
  return res.json();
}

export async function fetchTeams() {
  const res = await fetch(`${BASE}/teams`);
  return res.json();
}

export async function fetchTeam(abbrev) {
  const res = await fetch(`${BASE}/teams/${abbrev.toLowerCase()}?enable=roster,projection,stats`);
  return res.json();
}

export async function fetchStandings() {
  const res = await fetch(`https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2026`);
  return res.json();
}

export async function fetchGameSummary(gameId) {
  const res = await fetch(`${BASE}/summary?event=${gameId}`);
  return res.json();
}

export async function fetchPlayerStats({ season = 2026, seasonType = 2, limit = 50, page = 1 } = {}) {
  const res = await fetch(
    `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?season=${season}&seasontype=${seasonType}&limit=${limit}&page=${page}`
  );
  return res.json();
}

export async function fetchPlayerProfile(athleteId) {
  const res = await fetch(
    `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${athleteId}`
  );
  return res.json();
}

export async function fetchPlayerSeasonStats(athleteId) {
  const res = await fetch(
    `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${athleteId}/stats`
  );
  return res.json();
}