import { Heart } from 'lucide-react';
import type { ItemDisplay } from '../core/mod';
import {
  getDailyBiscuitClaimInfo,
  getDailyHeartExchangeInfo,
  getDailyShopDiscountInfo,
  shopCategories,
  type ItemId,
  type PetState,
  type ShopCategory,
} from '../core/pet';
import { currencyIcon } from '../assets';
import { t } from '../i18n';
import { formatCompactNumber } from './numberFormat';

const effectKeys = ['hunger', 'mood', 'cleanliness', 'energy', 'health'] as const;

interface ShopModalProps {
  pet: PetState;
  visibleItems: readonly ItemDisplay[];
  activeCategory: ShopCategory;
  itemIconMap: Record<ItemId, string>;
  onClose: () => void;
  onSelectCategory: (category: ShopCategory) => void;
  onBuyItem: (itemId: ItemId) => void;
  onExchangeHeart: () => void;
  isHeartExchangeCoolingDown: boolean;
}

export const ShopModal = ({
  pet,
  visibleItems,
  activeCategory,
  itemIconMap,
  onClose,
  onSelectCategory,
  onBuyItem,
  onExchangeHeart,
  isHeartExchangeCoolingDown,
}: ShopModalProps) => {
  const discountInfo = getDailyShopDiscountInfo(pet);
  const heartExchangeInfo = getDailyHeartExchangeInfo(pet);
  const canExchangeHeart = pet.hearts > 0 && heartExchangeInfo.canExchange && !isHeartExchangeCoolingDown;
  const fullCoinText = t('ui.shop.wallet', { coins: pet.coins });
  const fullHeartText = t('ui.top.heartsAria', { hearts: pet.hearts });
  const fullExchangeRateText = t('ui.shop.exchange.rate', { coins: heartExchangeInfo.coins });
  const fullExchangeButtonText = t('ui.shop.exchange.button', { coins: heartExchangeInfo.coins });
  const exchangeCoinsText = formatCompactNumber(heartExchangeInfo.coins);
  const getEffectBadges = (item: ItemDisplay) =>
    effectKeys
      .map((key) => {
        const value = item.effect[key];
        if (!value) return undefined;
        const amount = value > 0 ? `+${value}` : String(value);
        return {
          key,
          label: `${t(`ui.stats.${key}`)} ${amount}`,
        };
      })
      .filter((badge): badge is { key: (typeof effectKeys)[number]; label: string } => Boolean(badge));

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="shop-modal" role="dialog" aria-modal="true" aria-labelledby="shop-title">
        <header>
          <div className="shop-title-row">
            <div className="shop-title-copy">
              <p className="eyebrow">{t('ui.shop.eyebrow')}</p>
              <h2 id="shop-title">{t('ui.shop.title')}</h2>
            </div>
            <div className="shop-resource-row">
              <span className="shop-resource-pill shop-resource-pill--coins" aria-label={fullCoinText} title={fullCoinText}>
                <img src={currencyIcon} alt="" aria-hidden="true" />
                <strong>{formatCompactNumber(pet.coins)}</strong>
              </span>
              <span className="shop-resource-pill shop-resource-pill--hearts" aria-label={fullHeartText} title={fullHeartText}>
                <Heart size={15} aria-hidden="true" />
                <strong>{formatCompactNumber(pet.hearts)}</strong>
              </span>
            </div>
          </div>
          <button type="button" className="text-button" onClick={onClose}>{t('ui.shop.close')}</button>
        </header>

        <div className="shop-exchange" aria-label={t('ui.shop.exchange.aria')}>
          <div className="shop-exchange__copy">
            <span className="shop-exchange__rate" title={fullExchangeRateText}>
              <Heart size={16} aria-hidden="true" />
              {t('ui.shop.exchange.rate', { coins: exchangeCoinsText })}
            </span>
            <small>{t('ui.shop.exchange.progress', { count: heartExchangeInfo.count, limit: heartExchangeInfo.limit })}</small>
          </div>
          <button type="button" disabled={!canExchangeHeart} title={fullExchangeButtonText} onClick={onExchangeHeart}>
            {t('ui.shop.exchange.button', { coins: exchangeCoinsText })}
          </button>
        </div>

        <div className="shop-tabs" role="tablist" aria-label={t('ui.shop.tabsAria')}>
          {shopCategories.map((category) => (
            <button
              type="button"
              key={category.id}
              role="tab"
              aria-selected={activeCategory === category.id}
              className={activeCategory === category.id ? 'shop-tab shop-tab--active' : 'shop-tab'}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="shop-grid">
          {visibleItems.map((item) => {
            const isDiscountItem = discountInfo?.itemId === item.id;
            const isDiscountAvailable = Boolean(isDiscountItem && !discountInfo?.used);
            const effectBadges = getEffectBadges(item);
            const displayPrice = isDiscountAvailable ? discountInfo?.price ?? item.price : item.price;
            const displayPriceText = formatCompactNumber(displayPrice);
            const priceTitle = t('ui.shop.price', { price: displayPrice });
            const originalPriceText = discountInfo?.originalPrice === undefined ? '' : formatCompactNumber(discountInfo.originalPrice);
            const originalPriceTitle = discountInfo?.originalPrice === undefined
              ? ''
              : t('ui.shop.priceNote', { originalPrice: discountInfo.originalPrice, label: discountInfo.label });
            const canAfford = pet.coins >= displayPrice;
            const biscuitClaimInfo = item.id === 'emergency_biscuit' ? getDailyBiscuitClaimInfo(pet) : undefined;
            const isClaimedOut = biscuitClaimInfo ? !biscuitClaimInfo.canClaim : false;
            const buttonLabel = biscuitClaimInfo
              ? isClaimedOut
                ? t('ui.shop.claimedOut')
                : t('ui.shop.freeClaim', { claimed: biscuitClaimInfo.claimed, limit: biscuitClaimInfo.limit })
              : t('ui.shop.price', { price: displayPriceText });

            return (
              <article className="shop-item" key={item.id} data-item-id={item.id}>
                <img className="shop-item__icon" src={itemIconMap[item.id]} alt="" aria-hidden="true" />
                <div>
                  <div className="shop-item__title-row">
                    <strong>
                      {item.displayName}
                      {isDiscountItem && <em className={isDiscountAvailable ? 'shop-badge' : 'shop-badge shop-badge--used'}>{isDiscountAvailable ? t('ui.shop.discountToday') : t('ui.shop.discountUsed')}</em>}
                    </strong>
                    {effectBadges.length > 0 && (
                      <div className="shop-effect-badges" aria-label={effectBadges.map((badge) => badge.label).join(', ')}>
                        {effectBadges.map((badge) => (
                          <span className="shop-effect-badge" key={badge.key}>
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span>{item.displaySummary}</span>
                  {isDiscountAvailable && <small className="shop-price-note" title={originalPriceTitle}>{t('ui.shop.priceNote', { originalPrice: originalPriceText, label: discountInfo?.label })}</small>}
                </div>
                <button type="button" data-buy-item={item.id} disabled={isClaimedOut || !canAfford} title={biscuitClaimInfo ? undefined : priceTitle} onClick={() => onBuyItem(item.id)}>{buttonLabel}</button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
