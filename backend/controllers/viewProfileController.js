const { StudentProfile, FacultyProfile, AlumniProfile, Profile } = require("../models/Profile");
const User = require("../models/User");
const Connection = require("../models/Connection");
const path = require("path");

exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // First get the user document to access all user fields
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // Then try to get the base profile
    let profile = await Profile.findOne({ userId }).lean();
    
    if (!profile) {
      // If no profile exists, create a basic one from user data
      profile = {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        stats: { connections: 0, posts: 0 }
      };
    }

    // Get role-specific data
    let detailedProfile;
    switch (profile.role) {
      case "student":
        detailedProfile = await StudentProfile.findOne({ userId }).lean();
        // Include registration number from User model if not in profile
        if (!detailedProfile?.regNumber && user.regNumber) {
          detailedProfile = detailedProfile || {};
          detailedProfile.regNumber = user.regNumber;
        }
        break;
      case "faculty":
        detailedProfile = await FacultyProfile.findOne({ userId }).lean();
        // Include faculty ID from User model if not in profile
        if (!detailedProfile?.facultyId && user.facultyId) {
          detailedProfile = detailedProfile || {};
          detailedProfile.facultyId = user.facultyId;
        }
        break;
      case "alumni":
        detailedProfile = await AlumniProfile.findOne({ userId }).lean();
        break;
      default:
        detailedProfile = {};
    }

    // Count connections
    const connectionCount = await Connection.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    // Build photo URLs
    const profilePhotoUrl = profile.profilePhoto 
      ? `/uploads/profile/${path.basename(profile.profilePhoto)}` 
      : '/default-profile.jpg';
    const coverPhotoUrl = profile.coverPhoto 
      ? `/uploads/cover/${path.basename(profile.coverPhoto)}` 
      : '/default-cover.jpg';

    // Merge all data - user data takes precedence over profile data
    const fullProfile = {
      ...profile,
      ...detailedProfile,
      // Include important fields from User model
      regNumber: user.regNumber || detailedProfile?.regNumber,
      facultyId: user.facultyId || detailedProfile?.facultyId,
      department: user.department || detailedProfile?.department,
      batch: user.batch || detailedProfile?.batch,
      company: user.company || detailedProfile?.company,
      passedOutBatch: user.passedOutBatch || detailedProfile?.passedOutBatch,
      stats: {
        ...profile.stats,
        connections: connectionCount
      },
      profilePhotoUrl,
      coverPhotoUrl
    };

    res.status(200).json(fullProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};