

import { MongoClient } from "mongodb";

const url = process.env.MONGO_URI;   // 🔥 CHANGE
const dbName = "node-project";

export const collectionName = "todo";

const client = new MongoClient(url);

export const connection = async () => {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
  return client.db(dbName);
};
