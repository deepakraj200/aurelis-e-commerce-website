'use strict';

const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { seedDatabase } = require('../services/seedService');

(async () => {
  try {
    await connectDB();
    await seedDatabase({ onlyIfEmpty: false });
    if (!env.MONGODB_URI && env.ENABLE_MEMORY_DB) {
      console.log('[seed] Embedded database files were written to backend/.data/db.');
    } else {
      console.log('[seed] Seed complete.');
    }
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[seed] Failed:', error);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
})();
