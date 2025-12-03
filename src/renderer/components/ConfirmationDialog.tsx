import React from 'react';
import { useNotification } from '../context/NotificationContext';

export const ConfirmationDialog: React.FC = () => {
  const { confirmationState, hideConfirmation } = useNotification();

  if (!confirmationState) {
    return null;
  }

  const handleConfirm = () => {
    confirmationState.onConfirm();
    hideConfirmation();
  };

  const handleCancel = () => {
    if (confirmationState.onCancel) {
      confirmationState.onCancel();
    }
    hideConfirmation();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-content">
          <span className="confirmation-icon">⚠</span>
          <p className="confirmation-message">{confirmationState.message}</p>
        </div>
        <div className="confirmation-footer">
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            {confirmationState.cancelText || 'Cancel'}
          </button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm}>
            {confirmationState.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
