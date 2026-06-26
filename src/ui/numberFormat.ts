const compactUnits = [
  { value: 1_000_000_000_000, suffix: 'T' },
  { value: 1_000_000_000, suffix: 'B' },
  { value: 1_000_000, suffix: 'M' },
  { value: 1_000, suffix: 'K' },
] as const;

const trimTrailingZero = (value: number) => {
  const text = value.toFixed(1);
  return text.endsWith('.0') ? text.slice(0, -2) : text;
};

export const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0';

  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(Math.trunc(value));
  if (absolute <= 10_000) return `${sign}${absolute}`;

  const unit = compactUnits.find((candidate) => absolute >= candidate.value) ?? compactUnits[compactUnits.length - 1];
  const compactValue = Math.floor((absolute / unit.value) * 10) / 10;
  return `${sign}${trimTrailingZero(compactValue)}${unit.suffix}`;
};
