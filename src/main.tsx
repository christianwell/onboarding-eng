import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import FlowTester from './FlowTester'
import ProgramBuilder from './ProgramBuilder'
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
  const Page = pathname.endsWith('/flow-tester')
    ? FlowTester
    : pathname.endsWith('/program-builder')
      ? ProgramBuilder
      : App

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Page />
    </React.StrictMode>,
  )
}
