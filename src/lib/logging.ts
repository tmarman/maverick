import { ApplicationInsights } from '@microsoft/applicationinsights-web'

// Server-side logging utility
export class Logger {
  private static instance: Logger
  private appInsights: any // Will be undefined on client-side

  private constructor() {
    // Initialize Application Insights only in browser environment
    if (typeof window !== 'undefined') {
      try {
        const appInsights = new ApplicationInsights({
          config: {
            connectionString: process.env.NEXT_PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING,
            enableAutoRouteTracking: true,
            enableCorsCorrelation: true,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true
          }
        })
        appInsights.loadAppInsights()
        this.appInsights = appInsights
      } catch (error) {
        console.warn('Failed to initialize Application Insights:', error)
      }
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  // Structured logging methods
  public info(message: string, data?: any, context?: string) {
    const logData = {
      level: 'info',
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    // Console logging (always available)
    console.log(`[INFO] ${context ? `[${context}] ` : ''}${message}`, data || '')

    // Application Insights (client-side only)
    if (this.appInsights && typeof window !== 'undefined') {
      this.appInsights.trackEvent({
        name: 'Info',
        properties: logData
      })
    }

    // TODO: Add server-side telemetry when running in Azure Functions API
  }

  public error(message: string, error?: Error, data?: any, context?: string) {
    const logData = {
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      data,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    // Console logging (always available)
    console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error || '', data || '')

    // Application Insights
    if (this.appInsights && typeof window !== 'undefined') {
      if (error) {
        this.appInsights.trackException({
          exception: error,
          properties: logData
        })
      } else {
        this.appInsights.trackEvent({
          name: 'Error',
          properties: logData
        })
      }
    }
  }

  public warn(message: string, data?: any, context?: string) {
    const logData = {
      level: 'warn',
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`, data || '')

    if (this.appInsights && typeof window !== 'undefined') {
      this.appInsights.trackEvent({
        name: 'Warning',
        properties: logData
      })
    }
  }

  public debug(message: string, data?: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`, data || '')
    }
  }

  // API request tracking
  public trackApiRequest(
    name: string,
    url: string,
    duration: number,
    responseCode: number,
    success: boolean,
    data?: any
  ) {
    const logData = {
      name,
      url,
      duration,
      responseCode,
      success,
      data,
      timestamp: new Date().toISOString()
    }

    console.log(`[API] ${name} ${url} - ${responseCode} (${duration}ms)`, data || '')

    if (this.appInsights && typeof window !== 'undefined') {
      this.appInsights.trackDependency({
        dependencyTypeName: 'HTTP',
        name,
        data: url,
        duration,
        success,
        responseCode,
        properties: logData
      })
    }
  }

  // Custom events tracking
  public trackEvent(eventName: string, properties?: any, measurements?: any) {
    console.log(`[EVENT] ${eventName}`, properties || '')

    if (this.appInsights && typeof window !== 'undefined') {
      this.appInsights.trackEvent({
        name: eventName,
        properties,
        measurements
      })
    }
  }

  // User action tracking
  public trackUserAction(action: string, page?: string, data?: any) {
    const logData = {
      action,
      page: page || (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
      data,
      timestamp: new Date().toISOString()
    }

    this.trackEvent('UserAction', logData)
  }

  // Performance tracking
  public trackPageView(name?: string, url?: string, properties?: any) {
    if (this.appInsights && typeof window !== 'undefined') {
      this.appInsights.trackPageView({
        name,
        uri: url || window.location.href,
        properties
      })
    }
  }
}

// Singleton instance
export const logger = Logger.getInstance()

// Server-side API middleware for request/response logging
export function createApiLogger(context: string) {
  return {
    logRequest: (req: any) => {
      logger.info(`${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        headers: req.headers,
        userAgent: req.headers['user-agent']
      }, context)
    },

    logResponse: (req: any, res: any, duration: number) => {
      const success = res.status < 400
      logger.info(`${req.method} ${req.url} - ${res.status} (${duration}ms)`, {
        method: req.method,
        url: req.url,
        status: res.status,
        duration,
        success
      }, context)
    },

    logError: (req: any, error: Error) => {
      logger.error(`API Error: ${req.method} ${req.url}`, error, {
        method: req.method,
        url: req.url,
        headers: req.headers
      }, context)
    }
  }
}