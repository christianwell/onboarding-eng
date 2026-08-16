import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import FlowTester from './FlowTester'
import './styles.css'

const Page = window.location.pathname.replace(/\/$/, '').endsWith('/flow-tester') ? FlowTester : App

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
)
