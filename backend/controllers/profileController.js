const { Profile, StudentProfile, FacultyProfile, AlumniProfile } = require("../models/Profile");
const User = require("../models/User");
const Connection = require("../models/Connection");
const fs = require("fs");
const path = require("path");
const getProfilePhotoUrl = (profile) => {
  if (!profile?.profilePhoto) return '/default-profile.jpg';
  return `/uploads/profile/${path.basename(profile.profilePhoto)}`;
};

// Helper function to get cover photo URL
const getCoverPhotoUrl = (profile) => {
  if (!profile?.coverPhoto) return '/default-cover.jpg';
  return `/uploads/cover/${path.basename(profile.coverPhoto)}`;
};

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
    const userId = req.user._id; // Always use authenticated user's ID

    // Get user first to verify existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Try to get profile
    let profile = await Profile.findOne({ userId }).lean();

    // Count connections
    const connectionCount = await Connection.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    // If no profile exists, create a basic response
    if (!profile) {
      return res.status(200).json({
        success: true,
        profile: {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          stats: {
            connections: connectionCount,
            posts: 0
          },
          profilePhotoUrl: getProfilePhotoUrl(null),
          coverPhotoUrl: getCoverPhotoUrl(null)
        }
      });
    }

    // Return complete profile
    res.status(200).json({
      success: true,
      profile: {
        ...profile,
        stats: {
          ...profile.stats,
          connections: connectionCount
        },
        profilePhotoUrl: getProfilePhotoUrl(profile),
        coverPhotoUrl: getCoverPhotoUrl(profile)
      }
    });
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

    // Build response with photo URLs
    const responseProfile = profile.toObject();
    responseProfile.profilePhotoUrl = profile.profilePhoto 
      ? `/uploads/profile/${path.basename(profile.profilePhoto)}` 
      : '/default-profile.jpg';
    responseProfile.coverPhotoUrl = profile.coverPhoto 
      ? `/uploads/cover/${path.basename(profile.coverPhoto)}` 
      : '/default-cover.jpg';

    res.status(200).json({ 
      success: true, 
      profile: responseProfile, 
      message: "Profile updated successfully" 
    });
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
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          stats: { connections: 0, posts: 0 },
          profilePhotoUrl: '/default-profile.jpg',
          coverPhotoUrl: '/default-cover.jpg'
        }
      });
    }

    // Build photo URLs
    const profilePhotoUrl = profile.profilePhoto 
      ? `/uploads/profile/${path.basename(profile.profilePhoto)}` 
      : '/default-profile.jpg';
    const coverPhotoUrl = profile.coverPhoto 
      ? `/uploads/cover/${path.basename(profile.coverPhoto)}` 
      : '/default-cover.jpg';

    res.status(200).json({ 
      success: true, 
      profile: {
        ...profile,
        profilePhotoUrl,
        coverPhotoUrl
      } 
    });
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
    .populate({
      path: "requester",
      select: "name email role"
    })
    .populate({
      path: "recipient",
      select: "name email role"
    });

    const formatted = await Promise.all(connections.map(async conn => {
      const isRequester = conn.requester._id.equals(userId);
      const otherUser = isRequester ? conn.recipient : conn.requester;

      // Fetch profile of the other user
      const profile = await Profile.findOne({ userId: otherUser._id }).lean();

      const profilePhotoUrl = profile?.profilePhoto
        ? `/uploads/profile/${path.basename(profile.profilePhoto)}`
        : '/default-profile.jpg';

      return {
        _id: conn._id,
        user: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          profilePhotoUrl
        },
        status: conn.status,
        createdAt: conn.createdAt
      };
    }));

    res.status(200).json({ success: true, connections: formatted });
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching connections",
      error: error.message
    });
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

    res.status(200).json({ message: "Connection removed successfully" });
  } catch (error) {
    console.error("Error removing connection:", error);
    res.status(500).json({ message: "Error removing connection" });
  }
};