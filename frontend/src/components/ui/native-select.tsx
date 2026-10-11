import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { fieldControl } from './field-styles';

// Preserve native keyboard, mobile picker and required-field behavior.
export const NativeSelect = forwardRef<
  HTMLSelectElement,
  ComponentPropsWithoutRef<'select'>
>(({ className, children, ...props }, ref) => (
  <div data-slot="native-select-wrapper" className="relative w-full min-w-0">
    <select
      ref={ref}
      data-slot="native-select"
      className={cn(fieldControl, 'h-11 appearance-none pr-9', className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
    />
  </div>
));
NativeSelect.displayName = 'NativeSelect';
