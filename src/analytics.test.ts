import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOnboardingTracker, trackEvent } from './analytics'

const track = vi.fn()

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('window', { plausible: track })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('keeps onboarding working when the tracker is unavailable', () => {
    vi.stubGlobal('window', {})

    expect(() => {
      const guide = createOnboardingTracker('slack', 'full_guide', 9)
      guide.view()
      guide.start()
      guide.lessonCompleted('dms', 4)
      guide.complete('auth')
      guide.handoff('auth', 'automatic')
    }).not.toThrow()
  })

  it('tracks named funnel events with safe properties', () => {
    trackEvent('Onboarding Started', { program: 'stardance' })

    expect(track).toHaveBeenCalledWith('Onboarding Started', {
      props: { program: 'stardance' },
    })
  })

  it('uses stable goal names for lesson completions', () => {
    const guide = createOnboardingTracker('slack', 'full_guide', 9)
    guide.lessonCompleted('dms', 4)

    expect(track).toHaveBeenCalledWith('Lesson Completed: Direct Messages', {
      props: {
        program: 'slack',
        mode: 'full_guide',
        guide_version: '1',
        lesson: 'dms',
        position: '4',
        total: '9',
      },
    })
  })

  it('tracks the funnel once per attempt and measures time from the first start', () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const guide = createOnboardingTracker('stardance', 'single_lesson', 1)
    guide.view()
    guide.view()
    guide.start()
    clock.mockReturnValue(4500)
    guide.start()
    guide.lessonCompleted('messages', 1)
    guide.lessonCompleted('messages', 1)
    guide.complete('return')
    guide.complete('return')
    clock.mockReturnValue(7000)
    guide.handoff('return', 'click')
    guide.handoff('return', 'automatic')

    const context = { program: 'stardance', mode: 'single_lesson', total: '1', guide_version: '1' }
    expect(track.mock.calls).toEqual([
      ['Onboarding Viewed', { props: context, interactive: false }],
      ['Onboarding Started', { props: context }],
      ['Lesson Completed: Messages', { props: { ...context, lesson: 'messages', position: '1' } }],
      ['Onboarding Completed', { props: { ...context, handoff: 'return', duration_seconds: '3' } }],
      ['Onboarding Handoff Attempted', { props: { ...context, handoff: 'return', method: 'click', duration_seconds: '6' } }],
    ])
  })

  it('counts new attempts independently and distinguishes automatic auth handoffs', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const guide = createOnboardingTracker('slack', 'full_guide', 9)
      guide.view()
      guide.start()
      guide.complete('auth')
      guide.handoff('auth', 'automatic')
    }

    expect(track.mock.calls.filter(([name]) => name === 'Onboarding Viewed')).toHaveLength(2)
    expect(track.mock.calls.filter(([name]) => name === 'Onboarding Handoff Attempted')).toEqual(
      Array.from({ length: 2 }, () => ['Onboarding Handoff Attempted', {
        props: {
          program: 'slack', mode: 'full_guide', total: '9', guide_version: '1',
          handoff: 'auth', method: 'automatic', duration_seconds: '0',
        },
      }]),
    )
  })
})
