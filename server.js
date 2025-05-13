// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables once
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(__dirname, 'uploads/profiles');
const artworksDir = path.join(__dirname, 'uploads/artworks');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log('Created profiles directory');
}
if (!fs.existsSync(artworksDir)) {
  fs.mkdirSync(artworksDir, { recursive: true });
  console.log('Created artworks directory');
}

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://21130519:21130519@haircutscluster.55prz.mongodb.net/artfoliopro?retryWrites=true&w=majority&appName=HaircutsCluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.error('MongoDB connection error:', err));

// Basic routes for testing and health check
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ArtfolioPro API' });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Load and use routes with error handling
try {
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/user');
  const artworkRoutes = require('./routes/artwork');
  const categoryRoutes = require('./routes/category');
  const enquiryRoutes = require('./routes/enquiry');

  app.use('/auth', authRoutes);
  app.use('/user', userRoutes);
  app.use('/artworks', artworkRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/enquiries', enquiryRoutes);
  
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
  // The server will still run even if routes fail to load
}

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  // Don't crash the server
});