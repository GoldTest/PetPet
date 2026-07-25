import { useState, useEffect, useCallback, useRef } from 'react';
import { Droplets, Flower2, Leaf, Sparkles, X } from 'lucide-react';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';
import {
  getWaterResult,
  getFertilizeResult,
  getHarvestResult,
  getPlantResult,
  getSkipResult,
  type MiniGameType,
  type MiniGameResult,
} from '../core/gardenMiniGames';

interface GardenMiniGameModalProps {
  type: MiniGameType;
  onComplete: (result: MiniGameResult) => void;
  onSkip: () => void;
}

const MINI_GAME_CONFIG = {
  water: {
    icon: Droplets,
    title: 'pet.garden.miniGame.water.title',
    duration: 3000,
  },
  fertilize: {
    icon: Flower2,
    title: 'pet.garden.miniGame.fertilize.title',
    duration: 4000,
  },
  harvest: {
    icon: Sparkles,
    title: 'pet.garden.miniGame.harvest.title',
    duration: 3000,
  },
  plant: {
    icon: Leaf,
    title: 'pet.garden.miniGame.plant.title',
    duration: 3500,
  },
} as const;

const WaterMiniGame = ({ onComplete }: { onComplete: (result: MiniGameResult) => void }) => {
  const [dropPosition, setDropPosition] = useState(0);
  const [isDropping, setIsDropping] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [results, setResults] = useState<('perfect' | 'great' | 'good' | 'miss')[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const animate = () => {
      setDropPosition(prev => {
        const next = prev + 2;
        if (next >= 100) {
          return 0;
        }
        return next;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    const timeout = setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      const finalResult = results.length > 0 ? results[results.length - 1] : 'miss';
      onComplete(getWaterResult(finalResult as 'perfect' | 'great' | 'good' | 'miss'));
    }, 3000);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(timeout);
    };
  }, [results, onComplete]);

  const handleClick = () => {
    const position = dropPosition;
    let rating: 'perfect' | 'great' | 'good' | 'miss';

    if (position >= 45 && position <= 55) {
      rating = 'perfect';
    } else if (position >= 35 && position <= 65) {
      rating = 'great';
    } else if (position >= 25 && position <= 75) {
      rating = 'good';
    } else {
      rating = 'miss';
    }

    setResults(prev => [...prev, rating]);
    setDropPosition(0);
  };

  return (
    <div className="mini-game water-mini-game">
      <div className="mini-game__target" />
      <div
        className="mini-game__drop"
        style={{ top: `${dropPosition}%` }}
      />
      <button
        type="button"
        className="mini-game__action"
        onClick={handleClick}
      >
        {t('pet.garden.miniGame.water.click')}
      </button>
      <div className="mini-game__results">
        {results.map((r: 'perfect' | 'great' | 'good' | 'miss', i: number) => (
          <span key={i} className={`mini-game__result mini-game__result--${r}`}>
            {r.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
};

const FertilizeMiniGame = ({ onComplete }: { onComplete: (result: MiniGameResult) => void }) => {
  const [grid, setGrid] = useState<(string | null)[]>(() => {
    const items = ['apple', 'banana', 'orange', 'apple', 'banana', 'orange', 'grape', 'grape', 'lemon'];
    return items.sort(() => Math.random() - 0.5);
  });
  const [selected, setSelected] = useState<number[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          const matchCount = matches.length;
          if (matchCount >= 3) {
            onComplete(getFertilizeResult('perfect'));
          } else if (matchCount >= 2) {
            onComplete(getFertilizeResult('great'));
          } else if (matchCount >= 1) {
            onComplete(getFertilizeResult('good'));
          } else {
            onComplete(getFertilizeResult('miss'));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [matches, onComplete]);

  const handleSelect = (index: number) => {
    if (selected.includes(index) || matches.includes(grid[index]!)) return;

    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      if (grid[first] === grid[second]) {
        setMatches(prev => [...prev, grid[first]!]);
        setSelected([]);
      } else {
        setTimeout(() => setSelected([]), 300);
      }
    }
  };

  return (
    <div className="mini-game fertilize-mini-game">
      <div className="mini-game__timer">{timeLeft}s</div>
      <div className="mini-game__grid">
        {grid.map((item, i) => (
          <button
            key={i}
            type="button"
            className={`mini-game__cell ${selected.includes(i) ? 'mini-game__cell--selected' : ''} ${matches.includes(item!) ? 'mini-game__cell--matched' : ''}`}
            onClick={() => handleSelect(i)}
            disabled={matches.includes(item!)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

const HarvestMiniGame = ({ onComplete }: { onComplete: (result: MiniGameResult) => void }) => {
  const [cards, setCards] = useState<(string | null)[]>(['?', '?', '?']);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [flipIndex, setFlipIndex] = useState(0);

  const flipCard = useCallback((index: number) => {
    if (flipped[index]) return;

    const rewards = ['coin', 'item', 'bonus'];
    const newCards = [...cards];
    newCards[index] = rewards[index % rewards.length];
    setCards(newCards);

    const newFlipped = [...flipped];
    newFlipped[index] = true;
    setFlipped(newFlipped);

    setFlipIndex(prev => prev + 1);

    if (flipIndex >= 2) {
      const hasBonus = newCards.includes('bonus');
      const hasItem = newCards.includes('item');
      if (hasBonus) {
        onComplete(getHarvestResult('perfect'));
      } else if (hasItem) {
        onComplete(getHarvestResult('great'));
      } else {
        onComplete(getHarvestResult('good'));
      }
    }
  }, [cards, flipped, flipIndex, onComplete]);

  useEffect(() => {
    if (flipIndex >= 3) {
      return;
    }

    const timer = setTimeout(() => {
      if (!flipped[flipIndex]) {
        flipCard(flipIndex);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [flipIndex, flipped, flipCard]);

  return (
    <div className="mini-game harvest-mini-game">
      <div className="mini-game__cards">
        {cards.map((card, i) => (
          <button
            key={i}
            type="button"
            className={`mini-game__card ${flipped[i] ? 'mini-game__card--flipped' : ''}`}
            onClick={() => flipCard(i)}
            disabled={flipped[i]}
          >
            {flipped[i] ? card : '?'}
          </button>
        ))}
      </div>
    </div>
  );
};

const PlantMiniGame = ({ onComplete }: { onComplete: (result: MiniGameResult) => void }) => {
  const [holdTime, setHoldTime] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isHolding) {
      intervalRef.current = setInterval(() => {
        setHoldTime(prev => Math.min(prev + 100, 2000));
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHolding]);

  const handleRelease = () => {
    setIsHolding(false);
    const bonusPercent = Math.min(20, Math.floor(holdTime / 100));
    if (bonusPercent >= 15) {
      onComplete(getPlantResult('perfect'));
    } else if (bonusPercent >= 10) {
      onComplete(getPlantResult('great'));
    } else if (bonusPercent >= 5) {
      onComplete(getPlantResult('good'));
    } else {
      onComplete(getPlantResult('miss'));
    }
  };

  return (
    <div className="mini-game plant-mini-game">
      <div className="mini-game__progress">
        <div
          className="mini-game__progress-bar"
          style={{ width: `${(holdTime / 2000) * 100}%` }}
        />
      </div>
      <button
        type="button"
        className="mini-game__action"
        onMouseDown={() => setIsHolding(true)}
        onMouseUp={handleRelease}
        onTouchStart={() => setIsHolding(true)}
        onTouchEnd={handleRelease}
      >
        {t('pet.garden.miniGame.plant.hold')}
      </button>
    </div>
  );
};

export const GardenMiniGameModal = ({ type, onComplete, onSkip }: GardenMiniGameModalProps) => {
  const config = MINI_GAME_CONFIG[type];
  const Icon = config.icon;

  return (
    <DialogShell className="garden-mini-game-modal" labelId="mini-game-title" onClose={onSkip}>
      <header className="dialog-header">
        <div className="dialog-title-group">
          <span className="dialog-title-icon" aria-hidden="true"><Icon size={22} /></span>
          <div>
            <h2 id="mini-game-title">{t(config.title)}</h2>
          </div>
        </div>
        <button type="button" className="icon-button" onClick={onSkip} aria-label={t('ui.garden.closeDialog')} title={t('ui.garden.closeDialog')}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      {type === 'water' && <WaterMiniGame onComplete={onComplete} />}
      {type === 'fertilize' && <FertilizeMiniGame onComplete={onComplete} />}
      {type === 'harvest' && <HarvestMiniGame onComplete={onComplete} />}
      {type === 'plant' && <PlantMiniGame onComplete={onComplete} />}

      <button type="button" className="secondary-button mini-game__skip" onClick={onSkip}>
        {t('pet.garden.miniGame.skip')}
      </button>
    </DialogShell>
  );
};
