import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
import { fieldControl } from './field-styles';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentPropsWithoutRef<'textarea'>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    data-slot="textarea"
    className={cn(fieldControl, 'flex min-h-24 resize-y', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
