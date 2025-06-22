const path = require("path");
const User = require("../models/User");
const Connection = require("../models/Connection");
const { Profile } = require("../models/Profile");

// Get connection requests
exports.getConnectionRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: "pending",
    }).populate({
      path: "requester",
      select: "name email role",
    });

    const formattedRequests = await Promise.all(
      requests.map(async (request) => {
        const profileDoc = await Profile.findOne({ userId: request.requester._id });
const profile = profileDoc ? profileDoc.toObject() : null;

const profilePhotoUrl = profile?.profilePhoto
  ? `/uploads/profile/${path.basename(profile.profilePhoto)}`
  : "/default-profile.jpg";


        return {
          _id: request._id,
          requester: {
            _id: request.requester._id,
            name: request.requester.name,
            email: request.requester.email,
            role: request.requester.role,
            profilePhotoUrl,
          },
        };
      })
    );

    res.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Error in getConnectionRequests:", error);
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
    }).select("_id name email role");

    const usersWithProfilePhotos = await Promise.all(
      suggestedUsers.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id });
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhotoUrl: profile?.profilePhoto
            ? `/uploads/profile/${path.basename(profile.profilePhoto)}`
            : "/default-profile.jpg",
        };
      })
    );

    res.json({ users: usersWithProfilePhotos });
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
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Connection already exists or pending" });
    }

    const connection = new Connection({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    await connection.save();

    res.status(200).json({ success: true, message: "Follow request sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Respond to follow request (accept/reject)
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

      await Promise.all([
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

      return res.status(200).json({ success: true, message: "Connection accepted" });
    }

    if (action === "reject") {
      await Connection.findByIdAndDelete(requestId);
      return res.status(200).json({ success: true, message: "Request rejected" });
    }

    res.status(400).json({ success: false, message: "Invalid action" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
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
    }).select("_id name email role");

    const usersWithProfilePhotos = await Promise.all(
      users.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id });
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhotoUrl: profile?.profilePhoto
            ? `/uploads/profile/${path.basename(profile.profilePhoto)}`
            : "/default-profile.jpg",
        };
      })
    );

    res.json({ users: usersWithProfilePhotos });
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
    });

    const followers = [];
    const following = [];

    for (const conn of connections) {
      const profileUserId = conn.requester.equals(userId) ? conn.recipient : conn.requester;
      const profile = await Profile.findOne({ userId: profileUserId });
      const formattedUser = {
        _id: profileUserId,
        profilePhotoUrl: profile?.profilePhoto
          ? `/uploads/profile/${path.basename(profile.profilePhoto)}`
          : "/default-profile.jpg",
      };

      if (conn.recipient.equals(userId)) {
        followers.push(formattedUser);
      } else {
        following.push(formattedUser);
      }
    }

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
      ],
    });

    if (!connection) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      status: connection.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking connection status" });
  }
};
