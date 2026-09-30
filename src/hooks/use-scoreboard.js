import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, startOfDay } from "date-fns";
import { fetchScoreboard } from "@/lib/espn";

export function useScoreboard(initialDate = new Date()) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(initialDate));
  const queryClient = useQueryClient();
  const dateKey = format(selectedDate, "yyyyMMdd");

  const query = useQuery({
    queryKey: ["scoreboard", dateKey],
    queryFn: ({ signal }) => fetchScoreboard(dateKey, { signal }),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchInterval: ({ state }) => state.data?.events?.some((game) => game.status?.type?.state === "in") ? 30_000 : false,
  });

  const selectDate = (date) => {
    if (!date) return;
    const nextDate = startOfDay(date);
    setSelectedDate(nextDate);

    [-1, 1].forEach((offset) => {
      const adjacentKey = format(addDays(nextDate, offset), "yyyyMMdd");
      queryClient.prefetchQuery({
        queryKey: ["scoreboard", adjacentKey],
        queryFn: ({ signal }) => fetchScoreboard(adjacentKey, { signal }),
        staleTime: 60_000,
      });
    });
  };

  return {
    ...query,
    selectedDate,
    dateKey,
    games: query.data?.events || [],
    selectDate,
    goPrevious: () => selectDate(addDays(selectedDate, -1)),
    goNext: () => selectDate(addDays(selectedDate, 1)),
    goToday: () => selectDate(new Date()),
  };
}
