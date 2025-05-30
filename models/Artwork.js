const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Artwork Schema
const artworkSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  image: {
    type: String,  // This will store the image filename
    required: [true, 'Artwork image is required']
  },
  artist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create Model
const Artwork = mongoose.model('Artwork', artworkSchema);

// Export
module.exports = Artwork;