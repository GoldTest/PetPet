import { Pause, Play, RotateCcw } from 'lucide-react';
import type { CSSProperties } from 'react';
import { pomodoroPhaseLabels, type PetState, type PomodoroDurations } from '../core/pet';
import { t } from '../i18n';
import { formatPomodoroTime } from './time';

type PomodoroSettingKey = keyof PomodoroDurations;

const pomodoroText = {
  panelAria: t('ui.pomodoro.panelAria'),
  running: t('ui.pomodoro.running'),
  paused: t('ui.pomodoro.paused'),
  roundPrefix: t('ui.pomodoro.roundPrefix'),
  roundSuffix: t('ui.pomodoro.roundSuffix'),
  today: t('ui.pomodoro.today'),
  rounds: t('ui.pomodoro.rounds'),
  start: t('ui.pomodoro.start'),
  pause: t('ui.pomodoro.pause'),
  reset: t('ui.pomodoro.reset'),
  resetTitle: t('ui.pomodoro.resetTitle'),
  settings: t('ui.pomodoro.settings'),
  minutes: t('ui.pomodoro.minutes'),
  roundUnit: t('ui.pomodoro.roundUnit'),
  focus: t('ui.pomodoro.focus'),
  shortBreak: t('ui.pomodoro.shortBreak'),
  statsAria: t('ui.pomodoro.statsAria'),
  description: t('ui.pomodoro.description'),
};

const pomodoroSettingFields: readonly { key: PomodoroSettingKey; label: string; min: number; max: number; unit: string }[] = [
  { key: 'focusMinutes', label: pomodoroText.focus, min: 1, max: 180, unit: pomodoroText.minutes },
  { key: 'shortBreakMinutes', label: pomodoroText.shortBreak, min: 1, max: 60, unit: pomodoroText.minutes },
  { key: 'targetRounds', label: pomodoroText.rounds, min: 1, max: 8, unit: pomodoroText.roundUnit },
];

interface PomodoroOverlayProps {
  pet: PetState;
  progress: number;
  remainingMs: number;
  isActionDisabled: boolean;
  startTitle?: string;
  onToggle: () => void;
  onReset: () => void;
  onSettingChange: (key: PomodoroSettingKey, value: number) => void;
}

export const PomodoroOverlay = ({
  pet,
  progress,
  remainingMs,
  isActionDisabled,
  startTitle,
  onToggle,
  onReset,
  onSettingChange,
}: PomodoroOverlayProps) => (
  <section
    className={pet.pomodoro.isRunning ? 'pomodoro-overlay pomodoro-overlay--running' : 'pomodoro-overlay'}
    aria-label={pomodoroText.panelAria}
    style={{ '--pomodoro-progress': progress + '%' } as CSSProperties}
  >
    <div className="pomodoro-orb">
      <div className="pomodoro-ring" aria-hidden="true" />
      <div className="pomodoro-orb__content">
        <span className="pomodoro-state">{pet.pomodoro.isRunning ? pomodoroText.running : pomodoroText.paused}</span>
        <span className="pomodoro-phase">{pomodoroPhaseLabels[pet.pomodoro.phase]}</span>
        <strong>{formatPomodoroTime(remainingMs)}</strong>
        <div className="pomodoro-controls">
          <button type="button" className="pomodoro-control" disabled={isActionDisabled} title={startTitle} onClick={onToggle}>
            {pet.pomodoro.isRunning ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            <span>{pet.pomodoro.isRunning ? pomodoroText.pause : pomodoroText.start}</span>
          </button>
          <button type="button" className="pomodoro-reset" title={pomodoroText.resetTitle} onClick={onReset}>
            <RotateCcw size={15} aria-hidden="true" />
            <span>{pomodoroText.reset}</span>
          </button>
        </div>
        <div className="pomodoro-meta" aria-label={pomodoroText.statsAria}>
          <span>{pomodoroText.roundPrefix} {pet.pomodoro.round} / {pet.pomodoro.settings.targetRounds} {pomodoroText.roundSuffix}</span>
          <span>{pomodoroText.today} {pet.pomodoro.dailyCompletedFocusCount}</span>
        </div>
      </div>
    </div>

    <p className="pomodoro-description">{pomodoroText.description}</p>

    <div className="pomodoro-settings" aria-label={pomodoroText.settings}>
      {pomodoroSettingFields.map((field) => (
        <label className="pomodoro-setting" key={field.key}>
          <span>{field.label}</span>
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={1}
            value={pet.pomodoro.settings[field.key]}
            onChange={(event) => onSettingChange(field.key, Number(event.currentTarget.value))}
          />
          <small>{field.unit}</small>
        </label>
      ))}
    </div>
  </section>
);
