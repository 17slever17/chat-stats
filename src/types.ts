export type MinuteStat = {
  minuteStartTs: number; // ms epoch (UTC) — начало минуты
  label: string;         // удобочитаемый label, e.g. "2025-10-20 02:57"
  count: number;
};

