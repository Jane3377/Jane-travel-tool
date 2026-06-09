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
    ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});<\/script>`
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
  body { margin:0; padding:20px 0; background:#f7f3ec;
         font-family:-apple-system,'Noto Sans TC','PingFang TC',sans-serif; }
  .handbook { max-width:680px; margin:0 auto; border-radius:0; box-shadow:0 4px 32px rgba(0,0,0,.12); }
  .hbEditable { border:none!important; background:transparent!important; padding:0; }
  @media print {
    body { padding:0; background:#fff; }
    .handbook { max-width:none; box-shadow:none; }
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
  const hb       = _hbData();
  const colorKey = hb.coverColor || 'green';

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
        <button class="btn blue compact" onclick="shareHandbookLine()">LINE 分享</button>
      </div>
    </div>
    ${_handbookDocHtml({ editable: true })}`;
}
