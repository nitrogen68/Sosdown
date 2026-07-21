const axios = require('axios');

async function fetchMetadata(url) {
  if (process.env.RAPIDAPI_KEY) {
    try {
      const response = await axios.get('https://tiktok-video-no-watermark2.p.rapidapi.com/', {
        params: { url, hd: '1' },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com',
        },
        timeout: 15000,
      });
      return normalizeResponse(response.data, url);
    } catch (err) {
      console.log('RapidAPI failed:', err.message);
    }
  }
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

function normalizeResponse(apiData, originalUrl) {
  const data = apiData.data || apiData;
  return {
    success: true,
    platform: 'tiktok',
    url: originalUrl,
    title: data.title || data.desc || 'TikTok Video',
    author: data.author?.nickname || '@unknown',
    authorAvatar: data.author?.avatar || '',
    thumbnail: data.cover || data.thumbnail,
    duration: data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : '',
    formats: [
      { type: 'nowm', quality: 'hd', url: data.hdplay || data.play, size: '', label: 'No Watermark HD' },
      { type: 'mp4hd', quality: 'hd', url: data.hdplay || data.play, size: '', label: 'Video MP4 HD' },
      { type: 'mp4sd', quality: 'sd', url: data.play, size: '', label: 'Video MP4 SD' },
      { type: 'mp3', quality: 'audio', url: data.music, size: '', label: 'Audio MP3' },
    ].filter(f => f.url),
  };
}

function getDemoData(url) {
  return {
    success: true,
    platform: 'tiktok',
    url,
    title: '🎵 TikTok — Dance Challenge 2024',
    author: '@dancequeen',
    authorAvatar: 'https://ui-avatars.com/api/?name=Dance&background=random',
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=640&h=360&fit=crop',
    duration: '0:45',
    isDemo: true,
    formats: [
      { type: 'nowm', quality: 'hd', url: 'https://example.com/tiktok-nowm.mp4', size: '~8 MB', label: 'No Watermark HD' },
      { type: 'mp4hd', quality: 'hd', url: 'https://example.com/tiktok-hd.mp4', size: '~8 MB', label: 'Video MP4 HD' },
      { type: 'mp4sd', quality: 'sd', url: 'https://example.com/tiktok-sd.mp4', size: '~3 MB', label: 'Video MP4 SD' },
      { type: 'mp3', quality: 'audio', url: 'https://example.com/tiktok.mp3', size: '~1 MB', label: 'Audio MP3' },
    ],
  };
}

module.exports = { fetchMetadata, fetchNoWatermark };
