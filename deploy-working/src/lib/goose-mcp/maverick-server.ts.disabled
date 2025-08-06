// Maverick MCP Server - Exposes company formation capabilities to Goose

import { MCPServer } from '@modelcontextprotocol/server-core';
import { TemporalClient, WorkflowHandle } from '@temporalio/client';
import { companyFormationWorkflow, CompanyFormationInput, CompanyFormationState } from '../workflows/company-formation';

export class MaverickMCPServer {
  private server: MCPServer;
  private temporalClient: TemporalClient;
  private activeWorkflows: Map<string, WorkflowHandle> = new Map();

  constructor() {
    this.server = new MCPServer({
      name: 'maverick',
      version: '1.0.0',
    });

    this.temporalClient = new TemporalClient({
      namespace: 'maverick',
    });

    this.setupTools();
  }

  private setupTools() {
    // Tool: Start company formation
    this.server.addTool({
      name: 'start_company_formation',
      description: 'Initiate the process of forming a new company (LLC, C-Corp, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          companyName: {
            type: 'string',
            description: 'Name of the company to be formed',
          },
          businessType: {
            type: 'string',
            enum: ['LLC', 'C-Corp', 'S-Corp'],
            description: 'Type of business entity to form',
          },
          state: {
            type: 'string',
            description: 'State where the company will be incorporated (e.g., "Delaware", "California")',
          },
          founderName: {
            type: 'string',
            description: 'Name of the primary founder',
          },
          founderEmail: {
            type: 'string',
            description: 'Email address of the primary founder',
          },
          founderAddress: {
            type: 'string',
            description: 'Address of the primary founder',
          },
          businessPurpose: {
            type: 'string',
            description: 'Description of what the business will do',
          },
          initialInvestment: {
            type: 'number',
            description: 'Initial investment amount (optional)',
            optional: true,
          },
        },
        required: ['companyName', 'businessType', 'state', 'founderName', 'founderEmail', 'founderAddress', 'businessPurpose'],
      },
    });

    // Tool: Check company formation status
    this.server.addTool({
      name: 'check_company_formation_status',
      description: 'Check the status of an ongoing company formation process',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The workflow ID returned from start_company_formation',
          },
        },
        required: ['workflowId'],
      },
    });

    // Tool: Approve document
    this.server.addTool({
      name: 'approve_formation_document',
      description: 'Approve or reject a document in the company formation process',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The workflow ID of the company formation process',
          },
          documentName: {
            type: 'string',
            description: 'Name of the document to approve/reject',
          },
          approved: {
            type: 'boolean',
            description: 'Whether to approve (true) or reject (false) the document',
          },
          feedback: {
            type: 'string',
            description: 'Optional feedback or reason for rejection',
            optional: true,
          },
        },
        required: ['workflowId', 'documentName', 'approved'],
      },
    });

    // Tool: Generate business app
    this.server.addTool({
      name: 'generate_business_app',
      description: 'Generate a custom business application for the newly formed company',
      inputSchema: {
        type: 'object',
        properties: {
          companyName: {
            type: 'string',
            description: 'Name of the company',
          },
          appType: {
            type: 'string',
            enum: ['e-commerce', 'booking', 'saas', 'marketplace', 'portfolio'],
            description: 'Type of application to generate',
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of features the app should have',
          },
          paymentIntegration: {
            type: 'boolean',
            description: 'Whether to include payment processing capabilities',
            optional: true,
          },
        },
        required: ['companyName', 'appType', 'features'],
      },
    });
  }

  // Tool handlers
  async handleStartCompanyFormation(params: any): Promise<{ workflowId: string; status: string; message: string }> {
    try {
      const input: CompanyFormationInput = {
        companyName: params.companyName,
        businessType: params.businessType,
        state: params.state,
        founderInfo: {
          name: params.founderName,
          email: params.founderEmail,
          address: params.founderAddress,
        },
        businessPurpose: params.businessPurpose,
        initialInvestment: params.initialInvestment,
      };

      const workflowId = `company-formation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const handle = await this.temporalClient.workflow.start(companyFormationWorkflow, {
        args: [input],
        taskQueue: 'maverick-formation',
        workflowId,
      });

      this.activeWorkflows.set(workflowId, handle);

      return {
        workflowId,
        status: 'initiated',
        message: `Company formation process started for "${params.companyName}". This process includes document generation, legal review, state filing, banking setup, and optional app generation. You can check status using the workflow ID.`,
      };
    } catch (error) {
      throw new Error(`Failed to start company formation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleCheckFormationStatus(params: any): Promise<CompanyFormationState & { workflowStatus: string }> {
    try {
      const handle = this.activeWorkflows.get(params.workflowId);
      if (!handle) {
        throw new Error('Workflow not found. It may have completed or the ID is incorrect.');
      }

      const state = await handle.query('getWorkflowState');
      const workflowStatus = await handle.describe();

      return {
        ...state,
        workflowStatus: workflowStatus.status.name,
      };
    } catch (error) {
      throw new Error(`Failed to check formation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleApproveDocument(params: any): Promise<{ success: boolean; message: string }> {
    try {
      const handle = this.activeWorkflows.get(params.workflowId);
      if (!handle) {
        throw new Error('Workflow not found');
      }

      await handle.signal('documentApproved', params.documentName, params.approved);

      return {
        success: true,
        message: `Document "${params.documentName}" ${params.approved ? 'approved' : 'rejected'}${params.feedback ? `: ${params.feedback}` : ''}`,
      };
    } catch (error) {
      throw new Error(`Failed to approve document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleGenerateBusinessApp(params: any): Promise<{ success: boolean; appUrl?: string; repository?: string; message: string }> {
    try {
      // This would integrate with the app generation system
      const appDetails = await this.generateApp({
        companyName: params.companyName,
        appType: params.appType,
        features: params.features,
        paymentIntegration: params.paymentIntegration || false,
      });

      return {
        success: true,
        appUrl: appDetails.deployedUrl,
        repository: appDetails.repositoryUrl,
        message: `Business app generated successfully for ${params.companyName}. The ${params.appType} application includes: ${params.features.join(', ')}.`,
      };
    } catch (error) {
      throw new Error(`Failed to generate business app: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateApp(appConfig: any): Promise<{ deployedUrl: string; repositoryUrl: string }> {
    // This would integrate with the actual app generation system
    // For now, return mock data
    return {
      deployedUrl: `https://${appConfig.companyName.toLowerCase().replace(/\s+/g, '-')}.maverick-apps.com`,
      repositoryUrl: `https://github.com/maverick-apps/${appConfig.companyName.toLowerCase().replace(/\s+/g, '-')}`,
    };
  }

  async start(port: number = 3001): Promise<void> {
    // Set up tool handlers
    this.server.addToolHandler('start_company_formation', this.handleStartCompanyFormation.bind(this));
    this.server.addToolHandler('check_company_formation_status', this.handleCheckFormationStatus.bind(this));
    this.server.addToolHandler('approve_formation_document', this.handleApproveDocument.bind(this));
    this.server.addToolHandler('generate_business_app', this.handleGenerateBusinessApp.bind(this));

    await this.server.listen(port);
    console.log(`Maverick MCP Server listening on port ${port}`);
  }
}

// Export for use in Goose integration
export default MaverickMCPServer;