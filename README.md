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
<img width="1274" height="633" alt="image" src="https://github.com/user-attachments/assets/97fb27fc-5e46-4d72-920c-b9e2c46848f8" />

## Standalone steps

Open `/step/<lesson>` to teach one lesson without the full onboarding flow.
For channel search, use `/step/search+#stardance` (or `/step/search+%23stardance`).
The task names that channel and completes when the visitor selects it from search.
Program-specific links work too, such as `/program/stardance/step/search+#stardance-help`.

Standalone steps try to close their tab after the completion animation. Open them
with `window.open()` when automatic closing is needed; browsers may block closing
manually opened tabs. If closing is blocked, the existing completion redirect runs,
including an allowed `return_to` URL. Put query parameters before the `#channel`
fragment, or use the encoded `%23channel` form.

<h1 align="center">Contributors</h1>

<p align="center">
  <em>Thank you for your contributions on this platform</em>
</p>
<p align="center">
  <a href="https://github.com/christianwell/onboarding-eng/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=christianwell/onboarding-eng" alt="Contributors" />
  </a>
</p>
