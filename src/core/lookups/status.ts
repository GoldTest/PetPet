/** AI 快查表：状态定义 */
/* 来源：petTypes.ts:1, petState.ts:153-174, petStats.ts */

export interface StatusEntry {
  id: 'content' | 'hungry' | 'sad' | 'dirty' | 'tired' | 'sick' | 'sleeping';
  labelKey: string;
  /** 触发此状态的条件阈值（任一满足即触发） */
  thresholds: Partial<{
    health: number;
    hunger: number;
    cleanliness: number;
    energy: number;
    mood: number;
    isSleeping: true;
  }>;
  /** 状态造成的持续衰减效果（per tick） */
  effects: { stat: 'hunger' | 'mood' | 'cleanliness' | 'energy' | 'health'; delta: number }[];
  /** 可解除该状态的操作 */
  resolvedBy: string[];
}

export const STATUS_TABLE: StatusEntry[] = [
  {
    id: 'sleeping',
    labelKey: 'pet.status.sleeping',
    thresholds: { isSleeping: true },
    effects: [{ stat: 'energy', delta: 5 }],
    resolvedBy: ['手动唤醒'],
  },
  {
    id: 'sick',
    labelKey: 'pet.status.sick',
    thresholds: { health: 35 },
    effects: [{ stat: 'mood', delta: -3 }, { stat: 'health', delta: -1 }],
    resolvedBy: ['medicine', 'vitamin_tablet'],
  },
  {
    id: 'hungry',
    labelKey: 'pet.status.hungry',
    thresholds: { hunger: 32 },
    effects: [{ stat: 'mood', delta: -1 }],
    resolvedBy: ['feed', '食物类物品'],
  },
  {
    id: 'dirty',
    labelKey: 'pet.status.dirty',
    thresholds: { cleanliness: 32 },
    effects: [{ stat: 'mood', delta: -1 }],
    resolvedBy: ['clean', 'shampoo', 'wet_wipes'],
  },
  {
    id: 'tired',
    labelKey: 'pet.status.tired',
    thresholds: { energy: 28 },
    effects: [{ stat: 'mood', delta: -1 }],
    resolvedBy: ['sleep', 'blanket', 'energy_drink'],
  },
  {
    id: 'sad',
    labelKey: 'pet.status.sad',
    thresholds: { mood: 30 },
    effects: [{ stat: 'hunger', delta: -2 }],
    resolvedBy: ['play', 'gift', '抚摸'],
  },
  {
    id: 'content',
    labelKey: 'pet.status.content',
    thresholds: {},
    effects: [],
    resolvedBy: [],
  },
];

/** 状态优先级排序（索引越小优先级越高） */
export const STATUS_PRIORITY: readonly string[] = [
  'sleeping', 'sick', 'hungry', 'dirty', 'tired', 'sad', 'content',
] as const;