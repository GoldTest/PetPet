import { ArrowLeft, CheckCircle2, Gift, Lock, Sparkles, Trophy } from 'lucide-react';
import { getAchievementSummary, getAchievementViews, type AchievementCategory, type AchievementId, type AchievementView, type ItemId, type PetState } from '../core/pet';
import { t } from '../i18n';

const baseCategories: readonly ('all' | AchievementCategory)[] = ['all', 'care', 'daily', 'shop', 'inventory', 'pomodoro', 'growth', 'date'];

const labels = {
  aria: t('ui.achievements.aria'),
  back: t('ui.achievements.back'),
  kicker: t('ui.achievements.kicker'),
  title: t('ui.achievements.title'),
  unlocked: t('ui.achievements.unlocked'),
  claimable: t('ui.achievements.claimable'),
  dailyStipend: t('ui.achievements.dailyStipend'),
  claim: t('ui.achievements.claim'),
  dailyStipendAuto: t('ui.achievements.dailyStipendAuto'),
  reviewNotice: t('ui.achievements.reviewNotice'),
  tabsAria: t('ui.achievements.tabsAria'),
  locked: t('ui.achievements.locked'),
  claimed: t('ui.achievements.claimed'),
  active: t('ui.achievements.active'),
  rarity: {
    rare: t('ui.achievements.rarity.rare'),
    hidden: t('ui.achievements.rarity.hidden'),
    normal: t('ui.achievements.rarity.normal'),
  },
  categories: {
    all: t('ui.achievements.categories.all'),
    care: t('ui.achievements.categories.care'),
    daily: t('ui.achievements.categories.daily'),
    shop: t('ui.achievements.categories.shop'),
    inventory: t('ui.achievements.categories.inventory'),
    pomodoro: t('ui.achievements.categories.pomodoro'),
    growth: t('ui.achievements.categories.growth'),
    date: t('ui.achievements.categories.date'),
    hidden: t('ui.achievements.categories.hidden'),
  },
} as const;

const categoryLabel = (category: 'all' | AchievementCategory) => labels.categories[category];
const progressLabel = (progress: number, target: number) => t('ui.achievements.progress', { progress, target });

const formatDateTime = (time?: number) => {
  if (!time) return '';
  return new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const getPrimaryRewardIcon = (achievement: AchievementView, itemIconMap: Partial<Record<ItemId, string>>) => {
  const itemId = achievement.reward.items?.[0]?.itemId;
  return itemId ? itemIconMap[itemId] : undefined;
};

const isAchievementCategory = (category: 'all' | AchievementCategory): category is AchievementCategory => category !== 'all';

export interface AchievementsPageProps {
  pet: PetState;
  activeCategory: 'all' | AchievementCategory;
  itemIconMap: Partial<Record<ItemId, string>>;
  onBack: () => void;
  onCategoryChange: (category: 'all' | AchievementCategory) => void;
  onClaimReward: (id: AchievementId) => void;
}

export const AchievementsPage = ({
  pet,
  activeCategory,
  itemIconMap,
  onBack,
  onCategoryChange,
  onClaimReward,
}: AchievementsPageProps) => {
  const summary = getAchievementSummary(pet);
  const allAchievements = getAchievementViews(pet);
  const hasUnlockedHiddenAchievement = allAchievements.some((achievement) => achievement.rarity === 'hidden' && achievement.unlocked);
  const visibleCategories = hasUnlockedHiddenAchievement ? [...baseCategories, 'hidden' as const] : baseCategories;
  const safeActiveCategory = activeCategory === 'hidden' && !hasUnlockedHiddenAchievement ? 'all' : activeCategory;
  const achievements = allAchievements.filter((achievement) => safeActiveCategory === 'all' || achievement.category === safeActiveCategory);
  const categorySummaries = visibleCategories.filter(isAchievementCategory).map((category) => {
    const categoryAchievements = allAchievements.filter((achievement) => achievement.category === category);
    const unlocked = categoryAchievements.filter((achievement) => achievement.unlocked).length;
    const claimable = categoryAchievements.filter((achievement) => achievement.claimable).length;
    return { category, total: categoryAchievements.length, unlocked, claimable };
  });
  const claimableAchievements = allAchievements.filter((achievement) => achievement.claimable);

  const renderAchievementCard = (achievement: AchievementView) => {
    const percent = achievement.target > 0 ? Math.min(100, (achievement.progressValue / achievement.target) * 100) : 0;
    const rewardIcon = getPrimaryRewardIcon(achievement, itemIconMap);

    return (
      <article className={`achievement-card${achievement.unlocked ? '' : ' achievement-card--locked'}`} key={achievement.id}>
        <div className="achievement-card__icon" aria-hidden="true">
          {achievement.unlocked ? <Trophy size={24} /> : <Lock size={22} />}
        </div>
        <div className="achievement-card__body">
          <div className="achievement-card__topline">
            <h3>{achievement.title}</h3>
            {achievement.rarity !== 'normal' && <span>{labels.rarity[achievement.rarity]}</span>}
          </div>
          <p>{achievement.description}</p>
          <div className="achievement-progress" aria-label={progressLabel(achievement.progressValue, achievement.target)}>
            <span style={{ width: `${percent}%` }} />
          </div>
          <small>{progressLabel(achievement.progressValue, achievement.target)}</small>
          <div className="achievement-card__reward">
            {rewardIcon ? <img src={rewardIcon} alt="" aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
            <span>{achievement.rewardText}</span>
          </div>
        </div>
        <div className="achievement-card__state">
          {achievement.unlockedAt && <span>{formatDateTime(achievement.unlockedAt)}</span>}
          {achievement.claimable ? (
            <button type="button" className="primary-button" onClick={() => onClaimReward(achievement.id)}>{labels.claim}</button>
          ) : achievement.unlocked ? (
            <span className="achievement-card__done"><CheckCircle2 size={16} aria-hidden="true" />{achievement.effectActive ? labels.active : labels.claimed}</span>
          ) : (
            <span>{labels.locked}</span>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="achievements-page" aria-label={labels.aria}>
      <header className="achievements-page__header">
        <button type="button" className="icon-button" aria-label={labels.back} title={labels.back} onClick={onBack}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="achievements-page__title">
          <span>{labels.kicker}</span>
          <h2>{labels.title}</h2>
          <p>{t('ui.achievements.unlockedProgress', { unlocked: summary.unlocked, total: summary.total })}</p>
        </div>
      </header>

      <div className="achievements-overview">
        <div className="achievements-overview__row">
          <div className="achievements-overview__metric">
            <Trophy size={22} aria-hidden="true" />
            <span>{labels.unlocked}</span>
            <strong>{summary.unlocked}/{summary.total}</strong>
          </div>
          <div className="achievements-overview__metric">
            <Gift size={22} aria-hidden="true" />
            <span>{labels.claimable}</span>
            <strong>{summary.claimable}</strong>
          </div>
        </div>
        <div className="achievements-overview__stipend">
          <span>{labels.dailyStipend}</span>
          <strong>{t('ui.achievements.dailyStipendAmount', { coins: summary.dailyStipendCoins })}</strong>
          <small>{labels.dailyStipendAuto}</small>
        </div>
      </div>

      {summary.pendingReviewNotice && <p className="achievements-review-note">{labels.reviewNotice}</p>}

      <div className="achievement-tabs" role="tablist" aria-label={labels.tabsAria}>
        {visibleCategories.map((category) => (
          <button
            type="button"
            role="tab"
            aria-selected={safeActiveCategory === category}
            className="achievement-tab"
            key={category}
            onClick={() => onCategoryChange(category)}
          >
            {categoryLabel(category)}
          </button>
        ))}
      </div>

      {safeActiveCategory === 'all' ? (
        <>
          {claimableAchievements.length > 0 && (
            <section className="achievement-section">
              <h3>{labels.claimable}</h3>
              <div className="achievement-grid achievement-grid--claimable">
                {claimableAchievements.map(renderAchievementCard)}
              </div>
            </section>
          )}

          <section className="achievement-section">
            <h3>{labels.categories.all}</h3>
            <div className="achievement-category-grid">
              {categorySummaries.map(({ category, total, unlocked, claimable }) => {
                const percent = total > 0 ? Math.min(100, (unlocked / total) * 100) : 0;
                return (
                  <button type="button" className="achievement-category-card" key={category} onClick={() => onCategoryChange(category)}>
                    <span>{categoryLabel(category)}</span>
                    <strong>{unlocked}/{total}</strong>
                    <div className="achievement-progress" aria-hidden="true">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    {claimable > 0 && <small>{labels.claimable} {claimable}</small>}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <div className="achievement-grid">
          {achievements.map(renderAchievementCard)}
        </div>
      )}
    </section>
  );
};