const express = require('express');
const router = express.Router();
const { detectPlatform } = require('../utils/platformDetector');
const { generateFilename } = require('../utils/formatter');

const instagram = require('../services/instagram');
const tiktok = require('../services/tiktok');
const youtube = require('../services/youtube');
const twitter = require('../services/twitter');
const facebook = require('../services/facebook');

const SERVICES = {
  instagram,
  tiktok,
  youtube,
  twitter,
  facebook,
  threads: instagram,
};

// GET /api/download?url=
router.get('/', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return res.status(400).json({ 
      success: false, 
      message: 'Unsupported platform. Supported: Instagram, TikTok, YouTube, Twitter/X, Facebook, Threads' 
    });
  }

  try {
    const service = SERVICES[platform.key];
    if (!service) {
      return res.status(400).json({ success: false, message: 'Service unavailable' });
    }

    const data = await service.fetchMetadata(url);
    
    // Tambahkan warning kalau demo mode
    if (data.isDemo) {
      data.warning = 'DEMO MODE: Add RAPIDAPI_KEY to .env for real downloads';
    }
    
    res.json(data);

  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch content' 
    });
  }
});

// POST /api/download/nowm
router.post('/nowm', async (req, res) => {
  const { url, platform } = req.body;
  
  try {
    const service = SERVICES[platform];
    if (!service?.fetchNoWatermark) {
      return res.status(400).json({ message: 'No watermark removal not supported' });
    }

    const data = await service.fetchNoWatermark(url);
    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
