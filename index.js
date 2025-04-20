require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createClient } = require("redis");
const session = require("express-session");
const { RedisStore } = require("connect-redis");



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
async function init() {
  await redisClient.connect()
    .then(() => console.log('✅ Connected to Redis'))
    .catch(err => console.error('❌ Redis connection error:', err));
}
init();



// create Redis store
let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
})
// Setup express-session middleware
app.use(
  session({
    store: redisStore,
    name: "sid", // session cookie name
    secret: "keyboard cat", // use strong secret in prod
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: "strict" // can use "none" + secure: true if frontend on different domain + HTTPS
    }
  })
);

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


// This checks Redis-based session data before allowing access
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // session exists ✅
  } else {
    return res.status(401).send("Unauthorized. Please login.");
  }
}



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

    // Set session data
    req.session.user = { id: user._id, username: user.username };

    // Send cookie is automatic — just send a success response
    res.send({ message: 'Logged in' });
  } catch (err) {
    res.status(500).send('Login error');
  }
});


// Get session user
app.get('/api/me', (req, res) => {

  if (!req.session.user) return res.status(401).send('Unauthorized');
  return res.send(req.session.user); // Send back the session user info
});



app.get("/api/getUsers", isAuthenticated, async (req, res) => {
  try {
    console.log("inside get user api call func. in the backend");
    const users = await Data.find();
    res.send({ users });
  } catch (err) {
    console.log("error in getting users", err);
    res.status(500).send("Error retrieving users");
  }
});

/* api for add user */
app.post("/api/addUser", isAuthenticated, async (req, res) => {
  try {
    console.log("inside add users api call func. in the backend");
    console.log("req body", req.body.name);
    await Data.create({ name: req.body.name });
    res.send({ message: "User added" });
  } catch (err) {
    console.log("error in adding user", err);
    res.status(500).send("Error adding user");
  }
});


/* api for logging out */
app.post('/api/logout', (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.log("Logout error:", err);
        return res.status(500).send("Logout failed");
      }
      res.clearCookie("connect.sid"); // This clears the cookie on frontend
      res.send({ message: "Logged out successfully" });
    });
  } catch (err) {
    console.log("error in logging out", err);
    res.status(500).send("Error logging out");
  }
});


/*testing api for redis */
app.get("/api/", async (req, res) => {
  try {
    console.log("inside counter api call func. in the backend");
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


