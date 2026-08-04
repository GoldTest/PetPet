import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Fish, Lock, MapPin, Moon, ShoppingBag, Star, Sun, Trophy, Wind, Droplets, Cloud, CloudRain, X, Zap } from 'lucide-react';
import {
  getFishingView,
  fishDefinitions,
  fishIds,
  baitDefinitions,
  baitIds,
  rodDefinitions,
  rodIds,
  rodLevelOrder,
  waterZoneDefinitions,
  waterZoneIds,
  getTimeOfDay,
  getTimeOfDayLabel,
  getZoneNameForId,
  getFishingEnvironmentView,
  fishingSlotStates,
  type FishId,
  type FishRarity,
  type FishingRodId,
  type FishingBaitId,
  type FishingWaterZoneId,
  type FishingSlot,
  type FishingSlotState,
  type PetState,
  type WeatherType,
} from '../core/pet';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';

interface FishingPageProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  onBack: () => void;
  onCast: (slotIndex: number) => void;
  onReel: (slotIndex: number) => void;
  onSelectZone: (zoneId: FishingWaterZoneId) => void;
  onSelectRod: (rodId: FishingRodId) => void;
  onSelectBait: (baitId: FishingBaitId) => void;
  onOpenShop: () => void;
}

const weatherIcons: Record<WeatherType, typeof Sun> = { sunny: Sun, cloudy: Cloud, rainy: CloudRain, breezy: Wind };

const rarityEmoji: Record<FishRarity, string> = { common: '🐟', rare: '🐟', epic: '🐙', legend: '🐉' };

const fishEmoji = (fishId: FishId): string => {
  const def = fishDefinitions[fishId];
  if (def.rarity === 'legend') return '🐉';
  if (def.rarity === 'epic') return '🐙';
  if (def.rarity === 'rare') return '🐟';
  return '🐟';
};

  const getProgressWidth = (slot: FishingSlot) => {
    if (slot.state === 'done') return 100;
    if (slot.state === 'waiting') return 60;
    if (slot.state === 'reeling') return 80;
    if (slot.state === 'casting') {
      const total = Math.max(1, slot.bittenAt - slot.castAt);
      const elapsed = Date.now() - slot.castAt;
      return Math.min(100, total > 0 ? (elapsed / total) * 100 : 100);
    }
    return 0;
  };

  const rarityColorClass = (r: FishRarity) => 'fishing-rarity-' + r;

const formatTime = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}:${String(rem).padStart(2, '0')}` : `${rem}s`;
};

const getSlotStateClass = (state: FishingSlotState) => 'fishing-slot--' + state;

const getRodLevel = (rodId: FishingRodId): number => rodLevelOrder.indexOf(rodId) + 1;

const getRodDurability = (rodId: FishingRodId) => rodDefinitions[rodId].durability;

const isRodMax = (rodId: FishingRodId) => rodId === 'sea_god';

const useTick = (intervalMs: number, callback: () => void) => {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);
  useEffect(() => { const id = setInterval(() => cbRef.current(), intervalMs); return () => clearInterval(id); }, [intervalMs]);
};

export const FishingPage = ({
  pet,
  itemIconMap,
  onBack,
  onCast,
  onReel,
  onSelectZone,
  onSelectRod,
  onSelectBait,
  onOpenShop,
}: FishingPageProps) => {
  const [view, setView] = useState(() => getFishingView(pet));
  const [env, setEnv] = useState(() => getFishingEnvironmentView(pet));
  const [activeModal, setActiveModal] = useState<'zone' | 'rod' | 'bait' | 'encyclopedia' | null>(null);
  const [notification, setNotification] = useState<{ text: string; cls: string } | null>(null);
  const lastPetRef = useRef(pet);

  useEffect(() => {
    if (pet !== lastPetRef.current) {
      lastPetRef.current = pet;
      setView(getFishingView(pet));
      setEnv(getFishingEnvironmentView(pet));
    }
  }, [pet]);

  useTick(1000, () => {
    setView(getFishingView(pet));
    setEnv(getFishingEnvironmentView(pet));
  });

  const showNotification = useCallback((text: string, cls: string) => {
    setNotification({ text, cls });
    setTimeout(() => setNotification(null), 1500);
  }, []);

  const handleSlotClick = useCallback((slotIndex: number) => {
    const slot = view.slots[slotIndex];
    if (!slot) return;
    if (slot.slot.state === 'reeling') {
      onReel(slotIndex);
    } else if (slot.slot.state === 'waiting') {
      onReel(slotIndex);
    } else if (slot.canCast) {
      onCast(slotIndex);
    }
  }, [view.slots, onCast, onReel]);

  const handleZoneSelect = useCallback((zoneId: FishingWaterZoneId) => {
    onSelectZone(zoneId);
    setActiveModal(null);
  }, [onSelectZone]);

  const handleRodSelect = useCallback((rodId: FishingRodId) => {
    onSelectRod(rodId);
    setActiveModal(null);
  }, [onSelectRod]);

  const handleBaitSelect = useCallback((baitId: FishingBaitId) => {
    onSelectBait(baitId);
    setActiveModal(null);
  }, [onSelectBait]);

  const timeOfDay = getTimeOfDay(Date.now());

  const hasReadySlots = view.slots.some((s) => s.slot.state === 'reeling' || s.slot.state === 'waiting');
  const hasIdleSlots = view.slots.some((s) => s.canCast);

  const mainBtnText = hasReadySlots ? t('ui.fishing.btnReel') : t('ui.fishing.btnCast');
  const mainBtnCls = hasReadySlots ? 'fishing-main-btn--reel' : '';

  const handleMainAction = useCallback(() => {
    for (const slot of view.slots) {
      if (slot.slot.state === 'reeling' || slot.slot.state === 'waiting') {
        onReel(slot.slot.slotIndex);
        return;
      }
    }
    for (const slot of view.slots) {
      if (slot.canCast) {
        onCast(slot.slot.slotIndex);
        return;
      }
    }
  }, [view.slots, onCast, onReel]);

  const timeIcon = () => {
    if (timeOfDay === 'night') return <Moon size={12} />;
    if (timeOfDay === 'dusk' || timeOfDay === 'dawn') return <Sun size={12} />;
    return <Sun size={12} />;
  };

  const weatherIcon = () => {
    const Icon = weatherIcons[env.weather];
    return <Icon size={12} />;
  };

  return (
    <div className="fishing-page">
      {/* Sky */}
      <div className={`fishing-sky fishing-sky--${timeOfDay} fishing-sky--season-${env.season}`} />

      {/* Weather particles */}
      <div className={`fishing-weather fishing-weather--${env.weather}`}>
        {env.weather === 'sunny' && <div className="sun" />}
        {env.weather === 'cloudy' && <>
          <div className="cloud" /><div className="cloud" /><div className="cloud" />
        </>}
        {env.weather === 'rainy' && <>
          <div className="cloud" /><div className="cloud" />
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="rain-drop" style={{ left: `${(i * 3.33) % 100}%`, animationDelay: `${(i * 0.1) % 0.6}s` }} />
          ))}
        </>}
        {env.weather === 'breezy' && <>
          <div className="leaf" style={{ top: '30%', left: '10%' }} />
          <div className="leaf" style={{ top: '50%', left: '60%', animationDelay: '1s' }} />
        </>}
        {env.timeOfDay === 'night' && <>
          <div className="moon" />
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="star" style={{ top: `${(i * 8) % 40}%`, left: `${(i * 9) % 90}%`, animationDelay: `${(i * 0.2) % 2}s` }} />
          ))}
        </>}
      </div>

      {/* Horizon */}
      <div className="fishing-horizon" />

      {/* Water */}
      <div className={`fishing-water fishing-water--${view.waterZone} fishing-water--season-${env.season}`}>
        <div className="fishing-wave fishing-wave--1" />
        <div className="fishing-wave fishing-wave--2" />
        <div className="fishing-wave fishing-wave--3" />
        <div className="fishing-caustics" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="fishing-bubble" style={{ left: `${(i * 13) % 100}%`, animationDuration: `${4 + (i % 3) * 1.5}s`, animationDelay: `${(i * 0.7) % 4}s` }} />
        ))}
        <div className="fishing-fish-silhouette--swim-l">
          <Fish size={28} style={{ opacity: 0.4 }} />
        </div>
        <div className="fishing-fish-silhouette--swim-r" style={{ bottom: '50%', animationDelay: '3s' }}>
          <Fish size={22} style={{ opacity: 0.3 }} />
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fishing-notification ${notification.cls}`}>{notification.text}</div>
      )}

      {/* Content */}
      <div className="fishing-content">
        {/* Header */}
        <div className="fishing-header">
          <div className="fishing-header-left">
            <button className="fishing-back-btn" onClick={onBack}>
              <ArrowLeft size={16} />
            </button>
            <span className="fishing-page-title">{t('ui.fishing.title')}</span>
          </div>
          <div className="fishing-header-right">
            <div className="fishing-stat-pill">
              <MapPin size={10} />
              <span>{getZoneNameForId(view.waterZone)}</span>
            </div>
            <div className="fishing-stat-pill">
              <Fish size={10} />
              <span>{view.skill.dailyCatch}/{view.dailyCatchLimit}</span>
            </div>
            <div className="fishing-stat-pill">
              <Zap size={10} />
              <span>Lv{view.skill.level}</span>
            </div>
          </div>
        </div>

        {/* Environment chips */}
        <div className="fishing-environment">
          <div className="fishing-env-chip">{weatherIcon()} {t('pet.weather.' + env.weather + '.label')}</div>
          <div className="fishing-env-chip">{timeIcon()} {getTimeOfDayLabel(timeOfDay)}</div>
          <div className="fishing-env-chip">🎣 {t('ui.fishing.rods.' + view.rod + '.name')}</div>
          <div className="fishing-env-chip">🪱 {t('pet.shop.items.' + view.bait + '.name')}</div>
        </div>

        {/* Slots */}
        <div className="fishing-slots">
          <div className="fishing-slot-row">
            {view.slots.map((sv) => {
              const slot = sv.slot;
              return (
                <div
                  key={slot.slotIndex}
                  className={`fishing-slot ${getSlotStateClass(slot.state)}`}
                  onClick={() => handleSlotClick(slot.slotIndex)}
                >
                  <div className="fishing-slot-label">#{slot.slotIndex + 1}</div>
                  {slot.state === 'idle' && (
                    <>
                      <div style={{ fontSize: '22px' }}>🎯</div>
                      <div className="fishing-slot-status">{t('ui.fishing.slotIdle')}</div>
                    </>
                  )}
                  {slot.state === 'casting' && (
                    <>
                      <div style={{ fontSize: '22px' }}>💧</div>
                      <div className="fishing-slot-timer">{formatTime(sv.timeUntilBiteMs)}</div>
                      <div className="fishing-slot-status">{t('ui.fishing.slotCasting')}</div>
                    </>
                  )}
                  {slot.state === 'waiting' && (
                    <>
                      <div style={{ fontSize: '22px', animation: 'slot-pulse 1s infinite' }}>🪝</div>
                      <div className="fishing-slot-timer">{formatTime(sv.timeUntilBiteMs)}</div>
                      <div className="fishing-slot-status">{t('ui.fishing.slotWaiting')}</div>
                    </>
                  )}
                  {slot.state === 'reeling' && (
                    <>
                      <div style={{ fontSize: '26px' }}>🐟</div>
                      <div className="fishing-slot-timer">{formatTime(sv.timeUntilEscapedMs)}</div>
                      <div className="fishing-slot-status">{t('ui.fishing.slotBitten')}</div>
                    </>
                  )}
                  {slot.state === 'done' && slot.outcome === 'caught' && slot.fishId && (
                    <>
                      <div className="fishing-slot-fish">{fishEmoji(slot.fishId)}</div>
                      <div className="fishing-slot-status">{t('pet.shop.items.' + slot.fishId + '.name')}</div>
                      <div className="fishing-slot-status" style={{ color: 'var(--accent-color)' }}>
                        <span className={rarityColorClass(fishDefinitions[slot.fishId].rarity)}>{t('ui.fishing.rarity.' + fishDefinitions[slot.fishId].rarity)}</span>
                      </div>
                    </>
                  )}
                  {slot.state === 'done' && (slot.outcome === 'lost' || slot.outcome === 'jammed') && (
                    <>
                      <div style={{ fontSize: '20px' }}>❌</div>
                      <div className="fishing-slot-status">{slot.outcome === 'lost' ? t('ui.fishing.slotLost') : t('ui.fishing.slotJammed')}</div>
                    </>
                  )}
                  <div className="fishing-slot-progress">
                    <div className="fishing-slot-progress-fill" style={{ width: `${getProgressWidth(slot)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom info */}
        <div className="fishing-bottom-info">
          <span>{t('ui.fishing.biteRate')}: {view.biteRatePercent}%</span>
          <span>{t('ui.fishing.rareBonus')}: +{view.rareBonusPercent}%</span>
          <span>{t('ui.fishing.activeCasts')}: {view.activeCastSlots}</span>
        </div>

        {/* Main action */}
        <div className="fishing-actions">
          <button
            className={`fishing-main-btn ${mainBtnCls}`}
            onClick={handleMainAction}
            disabled={!hasReadySlots && !hasIdleSlots}
          >
            {mainBtnText}
          </button>
          <div className="fishing-sidebar-btns">
            <button className="fishing-icon-btn" onClick={() => setActiveModal('zone')} title={t('ui.fishing.btnSelectZone')}><MapPin size={14} /></button>
            <button className="fishing-icon-btn" onClick={() => setActiveModal('rod')} title={t('ui.fishing.btnSelectRod')}><Trophy size={14} /></button>
            <button className="fishing-icon-btn" onClick={() => setActiveModal('bait')} title={t('ui.fishing.btnSelectBait')}><Fish size={14} /></button>
            <button className="fishing-icon-btn" onClick={() => setActiveModal('encyclopedia')} title={t('ui.fishing.btnEncyclopedia')}><BookOpen size={14} /></button>
            <button className="fishing-icon-btn" onClick={onOpenShop} title={t('ui.fishing.btnShop')}><ShoppingBag size={14} /></button>
          </div>
        </div>
      </div>

      {/* Zone selector */}
      {activeModal === 'zone' && (
        <DialogShell className="fishing-select-modal" labelId="fishing-zone-title" onClose={() => setActiveModal(null)}>
          <header className="fishing-select-header">
            <h2 id="fishing-zone-title" className="fishing-select-title">{t('ui.fishing.modalZoneTitle')}</h2>
            <button type="button" className="icon-button fishing-select-close" aria-label={t('ui.shop.close')} title={t('ui.shop.close')} onClick={() => setActiveModal(null)}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="fishing-select-list">
            {waterZoneIds.map((zoneId) => {
              const def = waterZoneDefinitions[zoneId];
              const unlocked = def.unlockedAtSkillLevel <= view.skill.level;
              const isActive = view.waterZone === zoneId;
              return (
                <div
                  key={zoneId}
                  className={`fishing-select-item ${isActive ? 'fishing-select-item--active' : ''} ${!unlocked ? 'fishing-select-item--locked' : ''}`}
                  onClick={() => unlocked && handleZoneSelect(zoneId)}
                >
                  <div className="fishing-select-left">
                    <div className="fishing-select-icon">
                      {zoneId === 'pond' ? '🏞️' : zoneId === 'river' ? '🌊' : zoneId === 'lake' ? '🏔️' : '🌊'}
                    </div>
                    <div className="fishing-select-text">
                      <span className="fishing-select-name">{getZoneNameForId(zoneId)}</span>
                      <span className="fishing-select-desc">{unlocked ? t('ui.fishing.zones.' + zoneId + '.desc') : t('ui.fishing.zoneUnlock', { level: def.unlockedAtSkillLevel })}</span>
                    </div>
                  </div>
                  <div className="fishing-select-right">
                    {unlocked ? (isActive ? <span>{t('ui.fishing.btnCast')}</span> : <span>✓</span>) : <><Lock size={10} /> Lv{def.unlockedAtSkillLevel}</>}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogShell>
      )}

      {/* Rod selector */}
      {activeModal === 'rod' && (
        <DialogShell className="fishing-select-modal" labelId="fishing-rod-title" onClose={() => setActiveModal(null)}>
          <header className="fishing-select-header">
            <h2 id="fishing-rod-title" className="fishing-select-title">{t('ui.fishing.modalRodTitle')}</h2>
            <button type="button" className="icon-button fishing-select-close" aria-label={t('ui.shop.close')} title={t('ui.shop.close')} onClick={() => setActiveModal(null)}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="fishing-select-list">
            {rodIds.map((rodId) => {
              const def = rodDefinitions[rodId];
              const level = getRodLevel(rodId);
              const isActive = view.rod === rodId;
              const isLocked = level > view.skill.level;
              return (
                <div
                  key={rodId}
                  className={`fishing-select-item ${isActive ? 'fishing-select-item--active' : ''} ${isLocked ? 'fishing-select-item--locked' : ''}`}
                  onClick={() => !isLocked && handleRodSelect(rodId)}
                >
                  <div className="fishing-select-left">
                    <div className="fishing-select-icon">🎋</div>
                    <div className="fishing-select-text">
                      <span className="fishing-select-name">{t('ui.fishing.rods.' + rodId + '.name')} Lv{level}</span>
                      <span className="fishing-select-desc">{t('ui.fishing.rods.' + rodId + '.desc')}</span>
                    </div>
                  </div>
                  <div className="fishing-select-right">
                    {isLocked ? <><Lock size={10} /> Lv{level}</> : (isActive ? <span>{t('ui.fishing.btnCast')}</span> : <span>✓</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogShell>
      )}

      {/* Bait selector */}
      {activeModal === 'bait' && (
        <DialogShell className="fishing-select-modal" labelId="fishing-bait-title" onClose={() => setActiveModal(null)}>
          <header className="fishing-select-header">
            <h2 id="fishing-bait-title" className="fishing-select-title">{t('ui.fishing.modalBaitTitle')}</h2>
            <button type="button" className="icon-button fishing-select-close" aria-label={t('ui.shop.close')} title={t('ui.shop.close')} onClick={() => setActiveModal(null)}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="fishing-select-list">
            {baitIds.map((baitId) => {
              const def = baitDefinitions[baitId];
              const isActive = view.bait === baitId;
              return (
                <div
                  key={baitId}
                  className={`fishing-select-item ${isActive ? 'fishing-select-item--active' : ''}`}
                  onClick={() => handleBaitSelect(baitId)}
                >
                  <div className="fishing-select-left">
                    <div className="fishing-select-icon">
                      {baitId === 'worm' ? '🪱' : baitId === 'rice_ball' ? '🍙' : baitId === 'insect' ? '🐛' : baitId === 'glow' ? '✨' : '🔮'}
                    </div>
                    <div className="fishing-select-text">
                      <span className="fishing-select-name">{t('pet.shop.items.' + baitId + '.name')}</span>
                      <span className="fishing-select-desc">+{def.catchRateBonusPercent}% 🎣 +{def.rareBonusPercent}% 🌟</span>
                    </div>
                  </div>
                  <div className="fishing-select-right">
                    {isActive ? <span>{t('ui.fishing.btnCast')}</span> : <span>{t('pet.shop.items.' + baitId + '.summary')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogShell>
      )}

      {/* Encyclopedia */}
      {activeModal === 'encyclopedia' && (
        <DialogShell className="fishing-select-modal" labelId="fishing-encyclopedia-title" onClose={() => setActiveModal(null)}>
          <header className="fishing-select-header">
            <h2 id="fishing-encyclopedia-title" className="fishing-select-title">{t('ui.fishing.modalEncyclopediaTitle')}</h2>
            <button type="button" className="icon-button fishing-select-close" aria-label={t('ui.shop.close')} title={t('ui.shop.close')} onClick={() => setActiveModal(null)}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="fishing-encyclopedia-grid">
            {fishIds.map((fishId) => {
              const def = fishDefinitions[fishId];
              const unlocked = view.pet.fishing.dailyCatchCount > 0 || fishDefinitions[fishId].rarity === 'common';
              return (
                <div
                  key={fishId}
                  className={`fishing-encyclopedia-card ${unlocked ? 'fishing-encyclopedia-card--unlocked fishing-encyclopedia-card--' + def.rarity : ''}`}
                >
                  <div className="fishing-encyclopedia-emoji">{fishEmoji(fishId)}</div>
                  <div className="fishing-encyclopedia-name">{unlocked ? t('pet.shop.items.' + fishId + '.name') : '???'}</div>
                  {unlocked && <span className={`fishing-encyclopedia-rarity ${rarityColorClass(def.rarity)}`}>{t('ui.fishing.rarity.' + def.rarity)}</span>}
                </div>
              );
            })}
          </div>
        </DialogShell>
      )}
    </div>
  );
};
