const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const enquirySchema = new Schema({
  artist: {
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Enquiry', enquirySchema);