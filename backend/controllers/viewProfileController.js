const { Profile } = require("../models/Profile");
const auth = require("../middleware/authmiddleware");

// Get profile by user ID
const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId })
      .populate("userId", "name email")
      .lean();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Add profile photo URL
    profile.profilePhotoUrl = profile.profilePhoto 
      ? `/uploads/profile/${profile.profilePhoto}`
      : '/default-profile.jpg';

    // Add cover photo URL if needed
    profile.coverPhotoUrl = profile.coverPhoto 
      ? `/uploads/cover/${profile.coverPhoto}`
      : '/default-cover.jpg';

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProfile
};