import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  styled,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * Modal props
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  showConfirm?: boolean;
  showCancel?: boolean;
  fullScreen?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  confirmDisabled?: boolean;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

/**
 * Styled components
 */
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: theme.spacing(1),
}));

/**
 * Modal component
 * A wrapper around Material-UI Dialog with confirm/cancel actions
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  showConfirm = true,
  showCancel = true,
  fullScreen = false,
  maxWidth = 'sm',
  confirmDisabled = false,
  confirmColor = 'primary',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen || isMobile}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby="modal-title"
    >
      {title && (
        <StyledDialogTitle id="modal-title">
          {title}
          <IconButton
            aria-label="fermer"
            onClick={onClose}
            edge="end"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>
      )}

      <DialogContent dividers>{children}</DialogContent>

      {(showConfirm || showCancel) && (
        <DialogActions>
          {showCancel && (
            <Button onClick={onClose} color="inherit">
              {cancelText}
            </Button>
          )}
          {showConfirm && (
            <Button
              onClick={handleConfirm}
              variant="contained"
              color={confirmColor}
              disabled={confirmDisabled}
              autoFocus
            >
              {confirmText}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

/**
 * Confirmation modal
 */
export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmColor = 'primary',
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmColor={confirmColor}
      maxWidth="xs"
    >
      <p>{message}</p>
    </Modal>
  );
};

/**
 * Delete confirmation modal
 */
export interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  itemName = 'cet élément',
}) => {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirmer la suppression"
      message={`Êtes-vous sûr de vouloir supprimer ${itemName} ? Cette action est irréversible.`}
      confirmText="Supprimer"
      cancelText="Annuler"
      confirmColor="error"
    />
  );
};

export default Modal;
