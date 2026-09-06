import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Hash,
  Headphones,
  House,
  ListFilter,
  Menu,
  MessageCircle,
  MessagesSquare,
  Mic,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SmilePlus,
  Sparkles,
  SquarePen,
  Star,
  UserRound,
  Video,
  X,
} from 'lucide-react'
import { trackEvent, trackLessonCompleted } from './analytics'
import { defaultLessonCopy, getCompletionUrl, getDefaultChannels, getProgramSlug, LessonId, loadProgram, ProgramConfig } from './program'

type Message = {
  id: number
  author: string
  avatar: string
  color: string
  time: string
  body: string
  reactions?: number
  replies?: number
  bot?: boolean
  pinned?: boolean
  reactionEmoji?: string
  extraReactions?: { emoji: string; count: number }[]
  attachment?: {
    eyebrow: string
    title: string
    description: string
    url?: string
  }
}

type OverlayRect = { left: number; top: number; width: number; height: number }
type ChannelView = 'messages' | 'guide' | 'discover' | 'whats-on' | 'support' | 'faq' | 'files' | 'pins'
type WorkspaceMember = { name: string; username: string; color: string }
type SearchSuggestion = { type: 'channel'; name: string } | { type: 'member'; member: WorkspaceMember }

const workspaceMembers: WorkspaceMember[] = [
  { name: 'Nova', username: 'nova', color: '#3f88c5' },
  { name: 'Christian', username: 'christian', color: '#ec3750' },
  { name: 'Mika', username: 'mika', color: '#ef8354' },
  { name: 'Jules', username: 'jules', color: '#2f9e72' },
  { name: 'Priya', username: 'priya', color: '#9c6ade' },
]

function fuzzyScore(value: string, query: string) {
  const candidate = value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const needle = query.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!needle) return 0
  const exactIndex = candidate.indexOf(needle)
  if (exactIndex !== -1) return exactIndex * 2 + candidate.length - needle.length

  let candidateIndex = 0
  let gapScore = 0
  for (const character of needle) {
    const foundAt = candidate.indexOf(character, candidateIndex)
    if (foundAt === -1) return null
    gapScore += foundAt - candidateIndex
    candidateIndex = foundAt + 1
  }
  return 20 + gapScore + candidate.length - needle.length
}

function rankMatches<T>(items: T[], label: (item: T) => string, query: string, limit: number) {
  const terms = query.trim().split(/\s+/).filter(Boolean)
  return items.map((item, index) => {
    const scores = (terms.length ? terms : ['']).map((term) => fuzzyScore(label(item), term)).filter((score): score is number => score !== null)
    return { item, index, score: scores.length ? Math.min(...scores) : null }
  }).filter((match): match is { item: T; index: number; score: number } => match.score !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item)
}

function getMentionToken(value: string, caret: number) {
  const beforeCaret = value.slice(0, caret)
  const match = beforeCaret.match(/(?:^|\s)@([a-z0-9_-]*)$/i)
  if (!match || match.index === undefined) return null
  return { query: match[1], start: match.index + (match[0].startsWith('@') ? 0 : 1) }
}

const guideAssets = {
  flag: 'https://raw.githubusercontent.com/christianwell/welcome-to-slack/main/assets/flag-orpheus.svg',
  mascot: 'https://raw.githubusercontent.com/christianwell/welcome-to-slack/main/assets/orpheus-wink.png',
}

function makeInitialMessages(config: ProgramConfig): Message[] {
  return [{
    id: 1,
    author: 'Orbit',
    avatar: 'O',
    color: '#e95d8f',
    time: '9:41 AM',
    body: `Welcome! This is the place for ${config.program.name} questions and discussions. What are you planning to build?`,
    bot: true,
  },
  {
    id: 2,
    author: 'Nova',
    avatar: 'N',
    color: '#3f88c5',
    time: '9:44 AM',
    body: 'I just shipped the first screen of my constellation game! The stars literally connect when you move your cursor. Still figuring out sound effects...',
    reactions: 3,
    replies: 2,
  },
  {
    id: 3,
    author: 'Mika',
    avatar: 'M',
    color: '#ef8354',
    time: '9:47 AM',
    body: 'That sounds so cool! I’m working on a plant-watering sensor. Can I get some feedback on it?',
  },
  {
    id: 4,
    author: 'Jules',
    avatar: 'J',
    color: '#2f9e72',
    time: '9:52 AM',
    body: 'Tiny progress update: my weather display finally pulls live data. Next up is making the enclosure in CAD!',
    reactions: 2,
  },
  {
    id: 5,
    author: 'Priya',
    avatar: 'P',
    color: '#9c6ade',
    time: '9:55 AM',
    body: 'Does anyone want to start a new project together? There\'s this one game idea that I really want to try, but I need help with the graphics.',
  },
  {
    id: 6,
    author: 'Orbit',
    avatar: 'O',
    color: '#e95d8f',
    time: '10:01 AM',
    body: 'What is everyone working on? I’m curious to see what you’re building and how it’s going!',
    bot: true,
  }]
}

function makeChannelMessages(config: ProgramConfig, channel: string): Message[] {
  if (channel === config.training.practice_channel || channel === config.completion.entry_channel) {
    return makeInitialMessages(config)
  }
  return []
}

function isReadOnlyChannel(config: ProgramConfig, channel: string) {
  return config.channels.read_only?.includes(channel) ?? (channel === 'announcements'
    || channel === 'happenings'
    || channel === 'news-wire'
    || channel.includes('bulletin')
    || channel.includes('community-announcements'))
}

function resolveProgramCopy(value: string, config: ProgramConfig) {
  return value
    .replaceAll('{{program}}', config.program.name)
    .replaceAll('{{channel_target}}', config.training.channel_target)
    .replaceAll('{{practice_channel}}', config.training.practice_channel)
    .replaceAll('Stardance', config.program.name)
}

function makeDirectMessages(name = 'Christian'): Message[] {
  return [{
    id: 101,
    author: name,
    avatar: name[0],
    color: '#ec3750',
    time: '10:04 AM',
    body: name === 'Christian' ? 'Welcome to the community of Hack Club!!' : `Hey! It’s ${name}`,
  }]
}

function Avatar({ message }: { message: Message }) {
  return <div className="avatar" style={{ background: message.color }}>{message.avatar}</div>
}

function App() {
  const [config, setConfig] = useState<ProgramConfig | null>(null)
  const [introComplete, setIntroComplete] = useState(false)
  const [lessonIndex, setLessonIndex] = useState(0)
  const [completed, setCompleted] = useState<LessonId[]>([])
  const [channel, setChannel] = useState('welcome-to-hack-club')
  const [joinedChannels, setJoinedChannels] = useState<string[]>([])
  const [channelView, setChannelView] = useState<ChannelView>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<Message[]>(makeDirectMessages)
  const [directMessage, setDirectMessage] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0)
  const [selectedMention, setSelectedMention] = useState<string | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)
  const [threadMessage, setThreadMessage] = useState<Message | null>(null)
  const [resolvedThreads, setResolvedThreads] = useState<number[]>([])
  const [threadDraft, setThreadDraft] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1)
  const [searched, setSearched] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationMode, setNotificationMode] = useState('All new messages')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [safetyWrong, setSafetyWrong] = useState(false)
  const [finished, setFinished] = useState(false)
  const [spotlight, setSpotlight] = useState<OverlayRect | null>(null)
  const [guidePosition, setGuidePosition] = useState<{ left: number; top: number } | null>(null)
  const composerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProgram(getProgramSlug(window.location.pathname, import.meta.env.BASE_URL)).then((loaded) => {
      setConfig(loaded)
      setChannel(loaded.completion.entry_channel)
      setJoinedChannels(getDefaultChannels(loaded))
      setMessages(makeChannelMessages(loaded, loaded.completion.entry_channel))
      document.title = `${loaded.program.name} · Slack Flight School`
    }).catch(() => window.location.replace('https://hackclub.com/'))
  }, [])

  useEffect(() => {
    if (!config) return
    const saved = localStorage.getItem(`onboarding:${config.program.slug}`)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as { completed?: LessonId[] }
      if (parsed.completed?.length) {
        const currentLessons = config.training.lessons.filter((lesson) => parsed.completed?.includes(lesson))
        const firstIncomplete = config.training.lessons.findIndex((lesson) => !currentLessons.includes(lesson))
        setCompleted(currentLessons)
        setLessonIndex(firstIncomplete === -1 ? config.training.lessons.length - 1 : firstIncomplete)
        if (currentLessons.length > 0) {
          trackEvent('Onboarding Resumed', {
            program: config.program.slug,
            lessons_completed: String(currentLessons.length),
          })
          setIntroComplete(true)
        }
      }
    } catch {
      localStorage.removeItem(`onboarding:${config.program.slug}`)
    }
  }, [config])

  const lessons = config?.training.lessons ?? []
  const defaultChannels = config ? getDefaultChannels(config) : []
  const recommendedChannels = config?.channels.recommended ?? []
  const searchableChannels = useMemo(
    () => [...new Set([...joinedChannels, ...recommendedChannels])],
    [joinedChannels, recommendedChannels],
  )
  const mentionMatches = useMemo(
    () => rankMatches(workspaceMembers, (member) => `${member.name} ${member.username}`, mentionQuery, 6),
    [mentionQuery],
  )
  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!searchQuery.trim()) return []
    const channels = rankMatches(searchableChannels, (name) => name, searchQuery, 5)
      .map((name): SearchSuggestion => ({ type: 'channel', name }))
    const members = rankMatches(workspaceMembers, (member) => `${member.name} ${member.username}`, searchQuery, 4)
      .map((member): SearchSuggestion => ({ type: 'member', member }))
    return [...channels, ...members]
  }, [searchQuery, searchableChannels])
  const parsedSearch = useMemo(() => {
    const match = searchQuery.match(/(?:^|\s)in:#?([a-z0-9-]+)/i)
    return {
      scope: match?.[1].toLowerCase() ?? '',
      terms: searchQuery.replace(/(?:^|\s)in:#?[a-z0-9-]+/ig, ' ').trim().toLowerCase().split(/\s+/).filter(Boolean),
    }
  }, [searchQuery])
  const searchResults = useMemo(() => {
    if (!config || !searched) return []
    return searchableChannels.flatMap((name) => {
      if (parsedSearch.scope && name.toLowerCase() !== parsedSearch.scope) return []
      const messageResults = makeChannelMessages(config, name).filter((message) => {
        const haystack = `${name} ${message.author} ${message.body} ${message.attachment?.title ?? ''} ${message.attachment?.description ?? ''}`.toLowerCase()
        return parsedSearch.terms.every((term) => haystack.includes(term))
      }).map((message) => ({ channel: name, message }))
      if (messageResults.length) return messageResults
      return (!parsedSearch.terms.length || parsedSearch.terms.some((term) => name.toLowerCase().includes(term)))
        ? [{ channel: name, message: { id: 0, author: '', avatar: '', color: '', time: '', body: '' } }]
        : []
    }).slice(0, 12)
  }, [config, parsedSearch, searchableChannels, searched])
  const visibleMessages = directMessage ? directMessages : messages
  const activeLesson = lessons[lessonIndex]
  const configuredLessonCopy = activeLesson
    ? config?.copy?.lessons?.[activeLesson] ?? defaultLessonCopy[activeLesson]
    : null
  const activeCopy = activeLesson && configuredLessonCopy ? {
    eyebrow: resolveProgramCopy(configuredLessonCopy.eyebrow, config!),
    title: resolveProgramCopy(configuredLessonCopy.title, config!),
    body: resolveProgramCopy(configuredLessonCopy.body, config!),
    task: activeLesson === 'dms' && directMessage === 'Christian'
      ? 'Send Christian a friendly hello in this DM.'
      : resolveProgramCopy(configuredLessonCopy.task, config!).replaceAll('#stardance', `#${activeLesson === 'channels' ? config?.training.channel_target ?? 'program' : config?.training.practice_channel ?? 'program'}`),
    hint: activeLesson === 'dms' && directMessage === 'Christian'
      ? 'Use the message box below, then press Enter or the send button.'
      : resolveProgramCopy(configuredLessonCopy.hint, config!),
  } : null
  const isActiveComplete = activeLesson ? completed.includes(activeLesson) : false
  const allLessonsComplete = config ? completed.length === lessons.length : false
  const allComplete = finished && allLessonsComplete
  const guideProgress = lessons.length ? Math.round(((lessonIndex + 1) / (lessons.length + 1)) * 100) : 0
  const completionUrl = config ? getCompletionUrl(config, window.location.href) : ''
  const returnsToFlow = config ? completionUrl !== config.completion.auth_url : false

  useEffect(() => {
    if (!allComplete || !config) return

    trackEvent('Onboarding Completed', {
      program: config.program.slug,
      handoff: returnsToFlow ? 'return' : 'auth',
    })
    const completion = {
      type: 'hackclub:onboarding-complete',
      program: config.program.slug,
      entryChannel: config.completion.entry_channel,
      returnTo: completionUrl,
    }
    window.dispatchEvent(new CustomEvent(completion.type, { detail: completion }))
    if (window.parent !== window) window.parent.postMessage(completion, '*')

    const redirect = window.setTimeout(() => window.location.assign(completionUrl), 2500)
    return () => window.clearTimeout(redirect)
  }, [allComplete, completionUrl, config, returnsToFlow])

  useLayoutEffect(() => {
    if (allComplete) return

    const positionGuide = () => {
      const isMobile = window.innerWidth <= 620
      const selector = !introComplete
        ? null
        : isMobile && activeLesson === 'channels'
          ? sidebarOpen ? '.target-sidebar' : '.mobile-menu'
        : activeLesson === 'notifications' && notificationsOpen
        ? '.notification-menu'
        : activeLesson === 'threads' && threadOpen
        ? '.thread-composer'
        : activeLesson === 'dms'
          ? directMessage === 'Christian' ? '.target-composer' : searchQuery.toLowerCase().includes('christian') ? '.dm-search-result' : searchOpen ? '.search-modal input' : '.search-trigger'
        : activeLesson === 'channels'
          ? '.target-sidebar'
          : activeLesson === 'messages' || activeLesson === 'pings'
            ? '.target-composer'
            : activeLesson === 'threads' || activeLesson === 'reactions'
              ? '.target-action'
              : activeLesson === 'search' || activeLesson === 'notifications'
                ? '.target-pulse'
                : null
      const target = selector ? document.querySelector<HTMLElement>(selector) : null
      const guide = document.querySelector<HTMLElement>('.coach')
      if (!guide) return

      const guideWidth = guide.offsetWidth
      const guideHeight = guide.offsetHeight
      if (isMobile) {
        if (target && !isActiveComplete) {
          const rect = target.getBoundingClientRect()
          setSpotlight({ left: Math.max(2, rect.left - 6), top: Math.max(2, rect.top - 6), width: rect.width + 12, height: rect.height + 12 })
        } else {
          setSpotlight(null)
        }
        const top = !introComplete
          ? Math.max(50, (window.innerHeight - guideHeight) / 2)
          : activeLesson === 'messages' || activeLesson === 'pings' || activeLesson === 'dms' && directMessage === 'Christian'
            ? 54
            : Math.max(50, window.innerHeight - guideHeight - 8)
        setGuidePosition({ left: 8, top })
        return
      }
      if (!target || isActiveComplete) {
        setSpotlight(null)
        setGuidePosition({
          left: Math.max(12, (window.innerWidth - guideWidth) / 2),
          top: Math.max(12, (window.innerHeight - guideHeight) / 2),
        })
        return
      }

      const rect = target.getBoundingClientRect()
      setSpotlight({ left: rect.left - 8, top: rect.top - 8, width: rect.width + 16, height: rect.height + 16 })

      if (activeLesson === 'dms' && directMessage !== 'Christian') {
        setGuidePosition({ left: 12, top: Math.max(60, window.innerHeight - guideHeight - 12) })
        return
      }

      if (activeLesson === 'messages' || activeLesson === 'pings' || activeLesson === 'dms') {
        setGuidePosition({
          left: Math.min(
            Math.max(12, rect.left + rect.width / 2 - guideWidth / 2),
            window.innerWidth - guideWidth - 12,
          ),
          top: Math.max(12, rect.top - guideHeight - 24),
        })
        return
      }

      let left = rect.right + 24
      if (left + guideWidth > window.innerWidth - 12) left = rect.left - guideWidth - 24
      if (left < 12) left = Math.max(12, (window.innerWidth - guideWidth) / 2)
      const top = Math.min(
        Math.max(12, rect.top + rect.height / 2 - guideHeight / 2),
        Math.max(12, window.innerHeight - guideHeight - 12),
      )
      setGuidePosition({ left, top })
    }

    const frame = requestAnimationFrame(positionGuide)
    window.addEventListener('resize', positionGuide)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', positionGuide)
    }
  }, [activeLesson, allComplete, directMessage, introComplete, isActiveComplete, notificationsOpen, searchOpen, searchQuery, sidebarOpen, threadOpen])

  const completeLesson = (lesson: LessonId) => {
    if (activeLesson !== lesson || completed.includes(lesson) || !config) return
    const next = [...completed, lesson]
    setCompleted(next)
    localStorage.setItem(`onboarding:${config.program.slug}`, JSON.stringify({ completed: next }))
    trackLessonCompleted(lesson, config.program.slug, lessonIndex + 1, lessons.length)
  }

  const startOnboarding = () => {
    trackEvent('Onboarding Started', { program: config!.program.slug })
    setIntroComplete(true)
  }

  const selectChannel = (name: string) => {
    setChannel(name)
    if (config) setMessages(makeChannelMessages(config, name))
    setChannelView('messages')
    setThreadOpen(false)
    setThreadMessage(null)
    setDirectMessage(null)
    setSidebarOpen(false)
    if (name === config?.training.channel_target) completeLesson('channels')
  }

  const selectDirectMessage = (name: string) => {
    setDirectMessage(name)
    setDirectMessages(makeDirectMessages(name))
    setSidebarOpen(false)
    setDraft('')
    window.setTimeout(() => composerRef.current?.focus(), 100)
  }

  const selectMention = (name: string) => {
    const caret = composerRef.current?.selectionStart ?? draft.length
    const token = getMentionToken(draft, caret)
    const before = token ? draft.slice(0, token.start) : draft.slice(0, caret)
    const after = draft.slice(caret).replace(/^\s*/, '')
    const nextDraft = `${before}@${name} ${after}`
    const nextCaret = before.length + name.length + 2
    setDraft(nextDraft)
    setSelectedMention(name)
    setMentionMenuOpen(false)
    setMentionQuery('')
    window.setTimeout(() => {
      composerRef.current?.focus()
      composerRef.current?.setSelectionRange(nextCaret, nextCaret)
    }, 0)
  }

  const updateDraft = (value: string, caret: number) => {
    setDraft(value)
    const token = getMentionToken(value, caret)
    setMentionMenuOpen(Boolean(token))
    setMentionQuery(token?.query ?? '')
    setMentionActiveIndex(0)
    if (selectedMention && !value.includes(`@${selectedMention}`)) setSelectedMention(null)
  }

  const openMentionMenu = () => {
    const input = composerRef.current
    const caret = input?.selectionStart ?? draft.length
    const token = getMentionToken(draft, caret)
    if (token) {
      setMentionQuery(token.query)
      setMentionMenuOpen(true)
      setMentionActiveIndex(0)
      input?.focus()
      return
    }
    const nextDraft = `${draft.slice(0, caret)}@${draft.slice(caret)}`
    setDraft(nextDraft)
    setMentionQuery('')
    setMentionMenuOpen(true)
    setMentionActiveIndex(0)
    window.setTimeout(() => {
      input?.focus()
      input?.setSelectionRange(caret + 1, caret + 1)
    }, 0)
  }

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!mentionMenuOpen) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setMentionMenuOpen(false)
      return
    }
    if (!mentionMatches.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setMentionActiveIndex((current) => (current + direction + mentionMatches.length) % mentionMatches.length)
      return
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      selectMention(mentionMatches[Math.min(mentionActiveIndex, mentionMatches.length - 1)].name)
    }
  }

  const sendMessage = (event: FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    const receivesProgramSupport = !directMessage && channel === config?.support?.channel
    const message: Message = {
      id: Date.now(),
      author: 'You',
      avatar: 'Y',
      color: config?.program.color ?? '#6c5ce7',
      time: 'now',
      body,
      ...(receivesProgramSupport ? { reactions: 1, reactionEmoji: '🤔', replies: 1 } : {}),
    }
    if (directMessage) setDirectMessages((current) => [...current, message])
    else setMessages((current) => [...current, message])
    setDraft('')
    setMentionMenuOpen(false)
    if (activeLesson === 'messages') completeLesson('messages')
    if (activeLesson === 'pings' && selectedMention === 'Nova' && body.includes('@Nova')) completeLesson('pings')
    if (activeLesson === 'dms' && directMessage === 'Christian') completeLesson('dms')
    setSelectedMention(null)
  }

  const sendThreadReply = (event: FormEvent) => {
    event.preventDefault()
    if (!threadDraft.trim()) return
    setThreadDraft('')
    completeLesson('threads')
  }

  const completeSearchIfMatched = (selectedChannel?: string) => {
    const query = searchQuery.toLowerCase()
    if ((selectedChannel === 'hardware' || parsedSearch.scope === 'hardware' || query.includes('hardware')) && query.includes('help')) {
      completeLesson('search')
    }
  }

  const runSearch = (event: FormEvent) => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    setSearched(true)
    setSearchActiveIndex(-1)
    completeSearchIfMatched()
  }

  const joinChannel = (name: string, open = false) => {
    setJoinedChannels((current) => current.includes(name) ? current : [...current, name])
    if (open) selectChannel(name)
  }

  const selectSearchSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'channel') {
      completeSearchIfMatched(suggestion.name)
      joinChannel(suggestion.name, true)
    }
    else selectDirectMessage(suggestion.member.name)
    setSearchOpen(false)
    setSearchQuery('')
    setSearchActiveIndex(-1)
  }

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setSearchOpen(false)
      return
    }
    if (searched || !searchSuggestions.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setSearchActiveIndex((current) => {
        if (current === -1) return direction === 1 ? 0 : searchSuggestions.length - 1
        return (current + direction + searchSuggestions.length) % searchSuggestions.length
      })
      return
    }
    if ((event.key === 'Enter' || event.key === 'Tab') && searchActiveIndex >= 0) {
      event.preventDefault()
      selectSearchSuggestion(searchSuggestions[searchActiveIndex])
    }
  }

  const goNext = () => {
    if (!config || lessonIndex >= lessons.length - 1) return
    if (activeLesson === 'channels') {
      setChannel(config.training.practice_channel)
      setMessages(makeChannelMessages(config, config.training.practice_channel))
      setChannelView('messages')
    }
    if (activeLesson === 'dms') {
      setDirectMessage(null)
      setChannel(config.training.practice_channel)
      setMessages(makeChannelMessages(config, config.training.practice_channel))
      setChannelView('messages')
    }
    setLessonIndex((value) => value + 1)
    setSafetyWrong(false)
    setSearched(false)
    setSearchQuery('')
    setThreadOpen(false)
    setThreadMessage(null)
    setNotificationsOpen(false)
    setMentionMenuOpen(false)
    setSelectedMention(null)
    window.setTimeout(() => composerRef.current?.focus(), 100)
  }

  const channelPurpose = useMemo(() => {
    if (directMessage) return `A private conversation with ${directMessage}.`
    if (channel === 'lounge') return '🏳️‍🌈 Hang out & chat here! Also see: #community, #confessions, #furry, #lgbtq, #politics'
    if (config && channel === config.completion.entry_channel) return config.program.tagline
    if (channel === 'welcome-to-hack-club') return 'Meet other new members and ask a Hack Club Gardener when you need a hand!'
    if (channel === 'slack-guide') return 'Learn the basics and find your way around the Hack Club Slack!'
    if (channel === 'planet') return `Share ${config?.program.name ?? 'program'} projects, progress, and inspiration.`
    if (channel.includes('bulletin') || channel.includes('announcements')) return 'Official updates worth keeping an eye on.'
    if (config?.support && channel === config.support.channel) return `#${config.support.channel} · #${config.support.discussion_channel}`
    if (channel.includes('help')) return 'Ask questions and help other Hack Clubbers!'
    if (channel === 'scrapbook') return 'Pick a subject and learn about it every day! Share updates here and get a custom, beautiful site generated at https://scrapbook.hackclub.com!'
    if (channel === 'code') return 'Discuss and get help with anything coding related! (No, your math homework doesn\'t count. Maybe it should actually...)'
    if (channel === 'hardware') return 'The hardware haven, get help with your hardware projects!'
    return 'Your friendly launchpad into the Hack Club community.'
  }, [channel, config, directMessage])

  const channelTabs: { view: ChannelView; label: string; icon?: 'messages' | 'files' | 'pins' }[] = useMemo(() => {
    const tabs: { view: ChannelView; label: string; icon?: 'messages' | 'files' | 'pins' }[] = [{ view: 'messages', label: 'Messages', icon: 'messages' }]
    if (channel === 'lounge') {
      return [...tabs,
        { view: 'guide', label: 'Intro to Hack Club!' },
        { view: 'pins', label: 'Pins', icon: 'pins' },
        { view: 'files', label: 'Files & links', icon: 'files' },
        { view: 'faq', label: 'Slackbot Ping Words!' },
        { view: 'whats-on', label: 'Untitled' },
      ]
    }
    if ([config?.completion.entry_channel, config?.training.practice_channel, 'welcome-to-hack-club', 'slack-guide'].includes(channel)) {
      return [...tabs,
        { view: 'guide', label: 'Your Guide to using Slack' },
        { view: 'discover', label: 'Discover channels' },
        { view: 'whats-on', label: 'What’s on' },
        { view: 'files', label: 'Files & links', icon: 'files' },
        { view: 'pins', label: 'Pins', icon: 'pins' },
      ]
    }
    if (channel === 'help') return [...tabs, { view: 'support', label: 'Get Support' }, { view: 'faq', label: 'Help FAQ' }, { view: 'pins', label: 'Pins', icon: 'pins' }]
    if (channel === 'identity-help') return [...tabs, { view: 'faq', label: 'Identity FAQ' }, { view: 'pins', label: 'Pins', icon: 'pins' }]
    if (channel === config?.support?.channel) return [...tabs, { view: 'faq', label: config.support.faq_title }, { view: 'pins', label: 'Pins', icon: 'pins' }]
    return [...tabs, { view: 'files', label: 'Files & links', icon: 'files' }, { view: 'pins', label: 'Pins', icon: 'pins' }]
  }, [channel, config])

  if (!config) return <main className="load-state"><div className="spinner" /><p>Preparing your flight…</p></main>

  return (
    <main className="app-shell coach-card-shell card-style-dark" style={{ '--program': config.program.color } as React.CSSProperties}>
      <header className="topbar">
        <button className="mobile-menu" aria-label="Open channel list" onClick={() => setSidebarOpen(true)}><Menu /></button>
        <div className="topbar-history">
          <button className="history-button" aria-label="Back in history"><ArrowLeft /></button>
          <button className="history-button" aria-label="Forward in history"><ArrowRight /></button>
          <button className="history-button" aria-label="Show history"><Clock3 /></button>
        </div>
        <button className={`search-trigger ${activeLesson === 'search' ? 'target-pulse' : ''}`} onClick={() => setSearchOpen(true)}>
          <Search size={16} /><span>Search Hack Club</span><kbd>⌘ K</kbd>
        </button>
        <div className="profile-mini"><CircleHelp size={19} /><div>Y</div></div>
      </header>

      <nav className="nav-rail" aria-label="Slack navigation">
        <button className="workspace-switcher" aria-label="Hack Club workspace"><img src="https://avatars.slack-edge.com/2026-09-05/11996709803553_51617fa11c671209cbf0_88.png" alt="" /></button>
        <button className={directMessage ? '' : 'active'}><House /><span>Home</span></button>
        <button className={directMessage ? 'active' : ''} onClick={() => setSidebarOpen(true)}><MessagesSquare /><span>DMs</span></button>
        <button><Bell /><span>Activity</span><i>12</i></button>
        <button><FileText /><span>Files</span></button>
        <button><MoreHorizontal /><span>More</span></button>
        <div className="rail-spacer" />
        <button className="rail-utility" aria-label="Add workspace"><Plus /></button>
        <button className="rail-utility" aria-label="Theme"><Moon /></button>
        <button className="rail-profile"><span>Y</span></button>
      </nav>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="workspace-title"><div><strong>Hack Club <ChevronDown size={14} /></strong></div><button className="workspace-settings" aria-label="Workspace settings"><Settings /></button><button className="compose-new" aria-label="New message"><SquarePen /></button><button className="close-sidebar" aria-label="Close channel list" onClick={() => setSidebarOpen(false)}><X /></button></div>
        <button className="sidebar-search"><ListFilter size={15} /> <span>Find a conversation…</span></button>
        <button className="sidebar-item"><MessageCircle size={16} /> Threads</button>
        <button className="sidebar-item"><Headphones size={16} /> Huddles</button>
        <button className="sidebar-item"><Send size={16} /> Drafts &amp; sent</button>
        <button className="sidebar-item"><UserRound size={16} /> Directories</button>
        <button className="sidebar-item"><CheckCircle2 size={16} /> 2 tasks left</button>
        <button className="more-unreads">↓ Unread mentions</button>
        <div className="sidebar-divider" />
        <button className="sidebar-item"><Star size={16} /> Starred</button>
        <p className="starred-empty">Drag and drop important stuff here</p>
        <div className="sidebar-section channel-list">
          <p title={`${defaultChannels.length} channels will be added by Hack Club Auth`}><ChevronDown size={14} /> Channels</p>
          {joinedChannels.map((name) => {
            const unread = name === 'happenings' ? 4 : name === 'stardance-help' || name === 'lounge' ? 1 : 0
            return <button key={name} className={`${!directMessage && channel === name ? 'selected' : ''} ${unread ? 'unread' : ''} ${activeLesson === 'channels' && name === config.training.channel_target ? 'target-sidebar' : ''}`} onClick={() => selectChannel(name)}><Hash size={16} /> <span>{name}</span>{unread > 0 && <i>{unread}</i>}</button>
          })}
          <button onClick={() => { setDirectMessage(null); setChannelView('discover'); setSidebarOpen(false) }}><Plus size={16} /> Add channels</button>
        </div>
        <div className="sidebar-section dm-section">
          <p><ChevronDown size={14} /> Direct messages</p>
          <button aria-label="Nova" className={directMessage === 'Nova' ? 'selected' : ''} onClick={() => selectDirectMessage('Nova')}><span className="dm-dot avatar-nova">N<i /></span> Nova</button>
          <button aria-label="Mika" className={directMessage === 'Mika' ? 'selected' : ''} onClick={() => selectDirectMessage('Mika')}><span className="dm-dot avatar-mika">M<i /></span> Mika</button>
          <button><Plus size={16} /> Add teammates</button>
        </div>
      </aside>

      <section className={`conversation ${directMessage ? 'direct-conversation' : ''}`}>
        <header className="channel-header">
          <div className="channel-heading"><button aria-label={directMessage ? 'View person' : 'Star channel'}>{directMessage ? <UserRound size={17} /> : <Star size={17} />}</button><h2>{directMessage ? <UserRound size={21} /> : <Hash size={21} />} {directMessage ?? channel}</h2><p>{channelPurpose}</p></div>
          <div className="header-actions">
            <button><UserRound size={17} /><span>82,896</span></button>
            <button className="huddle-button"><Headphones size={17} /><ChevronDown size={14} /></button>
            <div className="notification-wrap">
              <button className={activeLesson === 'notifications' ? 'target-pulse' : ''} aria-label="Notification settings" onClick={() => setNotificationsOpen((value) => !value)}>{notificationMode === 'Mentions & DMs' ? <BellRing size={19} /> : <Bell size={19} />}</button>
              {notificationsOpen && <div className="notification-menu"><strong>Notify me about…</strong>{['All new messages', 'Mentions & DMs', 'Nothing'].map((mode) => <button key={mode} onClick={() => { setNotificationMode(mode); setNotificationsOpen(false); if (mode === 'Mentions & DMs') completeLesson('notifications') }}><span>{mode}</span>{notificationMode === mode && <Check size={17} />}</button>)}</div>}
            </div>
            <button aria-label="Search in channel"><Search size={19} /></button>
            <button aria-label="More channel actions"><MoreHorizontal size={20} /></button>
          </div>
        </header>
        {!directMessage && <nav className="channel-tabs" aria-label="Channel tabs">
          {channelTabs.map((tab) => <button key={tab.view} className={channelView === tab.view ? 'active' : ''} onClick={() => setChannelView(tab.view)}>
            {tab.icon === 'messages' && <MessageCircle size={15} />}
            {tab.icon === 'files' && <FileText size={15} />}
            {tab.icon === 'pins' && <Star size={15} />}
            {tab.label}
          </button>)}
          <button className="add-tab" aria-label="Add tab"><Plus size={17} /></button>
        </nav>}

        {!directMessage && channelView !== 'messages' && <div className="channel-canvas" aria-live="polite">
          {channelView === 'guide' && <>
            <div className="canvas-heading"><span>CANVAS</span><h1>Your Guide to using Slack</h1></div>
            <div className="canvas-grid">
              {(['channels', 'messages', 'threads', 'search'] as LessonId[]).map((lesson) => {
                const copy = config.copy?.lessons?.[lesson] ?? defaultLessonCopy[lesson]
                return <article key={lesson}><MessageCircle /><div><h2>{resolveProgramCopy(copy.title, config)}</h2><p>{resolveProgramCopy(copy.body, config)}</p></div></article>
              })}
            </div>
          </>}
          {channelView === 'discover' && <>
            <div className="canvas-heading"><span>CHANNEL BROWSER</span><h1>Public and active personal channels you can join</h1></div>
            <div className="discovery-list">
              {recommendedChannels.map((name) => <article key={name}>
                <div className="discovery-icon"><Hash /></div>
                <div><h2>{name}</h2></div>
                <div className="discovery-actions"><button onClick={() => selectChannel(name)}>Preview</button><button className="join-button" disabled={joinedChannels.includes(name)} onClick={() => joinChannel(name)}>{joinedChannels.includes(name) ? 'Joined' : 'Join channel'}</button></div>
              </article>)}
            </div>
          </>}
          {channelView === 'whats-on' && <>
            <div className="canvas-heading"><span>CANVAS</span><h1>Read the newest edition of #happenings</h1></div>
            <div className="canvas-links"><button onClick={() => joinedChannels.includes('happenings') ? selectChannel('happenings') : joinChannel('happenings', true)}><Hash /> happenings <ChevronRight /></button><button onClick={() => joinedChannels.includes('announcements') ? selectChannel('announcements') : joinChannel('announcements', true)}><Hash /> announcements <ChevronRight /></button></div>
          </>}
          {channelView === 'support' && <>
            <div className="canvas-heading"><span>CANVAS</span><h1>Get Support</h1></div>
            <div className="support-routes">
              <button onClick={() => joinedChannels.includes('identity-help') ? selectChannel('identity-help') : joinChannel('identity-help', true)}><span>🔐</span><div><strong>#identity-help</strong></div><ChevronRight /></button>
              {config.support && <button onClick={() => selectChannel(config.support!.channel)}><span>🛟</span><div><strong>#{config.support.channel}</strong></div><ChevronRight /></button>}
              <button onClick={() => joinedChannels.includes('hardware') ? selectChannel('hardware') : joinChannel('hardware', true)}><span>🔧</span><div><strong>#hardware</strong></div><ChevronRight /></button>
            </div>
          </>}
          {channelView === 'faq' && <>
            <div className="canvas-heading"><span>CANVAS</span><h1>{channel === 'identity-help' ? 'Identity FAQ' : channel === 'help' ? 'Hack Club help FAQ' : config.support?.faq_title ?? `${config.program.name} FAQ`}</h1>{config.support && channel === config.support.channel && <p>{config.support.faq_intro}</p>}</div>
            <div className="faq-list">
              {config.support && channel === config.support.channel ? <>
                {config.support.faq.map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
              </> : null}
            </div>
          </>}
          {channelView === 'files' && <>
            <div className="canvas-heading"><h1>Files & links</h1></div>
            <div className="file-list">{messages.filter((message) => message.attachment).map((message) => <article key={message.id}><FileText /><div><strong>{message.attachment!.title}</strong></div></article>)}</div>
          </>}
          {channelView === 'pins' && <>
            <div className="canvas-heading"><h1>Pins</h1></div>
            <div className="pin-list">{messages.filter((message) => message.pinned).map((message) => <article key={message.id}><Star /><div><strong>{message.author}</strong><p>{message.body}</p></div></article>)}</div>
          </>}
        </div>}

        {(directMessage || channelView === 'messages') && <div className="messages" aria-live="polite">
          {(!introComplete || directMessage) && <div className="channel-intro"><div>{directMessage ? <UserRound /> : <Hash />}</div><h1>{directMessage ? directMessage : `Welcome to #${channel}!`}</h1><p>{channelPurpose}</p></div>}
          {introComplete && !directMessage && <div className="history-status"><span>Today <ChevronDown /></span><p>Loading history…</p></div>}
          {visibleMessages.map((message) => (
            <article className="message" key={message.id}>
              <Avatar message={message} />
              <div className="message-content">
                <div className="message-meta"><strong>{message.author}</strong>{message.bot && <span className="bot-label">APP</span>}<time>{message.time}</time></div>
                <p>{message.body}</p>
                {message.pinned && <div className="pinned-label"><Star size={13} /> Pinned by channel organizers</div>}
                {message.attachment && <div className="message-attachment"><div className="attachment-art"><Sparkles /></div><div><small>{message.attachment.eyebrow}</small><strong>{message.attachment.title}</strong><p>{message.attachment.description}</p>{message.attachment.url && <span>{message.attachment.url}</span>}</div></div>}
                {!directMessage && message.id === 2 && <div className="message-tools">
                  <button className={activeLesson === 'reactions' ? 'target-action' : ''} onClick={() => { setMessages((current) => current.map((item) => item.id === 2 ? { ...item, reactions: (item.reactions ?? 0) + 1 } : item)); completeLesson('reactions') }}><SmilePlus size={16} /> <span>{message.reactionEmoji ?? '⭐'}</span> {message.reactions}</button>
                  {message.extraReactions?.map((reaction) => <button key={reaction.emoji}><span>{reaction.emoji}</span> {reaction.count}</button>)}
                  <button className={activeLesson === 'threads' ? 'target-action' : ''} onClick={() => { setThreadMessage(message); setThreadOpen(true) }}><MessageCircle size={16} /> {message.replies} replies <span>View thread</span></button>
                </div>}
                {!directMessage && message.id !== 2 && (message.reactions || message.replies) && <div className="message-tools reaction-row">
                  {message.reactions && <button><span>{message.reactionEmoji ?? '✨'}</span> {message.reactions}</button>}
                  {message.extraReactions?.map((reaction) => <button key={reaction.emoji}><span>{reaction.emoji}</span> {reaction.count}</button>)}
                  {message.replies && <button onClick={() => { setThreadMessage(message); setThreadOpen(true) }}><MessageCircle size={15} /> {message.replies} {message.replies === 1 ? 'reply' : 'replies'} <span>View thread</span></button>}
                </div>}
              </div>
              <div className="message-hover-actions" aria-hidden="true"><button tabIndex={-1}>🙂</button><button tabIndex={-1} onClick={() => { setThreadMessage(message); setThreadOpen(true) }}><MessageCircle /></button><button tabIndex={-1}><MoreHorizontal /></button></div>
            </article>
          ))}
        </div>}

        {(directMessage || channelView === 'messages') && !(!directMessage && isReadOnlyChannel(config, channel)) && <form className={`composer ${activeLesson === 'messages' || activeLesson === 'pings' || activeLesson === 'dms' && directMessage === 'Christian' ? 'target-composer' : ''}`} onSubmit={sendMessage}>
          <div className="format-bar" role="toolbar" aria-label="Formatting">
            <button type="button" aria-label="Bold"><strong>B</strong></button>
            <button type="button" aria-label="Italic"><em>I</em></button>
            <button type="button" aria-label="Underline"><span className="underline">U</span></button>
            <button type="button" aria-label="Strikethrough"><span className="strike">S</span></button>
            <i />
            <button type="button" aria-label="Link">🔗</button>
            <button type="button" aria-label="Ordered list">1≡</button>
            <button type="button" aria-label="Bulleted list">•≡</button>
            <i />
            <button type="button" aria-label="Blockquote">❯</button>
            <button type="button" aria-label="Code">{'<>'}</button>
            <button type="button" aria-label="Code block">▣</button>
            <span />
          </div>
          <div className="compose-row"><input ref={composerRef} value={draft} onChange={(event) => updateDraft(event.target.value, event.target.selectionStart ?? event.target.value.length)} onKeyDown={handleComposerKeyDown} placeholder={directMessage ? `Message ${directMessage}` : `Message #${channel}`} aria-label={directMessage ? `Message ${directMessage}` : `Message ${channel}`} aria-autocomplete="list" aria-controls={mentionMenuOpen ? 'mention-suggestions' : undefined} aria-expanded={mentionMenuOpen} /></div>
          {mentionMenuOpen && <div id="mention-suggestions" className="mention-menu" role="listbox" aria-label="People to ping"><strong>Ping someone</strong>{mentionMatches.map((member, index) => <button key={member.username} type="button" role="option" aria-selected={index === mentionActiveIndex} className={index === mentionActiveIndex ? 'active' : ''} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setMentionActiveIndex(index)} onClick={() => selectMention(member.name)}><span className="dm-dot" style={{ background: member.color }}>{member.name[0]}<i /></span><span><b>{member.name}</b><small>@{member.username}</small></span></button>)}</div>}
          <div className="composer-actions" role="toolbar" aria-label="Composer actions"><div><button type="button" aria-label="Add attachment"><Plus /></button><button type="button" aria-label="Formatting"><strong>Aa</strong></button><button type="button" aria-label="Add emoji"><SmilePlus /></button><button type="button" className={activeLesson === 'pings' ? 'target-pulse' : ''} aria-label="Mention someone" onClick={openMentionMenu}><AtSign /></button><i className="action-divider" /><button type="button" aria-label="Record video"><Video /></button><button type="button" aria-label="Record audio"><Mic /></button><i className="action-divider" /><button type="button" aria-label="Run shortcut" className="shortcut-button">/</button></div><div className="send-actions"><button className="send-button" disabled={!draft.trim()} aria-label="Send message"><Send size={17} /></button><button type="button" className="send-options" disabled={!draft.trim()} aria-label="Schedule for later"><ChevronDown /></button></div></div>
          <div className="simulation-note"><ShieldCheck size={13} /> Practice mode · messages stay on this device</div>
        </form>}
        {!directMessage && channelView === 'messages' && isReadOnlyChannel(config, channel) && <div className="read-only-notice"><ShieldCheck /><div><strong>Only certain people can post in this channel</strong></div></div>}
      </section>

      {!allComplete && <>
      {!spotlight && <div className="guide-dim" />}
      {spotlight && <>
        <div className="guide-spotlight" style={spotlight} />
        {spotlight.top > 82 && <div className="guide-arrow" style={{ left: spotlight.left + spotlight.width / 2 - 18, top: spotlight.top - 74 }} aria-hidden="true">
          {[0, 1, 2].map((item) => <ChevronDown key={item} />)}
        </div>}
      </>}

      <aside className={`coach coach-${activeLesson} ${introComplete ? 'coach-active' : 'coach-intro'} ${activeLesson === 'dms' && searchOpen ? 'coach-over-modal' : ''}`} style={guidePosition ?? undefined} role="dialog" aria-live="polite" aria-label={`${config.program.name} onboarding guide`}>
        <div className="coach-brand">
          <span className="guide-brand"><img src={guideAssets.flag} alt="" /> Hack Club</span>
          <span className="guide-step">{introComplete ? `Step ${lessonIndex + 1} of ${lessons.length + 1}` : 'Welcome'}</span>
        </div>
        <div className="guide-mascot"><img src={guideAssets.mascot} alt="" draggable="false" /></div>
        <div className="progress-track"><i style={{ width: introComplete ? `${guideProgress}%` : '0%' }} /></div>

        {!introComplete ? <div className="lesson-card guide-intro">
          <p className="lesson-eyebrow">Welcome to {config.program.name}</p>
          <h2><span>👋</span>Let’s get you settled in</h2>
          <p className="lesson-body">Hack Club’s Slack is where hack clubbers chat, collaborate, and get help! Practice here first; then Hack Club Auth will create your account and add your starter channels.</p>
          <div className="intro-facts"><span><Clock3 size={14} /> About 5 minutes</span><span><Hash size={14} /> {defaultChannels.length} starter channels</span><span><ShieldCheck size={14} /> Nothing gets posted</span></div>
        </div> : <div className="lesson-card">
          <p className="lesson-eyebrow">{config.program.name} · Mission {lessonIndex + 1} · {activeCopy!.eyebrow}</p>
          <h2><span>{activeLesson === 'safety' ? '🛟' : activeLesson === 'search' ? '🔎' : activeLesson === 'notifications' ? '🔔' : activeLesson === 'reactions' ? '✨' : activeLesson === 'threads' ? '🧵' : activeLesson === 'pings' ? '@' : activeLesson === 'dms' ? '💌' : activeLesson === 'messages' ? '👋' : '💬'}</span>{activeCopy!.title}</h2>
          <p className="lesson-body">{activeCopy!.body}</p>
          {activeLesson === 'safety' && !isActiveComplete ? <div className="safety-quiz">
            <p><strong>Final safety check:</strong> A stranger sends an uncomfortable DM and asks for your address. What should you do?</p>
            <button onClick={() => { setSafetyWrong(false); completeLesson('safety') }}><ShieldCheck size={17} /><span><strong>Report it to @shroud and finish</strong><small>Stop replying and send context to the moderation team</small></span></button>
            <button onClick={() => setSafetyWrong(true)}><MessageCircle size={17} /><span><strong>Handle it by yourself</strong><small>Keep chatting until they stop</small></span></button>
            {safetyWrong && <p className="quiz-feedback">Not quite. You never have to handle this alone—stop engaging and report it.</p>}
            <a href="https://hackclub.com/conduct/" target="_blank" rel="noreferrer">Read the Hack Club Code of Conduct ↗</a>
          </div> : !isActiveComplete && <div className="task-box"><span><img src={`${import.meta.env.BASE_URL}guide-rocket.png`} alt="" /></span><div><small>YOUR TASK</small><strong>{activeCopy!.task}</strong></div></div>}
          {!isActiveComplete && <details><summary>Need a hint?</summary><p>{activeCopy!.hint}</p></details>}
          {isActiveComplete && <div className="success-box"><CheckCircle2 /><div><strong>Mission complete!</strong><span>{allLessonsComplete ? 'Everything’s complete. Finish when you’re ready.' : 'Nice work. Your next skill is ready.'}</span></div></div>}
        </div>}
        <div className="guide-actions">
          {!introComplete ? <button className="next-button" onClick={startOnboarding}>Let’s get started <ChevronRight size={16} /></button> : <div>
              {lessonIndex > 0 && <button className="guide-ghost" onClick={() => setLessonIndex((value) => value - 1)}>← Back</button>}
              {isActiveComplete && !allLessonsComplete && <button className="next-button" aria-label="Next mission" onClick={goNext}>Next <ChevronRight size={16} /></button>}
              {isActiveComplete && allLessonsComplete && <button className="next-button" onClick={() => setFinished(true)}>Complete onboarding <ChevronRight size={16} /></button>}
            </div>}
        </div>
      </aside>
      </>}

      {threadOpen && threadMessage && <aside className="thread-panel">
        <header><div><strong>Thread</strong><span>#{channel}</span></div><button aria-label="Close thread" onClick={() => setThreadOpen(false)}><X /></button></header>
        <article className="message"><Avatar message={threadMessage} /><div className="message-content"><div className="message-meta"><strong>{threadMessage.author}</strong>{threadMessage.bot && <span className="bot-label">APP</span>}<time>{threadMessage.time}</time></div><p>{threadMessage.body}</p></div></article>
        <div className="reply-count"><span /> {threadMessage.replies ?? 0} {(threadMessage.replies ?? 0) === 1 ? 'reply' : 'replies'} <span /></div>
        {config.support && channel === config.support.channel ? <>
          <article className="message compact support-bot-reply"><div className="avatar support-bot-avatar">{config.support.bot_name[0]}</div><div className="message-content"><div className="message-meta"><strong>{config.support.bot_name}</strong><span className="bot-label">APP</span><time>just now</time></div><p>{config.support.acknowledgement.replaceAll('{{author}}', threadMessage.author).replaceAll('{{program}}', config.program.name)}</p><button className="thread-faq-link" onClick={() => { setThreadOpen(false); setChannelView('faq') }}><FileText /> {config.support.faq_title}</button><div className="support-ticket-row"><button disabled={resolvedThreads.includes(threadMessage.id)} onClick={() => setResolvedThreads((current) => [...current, threadMessage.id])}>{resolvedThreads.includes(threadMessage.id) ? <><Check /> Resolved</> : 'Mark as resolved'}</button></div></div></article>
        </> : <>
          <article className="message compact"><div className="avatar small-avatar">L</div><div className="message-content"><div className="message-meta"><strong>Leo</strong><time>9:45 AM</time></div><p>This is lovely! Maybe each star could play one note?</p></div></article>
          <article className="message compact"><div className="avatar small-avatar orange">A</div><div className="message-content"><div className="message-meta"><strong>Aria</strong><time>9:46 AM</time></div><p>Yes! I can help test it on mobile too.</p></div></article>
        </>}
        <form className={`thread-composer ${activeLesson === 'threads' ? 'target-composer' : ''}`} onSubmit={sendThreadReply}><input value={threadDraft} onChange={(event) => setThreadDraft(event.target.value)} placeholder={`Reply to ${threadMessage.author}…`} autoFocus /><button disabled={!threadDraft.trim()}><Send size={17} /></button></form>
      </aside>}

      {searchOpen && <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}><section className="search-modal" onMouseDown={(event) => event.stopPropagation()}>
        <form onSubmit={runSearch}><Search /><input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setSearched(false); setSearchActiveIndex(-1) }} onKeyDown={handleSearchKeyDown} placeholder="Search messages, people, and channels" aria-autocomplete="list" aria-controls={searchQuery.trim() && !searched ? 'search-suggestions' : undefined} aria-expanded={Boolean(searchQuery.trim() && !searched)} autoFocus /><button type="button" onClick={() => setSearchOpen(false)}><X /></button></form>
        {!searched && searchQuery.trim() ? <div id="search-suggestions" className="search-suggestions" role="listbox" aria-label="Search suggestions">
          {searchSuggestions.some((suggestion) => suggestion.type === 'channel') && <p>Channels</p>}
          {searchSuggestions.map((suggestion, index) => suggestion.type === 'channel' ? <button key={`channel-${suggestion.name}`} type="button" className={index === searchActiveIndex ? 'active' : ''} onMouseEnter={() => setSearchActiveIndex(index)} onClick={() => selectSearchSuggestion(suggestion)}><span className="suggestion-icon"><Hash /></span><span role="option" aria-selected={index === searchActiveIndex}><strong>{suggestion.name}</strong><small>Channel</small></span><ChevronRight /></button> : null)}
          {searchSuggestions.some((suggestion) => suggestion.type === 'member') && <p>People</p>}
          {searchSuggestions.map((suggestion, index) => suggestion.type === 'member' ? <button key={`member-${suggestion.member.username}`} type="button" className={`${index === searchActiveIndex ? 'active ' : ''}${suggestion.member.name === 'Christian' ? 'dm-search-result' : ''}`} aria-label={`Open DM with ${suggestion.member.name}`} onMouseEnter={() => setSearchActiveIndex(index)} onClick={() => selectSearchSuggestion(suggestion)}><span className="search-avatar" style={{ background: suggestion.member.color }}>{suggestion.member.name[0]}</span><span role="option" aria-selected={index === searchActiveIndex}><strong>{suggestion.member.name}</strong><small>@{suggestion.member.username} · Direct message</small></span><ChevronRight /></button> : null)}
          <button type="submit" className="search-all" onClick={() => { setSearched(true); setSearchActiveIndex(-1); completeSearchIfMatched() }}><span className="suggestion-icon"><Search /></span><span><strong>Search for “{searchQuery}”</strong><small>Messages, files, and more</small></span><kbd>Enter</kbd></button>
        </div> : !searched ? activeLesson === 'dms'
          ? <div className="search-empty"><UserRound /><h3>Find Christian</h3><p>Type <button onClick={() => setSearchQuery('Christian')}>Christian</button> to find their Hack Club account.</p></div>
          : <div className="search-empty"><Sparkles /><h3>Search across Hack Club</h3><div><kbd>Enter</kbd> to search</div></div>
        : <div className="search-results message-search-results">
            <div className="search-results-header"><div><strong>{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}</strong><span> for “{searchQuery}”</span></div><button type="button">Most relevant <ChevronDown /></button></div>
            <div className="search-filter-row"><span>Messages</span>{parsedSearch.scope && <span><Hash size={12} /> In: {parsedSearch.scope}</span>}<button type="button">From</button><button type="button">After</button></div>
            {searchResults.map((result) => <button key={`${result.channel}-${result.message.id}`} onClick={() => { joinChannel(result.channel, true); setSearchOpen(false) }}>
              <Hash />
              <div><strong>{result.channel}</strong>{result.message.author && <span className="search-result-meta"><b>{result.message.author}</b> · {result.message.time}{result.message.replies ? ` · ${result.message.replies} replies` : ''}</span>}{result.message.body && <p>{result.message.body}</p>}</div>
            </button>)}
            {searchResults.length === 0 && <div className="no-results"><Search /><h3>No messages found</h3></div>}
          </div>}
      </section></div>}

      {allComplete && <div className="modal-backdrop completion-backdrop"><section className="completion-modal">
        <div className="completion-confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>
        <div className="completion-mark"><Check size={30} /></div>
        <p className="completion-step">Step {lessons.length + 1} of {lessons.length + 1} · Complete</p>
        <h1>Congrats!<br /><span>You’ve learned Slack.</span></h1>
        <p>{returnsToFlow ? 'You’re all set. We’re sending you back to continue where you left off.' : `You’re all set. Continue to ${config.program.name} to join the community.`}</p>
        <a href={completionUrl}>{returnsToFlow ? 'Return to your flow' : `Continue to ${config.program.name}`} <ChevronRight size={19} /></a>
        <small>Redirecting automatically…</small>
      </section></div>}
    </main>
  )
}

export default App
