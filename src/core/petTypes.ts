export type PetStatus = 'content' | 'hungry' | 'sad' | 'dirty' | 'tired' | 'sick' | 'sleeping';

export type ItemId =
  | 'emergency_biscuit'
  | 'bento'
  | 'orange'
  | 'apple'
  | 'banana'
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
  | 'energy_drink';

export type Inventory = Partial<Record<ItemId, number>>;

export type ShopCategory = 'food' | 'item' | 'care';

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'breezy';

export type CareActionKey = 'play' | 'clean' | 'work' | 'feed' | 'gift' | 'touch';

export interface ActionStreak {
  key: CareActionKey | 'none';
  count: number;
  windowStartedAt: number;
  lastAt: number;
}

export type RecentActivity =
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

export type PomodoroPhase = 'focus' | 'short_break';

export interface PomodoroDurations {
  focusMinutes: number;
  shortBreakMinutes: number;
  targetRounds: number;
}

export type PomodoroActivity = Extract<RecentActivity, 'reading_books' | 'workout' | 'work_food' | 'work_plants'>;

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
  dailyDiscountDate: string;
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
  id: ItemId;
  name: string;
  kind: ShopCategory;
  price: number;
  effect: ItemEffect;
  summary: string;
}

export interface UseInventoryItemOptions {
  favoriteFoodIds?: readonly ItemId[];
  favoriteText?: (amount: number) => string | undefined;
  itemName?: string;
}


