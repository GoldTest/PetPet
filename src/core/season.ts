import { t } from '../i18n';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonInfo {
  id: Season;
  label: string;
  summary: string;
}

export const getSeasonForDate = (time = Date.now()): Season => {
  const month = new Date(time).getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

export const getSeasonInfo = (time = Date.now()): SeasonInfo => {
  const id = getSeasonForDate(time);
  return {
    id,
    label: t(`pet.season.${id}.label`),
    summary: t(`pet.season.${id}.summary`),
  };
};

export const getMoodDecaySeasonModifier = (time = Date.now()) => (getSeasonForDate(time) === 'spring' ? 0.9 : 1);

export const getCleanlinessDecaySeasonModifier = (time = Date.now()) => (getSeasonForDate(time) === 'summer' ? 1.08 : 1);

export const getCleanActionSeasonBonus = (time = Date.now()) => (getSeasonForDate(time) === 'summer' ? 3 : 0);

export const getWorkSeasonCoinBonus = (time = Date.now()) => (getSeasonForDate(time) === 'autumn' ? 2 : 0);

export const getEnergyRecoverySeasonModifier = (time = Date.now(), isSleeping = false) =>
  isSleeping && getSeasonForDate(time) === 'winter' ? 0.9 : 1;
