const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
