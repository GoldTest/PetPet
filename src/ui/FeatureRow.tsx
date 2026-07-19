import { BadgeCheck, PackageOpen, Sprout, Timer } from 'lucide-react';
import { canClaimBoostCardDailyCoins, getActiveBoostCard, type PetState } from '../core/pet';
import { t } from '../i18n';
import { formatPomodoroTime } from './time';

interface FeatureRowProps {
  pet: PetState;
  inventoryKindCount: number;
  isPomodoroOpen: boolean;
  pomodoroRemainingMs: number;
  pomodoroStartTitle?: string;
  gardenReminder?: 'ready' | 'withered';
  onOpenInventory: () => void;
  onOpenPomodoro: () => void;
  onOpenGarden: () => void;
  onOpenBoostCards: () => void;
}

export const FeatureRow = ({
  pet,
  inventoryKindCount,
  isPomodoroOpen,
  pomodoroRemainingMs,
  pomodoroStartTitle,
  gardenReminder,
  onOpenInventory,
  onOpenPomodoro,
  onOpenGarden,
  onOpenBoostCards,
}: FeatureRowProps) => {
  const activeBoostCardId = getActiveBoostCard(pet);
  const canClaimBoostCoins = canClaimBoostCardDailyCoins(pet);
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
      <button type="button" className="feature-button feature-button--inventory" onClick={onOpenInventory}>
        <PackageOpen size={20} aria-hidden="true" />
        <span>
          {t('ui.features.inventory')}
          <small>{t('ui.features.inventoryKinds', { count: inventoryKindCount })}</small>
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
    </div>
  );
};
