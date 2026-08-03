const NOT_AVAILABLE = 'Not available'

const localDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const localDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function buildLocalDate(year: number, month: number, day: number): Date | null {
  const date = new Date(0)
  date.setHours(0, 0, 0, 0)
  date.setFullYear(year, month - 1, day)

  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    ? date
    : null
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  return buildLocalDate(Number(match[1]), Number(match[2]), Number(match[3]))
}

function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?$/.exec(value)
  if (!match) {
    return null
  }

  const date = buildLocalDate(Number(match[1]), Number(match[2]), Number(match[3]))
  if (date === null) {
    return null
  }

  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = match[6] === undefined ? 0 : Number(match[6])
  if (hour > 23 || minute > 59 || second > 59) {
    return null
  }

  date.setHours(hour, minute, second, 0)
  return date
}

export function formatLocalDate(value: string | null | undefined): string {
  if (!value) {
    return NOT_AVAILABLE
  }

  const date = parseLocalDate(value)
  return date === null ? NOT_AVAILABLE : localDateFormatter.format(date)
}

export function formatLocalDateTime(value: string | null | undefined): string {
  if (!value) {
    return NOT_AVAILABLE
  }

  const date = parseLocalDateTime(value)
  return date === null ? NOT_AVAILABLE : localDateTimeFormatter.format(date)
}

export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isInteger(minutes) || minutes < 0) {
    return NOT_AVAILABLE
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes} min`
  }
  if (remainingMinutes === 0) {
    return `${hours} hr`
  }
  return `${hours} hr ${remainingMinutes} min`
}
