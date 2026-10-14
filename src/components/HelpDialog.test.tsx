import { render, screen, fireEvent, within } from '@testing-library/react';
import HelpDialog from '@/components/HelpDialog';
import { PHRASE_MODE_GROUPS, SCALE_GROUPS, TEMPO } from '@/constants';
import { SOUND_GROUPS } from '@/components/controls/options';

describe('HelpDialog', () => {
  it('covers every part of the app, one section per topic', () => {
    render(<HelpDialog open onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: 'Help' });
    const topics = within(screen.getByRole('navigation', { name: 'Help topics' }))
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(topics).toEqual([
      'Key and scale', 'The neck', 'Playing', 'Following along', 'Positions',
      'Chords', 'Settings', 'Keyboard', 'Saving and sharing',
    ]);
    // Every topic links to a section with that heading
    topics.forEach((topic) => expect(within(dialog).getByRole('heading', { name: topic! })).toBeInTheDocument());
  });

  it('counts what the catalogs actually hold', () => {
    render(<HelpDialog open onClose={() => {}} />);
    const text = screen.getByRole('dialog', { name: 'Help' }).textContent;
    const count = (groups: ReadonlyArray<{ length: number }>) => groups.reduce((n, g) => n + g.length, 0);
    expect(text).toContain(`${count(SCALE_GROUPS.map((g) => g.scales))} scales`);
    expect(text).toContain(`${count(PHRASE_MODE_GROUPS.map((g) => g.modes))} ways through the scale`);
    expect(text).toContain(`${count(SOUND_GROUPS.map((g) => g.options))} instruments`);
    expect(text).toContain(`${TEMPO.MIN} to ${TEMPO.MAX} bpm`);
  });

  it('closes on Escape and from its close button', () => {
    const onClose = vi.fn();
    render(<HelpDialog open onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('takes focus when it opens, and is inert while closed', () => {
    const { rerender } = render(<HelpDialog open={false} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    // Not built until it's first wanted
    expect(dialog.textContent).not.toContain('Key and scale');
    rerender(<HelpDialog open onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Close help' })).toHaveFocus();
    rerender(<HelpDialog open={false} onClose={() => {}} />);
    expect(dialog.textContent).toContain('Key and scale');
  });
});
