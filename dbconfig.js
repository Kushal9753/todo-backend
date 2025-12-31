// import { MongoClient } from "mongodb";

// const url ="mongodb+srv://Kushal:kushal12345@cluster0.z86e0ss.mongodb.net/?appName=Cluster0";

// const dbName = "node-project"

// export const collectionName = "todo";

// const client = new MongoClient(url);

// export const connection = async () => {
//   await client.connect();
//   return await client.db(dbName);
// };


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
