import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Leaf, Lock, Recycle, Sparkles, Unlock, X } from 'lucide-react';
import { currencyIcon } from '../assets';
import {
  compostBinBaseSlotCount,
  compostBinMaxLevel,
  compostBinTotalSlotCount,
  fruitCareItemIds,
  getCompostBinOutput,
  getCompostBinSlotDurationMs,
  getCompostBinUnlockCost,
  getCompostBinUpgradeCost,
  isCompostBinSlotUnlocked,
  normalizeCompostBinState,
} from '../core/compostBin';
import { gardenFertilizerItemIds, gardenNutrientItemId, type PetState } from '../core/pet';
import { getInventoryCount } from '../core/items';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';

interface CompostBinPanelProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  onCompost: (slotIndex: number, itemId: string) => void;
  onCollect: (slotIndex: number) => void;
  onUpgrade: () => void;
  onUnlockSlot: () => void;
}

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
};

const getOutputItemName = (outputItemId: string) => {
  switch (outputItemId) {
    case gardenFertilizerItemIds.normal: return t('ui.garden.compostOutputNormal');
    case gardenNutrientItemId: return t('ui.garden.compostOutputNutrient');
    case gardenFertilizerItemIds.heart: return t('ui.garden.compostOutputHeart');
    default: return outputItemId;
  }
};

export const CompostBinPanel = ({ pet, itemIconMap, onCompost, onCollect, onUpgrade, onUnlockSlot }: CompostBinPanelProps) => {
  const [showInputPicker, setShowInputPicker] = useState<number | null>(null);
  const now = Date.now();
  const bin = normalizeCompostBinState(pet.garden.compostBin, now);
  const upgradeCost = getCompostBinUpgradeCost(bin.level);
  const unlockCost = getCompostBinUnlockCost(bin.unlockedExtraSlots);
  const tokenCount = getInventoryCount(pet.inventory, 'garden_token');

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
        {[[0, 3], [1, 4], [2, 5]].map(([baseIdx, attachIdx]) => (
          <div key={baseIdx} className="compost-barrel-pair">
            {[baseIdx, attachIdx].map((i) => {
              const slot = bin.slots[i];
              const unlocked = isCompostBinSlotUnlocked(i, bin.unlockedExtraSlots);
              const isAttachment = i >= compostBinBaseSlotCount;
              const isActive = unlocked && slot.inputType && slot.completesAt > now;
              const isReady = unlocked && slot.inputType && slot.completesAt > 0 && now >= slot.completesAt;
              const isEmpty = unlocked && !slot.inputType;
              const progress = isActive ? calcProgress(slot.startedAt, slot.completesAt) : isReady ? 100 : 0;
              const output = slot.inputType ? getCompostBinOutput(slot.inputType) : undefined;

              return (
                <div
                  key={i}
                  className={`compost-barrel${isAttachment ? ' compost-barrel--attachment' : ''}${isActive ? ' compost-barrel--active' : ''}${isReady ? ' compost-barrel--ready' : ''}${isEmpty ? ' compost-barrel--empty' : ''}`}
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
                {!unlocked ? (
                  <span className="compost-barrel__locked-icon">
                    <Lock size={18} />
                  </span>
                ) : isEmpty ? (
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
                    <img
                      src={itemIconMap[output!.itemId]}
                      alt=""
                      className="compost-barrel__output-icon"
                      title={`${getOutputItemName(output!.itemId)} x${output!.amount}`}
                    />
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
                    <img
                      src={itemIconMap[slot.inputItemId ?? '']}
                      alt=""
                      className="compost-barrel__input-icon"
                      title={t('pet.shop.items.' + (slot.inputItemId ?? '') + '.name')}
                    />
                    <span className="compost-barrel__input-label">{t('pet.shop.items.' + (slot.inputItemId ?? '') + '.name')}</span>
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
        ))}
      </div>

      {unlockCost > 0 && (
        <div className="compost-bin-panel__unlock-row">
          <button
            type="button"
            className="compost-bin-panel__unlock-btn"
            disabled={tokenCount < unlockCost}
            onClick={onUnlockSlot}
          >
            <Unlock size={12} aria-hidden="true" />
            {t('ui.garden.compostUnlockSlot', { cost: unlockCost, tokens: tokenCount })}
          </button>
        </div>
      )}

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
