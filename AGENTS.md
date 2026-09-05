# Repository guidance

## Product rules

- This is one reusable onboarding engine for every YSWS. Program-specific names, channels, help flows, FAQs, colors, and lesson wording belong in `public/programs/<slug>/config.yaml`, not in shared UI code.
- Product copy must be written by a person. Reuse wording already reviewed in pull request #1, wording observed in Hack Club Slack, or wording supplied in a program config. Do not invent or rewrite user-facing copy with AI.
- Invalid program and error routes must send visitors to `https://hackclub.com/`.

## Slack UI reference

- The visual source of truth is `/home/christian/lounge (Channel) - Hack Club - 13 new items - Slack.html` and its companion `/home/christian/lounge (Channel) - Hack Club - 13 new items - Slack_files` directory.
- Match the reference's layout, spacing, colors, type scale, controls, and responsive behavior. Keep program data and simulated messages configurable.
- Never copy private Slack messages, member names, avatars, tokens, or other user data from the saved page into this repository.

## Verification

- Run `npm run check` after code changes.
- For visual UI changes, render at 1440×900 and compare the result with the saved Slack page before finishing.
- Keep checks lightweight on this machine. Do not run the full Playwright suite unless the change requires it, and do not leave preview servers running.
