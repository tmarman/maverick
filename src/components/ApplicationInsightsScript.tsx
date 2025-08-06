'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export function ApplicationInsightsScript() {
  const connectionString = process.env.NEXT_PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING

  useEffect(() => {
    // Initialize the logger instance on client-side
    if (typeof window !== 'undefined' && connectionString) {
      import('@/lib/logging').then(({ logger }) => {
        // Track initial page view
        logger.trackPageView()
        
        // Set up global error handling
        window.addEventListener('error', (event) => {
          logger.error('Global Error', event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            message: event.message
          }, 'GlobalErrorHandler')
        })

        // Set up unhandled promise rejection handling
        window.addEventListener('unhandledrejection', (event) => {
          logger.error('Unhandled Promise Rejection', new Error(event.reason), {
            reason: event.reason,
            type: event.type
          }, 'GlobalErrorHandler')
        })

        console.log('Application Insights initialized successfully')
      }).catch((error) => {
        console.warn('Failed to initialize Application Insights logger:', error)
      })
    }
  }, [connectionString])

  // Only render the script if we have a connection string
  if (!connectionString) {
    console.warn('NEXT_PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING not found - Application Insights will not be initialized')
    return null
  }

  return (
    <Script id="application-insights" strategy="afterInteractive">
      {`
        !(function (cfg) {
          function r(cfg) {
            cfg.onInit && cfg.onInit(cfg);
          }
          function s(cfg) {
            cfg.queue = cfg.queue || [];
            for (var e, n = cfg.queue, t = 0; e = n[t]; ++t) cfg[e[0]].apply(cfg, e[1])
          }
          function o(cfg) {
            try {
              cfg.applicationInsightsId = cfg.applicationInsightsId || "applicationinsights-web-js";
              var e = cfg.cfg || {};
              if (
                e.connectionString ||
                e.instrumentationKey ||
                e.ingestionendpoint ||
                ((e.endpointUrl = (e.endpointUrl || "https://js.monitor.azure.com/").replace(/[\/]+$/, "") + "/scripts/b/ai.3.gbl.min.js"),
                (e.src = e.src || e.endpointUrl)),
                e.src
              ) {
                var n = document.createElement("script");
                n.async = !0, n.src = e.src, n.crossOrigin = e.crossOrigin, n.onerror = e.onError || r, n.onload = e.onLoad || r;
                var t = document.getElementsByTagName("script")[0];
                t && t.parentNode && t.parentNode.insertBefore(n, t)
              } else r(cfg)
            } catch (e) {
              r(cfg)
            }
          }
          var i = cfg.cfg.connectionString;
          if (i) cfg.queue.push(["init", { connectionString: i }]);
          else {
            var d = cfg.cfg.instrumentationKey || "00000000-0000-0000-0000-000000000000";
            cfg.queue.push(["init", { instrumentationKey: d }])
          }
          cfg.queue.push(["trackPageView"]);
          s(cfg), o(cfg)
        })({
          src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
          crossOrigin: "anonymous",
          cfg: {
            connectionString: "${connectionString}",
            enableAutoRouteTracking: true,
            enableCorsCorrelation: true,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            loggingLevelConsole: 1,
            loggingLevelTelemetry: 1,
            samplingPercentage: 100
          }
        });
      `}
    </Script>
  )
}