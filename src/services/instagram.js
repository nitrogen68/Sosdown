/**
 * Instagram Service
 * Handles Instagram-specific download logic
 * Uses free APIs: SnapSave, RapidAPI, or scraping fallback
 */

const axios = require('axios');

const API_ENDPOINTS = {
  // Free API options (use one or rotate)
  RAPIDAPI: 'https://social-media-download.p.rapidapi.com/api/download',
  SNAPSAVE: 'https://snapsave.app/action.php',
  SAVEINSTA: 'https://saveinsta.app/api/ajaxSearch',
};

/**
 * Fetch Instagram content metadata
 * @param {string} url - Instagram post/reel URL
 * @returns {Promise<Object>}
 */
async function fetchMetadata(url) {
  try {
    // Try RapidAPI first
    if (process.env.RAPIDAPI_KEY) {
      const response = await axios.get(API_ENDPOINTS.RAPIDAPI, {
        params: { url },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
        },
        timeout: 15000,
      });

      return normalizeRapidApiResponse(response.data, url);
    }

    // Fallback: SnapSave (free, no key required)
    return await fetchFromSnapSave(url);

  } catch (error) {
    console.error('Instagram fetch error:', error.message);
    throw new Error('Failed to fetch Instagram content');
  }
}

/**
 * Fetch no-watermark video
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchNoWatermark(url) {
  try {
    const data = await fetchMetadata(url);
    
    // Filter for highest quality no-watermark video
    const noWmVideo = data.formats?.find(f => 
      f.type === 'mp4' && (f.quality?.includes('nowm') || f.label?.includes('no watermark'))
    );
    
    if (noWmVideo) {
      return {
        ...data,
        downloadUrl: noWmVideo.url,
        isNoWatermark: true,
      };
    }
    
    // If no explicit no-watermark, return best quality
    const bestVideo = data.formats?.find(f => f.type === 'mp4' && f.quality === 'hd');
    return {
      ...data,
      downloadUrl: bestVideo?.url || data.formats?.[0]?.url,
      isNoWatermark: false,
    };
    
  } catch (error) {
    throw new Error('Failed to fetch no-watermark video');
  }
}

/**
 * Normalize RapidAPI response
 */
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
      {
        type: 'mp4hd',
        quality: 'hd',
        url: apiData.video_hd || apiData.video,
        size: apiData.size_hd || apiData.size,
        label: 'Video MP4 HD',
      },
      {
        type: 'mp4sd',
        quality: 'sd',
        url: apiData.video_sd || apiData.video,
        size: apiData.size_sd,
        label: 'Video MP4 SD',
      },
      {
        type: 'image',
        quality: 'hd',
        url: apiData.image || apiData.thumbnail,
        size: apiData.size_image,
        label: 'Image HD',
      },
      {
        type: 'nowm',
        quality: 'hd_nowm',
        url: apiData.video_nowm || apiData.video_hd,
        size: apiData.size_nowm,
        label: 'No Watermark',
      },
    ].filter(f => f.url),
  };
}

/**
 * Fetch from SnapSave (free alternative)
 */
async function fetchFromSnapSave(url) {
  try {
    const formData = new URLSearchParams();
    formData.append('url', url);
    
    const response = await axios.post(API_ENDPOINTS.SNAPSAVE, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 20000,
    });

    // SnapSave returns HTML or JSON depending on endpoint
    // This is a simplified parser - adjust based on actual response
    const data = response.data;
    
    return {
      success: true,
      platform: 'instagram',
      url,
      title: data.title || 'Instagram Post',
      author: data.author || '@unknown',
      thumbnail: data.thumbnail,
      duration: '',
      formats: [
        { type: 'mp4hd', quality: 'hd', url: data.video_url, label: 'Video MP4 HD' },
        { type: 'image', quality: 'hd', url: data.image_url, label: 'Image HD' },
      ].filter(f => f.url),
    };
    
  } catch (error) {
    throw new Error('SnapSave fetch failed');
  }
}

module.exports = {
  fetchMetadata,
  fetchNoWatermark,
};
