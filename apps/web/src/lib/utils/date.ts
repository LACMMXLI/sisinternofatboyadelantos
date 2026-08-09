/**
 * Utilidades de fecha para la libreta diaria. La app opera siempre en la
 * zona horaria del negocio (`America/Tijuana`, §2) — nunca se comparan
 * fechas con `toDateString()` del navegador, que usa la zona horaria local
 * del dispositivo y puede diferir de la del negocio.
 */
export const BUSINESS_TIMEZONE = 'America/Tijuana';

/** 'YYYY-MM-DD' tal como se ve ese instante en la zona horaria del negocio. */
export function toBusinessDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Offset en minutos (a sumar a UTC para obtener hora local) de esa fecha en la zona horaria dada. */
function timezoneOffsetMinutes(date: Date, timeZone: string): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60_000;
}

/**
 * Rango [from, to] en UTC que cubre el día calendario `dateKey`
 * ('YYYY-MM-DD') tal como transcurre en `America/Tijuana`, sin depender de
 * la zona horaria del navegador del usuario.
 */
export function businessDayRangeUtc(dateKey: string): { from: Date; to: Date } {
  const [year, month, day] = dateKey.split('-').map(Number);
  const approx = new Date(Date.UTC(year, month - 1, day, 12));
  const offsetMinutes = timezoneOffsetMinutes(approx, BUSINESS_TIMEZONE);
  const from = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMinutes * 60_000);
  const to = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - offsetMinutes * 60_000);
  return { from, to };
}

export function todayBusinessDateKey(): string {
  return toBusinessDateKey(new Date());
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  d.setUTCDate(d.getUTCDate() + days);
  return toBusinessDateKey(d);
}

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  timeZone: BUSINESS_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Fecha completa en español, capitalizada, a partir de una llave 'YYYY-MM-DD'. */
export function formatFullSpanishDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const label = FULL_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day, 12)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const TIME_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  timeZone: BUSINESS_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
});

export function formatBusinessTime(iso: string): string {
  return TIME_FORMATTER.format(new Date(iso));
}
