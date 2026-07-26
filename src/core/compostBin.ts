import { t } from '../i18n';
import { incrementAchievementCompostCollect, incrementAchievementCompostStart } from './achievements';
import { addInventoryItem, getInventoryCount, isBuiltinItemId, removeInventoryItem } from './items';
import { clampCoins } from './petStats';
import type { BuiltinItemId, CompostBinInputType, CompostBinSlot, CompostBinState, GardenState, ItemId, PetState } from './petTypes';
import { isNumber } from './utils';

const minuteMs = 60 * 1000;
const hourMs = 60 * minuteMs;

export const compostBinMaxLevel = 3;
export const compostBinBaseSlotCount = 3;
export const compostBinTotalSlotCount = 6;
export const compostBinUpgradeCosts = [0, 500, 1500] as const;
export const compostBinExtraSlotUnlockCosts = [10, 20, 40] as const;

const compostBinBaseTimesMs: Record<CompostBinInputType, number> = {
  fruit_care: 30 * minuteMs,
  withered_fragment: 1 * hourMs,
  rare_combo: 2 * hourMs,
};

const compostBinOutputs: Record<CompostBinInputType, { itemId: BuiltinItemId; amount: number }> = {
  fruit_care: { itemId: 'normal_fertilizer', amount: 1 },
  withered_fragment: { itemId: 'harvest_nutrient', amount: 1 },
  rare_combo: { itemId: 'heart_fertilizer', amount: 1 },
};

export const getCompostBinOutput = (inputType: CompostBinInputType): { itemId: BuiltinItemId; amount: number } | undefined =>
  compostBinOutputs[inputType];

const compostBinLevelSpeedBonusPercent = [0, 10, 20, 30] as const;

export const fruitCareItemIds: readonly BuiltinItemId[] = [
  'orange', 'apple', 'banana', 'watermelon',
];

const isFruitCareItem = (itemId: string): itemId is BuiltinItemId =>
  fruitCareItemIds.includes(itemId as BuiltinItemId);

const isWitheredFragment = (itemId: string): boolean => itemId === 'withered_fragment';

export const getCompostBinSlotDurationMs = (inputType: CompostBinInputType, level: number): number => {
  const base = compostBinBaseTimesMs[inputType];
  const bonus = compostBinLevelSpeedBonusPercent[Math.min(compostBinMaxLevel, Math.max(0, level))] ?? 0;
  return Math.max(60 * 1000, Math.round(base * (1 - bonus / 100)));
};

export const getCompostBinUpgradeCost = (level: number): number =>
  level >= compostBinMaxLevel ? 0 : compostBinUpgradeCosts[level] ?? 0;

export const getCompostBinUnlockCost = (unlockedExtraSlots: number): number =>
  unlockedExtraSlots >= compostBinExtraSlotUnlockCosts.length ? 0 : compostBinExtraSlotUnlockCosts[unlockedExtraSlots] ?? 0;

export const isCompostBinSlotUnlocked = (slotIndex: number, unlockedExtraSlots: number): boolean =>
  slotIndex < compostBinBaseSlotCount || slotIndex < compostBinBaseSlotCount + unlockedExtraSlots;

export const defaultCompostBinSlot = (slotIndex: number): CompostBinSlot => ({
  slotIndex,
  inputType: undefined,
  inputItemId: undefined,
  startedAt: 0,
  completesAt: 0,
  outputItemId: '',
  outputAmount: 0,
});

export const defaultCompostBinState = (): CompostBinState => ({
  level: 1,
  slots: Array.from({ length: compostBinTotalSlotCount }, (_, i) => defaultCompostBinSlot(i)),
  unlockedExtraSlots: 0,
});

const isCompostBinInputType = (value: unknown): value is CompostBinInputType =>
  value === 'fruit_care' || value === 'withered_fragment' || value === 'rare_combo';

const normalizeCompostBinSlot = (value: unknown, slotIndex: number, now: number): CompostBinSlot => {
  const fallback = defaultCompostBinSlot(slotIndex);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const inputType = isCompostBinInputType(raw.inputType) ? raw.inputType : undefined;
  const inputItemId = typeof raw.inputItemId === 'string' ? raw.inputItemId : '';
  const startedAt = isNumber(raw.startedAt) ? Math.max(0, Math.floor(raw.startedAt)) : 0;
  const completesAt = isNumber(raw.completesAt) ? Math.max(0, Math.floor(raw.completesAt)) : 0;
  const outputItemId = typeof raw.outputItemId === 'string' ? raw.outputItemId : '';
  const outputAmount = isNumber(raw.outputAmount) ? Math.max(0, Math.floor(raw.outputAmount)) : 0;
  if (!inputType || startedAt <= 0 || completesAt <= 0) return fallback;
  const isComplete = now >= completesAt;
  return {
    slotIndex,
    inputType,
    inputItemId,
    startedAt,
    completesAt: isComplete ? completesAt : completesAt,
    outputItemId: isComplete ? outputItemId : '',
    outputAmount: isComplete ? outputAmount : 0,
  };
};

export const normalizeCompostBinState = (value: unknown, now = Date.now()): CompostBinState => {
  const fallback = defaultCompostBinState();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const level = isNumber(raw.level) ? Math.min(compostBinMaxLevel, Math.max(1, Math.floor(raw.level))) : 1;
  const unlockedExtraSlots = isNumber(raw.unlockedExtraSlots) ? Math.min(compostBinExtraSlotUnlockCosts.length, Math.max(0, Math.floor(raw.unlockedExtraSlots))) : 0;
  const rawSlots = Array.isArray(raw.slots) ? raw.slots : [];
  const slots = Array.from({ length: compostBinTotalSlotCount }, (_, i) =>
    normalizeCompostBinSlot(rawSlots[i], i, now),
  );
  return { level, slots, unlockedExtraSlots };
};

const getItemName = (itemId: string) => t('pet.shop.items.' + itemId + '.name');

export const compostItem = (pet: PetState, slotIndex: number, itemId: string, now = Date.now()): PetState => {
  const garden = pet.garden;
  const bin = normalizeCompostBinState(garden.compostBin, now);
  const slot = bin.slots[slotIndex];
  if (!slot) return pet;
  if (!isCompostBinSlotUnlocked(slotIndex, bin.unlockedExtraSlots)) return pet;
  if (slot.inputType && slot.completesAt > now) return pet;

  let inputType: CompostBinInputType | undefined;
  if (isWitheredFragment(itemId)) {
    inputType = 'withered_fragment';
  } else if (isFruitCareItem(itemId)) {
    inputType = 'fruit_care';
  }
  if (!inputType) return pet;

  if (getInventoryCount(pet.inventory, itemId as BuiltinItemId) <= 0) return pet;

  const output = compostBinOutputs[inputType];
  const durationMs = getCompostBinSlotDurationMs(inputType, bin.level);

  const newSlot: CompostBinSlot = {
    slotIndex,
    inputType,
    inputItemId: itemId,
    startedAt: now,
    completesAt: now + durationMs,
    outputItemId: output.itemId,
    outputAmount: output.amount,
  };

  const newSlots = bin.slots.map((s) => s.slotIndex === slotIndex ? newSlot : s);
  const newBin: CompostBinState = { ...bin, slots: newSlots };

  return incrementAchievementCompostStart({
    ...pet,
    inventory: removeInventoryItem(pet.inventory, itemId as BuiltinItemId),
    garden: { ...garden, compostBin: newBin },
    recentEvent: t('pet.garden.compostStart', { item: getItemName(itemId) }),
    lastInteractionAt: now,
  });
};

export const collectCompost = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const garden = pet.garden;
  const bin = normalizeCompostBinState(garden.compostBin, now);
  const slot = bin.slots[slotIndex];
  if (!slot || !slot.inputType || now < slot.completesAt) return pet;

  const output = compostBinOutputs[slot.inputType];
  if (!output) return pet;

  const emptySlot: CompostBinSlot = defaultCompostBinSlot(slotIndex);
  const newSlots = bin.slots.map((s) => s.slotIndex === slotIndex ? emptySlot : s);
  const newBin: CompostBinState = { ...bin, slots: newSlots };

  let inventory = addInventoryItem(pet.inventory, output.itemId, output.amount);
  const tokenDropChance = 0.3;
  if (Math.random() < tokenDropChance) {
    inventory = addInventoryItem(inventory, 'garden_token', 1);
  }

  return incrementAchievementCompostCollect({
    ...pet,
    inventory,
    garden: { ...garden, compostBin: newBin },
    recentEvent: t('pet.garden.compostCollect', { item: getItemName(output.itemId), count: output.amount }),
    lastInteractionAt: now,
  });
};

export const upgradeCompostBin = (pet: PetState, now = Date.now()): PetState => {
  const garden = pet.garden;
  const bin = normalizeCompostBinState(garden.compostBin, now);
  if (bin.level >= compostBinMaxLevel) return pet;
  const cost = getCompostBinUpgradeCost(bin.level);
  if (pet.coins < cost) return pet;

  const newBin: CompostBinState = { ...bin, level: bin.level + 1 };

  return {
    ...pet,
    coins: clampCoins(pet.coins - cost),
    garden: { ...garden, compostBin: newBin },
    recentEvent: t('pet.garden.compostUpgrade', { level: bin.level + 1, coins: cost }),
    lastInteractionAt: now,
  };
};

export const unlockCompostBinSlot = (pet: PetState, now = Date.now()): PetState => {
  const garden = pet.garden;
  const bin = normalizeCompostBinState(garden.compostBin, now);
  const cost = getCompostBinUnlockCost(bin.unlockedExtraSlots);
  if (cost <= 0) return pet;
  if (getInventoryCount(pet.inventory, 'garden_token') < cost) return pet;

  const newBin: CompostBinState = { ...bin, unlockedExtraSlots: bin.unlockedExtraSlots + 1 };

  let inventory = pet.inventory;
  for (let i = 0; i < cost; i += 1) {
    inventory = removeInventoryItem(inventory, 'garden_token');
  }

  return {
    ...pet,
    inventory,
    garden: { ...garden, compostBin: newBin },
    recentEvent: t('pet.garden.compostUnlockSlot', { slot: compostBinBaseSlotCount + bin.unlockedExtraSlots + 1, tokens: cost }),
    lastInteractionAt: now,
  };
};
