import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Leaf, Recycle, Sparkles, X } from 'lucide-react';
import { currencyIcon } from '../assets';
import {
  compostBinMaxLevel,
  compostBinSlotCount,
  fruitCareItemIds,
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
    ...fruitCareItemIds.map(id => ({ id, type: 'fruit_care' as const })),
    { id: 'withered_fragment', type: 'withered_fragment' as const },
  ].filter(item => (pet.inventory[item.id] ?? 0) > 0);

  const calcProgress = (startedAt: number, completesAt: number) => {
    if (completesAt <= startedAt) return 0;
    return Math.min(100, Math.max(0, ((now - startedAt) / (completesAt - startedAt)) * 100));
  };

  return (
    <div className="compost-bin-panel">
      <div className="compost-bin-panel__header">
        <Recycle size={12} aria-hidden="true" />
        <strong>{t('ui.garden.compostTitle')}</strong>
        <span className="compost-bin-panel__level">{t('ui.garden.compostLevel', { level: bin.level })}</span>
        {bin.level < compostBinMaxLevel ? (
          <button
            type="button"
            className="compost-bin-panel__upgrade"
            disabled={pet.coins < upgradeCost}
            onClick={onUpgrade}
            title={t('ui.garden.compostUpgradeCost', { coins: upgradeCost })}
          >
            <ArrowUp size={10} aria-hidden="true" />
            {upgradeCost}
          </button>
        ) : (
          <span className="compost-bin-panel__max">{t('ui.garden.compostMaxLevel')}</span>
        )}
      </div>

      <div className="compost-bin-panel__barrels">
        {Array.from({ length: compostBinSlotCount }, (_, i) => {
          const slot = bin.slots[i];
          const isActive = slot.inputType && slot.completesAt > now;
          const isReady = slot.inputType && slot.completesAt > 0 && now >= slot.completesAt;
          const isEmpty = !slot.inputType;
          const progress = isActive ? calcProgress(slot.startedAt, slot.completesAt) : isReady ? 100 : 0;
          const icon = slot.inputItemId ? itemIconMap[slot.inputItemId] : undefined;

          return (
            <div
              key={i}
              className={`compost-barrel${isActive ? ' compost-barrel--active' : ''}${isReady ? ' compost-barrel--ready' : ''}${isEmpty ? ' compost-barrel--empty' : ''}`}
            >
              {/* Rim line for empty state */}
              {isEmpty && <div className="compost-barrel__rim-line" />}

              {/* Metal bands */}
              <div className="compost-barrel__band compost-barrel__band--top" />
              <div className="compost-barrel__band compost-barrel__band--bottom" />

              {/* Fill level for active/ready */}
              {(isActive || isReady) && (
                <div className="compost-barrel__fill" style={{ height: `${progress}%` }} />
              )}

              {/* Bubbles for active */}
              {isActive && (
                <div className="compost-barrel__bubbles" aria-hidden="true">
                  <div className="compost-barrel__bubble" />
                  <div className="compost-barrel__bubble" />
                  <div className="compost-barrel__bubble" />
                </div>
              )}

              {/* Sparkle for ready */}
              {isReady && (
                <span className="compost-barrel__sparkle" aria-hidden="true">
                  <Sparkles size={16} />
                </span>
              )}

              <div className="compost-barrel__inner">
                {isEmpty ? (
                  <button
                    type="button"
                    className="compost-barrel__add-btn"
                    onClick={() => setShowInputPicker(i)}
                    disabled={availableItems.length === 0}
                  >
                    <span className="compost-barrel__add-icon">+</span>
                    <span className="compost-barrel__add-label">{t('ui.garden.compostAddItem')}</span>
                  </button>
                ) : isReady ? (
                  <>
                    <span className="compost-barrel__output-label">
                      {getOutputItemName(slot.outputItemId)} x{slot.outputAmount}
                    </span>
                    <button
                      type="button"
                      className="compost-barrel__collect-btn"
                      onClick={() => onCollect(i)}
                    >
                      {t('ui.garden.compostCollectBtn')}
                    </button>
                  </>
                ) : (
                  <>
                    {icon ? (
                      <img src={icon} alt="" className="compost-barrel__input-icon" />
                    ) : (
                      <Leaf size={18} className="compost-barrel__input-icon" style={{ padding: 1, color: '#5a4a38' }} />
                    )}
                    <span className="compost-barrel__input-label">{getInputTypeLabel(slot.inputType!)}</span>
                    <span className="compost-barrel__timer">
                      {formatCountdown(slot.completesAt - now)}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showInputPicker !== null && createPortal(
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
        </DialogShell>,
        document.body
      )}
    </div>
  );
};
