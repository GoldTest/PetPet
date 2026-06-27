import { CalendarDays, HandHeart, PackageCheck, Sparkles, Timer, Trophy } from 'lucide-react';
import type { YearReview, YearlyCareActionKey } from '../core/pet';
import { t } from '../i18n';
import { formatCompactNumber } from './numberFormat';

interface YearReviewModalProps {
  review: YearReview;
  onClose: () => void;
}

const getCareActionLabel = (action?: YearlyCareActionKey) =>
  action ? t(`ui.yearReview.actions.${action}`) : t('ui.yearReview.noTopCareAction');

export const YearReviewModal = ({ review, onClose }: YearReviewModalProps) => {
  const metrics = [
    {
      key: 'companionDays',
      icon: CalendarDays,
      label: t('ui.yearReview.companionDays'),
      value: formatCompactNumber(review.companionDays),
    },
    {
      key: 'activeDays',
      icon: Sparkles,
      label: t('ui.yearReview.activeDays'),
      value: formatCompactNumber(review.activeDays),
    },
    {
      key: 'careActions',
      icon: HandHeart,
      label: t('ui.yearReview.careActions'),
      value: formatCompactNumber(review.careActions),
    },
    {
      key: 'itemUseCount',
      icon: PackageCheck,
      label: t('ui.yearReview.itemUseCount'),
      value: formatCompactNumber(review.itemUseCount),
    },
    {
      key: 'pomodoroFocusCount',
      icon: Timer,
      label: t('ui.yearReview.pomodoroFocusCount'),
      value: formatCompactNumber(review.pomodoroFocusCount),
    },
    {
      key: 'topCareAction',
      icon: Trophy,
      label: t('ui.yearReview.topCareAction'),
      value: getCareActionLabel(review.topCareAction),
    },
  ];

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="year-review-modal" role="dialog" aria-modal="true" aria-labelledby="year-review-title">
        <div className="year-review-modal__header">
          <span>{t('ui.yearReview.kicker')}</span>
          <h2 id="year-review-title">{t('ui.yearReview.title', { year: review.year })}</h2>
          <p>{t('ui.yearReview.message', { year: review.year })}</p>
        </div>
        <div className="year-review-modal__grid">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div className="year-review-modal__metric" key={metric.key}>
                <Icon size={20} aria-hidden="true" />
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            );
          })}
        </div>
        <button type="button" className="primary-button" onClick={onClose}>
          {t('ui.yearReview.confirm')}
        </button>
      </section>
    </div>
  );
};
