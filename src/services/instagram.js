/**
 * Instagram Service
 * Handles Instagram-specific download logic
 * Uses FREE API: Cobalt.tools - Works on Vercel
 */

const axios = require('axios');

const COBALT_API = 'https://api.cobalt.tools/';

/**
 * Fetch Instagram content metadata
 * @param {string} url - Instagram post/reel URL
 * @returns {Promise<Object>}
 */
async function fetchMetadata(url) {
  try {
    // Cobalt API - 100% gratis, no key, work di server
    const response = await axios.post(COBALT_API, 
      { 
        url: url,
        vCodec: 'h264', // biar kompatibel semua device
        aFormat: 'mp3'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 25000, // Vercel max 30s
        maxRedirects: 5
      }
    );

    const data = response.data;

    // Cobalt kadang return redirect dulu, kita follow
    if (data.status === 'redirect' && data.url) {
      const fileRes = await axios.get(data.url, { responseType: 'stream' });
      data.downloadUrl = data.url; // link langsung
    }

    return normalizeCobaltResponse(data, url);

  } catch (error) {
    console.error('Instagram fetch error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch Instagram content: ${error.response?.status || error.message}`);
  }
}

/**
 * Fetch no-watermark video
 * Cobalt otomatis no-watermark untuk TT & IG
 */
async function fetchNoWatermark(url) {
  try {
    const data = await fetchMetadata(url);
    
    // Cari format video terbaik
    const bestVideo = data.formats?.find(f => f.type.includes('mp4')) || data.formats?.[0];
    
    return {
      ...data,
      downloadUrl: bestVideo?.url || data.downloadUrl,
      isNoWatermark: true, // Cobalt default no wm
    };
    
  } catch (error) {
    throw new Error(`Failed to fetch no-watermark video: ${error.message}`);
  }
}

/**
 * Normalize Cobalt API response
 */
function normalizeCobaltResponse(apiData, originalUrl) {
  const isVideo = apiData.type === 'video';
  
  let formats = [];
  
  if (isVideo) {
    formats.push({
      type: 'mp4hd',
      quality: 'hd',
      url: apiData.url,
      label: 'Video MP4 HD No Watermark',
    });
    formats.push({
      type: 'mp3',
      quality: 'audio',
      url: apiData.url.replace('.mp4', '.mp3'), // cobalt bisa request audio terpisah
      label: 'Audio MP3',
    });
  } else {
    formats.push({
      type: 'image',
      quality: 'hd',
      url: apiData.url,
      label: 'Image HD',
    });
  }

  return {
    success: true,
    platform: 'instagram',
    url: originalUrl,
    title: apiData.filename || 'Instagram Post',
    author: '@unknown', // Cobalt gak kasih author, ambil dari scrape manual kalau mau
    authorAvatar: '',
    thumbnail: apiData.thumbnail || '',
    duration: apiData.duration || '',
    formats: formats,
    downloadUrl: apiData.url // link download langsung
  };
}

module.exports = {
  fetchMetadata,
  fetchNoWatermark,
};
