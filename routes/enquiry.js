const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// @route   POST /enquiries
// @desc    Create a new enquiry
// @access  Public (but requires artist ID)
router.post('/', async (req, res) => {
  try {
    const { artistId, firstName, lastName, email, message } = req.body;

    // Verify artist exists
    const artist = await User.findById(artistId);
    if (!artist || artist.userType !== 'artist') {
      return res.status(404).json({ msg: 'Artist not found' });
    }

    // Create new enquiry
    const newEnquiry = new Enquiry({
      artist: artistId,
      firstName,
      lastName,
      email,
      message
    });

    // If sender is logged in, associate with their account
    if (req.header('x-auth-token')) {
      try {
        const decoded = jwt.verify(req.header('x-auth-token'), process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user && user.userType === 'client') {
          newEnquiry.client = user.id;
        }
      } catch (err) {
        // If token verification fails, continue without associating client
      }
    }

    const enquiry = await newEnquiry.save();
    res.status(201).json(enquiry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /enquiries
// @desc    Get all enquiries for the logged in artist
// @access  Private (artists only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check if user is an artist
    if (req.user.userType !== 'artist') {
      return res.status(403).json({ msg: 'Only artists can view enquiries' });
    }

    const enquiries = await Enquiry.find({ artist: req.user.id })
      .sort({ dateSent: -1 });
    
    res.json(enquiries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /enquiries/:id
// @desc    Get enquiry by ID
// @access  Private (enquiry recipient only)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    
    if (!enquiry) {
      return res.status(404).json({ msg: 'Enquiry not found' });
    }
    
    // Check if user is the recipient of the enquiry
    if (enquiry.artist.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this enquiry' });
    }
    
    // Update status to 'read' if it's 'pending'
    if (enquiry.status === 'pending') {
      enquiry.status = 'read';
      await enquiry.save();
    }
    
    res.json(enquiry);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Enquiry not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /enquiries/:id/status
// @desc    Update enquiry status
// @access  Private (enquiry recipient only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['pending', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    
    const enquiry = await Enquiry.findById(req.params.id);
    
    if (!enquiry) {
      return res.status(404).json({ msg: 'Enquiry not found' });
    }
    
    // Check if user is the recipient of the enquiry
    if (enquiry.artist.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this enquiry' });
    }
    
    enquiry.status = status;
    await enquiry.save();
    
    res.json(enquiry);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Enquiry not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
