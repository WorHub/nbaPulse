const NBA_STATS_BASE = "https://stats.nba.com/stats";
const DRAFT_HISTORY_URL = `${NBA_STATS_BASE}/drafthistory?LeagueID=00`;

const NBA_STATS_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Referer": "https://www.nba.com/",
  "User-Agent": "Mozilla/5.0",
};

function mapRows(resultSet) {
  const headers = resultSet?.headers || [];
  const rows = resultSet?.rowSet || [];

  return rows.map((row) => headers.reduce((entry, header, index) => {
    entry[header] = row[index];
    return entry;
  }, {}));
}

async function requestJson(url) {
  const response = await fetch(url, { headers: NBA_STATS_HEADERS });
  if (!response.ok) throw new Error(`NBA Stats request failed: ${response.status}`);
  return response.json();
}

export function normalizeDraftPick(pick) {
  const teamCity = pick.TEAM_CITY || "";
  const teamName = pick.TEAM_NAME || "";
  const team = [teamCity, teamName].filter(Boolean).join(" ").trim();

  return {
    id: `${pick.SEASON}-${pick.OVERALL_PICK}-${pick.PERSON_ID || pick.PLAYER_NAME}`,
    personId: pick.PERSON_ID,
    playerName: pick.PLAYER_NAME,
    season: Number(pick.SEASON),
    round: Number(pick.ROUND_NUMBER),
    roundPick: Number(pick.ROUND_PICK),
    overallPick: Number(pick.OVERALL_PICK),
    draftType: pick.DRAFT_TYPE,
    teamId: pick.TEAM_ID,
    team,
    teamCity,
    teamName,
    teamAbbreviation: pick.TEAM_ABBREVIATION,
    organization: pick.ORGANIZATION,
    organizationType: pick.ORGANIZATION_TYPE,
    nbaProfileUrl: pick.PERSON_ID ? `https://www.nba.com/player/${pick.PERSON_ID}` : null,
  };
}

export async function fetchDraftHistory() {
  let data;

  try {
    data = await requestJson(DRAFT_HISTORY_URL);
  } catch (error) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(DRAFT_HISTORY_URL)}`;
    data = await requestJson(proxyUrl);
  }

  const rows = mapRows(data?.resultSets?.[0] || data?.resultSet);
  return rows.map(normalizeDraftPick).sort((a, b) => {
    if (b.season !== a.season) return b.season - a.season;
    return a.overallPick - b.overallPick;
  });
}
