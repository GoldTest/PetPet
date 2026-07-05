import { ArrowLeft, ChevronLeft, ChevronRight, Droplets, Flower2, Leaf, Pickaxe, Sparkles, Sprout } from 'lucide-react';
import { currencyIcon, treeStageImages } from '../assets';
import {
  gardenFertilizerItemIds,
  gardenNutrientItemId,
  gardenSlotCount,
  gardenSlotUnlockCosts,
  gardenToolIds,
  gardenTreeDefinitions,
  gardenTreeIds,
  gardenTreeSaplingItemIds,
  getGardenClearCost,
  getGardenStage,
  getGardenToolUpgradeCost,
  getGardenView,
  getGardenWaterReductionPercent,
  getSixAmResetDateKey,
  type GardenFertilizerId,
  type GardenToolId,
  type GardenTreeId,
  type PetState,
} from '../core/pet';
import { t } from '../i18n';

interface GardenPageProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  onBack: () => void;
  onSelectSlot: (slotIndex: number) => void;
  onUnlockSlot: (slotIndex: number) => void;
  onPlantTree: (slotIndex: number, treeId: GardenTreeId) => void;
  onWater: (slotIndex: number) => void;
  onFertilize: (slotIndex: number, fertilizerId: GardenFertilizerId) => void;
  onNutrient: (slotIndex: number) => void;
  onHarvest: (slotIndex: number) => void;
  onClear: (slotIndex: number) => void;
  onUpgradeTool: (toolId: GardenToolId) => void;
}

const toolLevel = (pet: PetState, toolId: GardenToolId) => {
  if (toolId === 'watering_can') return pet.garden.tools.wateringCanLevel;
  if (toolId === 'shovel') return pet.garden.tools.shovelLevel;
  return pet.garden.tools.fertilizerBoxLevel;
};

const formatGardenCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
};

const sameGardenDate = (time: number) => time > 0 && getSixAmResetDateKey(time) === getSixAmResetDateKey(Date.now());

export const GardenPage = ({ pet, itemIconMap, onBack, onSelectSlot, onUnlockSlot, onPlantTree, onWater, onFertilize, onNutrient, onHarvest, onClear, onUpgradeTool }: GardenPageProps) => {
  const view = getGardenView(pet);
  const slot = view.activeSlot;
  const slotView = view.slotViews[slot.slotIndex];
  const treeImage = treeStageImages[Math.max(0, Math.min(4, (slotView?.stage ?? getGardenStage(slot)) - 1))];
  const unlockCost = gardenSlotUnlockCosts[slot.slotIndex] ?? 0;
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
        <div>
          <span>{t('ui.garden.kicker')}</span>
          <h2>{t('ui.garden.title')}</h2>
        </div>
        <div className="garden-page__wallet">
          <span><img src={currencyIcon} alt="" aria-hidden="true" />{pet.coins}</span>
          <span>{t('ui.garden.lifetimeHarvest', { count: pet.garden.lifetimeHarvestCount })}</span>
        </div>
      </header>

      <div className="garden-layout">
        <button type="button" className="garden-arrow" disabled={slot.slotIndex <= 0} onClick={() => onSelectSlot(slot.slotIndex - 1)} aria-label={t('ui.garden.prevSlot')}><ChevronLeft size={30} /></button>
        <div className="garden-stage-panel">
          <div className="garden-slot-tabs" role="tablist" aria-label={t('ui.garden.slotsAria')}>
            {view.garden.slots.map((item) => (
              <button type="button" key={item.slotIndex} className={item.slotIndex === slot.slotIndex ? 'garden-slot-tab garden-slot-tab--active' : 'garden-slot-tab'} onClick={() => onSelectSlot(item.slotIndex)}>
                {item.slotIndex + 1}
                {item.state === 'ready' && <i className="garden-dot garden-dot--ready" />}
                {item.state === 'withered' && <i className="garden-dot garden-dot--withered" />}
              </button>
            ))}
          </div>
          <div className={slot.state === 'withered' ? 'garden-tree-stage garden-tree-stage--withered' : 'garden-tree-stage'}>
            {slot.state === 'empty' || !slot.treeId ? <Sprout size={92} aria-hidden="true" /> : <img src={treeImage} alt="" aria-hidden="true" />}
            {slot.state === 'ready' && (
              <div className="garden-drops">
                {slot.pendingDrops.map((drop) => (
                  <span className="garden-drop" key={drop.kind === 'coins' ? 'coins' : drop.itemId} title={drop.kind === 'coins' ? t('ui.garden.coinDropTitle', { coins: drop.amount }) : t('ui.garden.dropTitle', { count: drop.amount })}>
                    {drop.kind === 'coins' ? <img src={currencyIcon} alt="" aria-hidden="true" /> : drop.itemId && itemIconMap[drop.itemId] ? <img src={itemIconMap[drop.itemId]} alt="" aria-hidden="true" /> : <Sparkles size={20} />}
                    {drop.kind === 'coins' ? <strong>+{drop.amount}</strong> : drop.amount > 1 && <strong>x{drop.amount}</strong>}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="garden-progress-card">
            <strong>{t('ui.garden.slotTitle', { slot: slot.slotIndex + 1 })}</strong>
            <span>{slot.unlocked ? t(`ui.garden.states.${slot.state}`) : t('ui.garden.states.locked')}</span>
            {slot.treeId && <small>{t('ui.garden.treeLife', { tree: t(`ui.garden.trees.${slot.treeId}.name`), used: slot.harvestsUsed, max: slot.maxHarvests })}</small>}
            {slot.state === 'growing' && <small>{t('ui.garden.remaining', { time: formatGardenCountdown(slotView?.remainingMs ?? 0) })}</small>}
            {slot.state === 'growing' && <div className="garden-progress"><i style={{ width: `${Math.round(slotView?.progressPercent ?? 0)}%` }} /></div>}
          </div>
        </div>
        <button type="button" className="garden-arrow" disabled={slot.slotIndex >= gardenSlotCount - 1} onClick={() => onSelectSlot(slot.slotIndex + 1)} aria-label={t('ui.garden.nextSlot')}><ChevronRight size={30} /></button>
      </div>

      <div className="garden-action-grid">
        {!slot.unlocked && <button type="button" className="primary-button" disabled={pet.coins < unlockCost} onClick={() => onUnlockSlot(slot.slotIndex)}>{t('ui.garden.unlockSlot', { coins: unlockCost })}</button>}
        {slot.unlocked && slot.state === 'empty' && gardenTreeIds.map((treeId) => {
          const definition = gardenTreeDefinitions[treeId];
          const saplingItemId = gardenTreeSaplingItemIds[treeId];
          const count = pet.inventory[saplingItemId] ?? 0;
          return <button type="button" className="garden-choice" key={treeId} disabled={count <= 0} onClick={() => onPlantTree(slot.slotIndex, treeId)}><Leaf size={18} /><span><strong>{t(`ui.garden.trees.${treeId}.name`)}</strong><small>{count > 0 ? t('ui.garden.saplingOwned', { count }) : t('ui.garden.needSapling', { coins: definition.price })}</small></span></button>;
        })}
        {slot.state === 'growing' && <>
          <button type="button" className="garden-choice" disabled={wateredToday} onClick={() => onWater(slot.slotIndex)}><Droplets size={18} /><span><strong>{t('ui.garden.actions.water')}</strong><small>{t('ui.garden.waterFree', { percent: getGardenWaterReductionPercent(pet.garden.tools) })}</small></span></button>
          <button type="button" className="garden-choice" disabled={fertilizedToday || (pet.inventory[gardenFertilizerItemIds.normal] ?? 0) <= 0} onClick={() => onFertilize(slot.slotIndex, 'normal')}><Flower2 size={18} /><span><strong>{t('ui.garden.actions.normalFertilizer')}</strong><small>{t('ui.garden.itemOwned', { count: pet.inventory[gardenFertilizerItemIds.normal] ?? 0 })}</small></span></button>
          <button type="button" className="garden-choice" disabled={fertilizedToday || (pet.inventory[gardenFertilizerItemIds.heart] ?? 0) <= 0} onClick={() => onFertilize(slot.slotIndex, 'heart')}><Sparkles size={18} /><span><strong>{t('ui.garden.actions.heartFertilizer')}</strong><small>{t('ui.garden.itemOwned', { count: pet.inventory[gardenFertilizerItemIds.heart] ?? 0 })}</small></span></button>
          <button type="button" className="garden-choice" disabled={boostedToday || (pet.inventory[gardenNutrientItemId] ?? 0) <= 0} onClick={() => onNutrient(slot.slotIndex)}><Sparkles size={18} /><span><strong>{t('ui.garden.actions.nutrient')}</strong><small>{t('ui.garden.itemOwned', { count: pet.inventory[gardenNutrientItemId] ?? 0 })}</small></span></button>
        </>}
        {slot.state === 'ready' && <button type="button" className="primary-button garden-harvest-button" onClick={() => onHarvest(slot.slotIndex)}>{t('ui.garden.actions.harvest')}</button>}
        {slot.treeId && slot.state !== 'empty' && slot.state !== 'withered' && <button type="button" className="danger-button garden-clear-button" disabled={pet.coins < clearCost} onClick={() => onClear(slot.slotIndex)}>{t('ui.garden.actions.remove', { coins: clearCost })}</button>}
        {slot.state === 'withered' && <button type="button" className="danger-button garden-clear-button" disabled={pet.coins < clearCost} onClick={() => onClear(slot.slotIndex)}>{t('ui.garden.actions.clear', { coins: clearCost })}</button>}
      </div>

      <section className="garden-tools" aria-label={t('ui.garden.toolsAria')}>
        {gardenToolIds.map((toolId) => {
          const level = toolLevel(pet, toolId);
          const cost = getGardenToolUpgradeCost(pet.garden.tools, toolId);
          return <button type="button" className="garden-tool" key={toolId} disabled={cost <= 0 || pet.coins < cost} onClick={() => onUpgradeTool(toolId)}><Pickaxe size={18} /><span><strong>{t(`ui.garden.tools.${toolId}.name`)}</strong><small>{cost > 0 ? t('ui.garden.toolUpgrade', { level: level + 1, coins: cost }) : t('ui.garden.maxTool')}</small></span></button>;
        })}
      </section>
    </section>
  );
};
