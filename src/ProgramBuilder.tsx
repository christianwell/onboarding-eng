import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { stringify } from 'yaml'
import { Check, CheckCircle2, Clipboard, Download, ExternalLink, FileCode2, FolderOpen, LockKeyhole, Plus, Rocket, Settings2 } from 'lucide-react'
import { trackEvent } from './analytics'
import { defaultLessonCopy, LessonCopy, LessonId, ProgramConfig, internalLessonIds, validateProgram } from './program'
import './program-builder.css'

type Draft = {
  name: string
  slug: string
  color: string
  tagline: string
  logo: string
  programChannels: string
  communityChannels: string
  recommendedChannels: string
  readOnlyChannels: string
  channelTarget: string
  practiceChannel: string
  lessons: LessonId[]
  lessonCopy: Record<LessonId, LessonCopy>
  supportEnabled: boolean
  supportChannel: string
  discussionChannel: string
  supportBotName: string
  supportAcknowledgement: string
  supportFaqTitle: string
  supportFaqIntro: string
  supportFaqItems: string
  authUrl: string
  entryChannel: string
  returnOrigins: string
}

const configurableLessons: { id: LessonId; label: string; detail: string }[] = [
  { id: 'channels', label: 'Channels', detail: 'Find the program home channel' },
  { id: 'messages', label: 'Messages', detail: 'Send a useful public message' },
  { id: 'search', label: 'Search', detail: 'Find existing community answers' },
  { id: 'notifications', label: 'Notifications', detail: 'Protect focus in a busy workspace' },
  { id: 'safety', label: 'Safety', detail: 'Know how to contact moderators' },
]

const internalLabels: Record<(typeof internalLessonIds)[number], string> = {
  pings: 'Pings',
  dms: 'Direct messages',
  threads: 'Threads',
  reactions: 'Reactions',
}

const initialDraft: Draft = {
  name: 'My Program',
  slug: 'my-program',
  color: '#6c5ce7',
  tagline: 'Build something wonderful.',
  logo: '/programs/my-program/logo.svg',
  programChannels: 'my-program\nmy-program-help\nmy-program-bulletin',
  communityChannels: 'welcome-to-hack-club\nslack-guide\nlounge',
  recommendedChannels: 'scrapbook\ncode\nhardware',
  readOnlyChannels: 'my-program-bulletin',
  channelTarget: 'my-program',
  practiceChannel: 'my-program',
  lessons: configurableLessons.map(({ id }) => id),
  lessonCopy: Object.fromEntries(Object.entries(defaultLessonCopy).map(([lesson, copy]) => [lesson, {
    ...copy,
    body: copy.body.replaceAll('Stardance', '{{program}}'),
    task: copy.task.replaceAll('#stardance', lesson === 'channels' ? '#{{channel_target}}' : '#{{practice_channel}}'),
  }])) as Record<LessonId, LessonCopy>,
  supportEnabled: false,
  supportChannel: 'my-program-help',
  discussionChannel: 'my-program',
  supportBotName: '',
  supportAcknowledgement: '',
  supportFaqTitle: '',
  supportFaqIntro: '',
  supportFaqItems: '',
  authUrl: 'https://auth.hackclub.com/join/my-program',
  entryChannel: 'my-program',
  returnOrigins: 'https://my-program.hackclub.com',
}

function lines(value: string) {
  return [...new Set(value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))]
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function faqItems(value: string) {
  return value.split('\n').map((line) => {
    const [question, ...answer] = line.split('|')
    return { question: question?.trim(), answer: answer.join('|').trim() }
  }).filter((item) => item.question || item.answer)
}

function createConfig(draft: Draft): ProgramConfig {
  return {
    program: {
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      color: draft.color,
      logo: draft.logo.trim(),
      tagline: draft.tagline.trim(),
    },
    training: {
      channel_target: draft.channelTarget,
      practice_channel: draft.practiceChannel,
      lessons: draft.lessons,
    },
    channels: {
      default: [
        { label: 'Program', channels: lines(draft.programChannels) },
        { label: 'Hack Club', channels: lines(draft.communityChannels) },
      ],
      recommended: lines(draft.recommendedChannels),
      read_only: lines(draft.readOnlyChannels),
    },
    copy: { lessons: draft.lessonCopy },
    ...(draft.supportEnabled ? { support: {
      channel: draft.supportChannel,
      discussion_channel: draft.discussionChannel,
      bot_name: draft.supportBotName.trim(),
      acknowledgement: draft.supportAcknowledgement.trim(),
      faq_title: draft.supportFaqTitle.trim(),
      faq_intro: draft.supportFaqIntro.trim(),
      faq: faqItems(draft.supportFaqItems),
    } } : {}),
    completion: {
      auth_url: draft.authUrl.trim(),
      entry_channel: draft.entryChannel,
      return_origins: lines(draft.returnOrigins),
    },
  }
}

function ProgramBuilder() {
  const basePath = import.meta.env.BASE_URL
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = localStorage.getItem('onboarding:campaign-draft')
      return saved ? { ...initialDraft, ...JSON.parse(saved) as Partial<Draft> } : initialDraft
    } catch {
      return initialDraft
    }
  })
  const [copied, setCopied] = useState(false)
  const [copyLesson, setCopyLesson] = useState<LessonId>('channels')
  const channels = useMemo(() => [...lines(draft.programChannels), ...lines(draft.communityChannels)], [draft.communityChannels, draft.programChannels])
  const config = useMemo(() => createConfig(draft), [draft])
  const yaml = useMemo(() => `# Generated by Hack Club Onboarding Campaign Studio\n${stringify(config, { lineWidth: 0 })}`, [config])
  const logoFile = draft.logo.startsWith('/programs/') ? `public${draft.logo}` : draft.logo
  let validationError = ''
  try {
    validateProgram(structuredClone(config))
  } catch (error) {
    validationError = error instanceof Error ? error.message : 'This campaign is not valid yet.'
  }

  useEffect(() => {
    localStorage.setItem('onboarding:campaign-draft', JSON.stringify(draft))
  }, [draft])

  const update = (field: keyof Draft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }))
  }

  const updateName = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value
    setDraft((current) => {
      const oldSuggestedSlug = slugify(current.name)
      const suggestedSlug = slugify(name)
      const shouldReplaceSlug = Boolean(current.slug && suggestedSlug) && current.slug === oldSuggestedSlug
      const nextSlug = shouldReplaceSlug ? suggestedSlug : current.slug
      const replaceSuggestedSlug = (value: string) => shouldReplaceSlug ? value.replaceAll(current.slug, nextSlug) : value
      const oldSuggestedLogo = `/programs/${current.slug}/logo.svg`
      return {
        ...current,
        name,
        slug: nextSlug,
        logo: current.logo === oldSuggestedLogo ? `/programs/${nextSlug}/logo.svg` : current.logo,
        programChannels: replaceSuggestedSlug(current.programChannels),
        readOnlyChannels: replaceSuggestedSlug(current.readOnlyChannels),
        channelTarget: replaceSuggestedSlug(current.channelTarget),
        practiceChannel: replaceSuggestedSlug(current.practiceChannel),
        supportChannel: replaceSuggestedSlug(current.supportChannel),
        discussionChannel: replaceSuggestedSlug(current.discussionChannel),
        authUrl: replaceSuggestedSlug(current.authUrl),
        entryChannel: replaceSuggestedSlug(current.entryChannel),
        returnOrigins: replaceSuggestedSlug(current.returnOrigins),
      }
    })
  }

  const updateSlug = (event: ChangeEvent<HTMLInputElement>) => {
    const slug = slugify(event.target.value)
    setDraft((current) => {
      const replace = (value: string) => current.slug && slug ? value.replaceAll(current.slug, slug) : value
      return {
        ...current,
        slug,
        logo: replace(current.logo),
        programChannels: replace(current.programChannels),
        readOnlyChannels: replace(current.readOnlyChannels),
        channelTarget: replace(current.channelTarget),
        practiceChannel: replace(current.practiceChannel),
        supportChannel: replace(current.supportChannel),
        discussionChannel: replace(current.discussionChannel),
        authUrl: replace(current.authUrl),
        entryChannel: replace(current.entryChannel),
        returnOrigins: replace(current.returnOrigins),
      }
    })
  }

  const toggleLesson = (lesson: LessonId) => {
    setDraft((current) => ({
      ...current,
      lessons: current.lessons.includes(lesson)
        ? current.lessons.filter((item) => item !== lesson)
        : [...current.lessons, lesson],
    }))
  }

  const updateLessonCopy = (field: keyof LessonCopy) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((current) => ({
      ...current,
      lessonCopy: {
        ...current.lessonCopy,
        [copyLesson]: { ...current.lessonCopy[copyLesson], [field]: event.target.value },
      },
    }))
  }

  const copyYaml = async () => {
    await navigator.clipboard.writeText(yaml)
    trackEvent('Campaign Config Copied', {
      channels: String(channels.length),
      lessons: String(config.training.lessons.length),
    })
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const downloadYaml = () => {
    const url = URL.createObjectURL(new Blob([yaml], { type: 'text/yaml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'config.yaml'
    link.click()
    URL.revokeObjectURL(url)
    trackEvent('Campaign Config Downloaded', {
      channels: String(channels.length),
      lessons: String(config.training.lessons.length),
    })
  }

  const resetDraft = () => {
    trackEvent('Campaign Draft Reset')
    setDraft(initialDraft)
  }

  return <main className="builder-site">
    <header className="builder-header">
      <a href={`${basePath}program-builder`}><span><Rocket /></span><div><strong>Campaign Studio</strong><small>Hack Club Program Onboarding</small></div></a>
      <nav><a href={`${basePath}flow-tester`}>Flow tester</a><a href={`${basePath}program/stardance`}>Open simulator <ExternalLink /></a></nav>
    </header>

    <div className="builder-layout">
      <aside className="builder-sidebar">
        <p>Campaign draft</p>
        <button className="active"><span style={{ background: draft.color }}>{draft.name.slice(0, 1) || '?'}</span><div><strong>{draft.name || 'Untitled campaign'}</strong><small>Draft · {channels.length} channels</small></div></button>
        <button className="new-campaign" onClick={resetDraft}><Plus /> Start over</button>
        <div className="builder-help"><FileCode2 /><strong>Configuration as code</strong><p>This builder creates the same reviewed YAML file used by every onboarding campaign.</p></div>
      </aside>

      <section className="builder-editor">
        <div className="builder-title"><div><p>Onboarding campaign</p><h1>{draft.name || 'Untitled campaign'}</h1><span className={validationError ? 'draft' : 'ready'}>{validationError ? 'Needs attention' : 'Ready to export'}</span></div><button disabled={Boolean(validationError)} onClick={downloadYaml}><Download /> Download config.yaml</button></div>

        {validationError && <div className="builder-error"><Settings2 /><span><strong>Finish setting up this campaign</strong>{validationError}</span></div>}

        <section className="builder-panel" id="identity">
          <header><span>1</span><div><h2>Campaign identity</h2><p>The name and branding participants see throughout the guide.</p></div></header>
          <div className="builder-grid">
            <label className="wide">Program name<input value={draft.name} onChange={updateName} /></label>
            <label>URL slug<input value={draft.slug} onChange={updateSlug} spellCheck="false" /></label>
            <label>Brand color<span className="color-field"><input type="color" value={draft.color} onChange={update('color')} /><input value={draft.color} onChange={update('color')} spellCheck="false" /></span></label>
            <label className="wide">Tagline<input value={draft.tagline} onChange={update('tagline')} /></label>
            <label className="wide">Logo path<input value={draft.logo} onChange={update('logo')} spellCheck="false" /><small>Add the matching logo file beside the exported config.</small></label>
          </div>
        </section>

        <section className="builder-panel" id="channels">
          <header><span>2</span><div><h2>Slack access</h2><p>Mirror the initial and community channels assigned by Hack Club Auth.</p></div></header>
          <div className="builder-grid">
            <label>Program channels<textarea rows={6} value={draft.programChannels} onChange={update('programChannels')} /><small>One channel per line</small></label>
            <label>Hack Club channels<textarea rows={6} value={draft.communityChannels} onChange={update('communityChannels')} /><small>Shared channels assigned on entry</small></label>
            <label className="wide">Recommended channels<textarea rows={3} value={draft.recommendedChannels} onChange={update('recommendedChannels')} /><small>Suggestions only; these are not automatically joined.</small></label>
            <label className="wide">Read-only channels<textarea rows={3} value={draft.readOnlyChannels} onChange={update('readOnlyChannels')} /></label>
            <label>First guide target<select value={draft.channelTarget} onChange={update('channelTarget')}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
            <label>Practice channel<select value={draft.practiceChannel} onChange={update('practiceChannel')}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
          </div>
        </section>

        <section className="builder-panel" id="lessons">
          <header><span>3</span><div><h2>Learning path</h2><p>Choose campaign-specific lessons. Shared Slack basics are always included.</p></div></header>
          <div className="lesson-picker">
            {configurableLessons.map((lesson) => <button key={lesson.id} className={draft.lessons.includes(lesson.id) ? 'selected' : ''} onClick={() => toggleLesson(lesson.id)}><span>{draft.lessons.includes(lesson.id) && <Check />}</span><div><strong>{lesson.label}</strong><small>{lesson.detail}</small></div></button>)}
          </div>
          <div className="internal-lessons"><LockKeyhole /><div><strong>Included in every campaign</strong><p>{internalLessonIds.map((lesson) => internalLabels[lesson]).join(' · ')}</p></div></div>
        </section>

        <section className="builder-panel" id="copy">
          <header><span>4</span><div><h2>Lesson copy</h2></div></header>
          <div className="builder-grid">
            <label className="wide">Lesson<select value={copyLesson} onChange={(event) => setCopyLesson(event.target.value as LessonId)}>{Object.keys(defaultLessonCopy).map((lesson) => <option key={lesson} value={lesson}>{lesson}</option>)}</select></label>
            <label>Eyebrow<input value={draft.lessonCopy[copyLesson].eyebrow} onChange={updateLessonCopy('eyebrow')} /></label>
            <label>Title<input value={draft.lessonCopy[copyLesson].title} onChange={updateLessonCopy('title')} /></label>
            <label className="wide">Body<textarea rows={4} value={draft.lessonCopy[copyLesson].body} onChange={updateLessonCopy('body')} /></label>
            <label className="wide">Task<input value={draft.lessonCopy[copyLesson].task} onChange={updateLessonCopy('task')} /></label>
            <label className="wide">Hint<input value={draft.lessonCopy[copyLesson].hint} onChange={updateLessonCopy('hint')} /></label>
          </div>
          <p className="template-help"><code>{'{{program}}'}</code> <code>{'{{channel_target}}'}</code> <code>{'{{practice_channel}}'}</code></p>
        </section>

        <section className="builder-panel" id="support">
          <header><span>5</span><div><h2>Support</h2></div></header>
          <button type="button" className={`support-toggle ${draft.supportEnabled ? 'enabled' : ''}`} onClick={() => setDraft((current) => ({ ...current, supportEnabled: !current.supportEnabled }))}><span>{draft.supportEnabled && <Check />}</span> Support</button>
          {draft.supportEnabled && <div className="builder-grid support-fields">
            <label>Support channel<select value={draft.supportChannel} onChange={update('supportChannel')}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
            <label>Discussion channel<select value={draft.discussionChannel} onChange={update('discussionChannel')}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
            <label className="wide">Bot name<input value={draft.supportBotName} onChange={update('supportBotName')} /></label>
            <label className="wide">Acknowledgement<textarea rows={4} value={draft.supportAcknowledgement} onChange={update('supportAcknowledgement')} /><small>Available placeholders: {'{{author}}'} and {'{{program}}'}.</small></label>
            <label className="wide">FAQ title<input value={draft.supportFaqTitle} onChange={update('supportFaqTitle')} /></label>
            <label className="wide">FAQ introduction<textarea rows={3} value={draft.supportFaqIntro} onChange={update('supportFaqIntro')} /></label>
            <label className="wide">FAQ questions and answers<textarea rows={6} value={draft.supportFaqItems} onChange={update('supportFaqItems')} /><small>One item per line: Question | Answer</small></label>
          </div>}
        </section>

        <section className="builder-panel" id="handoff">
          <header><span>6</span><div><h2>Completion handoff</h2><p>Where participants go after they finish and which sites may receive them back.</p></div></header>
          <div className="builder-grid">
            <label className="wide">Hack Club Auth URL<input value={draft.authUrl} onChange={update('authUrl')} spellCheck="false" /></label>
            <label>Starting channel<select value={draft.entryChannel} onChange={update('entryChannel')}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
            <label className="wide">Allowed return origins<textarea rows={3} value={draft.returnOrigins} onChange={update('returnOrigins')} spellCheck="false" /><small>Origins only, such as https://my-program.hackclub.com</small></label>
          </div>
        </section>
      </section>

      <aside className="builder-preview">
        <header><div><FileCode2 /><span><strong>config.yaml</strong><small>public/programs/{draft.slug || 'your-slug'}/</small></span></div><button onClick={copyYaml}>{copied ? <CheckCircle2 /> : <Clipboard />}{copied ? 'Copied' : 'Copy'}</button></header>
        <pre>{yaml}</pre>
        <div className="builder-files"><strong><FolderOpen /> Add these files</strong><code>public/programs/{draft.slug || 'your-slug'}/config.yaml</code><code>{logoFile || 'public/programs/your-slug/logo.svg'}</code></div>
      </aside>
    </div>
  </main>
}

export default ProgramBuilder
