import { render, screen, fireEvent, within } from '@testing-library/react';
import SetupControls from '@/components/controls/SetupControls';
import { setFormState, useFormStore } from '@/store';

describe('SetupControls — Room', () => {
  beforeEach(() => setFormState({ reverb: 'normal' }));

  it('shows the Room setting and changes it live', () => {
    render(<SetupControls />);
    const room = screen.getByRole('radiogroup', { name: 'Room' });
    expect(within(room).getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['Off', 'Low', 'Normal', 'High']);
    expect(within(room).getByRole('radio', { name: 'Normal' })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(within(room).getByRole('radio', { name: 'High' }));
    expect(useFormStore.getState().reverb).toBe('high');
    expect(within(room).getByRole('radio', { name: 'High' })).toHaveAttribute('aria-checked', 'true');
  });
});
