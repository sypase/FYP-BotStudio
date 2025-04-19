import ApiKey from '../models/ApiKey.js';

export const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // Find the API key
    const key = await ApiKey.findOne({ key: apiKey });
    if (!key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if API key is active
    if (!key.isActive) {
      return res.status(403).json({ error: 'API key is inactive' });
    }

    // Attach the API key to the request
    req.apiKey = key;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate API key' });
  }
}; 