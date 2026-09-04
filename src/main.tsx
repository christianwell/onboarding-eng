import React from 'react'
import ReactDOM from 'react-dom/client'
import { init as initAnalytics } from '@plausible-analytics/tracker'
import App from './App'
import FlowTester from './FlowTester'
import ProgramBuilder from './ProgramBuilder'
import './styles.css'

initAnalytics({ domain: window.location.hostname })

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
