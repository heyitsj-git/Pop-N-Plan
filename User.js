// User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  college: { type: String, required: true },
  committee: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationExpires: { type: Number } // timestamp (Date.now() + ms)
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
