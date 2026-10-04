import { render, screen, fireEvent } from '@testing-library/react';
import ControlsPanel from '@/components/controls/ControlsPanel';

describe('ControlsPanel', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ControlsPanel open onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when something inside already handled Escape (an open picker)', () => {
    const onClose = vi.fn();
    render(<ControlsPanel open onClose={onClose} />);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    event.preventDefault();
    window.dispatchEvent(event);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
  });
});
