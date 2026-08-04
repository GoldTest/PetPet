import { Anchor, CalendarClock, Fish, Leaf, Orbit, PackageOpen, Sparkles, Sprout, Store } from 'lucide-react';
import { partnerScheduleUnlockLevel, type PetState } from '../core/pet';
import { t } from '../i18n';

interface FeatureRowProps {
  pet: PetState;
  inventoryKindCount: number;
  gardenReminder?: 'ready' | 'withered';
  vegGardenReminder?: 'ready';
  hasShopDiscount: boolean;
  onOpenInventory: () => void;
  onOpenGarden: () => void;
  onOpenVegGarden: () => void;
  onOpenMarket: () => void;
  onOpenMarketTrade: () => void;
  onOpenShop: () => void;
  onOpenPartnerSchedule: () => void;
  onOpenWishingWell: () => void;
  onOpenFishing: () => void;
}

export const FeatureRow = ({
  pet,
  inventoryKindCount,
  gardenReminder,
  vegGardenReminder,
  hasShopDiscount,
  onOpenInventory,
  onOpenGarden,
  onOpenVegGarden,
  onOpenMarket,
  onOpenMarketTrade,
  onOpenShop,
  onOpenPartnerSchedule,
  onOpenWishingWell,
  onOpenFishing,
}: FeatureRowProps) => {
  const gardenHint = gardenReminder === 'ready'
    ? t('ui.features.gardenReady')
    : gardenReminder === 'withered'
      ? t('ui.features.gardenWithered')
      : t('ui.features.gardenHint');
  const isPartnerScheduleUnlocked = pet.level >= partnerScheduleUnlockLevel;
  const partnerScheduleHint = !isPartnerScheduleUnlocked
    ? t('ui.features.partnerScheduleLocked', { level: partnerScheduleUnlockLevel })
    : pet.partnerSchedule.pendingResult
      ? t('ui.features.partnerScheduleReady')
      : pet.partnerSchedule.active
        ? t('ui.features.partnerScheduleActive')
        : t('ui.features.partnerScheduleHint');

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
        className={pet.partnerSchedule.active || pet.partnerSchedule.pendingResult ? 'feature-button feature-button--partner-schedule feature-button--active' : 'feature-button feature-button--partner-schedule'}
        disabled={!isPartnerScheduleUnlocked}
        onClick={onOpenPartnerSchedule}
        title={partnerScheduleHint}
      >
        <CalendarClock size={20} aria-hidden="true" />
        <span>
          {t('ui.features.partnerSchedule')}
          <small>{partnerScheduleHint}</small>
        </span>
        {pet.partnerSchedule.pendingResult ? <i aria-hidden="true" /> : null}
      </button>

      <button
        type="button"
        className={vegGardenReminder ? 'feature-button feature-button--veg-garden feature-button--active' : 'feature-button feature-button--veg-garden'}
        onClick={onOpenVegGarden}
      >
        <Leaf size={20} aria-hidden="true" />
        <span>
          {t('ui.features.vegGarden')}
          <small>{t('ui.features.vegGardenHint')}</small>
        </span>
        {vegGardenReminder && <i aria-hidden="true" />}
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
        className="feature-button feature-button--wishing-well"
        onClick={onOpenWishingWell}
      >
        <Sparkles size={20} aria-hidden="true" />
        <span>
          {t('ui.features.wishingWell')}
          <small>{t('ui.features.wishingWellHint')}</small>
        </span>
      </button>

      <button
        type="button"
        className="feature-button feature-button--fishing"
        onClick={onOpenFishing}
      >
        <Fish size={20} aria-hidden="true" />
        <span>
          {t('ui.features.fishing')}
          <small>{t('ui.features.fishingHint')}</small>
        </span>
      </button>

      <button
        type="button"
        className="feature-button feature-button--shop"
        onClick={onOpenShop}
      >
        <Store size={20} aria-hidden="true" />
        <span>
          {t('ui.features.shop')}
          <small>{t('ui.features.shopHint')}</small>
        </span>
        {hasShopDiscount && <i aria-hidden="true" />}
      </button>

      <button
        type="button"
        className="feature-button feature-button--market"
        onClick={onOpenMarket}
      >
        <Orbit size={20} aria-hidden="true" />
        <span>
          {t('ui.features.market')}
          <small>{t('ui.features.marketHint')}</small>
        </span>
      </button>

      <button
        type="button"
        className="feature-button feature-button--market-trade"
        onClick={onOpenMarketTrade}
      >
        <Store size={20} aria-hidden="true" />
        <span>
          {t('ui.features.marketTrade')}
          <small>{t('ui.features.marketTradeHint')}</small>
        </span>
      </button>
    </div>
  );
};
