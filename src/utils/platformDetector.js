
/**
 * Platform Detector Utility
 * Detects social media platform from URL string
 */

const PLATFORM_PATTERNS = {
  instagram: {
    regex: /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv|stories)\/([^\/\?]+)/i,
    name: 'Instagram',
    icon: '📸',
    supportsNoWatermark: true,
    supportsAudio: false,
    supportsImage: true,
  },
  tiktok: {
    regex: /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\/(?:@[\w.]+\/video\/\d+|v\/\d+|t\/\w+|\w+)/i,
    name: 'TikTok',
    icon: '🎵',
    supportsNoWatermark: true,
    supportsAudio: true,
    supportsImage: false,
  },
  youtube: {
    regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    name: 'YouTube',
    icon: '▶️',
    supportsNoWatermark: false,
    supportsAudio: true,
    supportsImage: true,
  },
  twitter: {
    regex: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:\w+)\/status\/(\d+)/i,
    name: 'Twitter/X',
    icon: '🐦',
    supportsNoWatermark: false,
    supportsAudio: true,
    supportsImage: true,
  },
  facebook: {
    regex: /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.watch)\/(?:watch\/\?v=\d+|share\/v\/\w+|\w+\/videos\/\d+|\w+\/posts\/\d+)/i,
    name: 'Facebook',
    icon: '👍',
    supportsNoWatermark: false,
    supportsAudio: true,
    supportsImage: true,
  },
  threads: {
    regex: /(?:https?:\/\/)?(?:www\.)?threads\.net\/(?:@\w+\/)?post\/(\w+)/i,
    name: 'Threads',
    icon: '🧵',
    supportsNoWatermark: false,
    supportsAudio: false,
    supportsImage: true,
  },
};

/**
 * Detect platform from URL
 * @param {string} url - URL to analyze
 * @returns {Object|null} Platform info or null
 */
function detectPlatform(url) {
  if (!url || typeof url !== 'string') return null;

  for (const [key, config] of Object.entries(PLATFORM_PATTERNS)) {
    if (config.regex.test(url)) {
      const match = url.match(config.regex);
      return {
        key,
        id: match ? match[1] : null,
        ...config,
      };
    }
  }
  return null;
}

/**
 * Check if URL is valid and supported
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return detectPlatform(url) !== null;
  } catch {
    return false;
  }
}

/**
 * Get all supported platforms list
 * @returns {Array}
 */
function getSupportedPlatforms() {
  return Object.entries(PLATFORM_PATTERNS).map(([key, config]) => ({
    key,
    name: config.name,
    icon: config.icon,
  }));
}

/**
 * Extract video ID from URL
 * @param {string} url
 * @param {string} platform
 * @returns {string|null}
 */
function extractVideoId(url, platform) {
  const config = PLATFORM_PATTERNS[platform];
  if (!config) return null;
  
  const match = url.match(config.regex);
  return match ? match[1] : null;
}

/**
 * Clean/normalize URL
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    // Remove tracking parameters
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('fbclid');
    return parsed.toString();
  } catch {
    return url;
  }
}

module.exports = {
  detectPlatform,
  isValidUrl,
  getSupportedPlatforms,
  extractVideoId,
  normalizeUrl,
  PLATFORM_PATTERNS,
};
