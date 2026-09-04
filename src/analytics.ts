import { init, track } from '@plausible-analytics/tracker'
import { LessonId } from './program'

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

export function initAnalytics() {
  init({ domain: window.location.hostname })
}

export function trackEvent(name: string, props?: Record<string, string>) {
  track(name, { props })
}

export function trackLessonCompleted(lesson: LessonId, program: string, position: number, total: number) {
  trackEvent(`Lesson Completed: ${lessonNames[lesson]}`, {
    program,
    lesson,
    position: String(position),
    total: String(total),
  })
}
