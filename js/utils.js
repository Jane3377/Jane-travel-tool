/* ================================================================
   utils.js — 工具函式（無副作用，不依賴 state）
   ================================================================ */

/* ── DOM / 基本工具 ── */
function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function $(id) { return document.getElementById(id); }
function $form(id) {
  // When the FAB add-sheet is open, scope to the sheet body first.
  // This avoids getElementById returning the inline view's input (same ID, earlier in DOM).
  const overlay = document.getElementById('addSheetOverlay');
  if (overlay && !overlay.hidden) {
    const el = document.getElementById('addSheetBody')?.querySelector('[id="' + id + '"]');
    if (el) return el;
  }
  return document.getElementById(id);
}
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, m =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[m])
  );
}
function jsStr(s) {
  // Safe embedding of user text in a single-quoted JS string inside an HTML onclick attribute.
  // Escapes backslashes and single quotes so the string literal can't be broken or injected.
  return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
function fmt(n) { return Number(n || 0).toLocaleString('zh-TW'); }
function toast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1900);
}

/* ── 日期工具 ── */
function parseLocalDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatLocalDate(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}
function dateAdd(dateStr, days) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}
function dateRange(start, endInclusive) {
  const arr = [];
  let d = start;
  while (d <= endInclusive) { arr.push(d); d = dateAdd(d, 1); }
  return arr;
}
function short(k) {
  if (!k) return '';
  const [, m, d] = k.split('-');
  return `${Number(m)}/${Number(d)}`;
}
const _WDAYS = ['日','一','二','三','四','五','六'];
function shortWithDay(k) {
  if (!k) return '';
  const dt = parseLocalDate(k);
  return `${dt.getMonth()+1}/${dt.getDate()}(${_WDAYS[dt.getDay()]})`;
}
function mkDays(start, end) {
  if (!start || !end) return [];
  let i = 1;
  return dateRange(start, end).map(key => {
    return { key, label: shortWithDay(key), title: `Day ${i++}` };
  });
}
function daysBetween(a, b) {
  return Math.round((parseLocalDate(b) - parseLocalDate(a)) / 86400000);
}

function tripCountdownState() {
  const start = data.trip?.start;
  const end   = data.trip?.end;
  if (!start || !end) return null;
  const today = formatLocalDate(new Date());
  if (today < start) return { state: 'pre',    days:    daysBetween(today, start) };
  if (today <= end)  return { state: 'during', dayKey:  today, dayNum: (data.days.findIndex(d => d.key === today) + 1) || 1 };
  return               { state: 'post',   daysAgo: daysBetween(end, today) };
}

function todayPlanKey() {
  const cs = tripCountdownState();
  if (cs?.state !== 'during') return null;
  return data.days.some(d => d.key === cs.dayKey) ? cs.dayKey : null;
}

/* ── 時間工具 ── */
function addMinutes(t, min) {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  let total = h * 60 + m + Number(min || 0);
  total = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function diffMinutes(a, b) {
  if (!a || !b) return 60;
  return Math.max(15, timeToMin(b) - timeToMin(a));
}

/* ── 金額工具 ── */
function moneyTwd(item) {
  return item.mode === 'TWD'
    ? Number(item.twd || 0)
    : Math.round(Number(item.foreign || 0) * Number(data.trip.rate || 0));
}
function moneyForeign(item) {
  return item.mode === 'TWD'
    ? Math.round(Number(item.twd || 0) / Number(data.trip.rate || 1))
    : Number(item.foreign || 0);
}
function payMethodLabel(v) {
  return v === 'cash' ? '現金' : v === 'card' ? '刷卡' : v === 'transfer' ? '轉帳' : v || '未定';
}

/* ── 行程工具 ── */
function dayTitle(k) {
  const d = data.days.find(x => x.key === k);
  return d ? `${d.title}｜${shortWithDay(k)}` : k;
}
function hotelFor(k) {
  // end 是退房日（當天不算住宿），住宿夜為 start ～ end-1
  return data.hotels.find(h => k >= h.start && k < h.end);
}
function travelerName(v) {
  if (v === '共同' || v === '未定') return v;
  return data.trip.travelers[Number(v)] || v || '未定';
}
function sortedPlans(day) {
  const plans = data.plans.filter(p => p.day === day);
  if (plans.some(p => p.sortOrder != null)) {
    return plans.sort((a, b) =>
      (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) ||
      String(a.start).localeCompare(String(b.start))
    );
  }
  return plans.sort((a, b) =>
    String(a.start).localeCompare(String(b.start)) ||
    String(a.end).localeCompare(String(b.end))
  );
}
function activityIcon(type) {
  const icons = { '餐廳':'🍴','咖啡廳':'☕','購物':'🛍️','交通':'🚗','航班':'✈️','住宿':'🏨','雨天備案':'☔','其他':'✨' };
  return icons[type] || '📍';
}
function normalizePlanType(type) {
  return PLAN_TYPES.includes(type) ? type : '其他';
}
function budgetTypeFromPlanType(type) {
  const map = { '景點':'景點票券','餐廳':'餐飲','咖啡廳':'餐飲','購物':'購物','交通':'交通票券','航班':'機票','住宿':'住宿' };
  return map[normalizePlanType(type)] || '其他';
}

/* ── 目的地工具 ── */
function destName(country, city) {
  if (country === '香港' || country === '新加坡') return country;
  if (!city || city === '自訂') return country;
  return `${country}${city}`;
}
function cityOptions(country, selected) {
  const list = CITY_MAP[country] || ['自訂'];
  return list.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

/* ── 表單工具 ── */
function optsDays(selected = '') {
  return data.days.map(d =>
    `<option value="${d.key}" ${d.key === selected ? 'selected' : ''}>${shortWithDay(d.key)} ${d.title}</option>`
  ).join('');
}
function optsPayer(selected = '未定') {
  const opts = data.trip.travelers.map((n, i) => [String(i), n]);
  opts.push(['共同', '共同'], ['未定', '未定']);
  return opts.map(([val, label]) =>
    `<option value="${val}" ${val === String(selected) ? 'selected' : ''}>${esc(label)}</option>`
  ).join('');
}
function optsPayMethod(selected = '未定') {
  return [['cash','現金'],['card','刷卡'],['transfer','轉帳'],['未定','未定']]
    .map(([v, l]) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${l}</option>`)
    .join('');
}
function optsPlanTypes(selected = '景點') {
  return PLAN_TYPES.map(t =>
    `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`
  ).join('');
}

/* ── 地圖工具 ── */
function openMap(q)    { open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank'); }
function openRoute(a, b, mode) {
  const m = mode === '走路' ? 'walking' : mode === '開車/計程車' ? 'driving' : 'transit';
  open(`https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}&travelmode=${m}`, '_blank');
}
function openRateSearch() {
  open(`https://www.google.com/search?q=${encodeURIComponent((data.trip.currency || 'KRW') + ' TWD 匯率')}`, '_blank');
}

function copyText(text) {
  navigator.clipboard?.writeText(text)
    .then(() => toast("已複製"))
    .catch(() => toast("複製失敗，請手動複製"));
}

/* ── 裝置判斷 ── */
// 手機 / 平板：用來決定 PDF 匯出要自動列印或改用預覽 + 手動按鈕
function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      || window.matchMedia('(max-width:768px)').matches;
}

/* ── PDF / 列印預覽共用片段（旅日記與旅程手冊共用） ── */
const PDF_PRINT_BAR_CSS = `
  /* 預覽頁頂部列印工具列（列印時自動隱藏） */
  .pdfPrintBar{position:sticky;top:0;z-index:9999;display:flex;gap:10px;justify-content:center;
    padding:12px;background:#2f2a25;box-shadow:0 2px 10px rgba(0,0,0,.25);}
  .pdfPrintBar button{border:0;border-radius:999px;padding:11px 20px;font-size:15px;font-weight:800;
    cursor:pointer;font-family:inherit;}
  .pdfPrintBtn{background:#fff;color:#2f2a25;}
  .pdfCloseBtn{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.55)!important;}
  @media print{.pdfPrintBar{display:none!important;}}`;

const PDF_PRINT_BAR_HTML = `
  <div class="pdfPrintBar">
    <button class="pdfPrintBtn" onclick="window.print()">🖨 列印 / 存成 PDF</button>
    <button class="pdfCloseBtn" onclick="window.close()">關閉</button>
  </div>`;

// 匯出視窗載入後：強制圖片即時載入；autoPrint 時再自動跳列印
function pdfPrintScript(autoPrint) {
  return `<script>window.addEventListener('load',function(){[].forEach.call(document.images,function(img){img.loading='eager';});${autoPrint ? `var t=[];if(document.fonts&&document.fonts.ready)t.push(document.fonts.ready);[].forEach.call(document.images,function(img){if(!img.complete)t.push(new Promise(function(r){img.onload=img.onerror=r;}));});Promise.all(t).then(function(){setTimeout(window.print.bind(window),200);});` : ''}});<\/script>`;
}

/* ── 24 小時制時間選單 ── */
function timeSelHtml(id, val, onchange) {
  const [hh = '10', mm = '00'] = (val || '10:00').split(':');
  const mRound = String(Math.min(Math.round(Number(mm) / 5) * 5, 55)).padStart(2, '0');
  const ev = onchange ? ` onchange="${onchange}"` : '';
  const hours = Array.from({length: 24}, (_, i) => {
    const v = String(i).padStart(2, '0');
    return `<option value="${v}"${v === hh ? ' selected' : ''}>${v}</option>`;
  }).join('');
  const mins = Array.from({length: 12}, (_, i) => {
    const v = String(i * 5).padStart(2, '0');
    return `<option value="${v}"${v === mRound ? ' selected' : ''}>${v}</option>`;
  }).join('');
  return `<div class="timeSelWrap"><select id="${id}H"${ev}>${hours}</select><span class="timeSep">:</span><select id="${id}M"${ev}>${mins}</select></div>`;
}
function getTimeVal(id) {
  const h = $form(id + 'H');
  const m = $form(id + 'M');
  if (!h || !m) return '';
  return `${h.value}:${m.value}`;
}
function setTimeVal(id, val) {
  const h = $form(id + 'H');
  const m = $form(id + 'M');
  if (!h || !m || !val) return;
  const [hh = '10', mm = '00'] = val.split(':');
  h.value = hh;
  m.value = String(Math.min(Math.round(Number(mm) / 5) * 5, 55)).padStart(2, '0');
}
