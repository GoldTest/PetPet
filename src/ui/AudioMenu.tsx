import { Volume2 } from 'lucide-react';
import { t } from '../i18n';
import { DialogShell } from './DialogShell';

interface AudioMenuProps {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  onBgmChange: (value: boolean) => void;
  onSfxChange: (value: boolean) => void;
  onClose: () => void;
}

export const AudioMenu = ({ bgmEnabled, sfxEnabled, onBgmChange, onSfxChange, onClose }: AudioMenuProps) => (
  <DialogShell className="audio-menu" labelId="audio-menu-title" onClose={onClose}>
    <header className="audio-menu__header">
      <div className="dialog-title-group">
        <span className="dialog-title-icon" aria-hidden="true">
          <Volume2 size={20} />
        </span>
        <div>
          <h2 id="audio-menu-title">{t('ui.audio.title')}</h2>
          <p>{t('ui.audio.summary')}</p>
        </div>
      </div>
      <button type="button" className="text-button" onClick={onClose}>
        {t('ui.audio.close')}
      </button>
    </header>
    <div className="audio-menu__options">
      <button
        type="button"
        className="audio-menu__row"
        aria-pressed={bgmEnabled}
        onClick={() => onBgmChange(!bgmEnabled)}
      >
        <span className="audio-menu__copy">
          <strong>{t('ui.audio.bgm')}</strong>
          <small>{t('ui.audio.bgmDesc')}</small>
        </span>
        <span className="audio-menu__switch" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="audio-menu__row"
        aria-pressed={sfxEnabled}
        onClick={() => onSfxChange(!sfxEnabled)}
      >
        <span className="audio-menu__copy">
          <strong>{t('ui.audio.sfx')}</strong>
          <small>{t('ui.audio.sfxDesc')}</small>
        </span>
        <span className="audio-menu__switch" aria-hidden="true" />
      </button>
    </div>
  </DialogShell>
);
