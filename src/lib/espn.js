const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const WEB_BASE = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba";
const CURRENT_NBA_SEASON = 2026;

export function calcFantasyPoints({ pts = 0, reb = 0, ast = 0, stl = 0, blk = 0, to = 0 } = {}) {
  return parseFloat((pts * 1 + reb * 1.2 + ast * 1.5 + stl * 3 + blk * 3 - to * 1).toFixed(1));
}

export async function fetchScoreboard(date) {
  const params = date ? `?dates=${date}` : "";
  const res = await fetch(`${BASE}/scoreboard${params}`);
  return res.json();
}

function formatEspnDate(date) {
  const parsed = date instanceof Date ? date : new Date(date);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function parseEspnDate(dateString) {
  const year = Number(dateString.slice(0, 4));
  const month = Number(dateString.slice(4, 6)) - 1;
  const day = Number(dateString.slice(6, 8));
  return new Date(year, month, day);
}

function shiftDate(date, days) {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

export async function fetchScoreboardRange(startDate, endDate) {
  const dates = `${formatEspnDate(startDate)}-${formatEspnDate(endDate)}`;
  const res = await fetch(`${BASE}/scoreboard?dates=${dates}&limit=500`);
  return res.json();
}

export async function findNearestGameDate(date, direction = "nearest") {
  const target = date instanceof Date ? date : parseEspnDate(String(date));
  const maxDays = 370;
  const chunkDays = 30;

  if (direction === "back" || direction === "forward") {
    const step = direction === "back" ? -1 : 1;

    for (let offset = 0; offset <= maxDays; offset += chunkDays + 1) {
      const start = shiftDate(target, step > 0 ? offset : -(offset + chunkDays));
      const end = shiftDate(target, step > 0 ? offset + chunkDays : -offset);
      const data = await fetchScoreboardRange(start, end);
      const events = data.events || [];
      const sortedEvents = events.sort((a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * step);
      const game = sortedEvents.find((event) => (new Date(event.date).getTime() - target.getTime()) * step >= 0);

      if (game) return new Date(game.date);
    }

    return target;
  }

  for (let radius = 0; radius <= maxDays; radius += chunkDays) {
    const start = shiftDate(target, -radius - chunkDays);
    const end = shiftDate(target, radius + chunkDays);
    const data = await fetchScoreboardRange(start, end);
    const events = data.events || [];
    if (events.length) {
      const closest = events.reduce((best, event) => {
        const eventTime = new Date(event.date).getTime();
        const bestTime = new Date(best.date).getTime();
        return Math.abs(eventTime - target.getTime()) < Math.abs(bestTime - target.getTime()) ? event : best;
      }, events[0]);
      return new Date(closest.date);
    }
  }

  return target;
}

function getEventDay(event) {
  return formatEspnDate(new Date(event.date));
}

function isCompletedEvent(event) {
  return Boolean(event.status?.type?.completed || event.competitions?.[0]?.status?.type?.completed);
}

export async function findNearestCompletedGameDate(date, direction = "back") {
  const target = date instanceof Date ? date : parseEspnDate(String(date));
  const targetDay = formatEspnDate(target);
  const maxDays = 370;
  const chunkDays = 30;
  const step = direction === "forward" ? 1 : -1;

  for (let offset = 0; offset <= maxDays; offset += chunkDays + 1) {
    const start = shiftDate(target, step > 0 ? offset : -(offset + chunkDays));
    const end = shiftDate(target, step > 0 ? offset + chunkDays : -offset);
    const data = await fetchScoreboardRange(start, end);
    const events = (data.events || []).filter(isCompletedEvent);
    const sortedEvents = events.sort((a, b) => getEventDay(a).localeCompare(getEventDay(b)) * step);
    const game = sortedEvents.find((event) => getEventDay(event).localeCompare(targetDay) * step >= 0);

    if (game) return new Date(game.date);
  }

  return target;
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
  const res = await fetch(`https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${CURRENT_NBA_SEASON}`);
  return res.json();
}

export async function fetchGameSummary(gameId) {
  const res = await fetch(`${BASE}/summary?event=${gameId}`);
  return res.json();
}

function toEspnDate(date) {
  const parsed = date instanceof Date ? date : new Date(date);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function fetchRecentGamesForTeams(options = {}) {
  const { teamIds = [], beforeDate, limit = 5 } = options;
  if (!teamIds.length) return {};

  const targetDate = beforeDate ? new Date(beforeDate) : new Date();
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - 150);

  const dates = `${toEspnDate(startDate)}-${toEspnDate(targetDate)}`;
  const res = await fetch(`${BASE}/scoreboard?dates=${dates}&limit=500`);
  const data = await res.json();
  const targetTime = targetDate.getTime();

  return teamIds.reduce((acc, teamId) => {
    acc[teamId] = (data.events || [])
      .filter((event) => {
        const eventTime = new Date(event.date).getTime();
        const competition = event.competitions?.[0];
        const hasTeam = competition?.competitors?.some((competitor) => String(competitor.team?.id) === String(teamId));
        return hasTeam && event.status?.type?.completed && eventTime < targetTime;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    return acc;
  }, {});
}

export async function fetchPlayerStats({ season = CURRENT_NBA_SEASON, seasonType = 2, limit = 50, page = 1 } = {}) {
  const res = await fetch(
    `${WEB_BASE}/statistics/byathlete?season=${season}&seasontype=${seasonType}&limit=${limit}&page=${page}`
  );
  return res.json();
}

export async function fetchAllPlayerStats({ season = CURRENT_NBA_SEASON, seasonType = 2, limit = 500 } = {}) {
  const firstPage = await fetchPlayerStats({ season, seasonType, limit, page: 1 });
  const totalPages = firstPage?.pagination?.pages || 1;

  if (totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => (
      fetchPlayerStats({ season, seasonType, limit, page: index + 2 })
    ))
  );
  const athletes = [
    ...(firstPage?.athletes || []),
    ...remainingPages.flatMap((pageData) => pageData?.athletes || []),
  ];

  return {
    ...firstPage,
    athletes,
    pagination: {
      ...firstPage?.pagination,
      page: 1,
      pages: 1,
      count: athletes.length,
    },
  };
}

export async function fetchPlayerProfile(athleteId) {
  const res = await fetch(`${WEB_BASE}/athletes/${athleteId}`);
  return res.json();
}

export async function fetchPlayerSeasonStats(athleteId, options = {}) {
  const { season = CURRENT_NBA_SEASON, seasonType = 2 } = options;
  const res = await fetch(
    `${WEB_BASE}/athletes/${athleteId}/stats?season=${season}&seasontype=${seasonType}`
  );
  return res.json();
}

export async function fetchPlayerCareerStats(athleteId, options = {}) {
  const { startSeason, endSeason = CURRENT_NBA_SEASON, seasonType = 2 } = options;
  const safeStartSeason = Math.max(Number(startSeason) || endSeason - 24, 1997);
  const seasons = Array.from(
    { length: endSeason - safeStartSeason + 1 },
    (_, index) => endSeason - index
  );

  const seasonStats = await Promise.all(
    seasons.map(async (season) => {
      try {
        const data = await fetchPlayerSeasonStats(athleteId, { season, seasonType });
        return { season, ...data };
      } catch {
        return { season, error: true };
      }
    })
  );

  return seasonStats;
}

export async function fetchPlayerNews(athleteId) {
  const res = await fetch(`${BASE}/athletes/${athleteId}/news`);
  return res.json();
}
