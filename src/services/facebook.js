/**
 * Facebook Service
 * Handles Facebook video downloads
 */

const axios = require('axios');

const API_ENDPOINTS = {
  RAPIDAPI: 'https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php',
  FBDOWN: 'https://fdown.net/download.php',
};

/**
 * Fetch Facebook metadata
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchMetadata(url) {
  try {
    // RapidAPI
    if (process.env.RAPIDAPI_KEY) {
      const response = await axios.get(API_ENDPOINTS.RAPIDAPI, {
        params: { url },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'facebook-reel-and-video-downloader.p.rapidapi.com',
        },
        timeout: 15000,
      });
      return normalizeResponse(response.data, url);
    }

    return await fetchFromFBDown(url);

  } catch (error) {
    console.error('Facebook fetch error:', error.message);
    throw new Error('Failed to fetch Facebook content');
  }
}

/**
 * Normalize response
 */
function normalizeResponse(apiData, originalUrl) {
  return {
    success: true,
    platform: 'facebook',
    url: originalUrl,
    title: apiData.title || 'Facebook Video',
    author: apiData.author || '@unknown',
    thumbnail: apiData.thumbnail,
    duration: apiData.duration || '',
    formats: [
      {
        type: 'mp4hd',
        quality: 'hd',
        url: apiData.links?.['Download High Quality'] || apiData.hd,
        size: '',
        label: 'Video MP4 HD',
      },
      {
        type: 'mp4sd',
        quality: 'sd',
        url: apiData.links?.['Download Low Quality'] || apiData.sd,
        size: '',
        label: 'Video MP4 SD',
      },
    ].filter(f => f.url),
  };
}

/**
 * FBDown fallback
 */
async function fetchFromFBDown(url) {
  try {
    const formData = new URLSearchParams();
    formData.append('URLz', url);
    
    const response = await axios.post(API_ENDPOINTS.FBDOWN, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 20000,
    });

    const html = response.data;
    const hdMatch = html.match(/href="(https:\/\/[^"]+)"[^>]*>HD Quality/);
    const sdMatch = html.match(/href="(https:\/\/[^"]+)"[^>]*>SD Quality/);
    
    return {
      success: true,
      platform: 'facebook',
      url,
      title: 'Facebook Video',
      author: '@unknown',
      thumbnail: '',
      duration: '',
      formats: [
        { type: 'mp4hd', quality: 'hd', url: hdMatch?.[1], label: 'Video MP4 HD' },
        { type: 'mp4sd', quality: 'sd', url: sdMatch?.[1], label: 'Video MP4 SD' },
      ].filter(f => f.url),
    };
    
  } catch (error) {
    throw new Error('FBDown fallback failed');
  }
}

module.exports = {
  fetchMetadata,
};

