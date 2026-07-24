import { getDailyResetDateKey } from './dailyReset';

export const getEffectiveDailyDateKey = (_pet: unknown, now: number) =>
  getDailyResetDateKey(now);

export const reconcilePetClock = (pet: { lastUpdatedAt?: number }, now: number) => {
  const petTime = pet.lastUpdatedAt || 0;
  const drift = now - petTime;
  const rolledBackByMs = drift < 0 ? Math.abs(drift) : 0;
  return { pet, rolledBackByMs, useHistoricalKeys: rolledBackByMs === 0 };
};