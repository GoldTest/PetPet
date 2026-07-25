import type { GardenTreeId, PetState, SpeciesBookEntry, SpeciesBookState } from './petTypes';
import { gardenTreeDefinitions } from './garden';

export const allGardenTreeIds: readonly GardenTreeId[] = [
  'fruit_tree',
  'care_tree',
  'gift_tree',
  'herb_tree',
  'money_tree',
  'golden_apple_tree',
];

export const defaultSpeciesBookState = (): SpeciesBookState => ({
  entries: {},
  allCollected: false,
});

export const normalizeSpeciesBookState = (value: unknown): SpeciesBookState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultSpeciesBookState();
  }
  const raw = value as Record<string, unknown>;
  const entries: Record<string, SpeciesBookEntry> = {};

  if (raw.entries && typeof raw.entries === 'object' && !Array.isArray(raw.entries)) {
    for (const [key, val] of Object.entries(raw.entries as Record<string, unknown>)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const entry = val as Record<string, unknown>;
        entries[key] = {
          unlocked: Boolean(entry.unlocked),
          harvestCount: typeof entry.harvestCount === 'number' ? entry.harvestCount : 0,
          firstHarvestAt: typeof entry.firstHarvestAt === 'number' ? entry.firstHarvestAt : 0,
        };
      }
    }
  }

  return {
    entries,
    allCollected: Boolean(raw.allCollected),
  };
};

export const unlockSpecies = (pet: PetState, treeId: GardenTreeId, now: number): PetState => {
  const book = normalizeSpeciesBookState(pet.speciesBook);
  const existing = book.entries[treeId];

  if (existing?.unlocked) return pet;

  const newEntry: SpeciesBookEntry = {
    unlocked: true,
    harvestCount: existing?.harvestCount ?? 0,
    firstHarvestAt: now,
  };

  const newEntries = { ...book.entries, [treeId]: newEntry };
  const allUnlocked = allGardenTreeIds.every(id => newEntries[id]?.unlocked);

  return {
    ...pet,
    speciesBook: {
      entries: newEntries,
      allCollected: allUnlocked,
    },
  };
};

export const incrementSpeciesHarvest = (pet: PetState, treeId: GardenTreeId): PetState => {
  const book = normalizeSpeciesBookState(pet.speciesBook);
  const existing = book.entries[treeId];

  if (!existing) return pet;

  return {
    ...pet,
    speciesBook: {
      ...book,
      entries: {
        ...book.entries,
        [treeId]: {
          ...existing,
          harvestCount: existing.harvestCount + 1,
        },
      },
    },
  };
};

export const getSpeciesBookProgress = (pet: PetState): { unlocked: number; total: number } => {
  const book = normalizeSpeciesBookState(pet.speciesBook);
  const unlocked = allGardenTreeIds.filter(id => book.entries[id]?.unlocked).length;
  return { unlocked, total: allGardenTreeIds.length };
};

export const isSpeciesBookComplete = (pet: PetState): boolean => {
  const book = normalizeSpeciesBookState(pet.speciesBook);
  return allGardenTreeIds.every(id => book.entries[id]?.unlocked);
};

export const getSpeciesBookEntry = (pet: PetState, treeId: GardenTreeId): SpeciesBookEntry | undefined => {
  const book = normalizeSpeciesBookState(pet.speciesBook);
  return book.entries[treeId];
};
