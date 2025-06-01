const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  const clients = new Map(); // userId -> WebSocket

  wss.on('connection', async (ws, req) => {
    try {
      // Authenticate user
      const token = req.url.split('token=')[1];
      if (!token) {
        ws.close();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        ws.close();
        return;
      }

      // Store the connection
      clients.set(user._id.toString(), ws);
      console.log(`User connected: ${user._id}`);

      // Handle messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'join') {
            // User joined their room
            console.log(`User ${data.userId} joined their room`);
          } else if (data.type === 'sendMessage') {
            // Handle sending a message
            const { conversationId, content } = data;
            
            // Verify user is part of the conversation
            const conversation = await Conversation.findOne({
              _id: conversationId,
              participants: data.userId
            });

            if (!conversation) {
              return;
            }

            // Create and save the message
            const message = new Message({
              conversation: conversationId,
              sender: data.userId,
              content
            });
            await message.save();

            // Update conversation's last message
            conversation.lastMessage = message._id;
            await conversation.save();

            // Find recipient (the other participant)
            const recipientId = conversation.participants.find(
              participant => participant.toString() !== data.userId.toString()
            );

            // Send message to recipient if online
            if (clients.has(recipientId.toString())) {
              const recipientWs = clients.get(recipientId.toString());
              recipientWs.send(JSON.stringify({
                type: 'newMessage',
                message: {
                  ...message.toObject(),
                  sender: { _id: data.userId, name: user.name }
                }
              }));
            }

            // Create and send notification
            const notification = new Notification({
              recipient: recipientId,
              sender: data.userId,
              type: 'message',
              content: `New message from ${user.name}`,
              relatedEntity: conversationId,
              onModel: 'Conversation'
            });
            await notification.save();

            if (clients.has(recipientId.toString())) {
              const recipientWs = clients.get(recipientId.toString());
              recipientWs.send(JSON.stringify({
                type: 'newNotification',
                notification: notification.toObject()
              }));
            }
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        clients.delete(user._id.toString());
        console.log(`User disconnected: ${user._id}`);
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close();
    }
  });

  return wss;
}

module.exports = setupWebSocketServer;