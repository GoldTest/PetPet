import { useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import {
  clearWitheredTree,
  fertilizeTree,
  getGardenClearCost,
  harvestTree,
  plantTree,
  unlockGardenSlot,
  upgradeGardenTool,
  applyGardenNutrient,
  waterTree,
  type GardenFertilizerId,
  type GardenToolId,
  type GardenTreeId,
  type PetState,
} from '../../core/pet';
import { compostItem, collectCompost, loadCatalyst, unlockCompostBinSlot, upgradeCompostBin } from '../../core/compostBin';
import { playSfx, unlockAudio, type SfxId } from '../../core/audio';

export type GardenClearConfirm = { slotIndex: number; kind: 'clear' | 'remove'; treeId: GardenTreeId; coins: number };

interface GardenControllerOptions {
  petRef: MutableRefObject<PetState>;
  setPet: Dispatch<SetStateAction<PetState>>;
  commitPet: (next: PetState) => PetState;
  playAfterUnlock: (id: SfxId) => void;
}

export const useGardenController = ({ petRef, setPet, commitPet, playAfterUnlock }: GardenControllerOptions) => {
  const [clearConfirm, setClearConfirm] = useState<GardenClearConfirm | null>(null);

  const commitAction = (action: (current: PetState) => PetState, successSfx: SfxId = 'coin') => {
    void unlockAudio();
    const previousInteraction = petRef.current.lastInteractionAt;
    setPet((current) => {
      const next = action(current);
      playSfx(next.lastInteractionAt === previousInteraction ? 'error' : successSfx);
      return commitPet(next);
    });
  };

  const clearSlot = (slotIndex: number) => commitAction((current) => clearWitheredTree(current, slotIndex), 'purchase');
  const requestClear = (slotIndex: number) => {
    const current = petRef.current;
    const slot = current.garden.slots[slotIndex];
    if (!slot || !slot.treeId || slot.state === 'empty') {
      clearSlot(slotIndex);
      return;
    }

    playAfterUnlock('tap');
    setClearConfirm({
      slotIndex,
      kind: slot.state === 'withered' ? 'clear' : 'remove',
      treeId: slot.treeId,
      coins: getGardenClearCost(current.garden.tools),
    });
  };

  const cancelClear = () => {
    playAfterUnlock('close');
    setClearConfirm(null);
  };

  const confirmClear = () => {
    const pending = clearConfirm;
    if (!pending) return;
    setClearConfirm(null);
    clearSlot(pending.slotIndex);
  };

  return {
    clearConfirm,
    resetClearConfirm: () => setClearConfirm(null),
    unlockSlot: (slotIndex: number) => commitAction((current) => unlockGardenSlot(current, slotIndex), 'purchase'),
    plantTree: (slotIndex: number, treeId: GardenTreeId) => commitAction((current) => plantTree(current, slotIndex, treeId, Date.now()), 'purchase'),
    waterTree: (slotIndex: number) => commitAction((current) => waterTree(current, slotIndex, Date.now()), 'coin'),
    fertilizeTree: (slotIndex: number, fertilizerId: GardenFertilizerId) => commitAction((current) => fertilizeTree(current, slotIndex, fertilizerId, Date.now()), fertilizerId === 'heart' ? 'pet_heart' : 'purchase'),
    useNutrient: (slotIndex: number) => commitAction((current) => applyGardenNutrient(current, slotIndex), 'coin'),
    harvestTree: (slotIndex: number) => commitAction((current) => harvestTree(current, slotIndex, Date.now()), 'coin'),
    requestClear,
    cancelClear,
    confirmClear,
    upgradeTool: (toolId: GardenToolId) => commitAction((current) => upgradeGardenTool(current, toolId), 'purchase'),
    compostItem: (slotIndex: number, itemId: string) => commitAction((current) => compostItem(current, slotIndex, itemId), 'purchase'),
    collectCompost: (slotIndex: number) => commitAction((current) => collectCompost(current, slotIndex), 'coin'),
    loadCatalyst: (slotIndex: number, itemId: string) => commitAction((current) => loadCatalyst(current, slotIndex, itemId), 'tap'),
    upgradeCompostBin: () => commitAction((current) => upgradeCompostBin(current), 'purchase'),
    unlockCompostBinSlot: () => commitAction((current) => unlockCompostBinSlot(current), 'purchase'),
    commitAction,
  };
};
