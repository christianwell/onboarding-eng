import { expect, test } from '@playwright/test'

test('right-click leaves the requested channel, not the open conversation', async ({ page }) => {
  await page.goto('/step/leave-channel+#stardance-help')
  await expect(page.locator('.task-box strong')).toHaveText('Right-click #stardance-help → Leave channel')
  await page.locator('.channel-list').getByRole('button', { name: 'slack-guide', exact: true }).click()
  await page.locator('.channel-list').getByRole('button', { name: /^stardance-help(?: 1)?$/ }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Leave channel', exact: true }).click()
  await expect(page.locator('.channel-list').getByRole('button', { name: /^stardance-help(?: 1)?$/ })).toHaveCount(0)
  await expect(page.locator('.channel-header h2')).toHaveText('slack-guide')
  await expect(page.locator('.completion-modal')).toBeVisible()
})

test('Escape, outside click, and leaving another channel do not complete the lesson', async ({ page }) => {
  await page.goto('/step/leave-channel+#code')
  const target = page.locator('.channel-list').getByRole('button', { name: 'code', exact: true })
  await target.click({ button: 'right' })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(target).toBeVisible()
  await target.click({ button: 'right' })
  await page.locator('.channel-header h2').click()
  await expect(page.getByRole('menu')).toHaveCount(0)
  await page.locator('.channel-list').getByRole('button', { name: 'slack-guide', exact: true }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Leave channel', exact: true }).click()
  await expect(page.locator('.channel-list').getByRole('button', { name: 'slack-guide', exact: true })).toHaveCount(0)
  await expect(page.locator('.channel-header h2')).toHaveText('code')
  await expect(page.getByRole('heading', { name: 'How to leave a channel' })).toBeVisible()
  await expect(page.locator('.completion-modal')).toHaveCount(0)
  await page.reload()
  await expect(target).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How to leave a channel' })).toBeVisible()
})

test('header menu works on short mobile screens with an encoded target', async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 510 })
  await page.goto('/program/stardance/step/leave-channel+%23hardware')
  await expect(page.locator('.channel-header h2')).toHaveText('hardware')
  await expect(page.locator('.task-box')).toContainText('#hardware')
  const trigger = page.getByRole('button', { name: 'More channel actions', exact: true })
  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(page.locator('.completion-modal')).toHaveCount(0)
  await trigger.click()
  await page.getByRole('menuitem', { name: 'Leave channel', exact: true }).click()
  await expect(page.locator('.completion-modal')).toBeVisible()
  await expect(page.locator('.mobile-home-list').getByRole('button', { name: 'hardware', exact: true })).toHaveCount(0)
})

for (const program of ['slack', 'stardance']) {
  test(`${program} advances into and out of leave-channel in the configured guide`, async ({ page }) => {
    // Exercise the surrounding transitions without replaying unrelated lessons.
    await page.route(`**/programs/${program}/config.yaml`, async (route) => {
      const response = await route.fetch()
      const yaml = (await response.text()).replace(/  lessons:\n(?:    - [^\n]+\n)+/, '  lessons:\n    - channels\n    - leave-channel\n    - safety\n')
      await route.fulfill({ response, body: yaml })
    })
    await page.goto(`/program/${program}`)
    await page.getByRole('button', { name: 'Let’s get started' }).click()
    await page.locator('.channel-list').getByRole('button', { name: program === 'slack' ? 'slack-guide' : 'stardance', exact: true }).click()
    const practiceChannel = program === 'slack' ? 'lounge' : 'stardance'
    await expect(page.getByRole('heading', { name: 'How to leave a channel' })).toBeVisible()
    await expect(page.locator('.channel-header h2')).toHaveText(practiceChannel)
    await page.locator('.channel-list').getByRole('button', { name: new RegExp(`^${practiceChannel}(?: 1)?$`) }).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Leave channel', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Oh, looks like you got a DM!' })).toBeVisible()
    await expect(page.locator('.channel-list').getByRole('button', { name: new RegExp(`^${practiceChannel}(?: 1)?$`) })).toHaveCount(0)
    await expect(page.locator('.completion-modal')).toHaveCount(0)
  })
}

test('plain standalone lesson uses the configured practice channel', async ({ page }) => {
  await page.goto('/step/leave-channel')
  await expect(page.locator('.channel-header h2')).toHaveText('lounge')
  await page.getByRole('button', { name: 'More channel actions', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Leave channel', exact: true }).click()
  await expect(page.locator('.completion-modal')).toBeVisible()
  await expect(page.locator('.channel-header h2')).toHaveText('announcements')
})
