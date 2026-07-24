export const dailyResetHour = 5;

export const getDailyResetDateKey = (time: number) => {
  const date = new Date(time);
  date.setHours(dailyResetHour, 0, 0, 0);
  if (date.getTime() > time) {
    date.setDate(date.getDate() - 1);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeLegacyDailyDateKey = (dateKey: string | null | undefined, now: number) => {
  if (!dateKey) return null;
  const parts = dateKey.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  const candidate = new Date(year, month - 1, day, dailyResetHour, 0, 0, 0).getTime();
  const nowReset = new Date(now);
  nowReset.setHours(dailyResetHour, 0, 0, 0);
  if (nowReset.getTime() - candidate < 2 * 24 * 60 * 60 * 1000 && candidate <= now) {
    return dateKey;
  }
  return null;
};
