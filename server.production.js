const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const port = process.env.PORT || process.env.WEBSITES_PORT || 3000

console.log('🚀 Starting Maverick in production mode (no WebSocket support)')
console.log('Claude Code integration disabled - using API-based AI providers')

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
    console.log('> AI providers: OpenRouter, OpenAI, Claude API')
    console.log('> WebSocket features disabled for production deployment')
  })
})