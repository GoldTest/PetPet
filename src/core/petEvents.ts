import { pick, t } from '../i18n';
import { applyHeartGain, recordEarnedCoins, recordEarnedHearts } from './achievements';
import { addInventoryItem } from './items';
import { createNeighborGift } from './neighborGifts';
import { clampCoins, clampPetHealth, clampPetStat } from './petStats';
import type { ItemEffect, ItemId, NeighborEventContext, PetState, WeatherType } from './petTypes';
import type { PetModEventDef, PetModEvents } from './mod';
import { hashString, pickRandom } from './utils';

export interface DailyEncounter {
  kind?: 'neighbor_gift';
  coins?: number;
  hearts?: number;
  itemId?: ItemId;
  itemAmount?: number;
  effect?: ItemEffect;
  text: string;
}

export interface TimedEvent {
  kind?: 'neighbor_gift';
  coins?: number;
  hearts?: number;
  itemId?: ItemId;
  itemAmount?: number;
  effect?: ItemEffect;
  text: string;
}

export const getNeighborGiftEvent = (context: NeighborEventContext | undefined, _key: 'dailyEncounter' | 'offlineEvent'): TimedEvent => {
  const { neighborName, gift } = createNeighborGift(context);
  return {
    kind: 'neighbor_gift',
    itemId: gift.itemId,
    itemAmount: 1,
    text: neighborName ? `${neighborName}: ${gift.displayName}` : gift.displayName,
  };
};

const dreamEventMinSleepMinutes = 15;

export const dreamTalkStartDelayMs = 8 * 60 * 1000;

export const dreamTalkCooldownMs = 15 * 60 * 1000;

export const getRandomDailyEncounter = (name: string): DailyEncounter =>
  pickRandom([
    {
      coins: 18,
      text: t('pet.dailyEncounter.coins', { name }),
    },
    {
      itemId: 'emergency_biscuit',
      itemAmount: 1,
      text: t('pet.dailyEncounter.biscuit'),
    },
    {
      effect: { mood: 8, cleanliness: -2 },
      text: t('pet.dailyEncounter.sun', { name }),
    },
    {
      effect: { energy: 10 },
      text: t('pet.dailyEncounter.rest', { name }),
    },
    {
      effect: { hunger: 10, cleanliness: -3 },
      text: t('pet.dailyEncounter.snack', { name }),
    },
    {
      effect: { mood: -5 },
      text: t('pet.dailyEncounter.nightmare', { name }),
    },
    {
      hearts: 1,
      text: t('pet.dailyEncounter.heart', { name, hearts: '{hearts}' }),
    },
  ]);

const getLevelTierDailyPool = (name: string, level: number): DailyEncounter[] => {
  const base = getRandomDailyEncounter(name);
  if (level < 4) return [base];
  const tier4: DailyEncounter[] = [
    {
      coins: 30,
      text: t('pet.dailyEncounter.coins', { name }),
    },
    {
      itemId: 'bento',
      itemAmount: 1,
      text: t('pet.dailyEncounter.scaled.bento'),
    },
    {
      effect: { mood: 12, energy: 5 },
      text: t('pet.dailyEncounter.scaled.goodDay', { name }),
    },
    {
      hearts: 2,
      text: t('pet.dailyEncounter.heart', { name, hearts: '{hearts}' }),
    },
  ];
  if (level < 8) return [base, ...tier4];
  return [
    ...tier4,
    {
      coins: 45,
      text: t('pet.dailyEncounter.coins', { name }),
    },
    {
      itemId: 'strawberry_cake',
      itemAmount: 1,
      text: t('pet.dailyEncounter.scaled.cake'),
    },
    {
      effect: { mood: 16, hunger: 8, energy: 8 },
      text: t('pet.dailyEncounter.scaled.wonderful', { name }),
    },
    {
      hearts: 3,
      text: t('pet.dailyEncounter.heart', { name, hearts: '{hearts}' }),
    },
  ];
};

export const getRandomDailyEncounterScaled = (pet: PetState): DailyEncounter =>
  pickRandom(getLevelTierDailyPool(pet.name, pet.level));

export const getRandomOfflineDiary = (name: string, weather: WeatherType) => pick(`pet.offlineDiary.${weather}`, { name });

export const getRandomOfflineEvent = (name: string, weather: WeatherType): TimedEvent =>
  pickRandom([
    {
      coins: 12,
      text: t('pet.offlineEvent.coins', { name }),
    },
    {
      itemId: 'emergency_biscuit',
      itemAmount: 1,
      text: t('pet.offlineEvent.biscuit'),
    },
    {
      hearts: 1,
      text: t('pet.offlineEvent.heart', { name, hearts: '{hearts}' }),
    },
    {
      effect: { mood: 6, cleanliness: -2 },
      text: weather === 'sunny' ? t('pet.offlineEvent.sunnyPlay', { name }) : t('pet.offlineEvent.play', { name }),
    },
    {
      effect: { hunger: -4, mood: 4 },
      text: t('pet.offlineEvent.hungryHappy', { name }),
    },
    {
      effect: { energy: 8 },
      text: t('pet.offlineEvent.rest', { name }),
    },
    {
      effect: { cleanliness: -5 },
      text: t('pet.offlineEvent.mess', { name }),
    },
  ]);

const getLevelTierOfflinePool = (name: string, weather: WeatherType, level: number): TimedEvent[] => {
  const base = getRandomOfflineEvent(name, weather);
  if (level < 4) return [base];
  const tier4: TimedEvent[] = [
    {
      coins: 22,
      text: t('pet.offlineEvent.coins', { name }),
    },
    {
      itemId: 'apple',
      itemAmount: 1,
      text: t('pet.offlineEvent.scaled.fruit'),
    },
    {
      effect: { mood: 8, energy: 4 },
      text: t('pet.offlineEvent.scaled.stroll', { name }),
    },
  ];
  if (level < 8) return [base, ...tier4];
  return [
    ...tier4,
    {
      coins: 35,
      text: t('pet.offlineEvent.coins', { name }),
    },
    {
      itemId: 'nutri_meal',
      itemAmount: 1,
      text: t('pet.offlineEvent.scaled.meal'),
    },
    {
      effect: { mood: 12, health: 2 },
      text: t('pet.offlineEvent.scaled.adventure', { name }),
    },
    {
      hearts: 2,
      text: t('pet.offlineEvent.heart', { name, hearts: '{hearts}' }),
    },
  ];
};

export const getRandomOfflineEventScaled = (pet: PetState, weather: WeatherType): TimedEvent =>
  pickRandom(getLevelTierOfflinePool(pet.name, weather, pet.level));

export const getRandomDreamEvent = (name: string): TimedEvent =>
  pickRandom([
    {
      effect: { mood: 3 },
      text: t('pet.dreamEvent.cloudNap', { name }),
    },
    {
      coins: 10,
      text: t('pet.dreamEvent.coinPath', { name }),
    },
    {
      hearts: 1,
      text: t('pet.dreamEvent.sticker', { name, hearts: '{hearts}' }),
    },
    {
      itemId: 'emergency_biscuit',
      itemAmount: 1,
      text: t('pet.dreamEvent.biscuit'),
    },
    {
      effect: { energy: 4, cleanliness: -1 },
      text: t('pet.dreamEvent.puddleRun', { name }),
    },
  ]);

const modEventToDailyEncounter = (def: PetModEventDef, pet: PetState): DailyEncounter => ({
  coins: def.rewards.coins,
  hearts: def.rewards.hearts,
  itemId: def.rewards.itemId,
  itemAmount: def.rewards.itemAmount,
  effect: def.rewards.effect,
  text: interpolateModEventText(def.textKey, pet, 0),
});

const modEventToTimedEvent = (def: PetModEventDef, pet: PetState): TimedEvent => ({
  coins: def.rewards.coins,
  hearts: def.rewards.hearts,
  itemId: def.rewards.itemId,
  itemAmount: def.rewards.itemAmount,
  effect: def.rewards.effect,
  text: interpolateModEventText(def.textKey, pet, 0),
});

const getEligibleModEvents = (pet: PetState, trigger: PetModEventDef['trigger']): PetModEventDef[] => {
  const defs = getModEventsForTrigger(trigger);
  if (!defs) return [];
  return defs.filter((def) => checkModEventCondition(pet, def.conditions));
};

const pickWeighted = <T extends { weight?: number }>(items: T[]): T | undefined => {
  if (items.length === 0) return undefined;
  const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  if (totalWeight <= 0) return items[Math.floor(Math.random() * items.length)];
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= item.weight ?? 1;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
};

export const getRandomDailyEncounterWithMod = (pet: PetState): DailyEncounter | TimedEvent => {
  const builtin = getRandomDailyEncounterScaled(pet);
  const eligible = getEligibleModEvents(pet, 'daily_encounter');
  if (eligible.length === 0) return builtin;
  const modEvents: (DailyEncounter & { weight: number })[] = eligible.map((def) => ({
    ...modEventToDailyEncounter(def, pet),
    weight: def.weight,
  }));

  const combined = [
    { ...builtin, weight: 1 },
    ...modEvents,
  ];
  return pickWeighted(combined) ?? builtin;
};

export const getRandomOfflineEventWithMod = (pet: PetState, weather: WeatherType): TimedEvent => {
  const builtin = getRandomOfflineEventScaled(pet, weather);
  const eligible = getEligibleModEvents(pet, 'offline');
  if (eligible.length === 0) return builtin;
  const modEvents: (TimedEvent & { weight: number })[] = eligible.map((def) => ({
    ...modEventToTimedEvent(def, pet),
    weight: def.weight,
  }));
  const combined = [
    { ...builtin, weight: 1 },
    ...modEvents,
  ];
  return pickWeighted(combined) ?? builtin;
};

export const applyTimedEvent = (pet: PetState, event: TimedEvent, now: number, prefix: string): PetState => {
  const effect = event.effect ?? {};
  const heartGain = applyHeartGain(pet, event.hearts ?? 0);
  const withEvent: PetState = {
    ...pet,
    hunger: clampPetStat(pet, pet.hunger + (effect.hunger ?? 0)),
    mood: clampPetStat(pet, pet.mood + (effect.mood ?? 0)),
    cleanliness: clampPetStat(pet, pet.cleanliness + (effect.cleanliness ?? 0)),
    energy: clampPetStat(pet, pet.energy + (effect.energy ?? 0)),
    health: clampPetHealth(pet, pet.health + (effect.health ?? 0)),
    coins: clampCoins(pet.coins + (event.coins ?? 0)),
    hearts: heartGain.hearts,
    boostCards: heartGain.boostCards,
    inventory: event.itemId ? addInventoryItem(pet.inventory, event.itemId, event.itemAmount ?? 1) : pet.inventory,
    recentEvent: `${prefix}${event.text.replace(/\{hearts\}/g, String(heartGain.amount))}`,
    lastDailyRewardAt: prefix === t('pet.prefix.dailyEncounter') ? now : pet.lastDailyRewardAt,
    lastDailyEncounterAt: prefix === t('pet.prefix.dailyEncounter') ? now : pet.lastDailyEncounterAt,
  };
  return recordEarnedHearts(recordEarnedCoins(withEvent, event.coins ?? 0), heartGain.amount);
};

// ---- Mod Event Integration ----

let activeModEvents: PetModEvents | null = null;

export const setModEventDefs = (events: PetModEvents | null) => {
  activeModEvents = events;
};

export const getModEventDefs = (): PetModEvents | null => activeModEvents;

const checkModEventCondition = (pet: PetState, conditions: PetModEventDef['conditions']): boolean => {
  if (!conditions) return true;
  if (conditions.minLevel !== undefined && pet.level < conditions.minLevel) return false;
  if (conditions.minHearts !== undefined && pet.hearts < conditions.minHearts) return false;
  if (conditions.requiredItemId !== undefined && !pet.inventory[conditions.requiredItemId]) return false;
  if (conditions.weather !== undefined && pet.weather !== conditions.weather) return false;
  return true;
};

const interpolateModEventText = (textKey: string, pet: PetState, heartAmount: number): string => {
  const template = t(textKey) as string;
  return template
    .replace(/\{name\}/g, pet.name)
    .replace(/\{hearts\}/g, String(heartAmount));
};

const getModEventsForTrigger = (trigger: PetModEventDef['trigger']): PetModEventDef[] | undefined => {
  if (!activeModEvents) return undefined;
  switch (trigger) {
    case 'daily_encounter': return activeModEvents.daily_encounter;
    case 'offline': return activeModEvents.offline;
    case 'sleep': return activeModEvents.sleep;
  }
};

const addEffects = (left?: ItemEffect, right?: ItemEffect): ItemEffect | undefined => {
  if (!left && !right) return undefined;
  return {
    hunger: (left?.hunger ?? 0) + (right?.hunger ?? 0),
    mood: (left?.mood ?? 0) + (right?.mood ?? 0),
    cleanliness: (left?.cleanliness ?? 0) + (right?.cleanliness ?? 0),
    energy: (left?.energy ?? 0) + (right?.energy ?? 0),
    health: (left?.health ?? 0) + (right?.health ?? 0),
  };
};

export const getRandomDreamEventWithMod = (pet: PetState): TimedEvent => {
  const builtin = getRandomDreamEvent(pet.name);
  const eligible = getEligibleModEvents(pet, 'sleep');
  if (eligible.length === 0) return builtin;
  const modEvents: (TimedEvent & { weight: number })[] = eligible.map((def) => ({
    ...modEventToTimedEvent(def, pet),
    weight: def.weight,
  }));
  const combined = [
    { ...builtin, weight: 1 },
    ...modEvents,
  ];
  return pickWeighted(combined) ?? builtin;
};

const addDreamEvent = (event: TimedEvent, pet: PetState, sleptMinutes: number): TimedEvent => {
  if (sleptMinutes < dreamEventMinSleepMinutes) return event;

  const dream = getRandomDreamEventWithMod(pet);
  return {
    effect: addEffects(event.effect, dream.effect),
    coins: (event.coins ?? 0) + (dream.coins ?? 0),
    hearts: (event.hearts ?? 0) + (dream.hearts ?? 0),
    itemId: dream.itemId ?? event.itemId,
    itemAmount: dream.itemId ? dream.itemAmount ?? 1 : event.itemAmount,
    text: `${event.text} ${t('pet.prefix.dreamEvent')}${dream.text}`,
  };
};

const getSleepSettlement = (pet: PetState, now: number): TimedEvent => {
  const sleptMinutes = pet.sleepStartedAt > 0 ? Math.floor((now - pet.sleepStartedAt) / 60000) : 0;
  const startMood = pet.sleepStartMood || pet.mood;
  const startHunger = pet.sleepStartHunger || pet.hunger;
  const startCleanliness = pet.sleepStartCleanliness || pet.cleanliness;

  if (sleptMinutes < 10) {
    return {
      effect: { mood: -1 },
      text: t('pet.sleepSettlement.tooShort', { name: pet.name }),
    };
  }

  if (startMood <= 25 || startHunger <= 25 || startCleanliness <= 25) {
    return addDreamEvent({
      effect: { mood: -3, health: -1 },
      text: t('pet.sleepSettlement.bad', { name: pet.name }),
    }, pet, sleptMinutes);
  }

  if (startMood >= 60 && startHunger >= 45 && startCleanliness >= 45 && sleptMinutes >= 20) {
    return addDreamEvent({
      effect: { mood: 4, energy: 5 },
      text: t('pet.sleepSettlement.good', { name: pet.name }),
    }, pet, sleptMinutes);
  }

  return addDreamEvent({
    effect: { mood: 2 },
    text: t('pet.sleepSettlement.normal', { name: pet.name }),
  }, pet, sleptMinutes);
};

export const resetSleepSnapshot = (pet: PetState): PetState => ({
  ...pet,
  sleepStartedAt: 0,
  sleepStartMood: 0,
  sleepStartHunger: 0,
  sleepStartCleanliness: 0,
  lastDreamTalkAt: 0,
});

export const wakePet = (pet: PetState, now: number): PetState => ({
  ...pet,
  isSleeping: false,
  lastEnergyRecoveryAt: now,
  lastUpdatedAt: now,
});

export const startSleepSnapshot = (pet: PetState, now: number): PetState => ({
  ...pet,
  sleepStartedAt: pet.sleepStartedAt > 0 ? pet.sleepStartedAt : now,
  sleepStartMood: pet.sleepStartedAt > 0 ? pet.sleepStartMood : pet.mood,
  sleepStartHunger: pet.sleepStartedAt > 0 ? pet.sleepStartHunger : pet.hunger,
  sleepStartCleanliness: pet.sleepStartedAt > 0 ? pet.sleepStartCleanliness : pet.cleanliness,
  lastDreamTalkAt: pet.sleepStartedAt > 0 ? pet.lastDreamTalkAt : 0,
});

export const settleSleep = (pet: PetState, now: number): PetState =>
  resetSleepSnapshot(applyTimedEvent(pet, getSleepSettlement(pet, now), now, t('pet.prefix.sleepSettlement')));

export const maybeApplyDreamTalk = (pet: PetState, now: number): PetState => {
  if (!pet.isSleeping || pet.sleepStartedAt <= 0) return pet;
  if (now - pet.sleepStartedAt < dreamTalkStartDelayMs) return pet;
  if (pet.lastDreamTalkAt > 0 && now - pet.lastDreamTalkAt < dreamTalkCooldownMs) return pet;

  const bucket = Math.floor(now / dreamTalkCooldownMs);
  const shouldTalk = hashString(`${pet.name}:${pet.sleepStartedAt}:${bucket}`) % 100 < 55;
  return {
    ...pet,
    lastDreamTalkAt: now,
    recentEvent: shouldTalk ? `${t('pet.prefix.dreamTalk')}${pick('pet.dreamTalk', { name: pet.name })}` : pet.recentEvent,
  };
};
