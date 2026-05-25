/**
 * AnimeVault — script.js (Updated)
 * New features: Jadwal Bola, Jadwal TV, Cosplay, Loli, Neko, SS Web, Temp Mail, HD Upscaler
 */

const APIKEY = 'mykey111';
const BASE = 'https://api.theresav.biz.id';

const API = {
  papayang:    `${BASE}/image/papayang?apikey=${APIKEY}`,
  iqc:         (t) => `${BASE}/canvas/iqc?teks=${encodeURIComponent(t)}&apikey=${APIKEY}`,
  bluearchive: `${BASE}/image/bluearchive?apikey=${APIKEY}`,
  jadwalbola:  `${BASE}/info/jadwalbola?apikey=${APIKEY}`,
  jadwaltv:    (ch) => `${BASE}/info/jadwaltv?channel=${encodeURIComponent(ch)}&apikey=${APIKEY}`,
  cosplay:     `${BASE}/random/cosplay?apikey=${APIKEY}`,
  loli:        `${BASE}/image/loli?apikey=${APIKEY}`,
  neko:        `${BASE}/nsfw/hentai?apikey=${APIKEY}`,
  ssweb:       (url, dev) => `${BASE}/tools/ssweb?url=${encodeURIComponent(url)}&device=${dev}&apikey=${APIKEY}`,
  tempcreate:  `${BASE}/tools/tempmail/create?apikey=${APIKEY}`,
  tempcheck:   (mb, salt, cookies) => `${BASE}/tools/tempmail/check?mailbox=${encodeURIComponent(mb)}&salt=${encodeURIComponent(salt)}&cookies=${encodeURIComponent(cookies)}&apikey=${APIKEY}`,
  hd:          `${BASE}/tools/hd?apikey=${APIKEY}`,
};

// ── State ──────────────────────────────────────────────────────
let currentSection = 'papayang';
let tempMailData = null; // {mailbox, salt, cookies}

// ── Navigation ─────────────────────────────────────────────────
function switchSection(name) {
  if (name === currentSection) return;
  const old = document.getElementById('section-' + currentSection);
  if (old) { old.classList.remove('active'); setTimeout(() => { old.style.display='none'; }, 200); }
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.section === name));
  currentSection = name;
  setTimeout(() => {
    const next = document.getElementById('section-' + name);
    if (next) { next.style.display='block'; next.classList.remove('active'); void next.offsetWidth; next.classList.add('active'); }
  }, 180);
}

// ── Toast ───────────────────────────────────────────────────────
function showToast(msg, type='info') {
  const icons = { success:'ri-checkbox-circle-fill', error:'ri-error-warning-fill', info:'ri-information-fill' };
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="toast-icon ${icons[type]}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('hiding'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ── Loading ─────────────────────────────────────────────────────
function setLoading(id, v) { const el = document.getElementById(id); if(el) el.classList.toggle('visible', v); }

// ── Fetch image as blob ─────────────────────────────────────────
async function fetchImageAsBlob(url) {
  const sep = url.includes('?') ? '&' : '?';
  const r = await fetch(url + sep + '_t=' + Date.now(), { method:'GET', mode:'cors', cache:'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return URL.createObjectURL(await r.blob());
}

// ── Generic image loader ────────────────────────────────────────
async function loadGenericImage(apiUrl, imgId, placeholderId, overlayId, loadingId, downloadBtnId, label) {
  const imgEl = document.getElementById(imgId);
  const ph    = document.getElementById(placeholderId);
  const ov    = document.getElementById(overlayId);
  const btn   = document.getElementById(downloadBtnId);
  setLoading(loadingId, true);
  btn.disabled = true;
  if (imgEl.src && imgEl.src.startsWith('blob:')) URL.revokeObjectURL(imgEl.src);
  try {
    const blobUrl = await fetchImageAsBlob(apiUrl);
    ph.style.display = 'none';
    imgEl.style.display = 'block';
    ov.style.display = 'block';
    imgEl.style.opacity = '0';
    imgEl.src = blobUrl;
    imgEl.onload = () => { imgEl.style.transition = 'opacity 0.4s ease'; imgEl.style.opacity = '1'; };
    btn.disabled = false;
    showToast(`${label} berhasil dimuat!`, 'success');
  } catch(e) {
    showToast('Gagal memuat: ' + e.message, 'error');
  } finally {
    setLoading(loadingId, false);
  }
}

// ── Papayang ────────────────────────────────────────────────────
function loadPapayang() { loadGenericImage(API.papayang, 'papayangImg', 'papayangPlaceholder', 'papayangOverlay', 'papayangLoading', 'btnPapayangDownload', 'Papayang'); }

// ── Blue Archive ────────────────────────────────────────────────
function loadBlueArchive() { loadGenericImage(API.bluearchive, 'baImg', 'baPlaceholder', 'baOverlay', 'baLoading', 'btnBaDownload', 'Blue Archive'); }

// ── Cosplay ─────────────────────────────────────────────────────
function loadCosplay() { loadGenericImage(API.cosplay, 'cosplayImg', 'cosplayPlaceholder', 'cosplayOverlay', 'cosplayLoading', 'btnCosplayDownload', 'Cosplay'); }

// ── Loli ─────────────────────────────────────────────────────────
function loadLoli() { loadGenericImage(API.loli, 'loliImg', 'loliPlaceholder', 'loliOverlay', 'loliLoading', 'btnLoliDownload', 'Loli'); }

// ── Neko ─────────────────────────────────────────────────────────
function loadNeko() { loadGenericImage(API.neko, 'nekoImg', 'nekoPlaceholder', 'nekoOverlay', 'nekoLoading', 'btnNekoDownload', 'Neko'); }

// ── IQC Generator ───────────────────────────────────────────────
async function generateIQC() {
  const input = document.getElementById('iqcText');
  const teks  = input.value.trim();
  if (!teks) { showToast('Teks tidak boleh kosong!', 'error'); input.focus(); return; }
  const imgEl   = document.getElementById('iqcImg');
  const ph      = document.getElementById('iqcPlaceholder');
  const ov      = document.getElementById('iqcOverlay');
  const tagText = document.getElementById('iqcTagText');
  const btn     = document.getElementById('btnIqcDownload');
  const apiUrl  = document.getElementById('iqcApiUrl').querySelector('span');
  apiUrl.textContent = `canvas/iqc?teks=${encodeURIComponent(teks)}`;
  setLoading('iqcLoading', true);
  btn.disabled = true;
  if (imgEl.src && imgEl.src.startsWith('blob:')) URL.revokeObjectURL(imgEl.src);
  try {
    const blobUrl = await fetchImageAsBlob(API.iqc(teks));
    ph.style.display = 'none'; imgEl.style.display = 'block'; ov.style.display = 'block';
    tagText.textContent = teks.length > 20 ? teks.slice(0,20) + '…' : teks;
    imgEl.style.opacity = '0'; imgEl.src = blobUrl;
    imgEl.onload = () => { imgEl.style.transition='opacity 0.4s'; imgEl.style.opacity='1'; };
    btn.disabled = false;
    showToast('Canvas IQC berhasil!', 'success');
  } catch(e) {
    showToast('Gagal: ' + e.message, 'error');
  } finally {
    setLoading('iqcLoading', false);
  }
}

// ── Jadwal Bola ──────────────────────────────────────────────────
async function loadJadwalBola() {
  const container = document.getElementById('jadwalBolaResult');
  container.innerHTML = '<div class="data-placeholder"><div class="placeholder-icon" style="animation:spin 1s linear infinite"><i class="ri-football-line"></i></div><p>Memuat jadwal…</p></div>';
  try {
    const r = await fetch(API.jadwalbola, { mode:'cors' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Gagal');
    const matches = data.data || data.result || data;
    if (!Array.isArray(matches) || matches.length === 0) { container.innerHTML = '<div class="data-placeholder"><p>Tidak ada jadwal tersedia</p></div>'; return; }
    container.innerHTML = matches.map(m => `
      <div class="bola-match">
        <div class="bola-league">${m.liga || m.league || m.kompetisi || 'Liga'}</div>
        <div class="bola-teams">
          <div class="bola-team">${m.home || m.tim1 || '-'}</div>
          <div class="bola-vs">VS</div>
          <div class="bola-team">${m.away || m.tim2 || '-'}</div>
        </div>
        <div class="bola-time">${m.tanggal || m.date || ''} ${m.waktu || m.time || m.jam || ''}</div>
      </div>
    `).join('');
    showToast('Jadwal bola dimuat!', 'success');
  } catch(e) {
    container.innerHTML = `<div class="data-placeholder"><p style="color:var(--accent-pink)">Error: ${e.message}</p></div>`;
    showToast('Gagal memuat jadwal', 'error');
  }
}

// ── Jadwal TV ─────────────────────────────────────────────────────
async function loadJadwalTV() {
  const ch = document.getElementById('tvChannel').value;
  const container = document.getElementById('jadwalTVResult');
  container.innerHTML = '<div class="data-placeholder"><div class="placeholder-icon" style="animation:spin 1s linear infinite"><i class="ri-tv-line"></i></div><p>Memuat jadwal…</p></div>';
  try {
    const r = await fetch(API.jadwaltv(ch), { mode:'cors' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Gagal');
    const list = data.data || data.result || data;
    if (!Array.isArray(list) || list.length === 0) { container.innerHTML = '<div class="data-placeholder"><p>Tidak ada jadwal tersedia</p></div>'; return; }
    container.innerHTML = list.map(item => `
      <div class="jadwal-item">
        <div class="jadwal-time">${item.jam || item.time || item.waktu || ''}</div>
        <div class="jadwal-title">${item.judul || item.title || item.acara || '-'}</div>
        ${item.genre || item.kategori ? `<div class="jadwal-sub">${item.genre || item.kategori}</div>` : ''}
      </div>
    `).join('');
    showToast(`Jadwal ${ch} dimuat!`, 'success');
  } catch(e) {
    container.innerHTML = `<div class="data-placeholder"><p style="color:var(--accent-pink)">Error: ${e.message}</p></div>`;
    showToast('Gagal memuat jadwal TV', 'error');
  }
}

// ── Screenshot Web ────────────────────────────────────────────────
async function loadSSWeb() {
  let url = document.getElementById('sswebUrl').value.trim();
  const device = document.getElementById('sswebDevice').value;
  if (!url) { showToast('Masukkan URL terlebih dahulu', 'error'); return; }
  if (!url.startsWith('http')) url = 'https://' + url;
  const imgEl = document.getElementById('sswebImg');
  const ph    = document.getElementById('sswebPlaceholder');
  const ov    = document.getElementById('sswebOverlay');
  const btn   = document.getElementById('btnSswebDownload');
  setLoading('sswebLoading', true);
  btn.disabled = true;
  if (imgEl.src && imgEl.src.startsWith('blob:')) URL.revokeObjectURL(imgEl.src);
  try {
    const blobUrl = await fetchImageAsBlob(API.ssweb(url, device));
    ph.style.display = 'none'; imgEl.style.display = 'block'; ov.style.display = 'block';
    imgEl.style.opacity = '0'; imgEl.src = blobUrl;
    imgEl.onload = () => { imgEl.style.transition='opacity 0.4s'; imgEl.style.opacity='1'; };
    btn.disabled = false;
    showToast('Screenshot berhasil!', 'success');
  } catch(e) {
    showToast('Gagal screenshot: ' + e.message, 'error');
  } finally {
    setLoading('sswebLoading', false);
  }
}

// ── Temp Mail ─────────────────────────────────────────────────────
async function createTempMail() {
  const inbox = document.getElementById('tempmailInbox');
  inbox.innerHTML = '<div class="data-placeholder"><div class="placeholder-icon" style="animation:spin 1s linear infinite"><i class="ri-mail-line"></i></div><p>Membuat email…</p></div>';
  try {
    const r = await fetch(API.tempcreate, { mode:'cors' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Gagal');
    const d = data.data || data.result || data;
    const mailbox = d.mailbox; const salt = d.salt; const cookies = JSON.stringify(d.cookies || d.cookie || []);
    tempMailData = { mailbox, salt, cookies };
    document.getElementById('tempmailAddress').textContent = mailbox;
    document.getElementById('tempmailSalt').textContent = salt ? salt.slice(0,20) + '…' : '-';
    document.getElementById('tempmailInfo').style.display = 'block';
    document.getElementById('tempmailCheckArea').style.display = 'block';
    inbox.innerHTML = '<div class="data-placeholder"><div class="placeholder-icon"><i class="ri-inbox-line"></i></div><p>Inbox kosong — tekan Cek Inbox</p></div>';
    showToast('Email berhasil dibuat!', 'success');
  } catch(e) {
    inbox.innerHTML = `<div class="data-placeholder"><p style="color:var(--accent-pink)">Error: ${e.message}</p></div>`;
    showToast('Gagal membuat email', 'error');
  }
}

async function checkTempMail() {
  if (!tempMailData) { showToast('Buat email terlebih dahulu', 'error'); return; }
  const { mailbox, salt, cookies } = tempMailData;
  const inbox = document.getElementById('tempmailInbox');
  inbox.innerHTML = '<div class="data-placeholder"><div class="placeholder-icon" style="animation:spin 1s linear infinite"><i class="ri-inbox-line"></i></div><p>Memeriksa inbox…</p></div>';
  try {
    const r = await fetch(API.tempcheck(mailbox, salt, cookies), { mode:'cors' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Gagal');
    const msgs = data.data || data.messages || data.result || [];
    if (!Array.isArray(msgs) || msgs.length === 0) {
      inbox.innerHTML = '<div class="data-placeholder"><div class="placeholder-icon"><i class="ri-inbox-line"></i></div><p>Inbox kosong</p></div>';
      showToast('Inbox kosong', 'info'); return;
    }
    inbox.innerHTML = msgs.map(m => `
      <div class="mail-message">
        <div class="mail-from">Dari: ${m.from || m.sender || '-'}</div>
        <div class="mail-subject">${m.subject || m.judul || '(tanpa subjek)'}</div>
        <div class="mail-body">${m.body || m.pesan || m.text || m.html || '(kosong)'}</div>
      </div>
    `).join('');
    showToast(`${msgs.length} pesan ditemukan`, 'success');
  } catch(e) {
    inbox.innerHTML = `<div class="data-placeholder"><p style="color:var(--accent-pink)">Error: ${e.message}</p></div>`;
    showToast('Gagal cek inbox', 'error');
  }
}

function copyText(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => showToast('Disalin!', 'success')).catch(() => showToast('Gagal menyalin', 'error'));
}

// ── HD Upscaler ───────────────────────────────────────────────────
let hdFileBase64 = null;
let hdFileType = 'image/jpeg';

function handleHdUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    hdFileBase64 = e.target.result; // data URL
    hdFileType = file.type;
    document.getElementById('hdPreviewArea').style.display = 'block';
    document.getElementById('hdResultImg').style.display = 'none';
    document.getElementById('hdResultPlaceholder').style.display = 'flex';
    document.getElementById('btnHdDownload').disabled = true;
    // Show preview in upload area
    const ua = document.getElementById('hdUploadArea');
    ua.innerHTML = `<img src="${hdFileBase64}" style="max-height:80px;border-radius:8px;margin-bottom:8px;" /><p class="upload-text">${file.name}</p><p class="upload-hint">Klik untuk ganti</p><input type="file" id="hdFileInput" accept="image/*" style="display:none" onchange="handleHdUpload(event)" />`;
    showToast('Gambar dipilih, tekan Upscale!', 'info');
  };
  reader.readAsDataURL(file);
}

async function processHD() {
  if (!hdFileBase64) { showToast('Pilih gambar terlebih dahulu', 'error'); return; }
  const imgEl = document.getElementById('hdResultImg');
  const ph    = document.getElementById('hdResultPlaceholder');
  const btn   = document.getElementById('btnHdDownload');
  setLoading('hdLoading', true);
  btn.disabled = true;
  // Convert dataURL to blob
  const res = await fetch(hdFileBase64);
  const blob = await res.blob();
  const formData = new FormData();
  formData.append('image', blob, 'image.jpg');
  formData.append('apikey', APIKEY);
  try {
    const r = await fetch(API.hd, { method:'POST', mode:'cors', body: formData });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const resultBlob = await r.blob();
    const blobUrl = URL.createObjectURL(resultBlob);
    ph.style.display = 'none';
    imgEl.style.display = 'block';
    imgEl.style.opacity = '0'; imgEl.src = blobUrl;
    imgEl.onload = () => { imgEl.style.transition='opacity 0.4s'; imgEl.style.opacity='1'; };
    btn.disabled = false;
    showToast('HD Upscale berhasil!', 'success');
  } catch(e) {
    showToast('Gagal upscale: ' + e.message, 'error');
  } finally {
    setLoading('hdLoading', false);
  }
}

// ── Download ──────────────────────────────────────────────────────
function downloadImage(imgId, prefix) {
  const imgEl = document.getElementById(imgId);
  if (!imgEl || !imgEl.src || imgEl.style.display === 'none') { showToast('Tidak ada gambar', 'error'); return; }
  const a = document.createElement('a');
  a.href = imgEl.src; a.download = `${prefix}-${Date.now()}.jpg`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast('Download dimulai!', 'success');
}

// ── IQC Input char count ───────────────────────────────────────────
(function() {
  const input = document.getElementById('iqcText');
  const cc    = document.getElementById('charCount');
  const apiUrl = document.getElementById('iqcApiUrl')?.querySelector('span');
  if (!input) return;
  input.addEventListener('input', () => {
    cc.textContent = `${input.value.length}/80`;
    if (apiUrl) apiUrl.textContent = input.value.trim() ? `canvas/iqc?teks=${encodeURIComponent(input.value.trim())}` : 'Masukkan teks untuk melihat URL';
  });
  input.addEventListener('keydown', (e) => { if(e.key==='Enter') generateIQC(); });
})();

// ── Particles ─────────────────────────────────────────────────────
(function() {
  const c = document.getElementById('bgParticles');
  if (!c) return;
  const colors = ['#3b82f6','#8b5cf6','#22d3ee','#a855f7','#f472b6'];
  const count = window.innerWidth < 600 ? 14 : 24;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random()*2.5+1; const color = colors[Math.floor(Math.random()*colors.length)];
    const left = Math.random()*100; const dur = Math.random()*18+10; const delay = Math.random()*-dur;
    const op = (Math.random()*0.2+0.07).toFixed(2);
    p.style.cssText = `width:${size}px;height:${size}px;background:${color};left:${left}%;bottom:-10px;box-shadow:0 0 ${size*3}px ${color};--dur:${dur}s;--delay:${delay}s;--max-op:${op};`;
    c.appendChild(p);
  }
})();

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const first = document.getElementById('section-papayang');
  if (first) { first.style.display='block'; first.classList.add('active'); }
  showToast('Selamat datang di AnimeVault! 🎌', 'info');
});
