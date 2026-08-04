import { t } from '../i18n';
import { marketDistrictDefinitions, type MarketDistrictDefinition, type MarketDistrictId } from './merchant';
import { getInventoryCount, addInventoryItem } from './items';
import type { BuiltinItemId, MultiverseState, PetState } from './petTypes';

export type { MultiverseState } from './petTypes';

export const multiverseSchemaVersion = 1;
export const initialMinerals = 5;
export const initialEnergy = 20;
export const randomTravelMineralCost = 1;
export const randomTravelEnergyCost = 5;

export const worldAnchorItemIds: Record<MarketDistrictId, BuiltinItemId> = {
  chinese: 'world_anchor_chinese',
  fantasy: 'world_anchor_fantasy',
  modern: 'world_anchor_modern',
};

export interface RandomTravelResult {
  pet: PetState;
  world: MarketDistrictDefinition;
  isNewAnchor: boolean;
}

export const defaultMultiverseState = (): MultiverseState => ({
  schemaVersion: multiverseSchemaVersion,
  minerals: initialMinerals,
  energy: initialEnergy,
  lastRandomTravelAt: 0,
});

export const normalizeMultiverseState = (value: unknown): MultiverseState => {
  const fallback = defaultMultiverseState();
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Record<string, unknown>;
  const clampResource = (num: unknown, max: number, fallbackValue: number) =>
    Math.min(max, Math.max(0, Math.floor(typeof num === 'number' && Number.isFinite(num) ? num : fallbackValue)));
  return {
    schemaVersion: multiverseSchemaVersion,
    minerals: clampResource(raw.minerals, 999, fallback.minerals),
    energy: clampResource(raw.energy, 9999, fallback.energy),
    lastRandomTravelAt:
      typeof raw.lastRandomTravelAt === 'number' && Number.isFinite(raw.lastRandomTravelAt)
        ? Math.max(0, raw.lastRandomTravelAt)
        : 0,
  };
};

export const hasWorldAnchor = (pet: PetState, worldId: MarketDistrictId): boolean =>
  getInventoryCount(pet.inventory, worldAnchorItemIds[worldId]) > 0;

export const getAnchoredWorlds = (pet: PetState): MarketDistrictDefinition[] =>
  marketDistrictDefinitions.filter((entry) => hasWorldAnchor(pet, entry.id));

export const getUnanchoredWorlds = (pet: PetState): MarketDistrictDefinition[] =>
  marketDistrictDefinitions.filter((entry) => !hasWorldAnchor(pet, entry.id));

export const canRandomTravel = (pet: PetState): boolean =>
  pet.multiverse.minerals >= randomTravelMineralCost && pet.multiverse.energy >= randomTravelEnergyCost;

export const getRandomTravelTicketText = (pet: PetState): string =>
  t('ui.market.portal.ticket', {
    minerals: `${pet.multiverse.minerals}/${randomTravelMineralCost}`,
    energy: `${pet.multiverse.energy}/${randomTravelEnergyCost}`,
  });

export const performRandomTravel = (pet: PetState, now = Date.now()): RandomTravelResult | null => {
  const unanchored = getUnanchoredWorlds(pet);
  if (unanchored.length === 0 || !canRandomTravel(pet)) return null;

  const world = unanchored[Math.floor(Math.random() * unanchored.length)];
  const isNewAnchor = !hasWorldAnchor(pet, world.id);
  const nextPet: PetState = {
    ...pet,
    multiverse: {
      ...pet.multiverse,
      minerals: pet.multiverse.minerals - randomTravelMineralCost,
      energy: pet.multiverse.energy - randomTravelEnergyCost,
      lastRandomTravelAt: now,
    },
    inventory: isNewAnchor ? addInventoryItem(pet.inventory, worldAnchorItemIds[world.id], 1) : pet.inventory,
    recentEvent: isNewAnchor
      ? t('pet.multiverse.randomTravel.newAnchor', { world: t(world.nameKey) })
      : t('pet.multiverse.randomTravel.visited', { world: t(world.nameKey) }),
  };
  return { pet: nextPet, world, isNewAnchor };
};
