// routes/beehiiv.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Environment variables
const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY;

// Middleware to check if API key is set
const checkApiKey = (req, res, next) => {
  if (!BEEHIIV_API_KEY) {
    return res.status(500).json({ error: 'Beehiiv API key not set in environment variables' });
  }
  next();
};

// Get all posts for a publication
router.get('/publications/:publicationId/posts', checkApiKey, async (req, res) => {
  try {
    const { publicationId } = req.params;
    
    const response = await axios.get(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts`,
      {
        headers: {
          'Authorization': `Bearer ${BEEHIIV_API_KEY}`
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching posts:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to fetch posts from Beehiiv API'
    });
  }
});

// Get a specific post
router.get('/publications/:publicationId/posts/:postId', checkApiKey, async (req, res) => {
  try {
    const { publicationId, postId } = req.params;
    const { expand } = req.query;
    
    let url = `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${postId}`;
    
    // Add expand parameters if provided
    if (expand) {
      url += `?expand=${expand}`;
    }
    
    const response = await axios.get(
      url,
      {
        headers: {
          'Authorization': `Bearer ${BEEHIIV_API_KEY}`
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching post:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to fetch post from Beehiiv API'
    });
  }
});

module.exports = router;