import { normalizePetBirthday } from './dateRewards';
import type {
  BuiltinItemId,
  InventoryItemDefinition,
  ItemEffect,
  ItemId,
  PetBirthday,
  PetStatus,
  RecentActivity,
  ShopCategory,
  ShopItem,
  WeatherType,
} from './petTypes';

export const modSchemaVersion = 3;

export const petStatusImageKeys = [
  'content',
  'hungry',
  'sad',
  'dirty',
  'tired',
  'sick',
  'sleeping',
] as const satisfies readonly PetStatus[];

export const petActivityImageKeys = [
  'happy',
  'bath',
  'eat_cookie',
  'eat_noodles',
  'eat_meat',
  'give_heart',
  'level_up',
  'reading_books',
  'workout',
  'work_food',
  'work_plants',
] as const satisfies readonly Exclude<RecentActivity, 'idle'>[];

export const itemImageKeys = [
  'emergency_biscuit',
  'bento',
  'orange',
  'apple',
  'banana',
  'watermelon',
  'nutri_meal',
  'pig_trotter',
  'strawberry_cake',
  'ad_milk',
  'strawberry_milk',
  'small_bouquet',
  'shiny_sticker',
  'soft_cloud_doll',
  'ribbon_bell',
  'toy_ball',
  'picture_book',
  'shampoo',
  'wet_wipes',
  'medicine',
  'vitamin_tablet',
  'blanket',
  'energy_drink',
  'golden_apple',
  'fruit_tree_sapling',
  'care_tree_sapling',
  'gift_tree_sapling',
  'money_tree_sapling',
  'golden_apple_tree_sapling',
  'normal_fertilizer',
  'heart_fertilizer',
  'harvest_nutrient',
] as const satisfies readonly BuiltinItemId[];

export type PetStatusImageKey = (typeof petStatusImageKeys)[number];
export type PetActivityImageKey = (typeof petActivityImageKeys)[number];
export type ItemImageKey = (typeof itemImageKeys)[number];
export type PetImageKey = PetStatusImageKey | PetActivityImageKey;
export const modCgImageKeys = ['good_ending_year_1'] as const;
export type ModCgImageKey = (typeof modCgImageKeys)[number];

export interface PetModTexts {
  recentEvent?: string;
  favoriteFood?: string;
  status?: Partial<Record<PetStatus, string>>;
  items?: Partial<Record<ItemImageKey, { name?: string; summary?: string }>>;
}

export interface PetModItemOverride {
  name?: string;
  summary?: string;
  image?: string;
}

export interface PetModCustomItem {
  id: ItemId;
  name: string;
  summary: string;
  kind: ShopCategory;
  price: number;
  effect: ItemEffect;
  image?: string;
  shop: boolean;
  tags: string[];
}

export interface PetModItems {
  overrides?: Partial<Record<ItemImageKey, PetModItemOverride>>;
  custom?: PetModCustomItem[];
}

export type ModActivityId = string;

export interface PetModActivityDef {
  id: ModActivityId;
  labelKey: string;
  durationMs: number;
  images: string[];
}

export interface PetModEventCondition {
  minLevel?: number;
  minHearts?: number;
  requiredItemId?: ItemId;
  weather?: WeatherType;
}

export interface PetModEventReward {
  coins?: number;
  hearts?: number;
  itemId?: ItemId;
  itemAmount?: number;
  effect?: ItemEffect;
}

export interface PetModEventDef {
  trigger: 'daily_encounter' | 'offline' | 'sleep';
  weight: number;
  conditions?: PetModEventCondition;
  rewards: PetModEventReward;
  textKey: string;
}

export interface PetModEvents {
  daily_encounter?: PetModEventDef[];
  offline?: PetModEventDef[];
  sleep?: PetModEventDef[];
}

interface PetModManifestBase {
  id: string;
  name: string;
  author?: string;
  version: string;
  defaultPetName: string;
  description?: string;
  favoriteFoodIds?: ItemId[];
  birthday?: PetBirthday;
  texts?: PetModTexts;
}

export interface PetModManifestV1 extends PetModManifestBase {
  schemaVersion: 1;
}

export interface PetModManifestV2 extends PetModManifestBase {
  schemaVersion: 2;
  items?: PetModItems;
}

export interface PetModManifestV3 extends PetModManifestBase {
  schemaVersion: 3;
  items?: PetModItems;
  activities?: PetModActivityDef[];
  events?: PetModEvents;
}

export type PetModManifest = PetModManifestV1 | PetModManifestV2 | PetModManifestV3;

export interface ParsedPetMod {
  manifest: PetModManifest;
  petImages: Record<string, Blob | undefined>;
  itemImages: Partial<Record<string, Blob>>;
  cgImages: Partial<Record<ModCgImageKey, Blob>>;
  warnings: string[];
}

export interface ActivePetMod {
  manifest: PetModManifest;
  petImageUrls: Partial<Record<PetImageKey, string>>;
  itemImageUrls: Partial<Record<string, string>>;
  cgImageUrls: Partial<Record<ModCgImageKey, string>>;
}

export type ItemDisplay = ShopItem & {
  displayName: string;
  displaySummary: string;
};

const maxZipBytes = 25 * 1024 * 1024;
const maxImageBytes = 3 * 1024 * 1024;
const idPattern = /^[a-z0-9][a-z0-9._-]{1,63}$/;
const versionPattern = /^[0-9]+(?:\.[0-9]+){0,2}(?:[-+][a-z0-9._-]+)?$/i;
const customLocalIdPattern = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const itemImagePathPattern = /^items\/[a-z0-9][a-z0-9._-]*\.png$/;
const tagPattern = /^[a-z0-9][a-z0-9_-]{0,31}$/;
const allowedEffectKeys = new Set<keyof ItemEffect>(['hunger', 'mood', 'cleanliness', 'energy', 'health']);
const allowedOverrideKeys = new Set(['name', 'summary', 'image']);
const allowedCustomItemKeys = new Set(['id', 'name', 'summary', 'kind', 'price', 'effect', 'image', 'shop', 'tags']);
const allowedItemsKeys = new Set(['overrides', 'custom']);
const allowedPetPaths = new Map<string, PetImageKey>([
  ...petStatusImageKeys.map((key) => ['pet/' + key + '.png', key] as const),
  ...petActivityImageKeys.map((key) => ['pet/' + key + '.png', key] as const),
]);
const allowedItemPaths = new Map<string, ItemImageKey>(itemImageKeys.map((key) => ['items/' + key + '.png', key] as const));
const allowedCgPaths = new Map<string, ModCgImageKey>(modCgImageKeys.map((key) => ['cg/' + key + '.png', key] as const));
const itemIdSet = new Set<ItemImageKey>(itemImageKeys);
const builtinItemIdSet = new Set<BuiltinItemId>([...itemImageKeys, 'birthday_cake']);
const statusSet = new Set<PetStatus>(petStatusImageKeys);
const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asTrimmedString = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : undefined;
};

const ensureString = (value: unknown, field: string, maxLength: number) => {
  const text = asTrimmedString(value, maxLength);
  if (!text) throw new Error('manifest.json is missing ' + field + '.');
  return text;
};

const normalizePath = (path: string) => path.replace(/\\/g, '/').replace(/^\/+/, '');

const isPngBlob = async (blob: Blob) => {
  const header = new Uint8Array(await blob.slice(0, pngHeader.length).arrayBuffer());
  return pngHeader.every((byte, index) => header[index] === byte);
};

const assertKnownKeys = (value: Record<string, unknown>, allowed: ReadonlySet<string>, field: string) => {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error('Unknown field in ' + field + ': ' + key);
  }
};

const readTexts = (value: unknown): PetModTexts | undefined => {
  if (!isObject(value)) return undefined;

  const texts: PetModTexts = {};
  const recentEvent = asTrimmedString(value.recentEvent, 240);
  const favoriteFood = asTrimmedString(value.favoriteFood, 160);
  if (recentEvent) texts.recentEvent = recentEvent;
  if (favoriteFood) texts.favoriteFood = favoriteFood;

  if (isObject(value.status)) {
    const statusTexts: Partial<Record<PetStatus, string>> = {};
    for (const [key, rawText] of Object.entries(value.status)) {
      if (statusSet.has(key as PetStatus)) {
        const text = asTrimmedString(rawText, 24);
        if (text) statusTexts[key as PetStatus] = text;
      }
    }
    if (Object.keys(statusTexts).length > 0) texts.status = statusTexts;
  }

  if (isObject(value.items)) {
    const itemTexts: Partial<Record<ItemImageKey, { name?: string; summary?: string }>> = {};
    for (const [key, rawConfig] of Object.entries(value.items)) {
      if (!itemIdSet.has(key as ItemImageKey)) throw new Error('Unknown item id in texts.items: ' + key);
      if (!isObject(rawConfig)) continue;
      const name = asTrimmedString(rawConfig.name, 28);
      const summary = asTrimmedString(rawConfig.summary, 96);
      if (name || summary) itemTexts[key as ItemImageKey] = { name, summary };
    }
    if (Object.keys(itemTexts).length > 0) texts.items = itemTexts;
  }

  return Object.keys(texts).length > 0 ? texts : undefined;
};

const readImagePath = (value: unknown, field: string) => {
  const path = asTrimmedString(value, 120);
  if (!path) return undefined;
  const normalized = normalizePath(path);
  if (!itemImagePathPattern.test(normalized)) {
    throw new Error(field + ' must reference a PNG directly under items/.');
  }
  return normalized;
};

const readItemOverride = (value: unknown, field: string): PetModItemOverride => {
  if (!isObject(value)) throw new Error(field + ' must be an object.');
  assertKnownKeys(value, allowedOverrideKeys, field);
  const name = asTrimmedString(value.name, 28);
  const summary = asTrimmedString(value.summary, 96);
  const image = readImagePath(value.image, field + '.image');
  if (!name && !summary && !image) throw new Error(field + ' must include name, summary, or image.');
  return { name, summary, image };
};

const readItemEffect = (value: unknown, field: string): ItemEffect => {
  if (value === undefined) return {};
  if (!isObject(value)) throw new Error(field + ' must be an object.');
  const effect: ItemEffect = {};
  for (const [key, rawAmount] of Object.entries(value)) {
    if (!allowedEffectKeys.has(key as keyof ItemEffect)) throw new Error('Unknown effect field in ' + field + ': ' + key);
    if (typeof rawAmount !== 'number' || !Number.isFinite(rawAmount)) {
      throw new Error(field + '.' + key + ' must be a number.');
    }
    if (rawAmount < -100 || rawAmount > 100) {
      throw new Error(field + '.' + key + ' must be between -100 and 100.');
    }
    effect[key as keyof ItemEffect] = Math.trunc(rawAmount);
  }
  return effect;
};

const readShopCategory = (value: unknown, field: string): ShopCategory => {
  if (value === 'food' || value === 'item' || value === 'care' || value === 'garden') return value;
  throw new Error(field + ' must be food, item, care, or garden.');
};

const readPrice = (value: unknown, field: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(field + ' must be a number.');
  const price = Math.trunc(value);
  if (price < 0 || price > 99999) throw new Error(field + ' must be between 0 and 99999.');
  return price;
};

const readTags = (value: unknown, field: string) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(field + ' must be an array.');
  const tags: string[] = [];
  for (const rawTag of value) {
    const tag = asTrimmedString(rawTag, 32);
    if (!tag) continue;
    if (!tagPattern.test(tag)) throw new Error(field + ' contains an invalid tag: ' + tag);
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 16);
};

const readV2Items = (value: unknown, modId: string): PetModItems | undefined => {
  if (value === undefined) return undefined;
  if (!isObject(value)) throw new Error('manifest.json items must be an object.');
  assertKnownKeys(value, allowedItemsKeys, 'items');

  const items: PetModItems = {};

  if (value.overrides !== undefined) {
    if (!isObject(value.overrides)) throw new Error('items.overrides must be an object.');
    const overrides: Partial<Record<ItemImageKey, PetModItemOverride>> = {};
    for (const [key, rawOverride] of Object.entries(value.overrides)) {
      if (!itemIdSet.has(key as ItemImageKey)) throw new Error('Unknown item id in items.overrides: ' + key);
      overrides[key as ItemImageKey] = readItemOverride(rawOverride, 'items.overrides.' + key);
    }
    if (Object.keys(overrides).length > 0) items.overrides = overrides;
  }

  if (value.custom !== undefined) {
    if (!Array.isArray(value.custom)) throw new Error('items.custom must be an array.');
    const custom: PetModCustomItem[] = [];
    const seenIds = new Set<string>();
    value.custom.forEach((rawItem, index) => {
      const field = 'items.custom[' + index + ']';
      if (!isObject(rawItem)) throw new Error(field + ' must be an object.');
      assertKnownKeys(rawItem, allowedCustomItemKeys, field);
      const id = ensureString(rawItem.id, field + '.id', 96) as ItemId;
      const namespace = modId + ':';
      if (!id.startsWith(namespace)) throw new Error(field + '.id must start with ' + namespace);
      const localId = id.slice(namespace.length);
      if (!customLocalIdPattern.test(localId)) {
        throw new Error(field + '.id local part must use lowercase letters, numbers, dashes, or underscores.');
      }
      if (builtinItemIdSet.has(id as BuiltinItemId)) throw new Error(field + '.id cannot use a built-in item id.');
      if (seenIds.has(id)) throw new Error('Duplicate custom item id: ' + id);
      seenIds.add(id);

      custom.push({
        id,
        name: ensureString(rawItem.name, field + '.name', 28),
        summary: ensureString(rawItem.summary, field + '.summary', 96),
        kind: readShopCategory(rawItem.kind, field + '.kind'),
        price: readPrice(rawItem.price, field + '.price'),
        effect: readItemEffect(rawItem.effect, field + '.effect'),
        image: readImagePath(rawItem.image, field + '.image'),
        shop: Boolean(rawItem.shop),
        tags: readTags(rawItem.tags, field + '.tags'),
      });
    });
    if (custom.length > 0) items.custom = custom;
  }

  return items.overrides || items.custom ? items : undefined;
};

const readActivityDef = (value: unknown, modId: string, index: number): PetModActivityDef => {
  const field = 'activities[' + index + ']';
  if (!isObject(value)) throw new Error(field + ' must be an object.');
  const id = ensureString(value.id, field + '.id', 96) as ModActivityId;
  const namespace = modId + ':';
  if (!id.startsWith(namespace)) throw new Error(field + '.id must start with ' + namespace);
  const labelKey = ensureString(value.labelKey, field + '.labelKey', 128);
  const durationMs = typeof value.durationMs === 'number' && Number.isFinite(value.durationMs) && value.durationMs > 0
    ? Math.trunc(value.durationMs)
    : 4500;
  const images = Array.isArray(value.images) ? value.images.map((img: unknown) => asTrimmedString(img, 128)).filter((s): s is string => Boolean(s)) : [];
  return { id, labelKey, durationMs, images };
};

const readEventCondition = (value: unknown, field: string): PetModEventCondition | undefined => {
  if (value === undefined) return undefined;
  if (!isObject(value)) throw new Error(field + ' must be an object.');
  const condition: PetModEventCondition = {};
  if (value.minLevel !== undefined) {
    if (typeof value.minLevel !== 'number' || !Number.isFinite(value.minLevel)) throw new Error(field + '.minLevel must be a number.');
    condition.minLevel = Math.trunc(value.minLevel);
  }
  if (value.minHearts !== undefined) {
    if (typeof value.minHearts !== 'number' || !Number.isFinite(value.minHearts)) throw new Error(field + '.minHearts must be a number.');
    condition.minHearts = Math.trunc(value.minHearts);
  }
  if (value.requiredItemId !== undefined) {
    condition.requiredItemId = asTrimmedString(value.requiredItemId, 96) as ItemId;
  }
  if (value.weather !== undefined) {
    const w = asTrimmedString(value.weather, 16);
    if (w && ['sunny', 'cloudy', 'rainy', 'breezy'].includes(w)) condition.weather = w as WeatherType;
  }
  return Object.keys(condition).length > 0 ? condition : undefined;
};

const readEventReward = (value: unknown, field: string): PetModEventReward => {
  if (!isObject(value)) throw new Error(field + ' must be an object.');
  const reward: PetModEventReward = {};
  if (value.coins !== undefined) {
    if (typeof value.coins !== 'number' || !Number.isFinite(value.coins)) throw new Error(field + '.coins must be a number.');
    reward.coins = Math.trunc(value.coins);
  }
  if (value.hearts !== undefined) {
    if (typeof value.hearts !== 'number' || !Number.isFinite(value.hearts)) throw new Error(field + '.hearts must be a number.');
    reward.hearts = Math.trunc(value.hearts);
  }
  if (value.itemId !== undefined) {
    reward.itemId = asTrimmedString(value.itemId, 96) as ItemId;
  }
  if (value.itemAmount !== undefined) {
    if (typeof value.itemAmount !== 'number' || !Number.isFinite(value.itemAmount)) throw new Error(field + '.itemAmount must be a number.');
    reward.itemAmount = Math.trunc(value.itemAmount);
  }
  reward.effect = readItemEffect(value.effect, field + '.effect');
  return reward;
};

const readEventDefs = (value: unknown, field: string): PetModEventDef[] | undefined => {
  if (!Array.isArray(value)) throw new Error(field + ' must be an array.');
  return value.map((rawEvent, index) => {
    const ef = field + '[' + index + ']';
    if (!isObject(rawEvent)) throw new Error(ef + ' must be an object.');
    const trigger = asTrimmedString(rawEvent.trigger, 20);
    if (trigger !== 'daily_encounter' && trigger !== 'offline' && trigger !== 'sleep') {
      throw new Error(ef + '.trigger must be daily_encounter, offline, or sleep.');
    }
    const weight = typeof rawEvent.weight === 'number' && Number.isFinite(rawEvent.weight) && rawEvent.weight > 0
      ? Math.trunc(rawEvent.weight)
      : 1;
    const conditions = readEventCondition(rawEvent.conditions, ef + '.conditions');
    const rewards = readEventReward(rawEvent.rewards, ef + '.rewards');
    const textKey = ensureString(rawEvent.textKey, ef + '.textKey', 128);
    return { trigger: trigger as PetModEventDef['trigger'], weight, conditions, rewards, textKey };
  });
};

const readV3Events = (value: unknown): PetModEvents | undefined => {
  if (value === undefined) return undefined;
  if (!isObject(value)) throw new Error('events must be an object.');
  const events: PetModEvents = {};
  if (value.daily_encounter !== undefined) {
    const defs = readEventDefs(value.daily_encounter, 'events.daily_encounter');
    if (defs && defs.length > 0) events.daily_encounter = defs;
  }
  if (value.offline !== undefined) {
    const defs = readEventDefs(value.offline, 'events.offline');
    if (defs && defs.length > 0) events.offline = defs;
  }
  if (value.sleep !== undefined) {
    const defs = readEventDefs(value.sleep, 'events.sleep');
    if (defs && defs.length > 0) events.sleep = defs;
  }
  return Object.keys(events).length > 0 ? events : undefined;
};

export const validatePetModManifest = (value: unknown): PetModManifest => {
  if (!isObject(value)) throw new Error('manifest.json must be a JSON object.');

  if (value.schemaVersion !== 1 && value.schemaVersion !== 2 && value.schemaVersion !== 3) {
    if (typeof value.schemaVersion === 'number' && value.schemaVersion > modSchemaVersion) {
      throw new Error('This mod uses a newer schema version. Please upgrade PetPet.');
    }
    throw new Error('manifest.json schemaVersion must be 1, 2, or 3.');
  }

  const id = ensureString(value.id, 'id', 64);
  if (!idPattern.test(id)) {
    throw new Error('manifest.json id must use lowercase letters, numbers, dots, dashes, or underscores.');
  }

  const version = ensureString(value.version, 'version', 32);
  if (!versionPattern.test(version)) {
    throw new Error('manifest.json version should look like 1.0.0.');
  }

  let favoriteFoodIds: ItemId[] | undefined;
  if (Array.isArray(value.favoriteFoodIds)) {
    favoriteFoodIds = [];
    for (const id of value.favoriteFoodIds) {
      if (!itemIdSet.has(id as ItemImageKey)) throw new Error('Unknown item id in favoriteFoodIds: ' + String(id));
      favoriteFoodIds.push(id as ItemId);
    }
  }

  let birthday: PetBirthday | undefined;
  if (value.birthday !== undefined) {
    birthday = normalizePetBirthday(value.birthday);
    if (!birthday) throw new Error('manifest.json birthday must use valid month and day numbers.');
  }

  const common = {
    id,
    name: ensureString(value.name, 'name', 48),
    author: asTrimmedString(value.author, 48),
    version,
    defaultPetName: ensureString(value.defaultPetName, 'defaultPetName', 16),
    description: asTrimmedString(value.description, 160),
    favoriteFoodIds: favoriteFoodIds && favoriteFoodIds.length > 0 ? Array.from(new Set(favoriteFoodIds)) : undefined,
    birthday,
    texts: readTexts(value.texts),
  };

  if (value.schemaVersion === 2) {
    return {
      schemaVersion: 2,
      ...common,
      items: readV2Items(value.items, id),
    };
  }

  if (value.schemaVersion === 3) {
    return {
      schemaVersion: 3,
      ...common,
      items: readV2Items(value.items, id),
      activities: Array.isArray(value.activities)
        ? value.activities.map((a: unknown, i: number) => readActivityDef(a, id, i))
        : undefined,
      events: readV3Events(value.events),
    };
  }

  return {
    schemaVersion: 1,
    ...common,
  };
};

const addReferencedPath = (paths: Map<string, string[]>, imagePath: string | undefined, itemId: string) => {
  if (!imagePath) return;
  const ids = paths.get(imagePath) ?? [];
  ids.push(itemId);
  paths.set(imagePath, ids);
};

const getReferencedItemImagePaths = (manifest: PetModManifest) => {
  const paths = new Map<string, string[]>();
  if (manifest.schemaVersion === 1) {
    for (const [path, key] of allowedItemPaths) addReferencedPath(paths, path, key);
    return paths;
  }

  Object.entries(manifest.items?.overrides ?? {}).forEach(([itemId, override]) => {
    addReferencedPath(paths, override?.image, itemId);
  });
  manifest.items?.custom?.forEach((item) => addReferencedPath(paths, item.image, item.id));
  return paths;
};

export const getModCustomActivityPaths = (manifest: PetModManifestV3): Map<string, string> => {
  const paths = new Map<string, string>();
  if (manifest.schemaVersion !== 3 || !manifest.activities) return paths;
  for (const activity of manifest.activities) {
    for (const image of activity.images) {
      const normalized = normalizePath(image);
      if (normalized.startsWith('pet/') && normalized.endsWith('.png')) {
        paths.set(normalized, activity.id);
      }
    }
  }
  return paths;
};

export const parsePetModZip = async (file: File): Promise<ParsedPetMod> => {
  if (file.size > maxZipBytes) {
    throw new Error('Mod zip is larger than 25MB. Please compress the images.');
  }

  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file);
  const manifestEntry = zip.file('manifest.json');
  if (!manifestEntry) throw new Error('Mod zip must contain manifest.json at the root.');

  let rawManifest: unknown;
  try {
    rawManifest = JSON.parse(await manifestEntry.async('text'));
  } catch {
    throw new Error('manifest.json is not valid JSON.');
  }
  const manifest = validatePetModManifest(rawManifest);
  const warnings: string[] = [];
  const petImages: Record<string, Blob | undefined> = {};
  const itemImages: ParsedPetMod['itemImages'] = {};
  const cgImages: ParsedPetMod['cgImages'] = {};
  const referencedItemImagePaths = getReferencedItemImagePaths(manifest);
  const customActivityPaths = manifest.schemaVersion === 3 ? getModCustomActivityPaths(manifest) : new Map<string, string>();
  const allowedPaths = new Set(['manifest.json', ...allowedPetPaths.keys(), ...customActivityPaths.keys(), ...referencedItemImagePaths.keys(), ...allowedCgPaths.keys()]);

  for (const entry of Object.values(zip.files)) {
    const path = normalizePath(entry.name);
    if (entry.dir || path.endsWith('/')) continue;
    if (!allowedPaths.has(path)) {
      throw new Error('Mod zip contains an unsupported file: ' + path);
    }
  }

  for (const [path, key] of allowedPetPaths) {
    const entry = zip.file(path);
    if (!entry) {
      warnings.push('Missing ' + path + '; built-in image will be used.');
      continue;
    }
    const blob = await entry.async('blob');
    if (blob.size > maxImageBytes) throw new Error(path + ' is larger than 3MB.');
    if (!(await isPngBlob(blob))) throw new Error(path + ' must be a PNG image.');
    petImages[key] = blob.slice(0, blob.size, 'image/png');
  }

  for (const [path, activityId] of customActivityPaths) {
    const entry = zip.file(path);
    if (!entry) {
      warnings.push('Missing ' + path + '; custom activity image will be skipped.');
      continue;
    }
    const blob = await entry.async('blob');
    if (blob.size > maxImageBytes) throw new Error(path + ' is larger than 3MB.');
    if (!(await isPngBlob(blob))) throw new Error(path + ' must be a PNG image.');
    petImages[activityId] = blob.slice(0, blob.size, 'image/png');
  }

  for (const [path, itemIds] of referencedItemImagePaths) {
    const entry = zip.file(path);
    if (!entry) {
      warnings.push('Missing ' + path + '; built-in icon or placeholder will be used.');
      continue;
    }
    const blob = await entry.async('blob');
    if (blob.size > maxImageBytes) throw new Error(path + ' is larger than 3MB.');
    if (!(await isPngBlob(blob))) throw new Error(path + ' must be a PNG image.');
    const imageBlob = blob.slice(0, blob.size, 'image/png');
    itemIds.forEach((itemId) => {
      itemImages[itemId] = imageBlob;
    });
  }

  for (const [path, key] of allowedCgPaths) {
    const entry = zip.file(path);
    if (!entry) continue;
    const blob = await entry.async('blob');
    if (blob.size > maxImageBytes) throw new Error(path + ' is larger than 3MB.');
    if (!(await isPngBlob(blob))) throw new Error(path + ' must be a PNG image.');
    cgImages[key] = blob.slice(0, blob.size, 'image/png');
  }

  return { manifest, petImages, itemImages, cgImages, warnings };
};

export const getModFavoriteFoodIds = (mod?: ActivePetMod | null) => mod?.manifest.favoriteFoodIds;

export const formatFavoriteFoodText = (mod: ActivePetMod | null | undefined, amount: number) => {
  const template = mod?.manifest.texts?.favoriteFood;
  return template ? template.replace(/\{amount\}/g, String(amount)) : undefined;
};

export const getModStatusText = (mod: ActivePetMod | null | undefined, status: PetStatus) =>
  mod?.manifest.texts?.status?.[status];

export const getDisplayItems = (
  items: readonly ShopItem[],
  mod: ActivePetMod | null | undefined,
): readonly ItemDisplay[] =>
  items.map((item) => {
    const itemImageKey = itemIdSet.has(item.id as ItemImageKey) ? (item.id as ItemImageKey) : undefined;
    const override = itemImageKey && mod?.manifest.schemaVersion === 2
      ? mod.manifest.items?.overrides?.[itemImageKey]
      : undefined;
    const textOverride = itemImageKey ? mod?.manifest.texts?.items?.[itemImageKey] : undefined;
    return {
      ...item,
      displayName: override?.name ?? textOverride?.name ?? item.name,
      displaySummary: override?.summary ?? textOverride?.summary ?? item.summary,
    };
  });

export const getDisplayShopItems = getDisplayItems;

export type { InventoryItemDefinition };
