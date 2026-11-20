import { expect, test, type Page } from '@playwright/test'

async function startDemo(page: Page, path = '/demo') {
  await page.goto(path)
  await expect(page.getByText('An interactive Slack learning demo, not an official Slack product.')).toBeVisible()
  await expect(page.getByText('No sign-in or joining Hack Club required.')).toBeVisible()
  await expect(page.getByRole('link')).toHaveCount(0)
  await page.getByRole('button', { name: 'Let’s get started' }).click()
  await expect(page.getByRole('heading', { name: 'Replies belong in threads' })).toBeVisible()
}

async function finishDemo(page: Page) {
  await page.getByRole('button', { name: '2 replies View thread', exact: true }).first().click()
  await page.getByRole('textbox', { name: 'Reply to Nova', exact: true }).fill('Nice project! How did you build it?')
  await page.getByRole('button', { name: 'Send reply', exact: true }).click()
  await expect(page.getByRole('heading', { name: "You're done — you can close this tab." })).toBeVisible()
}

for (const width of [1440, 340]) {
  test(`standalone demo ends without any onboarding handoff at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 340 ? 510 : 900 })
    await page.addInitScript(() => {
      window.addEventListener('hackclub:onboarding-complete', () => { document.body.dataset.handoff = 'yes' })
    })
    await startDemo(page, '/demo?return_to=https://slack.hackclub.com')
    await expect(page.getByRole('link')).toHaveCount(0)
    await page.getByRole('button', { name: '2 replies View thread', exact: true }).first().click()
    await expect(page.getByRole('button', { name: 'Send reply', exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Close thread', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Replies belong in threads' })).toBeVisible()
    await finishDemo(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    await expect(page.getByRole('link')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Close tab' })).toHaveCount(0)
    await expect(page.locator('body')).not.toHaveAttribute('data-handoff', 'yes')
    // Wait beyond the regular guide's automatic handoff deadline.
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/\/demo\?return_to=/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Interactive Slack learning demo', exact: true })).toBeVisible()
    await page.goto('/slack')
    await expect(page.getByRole('heading', { name: 'Let’s get you settled in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Let’s get started' })).toBeVisible()
  })
}

test('alias supports keyboard entry and a browser-opened tab can close after completion', async ({ page }) => {
  await page.goto('/hacker-news/')
  await expect(page.getByRole('heading', { name: 'Interactive Slack learning demo', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Let’s get started' })).toBeFocused()
  const popupPromise = page.waitForEvent('popup')
  await page.evaluate(() => window.open('/demo'))
  const popup = await popupPromise
  await startDemo(popup)
  await finishDemo(popup)
  const closed = popup.waitForEvent('close')
  await popup.getByRole('button', { name: 'Close tab' }).click()
  await closed
})
