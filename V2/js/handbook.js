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

/* ── LINE 分享 ── */
function shareHandbookLine() {
  const url = _getShareUrl();
  if (!url) {
    toast('請先在「說明」頁產生分享連結');
    return;
  }
  const title = data.meta?.title || '我的旅程';
  const msg   = `【${title}｜旅程手冊】\n${url}`;
  window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msg)}`, '_blank');
}

/* ── PDF 匯出 ── */
function exportHandbookPDF() {
  const prevTitle = document.title;
  document.title  = (data.meta.title || '旅程手冊') + '—旅程手冊';
  window.print();
  document.title  = prevTitle;
}

/* ── HTML 組裝 ── */
function hbLineBreak(str) {
  return esc(str || '').replace(/\n/g, '<br>');
}

function handbookHtml() {
  const hb      = _hbData();
  const colorKey = hb.coverColor || 'green';
  const color   = HANDBOOK_COLORS.find(c => c.key === colorKey) || HANDBOOK_COLORS[0];

  const expectations  = hb.expectations  !== undefined ? hb.expectations  : (data.meta.subtitle || '');
  const practicalInfo = hb.practicalInfo !== undefined ? hb.practicalInfo : '';

  const count     = Number(data.trip.travelerCount || 1);
  const travelers = Array.from({ length: count }, (_, i) =>
    data.trip.travelers?.[i] || String.fromCharCode(65 + i));
  const totalDays   = data.days.length;
  const nights      = Math.max(0, totalDays - 1);
  const unscheduled = data.spots.filter(s => !spotPlanExists(s));
  const readonly    = shareViewMode ? 'false' : 'true';

  return `
    <!-- 操作列 -->
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

    <!-- 手冊主體 -->
    <div class="handbook hbColor-${colorKey}" id="handbookDoc">

      <!-- 封面 -->
      <div class="hbCover">
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
      </div>

      <!-- 旅程期待 -->
      <div class="hbSection">
        <div class="hbSectionLabel">旅程期待</div>
        <div class="hbEditable"
             contenteditable="${readonly}"
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

      <!-- 實用資訊 -->
      <div class="hbSection">
        <div class="hbSectionLabel">實用資訊</div>
        <div class="hbRateChip">💱 1 ${esc(data.trip.currency || 'KRW')} = ${data.trip.rate} TWD</div>
        <div class="hbEditable hbPractical"
             contenteditable="${readonly}"
             onblur="saveHandbookField('practicalInfo', this.innerText)"
             data-placeholder="緊急電話、注意事項、重要提醒…">${hbLineBreak(practicalInfo)}</div>
      </div>

    </div>`;
}
