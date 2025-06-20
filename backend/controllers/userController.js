const User = require("../models/User");
const Connection = require("../models/Connection");
const { Profile } = require("../models/Profile");

// Get connection requests
exports.getConnectionRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: "pending",
    }).populate("requester", "name email role profilePhotoUrl");

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Error fetching connection requests" });
  }
};

// Get suggested users
exports.getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
    });

    const connectedUserIds = connections.map((conn) =>
      conn.requester.equals(userId) ? conn.recipient : conn.requester
    );

    const suggestedUsers = await User.find({
      _id: { $ne: userId, $nin: connectedUserIds },
    })
      .select("name email role profilePhotoUrl department batch")
      .limit(10);

    res.json({ users: suggestedUsers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching suggested users" });
  }
};

// Send follow request
exports.followUser = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const recipientId = req.params.userId;

    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const existing = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "Connection already exists or pending" });
    }

    const connection = new Connection({
      requester: requesterId,
      recipient: recipientId,
      status: "pending"
    });

    await connection.save();

    res.status(200).json({ success: true, message: "Follow request sent" });
  } catch (error) {
    console.error("❌ Error in followUser:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Respond to follow request (accept/reject)
exports.respondToFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const userId = req.user._id;

    const request = await Connection.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (!request.recipient.equals(userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (action === "accept") {
      request.status = "accepted";
      await request.save();

      console.log("✅ Accepting connection between:", userId, "and", request.requester);

      // Always increment both users' connection count
      const [res1, res2] = await Promise.all([
        Profile.findOneAndUpdate(
          { userId },
          { $inc: { "stats.connections": 1 } },
          { new: true, upsert: true }
        ),
        Profile.findOneAndUpdate(
          { userId: request.requester },
          { $inc: { "stats.connections": 1 } },
          { new: true, upsert: true }
        ),
      ]);

      console.log("🔁 Updated profiles:", res1?._id, res2?._id);

      return res.status(200).json({ success: true, message: "Connection accepted" });
    }

    if (action === "reject") {
      await Connection.findByIdAndDelete(requestId);
      return res.status(200).json({ success: true, message: "Request rejected" });
    }

    res.status(400).json({ success: false, message: "Invalid action" });

  } catch (error) {
    console.error("❌ Error responding to follow request:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Search users (excluding connected)
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.query;
    const userId = req.user._id;

    if (!query) return res.status(400).json({ message: "Search query required" });

    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    });

    const connectedUserIds = connections.map((conn) =>
      conn.requester.equals(userId) ? conn.recipient : conn.requester
    );

    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
        { _id: { $ne: userId, $nin: connectedUserIds } },
      ],
    }).select("name email role profilePhotoUrl department batch");

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Error searching users" });
  }
};

// Get followers and following
exports.getConnections = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const connections = await Connection.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    })
      .populate("requester", "name email role profilePhotoUrl")
      .populate("recipient", "name email role profilePhotoUrl");

    const followers = connections
      .filter((conn) => conn.recipient.equals(userId))
      .map((conn) => conn.requester);

    const following = connections
      .filter((conn) => conn.requester.equals(userId))
      .map((conn) => conn.recipient);

    res.json({ followers, following });
  } catch (error) {
    res.status(500).json({ message: "Error fetching connections" });
  }
};

// Check if connection exists
exports.checkConnectionStatus = async (req, res) => {
  try {
    const userId1 = req.user._id;
    const userId2 = req.params.userId;

    const connection = await Connection.findOne({
      $or: [
        { requester: userId1, recipient: userId2 },
        { requester: userId2, recipient: userId1 },
      ]
    });

    if (!connection) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      status: connection.status
    });
  } catch (error) {
    console.error("Error checking connection status:", error);
    res.status(500).json({ message: "Error checking connection status" });
  }
};
