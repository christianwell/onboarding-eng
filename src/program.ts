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
  channels: { default: ChannelSection[]; recommended: string[] }
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
