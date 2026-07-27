import { useState } from 'react';
import { ArrowLeft, Bug, Clock, Droplets, Leaf, Lock, Sparkles, Sprout, X } from 'lucide-react';
import { currencyIcon } from '../assets';
import iconTomatoSprout from '../assets/icon_tomato_sprout.png';
import iconCarrotSprout from '../assets/icon_carrot_sprout.png';
import iconCabbageSprout from '../assets/icon_cabbage_sprout.png';
import iconOnionSprout from '../assets/icon_onion_sprout.png';
import iconPotatoSprout from '../assets/icon_potato_sprout.png';
import iconChiliSprout from '../assets/icon_chili_sprout.png';
import iconTomatoGrowing from '../assets/icon_tomato_growing.png';
import iconCarrotGrowing from '../assets/icon_carrot_growing.png';
import iconCabbageGrowing from '../assets/icon_cabbage_growing.png';
import iconOnionGrowing from '../assets/icon_onion_growing.png';
import iconPotatoGrowing from '../assets/icon_potato_growing.png';
import iconChiliGrowing from '../assets/icon_chili_growing.png';
import iconPest from '../assets/icon_pest.png';
import {
  vegCropDefinitions,
  vegCropIds,
  vegCropProduceItemIds,
  vegCropSeedItemIds,
  vegGardenSlotCount,
  vegGardenColumns,
  vegSlotUnlockCosts,
  getVegGardenStage,
  getVegGardenView,
  isVegSlotWateredToday,
  isVegSlotFertilizedToday,
  type PetState,
  type VegetableCropId,
} from '../core/pet';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';

const vegCropSproutIcons: Record<string, string> = {
  tomato: iconTomatoSprout,
  carrot: iconCarrotSprout,
  cabbage: iconCabbageSprout,
  onion: iconOnionSprout,
  potato: iconPotatoSprout,
  chili: iconChiliSprout,
};

const vegCropGrowingIcons: Record<string, string> = {
  tomato: iconTomatoGrowing,
  carrot: iconCarrotGrowing,
  cabbage: iconCabbageGrowing,
  onion: iconOnionGrowing,
  potato: iconPotatoGrowing,
  chili: iconChiliGrowing,
};

interface VegetableGardenPageProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  onBack: () => void;
  onUnlockSlot: (slotIndex: number) => void;
  onPlant: (slotIndex: number, cropId: VegetableCropId) => void;
  onWater: (slotIndex: number) => void;
  onFertilize: (slotIndex: number) => void;
  onHarvest: (slotIndex: number) => void;
  onClear: (slotIndex: number) => void;
  onOpenShop: () => void;
}

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  if (totalSeconds > 0 && minutes === 0) minutes = 1;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
};

export const VegetableGardenPage = ({ pet, itemIconMap, onBack, onUnlockSlot, onPlant, onWater, onFertilize, onHarvest, onClear, onOpenShop }: VegetableGardenPageProps) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPlantDialog, setShowPlantDialog] = useState(false);
  const now = Date.now();
  const view = getVegGardenView(pet, now);

  const handleSelectSlot = (index: number) => {
    setSelectedSlot(index);
  };

  const activeSlotIndex = selectedSlot !== null && selectedSlot < view.garden.slots.length ? selectedSlot : view.garden.slots.findIndex((s) => s.state === 'ready' || s.state === 'pest' || s.cropId);
  const slot = view.garden.slots[activeSlotIndex >= 0 ? activeSlotIndex : 0];
  const slotView = activeSlotIndex >= 0 ? view.slotViews[activeSlotIndex] : view.slotViews[0];
  const unlockCost = slot ? vegSlotUnlockCosts[slot.slotIndex] ?? 0 : 0;
  const wateredToday = isVegSlotWateredToday(slot, now);
  const fertilizedToday = isVegSlotFertilizedToday(slot, now);

  return (
    <section className="veg-garden-page" aria-label={t('ui.vegGarden.aria')}>
      <header className="veg-garden-page__header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={t('ui.vegGarden.back')} title={t('ui.vegGarden.back')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="veg-garden-page__heading">
          <span>{t('ui.vegGarden.kicker')}</span>
          <div className="veg-garden-page__title-row">
            <h2>{t('ui.vegGarden.title')}</h2>
            <strong>{t('ui.vegGarden.lifetimeHarvest', { count: pet.vegetableGarden.lifetimeHarvestCount })}</strong>
          </div>
        </div>
      </header>

      <div className="veg-garden-plot-grid">
        {view.garden.slots.map((slotItem) => {
          const slotVw = view.slotViews[slotItem.slotIndex];
          const isSelected = activeSlotIndex === slotItem.slotIndex;
          const cost = vegSlotUnlockCosts[slotItem.slotIndex] ?? 0;
          const stage = getVegGardenStage(slotItem, now);
          return (
            <button
              type="button"
              key={slotItem.slotIndex}
              className={`veg-garden-plot${isSelected ? ' veg-garden-plot--selected' : ''}${slotItem.state === 'ready' ? ' veg-garden-plot--ready' : ''}${slotItem.state === 'withered' ? ' veg-garden-plot--withered' : ''}${slotItem.state === 'pest' ? ' veg-garden-plot--pest' : ''}${slotItem.state === 'growing' ? ' veg-garden-plot--growing' : ''}${slotItem.unlocked && slotItem.state === 'empty' ? ' veg-garden-plot--empty' : ''}${!slotItem.unlocked ? ' veg-garden-plot--locked' : ''}`}
              onClick={() => handleSelectSlot(slotItem.slotIndex)}
              aria-label={`${t('ui.vegGarden.slotTitle', { slot: slotItem.slotIndex + 1 })}${slotItem.cropId ? ` · ${t(`ui.vegGarden.crops.${slotItem.cropId}.name`)}` : ''} · ${t(`ui.vegGarden.states.${slotItem.state}`)}`}
            >
              <span className="veg-garden-plot__number">{slotItem.slotIndex + 1}</span>
              {!slotItem.unlocked ? (
                <div className="veg-garden-plot__lock">
                  <Lock size={22} aria-hidden="true" />
                  <span className="veg-garden-plot__lock-cost">{cost}</span>
                  {isSelected && (
                    <span className={`veg-garden-plot__unlock-btn${pet.coins < cost ? ' veg-garden-plot__unlock-btn--disabled' : ''}`} onClick={(e) => { e.stopPropagation(); if (pet.coins >= cost) onUnlockSlot(slotItem.slotIndex); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); if (pet.coins >= cost) onUnlockSlot(slotItem.slotIndex); } }}>
                      +
                    </span>
                  )}
                </div>
              ) : slotItem.state === 'empty' ? (
                <Sprout size={28} aria-hidden="true" className="veg-garden-plot__empty-icon" />
              ) : (
                <>
                  <span className="veg-garden-plot__crop-icon">
                    {slotItem.cropId && slotItem.state === 'growing' && stage <= 2
                      ? <img src={vegCropSproutIcons[slotItem.cropId]} alt="" />
                      : slotItem.cropId && slotItem.state === 'growing' && stage <= 4
                        ? <img src={vegCropGrowingIcons[slotItem.cropId]} alt="" />
                        : slotItem.cropId && itemIconMap[vegCropProduceItemIds[slotItem.cropId]]
                          ? <img src={itemIconMap[vegCropProduceItemIds[slotItem.cropId]]} alt="" />
                          : <Leaf size={24} />}
                  </span>
                  {slotItem.state === 'growing' && slotItem.nextReadyAt > slotItem.plantedAt && (
                    <div className="veg-garden-plot__progress">
                      <i style={{ width: `${Math.min(100, Math.max(0, ((now - slotItem.plantedAt) / (slotItem.nextReadyAt - slotItem.plantedAt)) * 100))}%` }} />
                    </div>
                  )}
                  {(slotItem.state === 'growing' || slotItem.state === 'pest') && (
                    <span className="veg-garden-plot__time">
                      <Clock size={10} aria-hidden="true" />
                      {formatCountdown(slotVw?.remainingMs ?? 0)}
                    </span>
                  )}
                  {slotItem.state === 'pest' && (
                    <span className="veg-garden-plot__pest-badge" title={t('ui.vegGarden.pestHint')}>
                      <img src={iconPest} alt="" className="veg-garden-plot__pest-img" />
                    </span>
                  )}
                  {slotItem.state === 'ready' && (
                    <span className="veg-garden-plot__badge veg-garden-plot__badge--ready">
                      <Sparkles size={12} aria-hidden="true" />
                    </span>
                  )}
                  {slotItem.state === 'withered' && (
                    <span className="veg-garden-plot__badge veg-garden-plot__badge--withered" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="veg-garden-floating-panel">
        <div className="veg-garden-plot-detail">
          <div className="veg-garden-plot-detail__info">
            <strong className="veg-garden-plot-detail__title">{t('ui.vegGarden.slotTitle', { slot: slot.slotIndex + 1 })}</strong>
            <span className="veg-garden-plot-detail__state">{slot.unlocked ? t(`ui.vegGarden.states.${slot.state}`) : t('ui.garden.states.locked')}</span>
            {slot.cropId && <small className="veg-garden-plot-detail__crop">{t('ui.vegGarden.cropLife', { crop: t(`ui.vegGarden.crops.${slot.cropId}.name`), used: slot.harvestsUsed, max: slot.maxHarvests })}</small>}
            {(slot.state === 'growing' || slot.state === 'pest') && slot.cropId && <small className="veg-garden-plot-detail__remaining">{t('ui.vegGarden.remaining', { time: formatCountdown(slotView?.remainingMs ?? 0) })}</small>}
            {slot.state === 'pest' && <small className="veg-garden-plot-detail__pest-note">{t('ui.vegGarden.pestHint')}</small>}
          </div>
        </div>

        <div className="veg-garden-action-grid">
          {!slot.unlocked && <button type="button" className="primary-button" disabled={pet.coins < unlockCost} onClick={() => onUnlockSlot(slot.slotIndex)}>{t('ui.vegGarden.unlockSlot', { coins: unlockCost })}</button>}
          {slot.unlocked && slot.state === 'empty' && (
            <button type="button" className="primary-button veg-garden-plant-button" onClick={() => setShowPlantDialog(true)}>
              <Sprout size={18} aria-hidden="true" />
              {t('ui.vegGarden.chooseSeed')}
            </button>
          )}
          {(slot.state === 'growing' || slot.state === 'pest') && <>
            <button type="button" className="garden-choice" disabled={wateredToday} onClick={() => onWater(slot.slotIndex)}><Droplets size={18} /><span><strong>{t('ui.vegGarden.actions.water')}</strong><small>{t('ui.vegGarden.waterFree', { percent: 8 })}</small></span></button>
            <button type="button" className="garden-choice" disabled={fertilizedToday || (pet.inventory['normal_fertilizer'] ?? 0) <= 0} onClick={() => onFertilize(slot.slotIndex)}><Sparkles size={18} /><span><strong>{t('ui.vegGarden.actions.fertilize')}</strong><small>{t('ui.vegGarden.itemOwned', { count: pet.inventory['normal_fertilizer'] ?? 0 })}</small></span></button>
          </>}
          {slot.state === 'ready' && <button type="button" className="primary-button veg-garden-harvest-button" onClick={() => onHarvest(slot.slotIndex)}>{t('ui.vegGarden.actions.harvest')}</button>}
          {slot.cropId && slot.state !== 'empty' && slot.state !== 'withered' && <button type="button" className="danger-button veg-garden-clear-button" onClick={() => onClear(slot.slotIndex)}>{t('ui.vegGarden.actions.remove')}</button>}
          {slot.state === 'withered' && <button type="button" className="danger-button veg-garden-clear-button" onClick={() => onClear(slot.slotIndex)}>{t('ui.vegGarden.actions.clear')}</button>}
        </div>
      </div>

      {showPlantDialog && (
        <DialogShell className="veg-garden-action-modal" labelId="veg-garden-plant-title" onClose={() => setShowPlantDialog(false)}>
          <header className="dialog-header">
            <div className="dialog-title-group">
              <span className="dialog-title-icon" aria-hidden="true"><Sprout size={22} /></span>
              <div>
                <h2 id="veg-garden-plant-title">{t('ui.vegGarden.plantDialogTitle')}</h2>
                <p>{t('ui.vegGarden.plantDialogSummary')}</p>
              </div>
            </div>
            <button type="button" className="icon-button" onClick={() => setShowPlantDialog(false)} aria-label={t('ui.vegGarden.closeDialog')} title={t('ui.vegGarden.closeDialog')}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="veg-garden-dialog-list">
            {vegCropIds.map((cropId) => {
              const seedItemId = vegCropSeedItemIds[cropId];
              const count = pet.inventory[seedItemId] ?? 0;
              const icon = itemIconMap[seedItemId];
              return (
                <article className="garden-dialog-item" key={cropId}>
                  <span className="garden-dialog-item__icon">{icon ? <img src={icon} alt="" aria-hidden="true" /> : <Leaf size={24} aria-hidden="true" />}</span>
                  <div>
                    <strong>{t(`ui.vegGarden.crops.${cropId}.name`)}</strong>
                    <small>{count > 0 ? t('ui.vegGarden.seedOwned', { count }) : t('ui.vegGarden.needSeed', { coins: vegCropDefinitions[cropId].seedPrice })}</small>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={count <= 0}
                    onClick={() => {
                      onPlant(slot.slotIndex, cropId);
                      setShowPlantDialog(false);
                    }}
                  >
                    {t('ui.vegGarden.plantAction')}
                  </button>
                </article>
              );
            })}
          </div>
          <button type="button" className="secondary-button veg-garden-dialog-shop" onClick={() => { setShowPlantDialog(false); onOpenShop(); }}>
            {t('ui.vegGarden.buySeeds')}
          </button>
        </DialogShell>
      )}
    </section>
  );
};