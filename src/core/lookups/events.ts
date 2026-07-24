/** AI 快查表：事件定义 */
/* 来源：petEvents.ts, petCommon.ts, achievements.ts */

export interface EventEntry {
  id: string;
  /** 事件触发器类型 */
  trigger: 'daily_encounter' | 'offline' | 'dream' | 'sleep_settlement' | 'action_streak' | 'health_incident' | 'dream_talk';
  /** 权重（用于随机抽取） */
  weight: number;
  /** 效果 */
  effects: {
    hunger?: number;
    mood?: number;
    cleanliness?: number;
    energy?: number;
    health?: number;
    coins?: number;
    hearts?: number;
    itemId?: string;
    itemAmount?: number;
  };
  /** 产生条件 */
  conditions?: string;
  /** i18n key */
  textKey: string;
}

export const EVENT_TABLE: EventEntry[] = [
  // ===== Daily Encounters (petEvents.ts:33-64) =====
  { id: 'encounter_coins', trigger: 'daily_encounter', weight: 1, effects: { coins: 18 }, textKey: 'pet.dailyEncounter.coins' },
  { id: 'encounter_biscuit', trigger: 'daily_encounter', weight: 1, effects: { itemId: 'emergency_biscuit', itemAmount: 1 }, textKey: 'pet.dailyEncounter.biscuit' },
  { id: 'encounter_sun', trigger: 'daily_encounter', weight: 1, effects: { mood: 8, cleanliness: -2 }, textKey: 'pet.dailyEncounter.sun' },
  { id: 'encounter_rest', trigger: 'daily_encounter', weight: 1, effects: { energy: 10 }, textKey: 'pet.dailyEncounter.rest' },
  { id: 'encounter_snack', trigger: 'daily_encounter', weight: 1, effects: { hunger: 10, cleanliness: -3 }, textKey: 'pet.dailyEncounter.snack' },
  { id: 'encounter_nightmare', trigger: 'daily_encounter', weight: 1, effects: { mood: -5 }, textKey: 'pet.dailyEncounter.nightmare' },
  { id: 'encounter_heart', trigger: 'daily_encounter', weight: 1, effects: { hearts: 1 }, textKey: 'pet.dailyEncounter.heart' },

  // ===== Offline Events (petEvents.ts:68-99) =====
  { id: 'offline_coins', trigger: 'offline', weight: 1, effects: { coins: 12 }, textKey: 'pet.offlineEvent.coins' },
  { id: 'offline_biscuit', trigger: 'offline', weight: 1, effects: { itemId: 'emergency_biscuit', itemAmount: 1 }, textKey: 'pet.offlineEvent.biscuit' },
  { id: 'offline_heart', trigger: 'offline', weight: 1, effects: { hearts: 1 }, textKey: 'pet.offlineEvent.heart' },
  { id: 'offline_sunny_play', trigger: 'offline', weight: 1, effects: { mood: 6, cleanliness: -2 }, conditions: 'weather=sunny', textKey: 'pet.offlineEvent.sunnyPlay' },
  { id: 'offline_play', trigger: 'offline', weight: 1, effects: { mood: 6, cleanliness: -2 }, textKey: 'pet.offlineEvent.play' },
  { id: 'offline_hungry_happy', trigger: 'offline', weight: 1, effects: { hunger: -4, mood: 4 }, textKey: 'pet.offlineEvent.hungryHappy' },
  { id: 'offline_rest', trigger: 'offline', weight: 1, effects: { energy: 8 }, textKey: 'pet.offlineEvent.rest' },
  { id: 'offline_mess', trigger: 'offline', weight: 1, effects: { cleanliness: -5 }, textKey: 'pet.offlineEvent.mess' },

  // ===== Dream Events (petEvents.ts:101-124) =====
  { id: 'dream_cloud_nap', trigger: 'dream', weight: 1, effects: { mood: 3 }, textKey: 'pet.dreamEvent.cloudNap' },
  { id: 'dream_coin_path', trigger: 'dream', weight: 1, effects: { coins: 10 }, textKey: 'pet.dreamEvent.coinPath' },
  { id: 'dream_sticker', trigger: 'dream', weight: 1, effects: { hearts: 1 }, textKey: 'pet.dreamEvent.sticker' },
  { id: 'dream_biscuit', trigger: 'dream', weight: 1, effects: { itemId: 'emergency_biscuit', itemAmount: 1 }, textKey: 'pet.dreamEvent.biscuit' },
  { id: 'dream_puddle_run', trigger: 'dream', weight: 1, effects: { energy: 4, cleanliness: -1 }, textKey: 'pet.dreamEvent.puddleRun' },

  // ===== Sleep Settlements (petEvents.ts:289-320) =====
  { id: 'sleep_too_short', trigger: 'sleep_settlement', weight: 1, effects: { mood: -1 }, conditions: 'sleptMinutes<10', textKey: 'pet.sleepSettlement.tooShort' },
  { id: 'sleep_bad', trigger: 'sleep_settlement', weight: 1, effects: { mood: -3, health: -1 }, conditions: 'startMood<=25||startHunger<=25||startCleanliness<=25', textKey: 'pet.sleepSettlement.bad' },
  { id: 'sleep_good', trigger: 'sleep_settlement', weight: 1, effects: { mood: 4, energy: 5 }, conditions: 'startMood>=60&&startHunger>=45&&startCleanliness>=45&&sleptMinutes>=20', textKey: 'pet.sleepSettlement.good' },
  { id: 'sleep_normal', trigger: 'sleep_settlement', weight: 1, effects: { mood: 2 }, conditions: 'sleptMinutes>=10', textKey: 'pet.sleepSettlement.normal' },

  // ===== Action Streak Reactions (petCommon.ts:90-115) =====
  { id: 'streak_play', trigger: 'action_streak', weight: 1, effects: { energy: -2, hunger: -2 }, conditions: 'play>3times/10min', textKey: 'pet.streak.play' },
  { id: 'streak_clean', trigger: 'action_streak', weight: 1, effects: { mood: -4, hunger: -1 }, conditions: 'clean>3times/10min', textKey: 'pet.streak.clean' },
  { id: 'streak_work', trigger: 'action_streak', weight: 1, effects: { mood: -2, health: -2 }, conditions: 'work>3times/10min', textKey: 'pet.streak.work' },
  { id: 'streak_feed', trigger: 'action_streak', weight: 1, effects: { mood: -3, cleanliness: -1 }, conditions: 'feed>3times/10min', textKey: 'pet.streak.feed' },
  { id: 'streak_gift', trigger: 'action_streak', weight: 1, effects: { mood: -2 }, conditions: 'gift>3times/10min', textKey: 'pet.streak.gift' },
  { id: 'streak_touch', trigger: 'action_streak', weight: 1, effects: { mood: -3, energy: -1 }, conditions: 'touch>6times/10min', textKey: 'pet.streak.touch' },

  // ===== Health Incidents (petCommon.ts:58-66) =====
  { id: 'incident_play', trigger: 'health_incident', weight: 0.2, effects: { health: -2 }, conditions: 'play', textKey: 'pet.incident.play' },
  { id: 'incident_work', trigger: 'health_incident', weight: 0.3, effects: { health: -3.5 }, conditions: 'work', textKey: 'pet.incident.work' },
];