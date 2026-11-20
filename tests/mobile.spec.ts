import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 340, height: 510 }, isMobile: true, hasTouch: true })

for (const program of ['slack', 'stardance']) {
  test(`${program} can return from a DM to search without the guide blocking it`, async ({ page }) => {
    await page.goto(`/program/${program}/step/dms`)
    const search = page.getByPlaceholder('Search messages, people, and channels')
    await page.locator('.mobile-home-search').tap()
    await search.fill('Christian')
    await page.getByRole('button', { name: 'Open DM with Christian', exact: true }).tap()
    await expect(page.locator('.channel-header h2')).toHaveText('Christian')
    await expect(page.locator('.channel-header')).not.toContainText('82,896')
    await expect(page.locator('.mobile-channel-meta')).toHaveText('Direct message')
    await expect(page.locator('.completion-modal')).toHaveCount(0)
    await page.locator('.mobile-channel-back').tap()
    await page.locator('.mobile-home-search').tap()
    await search.fill('Christian')
    await page.getByRole('button', { name: 'Open DM with Christian', exact: true }).tap()
    await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled()
    await page.locator('.composer input').fill('Hello Christian!')
    await page.getByRole('button', { name: 'Send message', exact: true }).tap()
    await expect(page.locator('.completion-modal')).toBeVisible()
  })
}
