function parseLocalDate(dateValue: string): Date {
  const [year, month, day] = dateValue.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatAnalyticsDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseLocalDate(dateValue))
}

export function formatAnalyticsShortDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(parseLocalDate(dateValue))
}

export function formatAnalyticsNumber(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString(undefined, { maximumFractionDigits })
}

export function formatAnalyticsValue(
  value: number | null,
  unit: string,
  maximumFractionDigits = 2,
): string {
  return value === null ? 'Not available' : `${formatAnalyticsNumber(value, maximumFractionDigits)}${unit}`
}
