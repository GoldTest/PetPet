import {
  itemImageKeys as builtinItemImageKeys,
  modCgImageKeys,
  petActivityImageKeys,
  petStatusImageKeys,
  validatePetModManifest,
  type ActivePetMod,
  type ParsedPetMod,
  type PetImageKey,
  type PetModManifest,
} from './mod';

const manifestsStorageKey = 'petpet.mod.manifests.v1';
const activeModIdKey = 'petpet.mod.activeId.v1';
const activeBuiltinIdKey = 'petpet.mod.activeBuiltinId.v1';
const databaseName = 'petpet-mods';
const imageStoreName = 'images';
const databaseVersion = 2;

type ImageScope = 'pet' | 'item' | 'cg';

interface StoredModEntry {
  manifest: PetModManifest;
  importedAt: number;
  fileName?: string;
}

interface StoredImageRecord {
  key: string;
  modId: string;
  scope: ImageScope;
  imageKey: string;
  blob: Blob;
}

const objectUrls = new Set<string>();

const revokeObjectUrls = () => {
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls.clear();
};

const getImageRecordKey = (modId: string, scope: ImageScope, key: string) => `${modId}:${scope}:${key}`;

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onerror = () => reject(request.error ?? new Error('Unable to open mod image database.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(imageStoreName)) {
        const store = db.createObjectStore(imageStoreName, { keyPath: 'key' });
        store.createIndex('modId', 'modId', { unique: false });
      } else {
        const store = request.transaction?.objectStore(imageStoreName);
        if (store && !store.indexNames.contains('modId')) {
          store.createIndex('modId', 'modId', { unique: false });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
  });

const withStore = async <T>(mode: IDBTransactionMode, execute: (store: IDBObjectStore) => IDBRequest<T>) => {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(imageStoreName, mode);
      const request = execute(tx.objectStore(imageStoreName));
      request.onerror = () => reject(request.error ?? tx.error ?? new Error('Mod image database request failed.'));
      request.onsuccess = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error('Mod image database transaction failed.'));
      tx.onabort = () => reject(tx.error ?? new Error('Mod image database transaction aborted.'));
    });
  } finally {
    db.close();
  }
};

const putRecord = (record: StoredImageRecord) => withStore('readwrite', (store) => store.put(record));
const getRecord = (key: string) => withStore<StoredImageRecord | undefined>('readonly', (store) => store.get(key));
const deleteRecord = (key: string) => withStore('readwrite', (store) => store.delete(key));

const getModIds = (): string[] => {
  try {
    const raw = window.localStorage.getItem(manifestsStorageKey);
    if (!raw) return [];
    const entries: StoredModEntry[] = JSON.parse(raw);
    return entries.map((e) => e.manifest.id);
  } catch {
    return [];
  }
};

const getStoredModEntry = (modId: string): StoredModEntry | null => {
  try {
    const raw = window.localStorage.getItem(manifestsStorageKey);
    if (!raw) return null;
    const entries: StoredModEntry[] = JSON.parse(raw);
    return entries.find((e) => e.manifest.id === modId) ?? null;
  } catch {
    return null;
  }
};

const setStoredModEntry = (entry: StoredModEntry) => {
  try {
    const raw = window.localStorage.getItem(manifestsStorageKey);
    let entries: StoredModEntry[] = raw ? JSON.parse(raw) : [];
    const existing = entries.findIndex((e) => e.manifest.id === entry.manifest.id);
    if (existing >= 0) {
      entries[existing] = entry;
    } else {
      entries.push(entry);
    }
    window.localStorage.setItem(manifestsStorageKey, JSON.stringify(entries));
  } catch {
    throw new Error('Failed to store mod manifest.');
  }
};

const removeStoredModEntry = (modId: string) => {
  try {
    const raw = window.localStorage.getItem(manifestsStorageKey);
    if (!raw) return;
    let entries: StoredModEntry[] = JSON.parse(raw);
    entries = entries.filter((e) => e.manifest.id !== modId);
    window.localStorage.setItem(manifestsStorageKey, JSON.stringify(entries));
    if (getActiveModId() === modId) setActiveModId(null);
  } catch {
    throw new Error('Failed to remove mod manifest.');
  }
};

// ---- Multi-mod public API ----

export const listStoredMods = (): StoredModEntry[] => {
  try {
    const raw = window.localStorage.getItem(manifestsStorageKey);
    if (!raw) return [];
    const entries: StoredModEntry[] = JSON.parse(raw);
    return entries.map((e) => ({
      ...e,
      manifest: validatePetModManifest(e.manifest),
    }));
  } catch {
    window.localStorage.removeItem(manifestsStorageKey);
    return [];
  }
};

export const getActiveModId = (): string | null => {
  try {
    return window.localStorage.getItem(activeModIdKey);
  } catch {
    return null;
  }
};

export const setActiveModId = (id: string | null) => {
  if (id === null) {
    window.localStorage.removeItem(activeModIdKey);
  } else {
    window.localStorage.setItem(activeModIdKey, id);
  }
};

export const getActiveBuiltinId = (): string | null => {
  try {
    return window.localStorage.getItem(activeBuiltinIdKey);
  } catch {
    return null;
  }
};

export const setActiveBuiltinId = (id: string | null) => {
  if (id === null) {
    window.localStorage.removeItem(activeBuiltinIdKey);
  } else {
    window.localStorage.setItem(activeBuiltinIdKey, id);
  }
};

export const getStoredPetModManifest = (): PetModManifest | null => {
  const activeId = getActiveModId();
  if (!activeId) return null;
  const entry = getStoredModEntry(activeId);
  return entry?.manifest ?? null;
};

export const saveActivePetMod = async (mod: ParsedPetMod, fileName?: string) => {
  setStoredModEntry({ manifest: mod.manifest, importedAt: Date.now(), fileName });
  setActiveModId(mod.manifest.id);

  for (const [imageKey, blob] of Object.entries(mod.petImages)) {
    if (!blob) continue;
    await putRecord({
      key: getImageRecordKey(mod.manifest.id, 'pet', imageKey),
      modId: mod.manifest.id,
      scope: 'pet',
      imageKey,
      blob,
    });
  }
  for (const [imageKey, blob] of Object.entries(mod.itemImages)) {
    if (!blob) continue;
    await putRecord({
      key: getImageRecordKey(mod.manifest.id, 'item', imageKey),
      modId: mod.manifest.id,
      scope: 'item',
      imageKey,
      blob,
    });
  }
  for (const [imageKey, blob] of Object.entries(mod.cgImages)) {
    if (!blob) continue;
    await putRecord({
      key: getImageRecordKey(mod.manifest.id, 'cg', imageKey),
      modId: mod.manifest.id,
      scope: 'cg',
      imageKey,
      blob,
    });
  }
};

export const clearActivePetMod = async () => {
  const activeId = getActiveModId();
  if (activeId) {
    await removePetMod(activeId);
  }
  revokeObjectUrls();
};

export const removePetMod = async (modId: string) => {
  removeStoredModEntry(modId);
  const allIds = getModIds();
  const db = await openDatabase();
  try {
    const tx = db.transaction(imageStoreName, 'readwrite');
    const store = tx.objectStore(imageStoreName);
    const index = store.index('modId');
    const request = index.openCursor(IDBKeyRange.only(modId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to clear mod images.'));
      tx.onabort = () => reject(tx.error ?? new Error('Mod image cleanup aborted.'));
    });
  } finally {
    db.close();
  }
  if (allIds.length === 0) setActiveModId(null);
};

export const loadActivePetMod = async (): Promise<ActivePetMod | null> => {
  const activeId = getActiveModId();
  if (!activeId) {
    revokeObjectUrls();
    return null;
  }
  return loadPetMod(activeId);
};

export const loadPetMod = async (modId: string): Promise<ActivePetMod | null> => {
  const entry = getStoredModEntry(modId);
  if (!entry) return null;
  const manifest = entry.manifest;
  revokeObjectUrls();

  const petImageUrls: ActivePetMod['petImageUrls'] = {};
  const itemImageUrls: ActivePetMod['itemImageUrls'] = {};
  const cgImageUrls: ActivePetMod['cgImageUrls'] = {};

  for (const key of [...petStatusImageKeys, ...petActivityImageKeys]) {
    const record = await getRecord(getImageRecordKey(manifest.id, 'pet', key));
    if (!record?.blob) continue;
    const url = URL.createObjectURL(record.blob);
    objectUrls.add(url);
    petImageUrls[key as PetImageKey] = url;
  }

  const storedItemImageKeys = manifest.schemaVersion === 2
    ? [
        ...Object.keys(manifest.items?.overrides ?? {}),
        ...(manifest.items?.custom ?? []).map((item: { id: string }) => item.id),
      ]
    : [...builtinItemImageKeys];

  for (const key of storedItemImageKeys) {
    const record = await getRecord(getImageRecordKey(manifest.id, 'item', key));
    if (!record?.blob) continue;
    const url = URL.createObjectURL(record.blob);
    objectUrls.add(url);
    itemImageUrls[key] = url;
  }

  for (const key of modCgImageKeys) {
    const record = await getRecord(getImageRecordKey(manifest.id, 'cg', key));
    if (!record?.blob) continue;
    const url = URL.createObjectURL(record.blob);
    objectUrls.add(url);
    cgImageUrls[key] = url;
  }

  return { manifest, petImageUrls, itemImageUrls, cgImageUrls };
};
