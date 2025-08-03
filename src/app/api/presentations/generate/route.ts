import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

interface GenerateRequest {
  markdown: string
  title: string
  theme: 'dark' | 'light' | 'gradient'
  template: string
}

export async function POST(request: NextRequest) {
  try {
    const { markdown, title, theme, template }: GenerateRequest = await request.json()

    // Generate unique presentation ID
    const presentationId = randomUUID()
    
    // Convert markdown to reveal.js slides
    const revealHtml = markdownToRevealJs(markdown, title, theme)
    
    // Create presentation directory
    const presentationDir = join(process.cwd(), 'public', 'presentations', presentationId)
    await mkdir(presentationDir, { recursive: true })
    
    // Write HTML file
    const htmlPath = join(presentationDir, 'index.html')
    await writeFile(htmlPath, revealHtml)
    
    // Return presentation URL
    const presentationUrl = `/presentations/${presentationId}`
    
    return NextResponse.json({
      presentationId,
      url: presentationUrl,
      success: true
    })
  } catch (error) {
    console.error('Error generating presentation:', error)
    return NextResponse.json(
      { error: 'Failed to generate presentation' },
      { status: 500 }
    )
  }
}

function markdownToRevealJs(markdown: string, title: string, theme: 'dark' | 'light' | 'gradient'): string {
  // Parse markdown into slides (split by "## Slide" or "---")
  const slides = parseMarkdownSlides(markdown)
  
  // Get theme CSS
  const themeStyles = getThemeStyles(theme)
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/black.css" id="theme">
    
    <style>
        ${themeStyles}
        
        /* Custom Maverick Styles */
        .reveal .slides section {
            text-align: left;
            font-size: 1.2em;
        }
        
        .reveal h1, .reveal h2, .reveal h3 {
            color: var(--heading-color);
            font-weight: bold;
            margin-bottom: 1em;
        }
        
        .reveal .title-slide {
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .reveal .title-slide h1 {
            font-size: 2.5em;
            margin-bottom: 0.5em;
            background: var(--gradient-bg);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .reveal .meta-moment {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5em;
            border-radius: 15px;
            margin: 1em 0;
            border-left: 5px solid #ffd700;
        }
        
        .reveal .highlight-box {
            background: var(--box-bg);
            padding: 1.5em;
            border-radius: 10px;
            margin: 1em 0;
            border-left: 4px solid var(--accent-color);
        }
        
        .reveal .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1em;
            margin: 1em 0;
        }
        
        .reveal .stat-item {
            background: var(--stat-bg);
            padding: 1em;
            border-radius: 8px;
            text-align: center;
        }
        
        .reveal code {
            background: var(--code-bg);
            padding: 0.2em 0.5em;
            border-radius: 4px;
            font-family: 'Fira Code', monospace;
        }
        
        .reveal pre {
            background: var(--code-bg);
            padding: 1em;
            border-radius: 8px;
            overflow-x: auto;
        }
        
        .reveal ul, .reveal ol {
            margin: 1em 0;
        }
        
        .reveal li {
            margin: 0.5em 0;
        }
        
        .reveal .emoji {
            font-size: 1.5em;
            margin-right: 0.3em;
        }
        
        .reveal .fragment {
            transition: all 0.3s ease;
        }
        
        /* Animation classes */
        .spiral-in {
            animation: spiralIn 1s ease-out;
        }
        
        @keyframes spiralIn {
            from {
                transform: rotate(180deg) scale(0);
                opacity: 0;
            }
            to {
                transform: rotate(0deg) scale(1);
                opacity: 1;
            }
        }
    </style>
</head>

<body>
    <div class="reveal">
        <div class="slides">
            ${slides.map((slide, index) => generateSlideHtml(slide, index === 0)).join('\n')}
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/markdown/markdown.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/highlight/highlight.js"></script>

    <script>
        Reveal.initialize({
            hash: true,
            transition: 'slide',
            transitionSpeed: 'default',
            backgroundTransition: 'fade',
            plugins: [RevealMarkdown, RevealHighlight],
            center: true,
            controls: true,
            progress: true,
            touch: true,
            loop: false,
            rtl: false,
            navigationMode: 'default',
            shuffle: false,
            fragments: true,
            fragmentInURL: false,
            embedded: false,
            help: true,
            showNotes: false,
            autoSlide: 0,
            autoSlideStoppable: true,
            mouseWheel: false,
            rollingLinks: false,
            previewLinks: false,
            focusBodyOnPageVisibilityChange: true,
            theme: 'black',
            parallaxBackgroundImage: '',
            parallaxBackgroundSize: '',
            parallaxBackgroundHorizontal: null,
            parallaxBackgroundVertical: null,
            viewDistance: 3,
            mobileViewDistance: 2
        });
        
        // Add custom animations
        Reveal.addEventListener('slidechanged', function(event) {
            // Add spiral animation to special slides
            if (event.currentSlide.classList.contains('spiral-slide')) {
                event.currentSlide.classList.add('spiral-in');
            }
        });
    </script>
</body>
</html>`
}

function parseMarkdownSlides(markdown: string): string[] {
  // Split by slide separators
  const slideMarkers = ['## Slide ', '---', '# ']
  let slides: string[] = []
  
  // Simple parsing - split by "## Slide" markers
  const parts = markdown.split(/## Slide \d+:/)
  
  if (parts.length > 1) {
    // First part is intro/title
    if (parts[0].trim()) {
      slides.push(parts[0].trim())
    }
    
    // Rest are slides
    slides.push(...parts.slice(1).map(slide => slide.trim()))
  } else {
    // Fallback: split by triple newlines or manual markers
    slides = markdown.split(/\n\n---\n\n/).map(slide => slide.trim())
  }
  
  return slides.filter(slide => slide.length > 0)
}

function generateSlideHtml(slideContent: string, isTitle: boolean = false): string {
  // Convert markdown-style content to HTML
  let html = slideContent
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/^✅ (.*)/gm, '<li class="checkmark">✅ $1</li>')
    .replace(/^❌ (.*)/gm, '<li class="cross">❌ $1</li>')
    .replace(/^🎯 (.*)/gm, '<li class="target">🎯 $1</li>')
    .replace(/^💡 (.*)/gm, '<li class="idea">💡 $1</li>')
    .replace(/^🚀 (.*)/gm, '<li class="rocket">🚀 $1</li>')
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li.*<\/li>\s*)+/g, '<ul>$&</ul>')
  
  // Add special styling for certain patterns
  if (html.includes('Meta-Moment') || html.includes('🌀')) {
    html = `<div class="meta-moment">${html}</div>`
  }
  
  if (html.includes('Success Metrics') || html.includes('Revenue')) {
    html = html.replace(/([\d$]+[MBK]?\+?)/g, '<span class="highlight-stat">$1</span>')
  }
  
  const slideClass = isTitle ? 'title-slide' : ''
  const dataAttributes = html.includes('🌀') ? 'data-background-gradient="linear-gradient(45deg, #667eea 0%, #764ba2 100%)"' : ''
  
  return `<section class="${slideClass}" ${dataAttributes}>
    ${html}
  </section>`
}

function getThemeStyles(theme: 'dark' | 'light' | 'gradient'): string {
  const themes = {
    dark: `
      :root {
        --bg-color: #1a1a1a;
        --text-color: #ffffff;
        --heading-color: #4fc3f7;
        --accent-color: #ff6b6b;
        --box-bg: rgba(255, 255, 255, 0.1);
        --stat-bg: rgba(79, 195, 247, 0.2);
        --code-bg: rgba(255, 255, 255, 0.1);
        --gradient-bg: linear-gradient(135deg, #4fc3f7 0%, #ff6b6b 100%);
      }
      .reveal {
        background: var(--bg-color);
        color: var(--text-color);
      }
    `,
    light: `
      :root {
        --bg-color: #ffffff;
        --text-color: #333333;
        --heading-color: #2196f3;
        --accent-color: #ff5722;
        --box-bg: #f5f5f5;
        --stat-bg: rgba(33, 150, 243, 0.1);
        --code-bg: #f8f8f8;
        --gradient-bg: linear-gradient(135deg, #2196f3 0%, #ff5722 100%);
      }
      .reveal {
        background: var(--bg-color);
        color: var(--text-color);
      }
    `,
    gradient: `
      :root {
        --bg-color: #667eea;
        --text-color: #ffffff;
        --heading-color: #ffd700;
        --accent-color: #ff6b6b;
        --box-bg: rgba(255, 255, 255, 0.15);
        --stat-bg: rgba(255, 215, 0, 0.2);
        --code-bg: rgba(0, 0, 0, 0.2);
        --gradient-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .reveal {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: var(--text-color);
      }
    `
  }
  
  return themes[theme]
}