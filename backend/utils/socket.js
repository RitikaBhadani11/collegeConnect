const socketMap = new Map();

// Store socket connection
exports.storeSocket = (userId, socket) => {
  socketMap.set(userId.toString(), socket);
};

// Remove socket connection
exports.removeSocket = (userId) => {
  const socket = socketMap.get(userId.toString());
  if (socket) {
    socket.disconnect();
  }
  socketMap.delete(userId.toString());
};

// Emit event to specific conversation participants
exports.emitSocketEvent = async (req, conversationId, eventName, data) => {
  try {
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', '_id');
    
    if (!conversation) return;

    conversation.participants.forEach(participant => {
      if (participant._id.toString() !== req.user._id.toString()) {
        const socket = socketMap.get(participant._id.toString());
        if (socket) {
          socket.emit(eventName, data);
        }
      }
    });
  } catch (error) {
    console.error('Socket emit error:', error);
  }
};