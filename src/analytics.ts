import { LessonId } from './program'

declare global {
  interface Window {
    plausible?: (name: string, options?: { props?: Record<string, string>; interactive?: boolean }) => void
  }
}

const lessonNames: Record<LessonId, string> = {
  channels: 'Channels',
  messages: 'Messages',
  pings: 'Pings',
  dms: 'Direct Messages',
  threads: 'Threads',
  reactions: 'Reactions',
  search: 'Search',
  notifications: 'Notifications',
  huddles: 'Huddles',
  safety: 'Safety',
}

export function trackEvent(name: string, props?: Record<string, string>, options?: { interactive: boolean }) {
  window.plausible?.(name, { props, ...options })
}

// One tracker per loaded guide. Deduplicate lifecycle events within that attempt,
// not across reloads or visits. No visitor identifiers or user input are sent.
export function createOnboardingTracker(program: string, mode: 'full_guide' | 'single_lesson', total: number) {
  const sent = new Set<string>()
  let startedAt: number | undefined
  const context = { program, mode, total: String(total), guide_version: '1' }

  const emit = (name: string, props?: Record<string, string>) => {
    if (sent.has(name)) return
    sent.add(name)
    trackEvent(name, { ...context, ...props }, name === 'Onboarding Viewed' ? { interactive: false } : undefined)
  }
  const elapsed = (): Record<string, string> => startedAt === undefined ? {} : {
    duration_seconds: String(Math.floor((performance.now() - startedAt) / 1000)),
  }

  return {
    view: () => emit('Onboarding Viewed'),
    start: () => {
      if (startedAt === undefined) startedAt = performance.now()
      emit('Onboarding Started')
    },
    lessonCompleted: (lesson: LessonId, position: number) => {
      emit(`Lesson Completed: ${lessonNames[lesson]}`, {
        lesson,
        position: String(position),
      })
    },
    complete: (handoff: 'return' | 'auth') => emit('Onboarding Completed', { handoff, ...elapsed() }),
    handoff: (handoff: 'return' | 'auth', method: 'automatic' | 'click') => {
      emit('Onboarding Handoff Attempted', { handoff, method, ...elapsed() })
    },
  }
}
