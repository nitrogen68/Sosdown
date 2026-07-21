const express = require('express');
const router = express.Router();
const { detectPlatform } = require('../utils/platformDetector');

// Asumsi formatter tidak dipakai di route ini, atau bisa di-import jika dipakai nanti
// const { generateFilename } = require('../utils/formatter');

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
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'URL is required and must be a string' });
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
      return res.status(400).json({ success: false, message: 'Service unavailable for this platform' });
    }

    const data = await service.fetchMetadata(url);
    
    // Tambahkan warning kalau demo mode
    if (data.isDemo) {
      data.warning = 'DEMO MODE: Add RAPIDAPI_KEY to .env for real downloads';
    }
    
    return res.status(200).json(data);

  } catch (error) {
    console.error(`Fetch error for ${url}:`, error.message);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch content' 
    });
  }
});

// POST /api/download/nowm
router.post('/nowm', async (req, res) => {
  const { url, platform } = req.body;
  
  // Validasi input untuk mencegah crash
  if (!url || !platform) {
    return res.status(400).json({ 
      success: false, 
      message: 'URL and platform are required in the request body' 
    });
  }

  try {
    const service = SERVICES[platform.toLowerCase()];
    if (!service || !service.fetchNoWatermark) {
      return res.status(400).json({ 
        success: false, 
        message: 'No-watermark removal is not supported for this platform' 
      });
    }

    const data = await service.fetchNoWatermark(url);
    return res.status(200).json(data);

  } catch (error) {
    console.error(`NoWM fetch error for ${url}:`, error.message);
    return res.status(500).json({ 
      success: false, // Menambahkan success: false agar seragam dengan GET
      message: error.message || 'Failed to fetch no-watermark content'
    });
  }
});

module.exports = router;
