const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const THROTTLE_LIMITS = {
  globalPerMinute: parsePositiveInt(
    process.env.RATE_LIMIT_GLOBAL_PER_MINUTE,
    120,
  ),
  aiClassifyPerMinute: parsePositiveInt(
    process.env.RATE_LIMIT_AI_PER_MINUTE,
    10,
  ),
  reportExportPerHour: parsePositiveInt(
    process.env.RATE_LIMIT_REPORT_EXPORT_PER_HOUR,
    3,
  ),
} as const;

export const THROTTLE_TTL = {
  oneMinuteMs: 60_000,
  oneHourMs: 3_600_000,
} as const;
