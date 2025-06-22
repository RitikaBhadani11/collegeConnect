const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const path = require("path");

const ProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty", "alumni"], required: true },
  profilePhoto: { type: String, default: "" },
  coverPhoto: { type: String, default: "" },
  about: { type: String, default: "" },
  skills: { type: [String], default: [] },
  stats: {
    connections: { type: Number, default: 0 },
    posts: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  discriminatorKey: 'roleType',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for image URLs
ProfileSchema.virtual('profilePhotoUrl').get(function() {
  if (!this.profilePhoto) return '/default-profile.jpg';
  return `/uploads/profile/${path.basename(this.profilePhoto)}`;
});

ProfileSchema.virtual('coverPhotoUrl').get(function() {
  if (!this.coverPhoto) return '/default-cover.jpg';
  return `/uploads/cover/${path.basename(this.coverPhoto)}`;
});

const Profile = mongoose.model("Profile", ProfileSchema);

// Student Profile
const StudentProfile = Profile.discriminator("student", new Schema({
  branch: { type: String, default: "" },
  yearOfStudy: { type: String, default: "" },
  resumeLink: { type: String, default: "" },
  batch: { type: String, default: "" },
  regNumber: { type: String, default: "" }
}));

// Faculty Profile
const FacultyProfile = Profile.discriminator("faculty", new Schema({
  department: { type: String, default: "" },
  designation: { type: String, default: "" },
  researchInterests: { type: [String], default: [] },
  facultyId: { type: String, default: "" }
}));

// Alumni Profile
const AlumniProfile = Profile.discriminator("alumni", new Schema({
  currentJobTitle: { type: String, default: "" },
  company: { type: String, default: "" },
  graduationYear: { type: String, default: "" },
  linkedinProfile: { type: String, default: "" },
  passedOutBatch: { type: String, default: "" }
}));

module.exports = { Profile, StudentProfile, FacultyProfile, AlumniProfile };