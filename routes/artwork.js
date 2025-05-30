const express = require('express')
const router = express.Router()
const Utils = require('./../utils')
const Artwork = require('./../models/Artwork')
const path = require('path')

// GET - get all artworks -----------------------------
router.get('/', (req, res) => {
  Artwork.find()
    .populate('artist', 'firstName lastName')
    .sort({createdAt: -1})
    .then(artworks => {
      res.json(artworks)
    })
    .catch(err => {
      res.status(500).json({
        message: "Problem getting artworks",
        error: err
      })
    })
})

// POST - create artwork -----------------------------
router.post('/', Utils.authenticateToken, (req, res) => {
  // validate
  if(!req.body.title || !req.body.category){
    return res.status(400).json({message: "Title and category required"})
  }

  // upload artwork image
  if(!req.files || !req.files.image){
    return res.status(400).json({message: "Artwork image required"})
  }

  let uploadPath = path.join(__dirname, '..', 'public', 'images')
  Utils.uploadFile(req.files.image, uploadPath, (uniqueFilename) => {
    // create artwork
    let newArtwork = new Artwork({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      image: uniqueFilename,
      artist: req.user._id
    })

    newArtwork.save()
      .then(artwork => {
        res.status(201).json(artwork)
      })
      .catch(err => {
        res.status(500).json({
          message: "Problem creating artwork",
          error: err
        })
      })
  })
})

module.exports = router
