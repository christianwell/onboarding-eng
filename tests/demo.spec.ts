import { expect, test } from '@playwright/test'

for (const width of [1440, 340]) {
  test(`the standalone guide teaches channels, messages, and DMs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 340 ? 510 : 900 })
    await page.addInitScript(() => {
      window.addEventListener('hackclub:onboarding-complete', () => { document.body.dataset.handoff = 'yes' })
    })
    await page.goto('/demo?return_to=/flow-tester')
    const guide = page.getByRole('dialog', { name: 'Demo Workspace onboarding guide' })
    await expect(guide.getByRole('heading', { name: /Let’s get you settled in/ })).toBeVisible()
    await expect(guide.getByRole('heading', { name: /Slack uses channels/ })).toHaveCount(0)
    if (width === 340) {
      await expect(page.locator('.mobile-channel-meta')).toHaveText(/\d+ members/)
      await expect(page.locator('.mobile-channel-meta')).not.toHaveText('82,896 members')
    } else {
      await expect(page.locator('.channel-member-count')).toHaveAccessibleName(/\d+ members/)
      await expect(page.locator('.channel-member-count')).not.toHaveAccessibleName('82,896 members')
    }
    await guide.getByRole('button', { name: 'Let’s get started' }).click()

    const channels = width === 340 ? page.getByRole('region', { name: 'Demo Workspace home' }) : page.getByRole('complementary', { name: 'Demo Workspace channels' })
    const chooseChannel = async (name: string) => {
      if (width === 340) await page.getByRole('button', { name: 'Open channel list' }).click()
      await channels.getByRole('button', { name, exact: true }).click()
    }
    const send = page.getByRole('button', { name: 'Send message', exact: true })
    await expect(guide.getByText('Open the sidebar, and then choose #general.')).toBeVisible()
    await chooseChannel('random')
    await expect(guide.getByRole('heading', { name: /Slack uses channels/ })).toBeVisible()
    await chooseChannel('general')
    await expect(guide.getByRole('heading', { name: /Send your first message/ })).toBeVisible()
    await expect(send).toBeDisabled()
    await page.getByRole('textbox', { name: 'Message general', exact: true }).fill('Hello, everyone!')
    await send.click()

    await expect(guide.getByRole('heading', { name: /Send Jules a direct message/ })).toBeVisible()
    await page.getByRole('button', { name: /Search Demo Workspace/ }).click()
    const search = page.getByPlaceholder('Search messages, people, and channels')
    await search.press('Escape')
    await expect(search).toBeHidden()
    await expect(guide.getByRole('heading', { name: /Send Jules a direct message/ })).toBeVisible()
    if (width === 340) await page.getByRole('button', { name: 'Open channel list' }).click()
    await page.getByRole('button', { name: /Search Demo Workspace/ }).click()
    await search.fill('Jules')
    await page.getByRole('button', { name: 'Open DM with Jules' }).click()
    await expect(guide.getByText('Send Jules a friendly hello in this DM.')).toBeVisible()
    await expect(page.locator('.channel-member-count')).toHaveCount(0)
    await expect(page.locator('.channel-heading').getByRole('button', { name: 'View person' })).toHaveCount(0)
    await expect(page.locator('.mobile-channel-meta')).toHaveText('Direct message')
    await expect(send).toBeDisabled()
    await page.getByRole('textbox', { name: 'Message Jules', exact: true }).fill('Hey Jules!')
    await send.click()

    await expect(page.getByText('Step 4 of 4 · Complete')).toBeVisible()
    await expect(page.getByText("You're done — you can close this tab.")).toBeVisible()
    await expect(page.getByRole('link')).toHaveCount(0)
    // Wait beyond the normal guide's automatic handoff deadline.
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/\/demo\?return_to=/)
    await expect(page.locator('body')).not.toHaveAttribute('data-handoff', 'yes')
    await page.reload()
    await expect(guide.getByRole('heading', { name: /Let’s get you settled in/ })).toBeVisible()
  })
}

test('legacy demo paths open the new welcome and /slack keeps the Hack Club guide', async ({ page }) => {
  for (const path of ['/hn', '/hacker-news/']) {
    await page.goto(path)
    await expect(page.getByRole('dialog', { name: 'Demo Workspace onboarding guide' })).toBeVisible()
  }
  await page.goto('/slack')
  await expect(page.getByRole('dialog', { name: 'Hack Club onboarding guide' }).getByRole('button', { name: 'Let’s get started' })).toBeVisible()
})
