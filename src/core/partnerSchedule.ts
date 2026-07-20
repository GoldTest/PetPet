import { t } from '../i18n';
import { recordEarnedCoins } from './achievements';
import { getSixAmResetDateKey } from './dateRewards';
import { addInventoryItem } from './items';
import { clampCoins, clampCount, clampPetHealth, clampPetStat } from './petStats';
import { getWorkSeasonCoinBonus } from './season';
import type {
  ActivePartnerSchedule,
  BuiltinItemId,
  PartnerScheduleCategory,
  PartnerScheduleOffer,
  PartnerScheduleResult,
  PartnerScheduleRewardChoice,
  PartnerScheduleSize,
  PartnerScheduleSkill,
  PartnerScheduleState,
  PetState,
  RecentActivity,
} from './petTypes';
import { hashString, isNumber } from './utils';

export const partnerScheduleSchemaVersion = 2;
export const partnerScheduleUnlockLevel = 3;
export const partnerScheduleMaxSkillLevel = 5;

const minuteMs = 60 * 1000;
const maxScheduleDurationMs = 24 * 60 * 60 * 1000;

export interface PartnerScheduleDefinition {
  id: string;
  category: PartnerScheduleCategory;
  size: PartnerScheduleSize;
  activity: RecentActivity;
  durationMinutes: number;
  energyCost: number;
  hungerCost: number;
  moodCost: number;
  requiredEnergy: number;
  requiredHunger: number;
  requiredMood: number;
  requiredHealth: number;
}

const categoryActivities: Record<PartnerScheduleCategory, RecentActivity> = {
  study: 'reading_books',
  cooking: 'work_food',
  garden: 'work_plants',
  exercise: 'workout',
};

const sizeRules: Record<PartnerScheduleSize, Omit<PartnerScheduleDefinition, 'id' | 'category' | 'activity'>> = {
  short: {
    size: 'short',
    durationMinutes: 45,
    energyCost: 12,
    hungerCost: 4,
    moodCost: 2,
    requiredEnergy: 30,
    requiredHunger: 25,
    requiredMood: 20,
    requiredHealth: 40,
  },
  standard: {
    size: 'standard',
    durationMinutes: 120,
    energyCost: 30,
    hungerCost: 10,
    moodCost: 5,
    requiredEnergy: 55,
    requiredHunger: 40,
    requiredMood: 30,
    requiredHealth: 45,
  },
  long: {
    size: 'long',
    durationMinutes: 240,
    energyCost: 55,
    hungerCost: 18,
    moodCost: 8,
    requiredEnergy: 90,
    requiredHunger: 70,
    requiredMood: 40,
    requiredHealth: 55,
  },
};

const templateIds: Record<PartnerScheduleCategory, Record<PartnerScheduleSize, string>> = {
  study: { short: 'study_notes', standard: 'study_archive', long: 'study_research' },
  cooking: { short: 'cooking_snack', standard: 'cooking_lunch', long: 'cooking_feast' },
  garden: { short: 'garden_seedlings', standard: 'garden_orchard', long: 'garden_field_day' },
  exercise: { short: 'exercise_walk', standard: 'exercise_training', long: 'exercise_challenge' },
};

const categories: readonly PartnerScheduleCategory[] = ['study', 'cooking', 'garden', 'exercise'];
const sizes: readonly PartnerScheduleSize[] = ['short', 'standard', 'long'];
const categorySet = new Set<PartnerScheduleCategory>(categories);
const sizeSet = new Set<PartnerScheduleSize>(sizes);

const legacyFocusMinutes: Record<PartnerScheduleSize, number> = {
  short: 25,
  standard: 50,
  long: 100,
};

const sizeCoinMultipliers: Record<PartnerScheduleSize, number> = {
  short: 1.6,
  standard: 4.2,
  long: 8.5,
};

const sizeSkillXp: Record<PartnerScheduleSize, number> = {
  short: 10,
  standard: 23,
  long: 50,
};

export const partnerScheduleDefinitions: readonly PartnerScheduleDefinition[] = categories.flatMap((category) =>
  sizes.map((size) => ({
    id: templateIds[category][size],
    category,
    activity: categoryActivities[category],
    ...sizeRules[size],
  })),
);

const definitionMap = new Map(partnerScheduleDefinitions.map((definition) => [definition.id, definition]));

export const getPartnerScheduleDefinition = (id: string) => definitionMap.get(id);

export const getPartnerScheduleActivity = (category: PartnerScheduleCategory) => categoryActivities[category];

const defaultSkill = (): PartnerScheduleSkill => ({ level: 1, xp: 0 });

const defaultSkills = (): PartnerScheduleState['skills'] => ({
  study: defaultSkill(),
  cooking: defaultSkill(),
  garden: defaultSkill(),
  exercise: defaultSkill(),
});

const getBoardSizes = (level: number): PartnerScheduleSize[] => {
  if (level >= 8) return ['short', 'standard', 'long'];
  if (level >= 5) return ['short', 'standard', 'standard'];
  return ['short', 'short', 'standard'];
};

const generateOffers = (level: number, createdAt: number, dateKey: string): PartnerScheduleOffer[] => {
  if (level < partnerScheduleUnlockLevel) return [];
  const usedCategories = new Set<PartnerScheduleCategory>();
  return getBoardSizes(level).map((size, index) => {
    const available = categories.filter((category) => !usedCategories.has(category));
    const pool = available.length > 0 ? available : [...categories];
    const category = pool[hashString(`${dateKey}:${Math.floor(createdAt)}:${level}:${index}`) % pool.length];
    usedCategories.add(category);
    const templateId = templateIds[category][size];
    return {
      id: `${dateKey}:${index}:${templateId}`,
      templateId,
      dateKey,
    };
  });
};

type PartnerSchedulePetSnapshot = Pick<PetState, 'level' | 'createdAt'>;

export const defaultPartnerScheduleState = (
  pet: PartnerSchedulePetSnapshot,
  now = Date.now(),
): PartnerScheduleState => {
  const boardDateKey = getSixAmResetDateKey(now);
  return {
    schemaVersion: partnerScheduleSchemaVersion,
    boardDateKey,
    offers: generateOffers(pet.level, pet.createdAt, boardDateKey),
    completedOfferIds: [],
    skills: defaultSkills(),
  };
};

const normalizeSkill = (value: unknown): PartnerScheduleSkill => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultSkill();
  const raw = value as Record<string, unknown>;
  const level = Math.max(1, Math.min(partnerScheduleMaxSkillLevel, clampCount(isNumber(raw.level) ? raw.level : 1)));
  const xp = level >= partnerScheduleMaxSkillLevel ? 0 : Math.min(9999, clampCount(isNumber(raw.xp) ? raw.xp : 0));
  return { level, xp };
};

const normalizeOffers = (value: unknown, dateKey: string): PartnerScheduleOffer[] => {
  if (!Array.isArray(value)) return [];
  const offers: PartnerScheduleOffer[] = [];
  value.forEach((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const raw = item as Record<string, unknown>;
    if (typeof raw.id !== 'string' || typeof raw.templateId !== 'string') return;
    if (!definitionMap.has(raw.templateId) || offers.some((offer) => offer.id === raw.id)) return;
    offers.push({ id: raw.id.slice(0, 128), templateId: raw.templateId, dateKey });
  });
  return offers.slice(0, 3);
};

const getNormalizedCoinReward = (rawReward: unknown, level: number, size: PartnerScheduleSize, now: number) => {
  if (isNumber(rawReward)) return Math.min(999999, clampCount(rawReward));
  const workBase = 24 + Math.max(0, level - 1) + getWorkSeasonCoinBonus(now);
  return Math.max(1, Math.round(workBase * sizeCoinMultipliers[size] * 1.15));
};

const normalizeActive = (value: unknown, level: number, now: number): ActivePartnerSchedule | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const definition = typeof raw.templateId === 'string' ? definitionMap.get(raw.templateId) : undefined;
  if (!definition || typeof raw.offerId !== 'string') return undefined;
  const durationMs = definition.durationMinutes * minuteMs;
  const savedStartedAt = Math.max(0, Math.min(now, isNumber(raw.startedAt) ? Math.floor(raw.startedAt) : now));
  const isLegacyTogether = raw.mode === 'together';
  let startedAt = savedStartedAt;
  let endsAt: number;

  if (isLegacyTogether) {
    const requiredFocusMs = isNumber(raw.requiredFocusMs) && raw.requiredFocusMs > 0
      ? raw.requiredFocusMs
      : legacyFocusMinutes[definition.size] * minuteMs;
    const focusProgressMs = Math.max(0, isNumber(raw.focusProgressMs) ? raw.focusProgressMs : 0);
    const progressRatio = Math.min(1, focusProgressMs / requiredFocusMs);
    const migratedProgressMs = Math.floor(durationMs * progressRatio);
    startedAt = now;
    endsAt = now + Math.max(0, durationMs - migratedProgressMs);
  } else {
    const fallbackEndsAt = savedStartedAt + durationMs;
    endsAt = Math.max(
      savedStartedAt,
      Math.min(savedStartedAt + maxScheduleDurationMs, isNumber(raw.endsAt) ? Math.floor(raw.endsAt) : fallbackEndsAt),
    );
  }

  return {
    offerId: raw.offerId.slice(0, 128),
    templateId: definition.id,
    category: definition.category,
    size: definition.size,
    startedAt,
    endsAt,
    coinReward: getNormalizedCoinReward(raw.coinReward, level, definition.size, now),
    skillXp: Math.min(9999, clampCount(isNumber(raw.skillXp) ? raw.skillXp : sizeSkillXp[definition.size])),
  };
};

const normalizeResult = (value: unknown, level: number, now: number): PartnerScheduleResult | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const definition = typeof raw.templateId === 'string' ? definitionMap.get(raw.templateId) : undefined;
  if (!definition || typeof raw.offerId !== 'string') return undefined;
  return {
    offerId: raw.offerId.slice(0, 128),
    templateId: definition.id,
    category: definition.category,
    size: definition.size,
    completedAt: Math.max(0, Math.min(now, isNumber(raw.completedAt) ? Math.floor(raw.completedAt) : now)),
    coinReward: getNormalizedCoinReward(raw.coinReward, level, definition.size, now),
    skillXp: Math.min(9999, clampCount(isNumber(raw.skillXp) ? raw.skillXp : sizeSkillXp[definition.size])),
  };
};

export const normalizePartnerScheduleState = (
  value: unknown,
  pet: PartnerSchedulePetSnapshot,
  now = Date.now(),
  settleExpired = true,
): PartnerScheduleState => {
  const fallback = defaultPartnerScheduleState(pet, now);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const rawSkills = raw.skills && typeof raw.skills === 'object' && !Array.isArray(raw.skills)
    ? raw.skills as Record<string, unknown>
    : {};
  const skills = defaultSkills();
  categories.forEach((category) => {
    skills[category] = normalizeSkill(rawSkills[category]);
  });
  const boardDateKey = getSixAmResetDateKey(now);
  const savedDateKey = typeof raw.boardDateKey === 'string' ? raw.boardDateKey : '';
  const savedOffers = savedDateKey === boardDateKey ? normalizeOffers(raw.offers, boardDateKey) : [];
  const offers = pet.level < partnerScheduleUnlockLevel
    ? []
    : savedOffers.length === 3
      ? savedOffers
      : generateOffers(pet.level, pet.createdAt, boardDateKey);
  const completedOfferIds = savedDateKey === boardDateKey && Array.isArray(raw.completedOfferIds)
    ? Array.from(new Set(raw.completedOfferIds.filter((id): id is string => typeof id === 'string').map((id) => id.slice(0, 128)))).slice(0, 3)
    : [];
  let pendingResult = normalizeResult(raw.pendingResult, pet.level, now);
  let active = pendingResult ? undefined : normalizeActive(raw.active, pet.level, now);
  if (settleExpired && active && active.endsAt <= now) {
    pendingResult = {
      offerId: active.offerId,
      templateId: active.templateId,
      category: active.category,
      size: active.size,
      completedAt: active.endsAt,
      coinReward: active.coinReward,
      skillXp: active.skillXp,
    };
    active = undefined;
  }
  return {
    schemaVersion: partnerScheduleSchemaVersion,
    boardDateKey,
    offers,
    completedOfferIds,
    active,
    pendingResult,
    skills,
  };
};

const refreshBoard = (pet: PetState, now: number): PetState => {
  const dateKey = getSixAmResetDateKey(now);
  if (pet.partnerSchedule.boardDateKey === dateKey && (pet.level < partnerScheduleUnlockLevel || pet.partnerSchedule.offers.length === 3)) return pet;
  return {
    ...pet,
    partnerSchedule: {
      ...pet.partnerSchedule,
      boardDateKey: dateKey,
      offers: generateOffers(pet.level, pet.createdAt, dateKey),
      completedOfferIds: [],
    },
  };
};

const finishActiveSchedule = (pet: PetState, completedAt: number): PetState => {
  const active = pet.partnerSchedule.active;
  if (!active || pet.partnerSchedule.pendingResult) return pet;
  return {
    ...pet,
    recentActivity: 'idle',
    recentActivityUntil: 0,
    recentEvent: t('pet.partnerSchedule.completed', { name: pet.name }),
    partnerSchedule: {
      ...pet.partnerSchedule,
      active: undefined,
      pendingResult: {
        offerId: active.offerId,
        templateId: active.templateId,
        category: active.category,
        size: active.size,
        completedAt,
        coinReward: active.coinReward,
        skillXp: active.skillXp,
      },
    },
  };
};

export const advancePartnerSchedule = (pet: PetState, now = Date.now()): PetState => {
  const current = refreshBoard(pet, now);
  const active = current.partnerSchedule.active;
  if (!active) return current;
  if (now >= active.endsAt) {
    return finishActiveSchedule(current, active.endsAt);
  }
  return current;
};

export const getPartnerScheduleCoinReward = (
  pet: PetState,
  size: PartnerScheduleSize,
  now = Date.now(),
) => {
  const workBase = 24 + Math.max(0, pet.level - 1) + getWorkSeasonCoinBonus(now);
  return Math.max(1, Math.round(workBase * sizeCoinMultipliers[size] * 1.15));
};

export const getPartnerScheduleSkillXpReward = (size: PartnerScheduleSize) => sizeSkillXp[size];

export interface PartnerScheduleStartCheck {
  canStart: boolean;
  reason?: 'locked' | 'busy' | 'pending' | 'completed' | 'sleeping' | 'energy' | 'hunger' | 'mood' | 'health' | 'missing';
}

export const getPartnerScheduleStartCheck = (
  pet: PetState,
  offerId: string,
  now = Date.now(),
): PartnerScheduleStartCheck => {
  const current = advancePartnerSchedule(pet, now);
  if (current.level < partnerScheduleUnlockLevel) return { canStart: false, reason: 'locked' };
  if (current.partnerSchedule.pendingResult) return { canStart: false, reason: 'pending' };
  if (current.partnerSchedule.active) return { canStart: false, reason: 'busy' };
  if (current.partnerSchedule.completedOfferIds.includes(offerId)) return { canStart: false, reason: 'completed' };
  if (current.isSleeping) return { canStart: false, reason: 'sleeping' };
  const offer = current.partnerSchedule.offers.find((item) => item.id === offerId);
  const definition = offer ? definitionMap.get(offer.templateId) : undefined;
  if (!offer || !definition) return { canStart: false, reason: 'missing' };
  if (current.energy < definition.requiredEnergy) return { canStart: false, reason: 'energy' };
  if (current.hunger < definition.requiredHunger) return { canStart: false, reason: 'hunger' };
  if (current.mood < definition.requiredMood) return { canStart: false, reason: 'mood' };
  if (current.health < definition.requiredHealth) return { canStart: false, reason: 'health' };
  return { canStart: true };
};

export const startPartnerSchedule = (
  pet: PetState,
  offerId: string,
  now = Date.now(),
): PetState => {
  const current = advancePartnerSchedule(pet, now);
  const check = getPartnerScheduleStartCheck(current, offerId, now);
  if (!check.canStart) {
    return { ...current, recentEvent: t(`pet.partnerSchedule.startBlocked.${check.reason ?? 'missing'}`, { name: current.name }) };
  }
  const offer = current.partnerSchedule.offers.find((item) => item.id === offerId);
  const definition = offer ? definitionMap.get(offer.templateId) : undefined;
  if (!offer || !definition) return current;
  const active: ActivePartnerSchedule = {
    offerId: offer.id,
    templateId: definition.id,
    category: definition.category,
    size: definition.size,
    startedAt: now,
    endsAt: now + definition.durationMinutes * minuteMs,
    coinReward: getPartnerScheduleCoinReward(current, definition.size, now),
    skillXp: getPartnerScheduleSkillXpReward(definition.size),
  };
  return {
    ...current,
    energy: clampPetStat(current, current.energy - definition.energyCost),
    hunger: clampPetStat(current, current.hunger - definition.hungerCost),
    mood: clampPetStat(current, current.mood - definition.moodCost),
    recentActivity: definition.activity,
    recentActivityUntil: active.endsAt,
    recentEvent: t('pet.partnerSchedule.started', { name: current.name }),
    lastInteractionAt: now,
    lastEnergyRecoveryAt: now,
    partnerSchedule: { ...current.partnerSchedule, active },
  };
};

export const isPartnerSchedulePetBusy = (pet: Pick<PetState, 'partnerSchedule'>) =>
  Boolean(pet.partnerSchedule.active);

export const cancelPartnerSchedule = (pet: PetState, now = Date.now()): PetState => {
  const current = advancePartnerSchedule(pet, now);
  if (!current.partnerSchedule.active) return current;
  return {
    ...current,
    recentActivity: 'idle',
    recentActivityUntil: 0,
    recentEvent: t('pet.partnerSchedule.cancelled', { name: current.name }),
    lastInteractionAt: now,
    partnerSchedule: { ...current.partnerSchedule, active: undefined },
  };
};

export const getPartnerScheduleSkillXpNeeded = (level: number) =>
  level >= partnerScheduleMaxSkillLevel ? 0 : 20 + Math.max(1, level) * 15;

const addSkillXp = (skill: PartnerScheduleSkill, amount: number): PartnerScheduleSkill => {
  let level = skill.level;
  let xp = skill.xp + Math.max(0, amount);
  while (level < partnerScheduleMaxSkillLevel) {
    const needed = getPartnerScheduleSkillXpNeeded(level);
    if (xp < needed) break;
    xp -= needed;
    level += 1;
  }
  return { level, xp: level >= partnerScheduleMaxSkillLevel ? 0 : xp };
};

export interface PartnerScheduleClaimPreview {
  coins: number;
  skillXp: number;
  itemId?: BuiltinItemId;
  itemAmount?: number;
  energy?: number;
  health?: number;
  mood?: number;
}

export const getPartnerScheduleClaimPreview = (
  result: PartnerScheduleResult,
  choice: PartnerScheduleRewardChoice,
): PartnerScheduleClaimPreview => {
  if (choice === 'coins' || result.size === 'short') {
    return { coins: result.coinReward, skillXp: result.skillXp };
  }
  const base: PartnerScheduleClaimPreview = {
    coins: Math.max(1, Math.round(result.coinReward * 0.8)),
    skillXp: Math.max(1, Math.round(result.skillXp * 1.5)),
  };
  const amount = result.size === 'long' ? 2 : 1;
  if (result.category === 'study') return { ...base, skillXp: result.skillXp * 2, mood: 8 * amount };
  if (result.category === 'cooking') return { ...base, itemId: 'bento', itemAmount: amount };
  if (result.category === 'garden') return { ...base, itemId: 'fruit_tree_sapling', itemAmount: amount };
  return { ...base, energy: 10 * amount, health: 6 * amount };
};

export const claimPartnerScheduleResult = (
  pet: PetState,
  choice: PartnerScheduleRewardChoice,
  now = Date.now(),
): PetState => {
  const current = advancePartnerSchedule(pet, now);
  const result = current.partnerSchedule.pendingResult;
  if (!result) return { ...current, recentEvent: t('pet.partnerSchedule.noResult') };
  const safeChoice = result.size === 'short' ? 'coins' : choice;
  const reward = getPartnerScheduleClaimPreview(result, safeChoice);
  const skills = {
    ...current.partnerSchedule.skills,
    [result.category]: addSkillXp(current.partnerSchedule.skills[result.category], reward.skillXp),
  };
  const inventory = reward.itemId
    ? addInventoryItem(current.inventory, reward.itemId, reward.itemAmount ?? 1)
    : current.inventory;
  const belongsToCurrentBoard = current.partnerSchedule.offers.some((offer) => offer.id === result.offerId);
  const completedOfferIds = belongsToCurrentBoard
    ? Array.from(new Set([...current.partnerSchedule.completedOfferIds, result.offerId])).slice(-3)
    : current.partnerSchedule.completedOfferIds;
  const rewarded = recordEarnedCoins({
    ...current,
    coins: clampCoins(current.coins + reward.coins),
    inventory,
    energy: clampPetStat(current, current.energy + (reward.energy ?? 0)),
    health: clampPetHealth(current, current.health + (reward.health ?? 0)),
    mood: clampPetStat(current, current.mood + (reward.mood ?? 0)),
    recentEvent: t(`pet.partnerSchedule.claimed.${safeChoice}`, { coins: reward.coins }),
    lastInteractionAt: now,
    partnerSchedule: {
      ...current.partnerSchedule,
      completedOfferIds,
      pendingResult: undefined,
      skills,
    },
  }, reward.coins);
  return rewarded;
};

export const getPartnerScheduleProgress = (active: ActivePartnerSchedule, now = Date.now()) => {
  const targetMs = Math.max(1, active.endsAt - active.startedAt);
  const progressMs = Math.min(targetMs, Math.max(0, now - active.startedAt));
  return {
    targetMs,
    progressMs,
    remainingMs: Math.max(0, active.endsAt - now),
    percent: Math.min(100, (progressMs / targetMs) * 100),
  };
};

export const isPartnerScheduleCategory = (value: unknown): value is PartnerScheduleCategory =>
  typeof value === 'string' && categorySet.has(value as PartnerScheduleCategory);

export const isPartnerScheduleSize = (value: unknown): value is PartnerScheduleSize =>
  typeof value === 'string' && sizeSet.has(value as PartnerScheduleSize);
