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

<h1 align="center">Contributors</h1>

<p align="center">
  <em>Thank you for your contributions on this platform</em>
</p>
<p align="center">
  <a href="https://github.com/christianwell/onboarding-eng/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=christianwell/onboarding-eng" alt="Contributors" />
  </a>
</p>
