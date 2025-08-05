'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Lightbulb
} from 'lucide-react'

interface FeatureDescription {
  title: string
  description: string
  requirements: string[]
  technicalSpecs?: string[]
  existingCodebase?: string
  dependencies?: string[]
}

interface CostEstimationResult {
  complexity: {
    size: string
    category: string
    estimatedHours: number
    aiAssistanceLevel: string
    riskFactor: number
  }
  estimate: {
    featureSize: string
    developmentHours: number
    aiCosts: {
      planning: number
      coding: number
      review: number
      documentation: number
      total: number
    }
    breakdown: {
      planningTokens: number
      codingTokens: number
      reviewTokens: number
      documentationTokens: number
      totalTokens: number
    }
    recommendedModel: {
      name: string
      provider: string
      inputCostPer1M: number
      outputCostPer1M: number
    }
    totalEstimate: number
    confidence: number
  }
  insights: Array<{
    type: 'info' | 'warning' | 'success'
    title: string
    message: string
    suggestion: string
  }>
  recommendations: Array<{
    type: string
    title: string
    description: string
    action: string
  }>
}

const FeatureCostEstimator: React.FC = () => {
  const [feature, setFeature] = useState<FeatureDescription>({
    title: '',
    description: '',
    requirements: [''],
    technicalSpecs: [''],
    dependencies: ['']
  })
  
  const [result, setResult] = useState<CostEstimationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  const handleEstimate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: {
            ...feature,
            requirements: feature.requirements.filter(r => r.trim()),
            technicalSpecs: feature.technicalSpecs?.filter(s => s.trim()),
            dependencies: feature.dependencies?.filter(d => d.trim())
          },
          includeComparison: showComparison,
          models: showComparison ? [
            'anthropic/claude-3.5-sonnet',
            'anthropic/claude-3-haiku',
            'openai/gpt-4o',
            'openai/gpt-4o-mini',
            'google/gemini-flash-1.5'
          ] : undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        setResult(data)
      } else {
        alert('Estimation failed: ' + data.error)
      }
    } catch (error) {
      alert('Estimation failed: ' + error)
    }
    setLoading(false)
  }

  const formatCost = (cost: number) => {
    if (cost < 0.01) return '<$0.01'
    if (cost < 1) return `$${cost.toFixed(2)}`
    if (cost < 100) return `$${cost.toFixed(1)}`
    return `$${Math.round(cost)}`
  }

  const formatTokens = (tokens: number) => {
    if (tokens < 1000) return `${tokens} tokens`
    if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K tokens`
    return `${(tokens / 1_000_000).toFixed(1)}M tokens`
  }

  const getComplexityColor = (size: string) => {
    const colors = {
      XS: 'bg-green-100 text-green-800',
      S: 'bg-blue-100 text-blue-800',
      M: 'bg-yellow-100 text-yellow-800',
      L: 'bg-orange-100 text-orange-800',
      XL: 'bg-red-100 text-red-800',
      XXL: 'bg-purple-100 text-purple-800'
    }
    return colors[size as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'success': return <CheckCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            AI-Powered Feature Cost Estimator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Feature Title</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={feature.title}
              onChange={(e) => setFeature({ ...feature, title: e.target.value })}
              placeholder="e.g., User authentication system"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full p-2 border rounded-md h-24"
              value={feature.description}
              onChange={(e) => setFeature({ ...feature, description: e.target.value })}
              placeholder="Detailed description of the feature..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Requirements</label>
            {feature.requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md"
                  value={req}
                  onChange={(e) => {
                    const newReqs = [...feature.requirements]
                    newReqs[index] = e.target.value
                    setFeature({ ...feature, requirements: newReqs })
                  }}
                  placeholder={`Requirement ${index + 1}`}
                />
                {index === feature.requirements.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFeature({ 
                      ...feature, 
                      requirements: [...feature.requirements, ''] 
                    })}
                  >
                    +
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
              />
              Include model comparison
            </label>
          </div>

          <Button 
            onClick={handleEstimate} 
            disabled={loading || !feature.title || !feature.description}
            className="w-full"
          >
            {loading ? 'Estimating...' : 'Estimate Feature Cost'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Complexity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Complexity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge className={getComplexityColor(result.complexity.size)}>
                    {result.complexity.size}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Size</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold capitalize">{result.complexity.category}</p>
                  <p className="text-sm text-gray-600">Category</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">{result.complexity.estimatedHours}h</span>
                  </div>
                  <p className="text-sm text-gray-600">Est. Hours</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{Math.round(result.estimate.confidence * 100)}%</p>
                  <p className="text-sm text-gray-600">Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                AI Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCost(result.estimate.totalEstimate)}
                  </p>
                  <p className="text-sm text-gray-600">Total AI Assistance Cost</p>
                  <p className="text-xs text-gray-500">
                    Using {result.estimate.recommendedModel.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="font-semibold">{formatCost(result.estimate.aiCosts.planning)}</p>
                    <p className="text-gray-600">Planning</p>
                    <p className="text-xs text-gray-500">
                      {formatTokens(result.estimate.breakdown.planningTokens)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="font-semibold">{formatCost(result.estimate.aiCosts.coding)}</p>
                    <p className="text-gray-600">Coding</p>
                    <p className="text-xs text-gray-500">
                      {formatTokens(result.estimate.breakdown.codingTokens)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="font-semibold">{formatCost(result.estimate.aiCosts.review)}</p>
                    <p className="text-gray-600">Review</p>
                    <p className="text-xs text-gray-500">
                      {formatTokens(result.estimate.breakdown.reviewTokens)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="font-semibold">{formatCost(result.estimate.aiCosts.documentation)}</p>
                    <p className="text-gray-600">Docs</p>
                    <p className="text-xs text-gray-500">
                      {formatTokens(result.estimate.breakdown.documentationTokens)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          {result.insights && result.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cost Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.insights.map((insight, index) => (
                  <Alert key={index} className={
                    insight.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                    insight.type === 'success' ? 'border-green-200 bg-green-50' :
                    'border-blue-200 bg-blue-50'
                  }>
                    <div className="flex items-start gap-2">
                      {getInsightIcon(insight.type)}
                      <div>
                        <h4 className="font-semibold">{insight.title}</h4>
                        <AlertDescription className="mt-1">
                          {insight.message}
                        </AlertDescription>
                        <p className="text-sm text-gray-600 mt-2 italic">
                          💡 {insight.suggestion}
                        </p>
                      </div>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">{rec.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-blue-800">Action: {rec.action}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default FeatureCostEstimator