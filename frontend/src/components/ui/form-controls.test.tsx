// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { NativeSelect } from './native-select';

afterEach(cleanup);

describe('Shared shadcn form controls', () => {
  it('forwards refs and native input constraints without replacing consumer classes', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Input
        ref={ref}
        aria-label="Email"
        type="email"
        required
        disabled
        className="w-32"
        aria-invalid
      />,
    );
    expect(ref.current).toBe(screen.getByLabelText('Email'));
    expect(ref.current?.type).toBe('email');
    expect(ref.current?.required).toBe(true);
    expect(ref.current?.disabled).toBe(true);
    expect(ref.current?.getAttribute('aria-invalid')).toBe('true');
    expect(ref.current?.className).toContain('w-32');
    expect(ref.current?.className.split(' ')).not.toContain('w-full');
  });
  it('preserves textarea max length, required state and field semantics', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(
      <Textarea ref={ref} aria-label="Reason" required maxLength={1000} />,
    );
    expect(ref.current?.maxLength).toBe(1000);
    expect(ref.current?.checkValidity()).toBe(false);
    fireEvent.change(screen.getByLabelText('Reason'), {
      target: { value: 'Outside budget' },
    });
    expect(ref.current?.checkValidity()).toBe(true);
  });
  it('keeps native select labels, form values, validation and change events', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <form aria-label="Settings">
        <label>
          Department
          <NativeSelect name="departmentId" ref={ref} required defaultValue="">
            <option value="">Choose</option>
            <option value="it">IT</option>
          </NativeSelect>
        </label>
      </form>,
    );
    expect(ref.current?.checkValidity()).toBe(false);
    fireEvent.change(screen.getByLabelText('Department'), {
      target: { value: 'it' },
    });
    expect(ref.current?.checkValidity()).toBe(true);
    expect(
      new FormData(screen.getByRole('form') as HTMLFormElement).get(
        'departmentId',
      ),
    ).toBe('it');
  });
});
