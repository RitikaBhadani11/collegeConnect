const { StudentProfile, FacultyProfile, AlumniProfile, Profile } = require("../models/Profile");
const User = require("../models/User");

// Get profile by user ID
const getProfile = async (req, res) => {
  try {
    const baseProfile = await Profile.findOne({ userId: req.params.userId }).lean();
    if (!baseProfile) return res.status(404).json({ message: "Profile not found" });

    let detailedProfile;

    switch (baseProfile.role) {
      case "student":
        detailedProfile = await StudentProfile.findOne({ userId: req.params.userId })
          .populate("userId") // Populate full user object
          .lean();
        break;
      case "faculty":
        detailedProfile = await FacultyProfile.findOne({ userId: req.params.userId })
          .populate("userId")
          .lean();
        break;
      case "alumni":
        detailedProfile = await AlumniProfile.findOne({ userId: req.params.userId })
          .populate("userId")
          .lean();
        break;
      default:
        detailedProfile = baseProfile;
    }

    if (!detailedProfile) return res.status(404).json({ message: "Detailed profile not found" });

    // Merge base and detailed profiles
    const fullProfile = {
      ...baseProfile,
      ...detailedProfile,
      profilePhotoUrl: detailedProfile.profilePhoto
        ? `/uploads/profile/${detailedProfile.profilePhoto}`
        : "/default-profile.jpg",
      coverPhotoUrl: detailedProfile.coverPhoto
        ? `/uploads/cover/${detailedProfile.coverPhoto}`
        : "/default-cover.jpg",
    };

    // Fallback: use fields from User model if not present in profile
    const user = detailedProfile.userId || (await User.findById(req.params.userId).lean());

    if (user) {
      fullProfile.name = fullProfile.name || user.name;
      fullProfile.email = fullProfile.email || user.email;
      fullProfile.batch = fullProfile.batch || user.batch;
      fullProfile.regNumber = fullProfile.regNumber || user.regNumber;
      fullProfile.facultyId = fullProfile.facultyId || user.facultyId;
      fullProfile.department = fullProfile.department || user.department;
      fullProfile.company = fullProfile.company || user.company;
      fullProfile.passedOutBatch = fullProfile.passedOutBatch || user.passedOutBatch;
    }

    return res.status(200).json(fullProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProfile,
};
