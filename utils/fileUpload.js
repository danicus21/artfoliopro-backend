const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Set up storage for profile images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Set up storage for artwork images
const artworkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/artworks');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `artwork-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Filter for image files
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer upload for profile images
const uploadProfileImage = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: imageFileFilter
}).single('profileImage');

// Multer upload for artwork images
const uploadArtworkImage = multer({
  storage: artworkStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: imageFileFilter
}).single('artworkImage');

// Process and resize profile image
const processProfileImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    await sharp(req.file.path)
      .resize(300, 300)
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, '../uploads/profiles', `thumb-${req.file.filename}`));
    
    // Update filename to use the processed image
    req.file.filename = `thumb-${req.file.filename}`;
    next();
  } catch (error) {
    next(error);
  }
};

// Process and resize artwork image
const processArtworkImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    // Create a thumbnail for artwork listing
    await sharp(req.file.path)
      .resize(400, 400, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toFile(path.join(__dirname, '../uploads/artworks', `thumb-${req.file.filename}`));
    
    // Create a medium-sized image for artwork detail view
    await sharp(req.file.path)
      .resize(1200, 1200, { fit: 'inside' })
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, '../uploads/artworks', `medium-${req.file.filename}`));
    
    // Add both versions to the request
    req.file.thumbnailPath = `thumb-${req.file.filename}`;
    req.file.mediumPath = `medium-${req.file.filename}`;
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProfileImage,
  uploadArtworkImage,
  processProfileImage,
  processArtworkImage
};

