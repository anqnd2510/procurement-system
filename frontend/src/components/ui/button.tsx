import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { localizeReactNode } from '../../lib/localize-react-node';

export const buttonVariants = cva('button', {
  variants: {
    variant: {
      primary: 'button-primary',
      secondary: 'button-secondary',
      ghost: 'button-ghost',
      danger: 'button-danger',
    },
    size: {
      default: '',
      small: 'button-small',
      icon: 'button-icon',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    asChild?: boolean;
  };

export function Button({
  children,
  variant,
  size,
  loading = false,
  asChild = false,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  const { t } = useTranslation();
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || disabled}
      type={asChild ? undefined : type}
      {...props}
    >
      {asChild ? (
        localizeReactNode(children, (key) => t(key))
      ) : (
        <>
          {loading && (
            <LoaderCircle size={16} className="spin" aria-hidden="true" />
          )}
          {localizeReactNode(children, (key) => t(key))}
        </>
      )}
    </Component>
  );
}
