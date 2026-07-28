import { normalizePet, type PetState } from './pet';
import { loadStoredPetJson } from './saveCodec';
import { saveCloudSave, loadCloudSave } from './supabase';

const storageKey = 'petpet.pet.v1';

let currentUserId: string | null = null;
let lastCloudSaveTime = 0;
const CLOUD_SAVE_INTERVAL = 30_000;

export const setCloudUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const hasStoredPet = () => window.localStorage.getItem(storageKey) !== null;

export const loadPet = (now = Date.now()): PetState => loadStoredPetJson(window.localStorage.getItem(storageKey), now);

export const loadPetOrNull = (now = Date.now()): PetState | null => {
  const raw = window.localStorage.getItem(storageKey);
  return raw ? loadStoredPetJson(raw, now) : null;
};

export const tryLoadCloudPet = async (userId: string, now = Date.now()): Promise<PetState | null> => {
  try {
    const cloud = await loadCloudSave(userId);
    if (cloud) return loadStoredPetJson(JSON.stringify(cloud), now);
  } catch {
    // ignore — fall through to local
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
  saveCloudSave(currentUserId, normalized).catch(() => {});
};

export const clearPet = () => {
  window.localStorage.removeItem(storageKey);
};
