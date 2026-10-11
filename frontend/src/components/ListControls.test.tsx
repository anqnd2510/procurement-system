// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { i18n } from '../i18n';
import {
  ListFilter,
  ListPagination,
  ListSearch,
  ListToolbar,
} from './ListControls';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});
afterEach(cleanup);

describe('shared list controls', () => {
  it('uses a labelled search field with a clear action', () => {
    const onChange = vi.fn();
    render(
      <ListToolbar>
        <ListSearch
          label="Search products"
          placeholder="Search by name or SKU…"
          value="mouse"
          onChange={onChange}
        />
      </ListToolbar>,
    );
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Search products',
        }) as HTMLInputElement
      ).value,
    ).toBe('mouse');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('offers explicit filter choices, including all', () => {
    const onChange = vi.fn();
    render(
      <ListFilter
        label="Status"
        allLabel="All statuses"
        value=""
        options={[{ value: 'DRAFT', label: 'DRAFT' }]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'DRAFT' },
    });
    expect(onChange).toHaveBeenCalledWith('DRAFT');
  });

  it('shows record range and navigates pages without full reload', () => {
    const onPageChange = vi.fn();
    render(
      <ListPagination
        meta={{
          page: 2,
          limit: 10,
          total: 53,
          totalPages: 6,
          hasNext: true,
          hasPrev: true,
        }}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText('Showing 11–20 of 53 records')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables navigation while placeholder data is shown', () => {
    render(
      <ListPagination
        meta={{
          page: 2,
          limit: 10,
          total: 53,
          totalPages: 6,
          hasNext: true,
          hasPrev: true,
        }}
        onPageChange={vi.fn()}
        busy
      />,
    );
    expect(
      (screen.getByRole('button', { name: 'Next page' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
