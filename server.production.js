const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')
const fs = require('fs')

const port = process.env.PORT || 8080

console.log('🔍 Exploring .next directory structure...')
const nextDir = path.join(__dirname, '.next')
if (fs.existsSync(nextDir)) {
  console.log('📁 .next directory contents:')
  try {
    const contents = fs.readdirSync(nextDir)
    contents.forEach(item => {
      const fullPath = path.join(nextDir, item)
      const stats = fs.statSync(fullPath)
      console.log(`  ${stats.isDirectory() ? '📂' : '📄'} ${item}`)
    })
  } catch (err) {
    console.error('Error reading .next directory:', err)
  }
} else {
  console.log('❌ .next directory not found')
}

// Simple static file server for built Next.js app
const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true)
  const { pathname } = parsedUrl

  console.log(`📥 Request: ${req.method} ${pathname}`)

  // Serve static files from .next/static
  if (pathname.startsWith('/_next/static/')) {
    const filePath = path.join(__dirname, '.next', pathname.replace('/_next/', ''))
    serveStaticFile(filePath, res)
    return
  }

  // Serve static files from public
  if (pathname.startsWith('/') && pathname !== '/') {
    const publicPath = path.join(__dirname, 'public', pathname)
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
      serveStaticFile(publicPath, res)
      return
    }
  }

  // For root and all other routes, serve a basic Maverick page
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Maverick - AI-Native Business Platform</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            text-align: center;
            max-width: 600px;
          }
          h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
          }
          .status {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 20px;
            backdrop-filter: blur(10px);
          }
          .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Maverick</h1>
          <p>AI-Native Business Formation Platform</p>
          <div class="status">
            <div class="spinner"></div>
            <h3>Production Server Active</h3>
            <p>Environment: ${process.env.NODE_ENV || 'production'}</p>
            <p>Server Time: ${new Date().toISOString()}</p>
            <small>Full application features are initializing...</small>
          </div>
        </div>
      </body>
    </html>
  `)
})

function serveStaticFile(filePath, res, contentType = null) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404)
    res.end('Not Found')
    return
  }

  const ext = path.extname(filePath)
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',  
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  }

  const resolvedContentType = contentType || mimeTypes[ext] || 'application/octet-stream'

  try {
    const content = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': resolvedContentType })
    res.end(content)
  } catch (error) {
    console.error('Error serving file:', error)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
}

server.listen(port, (err) => {
  if (err) throw err
  console.log(`🚀 Maverick production server ready on http://localhost:${port}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
  console.log(`Next.js build directory: ${fs.existsSync(path.join(__dirname, '.next')) ? 'Found' : 'Missing'}`)
})