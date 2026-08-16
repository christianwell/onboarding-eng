import { describe, expect, it } from 'vitest'
import { getCompletionUrl, getDefaultChannels, getProgramSlug, validateProgram } from './program'

const config = {
  program: { name: 'Stardance', slug: 'stardance', color: '#6c5ce7', logo: '/logo.svg', tagline: 'Build!' },
  training: { lessons: ['channels', 'messages'], channel_target: 'stardance', practice_channel: 'stardance' },
  channels: {
    default: [
      { label: 'Welcome', channels: ['welcome'] },
      { label: 'My program', channels: ['stardance', 'stardance-help'] },
    ],
    recommended: ['code'],
  },
  completion: {
    auth_url: 'https://example.com',
    entry_channel: 'stardance',
    return_origins: ['https://stardance.hackclub.com'],
  },
}

describe('program configuration', () => {
  it('finds the program slug from root or program URLs', () => {
    expect(getProgramSlug('/')).toBe('slack')
    expect(getProgramSlug('/program/stardance')).toBe('stardance')
    expect(getProgramSlug('/onboarding-eng/program/slack', '/onboarding-eng/')).toBe('slack')
    expect(getProgramSlug('/onboarding-eng/', '/onboarding-eng/')).toBe('slack')
  })

  it('accepts known lesson IDs', () => {
    expect(validateProgram(config).program.name).toBe('Stardance')
    expect(getDefaultChannels(validateProgram(config))).toEqual(['welcome', 'stardance', 'stardance-help'])
  })

  it('adds the internal Slack lessons to every program', () => {
    expect(validateProgram(config).training.lessons).toEqual([
      'channels',
      'messages',
      'pings',
      'dms',
      'threads',
      'reactions',
    ])
  })

  it('rejects unknown lesson IDs', () => {
    expect(() => validateProgram({ ...config, training: { lessons: ['teleporting'] } })).toThrow('unknown lesson')
  })

  it('requires the completion channel to be joined by default', () => {
    expect(() => validateProgram({
      ...config,
      completion: { ...config.completion, entry_channel: 'not-joined' },
    })).toThrow('entry channel must be one of the default channels')
  })

  it('returns to the calling flow with completion details', () => {
    expect(getCompletionUrl(
      validateProgram(config),
      'https://onboarding.example/program/stardance?return_to=https%3A%2F%2Fstardance.hackclub.com%2Fapply%3Fstep%3Dslack',
    )).toBe('https://stardance.hackclub.com/apply?step=slack&onboarding=complete&program=stardance')
  })

  it('falls back to Auth for an unsafe return URL', () => {
    expect(getCompletionUrl(validateProgram(config), 'https://onboarding.example/program/stardance?return_to=javascript:alert(1)')).toBe('https://example.com')
    expect(getCompletionUrl(validateProgram(config), 'https://onboarding.example/program/stardance?return_to=https%3A%2F%2Fevil.example%2Ffake')).toBe('https://example.com')
  })

  it('rejects incomplete branding before the loader tries to use it', () => {
    expect(() => validateProgram({ ...config, program: { ...config.program, logo: '' } })).toThrow('logo')
    expect(() => validateProgram({ ...config, program: { ...config.program, tagline: '' } })).toThrow('tagline')
  })

  it('rejects malformed completion URLs and origins', () => {
    expect(() => validateProgram({ ...config, completion: { ...config.completion, auth_url: 'javascript:alert(1)' } })).toThrow('HTTP or HTTPS URL')
    expect(() => validateProgram({ ...config, completion: { ...config.completion, return_origins: ['https://example.com/path'] } })).toThrow('without paths')
  })
})
