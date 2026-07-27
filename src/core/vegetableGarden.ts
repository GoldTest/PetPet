import { t } from '../i18n';
import { getSeasonForDate, type Season } from './season';
import { addInventoryItem, getInventoryCount, isBuiltinItemId, removeInventoryItem } from './items';
import { clampCoins, clampCount } from './petStats';
import { getSixAmResetDateKey } from './dateRewards';
import type { BuiltinItemId, PetState, VegetableCropId, VegetableGardenState, VegetableSlot, VegetableSlotState } from './petTypes';
import { hashString, isNumber } from './utils';

export const vegGardenSchemaVersion = 1;
export const vegGardenSlotCount = 12;
export const vegGardenColumns = 6;

export const vegCropIds: readonly VegetableCropId[] = ['tomato', 'carrot', 'cabbage', 'onion', 'potato', 'chili'];
const vegCropIdSet = new Set<VegetableCropId>(vegCropIds);
const vegSlotStateSet = new Set<VegetableSlotState>(['empty', 'growing', 'ready', 'withered', 'pest']);

export const vegCropSeedItemIds: Record<VegetableCropId, BuiltinItemId> = {
  tomato: 'tomato_seed',
  carrot: 'carrot_seed',
  cabbage: 'cabbage_seed',
  onion: 'onion_seed',
  potato: 'potato_seed',
  chili: 'chili_seed',
};

export const vegCropProduceItemIds: Record<VegetableCropId, BuiltinItemId> = {
  tomato: 'tomato',
  carrot: 'carrot',
  cabbage: 'cabbage',
  onion: 'onion',
  potato: 'potato',
  chili: 'chili',
};

export interface VegCropDefinition {
  id: VegetableCropId;
  seedPrice: number;
  growDurationMs: number;
  maxHarvests: number;
  seasonBonus: Season[];
  dropCount: number;
}

const minMs = 60 * 1000;

export const vegCropDefinitions: Record<VegetableCropId, VegCropDefinition> = {
  tomato: { id: 'tomato', seedPrice: 10, growDurationMs: 10 * minMs, maxHarvests: 3, seasonBonus: ['summer'], dropCount: 1 },
  carrot: { id: 'carrot', seedPrice: 10, growDurationMs: 15 * minMs, maxHarvests: 3, seasonBonus: ['autumn'], dropCount: 1 },
  cabbage: { id: 'cabbage', seedPrice: 10, growDurationMs: 20 * minMs, maxHarvests: 2, seasonBonus: ['spring'], dropCount: 1 },
  onion: { id: 'onion', seedPrice: 10, growDurationMs: 25 * minMs, maxHarvests: 2, seasonBonus: ['spring'], dropCount: 1 },
  potato: { id: 'potato', seedPrice: 10, growDurationMs: 30 * minMs, maxHarvests: 4, seasonBonus: ['autumn'], dropCount: 2 },
  chili: { id: 'chili', seedPrice: 10, growDurationMs: 20 * minMs, maxHarvests: 3, seasonBonus: ['summer'], dropCount: 1 },
};

export const vegSlotUnlockCosts = [0, 0, 50, 50, 100, 100, 200, 200, 300, 300, 400, 400] as const;
export const vegWaterReductionPercent = 8;
export const vegFertilizeReductionPercent = 25;
export const vegPestChance = 20;
export const vegSeedDropChance = 30;
export const vegRotationPenaltyThreshold = 3;
export const vegRotationPenaltyPercent = 20;

const isVegCropId = (value: unknown): value is VegetableCropId => typeof value === 'string' && vegCropIdSet.has(value as VegetableCropId);
const isVegSlotState = (value: unknown): value is VegetableSlotState => typeof value === 'string' && vegSlotStateSet.has(value as VegetableSlotState);
const clampTimestamp = (value: unknown, now: number) => isNumber(value) ? Math.max(0, Math.min(Math.floor(value), now + 365 * 24 * 60 * 60 * 1000)) : 0;
const normalizeDateKey = (value: unknown, now: number) => {
  const dateKey = typeof value === 'string' ? value.trim().slice(0, 16) : '';
  const resetDateKey = getSixAmResetDateKey(now);
  return dateKey === resetDateKey ? dateKey : resetDateKey;
};

const defaultVegSlot = (slotIndex: number, now = Date.now()): VegetableSlot => ({
  slotIndex,
  unlocked: slotIndex < 2,
  cropId: undefined,
  plantedAt: 0,
  lastWateredAt: 0,
  lastFertilizedAt: 0,
  nextReadyAt: 0,
  harvestsUsed: 0,
  maxHarvests: 0,
  state: 'empty',
  lastCropId: undefined,
  sameCropPlantCount: 0,
  hasPest: false,
  dailyHarvestDateKey: getSixAmResetDateKey(now),
  dailyHarvestCount: 0,
});

export const defaultVegGardenState = (now = Date.now()): VegetableGardenState => ({
  schemaVersion: vegGardenSchemaVersion,
  slots: Array.from({ length: vegGardenSlotCount }, (_, index) => defaultVegSlot(index, now)),
  dailyWaterDateKey: getSixAmResetDateKey(now),
  dailyWaterCount: 0,
  dailyFertilizeDateKey: getSixAmResetDateKey(now),
  dailyFertilizeCount: 0,
  lifetimeHarvestCount: 0,
});

const normalizeVegSlot = (value: unknown, slotIndex: number, previousUnlocked: boolean, now: number): VegetableSlot => {
  const fallback = defaultVegSlot(slotIndex, now);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const cropId = isVegCropId(raw.cropId) ? raw.cropId : undefined;
  const state = isVegSlotState(raw.state) ? raw.state : cropId ? 'growing' : 'empty';
  const unlocked = previousUnlocked && (Boolean(raw.unlocked) || Boolean(cropId) || state !== 'empty');
  const hasPest = Boolean(raw.hasPest);
  const lastCropId = isVegCropId(raw.lastCropId) ? raw.lastCropId : undefined;
  const sameCropPlantCount = Math.min(99, clampCount(isNumber(raw.sameCropPlantCount) ? raw.sameCropPlantCount : 0));
  const plantedAt = clampTimestamp(raw.plantedAt, now);
  const nextReadyAt = clampTimestamp(raw.nextReadyAt, now);
  const maxHarvests = cropId ? Math.min(99, Math.max(1, isNumber(raw.maxHarvests) ? Math.floor(raw.maxHarvests) : vegCropDefinitions[cropId].maxHarvests)) : 0;
  const harvestsUsed = cropId ? Math.min(maxHarvests, clampCount(isNumber(raw.harvestsUsed) ? raw.harvestsUsed : 0)) : 0;
  const dailyHarvestDateKey = normalizeDateKey(raw.dailyHarvestDateKey, now);
  const resetDateKey = getSixAmResetDateKey(now);
  if (!unlocked || !cropId || state === 'empty') return { ...fallback, unlocked, dailyHarvestDateKey };
  const normalizedState: VegetableSlotState = state === 'ready' && !hasPest ? 'ready' : state === 'ready' && hasPest ? 'pest' : harvestsUsed >= maxHarvests && state !== 'ready' ? 'withered' : state;
  const finalPlantedAt = plantedAt;
  const finalNextReadyAt = nextReadyAt > 0 ? nextReadyAt : plantedAt + vegCropDefinitions[cropId].growDurationMs;
  return {
    slotIndex, unlocked, cropId, plantedAt: finalPlantedAt, lastWateredAt: clampTimestamp(raw.lastWateredAt, now),
    lastFertilizedAt: clampTimestamp(raw.lastFertilizedAt, now), nextReadyAt: finalNextReadyAt,
    harvestsUsed, maxHarvests, state: normalizedState, lastCropId, sameCropPlantCount, hasPest,
    dailyHarvestDateKey, dailyHarvestCount: dailyHarvestDateKey === resetDateKey ? Math.min(99, clampCount(isNumber(raw.dailyHarvestCount) ? raw.dailyHarvestCount : 0)) : 0,
  };
};

export const normalizeVegGardenState = (value: unknown, now = Date.now()): VegetableGardenState => {
  const fallback = defaultVegGardenState(now);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const rawSlots = Array.isArray(raw.slots) ? raw.slots : [];
  let previousUnlocked = true;
  const slots = Array.from({ length: Math.max(rawSlots.length, vegGardenSlotCount) }, (_, slotIndex) => {
    const slot = normalizeVegSlot(rawSlots[slotIndex], slotIndex, previousUnlocked, now);
    previousUnlocked = slot.unlocked;
    return slot;
  });
  const dailyWaterDateKey = normalizeDateKey(raw.dailyWaterDateKey, now);
  const dailyFertilizeDateKey = normalizeDateKey(raw.dailyFertilizeDateKey, now);
  const resetDateKey = getSixAmResetDateKey(now);
  return {
    schemaVersion: vegGardenSchemaVersion,
    slots,
    dailyWaterDateKey,
    dailyWaterCount: dailyWaterDateKey === resetDateKey ? Math.min(999, clampCount(isNumber(raw.dailyWaterCount) ? raw.dailyWaterCount : 0)) : 0,
    dailyFertilizeDateKey,
    dailyFertilizeCount: dailyFertilizeDateKey === resetDateKey ? Math.min(999, clampCount(isNumber(raw.dailyFertilizeCount) ? raw.dailyFertilizeCount : 0)) : 0,
    lifetimeHarvestCount: Math.min(999999, clampCount(isNumber(raw.lifetimeHarvestCount) ? raw.lifetimeHarvestCount : 0)),
  };
};

const getSeasonGrowMultiplier = (cropId: VegetableCropId, season: Season): number => {
  return vegCropDefinitions[cropId].seasonBonus.includes(season) ? 0.8 : 1;
};

const getCropGrowDuration = (pet: PetState, cropId: VegetableCropId, now: number): number => {
  const season = getSeasonForDate(now);
  const seasonMultiplier = getSeasonGrowMultiplier(cropId, season);
  const base = vegCropDefinitions[cropId].growDurationMs;
  return Math.max(60 * 1000, Math.round(base * seasonMultiplier));
};

const getRotationPenalty = (slot: VegetableSlot): number => {
  if (slot.sameCropPlantCount < vegRotationPenaltyThreshold) return 0;
  if (slot.sameCropPlantCount >= 5) return vegRotationPenaltyPercent * 2.5;
  if (slot.sameCropPlantCount >= 3) return vegRotationPenaltyPercent;
  return 0;
};

const getPestSeed = (slot: VegetableSlot, now: number): string =>
  [slot.slotIndex, slot.cropId, slot.plantedAt, now].join(':');

const shouldTriggerPest = (slot: VegetableSlot, now: number): boolean => {
  if (!slot.cropId || slot.state !== 'growing' || slot.hasPest) return false;
  return Math.abs(hashString(getPestSeed(slot, now))) % 100 < vegPestChance;
};

const getHarvestDropCount = (slot: VegetableSlot, now: number): number => {
  if (!slot.cropId) return 0;
  const definition = vegCropDefinitions[slot.cropId];
  let count = definition.dropCount;
  const penalty = getRotationPenalty(slot);
  if (penalty > 0) {
    count = Math.max(1, Math.round(count * (1 - penalty / 100)));
  }
  if (slot.hasPest) {
    count = Math.max(1, Math.round(count * 0.5));
  }
  return count;
};

const rollSeedDrop = (slot: VegetableSlot, seed: string): boolean => {
  return Math.abs(hashString(seed + ':seed')) % 100 < vegSeedDropChance;
};

const updateVegSlot = (garden: VegetableGardenState, slotIndex: number, updater: (slot: VegetableSlot) => VegetableSlot): VegetableGardenState => ({
  ...garden,
  slots: garden.slots.map((slot) => slot.slotIndex === slotIndex ? updater(slot) : slot),
});

const failAction = (pet: PetState, messageKey: string, params: Record<string, string | number> = {}): PetState => ({
  ...pet,
  recentEvent: t(messageKey, params),
});

const getItemName = (itemId: BuiltinItemId) => t('pet.shop.items.' + itemId + '.name');

export const advanceVegGarden = (pet: PetState, now = Date.now()): PetState => {
  const garden = normalizeVegGardenState(pet.vegetableGarden, now);
  const slots = garden.slots.map((slot) => {
    if (slot.state !== 'growing' || !slot.cropId || slot.nextReadyAt > now) return slot;
    const hasPest = shouldTriggerPest(slot, now);
    if (hasPest) {
      return { ...slot, state: 'pest' as const, hasPest: true };
    }
    return { ...slot, state: 'ready' as const };
  });
  return { ...pet, vegetableGarden: { ...garden, slots } };
};

export const unlockVegSlot = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  if (!slot) return failAction(current, 'pet.vegGarden.invalidSlot');
  if (slot.unlocked) return failAction(current, 'pet.vegGarden.slotAlreadyUnlocked');
  if (slotIndex > 0 && !current.vegetableGarden.slots[slotIndex - 1]?.unlocked) return failAction(current, 'pet.vegGarden.unlockInOrder');
  const cost = vegSlotUnlockCosts[slotIndex] ?? 0;
  if (current.coins < cost) return failAction(current, 'pet.vegGarden.notEnoughCoins', { coins: cost });
  return {
    ...current,
    coins: clampCoins(current.coins - cost),
    vegetableGarden: updateVegSlot(current.vegetableGarden, slotIndex, (target) => ({ ...target, unlocked: true })),
    recentEvent: t('pet.vegGarden.unlockSlotSuccess', { slot: slotIndex + 1, coins: cost }),
    lastInteractionAt: now,
  };
};

export const plantVegCrop = (pet: PetState, slotIndex: number, cropId: VegetableCropId, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  const definition = vegCropDefinitions[cropId];
  const seedItemId = vegCropSeedItemIds[cropId];
  if (!slot || !definition || !seedItemId) return failAction(current, 'pet.vegGarden.invalidSlot');
  if (!slot.unlocked) return failAction(current, 'pet.vegGarden.slotLocked');
  if (slot.state !== 'empty') return failAction(current, 'pet.vegGarden.slotNotEmpty');
  if (getInventoryCount(current.inventory, seedItemId) <= 0) return failAction(current, 'pet.vegGarden.missingSeed', { item: getItemName(seedItemId) });
  const sameCrop = slot.lastCropId === cropId ? slot.sameCropPlantCount + 1 : 1;
  const duration = getCropGrowDuration(current, cropId, now);
  const nextPet = { ...current, inventory: removeInventoryItem(current.inventory, seedItemId) };
  return {
    ...nextPet,
    vegetableGarden: updateVegSlot(nextPet.vegetableGarden, slotIndex, (target) => ({
      ...target, cropId, plantedAt: now, nextReadyAt: now + duration,
      harvestsUsed: 0, maxHarvests: definition.maxHarvests, state: 'growing' as const,
      lastCropId: cropId, sameCropPlantCount: sameCrop, hasPest: false,
    })),
    recentEvent: t('pet.vegGarden.plantSuccess', { crop: t('ui.vegGarden.crops.' + cropId + '.name'), item: getItemName(seedItemId) }),
    lastInteractionAt: now,
  };
};

export const waterVegCrop = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  if (!slot || (slot.state !== 'growing' && slot.state !== 'pest') || !slot.cropId) return failAction(current, 'pet.vegGarden.cannotWater');
  if (slot.lastWateredAt > 0 && getSixAmResetDateKey(slot.lastWateredAt) === getSixAmResetDateKey(now)) return failAction(current, 'pet.vegGarden.wateredToday');
  let reductionMs = Math.floor(Math.max(0, slot.nextReadyAt - now) * (vegWaterReductionPercent / 100));
  let nextReadyAt = Math.max(now, slot.nextReadyAt - reductionMs);
  let hasPest = slot.hasPest;
  let nextState: VegetableSlotState = slot.state;
  if (hasPest) {
    hasPest = false;
    nextState = 'growing';
    if (nextReadyAt <= now) {
      nextState = 'ready';
    }
  }
  let inventory = current.inventory;
  if (Math.random() < 0.2) {
    inventory = addInventoryItem(inventory, 'garden_token', 1);
  }
  return {
    ...current,
    inventory,
    vegetableGarden: updateVegSlot({ ...current.vegetableGarden, dailyWaterDateKey: getSixAmResetDateKey(now), dailyWaterCount: current.vegetableGarden.dailyWaterCount + 1 }, slotIndex, (target) => ({
      ...target, lastWateredAt: now, nextReadyAt, hasPest, state: nextState,
    })),
    recentEvent: t('pet.vegGarden.waterSuccess', { percent: vegWaterReductionPercent }),
    lastInteractionAt: now,
  };
};

export const fertilizeVegCrop = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  if (!slot || (slot.state !== 'growing' && slot.state !== 'pest') || !slot.cropId) return failAction(current, 'pet.vegGarden.cannotFertilize');
  if (slot.lastFertilizedAt > 0 && getSixAmResetDateKey(slot.lastFertilizedAt) === getSixAmResetDateKey(now)) return failAction(current, 'pet.vegGarden.fertilizedToday');
  if (getInventoryCount(current.inventory, 'normal_fertilizer') <= 0) return failAction(current, 'pet.vegGarden.missingFertilizer', { item: getItemName('normal_fertilizer') });
  let reductionMs = Math.floor(Math.max(0, slot.nextReadyAt - now) * (vegFertilizeReductionPercent / 100));
  let nextReadyAt = Math.max(now, slot.nextReadyAt - reductionMs);
  let hasPest = slot.hasPest;
  let nextState: VegetableSlotState = slot.state;
  if (hasPest) {
    hasPest = false;
    nextState = 'growing';
    if (nextReadyAt <= now) {
      nextState = 'ready';
    }
  }
  let inventory = current.inventory;
  inventory = removeInventoryItem(inventory, 'normal_fertilizer');
  if (Math.random() < 0.3) {
    inventory = addInventoryItem(inventory, 'garden_token', 1);
  }
  return {
    ...current,
    inventory,
    vegetableGarden: updateVegSlot({ ...current.vegetableGarden, dailyFertilizeDateKey: getSixAmResetDateKey(now), dailyFertilizeCount: current.vegetableGarden.dailyFertilizeCount + 1 }, slotIndex, (target) => ({
      ...target, lastFertilizedAt: now, nextReadyAt, hasPest, state: nextState,
    })),
    recentEvent: t('pet.vegGarden.fertilizeSuccess', { item: getItemName('normal_fertilizer'), percent: vegFertilizeReductionPercent }),
    lastInteractionAt: now,
  };
};

export const harvestVegCrop = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  if (!slot || slot.state !== 'ready' || !slot.cropId) return failAction(current, 'pet.vegGarden.cannotHarvest');
  const harvestsUsed = slot.harvestsUsed + 1;
  const isWithered = harvestsUsed >= slot.maxHarvests;
  const dropCount = getHarvestDropCount(slot, now);
  const produceItemId = vegCropProduceItemIds[slot.cropId];
  const seed = getPestSeed(slot, now);
  let inventory = current.inventory;
  inventory = addInventoryItem(inventory, produceItemId, dropCount);
  if (rollSeedDrop(slot, seed)) {
    const seedItemId = vegCropSeedItemIds[slot.cropId];
    inventory = addInventoryItem(inventory, seedItemId, 1);
  }
  const nextSlot: VegetableSlot = isWithered
    ? { ...slot, harvestsUsed, state: 'withered', dailyHarvestDateKey: getSixAmResetDateKey(now), dailyHarvestCount: slot.dailyHarvestCount + 1 }
    : { ...slot, plantedAt: now, lastWateredAt: 0, lastFertilizedAt: 0, nextReadyAt: now + getCropGrowDuration(current, slot.cropId, now), harvestsUsed, state: 'growing', dailyHarvestDateKey: getSixAmResetDateKey(now), dailyHarvestCount: slot.dailyHarvestCount + 1 };
  return {
    ...current,
    inventory,
    vegetableGarden: updateVegSlot({ ...current.vegetableGarden, lifetimeHarvestCount: current.vegetableGarden.lifetimeHarvestCount + 1 }, slotIndex, () => nextSlot),
    recentEvent: t('pet.vegGarden.harvestSuccess', { count: dropCount, crop: t('ui.vegGarden.crops.' + slot.cropId + '.name') }),
    lastInteractionAt: now,
  };
};

export const clearVegSlot = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  if (!slot || !slot.cropId || slot.state === 'empty') return failAction(current, 'pet.vegGarden.cannotClear');
  const clearCost = 30;
  if (current.coins < clearCost) return failAction(current, 'pet.vegGarden.notEnoughCoins', { coins: clearCost });
  let inventory = current.inventory;
  if (slot.state === 'withered') {
    inventory = addInventoryItem(inventory, 'withered_fragment', 1);
  }
  return {
    ...current,
    coins: clampCoins(current.coins - clearCost),
    inventory,
    vegetableGarden: updateVegSlot(current.vegetableGarden, slotIndex, () => ({ ...defaultVegSlot(slotIndex, now), unlocked: true })),
    recentEvent: t('pet.vegGarden.clearSuccess', { coins: clearCost }),
    lastInteractionAt: now,
  };
};

export const getVegGardenStage = (slot: VegetableSlot, now = Date.now()): number => {
  if (slot.harvestsUsed > 0 || slot.state === 'ready' || slot.state === 'withered') return 5;
  if (slot.state !== 'growing' || !slot.cropId || slot.plantedAt <= 0 || slot.nextReadyAt <= slot.plantedAt) return 1;
  const progress = Math.max(0, Math.min(1, (now - slot.plantedAt) / (slot.nextReadyAt - slot.plantedAt)));
  if (progress < 0.2) return 1;
  if (progress < 0.4) return 2;
  if (progress < 0.65) return 3;
  if (progress < 0.9) return 4;
  return 5;
};

export const getVegGardenReminder = (pet: PetState, now = Date.now()): 'ready' | 'pest' | 'withered' | undefined => {
  const current = advanceVegGarden(pet, now);
  if (current.vegetableGarden.slots.some((slot) => slot.state === 'ready')) return 'ready';
  if (current.vegetableGarden.slots.some((slot) => slot.state === 'pest')) return 'pest';
  if (current.vegetableGarden.slots.some((slot) => slot.state === 'withered')) return 'withered';
  return undefined;
};

export const getVegGardenView = (pet: PetState, now = Date.now()) => {
  const current = advanceVegGarden(pet, now);
  const readyCount = current.vegetableGarden.slots.filter((slot) => slot.state === 'ready').length;
  const pestCount = current.vegetableGarden.slots.filter((slot) => slot.state === 'pest').length;
  const witheredCount = current.vegetableGarden.slots.filter((slot) => slot.state === 'withered').length;
  return {
    pet: current,
    garden: current.vegetableGarden,
    readyCount,
    pestCount,
    witheredCount,
    reminder: readyCount > 0 ? 'ready' as const : pestCount > 0 ? 'pest' as const : witheredCount > 0 ? 'withered' as const : undefined,
    slotViews: current.vegetableGarden.slots.map((slot) => ({
      slot,
      stage: getVegGardenStage(slot, now),
      progressPercent: slot.state === 'ready' || slot.state === 'withered' ? 100 : slot.state === 'growing' && slot.nextReadyAt > slot.plantedAt ? Math.max(0, Math.min(100, ((now - slot.plantedAt) / (slot.nextReadyAt - slot.plantedAt)) * 100)) : 0,
      remainingMs: slot.state === 'growing' || slot.state === 'pest' ? Math.max(0, slot.nextReadyAt - now) : 0,
    })),
  };
};

export const isVegSlotWateredToday = (slot: VegetableSlot, now = Date.now()): boolean =>
  slot.lastWateredAt > 0 && getSixAmResetDateKey(slot.lastWateredAt) === getSixAmResetDateKey(now);

export const isVegSlotFertilizedToday = (slot: VegetableSlot, now = Date.now()): boolean =>
  slot.lastFertilizedAt > 0 && getSixAmResetDateKey(slot.lastFertilizedAt) === getSixAmResetDateKey(now);