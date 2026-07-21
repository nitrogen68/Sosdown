
/**
 * Serverless API Route for Vercel/Netlify
 * Path: /api/download
 */

const { detectPlatform } = require('../src/utils/platformDetector');
const instagram = require('../src/services/instagram');
const tiktok = require('../src/services/tiktok');
const youtube = require('../src/services/youtube');
const twitter = require('../src/services/twitter');
const facebook = require('../src/services/facebook');

const SERVICES = {
  instagram,
  tiktok,
  youtube,
  twitter,
  facebook,
  threads: instagram, // Threads uses similar logic to Instagram
};

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/download?url=...
    if (req.method === 'GET') {
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

      const service = SERVICES[platform.key];
      if (!service) {
        return res.status(400).json({ success: false, message: 'Service not available for this platform' });
      }

      const data = await service.fetchMetadata(url);
      return res.status(200).json(data);
    }

    // POST /api/download - Proxy download
    if (req.method === 'POST') {
      const { url, platform, format } = req.body;
      
      // In serverless, you'd typically return a redirect or presigned URL
      // For now, return the direct download URL from metadata
      
      const service = SERVICES[platform];
      const data = await service.fetchMetadata(url);
      
      const formatData = data.formats?.find(f => f.type === format);
      if (!formatData?.url) {
        return res.status(404).json({ success: false, message: 'Format not available' });
      }

      return res.status(200).json({
        success: true,
        downloadUrl: formatData.url,
        filename: `${platform}_${Date.now()}.${format === 'mp3' ? 'mp3' : 'mp4'}`,
      });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
};
