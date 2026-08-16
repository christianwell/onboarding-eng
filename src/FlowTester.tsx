import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Check, ExternalLink, MessageSquare, RotateCcw, Sparkles } from 'lucide-react'
import './flow-tester.css'

function FlowTester() {
  const basePath = import.meta.env.BASE_URL
  const params = new URLSearchParams(window.location.search)
  const returnedComplete = params.get('onboarding') === 'complete' && params.get('program') === 'stardance'
  const requestedStep = params.get('step')
  const step = returnedComplete ? 3 : requestedStep === 'slack' ? 2 : 1
  const [name, setName] = useState(() => sessionStorage.getItem('flow-tester:name') ?? '')
  const [project, setProject] = useState(() => sessionStorage.getItem('flow-tester:project') ?? '')

  useEffect(() => {
    document.title = 'Stardance Application · Flow Tester'
  }, [])

  const continueToSlack = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !project.trim()) return
    sessionStorage.setItem('flow-tester:name', name.trim())
    sessionStorage.setItem('flow-tester:project', project.trim())
    window.location.assign(`${basePath}flow-tester?step=slack`)
  }

  const startOnboarding = () => {
    localStorage.removeItem('onboarding:stardance')
    const returnTo = new URL(`${basePath}flow-tester?step=slack`, window.location.origin).toString()
    window.location.assign(`${basePath}program/stardance?return_to=${encodeURIComponent(returnTo)}`)
  }

  const reset = () => {
    localStorage.removeItem('onboarding:stardance')
    sessionStorage.removeItem('flow-tester:name')
    sessionStorage.removeItem('flow-tester:project')
    window.location.assign(`${basePath}flow-tester`)
  }

  return <main className="flow-site">
    <header className="flow-header">
      <a href={`${basePath}flow-tester`}><span>✦</span> Stardance</a>
      <div>Program application tester</div>
    </header>

    <div className="flow-layout">
      <aside className="flow-progress" aria-label="Application progress">
        <p>Your application</p>
        {[
          ['1', 'Project details'],
          ['2', 'Learn Slack'],
          ['3', 'Back to the flow'],
        ].map(([number, label], index) => {
          const itemStep = index + 1
          return <div className={`${step === itemStep ? 'active' : ''} ${step > itemStep ? 'done' : ''}`} key={number}>
            <span>{step > itemStep ? <Check /> : number}</span>
            <strong>{label}</strong>
          </div>
        })}
      </aside>

      <section className="flow-card">
        {step === 1 && <form onSubmit={continueToSlack}>
          <div className="flow-icon"><Sparkles /></div>
          <p className="flow-kicker">Step 1 of 3</p>
          <h1>Tell us what you’re building</h1>
          <p className="flow-copy">This is a fake Stardance application used to test leaving a website and returning after Slack onboarding.</p>
          <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ada" autoComplete="name" /></label>
          <label>What are you making?<input value={project} onChange={(event) => setProject(event.target.value)} placeholder="A constellation game" /></label>
          <button className="flow-primary" disabled={!name.trim() || !project.trim()}>Continue <ArrowRight /></button>
        </form>}

        {step === 2 && <div>
          <div className="flow-icon purple"><MessageSquare /></div>
          <p className="flow-kicker">Step 2 of 3</p>
          <h1>Learn the Hack Club Slack</h1>
          <p className="flow-copy">Hi {name || 'there'}! The next step opens the Slack simulator. When you finish, it will automatically send you back to this website.</p>
          <div className="flow-route">
            <span>This website</span><ArrowRight /><span>Slack simulator</span><ArrowRight /><span>Back here</span>
          </div>
          <button className="flow-primary" onClick={startOnboarding}>Start Slack onboarding <ExternalLink /></button>
          <small>Your application details stay here while you complete the lesson.</small>
        </div>}

        {step === 3 && <div className="flow-success">
          <div className="flow-check"><Check /></div>
          <p className="flow-kicker">Step 3 of 3 · Returned successfully</p>
          <h1>You’re back in the application!</h1>
          <p className="flow-copy">The simulator confirmed that {name || 'this applicant'} completed Slack onboarding and returned control to this website.</p>
          <div className="flow-receipt">
            <div><span>Status</span><strong><Check /> Onboarding complete</strong></div>
            <div><span>Program</span><strong>{params.get('program')}</strong></div>
            <div><span>Project</span><strong>{project || 'Saved in the application'}</strong></div>
          </div>
          <button className="flow-primary" onClick={reset}><RotateCcw /> Test the flow again</button>
        </div>}
      </section>
    </div>
  </main>
}

export default FlowTester
