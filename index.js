import e from "express";
import { collectionName, connection } from "./dbconfig.js";
import cors from "cors";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = e();

app.use(e.json());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(cookieParser());


// 🔐 LOGIN
app.post("/login", async (req, resp) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return resp.send({ success: false, msg: "login not done" });
  }

  const db = await connection();
  const collection = db.collection("users");

  const user = await collection.findOne({ email, password });

  if (!user) {
    return resp.send({ success: false, msg: "User not found" });
  }

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "5d" }
  );

  resp.cookie("token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true
  });

  resp.send({ success: true, msg: "login done" });
});


// 🔐 SIGNUP
app.post("/signup", async (req, resp) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return resp.send({ success: false, msg: "signup not done" });
  }

  const db = await connection();
  const collection = db.collection("users");

  await collection.insertOne({ email, password });

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: "5d" }
  );

  resp.cookie("token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true
  });

  resp.send({ success: true, msg: "signup done" });
});


// 🔐 JWT MIDDLEWARE
function verifyJWTToken(req, resp, next) {
  const token = req.cookies.token;

  if (!token) {
    return resp.send({ success: false, msg: "no token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return resp.send({ success: false, msg: "invalid token" });
    }
    next();
  });
}


// ➕ ADD TASK
app.post("/add-task", verifyJWTToken, async (req, resp) => {
  const db = await connection();
  const collection = db.collection(collectionName);

  await collection.insertOne(req.body);
  resp.send({ success: true, message: "new task added" });
});


// 📋 GET TASKS
app.get("/tasks", verifyJWTToken, async (req, resp) => {
  const db = await connection();
  const collection = db.collection(collectionName);

  const result = await collection.find({}).toArray();
  resp.send({ success: true, result });
});


// ❌ DELETE ONE
app.delete("/delete/:id", verifyJWTToken, async (req, resp) => {
  const db = await connection();
  const collection = db.collection(collectionName);

  await collection.deleteOne({ _id: new ObjectId(req.params.id) });
  resp.send({ success: true });
});


// ✏️ UPDATE
app.put("/update-task", verifyJWTToken, async (req, resp) => {
  const { _id, ...fields } = req.body;

  const db = await connection();
  const collection = db.collection(collectionName);

  await collection.updateOne(
    { _id: new ObjectId(_id) },
    { $set: fields }
  );

  resp.send({ success: true });
});


// ❌ DELETE MULTIPLE
app.delete("/delete-multiple", verifyJWTToken, async (req, resp) => {
  const ids = req.body.map(id => new ObjectId(id));

  const db = await connection();
  const collection = db.collection(collectionName);

  await collection.deleteMany({ _id: { $in: ids } });
  resp.send({ success: true });
});

export default app;
