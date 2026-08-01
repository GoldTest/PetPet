import type { GardenSlot, GardenState, GardenTreeId } from './petTypes';

export interface SynergyRule {
  id: string;
  treeA: GardenTreeId;
  treeB: GardenTreeId;
  description: string;
  effect: SynergyEffect;
}

export interface SynergyEffect {
  growSpeedBonusPercent?: number;
  extraDropChancePercent?: number;
  rareWeightBonusPercent?: number;
  coinBonusPercent?: number;
}

export interface ActiveSynergy {
  rule: SynergyRule;
  slotA: number;
  slotB: number;
}

const minuteMs = 60 * 1000;

export const synergyRules: readonly SynergyRule[] = [
  {
    id: 'herb_fruit',
    treeA: 'herb_tree',
    treeB: 'fruit_tree',
    description: 'Herb + Fruit: extra drop +50%',
    effect: { extraDropChancePercent: 50 },
  },
  {
    id: 'money_any',
    treeA: 'money_tree',
    treeB: 'money_tree',
    description: 'Money + any adjacent: coins +15%',
    effect: { coinBonusPercent: 15 },
  },
  {
    id: 'same_adjacent',
    treeA: 'fruit_tree',
    treeB: 'fruit_tree',
    description: 'Same species adjacent: rare weight +5%',
    effect: { rareWeightBonusPercent: 5 },
  },
];

const isSameAdjacent = (ruleId: string, treeIdA: string, treeIdB: string): boolean =>
  ruleId === 'same_adjacent' && treeIdA === treeIdB;

const adjacencyMap: readonly (readonly number[])[] = [
  [1, 3],
  [0, 2, 4],
  [1, 5],
  [0, 4, 6],
  [1, 3, 5, 7],
  [2, 4, 8],
  [3, 7],
  [4, 6, 8],
  [5, 7],
];

export const getAdjacentSlots = (slotIndex: number): readonly number[] =>
  adjacencyMap[slotIndex] ?? [];

export const findActiveSynergies = (garden: GardenState): ActiveSynergy[] => {
  const synergies: ActiveSynergy[] = [];
  const slots = garden.slots;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot.treeId || slot.state === 'empty' || !slot.unlocked) continue;

    for (const neighborIndex of getAdjacentSlots(i)) {
      if (neighborIndex <= i) continue;
      const neighbor = slots[neighborIndex];
      if (!neighbor.treeId || neighbor.state === 'empty' || !neighbor.unlocked) continue;

      for (const rule of synergyRules) {
        const matchForward = slot.treeId === rule.treeA && neighbor.treeId === rule.treeB;
        const matchReverse = slot.treeId === rule.treeB && neighbor.treeId === rule.treeA;
        if (matchForward || matchReverse || isSameAdjacent(rule.id, slot.treeId, neighbor.treeId)) {
          synergies.push({ rule, slotA: i, slotB: neighborIndex });
        }
      }
    }
  }

  return synergies;
};

export const getSynergiesForSlot = (slotIndex: number, synergies: readonly ActiveSynergy[]): ActiveSynergy[] =>
  synergies.filter((s) => s.slotA === slotIndex || s.slotB === slotIndex);

export const getSynergyGrowSpeedBonus = (slotIndex: number, synergies: readonly ActiveSynergy[]): number => {
  let bonus = 0;
  for (const synergy of getSynergiesForSlot(slotIndex, synergies)) {
    bonus += synergy.rule.effect.growSpeedBonusPercent ?? 0;
  }
  return Math.min(50, bonus);
};

export const getSynergyExtraDropChance = (slotIndex: number, synergies: readonly ActiveSynergy[]): number => {
  let bonus = 0;
  for (const synergy of getSynergiesForSlot(slotIndex, synergies)) {
    bonus += synergy.rule.effect.extraDropChancePercent ?? 0;
  }
  return Math.min(300, bonus);
};

export const getSynergyRareWeightBonus = (slotIndex: number, synergies: readonly ActiveSynergy[]): number => {
  let bonus = 0;
  for (const synergy of getSynergiesForSlot(slotIndex, synergies)) {
    bonus += synergy.rule.effect.rareWeightBonusPercent ?? 0;
  }
  return Math.min(30, bonus);
};

export const getSynergyCoinBonus = (slotIndex: number, synergies: readonly ActiveSynergy[]): number => {
  let bonus = 0;
  for (const synergy of getSynergiesForSlot(slotIndex, synergies)) {
    bonus += synergy.rule.effect.coinBonusPercent ?? 0;
  }
  return Math.min(50, bonus);
};

export type SynergyDirection = 'up' | 'down' | 'left' | 'right';

export interface SlotSynergyInfo {
  direction: SynergyDirection;
  synergy: ActiveSynergy;
}

const getDirection = (from: number, to: number): SynergyDirection | null => {
  const diff = to - from;
  if (diff === 1) return 'right';
  if (diff === -1) return 'left';
  if (diff === 3) return 'down';
  if (diff === -3) return 'up';
  return null;
};

export const getSynergiesForSlotWithDirection = (slotIndex: number, synergies: readonly ActiveSynergy[]): SlotSynergyInfo[] => {
  const result: SlotSynergyInfo[] = [];
  for (const synergy of synergies) {
    let dir: SynergyDirection | null = null;
    if (synergy.slotA === slotIndex) {
      dir = getDirection(slotIndex, synergy.slotB);
    } else if (synergy.slotB === slotIndex) {
      dir = getDirection(slotIndex, synergy.slotA);
    }
    if (dir) {
      result.push({ direction: dir, synergy });
    }
  }
  return result;
};
