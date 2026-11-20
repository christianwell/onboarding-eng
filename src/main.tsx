import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

// Only Slack referrals should enter the guide from the homepage.
if (window.location.pathname === import.meta.env.BASE_URL) {
  let fromSlack = false
  try {
    const referrer = new URL(document.referrer)
    fromSlack = (referrer.protocol === 'https:' || referrer.protocol === 'http:')
      && (referrer.hostname === 'slack.com' || referrer.hostname.endsWith('.slack.com'))
  } catch {
    // Direct visits and referrals without a URL use the GitHub homepage.
  }
  window.location.replace(fromSlack
    ? `${import.meta.env.BASE_URL}slack${window.location.search}${window.location.hash}`
    : 'https://github.com/christianwell/onboarding-eng')
} else {
  const pathname = window.location.pathname.replace(/\/$/, '')
  const Page = React.lazy(() => pathname.endsWith('/flow-tester')
    ? import('./FlowTester')
    : pathname.endsWith('/program-builder')
      ? import('./ProgramBuilder')
      : import('./App'))

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <React.Suspense fallback={null}>
        <Page />
      </React.Suspense>
    </React.StrictMode>,
  )
}
