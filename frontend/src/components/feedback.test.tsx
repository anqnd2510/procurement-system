// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { i18n } from '../i18n';
import { ErrorMessage, ErrorState, Button } from './ui';
import { NumberInput } from './ui/number-input';
import { NotFoundPage } from '../pages/NotFoundPage';

afterEach(() => {
  cleanup();
  void i18n.changeLanguage('en');
});

describe('Recovery and numeric input UX', () => {
  it('renders a record 404 as neutral feedback with a working back action', () => {
    const back = vi.fn();
    render(
      <ErrorState
        error={new ApiError('Purchase request not found', 404)}
        onBack={back}
      />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(
      'not found in your workspace',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
    expect(back).toHaveBeenCalledOnce();
  });
  it('does not disguise a missing endpoint as an empty collection', () => {
    render(
      <ErrorState error={new ApiError('Cannot GET /dashboard/summary', 404)} />,
    );
    expect(screen.getByRole('status').textContent).toContain(
      'not available in this workspace yet',
    );
    expect(screen.queryByText('No data')).toBeNull();
  });
  it.each([403, 500])('keeps %s failures visible as real alerts', (status) => {
    render(<ErrorState error={new ApiError('Failure', status)} />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
  it('also handles 404s neutrally in mutation forms', () => {
    render(
      <ErrorMessage error="This record was not found in your workspace." />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('localizes the missing-page screen and provides an SPA link', async () => {
    await i18n.changeLanguage('vi');
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading').textContent).toBe(
      'Không tìm thấy trang',
    );
    expect(screen.getByRole('link').getAttribute('href')).toBe('/');
  });
  it('defaults buttons to non-submitting actions and retains loading labels', () => {
    render(<Button loading>Save changes</Button>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
    expect(screen.getByRole('button').textContent).toContain('Save changes');
  });
  it('blocks negative pasted numbers, exponents and extra decimal digits', () => {
    function Field() {
      const [value, setValue] = useState('');
      return (
        <NumberInput
          aria-label="Amount"
          value={value}
          onValueChange={setValue}
          min={0.01}
          max={100}
          decimals={2}
          required
        />
      );
    }
    render(<Field />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    for (const value of ['-1', '1e4', '5.555']) {
      fireEvent.change(input, { target: { value } });
      expect(input.value).toBe('');
    }
    fireEvent.change(input, { target: { value: '20,50' } });
    expect(input.value).toBe('20.50');
    expect(input.checkValidity()).toBe(true);
    fireEvent.change(input, { target: { value: '0' } });
    expect(input.checkValidity()).toBe(false);
    fireEvent.change(input, { target: { value: '101' } });
    expect(input.checkValidity()).toBe(false);
  });
});
