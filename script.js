/**
 * AnimeVault — script.js
 * Handles: navigation, API fetching, image display,
 * download, toast notifications, particles.
 * Semua fetch memakai async/await, no backend.
 */

// ============================================================
// CONFIG — API endpoints dengan API key
// ============================================================
const API = {
  papayang:    'https://api.theresav.biz.id/image/papayang?apikey=mykey111',
  iqc:         (teks) => `https://api.theresav.biz.id/canvas/iqc?teks=${encodeURIComponent(teks)}&apikey=mykey111`,
  bluearchive: 'https://api.theresav.biz.id/image/bluearchive?apikey=mykey111',
};

// ============================================================
// STATE
// ============================================================
let currentSection = 'papayang';

// ============================================================
// NAVIGATION — ganti section dengan animasi
// ============================================================
function switchSection(name) {
  if (name === currentSection) return;

  // Sembunyikan section lama
  const old = document.getElementById('section-' + currentSection);
  if (old) {
    old.classList.remove('active');
    old.style.opacity = '0';
    old.style.transform = 'translateY(10px)';
    setTimeout(() => { old.style.display = 'none'; }, 200);
  }

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === name);
  });

  // Tampilkan section baru setelah sedikit delay
  currentSection = name;
  setTimeout(() => {
    const next = document.getElementById('section-' + name);
    if (next) {
      next.style.display = 'block';
      // Re-trigger animation
      next.classList.remove('active');
      void next.offsetWidth; // reflow
      next.classList.add('active');
    }
  }, 180);
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
/**
 * Tampilkan toast notification.
 * @param {string} message - Pesan yang ditampilkan
 * @param {'success'|'error'|'info'} type - Jenis toast
 */
function showToast(message, type = 'info') {
  const icons = { success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill', info: 'ri-information-fill' };
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="toast-icon ${icons[type]}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove setelah 3 detik
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// LOADING STATE helpers
// ============================================================
function setLoading(cardLoadingId, visible) {
  const el = document.getElementById(cardLoadingId);
  if (el) el.classList.toggle('visible', visible);
}

// ============================================================
// FETCH WRAPPER — handle CORS dengan mode cors + cache buster
// ============================================================
/**
 * Fetch gambar dari URL API, kembalikan object URL (blob).
 * Menambahkan timestamp untuk bypass cache browser.
 */
async function fetchImageAsBlob(url) {
  // Tambahkan timestamp sebagai cache-buster agar gambar selalu fresh
  const separator = url.includes('?') ? '&' : '?';
  const freshUrl = url + separator + '_t=' + Date.now();

  const response = await fetch(freshUrl, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// ============================================================
// PAPAYANG — load random image
// ============================================================
async function loadPapayang() {
  const imgEl       = document.getElementById('papayangImg');
  const placeholder = document.getElementById('papayangPlaceholder');
  const overlay     = document.getElementById('papayangOverlay');
  const btnDownload = document.getElementById('btnPapayangDownload');

  setLoading('papayangLoading', true);
  btnDownload.disabled = true;

  // Revokekan blob URL lama agar tidak memory leak
  if (imgEl.src && imgEl.src.startsWith('blob:')) URL.revokeObjectURL(imgEl.src);

  try {
    const blobUrl = await fetchImageAsBlob(API.papayang);

    // Sembunyikan placeholder
    placeholder.style.display = 'none';
    imgEl.style.display = 'block';
    overlay.style.display = 'block';

    // Fade-in gambar baru
    imgEl.style.opacity = '0';
    imgEl.src = blobUrl;
    imgEl.onload = () => {
      imgEl.style.transition = 'opacity 0.4s ease';
      imgEl.style.opacity = '1';
    };

    btnDownload.disabled = false;
    showToast('Gambar Papayang berhasil dimuat!', 'success');

  } catch (err) {
    showToast('Gagal memuat gambar: ' + err.message, 'error');
    console.error('[Papayang]', err);
  } finally {
    setLoading('papayangLoading', false);
  }
}

// ============================================================
// IQC GENERATOR — generate canvas dari teks input
// ============================================================
async function generateIQC() {
  const input       = document.getElementById('iqcText');
  const teks        = input.value.trim();

  if (!teks) {
    showToast('Teks tidak boleh kosong!', 'error');
    input.focus();
    return;
  }

  const imgEl       = document.getElementById('iqcImg');
  const placeholder = document.getElementById('iqcPlaceholder');
  const overlay     = document.getElementById('iqcOverlay');
  const tagText     = document.getElementById('iqcTagText');
  const btnDownload = document.getElementById('btnIqcDownload');
  const apiUrlBadge = document.getElementById('iqcApiUrl').querySelector('span');

  // Tampilkan URL di badge (tanpa apikey untuk keamanan tampilan)
  const displayUrl = `canvas/iqc?teks=${encodeURIComponent(teks)}`;
  apiUrlBadge.textContent = displayUrl;

  setLoading('iqcLoading', true);
  btnDownload.disabled = true;

  if (imgEl.src && imgEl.src.startsWith('blob:')) URL.revokeObjectURL(imgEl.src);

  try {
    const blobUrl = await fetchImageAsBlob(API.iqc(teks));

    placeholder.style.display = 'none';
    imgEl.style.display = 'block';
    overlay.style.display = 'block';
    tagText.textContent = teks.length > 20 ? teks.slice(0, 20) + '…' : teks;

    imgEl.style.opacity = '0';
    imgEl.src = blobUrl;
    imgEl.onload = () => {
      imgEl.style.transition = 'opacity 0.4s ease';
      imgEl.style.opacity = '1';
    };

    btnDownload.disabled = false;
    showToast('Canvas IQC berhasil digenerate!', 'success');

  } catch (err) {
    showToast('Gagal generate canvas: ' + err.message, 'error');
    console.error('[IQC]', err);
  } finally {
    setLoading('iqcLoading', false);
  }
}

// ============================================================
// BLUE ARCHIVE — load random image
// ============================================================
async function loadBlueArchive() {
  const imgEl       = document.getElementById('baImg');
  const placeholder = document.getElementById('baPlaceholder');
  const overlay     = document.getElementById('baOverlay');
  const btnDownload = document.getElementById('btnBaDownload');

  setLoading('baLoading', true);
  btnDownload.disabled = true;

  if (imgEl.src && imgEl.src.startsWith('blob:')) URL.revokeObjectURL(imgEl.src);

  try {
    const blobUrl = await fetchImageAsBlob(API.bluearchive);

    placeholder.style.display = 'none';
    imgEl.style.display = 'block';
    overlay.style.display = 'block';

    imgEl.style.opacity = '0';
    imgEl.src = blobUrl;
    imgEl.onload = () => {
      imgEl.style.transition = 'opacity 0.4s ease';
      imgEl.style.opacity = '1';
    };

    btnDownload.disabled = false;
    showToast('Gambar Blue Archive berhasil dimuat!', 'success');

  } catch (err) {
    showToast('Gagal memuat gambar: ' + err.message, 'error');
    console.error('[BlueArchive]', err);
  } finally {
    setLoading('baLoading', false);
  }
}

// ============================================================
// DOWNLOAD — simpan gambar ke perangkat
// ============================================================
/**
 * Download gambar yang sedang ditampilkan.
 * @param {string} imgId   - ID element <img>
 * @param {string} prefix  - Prefix nama file download
 */
function downloadImage(imgId, prefix) {
  const imgEl = document.getElementById(imgId);
  if (!imgEl || !imgEl.src || imgEl.style.display === 'none') {
    showToast('Tidak ada gambar untuk didownload.', 'error');
    return;
  }

  const a = document.createElement('a');
  a.href = imgEl.src;
  a.download = `${prefix}-${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast('Download dimulai!', 'success');
}

// ============================================================
// IQC INPUT — char counter & Enter key support
// ============================================================
(function setupIqcInput() {
  const input     = document.getElementById('iqcText');
  const charCount = document.getElementById('charCount');
  const apiUrl    = document.getElementById('iqcApiUrl').querySelector('span');

  if (!input) return;

  input.addEventListener('input', () => {
    const len = input.value.length;
    charCount.textContent = `${len}/80`;

    // Update URL preview realtime saat mengetik
    if (input.value.trim()) {
      apiUrl.textContent = `canvas/iqc?teks=${encodeURIComponent(input.value.trim())}`;
    } else {
      apiUrl.textContent = 'Masukkan teks untuk melihat URL';
    }
  });

  // Tekan Enter langsung generate
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generateIQC();
  });
})();

// ============================================================
// BACKGROUND PARTICLES — efek partikel melayang
// ============================================================
(function initParticles() {
  const container = document.getElementById('bgParticles');
  if (!container) return;

  const colors = ['#3b82f6', '#8b5cf6', '#22d3ee', '#a855f7', '#f472b6'];
  const count  = window.innerWidth < 600 ? 18 : 32;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size  = Math.random() * 3 + 1.5;   // 1.5–4.5px
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left  = Math.random() * 100;        // % horizontal
    const dur   = Math.random() * 18 + 10;   // 10–28s
    const delay = Math.random() * -dur;       // stagger start
    const op    = (Math.random() * 0.25 + 0.08).toFixed(2); // 0.08–0.33

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      left: ${left}%;
      bottom: -10px;
      box-shadow: 0 0 ${size * 3}px ${color};
      --dur: ${dur}s;
      --delay: ${delay}s;
      --max-op: ${op};
    `;

    container.appendChild(p);
  }
})();

// ============================================================
// INIT — jalankan saat DOM siap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Pastikan section pertama (papayang) terlihat dengan benar
  const first = document.getElementById('section-papayang');
  if (first) {
    first.style.display = 'block';
    first.classList.add('active');
  }

  showToast('Selamat datang di AnimeVault! 🎌', 'info');
});
