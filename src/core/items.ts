import { t } from '../i18n';
import type { Inventory, ItemId, PetState, ShopCategory, ShopItem } from './petTypes';
import { getLocalDateKey, hashString } from './utils';

export const dailyBiscuitClaimLimit = 3;

export const favoriteFoodIds: readonly ItemId[] = ['pig_trotter', 'strawberry_cake', 'ad_milk'];

export const favoriteFoodIdSet = new Set<ItemId>(favoriteFoodIds);

export const giftItemIds: readonly ItemId[] = ['small_bouquet', 'shiny_sticker', 'soft_cloud_doll', 'ribbon_bell'];

export const giftItemIdSet = new Set<ItemId>(giftItemIds);

export const shopItems: readonly ShopItem[] = [
  {
    id: 'emergency_biscuit',
    name: t('pet.shop.items.emergency_biscuit.name'),
    kind: 'food',
    price: 0,
    effect: { hunger: 14, mood: -1 },
    summary: t('pet.shop.items.emergency_biscuit.summary'),
  },
  {
    id: 'bento',
    name: t('pet.shop.items.bento.name'),
    kind: 'food',
    price: 24,
    effect: { hunger: 34, mood: 5, cleanliness: -3 },
    summary: t('pet.shop.items.bento.summary'),
  },
  {
    id: 'orange',
    name: t('pet.shop.items.orange.name'),
    kind: 'food',
    price: 16,
    effect: { hunger: 18, mood: 2, health: 1 },
    summary: t('pet.shop.items.orange.summary'),
  },
  {
    id: 'apple',
    name: t('pet.shop.items.apple.name'),
    kind: 'food',
    price: 18,
    effect: { hunger: 20, mood: 1, health: 2 },
    summary: t('pet.shop.items.apple.summary'),
  },
  {
    id: 'banana',
    name: t('pet.shop.items.banana.name'),
    kind: 'food',
    price: 20,
    effect: { hunger: 24, mood: 2, energy: 2 },
    summary: t('pet.shop.items.banana.summary'),
  },
  {
    id: 'nutri_meal',
    name: t('pet.shop.items.nutri_meal.name'),
    kind: 'food',
    price: 38,
    effect: { hunger: 30, mood: 3, health: 15 },
    summary: t('pet.shop.items.nutri_meal.summary'),
  },
  {
    id: 'pig_trotter',
    name: t('pet.shop.items.pig_trotter.name'),
    kind: 'food',
    price: 48,
    effect: { hunger: 44, mood: 9, cleanliness: -5, health: 5 },
    summary: t('pet.shop.items.pig_trotter.summary'),
  },
  {
    id: 'strawberry_cake',
    name: t('pet.shop.items.strawberry_cake.name'),
    kind: 'food',
    price: 38,
    effect: { hunger: 24, mood: 14, cleanliness: -3 },
    summary: t('pet.shop.items.strawberry_cake.summary'),
  },
  {
    id: 'ad_milk',
    name: t('pet.shop.items.ad_milk.name'),
    kind: 'food',
    price: 28,
    effect: { hunger: 16, mood: 8, health: 3 },
    summary: t('pet.shop.items.ad_milk.summary'),
  },
  {
    id: 'strawberry_milk',
    name: t('pet.shop.items.strawberry_milk.name'),
    kind: 'food',
    price: 28,
    effect: { hunger: 16, mood: 8, health: 3 },
    summary: t('pet.shop.items.strawberry_milk.summary'),
  },
  {
    id: 'small_bouquet',
    name: t('pet.shop.items.small_bouquet.name'),
    kind: 'item',
    price: 28,
    effect: { mood: 18 },
    summary: t('pet.shop.items.small_bouquet.summary'),
  },
  {
    id: 'shiny_sticker',
    name: t('pet.shop.items.shiny_sticker.name'),
    kind: 'item',
    price: 30,
    effect: { mood: 16 },
    summary: t('pet.shop.items.shiny_sticker.summary'),
  },
  {
    id: 'soft_cloud_doll',
    name: t('pet.shop.items.soft_cloud_doll.name'),
    kind: 'item',
    price: 54,
    effect: { mood: 40, energy: 6 },
    summary: t('pet.shop.items.soft_cloud_doll.summary'),
  },
  {
    id: 'ribbon_bell',
    name: t('pet.shop.items.ribbon_bell.name'),
    kind: 'item',
    price: 34,
    effect: { mood: 24 },
    summary: t('pet.shop.items.ribbon_bell.summary'),
  },
  {
    id: 'toy_ball',
    name: t('pet.shop.items.toy_ball.name'),
    kind: 'item',
    price: 30,
    effect: { mood: 25, energy: -4 },
    summary: t('pet.shop.items.toy_ball.summary'),
  },
  {
    id: 'picture_book',
    name: t('pet.shop.items.picture_book.name'),
    kind: 'item',
    price: 52,
    effect: { mood: 40, energy: 2 },
    summary: t('pet.shop.items.picture_book.summary'),
  },
  {
    id: 'shampoo',
    name: t('pet.shop.items.shampoo.name'),
    kind: 'care',
    price: 28,
    effect: { cleanliness: 50, health: 5 },
    summary: t('pet.shop.items.shampoo.summary'),
  },
  {
    id: 'wet_wipes',
    name: t('pet.shop.items.wet_wipes.name'),
    kind: 'care',
    price: 18,
    effect: { cleanliness: 32, health: 1 },
    summary: t('pet.shop.items.wet_wipes.summary'),
  },
  {
    id: 'medicine',
    name: t('pet.shop.items.medicine.name'),
    kind: 'care',
    price: 42,
    effect: { health: 45, mood: -1 },
    summary: t('pet.shop.items.medicine.summary'),
  },
  {
    id: 'vitamin_tablet',
    name: t('pet.shop.items.vitamin_tablet.name'),
    kind: 'care',
    price: 28,
    effect: { health: 20, mood: 1 },
    summary: t('pet.shop.items.vitamin_tablet.summary'),
  },
  {
    id: 'blanket',
    name: t('pet.shop.items.blanket.name'),
    kind: 'care',
    price: 30,
    effect: { energy: 40, mood: 4 },
    summary: t('pet.shop.items.blanket.summary'),
  },
  {
    id: 'energy_drink',
    name: t('pet.shop.items.energy_drink.name'),
    kind: 'care',
    price: 24,
    effect: { energy: 32, mood: -1 },
    summary: t('pet.shop.items.energy_drink.summary'),
  },
] as const;

export const shopCategories: readonly { id: ShopCategory; label: string }[] = [
  { id: 'food', label: t('pet.shop.categories.food') },
  { id: 'item', label: t('pet.shop.categories.item') },
  { id: 'care', label: t('pet.shop.categories.care') },
];

export const allItemIds = new Set<ItemId>(shopItems.map((item) => item.id));

export const getShopItem = (id: ItemId) => shopItems.find((item) => item.id === id);

export const getInventoryCount = (inventory: Inventory, id: ItemId) => inventory[id] ?? 0;

export const addInventoryItem = (inventory: Inventory, id: ItemId, amount: number): Inventory => ({
  ...inventory,
  [id]: Math.max(0, getInventoryCount(inventory, id) + amount),
});

export const removeInventoryItem = (inventory: Inventory, id: ItemId): Inventory => {
  const count = getInventoryCount(inventory, id);
  if (count <= 1) {
    const next = { ...inventory };
    delete next[id];
    return next;
  }
  return { ...inventory, [id]: count - 1 };
};

const getDailyDiscountPrice = (price: number) => Math.max(1, Math.ceil(price * 0.7));

const getDailyDiscountItem = (now: number) => {
  const eligibleItems = shopItems.filter((item) => item.price > 0 && item.id !== 'emergency_biscuit');
  if (eligibleItems.length === 0) return undefined;

  const dateKey = getLocalDateKey(now);
  return eligibleItems[hashString(dateKey) % eligibleItems.length];
};

export const getDailyShopDiscountInfo = (pet: PetState, now = Date.now()) => {
  const item = getDailyDiscountItem(now);
  const dateKey = getLocalDateKey(now);
  if (!item) return undefined;

  const used = pet.dailyDiscountDate === dateKey && pet.dailyDiscountUsed;

  return {
    dateKey,
    itemId: item.id,
    label: t('pet.shop.discount.label'),
    originalPrice: item.price,
    price: getDailyDiscountPrice(item.price),
    used,
  };
};
