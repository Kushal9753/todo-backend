import { MongoClient } from "mongodb";

const url = process.env.MONGO_URI;
const dbName = "node-project";

export const collectionName = "todo";

let client;

export const connection = async () => {
  try {
    if (!client) {
      client = new MongoClient(url);
      await client.connect();
      console.log("MongoDB Connected ✅");
    }
    return client.db(dbName);
  } catch (err) {
    console.log("Mongo Error:", err);
  }
};
