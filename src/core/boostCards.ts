import { t } from '../i18n';
import { clampCoins, clampCount } from './petStats';
import type { BoostCardId, BoostCardState, PetState } from './petTypes';
import { getLocalDateKey, isNumber } from './utils';

export const boostCardSchemaVersion = 1;

export const boostCardIds: readonly BoostCardId[] = ['friend_pass', 'best_friend_pass'];

export const boostCardDurationMs = 30 * 24 * 60 * 60 * 1000;

export const boostCardMaxDurationMs = 90 * 24 * 60 * 60 * 1000;

export interface BoostCardDefinition {
  id: BoostCardId;
  priceHearts: number;
  dailyCoins: number;
  workBonusCoins: number;
  workBonusDailyLimit: number;
  extraHeartChancePercent: number;
  extraHeartDailyLimit: number;
  gardenGrowTimeMultiplier: number;
  gardenExtraDropChancePercent: number;
  gardenExtraDropDailyLimit: number;
}

export interface BoostCardEffects extends BoostCardDefinition {
  activeCardId?: BoostCardId;
}

export const boostCardDefinitions: Record<BoostCardId, BoostCardDefinition> = {
  friend_pass: {
    id: 'friend_pass',
    priceHearts: 10,
    dailyCoins: 15,
    workBonusCoins: 3,
    workBonusDailyLimit: 60,
    extraHeartChancePercent: 10,
    extraHeartDailyLimit: 10,
    gardenGrowTimeMultiplier: 1,
    gardenExtraDropChancePercent: 0,
    gardenExtraDropDailyLimit: 0,
  },
  best_friend_pass: {
    id: 'best_friend_pass',
    priceHearts: 100,
    dailyCoins: 50,
    workBonusCoins: 8,
    workBonusDailyLimit: 100,
    extraHeartChancePercent: 30,
    extraHeartDailyLimit: 20,
    gardenGrowTimeMultiplier: 0.88,
    gardenExtraDropChancePercent: 20,
    gardenExtraDropDailyLimit: 10,
  },
};

const emptyBoostCardEffects: BoostCardEffects = {
  ...boostCardDefinitions.friend_pass,
  dailyCoins: 0,
  workBonusCoins: 0,
  workBonusDailyLimit: 0,
  extraHeartChancePercent: 0,
  extraHeartDailyLimit: 0,
  gardenGrowTimeMultiplier: 1,
  gardenExtraDropChancePercent: 0,
  gardenExtraDropDailyLimit: 0,
};

const boostCardIdSet = new Set<BoostCardId>(boostCardIds);

const isBoostCardId = (value: unknown): value is BoostCardId =>
  typeof value === 'string' && boostCardIdSet.has(value as BoostCardId);

export const getSixAmResetDateKey = (time: number) => {
  const date = new Date(time);
  if (date.getHours() < 6) date.setDate(date.getDate() - 1);
  return getLocalDateKey(date.getTime());
};

const clampExpiresAt = (value: unknown, now: number) =>
  isNumber(value) ? Math.max(0, Math.min(Math.floor(value), now + boostCardMaxDurationMs)) : 0;

const backfillPurchasedDaysFromExpiresAt = (value: unknown, now: number) => {
  const expiresAt = clampExpiresAt(value, now);
  if (expiresAt <= now) return 0;
  return Math.min(90, Math.ceil((expiresAt - now) / boostCardDurationMs) * 30);
};

export const defaultBoostCardState = (now = Date.now()): BoostCardState => ({
  schemaVersion: boostCardSchemaVersion,
  friendPassExpiresAt: 0,
  bestFriendPassExpiresAt: 0,
  bestFriendPassPurchasedDays: 0,
  dailyDateKey: getSixAmResetDateKey(now),
  dailyWorkBonusCoinsUsed: 0,
  dailyExtraHeartCount: 0,
  dailyGardenExtraDrops: 0,
});

export const normalizeBoostCardState = (value: unknown, now = Date.now()): BoostCardState => {
  const fallback = defaultBoostCardState(now);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;

  const raw = value as Record<string, unknown>;
  const resetDateKey = getSixAmResetDateKey(now);
  const rawDailyDateKey = typeof raw.dailyDateKey === 'string' ? raw.dailyDateKey.trim().slice(0, 16) : fallback.dailyDateKey;
  const isCurrentDailyState = rawDailyDateKey === resetDateKey;
  const dailyCoinsClaimedCardId =
    isCurrentDailyState && isBoostCardId(raw.dailyCoinsClaimedCardId) ? raw.dailyCoinsClaimedCardId : undefined;

  return {
    schemaVersion: boostCardSchemaVersion,
    friendPassExpiresAt: clampExpiresAt(raw.friendPassExpiresAt, now),
    bestFriendPassExpiresAt: clampExpiresAt(raw.bestFriendPassExpiresAt, now),
    bestFriendPassPurchasedDays: Math.min(99999, clampCount(isNumber(raw.bestFriendPassPurchasedDays) ? raw.bestFriendPassPurchasedDays : backfillPurchasedDaysFromExpiresAt(raw.bestFriendPassExpiresAt, now))),
    dailyDateKey: resetDateKey,
    dailyCoinsClaimedCardId,
    dailyWorkBonusCoinsUsed:
      isCurrentDailyState ? Math.min(999, clampCount(isNumber(raw.dailyWorkBonusCoinsUsed) ? raw.dailyWorkBonusCoinsUsed : 0)) : 0,
    dailyExtraHeartCount:
      isCurrentDailyState ? Math.min(99, clampCount(isNumber(raw.dailyExtraHeartCount) ? raw.dailyExtraHeartCount : 0)) : 0,
    dailyGardenExtraDrops:
      isCurrentDailyState ? Math.min(99, clampCount(isNumber(raw.dailyGardenExtraDrops) ? raw.dailyGardenExtraDrops : 0)) : 0,
  };
};

export const getActiveBoostCard = (pet: PetState, now = Date.now()): BoostCardId | undefined => {
  const boostCards = normalizeBoostCardState(pet.boostCards, now);
  if (boostCards.bestFriendPassExpiresAt > now) return 'best_friend_pass';
  if (boostCards.friendPassExpiresAt > now) return 'friend_pass';
  return undefined;
};

export const getBoostCardEffects = (pet: PetState, now = Date.now()): BoostCardEffects => {
  const activeCardId = getActiveBoostCard(pet, now);
  return activeCardId ? { ...boostCardDefinitions[activeCardId], activeCardId } : emptyBoostCardEffects;
};

export const canClaimBoostCardDailyCoins = (pet: PetState, now = Date.now()) => {
  const boostCards = normalizeBoostCardState(pet.boostCards, now);
  const activeCardId = getActiveBoostCard({ ...pet, boostCards }, now);
  return Boolean(activeCardId && boostCards.dailyCoinsClaimedCardId !== activeCardId);
};

const passExpiresAtKey = (cardId: BoostCardId) =>
  cardId === 'friend_pass' ? 'friendPassExpiresAt' : 'bestFriendPassExpiresAt';

export const buyBoostCard = (pet: PetState, cardId: BoostCardId, now = Date.now()): PetState => {
  const definition = boostCardDefinitions[cardId];
  const currentBoostCards = normalizeBoostCardState(pet.boostCards, now);
  if (cardId === 'friend_pass' && currentBoostCards.bestFriendPassExpiresAt > now) {
    return { ...pet, boostCards: currentBoostCards, recentEvent: t('pet.boostCards.bestFriendBlocksFriend') };
  }
  const expiresAtKey = passExpiresAtKey(cardId);
  const currentExpiresAt = currentBoostCards[expiresAtKey];
  const maxExpiresAt = now + boostCardMaxDurationMs;
  const extensionStart = Math.max(now, currentExpiresAt);
  const nextExpiresAt = extensionStart + boostCardDurationMs;

  if (currentExpiresAt >= maxExpiresAt || nextExpiresAt > maxExpiresAt) {
    return { ...pet, boostCards: currentBoostCards, recentEvent: t('pet.boostCards.maxDuration') };
  }

  if (pet.hearts < definition.priceHearts) {
    return { ...pet, boostCards: currentBoostCards, recentEvent: t('pet.boostCards.notEnoughHearts', { hearts: definition.priceHearts }) };
  }

  return {
    ...pet,
    hearts: clampCount(pet.hearts - definition.priceHearts),
    boostCards: {
      ...currentBoostCards,
      [expiresAtKey]: nextExpiresAt,
      bestFriendPassPurchasedDays: cardId === 'best_friend_pass'
        ? clampCount(currentBoostCards.bestFriendPassPurchasedDays + 30)
        : currentBoostCards.bestFriendPassPurchasedDays,
    },
    recentEvent: t('pet.boostCards.buySuccess', { card: t(`ui.boostCards.cards.${cardId}.name`) }),
    lastInteractionAt: now,
  };
};

export const claimBoostCardDailyCoins = (pet: PetState, now = Date.now()): { pet: PetState; coins: number } => {
  const boostCards = normalizeBoostCardState(pet.boostCards, now);
  const activeCardId = getActiveBoostCard({ ...pet, boostCards }, now);
  if (!activeCardId) {
    return { pet: { ...pet, boostCards, recentEvent: t('pet.boostCards.noActiveCard') }, coins: 0 };
  }

  if (boostCards.dailyCoinsClaimedCardId === activeCardId) {
    return { pet: { ...pet, boostCards, recentEvent: t('pet.boostCards.dailyCoinsClaimed') }, coins: 0 };
  }

  const coins = boostCardDefinitions[activeCardId].dailyCoins;
  return {
    pet: {
      ...pet,
      coins: clampCoins(pet.coins + coins),
      boostCards: {
        ...boostCards,
        dailyCoinsClaimedCardId: activeCardId,
      },
      recentEvent: t('pet.boostCards.claimDailyCoins', { coins }),
      lastInteractionAt: now,
    },
    coins,
  };
};

export const applyBoostCardWorkBonus = (pet: PetState, now = Date.now()) => {
  const boostCards = normalizeBoostCardState(pet.boostCards, now);
  const effects = getBoostCardEffects({ ...pet, boostCards }, now);
  const remaining = Math.max(0, effects.workBonusDailyLimit - boostCards.dailyWorkBonusCoinsUsed);
  const bonusCoins = Math.min(effects.workBonusCoins, remaining);

  return {
    bonusCoins,
    boostCards: bonusCoins > 0
      ? { ...boostCards, dailyWorkBonusCoinsUsed: boostCards.dailyWorkBonusCoinsUsed + bonusCoins }
      : boostCards,
  };
};

export const applyBoostCardHeartBonus = (pet: PetState, gainedHearts: number, now = Date.now()) => {
  const boostCards = normalizeBoostCardState(pet.boostCards, now);
  const effects = getBoostCardEffects({ ...pet, boostCards }, now);
  const extraHearts = gainedHearts > 0 && effects.extraHeartChancePercent > 0 && Math.random() * 100 < effects.extraHeartChancePercent ? 1 : 0;

  return {
    extraHearts,
    boostCards: extraHearts > 0
      ? { ...boostCards, dailyExtraHeartCount: boostCards.dailyExtraHeartCount + extraHearts }
      : boostCards,
  };
};

export const spendBoostCardGardenExtraDrop = (pet: PetState, now = Date.now()) => {
  const boostCards = normalizeBoostCardState(pet.boostCards, now);
  const effects = getBoostCardEffects({ ...pet, boostCards }, now);
  const remaining = Math.max(0, effects.gardenExtraDropDailyLimit - boostCards.dailyGardenExtraDrops);
  const didSpend = remaining > 0;

  return {
    didSpend,
    boostCards: didSpend
      ? { ...boostCards, dailyGardenExtraDrops: boostCards.dailyGardenExtraDrops + 1 }
      : boostCards,
  };
};