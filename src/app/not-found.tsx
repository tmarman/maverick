'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  ArrowLeft,
  Tv,
  Signal
} from 'lucide-react'

export default function NotFound() {
  const [showStatic, setShowStatic] = useState(false)

  // Add some subtle animation to the static effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowStatic(prev => !prev)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* TV Color Bars */}
      <div className="flex-1 flex">
        {/* Classic SMPTE Color Bars */}
        <div className="flex-1 flex flex-col">
          {/* Main AI color bars (top 75%) */}
          <div className="flex-[3] flex">
            <div className="flex-1 bg-slate-200"></div> {/* Neural Silver */}
            <div className="flex-1 bg-cyan-400"></div> {/* Data Cyan */}
            <div className="flex-1 bg-emerald-500"></div> {/* AI Green */}
            <div className="flex-1 bg-blue-500"></div> {/* Algorithm Blue */}
            <div className="flex-1 bg-violet-600"></div> {/* Neural Purple */}
            <div className="flex-1 bg-orange-500"></div> {/* Processing Orange */}
            <div className="flex-1 bg-indigo-700"></div> {/* Deep Learning Indigo */}
          </div>
          
          {/* Second row (middle strip) */}
          <div className="flex-[1] flex">
            <div className="flex-1 bg-indigo-600"></div> {/* Deep Indigo */}
            <div className="flex-1 bg-gray-900"></div> {/* Matrix Black */}
            <div className="flex-1 bg-violet-500"></div> {/* Neural Violet */}
            <div className="flex-1 bg-gray-900"></div> {/* Matrix Black */}
            <div className="flex-1 bg-cyan-400"></div> {/* Data Cyan */}
            <div className="flex-1 bg-gray-900"></div> {/* Matrix Black */}
            <div className="flex-1 bg-slate-200"></div> {/* Neural Silver */}
          </div>
          
          {/* Bottom strip with grayscale */}
          <div className="flex-[1] flex">
            <div className="flex-[4] bg-gradient-to-r from-gray-900 via-gray-600 to-gray-300"></div>
            <div className="flex-1 bg-gray-900"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Static noise overlay */}
      {showStatic && (
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Center overlay with message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-lg p-8 max-w-md text-center">
          {/* TV Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Tv className="w-16 h-16 text-white" />
              <Signal className="w-6 h-6 text-red-500 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>

          {/* Message */}
          <div className="mb-6 space-y-3">
            <h1 className="text-3xl font-bold text-white font-mono">
              NO SIGNAL
            </h1>
            <div className="text-lg text-gray-300 font-mono">
              404 • PAGE NOT FOUND
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              We're experiencing technical difficulties.
              <br />
              The requested page is temporarily unavailable.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/app" className="w-full">
              <Button className="w-full bg-white text-black hover:bg-gray-100 font-medium">
                Return to Dashboard
              </Button>
            </Link>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.history.back()}
              className="w-full border-white/40 text-white hover:bg-white/20 hover:text-white"
            >
              Go Back
            </Button>
          </div>

          {/* Station ID */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="text-xs text-gray-500 font-mono">
              MAVERICK-TV • STATION ID: 404
            </div>
          </div>
        </div>
      </div>

      {/* Corner logo */}
      <div className="absolute top-4 left-4">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1">
          <img 
            src="/design/icon.png" 
            alt="Maverick" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}