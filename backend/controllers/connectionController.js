// const User = require("../models/User");
// const Connection = require("../models/Connection");
// const { Profile } = require("../models/Profile");

// // Get pending connection requests for current user
// exports.getConnectionRequests = async (req, res) => {
//   try {
//     const requests = await Connection.find({
//       recipient: req.user._id,
//       status: "pending",
//     }).populate("requester", "name email role profilePhotoUrl");

//     res.json({ requests });
//   } catch (error) {
//     console.error("Error fetching connection requests:", error);
//     res.status(500).json({ message: "Error fetching connection requests" });
//   }
// };

// // Get suggested users (not connected and no pending requests)
// exports.getSuggestedUsers = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     // Get all connections (both pending and accepted)
//     const allConnections = await Connection.find({
//       $or: [{ requester: userId }, { recipient: userId }]
//     });

//     const connectedUserIds = allConnections.map(conn => 
//       conn.requester.equals(userId) ? conn.recipient : conn.requester
//     );

//     const suggestedUsers = await User.find({
//       _id: {
//         $ne: userId,
//         $nin: connectedUserIds,
//       },
//     })
//       .select("name email role profilePhotoUrl department batch")
//       .limit(10);

//     res.json({ users: suggestedUsers });
//   } catch (error) {
//     console.error("Error fetching suggested users:", error);
//     res.status(500).json({ message: "Error fetching suggested users" });
//   }
// };

// // Send connection request
// exports.sendConnectionRequest = async (req, res) => {
//   try {
//     const recipientId = req.params.userId;
//     const requesterId = req.user._id;

//     if (recipientId === requesterId.toString()) {
//       return res.status(400).json({ message: "Cannot send request to yourself" });
//     }

//     // Check if connection already exists in any state
//     const existingConnection = await Connection.findOne({
//       $or: [
//         { requester: requesterId, recipient: recipientId },
//         { requester: recipientId, recipient: requesterId }
//       ]
//     });

//     if (existingConnection) {
//       let message = "Connection already exists";
//       if (existingConnection.status === "pending") {
//         if (existingConnection.requester.equals(requesterId)) {
//           message = "Request already sent";
//         } else {
//           message = "This user has already sent you a request";
//         }
//       } else if (existingConnection.status === "accepted") {
//         message = "Already connected with this user";
//       }
//       return res.status(400).json({ message });
//     }

//     const connection = new Connection({
//       requester: requesterId,
//       recipient: recipientId,
//       status: "pending",
//     });

//     await connection.save();

//     res.json({ 
//       message: "Connection request sent successfully", 
//       connection 
//     });
//   } catch (error) {
//     console.error("Error sending connection request:", error);
//     res.status(500).json({ 
//       message: "Error sending connection request",
//       error: error.message 
//     });
//   }
// };

// // Respond to connection request
// exports.respondToConnectionRequest = async (req, res) => {
//   try {
//     const requestId = req.params.requestId;
//     const { action } = req.body; // "accept" or "reject"

//     const request = await Connection.findById(requestId)
//       .populate("requester", "_id")
//       .populate("recipient", "_id");

//     if (!request) {
//       return res.status(404).json({ message: "Request not found" });
//     }

//     if (!request.recipient._id.equals(req.user._id)) {
//       return res.status(403).json({ message: "Not authorized to respond to this request" });
//     }

//     if (action === "accept") {
//       request.status = "accepted";
//       await request.save();

//       // Update connection count for both users
//       await Profile.findOneAndUpdate(
//         { userId: request.recipient._id },
//         { $inc: { "stats.connections": 1 } }
//       );

//       await Profile.findOneAndUpdate(
//         { userId: request.requester._id },
//         { $inc: { "stats.connections": 1 } }
//       );

//       return res.json({ 
//         message: "Request accepted", 
//         request,
//         updated: true 
//       });
//     } 
//     else if (action === "reject") {
//       await Connection.deleteOne({ _id: requestId });
//       return res.json({ message: "Request rejected" });
//     } 
//     else {
//       return res.status(400).json({ message: "Invalid action" });
//     }
//   } catch (error) {
//     console.error("Error responding to request:", error);
//     res.status(500).json({ 
//       message: "Error responding to request",
//       error: error.message 
//     });
//   }
// };

// // Search users (excluding already connected or pending)
// exports.searchUsers = async (req, res) => {
//   try {
//     const query = req.query.query;
//     const userId = req.user._id;

//     if (!query) {
//       return res.status(400).json({ message: "Search query required" });
//     }

//     // Get all connections (both pending and accepted)
//     const allConnections = await Connection.find({
//       $or: [{ requester: userId }, { recipient: userId }]
//     });

//     const connectedUserIds = allConnections.map(conn => 
//       conn.requester.equals(userId) ? conn.recipient : conn.requester
//     );

//     const users = await User.find({
//       $and: [
//         {
//           $or: [
//             { name: { $regex: query, $options: "i" } },
//             { email: { $regex: query, $options: "i" } },
//           ],
//         },
//         { _id: { $ne: userId, $nin: connectedUserIds } },
//       ],
//     }).select("name email role profilePhotoUrl department batch");

//     res.json({ users });
//   } catch (error) {
//     console.error("Error searching users:", error);
//     res.status(500).json({ message: "Error searching users" });
//   }
// };

// // Get all connections (mutual/accepted)
// exports.getConnections = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;

//     const connections = await Connection.find({
//       $or: [
//         { requester: userId, status: "accepted" },
//         { recipient: userId, status: "accepted" },
//       ],
//     })
//       .populate("requester", "name email role profilePhotoUrl")
//       .populate("recipient", "name email role profilePhotoUrl");

//     // Format to show the other user in each connection
//     const formattedConnections = connections.map(conn => {
//       return conn.requester._id.equals(userId) 
//         ? { ...conn.recipient._doc, connectionId: conn._id } 
//         : { ...conn.requester._doc, connectionId: conn._id };
//     });

//     res.json({ connections: formattedConnections });
//   } catch (error) {
//     console.error("Error fetching connections:", error);
//     res.status(500).json({ message: "Error fetching connections" });
//   }
// };

// // Remove connection
// exports.removeConnection = async (req, res) => {
//   try {
//     const connectionId = req.params.connectionId;
//     const userId = req.user._id;

//     const connection = await Connection.findOne({
//       _id: connectionId,
//       status: "accepted",
//       $or: [
//         { requester: userId },
//         { recipient: userId }
//       ]
//     });

//     if (!connection) {
//       return res.status(404).json({ message: "Connection not found" });
//     }

//     // Get both users involved
//     const otherUserId = connection.requester.equals(userId) 
//       ? connection.recipient 
//       : connection.requester;

//     // Delete the connection
//     await Connection.deleteOne({ _id: connectionId });

//     // Decrement connection count for both users
//     await Profile.findOneAndUpdate(
//       { userId: userId },
//       { $inc: { "stats.connections": -1 } }
//     );

//     await Profile.findOneAndUpdate(
//       { userId: otherUserId },
//       { $inc: { "stats.connections": -1 } }
//     );

//     res.json({ message: "Connection removed successfully" });
//   } catch (error) {
//     console.error("Error removing connection:", error);
//     res.status(500).json({ message: "Error removing connection" });
//   }
// };