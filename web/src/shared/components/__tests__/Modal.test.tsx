import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal, ConfirmModal, DeleteConfirmModal } from '../Modal';

describe('Modal Component', () => {
  describe('Basic Modal', () => {
    it('renders when open is true', () => {
      render(
        <Modal open={true} onClose={jest.fn()}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(
        <Modal open={false} onClose={jest.fn()}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <Modal open={true} onClose={jest.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(
        <Modal open={true} onClose={onClose} title="Test">
          <p>Content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('fermer');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(
        <Modal open={true} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );

      const cancelButton = screen.getByText('Annuler');
      fireEvent.click(cancelButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm and onClose when confirm button is clicked', () => {
      const onClose = jest.fn();
      const onConfirm = jest.fn();
      render(
        <Modal open={true} onClose={onClose} onConfirm={onConfirm}>
          <p>Content</p>
        </Modal>
      );

      const confirmButton = screen.getByText('Confirmer');
      fireEvent.click(confirmButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders custom button text', () => {
      render(
        <Modal
          open={true}
          onClose={jest.fn()}
          confirmText="Save"
          cancelText="Close"
        >
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('hides confirm button when showConfirm is false', () => {
      render(
        <Modal open={true} onClose={jest.fn()} showConfirm={false}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.queryByText('Confirmer')).not.toBeInTheDocument();
    });

    it('hides cancel button when showCancel is false', () => {
      render(
        <Modal open={true} onClose={jest.fn()} showCancel={false}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.queryByText('Annuler')).not.toBeInTheDocument();
    });

    it('disables confirm button when confirmDisabled is true', () => {
      render(
        <Modal open={true} onClose={jest.fn()} confirmDisabled={true}>
          <p>Content</p>
        </Modal>
      );
      const confirmButton = screen.getByText('Confirmer');
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('ConfirmModal', () => {
    it('renders with title and message', () => {
      render(
        <ConfirmModal
          open={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Confirm Action"
          message="Are you sure?"
        />
      );
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('calls onConfirm when confirmed', () => {
      const onConfirm = jest.fn();
      render(
        <ConfirmModal
          open={true}
          onClose={jest.fn()}
          onConfirm={onConfirm}
          title="Test"
          message="Test message"
        />
      );

      const confirmButton = screen.getByText('Confirmer');
      fireEvent.click(confirmButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('DeleteConfirmModal', () => {
    it('renders with default message', () => {
      render(
        <DeleteConfirmModal
          open={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );
      expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
      expect(
        screen.getByText(/Êtes-vous sûr de vouloir supprimer/)
      ).toBeInTheDocument();
    });

    it('renders with custom item name', () => {
      render(
        <DeleteConfirmModal
          open={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          itemName="la prescription"
        />
      );
      expect(
        screen.getByText(/supprimer la prescription/)
      ).toBeInTheDocument();
    });

    it('calls onConfirm when delete is confirmed', () => {
      const onConfirm = jest.fn();
      render(
        <DeleteConfirmModal
          open={true}
          onClose={jest.fn()}
          onConfirm={onConfirm}
        />
      );

      const deleteButton = screen.getByText('Supprimer');
      fireEvent.click(deleteButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
