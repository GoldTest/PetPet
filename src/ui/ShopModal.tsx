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

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="shop-modal" role="dialog" aria-modal="true" aria-labelledby="shop-title">
        <header>
          <div>
            <p className="eyebrow">{t('ui.shop.eyebrow')}</p>
            <h2 id="shop-title">{t('ui.shop.title')}</h2>
          </div>
          <button type="button" className="text-button" onClick={onClose}>{t('ui.shop.close')}</button>
        </header>

        <div className="shop-wallet">
          <img src={currencyIcon} alt="" aria-hidden="true" />
          <span>{t('ui.shop.wallet', { coins: pet.coins })}</span>
        </div>

        <div className="shop-exchange" aria-label={t('ui.shop.exchange.aria')}>
          <div className="shop-exchange__copy">
            <span className="shop-exchange__rate">
              <Heart size={16} aria-hidden="true" />
              {t('ui.shop.exchange.rate', { coins: heartExchangeInfo.coins })}
            </span>
            <small>{t('ui.shop.exchange.progress', { count: heartExchangeInfo.count, limit: heartExchangeInfo.limit })}</small>
          </div>
          <button type="button" disabled={!canExchangeHeart} onClick={onExchangeHeart}>
            {t('ui.shop.exchange.button', { coins: heartExchangeInfo.coins })}
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
            const displayPrice = isDiscountAvailable ? discountInfo?.price ?? item.price : item.price;
            const canAfford = pet.coins >= displayPrice;
            const biscuitClaimInfo = item.id === 'emergency_biscuit' ? getDailyBiscuitClaimInfo(pet) : undefined;
            const isClaimedOut = biscuitClaimInfo ? !biscuitClaimInfo.canClaim : false;
            const buttonLabel = biscuitClaimInfo
              ? isClaimedOut
                ? t('ui.shop.claimedOut')
                : t('ui.shop.freeClaim', { claimed: biscuitClaimInfo.claimed, limit: biscuitClaimInfo.limit })
              : t('ui.shop.price', { price: displayPrice });

            return (
              <article className="shop-item" key={item.id} data-item-id={item.id}>
                <img className="shop-item__icon" src={itemIconMap[item.id]} alt="" aria-hidden="true" />
                <div>
                  <strong>
                    {item.displayName}
                    {isDiscountItem && <em className={isDiscountAvailable ? 'shop-badge' : 'shop-badge shop-badge--used'}>{isDiscountAvailable ? t('ui.shop.discountToday') : t('ui.shop.discountUsed')}</em>}
                  </strong>
                  <span>{item.displaySummary}</span>
                  {isDiscountAvailable && <small className="shop-price-note">{t('ui.shop.priceNote', { originalPrice: discountInfo?.originalPrice, label: discountInfo?.label })}</small>}
                </div>
                <button type="button" data-buy-item={item.id} disabled={isClaimedOut || !canAfford} onClick={() => onBuyItem(item.id)}>{buttonLabel}</button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
