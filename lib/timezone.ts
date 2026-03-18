const DEFAULT_APP_TIME_ZONE = "America/Merida"

type DateInput = Date | string | number

export function getAppTimeZone(): string {
  return process.env.NEXT_PUBLIC_APP_TIMEZONE || DEFAULT_APP_TIME_ZONE
}

function toValidDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function extractParts(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  timeZone: string
): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-US", { ...options, timeZone }).formatToParts(date)
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value
    }
    return acc
  }, {})
}

export function formatYmdInTimeZone(value: DateInput, timeZone = getAppTimeZone()): string {
  const date = toValidDate(value)
  if (!date) return ""

  const parts = extractParts(
    date,
    { year: "numeric", month: "2-digit", day: "2-digit" },
    timeZone
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatHmInTimeZone(value: DateInput, timeZone = getAppTimeZone()): string {
  const date = toValidDate(value)
  if (!date) return ""

  const parts = extractParts(
    date,
    { hour: "2-digit", minute: "2-digit", hour12: false },
    timeZone
  )

  return `${parts.hour}:${parts.minute}`
}

export function formatDateTimeLongInTimeZone(value: DateInput, timeZone = getAppTimeZone()): string {
  const date = toValidDate(value)
  if (!date) return "-"

  const fecha = new Intl.DateTimeFormat("es-MX", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)

  const hora = new Intl.DateTimeFormat("es-MX", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)

  return `${fecha} · ${hora} hrs`
}

export function getTodayYmdInTimeZone(timeZone = getAppTimeZone()): string {
  return formatYmdInTimeZone(new Date(), timeZone)
}

function parseYmdAsUtcDate(ymd: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

function formatUtcDateAsYmd(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function startOfWeekYmd(ymd: string): string {
  const date = parseYmdAsUtcDate(ymd)
  if (!date) return ymd

  const dayOfWeek = date.getUTCDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  date.setUTCDate(date.getUTCDate() - diffToMonday)

  return formatUtcDateAsYmd(date)
}

export function startOfMonthYmd(ymd: string): string {
  const date = parseYmdAsUtcDate(ymd)
  if (!date) return ymd

  date.setUTCDate(1)
  return formatUtcDateAsYmd(date)
}

export function addYearsToYmd(ymd: string, years: number): string {
  const date = parseYmdAsUtcDate(ymd)
  if (!date) return ""

  date.setUTCFullYear(date.getUTCFullYear() + years)
  return formatUtcDateAsYmd(date)
}