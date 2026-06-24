/* ================================================================
   handbook.js — 旅程手冊
   ================================================================ */

const HANDBOOK_COLORS = [
  { key: 'green', label: '森林綠', main: '#4A5D4E' },
  { key: 'sage',  label: '薄霧灰', main: '#6B7C6E' },
  { key: 'blush', label: '玫瑰粉', main: '#8B5E6B' },
  { key: 'navy',  label: '深海藍', main: '#3B4D6E' },
  { key: 'sand',  label: '沙漠金', main: '#8B7355' },
];

function _hbData() {
  if (!data.handbook) data.handbook = {};
  return data.handbook;
}

function setHandbookColor(key) {
  _hbData().coverColor = key;
  save();
  renderPhotoBook();
}

function saveHandbookField(field, value) {
  _hbData()[field] = value.trim();
  save();
}

/* ── 封面圖上傳 ── */
async function addHandbookCover(file) {
  if (!file) return;
  try {
    toast('上傳中...');
    const blob   = await compressImage(file, 1800, 0.84);
    const result = await uploadToCloudinary(blob, file.name);
    _hbData().cover = result.src;
    save();
    toast('封面已上傳');
    renderPhotoBook();
  } catch (err) {
    alert('封面上傳失敗：' + err.message);
  }
}

function removeHandbookCover() {
  if (!confirm('確定移除封面圖？')) return;
  delete _hbData().cover;
  save();
  renderPhotoBook();
}

/* ── 產生手冊 HTML（供預覽 & 匯出共用） ── */
function hbLineBreak(str) {
  return esc(str || '').replace(/\n/g, '<br>');
}

function _handbookDocHtml(opts = {}) {
  const { editable = true } = opts;
  const hb       = _hbData();
  const colorKey = hb.coverColor || 'green';
  const coverImg = hb.cover || '';

  const expectations  = hb.expectations  !== undefined ? hb.expectations  : (data.meta.subtitle || '');
  const practicalInfo = hb.practicalInfo !== undefined ? hb.practicalInfo : '';

  const count     = Number(data.trip.travelerCount || 1);
  const travelers = Array.from({ length: count }, (_, i) =>
    data.trip.travelers?.[i] || String.fromCharCode(65 + i));
  const totalDays   = data.days.length;
  const nights      = Math.max(0, totalDays - 1);
  const unscheduled = data.spots.filter(s => !spotPlanExists(s));
  const ce          = editable && !shareViewMode ? 'true' : 'false';

  const coverStyle = coverImg
    ? `style="background-image:url('${coverImg}');background-size:cover;background-position:center"`
    : '';

  return `
    <div class="handbook hbColor-${colorKey}" id="handbookDoc">

      <!-- 封面 -->
      <div class="hbCover" ${coverStyle}>
        ${coverImg ? '<div class="hbCoverOverlay"></div>' : ''}
        <div class="hbCoverInner">
          <div class="hbEyebrow">TRAVEL HANDBOOK</div>
          <h1 class="hbTitle">${esc(data.meta.title || '我的旅程手帳')}</h1>
          <div class="hbCoverDest">${esc(data.trip.dest || '')}</div>
          <div class="hbCoverMeta">
            ${data.trip.start ? `${short(data.trip.start)} — ${short(data.trip.end)}` : ''}
            ${totalDays ? ` ｜ ${totalDays}天${nights}夜` : ''}
          </div>
          ${travelers.length ? `<div class="hbCoverTravelers">${travelers.map(esc).join('・')}</div>` : ''}
        </div>
        ${editable && !shareViewMode ? `
          <div class="hbCoverUpload noPrint">
            <label class="hbCoverUploadBtn">
              ${coverImg ? '更換封面圖' : '＋ 上傳封面圖'}
              <input type="file" accept="image/*" onchange="addHandbookCover(this.files[0])" style="display:none">
            </label>
            ${coverImg ? `<button class="hbCoverUploadBtn" onclick="removeHandbookCover()">移除</button>` : ''}
          </div>` : ''}
      </div>

      <!-- 旅程期待 -->
      <div class="hbSection">
        <div class="hbSectionLabel">旅程期待</div>
        <div class="hbEditable"
             contenteditable="${ce}"
             onblur="saveHandbookField('expectations', this.innerText)"
             data-placeholder="點這裡，寫下這趟旅行的期待…">${hbLineBreak(expectations)}</div>
      </div>

      <!-- 旅程總覽 -->
      <div class="hbSection">
        <div class="hbSectionLabel">旅程總覽</div>
        <div class="hbOverviewGrid">
          <div class="hbOverviewItem"><span>目的地</span><b>${esc(data.trip.dest || '未設定')}</b></div>
          <div class="hbOverviewItem"><span>旅行天數</span><b>${totalDays}天${nights}夜</b></div>
          <div class="hbOverviewItem"><span>旅伴</span><b>${travelers.map(esc).join('、')}</b></div>
          <div class="hbOverviewItem"><span>幣別</span><b>${esc(data.trip.currency || 'KRW')} = ${data.trip.rate} TWD</b></div>
          <div class="hbOverviewItem"><span>住宿</span><b>${data.hotels.length} 間</b></div>
        </div>
      </div>

      <!-- 航班資訊 -->
      ${(() => {
        const out  = normalizeFlightObj(data.flights?.out  || {});
        const back = normalizeFlightObj(data.flights?.back || {});
        const hasOut  = out.segments?.some(s => s.no || s.from);
        const hasBack = back.segments?.some(s => s.no || s.from);
        if (!hasOut && !hasBack) return '';
        const fmtDt = s => {
          if (!s) return '';
          const d = new Date(s);
          if (isNaN(d)) return s;
          return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        };
        const segHtml = seg => seg.no ? `
          <div class="hbFlightSeg">
            <span class="hbFlightNo">✈️ ${esc(seg.no)}</span>
            <span class="hbFlightRoute">${esc(seg.from||'')} → ${esc(seg.to||'')}</span>
            ${seg.dep ? `<span class="hbFlightTime">起飛 ${fmtDt(seg.dep)}</span>` : ''}
            ${seg.arr ? `<span class="hbFlightTime">抵達 ${fmtDt(seg.arr)}</span>` : ''}
          </div>` : '';
        const dirHtml = (f, label) => {
          const segs = (f.segments||[]).filter(s => s.no || s.from);
          if (!segs.length) return '';
          return `
            <div class="hbFlightDir">
              <div class="hbFlightDirLabel">${label}</div>
              ${segs.map(segHtml).join('')}
              ${f.toAirport   ? `<div class="hbFlightNote">🚌 ${esc(f.toAirport)}</div>`   : ''}
              ${f.fromAirport ? `<div class="hbFlightNote">🚌 ${esc(f.fromAirport)}</div>` : ''}
            </div>`;
        };
        return `
          <div class="hbSection">
            <div class="hbSectionLabel">航班資訊</div>
            ${dirHtml(out,  '去程')}
            ${dirHtml(back, '回程')}
          </div>`;
      })()}

      <!-- 住宿資訊 -->
      ${data.hotels.length ? `
        <div class="hbSection">
          <div class="hbSectionLabel">住宿資訊</div>
          ${data.hotels.map(h => `
            <div class="hbHotelCard">
              <div class="hbHotelName">🏨 ${esc(h.name)}</div>
              <div class="hbHotelDates">${h.start ? `${short(h.start)} → ${short(h.end)}` : ''}</div>
              ${h.addr ? `<div class="hbHotelAddr">📍 ${esc(h.addr)}</div>` : ''}
              ${h.note ? `<div class="hbHotelNote">${esc(h.note)}</div>` : ''}
            </div>`).join('')}
        </div>` : ''}

      <!-- 每日行程 -->
      <div class="hbSection">
        <div class="hbSectionLabel">每日行程</div>
        ${data.days.map(d => {
          const plans = sortedPlans(d.key);
          const hotel = hotelFor(d.key);
          return `
            <div class="hbDay">
              <div class="hbDayHead">
                <span class="hbDayTitle">${esc(d.title)}</span>
                <span class="hbDayDate">${shortWithDay(d.key)}</span>
                ${hotel ? `<span class="hbDayHotel">🏨 ${esc(hotel.name)}</span>` : ''}
              </div>
              ${plans.length
                ? `<div class="hbPlanList">
                    ${plans.map(p => `
                      <div class="hbPlanItem">
                        <span class="hbPlanTime">${esc(p.start || '--:--')}</span>
                        <span class="hbPlanName">${activityIcon(p.type)} ${esc(p.name)}</span>
                        ${p.address ? `<span class="hbPlanAddr">${esc(p.address)}</span>` : ''}
                      </div>`).join('')}
                  </div>`
                : `<div class="hbEmpty">這天尚未安排行程</div>`}
            </div>`;
        }).join('')}
      </div>

      <!-- 口袋景點（未排入行程） -->
      ${unscheduled.length ? `
        <div class="hbSection">
          <div class="hbSectionLabel">口袋景點</div>
          <div class="hbSpotsGrid">
            ${unscheduled.map(s => `
              <div class="hbSpotCard">
                <div class="hbSpotType">${activityIcon(s.type)} ${esc(s.type)}</div>
                <div class="hbSpotName">${esc(s.name)}</div>
                ${s.addr ? `<div class="hbSpotAddr">📍 ${esc(s.addr)}</div>` : ''}
                ${s.note || s.memo ? `<div class="hbSpotNote">${esc(s.note || s.memo)}</div>` : ''}
              </div>`).join('')}
          </div>
        </div>` : ''}

      <!-- 實用資訊 -->
      <div class="hbSection">
        <div class="hbSectionLabel">實用資訊</div>
        <div class="hbRateChip">💱 1 ${esc(data.trip.currency || 'KRW')} = ${data.trip.rate} TWD</div>
        <div class="hbEditable hbPractical"
             contenteditable="${ce}"
             onblur="saveHandbookField('practicalInfo', this.innerText)"
             data-placeholder="緊急電話、注意事項、重要提醒…">${hbLineBreak(practicalInfo)}</div>
      </div>

    </div>`;
}

/* ── 開啟獨立預覽視窗（PDF / LINE 共用） ── */
function _openHandbookPreview(autoPrint) {
  const cssHref = document.querySelector('link[rel="stylesheet"]')?.href || '';
  const docHtml = _handbookDocHtml({ editable: false });
  const printBlock = autoPrint
    ? `<script>window.addEventListener('load',function(){var t=[];if(document.fonts&&document.fonts.ready)t.push(document.fonts.ready);[].forEach.call(document.images,function(img){if(!img.complete)t.push(new Promise(function(r){img.onload=img.onerror=r;}));});Promise.all(t).then(function(){setTimeout(window.print.bind(window),200);});});<\/script>`
    : '';

  const win = window.open('', '_blank');
  if (!win) { toast('請允許彈出視窗後再試'); return null; }

  win.document.write(`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(data.meta.title || '旅程手冊')}</title>
${cssHref ? `<link rel="stylesheet" href="${cssHref}">` : ''}
<style>
  /* ── 基礎 ── */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: A4 portrait; margin: 15mm 20mm; }
  body { margin: 0; padding: 20px 0; background: #f7f3ec; font-family: -apple-system,'Noto Sans TC','PingFang TC',sans-serif; }
  .handbook { max-width: 680px; margin: 0 auto; border-radius: 0; box-shadow: 0 4px 32px rgba(0,0,0,.12); background: #fff; }
  .hbEditable { border: none !important; background: transparent !important; padding: 0; }
  .hbCoverUpload, .hbActions, .bookSubTabs { display: none !important; }
  .hbSection { break-inside: avoid; page-break-inside: avoid; }
  .hbDay     { break-inside: avoid; page-break-inside: avoid; }
  .hbHotelCard { break-inside: avoid; page-break-inside: avoid; }

  /* ── 各色彩主題 CSS 變數 ── */
  .hbColor-green { --hb-a:#3d5141; --hb-al:#d0e8d8; --hb-al2:#a8cbb8; }
  .hbColor-sage  { --hb-a:#565f56; --hb-al:#d8e5dc; --hb-al2:#b5c8be; }
  .hbColor-blush { --hb-a:#7a4e58; --hb-al:#eed5da; --hb-al2:#d0a8b5; }
  .hbColor-navy  { --hb-a:#2e3f5c; --hb-al:#cdd8e8; --hb-al2:#a0b8d0; }
  .hbColor-sand  { --hb-a:#7a6040; --hb-al:#e5d8c8; --hb-al2:#c8b498; }

  /* ══ 封面：全頁設計 ══ */
  .hbCover {
    min-height: 420px;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0;
    overflow: hidden;
  }
  .hbCoverInner { padding: 52px 44px; position: relative; z-index: 2; }
  .hbEyebrow { font-size: 10px; letter-spacing: 4px; opacity: .52; margin-bottom: 22px; text-transform: uppercase; }
  .hbTitle   { font-size: clamp(32px, 5.5vw, 48px) !important; font-weight: 900; line-height: 1.1; margin: 0 0 16px !important; }
  .hbCoverDest { font-size: 17px; opacity: .85; margin-bottom: 6px; }
  .hbCoverMeta { font-size: 13px; opacity: .62; }
  .hbCoverTravelers { margin-top: 28px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.28); font-size: 14px; font-weight: 700; opacity: .85; }
  /* 封面無圖時：底部漸層加深 */
  .hbCoverOverlay { background: linear-gradient(to top, rgba(0,0,0,.48) 0%, rgba(0,0,0,.08) 55%, transparent 100%); }

  /* ══ Section 標題：左側色條 + 下方色線 ══ */
  .hbSectionLabel {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 9px;
    letter-spacing: 3px;
    font-weight: 900;
    text-transform: uppercase;
    color: var(--hb-a, #9b8e85);
    border-bottom: 1.5px solid var(--hb-al, #e8e2da);
    padding-bottom: 10px;
    margin-bottom: 18px;
  }
  .hbSectionLabel::before {
    content: '';
    width: 3px;
    height: 14px;
    background: var(--hb-a, #9b8e85);
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* ══ 旅程總覽：底部色邊 ══ */
  .hbOverviewItem { border-bottom: 2px solid var(--hb-al2, #ccc); }

  /* ══ 航班：左側色邊 ══ */
  .hbFlightSeg { border-left: 3px solid var(--hb-a, #4A5D4E); border-radius: 0 8px 8px 0; }

  /* ══ 住宿：色框 ══ */
  .hbHotelCard { border: 1px solid var(--hb-al, #e8e2da); }
  .hbHotelName { color: var(--hb-a, #3d5141); }

  /* ══ 每日行程頭：色帶 ══ */
  .hbDay { padding: 0; border-left: none !important; margin-bottom: 22px; }
  .hbDayHead {
    background: var(--hb-al, #f5f0ea);
    border-left: 4px solid var(--hb-a, #4A5D4E);
    padding: 8px 14px;
    margin-bottom: 14px;
    border-radius: 0 6px 6px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .hbDayTitle { color: var(--hb-a, #3d5141); font-size: 13px; font-weight: 900; }
  .hbDayDate  { font-size: 11px; color: #9b8e85; }
  .hbDayHotel { margin-left: auto; font-size: 11px; color: #9b8e85; }

  /* ══ 行程 Timeline ══ */
  .hbPlanList {
    position: relative;
    padding-left: 54px;
    display: block;
    gap: 0;
  }
  /* 垂直連線 */
  .hbPlanList::before {
    content: '';
    position: absolute;
    left: 42px;
    top: 10px;
    bottom: 8px;
    width: 1px;
    background: var(--hb-al2, #d8d8d8);
  }
  .hbPlanItem {
    position: relative;
    margin-bottom: 13px;
    display: block;
    flex-wrap: unset;
    gap: 0;
  }
  /* 時間 */
  .hbPlanTime {
    position: absolute;
    left: -54px;
    width: 38px;
    text-align: right;
    font-size: 10px;
    color: var(--hb-a, #4A5D4E);
    font-weight: 800;
    top: 2px;
    flex: none;
  }
  /* 時間點 */
  .hbPlanItem::before {
    content: '';
    position: absolute;
    left: -15px;
    top: 5px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--hb-a, #4A5D4E);
    z-index: 1;
  }
  .hbPlanName { display: block; font-weight: 700; font-size: 13px; flex: none; }
  .hbPlanAddr { display: block; padding-left: 0; font-size: 11px; margin-top: 2px; color: #9b8e85; }

  /* ══ 口袋景點 ══ */
  .hbSpotCard { border: 1px solid var(--hb-al, #e8e2da); break-inside: avoid; }
  .hbSpotName { color: var(--hb-a, #3d5141); }

  /* ══ 匯率 ══ */
  .hbRateChip { background: var(--hb-al, #d9efe6); color: var(--hb-a, #3d5141); }

  @media print {
    body { padding: 0; background: #fff; }
    .handbook { max-width: none; box-shadow: none; }
    .hbCover { min-height: 92vh; page-break-after: always; break-after: page; }
  }
</style>
</head>
<body>
${docHtml}
${printBlock}
</body>
</html>`);
  win.document.close();
  return win;
}

/* ── PDF 匯出 ── */
function exportHandbookPDF() {
  _openHandbookPreview(true);
}

/* ── LINE 分享 ── */
function shareHandbookLine() {
  _openHandbookPreview(false);
  toast('已開啟手冊預覽，點右上角「分享」即可傳到 LINE');
}

/* ── 主頁面 handbookHtml（含操作列） ── */
function handbookHtml() {
  const hb         = _hbData();
  const colorKey   = hb.coverColor || 'green';
  const shareToken = data.meta?.shareToken;
  const shareUrl   = shareToken
    ? `${window.location.origin}${window.location.pathname}?share=${shareToken}`
    : '';

  const shareBlock = shareViewMode ? '' : `
    <div class="hbShareCard noPrint">
      <div class="hbShareTitle">🔗 旅伴分享連結</div>
      ${shareUrl ? `
        <div class="hbShareDesc">旅伴可透過此連結即時查看所有行程、住宿、預算（唯讀）。</div>
        <div class="hbShareUrlRow">
          <input class="hbShareUrlInput" readonly value="${esc(shareUrl)}">
          <button class="btn dark compact" onclick="copyShareLink()">複製</button>
        </div>
        <div class="hbShareBtns">
          <button class="btn blue compact" onclick="shareToLine()">LINE 分享</button>
          <button class="hbShareRevoke" onclick="revokeShareLink()">停用連結</button>
        </div>
      ` : `
        <div class="hbShareDesc">產生連結後，旅伴可即時查看所有行程規劃，無需登入。</div>
        ${typeof canUseCloud === 'function' && canUseCloud()
          ? `<button class="btn dark compact" onclick="generateShareLink()">🔗 產生分享連結</button>`
          : `<p class="hbShareMuted">請先 Google 登入才能產生分享連結</p>`}
      `}
    </div>`;

  return `
    <div class="hbActions noPrint">
      <div class="hbColorRow">
        ${HANDBOOK_COLORS.map(c => `
          <button class="hbColorDot ${c.key === colorKey ? 'active' : ''}"
                  style="background:${c.main}" title="${c.label}"
                  onclick="setHandbookColor('${c.key}')"></button>`).join('')}
      </div>
      <div class="hbActionBtns">
        <button class="btn dark compact" onclick="exportHandbookPDF()">匯出 PDF</button>
      </div>
    </div>
    ${shareBlock}
    ${_handbookDocHtml({ editable: true })}`;
}

/* ── 遊記字型 ── */
function setDiaryFont(font) {
  _flushDiaryTexts();
  if (!data.diaryShare) data.diaryShare = {};
  data.diaryShare.font = font;
  save();
  renderPhotoBook();
}

/* ── 每日文字樣式（通用） ── */
function setDayMoodField(day, field, value) {
  _flushDiaryTexts();
  if (!data.dayMoods) data.dayMoods = {};
  if (!data.dayMoods[day]) data.dayMoods[day] = {};
  if (field.startsWith('toggle:')) {
    const f = field.slice(7);
    data.dayMoods[day][f] = !data.dayMoods[day][f];
  } else {
    data.dayMoods[day][field] = value;
  }
  save();
  renderPhotoBook();
}
function setDayTextColor(day, color)    { setDayMoodField(day, 'textColor', color); }
function toggleDayTextStroke(day)       { setDayMoodField(day, 'toggle:textStroke', null); }
function toggleDayTextBold(day)         { setDayMoodField(day, 'toggle:textBold', null); }

/* ── 發布遊記 ── */
async function publishDiary() {
  if (!fbUser || !fbDb) return toast('請先登入');
  _flushDiaryTexts();
  if (!data.diaryShare) data.diaryShare = {};
  if (!data.diaryShare.token) data.diaryShare.token = uid() + uid();
  data.diaryShare.published = true;
  data.diaryShare.publishedAt = Date.now();
  try {
    toast('發布中...');
    await fbDb.collection('publicDiaries').doc(data.diaryShare.token).set({
      data: JSON.parse(JSON.stringify(data)),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      ownerEmail: fbUser.email || '',
      tripMeta: { title: data.meta?.title || '', dest: data.trip?.dest || '' }
    });
    save();
    const url = `${location.origin}${location.pathname}?diary=${data.diaryShare.token}`;
    try { await navigator.clipboard.writeText(url); toast('遊記已發布！連結已複製'); }
    catch { toast('遊記已發布！連結：' + url); }
    renderPhotoBook();
  } catch (e) {
    toast('發布失敗：' + e.message);
  }
}

async function unpublishDiary() {
  if (!confirm('確定取消發布？連結將失效。')) return;
  if (!data.diaryShare?.token || !fbDb) return;
  try {
    await fbDb.collection('publicDiaries').doc(data.diaryShare.token).delete();
  } catch (e) { /* ignore */ }
  data.diaryShare.published = false;
  save();
  renderPhotoBook();
  toast('已取消發布');
}

async function copyDiaryLink() {
  if (!data.diaryShare?.token || !data.diaryShare?.published) return toast('請先發布遊記');
  const url = `${location.origin}${location.pathname}?diary=${data.diaryShare.token}`;
  try { await navigator.clipboard.writeText(url); toast('連結已複製'); }
  catch { toast(url); }
}
