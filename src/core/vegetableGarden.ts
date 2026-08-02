import { t } from '../i18n';
import { getSeasonForDate, type Season } from './season';
import { addInventoryItem, getInventoryCount, isBuiltinItemId, removeInventoryItem } from './items';
import { clampCount } from './petStats';
import { getSixAmResetDateKey } from './dateRewards';
import type { BuiltinItemId, PetState, VegetableCropId, VegetableGardenState, VegetableSlot, VegetableSlotState } from './petTypes';
import { hashString, isNumber } from './utils';

export const vegGardenSchemaVersion = 2;
export const vegGardenPlotCount = 1;
export const vegGardenPlotRows = 6;
export const vegGardenPlotColumns = 10;
export const vegGardenSlotsPerPlot = vegGardenPlotRows * vegGardenPlotColumns;
export const vegGardenSlotCount = vegGardenPlotCount * vegGardenSlotsPerPlot;

export const vegCropIds: readonly VegetableCropId[] = ['tomato', 'carrot', 'cabbage', 'onion', 'potato', 'chili'];
const vegCropIdSet = new Set<VegetableCropId>(vegCropIds);
const vegSlotStateSet = new Set<VegetableSlotState>(['empty', 'growing', 'ready']);

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
  seasonBonus: Season[];
  dropCountMin: number;
  dropCountMax: number;
}

const minMs = 60 * 1000;

export const vegCropDefinitions: Record<VegetableCropId, VegCropDefinition> = {
  tomato: { id: 'tomato', seedPrice: 10, growDurationMs: 10 * minMs, seasonBonus: ['summer'], dropCountMin: 2, dropCountMax: 4 },
  carrot: { id: 'carrot', seedPrice: 10, growDurationMs: 15 * minMs, seasonBonus: ['autumn'], dropCountMin: 1, dropCountMax: 1 },
  cabbage: { id: 'cabbage', seedPrice: 10, growDurationMs: 20 * minMs, seasonBonus: ['spring'], dropCountMin: 1, dropCountMax: 1 },
  onion: { id: 'onion', seedPrice: 10, growDurationMs: 25 * minMs, seasonBonus: ['spring'], dropCountMin: 1, dropCountMax: 1 },
  potato: { id: 'potato', seedPrice: 10, growDurationMs: 30 * minMs, seasonBonus: ['autumn'], dropCountMin: 2, dropCountMax: 4 },
  chili: { id: 'chili', seedPrice: 10, growDurationMs: 20 * minMs, seasonBonus: ['summer'], dropCountMin: 2, dropCountMax: 5 },
};

export const getVegDropCount = (cropId: VegetableCropId, slotIndex: number, plantedAt: number): number => {
  const definition = vegCropDefinitions[cropId];
  const span = definition.dropCountMax - definition.dropCountMin + 1;
  return definition.dropCountMin + (Math.abs(hashString([cropId, slotIndex, plantedAt].join(':'))) % span);
};

export const vegWaterReductionPercent = 8;
export const vegSeedDropChance = 30;

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
  cropId: undefined,
  plantedAt: 0,
  lastWateredAt: 0,
  nextReadyAt: 0,
  state: 'empty',
  dailyHarvestDateKey: getSixAmResetDateKey(now),
  dailyHarvestCount: 0,
});

export const defaultVegGardenState = (now = Date.now()): VegetableGardenState => ({
  schemaVersion: vegGardenSchemaVersion,
  slots: Array.from({ length: vegGardenSlotCount }, (_, index) => defaultVegSlot(index, now)),
  dailyWaterDateKey: getSixAmResetDateKey(now),
  dailyWaterCount: 0,
  lifetimeHarvestCount: 0,
});

const normalizeVegSlot = (value: unknown, slotIndex: number, now: number): VegetableSlot => {
  const fallback = defaultVegSlot(slotIndex, now);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const cropId = isVegCropId(raw.cropId) ? raw.cropId : undefined;
  const state = isVegSlotState(raw.state) ? raw.state : cropId ? 'growing' : 'empty';
  if (!cropId || state === 'empty') return fallback;
  const plantedAt = clampTimestamp(raw.plantedAt, now);
  const nextReadyAt = clampTimestamp(raw.nextReadyAt, now);
  const dailyHarvestDateKey = normalizeDateKey(raw.dailyHarvestDateKey, now);
  const resetDateKey = getSixAmResetDateKey(now);
  return {
    slotIndex,
    cropId,
    plantedAt,
    lastWateredAt: clampTimestamp(raw.lastWateredAt, now),
    nextReadyAt: nextReadyAt > 0 ? nextReadyAt : plantedAt + vegCropDefinitions[cropId].growDurationMs,
    state: state === 'ready' ? 'ready' : 'growing',
    dailyHarvestDateKey,
    dailyHarvestCount: dailyHarvestDateKey === resetDateKey ? Math.min(99, clampCount(isNumber(raw.dailyHarvestCount) ? raw.dailyHarvestCount : 0)) : 0,
  };
};

export const normalizeVegGardenState = (value: unknown, now = Date.now()): VegetableGardenState => {
  const fallback = defaultVegGardenState(now);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const rawSchemaVersion = isNumber(raw.schemaVersion) ? Math.floor(raw.schemaVersion) : 0;
  const rawSlots = Array.isArray(raw.slots) ? raw.slots : [];
  const slots = Array.from({ length: vegGardenSlotCount }, (_, slotIndex) => {
    if (rawSchemaVersion < 2) return defaultVegSlot(slotIndex, now);
    return normalizeVegSlot(rawSlots[slotIndex], slotIndex, now);
  });
  const dailyWaterDateKey = normalizeDateKey(raw.dailyWaterDateKey, now);
  const resetDateKey = getSixAmResetDateKey(now);
  return {
    schemaVersion: vegGardenSchemaVersion,
    slots,
    dailyWaterDateKey,
    dailyWaterCount: dailyWaterDateKey === resetDateKey ? Math.min(999, clampCount(isNumber(raw.dailyWaterCount) ? raw.dailyWaterCount : 0)) : 0,
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
    return { ...slot, state: 'ready' as const };
  });
  return { ...pet, vegetableGarden: { ...garden, slots } };
};

export const plantVegCrop = (pet: PetState, slotIndex: number, cropId: VegetableCropId, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  const definition = vegCropDefinitions[cropId];
  const seedItemId = vegCropSeedItemIds[cropId];
  if (!slot || !definition || !seedItemId) return failAction(current, 'pet.vegGarden.invalidSlot');
  if (slot.state !== 'empty') return failAction(current, 'pet.vegGarden.slotNotEmpty');
  if (getInventoryCount(current.inventory, seedItemId) <= 0) return failAction(current, 'pet.vegGarden.missingSeed', { item: getItemName(seedItemId) });
  const duration = getCropGrowDuration(current, cropId, now);
  const nextPet = { ...current, inventory: removeInventoryItem(current.inventory, seedItemId) };
  return {
    ...nextPet,
    vegetableGarden: updateVegSlot(nextPet.vegetableGarden, slotIndex, (target) => ({
      ...target, cropId, plantedAt: now, nextReadyAt: now + duration, state: 'growing' as const,
    })),
    recentEvent: t('pet.vegGarden.plantSuccess', { crop: t('ui.vegGarden.crops.' + cropId + '.name'), item: getItemName(seedItemId) }),
    lastInteractionAt: now,
  };
};

export const waterVegCrop = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  if (!slot || slot.state !== 'growing' || !slot.cropId) return failAction(current, 'pet.vegGarden.cannotWater');
  if (slot.lastWateredAt > 0 && getSixAmResetDateKey(slot.lastWateredAt) === getSixAmResetDateKey(now)) return failAction(current, 'pet.vegGarden.wateredToday');
  const reductionMs = Math.floor(Math.max(0, slot.nextReadyAt - now) * (vegWaterReductionPercent / 100));
  const nextReadyAt = Math.max(now, slot.nextReadyAt - reductionMs);
  const nextState: VegetableSlotState = nextReadyAt <= now ? 'ready' : 'growing';
  let inventory = current.inventory;
  if (Math.random() < 0.2) {
    inventory = addInventoryItem(inventory, 'garden_token', 1);
  }
  return {
    ...current,
    inventory,
    vegetableGarden: updateVegSlot({ ...current.vegetableGarden, dailyWaterDateKey: getSixAmResetDateKey(now), dailyWaterCount: current.vegetableGarden.dailyWaterCount + 1 }, slotIndex, (target) => ({
      ...target, lastWateredAt: now, nextReadyAt, state: nextState,
    })),
    recentEvent: t('pet.vegGarden.waterSuccess', { percent: vegWaterReductionPercent }),
    lastInteractionAt: now,
  };
};

export const harvestVegCrop = (pet: PetState, slotIndex: number, now = Date.now()): PetState => {
  const current = advanceVegGarden(pet, now);
  const slot = current.vegetableGarden.slots[slotIndex];
  if (!slot || slot.state !== 'ready' || !slot.cropId) return failAction(current, 'pet.vegGarden.cannotHarvest');
  const dropCount = getVegDropCount(slot.cropId, slot.slotIndex, slot.plantedAt);
  const produceItemId = vegCropProduceItemIds[slot.cropId];
  const seed = [slot.slotIndex, slot.cropId, slot.plantedAt, now].join(':');
  let inventory = current.inventory;
  inventory = addInventoryItem(inventory, produceItemId, dropCount);
  if (rollSeedDrop(slot, seed)) {
    const seedItemId = vegCropSeedItemIds[slot.cropId];
    inventory = addInventoryItem(inventory, seedItemId, 1);
  }
  return {
    ...current,
    inventory,
    vegetableGarden: updateVegSlot({ ...current.vegetableGarden, lifetimeHarvestCount: current.vegetableGarden.lifetimeHarvestCount + 1 }, slotIndex, () => defaultVegSlot(slotIndex, now)),
    recentEvent: t('pet.vegGarden.harvestSuccess', { count: dropCount, crop: t('ui.vegGarden.crops.' + slot.cropId + '.name') }),
    lastInteractionAt: now,
  };
};

export const getVegGardenStage = (slot: VegetableSlot, now = Date.now()): number => {
  if (slot.state === 'ready') return 5;
  if (slot.state !== 'growing' || !slot.cropId || slot.plantedAt <= 0 || slot.nextReadyAt <= slot.plantedAt) return 1;
  const progress = Math.max(0, Math.min(1, (now - slot.plantedAt) / (slot.nextReadyAt - slot.plantedAt)));
  if (progress < 0.2) return 1;
  if (progress < 0.4) return 2;
  if (progress < 0.65) return 3;
  if (progress < 0.9) return 4;
  return 5;
};

export const getVegGardenReminder = (pet: PetState, now = Date.now()): 'ready' | undefined => {
  const current = advanceVegGarden(pet, now);
  return current.vegetableGarden.slots.some((slot) => slot.state === 'ready') ? 'ready' : undefined;
};

export const getVegGardenView = (pet: PetState, now = Date.now()) => {
  const current = advanceVegGarden(pet, now);
  const readyCount = current.vegetableGarden.slots.filter((slot) => slot.state === 'ready').length;
  return {
    pet: current,
    garden: current.vegetableGarden,
    readyCount,
    reminder: readyCount > 0 ? 'ready' as const : undefined,
    slotViews: current.vegetableGarden.slots.map((slot) => ({
      slot,
      stage: getVegGardenStage(slot, now),
      progressPercent: slot.state === 'ready' ? 100 : slot.state === 'growing' && slot.nextReadyAt > slot.plantedAt ? Math.max(0, Math.min(100, ((now - slot.plantedAt) / (slot.nextReadyAt - slot.plantedAt)) * 100)) : 0,
      remainingMs: slot.state === 'growing' ? Math.max(0, slot.nextReadyAt - now) : 0,
    })),
  };
};

export const isVegSlotWateredToday = (slot: VegetableSlot, now = Date.now()): boolean =>
  slot.lastWateredAt > 0 && getSixAmResetDateKey(slot.lastWateredAt) === getSixAmResetDateKey(now);
