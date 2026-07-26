import { t } from '../i18n';
import { incrementAchievementCompostCollect, incrementAchievementCompostStart } from './achievements';
import { addInventoryItem, getInventoryCount, isBuiltinItemId, removeInventoryItem } from './items';
import { clampCoins } from './petStats';
import type { BuiltinItemId, CompostBinCatalystType, CompostBinInputType, CompostBinSlot, CompostBinState, PetState } from './petTypes';
import { isNumber } from './utils';

const minuteMs = 60 * 1000;
const hourMs = 60 * minuteMs;

export const compostBinMaxLevel = 3;
export const compostBinBaseSlotCount = 3;
export const compostBinTotalSlotCount = 6;
export const compostBinUpgradeCosts = [0, 500, 1500] as const;
export const compostBinExtraSlotUnlockCosts = [1, 1, 1] as const;

export const CATALYST_SLOT_OFFSET = 3;
export const CATALYST_REQUIRED_COUNT = 3;

const compostBinBaseTimesMs: Record<CompostBinInputType, number> = {
  fruit_care: 30 * minuteMs,
  withered_fragment: 1 * hourMs,
  rare_combo: 2 * hourMs,
};

const compostBinOutputs: Record<CompostBinInputType, { itemId: BuiltinItemId; amount: number }> = {
  fruit_care: { itemId: 'normal_fertilizer', amount: 1 },
  withered_fragment: { itemId: 'heart_fertilizer', amount: 1 },
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

const isFertilizerItem = (itemId: string): boolean =>
  itemId === 'normal_fertilizer' || itemId === 'harvest_nutrient' || itemId === 'heart_fertilizer';

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

export const isAttachmentSlot = (slotIndex: number): boolean => slotIndex >= compostBinBaseSlotCount;

export const getPairedBaseSlot = (attachSlotIndex: number): number | undefined =>
  isAttachmentSlot(attachSlotIndex) ? attachSlotIndex - CATALYST_SLOT_OFFSET : undefined;

export const getPairedAttachmentSlot = (baseSlotIndex: number): number | undefined =>
  baseSlotIndex < compostBinBaseSlotCount ? baseSlotIndex + CATALYST_SLOT_OFFSET : undefined;

const fertilizerTimeReductionPct: Record<string, number> = {
  normal_fertilizer: 30,
  harvest_nutrient: 40,
  heart_fertilizer: 50,
};

const qualityUpgradeChain: Record<string, BuiltinItemId | undefined> = {
  normal_fertilizer: 'heart_fertilizer',
  heart_fertilizer: 'harvest_nutrient',
  harvest_nutrient: undefined,
};

export const getCatalystTypeForSlot = (slotIndex: number): CompostBinCatalystType | undefined => {
  if (!isAttachmentSlot(slotIndex)) return undefined;
  const idx = slotIndex - CATALYST_SLOT_OFFSET;
  if (idx === 0) return 'fruit_catalyst';
  if (idx === 1) return 'withered_catalyst';
  if (idx === 2) return 'fertilizer_catalyst';
  return undefined;
};

export const getAllowedCatalystItems = (slotIndex: number): readonly string[] => {
  const type = getCatalystTypeForSlot(slotIndex);
  if (type === 'fruit_catalyst') return fruitCareItemIds;
  if (type === 'withered_catalyst') return ['withered_fragment'];
  if (type === 'fertilizer_catalyst') return ['normal_fertilizer', 'harvest_nutrient', 'heart_fertilizer'];
  return [];
};

export const defaultCompostBinSlot = (slotIndex: number): CompostBinSlot => ({
  slotIndex,
  inputType: undefined,
  inputItemId: undefined,
  startedAt: 0,
  completesAt: 0,
  outputItemId: '',
  outputAmount: 0,
  catalystType: undefined,
  catalystItemId: undefined,
  catalystCount: undefined,
});

export const defaultCompostBinState = (): CompostBinState => ({
  level: 1,
  slots: Array.from({ length: compostBinTotalSlotCount }, (_, i) => defaultCompostBinSlot(i)),
  unlockedExtraSlots: 0,
});

const isCompostBinInputType = (value: unknown): value is CompostBinInputType =>
  value === 'fruit_care' || value === 'withered_fragment' || value === 'rare_combo';

const isCompostBinCatalystType = (value: unknown): value is CompostBinCatalystType =>
  value === 'fruit_catalyst' || value === 'withered_catalyst' || value === 'fertilizer_catalyst';

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
  const catalystType = isCompostBinCatalystType(raw.catalystType) ? raw.catalystType : undefined;
  const catalystItemId = typeof raw.catalystItemId === 'string' ? raw.catalystItemId : '';
  const catalystCount = isNumber(raw.catalystCount) ? Math.min(CATALYST_REQUIRED_COUNT, Math.max(0, Math.floor(raw.catalystCount))) : undefined;
  if (!inputType || startedAt <= 0 || completesAt <= 0) {
    if (isAttachmentSlot(slotIndex) && catalystType && catalystItemId) {
      return { ...fallback, catalystType, catalystItemId, catalystCount: catalystCount ?? 1 };
    }
    return fallback;
  }
  const isComplete = now >= completesAt;
  return {
    slotIndex,
    inputType,
    inputItemId,
    startedAt,
    completesAt: isComplete ? completesAt : completesAt,
    outputItemId,
    outputAmount,
    catalystCount,
    guaranteedTokenDrop: raw.guaranteedTokenDrop === true ? true : undefined,
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

export const loadCatalyst = (pet: PetState, slotIndex: number, itemId: string, now = Date.now()): PetState => {
  const garden = pet.garden;
  const bin = normalizeCompostBinState(garden.compostBin, now);
  if (!isAttachmentSlot(slotIndex)) return pet;
  if (!isCompostBinSlotUnlocked(slotIndex, bin.unlockedExtraSlots)) return pet;

  const slot = bin.slots[slotIndex];
  if (!slot) return pet;
  if (slot.inputType && slot.completesAt > now) return pet;
  if (slot.catalystType && slot.catalystItemId && (slot.catalystCount ?? 0) >= CATALYST_REQUIRED_COUNT) return pet;

  const allowedItems = getAllowedCatalystItems(slotIndex);
  if (!allowedItems.includes(itemId)) return pet;

  if (getInventoryCount(pet.inventory, itemId as BuiltinItemId) <= 0) return pet;

  const catalystType = getCatalystTypeForSlot(slotIndex);
  const currentCount = slot.catalystType === catalystType ? (slot.catalystCount ?? 0) : 0;
  const newCount = Math.min(currentCount + 1, CATALYST_REQUIRED_COUNT);

  let newSlots = bin.slots.map((s) => {
    if (s.slotIndex === slotIndex) {
      return {
        ...defaultCompostBinSlot(slotIndex),
        catalystType,
        catalystItemId: itemId,
        catalystCount: newCount,
      };
    }
    return s;
  });

  const isNowActive = currentCount < CATALYST_REQUIRED_COUNT && newCount >= CATALYST_REQUIRED_COUNT;
  if (isNowActive) {
    for (let baseIdx = 0; baseIdx < compostBinBaseSlotCount; baseIdx++) {
      const baseSlot = bin.slots[baseIdx];
      if (baseSlot && baseSlot.inputType && baseSlot.completesAt > now) {
        const output = compostBinOutputs[baseSlot.inputType];
        if (output) {
          let finalItemId = baseSlot.outputItemId || output.itemId;
          let finalAmount = baseSlot.outputAmount || output.amount;
          let newCompletesAt = baseSlot.completesAt;
          let guaranteedToken = baseSlot.guaranteedTokenDrop || false;

          if (catalystType === 'fruit_catalyst') {
            finalAmount = Math.floor(output.amount * (2 + (bin.level - 1) * 0.5));
          } else if (catalystType === 'withered_catalyst') {
            const upgraded = qualityUpgradeChain[finalItemId];
            if (upgraded) {
              finalItemId = upgraded;
            } else {
              finalAmount = output.amount * 2;
            }
          } else if (catalystType === 'fertilizer_catalyst') {
            const reductionPct = fertilizerTimeReductionPct[itemId] ?? 0;
            const remainingMs = baseSlot.completesAt - now;
            const newDurationMs = Math.max(60 * 1000, Math.round(remainingMs * (1 - reductionPct / 100)));
            newCompletesAt = now + newDurationMs;
            guaranteedToken = true;
          }

          newSlots = newSlots.map((s) => {
            if (s.slotIndex === baseIdx) {
              return {
                ...s,
                outputItemId: finalItemId,
                outputAmount: finalAmount,
                completesAt: newCompletesAt,
                guaranteedTokenDrop: guaranteedToken || undefined,
              };
            }
            return s;
          });
        }
      }
    }
  }

  const newBin: CompostBinState = { ...bin, slots: newSlots };

  return {
    ...pet,
    inventory: removeInventoryItem(pet.inventory, itemId as BuiltinItemId),
    garden: { ...garden, compostBin: newBin },
    lastInteractionAt: now,
  };
};

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
  let durationMs = getCompostBinSlotDurationMs(inputType, bin.level);
  let finalItemId = output.itemId;
  let finalAmount = output.amount;
  let guaranteedToken = false;

  for (let catIdx = compostBinBaseSlotCount; catIdx < compostBinTotalSlotCount; catIdx++) {
    const catSlot = bin.slots[catIdx];
    if (catSlot && catSlot.catalystType && catSlot.catalystItemId && (catSlot.catalystCount ?? 0) >= CATALYST_REQUIRED_COUNT) {
      const catalystType = catSlot.catalystType;
      const catalystItemId = catSlot.catalystItemId;

      if (catalystType === 'fruit_catalyst') {
        finalAmount = Math.floor(output.amount * (2 + (bin.level - 1) * 0.5));
      } else if (catalystType === 'withered_catalyst') {
        const upgraded = qualityUpgradeChain[finalItemId];
        if (upgraded) {
          finalItemId = upgraded;
        } else {
          finalAmount = output.amount * 2;
        }
      } else if (catalystType === 'fertilizer_catalyst') {
        const reductionPct = fertilizerTimeReductionPct[catalystItemId] ?? 0;
        durationMs = Math.max(60 * 1000, Math.round(durationMs * (1 - reductionPct / 100)));
        guaranteedToken = true;
      }
    }
  }

  const newSlot: CompostBinSlot = {
    slotIndex,
    inputType,
    inputItemId: itemId,
    startedAt: now,
    completesAt: now + durationMs,
    outputItemId: finalItemId,
    outputAmount: finalAmount,
    guaranteedTokenDrop: guaranteedToken || undefined,
  };

  let newSlots = bin.slots.map((s) => {
    if (s.slotIndex === slotIndex) return newSlot;
    return s;
  });

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

  const outputItemId = slot.outputItemId || compostBinOutputs[slot.inputType]?.itemId || '';
  const outputAmount = slot.outputAmount || compostBinOutputs[slot.inputType]?.amount || 0;
  if (!outputItemId || outputAmount <= 0) return pet;

  const emptySlot: CompostBinSlot = defaultCompostBinSlot(slotIndex);
  const attachSlotIndex = getPairedAttachmentSlot(slotIndex);
  const newSlots = bin.slots.map((s) => {
    if (s.slotIndex === slotIndex) return emptySlot;
    if (attachSlotIndex !== undefined && s.slotIndex === attachSlotIndex) return defaultCompostBinSlot(attachSlotIndex);
    return s;
  });
  const newBin: CompostBinState = { ...bin, slots: newSlots };

  let inventory = addInventoryItem(pet.inventory, outputItemId as BuiltinItemId, outputAmount);

  const tokenDrop = slot.guaranteedTokenDrop || Math.random() < 0.3;
  if (tokenDrop) {
    inventory = addInventoryItem(inventory, 'garden_token', 1);
  }

  return incrementAchievementCompostCollect({
    ...pet,
    inventory,
    garden: { ...garden, compostBin: newBin },
    recentEvent: t('pet.garden.compostCollect', { item: getItemName(outputItemId), count: outputAmount }),
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