// server/routes/api.js
const express = require('express');
const router = express.Router();
const PaperService = require('../services/paperService');

// Add this test route to server/routes/api.js
router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

router.post('/search', async (req, res) => {
  console.log('Received search request:', req.body);
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const paperService = new PaperService();
    const results = await paperService.searchPapers(query);
    console.log(`Found ${results.length} results`);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;