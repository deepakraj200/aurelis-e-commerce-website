'use strict';

const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { seedDatabase } = require('./services/seedService');
const { expireStaleOrders } = require('./services/orderService');

let server;
let cleanupTimer;

const start = async () => {
  await connectDB();

  if (env.AUTO_SEED) {
    await seedDatabase({ onlyIfEmpty: true });
  }

  await expireStaleOrders();
  cleanupTimer = setInterval(() => {
    expireStaleOrders().catch((error) => console.error('[orders] expiry sweep failed:', error.message));
  }, 15 * 60 * 1000);
  cleanupTimer.unref();

  server = app.listen(env.PORT, () => {
    console.log(`\n  AURELIS API running at ${env.APP_URL}`);
    console.log(`  Environment: ${env.NODE_ENV}`);
    console.log(`  Payments: ${env.paymentsEnabled ? 'Stripe (test/live per key)' : 'Sandbox test mode'}`);
    console.log(`  Uploads: ${env.cloudinaryEnabled ? 'Cloudinary' : 'Local disk'}\n`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[server] Port ${env.PORT} is already in use.`);
    } else {
      console.error('[server]', error);
    }
    process.exitCode = 1;
  });
};

const shutdown = async (signal) => {
  console.log(`\n[server] ${signal} received, shutting down...`);
  clearInterval(cleanupTimer);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB().catch(() => {});
  process.exit(0);
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

start().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
