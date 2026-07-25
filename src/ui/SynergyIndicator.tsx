import { useMemo, useState } from 'react';
import { findActiveSynergies, getSynergiesForSlotWithDirection, type ActiveSynergy, type SynergyDirection } from '../core/gardenSynergy';
import type { GardenState } from '../core/petTypes';
import { t } from '../i18n';

interface SynergyIndicatorProps {
  slotIndex: number;
  garden: GardenState;
}

const DIRECTION_ARROW: Record<SynergyDirection, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

const DIRECTION_CLASS: Record<SynergyDirection, string> = {
  up: 'synergy-dot--up',
  down: 'synergy-dot--down',
  left: 'synergy-dot--left',
  right: 'synergy-dot--right',
};

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

export const SynergyIndicator = ({ slotIndex, garden }: SynergyIndicatorProps) => {
  const [hovered, setHovered] = useState(false);
  const allSynergies = useMemo(() => findActiveSynergies(garden), [garden]);
  const infos = useMemo(() => getSynergiesForSlotWithDirection(slotIndex, allSynergies), [slotIndex, allSynergies]);

  if (infos.length === 0) return null;

  return (
    <span
      className="garden-plot__synergy-indicator"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {infos.map(({ direction, synergy }) => (
        <span
          key={`${synergy.rule.id}-${direction}`}
          className={`synergy-dot ${DIRECTION_CLASS[direction]}`}
          style={{ color: getSynergyColor(synergy) }}
        >
          {DIRECTION_ARROW[direction]}
        </span>
      ))}
      {hovered && (
        <span className="synergy-tooltip">
          {infos.map(({ synergy }) => (
            <span key={synergy.rule.id} style={{ color: getSynergyColor(synergy) }}>
              {t(`ui.garden.synergy.${synergy.rule.id}`)}
            </span>
          ))}
        </span>
      )}
    </span>
  );
};
