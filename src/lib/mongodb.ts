
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'wanfeng_marks'; // Default DB name if not set

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

interface CachedClient {
  client: MongoClient | null;
  db: Db | null;
}

let cachedClient: CachedClient = { client: null, db: null };

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient.client && cachedClient.db) {
    try {
      // Ping the database to check if connection is still alive
      await cachedClient.db.command({ ping: 1 });
      return cachedClient as { client: MongoClient; db: Db };
    } catch (e) {
      console.warn("MongoDB connection lost, attempting to reconnect.", e);
      cachedClient.client = null;
      cachedClient.db = null;
    }
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB_NAME);
    console.log('Successfully connected to MongoDB.');
    cachedClient = { client, db };
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Could not connect to database.');
  }
}

// Optional: A function to ensure collections exist if needed, though MongoDB creates them on first write.
// export async function ensureCollections(db: Db) {
//   const collections = await db.listCollections().toArray();
//   const collectionNames = collections.map(c => c.name);

//   if (!collectionNames.includes('config')) {
//     await db.createCollection('config');
//     console.log("Created 'config' collection.");
//   }
//   if (!collectionNames.includes('categories')) {
//     await db.createCollection('categories');
//     console.log("Created 'categories' collection.");
//   }
//   if (!collectionNames.includes('bookmarks')) {
//     await db.createCollection('bookmarks');
//     console.log("Created 'bookmarks' collection.");
//   }
// }
