export type PetStatus = 'content' | 'hungry' | 'sad' | 'dirty' | 'tired' | 'sick' | 'sleeping';

export type BuiltinItemId =
  | 'emergency_biscuit'
  | 'bento'
  | 'orange'
  | 'apple'
  | 'banana'
  | 'watermelon'
  | 'nutri_meal'
  | 'pig_trotter'
  | 'strawberry_cake'
  | 'birthday_cake'
  | 'ad_milk'
  | 'strawberry_milk'
  | 'small_bouquet'
  | 'shiny_sticker'
  | 'soft_cloud_doll'
  | 'ribbon_bell'
  | 'toy_ball'
  | 'picture_book'
  | 'shampoo'
  | 'wet_wipes'
  | 'medicine'
  | 'vitamin_tablet'
  | 'blanket'
  | 'energy_drink'
  | 'golden_apple'
  | 'fruit_tree_sapling'
  | 'poplar_tree_sapling'
  | 'herb_tree_sapling'
  | 'money_tree_sapling'
  | 'golden_apple_tree_sapling'
  | 'normal_fertilizer'
  | 'heart_fertilizer'
  | 'harvest_nutrient'
  | 'withered_fragment'
  | 'wood_plank'
  | 'exp_potion'
  | 'energy_concentrate'
  | 'skill_fruit'
  | 'wish_fragment'
  | 'garden_token'
  | 'tomato'
  | 'carrot'
  | 'cabbage'
  | 'onion'
  | 'potato'
  | 'chili'
  | 'tomato_seed'
  | 'carrot_seed'
  | 'cabbage_seed'
  | 'onion_seed'
  | 'potato_seed'
  | 'chili_seed'
  | 'world_anchor_chinese'
  | 'world_anchor_fantasy'
  | 'world_anchor_modern'
  | 'lucky_charm'
  | 'star_shard'
  | 'wishing_well_coin'
  | 'crucian_carp'
  | 'grass_carp'
  | 'silver_carp'
  | 'common_carp'
  | 'catfish'
  | 'shrimp'
  | 'crab'
  | 'perch'
  | 'bream'
  | 'yellow_jacket'
  | 'trout'
  | 'salmon'
  | 'octopus'
  | 'squid'
  | 'tuna'
  | 'marlin'
  | 'ancient_koi'
  | 'star_koi'
  | 'mythical_fish'
  | 'fish_bone'
  | 'seashell'
  | 'pearl'
  | 'fish_roe'
  | 'worm'
  | 'rice_ball'
  | 'insect_bait'
  | 'glow_bait'
  | 'magic_bait'
  | 'bamboo_rod'
  | 'iron_rod'
  | 'fiber_rod'
  | 'carbon_rod'
  | 'titanium_rod'
  | 'sea_god_rod'
  | 'fishing_token';

export type ModItemId = `${string}:${string}`;

export type ItemId = BuiltinItemId | ModItemId;

export type Inventory = Record<string, number>;

export type GardenTreeId = 'poplar_tree' | 'fruit_tree' | 'herb_tree' | 'money_tree' | 'golden_apple_tree';

export type FishId =
  | 'crucian_carp'
  | 'grass_carp'
  | 'silver_carp'
  | 'common_carp'
  | 'catfish'
  | 'shrimp'
  | 'crab'
  | 'perch'
  | 'bream'
  | 'yellow_jacket'
  | 'trout'
  | 'salmon'
  | 'octopus'
  | 'squid'
  | 'tuna'
  | 'marlin'
  | 'ancient_koi'
  | 'star_koi'
  | 'mythical_fish';

export type FishingWaterZoneId = 'pond' | 'river' | 'lake' | 'deep_sea';
export type FishingRodId = 'bamboo' | 'iron' | 'fiber' | 'carbon' | 'titanium' | 'sea_god';
export type FishingBaitId = 'worm' | 'rice_ball' | 'insect' | 'glow' | 'magic';
export type FishingSlotState = 'idle' | 'casting' | 'waiting' | 'reeling' | 'done';
export type FishRarity = 'common' | 'rare' | 'epic' | 'legend';
export type FishingSlotOutcome = 'caught' | 'lost' | 'snagged' | 'jammed';

export interface FishDefinition {
  id: FishId;
  rarity: FishRarity;
  zones: readonly FishingWaterZoneId[];
  weight: number;
  price: number;
  effect: ItemEffect;
  tags?: readonly string[];
}

export interface FishingWaterZoneDefinition {
  id: FishingWaterZoneId;
  unlockedAtSkillLevel: number;
  fishIds: readonly FishId[];
  baseWaitMs: number;
  baseBiteRate: number;
  rareBonusPercent: number;
}

export interface FishingRodDefinition {
  id: FishingRodId;
  catchRateBonusPercent: number;
  waitTimeMultiplier: number;
  qualityBonusPercent: number;
  durability: number;
  qualityChancePercent: number;
  unlocksZones: readonly FishingWaterZoneId[];
}

export interface FishingSlot {
  slotIndex: number;
  state: FishingSlotState;
  fishId?: FishId;
  baitUsed?: FishingBaitId;
  outcome?: FishingSlotOutcome;
  castAt: number;
  bittenAt: number;
  reeledAt: number;
  streak: number;
  durabilityUsed: number;
}

export interface FishingSkill {
  level: number;
  xp: number;
}

export interface FishingState {
  schemaVersion: 2;
  activeWaterZone: FishingWaterZoneId;
  rod: FishingRodId;
  bait: FishingBaitId;
  slots: FishingSlot[];
  skill: FishingSkill;
  dailyCatchDateKey: string;
  dailyCatchCount: number;
  dailyCastDateKey: string;
  dailyCastCount: number;
}

export type VegetableCropId = 'tomato' | 'carrot' | 'cabbage' | 'onion' | 'potato' | 'chili';

export type VegetableSlotState = 'empty' | 'growing' | 'ready' | 'withered';

export interface VegetableSlot {
  slotIndex: number;
  cropId?: VegetableCropId;
  plantedAt: number;
  lastWateredAt: number;
  nextReadyAt: number;
  state: VegetableSlotState;
  dailyHarvestDateKey: string;
  dailyHarvestCount: number;
}

export interface VegetableGardenState {
  schemaVersion: number;
  slots: VegetableSlot[];
  dailyWaterDateKey: string;
  dailyWaterCount: number;
  lifetimeHarvestCount: number;
}

export type GardenFertilizerId = 'normal' | 'heart';

export type GardenToolId = 'watering_can' | 'shovel' | 'fertilizer_box';

export type GardenSlotState = 'empty' | 'growing' | 'ready' | 'withered';

export interface GardenDrop {
  kind?: 'item' | 'coins';
  itemId?: ItemId;
  amount: number;
}

export interface GardenSlot {
  slotIndex: number;
  unlocked: boolean;
  treeId?: GardenTreeId;
  plantedAt: number;
  lastWateredAt: number;
  lastFertilizedAt: number;
  lastBoostedAt: number;
  nextReadyAt: number;
  harvestsUsed: number;
  maxHarvests: number;
  fertilizerType?: GardenFertilizerId;
  hasNutrientBoost: boolean;
  dailyHarvestDateKey: string;
  dailyHarvestCount: number;
  pendingDrops: GardenDrop[];
  state: GardenSlotState;
}

export interface GardenTools {
  wateringCanLevel: number;
  shovelLevel: number;
  fertilizerBoxLevel: number;
}

export interface GardenState {
  schemaVersion: 3;
  slots: GardenSlot[];
  dailyCareDateKey: string;
  dailyWaterCount: number;
  dailyFertilizeCount: number;
  dailyHarvestDateKey: string;
  dailyHarvestCount: number;
  tools: GardenTools;
  lifetimeHarvestCount: number;
  compostBin: CompostBinState;
}

export type CompostBinInputType = 'fruit_care' | 'withered_fragment' | 'rare_combo';
export type CompostBinCatalystType = 'fruit_catalyst' | 'withered_catalyst' | 'fertilizer_catalyst';

export interface CompostBinSlot {
  slotIndex: number;
  inputType?: CompostBinInputType;
  inputItemId?: string;
  startedAt: number;
  completesAt: number;
  outputItemId: string;
  outputAmount: number;
  catalystType?: CompostBinCatalystType;
  catalystItemId?: string;
  catalystCount?: number;
  guaranteedTokenDrop?: boolean;
}

export interface CompostBinState {
  level: number;
  slots: CompostBinSlot[];
  unlockedExtraSlots: number;
}

export interface SpeciesBookEntry {
  unlocked: boolean;
  harvestCount: number;
  firstHarvestAt: number;
}

export interface SpeciesBookState {
  entries: Record<string, SpeciesBookEntry>;
  allCollected: boolean;
}

export type BoostCardId = 'friend_pass' | 'best_friend_pass';

export interface BoostCardState {
  schemaVersion: 1;
  friendPassExpiresAt: number;
  bestFriendPassExpiresAt: number;
  bestFriendPassPurchasedDays: number;
  dailyDateKey: string;
  dailyCoinsClaimedCardId?: BoostCardId;
  dailyWorkBonusCoinsUsed: number;
  dailyExtraHeartCount: number;
  dailyGardenExtraDrops: number;
}

export type ShopCategory = 'food' | 'item' | 'care' | 'garden';

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'breezy';

export type CareActionKey = 'play' | 'clean' | 'work' | 'feed' | 'gift' | 'touch';

export interface ActionStreak {
  key: CareActionKey | 'none';
  count: number;
  windowStartedAt: number;
  lastAt: number;
}

export type BuiltinActivity =
  | 'idle'
  | 'happy'
  | 'bath'
  | 'eat_cookie'
  | 'eat_noodles'
  | 'eat_meat'
  | 'give_heart'
  | 'level_up'
  | 'reading_books'
  | 'workout'
  | 'work_food'
  | 'work_plants';

export type RecentActivity = string;

export type PomodoroPhase = 'focus' | 'short_break';

export interface PomodoroDurations {
  focusMinutes: number;
  shortBreakMinutes: number;
  targetRounds: number;
}

export type PomodoroActivity = 'reading_books' | 'workout' | 'work_food' | 'work_plants';

export interface PomodoroState {
  isRunning: boolean;
  phase: PomodoroPhase;
  phaseStartedAt: number;
  phaseEndsAt: number;
  round: number;
  completedFocusCount: number;
  dailyFocusDate: string;
  dailyCompletedFocusCount: number;
  settings: PomodoroDurations;
  currentActivity: PomodoroActivity;
  lastSettledPhaseId: string;
  pausedRemainingMs: number;
  focusRewardCheckpointAt: number;
  sessionFocusMs: number;
  baseRewardCoinsPaid: number;
  bonusRewardedHours: number;
  moodRewardedBlocks: number;
  hasTriggeredSessionResetEvent: boolean;
}

export interface PetBirthday {
  month: number;
  day: number;
}

export type YearlyCareActionKey = Extract<CareActionKey, 'play' | 'clean' | 'work' | 'feed' | 'gift' | 'touch'>;

export interface YearlyStats {
  year: number;
  activeDateKeys: string[];
  careActionCounts: Record<YearlyCareActionKey, number>;
  itemUseCount: number;
  pomodoroFocusCount: number;
}

export interface YearReview {
  year: number;
  companionDays: number;
  activeDays: number;
  careActions: number;
  itemUseCount: number;
  pomodoroFocusCount: number;
  topCareAction?: YearlyCareActionKey;
}

export type DailyWishActionKey = 'feed' | 'clean' | 'play' | 'touch' | 'work';

export type DailyWishId = 'feed_once' | 'clean_once' | 'play_once' | 'touch_once' | 'work_once';

export interface DailyWishState {
  dateKey: string;
  id: DailyWishId;
  action: DailyWishActionKey;
  progress: number;
  target: number;
  rewardCoins: number;
  completedAt?: number;
  claimedAt?: number;
}

export type ReturnWelcomeActionKey = 'feed' | 'clean' | 'touch' | 'sleep';

export type ReturnWelcomeTaskId = 'feed_once' | 'clean_once' | 'touch_once' | 'sleep_once';

export interface ReturnWelcomeState {
  startedAt: number;
  awayDays: number;
  taskId: ReturnWelcomeTaskId;
  action: ReturnWelcomeActionKey;
  progress: number;
  target: number;
  rewardCoins: number;
  rewardItemIds: ItemId[];
  completedAt?: number;
  claimedAt?: number;
}

export type PartnerScheduleCategory = 'study' | 'cooking' | 'garden' | 'exercise';

export type PartnerScheduleSize = 'short' | 'standard' | 'long';

export type PartnerScheduleRewardChoice = 'coins' | 'category';

export interface PartnerScheduleOffer {
  id: string;
  templateId: string;
  dateKey: string;
}

export interface PartnerScheduleSkill {
  level: number;
  xp: number;
  masterCompletions: number;
}

export interface ActivePartnerSchedule {
  offerId: string;
  templateId: string;
  category: PartnerScheduleCategory;
  size: PartnerScheduleSize;
  startedAt: number;
  endsAt: number;
  coinReward: number;
  skillXp: number;
  grantsMasterCompletion: boolean;
}

export interface PartnerScheduleResult {
  offerId: string;
  templateId: string;
  category: PartnerScheduleCategory;
  size: PartnerScheduleSize;
  completedAt: number;
  coinReward: number;
  skillXp: number;
  grantsMasterCompletion: boolean;
}

export interface PartnerScheduleState {
  schemaVersion: 3;
  boardDateKey: string;
  boardOfferCount: number;
  offers: PartnerScheduleOffer[];
  completedOfferIds: string[];
  active?: ActivePartnerSchedule;
  pendingResult?: PartnerScheduleResult;
  skills: Record<PartnerScheduleCategory, PartnerScheduleSkill>;
}

export interface WishingWellState {
  schemaVersion: number;
  dateKey: string;
  freeWishesUsed: number;
  paidWishesUsed: number;
  paidWishBaseCost: number;
  totalWishes: number;
  legendaryCount: number;
  hiddenCount: number;
  pity: number;
}

export interface MultiverseState {
  schemaVersion: number;
  minerals: number;
  energy: number;
  lastRandomTravelAt: number;
}

export type AchievementId = string;

export interface AchievementCounters {
  careActionCounts: Record<YearlyCareActionKey, number>;
  pomodoroFocusCount: number;
  bestDailyPomodoroFocusCount: number;
  itemUseCountsById: Partial<Record<string, number>>;
  totalItemUseCount: number;
  purchaseCount: number;
  paidPurchaseCount: number;
  sleepStartCount: number;
  dailyWishClaimCount: number;
  returnWelcomeClaimCount: number;
  dateRewardClaimCountsByKind: Partial<Record<string, number>>;
  heartEarnedTotal: number;
  coinEarnedTotal: number;
  maxCoinsHeld: number;
  manualWakeCount: number;
  naturalWakeCount: number;
  gardenPlantCount: number;
  gardenWaterCount: number;
  gardenHarvestCountsByTreeId: Partial<Record<GardenTreeId, number>>;
  vegGardenPlantCount: number;
  vegGardenWaterCount: number;
  vegGardenHarvestCountsByCropId: Partial<Record<VegetableCropId, number>>;
  compostStartCount: number;
  compostCollectCount: number;
  partnerScheduleClaimCount: number;
  partnerScheduleClaimCountsByCategory: Partial<Record<PartnerScheduleCategory, number>>;
  partnerScheduleLongClaimCountsByCategory: Partial<Record<PartnerScheduleCategory, number>>;
  partnerScheduleCategoryRewardClaimCount: number;
  fishingCatchCount: number;
  fishingSpeciesCount: number;
  fishingRareCount: number;
  fishingDailyBest: number;
  fishingStreakBest: number;
  companionYearActiveDateKeysByYear: Record<string, string[]>;
  modSwitchCount: number;
  wishingWellWishCount: number;
  wishingWellLegendaryCount: number;
  wishingWellHiddenCount: number;
}

export interface AchievementState {
  unlockedAtById: Partial<Record<AchievementId, number>>;
  claimedOneTimeRewardIds: AchievementId[];
  dailyStipendClaimDateKey: string;
  completedGoodEndingYears: number[];
  unlockedCgIds: string[];
  pendingReviewNotice: boolean;
  counters: AchievementCounters;
}
export interface PetState {
  name: string;
  level: number;
  hunger: number;
  mood: number;
  cleanliness: number;
  energy: number;
  health: number;
  createdAt: number;
  ageSeconds: number;
  lastUpdatedAt: number;
  isSleeping: boolean;
  recentEvent: string;
  recentActivity: RecentActivity;
  recentActivityUntil: number;
  coins: number;
  hearts: number;
  inventory: Inventory;
  lastDailyRewardAt: number;
  lastDailyEncounterAt: number;
  dailyBiscuitClaimDate: string;
  dailyBiscuitClaims: number;
  dailyWitheredFragmentClaimDate: string;
  dailyWitheredFragmentClaims: number;
  dailyDiscountDate: string;
  dailyDiscountItemIds: BuiltinItemId[];
  dailyDiscountUsedItemIds: BuiltinItemId[];
  dailyDiscountUsed: boolean;
  dailyHeartExchangeDate: string;
  dailyHeartExchangeCount: number;
  weatherDate: string;
  weather: WeatherType;
  lastEnergyRecoveryAt: number;
  sleepStartedAt: number;
  sleepStartMood: number;
  sleepStartHunger: number;
  sleepStartCleanliness: number;
  lowCleanlinessSleepConfirmCount: number;
  lastDreamTalkAt: number;
  actionStreak: ActionStreak;
  lastInteractionAt: number;
  lastPetInteractionAt: number;
  pomodoro: PomodoroState;
  hasOpenedHelp: boolean;
  claimedRewardIds: string[];
  birthday?: PetBirthday;
  lastBirthdayRewardYear?: number;
  lastAnniversaryRewardYear?: number;
  dailyLoginRewardDateKey?: string;
  monthlyGiftDateKey?: string;
  claimedFestivalRewardKeys: string[];
  yearlyStats: YearlyStats;
  pendingYearReview?: YearReview;
  lastYearReviewYear?: number;
  dailyWish: DailyWishState;
  returnWelcome?: ReturnWelcomeState;
  achievements: AchievementState;
  lastCleanActionAt: number;
  garden: GardenState;
  vegetableGarden: VegetableGardenState;
  boostCards: BoostCardState;
  partnerSchedule: PartnerScheduleState;
  neighborGiftDateKey?: string;
  neighborGiftCount?: number;
  neighbor?: NeighborReference;
  speciesBook: SpeciesBookState;
  multiverse: MultiverseState;
  fishing: FishingState;
  wishingWell: WishingWellState;
}

export type PetAction = 'play' | 'clean' | 'sleep' | 'work';

export interface ItemEffect {
  hunger?: number;
  mood?: number;
  cleanliness?: number;
  energy?: number;
  health?: number;
}

export interface ShopItem {
  id: BuiltinItemId;
  name: string;
  kind: ShopCategory;
  price: number;
  effect: ItemEffect;
  summary: string;
  tags?: string[];
  usable?: boolean;
  /** 每袋数量：购买一次获得的物品数量（如种子袋 9 颗），价格即为袋价 */
  packSize?: number;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  kind: ShopCategory;
  price: number;
  effect: ItemEffect;
  summary: string;
  imageUrl?: string;
  source: 'builtin' | 'mod' | 'unknown';
  shop: boolean;
  tags: string[];
  usable: boolean;
  /** 每袋数量：购买一次获得的物品数量（如种子袋 9 颗），价格即为袋价 */
  packSize?: number;
}

export type ItemRegistry = ReadonlyMap<string, ItemDefinition>;

export type InventoryItemDefinition = ItemDefinition & {
  displayName: string;
  displaySummary: string;
};

export interface UseInventoryItemOptions {
  favoriteFoodIds?: readonly ItemId[];
  favoriteText?: (amount: number) => string | undefined;
  itemName?: string;
  item?: ItemDefinition;
}

export interface BuyItemOptions {
  item?: ItemDefinition;
}

export type NeighborReference =
  | { kind: 'generic' }
  | { kind: 'mod'; modId: string };

export interface NeighborIdentity {
  modId: string;
  name: string;
}

export interface NeighborGiftCandidate {
  itemId: ItemId;
  displayName: string;
  price: number;
}

export interface NeighborEventContext {
  neighbors: readonly NeighborIdentity[];
  giftCandidates: readonly NeighborGiftCandidate[];
  random?: () => number;
}


