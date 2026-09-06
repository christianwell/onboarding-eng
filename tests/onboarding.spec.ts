import { expect, test } from '@playwright/test'

test('returns to the calling website after all nine lessons', async ({ page }) => {
  test.setTimeout(90_000)

  await test.step('submit the application details', async () => {
    await page.goto('/flow-tester')
    await page.getByLabel('Your name').fill('Ada')
    await page.getByLabel('What are you making?').fill('A constellation game')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: /learn the hack club slack/i })).toBeVisible()
    await page.getByRole('button', { name: /start slack onboarding/i }).click()
  })

  await test.step('open the onboarding intro', async () => {
    await expect(page.getByRole('heading', { name: /let’s get you settled in/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /welcome to #stardance/i })).toBeVisible()
    await expect(page.locator('.channel-list').getByText('Channels', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'planet', exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Channel tabs' }).getByRole('button', { name: /your guide to using slack/i })).toBeVisible()
    await page.getByRole('button', { name: /let’s get started/i }).click()
  })

  await test.step('lesson: channels', async () => {
    await page.getByRole('button', { name: 'stardance', exact: true }).click()
    await expect(page.getByText('Mission complete!')).toBeVisible()
    await page.getByRole('button', { name: /next mission/i }).click()
  })

  await test.step('lesson: messages', async () => {
    await page.getByLabel('Message stardance').fill('Hey! I’m building a tiny game this summer 🚀')
    await page.getByRole('button', { name: 'Send message' }).click()
    await page.getByRole('button', { name: /next mission/i }).click()
  })

  await test.step('lesson: pings', async () => {
    await page.getByLabel('Message stardance').fill('@Nova typed without choosing a person')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByRole('heading', { name: /ping only when necessary/i })).toBeVisible()
    await expect(page.getByText('Mission complete!')).toHaveCount(0)
    await page.getByRole('button', { name: /mention someone/i }).click()
    await page.getByRole('option', { name: /Nova/i }).click()
    await page.getByLabel('Message stardance').fill('@Nova I would love to test the mobile version!')
    await page.getByRole('button', { name: 'Send message' }).click()
    await page.getByRole('button', { name: /next mission/i }).click()
  })

  await test.step('lesson: direct messages', async () => {
    await page.getByRole('button', { name: /search hack club/i }).click()
    await page.getByPlaceholder('Search messages, people, and channels').fill('Christian')
    await page.getByRole('button', { name: /open dm with christian/i }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Christian', exact: true })).toBeVisible()
    await page.getByLabel('Message Christian').fill('Hey Christian! I’m excited to build a constellation game.')
    await page.getByRole('button', { name: 'Send message' }).click()
    await page.getByRole('button', { name: /next mission/i }).click()
  })

  await test.step('lesson: threads', async () => {
    await page.getByRole('button', { name: /2 replies/i }).click()
    await page.getByPlaceholder('Reply to Nova…').fill('A different note for every star would be lovely!')
    await page.locator('.thread-composer button').click()
    await page.getByRole('button', { name: /next mission/i }).click()
  })

  await test.step('lesson: reactions', async () => {
    await page.locator('.message-tools button').first().click()
    await page.getByRole('button', { name: /next mission/i }).click()
  })

  await test.step('lesson: search', async () => {
    await page.getByRole('button', { name: /search hack club/i }).click()
    await page.getByPlaceholder('Search messages, people, and channels').fill('hardware help')
    await page.getByPlaceholder('Search messages, people, and channels').press('Enter')
    await expect(page.getByText(/results? for “hardware help”/)).toBeVisible()
    await page.locator('.message-search-results > button').filter({ hasText: 'hardware' }).click()
    await page.getByRole('button', { name: /next mission/i }).click()
  })

  await test.step('lesson: notifications', async () => {
    await page.getByRole('button', { name: 'Notification settings' }).click()
    await page.getByRole('button', { name: 'Mentions & DMs' }).click()
    await page.getByRole('button', { name: /next mission/i }).click()
  })

  await test.step('lesson: safety', async () => {
    await page.evaluate(() => {
      window.addEventListener('hackclub:onboarding-complete', (event) => {
        sessionStorage.setItem('completion-message', JSON.stringify((event as CustomEvent).detail))
      }, { once: true })
    })
    await expect(page.getByText('Step 9 of 10')).toBeVisible()
    await page.getByRole('button', { name: /report it to @shroud and finish/i }).click()
  })

  await test.step('return to the calling website', async () => {
    await page.getByRole('button', { name: /complete onboarding/i }).click()
    await expect(page.getByRole('heading', { name: /congrats.*you’ve learned slack/i })).toBeVisible()
    await expect(page.getByText('Step 10 of 10 · Complete')).toBeVisible()
    await expect(page.getByText(/sending you back to continue where you left off/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /return to your flow/i })).toHaveAttribute('href', 'http://127.0.0.1:4173/flow-tester?step=slack&onboarding=complete&program=stardance')
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('completion-message'))).toContain('"program":"stardance"')
    await page.waitForURL(/\/flow-tester\?step=slack&onboarding=complete&program=stardance/)
    await expect(page.getByRole('heading', { name: /you’re back in the application/i })).toBeVisible()
    await expect(page.getByText('Onboarding complete')).toBeVisible()
    await expect(page.getByText('A constellation game')).toBeVisible()
  })
})

test('guides a mobile user through the channel drawer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/program/stardance')
  await page.getByRole('button', { name: /let’s get started/i }).click()

  await expect(page.getByRole('button', { name: 'Open channel list' })).toBeVisible()
  await page.getByRole('button', { name: 'Open channel list' }).click()
  await expect(page.getByRole('button', { name: 'stardance', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'stardance', exact: true }).click()

  await expect(page.getByText('Mission complete!')).toBeVisible()
})

test('guides a mobile user into Christian’s DMs', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/program/stardance')
  await page.evaluate(() => localStorage.setItem('onboarding:stardance', JSON.stringify({ completed: ['channels', 'messages', 'pings'] })))
  await page.reload()

  await expect(page.getByRole('heading', { name: /send christian a direct message/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /let’s get you settled in/i })).toHaveCount(0)
  await page.getByRole('button', { name: /search hack club/i }).click()
  await page.getByPlaceholder('Search messages, people, and channels').fill('Christian')
  await page.getByRole('button', { name: /open dm with christian/i }).click()
  await page.getByLabel('Message Christian').fill('Hey Christian! Nice to meet you.')
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(page.getByText('Mission complete!')).toBeVisible()
})

test('loads the general Hack Club Slack preset', async ({ page }) => {
  await page.goto('/program/slack')
  await expect(page.getByText('Welcome to Hack Club', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /welcome to #lounge/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'announcements', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'news-wire', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /let’s get started/i }).click()
  await page.getByRole('button', { name: 'slack-guide', exact: true }).click()
  await expect(page.getByText('Mission complete!')).toBeVisible()
  await page.getByRole('button', { name: /next mission/i }).click()
  await expect(page.getByLabel('Message lounge')).toBeVisible()
})

test('redirects unknown program and error routes to Hack Club', async ({ page }) => {
  await page.route('https://hackclub.com/', (route) => route.fulfill({
    contentType: 'text/html',
    body: '<h1>Hack Club</h1>',
  }))
  await page.goto('/program/not-a-real-program')
  await expect(page).toHaveURL('https://hackclub.com/')
  await expect(page.getByRole('heading', { name: 'Hack Club' })).toBeVisible()
})

test('uses the configured help channel in general Slack search results', async ({ page }) => {
  await page.goto('/program/slack')
  await page.evaluate(() => localStorage.setItem('onboarding:slack', JSON.stringify({ completed: ['channels', 'messages', 'pings', 'dms', 'threads', 'reactions'] })))
  await page.reload()

  await expect(page.getByRole('heading', { name: /search before asking again/i })).toBeVisible()
  await page.getByRole('button', { name: /search hack club/i }).click()
  await page.getByPlaceholder('Search messages, people, and channels').fill('hardware help')
  await page.getByPlaceholder('Search messages, people, and channels').press('Enter')
  await expect(page.locator('.message-search-results > button').filter({ hasText: 'help' })).toBeVisible()
  await expect(page.getByText('stardance-help', { exact: true })).toHaveCount(0)
})

test('supports canvases, channel discovery, read-only channels, and scoped search', async ({ page }) => {
  await page.goto('/program/stardance')
  await page.addStyleTag({ content: '.coach, .guide-dim, .guide-spotlight, .guide-arrow { display: none !important; }' })

  await page.getByRole('button', { name: 'Your Guide to using Slack' }).click()
  await expect(page.getByRole('heading', { name: 'Your Guide to using Slack' })).toBeVisible()
  await expect(page.getByText('Channels keep conversations organized')).toBeVisible()

  await page.getByRole('button', { name: 'Discover channels' }).click()
  await expect(page.getByRole('heading', { name: 'Public and active personal channels you can join' })).toBeVisible()
  await expect(page.locator('.channel-list').getByRole('button', { name: 'hardware', exact: true })).toHaveCount(0)
  await page.locator('.discovery-list article').filter({ hasText: 'hardware' }).getByRole('button', { name: 'Join channel' }).click()
  await expect(page.locator('.discovery-list article').filter({ hasText: 'hardware' }).getByRole('button', { name: 'Joined' })).toBeDisabled()
  await expect(page.locator('.channel-list').getByRole('button', { name: 'hardware', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'announcements', exact: true }).click()
  await expect(page.getByText('Only certain people can post in this channel')).toBeVisible()
  await expect(page.getByLabel('Message announcements')).toHaveCount(0)

  await page.getByRole('button', { name: /search hack club/i }).click()
  await page.getByPlaceholder('Search messages, people, and channels').fill('in:hardware')
  await page.getByPlaceholder('Search messages, people, and channels').press('Enter')
  await expect(page.getByText('In: hardware')).toBeVisible()
  await expect(page.locator('.message-search-results > button').filter({ hasText: 'hardware' })).toBeVisible()
})

test('fuzzy-searches conversations and completes typed mentions from the keyboard', async ({ page }) => {
  await page.goto('/program/slack')
  await page.addStyleTag({ content: '.coach, .guide-dim, .guide-spotlight, .guide-arrow { display: none !important; }' })

  await page.getByRole('button', { name: /search hack club/i }).click()
  const search = page.getByPlaceholder('Search messages, people, and channels')
  await search.fill('hrdwr')
  await expect(page.getByRole('listbox', { name: 'Search suggestions' }).getByRole('option', { name: /hardware/i })).toBeVisible()
  await search.press('ArrowDown')
  await search.press('Enter')
  await expect(page.getByRole('heading', { level: 2, name: /hardware/i })).toBeVisible()

  const composer = page.getByLabel('Message hardware')
  await composer.fill('Could @nv')
  const people = page.getByRole('listbox', { name: 'People to ping' })
  await expect(people.getByRole('option', { name: /Nova/i })).toBeVisible()
  await composer.press('Enter')
  await expect(composer).toHaveValue('Could @Nova ')

  await page.getByRole('button', { name: /search hack club/i }).click()
  const memberSearch = page.getByPlaceholder('Search messages, people, and channels')
  await memberSearch.fill('chrs')
  await memberSearch.press('ArrowDown')
  await memberSearch.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Christian', exact: true })).toBeVisible()
})

test('completes the search lesson when hardware is opened from live suggestions', async ({ page }) => {
  await page.goto('/program/slack')
  await page.evaluate(() => localStorage.setItem('onboarding:slack', JSON.stringify({ completed: ['channels', 'messages', 'pings', 'dms', 'threads', 'reactions'] })))
  await page.reload()

  await expect(page.getByRole('heading', { name: /search before asking again/i })).toBeVisible()
  await page.getByRole('button', { name: /search hack club/i }).click()
  await page.getByPlaceholder('Search messages, people, and channels').fill('hardware help')
  await page.getByRole('button', { name: /hardware channel/i }).click()

  await expect(page.getByRole('heading', { level: 2, name: /hardware/i })).toBeVisible()
  await expect(page.getByText('Mission complete!')).toBeVisible()
})

test('routes identity questions through its FAQ canvas', async ({ page }) => {
  await page.goto('/program/stardance')
  await page.addStyleTag({ content: '.coach, .guide-dim, .guide-spotlight, .guide-arrow { display: none !important; }' })
  await page.getByRole('button', { name: 'identity-help', exact: true }).click()
  await page.getByRole('button', { name: 'Identity FAQ' }).click()
  await expect(page.getByRole('heading', { name: 'Identity FAQ' })).toBeVisible()
})

test('models the reusable YSWS support-ticket flow', async ({ page }) => {
  await page.goto('/program/stardance')
  await page.addStyleTag({ content: '.coach, .guide-dim, .guide-spotlight, .guide-arrow { display: none !important; }' })
  await page.locator('.channel-list').getByText('stardance-help', { exact: true }).click()

  await page.getByLabel('Message stardance-help').fill('Where can I find the FAQ?')
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.getByRole('button', { name: /1 reply/i }).click()
  await expect(page.getByText('Heidi the Astronaut')).toBeVisible()
  await page.getByRole('button', { name: 'Mark as resolved' }).click()
  await expect(page.getByRole('button', { name: 'Resolved' })).toBeDisabled()

  await page.locator('.thread-faq-link').click()
  await expect(page.getByRole('heading', { name: 'Stardance Challenge FAQ' })).toBeVisible()
  await expect(page.getByText('What is the Stardance Challenge?')).toBeVisible()
})

test('builds and downloads a campaign config', async ({ page }) => {
  await page.goto('/program-builder')

  await expect(page.getByRole('heading', { name: 'My Program' })).toBeVisible()
  await expect(page.getByText('Ready to export')).toBeVisible()
  await page.getByLabel('Program name').fill('Moonshot')
  await expect(page.getByLabel('URL slug')).toHaveValue('moonshot')
  await expect(page.locator('.builder-preview pre')).toContainText('slug: moonshot')
  await expect(page.locator('.builder-preview pre')).toContainText('moonshot-help')
  await expect(page.locator('.builder-preview pre')).toContainText('read_only:')
  await page.getByLabel('Title').fill('Channels are organized by topic')
  await expect(page.locator('.builder-preview pre')).toContainText('Channels are organized by topic')

  await page.getByRole('button', { name: 'Support', exact: true }).click()
  await page.getByLabel('Bot name').fill('Program Support')
  await page.getByLabel('Acknowledgement').fill('Hi {{author}} — the {{program}} team received your question.')
  await page.getByLabel('FAQ title').fill('Moonshot FAQ')
  await page.getByLabel('FAQ introduction').fill('Read this first.')
  await page.getByLabel('FAQ questions and answers').fill('When are reviews? | Check the published schedule.')
  await expect(page.locator('.builder-preview pre')).toContainText('bot_name: Program Support')
  await expect(page.locator('.builder-preview pre')).toContainText('faq_title: Moonshot FAQ')
  await expect(page.getByText('public/programs/moonshot/logo.svg')).toBeVisible()
  await expect(page.getByText('Pings · Direct messages · Threads · Reactions')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Program name')).toHaveValue('Moonshot')

  await page.getByLabel('Hack Club Auth URL').fill('javascript:alert(1)')
  await expect(page.getByText(/must be an HTTP or HTTPS URL/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /download config.yaml/i })).toBeDisabled()
  await page.getByLabel('Hack Club Auth URL').fill('https://auth.hackclub.com/join/moonshot')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /download config.yaml/i }).click()
  await expect((await downloadPromise).suggestedFilename()).toBe('config.yaml')
})
