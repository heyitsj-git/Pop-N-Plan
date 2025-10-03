const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  time: String,
  image: String
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
