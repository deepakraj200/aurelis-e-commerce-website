'use strict';

const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  let uri = env.MONGODB_URI;

  if (!uri && env.ENABLE_MEMORY_DB) {
    // Real MongoDB engine, ephemeral process, durable files for local development.
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const fs = require('fs');
    fs.mkdirSync(env.DB_PATH, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath: env.DB_PATH,
        storageEngine: 'wiredTiger',
        dbName: 'aurelis',
      },
    });
    uri = memoryServer.getUri('aurelis');
    console.log('[db] Embedded MongoDB started (development persistence enabled).');
  }

  if (!uri) {
    throw new Error('MONGODB_URI is required when the embedded database is disabled.');
  }

  mongoose.connection.on('connected', () => {
    const name = mongoose.connection.name;
    console.log(`[db] MongoDB connected → ${name}`);
  });
  mongoose.connection.on('error', (error) => {
    console.error('[db] MongoDB connection error:', error.message);
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 12000,
    autoIndex: env.NODE_ENV !== 'production',
  });

  return mongoose.connection;
};

const disconnectDB = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = { connectDB, disconnectDB };
