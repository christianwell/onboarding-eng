# Repository guidance

## Working approach

- Own the task from investigation through implementation and verification. Do not wait for the user to ask you to read the code, reproduce a bug, or run relevant tests.
- Start with the issue, affected code, program config, and existing tests. For UI bugs, work from the visible element to its component, event handler, state, and config. Find an analogous implementation before introducing new machinery; distinguish a reproduced cause from a hypothesis.
- Study unfamiliar APIs or behavior as needed using existing repository patterns, dependency documentation, and authoritative sources. Keep research focused on the current task, then apply what you learned.
- Make small, reversible decisions independently. Ask only when essential information is unavailable, requirements conflict, or an action needs permission. Do not invent product copy to fill gaps.
- Make the smallest complete fix, inspect the final diff, and leave unrelated changes alone. Keep the user informed at meaningful milestones rather than asking approval for routine local work.
- Do not push, merge, deploy, or change shared systems without authorization for that action. Report what was changed, what was actually verified, and what remains local or undelivered.

## Where to look

- `src/App.tsx`: simulated Slack workspace, onboarding progress, lesson interactions, and guide/spotlight positioning. `src/styles.css`: shared workspace and guide layout, including responsive rules.
- `src/program.ts`: program loading, configuration types, reviewed default lesson copy, and completion URLs. `public/programs/<slug>/config.yaml`: program-specific data and copy.
- `src/FlowTester.tsx`: calling-site and return-flow demo. `src/ProgramBuilder.tsx`: program configuration builder. Each has its own stylesheet.
- `src/analytics.ts`: analytics integration. Existing unit tests live beside source as `src/*.test.ts`; browser scenarios live in `tests/`.
- Read `package.json` for current commands. Use `npm run dev -- --port 5173` for manual inspection

## Product rules

- This is one reusable onboarding engine for every YSWS. Program-specific names, channels, help flows, FAQs, colors, and lesson wording belong in `public/programs/<slug>/config.yaml`, not in shared UI code.
- Product copy must be written by a person. Reuse wording already reviewed in pull request #1, wording observed in Hack Club Slack, or wording supplied in a program config. Do not invent or rewrite user-facing copy with AI.
- Invalid program and error routes must send visitors to `https://hackclub.com/`.

## Slack UI reference

- The visual source of truth is `/home/christian/lounge (Channel) - Hack Club - 13 new items - Slack.html` and its companion `/home/christian/lounge (Channel) - Hack Club - 13 new items - Slack_files` directory.
- Match the reference's layout, spacing, colors, type scale, controls, and responsive behavior. Keep program data and simulated messages configurable.
- Never copy private Slack messages, member names, avatars, tokens, or other user data from the saved page into this repository.

## Orchard deployment

- Orchard builds the root `Dockerfile`, serves the app on port 80, and checks `/health.html`.
- Keep the Caddy document root at `/app/dist`; both the Dockerfile and Railpack fallback use that path.
- The Orchard container sandbox rejects Caddy's `cap_net_bind_service` file capability. Keep `RUN setcap -r /usr/bin/caddy` in the runtime image or the pod will fail to start with `failed to update creds with file privileges: operation not permitted`.
- After deployment changes, verify both `/health.html` and a client-side route such as `/program/stardance` return HTTP 200 before considering the rollout complete.

## Verification

- Choose and run checks yourself based on the affected behavior. Run `npm run check` after code changes; it runs unit tests and the production build. Documentation-only changes need a diff review, not an app build.
- For bug fixes, reproduce the failure before changing code when practical, then rerun the same scenario. Add or extend a regression test for observable behavior that existing tests do not cover; do not test private implementation details.
- Check the relevant lifecycle, not just the happy-path click: fresh entry versus resumed progress, reload/direct navigation, task completion and the next step, open/closed panels, and scroll/resize behavior as applicable. For shared engine changes, also inspect a second program config for accidental program-specific assumptions.
- For visual UI changes, render at 1440×900 and compare with the saved Slack page. Capture and inspect screenshots of affected states, including completion, open panels, or other non-default states involved in the change. Exercise interactions as well as inspecting images; a screenshot alone does not prove behavior.
- Investigate failing checks before retrying. Fix failures caused by the change, and report unrelated failures or unavailable verification honestly. Never weaken assertions, hide failures, or claim a pass from an unexecuted check.
- Keep checks lightweight on this machine: use one browser-test worker, avoid concurrent heavy builds and browser runs, and clean up scratch files. Stop preview servers you start for verification; leave a server running only when the user asks to use it, and report its port.
