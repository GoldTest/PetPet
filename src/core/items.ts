import { t } from '../i18n';
import type { ActivePetMod, PetModCustomItem, PetModItemOverride } from './mod';
import type { BuiltinItemId, Inventory, InventoryItemDefinition, ItemDefinition, ItemId, ItemRegistry, PetState, ShopCategory, ShopItem } from './petTypes';
import { getLocalDateKey, hashString } from './utils';

export const dailyBiscuitClaimLimit = 3;
export const dailyWitheredFragmentLimit = 2;

export const heartExchangeCoins = 16;

export const dailyHeartExchangeLimit = 3;

export const heartExchangeCooldownMs = 200;

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
    effect: { hunger: 30 },
    summary: t('pet.shop.items.bento.summary'),
  },
  {
    id: 'orange',
    name: t('pet.shop.items.orange.name'),
    kind: 'food',
    price: 16,
    effect: { hunger: 18, mood: 1, health: 1 },
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
    effect: { hunger: 24, mood: 1, energy: 2 },
    summary: t('pet.shop.items.banana.summary'),
  },
  {
    id: 'watermelon',
    name: t('pet.shop.items.watermelon.name'),
    kind: 'food',
    price: 26,
    effect: { hunger: 28, mood: 2, cleanliness: -2 },
    summary: t('pet.shop.items.watermelon.summary'),
  },
  {
    id: 'nutri_meal',
    name: t('pet.shop.items.nutri_meal.name'),
    kind: 'food',
    price: 36,
    effect: { hunger: 30, mood: 2, health: 15 },
    summary: t('pet.shop.items.nutri_meal.summary'),
  },
  {
    id: 'pig_trotter',
    name: t('pet.shop.items.pig_trotter.name'),
    kind: 'food',
    price: 48,
    effect: { hunger: 44, mood: 6, cleanliness: -5, health: 5 },
    summary: t('pet.shop.items.pig_trotter.summary'),
  },
  {
    id: 'strawberry_cake',
    name: t('pet.shop.items.strawberry_cake.name'),
    kind: 'food',
    price: 30,
    effect: { hunger: 28, mood: 8, cleanliness: -3 },
    summary: t('pet.shop.items.strawberry_cake.summary'),
  },
  {
    id: 'ad_milk',
    name: t('pet.shop.items.ad_milk.name'),
    kind: 'food',
    price: 24,
    effect: { hunger: 22, mood: 5, health: 6 },
    summary: t('pet.shop.items.ad_milk.summary'),
  },
  {
    id: 'strawberry_milk',
    name: t('pet.shop.items.strawberry_milk.name'),
    kind: 'food',
    price: 22,
    effect: { hunger: 20, mood: 5, health: 3 },
    summary: t('pet.shop.items.strawberry_milk.summary'),
  },
  {
    id: 'small_bouquet',
    name: t('pet.shop.items.small_bouquet.name'),
    kind: 'item',
    price: 18,
    effect: { mood: 16 },
    summary: t('pet.shop.items.small_bouquet.summary'),
  },
  {
    id: 'shiny_sticker',
    name: t('pet.shop.items.shiny_sticker.name'),
    kind: 'item',
    price: 24,
    effect: { mood: 20 },
    summary: t('pet.shop.items.shiny_sticker.summary'),
  },
  {
    id: 'soft_cloud_doll',
    name: t('pet.shop.items.soft_cloud_doll.name'),
    kind: 'item',
    price: 56,
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
    price: 20,
    effect: { cleanliness: 50, health: 5 },
    summary: t('pet.shop.items.shampoo.summary'),
  },
  {
    id: 'wet_wipes',
    name: t('pet.shop.items.wet_wipes.name'),
    kind: 'care',
    price: 10,
    effect: { cleanliness: 32, health: 1 },
    summary: t('pet.shop.items.wet_wipes.summary'),
  },
  {
    id: 'medicine',
    name: t('pet.shop.items.medicine.name'),
    kind: 'care',
    price: 34,
    effect: { health: 45, mood: -5 },
    summary: t('pet.shop.items.medicine.summary'),
  },
  {
    id: 'vitamin_tablet',
    name: t('pet.shop.items.vitamin_tablet.name'),
    kind: 'care',
    price: 20,
    effect: { health: 20, mood: 1 },
    summary: t('pet.shop.items.vitamin_tablet.summary'),
  },
  {
    id: 'blanket',
    name: t('pet.shop.items.blanket.name'),
    kind: 'care',
    price: 42,
    effect: { energy: 36, mood: 4 },
    summary: t('pet.shop.items.blanket.summary'),
  },
  {
    id: 'energy_drink',
    name: t('pet.shop.items.energy_drink.name'),
    kind: 'care',
    price: 36,
    effect: { energy: 30, mood: -1 },
    summary: t('pet.shop.items.energy_drink.summary'),
  },
  {
    id: 'poplar_tree_sapling',
    name: t('pet.shop.items.poplar_tree_sapling.name'),
    kind: 'garden',
    price: 10,
    effect: {},
    summary: t('pet.shop.items.poplar_tree_sapling.summary'),
    tags: ['garden', 'sapling'],
    usable: false,
  },
  {
    id: 'fruit_tree_sapling',
    name: t('pet.shop.items.fruit_tree_sapling.name'),
    kind: 'garden',
    price: 30,
    effect: {},
    summary: t('pet.shop.items.fruit_tree_sapling.summary'),
    tags: ['garden', 'sapling'],
    usable: false,
  },
  {
    id: 'herb_tree_sapling',
    name: t('pet.shop.items.herb_tree_sapling.name'),
    kind: 'garden',
    price: 600,
    effect: {},
    summary: t('pet.shop.items.herb_tree_sapling.summary'),
    tags: ['garden', 'sapling'],
    usable: false,
  },
  {
    id: 'money_tree_sapling',
    name: t('pet.shop.items.money_tree_sapling.name'),
    kind: 'garden',
    price: 3000,
    effect: {},
    summary: t('pet.shop.items.money_tree_sapling.summary'),
    tags: ['garden', 'sapling'],
    usable: false,
  },
  {
    id: 'normal_fertilizer',
    name: t('pet.shop.items.normal_fertilizer.name'),
    kind: 'garden',
    price: 300,
    effect: {},
    summary: t('pet.shop.items.normal_fertilizer.summary'),
    tags: ['garden', 'fertilizer'],
    usable: false,
  },
  {
    id: 'heart_fertilizer',
    name: t('pet.shop.items.heart_fertilizer.name'),
    kind: 'garden',
    price: 900,
    effect: {},
    summary: t('pet.shop.items.heart_fertilizer.summary'),
    tags: ['garden', 'fertilizer'],
    usable: false,
  },
  {
    id: 'harvest_nutrient',
    name: t('pet.shop.items.harvest_nutrient.name'),
    kind: 'garden',
    price: 300,
    effect: {},
    summary: t('pet.shop.items.harvest_nutrient.summary'),
    tags: ['garden', 'nutrient'],
    usable: false,
  },
  {
    id: 'tomato_seed',
    name: t('pet.shop.items.tomato_seed.name'),
    kind: 'garden',
    price: 90,
    effect: {},
    summary: t('pet.shop.items.tomato_seed.summary'),
    tags: ['garden', 'vegetable_seed'],
    usable: false,
    packSize: 9,
  },
  {
    id: 'carrot_seed',
    name: t('pet.shop.items.carrot_seed.name'),
    kind: 'garden',
    price: 90,
    effect: {},
    summary: t('pet.shop.items.carrot_seed.summary'),
    tags: ['garden', 'vegetable_seed'],
    usable: false,
    packSize: 9,
  },
  {
    id: 'cabbage_seed',
    name: t('pet.shop.items.cabbage_seed.name'),
    kind: 'garden',
    price: 90,
    effect: {},
    summary: t('pet.shop.items.cabbage_seed.summary'),
    tags: ['garden', 'vegetable_seed'],
    usable: false,
    packSize: 9,
  },
  {
    id: 'onion_seed',
    name: t('pet.shop.items.onion_seed.name'),
    kind: 'garden',
    price: 90,
    effect: {},
    summary: t('pet.shop.items.onion_seed.summary'),
    tags: ['garden', 'vegetable_seed'],
    usable: false,
    packSize: 9,
  },
  {
    id: 'potato_seed',
    name: t('pet.shop.items.potato_seed.name'),
    kind: 'garden',
    price: 90,
    effect: {},
    summary: t('pet.shop.items.potato_seed.summary'),
    tags: ['garden', 'vegetable_seed'],
    usable: false,
    packSize: 9,
  },
  {
    id: 'chili_seed',
    name: t('pet.shop.items.chili_seed.name'),
    kind: 'garden',
    price: 90,
    effect: {},
    summary: t('pet.shop.items.chili_seed.summary'),
    tags: ['garden', 'vegetable_seed'],
    usable: false,
    packSize: 9,
  },
  {
    id: 'tomato',
    name: t('pet.shop.items.tomato.name'),
    kind: 'food',
    price: 12,
    effect: { hunger: 14, mood: 1, health: 2 },
    summary: t('pet.shop.items.tomato.summary'),
  },
  {
    id: 'carrot',
    name: t('pet.shop.items.carrot.name'),
    kind: 'food',
    price: 14,
    effect: { hunger: 16, mood: 1, health: 3 },
    summary: t('pet.shop.items.carrot.summary'),
  },
  {
    id: 'cabbage',
    name: t('pet.shop.items.cabbage.name'),
    kind: 'food',
    price: 16,
    effect: { hunger: 20, mood: 1 },
    summary: t('pet.shop.items.cabbage.summary'),
  },
  {
    id: 'onion',
    name: t('pet.shop.items.onion.name'),
    kind: 'food',
    price: 14,
    effect: { hunger: 18, mood: 1, health: 1 },
    summary: t('pet.shop.items.onion.summary'),
  },
  {
    id: 'potato',
    name: t('pet.shop.items.potato.name'),
    kind: 'food',
    price: 18,
    effect: { hunger: 22, mood: 1, energy: 2 },
    summary: t('pet.shop.items.potato.summary'),
  },
  {
    id: 'chili',
    name: t('pet.shop.items.chili.name'),
    kind: 'food',
    price: 16,
    effect: { hunger: 16, mood: 3, health: -1 },
    summary: t('pet.shop.items.chili.summary'),
  },
] as const;

export const specialItems: readonly ShopItem[] = [
  {
    id: 'birthday_cake',
    name: t('pet.shop.items.birthday_cake.name'),
    kind: 'food',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.birthday_cake.summary'),
  },
  {
    id: 'golden_apple',
    name: t('pet.shop.items.golden_apple.name'),
    kind: 'food',
    price: 0,
    effect: { hunger: 30, mood: 30, cleanliness: 30, energy: 30, health: 30 },
    summary: t('pet.shop.items.golden_apple.summary'),
  },
  {
    id: 'withered_fragment',
    name: t('pet.shop.items.withered_fragment.name'),
    kind: 'garden',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.withered_fragment.summary'),
    tags: ['garden', 'compost'],
    usable: false,
  },
  {
    id: 'wood_plank',
    name: t('pet.shop.items.wood_plank.name'),
    kind: 'garden',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.wood_plank.summary'),
    tags: ['garden', 'material'],
    usable: false,
  },
  {
    id: 'wish_fragment',
    name: t('pet.shop.items.wish_fragment.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.wish_fragment.summary'),
    tags: ['material', 'unlock'],
    usable: false,
  },
  {
    id: 'garden_token',
    name: t('pet.shop.items.garden_token.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.garden_token.summary'),
    tags: ['material', 'garden'],
    usable: false,
  },
  {
    id: 'exp_potion',
    name: t('pet.shop.items.exp_potion.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.exp_potion.summary'),
    tags: ['material', 'growth'],
    usable: true,
  },
  {
    id: 'energy_concentrate',
    name: t('pet.shop.items.energy_concentrate.name'),
    kind: 'item',
    price: 0,
    effect: { energy: 25 },
    summary: t('pet.shop.items.energy_concentrate.summary'),
    tags: ['material', 'growth'],
    usable: true,
  },
  {
    id: 'skill_fruit',
    name: t('pet.shop.items.skill_fruit.name'),
    kind: 'item',
    price: 0,
    effect: { hunger: 5, mood: 5, cleanliness: 5, energy: 5, health: 5 },
    summary: t('pet.shop.items.skill_fruit.summary'),
    tags: ['material', 'growth'],
    usable: true,
  },
  {
    id: 'golden_apple_tree_sapling',
    name: t('pet.shop.items.golden_apple_tree_sapling.name'),
    kind: 'garden',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.golden_apple_tree_sapling.summary'),
    tags: ['garden', 'sapling'],
    usable: false,
  },
  {
    id: 'world_anchor_chinese',
    name: t('pet.shop.items.world_anchor_chinese.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.world_anchor_chinese.summary'),
    tags: ['multiverse', 'anchor'],
    usable: false,
  },
  {
    id: 'world_anchor_fantasy',
    name: t('pet.shop.items.world_anchor_fantasy.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.world_anchor_fantasy.summary'),
    tags: ['multiverse', 'anchor'],
    usable: false,
  },
  {
    id: 'world_anchor_modern',
    name: t('pet.shop.items.world_anchor_modern.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.world_anchor_modern.summary'),
    tags: ['multiverse', 'anchor'],
    usable: false,
  },
  {
    id: 'lucky_charm',
    name: t('pet.shop.items.lucky_charm.name'),
    kind: 'item',
    price: 0,
    effect: { mood: 10 },
    summary: t('pet.shop.items.lucky_charm.summary'),
    tags: ['material', 'wishing_well'],
    usable: true,
  },
  {
    id: 'star_shard',
    name: t('pet.shop.items.star_shard.name'),
    kind: 'item',
    price: 0,
    effect: { mood: 20, energy: 10, health: 10 },
    summary: t('pet.shop.items.star_shard.summary'),
    tags: ['material', 'wishing_well'],
    usable: true,
  },
  {
    id: 'wishing_well_coin',
    name: t('pet.shop.items.wishing_well_coin.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.wishing_well_coin.summary'),
    tags: ['material', 'wishing_well', 'special'],
    usable: false,
  },
  // Fishing fish
  {
    id: 'crucian_carp',
    name: t('pet.shop.items.crucian_carp.name'),
    kind: 'food',
    price: 8,
    effect: { hunger: 12, mood: 1, health: 1 },
    summary: t('pet.shop.items.crucian_carp.summary'),
    tags: ['fishing', 'fish'],
  },
  {
    id: 'grass_carp',
    name: t('pet.shop.items.grass_carp.name'),
    kind: 'food',
    price: 9,
    effect: { hunger: 14, mood: 1, health: 1 },
    summary: t('pet.shop.items.grass_carp.summary'),
    tags: ['fishing', 'fish'],
  },
  {
    id: 'silver_carp',
    name: t('pet.shop.items.silver_carp.name'),
    kind: 'food',
    price: 10,
    effect: { hunger: 13, mood: 1, health: 2 },
    summary: t('pet.shop.items.silver_carp.summary'),
    tags: ['fishing', 'fish'],
  },
  {
    id: 'common_carp',
    name: t('pet.shop.items.common_carp.name'),
    kind: 'food',
    price: 11,
    effect: { hunger: 15, mood: 1, health: 1 },
    summary: t('pet.shop.items.common_carp.summary'),
    tags: ['fishing', 'fish'],
  },
  {
    id: 'catfish',
    name: t('pet.shop.items.catfish.name'),
    kind: 'food',
    price: 9,
    effect: { hunger: 16, mood: -1, health: 1 },
    summary: t('pet.shop.items.catfish.summary'),
    tags: ['fishing', 'fish'],
  },
  {
    id: 'shrimp',
    name: t('pet.shop.items.shrimp.name'),
    kind: 'food',
    price: 12,
    effect: { hunger: 10, mood: 2 },
    summary: t('pet.shop.items.shrimp.summary'),
    tags: ['fishing', 'fish'],
  },
  {
    id: 'crab',
    name: t('pet.shop.items.crab.name'),
    kind: 'food',
    price: 14,
    effect: { hunger: 11, mood: 1, health: 2 },
    summary: t('pet.shop.items.crab.summary'),
    tags: ['fishing', 'fish'],
  },
  {
    id: 'perch',
    name: t('pet.shop.items.perch.name'),
    kind: 'food',
    price: 22,
    effect: { hunger: 16, mood: 2, health: 2 },
    summary: t('pet.shop.items.perch.summary'),
    tags: ['fishing', 'fish', 'rare'],
  },
  {
    id: 'bream',
    name: t('pet.shop.items.bream.name'),
    kind: 'food',
    price: 24,
    effect: { hunger: 18, mood: 2, health: 2 },
    summary: t('pet.shop.items.bream.summary'),
    tags: ['fishing', 'fish', 'rare'],
  },
  {
    id: 'yellow_jacket',
    name: t('pet.shop.items.yellow_jacket.name'),
    kind: 'food',
    price: 28,
    effect: { hunger: 15, mood: 2, health: 2 },
    summary: t('pet.shop.items.yellow_jacket.summary'),
    tags: ['fishing', 'fish', 'rare'],
  },
  {
    id: 'trout',
    name: t('pet.shop.items.trout.name'),
    kind: 'food',
    price: 32,
    effect: { hunger: 17, mood: 3, health: 3 },
    summary: t('pet.shop.items.trout.summary'),
    tags: ['fishing', 'fish', 'rare'],
  },
  {
    id: 'salmon',
    name: t('pet.shop.items.salmon.name'),
    kind: 'food',
    price: 36,
    effect: { hunger: 18, mood: 3, health: 3 },
    summary: t('pet.shop.items.salmon.summary'),
    tags: ['fishing', 'fish', 'rare'],
  },
  {
    id: 'octopus',
    name: t('pet.shop.items.octopus.name'),
    kind: 'food',
    price: 52,
    effect: { hunger: 20, mood: 4, health: 3, energy: 1 },
    summary: t('pet.shop.items.octopus.summary'),
    tags: ['fishing', 'fish', 'epic'],
  },
  {
    id: 'squid',
    name: t('pet.shop.items.squid.name'),
    kind: 'food',
    price: 48,
    effect: { hunger: 18, mood: 3, health: 2 },
    summary: t('pet.shop.items.squid.summary'),
    tags: ['fishing', 'fish', 'epic'],
  },
  {
    id: 'tuna',
    name: t('pet.shop.items.tuna.name'),
    kind: 'food',
    price: 56,
    effect: { hunger: 22, mood: 4, health: 4 },
    summary: t('pet.shop.items.tuna.summary'),
    tags: ['fishing', 'fish', 'epic'],
  },
  {
    id: 'marlin',
    name: t('pet.shop.items.marlin.name'),
    kind: 'food',
    price: 64,
    effect: { hunger: 24, mood: 4, health: 4, energy: 1 },
    summary: t('pet.shop.items.marlin.summary'),
    tags: ['fishing', 'fish', 'epic'],
  },
  {
    id: 'ancient_koi',
    name: t('pet.shop.items.ancient_koi.name'),
    kind: 'food',
    price: 120,
    effect: { hunger: 24, mood: 6, health: 4, energy: 2, cleanliness: 1 },
    summary: t('pet.shop.items.ancient_koi.summary'),
    tags: ['fishing', 'fish', 'legend', 'collectible'],
  },
  {
    id: 'star_koi',
    name: t('pet.shop.items.star_koi.name'),
    kind: 'food',
    price: 150,
    effect: { hunger: 26, mood: 7, health: 5, energy: 3, cleanliness: 1 },
    summary: t('pet.shop.items.star_koi.summary'),
    tags: ['fishing', 'fish', 'legend', 'collectible'],
  },
  {
    id: 'mythical_fish',
    name: t('pet.shop.items.mythical_fish.name'),
    kind: 'food',
    price: 200,
    effect: { hunger: 30, mood: 10, health: 8, energy: 4, cleanliness: 2 },
    summary: t('pet.shop.items.mythical_fish.summary'),
    tags: ['fishing', 'fish', 'legend', 'collectible'],
  },
  // Fishing materials
  {
    id: 'fish_bone',
    name: t('pet.shop.items.fish_bone.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.fish_bone.summary'),
    tags: ['fishing', 'material'],
    usable: false,
  },
  {
    id: 'seashell',
    name: t('pet.shop.items.seashell.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.seashell.summary'),
    tags: ['fishing', 'material'],
    usable: false,
  },
  {
    id: 'pearl',
    name: t('pet.shop.items.pearl.name'),
    kind: 'item',
    price: 0,
    effect: { mood: 5 },
    summary: t('pet.shop.items.pearl.summary'),
    tags: ['fishing', 'material', 'special'],
    usable: true,
  },
  {
    id: 'fish_roe',
    name: t('pet.shop.items.fish_roe.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.fish_roe.summary'),
    tags: ['fishing', 'material'],
    usable: false,
  },
  // Fishing bait
  {
    id: 'worm',
    name: t('pet.shop.items.worm.name'),
    kind: 'item',
    price: 2,
    effect: {},
    summary: t('pet.shop.items.worm.summary'),
    tags: ['fishing', 'bait'],
    usable: false,
    packSize: 9,
  },
  {
    id: 'rice_ball',
    name: t('pet.shop.items.rice_ball.name'),
    kind: 'food',
    price: 6,
    effect: { hunger: 8, mood: 1 },
    summary: t('pet.shop.items.rice_ball.summary'),
    tags: ['fishing', 'bait'],
    packSize: 9,
  },
  {
    id: 'insect_bait',
    name: t('pet.shop.items.insect_bait.name'),
    kind: 'item',
    price: 12,
    effect: {},
    summary: t('pet.shop.items.insect_bait.summary'),
    tags: ['fishing', 'bait', 'rare'],
    usable: false,
  },
  {
    id: 'glow_bait',
    name: t('pet.shop.items.glow_bait.name'),
    kind: 'item',
    price: 24,
    effect: {},
    summary: t('pet.shop.items.glow_bait.summary'),
    tags: ['fishing', 'bait', 'epic'],
    usable: false,
  },
  {
    id: 'magic_bait',
    name: t('pet.shop.items.magic_bait.name'),
    kind: 'item',
    price: 50,
    effect: {},
    summary: t('pet.shop.items.magic_bait.summary'),
    tags: ['fishing', 'bait', 'legend'],
    usable: false,
  },
  // Fishing rods
  {
    id: 'bamboo_rod',
    name: t('pet.shop.items.bamboo_rod.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.bamboo_rod.summary'),
    tags: ['fishing', 'rod'],
    usable: false,
  },
  {
    id: 'iron_rod',
    name: t('pet.shop.items.iron_rod.name'),
    kind: 'item',
    price: 200,
    effect: {},
    summary: t('pet.shop.items.iron_rod.summary'),
    tags: ['fishing', 'rod'],
    usable: false,
  },
  {
    id: 'fiber_rod',
    name: t('pet.shop.items.fiber_rod.name'),
    kind: 'item',
    price: 500,
    effect: {},
    summary: t('pet.shop.items.fiber_rod.summary'),
    tags: ['fishing', 'rod'],
    usable: false,
  },
  {
    id: 'carbon_rod',
    name: t('pet.shop.items.carbon_rod.name'),
    kind: 'item',
    price: 1200,
    effect: {},
    summary: t('pet.shop.items.carbon_rod.summary'),
    tags: ['fishing', 'rod'],
    usable: false,
  },
  {
    id: 'titanium_rod',
    name: t('pet.shop.items.titanium_rod.name'),
    kind: 'item',
    price: 3000,
    effect: {},
    summary: t('pet.shop.items.titanium_rod.summary'),
    tags: ['fishing', 'rod'],
    usable: false,
  },
  {
    id: 'sea_god_rod',
    name: t('pet.shop.items.sea_god_rod.name'),
    kind: 'item',
    price: 0,
    effect: {},
    summary: t('pet.shop.items.sea_god_rod.summary'),
    tags: ['fishing', 'rod', 'legend'],
    usable: false,
  },
  {
    id: 'fishing_token',
    name: t('pet.shop.items.fishing_token.name'),
    kind: 'item',
    price: 0,
    effect: { mood: 3, energy: 1 },
    summary: t('pet.shop.items.fishing_token.summary'),
    tags: ['fishing', 'material'],
    usable: true,
  },
] as const;

export const inventoryItems: readonly ShopItem[] = [...shopItems, ...specialItems];

export const shopCategories: readonly { id: ShopCategory; label: string }[] = [
  { id: 'food', label: t('pet.shop.categories.food') },
  { id: 'item', label: t('pet.shop.categories.item') },
  { id: 'care', label: t('pet.shop.categories.care') },
  { id: 'garden', label: t('pet.shop.categories.garden') },
];

export const allItemIds = new Set<string>(inventoryItems.map((item) => item.id));

export const builtinItemIds = Array.from(allItemIds);

export const isBuiltinItemId = (id: string): id is BuiltinItemId => allItemIds.has(id);

export const getShopItem = (id: ItemId) => (isBuiltinItemId(id) ? shopItems.find((item) => item.id === id) : undefined);

export const getInventoryItem = (id: ItemId) => (isBuiltinItemId(id) ? inventoryItems.find((item) => item.id === id) : undefined);

const toItemDefinition = (item: ShopItem, imageUrl?: string): ItemDefinition => ({
  ...item,
  imageUrl,
  source: 'builtin',
  shop: shopItems.some((shopItem) => shopItem.id === item.id),
  tags: item.tags ?? [],
  usable: item.usable ?? true,
});

const applyItemOverride = (item: ItemDefinition, override: PetModItemOverride | undefined, imageUrl?: string): ItemDefinition => ({
  ...item,
  name: override?.name ?? item.name,
  summary: override?.summary ?? item.summary,
  imageUrl: imageUrl ?? item.imageUrl,
});

const toCustomItemDefinition = (item: PetModCustomItem, imageUrl?: string): ItemDefinition => ({
  id: item.id,
  name: item.name,
  kind: item.kind,
  price: item.price,
  effect: item.effect,
  summary: item.summary,
  imageUrl,
  source: 'mod',
  shop: item.shop,
  tags: item.tags,
  usable: true,
});

export const createBuiltinItemRegistry = (imageUrls: Partial<Record<string, string>> = {}): Map<string, ItemDefinition> => {
  const registry = new Map<string, ItemDefinition>();
  inventoryItems.forEach((item) => registry.set(item.id, toItemDefinition(item, imageUrls[item.id])));
  return registry;
};

export const createItemRegistry = (mod?: ActivePetMod | null, imageUrls: Partial<Record<string, string>> = {}): ItemRegistry => {
  const registry = createBuiltinItemRegistry(imageUrls);
  const manifestItemOverrides = mod?.manifest.schemaVersion === 2 ? mod.manifest.items?.overrides ?? {} : {};
  const overrides = { ...mod?.manifest.texts?.items, ...manifestItemOverrides };

  Object.entries(overrides).forEach(([id, override]) => {
    const current = registry.get(id);
    if (!current) return;
    registry.set(id, applyItemOverride(current, override, mod?.itemImageUrls[id] ?? imageUrls[id]));
  });

  if (mod?.manifest.schemaVersion === 2) {
    mod.manifest.items?.custom?.forEach((item) => {
      registry.set(item.id, toCustomItemDefinition(item, mod.itemImageUrls[item.id] ?? imageUrls[item.id]));
    });
  }

  return registry;
};

export const getItemDefinition = (registry: ItemRegistry, id: ItemId | string) => registry.get(id);

export const createUnknownItemDefinition = (id: string): InventoryItemDefinition => ({
  id: id as ItemId,
  name: t('pet.item.unknown.name'),
  displayName: t('pet.item.unknown.name'),
  kind: 'item',
  price: 0,
  effect: {},
  summary: t('pet.item.unknown.summary', { id }),
  displaySummary: t('pet.item.unknown.summary', { id }),
  source: 'unknown',
  shop: false,
  tags: [],
  usable: false,
});

export const getInventoryDefinitions = (registry: ItemRegistry, inventory: Inventory): readonly InventoryItemDefinition[] => {
  const knownItems = inventoryItems
    .map((item) => registry.get(item.id))
    .filter((item): item is ItemDefinition => Boolean(item) && item !== undefined && (inventory[item.id] ?? 0) > 0);
  const knownIds = new Set(knownItems.map((item) => item.id));
  const modAndUnknownItems = Object.entries(inventory)
    .filter(([id, amount]) => amount > 0 && !knownIds.has(id as ItemId) && !isBuiltinItemId(id))
    .map(([id]) => registry.get(id) ?? createUnknownItemDefinition(id));

  return [...knownItems, ...modAndUnknownItems].map((item) => ({
    ...item,
    displayName: item.name,
    displaySummary: item.summary,
  }));
};

export const getShopDefinitions = (registry: ItemRegistry): readonly InventoryItemDefinition[] =>
  Array.from(registry.values())
    .filter((item) => item.shop)
    .map((item) => ({ ...item, displayName: item.name, displaySummary: item.summary }));

export const isKnownUsableItem = (registry: ItemRegistry, id: ItemId | string) => Boolean(registry.get(id)?.usable);

export const getInventoryCount = (inventory: Inventory, id: ItemId | string) => inventory[id] ?? 0;

export const addInventoryItem = (inventory: Inventory, id: ItemId | string, amount: number): Inventory => ({
  ...inventory,
  [id]: Math.max(0, getInventoryCount(inventory, id) + amount),
});

export const removeInventoryItem = (inventory: Inventory, id: ItemId | string): Inventory => {
  const count = getInventoryCount(inventory, id);
  if (count <= 1) {
    const next = { ...inventory };
    delete next[id];
    return next;
  }
  return { ...inventory, [id]: count - 1 };
};

const getDailyDiscountPrice = (price: number) => Math.max(1, Math.ceil(price * 0.7));

export const dailyShopDiscountCount = 3;

const getEligibleDailyDiscountItems = () => shopItems.filter((item) => item.price > 0 && item.id !== 'emergency_biscuit');

const getGeneratedDailyDiscountItems = (now: number) => {
  const pool = [...getEligibleDailyDiscountItems()];
  if (pool.length === 0) return [];

  const dateKey = getLocalDateKey(now);
  const picks: ShopItem[] = [];
  for (let index = 0; index < dailyShopDiscountCount && pool.length > 0; index += 1) {
    const hashKey = index === 0 ? dateKey : dateKey + ':' + index;
    const pickIndex = hashString(hashKey) % pool.length;
    const [item] = pool.splice(pickIndex, 1);
    if (item) picks.push(item);
  }
  return picks;
};

const getStoredDailyDiscountItems = (pet: PetState, now: number) => {
  const dateKey = getLocalDateKey(now);
  const eligibleItems = getEligibleDailyDiscountItems();
  const eligibleById = new Map(eligibleItems.map((item) => [item.id, item]));
  const stored = pet.dailyDiscountDate === dateKey
    ? (pet.dailyDiscountItemIds ?? []).map((id) => eligibleById.get(id)).filter((item): item is ShopItem => Boolean(item))
    : [];
  return stored.length === Math.min(dailyShopDiscountCount, eligibleItems.length) ? stored : getGeneratedDailyDiscountItems(now);
};

export const getDailyHeartExchangeInfo = (pet: PetState, now = Date.now()) => {
  const dateKey = getLocalDateKey(now);
  const count =
    pet.dailyHeartExchangeDate === dateKey
      ? Math.min(dailyHeartExchangeLimit, Math.max(0, Math.floor(pet.dailyHeartExchangeCount)))
      : 0;

  return {
    dateKey,
    count,
    limit: dailyHeartExchangeLimit,
    coins: heartExchangeCoins,
    canExchange: count < dailyHeartExchangeLimit,
  };
};

export const getDailyShopDiscountInfo = (pet: PetState, now = Date.now()) => {
  const dateKey = getLocalDateKey(now);
  const items = getStoredDailyDiscountItems(pet, now);
  if (items.length === 0) return undefined;

  const usedIds = new Set(pet.dailyDiscountDate === dateKey ? pet.dailyDiscountUsedItemIds ?? [] : []);
  if (pet.dailyDiscountDate === dateKey && pet.dailyDiscountUsed && usedIds.size === 0 && items[0]) {
    usedIds.add(items[0].id);
  }

  return {
    dateKey,
    label: t('pet.shop.discount.label'),
    items: items.map((item) => ({
      itemId: item.id,
      originalPrice: item.price,
      price: getDailyDiscountPrice(item.price),
      used: usedIds.has(item.id),
    })),
  };
};
