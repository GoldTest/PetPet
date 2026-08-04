import { t } from '../i18n';
import { incrementWishingWellWishCount } from './achievements';
import { getDailyResetDateKey } from './dailyReset';
import { addInventoryItem } from './items';
import { clampCoins, clampCount } from './petStats';
import type { ItemId, PetState } from './petTypes';
import type { WishingWellState } from './petTypes';
import { pickRandom } from './utils';

export type { WishingWellState };

export const wishingWellSchemaVersion = 1;

export const defaultWishingWellState = (now = Date.now()): WishingWellState => ({
  schemaVersion: wishingWellSchemaVersion,
  dateKey: getDailyResetDateKey(now),
  freeWishesUsed: 0,
  paidWishesUsed: 0,
  paidWishBaseCost: 50,
  totalWishes: 0,
  legendaryCount: 0,
  hiddenCount: 0,
  pity: 0,
});

export const dailyFreeWishLimit = 1;
export const dailyPaidWishLimit = 5;
export const paidWishCostIncrement = 20;
export const pityPerMiss = 10;
export const pityMax = 100;

export const normalizeWishingWellState = (value: unknown, now = Date.now()): WishingWellState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultWishingWellState(now);
  const raw = value as Record<string, unknown>;
  return {
    schemaVersion: raw.schemaVersion === wishingWellSchemaVersion ? wishingWellSchemaVersion : wishingWellSchemaVersion,
    dateKey: typeof raw.dateKey === 'string' ? raw.dateKey.slice(0, 16) : getDailyResetDateKey(now),
    freeWishesUsed: clampCount(typeof raw.freeWishesUsed === 'number' ? raw.freeWishesUsed : 0),
    paidWishesUsed: clampCount(typeof raw.paidWishesUsed === 'number' ? raw.paidWishesUsed : 0),
    paidWishBaseCost: typeof raw.paidWishBaseCost === 'number' ? Math.max(50, Math.floor(raw.paidWishBaseCost)) : 50,
    totalWishes: clampCount(typeof raw.totalWishes === 'number' ? raw.totalWishes : 0),
    legendaryCount: clampCount(typeof raw.legendaryCount === 'number' ? raw.legendaryCount : 0),
    hiddenCount: clampCount(typeof raw.hiddenCount === 'number' ? raw.hiddenCount : 0),
    pity: clampCount(typeof raw.pity === 'number' ? raw.pity : 0),
  };
};

export type WishRarity = 'common' | 'rare' | 'epic' | 'legend' | 'hidden';

export interface WishReward {
  rarity: WishRarity;
  label: string;
  coins?: number;
  hearts?: number;
  items?: { itemId: ItemId; amount: number }[];
  moodBoost?: number;
}

interface RewardPoolEntry {
  rarity: WishRarity;
  labelKey: string;
  weight: number;
  generate: (pet: PetState, weather: string) => WishReward;
}

const commonItems: readonly { itemId: ItemId; amount: number }[] = [
  { itemId: 'emergency_biscuit', amount: 1 },
  { itemId: 'orange', amount: 1 },
  { itemId: 'apple', amount: 1 },
  { itemId: 'tomato_seed', amount: 1 },
];

const rareItems: readonly { itemId: ItemId; amount: number }[] = [
  { itemId: 'bento', amount: 1 },
  { itemId: 'banana', amount: 1 },
  { itemId: 'strawberry_milk', amount: 1 },
  { itemId: 'fruit_tree_sapling', amount: 1 },
  { itemId: 'lucky_charm', amount: 1 },
];

const epicItems: readonly { itemId: ItemId; amount: number }[] = [
  { itemId: 'nutri_meal', amount: 1 },
  { itemId: 'watermelon', amount: 1 },
  { itemId: 'heart_fertilizer', amount: 1 },
  { itemId: 'star_shard', amount: 1 },
  { itemId: 'golden_apple', amount: 1 },
];

const legendItems: readonly { itemId: ItemId; amount: number }[] = [
  { itemId: 'golden_apple', amount: 2 },
  { itemId: 'star_shard', amount: 2 },
  { itemId: 'skill_fruit', amount: 1 },
  { itemId: 'heart_fertilizer', amount: 2 },
];

const hiddenItems: readonly { itemId: ItemId; amount: number }[] = [
  { itemId: 'golden_apple', amount: 3 },
  { itemId: 'star_shard', amount: 3 },
  { itemId: 'skill_fruit', amount: 2 },
  { itemId: 'wishing_well_coin', amount: 1 },
];

const pickRandomItem = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

const rewardPool: readonly RewardPoolEntry[] = [
  {
    rarity: 'common',
    labelKey: 'common',
    weight: 50,
    generate: (pet, _weather) => {
      const coinBase = 20;
      const bonus = _weather === 'sunny' ? Math.floor(coinBase * 0.15) : 0;
      return {
        rarity: 'common',
        label: t('pet.wishingWell.rewards.common'),
        coins: coinBase + bonus,
        ...(Math.random() < 0.3 ? { items: [pickRandomItem(commonItems)] } : {}),
      };
    },
  },
  {
    rarity: 'rare',
    labelKey: 'rare',
    weight: 30,
    generate: (pet, _weather) => {
      const coinBase = 50;
      const bonus = _weather === 'sunny' ? Math.floor(coinBase * 0.15) : 0;
      const isFishPlant = _weather === 'rainy' && Math.random() < 0.4;
      return {
        rarity: 'rare',
        label: t('pet.wishingWell.rewards.rare'),
        coins: coinBase + bonus,
        ...(isFishPlant
          ? { items: [{ itemId: 'apple', amount: 2 }] }
          : { items: [pickRandomItem(rareItems)] }),
      };
    },
  },
  {
    rarity: 'epic',
    labelKey: 'epic',
    weight: 15,
    generate: (pet, _weather) => {
      const coinBase = 100;
      const bonus = _weather === 'sunny' ? Math.floor(coinBase * 0.15) : 0;
      return {
        rarity: 'epic',
        label: t('pet.wishingWell.rewards.epic'),
        coins: coinBase + bonus,
        hearts: Math.random() < 0.5 ? 2 : undefined,
        items: [pickRandomItem(epicItems)],
      };
    },
  },
  {
    rarity: 'legend',
    labelKey: 'legend',
    weight: 4,
    generate: (pet, _weather) => {
      const coinBase = 300;
      const bonus = _weather === 'sunny' ? Math.floor(coinBase * 0.15) : 0;
      const isWeatherWonder = _weather === 'rainy' || _weather === 'breezy';
      const actualWeight = isWeatherWonder ? 8 : 4;
      return {
        rarity: 'legend',
        label: t('pet.wishingWell.rewards.legend'),
        coins: coinBase + bonus,
        hearts: Math.random() < 0.6 ? 3 : undefined,
        items: [pickRandomItem(legendItems)],
      };
    },
  },
  {
    rarity: 'hidden',
    labelKey: 'hidden',
    weight: 1,
    generate: (pet, _weather) => ({
      rarity: 'hidden',
      label: t('pet.wishingWell.rewards.hidden'),
      coins: 500,
      hearts: 5,
      items: [pickRandomItem(hiddenItems)],
    }),
  },
];

const totalWeight = rewardPool.reduce((sum, entry) => sum + entry.weight, 0);

const rollRarity = (pity: number, weather: string): RewardPoolEntry => {
  if (pity >= pityMax) {
    const legend = rewardPool.find((e) => e.rarity === 'legend')!;
    const hidden = rewardPool.find((e) => e.rarity === 'hidden')!;
    return Math.random() < 0.1 ? hidden : legend;
  }
  const isWeatherWonder = weather === 'rainy' || weather === 'breezy';
  let roll = Math.random() * totalWeight;
  for (const entry of rewardPool) {
    let weight = entry.weight;
    if (entry.rarity === 'legend' && isWeatherWonder) weight *= 2;
    if (entry.rarity === 'hidden' && isWeatherWonder) weight *= 1.5;
    roll -= weight;
    if (roll <= 0) return entry;
  }
  return rewardPool[0];
};

export const getWishingWellView = (pet: PetState, now = Date.now()) => {
  const dateKey = getDailyResetDateKey(now);
  const isNewDay = dateKey !== pet.wishingWell.dateKey;
  const freeWishesUsed = isNewDay ? 0 : pet.wishingWell.freeWishesUsed;
  const paidWishesUsed = isNewDay ? 0 : pet.wishingWell.paidWishesUsed;
  const freeWishesRemaining = dailyFreeWishLimit - freeWishesUsed;
  const paidWishesRemaining = dailyPaidWishLimit - paidWishesUsed;
  const nextPaidCost = pet.wishingWell.paidWishBaseCost + paidWishesUsed * paidWishCostIncrement;
  const canFreeWish = freeWishesRemaining > 0;
  const canPaidWish = paidWishesRemaining > 0 && pet.coins >= nextPaidCost;

  return {
    dateKey,
    freeWishesUsed,
    paidWishesUsed,
    freeWishesRemaining,
    paidWishesRemaining,
    nextPaidCost,
    canFreeWish,
    canPaidWish,
    totalWishes: pet.wishingWell.totalWishes,
    legendaryCount: pet.wishingWell.legendaryCount,
    hiddenCount: pet.wishingWell.hiddenCount,
    pity: isNewDay ? pet.wishingWell.pity : pet.wishingWell.pity,
  };
};

export const performWish = (pet: PetState, useCoins: boolean, now = Date.now()): { pet: PetState; reward: WishReward } | null => {
  const view = getWishingWellView(pet, now);
  if (!useCoins && !view.canFreeWish) return null;
  if (useCoins && !view.canPaidWish) return null;

  const dateKey = view.dateKey;
  const isNewDay = dateKey !== pet.wishingWell.dateKey;

  let state = pet.wishingWell;
  if (isNewDay) {
    state = { ...state, dateKey, freeWishesUsed: 0, paidWishesUsed: 0 };
  }

  const weather = pet.weather;
  const entry = rollRarity(state.pity, weather);
  const reward = entry.generate(pet, weather);

  let next = pet;

  if (reward.coins) {
    next = { ...next, coins: clampCoins(next.coins + reward.coins) };
  }
  if (reward.hearts) {
    next = { ...next, hearts: clampCount(next.hearts + reward.hearts) };
  }
  if (reward.items) {
    for (const item of reward.items) {
      next = { ...next, inventory: addInventoryItem(next.inventory, item.itemId, item.amount) };
    }
  }
  if (reward.moodBoost) {
    next = { ...next, mood: Math.min(100, next.mood + reward.moodBoost) };
  }

  if (useCoins) {
    next = { ...next, coins: clampCoins(next.coins - view.nextPaidCost) };
  }

  const newPity = entry.rarity === 'legend' || entry.rarity === 'hidden' ? 0 : state.pity + pityPerMiss;

  const isLegendary = entry.rarity === 'legend';
  const isHidden = entry.rarity === 'hidden';

  next = {
    ...next,
    wishingWell: {
      ...state,
      freeWishesUsed: state.freeWishesUsed + (useCoins ? 0 : 1),
      paidWishesUsed: state.paidWishesUsed + (useCoins ? 1 : 0),
      totalWishes: state.totalWishes + 1,
      legendaryCount: state.legendaryCount + (isLegendary ? 1 : 0),
      hiddenCount: state.hiddenCount + (isHidden ? 1 : 0),
      pity: newPity,
    },
    lastInteractionAt: now,
  };

  next = incrementWishingWellWishCount(next, isLegendary, isHidden);

  return { pet: next, reward };
};

export const getWishRarityColor = (rarity: WishRarity): string => {
  switch (rarity) {
    case 'common': return 'var(--text-muted)';
    case 'rare': return '#4fc3f7';
    case 'epic': return '#ce93d8';
    case 'legend': return '#ffd54f';
    case 'hidden': return '#ff6f00';
  }
};