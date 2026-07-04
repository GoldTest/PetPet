import { BadgeCheck, CalendarDays, Cloud, CloudRain, Sparkles, Sprout, Sun, Timer, Wind, type LucideIcon } from 'lucide-react';
import { canClaimBoostCardDailyCoins, getActiveBoostCard, getSeasonInfo, weatherInfo, type PetState, type WeatherType } from '../core/pet';
import { t } from '../i18n';
import { formatCompactNumber } from './numberFormat';
import { formatPomodoroTime } from './time';

const weatherIcons: Record<WeatherType, LucideIcon> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  breezy: Wind,
};

interface FeatureRowProps {
  pet: PetState;
  canUpgrade: boolean;
  nextUpgradeCost: number;
  isPomodoroOpen: boolean;
  pomodoroRemainingMs: number;
  pomodoroStartTitle?: string;
  gardenReminder?: 'ready' | 'withered';
  onUpgrade: () => void;
  onOpenPomodoro: () => void;
  onOpenGarden: () => void;
  onOpenBoostCards: () => void;
  onShowInfo: (message: string) => void;
}

export const FeatureRow = ({
  pet,
  canUpgrade,
  nextUpgradeCost,
  isPomodoroOpen,
  pomodoroRemainingMs,
  pomodoroStartTitle,
  gardenReminder,
  onUpgrade,
  onOpenPomodoro,
  onOpenGarden,
  onOpenBoostCards,
  onShowInfo,
}: FeatureRowProps) => {
  const WeatherIcon = weatherIcons[pet.weather];
  const currentWeather = weatherInfo[pet.weather];
  const seasonInfo = getSeasonInfo(pet.lastUpdatedAt);
  const activeBoostCardId = getActiveBoostCard(pet);
  const canClaimBoostCoins = canClaimBoostCardDailyCoins(pet);
  const upgradeCostText = nextUpgradeCost > 0 ? formatCompactNumber(nextUpgradeCost) : '';
  const boostCardHint = activeBoostCardId
    ? t('ui.features.boostCardsActive', { card: t(`ui.boostCards.cards.${activeBoostCardId}.name`) })
    : t('ui.features.boostCardsHint');
  const gardenHint = gardenReminder === 'ready'
    ? t('ui.features.gardenReady')
    : gardenReminder === 'withered'
      ? t('ui.features.gardenWithered')
      : t('ui.features.gardenHint');

  return (
    <div className="feature-row" aria-label={t('ui.features.aria')}>
      <button
        type="button"
        className={canUpgrade ? 'feature-button feature-button--upgrade' : 'feature-button feature-button--upgrade feature-button--muted'}
        onClick={onUpgrade}
        title={nextUpgradeCost > 0 ? t('ui.features.upgradeTitle', { cost: nextUpgradeCost }) : t('ui.features.maxLevel')}
      >
        <Sparkles size={20} aria-hidden="true" />
        <span>
          {t('ui.features.upgrade')}
          <small>{t('ui.features.level', { level: pet.level })} - {nextUpgradeCost > 0 ? t('ui.features.cost', { cost: upgradeCostText }) : t('ui.features.maxLevel')}</small>
        </span>
      </button>

      <button
        type="button"
        className={pet.pomodoro.isRunning ? 'feature-button feature-button--pomodoro feature-button--active' : 'feature-button feature-button--pomodoro'}
        title={pomodoroStartTitle}
        aria-pressed={isPomodoroOpen}
        onClick={onOpenPomodoro}
      >
        <Timer size={20} aria-hidden="true" />
        <span>
          {t('ui.features.pomodoro')}
          <small>{pet.pomodoro.isRunning ? t('ui.pomodoro.running') : formatPomodoroTime(pomodoroRemainingMs)}</small>
        </span>
        {pet.pomodoro.isRunning && <i aria-hidden="true" />}
      </button>

      <button
        type="button"
        className={canClaimBoostCoins ? 'feature-button feature-button--boost-card feature-button--active' : 'feature-button feature-button--boost-card'}
        onClick={onOpenBoostCards}
        title={t('ui.top.openBoostCards')}
      >
        <BadgeCheck size={20} aria-hidden="true" />
        <span>
          {t('ui.features.boostCards')}
          <small>{boostCardHint}</small>
        </span>
        {canClaimBoostCoins && <i aria-hidden="true" />}
      </button>

      <button
        type="button"
        className={gardenReminder ? 'feature-button feature-button--garden feature-button--active' : 'feature-button feature-button--garden'}
        onClick={onOpenGarden}
      >
        <Sprout size={20} aria-hidden="true" />
        <span>
          {t('ui.features.garden')}
          <small>{gardenHint}</small>
        </span>
        {gardenReminder && <i aria-hidden="true" />}
      </button>

      <button
        type="button"
        className="feature-button feature-button--weather"
        title={currentWeather.summary}
        aria-label={t('ui.features.weatherAria', { weather: currentWeather.label })}
        onClick={() => onShowInfo(currentWeather.summary)}
      >
        <WeatherIcon size={20} aria-hidden="true" />
        <span>{currentWeather.label}</span>
      </button>

      <button
        type="button"
        className="feature-button feature-button--season"
        title={seasonInfo.summary}
        aria-label={t('ui.dashboard.season', { season: seasonInfo.label })}
        onClick={() => onShowInfo(seasonInfo.summary)}
      >
        <CalendarDays size={20} aria-hidden="true" />
        <span>{seasonInfo.label}</span>
      </button>
    </div>
  );
};