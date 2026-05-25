/* =============================================
   NEXAVERSE — app.js
   Vanilla JavaScript — Clean Modular Code
============================================= */

'use strict';

/* ============ CONSTANTS ============ */
const API_KEY = 'mykey111';
const BASE_URL = 'https://api.theresav.biz.id';
const FALLBACK_IMG = 'https://placehold.co/400x225/0f0f1a/00f5ff?text=NexaVerse';
const FALLBACK_HERO_IMG = 'https://placehold.co/200x200/0f0f1a/bf00ff?text=MLBB';
const FALLBACK_ROBLOX_IMG = 'https://placehold.co/320x180/0f0f1a/00f5ff?text=Roblox';

const API = {
  sindonews: `${BASE_URL}/news/sindonews?apikey=${API_KEY}`,
  merdeka:   `${BASE_URL}/news/merdeka?apikey=${API_KEY}`,
  kompas:    `${BASE_URL}/news/kompas?apikey=${API_KEY}`,
  detik:     `${BASE_URL}/news/detik?apikey=${API_KEY}`,
  cnn:       `${BASE_URL}/news/cnn?apikey=${API_KEY}`,
  gempa:     `${BASE_URL}/info/gempa?apikey=${API_KEY}`,
  weather:   (q) => `${BASE_URL}/info/weather?apikey=${API_KEY}&query=${encodeURIComponent(q)}`,
  bluearchive: `${BASE_URL}/image/bluearchive?apikey=${API_KEY}`,
  jiso:      `${BASE_URL}/image/jiso?apikey=${API_KEY}`,
  lisa:      `${BASE_URL}/image/lisa?apikey=${API_KEY}`,
  loli:      `https://api-faa.my.id/faa/loli`,
  heroes:    `${BASE_URL}/game/mlbb/heroes?apikey=${API_KEY}`,
  counter:   (q) => `${BASE_URL}/game/mlbb/counter?apikey=${API_KEY}&query=${encodeURIComponent(q)}`,
  build:     `${BASE_URL}/game/ml/build?apikey=${API_KEY}`,
  roblox:    `${BASE_URL}/game/roblox?apikey=${API_KEY}`,
};

/* ============ STATE ============ */
let currentPage = localStorage.getItem('nexaverse_page') || 'berita';
let currentNewsSource = localStorage.getItem('nexaverse_news_source') || 'sindonews';
let currentImageSource = localStorage.getItem('nexaverse_image_source') || 'bluearchive';
let currentGameTab = localStorage.getItem('nexaverse_game_tab') || 'heroes';
let allHeroes = [];
let allNews = [];
let searchDebounceTimer = null;
let heroSearchDebounceTimer = null;
let heroesLoaded = false;
let buildLoaded = false;
let robloxLoaded = false;

/* ============ UTILITY FUNCTIONS ============ */

async function fetchWithRetry(url, retries = 2, delay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i < retries) {
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

function safe(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  return String(val).trim() || fallback;
}

function safeArr(val) {
  return Array.isArray(val) ? val : [];
}

function truncate(str, len = 120) {
  const s = safe(str);
  return s.length > len ? s.slice(0, len) + '...' : s;
}

function imgFallback(el, fallback) {
  el.onerror = () => { el.src = fallback; el.onerror = null; };
}

function debounce(fn, wait = 350) {
  return (...args) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => fn(...args), wait);
  };
}

function debounceHero(fn, wait = 350) {
  return (...args) => {
    clearTimeout(heroSearchDebounceTimer);
    heroSearchDebounceTimer = setTimeout(() => fn(...args), wait);
  };
}

/* ============ TOAST ============ */

function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

/* ============ SPLASH SCREEN ============ */

function initSplash() {
  const particles = document.getElementById('splash-particles');
  if (particles) {
    const colors = ['#00f5ff', '#bf00ff', '#ff006e', '#00ff88'];
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left:${Math.random()*100}%;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        animation-duration:${4+Math.random()*8}s;
        animation-delay:${Math.random()*4}s;
        width:${1+Math.random()*3}px;
        height:${1+Math.random()*3}px;
        box-shadow: 0 0 6px currentColor;
      `;
      particles.appendChild(p);
    }
  }

  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    const app = document.getElementById('app');
    if (splash) splash.classList.add('hidden');
    if (app) { app.style.opacity = '1'; app.style.transition = 'opacity 0.5s ease'; }
    initApp();
  }, 2200);
}

/* ============ PAGE SWITCHING ============ */

function switchPage(page) {
  // Update state
  currentPage = page;
  localStorage.setItem('nexaverse_page', page);

  // Pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active-page');

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // Lazy load
  if (page === 'gambar' && currentImageSource) loadImages(currentImageSource);
  if (page === 'game') initGameTab(currentGameTab);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============ INIT APP ============ */

function initApp() {
  // Restore page
  switchPage(currentPage);

  // Berita
  initNewsTabs();
  loadNews(currentNewsSource);
  loadGempa();
  initWeatherSearch();

  // Image tabs
  initImageTabs();

  // Game tabs
  initGameTabs();

  // Scroll to top
  initScrollTop();

  // Refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.querySelector('i').classList.add('spinning');
      refreshCurrentPage();
      setTimeout(() => refreshBtn.querySelector('i').classList.remove('spinning'), 800);
    });
  }

  // Enter key on weather
  const weatherInput = document.getElementById('weather-input');
  if (weatherInput) weatherInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadWeather(); });

  // Enter key on counter
  const counterInput = document.getElementById('counter-input');
  if (counterInput) counterInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadCounter(); });
}

function refreshCurrentPage() {
  if (currentPage === 'berita') {
    loadNews(currentNewsSource, true);
    loadGempa();
  } else if (currentPage === 'gambar') {
    loadImages(currentImageSource, true);
  } else if (currentPage === 'game') {
    if (currentGameTab === 'heroes') { heroesLoaded = false; loadHeroes(); }
    else if (currentGameTab === 'build') { buildLoaded = false; loadBuild(); }
    else if (currentGameTab === 'roblox') { robloxLoaded = false; loadRoblox(); }
  }
}

/* ============ SCROLL TO TOP ============ */

function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });
}

/* ============ NEWS ============ */

function initNewsTabs() {
  const tabs = document.querySelectorAll('#news-tabs .tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentNewsSource = btn.dataset.source;
      localStorage.setItem('nexaverse_news_source', currentNewsSource);
      loadNews(currentNewsSource);
    });
  });

  // Restore active tab
  tabs.forEach(t => { if (t.dataset.source === currentNewsSource) t.classList.add('active'); });

  // Search
  const searchEl = document.getElementById('news-search');
  if (searchEl) {
    const debouncedFilter = debounce(() => filterNews(searchEl.value));
    searchEl.addEventListener('input', debouncedFilter);
  }
}

async function loadNews(source, forceRefresh = false) {
  currentNewsSource = source;
  const skeleton = document.getElementById('news-skeleton');
  const content = document.getElementById('news-content');
  const empty = document.getElementById('news-empty');
  const error = document.getElementById('news-error');

  if (!skeleton || !content) return;

  skeleton.style.display = 'grid';
  content.classList.add('hidden');
  empty.classList.add('hidden');
  error.classList.add('hidden');
  content.innerHTML = '';
  allNews = [];

  try {
    const data = await fetchWithRetry(API[source] || API.sindonews);
    const items = safeArr(data?.data || data?.result || data?.news || data?.articles || data);

    skeleton.style.display = 'none';
    content.classList.remove('hidden');

    if (items.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    allNews = items;
    renderNews(allNews);
    showToast(`${items.length} berita dimuat`, 'success');

  } catch (err) {
    skeleton.style.display = 'none';
    error.classList.remove('hidden');
    showToast('Gagal memuat berita', 'error');
  }
}

function renderNews(items) {
  const content = document.getElementById('news-content');
  const empty = document.getElementById('news-empty');
  if (!content) return;

  if (!items || items.length === 0) {
    content.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  content.innerHTML = items.map((item, i) => {
    const title = safe(item?.title || item?.judul, 'Tanpa Judul');
    const desc = truncate(safe(item?.description || item?.desc || item?.content || item?.ringkasan, 'Tidak ada deskripsi'), 130);
    const thumb = safe(item?.thumbnail || item?.image || item?.img || item?.urlToImage, FALLBACK_IMG);
    const url = safe(item?.url || item?.link || item?.source_url, '#');
    const date = safe(item?.pubDate || item?.date || item?.published_at || item?.waktu, '');
    const source = currentNewsSource.toUpperCase();

    return `
      <article class="news-card glass" style="animation-delay:${i * 0.04}s; animation: fadeInUp 0.4s ease ${i*0.04}s both">
        <div class="news-thumb-wrap">
          <img class="news-thumb" src="${thumb}" alt="${title}" loading="lazy"
               onerror="this.src='${FALLBACK_IMG}'; this.onerror=null" />
          <span class="news-source-badge">${source}</span>
        </div>
        <div class="news-body">
          <h3 class="news-title">${title}</h3>
          <p class="news-desc">${desc}</p>
          <div class="news-footer">
            <span class="news-date"><i class="fas fa-clock"></i>${date ? formatDate(date) : 'Terkini'}</span>
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="news-read-btn">
              Baca <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </article>`;
  }).join('');
}

function filterNews(query) {
  if (!query || !query.trim()) {
    renderNews(allNews);
    return;
  }
  const q = query.toLowerCase();
  const filtered = allNews.filter(item => {
    const title = safe(item?.title || item?.judul).toLowerCase();
    const desc = safe(item?.description || item?.desc || item?.content || item?.ringkasan).toLowerCase();
    return title.includes(q) || desc.includes(q);
  });
  renderNews(filtered);
}

function formatDate(str) {
  try {
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return str; }
}

/* ============ GEMPA ============ */

async function loadGempa() {
  const content = document.getElementById('gempa-content');
  const timeEl = document.getElementById('gempa-time');
  if (!content) return;

  content.innerHTML = `
    <div class="skeleton-line w-3/4"></div>
    <div class="skeleton-line w-1/2"></div>
    <div class="skeleton-line w-2/3"></div>`;

  try {
    const data = await fetchWithRetry(API.gempa);
    const g = data?.data || data?.result || data?.gempa || data;
    const info = Array.isArray(g) ? g[0] : g;

    const lokasi = safe(info?.lokasi || info?.wilayah || info?.location, 'Tidak diketahui');
    const mag = safe(info?.magnitude || info?.mag || info?.magnitudo, '-');
    const kedalaman = safe(info?.kedalaman || info?.depth, '-');
    const waktu = safe(info?.waktu || info?.time || info?.tanggal, '-');
    const potensi = safe(info?.potensi || info?.tsunami, 'Tidak ada informasi');

    if (timeEl) timeEl.textContent = waktu;

    const isTsunami = potensi.toLowerCase().includes('tsunami') || potensi.toLowerCase().includes('berpotensi');
    const badgeClass = isTsunami ? 'badge-danger' : parseFloat(mag) >= 5 ? 'badge-warning' : 'badge-safe';

    content.innerHTML = `
      <div class="gempa-row"><i class="fas fa-map-marker-alt"></i><span class="gempa-label">Lokasi</span><span class="gempa-value" style="font-size:0.72rem">${truncate(lokasi, 40)}</span></div>
      <div class="gempa-row"><i class="fas fa-chart-line"></i><span class="gempa-label">Magnitudo</span><span class="gempa-value">${mag} SR</span></div>
      <div class="gempa-row"><i class="fas fa-layer-group"></i><span class="gempa-label">Kedalaman</span><span class="gempa-value">${kedalaman}</span></div>
      <div class="gempa-row"><i class="fas fa-exclamation-triangle"></i><span class="gempa-label">Potensi</span><span class="gempa-badge ${badgeClass}">${truncate(potensi, 30)}</span></div>`;

  } catch {
    content.innerHTML = `<div class="error-state" style="padding:0.5rem;gap:0.3rem;font-size:0.75rem"><i class="fas fa-exclamation-triangle" style="font-size:1rem"></i>Gagal memuat data gempa</div>`;
  }
}

/* ============ WEATHER ============ */

function initWeatherSearch() {
  const input = document.getElementById('weather-input');
  if (!input) return;
  const savedCity = localStorage.getItem('nexaverse_last_city');
  if (savedCity) {
    input.value = savedCity;
    loadWeather();
  }
}

async function loadWeather() {
  const input = document.getElementById('weather-input');
  const content = document.getElementById('weather-content');
  if (!input || !content) return;

  const query = input.value.trim();
  if (!query) { showToast('Masukkan nama kota', 'info'); return; }

  localStorage.setItem('nexaverse_last_city', query);

  content.innerHTML = `<div class="skeleton-line w-3/4"></div><div class="skeleton-line w-1/2"></div>`;

  try {
    const data = await fetchWithRetry(API.weather(query));
    const w = data?.data || data?.result || data?.weather || data?.current || data;

    const city = safe(w?.name || w?.city || w?.location || query, query);
    const temp = safe(w?.temperature || w?.temp || w?.temp_c || (w?.main?.temp), '-');
    const desc = safe(w?.description || w?.condition || w?.weather_desc || w?.weather?.[0]?.description, '-');
    const humidity = safe(w?.humidity || w?.kelembapan || w?.main?.humidity, '-');
    const wind = safe(w?.wind_speed || w?.wind || w?.angin || w?.wind?.speed, '-');
    const feels = safe(w?.feels_like || w?.feelslike_c || w?.main?.feels_like, '');

    const weatherIcon = getWeatherIcon(desc);

    content.innerHTML = `
      <div class="weather-card">
        <div class="weather-main">
          <span class="weather-icon-big">${weatherIcon}</span>
          <div>
            <div class="weather-city">${city}</div>
            <div class="weather-temp">${parseFloat(temp).toFixed(0)}°C</div>
            <div class="weather-desc">${desc}</div>
          </div>
        </div>
        <div class="weather-details">
          <span class="weather-detail"><i class="fas fa-tint"></i>${humidity}%</span>
          <span class="weather-detail"><i class="fas fa-wind"></i>${wind} km/h</span>
          ${feels ? `<span class="weather-detail"><i class="fas fa-thermometer-half"></i>Feels ${parseFloat(feels).toFixed(0)}°</span>` : ''}
        </div>
      </div>`;
    showToast(`Cuaca ${city} dimuat`, 'success');

  } catch {
    content.innerHTML = `<div class="weather-empty"><i class="fas fa-exclamation-triangle"></i><span>Kota tidak ditemukan</span></div>`;
    showToast('Kota tidak ditemukan', 'error');
  }
}

function getWeatherIcon(desc) {
  const d = safe(desc).toLowerCase();
  if (d.includes('hujan') || d.includes('rain')) return '🌧️';
  if (d.includes('storm') || d.includes('badai') || d.includes('thunder')) return '⛈️';
  if (d.includes('snow') || d.includes('salju')) return '❄️';
  if (d.includes('cloud') || d.includes('berawan') || d.includes('mendung')) return '☁️';
  if (d.includes('fog') || d.includes('mist') || d.includes('kabut')) return '🌫️';
  if (d.includes('sunny') || d.includes('clear') || d.includes('cerah')) return '☀️';
  if (d.includes('partly') || d.includes('sebagian')) return '⛅';
  return '🌤️';
}

/* ============ IMAGES ============ */

function initImageTabs() {
  const tabs = document.querySelectorAll('#image-tabs .tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentImageSource = btn.dataset.source;
      localStorage.setItem('nexaverse_image_source', currentImageSource);
      loadImages(currentImageSource);
    });
  });
  tabs.forEach(t => { if (t.dataset.source === currentImageSource) t.classList.add('active'); });
}

async function loadImages(source, forceRefresh = false) {
  currentImageSource = source;
  const skeleton = document.getElementById('image-skeleton');
  const masonry = document.getElementById('image-masonry');
  const empty = document.getElementById('image-empty');
  const error = document.getElementById('image-error');
  if (!masonry) return;

  skeleton.classList.remove('hidden');
  masonry.classList.add('hidden');
  empty.classList.add('hidden');
  error.classList.add('hidden');
  masonry.innerHTML = '';

  try {
    const url = source === 'loli' ? API.loli : API[source];
    const data = await fetchWithRetry(url);

    // Flexible response parsing
    let images = [];
    if (Array.isArray(data)) {
      images = data;
    } else if (data?.data && Array.isArray(data.data)) {
      images = data.data;
    } else if (data?.result && Array.isArray(data.result)) {
      images = data.result;
    } else if (data?.images && Array.isArray(data.images)) {
      images = data.images;
    } else if (typeof data === 'object') {
      // Try to find any array in the response
      const keys = Object.keys(data);
      for (const k of keys) {
        if (Array.isArray(data[k]) && data[k].length > 0) {
          images = data[k];
          break;
        }
      }
    }

    // Normalize to URL strings
    const imgUrls = images.map(item => {
      if (typeof item === 'string') return item;
      return safe(item?.url || item?.image || item?.img || item?.link || item?.source || '');
    }).filter(u => u && (u.startsWith('http') || u.startsWith('//')));

    skeleton.classList.add('hidden');

    if (imgUrls.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    masonry.classList.remove('hidden');
    masonry.innerHTML = imgUrls.map((url, i) => `
      <div class="masonry-item" style="animation-delay:${i*0.05}s" onclick="openImageModal('${url}')">
        <img class="masonry-img" src="${url}" alt="Image ${i+1}" loading="lazy"
             onerror="this.parentElement.remove(); null" />
        <div class="masonry-overlay">
          <div class="masonry-zoom-btn"><i class="fas fa-expand"></i></div>
        </div>
      </div>`).join('');

    showToast(`${imgUrls.length} gambar dimuat`, 'success');

  } catch {
    skeleton.classList.add('hidden');
    error.classList.remove('hidden');
    showToast('Gagal memuat gambar', 'error');
  }
}

function openImageModal(url) {
  const modal = document.getElementById('image-modal');
  const imgEl = document.getElementById('img-modal-src');
  const dlLink = document.getElementById('img-download-link');
  if (!modal || !imgEl) return;

  imgEl.src = url;
  if (dlLink) dlLink.href = url;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  const modal = document.getElementById('image-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal on ESC
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeImageModal(); });

/* ============ GAME TABS ============ */

function initGameTabs() {
  const tabs = document.querySelectorAll('#game-tabs .tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentGameTab = btn.dataset.source;
      localStorage.setItem('nexaverse_game_tab', currentGameTab);
      initGameTab(currentGameTab);
    });
  });
  tabs.forEach(t => { if (t.dataset.source === currentGameTab) t.classList.add('active'); });
}

function initGameTab(tab) {
  // Show/hide sub-sections
  ['heroes', 'counter', 'build', 'roblox'].forEach(t => {
    const el = document.getElementById(`game-${t}`);
    if (el) el.classList.toggle('hidden', t !== tab);
  });

  if (tab === 'heroes' && !heroesLoaded) loadHeroes();
  if (tab === 'build' && !buildLoaded) loadBuild();
  if (tab === 'roblox' && !robloxLoaded) loadRoblox();
}

/* ============ HEROES ============ */

async function loadHeroes() {
  const skeleton = document.getElementById('heroes-skeleton');
  const grid = document.getElementById('heroes-grid');
  const empty = document.getElementById('heroes-empty');
  const error = document.getElementById('heroes-error');
  if (!grid) return;

  skeleton.classList.remove('hidden');
  grid.classList.add('hidden');
  empty.classList.add('hidden');
  error.classList.add('hidden');
  grid.innerHTML = '';

  try {
    const data = await fetchWithRetry(API.heroes);
    const heroes = safeArr(data?.data || data?.result || data?.heroes || data);

    heroesLoaded = true;
    allHeroes = heroes;

    skeleton.classList.add('hidden');

    if (heroes.length === 0) { empty.classList.remove('hidden'); return; }

    grid.classList.remove('hidden');
    renderHeroes(allHeroes);

    // Hero search
    const searchEl = document.getElementById('hero-search');
    if (searchEl) {
      const debouncedHeroFilter = debounceHero((e) => filterHeroes(e.target.value));
      searchEl.removeEventListener('input', searchEl._handler);
      searchEl._handler = debouncedHeroFilter;
      searchEl.addEventListener('input', debouncedHeroFilter);
    }

    showToast(`${heroes.length} hero MLBB dimuat`, 'success');

  } catch {
    heroesLoaded = false;
    skeleton.classList.add('hidden');
    error.classList.remove('hidden');
    showToast('Gagal memuat hero', 'error');
  }
}

function renderHeroes(heroes) {
  const grid = document.getElementById('heroes-grid');
  const empty = document.getElementById('heroes-empty');
  if (!grid) return;

  if (!heroes || heroes.length === 0) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.classList.remove('hidden');

  grid.innerHTML = heroes.map((hero, i) => {
    const name = safe(hero?.name || hero?.nama || hero?.hero_name, `Hero ${i+1}`);
    const role = safe(hero?.role || hero?.roles || hero?.type, 'Unknown');
    const img = safe(hero?.image || hero?.img || hero?.icon || hero?.photo, FALLBACK_HERO_IMG);
    const roleClass = getRoleClass(role);

    return `
      <div class="hero-card glass" style="animation-delay:${i*0.03}s">
        <div class="hero-img-wrap">
          <img class="hero-img" src="${img}" alt="${name}" loading="lazy"
               onerror="this.src='${FALLBACK_HERO_IMG}'; this.onerror=null" />
          <span class="hero-role-badge ${roleClass}">${role}</span>
        </div>
        <div class="hero-info">
          <div class="hero-name">${name}</div>
          <div class="hero-role-text">${role}</div>
        </div>
      </div>`;
  }).join('');
}

function filterHeroes(query) {
  if (!query || !query.trim()) { renderHeroes(allHeroes); return; }
  const q = query.toLowerCase();
  const filtered = allHeroes.filter(h => {
    const name = safe(h?.name || h?.nama || h?.hero_name).toLowerCase();
    const role = safe(h?.role || h?.roles).toLowerCase();
    return name.includes(q) || role.includes(q);
  });
  renderHeroes(filtered);
}

function getRoleClass(role) {
  const r = safe(role).toLowerCase();
  if (r.includes('tank')) return 'role-tank';
  if (r.includes('fighter')) return 'role-fighter';
  if (r.includes('assassin')) return 'role-assassin';
  if (r.includes('mage')) return 'role-mage';
  if (r.includes('marksman') || r.includes('mm')) return 'role-marksman';
  if (r.includes('support')) return 'role-support';
  return 'role-tank';
}

/* ============ COUNTER ============ */

async function loadCounter() {
  const input = document.getElementById('counter-input');
  const result = document.getElementById('counter-result');
  if (!input || !result) return;

  const query = input.value.trim();
  if (!query) { showToast('Masukkan nama hero', 'info'); return; }

  result.innerHTML = `
    <div style="padding:1rem">
      <div class="skeleton-line w-1/3 mb-4" style="height:1.5rem"></div>
      <div class="skeleton-line w-full"></div>
      <div class="skeleton-line w-4/5"></div>
      <div class="skeleton-line w-3/5"></div>
    </div>`;

  try {
    const data = await fetchWithRetry(API.counter(query));
    const counters = safeArr(data?.data || data?.result || data?.counter || data?.counters || data);

    if (counters.length === 0) {
      result.innerHTML = `<div class="empty-state"><i class="fas fa-user-ninja"></i><p>Tidak ada data counter untuk "${query}"</p></div>`;
      return;
    }

    result.innerHTML = `
      <div class="counter-section-title"><i class="fas fa-chess-king"></i>Counter untuk ${query}</div>
      ${counters.map((c, i) => {
        const heroName = safe(c?.name || c?.hero || c?.nama || c?.counter_hero || (typeof c === 'string' ? c : ''), `Hero ${i+1}`);
        const reason = safe(c?.reason || c?.alasan || c?.desc || c?.description || c?.tip, 'Hero ini efektif sebagai counter.');
        return `
          <div class="counter-result-card glass" style="animation-delay:${i*0.06}s">
            <div class="counter-hero-name"><i class="fas fa-sword" style="font-size:0.8rem"></i> ${heroName}</div>
            <div class="counter-reason">${reason}</div>
          </div>`;
      }).join('')}`;

    showToast(`Counter ${query} ditemukan`, 'success');

  } catch {
    result.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat data counter</p><button onclick="loadCounter()" class="retry-btn">Coba Lagi</button></div>`;
    showToast('Gagal memuat counter', 'error');
  }
}

/* ============ BUILD ============ */

async function loadBuild() {
  const skeleton = document.getElementById('build-skeleton');
  const content = document.getElementById('build-content');
  const error = document.getElementById('build-error');
  if (!content) return;

  skeleton.classList.remove('hidden');
  content.innerHTML = '';
  error.classList.add('hidden');

  try {
    const data = await fetchWithRetry(API.build);
    const builds = safeArr(data?.data || data?.result || data?.builds || (Array.isArray(data) ? data : [data]));

    buildLoaded = true;
    skeleton.classList.add('hidden');

    if (builds.length === 0) {
      content.innerHTML = `<div class="empty-state"><i class="fas fa-hammer"></i><p>Tidak ada data build</p></div>`;
      return;
    }

    const build = builds[0];
    const heroName = safe(build?.hero || build?.name || build?.nama || build?.hero_name, 'Mobile Legends Build');
    const items = safeArr(build?.items || build?.item || build?.build_items || build?.equipment);
    const emblem = safe(build?.emblem || build?.emblem_name, '');
    const spell = safe(build?.spell || build?.battle_spell, '');
    const tips = safe(build?.tips || build?.gameplay_tips || build?.description || build?.desc, '');

    content.innerHTML = `
      <div class="build-hero-name"><i class="fas fa-hammer" style="font-size:0.9rem"></i> ${heroName}</div>
      
      ${items.length > 0 ? `
      <div class="build-section">
        <div class="build-section-label"><i class="fas fa-shield-alt"></i>Item Build</div>
        <div class="build-items-grid">
          ${items.map((item, i) => {
            const itemName = typeof item === 'string' ? item : safe(item?.name || item?.nama || item?.item_name, `Item ${i+1}`);
            return `<div class="build-item glass"><span class="build-item-num">${i+1}</span>${itemName}</div>`;
          }).join('')}
        </div>
      </div>` : ''}

      ${emblem ? `
      <div class="build-section">
        <div class="build-section-label"><i class="fas fa-medal"></i>Emblem</div>
        <div class="build-items-grid">
          <div class="build-item glass"><i class="fas fa-medal" style="color:var(--neon-cyan);font-size:0.75rem"></i>${emblem}</div>
        </div>
      </div>` : ''}

      ${spell ? `
      <div class="build-section">
        <div class="build-section-label"><i class="fas fa-magic"></i>Battle Spell</div>
        <div class="build-items-grid">
          <div class="build-item glass"><i class="fas fa-bolt" style="color:var(--neon-purple);font-size:0.75rem"></i>${spell}</div>
        </div>
      </div>` : ''}

      ${tips ? `
      <div class="build-section">
        <div class="build-section-label"><i class="fas fa-lightbulb"></i>Tips Gameplay</div>
        <div class="build-tips">${tips}</div>
      </div>` : ''}

      ${builds.length > 1 ? `
      <div class="build-section-label" style="margin-top:1.5rem"><i class="fas fa-list"></i>Build Lainnya (${builds.length - 1})</div>
      ${builds.slice(1).map((b, i) => {
        const bName = safe(b?.hero || b?.name || b?.nama, `Build ${i+2}`);
        const bItems = safeArr(b?.items || b?.item).map(it => typeof it === 'string' ? it : safe(it?.name, '')).filter(Boolean);
        return `
          <div class="counter-result-card glass">
            <div class="counter-hero-name">${bName}</div>
            <div class="build-items-grid" style="margin-top:0.5rem">
              ${bItems.slice(0,6).map((item,j) => `<div class="build-item glass"><span class="build-item-num">${j+1}</span>${item}</div>`).join('')}
            </div>
          </div>`;
      }).join('')}` : ''}`;

    showToast('Build dimuat', 'success');

  } catch {
    buildLoaded = false;
    skeleton.classList.add('hidden');
    error.classList.remove('hidden');
    showToast('Gagal memuat build', 'error');
  }
}

/* ============ ROBLOX ============ */

async function loadRoblox() {
  const skeleton = document.getElementById('roblox-skeleton');
  const grid = document.getElementById('roblox-grid');
  const error = document.getElementById('roblox-error');
  if (!grid) return;

  skeleton.classList.remove('hidden');
  grid.classList.add('hidden');
  error.classList.add('hidden');
  grid.innerHTML = '';

  try {
    const data = await fetchWithRetry(API.roblox);
    const games = safeArr(data?.data || data?.result || data?.games || data?.list || data);

    robloxLoaded = true;
    skeleton.classList.add('hidden');

    if (games.length === 0) {
      grid.classList.remove('hidden');
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-gamepad"></i><p>Tidak ada data game Roblox</p></div>`;
      return;
    }

    grid.classList.remove('hidden');
    grid.innerHTML = games.map((game, i) => {
      const title = safe(game?.name || game?.title || game?.game_name, `Game ${i+1}`);
      const desc = truncate(safe(game?.description || game?.desc, 'Game Roblox populer'), 80);
      const thumb = safe(game?.thumbnail || game?.image || game?.icon || game?.img, FALLBACK_ROBLOX_IMG);
      const players = safe(game?.playing || game?.players || game?.player_count || game?.activePlayerCount, '');
      const url = safe(game?.url || game?.link || game?.game_url, '#');

      return `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="roblox-card glass" style="text-decoration:none;display:block;animation-delay:${i*0.05}s">
          <div class="roblox-thumb-wrap">
            <img class="roblox-thumb" src="${thumb}" alt="${title}" loading="lazy"
                 onerror="this.src='${FALLBACK_ROBLOX_IMG}'; this.onerror=null" />
            ${players ? `<span class="roblox-players-badge"><i class="fas fa-user" style="font-size:0.55rem"></i> ${formatNumber(players)}</span>` : ''}
          </div>
          <div class="roblox-body">
            <div class="roblox-title">${title}</div>
            <div class="roblox-desc">${desc}</div>
          </div>
        </a>`;
    }).join('');

    showToast(`${games.length} game Roblox dimuat`, 'success');

  } catch {
    robloxLoaded = false;
    skeleton.classList.add('hidden');
    error.classList.remove('hidden');
    showToast('Gagal memuat Roblox', 'error');
  }
}

function formatNumber(num) {
  const n = parseInt(String(num).replace(/\D/g, ''));
  if (isNaN(n)) return num;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

/* ============ BOOTSTRAP ============ */

document.addEventListener('DOMContentLoaded', () => {
  initSplash();
});
