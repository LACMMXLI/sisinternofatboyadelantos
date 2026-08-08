/**
 * Vocabulario de periodos y lotes de nómina (§7.6).
 */
export const PAYROLL_BATCH_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'LOCKED',
  'APPLIED',
  'CLOSED',
  'REOPENED',
] as const;
export type PayrollBatchStatus = (typeof PAYROLL_BATCH_STATUSES)[number];

export const PAYROLL_PERIOD_FREQUENCIES = ['WEEKLY', 'BIWEEKLY'] as const;
export type PayrollPeriodFrequency = (typeof PAYROLL_PERIOD_FREQUENCIES)[number];
