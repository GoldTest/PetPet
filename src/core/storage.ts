import { normalizePet, type PetState } from './pet';
import { loadStoredPetJson } from './saveCodec';
import { saveCloudSave, loadCloudSave, type CloudActiveModInfo, type CloudSaveData } from './supabase';

const storageKey = 'petpet.pet.v1';

let currentUserId: string | null = null;
let lastCloudSaveTime = 0;
let currentCloudModInfo: CloudActiveModInfo | null = null;
const CLOUD_SAVE_INTERVAL = 30_000;

export const setCloudUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const setCloudActiveMod = (mod: CloudActiveModInfo | null) => {
  currentCloudModInfo = mod;
};

export const getCloudActiveMod = (): CloudActiveModInfo | null => currentCloudModInfo;

export const hasStoredPet = () => window.localStorage.getItem(storageKey) !== null;

export const loadPet = (now = Date.now()): PetState => loadStoredPetJson(window.localStorage.getItem(storageKey), now);

export const loadPetOrNull = (now = Date.now()): PetState | null => {
  const raw = window.localStorage.getItem(storageKey);
  return raw ? loadStoredPetJson(raw, now) : null;
};

export interface CloudPetWithMod {
  pet: PetState;
  activeMod: CloudActiveModInfo | null;
}

export const tryLoadCloudPet = async (userId: string, now = Date.now()): Promise<CloudPetWithMod | null> => {
  try {
    const cloud = await loadCloudSave(userId);
    if (cloud) {
      return {
        pet: loadStoredPetJson(JSON.stringify(cloud.pet), now),
        activeMod: cloud.activeMod,
      };
    }
  } catch {
    // ignore
  }
  return null;
};

export const savePet = (pet: PetState) => {
  const normalized = normalizePet(pet);
  window.localStorage.setItem(storageKey, JSON.stringify(normalized));
  if (!currentUserId) return;
  const now = Date.now();
  if (now - lastCloudSaveTime < CLOUD_SAVE_INTERVAL) return;
  lastCloudSaveTime = now;
  const cloudData: CloudSaveData = {
    pet: normalized,
    activeMod: currentCloudModInfo,
    updatedAt: new Date(now).toISOString(),
  };
  saveCloudSave(currentUserId, cloudData).catch(() => {});
};

export const syncFromCloud = async (userId: string, now = Date.now()): Promise<CloudPetWithMod | null> => {
  try {
    const cloud = await loadCloudSave(userId);
    if (!cloud) return null;
    const pet = loadStoredPetJson(JSON.stringify(cloud.pet), now);
    if (pet) {
      window.localStorage.setItem(storageKey, JSON.stringify(pet));
    }
    return { pet, activeMod: cloud.activeMod };
  } catch {
    return null;
  }
};

export const uploadLocalToCloud = (userId: string, pet: PetState, modInfo: CloudActiveModInfo | null) => {
  const normalized = normalizePet(pet);
  const cloudData: CloudSaveData = {
    pet: normalized,
    activeMod: modInfo,
    updatedAt: new Date().toISOString(),
  };
  lastCloudSaveTime = Date.now();
  return saveCloudSave(userId, cloudData);
};

export const clearPet = () => {
  window.localStorage.removeItem(storageKey);
};