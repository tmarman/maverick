import { NextRequest, NextResponse } from 'next/server'

interface WizardData {
  businessName: string
  businessType: string
  industry: string
  description: string
  location: string
  legalStructure: string
  state: string
  squareServices: string[]
  appType: string
  features: string[]
  currentStep: string
  completionPercentage: number
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// This would ideally use OpenAI or Claude API
// For now, we'll create a smart pattern-matching system
export async function POST(request: NextRequest) {
  try {
    const { message, wizardData, messageHistory } = await request.json()

    // Analyze the message and extract business information
    const analysis = analyzeMessage(message, wizardData)
    const response = generateResponse(analysis, wizardData, messageHistory)

    return NextResponse.json({
      message: response.message,
      formUpdates: analysis.formUpdates,
      completionPercentage: calculateCompletionPercentage({
        ...wizardData,
        ...analysis.formUpdates
      }),
      nextSuggestions: response.nextSuggestions
    })

  } catch (error) {
    console.error('Chat wizard error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

function analyzeMessage(message: string, currentData: WizardData) {
  const lowerMessage = message.toLowerCase()
  const formUpdates: Partial<WizardData> = {}

  // Extract business name patterns
  if (!currentData.businessName) {
    const businessNamePatterns = [
      /(?:business|company|startup|venture|called|named)\s+(?:is\s+)?[\"]?([A-Za-z0-9\s&.'-]+)[\"]?/gi,
      /^(.+)\s+(?:is|would be)\s+(?:my|the)\s+(?:business|company)/gi,
      /^(?:my|the)\s+(?:business|company|startup)\s+(?:is|would be)\s+(.+)/gi
    ]
    
    for (const pattern of businessNamePatterns) {
      const match = pattern.exec(message)
      if (match && match[1]) {
        formUpdates.businessName = match[1].trim().replace(/[.!?]$/, '')
        break
      }
    }
  }

  // Extract industry
  if (!currentData.industry) {
    const industryKeywords = {
      'food-beverage': ['restaurant', 'cafe', 'coffee', 'food', 'catering', 'bakery', 'bar', 'brewery'],
      'technology': ['app', 'software', 'tech', 'saas', 'platform', 'digital', 'AI', 'website'],
      'retail': ['store', 'shop', 'retail', 'ecommerce', 'selling', 'products', 'merchandise'],
      'services': ['consulting', 'service', 'freelance', 'agency', 'marketing', 'design'],
      'health-wellness': ['health', 'fitness', 'wellness', 'medical', 'therapy', 'yoga'],
      'education': ['education', 'training', 'school', 'course', 'teaching', 'learning']
    }

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        formUpdates.industry = industry
        break
      }
    }
  }

  // Extract business type
  if (!currentData.businessType) {
    if (lowerMessage.includes('online') || lowerMessage.includes('website') || lowerMessage.includes('digital')) {
      formUpdates.businessType = 'online'
    } else if (lowerMessage.includes('store') || lowerMessage.includes('shop') || lowerMessage.includes('location')) {
      formUpdates.businessType = 'physical'
    } else if (lowerMessage.includes('consulting') || lowerMessage.includes('service') || lowerMessage.includes('freelance')) {
      formUpdates.businessType = 'service'
    }
  }

  // Extract location
  if (!currentData.location) {
    const locationPattern = /(?:in|at|from|based in)\s+([A-Za-z\s,]+(?:TX|CA|NY|FL|Colorado|Texas|California|New York|Florida))/gi
    const match = locationPattern.exec(message)
    if (match && match[1]) {
      formUpdates.location = match[1].trim()
    }
  }

  // Extract description if it's a longer explanation
  if (!currentData.description && message.length > 50) {
    formUpdates.description = message
  }

  // Detect when user is ready for next steps
  let currentStep = currentData.currentStep
  if (formUpdates.businessName && formUpdates.industry) {
    currentStep = 'business-details'
  }
  if (currentData.businessName && currentData.businessType) {
    currentStep = 'legal-structure'
  }

  return {
    formUpdates: { ...formUpdates, currentStep },
    confidence: Object.keys(formUpdates).length > 0 ? 0.8 : 0.3
  }
}

function generateResponse(analysis: any, wizardData: WizardData, messageHistory: any[]) {
  const { formUpdates } = analysis
  const updatedData = { ...wizardData, ...formUpdates }

  // Generate contextual responses based on what information we have
  if (!updatedData.businessName && !updatedData.description) {
    return {
      message: "That sounds interesting! Can you tell me more details about your business idea? For example:\n\n• What problem does it solve?\n• Who are your target customers?\n• What's the name you're thinking of?\n\nThe more details you share, the better I can help you build it!",
      nextSuggestions: ['Tell me about the problem', 'Describe your customers', 'Share your business name']
    }
  }

  if (formUpdates.businessName) {
    return {
      message: `Great! I love the name "${formUpdates.businessName}" 🎉\n\nNow I'm getting a better picture of your business. Let me ask a few more questions to help set everything up:\n\n• Where will your business be located?\n• Will this be primarily online, have a physical location, or both?\n• Do you have any specific features in mind for your website/app?`,
      nextSuggestions: ['Tell me about location', 'Describe business model', 'List desired features']
    }
  }

  if (formUpdates.industry) {
    const industryAdvice = {
      'food-beverage': 'Food & beverage businesses do great with Square! You\'ll want payment processing, inventory management, and probably online ordering.',
      'technology': 'Perfect! As a tech business, you\'ll benefit from our custom app generation and can scale quickly with Square\'s APIs.',
      'retail': 'Retail businesses love Square\'s POS system and inventory management. We can set up both online and in-person sales.',
      'services': 'Service businesses work great with Square\'s appointment booking and customer management tools.'
    }

    return {
      message: `Perfect! I can see this is in the ${updatedData.industry.replace('-', ' & ')} space. ${industryAdvice[updatedData.industry as keyof typeof industryAdvice] || 'This is a great industry to get into!'}\n\nNext, let's talk about the legal structure. Most businesses like yours do well as either:\n• LLC (simpler, more flexible)\n• C-Corp (better for raising investment)\n\nAre you planning to raise funding or keep it bootstrapped?`,
      nextSuggestions: ['Planning to raise funding', 'Keeping it bootstrapped', 'Not sure yet']
    }
  }

  if (updatedData.completionPercentage > 60) {
    return {
      message: `Excellent! We've captured most of the key information about your business. Here's what we have so far:\n\n✅ Business concept and details\n✅ Industry and target market\n✅ Basic structure preferences\n\nYou can continue chatting with me to refine details, or if you're ready, we can move to the detailed wizard to finalize everything and get your business legally formed!\n\nWhat would you like to do next?`,
      nextSuggestions: ['Continue to detailed wizard', 'Refine the details more', 'Ask about costs']
    }
  }

  // Default response for general conversation
  return {
    message: "That's helpful information! I'm learning more about your business vision. \n\nWhat other aspects of your business would you like to discuss? I can help with:\n• Legal structure recommendations\n• Square payment setup\n• App features and functionality\n• Market analysis and validation\n\nWhat interests you most?",
    nextSuggestions: ['Legal structure help', 'Payment setup', 'App features', 'Market validation']
  }
}

function calculateCompletionPercentage(data: WizardData): number {
  const fields = [
    data.businessName,
    data.description,
    data.industry,
    data.businessType,
    data.location,
    data.legalStructure,
    data.appType
  ]

  const completedFields = fields.filter(field => field && field.length > 0).length
  return Math.round((completedFields / fields.length) * 100)
}