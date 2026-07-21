/**
 * Instagram Service
 * Handles Instagram-specific download logic
 * Uses FREE API: Cobalt.tools - Works on Vercel
 */

const axios = require('axios');

const COBALT_API = 'https://api.cobalt.tools/'; // Catatan: endpoint utama cobalt bisa berubah

/**
 * Fetch Instagram content metadata
 * @param {string} url - Instagram post/reel URL
 * @returns {Promise<Object>}
 */
async function fetchMetadata(url) {
  try {
    const response = await axios.post(COBALT_API, 
      { 
        url: url,
        vCodec: 'h264', // Biar kompatibel di semua device (iPhone/Android)
        isAudioOnly: false // Set true jika butuh API terpisah untuk MP3
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Menambahkan User-Agent agar tidak diblokir oleh WAF
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        // PENTING: Vercel Hobby max 10s. Timeout axios harus DI BAWAH 10s (contoh: 9000ms)
        // agar error bisa ditangkap blok catch sebelum Vercel mematikan fungsi paksa.
        timeout: 9000 
      }
    );

    const data = response.data;

    // HAPUS pemanggilan responseType: 'stream' di sini karena menyebabkan memory leak
    // dan membuat fungsi Vercel hang (Status 0). Cukup ambil URL-nya saja.
    if (data.status === 'redirect' && data.url) {
      data.downloadUrl = data.url; 
    }

    return normalizeCobaltResponse(data, url);

  } catch (error) {
    const status = error.response?.status || 'Unknown';
    const message = error.response?.data?.text || error.message;
    console.error(`Instagram fetch error [${status}]:`, message);
    throw new Error(`Gagal mengambil data dari Instagram: ${message}`);
  }
}

/**
 * Fetch no-watermark video
 * Cobalt otomatis no-watermark untuk TT & IG
 */
async function fetchNoWatermark(url) {
  try {
    const data = await fetchMetadata(url);
    
    // Pastikan formats ada sebelum melakukan iterasi
    const formats = data.formats || [];
    const bestVideo = formats.find(f => f.type.includes('mp4')) || formats[0];
    
    return {
      ...data,
      downloadUrl: bestVideo?.url || data.downloadUrl || data.url,
      isNoWatermark: true,
    };
    
  } catch (error) {
    throw new Error(`Gagal mengambil video tanpa watermark: ${error.message}`);
  }
}

/**
 * Normalize Cobalt API response
 */
function normalizeCobaltResponse(apiData, originalUrl) {
  const isVideo = apiData.status === 'stream' || apiData.status === 'redirect' 
                  ? !apiData.url.includes('.jpg') // Pengecekan sederhana jika bukan gambar
                  : apiData.type === 'video';
  
  let formats = [];
  
  // URL utama dari response
  const mediaUrl = apiData.url || apiData.downloadUrl;

  if (isVideo || mediaUrl.includes('.mp4')) {
    formats.push({
      type: 'mp4',
      quality: 'hd',
      url: mediaUrl,
      label: 'Video MP4 No Watermark',
    });
  } else {
    formats.push({
      type: 'image',
      quality: 'hd',
      url: mediaUrl,
      label: 'Image HD',
    });
  }

  return {
    success: true,
    platform: 'instagram',
    url: originalUrl,
    title: apiData.filename || 'Instagram Post',
    author: '@unknown', // Cobalt tidak menyediakan metadata author
    authorAvatar: '',
    thumbnail: apiData.thumbnail || '',
    duration: apiData.duration || '',
    formats: formats,
    downloadUrl: mediaUrl 
  };
}

module.exports = {
  fetchMetadata,
  fetchNoWatermark,
};
