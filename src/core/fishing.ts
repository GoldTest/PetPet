import { t } from '../i18n';
import { getSeasonForDate, type Season } from './season';
import { hashString, isNumber } from './utils';
import type { FishId, FishRarity, FishingBaitId, FishingRodId, FishingSlot, FishingSlotOutcome, FishingSlotState, FishingSkill, FishingState, FishingWaterZoneId, PetState, WeatherType } from './petTypes';

export const fishingSchemaVersion = 2;
export const fishingSlotCount = 4;
export const fishingMaxSkillLevel = 15;

export const fishIds: readonly FishId[] = [
  'crucian_carp', 'grass_carp', 'silver_carp', 'common_carp',
  'catfish', 'shrimp', 'crab',
  'perch', 'bream', 'yellow_jacket',
  'trout', 'salmon',
  'octopus', 'squid', 'tuna', 'marlin',
  'ancient_koi', 'star_koi', 'mythical_fish',
] as const;

export const waterZoneIds: readonly FishingWaterZoneId[] = ['pond', 'river', 'lake', 'deep_sea'] as const;

export const rodIds: readonly FishingRodId[] = ['bamboo', 'iron', 'fiber', 'carbon', 'titanium', 'sea_god'] as const;

export const baitIds: readonly FishingBaitId[] = ['worm', 'rice_ball', 'insect', 'glow', 'magic'] as const;

export const fishingSlotStates: readonly FishingSlotState[] = ['idle', 'casting', 'waiting', 'reeling', 'done'] as const;

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface FishDefinition {
  id: FishId;
  rarity: FishRarity;
  zones: readonly FishingWaterZoneId[];
  weight: number;
  price: number;
  effect: { hunger?: number; mood?: number; cleanliness?: number; energy?: number; health?: number };
  tags?: readonly string[];
}

export interface FishingWaterZoneDefinition {
  id: FishingWaterZoneId;
  unlockedAtSkillLevel: number;
  fishIds: readonly FishId[];
  baseWaitMs: number;
  baseBiteRate: number;
  rareBonusPercent: number;
}

export interface FishingRodDefinition {
  id: FishingRodId;
  catchRateBonusPercent: number;
  waitTimeMultiplier: number;
  qualityBonusPercent: number;
  durability: number;
  qualityChancePercent: number;
  unlocksZones: readonly FishingWaterZoneId[];
}

export interface FishingBaitDefinition {
  id: FishingBaitId;
  catchRateBonusPercent: number;
  rareBonusPercent: number;
  zoneMatch: readonly FishingWaterZoneId[];
  zoneMatchBonusPercent: number;
}

export interface FishingWeatherEffects {
  waitMultiplier: number;
  biteRateBonusPercent: number;
  rareBonusPercent: number;
}

export interface FishingTimeOfDayEffects {
  waitMultiplier: number;
  biteRateBonusPercent: number;
  rareBonusPercent: number;
}

const slotStateSet = new Set<FishingSlotState>(fishingSlotStates);
const fishIdSet = new Set<FishId>(fishIds);
const waterZoneIdSet = new Set<FishingWaterZoneId>(waterZoneIds);
const rodIdSet = new Set<FishingRodId>(rodIds);
const baitIdSet = new Set<FishingBaitId>(baitIds);

const isFishId = (value: unknown): value is FishId => typeof value === 'string' && fishIdSet.has(value as FishId);
const isWaterZoneId = (value: unknown): value is FishingWaterZoneId => typeof value === 'string' && waterZoneIdSet.has(value as FishingWaterZoneId);
const isRodId = (value: unknown): value is FishingRodId => typeof value === 'string' && rodIdSet.has(value as FishingRodId);
const isBaitId = (value: unknown): value is FishingBaitId => typeof value === 'string' && baitIdSet.has(value as FishingBaitId);
const isFishingSlotState = (value: unknown): value is FishingSlotState => typeof value === 'string' && slotStateSet.has(value as FishingSlotState);
const clampTimestamp = (value: unknown, now: number) => isNumber(value) ? Math.max(0, Math.min(Math.floor(value), now + 365 * 24 * 60 * 60 * 1000)) : 0;

const xpThresholds: readonly number[] = [0, 12, 32, 65, 110, 168, 240, 325, 425, 540, 670, 815, 975, 1150, 1340, 1540];

export const fishRarityIds: readonly FishRarity[] = ['common', 'rare', 'epic', 'legend'] as const;

export const fishDefinitions: Record<FishId, FishDefinition> = {
  crucian_carp: { id: 'crucian_carp', rarity: 'common', zones: ['pond', 'river'], weight: 40, price: 8, effect: { hunger: 12, mood: 1, health: 1 } },
  grass_carp: { id: 'grass_carp', rarity: 'common', zones: ['pond', 'river'], weight: 32, price: 9, effect: { hunger: 14, mood: 1, health: 1 } },
  silver_carp: { id: 'silver_carp', rarity: 'common', zones: ['pond', 'river', 'lake'], weight: 28, price: 10, effect: { hunger: 13, mood: 1, health: 2 } },
  common_carp: { id: 'common_carp', rarity: 'common', zones: ['pond', 'river'], weight: 35, price: 11, effect: { hunger: 15, mood: 1, health: 1 } },
  catfish: { id: 'catfish', rarity: 'common', zones: ['pond', 'river', 'lake'], weight: 25, price: 9, effect: { hunger: 16, mood: -1, health: 1 } },
  shrimp: { id: 'shrimp', rarity: 'common', zones: ['pond', 'river', 'lake'], weight: 18, price: 12, effect: { hunger: 10, mood: 2 } },
  crab: { id: 'crab', rarity: 'common', zones: ['pond', 'river'], weight: 22, price: 14, effect: { hunger: 11, mood: 1, health: 2 } },
  perch: { id: 'perch', rarity: 'rare', zones: ['pond', 'river'], weight: 22, price: 22, effect: { hunger: 16, mood: 2, health: 2 } },
  bream: { id: 'bream', rarity: 'rare', zones: ['river', 'lake'], weight: 20, price: 24, effect: { hunger: 18, mood: 2, health: 2 } },
  yellow_jacket: { id: 'yellow_jacket', rarity: 'rare', zones: ['pond', 'river', 'lake'], weight: 16, price: 28, effect: { hunger: 15, mood: 2, health: 2 } },
  trout: { id: 'trout', rarity: 'rare', zones: ['lake', 'deep_sea'], weight: 14, price: 32, effect: { hunger: 17, mood: 3, health: 3 } },
  salmon: { id: 'salmon', rarity: 'rare', zones: ['lake', 'deep_sea'], weight: 12, price: 36, effect: { hunger: 18, mood: 3, health: 3 } },
  octopus: { id: 'octopus', rarity: 'epic', zones: ['deep_sea'], weight: 7, price: 52, effect: { hunger: 20, mood: 4, health: 3, energy: 1 } },
  squid: { id: 'squid', rarity: 'epic', zones: ['deep_sea'], weight: 6, price: 48, effect: { hunger: 18, mood: 3, health: 2 } },
  tuna: { id: 'tuna', rarity: 'epic', zones: ['deep_sea'], weight: 5, price: 56, effect: { hunger: 22, mood: 4, health: 4 } },
  marlin: { id: 'marlin', rarity: 'epic', zones: ['deep_sea'], weight: 4, price: 64, effect: { hunger: 24, mood: 4, health: 4, energy: 1 } },
  ancient_koi: { id: 'ancient_koi', rarity: 'legend', zones: ['pond', 'river', 'lake'], weight: 3, price: 120, effect: { hunger: 24, mood: 6, health: 4, energy: 2, cleanliness: 1 }, tags: ['legend', 'collectible'] },
  star_koi: { id: 'star_koi', rarity: 'legend', zones: ['river', 'lake', 'deep_sea'], weight: 2, price: 150, effect: { hunger: 26, mood: 7, health: 5, energy: 3, cleanliness: 1 }, tags: ['legend', 'collectible'] },
  mythical_fish: { id: 'mythical_fish', rarity: 'legend', zones: ['pond', 'river', 'lake', 'deep_sea'], weight: 1, price: 200, effect: { hunger: 30, mood: 10, health: 8, energy: 4, cleanliness: 2 }, tags: ['legend', 'collectible'] },
};

export const waterZoneDefinitions: Record<FishingWaterZoneId, FishingWaterZoneDefinition> = {
  pond: { id: 'pond', unlockedAtSkillLevel: 1, fishIds: ['crucian_carp', 'grass_carp', 'silver_carp', 'common_carp', 'catfish', 'shrimp', 'crab', 'perch', 'yellow_jacket', 'ancient_koi'], baseWaitMs: 60000, baseBiteRate: 95, rareBonusPercent: 0 },
  river: { id: 'river', unlockedAtSkillLevel: 5, fishIds: ['crucian_carp', 'grass_carp', 'silver_carp', 'common_carp', 'catfish', 'shrimp', 'crab', 'perch', 'bream', 'yellow_jacket', 'ancient_koi', 'star_koi', 'mythical_fish'], baseWaitMs: 90000, baseBiteRate: 90, rareBonusPercent: 5 },
  lake: { id: 'lake', unlockedAtSkillLevel: 10, fishIds: ['silver_carp', 'catfish', 'shrimp', 'bream', 'yellow_jacket', 'trout', 'salmon', 'ancient_koi', 'star_koi', 'mythical_fish'], baseWaitMs: 130000, baseBiteRate: 85, rareBonusPercent: 10 },
  deep_sea: { id: 'deep_sea', unlockedAtSkillLevel: 13, fishIds: ['trout', 'salmon', 'octopus', 'squid', 'tuna', 'marlin', 'star_koi', 'mythical_fish'], baseWaitMs: 170000, baseBiteRate: 80, rareBonusPercent: 18 },
};

export const rodDefinitions: Record<FishingRodId, FishingRodDefinition> = {
  bamboo: { id: 'bamboo', catchRateBonusPercent: 0, waitTimeMultiplier: 1, qualityBonusPercent: 0, durability: 30, qualityChancePercent: 0, unlocksZones: ['pond'] },
  iron: { id: 'iron', catchRateBonusPercent: 10, waitTimeMultiplier: 0.95, qualityBonusPercent: 5, durability: 40, qualityChancePercent: 5, unlocksZones: ['pond', 'river'] },
  fiber: { id: 'fiber', catchRateBonusPercent: 20, waitTimeMultiplier: 0.9, qualityBonusPercent: 10, durability: 45, qualityChancePercent: 10, unlocksZones: ['pond', 'river', 'lake'] },
  carbon: { id: 'carbon', catchRateBonusPercent: 35, waitTimeMultiplier: 0.85, qualityBonusPercent: 18, durability: 55, qualityChancePercent: 18, unlocksZones: ['pond', 'river', 'lake', 'deep_sea'] },
  titanium: { id: 'titanium', catchRateBonusPercent: 50, waitTimeMultiplier: 0.8, qualityBonusPercent: 25, durability: 70, qualityChancePercent: 25, unlocksZones: ['pond', 'river', 'lake', 'deep_sea'] },
  sea_god: { id: 'sea_god', catchRateBonusPercent: 70, waitTimeMultiplier: 0.7, qualityBonusPercent: 40, durability: 9999, qualityChancePercent: 40, unlocksZones: ['pond', 'river', 'lake', 'deep_sea'] },
};

export const rodUpgradeCosts: Record<FishingRodId, readonly number[]> = {
  bamboo: [0],
  iron: [0, 200],
  fiber: [0, 200, 500],
  carbon: [0, 200, 500, 1200],
  titanium: [0, 200, 500, 1200, 3000],
  sea_god: [0, 200, 500, 1200, 3000, 0],
};

export const rodLevelOrder: readonly FishingRodId[] = ['bamboo', 'iron', 'fiber', 'carbon', 'titanium', 'sea_god'] as const;

const weatherEffects: Record<WeatherType, FishingWeatherEffects> = {
  sunny: { waitMultiplier: 1, biteRateBonusPercent: 0, rareBonusPercent: 0 },
  cloudy: { waitMultiplier: 1.05, biteRateBonusPercent: -2, rareBonusPercent: 3 },
  rainy: { waitMultiplier: 0.85, biteRateBonusPercent: 10, rareBonusPercent: 5 },
  breezy: { waitMultiplier: 0.95, biteRateBonusPercent: 5, rareBonusPercent: 2 },
};

const zoneWeatherMatch: Record<FishingWaterZoneId, WeatherType> = {
  pond: 'sunny', river: 'rainy', lake: 'breezy', deep_sea: 'cloudy',
};

const timeOfDayEffects: Record<TimeOfDay, FishingTimeOfDayEffects> = {
  dawn: { waitMultiplier: 1, biteRateBonusPercent: 3, rareBonusPercent: 2 },
  day: { waitMultiplier: 1, biteRateBonusPercent: 0, rareBonusPercent: 0 },
  dusk: { waitMultiplier: 0.95, biteRateBonusPercent: 5, rareBonusPercent: 3 },
  night: { waitMultiplier: 0.9, biteRateBonusPercent: 8, rareBonusPercent: 8 },
};

const deepSeaTimeEffects: Record<TimeOfDay, Partial<FishingTimeOfDayEffects>> = {
  dawn: { rareBonusPercent: 12 },
  day: { biteRateBonusPercent: -5, waitMultiplier: 1.05 },
  dusk: { rareBonusPercent: 20, biteRateBonusPercent: 8 },
  night: { rareBonusPercent: 30, biteRateBonusPercent: 15, waitMultiplier: 0.8 },
};

export const baitDefinitions: Record<FishingBaitId, FishingBaitDefinition> = {
  worm: { id: 'worm', catchRateBonusPercent: 0, rareBonusPercent: 0, zoneMatch: ['pond', 'river', 'lake'], zoneMatchBonusPercent: 0 },
  rice_ball: { id: 'rice_ball', catchRateBonusPercent: 5, rareBonusPercent: 2, zoneMatch: ['pond', 'river', 'lake'], zoneMatchBonusPercent: 0 },
  insect: { id: 'insect', catchRateBonusPercent: 0, rareBonusPercent: 5, zoneMatch: ['pond', 'river'], zoneMatchBonusPercent: 10 },
  glow: { id: 'glow', catchRateBonusPercent: 0, rareBonusPercent: 10, zoneMatch: ['deep_sea'], zoneMatchBonusPercent: 15 },
  magic: { id: 'magic', catchRateBonusPercent: 10, rareBonusPercent: 12, zoneMatch: ['pond', 'river', 'lake', 'deep_sea'], zoneMatchBonusPercent: 8 },
};

export interface FishingSlotView {
  slot: FishingSlot;
  timeUntilBiteMs: number;
  timeUntilEscapedMs: number;
  isBitten: boolean;
  canCast: boolean;
  canReel: boolean;
  baitCost: number;
}

export interface FishingEnvironmentView {
  weather: WeatherType;
  season: Season;
  timeOfDay: TimeOfDay;
  waterZone: FishingWaterZoneId;
  weatherBonus: string;
  seasonBonus: string;
  timeBonus: string;
}

export interface FishingSkillView {
  level: number;
  xp: number;
  xpNeeded: number;
  dailyCatch: number;
  dailyBest: number;
  streakBest: number;
  speciesCount: number;
}

export interface FishingZoneUnlockView {
  zoneId: FishingWaterZoneId;
  unlocked: boolean;
  unlockLevel: number;
}

export interface FishingView {
  pet: PetState;
  fishing: FishingState;
  slots: readonly FishingSlotView[];
  waterZone: FishingWaterZoneId;
  rod: FishingRodId;
  bait: FishingBaitId;
  skill: FishingSkillView;
  zoneUnlocks: readonly FishingZoneUnlockView[];
  environment: FishingEnvironmentView;
  zoneName: string;
  rodName: string;
  biteRatePercent: number;
  rareBonusPercent: number;
  waitMultiplier: number;
  canCastSlots: number;
  activeCastSlots: number;
  dailyCatchLimit: number;
  dailyCastLimit: number;
  timeOfDayLabel: string;
}

const getLocalDateKey = (now: number) => {
  const date = new Date(now);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
};

const clampCount = (value: number) => Math.max(0, Math.min(999999, Math.floor(value)));

const defaultFishingSlot = (slotIndex: number): FishingSlot => ({
  slotIndex,
  state: 'idle',
  castAt: 0,
  bittenAt: 0,
  reeledAt: 0,
  streak: 0,
  durabilityUsed: 0,
});

export const defaultFishingState = (now = Date.now()): FishingState => ({
  schemaVersion: fishingSchemaVersion,
  activeWaterZone: 'pond',
  rod: 'bamboo',
  bait: 'worm',
  slots: Array.from({ length: fishingSlotCount }, (_, i) => defaultFishingSlot(i)),
  skill: { level: 1, xp: 0 },
  dailyCatchDateKey: getLocalDateKey(now),
  dailyCatchCount: 0,
  dailyCastDateKey: getLocalDateKey(now),
  dailyCastCount: 0,
});

const normalizeFishingSlot = (value: unknown, slotIndex: number, now: number): FishingSlot => {
  const fallback = defaultFishingSlot(slotIndex);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const state = isFishingSlotState(raw.state) ? raw.state : 'idle';
  return {
    slotIndex,
    state,
    fishId: isFishId(raw.fishId) ? raw.fishId : undefined,
    baitUsed: isBaitId(raw.baitUsed) ? raw.baitUsed : undefined,
    outcome: (typeof raw.outcome === 'string' && ['caught', 'lost', 'snagged', 'jammed'].includes(raw.outcome)) ? raw.outcome as FishingSlotOutcome : undefined,
    castAt: clampTimestamp(raw.castAt, now),
    bittenAt: clampTimestamp(raw.bittenAt, now),
    reeledAt: clampTimestamp(raw.reeledAt, now),
    streak: isNumber(raw.streak) ? Math.max(0, Math.floor(raw.streak)) : 0,
    durabilityUsed: isNumber(raw.durabilityUsed) ? Math.max(0, Math.floor(raw.durabilityUsed)) : 0,
  };
};

const normalizeFishingSkill = (value: unknown): FishingSkill => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { level: 1, xp: 0 };
  const raw = value as Record<string, unknown>;
  const xp = isNumber(raw.xp) ? Math.max(0, Math.floor(raw.xp)) : 0;
  let level = 1;
  for (let i = 1; i < xpThresholds.length; i += 1) { if (xp >= xpThresholds[i]) level = i + 1; else break; }
  return { level: Math.min(fishingMaxSkillLevel, level), xp };
};

export const normalizeFishingState = (value: unknown, now = Date.now()): FishingState => {
  const fallback = defaultFishingState(now);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const activeWaterZone = isWaterZoneId(raw.activeWaterZone) ? raw.activeWaterZone : fallback.activeWaterZone;
  const rod = isRodId(raw.rod) ? raw.rod : fallback.rod;
  const bait = isBaitId(raw.bait) ? raw.bait : fallback.bait;
  const rawSlots = Array.isArray(raw.slots) ? raw.slots : [];
  const slots = Array.from({ length: Math.max(rawSlots.length, fishingSlotCount) }, (_, i) => normalizeFishingSlot(rawSlots[i], i, now));
  const skill = normalizeFishingSkill(raw.skill);
  const resetDateKey = getLocalDateKey(now);
  const dailyCatchDateKey = (typeof raw.dailyCatchDateKey === 'string' ? raw.dailyCatchDateKey.trim() : '') === resetDateKey ? resetDateKey : getLocalDateKey(now);
  const dailyCastDateKey = (typeof raw.dailyCastDateKey === 'string' ? raw.dailyCastDateKey.trim() : '') === resetDateKey ? resetDateKey : getLocalDateKey(now);
  return {
    schemaVersion: fishingSchemaVersion,
    activeWaterZone,
    rod,
    bait,
    slots,
    skill,
    dailyCatchDateKey,
    dailyCatchCount: dailyCatchDateKey === resetDateKey ? Math.min(999, clampCount(isNumber(raw.dailyCatchCount) ? raw.dailyCatchCount : 0)) : 0,
    dailyCastDateKey,
    dailyCastCount: dailyCastDateKey === resetDateKey ? Math.min(9999, clampCount(isNumber(raw.dailyCastCount) ? raw.dailyCastCount : 0)) : 0,
  };
};

const getRodLevel = (rodId: FishingRodId): number => rodLevelOrder.indexOf(rodId) + 1;

const getRodDurability = (rodId: FishingRodId) => rodDefinitions[rodId].durability;

const getSkillLevel = (xp: number) => {
  let level = 1;
  for (let i = 1; i < xpThresholds.length; i += 1) { if (xp >= xpThresholds[i]) level = i + 1; else break; }
  return Math.min(fishingMaxSkillLevel, level);
};

const getXpNeeded = (level: number) => level >= fishingMaxSkillLevel ? 0 : xpThresholds[level] ?? 0;

const getDailyCatchLimit = (skillLevel: number) => Math.max(10, Math.min(60, skillLevel * 4));

export const getUnlockedWaterZones = (skillLevel: number): readonly FishingWaterZoneId[] =>
  waterZoneIds.filter((id) => waterZoneDefinitions[id].unlockedAtSkillLevel <= skillLevel);

const getCastCooldownMs = (skillLevel: number) => Math.max(1000, 3000 - (skillLevel - 1) * 80);

const getHour = (now: number): number => { const d = new Date(now); return d.getHours(); };

export const getTimeOfDay = (now: number): TimeOfDay => {
  const h = getHour(now);
  if (h >= 4 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
};

export const getTimeOfDayLabel = (time: TimeOfDay) => {
  const map = { dawn: t('ui.fishing.timeDawn'), day: t('ui.fishing.timeDay'), dusk: t('ui.fishing.timeDusk'), night: t('ui.fishing.timeNight') };
  return map[time];
};

export const getZoneNameForId = (zoneId: FishingWaterZoneId) => t('ui.fishing.zones.' + zoneId + '.name');

const getRodName = (rodId: FishingRodId) => t('ui.fishing.rods.' + rodId + '.name');

const getBiteWaitMs = (pet: PetState, zoneId: FishingWaterZoneId, slotIndex: number, now: number): number => {
  const zoneDef = waterZoneDefinitions[zoneId];
  const weatherDef = weatherEffects[pet.weather];
  const timeDef = getTimeOfDay(now);
  const timeEff = zoneId === 'deep_sea' ? { ...timeOfDayEffects[timeDef], ...deepSeaTimeEffects[timeDef] } : timeOfDayEffects[timeDef];
  const zoneWeatherMod = pet.weather === zoneWeatherMatch[zoneId] ? 0.92 : 1;
  const base = zoneDef.baseWaitMs;
  const wait = Math.round(base * weatherDef.waitMultiplier * timeEff.waitMultiplier * zoneWeatherMod);
  const variance = hashString(`fishing_bite:${pet.fishing.skill.level}:${slotIndex}:${now}`) % 15000;
  return Math.max(8000, wait + variance - 7500);
};

const getSlotBiteWindow = (skillLevel: number) => {
  const window = 3000 + (skillLevel - 1) * 400;
  return Math.min(10000, Math.max(3000, window));
};

const getEscapedGraceMs = (skillLevel: number) => {
  const base = 10000 + (skillLevel - 1) * 1000;
  return Math.min(25000, Math.max(8000, base));
};

export const getFishingEnvironmentView = (pet: PetState, now = Date.now()): FishingEnvironmentView => {
  const weather = pet.weather;
  const season = getSeasonForDate(now);
  const timeOfDay = getTimeOfDay(now);
  const waterZone = pet.fishing.activeWaterZone;
  return {
    weather,
    season,
    timeOfDay,
    waterZone,
    weatherBonus: weather === zoneWeatherMatch[waterZone] ? t('ui.fishing.weatherMatch') : t('ui.fishing.weatherNeutral'),
    seasonBonus: '',
    timeBonus: timeOfDay === 'night' ? t('ui.fishing.timeNightBonus') : t('ui.fishing.timeNeutral'),
  };
};

const getBiteRatePercent = (pet: PetState, now: number) => {
  const zoneDef = waterZoneDefinitions[pet.fishing.activeWaterZone];
  const rodDef = rodDefinitions[pet.fishing.rod];
  const baitDef = baitDefinitions[pet.fishing.bait];
  const weatherDef = weatherEffects[pet.weather];
  const timeEff = getTimeOfDay(now);
  const timeDef = pet.fishing.activeWaterZone === 'deep_sea' ? { ...timeOfDayEffects[timeEff], ...deepSeaTimeEffects[timeEff] } : timeOfDayEffects[timeEff];
  const baitMatchBonus = baitDef.zoneMatch.includes(pet.fishing.activeWaterZone) ? baitDef.zoneMatchBonusPercent : 0;
  const rareBonus = zoneDef.rareBonusPercent + rodDef.qualityBonusPercent + baitDef.rareBonusPercent + weatherDef.rareBonusPercent + (timeDef.rareBonusPercent ?? 0) + baitMatchBonus;
  const biteRate = Math.min(100, zoneDef.baseBiteRate + rodDef.catchRateBonusPercent + baitDef.catchRateBonusPercent + weatherDef.biteRateBonusPercent + (timeDef.biteRateBonusPercent ?? 0) + pet.fishing.skill.level);
  return { biteRate, rareBonus };
};

const pickWeightedFish = (pool: readonly FishId[], seed: string, rarityBonusPercent: number): FishId => {
  const weights = pool.map((fid) => fishDefinitions[fid].weight * (['rare', 'epic', 'legend'].includes(fishDefinitions[fid].rarity) ? 1 + rarityBonusPercent / 100 : 1));
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  let target = hashString(seed) % Math.max(1, Math.round(total * 100));
  for (let i = 0; i < pool.length; i += 1) {
    target -= Math.max(0, Math.round(weights[i] * 100));
    if (target < 0) return pool[i];
  }
  return pool[pool.length - 1] ?? pool[0];
};

const getDropItems = (pet: PetState, fishId: FishId, slot: FishingSlot, now: number) => {
  const items: { itemId: string; amount: number }[] = [{ itemId: fishId, amount: 1 }];
  const seed = `${fishId}:${slot.slotIndex}:${slot.castAt}:${now}`;
  const extraChance = Math.max(0, pet.fishing.skill.level * 0.5);
  if ((hashString(seed + ':bone') % 100) < Math.min(80, extraChance + 20)) items.push({ itemId: 'fish_bone', amount: 1 });
  if ((hashString(seed + ':shell') % 100) < 15) items.push({ itemId: 'seashell', amount: 1 });
  if ((hashString(seed + ':pearl') % 100) < 3) items.push({ itemId: 'pearl', amount: 1 });
  if ((hashString(seed + ':roe') % 100) < 8) items.push({ itemId: 'fish_roe', amount: 1 });
  return items;
};

export const getFishingSlotView = (slot: FishingSlot, pet: PetState, now: number): FishingSlotView => {
  const skillLevel = pet.fishing.skill.level;
  const biteWindow = getSlotBiteWindow(skillLevel);
  const escapeGrace = getEscapedGraceMs(skillLevel);
  const isBitten = slot.state === 'reeling';
  const canCast = slot.state === 'idle' || (slot.state === 'done' && now - slot.reeledAt >= getCastCooldownMs(skillLevel));
  const canReel = slot.state === 'waiting' || slot.state === 'reeling';
  let timeUntilBiteMs = 0;
  let timeUntilEscapedMs = 0;
  if (slot.state === 'casting' && slot.bittenAt > 0) timeUntilBiteMs = Math.max(0, slot.bittenAt - now);
  if (slot.state === 'reeling' && slot.reeledAt > 0) timeUntilEscapedMs = Math.max(0, slot.reeledAt + escapeGrace - now);
  return {
    slot,
    timeUntilBiteMs,
    timeUntilEscapedMs,
    isBitten,
    canCast,
    canReel,
    baitCost: 1,
  };
};

export const getFishingSkillView = (pet: PetState): FishingSkillView => ({
  level: pet.fishing.skill.level,
  xp: pet.fishing.skill.xp,
  xpNeeded: getXpNeeded(pet.fishing.skill.level),
  dailyCatch: pet.fishing.dailyCatchCount,
  dailyBest: 0,
  streakBest: 0,
  speciesCount: 0,
});

export const getFishingZoneUnlocks = (pet: PetState): readonly FishingZoneUnlockView[] =>
  waterZoneIds.map((id) => ({
    zoneId: id,
    unlocked: waterZoneDefinitions[id].unlockedAtSkillLevel <= pet.fishing.skill.level,
    unlockLevel: waterZoneDefinitions[id].unlockedAtSkillLevel,
  }));

export const getFishingView = (pet: PetState, now = Date.now()): FishingView => {
  const fishing = normalizeFishingState(pet.fishing, now);
  const skillView = getFishingSkillView(pet);
  const zoneUnlocks = getFishingZoneUnlocks(pet);
  const environment = getFishingEnvironmentView(pet, now);
  const { biteRate, rareBonus } = getBiteRatePercent(pet, now);
  const slots = fishing.slots.map((s) => getFishingSlotView(s, pet, now));
  return {
    pet,
    fishing,
    slots,
    waterZone: fishing.activeWaterZone,
    rod: fishing.rod,
    bait: fishing.bait,
    skill: skillView,
    zoneUnlocks,
    environment,
    zoneName: getZoneNameForId(fishing.activeWaterZone),
    rodName: getRodName(fishing.rod),
    biteRatePercent: biteRate,
    rareBonusPercent: rareBonus,
    waitMultiplier: 1,
    canCastSlots: slots.filter((s) => s.canCast).length,
    activeCastSlots: slots.filter((s) => s.slot.state === 'casting' || s.slot.state === 'waiting' || s.slot.state === 'reeling').length,
    dailyCatchLimit: getDailyCatchLimit(fishing.skill.level),
    dailyCastLimit: 99,
    timeOfDayLabel: getTimeOfDayLabel(getTimeOfDay(now)),
  };
};

export const getFishingXpForCatch = (fishId: FishId, streak: number, quality: number) => {
  const def = fishDefinitions[fishId];
  const rarityXp: Record<FishRarity, number> = { common: 2, rare: 5, epic: 12, legend: 30 };
  const base = rarityXp[def.rarity] + Math.max(0, streak * 0.5);
  return Math.min(20, Math.max(1, Math.round(base * (0.8 + quality * 0.4))));
};

export const advanceFishing = (pet: PetState, now = Date.now()): PetState => {
  const fishing = normalizeFishingState(pet.fishing, now);
  const skillLevel = fishing.skill.level;
  const biteWindow = getSlotBiteWindow(skillLevel);
  const escapeGrace = getEscapedGraceMs(skillLevel);
  const slots = fishing.slots.map((slot) => {
    if (slot.state === 'idle' || slot.state === 'done') return slot;
    if (slot.state === 'casting' && slot.bittenAt > 0 && now >= slot.bittenAt) {
      return { ...slot, state: 'waiting' as const, reeledAt: now };
    }
    if (slot.state === 'waiting' && now >= slot.bittenAt) {
      return { ...slot, state: 'reeling' as const, reeledAt: now };
    }
    if (slot.state === 'reeling' && slot.reeledAt > 0 && now >= slot.reeledAt + escapeGrace) {
      const streak = slot.streak + 1;
      return { ...slot, state: 'done' as const, outcome: 'lost' as const, streak, reeledAt: now };
    }
    return slot;
  });
  return { ...pet, fishing: { ...fishing, slots } };
};

export const castFishingRod = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceFishing(pet, now);
  const fishing = normalizeFishingState(current.fishing, now);
  const slot = fishing.slots[slotIndex];
  if (!slot) return { ...current, recentEvent: t('ui.fishing.invalidSlot') };
  if (slot.state === 'casting' || slot.state === 'waiting' || slot.state === 'reeling') return { ...current, recentEvent: t('ui.fishing.slotBusy') };
  if (fishing.dailyCatchCount >= getDailyCatchLimit(fishing.skill.level)) return { ...current, recentEvent: t('ui.fishing.dailyCatchLimit') };
  const biteWait = getBiteWaitMs(current, fishing.activeWaterZone, slotIndex, now);
  const bittenAt = now + biteWait;
  const nextSlot: FishingSlot = {
    ...slot,
    state: 'casting' as const,
    baitUsed: fishing.bait,
    castAt: now,
    bittenAt,
    reeledAt: 0,
    outcome: undefined,
    fishId: undefined,
    streak: 0,
  };
  return {
    ...current,
    fishing: { ...fishing, slots: fishing.slots.map((s) => s.slotIndex === slotIndex ? nextSlot : s) },
    recentEvent: t('ui.fishing.castSuccess'),
    lastInteractionAt: now,
  };
};

export const reelInFish = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceFishing(pet, now);
  const fishing = normalizeFishingState(current.fishing, now);
  const slot = fishing.slots[slotIndex];
  if (!slot) return { ...current, recentEvent: t('ui.fishing.notReeling') };
  if (slot.state !== 'waiting' && slot.state !== 'reeling') return { ...current, recentEvent: t('ui.fishing.notReeling') };

  const skillLevel = fishing.skill.level;
  const biteWindow = getSlotBiteWindow(skillLevel);
  const reactionMs = now - slot.reeledAt;
  const quality = reactionMs < biteWindow * 0.25 ? 1 : reactionMs < biteWindow * 0.55 ? 0.6 : reactionMs < biteWindow * 0.85 ? 0.3 : 0;
  const zoneDef = waterZoneDefinitions[fishing.activeWaterZone];
  const { rareBonus } = getBiteRatePercent(current, now);
  const fishId = pickWeightedFish(zoneDef.fishIds, `${fishing.activeWaterZone}:${slot.slotIndex}:${slot.castAt}:${now}`, rareBonus);
  const streak = 0;
  const nextSlot: FishingSlot = {
    ...slot,
    state: 'done' as const,
    fishId,
    outcome: 'caught' as const,
    reeledAt: now,
    streak,
    durabilityUsed: Math.min(getRodDurability(fishing.rod), slot.durabilityUsed + 1),
  };
  return {
    ...current,
    fishing: {
      ...fishing,
      slots: fishing.slots.map((s) => s.slotIndex === slotIndex ? nextSlot : s),
      dailyCatchCount: fishing.dailyCatchCount + 1,
    },
    recentEvent: t('ui.fishing.catchSuccess', { fish: t('pet.shop.items.' + fishId + '.name') }),
    lastInteractionAt: now,
  };
};
