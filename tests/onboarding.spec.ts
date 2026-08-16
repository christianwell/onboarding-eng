import { expect, test } from '@playwright/test'

test('returns to the calling website after all nine lessons', async ({ page }) => {
  test.setTimeout(45_000)
  await page.goto('/flow-tester')
  await page.getByLabel('Your name').fill('Ada')
  await page.getByLabel('What are you making?').fill('A constellation game')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading', { name: /learn the hack club slack/i })).toBeVisible()
  await page.getByRole('button', { name: /start slack onboarding/i }).click()

  await expect(page.getByRole('heading', { name: /let’s get you settled in/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /welcome to #stardance/i })).toBeVisible()
  await expect(page.locator('.channel-list').getByText('Channels', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'planet', exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Channel tabs' }).getByRole('button', { name: /your guide to using slack/i })).toBeVisible()
  await page.getByRole('button', { name: /let’s get started/i }).click()

  await page.getByRole('button', { name: 'stardance', exact: true }).click()
  await expect(page.getByText('Mission complete!')).toBeVisible()
  await page.getByRole('button', { name: /next mission/i }).click()

  await page.getByLabel('Message stardance').fill('Hey! I’m building a tiny game this summer 🚀')
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.getByRole('button', { name: /next mission/i }).click()

  await page.getByLabel('Message stardance').fill('@Nova typed without choosing a person')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('heading', { name: /pings are for the right person/i })).toBeVisible()
  await expect(page.getByText('Mission complete!')).toHaveCount(0)
  await page.getByRole('button', { name: /mention someone/i }).click()
  await page.getByRole('option', { name: /Nova/i }).click()
  await page.getByLabel('Message stardance').fill('@Nova I would love to test the mobile version!')
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.getByRole('button', { name: /next mission/i }).click()

  await page.getByRole('button', { name: /search hack club/i }).click()
  await page.getByPlaceholder('Search messages, people, and channels').fill('Christian')
  await page.getByRole('button', { name: /open dm with christian/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Christian', exact: true })).toBeVisible()
  await page.getByLabel('Message Christian').fill('Hey Christian! I’m excited to build a constellation game.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.getByRole('button', { name: /next mission/i }).click()

  await page.getByRole('button', { name: /2 replies/i }).click()
  await page.getByPlaceholder('Reply to Nova…').fill('A different note for every star would be lovely!')
  await page.locator('.thread-composer button').click()
  await page.getByRole('button', { name: /next mission/i }).click()

  await page.locator('.message-tools button').first().click()
  await page.getByRole('button', { name: /next mission/i }).click()

  await page.getByRole('button', { name: /search hack club/i }).click()
  await page.getByPlaceholder('Search messages, people, and channels').fill('hardware help')
  await page.getByPlaceholder('Search messages, people, and channels').press('Enter')
  await expect(page.getByText('3 results for')).toBeVisible()
  await page.getByRole('button', { name: /hardware.*Jules/i }).click()
  await page.getByRole('button', { name: /next mission/i }).click()

  await page.getByRole('button', { name: 'Notification settings' }).click()
  await page.getByRole('button', { name: 'Mentions & DMs' }).click()
  await page.getByRole('button', { name: /next mission/i }).click()

  await page.evaluate(() => {
    window.addEventListener('hackclub:onboarding-complete', (event) => {
      sessionStorage.setItem('completion-message', JSON.stringify((event as CustomEvent).detail))
    }, { once: true })
  })
  await expect(page.getByText('Step 9 of 10')).toBeVisible()
  await page.getByRole('button', { name: /report it to @shroud and finish/i }).click()
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

test('uses the configured help channel in general Slack search results', async ({ page }) => {
  await page.goto('/program/slack')
  await page.evaluate(() => localStorage.setItem('onboarding:slack', JSON.stringify({ completed: ['channels', 'messages', 'pings', 'dms', 'threads', 'reactions'] })))
  await page.reload()

  await expect(page.getByRole('heading', { name: /search before asking again/i })).toBeVisible()
  await page.getByRole('button', { name: /search hack club/i }).click()
  await page.getByPlaceholder('Search messages, people, and channels').fill('hardware help')
  await page.getByPlaceholder('Search messages, people, and channels').press('Enter')
  await expect(page.getByRole('button', { name: /help.*Orbit/i })).toBeVisible()
  await expect(page.getByText('stardance-help', { exact: true })).toHaveCount(0)
})

test('builds and downloads a campaign config', async ({ page }) => {
  await page.goto('/program-builder')

  await expect(page.getByRole('heading', { name: 'My Program' })).toBeVisible()
  await expect(page.getByText('Ready to export')).toBeVisible()
  await page.getByLabel('Program name').fill('Moonshot')
  await expect(page.getByLabel('URL slug')).toHaveValue('moonshot')
  await expect(page.locator('.builder-preview pre')).toContainText('slug: moonshot')
  await expect(page.locator('.builder-preview pre')).toContainText('moonshot-help')
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
