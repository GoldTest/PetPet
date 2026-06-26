import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog = ({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => (
  <div className="modal-backdrop modal-backdrop--confirm" role="presentation">
    <section
      className="confirm-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="confirm-modal__icon" aria-hidden="true">
        <AlertTriangle size={28} />
      </div>
      <div className="confirm-modal__copy">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
      </div>
      <div className="confirm-modal__actions">
        <button type="button" className="text-button confirm-modal__cancel" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="danger-button confirm-modal__confirm" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </section>
  </div>
);
