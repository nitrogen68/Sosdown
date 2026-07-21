const axios = require('axios');

const API_ENDPOINTS = {
  RAPIDAPI: 'https://social-media-download.p.rapidapi.com/api/download',
};

/**
 * Fetch Instagram content
 */
async function fetchMetadata(url) {
  // Coba RapidAPI dulu
  if (process.env.RAPIDAPI_KEY) {
    try {
      const response = await axios.get(API_ENDPOINTS.RAPIDAPI, {
        params: { url },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'social-media-download.p.rapidapi.com',
        },
        timeout: 15000,
      });
      return normalizeRapidApiResponse(response.data, url);
    } catch (err) {
      console.log('RapidAPI failed, using demo mode:', err.message);
    }
  }

  // 🆓 DEMO MODE: Kalau tidak ada API key, kasih data demo
  // Supaya UI tetap jalan untuk testing
  console.log('⚠️ No API key found. Returning DEMO data for:', url);
  return getDemoData(url);
}

async function fetchNoWatermark(url) {
  const data = await fetchMetadata(url);
  const noWm = data.formats?.find(f => f.type === 'nowm');
  return {
    ...data,
    downloadUrl: noWm?.url || data.formats?.[0]?.url,
    isNoWatermark: !!noWm,
  };
}

function normalizeRapidApiResponse(apiData, originalUrl) {
  return {
    success: true,
    platform: 'instagram',
    url: originalUrl,
    title: apiData.title || apiData.desc || 'Instagram Post',
    author: apiData.author?.name || apiData.uploader || '@unknown',
    authorAvatar: apiData.author?.avatar || '',
    thumbnail: apiData.thumbnail || apiData.image,
    duration: apiData.duration || '',
    formats: [
      { type: 'mp4hd', quality: 'hd', url: apiData.video_hd, size: apiData.size_hd, label: 'Video MP4 HD' },
      { type: 'mp4sd', quality: 'sd', url: apiData.video_sd, size: apiData.size_sd, label: 'Video MP4 SD' },
      { type: 'image', quality: 'hd', url: apiData.image, size: apiData.size_image, label: 'Image HD' },
      { type: 'nowm', quality: 'hd_nowm', url: apiData.video_nowm, size: apiData.size_nowm, label: 'No Watermark' },
    ].filter(f => f.url),
  };
}

/**
 * 🎭 DEMO DATA — UI tetap bisa dicoba tanpa API key
 */
function getDemoData(url) {
  return {
    success: true,
    platform: 'instagram',
    url,
    title: '📸 Instagram Reel — Sunset at Bali Beach',
    author: '@travel_daily',
    authorAvatar: 'https://ui-avatars.com/api/?name=Travel&background=random',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&h=360&fit=crop',
    duration: '0:15',
    isDemo: true,
    formats: [
      { type: 'mp4hd', quality: 'hd', url: 'https://example.com/demo-hd.mp4', size: '~12 MB', label: 'Video MP4 HD' },
      { type: 'mp4sd', quality: 'sd', url: 'https://example.com/demo-sd.mp4', size: '~4 MB', label: 'Video MP4 SD' },
      { type: 'image', quality: 'hd', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080', size: '~1.5 MB', label: 'Image HD' },
      { type: 'nowm', quality: 'hd_nowm', url: 'https://example.com/demo-nowm.mp4', size: '~12 MB', label: 'No Watermark' },
    ],
  };
}

module.exports = { fetchMetadata, fetchNoWatermark };
