const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc Search users by name or email, excluding self
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
      ],
      _id: { $ne: req.user.id }
    }).select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

// @desc Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', '-password')
      .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get conversations', error: error.message });
  }
};

// @desc Start new conversation or fetch existing
exports.startConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, participantId]
      });
    }

    conversation = await conversation.populate('participants', '-password');
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start conversation', error: error.message });
  }
};

// @desc Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name image');

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};

// @desc Send message in a conversation
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content
    });

    // Update last message for quick access
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content,
        createdAt: new Date()
      },
      updatedAt: new Date()
    });

    const fullMessage = await message.populate('sender', 'name image');

    res.json({ message: fullMessage });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};
