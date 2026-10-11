import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { cn } from '../../lib/cn';
import { fieldControl } from './field-styles';

// shadcn/ui's Command + Popover composition, using the workspace theme tokens.
export const Command = forwardRef<
  ElementRef<typeof CommandPrimitive>,
  ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex min-h-0 flex-col bg-surface text-ink', className)}
    {...props}
  />
));
Command.displayName = 'Command';

export const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand/30">
    <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        fieldControl,
        'h-12 rounded-none border-0 px-0 shadow-none focus-visible:ring-0',
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

export const CommandList = forwardRef<
  ElementRef<typeof CommandPrimitive.List>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-py-1 p-1',
      className,
    )}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

export const CommandItem = forwardRef<
  ElementRef<typeof CommandPrimitive.Item>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-base outline-none select-none data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-800 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 dark:data-[selected=true]:bg-blue-950 dark:data-[selected=true]:text-blue-100',
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';
