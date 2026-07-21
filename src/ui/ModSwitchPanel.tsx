import { PackagePlus, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { resolvePetStatusImages } from '../assets';
import type { ActivePetMod } from '../core/mod';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';

interface StoredModInfo {
  id: string;
  name: string;
  version: string;
  fileName?: string;
  importedAt: number;
  contentImageUrl?: string;
  isBuiltin?: boolean;
}

interface ModSwitchPanelProps {
  activeMod: ActivePetMod | null;
  storedMods: StoredModInfo[];
  onSwitchMod: (modId: string | null) => void;
  onImportMod: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeleteMod: (modId: string) => void;
  onClose: () => void;
}

const defaultPetImage = resolvePetStatusImages(null).content;

export const ModSwitchPanel = ({ activeMod, storedMods, onSwitchMod, onImportMod, onDeleteMod, onClose }: ModSwitchPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeModId = activeMod?.manifest.id ?? null;

  const handleCardClick = (modId: string | null) => {
    if (modId === activeModId) {
      onClose();
      return;
    }
    onSwitchMod(modId);
    onClose();
  };

  const handleDelete = (modId: string) => {
    setConfirmDeleteId(null);
    onDeleteMod(modId);
  };

  return (
    <DialogShell className="mod-switch-panel" labelId="mod-switch-title" onClose={onClose}>
      <header className="mod-switch-header">
        <h2 id="mod-switch-title">{t('ui.modSwitch.title')}</h2>
        <button type="button" className="text-button" onClick={onClose}>
          {t('ui.modSwitch.close')}
        </button>
      </header>

      <div className="mod-switch-body">
        <div className="mod-switch-grid">
          <button
            type="button"
            className={`mod-switch-card${activeModId === null ? ' mod-switch-card--active' : ''}`}
            onClick={() => handleCardClick(null)}
          >
            <img src={defaultPetImage} alt="" aria-hidden="true" className="mod-switch-card__thumb" />
            <div className="mod-switch-card__info">
              <strong className="mod-switch-card__name">{t('ui.modSwitch.defaultTitle')}</strong>
              <span className="mod-switch-card__meta">{t('ui.modSwitch.defaultSummary')}</span>
            </div>
            {activeModId === null && <span className="mod-switch-card__badge">{t('ui.modSwitch.active')}</span>}
          </button>

          {storedMods.map((mod) => (
            <div key={mod.id} className="mod-switch-card-wrapper">
              <button
                type="button"
                className={`mod-switch-card${activeModId === mod.id ? ' mod-switch-card--active' : ''}`}
                onClick={() => handleCardClick(mod.id)}
              >
                <img
                  src={mod.contentImageUrl ?? defaultPetImage}
                  alt=""
                  aria-hidden="true"
                  className="mod-switch-card__thumb"
                />
                <div className="mod-switch-card__info">
                  <strong className="mod-switch-card__name">{mod.name}</strong>
                  <span className="mod-switch-card__meta">v{mod.version}</span>
                  {mod.fileName && <span className="mod-switch-card__path">{mod.fileName}</span>}
                </div>
                <span className="mod-switch-card__source">{mod.isBuiltin ? t('ui.modSwitch.sourceBuiltin') : t('ui.modSwitch.sourceImported')}</span>
                {activeModId === mod.id && <span className="mod-switch-card__badge">{t('ui.modSwitch.active')}</span>}
              </button>
              {activeModId !== mod.id && !mod.isBuiltin && (
                <button
                  type="button"
                  className="mod-switch-card__delete"
                  aria-label={t('ui.modSwitch.deleteMod', { name: mod.name })}
                  title={t('ui.modSwitch.deleteMod', { name: mod.name })}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirmDeleteId === mod.id) {
                      handleDelete(mod.id);
                    } else {
                      setConfirmDeleteId(mod.id);
                    }
                  }}
                  onBlur={() => setConfirmDeleteId(null)}
                >
                  {confirmDeleteId === mod.id ? t('ui.modSwitch.confirmDelete') : <Trash2 size={16} aria-hidden="true" />}
                </button>
              )}
            </div>
          ))}
        </div>

        <label className="mod-switch-import">
          <PackagePlus size={22} aria-hidden="true" />
          <span>{t('ui.modSwitch.importMod')}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={onImportMod}
            hidden
          />
        </label>
      </div>
    </DialogShell>
  );
};

export type { StoredModInfo };
