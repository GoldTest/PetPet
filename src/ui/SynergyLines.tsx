import { useMemo } from 'react';
import { findActiveSynergies, type ActiveSynergy } from '../core/gardenSynergy';
import type { GardenState } from '../core/petTypes';

interface SynergyLinesProps {
  garden: GardenState;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

const SLOT_POSITIONS = [
  { x: 16.67, y: 16.67 },
  { x: 50, y: 16.67 },
  { x: 83.33, y: 16.67 },
  { x: 16.67, y: 50 },
  { x: 50, y: 50 },
  { x: 83.33, y: 50 },
  { x: 16.67, y: 83.33 },
  { x: 50, y: 83.33 },
  { x: 83.33, y: 83.33 },
];

const getSynergyColor = (synergy: ActiveSynergy): string => {
  const id = synergy.rule.id;
  switch (id) {
    case 'fruit_care': return '#7cb342';
    case 'gift_fruit': return '#ff9800';
    case 'money_any': return '#ffd54f';
    case 'same_adjacent': return '#ab47bc';
    default: return '#90a4ae';
  }
};

const getSynergyLabel = (synergy: ActiveSynergy): string => {
  const effect = synergy.rule.effect;
  if (effect.growSpeedBonusPercent) return `+${effect.growSpeedBonusPercent}% grow`;
  if (effect.extraDropChancePercent) return `+${effect.extraDropChancePercent}% drops`;
  if (effect.coinBonusPercent) return `+${effect.coinBonusPercent}% coins`;
  if (effect.rareWeightBonusPercent) return `+${effect.rareWeightBonusPercent}% rare`;
  return '';
};

export const SynergyLines = ({ garden, gridRef }: SynergyLinesProps) => {
  const synergies = useMemo(() => findActiveSynergies(garden), [garden]);

  if (synergies.length === 0) return null;

  return (
    <svg className="synergy-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
      {synergies.map((synergy, i) => {
        const posA = SLOT_POSITIONS[synergy.slotA];
        const posB = SLOT_POSITIONS[synergy.slotB];
        if (!posA || !posB) return null;

        const color = getSynergyColor(synergy);
        const midX = (posA.x + posB.x) / 2;
        const midY = (posA.y + posB.y) / 2;
        const label = getSynergyLabel(synergy);

        return (
          <g key={`${synergy.rule.id}-${synergy.slotA}-${synergy.slotB}`}>
            <line
              x1={posA.x}
              y1={posA.y}
              x2={posB.x}
              y2={posB.y}
              stroke={color}
              strokeWidth="0.8"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />
            <circle
              cx={midX}
              cy={midY}
              r="1.2"
              fill={color}
              fillOpacity="0.8"
            />
            {label && (
              <text
                x={midX}
                y={midY - 2}
                textAnchor="middle"
                fill={color}
                fontSize="2.2"
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
