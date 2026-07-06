export const USAGE_PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "60d", label: "60D" },
  { value: "90d", label: "90D" },
  { value: "180d", label: "180D" },
  { value: "365d", label: "365D" },
  { value: "all", label: "All" },
];

export const VALID_USAGE_STATS_PERIODS = new Set(
  USAGE_PERIOD_OPTIONS.map((option) => option.value),
);

export const VALID_USAGE_CHART_PERIODS = VALID_USAGE_STATS_PERIODS;

export const USAGE_PERIOD_DAYS = {
  "7d": 7,
  "30d": 30,
  "60d": 60,
  "90d": 90,
  "180d": 180,
  "365d": 365,
  all: null,
};

export function getUsagePeriodDays(period) {
  if (period === "today" || period === "24h") return null;
  return Object.prototype.hasOwnProperty.call(USAGE_PERIOD_DAYS, period)
    ? USAGE_PERIOD_DAYS[period]
    : null;
}

export function getChartDayBucketCount(period) {
  return getUsagePeriodDays(period);
}
