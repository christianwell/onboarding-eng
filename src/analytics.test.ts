import { beforeEach, describe, expect, it, vi } from 'vitest'
import { track } from '@plausible-analytics/tracker'
import { trackEvent, trackLessonCompleted } from './analytics'

vi.mock('@plausible-analytics/tracker', () => ({
  init: vi.fn(),
  track: vi.fn(),
}))

describe('analytics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tracks named funnel events with safe properties', () => {
    trackEvent('Onboarding Started', { program: 'stardance' })

    expect(track).toHaveBeenCalledWith('Onboarding Started', {
      props: { program: 'stardance' },
    })
  })

  it('uses stable goal names for lesson completions', () => {
    trackLessonCompleted('dms', 'slack', 4, 9)

    expect(track).toHaveBeenCalledWith('Lesson Completed: Direct Messages', {
      props: {
        program: 'slack',
        lesson: 'dms',
        position: '4',
        total: '9',
      },
    })
  })
})
