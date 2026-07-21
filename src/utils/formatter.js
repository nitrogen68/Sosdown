
/**
 * Formatter Utility
 * Format sizes, durations, filenames, etc.
 */

/**
 * Format bytes to human readable string
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration from ISO 8601 (PT1M30S) to readable
 * @param {string} isoDuration
 * @returns {string}
 */
function formatISODuration(isoDuration) {
  if (!isoDuration) return '0:00';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Sanitize filename for download
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  if (!filename) return 'download';
  
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100)
    .trim() || 'download';
}

/**
 * Generate download filename
 * @param {string} title
 * @param {string} platform
 * @param {string} format
 * @returns {string}
 */
function generateFilename(title, platform, format) {
  const timestamp = Date.now();
  const cleanTitle = sanitizeFilename(title);
  const ext = format === 'mp3' ? 'mp3' : format === 'image' ? 'jpg' : 'mp4';
  
  return `${cleanTitle}_${platform}_${timestamp}.${ext}`;
}

/**
 * Format date for history display
 * @param {string|Date} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(text, maxLength = 60) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Escape HTML entities
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Parse content type to format label
 * @param {string} contentType
 * @returns {string}
 */
function getFormatLabel(contentType) {
  if (!contentType) return 'Unknown';
  
  if (contentType.includes('audio')) return 'MP3';
  if (contentType.includes('image')) return 'Image';
  if (contentType.includes('video')) return 'MP4';
  
  return 'File';
}

module.exports = {
  formatBytes,
  formatDuration,
  formatISODuration,
  sanitizeFilename,
  generateFilename,
  formatDate,
  truncate,
  escapeHtml,
  getFormatLabel,
};
