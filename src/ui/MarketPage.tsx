import { useMemo, useState } from 'react';
import { ArrowLeft, Boxes, MessageCircleHeart, RotateCw, Store, Warehouse } from 'lucide-react';
import { currencyIcon, marketDistrictImages, marketHubImage, merchantCharacterImages, portalImage, unknownItemIcon } from '../assets';
import { canRandomTravel, getAnchoredWorlds, getDailyBiscuitClaimInfo, getMerchantCategoryLabel, getMerchantView, marketDistrictDefinitions, randomTravelEnergyCost, randomTravelMineralCost, type InventoryItemDefinition, type ItemId, type MarketDistrictId, type MerchantId, type PetState } from '../core/pet';
import { t } from '../i18n';
import { getItemEffectBadges } from './itemEffectBadges';
import { formatCompactNumber } from './numberFormat';

interface MarketPageProps {
  pet: PetState;
  itemIconMap: Partial<Record<string, string>>;
  items: readonly InventoryItemDefinition[];
  onBack: () => void;
  onBuyItem: (itemId: ItemId) => void;
  onRandomTravel: () => MarketDistrictId | null;
}

type FacilityView = 'facilities' | 'portal' | 'warehouse';

export const MarketPage = ({ pet, itemIconMap, items, onBack, onBuyItem, onRandomTravel }: MarketPageProps) => {
  const [facility, setFacility] = useState<FacilityView>('facilities');
  const [districtId, setDistrictId] = useState<MarketDistrictId | null>(null);
  const [merchantId, setMerchantId] = useState<MerchantId | null>(null);
  const [dialogueVersion, setDialogueVersion] = useState(0);

  const district = districtId ? marketDistrictDefinitions.find((entry) => entry.id === districtId) : null;
  const merchant = useMemo(
    () => (merchantId ? getMerchantView(merchantId) : null),
    [merchantId, dialogueVersion],
  );
  const itemById = new Map(items.map((item) => [item.id, item]));
  const anchoredWorlds = getAnchoredWorlds(pet);
  const randomTravelAvailable = canRandomTravel(pet) && anchoredWorlds.length < marketDistrictDefinitions.length;
  const allAnchored = anchoredWorlds.length === marketDistrictDefinitions.length;

  const enterDistrict = (id: MarketDistrictId) => {
    const entry = marketDistrictDefinitions.find((candidate) => candidate.id === id);
    setDistrictId(id);
    setMerchantId(entry ? entry.merchantId : null);
    setDialogueVersion(0);
  };

  const leaveDistrict = () => {
    setDistrictId(null);
    setMerchantId(null);
  };

  const talkToMerchant = (id: MerchantId) => {
    setMerchantId(id);
    setDialogueVersion((version) => version + 1);
  };

  const handleRandomTravel = () => {
    const worldId = onRandomTravel();
    if (worldId) enterDistrict(worldId);
  };

  const backToFacilities = () => {
    setFacility('facilities');
    leaveDistrict();
  };

  const back = facility === 'facilities' && !districtId ? onBack : backToFacilities;

  return (
    <section
      className={
        districtId
          ? 'market-page market-page--district'
          : facility === 'facilities'
            ? 'market-page market-page--overview'
            : 'market-page market-page--facility'
      }
      aria-label={t('ui.market.aria')}
    >
      <header className="market-page__header">
        <button type="button" className="icon-button" onClick={back} aria-label={districtId ? t('ui.market.backToStalls') : facility === 'facilities' ? t('ui.market.back') : t('ui.market.backToFacilities')} title={districtId ? t('ui.market.backToStalls') : facility === 'facilities' ? t('ui.market.back') : t('ui.market.backToFacilities')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="market-page__heading">
          <span>{t('ui.market.kicker')}</span>
          <h2>
            {district
              ? t(district.nameKey)
              : facility === 'portal'
                ? t('ui.market.portal.title')
                : facility === 'warehouse'
                    ? t('ui.market.facilities.warehouse')
                    : t('ui.market.title')}
          </h2>
        </div>
        <span className="market-page__wallet" title={t('ui.shop.wallet', { coins: pet.coins })}>
          <img src={currencyIcon} alt="" aria-hidden="true" />
          <strong>{pet.coins}</strong>
        </span>
      </header>

      {!districtId && facility === 'facilities' && (
        <div className="market-overview">
          <img className="market-overview__bg" src={marketHubImage} alt="" aria-hidden="true" />
          <div className="market-overview__facilities">
            <button type="button" className="market-facility market-facility--portal" onClick={() => setFacility('portal')} aria-label={t('ui.market.facilities.portal')} title={t('ui.market.facilities.portal')}>
              <span className="market-facility__icon" aria-hidden="true">
                <img src={portalImage} alt="" />
              </span>
              <span className="market-facility__name">{t('ui.market.facilities.portal')}</span>
              <span className="market-facility__hint">{t('ui.market.facilities.portalHint')}</span>
            </button>
            
            <button type="button" className="market-facility market-facility--warehouse" disabled aria-label={t('ui.market.facilities.warehouse')} title={t('ui.market.facilities.warehouseSoon')}>
              <span className="market-facility__icon" aria-hidden="true">
                <Warehouse size={34} />
              </span>
              <span className="market-facility__name">{t('ui.market.facilities.warehouse')}</span>
              <span className="market-facility__hint">{t('ui.market.facilities.warehouseSoon')}</span>
            </button>
          </div>
        </div>
      )}

      {!districtId && facility === 'portal' && (
        <div className="market-facility-view market-facility-view--portal">
          <div className="market-portal">
            <div className="market-portal__vortex" aria-hidden="true" />
            <div className="market-portal__vortex market-portal__vortex--outer" aria-hidden="true" />
            <img className="market-portal__core" src={portalImage} alt="" aria-hidden="true" />
            <button
              type="button"
              className={randomTravelAvailable ? 'market-portal__travel' : 'market-portal__travel market-portal__travel--disabled'}
              disabled={!randomTravelAvailable}
              onClick={handleRandomTravel}
              aria-label={t('ui.market.portal.random')}
            >
              <RotateCw size={18} aria-hidden="true" />
              <span>{t('ui.market.portal.random')}</span>
              <small>{allAnchored ? t('ui.market.portal.allAnchored') : randomTravelAvailable ? t('ui.market.portal.ticket', { minerals: `${pet.multiverse.minerals}/${randomTravelMineralCost}`, energy: `${pet.multiverse.energy}/${randomTravelEnergyCost}` }) : t('ui.market.portal.randomUnavailable')}</small>
            </button>
          </div>
          <section className="market-anchors">
            <h3>{t('ui.market.portal.anchored')}</h3>
            {anchoredWorlds.length === 0 ? (
              <p className="market-anchors__none">{t('ui.market.portal.none')}</p>
            ) : (
              <div className="market-anchors__grid">
                {anchoredWorlds.map((entry) => (
                  <button type="button" key={entry.id} className="market-anchor" onClick={() => enterDistrict(entry.id)} aria-label={t(entry.nameKey)} title={t(entry.nameKey)}>
                    <img src={portalImage} alt="" aria-hidden="true" />
                    <span>{t(entry.nameKey)}</span>
                    <small>{t(entry.subtitleKey)}</small>
                  </button>
                ))}
              </div>
            )}
            {allAnchored && <p className="market-anchors__all">{t('ui.market.portal.allAnchored')}</p>}
          </section>
        </div>
      )}

      {!districtId && facility === 'warehouse' && (
        <div className="market-facility-view market-facility-view--warehouse">
          <Boxes size={40} aria-hidden="true" />
          <p>{t('ui.market.facilities.warehouseSoon')}</p>
        </div>
      )}

      {district && (
        <div className="market-district">
          <img className="market-district__bg" src={marketDistrictImages[district.id]} alt="" aria-hidden="true" />
          {district.merchantId && (
            <button
              type="button"
              className="market-district__merchant"
              onClick={() => talkToMerchant(district.merchantId)}
              aria-label={t('ui.market.talkTo', { name: t(getMerchantView(district.merchantId).name) })}
              title={t('ui.market.talkTo', { name: t(getMerchantView(district.merchantId).name) })}
            >
              <img src={merchantCharacterImages[district.merchantId]} alt="" aria-hidden="true" />
            </button>
          )}
          {merchant && (
            <div className="market-district__dialogue" key={dialogueVersion}>
              <MessageCircleHeart size={18} aria-hidden="true" />
              <p>{merchant.dialogue}</p>
            </div>
          )}
          {merchant && (
            <aside className="market-merchant-panel">
              <div className="market-merchant__heading">
                <span>{merchant.title}</span>
                <h3>{merchant.name}</h3>
              </div>
              {merchant.isOpen ? (
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
              ) : (
                <div className="market-closed">
                  <Store size={28} aria-hidden="true" />
                  <p>{t('ui.market.closed', { name: merchant.name })}</p>
                </div>
              )}
            </aside>
          )}
        </div>
      )}
    </section>
  );
};


