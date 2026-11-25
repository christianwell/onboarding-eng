// Reviewed snapshot, not a live connection. Only publish approved aggregate data.
// null means unavailable, never zero. Do not infer community outcomes from visits.
export const boardSnapshot = '2026-11-14'
// Launch investigation: Orchard production created 2026-09-04T17:14:21.670Z;
// custom domain + runtime verified Sep 5, then /health.html returned HTTP 200.
// Source: https://ampcode.com/threads/T-01a06e3d-278c-719a-9b5f-e64f9ca90090
// Public corroboration: GitHub deployment 6279452831 succeeded Sep 5 09:34:09Z;
// commit dba7a78 explicitly configures welcome.hackclub.com. Neither timestamp
// proves the exact first public response, so only a qualified month is marked.
export const launchMonth = '2026-09'
export const nemoRevision = 'b7c0d9d5ee7c616ebca764e2a9676190604c9722'
export const nemoSource = `https://github.com/hackclub/nemo/blob/${nemoRevision}`

export const boardMetrics = [
  { key: 'members', label: 'New members', unit: 'members', definition: 'Nemo monthly cohort members: non-bots with a known cohort_at, excluding pending invites.', source: 'warehouse/models/marts/mart_monthly_cohorts.sql' },
  { key: 'postedWithin30d', label: 'Posted within 30 days', unit: 'members', definition: 'Members whose first observed post is within 30 days of cohort_at. Show the count alongside the cohort size; missing history is not proof of inactivity.', source: 'warehouse/models/marts/mart_monthly_cohorts.sql' },
  { key: 'retainedDay30Rate', label: 'Day-30 retention', unit: '%', definition: 'Among first posters who posted within 30 days of joining and have day-30 coverage, the share active on days 23–30 after their first post. This is not retention of all signups.', source: 'warehouse/models/marts/mart_cohort_retention.sql' },
  { key: 'guideCompletions', label: 'Onboarding Completed', unit: 'events', definition: 'Plausible full_guide completion events, not unique people or confirmed Slack signups. Current lifecycle instrumentation was merged on 7 Nov 2026; older event definitions need reconciliation.', source: null },
] as const

type MetricKey = typeof boardMetrics[number]['key']
export type BoardMonth = { month: string; values: Record<MetricKey, number | null> }

// January–November 2026 is the chosen historical comparison window for this
// snapshot. Nemo requires authenticated analytics access; no aggregate export
// was available. Do not substitute repository fixtures or screenshot figures.
export const boardMonths: BoardMonth[] = Array.from({ length: 11 }, (_, index) => ({
  month: `2026-${String(index + 1).padStart(2, '0')}`,
  values: { members: null, postedWithin30d: null, retainedDay30Rate: null, guideCompletions: null },
}))

export function boardPeriod(month: string) {
  return month < launchMonth ? 'Before' : month === launchMonth ? 'Launch month · mixed' : 'After'
}
