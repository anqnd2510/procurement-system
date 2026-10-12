// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { i18n } from '../i18n';
import { NotificationProvider, useNotifications } from './NotificationProvider';

afterEach(() => {
  cleanup();
  void i18n.changeLanguage('en');
});

function NotificationActions() {
  const { confirm, notify } = useNotifications();
  const [answer, setAnswer] = useState('');
  return (
    <>
      <button onClick={() => notify('success', 'Saved successfully.')}>
        Toast
      </button>
      <button
        onClick={async () =>
          setAnswer(
            (await confirm({
              title: 'Delete item?',
              description: 'This action cannot be undone.',
              confirmLabel: 'Delete',
              destructive: true,
            }))
              ? 'confirmed'
              : 'cancelled',
          )
        }
      >
        Confirm
      </button>
      <span>{answer}</span>
    </>
  );
}

describe('shared notifications', () => {
  it('shows and dismisses a styled application toast', () => {
    render(
      <NotificationProvider>
        <NotificationActions />
      </NotificationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toast' }));
    expect(screen.getByRole('status').textContent).toContain(
      'Saved successfully.',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    expect(screen.queryByText('Saved successfully.')).toBeNull();
  });

  it('resolves the shared confirmation dialog from its visible actions', async () => {
    render(
      <NotificationProvider>
        <NotificationActions />
      </NotificationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.getByRole('dialog').textContent).toContain(
      'This action cannot be undone.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('confirmed')).toBeTruthy();
  });
});
