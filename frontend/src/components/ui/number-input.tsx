import { useEffect, useRef, type InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from './input';
import {
  isNumericDraft,
  numericError,
  type NumericRules,
} from '../../lib/numeric-input';

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'min' | 'max'
> &
  NumericRules & {
    value: string;
    onValueChange: (value: string) => void;
  };

// Text input keeps invalid signs/exponents out of controlled state, including paste.
// Native constraint validation and submit-time validation enforce the actual range.
export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  decimals = 0,
  ...props
}: NumberInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  useEffect(() => {
    ref.current?.setCustomValidity(
      value ? t(numericError(value, { min, max, decimals })) : '',
    );
  }, [value, min, max, decimals, t]);
  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode={decimals === 0 ? 'numeric' : 'decimal'}
      value={value}
      onChange={(event) => {
        const next =
          decimals === 2
            ? event.target.value.replace(',', '.')
            : event.target.value;
        if (isNumericDraft(next, decimals)) onValueChange(next);
      }}
    />
  );
}
