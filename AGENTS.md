# Repository guidance

## Working approach

- Own the task from investigation through implementation and verification. Do not wait for the user to ask you to read the code, reproduce a bug, or run relevant tests.
- Start with the issue, affected code, program config, and existing tests. For UI bugs, work from the visible element to its component, event handler, state, and config. Find an analogous implementation before introducing new machinery; distinguish a reproduced cause from a hypothesis.
- Study unfamiliar APIs or behavior as needed using existing repository patterns, dependency documentation, and authoritative sources. Keep research focused on the current task, then apply what you learned.
- Make small, reversible decisions independently. Ask only when essential information is unavailable, requirements conflict, or an action needs permission. Do not invent product copy to fill gaps.
- Make the smallest complete fix, inspect the final diff, and leave unrelated changes alone. Keep the user informed at meaningful milestones rather than asking approval for routine local work.
- Do not push, merge, deploy, or change shared systems without authorization for that action. Report what was changed, what was actually verified, and what remains local or undelivered. (check ## Pull requests)

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

- Match the reference's layout, spacing, colors, type scale, controls, and responsive behavior. Keep program data and simulated messages configurable.
- Never copy private Slack messages, member names, avatars, tokens, or other user data from the saved page into this repository.
- Before changing Slack UI, explicitly ask the user for Slack access and wait for permission before opening or inspecting their session. Recommend an available client: Slack in a browser, Slack Desktop, or [Taut Desktop](https://github.com/jeremy46231/taut). Once access is approved, you may launch that client; ask the user to complete sign-in if needed, never to share credentials in chat.
- For Taut, read its [agent guidance](https://github.com/jeremy46231/taut/blob/main/AGENTS.md) and [testing guide](https://github.com/jeremy46231/taut/blob/main/docs/testing.md) first. Reuse an authorized session; if setting up a browser, use a dedicated durable profile and local-only remote debugging with available CDP tools. Taut Desktop also exposes DevTools with `Ctrl+Alt+I` (`Cmd+Option+I` on macOS). Record the client and non-secret launch/profile details locally so future sessions can reuse them, never in committed files.
- Keep reference inspection read-only: do not send messages, react, or change workspace settings without explicit permission. Taut plugins and custom CSS can alter Slack's appearance; use safe mode (`?taut_safe_mode`) when comparing against stock Slack and record any remaining client-specific differences.

### Keeping up with Slack design

- Review the current Slack web client monthly and after a visible redesign. This is a manual review cadence, not an installed scheduled task. When changing Slack UI, use the access requested above; do not assume an old saved page or simulator screenshot represents today's Slack design.
- Compare channel views, open threads, search, notifications, and mobile navigation in both light and dark themes. Check desktop at 1440×900 and short mobile screens such as 340×510.
- Record the review date, client/theme/viewport, and measured differences in the design-update PR. Use browser computed styles to measure shell dimensions, spacing, font family/weight/line height, colors, borders, and control placement. Record only UI measurements, never private Slack content or credentials.
- Update shared styles in `src/styles.css` first; change `src/App.tsx` only when structure or interactions need to change. Keep program-specific data in YAML. Do not import Slack's generated CSS wholesale or automatically overwrite our styles.
- Inspect the simulator with normal fonts and assets enabled, and exercise the affected interactions and states. Existing screenshot baselines, if available, detect regressions in this app, not upstream Slack redesigns; they do not certify fidelity to the current Slack client. Use the repository's current verification tools rather than restoring removed test tooling just for this review.
- Keep raw Slack captures and refreshed HTML outside the repository. Do not put authenticated Slack sessions in CI or scrape unattended. Use synthetic app data for shareable before/after evidence, review every capture for private information, and follow the PR evidence rules below.

## Orchard deployment

- Orchard builds the root `Dockerfile`, serves the app on port 80, and checks `/health.html`.
- Keep the Caddy document root at `/app/dist`; both the Dockerfile and Railpack fallback use that path.
- The Orchard container sandbox rejects Caddy's `cap_net_bind_service` file capability. Keep `RUN setcap -r /usr/bin/caddy` in the runtime image or the pod will fail to start with `failed to update creds with file privileges: operation not permitted`.
- After deployment changes, verify both `/health.html` and a client-side route such as `/program/stardance` return HTTP 200 before considering the rollout complete.

## Verification

- Choose and run checks yourself based on the affected behavior. Run `npm run check` after code changes; it runs unit tests and the production build. Documentation-only changes need a diff review, not an app build.
- For bug fixes, reproduce the failure before changing code when practical, then rerun the same scenario. Add or extend a regression test for observable behavior that existing tests do not cover; do not test private implementation details.
- Check the relevant lifecycle, not just the happy-path click: fresh entry versus resumed progress, reload/direct navigation, task completion and the next step, open/closed panels, and scroll/resize behavior as applicable. For shared engine changes, also inspect a second program config for accidental program-specific assumptions.
- Follow the affected code into related routes, callers, and alternate flows. Test plausible failure paths, including back/cancel, empty or invalid input, and switching channels or programs where relevant. Fix regressions caused by the change; report unrelated bugs separately. State which paths were tested and which remain unverified.
- For visual UI changes, render at 1440×900 and compare with the saved Slack page. Capture and inspect screenshots of affected states, including completion, open panels, or other non-default states involved in the change. Exercise interactions as well as inspecting images; a screenshot alone does not prove behavior.
- Investigate failing checks before retrying. Fix failures caused by the change, and report unrelated failures or unavailable verification honestly. Never weaken assertions, hide failures, or claim a pass from an unexecuted check.
- Keep checks lightweight on this machine: use one browser-test worker, avoid concurrent heavy builds and browser runs, and clean up scratch files. Stop preview servers you start for verification; leave a server running only when the user asks to use it, and report its port.

## Pull requests

- Keep PR titles short and specific. Default to a body of three short bullets: problem, fix, and verification (including blockers). Aim for no more than 120 words of prose, excluding evidence captions and the AI attribution; expand only for a material risk or necessary reviewer action. Do not repeat the diff, list every file, or include a work diary.
- Keep required evidence below those bullets with minimal captions. For AI-assisted work, end with `AI assistance: <model> via <coding tool>.`
- Verify the model from the current session’s usage records, status, or message metadata—not a global default or mode name. For example, Amp provides `amp threads usage <thread-id> --details`; Claude Code and Codex provide `/status`. Attribute the coding model, not title/image helpers; name multiple coding models if used. If session records are unavailable, write `AI assistance: <coding tool>; model unverified.` Never guess or expose credentials while checking.
- UI changes need **Before** and **After** images; motion or timing changes also need a short video. Capture the same state, viewport, theme, and program before and after the edit. Include affected mobile and non-default states. Documentation-only changes need no images.
- Use real app captures with synthetic data. Inspect them for visual defects and private information, and test interactions separately.
- Keep PR evidence outside version control, in a temporary or Git-ignored directory of your choice. Upload it as GitHub attachments and embed it in the PR body; local paths and expiring links do not count. Never commit PR-only images or videos.
- Check upload access early and request permission if needed. Keep the PR draft if evidence is blocked, and explain why. Verify attachments render before marking it ready. Preserve others’ edits when updating the PR body.
