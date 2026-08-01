import { useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Droplets, Leaf, Sprout, X } from 'lucide-react';
import { DialogShell } from './DialogShell';
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
import {
  vegCropDefinitions,
  vegCropIds,
  vegCropProduceItemIds,
  vegCropSeedItemIds,
  vegGardenPlotColumns,
  vegGardenPlotCount,
  vegGardenPlotRows,
  vegGardenSlotsPerPlot,
  getVegGardenStage,
  getVegGardenView,
  isVegSlotWateredToday,
  type PetState,
  type VegetableCropId,
} from '../core/pet';
import { getSeasonForDate } from '../core/season';
import { t } from '../i18n';

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

type ToolMode = 'plant' | 'water' | null;

interface HarvestFloat {
  key: number;
  slotIndex: number;
  cropId: VegetableCropId;
  count: number;
}

interface VegetableGardenPageProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  onBack: () => void;
  onPlant: (slotIndex: number, cropId: VegetableCropId) => void;
  onWater: (slotIndex: number) => void;
  onHarvest: (slotIndex: number) => void;
  onOpenShop: () => void;
}

const getSwayDuration = (slotIndex: number) => `${2.4 + (slotIndex % 5) * 0.25}s`;

export const VegetableGardenPage = ({ pet, itemIconMap, onBack, onPlant, onWater, onHarvest, onOpenShop }: VegetableGardenPageProps) => {
  const [mode, setMode] = useState<ToolMode>(null);
  const [selectedCrop, setSelectedCrop] = useState<VegetableCropId | null>(null);
  const [floats, setFloats] = useState<HarvestFloat[]>([]);
  const [showSeasonDialog, setShowSeasonDialog] = useState(false);
  const floatKeyRef = useRef(0);
  const draggingRef = useRef(false);
  const now = Date.now();
  const view = getVegGardenView(pet, now);
  const season = getSeasonForDate(now);

  const spawnFloat = (slotIndex: number, cropId: VegetableCropId, count: number) => {
    const key = ++floatKeyRef.current;
    setFloats((prev) => [...prev.slice(-14), { key, slotIndex, cropId, count }]);
    window.setTimeout(() => {
      setFloats((prev) => prev.filter((entry) => entry.key !== key));
    }, 1400);
  };

  const selectedSeedCount = selectedCrop ? (pet.inventory[vegCropSeedItemIds[selectedCrop]] ?? 0) : 0;

  const selectSeed = (cropId: VegetableCropId) => {
    if (mode === 'plant' && selectedCrop === cropId) {
      setMode(null);
      setSelectedCrop(null);
      return;
    }
    setSelectedCrop(cropId);
    setMode('plant');
  };

  const toggleWater = () => {
    setSelectedCrop(null);
    setMode(mode === 'water' ? null : 'water');
  };

  const handleCellPress = (slotIndex: number) => {
    const slot = view.garden.slots[slotIndex];
    if (!slot) return;
    if (slot.state === 'ready' && slot.cropId) {
      onHarvest(slotIndex);
      spawnFloat(slotIndex, slot.cropId, vegCropDefinitions[slot.cropId].dropCount);
      return;
    }
    if (mode === 'plant' && selectedCrop && slot.state === 'empty') {
      if (selectedSeedCount <= 0) {
        setSelectedCrop(null);
        setMode(null);
        return;
      }
      onPlant(slotIndex, selectedCrop);
      return;
    }
    if (mode === 'water' && slot.state === 'growing' && !isVegSlotWateredToday(slot, now)) {
      onWater(slotIndex);
    }
  };

  const handleCellDown = (slotIndex: number) => {
    draggingRef.current = true;
    handleCellPress(slotIndex);
  };

  const handleCellEnter = (slotIndex: number) => {
    if (!draggingRef.current) return;
    handleCellPress(slotIndex);
  };

  const plots = Array.from({ length: vegGardenPlotCount }, (_, plotIndex) =>
    Array.from({ length: vegGardenPlotRows }, (_, rowIndex) =>
      view.garden.slots.slice(plotIndex * vegGardenSlotsPerPlot + rowIndex * vegGardenPlotColumns, plotIndex * vegGardenSlotsPerPlot + (rowIndex + 1) * vegGardenPlotColumns),
    ),
  );

  const inSeasonCrops = vegCropIds.filter((cropId) => vegCropDefinitions[cropId].seasonBonus.includes(season));
  const inSeasonNames = inSeasonCrops.map((cropId) => t(`ui.vegGarden.crops.${cropId}.name`));

  return (
    <section className={`veg-garden-page${mode === 'water' ? ' veg-garden-page--water-mode' : ''}`} aria-label={t('ui.vegGarden.aria')}>
      <header className="veg-garden-page__header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={t('ui.vegGarden.back')} title={t('ui.vegGarden.back')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="veg-garden-page__heading">
          <span>{t('ui.vegGarden.kicker')}</span>
          <div className="veg-garden-page__title-row">
            <h2>{t('ui.vegGarden.title')}</h2>
            {view.readyCount > 0 && (
              <span className="veg-garden-ready-badge">{t('ui.vegGarden.readyHint', { count: view.readyCount })}</span>
            )}
            <strong>{t('ui.vegGarden.lifetimeHarvest', { count: pet.vegetableGarden.lifetimeHarvestCount })}</strong>
            {inSeasonCrops.length > 0 && (
              <button
                type="button"
                className="garden-tools-button"
                onClick={() => setShowSeasonDialog(true)}
                aria-label={t('ui.vegGarden.seasonBadgeTitle', { crops: inSeasonNames.join('、') })}
                title={t('ui.vegGarden.seasonBadgeTitle', { crops: inSeasonNames.join('、') })}
              >
                <CalendarDays size={17} aria-hidden="true" />
                <span>{t('ui.vegGarden.seasonBadge')}</span>
              </button>
            )}
            <button
              type="button"
              className={`garden-tools-button${mode === 'water' ? ' garden-tools-button--active' : ''}`}
              onClick={toggleWater}
              aria-label={t('ui.vegGarden.tools.water')}
              title={t('ui.vegGarden.tools.water')}
              aria-pressed={mode === 'water'}
            >
              <Droplets size={17} aria-hidden="true" />
              <span>{t('ui.vegGarden.tools.water')}</span>
            </button>
            <button type="button" className="garden-tools-button" onClick={onOpenShop} aria-label={t('ui.vegGarden.buySeedsShort')} title={t('ui.vegGarden.buySeedsShort')}>
              <Sprout size={17} aria-hidden="true" />
              <span>{t('ui.vegGarden.buySeedsShort')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="veg-garden-body">
        <div className="veg-garden-fields" onPointerUp={() => { draggingRef.current = false; }} onPointerLeave={() => { draggingRef.current = false; }}>
          {plots.map((plotRows, plotIndex) => (
            <div className="veg-garden-field" key={plotIndex}>
              {plotRows.flatMap((rowSlots) => rowSlots).map((slot) => {
                const stage = getVegGardenStage(slot, now);
                const cropId = slot.cropId;
                const watered = slot.state === 'growing' && isVegSlotWateredToday(slot, now);
                const slotFloats = floats.filter((entry) => entry.slotIndex === slot.slotIndex);
                let plantIcon: string | undefined;
                if (cropId && slot.state === 'growing') {
                  plantIcon = stage <= 2 ? vegCropSproutIcons[cropId] : vegCropGrowingIcons[cropId];
                } else if (cropId && slot.state === 'ready') {
                  plantIcon = itemIconMap[vegCropProduceItemIds[cropId]];
                }
                return (
                  <button
                    type="button"
                    key={slot.slotIndex}
                    className={`veg-garden-cell veg-garden-cell--${slot.state}${watered ? ' veg-garden-cell--watered' : ''}${mode === 'plant' && slot.state === 'empty' && selectedSeedCount > 0 ? ' veg-garden-cell--plantable' : ''}${mode === 'water' && slot.state === 'growing' && !watered ? ' veg-garden-cell--waterable' : ''}`}
                    onPointerDown={() => handleCellDown(slot.slotIndex)}
                    onPointerEnter={() => handleCellEnter(slot.slotIndex)}
                    aria-label={`${t('ui.vegGarden.slotTitle', { slot: slot.slotIndex + 1 })}${cropId ? ` · ${t(`ui.vegGarden.crops.${cropId}.name`)}` : ''} · ${t(`ui.vegGarden.states.${slot.state}`)}`}
                  >
                    {plantIcon && (
                      <img
                        className={`veg-garden-cell__plant${slot.state === 'ready' ? ' veg-garden-cell__plant--ready' : ''}`}
                        src={plantIcon}
                        alt=""
                        aria-hidden="true"
                        style={{ animationDuration: getSwayDuration(slot.slotIndex) }}
                      />
                    )}
                    {slotFloats.map((entry) => (
                      <span className="veg-garden-cell__float" key={entry.key} aria-hidden="true">
                        <img src={itemIconMap[vegCropProduceItemIds[entry.cropId]]} alt="" />
                        +{entry.count}
                      </span>
                    ))}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="veg-garden-seedbar">
          <div className="veg-garden-seedbar__scroll">
            {vegCropIds.map((cropId) => {
              const seedItemId = vegCropSeedItemIds[cropId];
              const count = pet.inventory[seedItemId] ?? 0;
              const inSeason = vegCropDefinitions[cropId].seasonBonus.includes(season);
              const icon = itemIconMap[seedItemId];
              return (
                <button
                  type="button"
                  key={cropId}
                  className={`veg-garden-seed${mode === 'plant' && selectedCrop === cropId ? ' veg-garden-seed--selected' : ''}${count <= 0 ? ' veg-garden-seed--empty' : ''}`}
                  onClick={() => selectSeed(cropId)}
                  aria-pressed={mode === 'plant' && selectedCrop === cropId}
                  title={inSeason ? t('ui.vegGarden.seasonBonus') : undefined}
                >
                  <span className="veg-garden-seed__icon">
                    {icon ? <img src={icon} alt="" aria-hidden="true" /> : <Leaf size={16} aria-hidden="true" />}
                    {inSeason && <i className="veg-garden-seed__season" aria-hidden="true" />}
                  </span>
                  <strong>{t(`ui.vegGarden.crops.${cropId}.name`)}</strong>
                  <small>{count}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showSeasonDialog && (
        <DialogShell className="veg-garden-season-dialog" labelId="veg-season-dialog-title" onClose={() => setShowSeasonDialog(false)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 id="veg-season-dialog-title">{t('ui.vegGarden.seasonDialogTitle')}</h2>
            <button type="button" className="icon-button" onClick={() => setShowSeasonDialog(false)} aria-label={t('ui.garden.closeDialog')} title={t('ui.garden.closeDialog')}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <span className="veg-garden-season-dialog__hint">{t('ui.vegGarden.seasonDialogHint')}</span>
          <div className="veg-garden-season-list">
            {inSeasonCrops.map((cropId) => {
              const seedItemId = vegCropSeedItemIds[cropId];
              const icon = itemIconMap[seedItemId];
              return (
                <div className="veg-garden-season-item" key={cropId}>
                  <span className="veg-garden-season-item__icon">
                    {icon ? <img src={icon} alt="" aria-hidden="true" /> : <Leaf size={16} aria-hidden="true" />}
                  </span>
                  <strong>{t(`ui.vegGarden.crops.${cropId}.name`)}</strong>
                </div>
              );
            })}
          </div>
        </DialogShell>
      )}
    </section>
  );
};
