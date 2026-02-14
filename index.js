// 🔥 dotenv MUST BE FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { collectionName, connection } from "./dbconfig.js";
import cors from "cors";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json());
app.use(cors()); // no cookie auth now 😎

// ================= JWT MIDDLEWARE =================
function verifyJWTToken(req, resp, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return resp.send({ success: false, msg: "No token provided" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return resp.send({ success: false, msg: "Invalid token" });

    req.user = decoded; // ⭐️ user info save
    next();
  });
}

// ================= AUTH =================

// LOGIN
app.post("/login", async (req, resp) => {
  const { email, password } = req.body;

  const db = await connection();
  const user = await db.collection("users").findOne({ email, password });

  if (!user)
    return resp.send({ success: false, msg: "User not found" });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "5d" }
  );

  resp.send({ success: true, token });
});

// SIGNUP
app.post("/signup", async (req, resp) => {
  const { email, password } = req.body;

  const db = await connection();

  const existing = await db.collection("users").findOne({ email });
  if (existing)
    return resp.send({ success: false, msg: "User already exists" });

  await db.collection("users").insertOne({ email, password });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "5d",
  });

  resp.send({ success: true, token });
});

// ================= TODO =================

// ADD TASK
app.post("/add-task", verifyJWTToken, async (req, resp) => {
  const db = await connection();

  const newTask = {
    ...req.body,
    email: req.user.email, // ⭐️ user wise tasks
  };

  await db.collection(collectionName).insertOne(newTask);

  resp.send({ success: true });
});

// GET TASKS (only logged in user)
app.get("/tasks", verifyJWTToken, async (req, resp) => {
  const db = await connection();

  const result = await db
    .collection(collectionName)
    .find({ email: req.user.email })
    .toArray();

  resp.send({ success: true, result });
});

// DELETE ONE
app.delete("/delete/:id", verifyJWTToken, async (req, resp) => {
  const db = await connection();

  await db.collection(collectionName).deleteOne({
    _id: new ObjectId(req.params.id),
    email: req.user.email,
  });

  resp.send({ success: true });
});

// UPDATE
app.put("/update-task", verifyJWTToken, async (req, resp) => {
  const { _id, ...fields } = req.body;
  const db = await connection();

  await db.collection(collectionName).updateOne(
    { _id: new ObjectId(_id), email: req.user.email },
    { $set: fields }
  );

  resp.send({ success: true });
});

// DELETE MULTIPLE
app.delete("/delete-multiple", verifyJWTToken, async (req, resp) => {
  const ids = req.body.map((id) => new ObjectId(id));
  const db = await connection();

  await db.collection(collectionName).deleteMany({
    _id: { $in: ids },
    email: req.user.email,
  });

  resp.send({ success: true });
});

// SERVER START
app.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
);
