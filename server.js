
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const PORT = 3000;

// Data storage
const userDbFile = "./data/users.json";
const videoDbFile = "./data/videos.json";

let users = fs.existsSync(userDbFile) ? JSON.parse(fs.readFileSync(userDbFile)) : [];
let videos = fs.existsSync(videoDbFile) ? JSON.parse(fs.readFileSync(videoDbFile)) : [];

// Middleware
app.use(express.static("public"));
app.use("/videos", express.static("videos"));
app.use("/thumbnails", express.static("thumbnails"));
app.use(express.json());
app.use(session({
  secret: "minitube_secret_key",
  resave: false,
  saveUninitialized: false,
}));

// Helpers
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(403).json({ error: "Login required" });
  next();
}

// ----------------- Multer for Videos -----------------
const videoStorage = multer.diskStorage({
  destination: "videos/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".mp4", ".webm"];
    if (!allowed.includes(ext)) {
      return cb(new Error("Only .mp4 and .webm allowed"));
    }
    cb(null, true);
  }
});

// ----------------- Multer for Thumbnails -----------------
const thumbStorage = multer.diskStorage({
  destination: "thumbnails/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const uploadThumb = multer({
  storage: thumbStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".png", ".jpg", ".jpeg"];
    if (!allowed.includes(ext)) {
      return cb(new Error("Only .png, .jpg, .jpeg thumbnails allowed"));
    }
    cb(null, true);
  }
});

// ----------------- Auth -----------------
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "Username taken" });
  }
  const hash = bcrypt.hashSync(password, 10);
  const user = { id: Date.now(), username, password: hash, subscribers: [] };
  users.push(user);
  fs.writeFileSync(userDbFile, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: "Invalid login" });
  }
  req.session.userId = user.id;
  res.json({ success: true, username: user.username });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ----------------- Videos -----------------
app.get("/api/videos", (req, res) => res.json(videos));

app.post("/api/upload", requireLogin, uploadVideo.single("video"), (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  const videoPath = req.file.path;
  const thumbFilename = `${Date.now()}.png`;
  const thumbPath = path.join("thumbnails", thumbFilename);

  // Generate thumbnail at 2 seconds
  ffmpeg(videoPath)
    .screenshots({
      timestamps: ['2'],
      filename: thumbFilename,
      folder: 'thumbnails',
      size: '320x240'
    })
    .on('end', () => {
      const newVideo = {
        id: Date.now(),
        title: req.file.originalname,
        filename: req.file.filename,
        uploader: user.username,
        likes: [],
        comments: [],
        thumbnail: thumbFilename
      };
      videos.push(newVideo);
      fs.writeFileSync(videoDbFile, JSON.stringify(videos, null, 2));
      res.json({ success: true, video: newVideo });
    })
    .on('error', err => {
      console.error("Thumbnail generation error:", err);
      res.status(500).json({ error: "Video uploaded but thumbnail generation failed." });
    });
});

app.get("/api/videos/:id", (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  if (!video) return res.status(404).json({ error: "Not found" });
  res.json(video);
});

// Change thumbnail
app.post("/api/videos/:id/thumbnail", requireLogin, uploadThumb.single("thumbnail"), (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });

  const user = users.find(u => u.id === req.session.userId);
  if (video.uploader !== user.username) {
    return res.status(403).json({ error: "Not your video" });
  }

  video.thumbnail = req.file.filename;
  fs.writeFileSync(videoDbFile, JSON.stringify(videos, null, 2));
  res.json({ success: true, thumbnail: video.thumbnail });
});

// Like
app.post("/api/videos/:id/like", requireLogin, (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  if (!video) return res.status(404).json({ error: "Not found" });

  const user = users.find(u => u.id === req.session.userId);
  if (video.likes.includes(user.username)) {
    video.likes = video.likes.filter(u => u !== user.username);
  } else {
    video.likes.push(user.username);
  }
  fs.writeFileSync(videoDbFile, JSON.stringify(videos, null, 2));
  res.json({ likes: video.likes.length });
});

// Comment
app.post("/api/videos/:id/comment", requireLogin, (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  if (!video) return res.status(404).json({ error: "Not found" });

  const user = users.find(u => u.id === req.session.userId);
  const comment = { user: user.username, text: req.body.text };
  video.comments.push(comment);
  fs.writeFileSync(videoDbFile, JSON.stringify(videos, null, 2));
  res.json(comment);
});

// ----------------- User Pages -----------------
app.get("/api/user/:username", (req, res) => {
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: "User not found" });

  const userVideos = videos.filter(v => v.uploader === user.username);
  res.json({
    username: user.username,
    subscribers: user.subscribers.length,
    videos: userVideos
  });
});

app.post("/api/subscribe/:username", requireLogin, (req, res) => {
  const target = users.find(u => u.username === req.params.username);
  if (!target) return res.status(404).json({ error: "User not found" });

  const me = users.find(u => u.id === req.session.userId);
  if (target.subscribers.includes(me.username)) {
    target.subscribers = target.subscribers.filter(s => s !== me.username);
  } else {
    target.subscribers.push(me.username);
  }
  fs.writeFileSync(userDbFile, JSON.stringify(users, null, 2));
  res.json({ success: true, subscribers: target.subscribers.length });
});

// ----------------- Start -----------------
app.listen(PORT, () =>
  console.log(`MiniTube running at http://localhost:${PORT}`)
);
