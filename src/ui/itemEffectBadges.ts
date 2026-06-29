import type { ItemEffect } from '../core/pet';
import { t } from '../i18n';

export const itemEffectKeys = ['hunger', 'mood', 'cleanliness', 'energy', 'health'] as const;

export type ItemEffectBadge = {
  key: (typeof itemEffectKeys)[number];
  label: string;
};

export const getItemEffectBadges = (effect: ItemEffect): ItemEffectBadge[] =>
  itemEffectKeys
    .map((key) => {
      const value = effect[key];
      if (!value) return undefined;
      const amount = value > 0 ? `+${value}` : String(value);
      return {
        key,
        label: `${t(`ui.stats.${key}`)} ${amount}`,
      };
    })
    .filter((badge): badge is ItemEffectBadge => Boolean(badge));

export const getItemEffectTitle = (summary: string, effect: ItemEffect) => {
  const effectText = getItemEffectBadges(effect).map((badge) => badge.label).join(', ');
  return effectText ? `${summary}\n${effectText}` : summary;
};
