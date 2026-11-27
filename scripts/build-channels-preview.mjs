import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { parse } from 'yaml'

const config = parse(await readFile('public/programs/stardance/config.yaml', 'utf8'))
const path = 'dist/program/stardance/step/channels'
const html = await readFile('dist/index.html', 'utf8')
const title = 'Slack uses channels · Stardance'
const description = 'Open the sidebar, and then choose #stardance.'
const origin = process.argv[2] === 'github'
  ? 'https://christianwell.github.io/onboarding-eng'
  : 'https://welcome.hackclub.com'
const image = `${origin}/previews/stardance-channels.gif`
const tags = `
    <meta name="description" content="${description}" />
    <meta property="og:site_name" content="Slack Flight School" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:type" content="image/gif" />
    <meta property="og:image:width" content="960" />
    <meta property="og:image:height" content="504" />
    <meta property="og:image:alt" content="${title}" />
    <meta name="twitter:image" content="${origin}/previews/stardance-channels.png" />`

if (config.program.slug !== 'stardance' || !config.training.lessons.includes('channels')) {
  throw new Error('Stardance channels lesson is no longer available')
}

const preview = html
  .replace('<meta property="og:title" content="Hack Club" />', `<meta property="og:title" content="${title}" />${tags}`)
  .replace('<meta name="theme-color" content="#241b4b" />', `<meta name="theme-color" content="${config.program.color}" />`)
  .replace('<meta name="twitter:card" content="summary" />', '<meta name="twitter:card" content="summary_large_image" />')
  .replace('<meta name="twitter:title" content="Hack Club" />', `<meta name="twitter:title" content="${title}" />`)
  .replace('<title>Hack Club</title>', `<title>${title}</title>`)

if (preview === html || !preview.includes(tags)) throw new Error('Could not add preview metadata')
await mkdir(path, { recursive: true })
await writeFile(`${path}/index.html`, preview)
