// Helpers to convert per-tick production to per-minute and per-hour
// Tick length in seconds (must match backend TICK_SECONDS)
export const TICK_SECONDS = 10;

export function perTickToPerMinute(value) {
  if (typeof value !== 'number') return null;
  const ticksPerMinute = 60 / TICK_SECONDS;
  return value * ticksPerMinute;
}

export function perTickToPerHour(value) {
  if (typeof value !== 'number') return null;
  const ticksPerHour = 3600 / TICK_SECONDS;
  return value * ticksPerHour;
}
