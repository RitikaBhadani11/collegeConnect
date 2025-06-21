const { Profile, StudentProfile, FacultyProfile, AlumniProfile } = require("../models/Profile");
const User = require("../models/User");
const Connection = require("../models/Connection");
const fs = require("fs");
const path = require("path");

// Increment post count
exports.incrementPostCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $inc: { "stats.posts": 1 } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error incrementing post count:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Decrement post count
exports.decrementPostCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $inc: { "stats.posts": -1 } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error decrementing post count:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Try to get profile
    const profile = await Profile.findOne({ userId }).lean();

    // If profile doesn't exist, construct a fallback from user data
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const connectionCount = await Connection.countDocuments({
        $or: [
          { requester: userId, status: 'accepted' },
          { recipient: userId, status: 'accepted' }
        ]
      });

      return res.status(200).json({
        success: true,
        profile: {
          name: user.name,
          email: user.email,
          role: user.role,
          stats: {
            connections: connectionCount,
            posts: 0
          }
        }
      });
    }

    // Profile exists, count accepted connections
    const connectionCount = await Connection.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    // Build profilePhoto and coverPhoto URLs if present
    if (profile.profilePhoto)
      profile.profilePhotoUrl = `/uploads/profile/${path.basename(profile.profilePhoto)}`;
    if (profile.coverPhoto)
      profile.coverPhotoUrl = `/uploads/cover/${path.basename(profile.coverPhoto)}`;

    // Update stats with live connection count
    profile.stats = {
      ...profile.stats,
      connections: connectionCount
    };

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const profileData = {
      userId,
      name: req.body.name || user.name,
      email: req.body.email || user.email,
      role: user.role,
      about: req.body.about || "",
    };

    if (req.body.skills) {
      profileData.skills = Array.isArray(req.body.skills)
        ? req.body.skills
        : req.body.skills.split(",").map(skill => skill.trim());
    }

    const existingProfile = await Profile.findOne({ userId });

    // Handle file uploads
    if (req.files) {
      if (req.files.profilePhoto?.[0]) {
        const profilePhotoFile = req.files.profilePhoto[0];
        profileData.profilePhoto = profilePhotoFile.path.replace(/\\/g, "/").replace(/^public\//, "");
        if (existingProfile?.profilePhoto) {
          const oldPath = path.join(__dirname, "..", "public", existingProfile.profilePhoto);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } else if (existingProfile?.profilePhoto) {
        profileData.profilePhoto = existingProfile.profilePhoto;
      }

      if (req.files.coverPhoto?.[0]) {
        const coverPhotoFile = req.files.coverPhoto[0];
        profileData.coverPhoto = coverPhotoFile.path.replace(/\\/g, "/").replace(/^public\//, "");
        if (existingProfile?.coverPhoto) {
          const oldPath = path.join(__dirname, "..", "public", existingProfile.coverPhoto);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } else if (existingProfile?.coverPhoto) {
        profileData.coverPhoto = existingProfile.coverPhoto;
      }
    }

    // Add role-specific data
    let roleSpecificData = {};
    switch (user.role) {
      case "student":
        roleSpecificData = {
          branch: req.body.branch || "",
          yearOfStudy: req.body.yearOfStudy || "",
          resumeLink: req.body.resumeLink || "",
          batch: req.body.batch || "",
          regNumber: req.body.regNumber || "",
        };
        break;
      case "faculty":
        roleSpecificData = {
          department: req.body.department || "",
          designation: req.body.designation || "",
          researchInterests: Array.isArray(req.body.researchInterests)
            ? req.body.researchInterests
            : (req.body.researchInterests || "").split(",").map(s => s.trim()),
          facultyId: req.body.facultyId || "",
        };
        break;
      case "alumni":
        roleSpecificData = {
          currentJobTitle: req.body.currentJobTitle || "",
          company: req.body.company || "",
          graduationYear: req.body.graduationYear || "",
          linkedinProfile: req.body.linkedinProfile || "",
          passedOutBatch: req.body.passedOutBatch || "",
        };
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid user role" });
    }

    const updatedData = { ...profileData, ...roleSpecificData };

    // Use correct model based on role
    const ProfileModel = user.role === "student" ? StudentProfile :
                         user.role === "faculty" ? FacultyProfile :
                         AlumniProfile;

    let profile;
    if (existingProfile) {
      profile = await ProfileModel.findOneAndUpdate({ userId }, { $set: updatedData }, { new: true });
    } else {
      profile = await ProfileModel.create(updatedData);
    }

    const responseProfile = profile.toObject();
    if (profile.profilePhoto)
      responseProfile.profilePhotoUrl = `/uploads/profile/${path.basename(profile.profilePhoto)}`;
    if (profile.coverPhoto)
      responseProfile.coverPhotoUrl = `/uploads/cover/${path.basename(profile.coverPhoto)}`;

    res.status(200).json({ success: true, profile: responseProfile, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


// Get profile by post author ID
exports.getPostAuthorProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

    const profile = await Profile.findOne({ userId }).lean();
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      return res.status(200).json({
        success: true,
        profile: {
          name: user.name,
          email: user.email,
          role: user.role,
          stats: { followers: 0, following: 0, posts: 0 }
        }
      });
    }

    if (profile.profilePhoto) profile.profilePhotoUrl = `/uploads/profile/${path.basename(profile.profilePhoto)}`;
    if (profile.coverPhoto) profile.coverPhotoUrl = `/uploads/cover/${path.basename(profile.coverPhoto)}`;
    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching post author profile:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



// Get user's connections
exports.getUserConnections = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" }
      ]
    })
    .populate("requester", "name email role profilePhoto")
    .populate("recipient", "name email role profilePhoto");

    const formatted = connections.map(conn => {
      const isRequester = conn.requester._id.equals(userId);
      return {
        _id: conn._id,
        user: isRequester ? conn.recipient : conn.requester,
        status: conn.status,
        createdAt: conn.createdAt
      };
    });

    res.status(200).json({ success: true, connections: formatted });
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ success: false, message: "Error fetching connections", error: error.message });
  }
};

// Remove connection
exports.removeConnection = async (req, res) => {
  try {
    const connectionId = req.params.connectionId;
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    const { requester, recipient } = connection;

    // Delete the connection
    await Connection.findByIdAndDelete(connectionId);

    

    res.status(200).json({ message: "Connection removed and stats updated" });
  } catch (error) {
    console.error("Error removing connection:", error);
    res.status(500).json({ message: "Error removing connection" });
  }
};
