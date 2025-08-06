'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Eye, FileText, Presentation, Zap } from 'lucide-react'

interface PresentationGeneratorProps {
  markdownContent: string
  title: string
  theme?: 'dark' | 'light' | 'gradient'
}

export default function PresentationGenerator({ 
  markdownContent, 
  title,
  theme = 'gradient' 
}: PresentationGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [presentationUrl, setPresentationUrl] = useState<string | null>(null)

  const generatePresentation = async () => {
    setIsGenerating(true)
    
    try {
      // Convert markdown to reveal.js HTML
      const response = await fetch('/api/presentations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: markdownContent,
          title: title,
          theme: theme,
          template: 'startup-pitch'
        })
      })

      if (response.ok) {
        const { presentationId, url } = await response.json()
        setPresentationUrl(url)
      } else {
        console.error('Failed to generate presentation')
      }
    } catch (error) {
      console.error('Error generating presentation:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadPresentation = async () => {
    if (!presentationUrl) return

    try {
      const response = await fetch(`/api/presentations/export/${presentationUrl.split('/').pop()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-presentation.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading presentation:', error)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Presentation className="w-5 h-5" />
              Presentation Generator
            </CardTitle>
            <CardDescription>
              Transform your markdown pitch deck into a beautiful presentation
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            🤖 AI-Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Source Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Source Document</span>
          </div>
          <div className="text-sm text-gray-600">
            <div><strong>Title:</strong> {title}</div>
            <div><strong>Content:</strong> {markdownContent.split('\n').length} lines of markdown</div>
            <div><strong>Estimated slides:</strong> {markdownContent.split('## Slide').length} slides</div>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Presentation Theme
          </label>
          <Tabs defaultValue={theme} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gradient">🌈 Gradient</TabsTrigger>
              <TabsTrigger value="dark">🌙 Dark</TabsTrigger>
              <TabsTrigger value="light">☀️ Light</TabsTrigger>
            </TabsList>
            <TabsContent value="gradient" className="mt-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
                <strong>Gradient Theme:</strong> Professional with colorful accents, perfect for startup pitches
              </div>
            </TabsContent>
            <TabsContent value="dark" className="mt-4">
              <div className="p-4 bg-gray-900 rounded-lg text-white">
                <strong>Dark Theme:</strong> Sleek and modern, great for technical presentations
              </div>
            </TabsContent>
            <TabsContent value="light" className="mt-4">
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <strong>Light Theme:</strong> Clean and minimal, perfect for business presentations
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Generation Actions */}
        <div className="flex gap-4">
          <Button 
            onClick={generatePresentation}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-spin" />
                Generating Presentation...
              </>
            ) : (
              <>
                <Presentation className="w-4 h-4 mr-2" />
                Generate Presentation
              </>
            )}
          </Button>

          {presentationUrl && (
            <>
              <Button
                variant="outline"
                onClick={() => window.open(presentationUrl, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={downloadPresentation}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </>
          )}
        </div>

        {/* Generated Presentation Preview */}
        {presentationUrl && (
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-green-800">Presentation Generated Successfully!</span>
            </div>
            
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <iframe
                src={presentationUrl}
                className="w-full h-96 border-0"
                title="Generated Presentation"
              />
            </div>
            
            <div className="mt-4 text-sm text-green-700">
              🎉 Your presentation is ready! Use the controls above to preview full-screen or download as PDF.
            </div>
          </div>
        )}

        {/* Meta Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">🌀 Maverick Meta-Moment</span>
          </div>
          <div className="text-sm text-blue-800">
            You just experienced the Maverick platform in action! You asked for a pitch deck, 
            I generated markdown, you wanted a real presentation, and now we're building the 
            actual presentation generator. This generator will become a template that others 
            can use. <strong>The platform literally builds itself through user needs!</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}