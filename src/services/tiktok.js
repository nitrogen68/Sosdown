
/**
 * TikTok Service
 * Handles TikTok video downloads with no-watermark support
 */

const axios = require('axios');

const API_ENDPOINTS = {
  RAPIDAPI: 'https://tiktok-video-no-watermark2.p.rapidapi.com/',
  SSSTIK: 'https://ssstik.io/abc?url=dl',
  DOUYIN: 'https://api.douyin.wang/api/tiktok/web/fetch',
};

/**
 * Fetch TikTok metadata
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchMetadata(url) {
  try {
    // RapidAPI approach
    if (process.env.RAPIDAPI_KEY) {
      const response = await axios.get(API_ENDPOINTS.RAPIDAPI, {
        params: { url, hd: '1' },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com',
        },
        timeout: 15000,
      });

      return normalizeResponse(response.data, url);
    }

    // Free fallback: SSSTik style
    return await fetchFromSSSTik(url);

  } catch (error) {
    console.error('TikTok fetch error:', error.message);
    throw new Error('Failed to fetch TikTok content');
  }
}

/**
 * Fetch no-watermark video specifically
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchNoWatermark(url) {
  const data = await fetchMetadata(url);
  
  // Prioritize no-watermark URL
  const noWmUrl = data.formats?.find(f => f.type === 'nowm')?.url 
    || data.formats?.find(f => f.quality === 'hd' && f.label?.includes('No Watermark'))?.url;
  
  if (!noWmUrl) {
    throw new Error('No watermark-free version available');
  }

  return {
    ...data,
    downloadUrl: noWmUrl,
    isNoWatermark: true,
  };
}

/**
 * Normalize API response
 */
function normalizeResponse(apiData, originalUrl) {
  const data = apiData.data || apiData;
  
  return {
    success: true,
    platform: 'tiktok',
    url: originalUrl,
    title: data.title || data.desc || 'TikTok Video',
    author: data.author?.nickname || data.author_name || '@unknown',
    authorAvatar: data.author?.avatar || '',
    thumbnail: data.cover || data.thumbnail || data.origin_cover,
    duration: data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : '',
    formats: [
      {
        type: 'nowm',
        quality: 'hd',
        url: data.hdplay || data.play,
        size: data.size || '',
        label: 'No Watermark HD',
      },
      {
        type: 'mp4hd',
        quality: 'hd',
        url: data.hdplay || data.play,
        size: data.size || '',
        label: 'Video MP4 HD',
      },
      {
        type: 'mp4sd',
        quality: 'sd',
        url: data.play || data.wmplay,
        size: data.size || '',
        label: 'Video MP4 SD',
      },
      {
        type: 'mp3',
        quality: 'audio',
        url: data.music || data.music_info?.url,
        size: '',
        label: 'Audio MP3',
      },
    ].filter(f => f.url),
  };
}

/**
 * SSSTik free fallback
 */
async function fetchFromSSSTik(url) {
  // SSSTik requires token extraction from their page first
  // This is a simplified version - in production you'd need puppeteer or regex extraction
  
  try {
    // Step 1: Get the page to extract token
    const pageRes = await axios.get('https://ssstik.io/en', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });
    
    // Extract token from HTML (simplified)
    const tokenMatch = pageRes.data.match(/tt:'([^']+)'/);
    const token = tokenMatch ? tokenMatch[1] : '';
    
    // Step 2: Post with token
    const formData = new URLSearchParams();
    formData.append('id', url);
    formData.append('locale', 'en');
    formData.append('tt', token);
    
    const response = await axios.post('https://ssstik.io/abc?url=dl', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://ssstik.io',
        'Referer': 'https://ssstik.io/en',
      },
      timeout: 20000,
    });

    // Parse HTML response
    const html = response.data;
    const videoMatch = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
    const audioMatch = html.match(/href="(https:\/\/[^"]+\.mp3[^"]*)"/);
    
    return {
      success: true,
      platform: 'tiktok',
      url,
      title: 'TikTok Video',
      author: '@unknown',
      thumbnail: '',
      duration: '',
      formats: [
        { type: 'nowm', quality: 'hd', url: videoMatch?.[1], label: 'No Watermark' },
        { type: 'mp3', quality: 'audio', url: audioMatch?.[1], label: 'Audio MP3' },
      ].filter(f => f.url),
    };
    
  } catch (error) {
    throw new Error('SSSTik fallback failed');
  }
}

module.exports = {
  fetchMetadata,
  fetchNoWatermark,
};
