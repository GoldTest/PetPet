import { BookOpen, Leaf, Lock, Recycle, Shuffle, X } from 'lucide-react';
import { treeStageImages } from '../assets';
import { allGardenTreeIds, getSpeciesBookProgress, isSpeciesBookComplete } from '../core/speciesBook';
import { gardenTreeDefinitions } from '../core/garden';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';
import type { PetState, SpeciesBookEntry } from '../core/petTypes';

interface SpeciesBookModalProps {
  pet: PetState;
  onClose: () => void;
}

const synergyRules = [
  { id: 'fruit_care', a: 'fruit_tree', b: 'care_tree', desc: 'care_tree 额外掉落 +100%' },
  { id: 'gift_fruit', a: 'gift_tree', b: 'fruit_tree', desc: 'fruit_tree 生长速度 +10%' },
  { id: 'herb_fruit', a: 'herb_tree', b: 'fruit_tree', desc: '额外掉落 +50%' },
  { id: 'herb_care', a: 'herb_tree', b: 'care_tree', desc: 'herb_tree 生长速度 +10%' },
  { id: 'money_any', a: 'money_tree', b: 'any', desc: '金币 +15%' },
  { id: 'same_adjacent', a: 'same', b: 'same', desc: '稀有权重 +5%' },
];

const compostGuide = [
  { input: 'fruit_care', output: 'normal_fertilizer', time: '30min', inputKey: 'FruitCare', outputKey: 'Normal' },
  { input: 'withered_fragment', output: 'harvest_nutrient', time: '1h', inputKey: 'Withered', outputKey: 'Nutrient' },
  { input: 'rare_combo', output: 'heart_fertilizer', time: '2h', inputKey: 'RareCombo', outputKey: 'Heart' },
];

export const SpeciesBookModal = ({ pet, onClose }: SpeciesBookModalProps) => {
  const progress = getSpeciesBookProgress(pet);
  const isComplete = isSpeciesBookComplete(pet);

  return (
    <DialogShell className="species-book-modal" labelId="species-book-title" onClose={onClose}>
      <header className="dialog-header">
        <div className="dialog-title-group">
          <span className="dialog-title-icon" aria-hidden="true"><BookOpen size={22} /></span>
          <div>
            <h2 id="species-book-title">{t('ui.garden.speciesBook.title')}</h2>
            <p>{t('ui.garden.speciesBook.progress', { unlocked: progress.unlocked, total: progress.total })}</p>
          </div>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label={t('ui.garden.closeDialog')} title={t('ui.garden.closeDialog')}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="species-book__body">
        <div className="species-book__left">
          {isComplete && (
            <div className="species-book__complete">
              <Leaf size={20} aria-hidden="true" />
              <span>{t('ui.garden.speciesBook.complete')}</span>
            </div>
          )}

          <div className="species-book__list">
            {allGardenTreeIds.map((treeId) => {
              const entry = pet.speciesBook.entries[treeId] as SpeciesBookEntry | undefined;
              const isUnlocked = entry?.unlocked ?? false;
              const definition = gardenTreeDefinitions[treeId];

              return (
                <article
                  key={treeId}
                  className={`species-book__entry ${isUnlocked ? 'species-book__entry--unlocked' : 'species-book__entry--locked'}`}
                >
                  <div className="species-book__entry-icon">
                    {isUnlocked ? (
                      <img src={treeStageImages[4]} alt="" aria-hidden="true" />
                    ) : (
                      <Lock size={24} aria-hidden="true" />
                    )}
                  </div>
                  <div className="species-book__entry-info">
                    <strong>{isUnlocked ? t(`ui.garden.trees.${treeId}.name`) : '???'}</strong>
                    {isUnlocked ? (
                      <>
                        <small>{t('ui.garden.speciesBook.harvests', { count: entry?.harvestCount ?? 0 })}</small>
                        <small>{t(`ui.garden.trees.${treeId}.summary`)}</small>
                      </>
                    ) : (
                      <small>{t('ui.garden.speciesBook.locked')}</small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="species-book__right">
          <div className="garden-guide__section">
            <h4 className="garden-guide__title"><Shuffle size={14} /> {t('ui.garden.synergy.title')}</h4>
            <div className="garden-guide__list">
              {synergyRules.map((rule) => (
                <div key={rule.id} className="garden-guide__item">
                  <span className="garden-guide__label">{t(`ui.garden.synergy.${rule.id}`)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="garden-guide__section">
            <h4 className="garden-guide__title"><Recycle size={14} /> {t('ui.garden.compostTitle')}</h4>
            <div className="garden-guide__list">
              {compostGuide.map((item) => (
                <div key={item.input} className="garden-guide__item">
                  <span className="garden-guide__label">
                    {t('ui.garden.compostInput' + item.inputKey)} → {t('ui.garden.compostOutput' + item.outputKey)}
                  </span>
                  <small className="garden-guide__time">{item.time}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DialogShell>
  );
};
