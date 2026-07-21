const express = require('express');
const router = express.Router();
const { detectPlatform } = require('../utils/platformDetector');
const { generateFilename } = require('../utils/formatter');

// Import services
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
  threads: instagram, // Threads similar to Instagram
};

/**
 * GET /api/download?url=
 * Fetch content metadata
 */
router.get('/', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return res.status(400).json({ 
      success: false, 
      message: 'Unsupported platform' 
    });
  }

  try {
    const service = SERVICES[platform.key];
    if (!service) {
      return res.status(400).json({ success: false, message: 'Service unavailable' });
    }

    const data = await service.fetchMetadata(url);
    res.json(data);

  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch content' 
    });
  }
});

/**
 * POST /api/download/nowm
 * Fetch no-watermark version (TikTok/Instagram)
 */
router.post('/nowm', async (req, res) => {
  const { url, platform } = req.body;
  
  try {
    const service = SERVICES[platform];
    if (!service.fetchNoWatermark) {
      return res.status(400).json({ message: 'No watermark removal not supported' });
    }

    const data = await service.fetchNoWatermark(url);
    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/download/file?url=&platform=&format=
 * Proxy download (optional - for CORS bypass)
 */
router.get('/file', async (req, res) => {
  const { url, platform, format } = req.query;
  
  try {
    const service = SERVICES[platform];
    const data = await service.fetchMetadata(url);
    
    const formatData = data.formats?.find(f => f.type === format);
    if (!formatData?.url) {
      return res.status(404).json({ message: 'Format not found' });
    }

    // Stream the file
    const axios = require('axios');
    const response = await axios({
      method: 'GET',
      url: formatData.url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': url,
      },
      timeout: 30000,
    });

    const ext = format === 'mp3' ? 'mp3' : format === 'image' ? 'jpg' : 'mp4';
    const filename = generateFilename(data.title, platform, ext);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    
    response.data.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

module.exports = router;
