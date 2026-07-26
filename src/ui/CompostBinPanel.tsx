import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, FlaskConical, Leaf, Lock, Recycle, Sparkles, Unlock, X, Zap } from 'lucide-react';
import {
  CATALYST_REQUIRED_COUNT,
  compostBinBaseSlotCount,
  compostBinMaxLevel,
  fruitCareItemIds,
  getAllowedCatalystItems,
  getCatalystTypeForSlot,
  getCompostBinSlotDurationMs,
  getCompostBinUnlockCost,
  getCompostBinUpgradeCost,
  isAttachmentSlot,
  isCompostBinSlotUnlocked,
  normalizeCompostBinState,
} from '../core/compostBin';
import type { PetState } from '../core/petTypes';
import { getInventoryCount } from '../core/items';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';

interface CompostBinPanelProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  onCompost: (slotIndex: number, itemId: string) => void;
  onCollect: (slotIndex: number) => void;
  onLoadCatalyst: (slotIndex: number, itemId: string) => void;
  onUpgrade: () => void;
  onUnlockSlot: () => void;
}

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  if (totalSeconds > 0 && minutes === 0) minutes = 1;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
};

const getOutputItemName = (outputItemId: string) => {
  switch (outputItemId) {
    case 'normal_fertilizer': return t('ui.garden.compostOutputNormal');
    case 'harvest_nutrient': return t('ui.garden.compostOutputNutrient');
    case 'heart_fertilizer': return t('ui.garden.compostOutputHeart');
    default: return outputItemId;
  }
};

const CATALYST_LABELS: Record<string, string> = {
  fruit_catalyst: 'ui.garden.compostCatalystFruit',
  withered_catalyst: 'ui.garden.compostCatalystWithered',
  fertilizer_catalyst: 'ui.garden.compostCatalystFertilizer',
};

const baseOutputMap: Record<string, { itemId: string; amount: number }> = {
  fruit_care: { itemId: 'normal_fertilizer', amount: 1 },
  withered_fragment: { itemId: 'heart_fertilizer', amount: 1 },
  rare_combo: { itemId: 'heart_fertilizer', amount: 1 },
};

const getBaseOutputItemId = (inputType: string): string => baseOutputMap[inputType]?.itemId ?? '';
const getBaseOutputAmount = (inputType: string): number => baseOutputMap[inputType]?.amount ?? 0;

export const CompostBinPanel = ({ pet, itemIconMap, onCompost, onCollect, onLoadCatalyst, onUpgrade, onUnlockSlot }: CompostBinPanelProps) => {
  const [showInputPicker, setShowInputPicker] = useState<number | null>(null);
  const now = Date.now();
  const bin = normalizeCompostBinState(pet.garden.compostBin, now);
  const upgradeCost = getCompostBinUpgradeCost(bin.level);
  const unlockCost = getCompostBinUnlockCost(bin.unlockedExtraSlots);
  const tokenCount = getInventoryCount(pet.inventory, 'garden_token');

  const handleSelectInput = (slotIndex: number, itemId: string) => {
    if (isAttachmentSlot(slotIndex)) {
      onLoadCatalyst(slotIndex, itemId);
    } else {
      onCompost(slotIndex, itemId);
    }
    setShowInputPicker(null);
  };

  const availableItemsForSlot = (slotIndex: number) => {
    if (isAttachmentSlot(slotIndex)) {
      return getAllowedCatalystItems(slotIndex).filter(id => (pet.inventory[id] ?? 0) > 0);
    }
    return [
      ...fruitCareItemIds.map(id => ({ id, type: 'fruit_care' as const })),
      { id: 'withered_fragment', type: 'withered_fragment' as const },
    ].filter(item => (pet.inventory[item.id] ?? 0) > 0);
  };

  const calcProgress = (startedAt: number, completesAt: number) => {
    if (completesAt <= startedAt) return 0;
    return Math.min(100, Math.max(0, ((now - startedAt) / (completesAt - startedAt)) * 100));
  };

  const renderBarrel = (i: number) => {
    const slot = bin.slots[i];
    const unlocked = isCompostBinSlotUnlocked(i, bin.unlockedExtraSlots);
    const isAttachment = isAttachmentSlot(i);
    const isActive = unlocked && slot.inputType && slot.completesAt > now;
    const isReady = unlocked && slot.inputType && slot.completesAt > 0 && now >= slot.completesAt;
    const catCount = slot.catalystCount ?? 0;
    const isEmpty = unlocked && !slot.inputType && !(isAttachment && slot.catalystType && slot.catalystItemId);
    const hasCatalyst = unlocked && isAttachment && slot.catalystType && slot.catalystItemId && catCount >= CATALYST_REQUIRED_COUNT;
    const isLoadingCatalyst = unlocked && isAttachment && slot.catalystType && slot.catalystItemId && catCount < CATALYST_REQUIRED_COUNT;
    const progress = isActive ? calcProgress(slot.startedAt, slot.completesAt) : isReady ? 100 : 0;

    const hasWitheredCatalyst = !isAttachment && bin.slots[4]?.catalystType === 'withered_catalyst' && (bin.slots[4]?.catalystCount ?? 0) >= CATALYST_REQUIRED_COUNT;
    const hasFertilizerCatalyst = !isAttachment && bin.slots[5]?.catalystType === 'fertilizer_catalyst' && (bin.slots[5]?.catalystCount ?? 0) >= CATALYST_REQUIRED_COUNT;
    const hasFruitCatalyst = !isAttachment && bin.slots[3]?.catalystType === 'fruit_catalyst' && (bin.slots[3]?.catalystCount ?? 0) >= CATALYST_REQUIRED_COUNT;

    const outputItemId = slot.outputItemId || (slot.inputType ? getBaseOutputItemId(slot.inputType) : '');
    const outputAmount = slot.outputAmount || (slot.inputType ? getBaseOutputAmount(slot.inputType) : 0);
    const baseAmount = slot.inputType ? getBaseOutputAmount(slot.inputType) : 0;
    const isAmountBoosted = outputAmount > baseAmount;

    return (
      <div
        key={i}
        className={`compost-barrel${isAttachment ? ' compost-barrel--attachment' : ''}${isActive ? ' compost-barrel--active' : ''}${isReady ? ' compost-barrel--ready' : ''}${isEmpty ? ' compost-barrel--empty' : ''}${(hasCatalyst || isLoadingCatalyst) ? ' compost-barrel--catalyst' : ''}`}
      >
        {isEmpty && <div className="compost-barrel__rim-line" />}

        <div className="compost-barrel__band compost-barrel__band--top" />
        <div className="compost-barrel__band compost-barrel__band--bottom" />

        {(isActive || isReady) && (
          <div className="compost-barrel__fill" style={{ height: `${progress}%` }} />
        )}

        {isActive && (
          <div className="compost-barrel__bubbles" aria-hidden="true">
            <div className="compost-barrel__bubble" />
            <div className="compost-barrel__bubble" />
            <div className="compost-barrel__bubble" />
          </div>
        )}

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
          ) : hasCatalyst ? (
            <div className="compost-barrel__catalyst-content">
              <img
                src={itemIconMap[slot.catalystItemId!]}
                alt=""
                className="compost-barrel__catalyst-icon"
              />
              <span className="compost-barrel__catalyst-count compost-barrel__catalyst-count--active">{t('ui.garden.compostCatalystActive')}</span>
            </div>
          ) : isLoadingCatalyst ? (
            <div className="compost-barrel__catalyst-content">
              <button
                type="button"
                className="compost-barrel__catalyst-body"
                onClick={() => setShowInputPicker(i)}
                disabled={availableItemsForSlot(i).length === 0}
              >
                <img
                  src={itemIconMap[slot.catalystItemId!]}
                  alt=""
                  className="compost-barrel__catalyst-icon"
                />
                <span className="compost-barrel__catalyst-count">{catCount}/{CATALYST_REQUIRED_COUNT}</span>
              </button>
            </div>
          ) : isEmpty && isAttachment ? (
            <button
              type="button"
              className="compost-barrel__add-btn"
              onClick={() => setShowInputPicker(i)}
              disabled={availableItemsForSlot(i).length === 0}
            >
              <span className="compost-barrel__add-icon">
                <FlaskConical size={14} />
              </span>
              <span className="compost-barrel__add-label">
                {t(CATALYST_LABELS[getCatalystTypeForSlot(i)!] ?? 'ui.garden.compostAddItem')}
              </span>
            </button>
          ) : isEmpty ? (
            <button
              type="button"
              className="compost-barrel__add-btn"
              onClick={() => setShowInputPicker(i)}
              disabled={availableItemsForSlot(i).length === 0}
            >
              <span className="compost-barrel__add-icon">+</span>
              <span className="compost-barrel__add-label">{t('ui.garden.compostAddItem')}</span>
            </button>
          ) : isReady || isActive ? (
            <>
              <div className={`compost-barrel__output-row${hasWitheredCatalyst ? ' compost-barrel__output-row--upgraded' : ''}`}>
                <img
                  src={itemIconMap[outputItemId]}
                  alt=""
                  className="compost-barrel__output-icon"
                  title={`${getOutputItemName(outputItemId)} x${outputAmount}`}
                />
                {isAmountBoosted && !hasFruitCatalyst && (
                  <img
                    src={itemIconMap[outputItemId]}
                    alt=""
                    className="compost-barrel__output-icon compost-barrel__output-icon--extra"
                    title={`${getOutputItemName(outputItemId)} x${outputAmount}`}
                  />
                )}
                {hasFruitCatalyst && (
                  <img
                    src={itemIconMap[outputItemId]}
                    alt=""
                    className="compost-barrel__output-icon compost-barrel__output-icon--extra"
                    title={`${getOutputItemName(outputItemId)} x${outputAmount}`}
                  />
                )}
                {hasFertilizerCatalyst && (
                  <Zap size={14} className="compost-barrel__speed-icon" />
                )}
              </div>
               {(isActive || isReady) && slot.inputItemId && (
                 <span className="compost-barrel__input-label">
                   {t('pet.shop.items.' + slot.inputItemId + '.name')}
                 </span>
               )}
              {isReady && (
                <button
                  type="button"
                  className="compost-barrel__collect-btn"
                  onClick={() => onCollect(i)}
                >
                  {t('ui.garden.compostCollectBtn')}
                </button>
              )}
              {isActive && (
                <span className="compost-barrel__timer">
                  {formatCountdown(slot.completesAt - now)}
                </span>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
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
            {renderBarrel(baseIdx)}
            {renderBarrel(attachIdx)}
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
            {availableItemsForSlot(showInputPicker).length === 0 ? (
              <p className="compost-input-picker__empty">No items available.</p>
            ) : (
              availableItemsForSlot(showInputPicker).map((item: string | { id: string; type: string }) => {
                const itemId = typeof item === 'string' ? item : item.id;
                const icon = itemIconMap[itemId];
                const count = pet.inventory[itemId] ?? 0;
                return (
                  <article className="garden-dialog-item" key={itemId}>
                    <span className="garden-dialog-item__icon">
                      {icon ? <img src={icon} alt="" aria-hidden="true" /> : <Leaf size={24} aria-hidden="true" />}
                    </span>
                    <div>
                      <strong>{t(`pet.shop.items.${itemId}.name`)}</strong>
                      <small>x{count}</small>
                    </div>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleSelectInput(showInputPicker, itemId)}
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