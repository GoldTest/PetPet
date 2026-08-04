import { useMemo } from 'react';
import { ArrowLeft, MessageCircleHeart, Store } from 'lucide-react';
import { currencyIcon, unknownItemIcon } from '../assets';
import { getDailyBiscuitClaimInfo, getMerchantCategoryLabel, getMerchantView, type InventoryItemDefinition, type ItemId, type PetState } from '../core/pet';
import { t } from '../i18n';
import { getItemEffectBadges } from './itemEffectBadges';
import { formatCompactNumber } from './numberFormat';

interface TradeHallPageProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  items: readonly InventoryItemDefinition[];
  onBack: () => void;
  onBuyItem: (itemId: ItemId) => void;
}

export const TradeHallPage = ({ pet, itemIconMap, items, onBack, onBuyItem }: TradeHallPageProps) => {
  const merchant = useMemo(() => getMerchantView('resident'), []);
  const itemById = new Map(items.map((item) => [item.id, item]));

  return (
    <section className="market-page market-page--facility" aria-label={t('ui.market.tradehall.title')}>
      <header className="market-page__header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={t('ui.market.back')} title={t('ui.market.back')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="market-page__heading">
          <span>{t('ui.market.kicker')}</span>
          <h2>{t('ui.market.tradehall.title')}</h2>
        </div>
        <span className="market-page__wallet" title={t('ui.shop.wallet', { coins: pet.coins })}>
          <img src={currencyIcon} alt="" aria-hidden="true" />
          <strong>{pet.coins}</strong>
        </span>
      </header>

      <div className="market-facility-view market-facility-view--tradehall">
        <div className="market-tradehall__intro">
          <MessageCircleHeart size={20} aria-hidden="true" />
          <p>{t('ui.market.tradehall.welcome')}</p>
        </div>
        <aside className="market-tradehall-panel">
          <div className="market-merchant__heading">
            <span>{merchant.title}</span>
            <h3>{merchant.name}</h3>
          </div>
          <div className="market-goods">
            {merchant.categories.map((category) => {
              const categoryItems = category.itemIds
                .map((itemId) => itemById.get(itemId))
                .filter((item): item is InventoryItemDefinition => Boolean(item));
              if (categoryItems.length === 0) return null;
              return (
                <section key={category.id} className="market-goods__section">
                  <h4>{getMerchantCategoryLabel(category)}</h4>
                  <div className="market-goods__grid">
                    {categoryItems.map((item) => {
                      const icon = itemIconMap[item.id] ?? item.imageUrl ?? unknownItemIcon;
                      const biscuitClaimInfo = item.id === 'emergency_biscuit' ? getDailyBiscuitClaimInfo(pet) : undefined;
                      const isClaimedOut = biscuitClaimInfo ? !biscuitClaimInfo.canClaim : false;
                      const canAfford = pet.coins >= item.price;
                      const effectBadges = getItemEffectBadges(item.effect);
                      const buttonLabel = biscuitClaimInfo
                        ? isClaimedOut
                          ? t('ui.shop.claimedOut')
                          : t('ui.shop.freeClaim', { claimed: biscuitClaimInfo.claimed, limit: biscuitClaimInfo.limit })
                        : formatCompactNumber(item.price);
                      return (
                        <article className="market-goods__item" key={item.id}>
                          <img className="market-goods__icon" src={icon} alt="" aria-hidden="true" />
                          <div className="market-goods__copy">
                            <div className="market-goods__title-row">
                              <strong>{item.displayName}</strong>
                              {effectBadges.length > 0 && (
                                <div className="market-goods__badges" aria-label={effectBadges.map((badge) => badge.label).join(', ')}>
                                  {effectBadges.map((badge) => (
                                    <span key={badge.key}>{badge.label}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <small>{item.displaySummary}</small>
                          </div>
                          <button
                            type="button"
                            className={canAfford && !isClaimedOut ? 'market-goods__buy' : 'market-goods__buy market-goods__buy--disabled'}
                            disabled={isClaimedOut || !canAfford}
                            title={biscuitClaimInfo ? undefined : t('ui.shop.price', { price: item.price })}
                            onClick={() => onBuyItem(item.id)}
                          >
                            {biscuitClaimInfo ? buttonLabel : (
                              <>
                                <img src={currencyIcon} alt="" aria-hidden="true" />
                                {buttonLabel}
                              </>
                            )}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
};