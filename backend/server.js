const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const achievementRoutes = require("./routes/achievementsRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require('./routes/chatRoutes');
const viewProfileRoutes = require("./routes/viewProfileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');


// Configure Socket.io
const io = new Server(server, {
  path: '/socket.io', // matches client
  cors: {
    origin: 'http://localhost:5173', // IMPORTANT!
    methods: ['GET', 'POST'],
    credentials: true
  }
});



// Socket.io connection handler with authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log('Socket auth token:', token); // <-- DEBUG

  if (!token) {
    return next(new Error('Authentication error: Missing token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    console.error('JWT Error:', err);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, 'User:', socket.userId);

  // Join user's personal room
  socket.join(socket.userId);

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
  });

  socket.on('sendMessage', async (messageData) => {
    try {
      // Verify user is part of the conversation
      const conversation = await Conversation.findOne({
        _id: messageData.conversationId,
        participants: socket.userId
      });

      if (!conversation) {
        return socket.emit('error', 'You are not part of this conversation');
      }

      // Create and save the message
      const message = new Message({
        conversation: messageData.conversationId,
        sender: socket.userId,
        content: messageData.content
      });
      await message.save();

      // Populate sender info
      const populatedMessage = await message.populate('sender', 'name image role');

      // Update conversation's last message
      conversation.lastMessage = {
        content: messageData.content,
        createdAt: new Date()
      };
      await conversation.save();

      // Emit to all participants in the conversation
      io.to(messageData.conversationId).emit('receiveMessage', populatedMessage);

      // Create notification for other participants
      const otherParticipants = conversation.participants.filter(
        p => p.toString() !== socket.userId.toString()
      );

      for (const participantId of otherParticipants) {
        const notification = new Notification({
          recipient: participantId,
          sender: socket.userId,
          type: 'message',
          content: `New message in your conversation`,
          relatedEntity: messageData.conversationId,
          onModel: 'Conversation'
        });
        await notification.save();

        // Send notification to recipient if online
        io.to(participantId.toString()).emit('newNotification', notification);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});



// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use("/uploads/profile", express.static(path.join(__dirname, "public", "uploads", "profile")));
app.use("/uploads/cover", express.static(path.join(__dirname, "public", "uploads", "cover")));
app.use("/default-profile.jpg", express.static(path.join(__dirname, "public", "default-profile.jpg")));
app.use("/default-cover.jpg", express.static(path.join(__dirname, "public", "default-cover.jpg")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Make io accessible in routes
app.set('io', io);

// Routes
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running correctly", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use('/api/chat', chatRoutes);
app.use("/api/profile", viewProfileRoutes);
app.use("/api/notifications", notificationRoutes);


// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
  });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`);
});