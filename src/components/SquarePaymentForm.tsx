'use client'

import { useEffect, useRef, useState } from 'react'

interface SquarePaymentFormProps {
  amount: number // in cents
  description: string
  businessData: any
  onSuccess: (result: any) => void
  onError: (error: any) => void
}

export function SquarePaymentForm({ 
  amount, 
  description, 
  businessData, 
  onSuccess, 
  onError 
}: SquarePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [squareLoaded, setSquareLoaded] = useState(false)
  const paymentFormRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<any>(null)
  const paymentsRef = useRef<any>(null)

  useEffect(() => {
    // Load Square Web Payments SDK
    const script = document.createElement('script')
    script.src = 'https://sandbox-web.squarecdn.com/v1/square.js' // Use production URL for live
    script.async = true
    script.onload = initializeSquare
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const initializeSquare = async () => {
    if (!window.Square) {
      console.error('Square.js failed to load')
      return
    }

    try {
      // Initialize Square Payments
      // Note: You'll need to replace this with your actual Square Application ID
      paymentsRef.current = window.Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 'sandbox-sq0idb-your-app-id', 
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'your-location-id'
      )

      const card = await paymentsRef.current.card()
      await card.attach('#card-container')
      cardRef.current = card

      setSquareLoaded(true)
    } catch (error) {
      console.error('Failed to initialize Square:', error)
      onError(error)
    }
  }

  const handlePayment = async () => {
    if (!cardRef.current) {
      onError(new Error('Payment form not initialized'))
      return
    }

    setIsLoading(true)

    try {
      const result = await cardRef.current.tokenize()
      
      if (result.status === 'OK') {
        // Send the token to your backend to process the payment
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: result.token,
            amount,
            description,
            businessData,
          }),
        })

        const paymentResult = await response.json()

        if (paymentResult.success) {
          onSuccess(paymentResult)
        } else {
          onError(new Error(paymentResult.error || 'Payment failed'))
        }
      } else {
        onError(new Error(result.errors?.[0]?.message || 'Tokenization failed'))
      }
    } catch (error) {
      console.error('Payment error:', error)
      onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-border-standard p-6">
        <h3 className="font-bold text-text-primary mb-4 flex items-center">
          <span className="mr-2">💳</span>
          Payment Information
        </h3>
        
        {/* Square Card Form */}
        <div 
          id="card-container" 
          ref={paymentFormRef}
          className="min-h-[100px] p-4 border border-border-subtle rounded-lg bg-gray-50"
        >
          {!squareLoaded && (
            <div className="flex items-center justify-center h-24 text-text-muted">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary mr-2"></div>
              Loading secure payment form...
            </div>
          )}
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={!squareLoaded || isLoading}
          className="w-full mt-6 bg-accent-primary hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </>
          ) : (
            <>
              🚀 Complete Business Formation - ${(amount / 100).toFixed(2)}
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="mt-4 flex items-center justify-center text-xs text-text-muted">
          <span className="mr-2">🛡️</span>
          Secured by Square • PCI DSS Compliant • 256-bit SSL Encryption
        </div>
      </div>

      {/* Test Card Information (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🧪 Test Mode</h4>
          <div className="text-sm text-yellow-700">
            <p className="mb-2">Use these test card numbers:</p>
            <ul className="space-y-1 font-mono text-xs">
              <li>• Visa: 4111 1111 1111 1111</li>
              <li>• Mastercard: 5105 1051 0510 5100</li>
              <li>• Any future expiry date</li>
              <li>• Any 3-digit CVV</li>
            </ul>
          </div>
        </div>
      )}

      {/* What Happens Next */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">✨ What happens next?</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. We immediately start your business formation process</p>
          <p>2. You'll receive login credentials for your Maverick dashboard</p>
          <p>3. Our team begins legal paperwork and Square banking setup</p>
          <p>4. You can start building your software while we handle the legal work</p>
          <p>5. Complete business formation typically takes 2-3 business days</p>
        </div>
      </div>
    </div>
  )
}

// Extend the Window interface to include Square
declare global {
  interface Window {
    Square: any
  }
}