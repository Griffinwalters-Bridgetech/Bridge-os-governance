import type { Stoplight } from "./types";

const RANK: Record<Stoplight, number> = { GREEN: 0, YELLOW: 1, RED: 2 };

export function worstStoplight(lights: Stoplight[]): Stoplight {
  if (lights.length === 0) return "GREEN";
  return lights.reduce((worst, cur) => (RANK[cur] > RANK[worst] ? cur : worst), "GREEN" as Stoplight);
}
