import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { trackEvent, trackLessonCompleted } from './analytics'

const track = vi.fn()

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('window', { plausible: track })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('keeps onboarding working when the tracker is unavailable', () => {
    vi.stubGlobal('window', {})

    expect(() => trackEvent('Onboarding Started')).not.toThrow()
  })

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
