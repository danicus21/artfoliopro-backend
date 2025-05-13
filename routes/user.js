const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { uploadProfileImage, processProfileImage } = require('../utils/fileUpload');

// @route   GET /user/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const {
      displayName,
      location,
      bio,
      professionalTitle,
      website,
      socialLinks,
      categories
    } = req.body;

    // Build user profile object
    const userFields = {};
    if (displayName) userFields.displayName = displayName;
    if (location) userFields.location = location;
    if (bio) userFields.bio = bio;
    if (professionalTitle) userFields.professionalTitle = professionalTitle;
    if (website) userFields.website = website;
    if (socialLinks) userFields.socialLinks = socialLinks;
    if (categories) userFields.categories = categories;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /user/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image', [authMiddleware, uploadProfileImage, processProfileImage], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Update user's profile image in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: req.file.filename },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      profileImage: req.file.filename,
      user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /user/:id
// @desc    Get user by ID (for public profiles)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /user/artists
// @desc    Get all artists
// @access  Public
router.get('/artists/all', async (req, res) => {
  try {
    const artists = await User.find({ userType: 'artist' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(artists);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /user/save-artist/:id
// @desc    Save artist to user's saved list
// @access  Private
router.post('/save-artist/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const artistId = req.params.id;

    // Check if artist exists
    const artist = await User.findById(artistId);
    if (!artist || artist.userType !== 'artist') {
      return res.status(404).json({ msg: 'Artist not found' });
    }

    // Check if already saved
    if (user.savedArtists.includes(artistId)) {
      return res.status(400).json({ msg: 'Artist already saved' });
    }

    // Add to saved artists
    user.savedArtists.push(artistId);
    await user.save();

    res.json(user.savedArtists);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /user/save-artist/:id
// @desc    Remove artist from user's saved list
// @access  Private
router.delete('/save-artist/:id', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const artistId = req.params.id;
  
      // Remove from saved artists
      user.savedArtists = user.savedArtists.filter(
        id => id.toString() !== artistId
      );
      
      await user.save();
  
      res.json(user.savedArtists);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // @route   GET /user/saved-artists
  // @desc    Get user's saved artists
  // @access  Private
  router.get('/saved-artists', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('savedArtists', '-password');
      
      res.json(user.savedArtists);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  module.exports = router;

