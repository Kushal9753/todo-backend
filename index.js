// 🔥 dotenv MUST BE FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { collectionName, connection } from "./dbconfig.js";
import cors from "cors";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());

console.log("ENV CHECK:", process.env.MONGO_URI);

// ================= AUTH =================

// LOGIN
app.post("/login", async (req, resp) => {
  const { email, password } = req.body;

  const db = await connection();
  const user = await db.collection("users").findOne({ email, password });

  if (!user) return resp.send({ success: false, msg: "User not found" });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "5d" }
  );

  resp.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  resp.send({ success: true });
});

// SIGNUP
app.post("/signup", async (req, resp) => {
  const { email, password } = req.body;

  const db = await connection();
  await db.collection("users").insertOne({ email, password });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "5d",
  });

 resp.cookie("token", token, {
  httpOnly: true,
  sameSite: "none",
  secure: true,
});


  resp.send({ success: true });
});

// JWT middleware
function verifyJWTToken(req, resp, next) {
  const token = req.cookies.token;
  if (!token) return resp.send({ success: false, msg: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err) => {
    if (err) return resp.send({ success: false, msg: "Invalid token" });
    next();
  });
}

// ================= TODO =================

// ADD
app.post("/add-task", verifyJWTToken, async (req, resp) => {
  const db = await connection();
  await db.collection(collectionName).insertOne(req.body);
  resp.send({ success: true });
});

// GET
app.get("/tasks", verifyJWTToken, async (req, resp) => {
  const db = await connection();
  const result = await db.collection(collectionName).find().toArray();
  resp.send({ success: true, result });
});

// DELETE ONE
app.delete("/delete/:id", verifyJWTToken, async (req, resp) => {
  const db = await connection();
  await db
    .collection(collectionName)
    .deleteOne({ _id: new ObjectId(req.params.id) });
  resp.send({ success: true });
});

// UPDATE
app.put("/update-task", verifyJWTToken, async (req, resp) => {
  const { _id, ...fields } = req.body;

  const db = await connection();
  await db.collection(collectionName).updateOne(
    { _id: new ObjectId(_id) },
    { $set: fields }
  );

  resp.send({ success: true });
});

// DELETE MULTIPLE
app.delete("/delete-multiple", verifyJWTToken, async (req, resp) => {
  const ids = req.body.map((id) => new ObjectId(id));
  const db = await connection();
  await db.collection(collectionName).deleteMany({ _id: { $in: ids } });
  resp.send({ success: true });
});

// SERVER START
app.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
);
