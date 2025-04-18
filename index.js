require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());


app.use(
  cors({ origin: process.env.FRONTEND_URL, credentials: true })
);

mongoose.connect(process.env.MONGODB_URI);
const User = mongoose.model("User", new mongoose.Schema({ name: String }));

app.get("/api/getUsers", async (req, res) => {
  console.log("inside get user api call func. in the backend");
  const users = await User.find();
  res.json({ users });
});

app.post("/api/addUser", async (req, res) => {
  console.log("inside add users api call func. in the backend");
  await User.create({ name: req.body.name });
  res.json({ message: "User added" });
});

app.get("/",async(req,res)=>{
  res.send("Server is up and running");
});

app.listen(process.env.PORT, () =>
  console.log(`${process.env.MESSAGE} running on port ${process.env.PORT}`)
);