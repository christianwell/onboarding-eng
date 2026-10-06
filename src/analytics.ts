import { LessonId } from './program'

declare global {
  interface Window {
    plausible?: (name: string, options?: { props?: Record<string, string> }) => void
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
  safety: 'Safety',
}

export function trackEvent(name: string, props?: Record<string, string>) {
  window.plausible?.(name, { props })
}

export function trackLessonCompleted(lesson: LessonId, program: string, position: number, total: number) {
  trackEvent(`Lesson Completed: ${lessonNames[lesson]}`, {
    program,
    lesson,
    position: String(position),
    total: String(total),
  })
}
