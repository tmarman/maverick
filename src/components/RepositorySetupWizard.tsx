'use client'

import { useState } from 'react'
import { GitHubRepositorySelector } from './GitHubRepositorySelector'
import { GitHubRepository, RepositorySetupOptions } from '@/types/github-integration'

interface RepositorySetupWizardProps {
  onComplete: (setup: RepositorySetupOptions) => void
  onCancel: () => void
}

type SetupStep = 'choose-approach' | 'select-repo' | 'configure-structure' | 'review'

export function RepositorySetupWizard({ onComplete, onCancel }: RepositorySetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('choose-approach')
  const [setup, setSetup] = useState<Partial<RepositorySetupOptions>>({
    structure: 'monorepo',
    isPrivate: true,
    template: 'full-stack'
  })
  const [showRepoSelector, setShowRepoSelector] = useState(false)

  const handleApproachSelect = (setupType: RepositorySetupOptions['setupType']) => {
    setSetup(prev => ({ ...prev, setupType }))
    
    if (setupType === 'existing-repo') {
      setShowRepoSelector(true)
    } else {
      setCurrentStep('configure-structure')
    }
  }

  const handleRepositorySelect = (repository: GitHubRepository) => {
    setSetup(prev => ({ 
      ...prev, 
      existingRepository: repository,
      companyName: repository.name,
      description: repository.description || undefined
    }))
    setShowRepoSelector(false)
    setCurrentStep('configure-structure')
  }

  const handleStructureChange = (structure: 'monorepo' | 'multi-repo' | 'hybrid') => {
    setSetup(prev => ({ ...prev, structure }))
  }

  const handleComplete = () => {
    if (setup.companyName && setup.setupType && setup.structure) {
      onComplete(setup as RepositorySetupOptions)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'choose-approach':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">How would you like to set up your project?</h2>
              <p className="text-gray-600">Choose the approach that best fits your workflow</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => handleApproachSelect('new-company')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Create New Project</h3>
                <p className="text-sm text-gray-600">Start fresh with a new GitHub repository and project structure</p>
              </button>

              <button
                onClick={() => handleApproachSelect('existing-repo')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Connect Existing Repo</h3>
                <p className="text-sm text-gray-600">Import and enhance an existing GitHub repository</p>
              </button>

              <button
                onClick={() => handleApproachSelect('fork-template')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Use Template</h3>
                <p className="text-sm text-gray-600">Start with a proven template for your type of business</p>
              </button>
            </div>
          </div>
        )

      case 'configure-structure':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Choose Your Repository Structure</h2>
              <p className="text-gray-600">This determines how your code will be organized</p>
            </div>

            {setup.setupType === 'new-company' && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company/Project Name</label>
                <input
                  type="text"
                  value={setup.companyName || ''}
                  onChange={(e) => setSetup(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Enter your company or project name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => handleStructureChange('monorepo')}
                className={`p-6 border-2 rounded-lg transition-colors text-left ${
                  setup.structure === 'monorepo' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Monorepo</h3>
                <p className="text-sm text-gray-600">Everything in one repository. Great for small teams and shared code.</p>
                <div className="mt-3 text-xs text-gray-500">
                  ✓ Simple setup<br/>
                  ✓ Easy cross-project changes<br/>
                  ✓ Unified CI/CD
                </div>
              </button>

              <button
                onClick={() => handleStructureChange('multi-repo')}
                className={`p-6 border-2 rounded-lg transition-colors text-left ${
                  setup.structure === 'multi-repo' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Multi-Repo</h3>
                <p className="text-sm text-gray-600">Separate repositories for each service. Scales with team growth.</p>
                <div className="mt-3 text-xs text-gray-500">
                  ✓ Independent deployments<br/>
                  ✓ Team autonomy<br/>
                  ✓ Clear boundaries
                </div>
              </button>

              <button
                onClick={() => handleStructureChange('hybrid')}
                className={`p-6 border-2 rounded-lg transition-colors text-left ${
                  setup.structure === 'hybrid' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Hybrid</h3>
                <p className="text-sm text-gray-600">Mix of both approaches. Start simple, grow into complexity.</p>
                <div className="mt-3 text-xs text-gray-500">
                  ✓ Flexible evolution<br/>
                  ✓ Best of both worlds<br/>
                  ✓ Future-proof
                </div>
              </button>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setCurrentStep('choose-approach')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!setup.companyName || !setup.structure}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (showRepoSelector) {
    return (
      <GitHubRepositorySelector
        onRepositorySelect={handleRepositorySelect}
        onClose={() => setShowRepoSelector(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}