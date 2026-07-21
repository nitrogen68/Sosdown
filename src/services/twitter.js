
/**
 * Twitter/X Service
 * Handles Twitter/X video and image downloads
 */

const axios = require('axios');

const API_ENDPOINTS = {
  RAPIDAPI: 'https://twitter-downloader-download-twitter-videos-gifs-and-images.p.rapidapi.com/status',
  TWITSAVE: 'https://twitsave.com/info',
};

/**
 * Fetch Twitter metadata
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchMetadata(url) {
  try {
    const tweetId = extractTweetId(url);
    if (!tweetId) throw new Error('Invalid Twitter URL');

    // RapidAPI
    if (process.env.RAPIDAPI_KEY) {
      const response = await axios.get(API_ENDPOINTS.RAPIDAPI, {
        params: { url },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'twitter-downloader-download-twitter-videos-gifs-and-images.p.rapidapi.com',
        },
        timeout: 15000,
      });
      return normalizeResponse(response.data, url, tweetId);
    }

    // Fallback
    return await fetchFromTwitSave(url, tweetId);

  } catch (error) {
    console.error('Twitter fetch error:', error.message);
    throw new Error('Failed to fetch Twitter content');
  }
}

/**
 * Extract tweet ID from URL
 */
function extractTweetId(url) {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Normalize response
 */
function normalizeResponse(apiData, originalUrl, tweetId) {
  const media = apiData.media || apiData;
  
  return {
    success: true,
    platform: 'twitter',
    url: originalUrl,
    tweetId,
    title: apiData.text?.substring(0, 100) || 'Twitter Post',
    author: apiData.author?.name || apiData.user?.name || '@unknown',
    authorAvatar: apiData.author?.avatar || '',
    thumbnail: media.thumbnail || media.image,
    duration: media.duration || '',
    formats: [
      {
        type: 'mp4hd',
        quality: 'hd',
        url: media.video_hd || media.video,
        size: media.size_hd,
        label: 'Video MP4 HD',
      },
      {
        type: 'mp4sd',
        quality: 'sd',
        url: media.video_sd || media.video,
        size: media.size_sd,
        label: 'Video MP4 SD',
      },
      {
        type: 'image',
        quality: 'hd',
        url: media.image,
        size: '',
        label: 'Image HD',
      },
    ].filter(f => f.url),
  };
}

/**
 * TwitSave fallback
 */
async function fetchFromTwitSave(url, tweetId) {
  try {
    const response = await axios.get(`${API_ENDPOINTS.TWITSAVE}?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    });

    // Parse HTML for download links
    const html = response.data;
    const videoMatch = html.match(/href="(https:\/\/video\.twimg\.com[^"]+)"/g);
    
    return {
      success: true,
      platform: 'twitter',
      url,
      tweetId,
      title: 'Twitter Video',
      author: '@unknown',
      thumbnail: '',
      duration: '',
      formats: [
        { type: 'mp4hd', quality: 'hd', url: videoMatch?.[0]?.replace(/href="|"/g, ''), label: 'Video MP4 HD' },
      ].filter(f => f.url),
    };
    
  } catch (error) {
    throw new Error('TwitSave fallback failed');
  }
}

module.exports = {
  fetchMetadata,
  extractTweetId,
};
