import { chromium } from '@playwright/test'
import { createServer } from 'vite'
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const frames = await mkdtemp(join(tmpdir(), 'channels-preview-'))
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
let browser

try {
  await server.listen()
  const port = server.httpServer.address().port
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 960, height: 504 }, deviceScaleFactor: 1 })
  await page.goto(`http://127.0.0.1:${port}/program/stardance/step/channels/`)
  await page.getByRole('dialog', { name: 'Stardance onboarding guide' }).getByText('Open the sidebar, and then choose #stardance.').waitFor()
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.coach')).opacity === '1')
  await page.waitForTimeout(450)
  const target = await page.getByRole('button', { name: 'stardance', exact: true }).boundingBox()
  const destination = { x: target.x + target.width / 2, y: target.y + target.height / 2 }

  await mkdir('public/previews', { recursive: true })
  for (let frame = 0; frame < 36; frame++) {
    const output = join(frames, `${String(frame).padStart(3, '0')}.png`)
    if (frame >= 24) {
      await copyFile(join(frames, '023.png'), output)
      continue
    }
    if (frame < 17) {
      const progress = Math.max(0, (frame - 3) / 13)
      await page.mouse.move(890 + (destination.x - 890) * progress, 85 + (destination.y - 85) * progress)
    }
    if (frame === 18) await page.mouse.click(destination.x, destination.y)
    if (frame >= 18) await page.waitForTimeout(90)
    await page.screenshot({ path: output })
  }
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(frames, '000.png'), '-frames:v', '1', 'public/previews/stardance-channels.png'])
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '10', '-i', join(frames, '%03d.png'), '-filter_complex', '[0:v]split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', 'public/previews/stardance-channels.gif'])
} finally {
  await browser?.close()
  await server.close()
  await rm(frames, { recursive: true, force: true })
}
