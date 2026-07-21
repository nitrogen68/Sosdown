const axios = require('axios');

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchMetadata(url) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  if (process.env.RAPIDAPI_KEY) {
    try {
      const response = await axios.get('https://youtube-video-download.p.rapidapi.com/api/download', {
        params: { url },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'youtube-video-download.p.rapidapi.com',
        },
        timeout: 15000,
      });
      return normalizeResponse(response.data, url, videoId);
    } catch (err) {
      console.log('RapidAPI failed:', err.message);
    }
  }
  return getDemoData(url, videoId);
}

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
    duration: apiData.duration || '',
    formats: [
      { type: 'mp4hd', quality: '1080p', url: apiData.video_hd, size: apiData.size_hd, label: 'Video MP4 HD (1080p)' },
      { type: 'mp4sd', quality: '720p', url: apiData.video_sd, size: apiData.size_sd, label: 'Video MP4 SD (720p)' },
      { type: 'mp3', quality: '128kbps', url: apiData.audio, size: apiData.size_audio, label: 'Audio MP3 (128kbps)' },
    ].filter(f => f.url),
  };
}

function getDemoData(url, videoId) {
  return {
    success: true,
    platform: 'youtube',
    url,
    videoId,
    title: '▶️ YouTube Shorts — Coding Tutorial',
    author: '@devmaster',
    authorAvatar: 'https://ui-avatars.com/api/?name=Dev&background=random',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    duration: '0:58',
    isDemo: true,
    formats: [
      { type: 'mp4hd', quality: '1080p', url: 'https://example.com/yt-hd.mp4', size: '~25 MB', label: 'Video MP4 HD (1080p)' },
      { type: 'mp4sd', quality: '720p', url: 'https://example.com/yt-sd.mp4', size: '~12 MB', label: 'Video MP4 SD (720p)' },
      { type: 'mp3', quality: '128kbps', url: 'https://example.com/yt.mp3', size: '~3 MB', label: 'Audio MP3 (128kbps)' },
    ],
  };
}

module.exports = { fetchMetadata, extractVideoId };
