import { t } from '../i18n';
import type { BuiltinItemId } from './petTypes';

export type MerchantId = 'resident' | 'garden' | 'mystery';
export type MarketDistrictId = 'chinese' | 'fantasy' | 'modern';

export interface MerchantCategory {
  id: string;
  labelKey: string;
  itemIds: readonly BuiltinItemId[];
}

export interface MerchantDefinition {
  id: MerchantId;
  nameKey: string;
  titleKey: string;
  dialogueKeys: readonly string[];
  isOpen: boolean;
  categories: readonly MerchantCategory[];
}

export interface MarketDistrictDefinition {
  id: MarketDistrictId;
  nameKey: string;
  subtitleKey: string;
  merchantId: MerchantId;
}

export const merchantIds: readonly MerchantId[] = ['resident', 'garden', 'mystery'];

export const marketDistrictDefinitions: readonly MarketDistrictDefinition[] = [
  {
    id: 'chinese',
    nameKey: 'ui.market.districts.chinese.name',
    subtitleKey: 'ui.market.districts.chinese.subtitle',
    merchantId: 'garden',
  },
  {
    id: 'fantasy',
    nameKey: 'ui.market.districts.fantasy.name',
    subtitleKey: 'ui.market.districts.fantasy.subtitle',
    merchantId: 'mystery',
  },
  {
    id: 'modern',
    nameKey: 'ui.market.districts.modern.name',
    subtitleKey: 'ui.market.districts.modern.subtitle',
    merchantId: 'resident',
  },
];

export const merchantDefinitions: readonly MerchantDefinition[] = [
  {
    id: 'resident',
    nameKey: 'ui.market.merchants.resident.name',
    titleKey: 'ui.market.merchants.resident.title',
    dialogueKeys: [
      'ui.market.dialogues.resident.welcome',
      'ui.market.dialogues.resident.gifts',
      'ui.market.dialogues.resident.food',
      'ui.market.dialogues.resident.farewell',
    ],
    isOpen: true,
    categories: [
      {
        id: 'gifts',
        labelKey: 'ui.market.categories.gifts',
        itemIds: ['small_bouquet', 'shiny_sticker', 'soft_cloud_doll', 'ribbon_bell', 'toy_ball', 'picture_book'],
      },
      {
        id: 'cleaning',
        labelKey: 'ui.market.categories.cleaning',
        itemIds: ['shampoo', 'wet_wipes', 'medicine', 'vitamin_tablet', 'blanket', 'energy_drink'],
      },
      {
        id: 'food',
        labelKey: 'ui.market.categories.food',
        itemIds: ['emergency_biscuit', 'bento', 'orange', 'apple', 'banana', 'strawberry_milk'],
      },
    ],
  },
  {
    id: 'garden',
    nameKey: 'ui.market.merchants.garden.name',
    titleKey: 'ui.market.merchants.garden.title',
    dialogueKeys: [
      'ui.market.dialogues.garden.waiting',
      'ui.market.dialogues.garden.hint',
    ],
    isOpen: false,
    categories: [],
  },
  {
    id: 'mystery',
    nameKey: 'ui.market.merchants.mystery.name',
    titleKey: 'ui.market.merchants.mystery.title',
    dialogueKeys: [
      'ui.market.dialogues.mystery.waiting',
      'ui.market.dialogues.mystery.hint',
    ],
    isOpen: false,
    categories: [],
  },
];

export interface MerchantView {
  id: MerchantId;
  name: string;
  title: string;
  dialogue: string;
  isOpen: boolean;
  categories: readonly MerchantCategory[];
}

export const getMerchantView = (id: MerchantId): MerchantView => {
  const definition = merchantDefinitions.find((merchant) => merchant.id === id) ?? merchantDefinitions[0];
  const dialogueKey = definition.dialogueKeys[Math.floor(Math.random() * definition.dialogueKeys.length)];
  return {
    id: definition.id,
    name: t(definition.nameKey),
    title: t(definition.titleKey),
    dialogue: t(dialogueKey),
    isOpen: definition.isOpen,
    categories: definition.categories,
  };
};

export const getMerchantCategoryLabel = (category: MerchantCategory) => t(category.labelKey);
