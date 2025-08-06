'use client'

import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { logger } from '@/lib/logging'

// Custom hook for client-side logging
export function useLogger(context?: string) {
  const pathname = usePathname()

  // Create a context-specific logger
  const contextLogger = useMemo(() => ({
    info: (message: string, data?: any) => logger.info(message, data, context),
    error: (message: string, error?: Error, data?: any) => logger.error(message, error, data, context),
    warn: (message: string, data?: any) => logger.warn(message, data, context),
    debug: (message: string, data?: any) => logger.debug(message, data, context),
    
    // Track user actions specific to this component/page
    trackUserAction: (action: string, data?: any) => {
      logger.trackUserAction(action, pathname, { ...data, context })
    },
    
    // Track events with context
    trackEvent: (eventName: string, properties?: any, measurements?: any) => {
      logger.trackEvent(eventName, { ...properties, context, page: pathname }, measurements)
    },
    
    // Track API calls made from this component
    trackApiCall: async <T>(
      apiCall: () => Promise<T>,
      apiName: string,
      url: string
    ): Promise<T> => {
      const startTime = Date.now()
      
      try {
        const result = await apiCall()
        const duration = Date.now() - startTime
        
        logger.trackApiRequest(apiName, url, duration, 200, true, {
          context,
          page: pathname
        })
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        
        logger.trackApiRequest(apiName, url, duration, 500, false, {
          context,
          page: pathname,
          error: error instanceof Error ? error.message : String(error)
        })
        
        logger.error(`API call failed: ${apiName}`, error as Error, { url }, context)
        throw error
      }
    }
  }), [context, pathname])

  return contextLogger
}

// Hook specifically for page-level tracking
export function usePageTracking(pageName: string, additionalData?: any) {
  const pathname = usePathname()

  useEffect(() => {
    // Track page view
    logger.trackPageView(pageName, pathname, additionalData)
    
    // Track page navigation timing
    if (typeof window !== 'undefined' && window.performance) {
      const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigationTiming) {
        logger.trackEvent('PageTiming', {
          page: pageName,
          pathname,
          loadTime: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
          domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
          totalTime: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
          ...additionalData
        })
      }
    }
  }, [pageName, pathname, additionalData])
}

// Hook for form tracking
export function useFormTracking(formName: string) {
  const { trackUserAction, trackEvent } = useLogger('FormTracking')

  return {
    trackFormStart: (formData?: any) => {
      trackUserAction('form_start', { formName, ...formData })
    },
    
    trackFormSubmit: (formData?: any, success?: boolean) => {
      trackEvent('form_submit', {
        formName,
        success,
        ...formData
      })
    },
    
    trackFormError: (error: Error, fieldName?: string, formData?: any) => {
      trackEvent('form_error', {
        formName,
        fieldName,
        error: error.message,
        ...formData
      })
    },
    
    trackFormFieldChange: (fieldName: string, value?: any) => {
      trackEvent('form_field_change', {
        formName,
        fieldName,
        hasValue: !!value
      })
    }
  }
}

// Hook for error boundary tracking
export function useErrorTracking() {
  const { error: logError } = useLogger('ErrorBoundary')

  return {
    trackError: (error: Error, errorInfo?: any) => {
      logError('Component Error Boundary', error, {
        errorInfo,
        componentStack: errorInfo?.componentStack,
        errorBoundary: true
      })
    }
  }
}