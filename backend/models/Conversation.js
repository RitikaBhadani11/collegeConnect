const mongoose = require('mongoose');
const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: {
    content: String,
    createdAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
