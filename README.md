# Hack Club Program Onboarding

An interactive Slack simulator that teaches new Hack Club program participants by doing. Stardance is the first program demonstration at `/program/stardance`; the general [slack.hackclub.com](https://slack.hackclub.com/) preset is available at `/program/slack`.

Open `/flow-tester` to try a complete mock application → Slack onboarding → returned confirmation round trip.

Open `/program-builder` for Campaign Studio, a visual editor that validates a program's branding, Slack channels, lessons, Auth handoff, and allowed return sites. It generates and downloads `config.yaml` and shows the exact config and logo paths to add to the repository.

## What participants practice

Nine short, action-gated lessons cover channels, messages, pings, DMs, threads, reactions, search, notifications, and community safety. Typed messages remain in the browser; the simulator never connects to Slack.

The design follows Hack Club's existing onboarding conventions:

- Hack Club Auth provisions the Slack account after email verification and assigns each program's default channels;
- newcomers can begin in `#welcome-to-hack-club` and ask volunteer Gardeners for help;
- public channels are the primary way to meet people and organize topics;
- `@shroud` routes safety reports to Hack Club's Fire Department moderation team;
- completion hands the participant to Hack Club Auth and their program's entry channel.

Sources: [Hack Club's Auth onboarding scenarios](https://github.com/hackclub/auth/tree/main/app/models/onboarding_scenarios), [Hack Club's public Slack guide](https://slack.hackclub.com/), [Hack Club Code of Conduct](https://hackclub.com/conduct/), [Slack onboarding guidance](https://slack.com/blog/collaboration/slack-101-onboarding), and the earlier [`welcome-to-slack`](https://github.com/christianwell/welcome-to-slack) prototype.

## Add a program

Create `public/programs/<slug>/config.yaml` and its logo. No engine code is required:

```yaml
program:
  name: My Program
  slug: my-program
  color: "#6c5ce7"
  logo: "/programs/my-program/logo.svg"
  tagline: "Build something wonderful."

training:
  channel_target: my-program
  practice_channel: my-program
  lessons: [channels, messages, search, notifications, safety]

channels:
  # Channels Hack Club Auth will assign during Slack provisioning. Sections
  # keep the configuration readable; Slack displays one flat Channels list.
  default:
    - label: Welcome
      channels: [welcome-to-hack-club, slack-guide]
    - label: My Program
      channels: [my-program, my-program-help, my-program-bulletin]

  # Discovery suggestions for Add channels, not automatic Slack memberships.
  recommended: [scrapbook, code, hardware]

completion:
  auth_url: "https://auth.hackclub.com/join/my-program"
  entry_channel: my-program
  return_origins: ["https://my-program.hackclub.com"]
```

Configuration is loaded and validated at runtime by [`src/program.ts`](src/program.ts). Progress is stored per program in `localStorage`.

`pings`, `dms`, `threads`, and `reactions` are internal platform lessons. They are added to every program automatically and should not be repeated in program YAML. The `lessons` list only controls the program-selectable lessons around those shared Slack basics.

The `default` list should mirror the program's `slack_channels` plus `promotion_channels` in Hack Club Auth. The loader requires `completion.entry_channel` to be present there, preventing a guide from sending someone to a channel they will not receive.

## Use it inside another flow

Send someone into onboarding with an encoded `return_to` URL:

```text
/program/stardance?return_to=https%3A%2F%2Fstardance.hackclub.com%2Fapply%3Fstep%3Dslack
```

After the last lesson, the simulator emits a `hackclub:onboarding-complete` browser event and, when embedded, a `postMessage` with the program and entry channel. It then redirects back to `return_to` with `onboarding=complete&program=stardance` added. Return destinations must be listed in `completion.return_origins`; missing or untrusted destinations fall back to `completion.auth_url`.

## Develop and verify

```sh
npm install
npm run dev
npm run check       # unit tests + production build
npm run test:e2e    # all nine lessons in Chromium
```
