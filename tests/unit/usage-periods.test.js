import { describe, expect, it } from "vitest";
import {
  USAGE_PERIOD_OPTIONS,
  VALID_USAGE_CHART_PERIODS,
  VALID_USAGE_STATS_PERIODS,
  getChartDayBucketCount,
  getUsagePeriodDays,
} from "@/lib/usagePeriods.js";

describe("usage period helpers", () => {
  it("exposes extended usage periods", () => {
    const values = USAGE_PERIOD_OPTIONS.map((option) => option.value);

    expect(values).toEqual([
      "today",
      "24h",
      "7d",
      "30d",
      "60d",
      "90d",
      "180d",
      "365d",
      "all",
    ]);
  });

  it("validates stats and chart periods from the same option set", () => {
    for (const period of ["90d", "180d", "365d", "all"]) {
      expect(VALID_USAGE_STATS_PERIODS.has(period)).toBe(true);
      expect(VALID_USAGE_CHART_PERIODS.has(period)).toBe(true);
    }
  });

  it("maps rolling day periods to day counts", () => {
    expect(getUsagePeriodDays("7d")).toBe(7);
    expect(getUsagePeriodDays("30d")).toBe(30);
    expect(getUsagePeriodDays("60d")).toBe(60);
    expect(getUsagePeriodDays("90d")).toBe(90);
    expect(getUsagePeriodDays("180d")).toBe(180);
    expect(getUsagePeriodDays("365d")).toBe(365);
  });

  it("returns null for non-daily and all-time periods", () => {
    expect(getUsagePeriodDays("today")).toBeNull();
    expect(getUsagePeriodDays("24h")).toBeNull();
    expect(getUsagePeriodDays("all")).toBeNull();
  });

  it("returns chart day buckets for daily periods", () => {
    expect(getChartDayBucketCount("90d")).toBe(90);
    expect(getChartDayBucketCount("365d")).toBe(365);
    expect(getChartDayBucketCount("all")).toBeNull();
  });
});
