import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

import puppeteer from 'puppeteer'

interface ExportRequest {
  format: 'pdf' | 'png' | 'jpeg'
  quality?: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { format = 'pdf', quality = 90 }: ExportRequest = await request.json()
    const { id: presentationId } = await params


    // Read the presentation HTML
    const presentationPath = join(process.cwd(), 'public', 'presentations', presentationId, 'index.html')
    const html = await readFile(presentationPath, 'utf-8')

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Set viewport for presentation
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Load the presentation
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    // Wait for reveal.js to initialize
    await page.waitForFunction(() => (window as any).Reveal && (window as any).Reveal.isReady())
    
    let buffer: Uint8Array

    if (format === 'pdf') {
      // Generate PDF with all slides
      buffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })
    } else {
      // Generate image (PNG/JPEG)
      buffer = await page.screenshot({
        type: format as 'png' | 'jpeg',
        quality: format === 'jpeg' ? quality : undefined,
        fullPage: true
      })
    }

    await browser.close()

    // Return the file
    const mimeTypes = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpeg: 'image/jpeg'
    }

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': mimeTypes[format],
        'Content-Disposition': `attachment; filename="presentation.${format}"`
      }
    })

  } catch (error) {
    console.error('Error exporting presentation:', error)
    return NextResponse.json(
      { error: 'Failed to export presentation' },
      { status: 500 }
    )
  }
}

// Alternative implementation without puppeteer (if puppeteer is too heavy)
async function exportWithoutPuppeteer(presentationId: string, format: string) {
  // For environments where puppeteer is not available,
  // we could implement:
  // 1. HTML to PDF using jsPDF
  // 2. Canvas-based rendering
  // 3. Server-side rendering with headless browsers in Docker
  
  return NextResponse.json(
    { error: 'PDF export requires puppeteer - coming soon!' },
    { status: 501 }
  )
}