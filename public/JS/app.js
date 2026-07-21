
/**
 * Social Downloader — Frontend App
 * Educational & Non-Commercial Use Only
 */

const API_BASE = ''; // Same origin or '/api'

// Platform detection patterns
const PLATFORM_PATTERNS = {
  instagram: /instagram\.com|instagr\.am/i,
  tiktok: /tiktok\.com|vt\.tiktok/i,
  youtube: /youtube\.com|youtu\.be/i,
  twitter: /twitter\.com|x\.com/i,
  facebook: /facebook\.com|fb\.watch/i,
  threads: /threads\.net/i,
};

const PLATFORM_ICONS = {
  instagram: '📸', tiktok: '🎵', youtube: '▶️',
  twitter: '🐦', facebook: '👍', threads: '🧵'
};

const PLATFORM_NAMES = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  threads: 'Threads'
};

// DOM Elements
const $ = id => document.getElementById(id);
const els = {
  urlInput: $('urlInput'),
  fetchBtn: $('fetchBtn'),
  detectBadge: $('detectBadge'),
  previewCard: $('previewCard'),
  previewThumb: $('previewThumb'),
  previewTitle: $('previewTitle'),
  previewAuthor: $('previewAuthor'),
  previewAvatar: $('previewAvatar'),
  previewPlatform: $('previewPlatform'),
  previewDuration: $('previewDuration'),
  formatGrid: $('formatGrid'),
  nowmBtn: $('nowmBtn'),
  errorCard: $('errorCard'),
  errorTitle: $('errorTitle'),
  errorMessage: $('errorMessage'),
  retryBtn: $('retryBtn'),
  historyList: $('historyList'),
  clearHistory: $('clearHistory'),
  loadingOverlay: $('loadingOverlay'),
  toast: $('toast'),
  themeToggle: $('themeToggle'),
  platformTabs: $('platformTabs'),
};

// State
let currentData = null;
let currentPlatform = null;

// ===== Utilities =====
function showToast(message, duration = 2500) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), duration);
}

function setLoading(show) {
  els.loadingOverlay.classList.toggle('show', show);
}

function showError(title, message) {
  els.errorCard.style.display = 'block';
  els.previewCard.style.display = 'none';
  els.errorTitle.textContent = title;
  els.errorMessage.textContent = message;
}

function hideError() {
  els.errorCard.style.display = 'none';
}

function detectPlatform(url) {
  for (const [name, regex] of Object.entries(PLATFORM_PATTERNS)) {
    if (regex.test(url)) return name;
  }
  return null;
}

// ===== Theme =====
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  showToast(next === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
}

// ===== History =====
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('dl_history') || '[]');
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem('dl_history', JSON.stringify(items.slice(0, 50)));
}

function addToHistory(item) {
  const history = getHistory();
  history.unshift({ ...item, id: Date.now(), time: new Date().toISOString() });
  saveHistory(history);
  renderHistory();
}

function removeFromHistory(id) {
  const history = getHistory().filter(h => h.id !== id);
  saveHistory(history);
  renderHistory();
}

function clearAllHistory() {
  localStorage.removeItem('dl_history');
  renderHistory();
  showToast('History cleared');
}

function renderHistory() {
  const history = getHistory();
  
  if (history.length === 0) {
    els.historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No downloads yet</p>
        <span>Paste a URL above to get started</span>
      </div>`;
    return;
  }

  els.historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="history-thumb">${PLATFORM_ICONS[item.platform] || '📎'}</div>
      <div class="history-info">
        <div class="history-title">${escapeHtml(item.title || 'Untitled')}</div>
        <div class="history-sub">${PLATFORM_NAMES[item.platform] || item.platform} • ${item.format} • ${formatTime(item.time)}</div>
      </div>
      <div class="history-actions">
        <button class="icon-btn" onclick="window.redownload(${item.id})" title="Download again">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="icon-btn" onclick="window.removeHistory(${item.id})" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

// Expose to window for inline onclick
window.removeHistory = removeFromHistory;
window.redownload = (id) => {
  const item = getHistory().find(h => h.id === id);
  if (item) {
    showToast(`Re-downloading ${item.format}...`);
    // Trigger actual download logic here
  }
};

// ===== Fetch Content =====
async function fetchContent() {
  const url = els.urlInput.value.trim();
  
  if (!url) {
    showToast('Please enter a URL');
    return;
  }

  currentPlatform = detectPlatform(url);
  
  if (!currentPlatform) {
    showError('Unsupported URL', 'We currently support Instagram, TikTok, YouTube, Twitter/X, Facebook, and Threads.');
    return;
  }

  hideError();
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/api/download?url=${encodeURIComponent(url)}&platform=${currentPlatform}`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch content');
    }

    currentData = data;
    renderPreview(data);
    showToast('Content loaded! Choose a format.');
    
  } catch (error) {
    console.error('Fetch error:', error);
    showError('Failed to fetch', error.message || 'Please check the URL and try again.');
  } finally {
    setLoading(false);
  }
}

function renderPreview(data) {
  els.previewCard.style.display = 'block';
  els.previewThumb.src = data.thumbnail || '';
  els.previewThumb.alt = data.title || 'Thumbnail';
  els.previewTitle.textContent = data.title || 'Untitled';
  els.previewAuthor.textContent = data.author || '@unknown';
  els.previewAvatar.src = data.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.author || 'U')}&background=random`;
  els.previewPlatform.textContent = PLATFORM_NAMES[currentPlatform] || currentPlatform;
  els.previewDuration.textContent = data.duration || '';

  // Show/hide no-watermark option
  const supportsNoWM = ['tiktok', 'instagram'].includes(currentPlatform);
  els.nowmBtn.style.display = supportsNoWM ? 'flex' : 'none';

  // Update size labels if available
  if (data.formats) {
    data.formats.forEach(fmt => {
      const sizeEl = $(`size-${fmt.type}`);
      if (sizeEl && fmt.size) sizeEl.textContent = fmt.size;
    });
  }
}

// ===== Download =====
async function downloadContent(format) {
  if (!currentData || !currentPlatform) return;

  const url = els.urlInput.value.trim();
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/api/download/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, platform: currentPlatform, format })
    });

    if (!response.ok) throw new Error('Download failed');

    // Get filename from header or generate
    const disposition = response.headers.get('content-disposition');
    let filename = 'download';
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    // Add to history
    addToHistory({
      title: currentData.title,
      platform: currentPlatform,
      format: format.toUpperCase(),
      thumbnail: currentData.thumbnail
    });

    showToast('Download started!');

  } catch (error) {
    console.error('Download error:', error);
    showToast('Download failed. Please try again.');
  } finally {
    setLoading(false);
  }
}

// ===== Event Listeners =====
els.urlInput.addEventListener('input', () => {
  const url = els.urlInput.value.trim();
  const platform = detectPlatform(url);
  
  els.fetchBtn.disabled = !url;
  
  if (platform) {
    els.detectBadge.className = `detect-badge show ${platform}`;
    els.detectBadge.innerHTML = `${PLATFORM_ICONS[platform]} Detected: ${PLATFORM_NAMES[platform]}`;
  } else {
    els.detectBadge.classList.remove('show');
  }
});

els.urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchContent();
});

els.fetchBtn.addEventListener('click', fetchContent);

els.formatGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.format-btn');
  if (!btn) return;
  downloadContent(btn.dataset.format);
});

els.retryBtn.addEventListener('click', () => {
  hideError();
  fetchContent();
});

els.clearHistory.addEventListener('click', clearAllHistory);

els.themeToggle.addEventListener('click', toggleTheme);

// Platform tab shortcuts
els.platformTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  
  const platform = tab.dataset.platform;
  const samples = {
    instagram: 'https://www.instagram.com/reel/ABC123/',
    tiktok: 'https://www.tiktok.com/@user/video/1234567890',
    youtube: 'https://youtube.com/shorts/ABC123',
    twitter: 'https://x.com/user/status/1234567890',
    facebook: 'https://facebook.com/watch/?v=123456',
    threads: 'https://threads.net/@user/post/ABC123'
  };
  
  if (platform !== 'all' && samples[platform]) {
    els.urlInput.value = samples[platform];
    els.urlInput.dispatchEvent(new Event('input'));
  }
});

// ===== Init =====
initTheme();
renderHistory();
