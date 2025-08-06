# Azure Static Web Apps Logging Setup

This document outlines how to set up comprehensive logging and monitoring for the Maverick application deployed on Azure Static Web Apps.

## 1. Azure Application Insights Setup

### Create Application Insights Resource

1. In the Azure Portal, go to your Static Web App resource
2. Navigate to **Application Insights** in the left menu
3. Click **Yes** to enable Application Insights
4. Select **Save**

This will create an Application Insights resource and link it to your Static Web App.

### Get Connection String

1. Go to your newly created Application Insights resource
2. Navigate to **Overview** 
3. Copy the **Connection String** (not the Instrumentation Key)
4. It should look like: `InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://...`

### Configure Environment Variables

In your Azure Static Web App, add these environment variables:

1. Go to **Configuration** → **Application settings**
2. Add the following:

```
NEXT_PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=...;IngestionEndpoint=...
```

## 2. Logging Features Implemented

### Client-Side Logging
- **Page view tracking**: Automatic tracking of page navigation
- **Error tracking**: Global error handlers for unhandled errors and promise rejections
- **User action tracking**: Custom events for user interactions
- **Performance tracking**: Page load timing and navigation metrics
- **API request tracking**: Monitoring of fetch requests with response times

### Server-Side Logging
- **API request/response logging**: All API endpoints log requests, responses, and errors
- **Structured logging**: Consistent log format with context, timestamps, and metadata
- **Error tracking**: Detailed error logging with stack traces and request context
- **Performance monitoring**: Request duration tracking

### React Hooks for Components

#### useLogger Hook
```typescript
import { useLogger } from '@/hooks/use-logger'

function MyComponent() {
  const logger = useLogger('MyComponent')
  
  const handleAction = () => {
    logger.trackUserAction('button_click', { buttonType: 'submit' })
  }
  
  const callApi = async () => {
    try {
      await logger.trackApiCall(
        () => fetch('/api/data').then(r => r.json()),
        'GetData',
        '/api/data'
      )
    } catch (error) {
      logger.error('API call failed', error)
    }
  }
}
```

#### usePageTracking Hook
```typescript
import { usePageTracking } from '@/hooks/use-logger'

function ProjectsPage() {
  usePageTracking('Projects List', { section: 'app' })
  // Automatically tracks page views and performance
}
```

#### useFormTracking Hook
```typescript
import { useFormTracking } from '@/hooks/use-logger'

function ImportForm() {
  const formTracker = useFormTracking('ImportRepository')
  
  const onSubmit = (data) => {
    formTracker.trackFormSubmit(data, true)
  }
}
```

## 3. What You Can Monitor

### In Application Insights Dashboard

1. **Failures**: See all failed requests, client errors, and exceptions
2. **Performance**: Monitor API response times and client-side performance
3. **Usage**: Track page views, user flows, and feature usage
4. **Live Metrics**: Real-time monitoring of active users and requests
5. **Custom Events**: Track specific business events and user actions

### Available Queries

#### API Performance
```kusto
requests
| where timestamp > ago(1d)
| summarize avg(duration) by name
| order by avg_duration desc
```

#### Error Analysis
```kusto
exceptions
| where timestamp > ago(1d)
| summarize count() by type, outerMessage
| order by count_ desc
```

#### User Activity
```kusto
customEvents
| where name == "UserAction"
| where timestamp > ago(1d)
| summarize count() by tostring(customDimensions.action)
```

## 4. Log Levels and Filtering

### Environment-Based Logging
- **Development**: Full debug logging to console
- **Production**: Structured logging to Application Insights with appropriate sampling

### Sampling Configuration
- **Client-side**: 100% sampling for errors, 10% for general telemetry
- **Server-side**: All errors logged, performance metrics sampled

## 5. Troubleshooting

### Common Issues

1. **Connection String Not Working**
   - Ensure the environment variable is prefixed with `NEXT_PUBLIC_`
   - Verify the connection string includes both InstrumentationKey and IngestionEndpoint

2. **No Data in Application Insights**
   - Check browser console for initialization errors
   - Verify the Application Insights resource is in the same region
   - Allow up to 5 minutes for data to appear

3. **CORS Issues**
   - Application Insights automatically handles CORS for Azure domains
   - No additional configuration needed for Static Web Apps

### Validation

To verify logging is working:

1. Check browser console for "Application Insights initialized successfully"
2. Navigate between pages and check the Network tab for telemetry requests to `dc.applicationinsights.microsoft.com`
3. In Application Insights, check **Live Metrics** for real-time data
4. Trigger an error and verify it appears in the **Failures** section

## 6. Production Optimization

### Performance Impact
- **Client bundle size**: ~50KB additional for Application Insights SDK
- **Network overhead**: Minimal - telemetry is batched and compressed
- **CPU impact**: Negligible - asynchronous processing

### Data Retention
- **Default**: 90 days for Application Insights
- **Extended**: Can be configured for longer retention with additional cost

### Cost Estimation
- **Free tier**: 1GB/month of telemetry data
- **Pay-as-you-go**: ~$2.30/GB for additional data
- **Typical usage**: Small to medium apps usually stay within free tier

## 7. Next Steps

1. Set up alerts for critical errors and performance thresholds
2. Create custom dashboards for business metrics
3. Implement distributed tracing for complex operations
4. Set up automated anomaly detection
5. Configure continuous export for data archival

This comprehensive logging setup provides production-ready monitoring and debugging capabilities for your Static Web Apps deployment.