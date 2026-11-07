<h1 align="center">onboarding-eng</h1>

<p align="center">
  <em>Your one step guide to onboarding onto Slack</em>
</p>

<p align="center">
  <a href="https://github.com/christianwell/onboarding-eng/actions/workflows/pr-checks.yml"><img alt="PR checks" src="https://github.com/christianwell/onboarding-eng/actions/workflows/pr-checks.yml/badge.svg"></a>
  <a href="https://uptime.christianwell.xyz/status/onboarding-eng"><img alt="Service status" src="https://uptime.christianwell.xyz/api/badge/2/status"></a>
  <img alt="React" src="https://img.shields.io/badge/React-61dafb?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white">
  <a href="https://github.com/christianwell/onboarding-eng/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/christianwell/onboarding-eng"></a>
</p>

<p align="center">
  <a href="https://welcome.hackclub.com/slack"><em>live demo</em></a>
</p>

## Campaign configuration

Open `/program-builder` to choose lessons and export `config.yaml`. Put it in
`public/programs/<slug>/` alongside the campaign logo. The onboarding route is
`/program/<slug>`.

The YAML has these sections:

- `program`: campaign name, slug, color, logo, and tagline.
- `training`: the guide's target channel, practice channel, and enabled lessons.
  Only lessons listed in `training.lessons` run; none are mandatory. The guide
  uses its standard lesson order, regardless of the order they were selected.
- `channels`: grouped default memberships, recommended channels, and read-only
  channels. Recommended channels are suggestions, not automatic memberships.
- `copy` (optional): human-written lesson copy overrides. The builder exports
  only edited copy for enabled lessons; omitted lessons use the reviewed defaults.
  Each override contains `title`, `body`, and `task`.
- `support` (optional): the support channel, bot acknowledgement, and FAQ. Omitted
  when support is disabled.
- `completion`: the Auth URL, entry channel, and allowed return origins.

Available lesson IDs: `channels`, `messages`, `pings`, `dms`, `threads`,
`reactions`, `search`, `notifications`, and `safety`. For example:

```yaml
training:
  channel_target: my-program
  practice_channel: my-program
  lessons:
    - channels
    - messages
    - search
```

This selection does not add pings, direct messages, threads, or reactions.
The builder keeps edits to deselected lessons in your local draft so they return
if you re-enable the lesson, but leaves them out of the exported YAML.

## Onboarding analytics

The existing Plausible integration records this funnel without identifying users:

| Custom event | Meaning |
| --- | --- |
| `Onboarding Viewed` | A valid program has loaded, including direct lesson links. |
| `Onboarding Started` | The visitor starts the guide, or enters a direct lesson link. |
| `Lesson Completed: Channels`, `Lesson Completed: Messages`, etc. | The visitor completes that lesson's task. |
| `Onboarding Completed` | All configured lessons and the final guide step are finished. |
| `Onboarding Handoff Attempted` | The automatic redirect fires or the completion link is clicked. This does **not** confirm arrival, signup, or Slack membership. |

In Plausible's site settings, add custom-event goals using the exact names above.
Existing start, lesson, and completion goal names are unchanged. For a Slack signup
funnel, create property-filtered goals for Viewed, Started, and Completed using
`program=slack` and `mode=full_guide`. Create a Handoff Attempted goal with those
same constraints plus `handoff=auth`. Give these goals distinct display names.
In Settings → Funnels (Business plan), use those four goals in that order with
the **Sequential** type: lesson events between steps must not break the funnel.
Inspect individual lesson goals to find drop-off points. Without funnels, compare
goal conversions over the same date range, not raw event totals as unique people.
Goals are not retroactive; create them before testing the deployed changes.

Every onboarding event includes `program`, `mode` (`full_guide` or `single_lesson`),
`total` (lesson count), and `guide_version` (currently `1`). Lesson events also
include `lesson` and `position`. Completion and handoff events include `handoff`
(`auth` or `return`) and `duration_seconds` since the guide started, including
idle/background time. Handoff adds `method` (`automatic` or `click`); only the
first handoff is counted per attempt. Use `handoff=auth` to exclude return-to-app
flows from the signup-handoff goal. Expose these properties in Plausible's custom
properties settings if needed; timing values are properties, not an automatic
average-duration metric. Bump `guide_version` in `src/analytics.ts` when changing
the guide in a way that should be compared separately.

Use consistent `utm_source`, `utm_medium`, and `utm_campaign` parameters on inbound
campaign links; Plausible handles campaign attribution without adding those values
to custom event properties. No names, emails, Slack IDs, practice messages, or
return URLs are attached to these events. Plausible's normal page URL collection
still applies, so never put sensitive data in inbound URLs.

Events are deduplicated within a loaded attempt; reloading starts a new attempt.
The Viewed event is non-interactive so loading the guide alone does not change
bounce rate. Blocked analytics can undercount activity. Configure goals/properties
in the Plausible dashboard separately; deploying the code does not configure them.

<h1 align="center">Contributors</h1>

<p align="center">
  <em>Thank you for your contributions on this platform</em>
</p>
<p align="center">
  <a href="https://github.com/christianwell/onboarding-eng/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=christianwell/onboarding-eng" alt="Contributors" />
  </a>
</p>
