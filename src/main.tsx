import React from 'react'
import ReactDOM from 'react-dom/client'
import { initAnalytics } from './analytics'
import App from './App'
import FlowTester from './FlowTester'
import ProgramBuilder from './ProgramBuilder'
import './styles.css'

// The root already uses the Slack preset. Give it a canonical URL even when
// Slack's desktop/mobile app does not provide a browser referrer.
if (window.location.pathname === import.meta.env.BASE_URL) {
  window.location.replace(`${import.meta.env.BASE_URL}slack${window.location.search}${window.location.hash}`)
} else {
  initAnalytics()

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
