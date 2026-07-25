import { BookOpen, Leaf, Lock, X } from 'lucide-react';
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
    </DialogShell>
  );
};
