const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const artistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Artist', artistSchema);