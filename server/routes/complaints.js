const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const upload = require('../middleware/upload');

// Get all complaints
// Add to existing routes file

// Inside the GET / route, update it to support pagination and sorting
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10, sort = 'createdAt' } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort order
    let sortOrder = {};
    if (sort === 'priority') {
      // Custom sort order for priorities
      sortOrder = { 
        priority: -1,  // Sort by priority (high to low)
        createdAt: -1  // Then by date
      };
    } else if (sort === 'likes') {
      sortOrder = { likes: -1, createdAt: -1 };
    } else {
      // Default sort by creation date, newest first
      sortOrder = { createdAt: -1 };
    }

    const complaints = await Complaint.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(parseInt(limit));

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add likes functionality
router.post('/:id/like', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Increment likes count
    complaint.likes = (complaint.likes || 0) + 1;
    await complaint.save();

    res.json({ 
      success: true, 
      likes: complaint.likes 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get complaint statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await Complaint.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single complaint
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new complaint
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      latitude,
      longitude,
      address,
      priority
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, type, latitude, longitude' 
      });
    }

    const complaintData = {
      title,
      description,
      type,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || ''
      },
      priority: priority || 'medium'
    };

    // Add image path if uploaded
    if (req.file) {
      complaintData.image = req.file.filename;
    }

    const complaint = new Complaint(complaintData);
    await complaint.save();

    res.status(201).json(complaint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update complaint
router.put('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const allowedUpdates = ['status', 'priority', 'assignedTo', 'description'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = Date.now();

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(updatedComplaint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete complaint
router.delete('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Delete associated image file if exists
    if (complaint.image) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../uploads', complaint.image);
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update complaints status
router.put('/bulk/status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await Complaint.updateMany(
      { _id: { $in: ids } },
      { status, updatedAt: Date.now() }
    );

    res.json({ 
      message: `Updated ${result.modifiedCount} complaints`,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;