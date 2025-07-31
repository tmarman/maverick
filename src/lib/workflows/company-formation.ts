// Temporal workflow for company formation process

import { 
  defineSignal, 
  defineQuery, 
  setHandler, 
  condition, 
  sleep,
  workflowInfo 
} from '@temporalio/workflow';

export interface CompanyFormationInput {
  companyName: string;
  businessType: 'LLC' | 'C-Corp' | 'S-Corp';
  state: string;
  founderInfo: {
    name: string;
    email: string;
    address: string;
  };
  businessPurpose: string;
  initialInvestment?: number;
}

export interface CompanyFormationState {
  status: 'initiated' | 'legal_review' | 'filing' | 'banking_setup' | 'app_generation' | 'deployed' | 'completed';
  currentStep: string;
  completedSteps: string[];
  documents: Record<string, { url: string; status: 'pending' | 'approved' | 'rejected' }>;
  approvals: Record<string, boolean>;
  errors?: string[];
}

// Signals for human-in-the-loop interactions
export const documentApprovedSignal = defineSignal<[string, boolean]>('documentApproved');
export const legalReviewCompletedSignal = defineSignal<[boolean, string?]>('legalReviewCompleted');
export const bankingSetupCompletedSignal = defineSignal<[boolean, any]>('bankingSetupCompleted');

// Queries to check workflow state
export const getWorkflowStateQuery = defineQuery<CompanyFormationState>('getWorkflowState');

export async function companyFormationWorkflow(input: CompanyFormationInput): Promise<CompanyFormationState> {
  const state: CompanyFormationState = {
    status: 'initiated',
    currentStep: 'Document Generation',
    completedSteps: [],
    documents: {},
    approvals: {},
  };

  // Set up signal and query handlers
  setHandler(documentApprovedSignal, (documentName: string, approved: boolean) => {
    state.approvals[documentName] = approved;
  });

  setHandler(legalReviewCompletedSignal, (approved: boolean, feedback?: string) => {
    state.approvals['legal_review'] = approved;
    if (feedback) {
      state.errors = state.errors || [];
      state.errors.push(feedback);
    }
  });

  setHandler(bankingSetupCompletedSignal, (success: boolean, bankingInfo: any) => {
    state.approvals['banking'] = success;
  });

  setHandler(getWorkflowStateQuery, () => state);

  try {
    // Step 1: Generate legal documents
    state.currentStep = 'Document Generation';
    const documents = await generateLegalDocuments(input);
    state.documents = documents;
    state.completedSteps.push('Document Generation');

    // Step 2: Human review of documents
    state.status = 'legal_review';
    state.currentStep = 'Legal Review';
    
    // Wait for legal review completion (human-in-the-loop)
    await condition(() => state.approvals['legal_review'] !== undefined);
    
    if (!state.approvals['legal_review']) {
      throw new Error('Legal review rejected: ' + (state.errors?.[0] || 'Unknown reason'));
    }
    
    state.completedSteps.push('Legal Review');

    // Step 3: File with state
    state.status = 'filing';
    state.currentStep = 'State Filing';
    const filingResult = await fileWithState(input, documents);
    state.completedSteps.push('State Filing');

    // Step 4: Set up banking
    state.status = 'banking_setup';
    state.currentStep = 'Banking Setup';
    
    // Initiate banking setup and wait for completion
    await initiateBankingSetup(input, filingResult);
    await condition(() => state.approvals['banking'] !== undefined);
    
    if (!state.approvals['banking']) {
      throw new Error('Banking setup failed');
    }
    
    state.completedSteps.push('Banking Setup');

    // Step 5: Generate and deploy app (if requested)
    if (input.businessPurpose.includes('app') || input.businessPurpose.includes('software')) {
      state.status = 'app_generation';
      state.currentStep = 'App Generation';
      
      const appDetails = await generateBusinessApp(input);
      state.completedSteps.push('App Generation');
      
      state.currentStep = 'App Deployment';
      await deployApp(appDetails);
      state.completedSteps.push('App Deployment');
    }

    // Final step
    state.status = 'completed';
    state.currentStep = 'Completed';
    
    return state;

  } catch (error) {
    state.errors = state.errors || [];
    state.errors.push(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// Activity functions (implemented elsewhere)
declare function generateLegalDocuments(input: CompanyFormationInput): Promise<Record<string, { url: string; status: 'pending' }>>;
declare function fileWithState(input: CompanyFormationInput, documents: any): Promise<any>;
declare function initiateBankingSetup(input: CompanyFormationInput, filingResult: any): Promise<void>;
declare function generateBusinessApp(input: CompanyFormationInput): Promise<any>;
declare function deployApp(appDetails: any): Promise<void>;