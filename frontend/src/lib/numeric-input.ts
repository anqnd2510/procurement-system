export interface NumericRules {
  min: number;
  max?: number;
  decimals?: 0 | 2;
}

export function isNumericDraft(value: string, decimals: 0 | 2 = 0) {
  return (decimals === 0 ? /^\d*$/ : /^\d*(?:\.\d{0,2})?$/).test(value);
}

export function numericError(
  value: string,
  { min, max, decimals = 0 }: NumericRules,
) {
  if (!value.trim() || value === '.' || !isNumericDraft(value, decimals)) {
    return decimals === 0
      ? 'Enter a whole number.'
      : 'Enter a number with up to two decimal places.';
  }
  const number = Number(value);
  if (!Number.isFinite(number) || (max !== undefined && number > max)) {
    return 'The number exceeds the supported limit.';
  }
  if (number < min) {
    return min === 0
      ? 'The amount cannot be negative.'
      : 'The value must be greater than zero.';
  }
  return '';
}
