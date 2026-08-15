const groupedNumber = new Intl.NumberFormat('en-US');

/** Thousands-separated integer, e.g. 1234567 -> "1,234,567". */
export const formatNumber = (value: number): string => groupedNumber.format(value);

export const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  `${formatNumber(count)} ${count === 1 ? singular : plural}`;
