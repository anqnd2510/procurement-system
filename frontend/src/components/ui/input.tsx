import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
import { fieldControl } from './field-styles';

// shadcn/ui Input, adapted for React 18 refs and comfortable internal-tool sizing.
export const Input = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<'input'>
>(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    data-slot="input"
    className={cn(
      fieldControl,
      'flex h-11 read-only:bg-slate-50 dark:read-only:bg-slate-900 file:border-0 file:bg-transparent file:text-sm file:font-medium',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
