const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { Profile } = require('../models/Profile');

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).select('-password -__v');

    const userIds = users.map(user => user._id);
    const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId profilePhoto');

    const enhancedUsers = users.map(user => {
      const profile = profiles.find(p => p.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        profilePhotoUrl: profile?.profilePhoto
          ? `/uploads/profile/${profile.profilePhoto.split('/').pop()}`
          : '/default-profile.jpg'
      };
    });

    res.json({ users: enhancedUsers });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

// Get conversations
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ 
      participants: req.user._id 
    })
    .populate({
      path: 'participants',
      select: 'name email role',
      match: { _id: { $ne: req.user._id } },
    })
    .populate({
      path: 'lastMessage',
      select: 'content createdAt'
    })
    .sort({ updatedAt: -1 });

    const userIds = conversations.flatMap(conv => conv.participants.map(p => p._id));
    const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId profilePhoto');

    const enhancedConversations = conversations.map(conv => {
      const enhancedParticipants = conv.participants.map(participant => {
        const profile = profiles.find(p => p.userId.toString() === participant._id.toString());
        return {
          ...participant.toObject(),
          profilePhotoUrl: profile?.profilePhoto
            ? `/uploads/profile/${profile.profilePhoto.split('/').pop()}`
            : '/default-profile.jpg'
        };
      });

      return {
        ...conv.toObject(),
        participants: enhancedParticipants
      };
    });

    const filteredConversations = enhancedConversations.filter(conv => 
      conv.participants && conv.participants.length > 0
    );

    res.json({ conversations: filteredConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      message: 'Failed to get conversations', 
      error: error.message 
    });
  }
};

// Start or get conversation
exports.startConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, participantId]
      });
    }

    await conversation.populate({
      path: 'participants',
      select: 'name email role'
    });

    const profiles = await Profile.find({
      userId: { $in: conversation.participants.map(p => p._id) }
    }).select('userId profilePhoto');

    const enhancedParticipants = conversation.participants.map(participant => {
      const profile = profiles.find(p => p.userId.toString() === participant._id.toString());
      return {
        ...participant.toObject(),
        profilePhotoUrl: profile?.profilePhoto
          ? `/uploads/profile/${profile.profilePhoto.split('/').pop()}`
          : '/default-profile.jpg'
      };
    });

    res.json({
      conversation: {
        ...conversation.toObject(),
        participants: enhancedParticipants
      }
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ 
      message: 'Failed to start conversation', 
      error: error.message 
    });
  }
};

// Get messages
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ 
      conversation: req.params.id 
    })
    .populate('sender', 'name image role')
    .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      message: 'Failed to get messages', 
      error: error.message 
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || (!content && !req.file)) {
      return res.status(400).json({ 
        message: 'Conversation ID and content or file are required' 
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      content
    };

    if (req.file) {
      messageData.fileUrl = `/uploads/chat/${req.file.filename}`;
      messageData.fileType = req.file.mimetype;
    }

    const message = await Message.create(messageData);

    conversation.lastMessage = {
      content: content || (req.file ? 'File attachment' : ''),
      createdAt: new Date()
    };
    await conversation.save();

    const populatedMessage = await message.populate('sender', 'name image role');

    const otherParticipant = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    const notification = new Notification({
      recipient: otherParticipant,
      sender: req.user._id,
      type: 'message',
      content: `New message from ${req.user.name}`,
      relatedEntity: conversationId,
      onModel: 'Conversation'
    });
    await notification.save();

    const io = req.app.get('io');
    io.to(conversationId).emit('receiveMessage', populatedMessage);
    io.to(otherParticipant.toString()).emit('newNotification', notification);

    res.json({ message: populatedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      message: 'Failed to send message', 
      error: error.message 
    });
  }
};
