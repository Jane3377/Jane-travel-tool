/* ================================================================
   weather.js — 天氣（Open-Meteo，免金鑰）
   - 內建城市座標；出發前 ≤14 天才顯示；降雨 ≥70% 觸發雨天備案提示
   ================================================================ */

/* ── 內建城市座標（對應 CITY_MAP） ── */
const CITY_COORDS = {
  // 韓國
  '首爾': [37.57, 126.98], '釜山': [35.18, 129.08], '濟州': [33.50, 126.53], '大邱': [35.87, 128.60], '仁川': [37.46, 126.71],
  // 日本
  '東京': [35.68, 139.69], '大阪': [34.69, 135.50], '京都': [35.01, 135.77], '福岡': [33.59, 130.40], '札幌': [43.06, 141.35], '沖繩': [26.21, 127.68], '名古屋': [35.18, 136.91],
  // 中國
  '上海': [31.23, 121.47], '北京': [39.90, 116.41], '成都': [30.57, 104.07], '西安': [34.34, 108.94], '杭州': [30.27, 120.15], '廣州': [23.13, 113.26], '深圳': [22.54, 114.06], '蘇州': [31.30, 120.58], '重慶': [29.56, 106.55], '桂林': [25.27, 110.29],
  // 泰國 / 越南 / 星港
  '曼谷': [13.76, 100.50], '清邁': [18.79, 98.98], '普吉': [7.88, 98.39],
  '胡志明': [10.82, 106.63], '河內': [21.03, 105.85], '峴港': [16.05, 108.22],
  '新加坡': [1.35, 103.82], '香港': [22.32, 114.17],
  // 美國 / 英國
  '紐約': [40.71, -74.01], '洛杉磯': [34.05, -118.24], '舊金山': [37.77, -122.42], '西雅圖': [47.61, -122.33], '拉斯維加斯': [36.17, -115.14],
  '倫敦': [51.51, -0.13], '曼徹斯特': [53.48, -2.24], '愛丁堡': [55.95, -3.19]
};

const WX_WINDOW_DAYS = 14;   // 出發前幾天開始顯示
const WX_RAIN_LEVEL  = 70;   // 降雨機率 ≥ 此值 → 雨天備案提示
const WX_TTL_MS      = 3 * 60 * 60 * 1000;  // 快取 3 小時

let _wxMem     = { key: '', data: null };
let _wxLoading = '';

/* ── WMO 天氣代碼 → 圖示/中文 ── */
function weatherCodeInfo(c) {
  c = Number(c);
  if (c === 0) return { icon: '☀️', label: '晴' };
  if (c === 1 || c === 2) return { icon: '🌤', label: '多雲時晴' };
  if (c === 3) return { icon: '☁️', label: '陰' };
  if (c === 45 || c === 48) return { icon: '🌫', label: '霧' };
  if (c >= 51 && c <= 57) return { icon: '🌦', label: '毛毛雨' };
  if (c >= 61 && c <= 67) return { icon: '🌧', label: '雨' };
  if (c >= 71 && c <= 77) return { icon: '❄️', label: '雪' };
  if (c >= 80 && c <= 82) return { icon: '🌦', label: '陣雨' };
  if (c >= 85 && c <= 86) return { icon: '🌨', label: '陣雪' };
  if (c >= 95) return { icon: '⛈', label: '雷雨' };
  return { icon: '🌡', label: '' };
}

/* ── 目的地座標（依 city，其次 dest） ── */
function _weatherCoords() {
  const city = (data.trip?.city || '').trim();
  const dest = (data.trip?.dest || '').trim();
  const c = CITY_COORDS[city] || CITY_COORDS[dest];
  return c ? { lat: c[0], lng: c[1] } : null;
}

function _wxToday() { return formatLocalDate(new Date()); }

function _wxDayDiff(a, b) {   // b - a（天）
  const da = new Date(a + 'T00:00:00'), db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

/* ── 是否在顯示窗口內：出發前 ≤14 天、且尚未結束 ── */
function weatherWindowOk() {
  const start = data.trip?.start, end = data.trip?.end || start;
  if (!start) return false;
  const today = _wxToday();
  if (_wxDayDiff(today, end) < 0) return false;          // 整趟已過
  return _wxDayDiff(today, start) <= WX_WINDOW_DAYS;      // 出發前 14 天內
}

function _weatherRange() {
  const start = data.trip.start;
  let end = data.trip.end || start;
  const cap = formatLocalDate(new Date(Date.now() + 16 * 86400000));   // Open-Meteo 上限 ~16 天
  if (end > cap) end = cap;
  return { start, end };
}

function _wxCacheKey(coords) {
  const { start, end } = _weatherRange();
  return `janeselect_wx_${coords.lat},${coords.lng}_${start}_${end}`;
}
function _wxLoadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || (Date.now() - o.t) > WX_TTL_MS) return null;
    return o.d;
  } catch (e) { return null; }
}
function _wxSaveCache(key, d) {
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
}

async function _wxFetch(coords) {
  const { start, end } = _weatherRange();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto` +
    `&start_date=${start}&end_date=${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather http ' + res.status);
  const j = await res.json();
  const d = j.daily || {};
  const map = {};
  (d.time || []).forEach((day, i) => {
    map[day] = {
      code: d.weather_code?.[i],
      tmax: d.temperature_2m_max?.[i],
      tmin: d.temperature_2m_min?.[i],
      rain: d.precipitation_probability_max?.[i]
    };
  });
  return map;
}

/* ── 確保天氣資料就緒，就緒後重繪各處天氣 ── */
async function ensureWeather() {
  if (!weatherWindowOk()) return;
  const coords = _weatherCoords();
  if (!coords) return;
  const key = _wxCacheKey(coords);
  if (_wxMem.key === key && _wxMem.data) { paintWeather(); return; }
  const cached = _wxLoadCache(key);
  if (cached) { _wxMem = { key, data: cached }; paintWeather(); return; }
  if (_wxLoading === key) return;
  _wxLoading = key;
  try {
    const d = await _wxFetch(coords);
    _wxMem = { key, data: d };
    _wxSaveCache(key, d);
    paintWeather();
  } catch (e) {
    console.warn('weather fetch failed', e);
  } finally {
    _wxLoading = '';
  }
}

function weatherForDay(dateKey) {
  return (_wxMem.data && _wxMem.data[dateKey]) || null;
}
function weatherRainy(dateKey) {
  const w = weatherForDay(dateKey);
  return !!(w && Number(w.rain) >= WX_RAIN_LEVEL);
}

/* ── 小天氣籤 HTML（有資料才有內容） ── */
function _wxChipInner(w) {
  const info = weatherCodeInfo(w.code);
  const t = (w.tmax != null && w.tmin != null) ? `${Math.round(w.tmax)}°/${Math.round(w.tmin)}°` : '';
  const r = (w.rain != null) ? ` · ☔${w.rain}%` : '';
  return `${info.icon} ${t}${r}`;
}
// 給 render 用的佔位（資料到齊由 paintWeather 填入）
function wxSlot(dateKey, cls = '') {
  return `<span class="wxChip ${cls}" data-wx="${dateKey}"></span>`;
}
function wxRainSlot(dateKey) {
  return `<span class="wxRainBadge" data-wxrain="${dateKey}" hidden>☔ 可能下雨，考慮雨天備案</span>`;
}

/* ── 把已抓到的天氣填入所有佔位 ── */
function paintWeather() {
  document.querySelectorAll('[data-wx]').forEach(el => {
    const w = weatherForDay(el.getAttribute('data-wx'));
    el.innerHTML = w ? _wxChipInner(w) : '';
  });
  document.querySelectorAll('[data-wxrain]').forEach(el => {
    el.hidden = !weatherRainy(el.getAttribute('data-wxrain'));
  });
}

/* ── AI 打包用：各天天氣摘要文字（無資料回空字串） ── */
function weatherSummaryText() {
  if (!_wxMem.data) return '';
  const lines = (data.days || []).map(dd => {
    const w = _wxMem.data[dd.key];
    if (!w) return '';
    const info = weatherCodeInfo(w.code);
    const t = (w.tmax != null) ? `${Math.round(w.tmax)}~${Math.round(w.tmin)}°C` : '';
    const r = (w.rain != null) ? `，降雨 ${w.rain}%` : '';
    return `${dd.key} ${info.label} ${t}${r}`;
  }).filter(Boolean);
  return lines.length ? lines.join('\n') : '';
}
