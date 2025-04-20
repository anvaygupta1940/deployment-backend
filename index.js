require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createClient } = require("redis");


const app = express();
app.use(express.json());
app.use(
  cors({ origin: process.env.FRONTEND_URL, credentials: true })
);

//  Create Redis client
const redisClient = createClient({
  socket: {
    host: '13.203.67.132',
    port: 6379
  },
  password: 'anabhavy' // optional
});

// 🔁 Connect to Redis
redisClient.connect()
  .then(() => console.log('✅ Connected to Redis'))
  .catch(err => console.error('❌ Redis connection error:', err));



mongoose.connect(process.env.MONGODB_URI);
const User = mongoose.model("User", new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  }, {
  timestamps: true
}));
const Data = mongoose.model("Data", new mongoose.Schema(
  {
    name: { type: String, required: true },
  }, {
  timestamps: true
}));



/* register api*/
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send('User already exists');

    const user = new User({ username, password });
    await user.save();
    res.send('User registered');
  } catch (err) {
    res.status(500).send('Error registering user');
  }
});

/*Login api */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).send('Invalid credentials');

    // req.session.user = { id: user._id, username: user.username };
    // res.send({ message: 'Logged in', sessionId: req.sessionID });
    res.send({ message: 'Logged in' });
  } catch (err) {
    res.status(500).send('Login error');
  }
});


// Get session user
app.get('/api/me', (req, res) => {
  // if (!req.session.user) return res.status(401).send('Unauthorized');
  // res.send(req.session.user);
  return res.send({ username: 'testUser' });
});



app.get("/api/getUsers", async (req, res) => {
  try {
    console.log("inside get user api call func. in the backend");
    const users = await Data.find();
    res.send({ users });
  } catch (err) {
    console.log("error in getting users", err);
  }
});

/* api for add user */
app.post("/api/addUser", async (req, res) => {
  try {
    console.log("inside add users api call func. in the backend");
    console.log("req body", req.body.name);
    await Data.create({ name: req.body.name });
    res.send({ message: "User added" });
  } catch (err) {
    console.log("error in adding user", err);
  }
});

app.get("/api/counter", async (req, res) => {
  try {
    let count = await redisClient.incr('counter');
    res.send(`🔁 Counter value: ${count}`);
  } catch (err) {
    console.error('❌ Redis error on /counter:', err);
    res.status(500).send('Redis error');
  }
});

app.listen(process.env.PORT, () =>
  console.log(`${process.env.MESSAGE} running on port ${process.env.PORT}`)
);