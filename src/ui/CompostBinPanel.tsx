import { useState } from 'react';
import { ArrowUp, Clock, Leaf, Recycle, Sparkles, X } from 'lucide-react';
import { currencyIcon } from '../assets';
import {
  compostBinMaxLevel,
  compostBinSlotCount,
  getCompostBinSlotDurationMs,
  getCompostBinUpgradeCost,
  normalizeCompostBinState,
} from '../core/compostBin';
import { gardenFertilizerItemIds, gardenNutrientItemId, type PetState } from '../core/pet';
import type { CompostBinInputType } from '../core/petTypes';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';

interface CompostBinPanelProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  onCompost: (slotIndex: number, itemId: string) => void;
  onCollect: (slotIndex: number) => void;
  onUpgrade: () => void;
}

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
};

const getInputTypeLabel = (inputType: CompostBinInputType) => {
  switch (inputType) {
    case 'fruit_care': return t('ui.garden.compostInputFruitCare');
    case 'withered_fragment': return t('ui.garden.compostInputWithered');
    case 'rare_combo': return t('ui.garden.compostInputFruitCare');
  }
};

const getOutputItemName = (outputItemId: string) => {
  switch (outputItemId) {
    case gardenFertilizerItemIds.normal: return t('ui.garden.compostOutputNormal');
    case gardenNutrientItemId: return t('ui.garden.compostOutputNutrient');
    case gardenFertilizerItemIds.heart: return t('ui.garden.compostOutputHeart');
    default: return outputItemId;
  }
};

export const CompostBinPanel = ({ pet, itemIconMap, onCompost, onCollect, onUpgrade }: CompostBinPanelProps) => {
  const [showInputPicker, setShowInputPicker] = useState<number | null>(null);
  const now = Date.now();
  const bin = normalizeCompostBinState(pet.garden.compostBin, now);
  const upgradeCost = getCompostBinUpgradeCost(bin.level);

  const handleSelectInput = (slotIndex: number, itemId: string) => {
    onCompost(slotIndex, itemId);
    setShowInputPicker(null);
  };

  const availableItems = [
    ...Object.values(gardenFertilizerItemIds).map(id => ({ id, type: 'fruit_care' as const })),
    { id: 'withered_fragment', type: 'withered_fragment' as const },
  ].filter(item => (pet.inventory[item.id] ?? 0) > 0);

  return (
    <div className="compost-bin-panel">
      <div className="compost-bin-panel__header">
        <Recycle size={16} aria-hidden="true" />
        <strong>{t('ui.garden.compostTitle')}</strong>
        <span className="compost-bin-panel__level">{t('ui.garden.compostLevel', { level: bin.level })}</span>
        {bin.level < compostBinMaxLevel ? (
          <button
            type="button"
            className="compost-bin-panel__upgrade"
            disabled={pet.coins < upgradeCost}
            onClick={onUpgrade}
          >
            <ArrowUp size={14} aria-hidden="true" />
            {t('ui.garden.compostUpgradeCost', { coins: upgradeCost })}
          </button>
        ) : (
          <span className="compost-bin-panel__max">{t('ui.garden.compostMaxLevel')}</span>
        )}
      </div>

      <div className="compost-bin-panel__slots">
        {Array.from({ length: compostBinSlotCount }, (_, i) => {
          const slot = bin.slots[i];
          const isActive = slot.inputType && slot.completesAt > now;
          const isReady = slot.inputType && slot.completesAt > 0 && now >= slot.completesAt;
          const isEmpty = !slot.inputType;

          return (
            <div
              key={i}
              className={`compost-bin-slot${isActive ? ' compost-bin-slot--active' : ''}${isReady ? ' compost-bin-slot--ready' : ''}${isEmpty ? ' compost-bin-slot--empty' : ''}`}
            >
              {isEmpty ? (
                <button
                  type="button"
                  className="compost-bin-slot__add"
                  onClick={() => setShowInputPicker(i)}
                  disabled={availableItems.length === 0}
                >
                  <Leaf size={20} aria-hidden="true" />
                  <span>{t('ui.garden.compostAddItem')}</span>
                </button>
              ) : isReady ? (
                <div className="compost-bin-slot__content">
                  <Sparkles size={18} aria-hidden="true" />
                  <span className="compost-bin-slot__output">
                    {getOutputItemName(slot.outputItemId)} x{slot.outputAmount}
                  </span>
                  <button
                    type="button"
                    className="compost-bin-slot__collect"
                    onClick={() => onCollect(i)}
                  >
                    {t('ui.garden.compostCollectBtn')}
                  </button>
                </div>
              ) : (
                <div className="compost-bin-slot__content">
                  <Clock size={16} aria-hidden="true" />
                  <span className="compost-bin-slot__type">{getInputTypeLabel(slot.inputType!)}</span>
                  <span className="compost-bin-slot__time">
                    {t('ui.garden.compostTimeRemaining', { time: formatCountdown(slot.completesAt - now) })}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showInputPicker !== null && (
        <DialogShell className="compost-input-picker" labelId="compost-input-title" onClose={() => setShowInputPicker(null)}>
          <header className="dialog-header">
            <div className="dialog-title-group">
              <span className="dialog-title-icon" aria-hidden="true"><Recycle size={22} /></span>
              <div>
                <h2 id="compost-input-title">{t('ui.garden.compostAddItem')}</h2>
              </div>
            </div>
            <button type="button" className="icon-button" onClick={() => setShowInputPicker(null)} aria-label={t('ui.garden.closeDialog')} title={t('ui.garden.closeDialog')}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="garden-dialog-list">
            {availableItems.length === 0 ? (
              <p className="compost-input-picker__empty">No items available for composting.</p>
            ) : (
              availableItems.map((item) => {
                const icon = itemIconMap[item.id];
                const count = pet.inventory[item.id] ?? 0;
                return (
                  <article className="garden-dialog-item" key={item.id}>
                    <span className="garden-dialog-item__icon">
                      {icon ? <img src={icon} alt="" aria-hidden="true" /> : <Leaf size={24} aria-hidden="true" />}
                    </span>
                    <div>
                      <strong>{t(`pet.shop.items.${item.id}.name`)}</strong>
                      <small>x{count}</small>
                    </div>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleSelectInput(showInputPicker, item.id)}
                    >
                      {t('ui.garden.compostAddItem')}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </DialogShell>
      )}
    </div>
  );
};
