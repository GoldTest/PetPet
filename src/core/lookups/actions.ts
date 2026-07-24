/** AI 快查表：可操作事件定义 */
/* 来源：petActions.ts, petTypes.ts:113, petCommon.ts */

export interface ActionEntry {
  id: string;
  labelKey: string;
  category: 'care' | 'interact' | 'inventory' | 'shop' | 'system';
  /** 基础效果（object 或 'dynamic' 表示运行时决定） */
  effects: Record<string, number | boolean | string> | string;
  /** 冷却时间（ms） */
  cooldownMs: number;
  /** 所需前提 */
  requirements?: string[];
  /** 天气修正 */
  weatherBonus?: string;
}

export const ACTION_TABLE: ActionEntry[] = [
  // ===== 基础照料 (CareActionKey) =====
  {
    id: 'play',
    labelKey: 'pet.action.play',
    category: 'care',
    effects: { mood: 18, energy: -3, hunger: -4, health: -1.5 },
    cooldownMs: 0,
    requirements: ['energy>10'],
    weatherBonus: 'sunny: mood+2',
  },
  {
    id: 'clean',
    labelKey: 'pet.action.clean',
    category: 'care',
    effects: { cleanliness: 30, energy: -3, hunger: -3, mood: 1, health: 4 },
    cooldownMs: 0,
    weatherBonus: 'rainy: cleanliness+5',
  },
  {
    id: 'feed',
    labelKey: 'pet.action.feed',
    category: 'care',
    effects: { hunger: 20 },
    cooldownMs: 0,
  },
  {
    id: 'work',
    labelKey: 'pet.action.work',
    category: 'care',
    effects: { coins: 24, energy: -12, mood: -5, hunger: -6, health: -3.5 },
    cooldownMs: 0,
    requirements: ['energy>10'],
    weatherBonus: 'breezy: energyCost=10; rainy: coins=20',
  },
  {
    id: 'sleep_start',
    labelKey: 'pet.action.sleep',
    category: 'care',
    effects: { isSleeping: true },
    cooldownMs: 0,
    requirements: ['cleanliness>25 | confirmCount>=3'],
  },
  {
    id: 'sleep_wake',
    labelKey: 'pet.action.wake',
    category: 'care',
    effects: { energy: 40, hunger: -5, mood: 2 },
    cooldownMs: 0,
  },
  {
    id: 'gift',
    labelKey: 'pet.action.gift',
    category: 'care',
    effects: { mood: 8 },
    cooldownMs: 0,
  },
  {
    id: 'touch',
    labelKey: 'pet.interaction.touch',
    category: 'interact',
    effects: { mood: 5, hunger: -1, cleanliness: -1.5, energy: -1 },
    cooldownMs: 1000,
    requirements: ['lastPetInteraction+1s'],
  },

  // ===== 物品相关 =====
  {
    id: 'use_item',
    labelKey: 'pet.item.use',
    category: 'inventory',
    effects: 'dynamic',
    cooldownMs: 0,
    requirements: ['item.count>0', '!partnerSchedule.busy'],
  },
  {
    id: 'buy_item',
    labelKey: 'pet.buy',
    category: 'shop',
    effects: 'dynamic',
    cooldownMs: 0,
    requirements: ['coins>=price'],
  },
  {
    id: 'exchange_heart',
    labelKey: 'pet.exchange',
    category: 'system',
    effects: { coins: 16, hearts: -1 },
    cooldownMs: 200,
    requirements: ['hearts>=1', 'dailyExchange<3'],
  },

  // ===== 系统操作 =====
  {
    id: 'upgrade_pet',
    labelKey: 'pet.upgrade',
    category: 'system',
    effects: { level: 1, statCap: 5 },
    cooldownMs: 0,
    requirements: ['level<99', 'hearts>=cost'],
  },
  {
    id: 'interact_pet',
    labelKey: 'pet.interaction',
    category: 'interact',
    effects: { mood: 5, hunger: -1, cleanliness: -1.5, energy: -1 },
    cooldownMs: 1000,
  },
  {
    id: 'start_pomodoro',
    labelKey: 'pet.pomodoro.start',
    category: 'system',
    effects: { isRunning: true },
    cooldownMs: 0,
    requirements: ['energy>10', 'health>20', '!isRunning'],
  },
  {
    id: 'rename_pet',
    labelKey: 'pet.rename',
    category: 'system',
    effects: {},
    cooldownMs: 0,
  },
];

/** 溢出阈值（操作次数/10分钟窗口） */
export const OVERUSE_THRESHOLDS: Record<string, number> = {
  play: 3,
  clean: 3,
  work: 3,
  feed: 3,
  gift: 3,
  touch: 6,
};