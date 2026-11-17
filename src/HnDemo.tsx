import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import './hn-demo.css'

const SlackDemo = lazy(() => import('./App'))

export default function HnDemo() {
  const [stage, setStage] = useState<'intro' | 'demo' | 'done'>('intro')
  const heading = useRef<HTMLHeadingElement>(null)
  const complete = useCallback(() => setStage('done'), [])

  useEffect(() => {
    document.title = 'Hacker News · Slack learning demo'
    heading.current?.focus()
  }, [stage])

  if (stage === 'demo') return <Suspense fallback={<main className="hn-entry" aria-busy="true">Slack learning demo…</main>}>
    <SlackDemo onDemoComplete={complete} />
  </Suspense>

  return <main className="hn-entry">
    <section className="hn-card" aria-labelledby="hn-heading">
      <img className="hn-logo" src={`${import.meta.env.BASE_URL}programs/slack/logo.svg`} alt="Hack Club" width="64" height="64" />
      <p className="hn-eyebrow">Hacker News · Hack Club</p>
      <h1 id="hn-heading" ref={heading} tabIndex={-1}>{stage === 'done' ? "You're done — you can close this tab." : 'Interactive Slack learning demo'}</h1>
      {stage === 'intro' ? <>
        <p>An interactive Slack learning demo, not an official Slack product.</p>
        <p>No sign-in or joining Hack Club required.</p>
        <button className="next-button" onClick={() => setStage('demo')}>Let’s get started</button>
      </> : window.opener && <button className="next-button" onClick={() => window.close()}>Close tab</button>}
    </section>
  </main>
}
