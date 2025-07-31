// Square business setup orchestration for newly formed companies

import { Client, Environment } from 'squareconnect';

export interface SquareBusinessSetup {
  companyInfo: {
    legalName: string;
    dbaName?: string;
    ein: string;
    businessType: 'LLC' | 'Corporation' | 'Partnership';
    address: BusinessAddress;
    phone: string;
    email: string;
  };
  desiredServices: {
    banking: boolean;
    onlinePayments: boolean;
    posSystem: boolean;
    invoicing: boolean;
    payroll: boolean;
    ecommerce: boolean;
  };
  businessCategory: string; // e.g., "restaurant", "retail", "professional_services"
  expectedVolume: {
    monthlyRevenue: number;
    averageTransaction: number;
    transactionVolume: number;
  };
}

export interface BusinessAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface SquareSetupResult {
  applicationId: string;
  merchantId: string;
  locationId: string;
  accessToken: string; // Sandbox initially, production after approval
  webhookUrl: string;
  setupStatus: {
    banking: 'pending' | 'approved' | 'rejected';
    payments: 'pending' | 'approved' | 'rejected';
    pos: 'pending' | 'approved' | 'rejected';
  };
  integrationDetails: {
    webPaymentsSDK: WebPaymentsConfig;
    checkoutAPI: CheckoutConfig;
    terminalAPI?: TerminalConfig;
    catalogAPI: CatalogConfig;
  };
}

export interface WebPaymentsConfig {
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  cardTokenizeUrl: string;
  // Payment form configuration
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
}

export interface CheckoutConfig {
  baseUrl: string;
  merchantId: string;
  // Pre-configured checkout settings
  acceptedPaymentMethods: ('card' | 'google_pay' | 'apple_pay' | 'ach')[];
  redirectUrls: {
    success: string;
    cancel: string;
  };
}

export interface TerminalConfig {
  deviceCodes: string[];
  locationId: string;
  // POS-specific settings
  tipSettings: {
    enabled: boolean;
    defaultOptions: number[];
  };
  receiptSettings: {
    printReceipts: boolean;
    emailReceipts: boolean;
  };
}

export interface CatalogConfig {
  locationId: string;
  // Default catalog structure for business type
  defaultCategories: string[];
  taxSettings: {
    defaultTaxId?: string;
    taxInclusive: boolean;
  };
}

export class SquareBusinessSetupService {
  private client: Client;

  constructor(environment: 'sandbox' | 'production' = 'sandbox') {
    this.client = new Client({
      environment: environment === 'production' ? Environment.Production : Environment.Sandbox,
      accessToken: process.env.SQUARE_APPLICATION_ACCESS_TOKEN, // App-level token for setup
    });
  }

  /**
   * Step 1: Create Square application for the business
   * This creates the merchant account and gets initial credentials
   */
  async createSquareApplication(setup: SquareBusinessSetup): Promise<{
    applicationId: string;
    merchantId: string;
    status: 'pending_verification' | 'active';
  }> {
    try {
      // This would integrate with Square's Partner API to create merchant accounts
      // For now, simulating the flow
      
      const applicationId = `sq-app-${Date.now()}`;
      const merchantId = `sq-merchant-${Date.now()}`;
      
      // In reality, this would:
      // 1. Submit business information to Square
      // 2. Initiate KYC/verification process
      // 3. Create sandbox environment immediately
      // 4. Queue production approval process
      
      return {
        applicationId,
        merchantId,
        status: 'pending_verification'
      };
    } catch (error) {
      throw new Error(`Square application creation failed: ${error}`);
    }
  }

  /**
   * Step 2: Set up Square Banking (if requested)
   * Integrates with Square Banking for business accounts
   */
  async setupSquareBanking(businessInfo: SquareBusinessSetup['companyInfo']): Promise<{
    accountId: string;
    routingNumber: string;
    accountNumber: string;
    status: 'pending' | 'approved';
  }> {
    try {
      // Square Banking setup requires:
      // - Business verification documents
      // - EIN confirmation
      // - Owner identification
      
      return {
        accountId: `sq-bank-${Date.now()}`,
        routingNumber: '124303120', // Square's routing number
        accountNumber: `****${Math.random().toString().slice(-4)}`,
        status: 'pending'
      };
    } catch (error) {
      throw new Error(`Square Banking setup failed: ${error}`);
    }
  }

  /**
   * Step 3: Configure Online Payments
   * Sets up Web Payments SDK and Checkout API
   */
  async configureOnlinePayments(
    applicationId: string, 
    locationId: string,
    businessType: string
  ): Promise<WebPaymentsConfig & CheckoutConfig> {
    try {
      // Configure Web Payments SDK
      const webPaymentsConfig: WebPaymentsConfig = {
        applicationId,
        locationId,
        environment: 'sandbox',
        cardTokenizeUrl: `https://connect.squareupsandbox.com/v2/locations/${locationId}/transactions`,
        theme: this.getThemeForBusinessType(businessType),
      };

      // Configure Checkout API
      const checkoutConfig: CheckoutConfig = {
        baseUrl: 'https://squareupsandbox.com/checkout',
        merchantId: applicationId,
        acceptedPaymentMethods: ['card', 'google_pay', 'apple_pay'],
        redirectUrls: {
          success: `${process.env.APP_URL}/payment/success`,
          cancel: `${process.env.APP_URL}/payment/cancel`,
        },
      };

      return { ...webPaymentsConfig, ...checkoutConfig };
    } catch (error) {
      throw new Error(`Online payments configuration failed: ${error}`);
    }
  }

  /**
   * Step 4: Set up Point of Sale (if requested)
   * Configures Terminal API and POS settings
   */
  async setupPointOfSale(
    locationId: string,
    businessCategory: string
  ): Promise<TerminalConfig> {
    try {
      const posConfig: TerminalConfig = {
        deviceCodes: [], // Will be populated when physical devices are registered
        locationId,
        tipSettings: {
          enabled: ['restaurant', 'food_service', 'personal_service'].includes(businessCategory),
          defaultOptions: [15, 18, 20, 25], // Percentage options
        },
        receiptSettings: {
          printReceipts: true,
          emailReceipts: true,
        },
      };

      return posConfig;
    } catch (error) {
      throw new Error(`POS setup failed: ${error}`);
    }
  }

  /**
   * Step 5: Initialize Catalog
   * Sets up product/service catalog based on business type
   */
  async initializeCatalog(
    locationId: string, 
    businessCategory: string
  ): Promise<CatalogConfig> {
    try {
      const catalogConfig: CatalogConfig = {
        locationId,
        defaultCategories: this.getDefaultCategoriesForBusinessType(businessCategory),
        taxSettings: {
          taxInclusive: false,
          // Tax ID will be set based on location
        },
      };

      // Create default categories in Square
      for (const category of catalogConfig.defaultCategories) {
        await this.createCatalogCategory(locationId, category);
      }

      return catalogConfig;
    } catch (error) {
      throw new Error(`Catalog initialization failed: ${error}`);
    }
  }

  /**
   * Complete business setup orchestration
   */
  async setupSquareBusiness(setup: SquareBusinessSetup): Promise<SquareSetupResult> {
    try {
      // Step 1: Create Square application
      const { applicationId, merchantId } = await this.createSquareApplication(setup);
      
      // Step 2: Create location (required for all Square APIs)
      const locationId = await this.createLocation(setup.companyInfo, merchantId);
      
      // Step 3: Set up requested services
      const integrationDetails: SquareSetupResult['integrationDetails'] = {
        webPaymentsSDK: {} as WebPaymentsConfig,
        checkoutAPI: {} as CheckoutConfig,
        catalogAPI: {} as CatalogConfig,
      };

      if (setup.desiredServices.onlinePayments) {
        const paymentsConfig = await this.configureOnlinePayments(
          applicationId, 
          locationId, 
          setup.businessCategory
        );
        integrationDetails.webPaymentsSDK = paymentsConfig;
        integrationDetails.checkoutAPI = paymentsConfig;
      }

      if (setup.desiredServices.posSystem) {
        integrationDetails.terminalAPI = await this.setupPointOfSale(
          locationId, 
          setup.businessCategory
        );
      }

      // Always set up catalog
      integrationDetails.catalogAPI = await this.initializeCatalog(
        locationId, 
        setup.businessCategory
      );

      // Generate access token (sandbox initially)
      const accessToken = await this.generateAccessToken(applicationId);
      
      // Set up webhooks
      const webhookUrl = await this.setupWebhooks(applicationId, locationId);

      return {
        applicationId,
        merchantId,
        locationId,
        accessToken,
        webhookUrl,
        setupStatus: {
          banking: setup.desiredServices.banking ? 'pending' : 'approved',
          payments: 'pending', // Always requires Square approval
          pos: setup.desiredServices.posSystem ? 'pending' : 'approved',
        },
        integrationDetails,
      };
    } catch (error) {
      throw new Error(`Square business setup failed: ${error}`);
    }
  }

  // Helper methods
  private getThemeForBusinessType(businessType: string) {
    const themes: Record<string, any> = {
      restaurant: { primaryColor: '#FF6B35', backgroundColor: '#FFF', textColor: '#333' },
      retail: { primaryColor: '#4CAF50', backgroundColor: '#FFF', textColor: '#333' },
      professional_services: { primaryColor: '#2196F3', backgroundColor: '#FFF', textColor: '#333' },
      default: { primaryColor: '#000000', backgroundColor: '#FFF', textColor: '#333' },
    };
    return themes[businessType] || themes.default;
  }

  private getDefaultCategoriesForBusinessType(businessCategory: string): string[] {
    const categories: Record<string, string[]> = {
      restaurant: ['Appetizers', 'Entrees', 'Desserts', 'Beverages'],
      retail: ['Products', 'Accessories', 'Sale Items'],
      professional_services: ['Consulting', 'Services', 'Packages'],
      default: ['Products', 'Services'],
    };
    return categories[businessCategory] || categories.default;
  }

  private async createLocation(companyInfo: SquareBusinessSetup['companyInfo'], merchantId: string): Promise<string> {
    // Create location in Square
    const locationId = `loc-${Date.now()}`;
    return locationId;
  }

  private async createCatalogCategory(locationId: string, categoryName: string): Promise<void> {
    // Create category using Catalog API
    // Implementation would use squareClient.catalogApi.upsertCatalogObject
  }

  private async generateAccessToken(applicationId: string): Promise<string> {
    // Generate sandbox access token
    return `sq-sandbox-${applicationId}-${Date.now()}`;
  }

  private async setupWebhooks(applicationId: string, locationId: string): Promise<string> {
    // Configure webhooks for payments, orders, inventory, etc.
    return `${process.env.APP_URL}/webhooks/square/${applicationId}`;
  }
}

// Export the service for use in company formation workflows
export default SquareBusinessSetupService;