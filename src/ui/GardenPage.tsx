import { useState, useRef } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, Cloud, CloudRain, Clock, Droplets, Flower2, Leaf, Lock, Pickaxe, ShoppingBag, Sparkles, Sprout, Sun, Wind, Wrench, X, type LucideIcon } from 'lucide-react';
import { currencyIcon, gardenTreeStageImages, giftBoxIcon } from '../assets';
import { CompostBinPanel } from './CompostBinPanel';
import { SpeciesBookModal } from './SpeciesBookModal';
import { SynergyIndicator } from './SynergyIndicator';
import {
  gardenFertilizerItemIds,
  gardenNutrientItemId,
  gardenSlotUnlockCosts,
  gardenToolIds,
  gardenTreeDefinitions,
  gardenTreeIds,
  gardenTreeSaplingItemIds,
  getGardenClearCost,
  getGardenDropsPreview,
  getGardenEnvironmentEffects,
  getGardenStage,
  getGardenToolUpgradeCost,
  getGardenView,
  getGardenWaterReductionPercent,
  getSeasonInfo,
  getSixAmResetDateKey,
  weatherInfo,
  type GardenDrop,
  type GardenFertilizerId,
  type GardenToolId,
  type GardenTreeId,
  type PetState,
  type WeatherType,
} from '../core/pet';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';

interface GardenPageProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  onBack: () => void;
  onUnlockSlot: (slotIndex: number) => void;
  onPlantTree: (slotIndex: number, treeId: GardenTreeId) => void;
  onWater: (slotIndex: number) => void;
  onFertilize: (slotIndex: number, fertilizerId: GardenFertilizerId) => void;
  onNutrient: (slotIndex: number) => void;
  onHarvest: (slotIndex: number) => void;
  onClear: (slotIndex: number) => void;
  onUpgradeTool: (toolId: GardenToolId) => void;
  onOpenShop: () => void;
  onCompost: (slotIndex: number, itemId: string) => void;
  onCollectCompost: (slotIndex: number) => void;
  onLoadCatalyst: (slotIndex: number, itemId: string) => void;
  onUpgradeCompostBin: () => void;
  onUnlockCompostBinSlot: () => void;
  onOpenVegGarden?: () => void;
  compensationCoins?: number;
  onClaimCompensation?: () => void;
}

const toolLevel = (pet: PetState, toolId: GardenToolId) => {
  if (toolId === 'watering_can') return pet.garden.tools.wateringCanLevel;
  if (toolId === 'shovel') return pet.garden.tools.shovelLevel;
  return pet.garden.tools.fertilizerBoxLevel;
};

const formatGardenCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  if (totalSeconds > 0 && minutes === 0) minutes = 1;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
};

const sameGardenDate = (time: number) => time > 0 && getSixAmResetDateKey(time) === getSixAmResetDateKey(Date.now());

const weatherIcons: Record<WeatherType, LucideIcon> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  breezy: Wind,
};

type GardenActionDialog = 'plant' | 'tools' | null;

interface GardenDropFloat {
  key: number;
  slotIndex: number;
  left: number;
  top: number;
  offset: number;
  icon: string;
  label?: string;
}

export const GardenPage = ({ pet, itemIconMap, onBack, onUnlockSlot, onPlantTree, onWater, onFertilize, onNutrient, onHarvest, onClear, onUpgradeTool, onOpenShop, onCompost, onCollectCompost, onLoadCatalyst, onUpgradeCompostBin, onUnlockCompostBinSlot, onOpenVegGarden, compensationCoins = 0, onClaimCompensation }: GardenPageProps) => {
  const [actionDialog, setActionDialog] = useState<GardenActionDialog>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [envExpanded, setEnvExpanded] = useState(false);
  const [showSpeciesBook, setShowSpeciesBook] = useState(false);
  const [dropFloats, setDropFloats] = useState<GardenDropFloat[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const plotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const floatKeyRef = useRef(0);
  const now = Date.now();
  const view = getGardenView(pet, now);
  const environment = getGardenEnvironmentEffects(pet, now);
  const currentWeather = weatherInfo[environment.weather];
  const season = getSeasonInfo(now);
  const WeatherIcon = weatherIcons[environment.weather];

  const handleSelectSlot = (index: number) => {
    setSelectedSlot(index);
  };

  const spawnDropFloats = (slotIndex: number, drops: readonly GardenDrop[]) => {
    const grid = gridRef.current;
    const plot = plotRefs.current[slotIndex];
    if (!grid || !plot) return;
    const gridRect = grid.getBoundingClientRect();
    const plotRect = plot.getBoundingClientRect();
    const baseLeft = plotRect.left - gridRect.left + plotRect.width / 2;
    const baseTop = plotRect.top - gridRect.top;
    const entries: { icon: string; label?: string }[] = [];
    for (const drop of drops) {
      if (drop.kind === 'coins') {
        entries.push({ icon: currencyIcon, label: `+${drop.amount}` });
      } else if (drop.itemId) {
        const icon = itemIconMap[drop.itemId];
        if (!icon) continue;
        const count = Math.max(1, Math.min(drop.amount, 8));
        for (let i = 0; i < count; i += 1) {
          entries.push({ icon, label: drop.amount > 1 && i === 0 ? `x${drop.amount}` : undefined });
        }
      }
    }
    entries.forEach((entry, index) => {
      const key = ++floatKeyRef.current;
      const offset = (index - (entries.length - 1) / 2) * 30;
      window.setTimeout(() => {
        setDropFloats((prev) => [...prev.slice(-14), { key, slotIndex, left: baseLeft, top: baseTop, offset, ...entry }]);
      }, index * 160);
      window.setTimeout(() => {
        setDropFloats((prev) => prev.filter((item) => item.key !== key));
      }, 1400 + index * 160);
    });
  };

  const activeSlotIndex = selectedSlot !== null && selectedSlot < view.garden.slots.length ? selectedSlot : view.garden.slots.findIndex((s) => s.state === 'ready' || s.treeId);
  const slot = view.garden.slots[activeSlotIndex >= 0 ? activeSlotIndex : 0];
  const slotView = activeSlotIndex >= 0 ? view.slotViews[activeSlotIndex] : view.slotViews[0];
  const unlockCost = slot ? gardenSlotUnlockCosts[slot.slotIndex] ?? 0 : 0;
  const clearCost = getGardenClearCost(pet.garden.tools);
  const wateredToday = sameGardenDate(slot.lastWateredAt);
  const fertilizedToday = sameGardenDate(slot.lastFertilizedAt);
  const boostedToday = sameGardenDate(slot.lastBoostedAt);

  return (
    <section className="garden-page" aria-label={t('ui.garden.aria')}>
      <header className="garden-page__header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={t('ui.garden.back')} title={t('ui.garden.back')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="garden-page__heading">
          <span>{t('ui.garden.kicker')}</span>
          <div className="garden-page__title-row">
            <h2>{t('ui.garden.title')}</h2>
            <strong>{t('ui.garden.lifetimeHarvest', { count: pet.garden.lifetimeHarvestCount })}</strong>
            <button type="button" className="garden-tools-button" onClick={() => setActionDialog('tools')} aria-label={t('ui.garden.openTools')} title={t('ui.garden.openTools')}>
              <Wrench size={17} aria-hidden="true" />
              <span>{t('ui.garden.toolsButton')}</span>
            </button>
            <button type="button" className="garden-tools-button" onClick={() => setShowSpeciesBook(true)} aria-label={t('ui.garden.speciesBook.title')} title={t('ui.garden.speciesBook.title')}>
              <BookOpen size={17} aria-hidden="true" />
              <span>{t('ui.garden.speciesBook.title')}</span>
            </button>
            {onOpenVegGarden && (
              <button type="button" className="garden-tools-button" onClick={onOpenVegGarden} aria-label={t('ui.vegGarden.aria')} title={t('ui.vegGarden.title')}>
                <Sprout size={17} aria-hidden="true" />
                <span>{t('ui.vegGarden.title')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`garden-layout garden-layout--season-${environment.season}`}>
        <div className={`garden-environment${envExpanded ? ' garden-environment--expanded' : ''}`} aria-label={t('ui.garden.environmentAria')}>
          <button type="button" className="garden-environment__toggle" onClick={() => setEnvExpanded((v) => !v)} aria-label={t('ui.garden.environmentAria')}>
            <WeatherIcon size={14} aria-hidden="true" />
            <CalendarDays size={14} aria-hidden="true" />
          </button>
          <div className="garden-environment__body">
            <div className={`garden-environment__item garden-environment__item--weather garden-environment__item--weather-${environment.weather}`}>
              <span className="garden-environment__icon garden-environment__icon--weather" aria-hidden="true"><WeatherIcon size={16} /></span>
              <span><strong>{t('ui.garden.weatherLabel', { weather: currentWeather.label })}</strong><small>{t(`ui.garden.weatherEffects.${environment.weather}`)}</small></span>
            </div>
            <div className={`garden-environment__item garden-environment__item--season garden-environment__item--season-${environment.season}`}>
              <span className="garden-environment__icon garden-environment__icon--season" aria-hidden="true"><CalendarDays size={16} /></span>
              <span><strong>{t('ui.garden.seasonLabel', { season: season.label })}</strong><small>{t(`ui.garden.seasonEffects.${environment.season}`)}</small></span>
            </div>
          </div>
        </div>

        <div className="garden-plot-grid" role="grid" aria-label={t('ui.garden.slotsAria')} ref={gridRef}>
          {view.garden.slots.map((slotItem) => {
            const slotVw = view.slotViews[slotItem.slotIndex];
            const isSelected = activeSlotIndex === slotItem.slotIndex;
            const cost = gardenSlotUnlockCosts[slotItem.slotIndex] ?? 0;
            const stage = getGardenStage(slotItem, now);
            return (
              <button
                type="button"
                role="gridcell"
                key={slotItem.slotIndex}
                ref={(el) => { plotRefs.current[slotItem.slotIndex] = el; }}
                className={`garden-plot${isSelected ? ' garden-plot--selected' : ''}${slotItem.state === 'ready' ? ' garden-plot--ready' : ''}${slotItem.state === 'withered' ? ' garden-plot--withered' : ''}${slotItem.state === 'growing' ? ' garden-plot--growing' : ''}${slotItem.unlocked && slotItem.state === 'empty' ? ' garden-plot--empty' : ''}${!slotItem.unlocked ? ' garden-plot--locked' : ''}`}
                onClick={() => handleSelectSlot(slotItem.slotIndex)}
                aria-label={`${t('ui.garden.slotTitle', { slot: slotItem.slotIndex + 1 })}${slotItem.treeId ? ` · ${t(`ui.garden.trees.${slotItem.treeId}.name`)}` : ''} · ${t(slotItem.treeId === 'poplar_tree' && slotItem.state === 'ready' ? 'ui.garden.states.cutReady' : `ui.garden.states.${slotItem.state}`)}`}
              >
                <SynergyIndicator slotIndex={slotItem.slotIndex} garden={pet.garden} />
                <span className="garden-plot__number">{slotItem.slotIndex + 1}</span>
                {!slotItem.unlocked ? (
                  <div className="garden-plot__lock">
                    <Lock size={22} aria-hidden="true" />
                    <span className="garden-plot__lock-cost">{cost}</span>
                    {isSelected && (
                      <span className={`garden-plot__unlock-btn${pet.coins < cost ? ' garden-plot__unlock-btn--disabled' : ''}`} onClick={(e) => { e.stopPropagation(); if (pet.coins >= cost) onUnlockSlot(slotItem.slotIndex); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); if (pet.coins >= cost) onUnlockSlot(slotItem.slotIndex); } }}>
                        +
                      </span>
                    )}
                  </div>
                ) : slotItem.state === 'empty' ? (
                  <Sprout size={28} aria-hidden="true" className="garden-plot__empty-icon" />
                ) : (
                  <>
                    {slotItem.treeId && <img src={gardenTreeStageImages[slotItem.treeId][Math.max(0, Math.min(4, stage - 1))]} alt="" aria-hidden="true" className="garden-plot__tree" />}
                    {slotItem.state === 'growing' && slotItem.nextReadyAt > slotItem.plantedAt && (
                      <div className="garden-plot__progress">
                        <i style={{ width: `${Math.min(100, Math.max(0, ((now - slotItem.plantedAt) / (slotItem.nextReadyAt - slotItem.plantedAt)) * 100))}%` }} />
                      </div>
                    )}
                    <span className={`garden-plot__time${slotItem.state === 'growing' ? '' : ' garden-plot__time--spacer'}`} aria-hidden={slotItem.state !== 'growing'}>
                      {slotItem.state === 'growing' && (
                        <>
                          <Clock size={10} aria-hidden="true" />
                          {formatGardenCountdown(slotVw?.remainingMs ?? 0)}
                        </>
                      )}
                    </span>
                    {slotItem.state === 'growing' && slotItem.unlocked && !sameGardenDate(slotItem.lastWateredAt) && (
                      <span className="garden-plot__water-hint" title={t('ui.garden.actions.water')}>
                        <Droplets size={12} aria-hidden="true" />
                      </span>
                    )}
                    {slotItem.state === 'growing' && slotItem.unlocked && (
                      <span className="garden-plot__boosts">
                        {slotItem.hasNutrientBoost && (
                          <img src={itemIconMap['harvest_nutrient']} alt="" className="garden-plot__boost-icon" title={t('ui.garden.actions.nutrient')} />
                        )}
                        {slotItem.fertilizerType && (
                          <img src={itemIconMap[gardenFertilizerItemIds[slotItem.fertilizerType]]} alt="" className="garden-plot__boost-icon" title={t('ui.garden.actions.' + slotItem.fertilizerType + 'Fertilizer')} />
                        )}
                      </span>
                    )}
                    {slotItem.state === 'ready' && (
                      <span className="garden-plot__badge garden-plot__badge--ready">
                        <Sparkles size={12} aria-hidden="true" />
                      </span>
                    )}
                    {slotItem.state === 'withered' && (
                      <span className="garden-plot__badge garden-plot__badge--withered" />
                    )}
                  </>
                )}
              </button>
            );
          })}
          {dropFloats.map((entry) => (
            <span className="garden-plot__float" key={entry.key} style={{ left: entry.left, top: entry.top, marginLeft: entry.offset }} aria-hidden="true">
              <img src={entry.icon} alt="" />
              {entry.label && <em>{entry.label}</em>}
            </span>
          ))}
        </div>

        {onClaimCompensation && compensationCoins > 0 && (
          <button type="button" className="garden-gift-bubble" onClick={onClaimCompensation} aria-label={t('ui.garden.compensationGiftLabel', { coins: compensationCoins })} title={t('ui.garden.compensationGiftLabel', { coins: compensationCoins })}>
            <img src={giftBoxIcon} alt="" aria-hidden="true" />
            <span>{t('ui.garden.compensationGiftCoins', { coins: compensationCoins })}</span>
          </button>
        )}
      </div>

      <CompostBinPanel
        pet={pet}
        itemIconMap={itemIconMap}
        onCompost={onCompost}
        onCollect={onCollectCompost}
        onLoadCatalyst={onLoadCatalyst}
        onUpgrade={onUpgradeCompostBin}
        onUnlockSlot={onUnlockCompostBinSlot}
      />

      <div className="garden-floating-panel">
        <div className="garden-plot-detail">
          <div className="garden-plot-detail__info">
            <strong className="garden-plot-detail__title">{t('ui.garden.slotTitle', { slot: slot.slotIndex + 1 })}</strong>
            <span className="garden-plot-detail__state">{slot.unlocked ? t(slot.treeId === 'poplar_tree' && slot.state === 'ready' ? 'ui.garden.states.cutReady' : 'ui.garden.states.' + slot.state) : t('ui.garden.states.locked')}</span>
            {slot.treeId && <small className="garden-plot-detail__tree">{t('ui.garden.treeLife', { tree: t(`ui.garden.trees.${slot.treeId}.name`), used: slot.harvestsUsed, max: slot.maxHarvests })}</small>}
            {slot.state === 'growing' && slot.treeId && <small className="garden-plot-detail__remaining">{t('ui.garden.remaining', { time: formatGardenCountdown(slotView?.remainingMs ?? 0) })}</small>}
          </div>
          {slot.pendingDrops.length > 0 && slot.state === 'ready' && (
            <div className="garden-plot-detail__drops">
              {slot.pendingDrops.map((drop) => (
                <span className="garden-drop" key={drop.kind === 'coins' ? 'coins' : drop.itemId}
                  title={drop.kind === 'coins'
                    ? t('ui.garden.coinDropTitle', { coins: drop.amount })
                    : t('ui.garden.dropWithName', { name: t('pet.shop.items.' + drop.itemId + '.name'), count: drop.amount })}>
                  {drop.kind === 'coins' ? <img src={currencyIcon} alt="" aria-hidden="true" /> : drop.itemId && itemIconMap[drop.itemId] ? <img src={itemIconMap[drop.itemId]} alt="" aria-hidden="true" /> : <Sparkles size={16} />}
                  {drop.kind === 'coins' ? <strong>+{drop.amount}</strong> : drop.amount > 1 && <strong>x{drop.amount}</strong>}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="garden-action-grid">
          {!slot.unlocked && <button type="button" className="primary-button" disabled={pet.coins < unlockCost} onClick={() => onUnlockSlot(slot.slotIndex)}>{t('ui.garden.unlockSlot', { coins: unlockCost })}</button>}
          {slot.unlocked && slot.state === 'empty' && (
            <button type="button" className="primary-button garden-plant-button" onClick={() => setActionDialog('plant')}>
              <Sprout size={18} aria-hidden="true" />
              {t('ui.garden.chooseSapling')}
            </button>
          )}
          {slot.state === 'growing' && <>
            <button type="button" className="garden-choice" disabled={wateredToday} onClick={() => onWater(slot.slotIndex)}><Droplets size={18} /><span><strong>{t('ui.garden.actions.water')}</strong><small>{t('ui.garden.waterFree', { percent: getGardenWaterReductionPercent(pet.garden.tools, environment.waterReductionBonusPercent) })}</small></span></button>
            <button type="button" className="garden-choice" disabled={fertilizedToday || (pet.inventory[gardenFertilizerItemIds.normal] ?? 0) <= 0} onClick={() => onFertilize(slot.slotIndex, 'normal')} title="减少当前生长时间20%"><Flower2 size={18} /><span><strong>{t('ui.garden.actions.normalFertilizer')}</strong><small>{t('ui.garden.itemOwned', { count: pet.inventory[gardenFertilizerItemIds.normal] ?? 0 })}</small></span></button>
            <button type="button" className="garden-choice" disabled={fertilizedToday || (pet.inventory[gardenFertilizerItemIds.heart] ?? 0) <= 0} onClick={() => onFertilize(slot.slotIndex, 'heart')} title="减少当前生长时间35%"><Sparkles size={18} /><span><strong>{t('ui.garden.actions.heartFertilizer')}</strong><small>{t('ui.garden.itemOwned', { count: pet.inventory[gardenFertilizerItemIds.heart] ?? 0 })}</small></span></button>
            <button type="button" className="garden-choice" disabled={boostedToday || (pet.inventory[gardenNutrientItemId] ?? 0) <= 0} onClick={() => onNutrient(slot.slotIndex)} title="下次收获获得额外产物"><Sparkles size={18} /><span><strong>{t('ui.garden.actions.nutrient')}</strong><small>{t('ui.garden.itemOwned', { count: pet.inventory[gardenNutrientItemId] ?? 0 })}</small></span></button>
          </>}
          {slot.state === 'ready' && <button type="button" className="primary-button garden-harvest-button" onClick={() => { spawnDropFloats(slot.slotIndex, getGardenDropsPreview(pet, slot.slotIndex)); onHarvest(slot.slotIndex); }}>{slot.treeId === 'poplar_tree' ? t('ui.garden.actions.cut') : t('ui.garden.actions.harvest')}</button>}
          {slot.treeId && slot.state !== 'empty' && slot.state !== 'withered' && <button type="button" className="danger-button garden-clear-button" disabled={pet.coins < clearCost} onClick={() => onClear(slot.slotIndex)}>{t('ui.garden.actions.remove', { coins: clearCost })}</button>}
          {slot.state === 'withered' && <button type="button" className="danger-button garden-clear-button" onClick={() => { spawnDropFloats(slot.slotIndex, getGardenDropsPreview(pet, slot.slotIndex)); onClear(slot.slotIndex); }}>{t('ui.garden.actions.cut')}</button>}
        </div>
      </div>

      {actionDialog && (
        <DialogShell className="garden-action-modal" labelId="garden-action-title" onClose={() => setActionDialog(null)}>
          <header className="dialog-header">
            <div className="dialog-title-group">
              <span className="dialog-title-icon" aria-hidden="true">{actionDialog === 'plant' ? <Sprout size={22} /> : <Wrench size={22} />}</span>
              <div>
                <h2 id="garden-action-title">{actionDialog === 'plant' ? t('ui.garden.plantDialogTitle') : t('ui.garden.toolsDialogTitle')}</h2>
                <p>{actionDialog === 'plant' ? t('ui.garden.plantDialogSummary') : t('ui.garden.toolsDialogSummary')}</p>
              </div>
            </div>
            <button type="button" className="icon-button" onClick={() => setActionDialog(null)} aria-label={t('ui.garden.closeDialog')} title={t('ui.garden.closeDialog')}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          {actionDialog === 'plant' ? (
            <>
              <div className="garden-dialog-list">
                {gardenTreeIds.map((treeId) => {
                  const saplingItemId = gardenTreeSaplingItemIds[treeId];
                  const count = pet.inventory[saplingItemId] ?? 0;
                  const icon = itemIconMap[saplingItemId];
                  return (
                    <article className="garden-dialog-item" key={treeId}>
                      <span className="garden-dialog-item__icon">{icon ? <img src={icon} alt="" aria-hidden="true" /> : <Leaf size={24} aria-hidden="true" />}</span>
                      <div>
                        <strong>{t(`ui.garden.trees.${treeId}.name`)}</strong>
                        <small>{count > 0 ? t('ui.garden.saplingOwned', { count }) : t('ui.garden.needSapling', { coins: gardenTreeDefinitions[treeId].price })}</small>
                      </div>
                      <button
                        type="button"
                        className="primary-button"
                        disabled={count <= 0}
                        onClick={() => {
                          onPlantTree(slot.slotIndex, treeId);
                          setActionDialog(null);
                        }}
                      >
                        {t('ui.garden.plantAction')}
                      </button>
                    </article>
                  );
                })}
              </div>
              <button type="button" className="secondary-button garden-dialog-shop" onClick={() => { setActionDialog(null); onOpenShop(); }}>
                <ShoppingBag size={17} aria-hidden="true" />
                {t('ui.garden.buySaplings')}
              </button>
            </>
          ) : (
            <div className="garden-dialog-list">
              {gardenToolIds.map((toolId) => {
                const level = toolLevel(pet, toolId);
                const cost = getGardenToolUpgradeCost(pet.garden.tools, toolId);
                return (
                  <article className="garden-dialog-item" key={toolId}>
                    <span className="garden-dialog-item__icon"><Pickaxe size={24} aria-hidden="true" /></span>
                    <div>
                      <strong>{t(`ui.garden.tools.${toolId}.name`)}</strong>
                      <small>{cost > 0 ? t('ui.garden.toolUpgrade', { level: level + 1, coins: cost }) : t('ui.garden.maxTool')}</small>
                    </div>
                    <button type="button" className="primary-button" disabled={cost <= 0 || pet.coins < cost} onClick={() => onUpgradeTool(toolId)}>
                      {cost > 0 ? t('ui.garden.upgradeTool') : t('ui.garden.maxTool')}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </DialogShell>
      )}

      {showSpeciesBook && (
        <SpeciesBookModal
          pet={pet}
          onClose={() => setShowSpeciesBook(false)}
        />
      )}
    </section>
  );
};
