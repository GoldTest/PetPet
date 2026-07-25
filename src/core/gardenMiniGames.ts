export type MiniGameType = 'water' | 'fertilize' | 'harvest' | 'plant';

export interface MiniGameResult {
  type: MiniGameType;
  rating: 'perfect' | 'great' | 'good' | 'miss';
  bonusPercent: number;
}

export interface WaterGameResult extends MiniGameResult {
  type: 'water';
  growSpeedBonusPercent: number;
}

export interface FertilizeGameResult extends MiniGameResult {
  type: 'fertilize';
  extraDropChancePercent: number;
}

export interface HarvestGameResult extends MiniGameResult {
  type: 'harvest';
  rareWeightBonusPercent: number;
}

export interface PlantGameResult extends MiniGameResult {
  type: 'plant';
  initialGrowBonusPercent: number;
}

const WATER_RATINGS = {
  perfect: { bonusPercent: 15, growSpeedBonusPercent: 15 },
  great: { bonusPercent: 10, growSpeedBonusPercent: 10 },
  good: { bonusPercent: 5, growSpeedBonusPercent: 5 },
  miss: { bonusPercent: 0, growSpeedBonusPercent: 0 },
} as const;

const FERTILIZE_RATINGS = {
  perfect: { bonusPercent: 20, extraDropChancePercent: 20 },
  great: { bonusPercent: 12, extraDropChancePercent: 12 },
  good: { bonusPercent: 5, extraDropChancePercent: 5 },
  miss: { bonusPercent: 0, extraDropChancePercent: 0 },
} as const;

const HARVEST_RATINGS = {
  perfect: { bonusPercent: 25, rareWeightBonusPercent: 25 },
  great: { bonusPercent: 15, rareWeightBonusPercent: 15 },
  good: { bonusPercent: 8, rareWeightBonusPercent: 8 },
  miss: { bonusPercent: 0, rareWeightBonusPercent: 0 },
} as const;

const PLANT_RATINGS = {
  perfect: { bonusPercent: 20, initialGrowBonusPercent: 20 },
  great: { bonusPercent: 12, initialGrowBonusPercent: 12 },
  good: { bonusPercent: 5, initialGrowBonusPercent: 5 },
  miss: { bonusPercent: 0, initialGrowBonusPercent: 0 },
} as const;

export const getWaterResult = (rating: 'perfect' | 'great' | 'good' | 'miss'): WaterGameResult => ({
  type: 'water',
  rating,
  bonusPercent: WATER_RATINGS[rating].bonusPercent,
  growSpeedBonusPercent: WATER_RATINGS[rating].growSpeedBonusPercent,
});

export const getFertilizeResult = (rating: 'perfect' | 'great' | 'good' | 'miss'): FertilizeGameResult => ({
  type: 'fertilize',
  rating,
  bonusPercent: FERTILIZE_RATINGS[rating].bonusPercent,
  extraDropChancePercent: FERTILIZE_RATINGS[rating].extraDropChancePercent,
});

export const getHarvestResult = (rating: 'perfect' | 'great' | 'good' | 'miss'): HarvestGameResult => ({
  type: 'harvest',
  rating,
  bonusPercent: HARVEST_RATINGS[rating].bonusPercent,
  rareWeightBonusPercent: HARVEST_RATINGS[rating].rareWeightBonusPercent,
});

export const getPlantResult = (rating: 'perfect' | 'great' | 'good' | 'miss'): PlantGameResult => ({
  type: 'plant',
  rating,
  bonusPercent: PLANT_RATINGS[rating].bonusPercent,
  initialGrowBonusPercent: PLANT_RATINGS[rating].initialGrowBonusPercent,
});

export const getSkipResult = (type: MiniGameType): MiniGameResult => {
  switch (type) {
    case 'water': return getWaterResult('miss');
    case 'fertilize': return getFertilizeResult('miss');
    case 'harvest': return getHarvestResult('miss');
    case 'plant': return getPlantResult('miss');
  }
};
