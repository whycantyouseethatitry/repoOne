require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 4000;

async function connectMongo() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('[WARN] MONGO_URI not provided. Feedback persistence disabled.');
    return;
  }
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[OK] Connected to MongoDB');
  } catch (err) {
    console.error('[ERROR] Mongo connection failed:', err.message);
  }
}

async function start() {
  await connectMongo();
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`[OK] Server listening on port ${PORT}`);
  });
}

start();
