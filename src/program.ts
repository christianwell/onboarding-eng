import { parse } from 'yaml'

export const lessonIds = [
  'channels',
  'messages',
  'pings',
  'dms',
  'threads',
  'reactions',
  'search',
  'notifications',
  'safety',
] as const

export type LessonId = (typeof lessonIds)[number]

export interface LessonCopy {
  eyebrow: string
  title: string
  body: string
  task: string
  hint: string
}

// Reviewed human-authored copy from PR #1. Program configs may override any lesson.
export const defaultLessonCopy: Record<LessonId, LessonCopy> = {
  channels: {
    eyebrow: 'Find your place',
    title: 'Channels keep conversations organized',
    body: 'Every channel has a topic. Program channels are where you ask questions; community channels help you find people who build what you build.',
    task: 'Open the sidebar, then choose #stardance.',
    hint: 'Look in the flat “Channels” list.',
  },
  messages: {
    eyebrow: 'Say hello',
    title: 'Send your first message',
    body: 'Messages in public channels can be seen by everyone there. Be specific, kind, and give people enough context to respond.',
    task: 'Introduce yourself in #stardance.',
    hint: 'Try: “Hey! I\'m new here, what is this channel about?”',
  },
  threads: {
    eyebrow: 'Keep it organized',
    title: 'Replies belong in threads',
    body: 'A thread keeps a side conversation attached to its original message, so the channel stays easy to scan. Replies in a thread should stay within the topic of the original message.',
    task: 'Open Nova’s thread and send a reply.',
    hint: 'Click “2 replies” below Nova’s message.',
  },
  reactions: {
    eyebrow: 'Respond quickly',
    title: 'Reactions say a lot without noise',
    body: 'Reactions are a great way to communicate without adding more messages, and the Hack Club slack has plenty of custom emojis to react with!',
    task: 'Add a ⭐ reaction to a project update.',
    hint: 'Click the smile-plus button on Nova’s message.',
  },
  pings: {
    eyebrow: 'Ping with care',
    title: 'Ping only when necessary',
    body: 'Choosing someone from the @ menu sends them a notification. Ping a person when they need to see the message!',
    task: 'Use the @ button to choose Nova, then send them a helpful message.',
    hint: 'Choose the @ button below the message box, then select Nova from the menu.',
  },
  dms: {
    eyebrow: 'Talk privately',
    title: 'Send Christian a direct message',
    body: 'DMs are private conversations between the people included. They’re useful for personal details or a quick one-to-one question.',
    task: 'Use Search Hack Club to find Christian and open their account.',
    hint: 'Click the search bar at the top and type “Christian”.',
  },
  search: {
    eyebrow: 'Find anything',
    title: 'Search before asking again',
    body: 'The Slack has a lot of messages, a lot of them are answers to questions you may have, so you shouold always use the search feature to make sure your question hasn\'t been answered already.',
    task: 'Search for “hardware help”.',
    hint: 'Use the search bar at the very top.',
  },
  notifications: {
    eyebrow: 'Customize your pings',
    title: 'Make notifications work for you',
    body: 'Busy channels move fast. Setting your notifications to “Mentions & DMs” keeps important pings while letting you catch up on channels when you choose!',
    task: 'Set notifications to “Mentions & DMs”.',
    hint: 'Open the bell in the channel header.',
  },
  safety: {
    eyebrow: 'Keep Hack Club kind',
    title: 'Know what to do when something feels wrong',
    body: 'Hack Club holds everyone to a high standard. Don’t engage with harassment or share private information. The moderation team can help.',
    task: 'Choose the safest response to finish your training.',
    hint: 'Reports to @shroud go to Hack Club’s Fire Department moderation team.',
  },
}

export const internalLessonIds = ['pings', 'dms', 'threads', 'reactions'] as const satisfies readonly LessonId[]

export function resolveLessons(configured: LessonId[]) {
  return lessonIds.filter((lesson) => configured.includes(lesson) || internalLessonIds.some((internal) => internal === lesson))
}

export interface ChannelSection {
  label: string
  channels: string[]
}

export interface ProgramConfig {
  program: {
    name: string
    slug: string
    color: string
    logo: string
    tagline: string
  }
  training: { lessons: LessonId[]; channel_target: string; practice_channel: string }
  channels: { default: ChannelSection[]; recommended: string[]; read_only?: string[] }
  copy?: { lessons?: Partial<Record<LessonId, LessonCopy>> }
  support?: {
    channel: string
    discussion_channel: string
    bot_name: string
    acknowledgement: string
    faq_title: string
    faq_intro: string
    faq: { question: string; answer: string }[]
  }
  completion: { auth_url: string; entry_channel: string; return_origins: string[] }
}

export function getDefaultChannels(config: ProgramConfig) {
  return config.channels.default.flatMap((section) => section.channels)
}

export function getProgramSlug(pathname: string, basePath = '/') {
  const relativePath = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname
  const parts = relativePath.split('/').filter(Boolean)
  return parts.at(-1) || 'slack'
}

export function getCompletionUrl(config: ProgramConfig, currentUrl: string) {
  const current = new URL(currentUrl)
  const returnTo = current.searchParams.get('return_to')
  if (!returnTo) return config.completion.auth_url

  try {
    const target = new URL(returnTo, current.origin)
    if (target.protocol !== 'http:' && target.protocol !== 'https:') return config.completion.auth_url
    if (target.origin !== current.origin && !config.completion.return_origins.includes(target.origin)) {
      return config.completion.auth_url
    }
    target.searchParams.set('onboarding', 'complete')
    target.searchParams.set('program', config.program.slug)
    return target.toString()
  } catch {
    return config.completion.auth_url
  }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateProgram(value: unknown): ProgramConfig {
  if (!value || typeof value !== 'object') throw new Error('Program config must be an object')
  const config = value as ProgramConfig
  if (!config.program?.name || !config.program.slug || !config.program.color || !config.program.logo || !config.program.tagline) {
    throw new Error('Program name, slug, color, logo, and tagline are required')
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.program.slug)) {
    throw new Error('Program slug must use lowercase letters, numbers, and hyphens')
  }
  if (!/^#[0-9a-f]{6}$/i.test(config.program.color)) {
    throw new Error('Program color must be a six-digit hex color')
  }
  if (!Array.isArray(config.training?.lessons)) {
    throw new Error('Training lessons must be an array')
  }
  if (config.training.lessons.some((lesson) => !lessonIds.includes(lesson))) {
    throw new Error('Program config contains an unknown lesson')
  }
  config.training.lessons = resolveLessons(config.training.lessons)
  if (!config.training.channel_target || !config.training.practice_channel) {
    throw new Error('Training channel target and practice channel are required')
  }
  if (!Array.isArray(config.channels?.default) || config.channels.default.length === 0) {
    throw new Error('At least one default channel section is required')
  }
  if (config.channels.default.some((section) => !section.label || !Array.isArray(section.channels) || section.channels.length === 0)) {
    throw new Error('Every default channel section needs a label and at least one channel')
  }
  if (!Array.isArray(config.channels.recommended)) {
    throw new Error('Recommended channels must be an array')
  }
  if (config.channels.default.some((section) => section.channels.some((channel) => typeof channel !== 'string' || !channel.trim())) || config.channels.recommended.some((channel) => typeof channel !== 'string' || !channel.trim())) {
    throw new Error('Channel names must be non-empty strings')
  }
  if (config.channels.read_only && (!Array.isArray(config.channels.read_only) || config.channels.read_only.some((channel) => !getDefaultChannels(config).includes(channel)))) {
    throw new Error('Read-only channels must be included in the default channels')
  }
  if (config.copy?.lessons) {
    for (const [lesson, copy] of Object.entries(config.copy.lessons)) {
      const fields: (keyof LessonCopy)[] = ['eyebrow', 'title', 'body', 'task', 'hint']
      if (!lessonIds.includes(lesson as LessonId) || !copy || fields.some((field) => typeof copy[field] !== 'string' || !copy[field].trim())) {
        throw new Error('Every lesson copy override needs eyebrow, title, body, task, and hint text')
      }
    }
  }
  if (config.support) {
    if (!getDefaultChannels(config).includes(config.support.channel) || !getDefaultChannels(config).includes(config.support.discussion_channel)) {
      throw new Error('Support and discussion channels must be included in the default channels')
    }
    if (!config.support.bot_name || !config.support.acknowledgement || !config.support.faq_title || !config.support.faq_intro || !Array.isArray(config.support.faq)) {
      throw new Error('Support configuration needs human-written bot and FAQ text')
    }
    if (config.support.faq.some((item) => !item.question?.trim() || !item.answer?.trim())) {
      throw new Error('Every support FAQ item needs a question and answer')
    }
  }
  if (!config.completion?.auth_url || !config.completion.entry_channel) {
    throw new Error('Completion auth URL and entry channel are required')
  }
  if (!isHttpUrl(config.completion.auth_url)) {
    throw new Error('Completion auth URL must be an HTTP or HTTPS URL')
  }
  if (!Array.isArray(config.completion.return_origins)) {
    throw new Error('Completion return origins must be an array')
  }
  if (config.completion.return_origins.some((origin) => typeof origin !== 'string' || !isHttpUrl(origin) || new URL(origin).origin !== origin)) {
    throw new Error('Completion return origins must be HTTP or HTTPS origins without paths')
  }
  if (!getDefaultChannels(config).includes(config.completion.entry_channel)) {
    throw new Error('The entry channel must be one of the default channels')
  }
  if (!getDefaultChannels(config).includes(config.training.channel_target) || !getDefaultChannels(config).includes(config.training.practice_channel)) {
    throw new Error('Training channels must be included in the default channels')
  }
  return config
}

export async function loadProgram(slug: string): Promise<ProgramConfig> {
  const response = await fetch(`${import.meta.env.BASE_URL}programs/${slug}/config.yaml`)
  if (!response.ok) throw new Error(`No onboarding program named “${slug}” was found.`)
  const config = validateProgram(parse(await response.text()))
  if (config.program.logo.startsWith('/')) {
    config.program.logo = `${import.meta.env.BASE_URL}${config.program.logo.slice(1)}`
  }
  return config
}
