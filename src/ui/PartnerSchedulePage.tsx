import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChefHat,
  Clock3,
  Coins,
  Dumbbell,
  Sparkles,
  Sprout,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  getPartnerScheduleClaimPreview,
  getPartnerScheduleCoinReward,
  getPartnerScheduleDefinition,
  getPartnerScheduleProgress,
  getPartnerScheduleSkillXpReward,
  getPartnerScheduleSkillXpNeeded,
  getPartnerScheduleStartCheck,
  type ItemId,
  type PartnerScheduleCategory,
  type PartnerScheduleRewardChoice,
  type PetState,
} from '../core/pet';
import { t } from '../i18n';

const categoryIcons: Record<PartnerScheduleCategory, LucideIcon> = {
  study: BookOpen,
  cooking: ChefHat,
  garden: Sprout,
  exercise: Dumbbell,
};

const categories: readonly PartnerScheduleCategory[] = ['study', 'cooking', 'garden', 'exercise'];

const formatDuration = (milliseconds: number) => {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  if (totalMinutes < 60) return t('ui.time.minutes', { minutes: totalMinutes });
  return t('ui.time.hoursMinutes', { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 });
};

interface PartnerSchedulePageProps {
  pet: PetState;
  itemIconMap: Partial<Record<ItemId, string>>;
  onBack: () => void;
  onStart: (offerId: string) => void;
  onCancel: () => void;
  onClaim: (choice: PartnerScheduleRewardChoice) => void;
}

export const PartnerSchedulePage = ({
  pet,
  itemIconMap,
  onBack,
  onStart,
  onCancel,
  onClaim,
}: PartnerSchedulePageProps) => {
  const schedule = pet.partnerSchedule;
  const active = schedule.active;
  const pendingResult = schedule.pendingResult;
  const activeDefinition = active ? getPartnerScheduleDefinition(active.templateId) : undefined;
  const activeProgress = active ? getPartnerScheduleProgress(active) : undefined;
  const resultDefinition = pendingResult ? getPartnerScheduleDefinition(pendingResult.templateId) : undefined;
  const coinClaim = pendingResult ? getPartnerScheduleClaimPreview(pendingResult, 'coins') : undefined;
  const categoryClaim = pendingResult ? getPartnerScheduleClaimPreview(pendingResult, 'category') : undefined;

  return (
    <section className="partner-schedule-page" aria-label={t('ui.partnerSchedule.aria')}>
      <header className="partner-schedule-page__header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={t('ui.partnerSchedule.back')} title={t('ui.partnerSchedule.back')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <span>{t('ui.partnerSchedule.kicker')}</span>
          <h2>{t('ui.partnerSchedule.title')}</h2>
          <p>{t('ui.partnerSchedule.summary')}</p>
        </div>
      </header>

      <div className="partner-schedule-skills" aria-label={t('ui.partnerSchedule.skillsAria')}>
        {categories.map((category) => {
          const Icon = categoryIcons[category];
          const skill = schedule.skills[category];
          const needed = getPartnerScheduleSkillXpNeeded(skill.level);
          const percent = needed > 0 ? Math.min(100, (skill.xp / needed) * 100) : 100;
          return (
            <div className={`partner-schedule-skill partner-schedule-skill--${category}`} key={category}>
              <Icon size={19} aria-hidden="true" />
              <span><strong>{t(`ui.partnerSchedule.categories.${category}`)}</strong><small>{t('ui.partnerSchedule.skillLevel', { level: skill.level })}</small></span>
              <i aria-hidden="true"><b style={{ width: `${percent}%` }} /></i>
            </div>
          );
        })}
      </div>

      {pendingResult && resultDefinition ? (
        <section className="partner-schedule-result" aria-label={t('ui.partnerSchedule.resultAria')}>
          <span className={`partner-schedule-category-icon partner-schedule-category-icon--${pendingResult.category}`}>
            {(() => { const Icon = categoryIcons[pendingResult.category]; return <Icon size={25} aria-hidden="true" />; })()}
          </span>
          <div className="partner-schedule-result__copy">
            <span>{t('ui.partnerSchedule.resultKicker')}</span>
            <h3>{t(`ui.partnerSchedule.activities.${resultDefinition.id}.title`)}</h3>
            <p>{t('ui.partnerSchedule.resultSummary')}</p>
          </div>
          <div className="partner-schedule-result__actions">
            <button type="button" className="primary-button" onClick={() => onClaim('coins')}>
              <Coins size={18} aria-hidden="true" />
              <span>{t('ui.partnerSchedule.claimCoins', { coins: coinClaim?.coins ?? 0 })}<small>{t('ui.partnerSchedule.claimXp', { xp: coinClaim?.skillXp ?? 0 })}</small></span>
            </button>
            {pendingResult.size !== 'short' ? (
              <button type="button" className="secondary-button" onClick={() => onClaim('category')}>
                {categoryClaim?.itemId && itemIconMap[categoryClaim.itemId] ? <img src={itemIconMap[categoryClaim.itemId]} alt="" aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
                <span>{t(`ui.partnerSchedule.categoryRewards.${pendingResult.category}`, { coins: categoryClaim?.coins ?? 0 })}<small>{t('ui.partnerSchedule.claimXp', { xp: categoryClaim?.skillXp ?? 0 })}</small></span>
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {active && activeDefinition && activeProgress ? (
        <section className={`partner-schedule-active partner-schedule-active--${active.category}`} aria-label={t('ui.partnerSchedule.activeAria')}>
          <span className={`partner-schedule-category-icon partner-schedule-category-icon--${active.category}`}>
            {(() => { const Icon = categoryIcons[active.category]; return <Icon size={25} aria-hidden="true" />; })()}
          </span>
          <div className="partner-schedule-active__main">
            <span>{t('ui.partnerSchedule.activeKicker')}</span>
            <h3>{t(`ui.partnerSchedule.activities.${activeDefinition.id}.title`)}</h3>
            <p>{t('ui.partnerSchedule.remaining', { time: formatDuration(activeProgress.remainingMs) })}</p>
            <div className="partner-schedule-progress" aria-label={t('ui.partnerSchedule.progress', { percent: Math.round(activeProgress.percent) })}>
              <i style={{ width: `${activeProgress.percent}%` }} />
            </div>
          </div>
          <div className="partner-schedule-active__reward">
            <Coins size={18} aria-hidden="true" />
            <strong>+{active.coinReward}</strong>
          </div>
          <button type="button" className="icon-button partner-schedule-cancel" onClick={onCancel} aria-label={t('ui.partnerSchedule.cancel')} title={t('ui.partnerSchedule.cancel')}>
            <X size={20} aria-hidden="true" />
          </button>
        </section>
      ) : null}

      <div className="partner-schedule-section-heading">
        <div><span>{t('ui.partnerSchedule.todayKicker')}</span><h3>{t('ui.partnerSchedule.todayTitle')}</h3></div>
        <small>{t('ui.partnerSchedule.dailyCount', { count: schedule.completedOfferIds.length, total: schedule.offers.length })}</small>
      </div>

      <div className="partner-schedule-list">
        {schedule.offers.map((offer) => {
          const definition = getPartnerScheduleDefinition(offer.templateId);
          if (!definition) return null;
          const Icon = categoryIcons[definition.category];
          const completed = schedule.completedOfferIds.includes(offer.id);
          const startCheck = getPartnerScheduleStartCheck(pet, offer.id);
          const disabled = completed || !startCheck.canStart;
          const reward = getPartnerScheduleCoinReward(pet, definition.size);
          const durationMinutes = definition.durationMinutes;
          return (
            <article className={`partner-schedule-item partner-schedule-item--${definition.category}${completed ? ' partner-schedule-item--completed' : ''}`} key={offer.id}>
              <div className="partner-schedule-item__heading">
                <span className={`partner-schedule-category-icon partner-schedule-category-icon--${definition.category}`}><Icon size={23} aria-hidden="true" /></span>
                <div>
                  <span>{t(`ui.partnerSchedule.sizes.${definition.size}`)} · {t(`ui.partnerSchedule.categories.${definition.category}`)}</span>
                  <h3>{t(`ui.partnerSchedule.activities.${definition.id}.title`)}</h3>
                  <p>{t(`ui.partnerSchedule.activities.${definition.id}.summary`)}</p>
                </div>
                {completed ? <CheckCircle2 className="partner-schedule-item__complete" size={24} aria-label={t('ui.partnerSchedule.completed')} /> : null}
              </div>

              <div className="partner-schedule-costs">
                <span>{t('ui.partnerSchedule.cost.energy', { amount: definition.energyCost })}</span>
                <span>{t('ui.partnerSchedule.cost.hunger', { amount: definition.hungerCost })}</span>
                <span>{t('ui.partnerSchedule.cost.mood', { amount: definition.moodCost })}</span>
              </div>

              <footer className="partner-schedule-item__footer">
                <span><Clock3 size={16} aria-hidden="true" />{formatDuration(durationMinutes * 60000)}</span>
                <strong>
                  <Coins size={17} aria-hidden="true" />
                  {t('ui.partnerSchedule.rewardPreview', { coins: reward, xp: getPartnerScheduleSkillXpReward(definition.size) })}
                </strong>
                <button type="button" className="primary-button" disabled={disabled} onClick={() => onStart(offer.id)}>
                  {completed ? t('ui.partnerSchedule.completed') : startCheck.canStart ? t('ui.partnerSchedule.start') : t(`ui.partnerSchedule.blocked.${startCheck.reason ?? 'missing'}`)}
                </button>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
};
