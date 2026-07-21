import type {
  ActivePetMod,
  ModCgImageKey,
  PetImageKey,
  PetModManifest,
} from './mod';
import { modCgImageKeys, petActivityImageKeys, petStatusImageKeys } from './mod';
import { validatePetModManifest } from './mod';

interface BuiltinModEntry {
  manifest: PetModManifest;
  petImageUrls: Partial<Record<PetImageKey, string>>;
  cgImageUrls: Partial<Record<ModCgImageKey, string>>;
}

const petImageModules = import.meta.glob<string>('../mods/*/pet/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const cgImageModules = import.meta.glob<string>('../mods/*/cg/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const manifestModules = import.meta.glob<unknown>('../mods/*/manifest.json', {
  eager: true,
  import: 'default',
});

const modDirPattern = /\.\.\/mods\/([^/]+)\//;

const getModIdFromPath = (path: string): string | null => {
  const match = modDirPattern.exec(path);
  return match?.[1] ?? null;
};

const getImageKeyFromPath = (path: string): string | null => {
  const name = path.split('/').pop();
  if (!name) return null;
  return name.replace(/\.png$/i, '');
};

const createBuiltinModEntry = (dir: string): BuiltinModEntry | null => {
  const manifestPath = `../mods/${dir}/manifest.json`;
  const rawManifest = manifestModules[manifestPath];
  if (!rawManifest) return null;

  let manifest: PetModManifest;
  try {
    manifest = validatePetModManifest(rawManifest);
  } catch {
    return null;
  }

  const petImageUrls: BuiltinModEntry['petImageUrls'] = {};
  for (const key of [...petStatusImageKeys, ...petActivityImageKeys]) {
    const path = `../mods/${dir}/pet/${key}.png`;
    const url = petImageModules[path as keyof typeof petImageModules];
    if (url) petImageUrls[key as PetImageKey] = url;
  }

  const cgImageUrls: BuiltinModEntry['cgImageUrls'] = {};
  for (const key of modCgImageKeys) {
    const path = `../mods/${dir}/cg/${key}.png`;
    const url = cgImageModules[path as keyof typeof cgImageModules];
    if (url) cgImageUrls[key as ModCgImageKey] = url;
  }

  return { manifest, petImageUrls, cgImageUrls };
};

let cachedBuiltinMods: BuiltinModEntry[] | null = null;

export const getBuiltinMods = (): BuiltinModEntry[] => {
  if (cachedBuiltinMods) return cachedBuiltinMods;

  const dirs = new Set<string>();
  for (const path of Object.keys(manifestModules)) {
    const dir = getModIdFromPath(path);
    if (dir) dirs.add(dir);
  }

  const result: BuiltinModEntry[] = [];
  for (const dir of dirs) {
    const entry = createBuiltinModEntry(dir);
    if (entry) result.push(entry);
  }

  cachedBuiltinMods = result;
  return result;
};

export const getBuiltinMod = (dir: string): BuiltinModEntry | null => {
  return getBuiltinMods().find((m) => {
    const builtinDir = Object.keys(manifestModules).find((path) => {
      const d = getModIdFromPath(path);
      return d === dir && manifestModules[path];
    });
    return Boolean(builtinDir);
  }) ?? null;
};

export const buildActivePetModFromBuiltin = (builtin: BuiltinModEntry): ActivePetMod => ({
  manifest: builtin.manifest,
  petImageUrls: builtin.petImageUrls,
  itemImageUrls: {},
  cgImageUrls: builtin.cgImageUrls,
});
