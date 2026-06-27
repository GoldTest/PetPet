import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Heart, Settings, Volume2, VolumeX } from 'lucide-react';
import {
  advancePet,
  applyPetAction,
  claimAvailableDateRewards,
  claimReturnWelcomeReward,
  buyItem,
  canStartPomodoro,
  claimDailyWishReward,
  exchangeHeartForCoins,
  createDefaultPet,
  defaultPetBirthday,
  defaultPetName,
  dismissYearReview,
  getDailyWishView,
  getEnergyRecoveryInfo,
  getSeasonInfo,
  getNextUpgradeHeartCost,
  getInventoryItem,
  heartExchangeCooldownMs,
  helpStarterGiftCoins,
  helpStarterGiftRewardId,
  getPetStatCap,
  getReturnWelcomeView,
  interactWithPet,
  isPetLowEnergy,
  pausePomodoro,
  resetPomodoro,
  pomodoroMinHealthThreshold,
  recordPetInteraction,
  updatePetProfile,
  inventoryItems,
  shopCategories,
  shopItems,
  startPomodoro,
  updatePomodoroSettings,
  upgradePet,
  useInventoryItem,
  weatherInfo,
  withBackfilledBirthday,
  withPetIdentityBirthday,
  type ClaimedDateReward,
  type ItemId,
  type PetAction,
  type PetBirthday,
  type PetState,
  type PetStatus,
  type PomodoroDurations,
} from '../core/pet';
import { currencyIcon, giftBoxIcon, resolveItemIcons, resolvePetActivityImages, resolvePetStatusImages } from '../assets';
import {
  getAudioEnabled,
  playSfx,
  setAudioEnabled,
  setAudioTemporarilyMuted,
  syncBgm,
  unlockAudio,
  type BgmMode,
  type SfxId,
} from '../core/audio';
import { clearPet, loadPet, savePet } from '../core/storage';
import {
  formatFavoriteFoodText,
  getDisplayItems,
  getModFavoriteFoodIds,
  getModStatusText,
  parsePetModZip,
  type ActivePetMod,
  type ItemDisplay,
} from '../core/mod';
import { clearActivePetMod, loadActivePetMod, saveActivePetMod } from '../core/modStorage';
import { createSaveFileText, parseSaveFileText } from '../core/saveCodec';
import { ActionDock } from './ActionDock';
import { ConfirmDialog } from './ConfirmDialog';
import { FeatureRow } from './FeatureRow';
import { InventoryPanel } from './InventoryPanel';
import { PetDisplay } from './PetDisplay';
import { PomodoroOverlay } from './PomodoroOverlay';
import { SettingsModal } from './SettingsModal';
import { ShopModal } from './ShopModal';
import { YearReviewModal } from './YearReviewModal';
import { StatusBar } from './StatusBar';
import { formatCompactNumber } from './numberFormat';
import { getLanguage, setLanguage, t, type LanguageCode } from '../i18n';

const formatSharedTime = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 1) return t('ui.time.lessThanMinute');
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? t('ui.time.hoursMinutes', { hours, minutes }) : t('ui.time.minutes', { minutes });
};

const formatCountdownTime = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
};

const getPomodoroRemainingMs = (pet: PetState) =>
  pet.pomodoro.isRunning ? pet.pomodoro.phaseEndsAt - Date.now() : pet.pomodoro.pausedRemainingMs;

const getPomodoroPhaseDurationMs = (pet: PetState) => {
  if (pet.pomodoro.isRunning && pet.pomodoro.phaseStartedAt > 0 && pet.pomodoro.phaseEndsAt > pet.pomodoro.phaseStartedAt) {
    return pet.pomodoro.phaseEndsAt - pet.pomodoro.phaseStartedAt;
  }

  const minutes = pet.pomodoro.phase === 'focus' ? pet.pomodoro.settings.focusMinutes : pet.pomodoro.settings.shortBreakMinutes;

  return minutes * 60 * 1000;
};

const getPomodoroProgress = (pet: PetState) => {
  const duration = getPomodoroPhaseDurationMs(pet);
  if (duration <= 0) return 0;
  const elapsed = duration - Math.max(0, getPomodoroRemainingMs(pet));
  return Math.max(0, Math.min(100, (elapsed / duration) * 100));
};

type PomodoroSettingKey = keyof PomodoroDurations;
type SoundOutcome = 'success' | 'blocked' | 'heart' | 'low_state';
type FloatingRewardConfig = { id: string; coins: number; eventKey: string };
type RewardPopup = ClaimedDateReward;
type RewardDisplayItem = { key: string; icon?: string; label: string; title?: string };
type WishQuickAction = PetState['dailyWish']['action'] | NonNullable<PetState['returnWelcome']>['action'];

const floatingRewardConfigs: readonly FloatingRewardConfig[] = [
  { id: helpStarterGiftRewardId, coins: helpStarterGiftCoins, eventKey: 'pet.reward.helpStarterGift' },
];

const getInventoryCount = (pet: PetState, itemId: ItemId) => pet.inventory[itemId] ?? 0;
const getDisplayItem = (items: readonly ItemDisplay[], itemId: ItemId) => items.find((item) => item.id === itemId);
const getActionSfx = (action: PetAction): SfxId => {
  if (action === 'clean') return 'action_bath';
  if (action === 'play' || action === 'work') return 'action_work_play_medicine';
  return 'pet_touch';
};
const getWishActionButtonLabel = (action: WishQuickAction) => t(`ui.wishes.actions.${action}`);


const getItemSfx = (itemId: ItemId): SfxId => {
  const item = getInventoryItem(itemId);
  if (item?.kind === 'food') return 'action_eat';
  if (itemId === 'shampoo' || itemId === 'wet_wipes') return 'action_bath';
  if (itemId === 'blanket' || itemId === 'soft_cloud_doll' || itemId === 'picture_book') return 'action_blanket';
  if (itemId === 'medicine' || itemId === 'vitamin_tablet' || itemId === 'energy_drink') return 'action_work_play_medicine';
  return 'pet_heart';
};
const downloadTextFile = (fileName: string, text: string) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const readFileText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error(t('ui.settings.save.readFileFailed')));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });

const getPetInteractionOutcome = (pet: PetState): SoundOutcome => {
  if (pet.isSleeping || isPetLowEnergy(pet) || pet.health <= pomodoroMinHealthThreshold || pet.hunger <= 32 || pet.mood <= 30) {
    return 'low_state';
  }
  return pet.mood >= 75 && pet.health >= 40 ? 'heart' : 'success';
};

export const App = () => {
  const [pet, setPet] = useState<PetState>(() => loadPet());
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isShopOpen, setShopOpen] = useState(false);
  const [isPomodoroOpen, setPomodoroOpen] = useState(false);
  const [isAudioEnabled, setAudioEnabledState] = useState(() => getAudioEnabled());
  const [language, setLanguageState] = useState<LanguageCode>(() => getLanguage());
  const [activeShopCategory, setActiveShopCategory] = useState(shopCategories[0].id);
  const [draftName, setDraftName] = useState(pet.name);
  const [draftBirthday, setDraftBirthday] = useState<PetBirthday | undefined>(pet.birthday);
  const [activeMod, setActiveMod] = useState<ActivePetMod | null>(null);
  const [modMessage, setModMessage] = useState('');
  const [saveText, setSaveText] = useState('');
  const [importSaveText, setImportSaveText] = useState('');
  const [rewardQueue, setRewardQueue] = useState<RewardPopup[]>([]);
  const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
  const petRef = useRef(pet);
  const completedFocusCountRef = useRef(pet.pomodoro.completedFocusCount);
  const lastHeartExchangeAtRef = useRef(0);
  const [isHeartExchangeCoolingDown, setHeartExchangeCoolingDown] = useState(false);
  const hasLoadedModRef = useRef(false);

  useEffect(() => {
    petRef.current = pet;
    savePet(pet);
  }, [pet]);

  useEffect(() => {
    void loadActivePetMod()
      .then((mod) => {
        setActiveMod(mod);
        setPet((current) => (mod ? withPetIdentityBirthday(current, mod.manifest.birthday) : withBackfilledBirthday(current, defaultPetBirthday)));
        hasLoadedModRef.current = true;
        if (mod) setModMessage(t('ui.settings.mod.active', { name: mod.manifest.name, version: mod.manifest.version }));
      })
      .catch((error) => {
        hasLoadedModRef.current = true;
        setPet((current) => withBackfilledBirthday(current, defaultPetBirthday));
        setModMessage(error instanceof Error ? error.message : t('ui.settings.mod.loadFailed'));
      });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPet((current) => advancePet(current));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setAudioTemporarilyMuted(!isVisible);
      if (isVisible) {
        setPet((current) => advancePet(current));
      }
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  const itemIconMap = useMemo(() => resolveItemIcons(activeMod), [activeMod]);
  const petStatusImageMap = useMemo(() => resolvePetStatusImages(activeMod), [activeMod]);
  const petActivityImageMap = useMemo(() => resolvePetActivityImages(activeMod), [activeMod]);
  const displayInventoryItems = useMemo(() => getDisplayItems(inventoryItems, activeMod), [activeMod]);
  const displayShopItems = useMemo(() => getDisplayItems(shopItems, activeMod), [activeMod]);
  const getStatusLabel = (status: PetStatus) => getModStatusText(activeMod, status) ?? t(`pet.status.${status}`);
  const statCap = getPetStatCap(pet);
  const seasonInfo = getSeasonInfo(pet.lastUpdatedAt);
  const energyRecoveryInfo = getEnergyRecoveryInfo(pet);
  const energyRecoveryText = energyRecoveryInfo.isFull ? '' : formatCountdownTime(energyRecoveryInfo.remainingMs);
  const stats = useMemo(
    () => [
      { label: t('ui.stats.hunger'), value: pet.hunger, max: statCap, tone: 'food' as const },
      { label: t('ui.stats.mood'), value: pet.mood, max: statCap, tone: 'mood' as const },
      { label: t('ui.stats.cleanliness'), value: pet.cleanliness, max: statCap, tone: 'clean' as const },
      { label: t('ui.stats.energy'), value: pet.energy, max: statCap, detail: energyRecoveryText, tone: 'energy' as const },
      { label: t('ui.stats.health'), value: pet.health, max: statCap, tone: 'health' as const },
    ],
    [energyRecoveryText, pet, statCap],
  );

  const ownedItems = useMemo(
    () => displayInventoryItems.filter((item) => (pet.inventory[item.id] ?? 0) > 0),
    [displayInventoryItems, pet.inventory],
  );
  const visibleShopItems = useMemo(
    () => displayShopItems.filter((item) => item.kind === activeShopCategory),
    [activeShopCategory, displayShopItems],
  );
  const isLowEnergy = isPetLowEnergy(pet);
  const nextUpgradeCost = getNextUpgradeHeartCost(pet);
  const canUpgrade = nextUpgradeCost > 0 && pet.hearts >= nextUpgradeCost;
  const canRunPomodoro = canStartPomodoro(pet);
  const pomodoroRemainingMs = getPomodoroRemainingMs(pet);
  const pomodoroProgress = getPomodoroProgress(pet);
  const showPomodoroPanel = isPomodoroOpen;
  const pomodoroStartTitle = isLowEnergy
    ? t('ui.pomodoro.lowEnergyTitle')
    : pet.health <= pomodoroMinHealthThreshold
      ? t('ui.pomodoro.lowHealthTitle')
      : pet.isSleeping
        ? t('ui.pomodoro.sleepingTitle')
        : undefined;
  const isPomodoroActionDisabled = !pet.pomodoro.isRunning && !canRunPomodoro;
  const currentBgmMode: BgmMode = isShopOpen ? 'shop' : pet.isSleeping ? 'sleep' : 'room';
  const dailyWishView = getDailyWishView(pet);
  const returnWelcomeView = getReturnWelcomeView(pet);
  const dailyWishButtonLabel = dailyWishView.canClaim || dailyWishView.claimed
    ? dailyWishView.buttonLabel
    : getWishActionButtonLabel(pet.dailyWish.action);
  const returnWelcomeButtonLabel =
    returnWelcomeView && pet.returnWelcome
      ? returnWelcomeView.canClaim
        ? returnWelcomeView.buttonLabel
        : getWishActionButtonLabel(pet.returnWelcome.action)
      : '';

  useEffect(() => {
    syncBgm(currentBgmMode);
  }, [currentBgmMode, isAudioEnabled]);

  useEffect(() => {
    claimDateRewards();
  }, [pet.lastUpdatedAt, pet.birthday, activeMod]);

  useEffect(() => {
    if (pet.pomodoro.completedFocusCount > completedFocusCountRef.current) {
      playSfx('notification');
    }
    completedFocusCountRef.current = pet.pomodoro.completedFocusCount;
  }, [pet.pomodoro.completedFocusCount]);

  const playAfterUnlock = (id: SfxId) => {
    void unlockAudio().then(() => playSfx(id));
  };

  const claimDateRewards = () => {
    if (!hasLoadedModRef.current) return;
    setPet((current) => {
      const result = claimAvailableDateRewards(current);
      if (result.rewards.length > 0) {
        setRewardQueue((queue) => [
          ...queue,
          ...result.rewards.filter((reward) => !queue.some((queued) => queued.id === reward.id)),
        ]);
        playSfx('notification');
      }
      return result.pet;
    });
  };

  const handleAudioToggle = () => {
    const nextEnabled = !isAudioEnabled;
    setAudioEnabled(nextEnabled);
    setAudioEnabledState(nextEnabled);
    if (nextEnabled) {
      void unlockAudio().then(() => {
        syncBgm(currentBgmMode);
        playSfx('tap');
      });
    }
  };

  const handleAction = (action: PetAction) => {
    playAfterUnlock('tap');
    setPet((current) => {
      const next = applyPetAction(current, action);
      const actionSucceeded = next.recentEvent !== current.recentEvent || next.recentActivity !== current.recentActivity;
      playSfx(actionSucceeded ? getActionSfx(action) : 'error');
      return next;
    });
  };

  const handleBuyItem = (itemId: ItemId) => {
    playAfterUnlock('tap');
    setPet((current) => {
      const beforeCount = getInventoryCount(current, itemId);
      const beforeCoins = current.coins;
      const next = buyItem(current, itemId);
      const didGainItem = getInventoryCount(next, itemId) > beforeCount;
      const didSpendCoins = next.coins < beforeCoins;
      playSfx(didGainItem ? (didSpendCoins ? 'purchase' : 'coin') : 'error');
      return next;
    });
  };

  const handleExchangeHeart = () => {
    const now = Date.now();
    if (now - lastHeartExchangeAtRef.current < heartExchangeCooldownMs) {
      playAfterUnlock('error');
      return;
    }

    lastHeartExchangeAtRef.current = now;
    setHeartExchangeCoolingDown(true);
    window.setTimeout(() => setHeartExchangeCoolingDown(false), heartExchangeCooldownMs);
    playAfterUnlock('tap');

    setPet((current) => {
      const beforeCoins = current.coins;
      const beforeHearts = current.hearts;
      const next = exchangeHeartForCoins(current, now);
      const didExchange = next.coins > beforeCoins && next.hearts < beforeHearts;
      playSfx(didExchange ? 'coin' : 'error');
      return next;
    });
  };

  const handleUseItem = (itemId: ItemId) => {
    playAfterUnlock('tap');
    setPet((current) => {
      const beforeCount = getInventoryCount(current, itemId);
      const displayItem = getDisplayItem(displayInventoryItems, itemId);
      const next = useInventoryItem(current, itemId, Date.now(), {
        favoriteFoodIds: getModFavoriteFoodIds(activeMod),
        favoriteText: (amount) => formatFavoriteFoodText(activeMod, amount),
        itemName: displayItem?.displayName,
      });
      playSfx(getInventoryCount(next, itemId) < beforeCount ? getItemSfx(itemId) : 'error');
      return next;
    });
  };
  const handleInteract = () => {
    const outcome = getPetInteractionOutcome(petRef.current);
    playAfterUnlock(outcome === 'heart' ? 'pet_heart' : outcome === 'low_state' ? 'pet_low_state' : 'pet_touch');
    setPet((current) => interactWithPet(current));
  };

  const handleOpenShop = () => {
    playAfterUnlock('open');
    setPet((current) => recordPetInteraction(current));
    setShopOpen(true);
  };

  const handleCloseShop = () => {
    playAfterUnlock('close');
    setShopOpen(false);
  };

  const handleOpenPomodoro = () => {
    const willOpen = !isPomodoroOpen;
    playAfterUnlock(willOpen ? 'open' : 'close');
    setPet((current) => recordPetInteraction(current));
    setPomodoroOpen(willOpen);
  };

  const handleTogglePomodoro = () => {
    if (isPomodoroActionDisabled) {
      playAfterUnlock('error');
      return;
    }
    playAfterUnlock(petRef.current.pomodoro.isRunning ? 'tap' : 'pet_read');
    setPomodoroOpen(true);
    setPet((current) => (current.pomodoro.isRunning ? pausePomodoro(current) : startPomodoro(current)));
  };

  const handleResetPomodoro = () => {
    playAfterUnlock('notification');
    setPomodoroOpen(true);
    setPet((current) => resetPomodoro(current));
  };

  const handleUpgrade = () => {
    playAfterUnlock(canUpgrade ? 'pet_heart' : 'error');
    setPet((current) => upgradePet(current));
  };

  const handlePomodoroSettingChange = (key: PomodoroSettingKey, value: number) => {
    if (!Number.isFinite(value)) return;
    setPet((current) => updatePomodoroSettings(current, { [key]: value }));
  };

  const handleSaveProfile = () => {
    playAfterUnlock('tap');
    setPet((current) => updatePetProfile(current, draftName, draftBirthday));
    setSettingsOpen(false);
  };

  const handleOpenHelp = () => {
    setPet((current) => (current.hasOpenedHelp ? current : { ...current, hasOpenedHelp: true }));
  };

  const handleClaimFloatingReward = (reward: FloatingRewardConfig) => {
    playAfterUnlock('coin');
    setPet((current) => {
      if (current.claimedRewardIds.includes(reward.id)) return current;

      return {
        ...current,
        coins: current.coins + reward.coins,
        claimedRewardIds: [...current.claimedRewardIds, reward.id],
        recentEvent: t(reward.eventKey, { coins: reward.coins }),
      };
    });
  };

  const handleClaimDailyWish = () => {
    playAfterUnlock('tap');
    setPet((current) => {
      const beforeClaimedAt = current.dailyWish.claimedAt;
      const next = claimDailyWishReward(current);
      const didClaim = next.dailyWish.claimedAt !== beforeClaimedAt;
      playSfx(didClaim ? 'coin' : 'error');
      return next;
    });
  };

  const completeFeedWishAction = () => {
    const foodItem = displayInventoryItems.find((item) => item.kind === 'food' && getInventoryCount(petRef.current, item.id) > 0);
    if (!foodItem) {
      playAfterUnlock('open');
      setActiveShopCategory('food');
      setPet((current) => recordPetInteraction(current));
      setShopOpen(true);
      return;
    }

    playAfterUnlock('tap');
    setPet((current) => {
      const beforeCount = getInventoryCount(current, foodItem.id);
      const displayItem = getDisplayItem(displayInventoryItems, foodItem.id);
      const next = useInventoryItem(current, foodItem.id, Date.now(), {
        favoriteFoodIds: getModFavoriteFoodIds(activeMod),
        favoriteText: (amount) => formatFavoriteFoodText(activeMod, amount),
        itemName: displayItem?.displayName,
      });
      playSfx(getInventoryCount(next, foodItem.id) < beforeCount ? getItemSfx(foodItem.id) : 'error');
      return next;
    });
  };

  const handleWishQuickAction = (action: WishQuickAction) => {
    switch (action) {
      case 'feed':
        completeFeedWishAction();
        return;
      case 'touch':
        handleInteract();
        return;
      case 'clean':
      case 'play':
      case 'work':
      case 'sleep':
        handleAction(action);
        return;
    }
  };

  const handleDailyWishButton = () => {
    const wish = petRef.current.dailyWish;
    if (wish.claimedAt) {
      playAfterUnlock('error');
      return;
    }
    if (wish.completedAt) {
      handleClaimDailyWish();
      return;
    }
    handleWishQuickAction(wish.action);
  };

  const handleClaimReturnWelcome = () => {
    playAfterUnlock('tap');
    setPet((current) => {
      const beforeClaimedAt = current.returnWelcome?.claimedAt;
      const next = claimReturnWelcomeReward(current);
      const didClaim = next.returnWelcome?.claimedAt !== beforeClaimedAt;
      playSfx(didClaim ? 'coin' : 'error');
      return next;
    });
  };

  const handleReturnWelcomeButton = () => {
    const welcome = petRef.current.returnWelcome;
    if (!welcome) return;
    if (welcome.claimedAt) {
      playAfterUnlock('error');
      return;
    }
    if (welcome.completedAt) {
      handleClaimReturnWelcome();
      return;
    }
    handleWishQuickAction(welcome.action);
  };

  const handleLanguageChange = (nextLanguage: LanguageCode) => {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    setLanguageState(nextLanguage);
    window.location.reload();
  };

  const handleReset = () => {
    playAfterUnlock('tap');
    setResetConfirmOpen(true);
  };

  const handleCancelReset = () => {
    playAfterUnlock('close');
    setResetConfirmOpen(false);
  };

  const handleConfirmReset = () => {
    playAfterUnlock('tap');
    clearPet();
    const fresh = createDefaultPet();
    const moddedFresh = activeMod
      ? {
          ...withPetIdentityBirthday(fresh, activeMod.manifest.birthday),
          name: activeMod.manifest.defaultPetName,
          recentEvent: activeMod.manifest.texts?.recentEvent ?? fresh.recentEvent,
        }
      : withPetIdentityBirthday(fresh, defaultPetBirthday);
    setPet(moddedFresh);
    setDraftName(moddedFresh.name);
    setDraftBirthday(moddedFresh.birthday);
    setPomodoroOpen(false);
    setSettingsOpen(false);
    setResetConfirmOpen(false);
  };

  const handleModFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const oldDefaultName = activeMod?.manifest.defaultPetName ?? defaultPetName;
      const parsed = await parsePetModZip(file);
      await saveActivePetMod(parsed);
      const loaded = await loadActivePetMod();
      setActiveMod(loaded);
      setModMessage(
        parsed.warnings.length > 0
          ? t('ui.settings.mod.importedWithFallback', { name: parsed.manifest.name, count: parsed.warnings.length })
          : t('ui.settings.mod.imported', { name: parsed.manifest.name }),
      );
      setPet((current) => {
        const shouldUseModDefaultName = current.name === defaultPetName || current.name === oldDefaultName;
        const nextName = shouldUseModDefaultName ? parsed.manifest.defaultPetName : current.name;
        return {
          ...withPetIdentityBirthday(current, parsed.manifest.birthday),
          name: nextName,
          recentEvent: parsed.manifest.texts?.recentEvent ?? t('ui.settings.mod.switched', { name: parsed.manifest.name }),
        };
      });
      setDraftName((current) => (current === defaultPetName || current === oldDefaultName ? parsed.manifest.defaultPetName : current));
      setDraftBirthday(parsed.manifest.birthday);
    } catch (error) {
      setModMessage(error instanceof Error ? error.message : t('ui.settings.mod.importFailed'));
      playSfx('error');
    }
  };

  const handleClearMod = async () => {
    try {
      await clearActivePetMod();
      setActiveMod(null);
      setPet((current) => withPetIdentityBirthday(current, defaultPetBirthday));
      setDraftBirthday(defaultPetBirthday);
      setModMessage(t('ui.settings.mod.restored'));
    } catch (error) {
      setModMessage(error instanceof Error ? error.message : t('ui.settings.mod.restoreFailed'));
    }
  };

  const handleExportSave = () => {
    const text = createSaveFileText(petRef.current, activeMod?.manifest);
    setSaveText(text);
    setModMessage(t('ui.settings.save.generated'));
  };

  const handleDownloadSave = () => {
    const text = saveText || createSaveFileText(petRef.current, activeMod?.manifest);
    setSaveText(text);
    downloadTextFile(`pocpet-save-${new Date().toISOString().slice(0, 10)}.pocpet`, text);
  };

  const importSaveFromText = (text: string) => {
    try {
      const imported = parseSaveFileText(text);
      const importedMod = imported.activeMod;
      const hasMatchingMod = importedMod ? activeMod?.manifest.id === importedMod.id : true;
      const nextPet = importedMod && !hasMatchingMod
        ? imported.pet
        : activeMod
          ? withPetIdentityBirthday(imported.pet, activeMod.manifest.birthday)
          : withBackfilledBirthday(imported.pet, defaultPetBirthday);
      setPet(nextPet);
      setDraftName(nextPet.name);
      setDraftBirthday(nextPet.birthday);
      setImportSaveText('');
      setModMessage(
        importedMod && !hasMatchingMod
          ? t('ui.settings.save.importedMissingMod', { name: importedMod.name, version: importedMod.version })
          : t('ui.settings.save.imported'),
      );
    } catch (error) {
      setModMessage(error instanceof Error ? error.message : t('ui.settings.save.importFailed'));
      playSfx('error');
    }
  };

  const handleImportSaveFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      importSaveFromText(await readFileText(file));
    } catch (error) {
      setModMessage(error instanceof Error ? error.message : t('ui.settings.save.readFailed'));
    }
  };

  const availableFloatingReward = floatingRewardConfigs.find((reward) => !pet.claimedRewardIds.includes(reward.id));
  const activeRewardPopup = rewardQueue[0];
  const activeYearReview = !activeRewardPopup && !isShopOpen && !isSettingsOpen && !isResetConfirmOpen ? pet.pendingYearReview : undefined;

  const handleCloseYearReview = () => {
    playAfterUnlock('tap');
    setPet((current) => dismissYearReview(current));
  };

  const renderRewardItems = (reward: RewardPopup) => {
    const rewardItems: RewardDisplayItem[] = [];

    if (reward.coins) {
      rewardItems.push({
        key: 'coins',
        icon: currencyIcon,
        label: t('ui.rewards.coins', { coins: formatCompactNumber(reward.coins) }),
        title: t('ui.rewards.coins', { coins: reward.coins }),
      });
    }

    if (reward.hearts) {
      rewardItems.push({
        key: 'hearts',
        label: t('ui.rewards.hearts', { hearts: formatCompactNumber(reward.hearts) }),
        title: t('ui.rewards.hearts', { hearts: reward.hearts }),
      });
    }

    reward.items.forEach((item, index) => {
      const displayItem = getDisplayItem(displayInventoryItems, item.itemId);
      rewardItems.push({
        key: `${item.itemId}:${index}`,
        icon: itemIconMap[item.itemId],
        label: t('ui.rewards.item', { item: displayItem?.displayName ?? item.itemId, count: item.amount }),
      });
    });

    return rewardItems.map((item) => (
      <div className="reward-modal__item" key={item.key} title={item.title}>
        {item.icon ? <img src={item.icon} alt="" aria-hidden="true" /> : <Heart size={22} aria-hidden="true" />}
        <span>{item.label}</span>
      </div>
    ));
  };

  const pomodoroOverlay = showPomodoroPanel ? (
    <PomodoroOverlay
      pet={pet}
      progress={pomodoroProgress}
      remainingMs={pomodoroRemainingMs}
      isActionDisabled={isPomodoroActionDisabled}
      startTitle={pomodoroStartTitle}
      onToggle={handleTogglePomodoro}
      onReset={handleResetPomodoro}
      onSettingChange={handlePomodoroSettingChange}
    />
  ) : undefined;
  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">{t('ui.brand.eyebrow')}</p>
          <h1>{pet.name}</h1>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="coin-pill"
            onClick={handleOpenShop}
            aria-label={`${t('ui.top.openShop')}: ${t('ui.shop.wallet', { coins: pet.coins })}`}
            title={t('ui.shop.wallet', { coins: pet.coins })}
          >
            <img src={currencyIcon} alt="" aria-hidden="true" />
            <strong>{formatCompactNumber(pet.coins)}</strong>
          </button>
          <div className="heart-pill" aria-label={t('ui.top.heartsAria', { hearts: pet.hearts })} title={t('ui.top.heartsAria', { hearts: pet.hearts })}>
            <Heart size={20} aria-hidden="true" />
            <strong>{formatCompactNumber(pet.hearts)}</strong>
          </div>
          <button
            type="button"
            className="icon-button audio-button"
            aria-label={isAudioEnabled ? t('ui.top.audioOn') : t('ui.top.audioOff')}
            title={isAudioEnabled ? t('ui.top.audioOn') : t('ui.top.audioOff')}
            aria-pressed={isAudioEnabled}
            onClick={handleAudioToggle}
          >
            {isAudioEnabled ? <Volume2 size={21} aria-hidden="true" /> : <VolumeX size={21} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={t('ui.top.openSettings')}
            title={t('ui.top.settings')}
            onClick={() => {
              playAfterUnlock('open');
              setDraftName(pet.name);
              setDraftBirthday(pet.birthday);
              setSettingsOpen(true);
            }}
          >
            <Settings size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="content-grid">
        <PetDisplay
          pet={pet}
          onInteract={handleInteract}
          overlay={pomodoroOverlay}
          petStatusImages={petStatusImageMap}
          petActivityImages={petActivityImageMap}
          getStatusLabel={getStatusLabel}
        />

        <section className="dashboard" aria-label={t('ui.dashboard.aria')}>
          <div className="event-panel">
            <span>{t('ui.dashboard.event')}</span>
            <p>{pet.recentEvent}</p>
          </div>

          <div className="wish-stack">
            {returnWelcomeView && (
              <section className="wish-panel wish-panel--return" aria-label={t('ui.returnWelcome.aria')}>
                <div className="wish-panel__copy">
                  <span>{t('ui.returnWelcome.kicker')}</span>
                  <h2>{returnWelcomeView.title}</h2>
                  <p>{returnWelcomeView.description}</p>
                  <small>{returnWelcomeView.progressText} · {returnWelcomeView.rewardText}</small>
                </div>
                <button type="button" className="primary-button wish-panel__button" onClick={handleReturnWelcomeButton}>
                  {returnWelcomeButtonLabel}
                </button>
              </section>
            )}
            {!dailyWishView.claimed && (
              <section className="wish-panel" aria-label={t('ui.dailyWish.aria')}>
                <div className="wish-panel__copy">
                  <span>{t('ui.dailyWish.kicker')}</span>
                  <h2>{dailyWishView.title}</h2>
                  <p>{dailyWishView.description}</p>
                  <small>{dailyWishView.progressText} · {dailyWishView.rewardText}</small>
                </div>
                <button type="button" className="primary-button wish-panel__button" disabled={dailyWishView.claimed} onClick={handleDailyWishButton}>
                  {dailyWishButtonLabel}
                </button>
              </section>
            )}
          </div>

          <div className="stat-grid">
            {stats.map((stat) => (
              <StatusBar key={stat.label} {...stat} />
            ))}
          </div>

          <FeatureRow
            pet={pet}
            canUpgrade={canUpgrade}
            nextUpgradeCost={nextUpgradeCost}
            isPomodoroOpen={isPomodoroOpen}
            pomodoroRemainingMs={pomodoroRemainingMs}
            pomodoroStartTitle={pomodoroStartTitle}
            onUpgrade={handleUpgrade}
            onOpenPomodoro={handleOpenPomodoro}
          />

          <div className="meta-row" aria-label={t('ui.dashboard.metaAria')}>
            <span>{t('ui.dashboard.sharedTime', { time: formatSharedTime(pet.ageSeconds) })}</span>
            <span title={weatherInfo[pet.weather].summary}>{t('ui.dashboard.weather', { weather: weatherInfo[pet.weather].label })}</span>
            <span title={seasonInfo.summary}>{t('ui.dashboard.season', { season: seasonInfo.label })}</span>
            <span>{pet.isSleeping ? t('ui.dashboard.resting') : t('ui.dashboard.active')}</span>
          </div>

          <InventoryPanel
            ownedItems={ownedItems}
            inventory={pet.inventory}
            itemIconMap={itemIconMap}
            onOpenShop={handleOpenShop}
            onUseItem={handleUseItem}
          />
        </section>
      </div>

      <ActionDock isSleeping={pet.isSleeping} isLowEnergy={isLowEnergy} onAction={handleAction} onOpenShop={handleOpenShop} />

      {availableFloatingReward && (
        <button
          type="button"
          className="floating-reward-button"
          aria-label={t('ui.rewards.claim')}
          title={t('ui.rewards.claim')}
          onClick={() => handleClaimFloatingReward(availableFloatingReward)}
        >
          <img src={giftBoxIcon} alt="" aria-hidden="true" />
        </button>
      )}

      {activeRewardPopup && (
        <div className="modal-backdrop" role="presentation">
          <section className="reward-modal" role="dialog" aria-modal="true" aria-labelledby="reward-title">
            <img className="reward-modal__gift" src={giftBoxIcon} alt="" aria-hidden="true" />
            <div className="reward-modal__copy">
              <span>{t('ui.rewards.kicker')}</span>
              <h2 id="reward-title">{activeRewardPopup.title}</h2>
              <p>{activeRewardPopup.message}</p>
            </div>
            <div className="reward-modal__items">{renderRewardItems(activeRewardPopup)}</div>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                playAfterUnlock('tap');
                setRewardQueue((queue) => queue.slice(1));
              }}
            >
              {t('ui.rewards.confirm')}
            </button>
          </section>
        </div>
      )}

      {activeYearReview && <YearReviewModal review={activeYearReview} onClose={handleCloseYearReview} />}

      {isShopOpen && (
        <ShopModal
          pet={pet}
          visibleItems={visibleShopItems}
          activeCategory={activeShopCategory}
          itemIconMap={itemIconMap}
          onClose={handleCloseShop}
          onSelectCategory={setActiveShopCategory}
          onBuyItem={handleBuyItem}
          onExchangeHeart={handleExchangeHeart}
          isHeartExchangeCoolingDown={isHeartExchangeCoolingDown}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          activeMod={activeMod}
          modMessage={modMessage}
          draftName={draftName}
          draftBirthday={draftBirthday}
          language={language}
          saveText={saveText}
          importSaveText={importSaveText}
          hasOpenedHelp={pet.hasOpenedHelp}
          onDraftNameChange={setDraftName}
          onDraftBirthdayChange={setDraftBirthday}
          onLanguageChange={handleLanguageChange}
          onImportSaveTextChange={setImportSaveText}
          onOpenHelp={handleOpenHelp}
          onClose={() => {
            playAfterUnlock('close');
            setSettingsOpen(false);
          }}
          onSaveProfile={handleSaveProfile}
          onReset={handleReset}
          onClearMod={handleClearMod}
          onExportSave={handleExportSave}
          onDownloadSave={handleDownloadSave}
          onImportPastedSave={() => importSaveFromText(importSaveText)}
          onModFileChange={handleModFileChange}
          onImportSaveFileChange={handleImportSaveFileChange}
        />
      )}
      {isResetConfirmOpen && (
        <ConfirmDialog
          title={t('ui.settings.resetDialog.title')}
          message={t('ui.settings.resetDialog.message')}
          cancelLabel={t('ui.settings.resetDialog.cancel')}
          confirmLabel={t('ui.settings.resetDialog.confirm')}
          onCancel={handleCancelReset}
          onConfirm={handleConfirmReset}
        />
      )}
    </main>
  );
};







