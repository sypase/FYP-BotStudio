import express from 'express';
import ApiKey from '../models/ApiKey.js';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Generate a new API key
router.post('/generate', validate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const key = ApiKey.generateKey();
    const apiKey = new ApiKey({
      user: req.user._id,
      key,
      name
    });

    await apiKey.save();
    res.status(201).json({ 
      _id: apiKey._id,
      name: apiKey.name,
      key: apiKey.key,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Get all API keys for the user
router.get('/', validate, async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(apiKeys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Toggle API key active status
router.patch('/:id/toggle', validate, async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    apiKey.isActive = !apiKey.isActive;
    await apiKey.save();

    res.json({ 
      message: 'API key status updated successfully',
      isActive: apiKey.isActive 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update API key status' });
  }
});

// Delete an API key
router.delete('/:id', validate, async (req, res) => {
  try {
    const apiKey = await ApiKey.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router; 