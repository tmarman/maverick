'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Navigation } from '@/components/Navigation'

interface LegalDocument {
  id?: string
  type: string
  title: string
  content: string
  lastUpdated: Date | string
  status?: string
  createdAt?: Date | string
  markdown?: string
}

interface Business {
  id: string
  name: string
  legalStructure: string
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string>('')
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null)

  useEffect(() => {
    if (session) {
      fetchBusinesses()
    }
  }, [session])

  useEffect(() => {
    if (selectedBusiness) {
      fetchDocuments()
    }
  }, [selectedBusiness])

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/cockpit/companies')
      if (response.ok) {
        const companiesData = await response.json()
        const businessList = companiesData.map((company: any) => ({
          id: company.id,
          name: company.name,
          legalStructure: company.businessType || 'LLC'
        }))
        setBusinesses(businessList)
        if (businessList.length > 0) {
          setSelectedBusiness(businessList[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    if (!selectedBusiness) return

    try {
      const response = await fetch(`/api/documents/generate?businessId=${selectedBusiness}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    }
  }

  const generateDocuments = async (documentTypes?: string[]) => {
    if (!selectedBusiness) return

    setGenerating(true)
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: selectedBusiness,
          documentTypes
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        
        if (data.documents?.length > 0) {
          // Auto-select the first generated document
          setSelectedDocument(data.documents[0])
        }
      } else {
        const error = await response.json()
        console.error('Document generation failed:', error)
        alert(`Document generation failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating documents:', error)
      alert('Error generating documents')
    } finally {
      setGenerating(false)
    }
  }

  const downloadDocument = (doc: LegalDocument, format: 'markdown' | 'text' = 'markdown') => {
    const content = format === 'markdown' ? doc.markdown || doc.content : doc.content
    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format === 'markdown' ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            <span className="ml-2 text-text-secondary">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-4">Legal Documents</h1>
          <p className="text-text-secondary mb-8">Please sign in to access your business documents.</p>
          <a
            href="/login"
            className="bg-accent-primary text-white px-6 py-3 rounded-lg hover:bg-accent-hover"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  const selectedBusinessData = businesses.find(b => b.id === selectedBusiness)

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-4">Legal Documents</h1>
          <p className="text-text-secondary">
            Generate and manage essential legal documents for your business formation and operations.
          </p>
        </div>

        {/* Business Selection */}
        {businesses.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select Business
            </label>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="px-4 py-2 border border-border-standard rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            >
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} ({business.legalStructure})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Document List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-border-subtle p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Documents</h2>
                <button
                  onClick={() => generateDocuments()}
                  disabled={generating || !selectedBusiness}
                  className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {generating ? 'Generating...' : 'Generate All'}
                </button>
              </div>

              {/* Quick Generate Buttons */}
              <div className="mb-6 space-y-2">
                <h3 className="text-sm font-medium text-text-primary mb-3">Quick Generate:</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => generateDocuments(['privacy-policy'])}
                    disabled={generating}
                    className="w-full text-left px-3 py-2 text-sm border border-border-standard rounded hover:bg-background-secondary disabled:opacity-50"
                  >
                    📄 Privacy Policy
                  </button>
                  <button
                    onClick={() => generateDocuments(['terms-of-service'])}
                    disabled={generating}
                    className="w-full text-left px-3 py-2 text-sm border border-border-standard rounded hover:bg-background-secondary disabled:opacity-50"
                  >
                    📋 Terms of Service
                  </button>
                  {selectedBusinessData?.legalStructure === 'LLC' && (
                    <button
                      onClick={() => generateDocuments(['operating-agreement'])}
                      disabled={generating}
                      className="w-full text-left px-3 py-2 text-sm border border-border-standard rounded hover:bg-background-secondary disabled:opacity-50"
                    >
                      🏢 Operating Agreement
                    </button>
                  )}
                  {selectedBusinessData?.legalStructure !== 'LLC' && (
                    <button
                      onClick={() => generateDocuments(['articles-of-incorporation'])}
                      disabled={generating}
                      className="w-full text-left px-3 py-2 text-sm border border-border-standard rounded hover:bg-background-secondary disabled:opacity-50"
                    >
                      📜 Articles of Incorporation
                    </button>
                  )}
                </div>
              </div>

              {/* Generated Documents */}
              <div className="space-y-2">
                {documents.length > 0 ? (
                  documents.map((doc, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDocument(doc)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDocument === doc
                          ? 'border-accent-primary bg-accent-primary/5'
                          : 'border-border-standard hover:bg-background-secondary'
                      }`}
                    >
                      <div className="font-medium text-text-primary text-sm">{doc.title}</div>
                      <div className="text-xs text-text-secondary">
                        {new Date(doc.lastUpdated).toLocaleDateString()}
                      </div>
                      {doc.status && (
                        <div className="text-xs text-text-muted mt-1 capitalize">
                          Status: {doc.status}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-text-secondary">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-sm">No documents generated yet.</p>
                    <p className="text-xs text-text-muted mt-2">
                      Click "Generate All" to create standard legal documents for your business.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-border-subtle">
              {selectedDocument ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-text-primary">
                      {selectedDocument.title}
                    </h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadDocument(selectedDocument, 'markdown')}
                        className="px-3 py-2 text-sm border border-border-standard rounded hover:bg-background-secondary"
                      >
                        Download MD
                      </button>
                      <button
                        onClick={() => downloadDocument(selectedDocument, 'text')}
                        className="px-3 py-2 text-sm border border-border-standard rounded hover:bg-background-secondary"
                      >
                        Download TXT
                      </button>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="bg-background-secondary rounded-lg p-6 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[800px]">
                      {selectedDocument.content}
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600">⚠️</span>
                      <div className="text-sm text-yellow-800">
                        <strong>Legal Disclaimer:</strong> These documents are AI-generated templates 
                        and should be reviewed by a qualified attorney before use. They may not be 
                        suitable for all business situations or comply with all applicable laws.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Select a Document
                  </h3>
                  <p className="text-text-secondary">
                    Choose a document from the sidebar to view its contents.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {businesses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No Businesses Found
            </h3>
            <p className="text-text-secondary mb-6">
              You need to create a business first before generating legal documents.
            </p>
            <a
              href="/formation"
              className="bg-accent-primary text-white px-6 py-3 rounded-lg hover:bg-accent-hover"
            >
              Start Business Formation
            </a>
          </div>
        )}
      </div>
    </div>
  )
}