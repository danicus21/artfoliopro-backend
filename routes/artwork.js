const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { uploadArtworkImage, processArtworkImage } = require('../utils/fileUpload');

// @route   POST /artworks
// @desc    Create a new artwork
// @access  Private (artists only)
router.post('/', [authMiddleware, uploadArtworkImage, processArtworkImage], async (req, res) => {
  try {
    // Check if user is an artist
    if (req.user.userType !== 'artist') {
      return res.status(403).json({ msg: 'Only artists can create artworks' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'Artwork image is required' });
    }

    const { title, description, category, tags } = req.body;

    // Create new artwork
    const newArtwork = new Artwork({
      title,
      description,
      imageUrl: req.file.filename,
      thumbnailUrl: req.file.thumbnailPath,
      mediumUrl: req.file.mediumPath,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      artist: req.user.id
    });

    const artwork = await newArtwork.save();

    res.status(201).json(artwork);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /artworks
// @desc    Get all artworks
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, artist, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (category) query.category = category;
    if (artist) query.artist = artist;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get artworks
    const artworks = await Artwork.find(query)
      .populate('artist', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count
    const total = await Artwork.countDocuments(query);
    
    res.json({
      artworks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /artworks/:id
// @desc    Get artwork by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'displayName profileImage location bio professionalTitle website');
    
    if (!artwork) {
      return res.status(404).json({ msg: 'Artwork not found' });
    }
    
    res.json(artwork);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Artwork not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /artworks/:id
// @desc    Update artwork
// @access  Private (artwork owner only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    
    // Get artwork
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ msg: 'Artwork not found' });
    }
    
    // Check if user is the artwork owner
    if (artwork.artist.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this artwork' });
    }
    
    // Update fields
    if (title) artwork.title = title;
    if (description) artwork.description = description;
    if (category) artwork.category = category;
    if (tags) artwork.tags = tags.split(',').map(tag => tag.trim());
    
    await artwork.save();
    
    res.json(artwork);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Artwork not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /artworks/:id
// @desc    Delete artwork
// @access  Private (artwork owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ msg: 'Artwork not found' });
    }
    
    // Check if user is the artwork owner
    if (artwork.artist.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this artwork' });
    }
    
    await artwork.remove();
    
    res.json({ msg: 'Artwork removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Artwork not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /artworks/artist/:userId
// @desc    Get artworks by artist
// @access  Public
router.get('/artist/:userId', async (req, res) => {
  try {
    const artworks = await Artwork.find({ artist: req.params.userId })
      .sort({ createdAt: -1 });
    
    res.json(artworks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
