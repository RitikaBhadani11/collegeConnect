// 
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, unique: true }, // Add unique constraint here
  email: { type: String, unique: true },
  password: { type: String,  },
  role: { type: String, enum: ["student", "faculty", "alumni"],  },
  batch: { type: String, default: "" },
  regNumber: { type: String, default: "" },
  facultyId: { type: String, default: "" },
  department: { type: String, default: "" },
  company: { type: String, default: "" },
  passedOutBatch: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);