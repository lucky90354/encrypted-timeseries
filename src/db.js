const { MongoClient } = require('mongodb');
const { MONGODB_URI, MONGODB_DB, TIMESERIES_COLLECTION } = require('./config');

let client;
let collection;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connect({ maxRetries = 10, delayMs = 2000 } = {}) {
  if (collection) return collection;

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(MONGODB_DB);
      collection = db.collection(TIMESERIES_COLLECTION);
      await collection.createIndex({ minuteKey: 1 }, { unique: true });
      return collection;
    } catch (err) {
      if (attempt >= maxRetries) {
        throw err;
      }
      console.warn(
        `MongoDB connect attempt ${attempt} failed (will retry in ${delayMs}ms):`,
        err.message
      );
      await sleep(delayMs);
    }
  }
}

function minuteKeyForTimestamp(ts) {
  const d = new Date(ts);
  d.setSeconds(0, 0);
  return d.toISOString();
}

async function saveEntry(entry) {
  const minuteKey = minuteKeyForTimestamp(entry.timestamp);
  const update = {
    $push: {
      entries: {
        timestamp: entry.timestamp,
        name: entry.name,
        origin: entry.origin,
        destination: entry.destination,
      },
    },
    $inc: { count: 1 },
    $setOnInsert: { minuteKey, createdAt: new Date() },
  };
  const col = await connect();
  await col.updateOne({ minuteKey }, update, { upsert: true });
}

async function getRecentMinutes(limit = 10) {
  const col = await connect();
  return col
    .find()
    .sort({ minuteKey: -1 })
    .limit(limit)
    .toArray();
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    collection = null;
  }
}

module.exports = {
  connect,
  saveEntry,
  getRecentMinutes,
  close,
};
