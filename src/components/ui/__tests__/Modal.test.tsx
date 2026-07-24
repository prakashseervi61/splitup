import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/ui/Modal';

function renderModal(open = true, onClose = vi.fn(), title = 'Test Modal') {
  return render(
    <Modal open={open} onClose={onClose} title={title}>
      <p>Modal content</p>
    </Modal>
  );
}

describe('Modal', () => {
  it('renders children when open', () => {
    renderModal();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders title', () => {
    renderModal();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('returns null when not open', () => {
    renderModal(false);
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('has role="dialog"', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-label matching title', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Test Modal');
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    renderModal(true, onClose);
    const innerDiv = screen.getByRole('dialog').querySelector('[tabindex="-1"]');
    fireEvent.keyDown(innerDiv!, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderModal(true, onClose);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    renderModal(true, onClose);
    const innerDiv = screen.getByRole('dialog').querySelector('[tabindex="-1"]');
    fireEvent.click(innerDiv!);
    expect(onClose).not.toHaveBeenCalled();
  });
});
