import { useState } from 'react';
import { ArrowLeft, Coins, Heart, Sparkles } from 'lucide-react';
import { currencyIcon } from '../assets';
import { getWishRarityColor, getWishingWellView, performWish, type WishRarity, type WishReward } from '../core/wishingWell';
import { getInventoryItem } from '../core/items';
import type { PetState } from '../core/pet';
import { formatCompactNumber } from './numberFormat';
import { t } from '../i18n';
import '../styles/wishing-well.css';

interface WishingWellPageProps {
  pet: PetState;
  onBack: () => void;
  onWish: (useCoins: boolean) => { pet: PetState; reward: WishReward } | null;
}

const getItemName = (itemId: string): string => {
  const item = getInventoryItem(itemId as Parameters<typeof getInventoryItem>[0]);
  return item?.name ?? itemId;
};

const rarityLabels: Record<WishRarity, string> = {
  common: t('pet.wishingWell.common.label'),
  rare: t('pet.wishingWell.rare.label'),
  epic: t('pet.wishingWell.epic.label'),
  legend: t('pet.wishingWell.legend.label'),
  hidden: t('pet.wishingWell.hidden.label'),
};

export const WishingWellPage = ({ pet, onBack, onWish }: WishingWellPageProps) => {
  const [reward, setReward] = useState<WishReward | null>(null);
  const [animating, setAnimating] = useState(false);
  const [coinPhase, setCoinPhase] = useState<'idle' | 'rise' | 'fall' | 'splash'>('idle');

  const view = getWishingWellView(pet);

  const handleWish = (useCoins: boolean) => {
    if (animating) return;
    setAnimating(true);
    const result = onWish(useCoins);
    if (!result) {
      setAnimating(false);
      return;
    }
    setCoinPhase('rise');
    setTimeout(() => setCoinPhase('fall'), 500);
    setTimeout(() => setCoinPhase('splash'), 800);
    setTimeout(() => {
      setReward(result.reward);
      setAnimating(false);
      setCoinPhase('idle');
    }, 1200);
  };

  const handleConfirm = () => {
    setReward(null);
  };

  return (
    <section className="wishing-well-page" aria-label={t('ui.wishingWell.title')}>
      <header className="wishing-well-page__header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={t('ui.market.back')} title={t('ui.market.back')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="wishing-well-page__heading">
          <span>{t('ui.wishingWell.kicker')}</span>
          <h2>{t('ui.wishingWell.title')}</h2>
        </div>
        <span className="wishing-well-page__wallet" title={t('ui.shop.wallet', { coins: pet.coins })}>
          <img src={currencyIcon} alt="" aria-hidden="true" />
          <strong>{formatCompactNumber(pet.coins)}</strong>
        </span>
      </header>

      <div className={`wishing-well-page__well ${animating ? 'wishing-well-page__well--animating' : ''} ${reward ? 'wishing-well-page__well--has-result' : ''}`}>
        <div className="wishing-well-page__water" aria-hidden="true">
          <div className="wishing-well-page__ripple" />
          <div className="wishing-well-page__ripple" />
          <div className="wishing-well-page__ripple" />
        </div>
        <div className="wishing-well-page__glow" aria-hidden="true" />

        <div className={`wishing-well-page__coin wishing-well-page__coin--${coinPhase}`} aria-hidden="true">
          <img src={currencyIcon} alt="" />
        </div>

        <div className="wishing-well-page__splash" aria-hidden="true" />

        <div className="wishing-well-page__well-content">
          {!reward ? (
            <>
              <div className="wishing-well-page__wish-info">
                <div className="wishing-well-page__wish-status">
                  <Sparkles size={18} />
                  <span>{view.canFreeWish ? t('ui.wishingWell.freeWishReady') : t('ui.wishingWell.freeWishDone')}</span>
                </div>
              </div>
              <div className="wishing-well-page__actions">
                <button
                  type="button"
                  className={`wishing-well-page__wish-btn ${!view.canFreeWish ? 'wishing-well-page__wish-btn--disabled' : ''}`}
                  disabled={!view.canFreeWish}
                  onClick={() => handleWish(false)}
                >
                  {t('ui.wishingWell.wishButton')}
                  <small>{t('ui.wishingWell.freeWish', { remaining: view.freeWishesRemaining, total: 1 })}</small>
                </button>
                <button
                  type="button"
                  className={`wishing-well-page__wish-btn wishing-well-page__wish-btn--paid ${!view.canPaidWish ? 'wishing-well-page__wish-btn--disabled' : ''}`}
                  disabled={!view.canPaidWish}
                  onClick={() => handleWish(true)}
                >
                  <Coins size={16} />
                  {t('ui.wishingWell.paidWish', { cost: view.nextPaidCost })}
                  <small>{view.paidWishesRemaining > 0 ? t('ui.wishingWell.freeWish', { remaining: view.paidWishesRemaining, total: 5 }) : t('ui.wishingWell.paidWishDisabled')}</small>
                </button>
              </div>
            </>
          ) : (
            <div className="wishing-well-page__result" style={{ '--rarity-color': getWishRarityColor(reward.rarity) } as React.CSSProperties}>
              <div className="wishing-well-page__result-icon" aria-hidden="true">
                <Sparkles size={40} />
              </div>
              <h3 className="wishing-well-page__result-title" style={{ color: getWishRarityColor(reward.rarity) }}>
                {rarityLabels[reward.rarity]}
              </h3>
              <p className="wishing-well-page__result-label">{reward.label}</p>
              <div className="wishing-well-page__result-items">
                {reward.coins ? (
                  <span className="wishing-well-page__result-item">
                    <Coins size={16} /> +{reward.coins}
                  </span>
                ) : null}
                {reward.hearts ? (
                  <span className="wishing-well-page__result-item">
                    <Heart size={16} /> +{reward.hearts}
                  </span>
                ) : null}
                {reward.items?.map((item, index) => (
                  <span key={index} className="wishing-well-page__result-item">
                    {item.amount}x {getItemName(item.itemId)}
                  </span>
                ))}
              </div>
              <button type="button" className="primary-button" onClick={handleConfirm}>
                {t('ui.wishingWell.confirm')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="wishing-well-page__stats">
        <h3>{t('ui.wishingWell.stats')}</h3>
        <div className="wishing-well-page__stats-grid">
          <div className="wishing-well-page__stat">
            <span className="wishing-well-page__stat-value">{view.totalWishes}</span>
            <span className="wishing-well-page__stat-label">{t('ui.wishingWell.totalWishes', { count: view.totalWishes })}</span>
          </div>
          <div className="wishing-well-page__stat">
            <span className="wishing-well-page__stat-value" style={{ color: '#ffd54f' }}>{view.legendaryCount}</span>
            <span className="wishing-well-page__stat-label">{t('ui.wishingWell.legendaryCount', { count: view.legendaryCount })}</span>
          </div>
          <div className="wishing-well-page__stat">
            <span className="wishing-well-page__stat-value" style={{ color: '#ff6f00' }}>{view.hiddenCount}</span>
            <span className="wishing-well-page__stat-label">{t('ui.wishingWell.hiddenCount', { count: view.hiddenCount })}</span>
          </div>
          <div className="wishing-well-page__stat">
            <span className="wishing-well-page__stat-value" style={{ color: view.pity >= 100 ? '#ffd54f' : 'var(--text-muted)' }}>
              {view.pity >= 100 ? '★' : `${view.pity}%`}
            </span>
            <span className="wishing-well-page__stat-label">
              {view.pity >= 100 ? t('ui.wishingWell.pityGuaranteed') : t('ui.wishingWell.pityMeter', { pity: view.pity, max: 100 })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};