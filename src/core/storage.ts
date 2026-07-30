import { normalizePet, type PetState } from './pet';
import { loadStoredPetJson } from './saveCodec';
import { saveCloudSave, loadCloudSave, type CloudActiveModInfo, type CloudSaveData } from './supabase';

const storageKey = 'petpet.pet.v1';

let currentUserId: string | null = null;
let lastCloudSaveTime = 0;
let currentCloudModInfo: CloudActiveModInfo | null = null;
let currentSessionId: string = '';
let sessionExpired = false;
const CLOUD_SAVE_INTERVAL = 30_000;

const generateSessionId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 18);

export const setCloudUserId = (userId: string | null) => {
  currentUserId = userId;
  currentSessionId = userId ? generateSessionId() : '';
  sessionExpired = false;
};

export const isCloudSessionExpired = () => sessionExpired;

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

/**
 * 加载云存档并夺取 session 所有权。
 * 其他设备登录同账号后，本设备的 sessionId 会失效，后续保存将被拒绝。
 */
export const tryLoadCloudPet = async (userId: string, now = Date.now()): Promise<CloudPetWithMod | null> => {
  try {
    const cloud = await loadCloudSave(userId);
    if (cloud) {
      const pet = loadStoredPetJson(JSON.stringify(cloud.pet), now);
      currentSessionId = generateSessionId();
      sessionExpired = false;
      await saveCloudSave(userId, {
        pet: normalizePet(pet),
        activeMod: cloud.activeMod,
        updatedAt: new Date().toISOString(),
        sessionId: currentSessionId,
      }).catch(() => {});
      return { pet, activeMod: cloud.activeMod };
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
  if (sessionExpired) return;
  const now = Date.now();
  if (now - lastCloudSaveTime < CLOUD_SAVE_INTERVAL) return;
  lastCloudSaveTime = now;
  void (async () => {
    try {
      const cloud = await loadCloudSave(currentUserId!);
      if (cloud && cloud.sessionId && cloud.sessionId !== currentSessionId) {
        sessionExpired = true;
        return;
      }
      const cloudData: CloudSaveData = {
        pet: normalized,
        activeMod: currentCloudModInfo,
        updatedAt: new Date(now).toISOString(),
        sessionId: currentSessionId,
      };
      await saveCloudSave(currentUserId!, cloudData);
    } catch {
      // ignore
    }
  })();
};

export const syncFromCloud = async (userId: string, now = Date.now()): Promise<CloudPetWithMod | null> => {
  try {
    const cloud = await loadCloudSave(userId);
    if (!cloud) return null;
    const pet = loadStoredPetJson(JSON.stringify(cloud.pet), now);
    if (pet) {
      window.localStorage.setItem(storageKey, JSON.stringify(pet));
    }
    currentSessionId = generateSessionId();
    sessionExpired = false;
    await saveCloudSave(userId, {
      pet: normalizePet(pet),
      activeMod: cloud.activeMod,
      updatedAt: new Date().toISOString(),
      sessionId: currentSessionId,
    }).catch(() => {});
    return { pet, activeMod: cloud.activeMod };
  } catch {
    return null;
  }
};

export const uploadLocalToCloud = (userId: string, pet: PetState, modInfo: CloudActiveModInfo | null) => {
  const normalized = normalizePet(pet);
  currentSessionId = generateSessionId();
  sessionExpired = false;
  const cloudData: CloudSaveData = {
    pet: normalized,
    activeMod: modInfo,
    updatedAt: new Date().toISOString(),
    sessionId: currentSessionId,
  };
  lastCloudSaveTime = Date.now();
  return saveCloudSave(userId, cloudData);
};

export const clearPet = () => {
  window.localStorage.removeItem(storageKey);
};