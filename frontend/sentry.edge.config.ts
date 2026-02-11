import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://9d14f819990c11cfa4db421963b23102@o4510868817379328.ingest.us.sentry.io/4510868898447360",

  // Send user IP, cookies, etc. for better debugging
  sendDefaultPii: true,

  // Performance Monitoring - capture 100% of transactions
  tracesSampleRate: 1.0,

  // Structured Logs
  _experiments: {
    enableLogs: true,
  },
});
