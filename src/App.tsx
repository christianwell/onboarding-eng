import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
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
  MoreHorizontal,
  Paperclip,
  Plus,
  Rocket,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SmilePlus,
  Sparkles,
  SquarePen,
  Star,
  UserRound,
  X,
} from 'lucide-react'
import { trackEvent, trackLessonCompleted } from './analytics'
import { getCompletionUrl, getDefaultChannels, getProgramSlug, LessonId, loadProgram, ProgramConfig } from './program'

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
}

type OverlayRect = { left: number; top: number; width: number; height: number }

const guideAssets = {
  flag: 'https://raw.githubusercontent.com/christianwell/welcome-to-slack/main/assets/flag-orpheus.svg',
  mascot: 'https://raw.githubusercontent.com/christianwell/welcome-to-slack/main/assets/orpheus-wink.png',
}

const lessonCopy: Record<LessonId, { eyebrow: string; title: string; body: string; task: string; hint: string }> = {
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
    body: 'The Slack has a lot of messages, a lot of them are answers to questions you may have, so you shouold always use the search feature to make sure youor question hasn\'t been answered already.',
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

function makeDirectMessages(name = 'Christian'): Message[] {
  return [{
    id: 101,
    author: name,
    avatar: name[0],
    color: '#ec3750',
    time: '10:04 AM',
    body: name === 'Christian' ? 'Hii! Did you see the new programs?? Stardance seems really good' : `Hey! It’s ${name}`,
  }]
}

function Avatar({ message }: { message: Message }) {
  return <div className="avatar" style={{ background: message.color }}>{message.avatar}</div>
}

function App() {
  const [config, setConfig] = useState<ProgramConfig | null>(null)
  const [loadError, setLoadError] = useState('')
  const [introComplete, setIntroComplete] = useState(false)
  const [lessonIndex, setLessonIndex] = useState(0)
  const [completed, setCompleted] = useState<LessonId[]>([])
  const [channel, setChannel] = useState('welcome-to-hack-club')
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<Message[]>(makeDirectMessages)
  const [directMessage, setDirectMessage] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false)
  const [selectedMention, setSelectedMention] = useState<string | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)
  const [threadDraft, setThreadDraft] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
      setMessages(makeInitialMessages(loaded))
      document.title = `${loaded.program.name} · Slack Flight School`
    }).catch((error: Error) => setLoadError(error.message))
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
  const helpChannel = config
    ? defaultChannels.find((name) => name === `${config.program.slug}-help`)
      ?? defaultChannels.find((name) => name.includes('help'))
      ?? config.training.practice_channel
    : 'help'
  const visibleMessages = directMessage ? directMessages : messages
  const activeLesson = lessons[lessonIndex]
  const activeCopy = activeLesson ? {
    ...lessonCopy[activeLesson],
    body: lessonCopy[activeLesson].body.replaceAll('Stardance', config?.program.name ?? 'your program'),
    task: activeLesson === 'dms' && directMessage === 'Christian'
      ? 'Send Christian a friendly hello in this DM.'
      : lessonCopy[activeLesson].task.replaceAll('#stardance', `#${activeLesson === 'channels' ? config?.training.channel_target ?? 'program' : config?.training.practice_channel ?? 'program'}`),
    hint: activeLesson === 'dms' && directMessage === 'Christian'
      ? 'Use the message box below, then press Enter or the send button.'
      : lessonCopy[activeLesson].hint,
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
    setDraft((value) => `${value.replace(/\s*$/, '')}${value.trim() ? ' ' : ''}@${name} `)
    setSelectedMention(name)
    setMentionMenuOpen(false)
    window.setTimeout(() => composerRef.current?.focus(), 0)
  }

  const sendMessage = (event: FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    const message = { id: Date.now(), author: 'You', avatar: 'Y', color: config?.program.color ?? '#6c5ce7', time: 'now', body }
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

  const runSearch = (event: FormEvent) => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    setSearched(true)
    if (searchQuery.toLowerCase().includes('hardware') && searchQuery.toLowerCase().includes('help')) completeLesson('search')
  }

  const goNext = () => {
    if (!config || lessonIndex >= lessons.length - 1) return
    if (activeLesson === 'channels') setChannel(config.training.practice_channel)
    if (activeLesson === 'dms') {
      setDirectMessage(null)
      setChannel(config.training.practice_channel)
    }
    setLessonIndex((value) => value + 1)
    setSafetyWrong(false)
    setSearched(false)
    setSearchQuery('')
    setThreadOpen(false)
    setNotificationsOpen(false)
    setMentionMenuOpen(false)
    setSelectedMention(null)
    window.setTimeout(() => composerRef.current?.focus(), 100)
  }

  const channelPurpose = useMemo(() => {
    if (directMessage) return `A private conversation with ${directMessage}.`
    if (config && channel === config.completion.entry_channel) return config.program.tagline
    if (channel === 'welcome-to-hack-club') return 'Meet other new members and ask a Hack Club Gardener when you need a hand!'
    if (channel === 'slack-guide') return 'Learn the basics and find your way around the Hack Club Slack!'
    if (channel === 'planet') return `Share ${config?.program.name ?? 'program'} projects, progress, and inspiration.`
    if (channel.includes('bulletin') || channel.includes('announcements')) return 'Official updates worth keeping an eye on.'
    if (channel.includes('help')) return 'Ask questions and help other Hack Clubbers!'
    if (channel === 'scrapbook') return 'Pick a subject and learn about it every day! Share updates here and get a custom, beautiful site generated at https://scrapbook.hackclub.com!'
    if (channel === 'code') return 'Discuss and get help with anything coding related! (No, your math homework doesn\'t count. Maybe it should actually...)'
    if (channel === 'hardware') return 'The hardware haven, get help with your hardware projects!'
    return 'Your friendly launchpad into the Hack Club community.'
  }, [channel, config, directMessage])

  if (loadError) return <main className="load-state"><CircleHelp /><h1>Program not found</h1><p>{loadError}</p><a href={`${import.meta.env.BASE_URL}program/stardance`}>Open the Stardance demo</a></main>
  if (!config) return <main className="load-state"><div className="spinner" /><p>Preparing your flight…</p></main>

  return (
    <main className="app-shell" style={{ '--program': config.program.color } as React.CSSProperties}>
      <header className="topbar">
        <button className="mobile-menu" aria-label="Open channel list" onClick={() => setSidebarOpen(true)}><Menu /></button>
        <button className="history-button" aria-label="Recent history"><Clock3 size={17} /></button>
        <button className={`search-trigger ${activeLesson === 'search' ? 'target-pulse' : ''}`} onClick={() => setSearchOpen(true)}>
          <Search size={16} /><span>Search Hack Club</span><kbd>⌘ K</kbd>
        </button>
        <div className="profile-mini"><CircleHelp size={19} /><div>Y</div></div>
      </header>

      <nav className="nav-rail" aria-label="Slack navigation">
        <button className="workspace-switcher" aria-label="Hack Club workspace"><span>HC</span></button>
        <button className={directMessage ? '' : 'active'}><House /><span>Home</span></button>
        <button className={directMessage ? 'active' : ''} onClick={() => setSidebarOpen(true)}><MessagesSquare /><span>DMs</span></button>
        <button><Bell /><span>Activity</span><i>2</i></button>
        <button><FileText /><span>Files</span></button>
        <button><MoreHorizontal /><span>More</span></button>
        <div className="rail-spacer" />
        <button className="rail-profile"><span>Y</span></button>
      </nav>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="workspace-title"><div><strong>Hack Club <ChevronDown size={14} /></strong></div><button className="workspace-settings" aria-label="Workspace settings"><Settings /></button><button className="compose-new" aria-label="New message"><SquarePen /></button><button className="close-sidebar" aria-label="Close channel list" onClick={() => setSidebarOpen(false)}><X /></button></div>
        <button className="sidebar-search"><ListFilter size={15} /> <span>Find a conversation…</span></button>
        <button className="sidebar-item"><Send size={16} /> Drafts</button>
        <button className="sidebar-item"><UserRound size={16} /> Directories</button>
        <button className="more-unreads">↑ More unreads</button>
        <div className="sidebar-divider" />
        <button className="sidebar-item"><Star size={16} /> Starred</button>
        <div className="sidebar-section channel-list">
          <p title={`${defaultChannels.length} channels will be added by Hack Club Auth`}><ChevronDown size={14} /> Channels</p>
          {defaultChannels.map((name) => {
            const unread = name === 'happenings' ? 4 : name === 'stardance-help' || name === 'lounge' ? 1 : 0
            return <button key={name} className={`${!directMessage && channel === name ? 'selected' : ''} ${unread ? 'unread' : ''} ${activeLesson === 'channels' && name === config.training.channel_target ? 'target-sidebar' : ''}`} onClick={() => selectChannel(name)}><Hash size={16} /> <span>{name}</span>{unread > 0 && <i>{unread}</i>}</button>
          })}
          <button><Plus size={16} /> Add channels</button>
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
            <button><UserRound size={17} /><span>51,029</span></button>
            <button className="huddle-button"><Headphones size={17} /><span>Huddle</span></button>
            <div className="notification-wrap">
              <button className={activeLesson === 'notifications' ? 'target-pulse' : ''} aria-label="Notification settings" onClick={() => setNotificationsOpen((value) => !value)}>{notificationMode === 'Mentions & DMs' ? <BellRing size={19} /> : <Bell size={19} />}</button>
              {notificationsOpen && <div className="notification-menu"><strong>Notify me about…</strong>{['All new messages', 'Mentions & DMs', 'Nothing'].map((mode) => <button key={mode} onClick={() => { setNotificationMode(mode); setNotificationsOpen(false); if (mode === 'Mentions & DMs') completeLesson('notifications') }}><span>{mode}</span>{notificationMode === mode && <Check size={17} />}</button>)}</div>}
            </div>
            <button aria-label="Search in channel"><Search size={19} /></button>
            <button aria-label="More channel actions"><MoreHorizontal size={20} /></button>
          </div>
        </header>
        {!directMessage && <nav className="channel-tabs" aria-label="Channel tabs">
          <button className="active"><MessageCircle size={15} /> Messages</button>
          <button>Your Guide to using Slack</button>
          <button>Public and active personal channels you can join</button>
          <button>Read the newest edition of #happenings</button>
          <button><FileText size={15} /> Files & links</button>
          <button><Star size={15} /> Pins</button>
        </nav>}

        <div className="messages" aria-live="polite">
          <div className="channel-intro"><div>{directMessage ? <UserRound /> : <Hash />}</div><h1>{directMessage ? directMessage : `Welcome to #${channel}!`}</h1><p>{channelPurpose}</p></div>
          {visibleMessages.map((message) => (
            <article className="message" key={message.id}>
              <Avatar message={message} />
              <div className="message-content">
                <div className="message-meta"><strong>{message.author}</strong>{message.bot && <span className="bot-label">APP</span>}<time>{message.time}</time></div>
                <p>{message.body}</p>
                {!directMessage && message.id === 2 && <div className="message-tools">
                  <button className={activeLesson === 'reactions' ? 'target-action' : ''} onClick={() => { setMessages((current) => current.map((item) => item.id === 2 ? { ...item, reactions: (item.reactions ?? 0) + 1 } : item)); completeLesson('reactions') }}><SmilePlus size={16} /> <span>⭐</span> {message.reactions}</button>
                  <button className={activeLesson === 'threads' ? 'target-action' : ''} onClick={() => setThreadOpen(true)}><MessageCircle size={16} /> {message.replies} replies <span>View thread</span></button>
                </div>}
              </div>
              <div className="message-hover-actions" aria-hidden="true"><button tabIndex={-1}>🙂</button><button tabIndex={-1} onClick={() => message.id === 2 && setThreadOpen(true)}><MessageCircle /></button><button tabIndex={-1}><MoreHorizontal /></button></div>
            </article>
          ))}
        </div>

        <form className={`composer ${activeLesson === 'messages' || activeLesson === 'pings' || activeLesson === 'dms' && directMessage === 'Christian' ? 'target-composer' : ''}`} onSubmit={sendMessage}>
          <div className="format-bar"><button type="button"><strong>B</strong></button><button type="button"><em>I</em></button><button type="button"><span className="strike">S</span></button><i /><button type="button">🔗</button><button type="button">≡</button><button type="button">☷</button><button type="button">“</button><button type="button">{'</>'}</button><span /></div>
          <div className="compose-row"><input ref={composerRef} value={draft} onChange={(event) => { setDraft(event.target.value); if (!event.target.value.includes('@Nova')) setSelectedMention(null) }} placeholder={directMessage ? `Message ${directMessage}` : `Message #${channel}`} aria-label={directMessage ? `Message ${directMessage}` : `Message ${channel}`} /></div>
          {mentionMenuOpen && <div className="mention-menu" role="listbox" aria-label="People to ping"><strong>Ping someone</strong><button type="button" role="option" aria-selected="false" onClick={() => selectMention('Nova')}><span className="dm-dot avatar-nova">N<i /></span><span><b>Nova</b><small>@Nova</small></span></button><button type="button" role="option" aria-selected="false" onClick={() => selectMention('Christian')}><span className="dm-dot avatar-christian">C<i /></span><span><b>Christian</b><small>@Christian</small></span></button></div>}
          <div className="composer-actions"><div><button type="button" aria-label="Add attachment"><Plus /><span className="action-divider" /><Paperclip /></button><button type="button" aria-label="Record clip">▶</button><button type="button" aria-label="Add emoji"><SmilePlus /></button><button type="button" className={activeLesson === 'pings' ? 'target-pulse' : ''} aria-label="Mention someone" onClick={() => setMentionMenuOpen((value) => !value)}><AtSign /></button></div><div><button className="send-button" disabled={!draft.trim()} aria-label="Send message"><Send size={17} /></button></div></div>
          <div className="simulation-note"><ShieldCheck size={13} /> Practice mode · messages stay on this device</div>
        </form>
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
          </div> : !isActiveComplete && <div className="task-box"><span><Rocket size={18} /></span><div><small>YOUR TASK</small><strong>{activeCopy!.task}</strong></div></div>}
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

      {threadOpen && <aside className="thread-panel">
        <header><div><strong>Thread</strong><span>#{channel}</span></div><button aria-label="Close thread" onClick={() => setThreadOpen(false)}><X /></button></header>
        <article className="message"><Avatar message={messages[1]} /><div className="message-content"><div className="message-meta"><strong>Nova</strong><time>9:44 AM</time></div><p>{messages[1].body}</p></div></article>
        <div className="reply-count"><span /> 2 replies <span /></div>
        <article className="message compact"><div className="avatar small-avatar">L</div><div className="message-content"><div className="message-meta"><strong>Leo</strong><time>9:45 AM</time></div><p>This is lovely! Maybe each star could play one note?</p></div></article>
        <article className="message compact"><div className="avatar small-avatar orange">A</div><div className="message-content"><div className="message-meta"><strong>Aria</strong><time>9:46 AM</time></div><p>Yes! I can help test it on mobile too.</p></div></article>
        <form className={`thread-composer ${activeLesson === 'threads' ? 'target-composer' : ''}`} onSubmit={sendThreadReply}><input value={threadDraft} onChange={(event) => setThreadDraft(event.target.value)} placeholder="Reply to Nova…" autoFocus /><button disabled={!threadDraft.trim()}><Send size={17} /></button></form>
      </aside>}

      {searchOpen && <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}><section className="search-modal" onMouseDown={(event) => event.stopPropagation()}>
        <form onSubmit={runSearch}><Search /><input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setSearched(false) }} placeholder="Search messages, people, and channels" autoFocus /><button type="button" onClick={() => setSearchOpen(false)}><X /></button></form>
        {activeLesson === 'dms' ? searchQuery.toLowerCase().includes('christian')
          ? <div className="search-results people-results"><p>People matching <strong>{searchQuery}</strong></p><button className="dm-search-result" aria-label="Open DM with Christian" onClick={() => { selectDirectMessage('Christian'); setSearchOpen(false); setSearchQuery('') }}><span className="search-avatar">C</span><div><strong>Christian</strong><span>@christian · Direct message</span></div><ChevronRight /></button></div>
          : <div className="search-empty"><UserRound /><h3>Find Christian</h3><p>Type <button onClick={() => setSearchQuery('Christian')}>Christian</button> to find their Hack Club account.</p></div>
        : !searched ? <div className="search-empty"><Sparkles /><h3>Search across Hack Club</h3><p>Try <button onClick={() => setSearchQuery('hardware help')}>hardware help</button> to find where makers get unstuck.</p><div><kbd>Enter</kbd> to search</div></div> : <div className="search-results"><p>3 results for <strong>{searchQuery}</strong></p><button onClick={() => setSearchOpen(false)}><Hash /><div><strong>hardware</strong><span><b>Jules</b> · Need hardware help? Share a photo and what you’ve tried so far.</span></div></button><button onClick={() => setSearchOpen(false)}><Hash /><div><strong>{helpChannel}</strong><span><b>Orbit</b> · Ask for help at any stage—unfinished projects are welcome here.</span></div></button></div>}
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
