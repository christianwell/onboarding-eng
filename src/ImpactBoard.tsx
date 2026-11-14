import { useEffect } from 'react'
import { ArrowUpRight, BarChart3, BookOpen, ChevronRight, Flag, Table2 } from 'lucide-react'
import { boardMetrics, boardMonths, boardPeriod, boardSnapshot, nemoSource } from './board-data'
import './impact-board.css'

const monthLabel = (month: string) => new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`))

export default function ImpactBoard() {
  useEffect(() => { document.title = 'Before-and-after impact board · Hack Club' }, [])

  return <main className="impact-board">
    <aside className="board-sidebar" aria-label="Board navigation">
      <a className="board-brand" href={`${import.meta.env.BASE_URL}slack`}><span><BarChart3 aria-hidden="true" /></span><div><strong>Hack Club</strong><small>welcome.hackclub.com</small></div></a>
      <nav aria-label="Board sections">
        <p>Journey</p>
        <a href="#board-overview" aria-current="page"><BarChart3 aria-hidden="true" />Before-and-after impact board</a>
        <div className="board-nav-sub">
          <a href="#board-launch-title"><Flag aria-hidden="true" />Launch evidence</a>
          <a href="#board-history-title"><Table2 aria-hidden="true" />Monthly history</a>
          <a href="#board-method-title"><BookOpen aria-hidden="true" />Sources & definitions</a>
        </div>
      </nav>
      <a className="board-nemo-link" href="https://nemo.hackclub.com"><ArrowUpRight aria-hidden="true" />Nemo</a>
    </aside>
    <div className="board-inset">
    <header className="board-header">
      <div className="board-breadcrumb"><BarChart3 aria-hidden="true" /><span>Hack Club</span><ChevronRight aria-hidden="true" /><strong>welcome</strong></div>
      <a href="https://github.com/christianwell/onboarding-eng">Repository <ArrowUpRight aria-hidden="true" /></a>
    </header>
    <div className="board-content">
      <div className="board-heading" id="board-overview">
        <p className="board-eyebrow">welcome.hackclub.com · /board</p>
        <h1>Before-and-after impact board</h1>
        <p>Monthly onboarding metrics · January–November 2026</p>
        <span className="board-snapshot">Evidence reviewed <time dateTime={boardSnapshot}>14 Nov 2026</time> · static snapshot</span>
      </div>

      <section className="board-status" aria-labelledby="board-status-title">
        <span className="board-status-dot" aria-hidden="true" />
        <div><h2 id="board-status-title">Historical data unavailable</h2>
          <p>Nemo requires authenticated analytics access. No approved monthly aggregate export or Plausible report was available for this board. Missing values are not zero. Impact cannot yet be calculated.</p>
        </div>
      </section>

      <section className="board-launch" aria-labelledby="board-launch-title">
        <div className="board-launch-label"><Flag aria-hidden="true" /><div><p className="board-eyebrow">Launch evidence</p><h2 id="board-launch-title">September 2026</h2></div></div>
        <p><strong>Live by 5 September; exact launch unverified.</strong> Production deployment created 4 Sep. A running deployment, welcome.hackclub.com domain mapping, and public HTTP 200 were verified 5 Sep. Repository creation on 16 Aug is not the site launch.</p>
        <a href="https://api.github.com/repos/christianwell/onboarding-eng/deployments/6279452831/statuses">Deployment evidence <ArrowUpRight aria-hidden="true" /></a>
      </section>

      <section className="board-metrics" aria-label="Before and after comparison">
        {boardMetrics.map(metric => <article className="board-metric" key={metric.key}>
          <h2>{metric.label}</h2><small>{metric.unit}</small>
          <div className="board-comparison"><div><span>Before</span><strong aria-label="Before: unavailable">—</strong></div><div><span>After</span><strong aria-label="After: unavailable">—</strong></div></div>
          <p>No comparable monthly data</p>
        </article>)}
      </section>

      <section className="board-history" aria-labelledby="board-history-title">
        <div className="board-section-heading"><div><p className="board-eyebrow">Monthly history</p><h2 id="board-history-title">Before / launch / after</h2></div><span>— = unavailable, not zero</span></div>
        <p id="board-history-note">September spans both periods and is excluded from a clean before/after comparison. November is a partial month; recent cohorts also need time to mature.</p>
        <div className="board-table-scroll" role="region" aria-label="Monthly onboarding metrics" tabIndex={0}>
          <table aria-describedby="board-history-note"><caption className="board-sr-only">Monthly historical onboarding metrics. All values are unavailable pending approved data.</caption>
            <thead><tr><th scope="col">Month</th><th scope="col">Period</th>{boardMetrics.map(metric => <th scope="col" key={metric.key}>{metric.label}</th>)}</tr></thead>
            <tbody>{boardMonths.map(row => <tr key={row.month} className={row.month === '2026-09' ? 'board-launch-row' : ''}>
              <th scope="row"><time dateTime={row.month}>{monthLabel(row.month)}</time>{row.month === '2026-11' && <small>Partial month</small>}</th>
              <td>{row.month === '2026-09' && <Flag aria-hidden="true" />}{boardPeriod(row.month)}</td>
              {boardMetrics.map(metric => <td key={metric.key}>{row.values[metric.key] === null ? <span aria-label="Unavailable">—</span> : row.values[metric.key]}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="board-method" aria-labelledby="board-method-title">
        <div><p className="board-eyebrow">Sources & definitions</p><h2 id="board-method-title">What this board can measure</h2>
          <p>Community outcomes come from Nemo, not site traffic. Cohorts use Nemo’s known account-creation timestamp (cohort_at), not the month of a site visit. Unknown cohort dates are excluded.</p>
          <p>A before/after change alone does not establish causation. Recruitment campaigns, program mix, seasonality, and data coverage may change the results. No visitor-to-Slack identity link or control group is available.</p>
        </div>
        <dl>{boardMetrics.map(metric => <div key={metric.key}><dt>{metric.label}</dt><dd>{metric.definition} {metric.source
          ? <a href={`${nemoSource}/${metric.source}`}>Nemo SQL <ArrowUpRight aria-hidden="true" /></a>
          : <a href="https://github.com/christianwell/onboarding-eng/pull/35">Instrumentation history <ArrowUpRight aria-hidden="true" /></a>}</dd></div>)}</dl>
      </section>
      <footer className="board-footer"><p>Data needed: approved monthly Nemo aggregates with coverage, denominators and observation watermark; Plausible monthly full-guide events with consistent definitions; confirmed launch date.</p><a href="https://nemo.hackclub.com">Nemo <ArrowUpRight aria-hidden="true" /></a></footer>
    </div>
    </div>
  </main>
}
