import { type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import {
  harvestVegCrop,
  plantVegCrop,
  waterVegCrop,
  type PetState,
  type VegetableCropId,
} from '../../core/pet';
import { playSfx, unlockAudio, type SfxId } from '../../core/audio';

interface VegGardenControllerOptions {
  petRef: MutableRefObject<PetState>;
  setPet: Dispatch<SetStateAction<PetState>>;
  commitPet: (next: PetState) => PetState;
  playAfterUnlock: (id: SfxId) => void;
}

export const useVegGardenController = ({ petRef, setPet, commitPet, playAfterUnlock }: VegGardenControllerOptions) => {
  const commitAction = (action: (current: PetState) => PetState, successSfx: SfxId = 'coin') => {
    void unlockAudio();
    const previousInteraction = petRef.current.lastInteractionAt;
    setPet((current) => {
      const next = action(current);
      playSfx(next.lastInteractionAt === previousInteraction ? 'error' : successSfx);
      return commitPet(next);
    });
  };

  return {
    plant: (slotIndex: number, cropId: VegetableCropId) => commitAction((current) => plantVegCrop(current, slotIndex, cropId, Date.now()), 'purchase'),
    water: (slotIndex: number) => commitAction((current) => waterVegCrop(current, slotIndex, Date.now()), 'coin'),
    harvest: (slotIndex: number) => commitAction((current) => harvestVegCrop(current, slotIndex, Date.now()), 'coin'),
  };
};
