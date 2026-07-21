
/**
 * YouTube Service
 * Handles YouTube Shorts and video downloads
 */

const axios = require('axios');

const API_ENDPOINTS = {
  RAPIDAPI: 'https://youtube-video-download.p.rapidapi.com/api/download',
  Y2MATE: 'https://www.y2mate.com/mates/analyzeV2/ajax',
  COBALT: 'https://api.cobalt.tools/api/json',
};

/**
 * Fetch YouTube metadata
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchMetadata(url) {
  try {
    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');

    // Try RapidAPI
    if (process.env.RAPIDAPI_KEY) {
      const response = await axios.get(API_ENDPOINTS.RAPIDAPI, {
        params: { url },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'youtube-video-download.p.rapidapi.com',
        },
        timeout: 15000,
      });
      return normalizeResponse(response.data, url, videoId);
    }

    // Fallback: Cobalt (open source, free)
    return await fetchFromCobalt(url, videoId);

  } catch (error) {
    console.error('YouTube fetch error:', error.message);
    throw new Error('Failed to fetch YouTube content');
  }
}

/**
 * Extract YouTube video ID
 */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Normalize API response
 */
function normalizeResponse(apiData, originalUrl, videoId) {
  return {
    success: true,
    platform: 'youtube',
    url: originalUrl,
    videoId,
    title: apiData.title || 'YouTube Video',
    author: apiData.author || apiData.uploader || '@unknown',
    authorAvatar: apiData.authorAvatar || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    thumbnail: apiData.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    duration: apiData.duration || apiData.length || '',
    formats: [
      {
        type: 'mp4hd',
        quality: '1080p',
        url: apiData.video_hd || apiData.formats?.find(f => f.quality === '1080p')?.url,
        size: apiData.size_hd,
        label: 'Video MP4 HD (1080p)',
      },
      {
        type: 'mp4sd',
        quality: '720p',
        url: apiData.video_sd || apiData.formats?.find(f => f.quality === '720p')?.url,
        size: apiData.size_sd,
        label: 'Video MP4 SD (720p)',
      },
      {
        type: 'mp3',
        quality: '128kbps',
        url: apiData.audio || apiData.formats?.find(f => f.type === 'audio')?.url,
        size: apiData.size_audio,
        label: 'Audio MP3 (128kbps)',
      },
    ].filter(f => f.url),
  };
}

/**
 * Cobalt API (free, open source)
 */
async function fetchFromCobalt(url, videoId) {
  try {
    const response = await axios.post(API_ENDPOINTS.COBALT, {
      url,
      isAudioOnly: false,
      quality: '1080',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 20000,
    });

    const data = response.data;
    
    return {
      success: true,
      platform: 'youtube',
      url,
      videoId,
      title: data.title || 'YouTube Video',
      author: '@unknown',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      duration: '',
      formats: [
        { type: 'mp4hd', quality: '1080p', url: data.url, label: 'Video MP4 HD' },
      ].filter(f => f.url),
    };
    
  } catch (error) {
    throw new Error('Cobalt fallback failed');
  }
}

module.exports = {
  fetchMetadata,
  extractVideoId,
};
