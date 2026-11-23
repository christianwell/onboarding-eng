import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 340, height: 510 }, isMobile: true, hasTouch: true })

for (const program of ['slack', 'stardance']) {
  test(`${program} keeps Notifications guidance clear of the DM composer and menu`, async ({ page }) => {
    for (const height of [729, 354]) {
      await page.setViewportSize({ width: 384, height })
      await page.goto(`/program/${program}/step/notifications`)
      await page.getByRole('button', { name: 'Open channel list', exact: true }).tap()
      await page.locator('.mobile-home-list').getByRole('button', { name: /^N ?Nova$/ }).tap()
      await page.locator('.composer input').fill('A private message during Notifications')
      const send = page.getByRole('button', { name: 'Send message', exact: true })
      await expect.poll(() => send.evaluate((button) => {
        const rect = button.getBoundingClientRect()
        return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))
      })).toBe(true)
      await expect(page.locator('.coach .task-box')).toBeInViewport({ ratio: 1 })
      await send.tap()
      await expect(page.locator('.messages')).toContainText('A private message during Notifications')
      await expect(page.locator('.completion-modal')).toHaveCount(0)
      await page.getByRole('button', { name: 'Notification settings', exact: true }).tap()
      await page.getByRole('button', { name: 'Nothing', exact: true }).tap()
      await expect(page.locator('.completion-modal')).toHaveCount(0)
      await page.getByRole('button', { name: 'Notification settings', exact: true }).tap()
      await page.getByRole('button', { name: 'Mentions & DMs', exact: true }).tap()
      await expect(page.locator('.completion-modal')).toBeVisible()
    }
  })

  test(`${program} keeps a thread above the Messages lesson's background composer`, async ({ page }) => {
    await page.goto(`/program/${program}/step/messages`)
    await page.getByRole('button', { name: '2 replies View thread', exact: true }).tap()
    await page.getByRole('textbox', { name: 'Reply to Nova' }).fill('A reply, not a channel message')
    await page.getByRole('button', { name: 'Send reply', exact: true }).tap()
    await expect(page.locator('.thread-messages')).toContainText('A reply, not a channel message')
    await expect(page.locator('.completion-modal')).toHaveCount(0)
    await page.getByRole('button', { name: 'Close thread' }).tap()
    await page.locator('.composer input').fill('Hello from the practice channel')
    await page.getByRole('button', { name: 'Send message', exact: true }).tap()
    await expect(page.locator('.completion-modal')).toBeVisible()
  })

  test(`${program} keeps thread reply controls reachable above the keyboard`, async ({ page }) => {
    await page.goto(`/program/${program}/step/threads`)
    const openThread = page.getByRole('button', { name: '2 replies View thread' })
    await openThread.tap()
    await page.setViewportSize({ width: 384, height: 354 })
    const send = page.getByRole('button', { name: 'Send reply', exact: true })
    const close = page.getByRole('button', { name: 'Close thread', exact: true })
    for (const control of [close, send]) {
      await expect.poll(() => control.evaluate((button) => {
        const rect = button.getBoundingClientRect()
        return rect.top >= 0 && rect.bottom <= innerHeight
          && button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))
      })).toBe(true)
    }
    await expect(send).toBeDisabled()
    await close.tap()
    await expect(page.locator('.completion-modal')).toHaveCount(0)
    await page.setViewportSize({ width: 340, height: 510 })
    await openThread.tap()
    await page.setViewportSize({ width: 384, height: 354 })
    await page.getByRole('textbox', { name: 'Reply to Nova' }).fill('Looks great!')
    await send.tap()
    await expect(page.locator('.completion-modal')).toBeVisible()
  })

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

for (const width of [620, 621, 720, 768, 785, 913]) {
  test(`the thread target stays clickable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 785 ? 303 : 450 })
    await page.goto('/program/stardance/step/threads')
    await expect(page.locator('.coach .task-box')).toBeInViewport({ ratio: 1 })
    await page.getByRole('button', { name: '2 replies View thread', exact: true }).tap()
    await page.getByRole('textbox', { name: 'Reply to Nova' }).fill('A short landscape reply')
    await page.getByRole('button', { name: 'Send reply', exact: true }).tap()
    await expect(page.locator('.completion-modal')).toBeVisible()
  })
}
