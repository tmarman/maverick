'use client'

import { useState, useEffect } from 'react'

interface Business {
  id: string
  name: string
  description: string | null
  industry: string | null
  status: string
  createdAt: Date
}

interface BusinessListProps {
  selectedBusiness: string | null
  onSelectBusiness: (businessId: string) => void
}

export function BusinessList({ selectedBusiness, onSelectBusiness }: BusinessListProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses')
      if (response.ok) {
        const data = await response.json()
        setBusinesses(data)
      } else {
        console.error('Failed to fetch businesses')
      }
    } catch (error) {
      console.error('Error fetching businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-background-tertiary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🏢</div>
        <p className="text-text-secondary text-sm">No businesses yet</p>
        <button className="mt-3 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-hover">
          Create First Business
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {businesses.map((business) => (
        <div
          key={business.id}
          onClick={() => onSelectBusiness(business.id)}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            selectedBusiness === business.id
              ? 'bg-accent-primary bg-opacity-10 border border-accent-primary'
              : 'bg-background-tertiary hover:bg-border-subtle'
          }`}
        >
          <h4 className="font-medium text-text-primary text-sm">{business.name}</h4>
          {business.industry && (
            <p className="text-xs text-text-secondary mt-1">{business.industry}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              business.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {business.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}