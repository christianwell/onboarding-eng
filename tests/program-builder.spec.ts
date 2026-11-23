import { expect, test } from '@playwright/test'
import { parse, stringify } from 'yaml'

test('the builder blocks empty guides and read-only practice posting, then recovers', async ({ page }) => {
  await page.goto('/program-builder')
  const download = page.getByRole('button', { name: 'Download config.yaml' })
  const copy = page.getByRole('button', { name: 'Copy', exact: true })
  await expect(download).toBeEnabled()
  await expect(copy).toBeEnabled()
  for (const lesson of await page.locator('#lessons button').all()) await lesson.click()
  await expect(download).toBeDisabled()
  await expect(copy).toBeDisabled()
  await expect(page.locator('.builder-error')).toContainText('At least one training lesson')
  await page.locator('#lessons button').filter({ has: page.getByText('Messages', { exact: true }) }).click()
  await expect(download).toBeEnabled()
  await page.getByRole('combobox', { name: 'Practice channel', exact: true }).selectOption('my-program-bulletin')
  await expect(download).toBeDisabled()
  await expect(copy).toBeDisabled()
  await expect(page.locator('.builder-error')).toContainText('practice channel must allow posting')
  await page.getByRole('combobox', { name: 'Practice channel', exact: true }).selectOption('my-program')
  await expect(download).toBeEnabled()
  await expect(copy).toBeEnabled()
})

for (const invalid of ['empty', 'read-only', 'read-only-step']) {
  test(`loading a ${invalid} guide redirects rather than offering an impossible lesson`, async ({ page }) => {
    await page.route('**/programs/stardance/config.yaml', async (route) => {
      const response = await route.fetch()
      const config = parse(await response.text())
      config.training.lessons = invalid === 'empty' ? [] : invalid === 'read-only-step' ? ['search'] : ['messages']
      if (invalid !== 'empty') config.training.practice_channel = 'announcements'
      await route.fulfill({ response, body: stringify(config) })
    })
    await page.route('https://hackclub.com/', (route) => route.fulfill({ contentType: 'text/html', body: 'Hack Club redirect' }))
    await page.goto(invalid === 'read-only-step' ? '/program/stardance/step/messages' : '/program/stardance')
    await expect(page).toHaveURL('https://hackclub.com/')
  })
}
