/* ================================================================
   ai.js — AI 功能：景點提示詞、行程健檢、分享行程
   ================================================================ */

/* ══════════════════════════════════════════
   AI 偏好設定
   ══════════════════════════════════════════ */

const AI_STYLES  = ['','輕鬆慢旅','高效率踩點','美食咖啡優先','拍照打卡優先','親子友善','購物優先','文化歷史優先','自然風景優先'];
const AI_MBTIS   = ['','INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
const AI_ZODIACS = ['','牡羊座','金牛座','雙子座','巨蟹座','獅子座','處女座','天秤座','天蠍座','射手座','摩羯座','水瓶座','雙魚座'];

function loadAiPrefs() {
  try { return JSON.parse(localStorage.getItem(AI_PREF_KEY) || '{}'); } catch (e) { return {}; }
}
function saveAiPrefs() {
  const prefs = {
    style:  $('aiTravelStyle')?.value || '',
    mbti:   $('aiMbti')?.value        || '',
    zodiac: $('aiZodiac')?.value      || '',
    note:   $('aiUserNote')?.value    || ''
  };
  try { localStorage.setItem(AI_PREF_KEY, JSON.stringify(prefs)); } catch (e) {}
  return prefs;
}
function aiPrefsText() {
  const p = loadAiPrefs();
  const parts = [];
  if (p.style)  parts.push('旅遊風格：' + p.style);
  if (p.mbti)   parts.push('MBTI：' + p.mbti);
  if (p.zodiac) parts.push('星座：' + p.zodiac);
  if (p.note)   parts.push('其他需求：' + p.note);
  return parts.length ? parts.join('\n') : '未填寫，請以一般旅遊者需求判斷。';
}
function aiPrefsHtml() {
  const p    = loadAiPrefs();
  const opts = (arr, val) => arr.map(x =>
    `<option value="${esc(x)}" ${x===(val||'')?'selected':''}>${x||'不指定'}</option>`
  ).join('');
  return `
    <div class="aiPrefs">
      <div class="aiPrefsTitle">旅遊偏好（選填）</div>
      <div class="aiPrefsGrid">
        <div><label>旅遊風格</label>
          <select id="aiTravelStyle" onchange="saveAiPrefs()">${opts(AI_STYLES, p.style)}</select></div>
        <div><label>MBTI</label>
          <select id="aiMbti" onchange="saveAiPrefs()">${opts(AI_MBTIS, p.mbti)}</select></div>
        <div><label>星座</label>
          <select id="aiZodiac" onchange="saveAiPrefs()">${opts(AI_ZODIACS, p.zodiac)}</select></div>
      </div>
      <label style="margin-top:10px">描述需求（選填）</label>
      <textarea id="aiUserNote" rows="3" style="min-height:72px;max-height:90px;font-size:13px;resize:none"
        placeholder="例：想找步行可達的咖啡廳，避開太觀光的地點，喜歡有設計感的小店…"
        oninput="saveAiPrefs()">${esc(p.note||'')}</textarea>
    </div>`;
}

/* ══════════════════════════════════════════
   AI 提示詞產生
   ══════════════════════════════════════════ */

function buildFlightContext() {
  const lines = [];
  ['out', 'back'].forEach(k => {
    const f   = normalizeFlightObj(data.flights[k]);
    const dir = k === 'out' ? '去程' : '回程';
    const segs = f.segments.filter(s => s.no || s.from || s.dep);
    if (!segs.length) return;
    segs.forEach((s, i) => {
      const dep = (s.dep || '').slice(0, 16).replace('T', ' ');
      const arr = (s.arr || '').slice(0, 16).replace('T', ' ');
      lines.push(`${dir}第${i+1}段：${s.no||''} ${s.from||''}→${s.to||''} ${dep}起飛 / ${arr}抵達`);
    });
  });
  return lines.join('\n') || '尚未設定航班';
}

function buildTripContext() {
  return {
    dest:      data.trip.dest     || '未設定',
    country:   data.trip.country  || '',
    city:      data.trip.city     || '',
    dates:     `${data.trip.start || ''} ～ ${data.trip.end || ''}`,
    travelers: (data.trip.travelers || []).join('、') || '未設定',
    days:      data.days.map(d => `${d.key}（${d.title}｜${d.label}）`).join('\n'),
    hotels:    data.hotels.map(h => `${short(h.start)}~${short(h.end)} ${h.name}${h.addr ? '，' + h.addr : ''}`).join('\n') || '尚未設定住宿'
  };
}

function buildPackingPrompt() {
  const c = buildTripContext();
  const existing = (data.packing || []).map(x => x.name).join('、') || '（尚無）';
  return `請依照以下旅行設定，幫我產出可匯入「貞選旅管家」的行李清單 JSON。

旅行設定：
- 目的地：${c.dest}
- 國家/區域：${c.country}
- 日期：${c.dates}（${data.days.length} 天）
- 旅伴：${c.travelers}

已有的行李項目：${existing}

請注意：
1. 只輸出目前清單沒有的新項目。
2. type 只能是 "pre"（出發前）或 "out"（離開飯店前）。
3. 只輸出純 JSON，格式如下：

{
  "packing": [
    {
      "type": "pre",
      "name": "項目名稱",
      "note": "備註說明"
    }
  ]
}`;
}

function buildSpotsPrompt() {
  const c        = buildTripContext();
  const isKorea  = data.trip.country === '韓國';
  const dayPlans = data.days.map(d => {
    const plans = sortedPlans(d.key).filter(p => p.source !== 'flight' && p.source !== 'hotel');
    if (!plans.length) return `${d.title}（${d.key}）：尚無行程`;
    return `${d.title}（${d.key}）：` + plans.map(p => `${p.start||'--:--'} ${p.name}`).join('、');
  }).join('\n');

  const unscheduled = data.spots
    .filter(s => !spotPlanExists(s))
    .map(s => s.name)
    .filter(Boolean);

  return `請依照以下旅行設定，幫我產出可匯入「貞選旅管家」的口袋景點 JSON。

旅行設定：
- 目的地：${c.dest}
- 國家/區域：${c.country}
- 城市/路線：${c.city || c.dest}
- 日期：${c.dates}
- 旅伴：${c.travelers}

使用者偏好：
${aiPrefsText()}

航班資訊：
${buildFlightContext()}

住宿：
${c.hotels}

已安排行程（供參考，請推薦可補充的景點，避免重複）：
${dayPlans}

已收藏口袋景點（未排入行程，請避免重複推薦）：
${unscheduled.length ? unscheduled.join('、') : '（無）'}

請注意：
1. 推薦景點、餐廳、咖啡廳、購物、雨天備案，避免與已安排行程及已收藏景點重複。
2. 如果適合某天，請填 day（YYYY-MM-DD 格式）；不確定就留空。
3. 可選填 start / end 建議時間（HH:MM 格式），若無把握請留空。${isKorea ? `
4. 請額外提供：
   - krName: 韓文名稱
   - krAddress: 韓文地址（精確到路名門牌）` : ''}
${isKorea ? '5' : '4'}. 只輸出純 JSON，格式如下：

{
  "spots": [
    {
      "name": "景點名稱",
      "type": "景點/餐廳/咖啡廳/購物/雨天備案/其他",
      "day": "YYYY-MM-DD 或留空",
      "addr": "地址或區域",
      "memo": "推薦理由或注意事項",
      "start": "HH:MM 或留空",
      "end": "HH:MM 或留空"${isKorea ? `,
      "krName": "韓文名稱",
      "krAddress": "韓文地址（精確到路名門牌）"` : ''}
    }
  ]
}`;
}

function buildItineraryPrompt() {
  const c = buildTripContext();
  const dayPlans = data.days.map(d => {
    const plans = sortedPlans(d.key);
    const hotel = hotelFor(d.key);
    return `${d.title}｜${d.label}（${hotel?.name || '住宿未設定'}）\n${
      plans.length
        ? plans.map(p => `  ${p.start||'--:--'} ${p.name}（${p.type}）${p.note ? '\n  注意：'+p.note : ''}`).join('\n')
        : '  這天尚無行程'
    }`;
  }).join('\n\n');

  return `旅行資料：
- 目的地：${c.dest}
- 日期：${c.dates}
- 旅伴：${c.travelers}

使用者偏好：
${aiPrefsText()}

行程：
${dayPlans}

請做行程健檢，找出時間衝突或可改善點。回傳格式：
{
  "summary": "整體建議",
  "items": [
    {"day": "YYYY-MM-DD", "level": "注意/建議/OK", "title": "標題", "memo": "說明"}
  ]
}`;
}

/* ══════════════════════════════════════════
   AI 提示詞 Modal
   ══════════════════════════════════════════ */

/* ──────────────────────────────────────────
   AI 偏好 Modal（先選偏好再產生提示詞）
   適用：spots / itinerary / packing
   ────────────────────────────────────────── */
function showAIPrompt(type = 'spots') {
  // packing 不需要偏好，直接跳到提示詞
  if (type === 'packing') { _showPromptModal(type); return; }

  // spots / itinerary 先顯示偏好 modal
  let modal = $('aiPrefsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'aiPrefsModal';
    modal.className = 'aiPromptModal';
    modal.onclick = e => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }

  const isSpot = type === 'spots';
  const prefs  = loadAiPrefs();
  modal.innerHTML = `
    <div class="aiPromptBox">
      <div class="aiModalHead">
        <div>
          <h3>${isSpot ? 'AI 找景點' : 'AI 行程健檢'}</h3>
          <p>${isSpot
            ? '加入偏好後，AI 會依航班、住宿與已排入行程推薦更適合的口袋景點。'
            : '加入偏好後，AI 會用更貼近你的旅行節奏檢查行程。'}</p>
        </div>
        <button class="aiModalClose" onclick="$('aiPrefsModal').classList.remove('show')">×</button>
      </div>
      ${aiPrefsHtml()}
      <div class="btns" style="margin-top:14px">
        <button class="btn dark" onclick="_savePrefsAndShowPrompt('${type}')">產生提示詞</button>
        <button class="btn soft" onclick="$('aiPrefsModal').classList.remove('show')">取消</button>
      </div>
    </div>`;
  modal.classList.add('show');
}

function _savePrefsAndShowPrompt(type) {
  saveAiPrefs();
  $('aiPrefsModal')?.classList.remove('show');
  _showPromptModal(type);
}

/* ──────────────────────────────────────────
   提示詞 Modal（自動複製 + 開啟 AI）
   ────────────────────────────────────────── */
function _showPromptModal(type) {
  const prompt = type === 'spots'   ? buildSpotsPrompt()
               : type === 'packing' ? buildPackingPrompt()
               : type === 'budget'  ? buildBudgetPrompt()
               : buildItineraryPrompt();
  const title  = type === 'spots'   ? 'AI 找景點'
               : type === 'packing' ? 'AI 行李清單'
               : type === 'budget'  ? 'AI 預算'
               : 'AI 行程健檢';

  let modal = $('aiPromptModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'aiPromptModal';
    modal.className = 'aiPromptModal';
    modal.onclick = e => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="aiPromptBox">
      <div class="aiModalHead">
        <div>
          <h3>${esc(title)}</h3>
          <p>點下方按鈕會自動複製提示詞並開啟 AI，請在新分頁貼上即可。</p>
        </div>
        <button class="aiModalClose" onclick="closeAIPrompt()">×</button>
      </div>
      <textarea id="aiPromptText" readonly style="font-size:12px;line-height:1.6;min-height:140px;background:#f7f3ec">${esc(prompt)}</textarea>
      <div class="aiTargetBtns">
        <button class="btn dark"  onclick="openAiTarget('chatgpt')">ChatGPT</button>
        <button class="btn blue"  onclick="openAiTarget('gemini')">Gemini</button>
        <button class="btn soft"  onclick="openAiTarget('claude')">Claude</button>
      </div>
      <div class="btns" style="margin-top:8px">
        <button class="btn soft compact" onclick="copyAIPrompt()">只複製</button>
        <button class="btn soft compact" onclick="closeAIPrompt()">關閉</button>
      </div>
      <p class="aiPromptNote">匯入 AI 回傳的 JSON 請用下方「AI 匯入」按鈕。</p>
    </div>`;
  modal.classList.add('show');
}

function closeAIPrompt() {
  $('aiPromptModal')?.classList.remove('show');
}

function copyAIPrompt() {
  const text = $('aiPromptText')?.value || '';
  navigator.clipboard?.writeText(text)
    .then(() => toast('已複製提示詞'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('已複製提示詞');
    });
}

function openAiTarget(target) {
  // 先自動複製，再開新分頁
  const text = $('aiPromptText')?.value || '';
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
  toast('已複製，請在新分頁貼上');
  const url = target === 'gemini' ? 'https://gemini.google.com/app'
            : target === 'claude' ? 'https://claude.ai/'
            : 'https://chatgpt.com/';
  window.open(url, '_blank');
}

function ensureAiModal() {
  let modal = $('aiPromptModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id        = 'aiPromptModal';
    modal.className = 'aiPromptModal';
    document.body.appendChild(modal);
  }
  return modal;
}

/* ══════════════════════════════════════════
   AI 預算提示詞
   ══════════════════════════════════════════ */

function buildBudgetPrompt() {
  const c = buildTripContext();

  // 住宿
  const hotels = data.hotels.map(h =>
    `${short(h.start)}~${short(h.end)} ${h.name}${h.addr ? '｜' + h.addr : ''}${h.note ? '｜' + h.note : ''}`
  ).join('\n') || '尚未設定住宿';

  // 完整行程（含來源）
  const allPlans = data.days.map(d => {
    const plans = sortedPlans(d.key);
    if (!plans.length) return '';
    return plans.map(p => {
      const time = [p.start, p.end].filter(Boolean).join('-');
      const parts = [`${d.key} ${time ? time + '｜' : ''}${p.type}｜${p.name}`];
      if (p.address) parts.push(`地址：${p.address}`);
      if (p.note)    parts.push(`注意：${p.note}`);
      return parts.join('｜');
    }).join('\n');
  }).filter(Boolean).join('\n');

  // 已記預算
  const expenses = data.expenses.map(e =>
    `${e.type}｜${e.name}｜TWD ${e.twd || 0}${e.memo ? '｜' + e.memo : ''}`
  ).join('\n') || '尚未記錄任何費用';

  return `旅行資料：
- 目的地：${c.dest}
- 國家 / 區域：${c.country}
- 日期：${c.dates}（${data.days.length} 天）
- 旅伴：${c.travelers}
- 幣別：${data.trip.currency}

旅行日期：
${c.days}

住宿：
${hotels}

目前行程：
${allPlans || '尚未安排行程'}

目前預算 / 額外費用：
${expenses}

請幫我檢查這趟旅程可能漏掉哪些預算項目，例如網卡、機場交通、市區交通、票券、保險、咖啡甜點、伴手禮、行李加購等。金額不要亂估，請預設 TWD 0，讓我匯入後自行調整。

請只輸出純 JSON，不要 Markdown，不要解釋文字。格式如下：
{
  "janeselect_import_type": "budget",
  "items": [
    {
      "type": "交通票券/景點票券/餐飲/購物/網路/旅平險/其他",
      "name": "建議補充的預算項目",
      "mode": "TWD",
      "twd": 0,
      "memo": "為什麼建議補這筆"
    }
  ]
}`;
}

function showBudgetPrompt() {
  _showPromptModal('budget');
}

/* ══════════════════════════════════════════
   AI 匯入
   ══════════════════════════════════════════ */

function openImportModal() {
  let modal = $('aiImportModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id        = 'aiImportModal';
    modal.className = 'aiPromptModal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="aiPromptBox">
      <div class="section">
        <h3>匯入 AI 回傳結果</h3>
        <button class="iconBtn" onclick="closeImportModal()">×</button>
      </div>
      <div class="hint">把 Claude AI 回傳的 JSON 貼入下方，再按「匯入」。</div>
      <textarea id="aiImportText" placeholder='{"spots":[...]}'></textarea>
      <div class="btns">
        <button class="btn dark" onclick="importAiJson()">匯入</button>
        <button class="btn soft" onclick="closeImportModal()">取消</button>
      </div>
    </div>`;
  modal.classList.add('show');
}

function closeImportModal() {
  $('aiImportModal')?.classList.remove('show');
}

let _importPreviewSpots = [];

function _showSpotsImportPreview(spots) {
  _importPreviewSpots = spots.filter(s => s.name);
  const modal = $('aiImportModal');
  if (!modal) return;

  const TYPE_ICONS = { '景點':'📍','餐廳':'🍜','咖啡廳':'☕','購物':'🛍️','雨天備案':'☔','其他':'✨' };

  modal.innerHTML = `
    <div class="aiPromptBox">
      <div class="section">
        <h3>預覽匯入景點（${_importPreviewSpots.length} 個）</h3>
        <button class="iconBtn" onclick="closeImportModal()">×</button>
      </div>
      <div class="hint" style="margin-bottom:10px">勾選要匯入的景點，再按「確定匯入」。</div>
      <div class="spotsImportList">
        <label class="spotsImportRow spotsImportAll">
          <input type="checkbox" id="spotsImportSelectAll" checked onchange="spotsImportToggleAll(this.checked)">
          <b>全選 / 全不選</b>
        </label>
        ${_importPreviewSpots.map((s, i) => `
          <label class="spotsImportRow">
            <input type="checkbox" class="spotsImportChk" data-i="${i}" checked>
            <span class="spotsImportIcon">${TYPE_ICONS[s.type] || '📍'}</span>
            <span class="spotsImportName">${esc(s.name)}</span>
            <span class="spotsImportType">${esc(s.type || '景點')}</span>
            ${s.addr ? `<span class="spotsImportAddr">${esc(s.addr)}</span>` : ''}
          </label>`).join('')}
      </div>
      <div class="btns" style="margin-top:12px">
        <button class="btn dark" onclick="confirmSpotsImport()">確定匯入</button>
        <button class="btn soft" onclick="closeImportModal()">取消</button>
      </div>
    </div>`;
}

function spotsImportToggleAll(checked) {
  document.querySelectorAll('.spotsImportChk').forEach(cb => cb.checked = checked);
}

function confirmSpotsImport() {
  const checked = [...document.querySelectorAll('.spotsImportChk:checked')]
    .map(cb => Number(cb.dataset.i));
  const toImport = checked.map(i => _importPreviewSpots[i]).filter(Boolean);
  toImport.forEach(s => {
    const day = data.days.some(d => d.key === s.day) ? s.day : '';
    data.spots.push({
      id: uid(), source: 'AI匯入',
      name:      String(s.name      || ''),
      type:      String(s.type      || '景點'),
      day,
      addr:      String(s.addr      || ''),
      memo:      String(s.memo      || ''),
      krName:    String(s.krName    || ''),
      krAddress: String(s.krAddress || '')
    });
  });
  save();
  toast(`已匯入 ${toImport.length} 個景點`);
  closeImportModal();
  _importPreviewSpots = [];
}

function importAiJson() {
  let raw = $('aiImportText')?.value || '';
  // 清理 markdown
  raw = raw.replace(/^```json\s*/i,'').replace(/^```/,'').replace(/```$/,'').trim();
  const f = raw.indexOf('{'), l = raw.lastIndexOf('}');
  if (f >= 0 && l > f) raw = raw.slice(f, l+1);

  try {
    const obj     = JSON.parse(raw);
    const spots   = Array.isArray(obj.spots) ? obj.spots : [];
    const reviews = Array.isArray(obj.items) ? obj.items : [];

    // 預算匯入
    if (obj.janeselect_import_type === 'budget' && Array.isArray(obj.items)) {
      const budgetItems = obj.items.filter(x => x.name);
      budgetItems.forEach(x => {
        data.expenses.push({
          id: uid(), source: 'AI匯入',
          type:      String(x.type      || '其他'),
          name:      String(x.name      || ''),
          payer:     '未定',
          payMethod: '未定',
          day:       '',
          mode:      String(x.mode      || 'TWD'),
          foreign:   Number(x.foreign   || 0),
          twd:       Number(x.twd       || 0),
          memo:      String(x.memo      || 'AI 建議補充')
        });
      });
      save();
      toast(`已匯入 ${budgetItems.length} 筆預算項目`);
      closeImportModal();
      return;
    }

    // 行李清單匯入
    const packItems = Array.isArray(obj.packing) ? obj.packing : [];
    if (packItems.length) {
      packItems.forEach(x => {
        if (!x.name) return;
        data.packing.push({
          id: uid(), type: x.type === 'out' ? 'out' : 'pre',
          name: String(x.name || ''), note: String(x.note || ''), checked: false
        });
      });
      save();
      toast(`已匯入 ${packItems.length} 個行李項目`);
      closeImportModal();
      return;
    }

    if (spots.length) {
      _showSpotsImportPreview(spots);
    } else if (reviews.length || obj.summary) {
      if (!data.aiReviews) data.aiReviews = {};
      if (!Array.isArray(data.aiReviews.itinerary)) data.aiReviews.itinerary = [];
      data.aiReviews.itinerary.unshift({
        id: uid(), createdAt: new Date().toISOString(),
        summary: String(obj.summary || ''),
        items: reviews.map(x => ({
          day:   String(x.day   || ''),
          level: String(x.level || '建議'),
          title: String(x.title || ''),
          memo:  String(x.memo  || '')
        }))
      });
      data.aiReviews.itinerary = data.aiReviews.itinerary.slice(0, 5);
      save();
      toast('已儲存 AI 行程建議');
      closeImportModal();
    } else {
      toast('找不到可匯入的景點或建議，請確認 JSON 格式');
    }
  } catch (err) {
    toast('JSON 格式錯誤：' + err.message);
  }
}

/* ══════════════════════════════════════════
   行程分享
   ══════════════════════════════════════════ */

function itineraryText() {
  const lines = [
    `【${data.meta.title || '我的旅程'}】`,
    `目的地：${data.trip.dest || '未設定'}`,
    `日期：${data.trip.start || ''} ～ ${data.trip.end || ''}`,
    ''
  ];

  // 航班
  ['out', 'back'].forEach(k => {
    const f    = normalizeFlightObj(data.flights[k]);
    const dir  = k === 'out' ? '去程' : '回程';
    const segs = f.segments.filter(s => s.no || s.from || s.dep);
    if (!segs.length) return;
    lines.push(`${dir}航班`);
    segs.forEach((s, i) => {
      lines.push(`  第${i+1}段：${s.no||''} ${s.from||''}→${s.to||''} ${(s.dep||'').slice(11,16)}起飛`);
    });
    lines.push('');
  });

  // 住宿
  if (data.hotels.length) {
    data.hotels.forEach(h => lines.push(`住宿：${h.name} ${short(h.start)}~${short(h.end)}`));
    lines.push('');
  }

  // 行程
  data.days.forEach(d => {
    const plans = sortedPlans(d.key);
    if (!plans.length) return;
    lines.push(`== ${d.title}｜${d.label} ==`);
    plans.forEach(p => {
      lines.push(`${p.start||'--:--'} ${p.name}${p.note ? ' 【'+p.note+'】' : ''}`);
    });
    lines.push('');
  });

  return lines.join('\n');
}

/* ══════════════════════════════════════════
   即時分享連結
   ══════════════════════════════════════════ */

function _getShareUrl() {
  const token = data.meta?.shareToken;
  if (!token) return '';
  const base = window.location.origin + window.location.pathname;
  return `${base}?share=${token}`;
}

async function generateShareLink() {
  if (!canUseCloud()) return toast('請先登入才能產生分享連結');
  if (data.meta?.shareToken) return;

  data.meta.shareToken = 'sh_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  localSaveTrip();
  const ok = await saveToCloudNow();
  if (ok) {
    if (typeof renderPhotoBook === 'function') renderPhotoBook();
    toast('分享連結已產生');
  } else {
    delete data.meta.shareToken;
    toast('產生失敗，請確認網路連線');
  }
}

function copyShareLink() {
  const url = _getShareUrl();
  if (!url) return;
  navigator.clipboard?.writeText(url).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  });
  toast('已複製分享連結');
}

function shareToLine() {
  const url = _getShareUrl();
  if (!url) return;
  const title = data.meta?.title || '我的旅程行程';
  const msg   = `【${title}】\n即時行程連結：${url}`;
  window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msg)}`, '_blank');
}

async function revokeShareLink() {
  if (!confirm('確定停用此分享連結？所有人的連結都將失效。')) return;
  const token = data.meta?.shareToken;
  if (token && fbDb) {
    try { await publicShareRef(token).delete(); }
    catch (e) { console.warn('revoke share failed', e); }
  }
  delete data.meta.shareToken;
  await saveToCloudNow();
  if (typeof renderPhotoBook === 'function') renderPhotoBook();
  toast('分享連結已停用');
}

/* ──────────────────────────────────────────
   分享行程 Modal（漂亮版面，含 PDF 匯出）
   ────────────────────────────────────────── */

function _buildFlightSection() {
  const sections = ['out','back'].map(k => {
    const f = normalizeFlightObj(data.flights[k]);
    const segs = f.segments.filter(s => s.no || s.from || s.dep);
    if (!segs.length) return '';
    const dir  = k === 'out' ? '去程' : '回程';
    const type = f.type === 'transfer' ? '轉機' : '直飛';
    return `<div class="shareFlightItem">
      <div class="shareTag">${esc(dir)}｜${esc(type)}</div>
      ${segs.map((s, i) => `
        <div class="shareFlightSeg">
          <div class="shareSegLabel">第 ${i+1} 段</div>
          <div class="shareFlightLine">
            <b>${esc(s.no || '—')}</b>
            <span>${esc(s.from||'')} → ${esc(s.to||'')}</span>
            <span class="shareTimePill">${(s.dep||'').slice(5,16).replace('T',' ')} → ${(s.arr||'').slice(5,16).replace('T',' ')}</span>
          </div>
        </div>`).join('')}
    </div>`;
  }).filter(Boolean);
  return sections.length ? sections.join('') : '<div class="shareMuted">尚未設定航班</div>';
}

function _buildHotelSection() {
  if (!data.hotels?.length) return '<div class="shareMuted">尚未新增住宿</div>';
  return data.hotels.map(h => `
    <div class="shareHotelItem">
      <b>${esc(h.name)}</b>
      <span class="shareTimePill">${short(h.start)} — ${short(h.end)}</span>
      ${h.addr ? `<div class="shareMuted" style="margin-top:4px">${esc(h.addr)}</div>` : ''}
    </div>`).join('');
}

function _buildDaySection() {
  return (data.days || []).map(d => {
    const plans = sortedPlans(d.key);
    return `<div class="shareDayItem">
      <div class="shareDayHead">
        <b>${esc(d.title)}｜${esc(d.label)}</b>
        <span class="shareTimePill">${plans.length} 個行程</span>
      </div>
      ${plans.length ? plans.map((p, i) => {
        const time = [p.start, p.end].filter(Boolean).join('－') || '未定時間';
        const autoTag = p.source === 'flight' ? '航班帶入' : p.source === 'hotel' ? '住宿帶入' : '';
        return `<div class="sharePlanRow">
          <span class="shareSeqNum">${i + 1}</span>
          <span class="shareTimePill">${esc(time)}</span>
          <div>
            <div class="sharePlanName">${activityIcon(p.type)} ${esc(p.name||'未命名')}</div>
            ${autoTag ? `<span class="shareAutoTag">${autoTag}</span>` : ''}
            ${p.address ? `<div class="shareMuted">地址：${esc(p.address)}</div>` : ''}
            ${p.note    ? `<div class="shareMuted">注意：${esc(p.note)}</div>` : ''}
          </div>
        </div>`;
      }).join('') : '<div class="shareMuted">尚未安排正式行程</div>'}
    </div>`;
  }).join('');
}

function openShareModal() {
  let modal = $('itineraryShareModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'itineraryShareModal';
    modal.className = 'shareModal';
    modal.onclick = e => { if (e.target === modal) closeShareModal(); };
    document.body.appendChild(modal);
  }

  const url = _getShareUrl();

  modal.innerHTML = `
    <div class="shareBox">
      <div class="shareHero">
        <div class="shareHeroTop">
          <div>
            <div class="shareBrand">貞選旅管家 Janeselect Travel Manager</div>
            <h3>${esc(data.meta.title || '我的旅行行程')}</h3>
            <p>${esc(data.trip.dest || '')}｜${esc(data.trip.start && data.trip.end ? `${short(data.trip.start)} — ${short(data.trip.end)}` : '未設定')}</p>
          </div>
          <button class="shareClose" onclick="closeShareModal()">×</button>
        </div>
      </div>
      <div class="shareScroll">
        <div class="shareSection"><h4>✈️ 機票與交通</h4>${_buildFlightSection()}</div>
        <div class="shareSection"><h4>🏨 住宿資訊</h4>${_buildHotelSection()}</div>
        <div class="shareSection"><h4>🗓️ 每日簡易行程</h4>${_buildDaySection()}</div>
      </div>
      <div class="shareActionsBar">
        ${url ? `
          <div class="shareLinkRow">
            <input class="shareLinkInput" readonly value="${esc(url)}">
            <button class="btn soft compact" onclick="copyShareLink()">複製</button>
          </div>
          <div class="shareActionsRow">
            <button class="btn blue compact" onclick="shareToLine()">LINE 分享</button>
            <button class="btn soft compact" onclick="copyItinerary()">複製文字</button>
            <button class="btn dark compact" onclick="printItinerary()">匯出 PDF</button>
            <button class="shareRevokeBtn" onclick="revokeShareLink()">停用連結</button>
          </div>
        ` : `
          <div class="shareActionsRow">
            ${canUseCloud()
              ? `<button class="btn soft compact" onclick="generateShareLink()">🔗 產生即時連結</button>`
              : `<span class="shareMuted" style="font-size:12px;align-self:center">登入後可產生即時連結</span>`}
            <button class="btn soft compact" onclick="copyItinerary()">複製文字</button>
            <button class="btn dark compact" onclick="printItinerary()">匯出 PDF</button>
          </div>
        `}
      </div>
    </div>`;
  modal.classList.add('show');
}

function closeShareModal() {
  $('itineraryShareModal')?.classList.remove('show');
}

async function copyItinerary() {
  const text = itineraryText();
  try {
    await navigator.clipboard.writeText(text);
    toast('已複製分享文字');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    toast('已複製分享文字');
  }
}

function printItinerary() {
  const w = window.open('', '_blank');
  if (!w) { alert('請允許瀏覽器開啟新視窗後再試一次。'); return; }
  const title = data.meta.title || '簡易行程';

  const dayPrint = (data.days || []).map(d => {
    const plans = sortedPlans(d.key).filter(p => p.source !== 'flight' && p.source !== 'hotel');
    return `<div class="item">
      <div class="dayHead"><b>${esc(d.title)}｜${esc(d.label)}</b></div>
      ${plans.length ? plans.map(p => {
        const time = [p.start, p.end].filter(Boolean).join('－') || '未定';
        return `<div class="plan">
          <span class="pill">${esc(time)}</span>
          <div>
            <div class="main">${esc(p.name||'未命名')}</div>
            ${p.address ? `<div class="mini">地址：${esc(p.address)}</div>` : ''}
            ${p.note    ? `<div class="mini">注意：${esc(p.note)}</div>`    : ''}
          </div>
        </div>`;
      }).join('') : '<div class="mini">尚未安排正式行程</div>'}
    </div>`;
  }).join('');

  w.document.write(`<!DOCTYPE html>
<html lang="zh-Hant"><head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
  @page { size:A4; margin:12mm }
  * { box-sizing:border-box }
  body { font-family:"PingFang TC","Noto Sans TC","Helvetica Neue",sans-serif;
         color:#2C2A29; background:#F7F3EC; margin:0; padding:24px }
  .page { max-width:900px; margin:auto; background:#FFFDFC;
          border:1px solid #E2DDD5; border-radius:28px;
          overflow:hidden; box-shadow:0 18px 48px rgba(44,42,41,.08) }
  .hero { padding:28px;
          background:linear-gradient(135deg,#FFFDFC,#F2F6F4);
          border-bottom:1px solid #E2DDD5 }
  .brand { display:inline-flex; border-radius:999px; background:#F2F6F4;
           color:#4A5D4E; border:1px solid #E2DDD5;
           padding:7px 12px; font-size:12px; font-weight:900; margin-bottom:14px }
  h1 { font-size:28px; margin:0 0 6px }
  .sub { color:#8B827A; font-size:13px; line-height:1.6 }
  .content { padding:22px }
  .sec { border:1px solid #E2DDD5; border-radius:20px; padding:16px;
         margin-bottom:14px; break-inside:avoid; background:#fff }
  h2 { font-size:16px; margin:0 0 10px }
  .item { border:1px solid #EEE8DF; border-radius:16px;
          padding:11px; margin:8px 0; break-inside:avoid }
  .dayHead { font-weight:900; margin-bottom:8px; font-size:14px }
  .plan { display:grid; grid-template-columns:90px 1fr;
          gap:8px; margin:6px 0; align-items:start }
  .pill { display:inline-flex; justify-content:center;
          border-radius:999px; background:#F3EEE8; color:#6F6257;
          padding:4px 8px; font-size:11px; font-weight:900;
          white-space:nowrap }
  .main { font-weight:900; line-height:1.5 }
  .mini { color:#8B827A; font-size:12px; margin-top:3px }
  .footer { text-align:center; color:#8B827A; font-size:11px;
            padding:14px; border-top:1px solid #E2DDD5 }
  @media print {
    body { background:#fff; padding:0 }
    .page { box-shadow:none; border:0; border-radius:0 }
    .sec { page-break-inside:avoid }
  }
</style></head>
<body><div class="page">
  <div class="hero">
    <div class="brand">貞選旅管家 Janeselect Travel Manager</div>
    <h1>${esc(title)}</h1>
    <div class="sub">${esc(data.trip.dest||'')}｜${esc(data.trip.start && data.trip.end ? `${data.trip.start} — ${data.trip.end}` : '')}</div>
  </div>
  <div class="content">
    <div class="sec"><h2>✈️ 機票與交通</h2>${_buildFlightSection().replace(/class="share/g, 'class="')}</div>
    <div class="sec"><h2>🏨 住宿資訊</h2>${_buildHotelSection().replace(/class="share/g, 'class="')}</div>
    <div class="sec"><h2>🗓️ 每日行程</h2>${dayPrint}</div>
  </div>
  <div class="footer">貞選旅管家 Janeselect Travel Manager</div>
</div>
<script>setTimeout(()=>window.print(),350)<\/script>
</body></html>`);
  w.document.close();
}

/* ── AI 健檢建議顯示（在行程頁顯示，可收縮） ── */
function aiReviewHtml() {
  const reviews = (data?.aiReviews?.itinerary || []).slice(0, 3);
  if (!reviews.length) return '';
  return `<div class="aiReviewList">
    ${reviews.map(r => `
      <details class="aiReviewCard">
        <summary class="aiReviewSummary">
          <div>
            <b>AI 健檢建議</b>
            <span>${esc((r.createdAt||'').slice(0,10))}｜只作為調整參考</span>
          </div>
          <button class="aiReviewDelete" onclick="event.stopPropagation();deleteAiReview('${r.id}')">刪除</button>
        </summary>
        <div class="aiReviewBody">
          ${r.summary ? `<div class="box mint" style="margin-bottom:8px">${esc(r.summary)}</div>` : ''}
          ${r.items?.length ? r.items.map(x => `
            <div class="aiReviewItem">
              <span class="tag ${x.level==='注意'?'pink':x.level==='OK'?'green':''}">${esc(x.level)}</span>
              <b>${esc(x.title)}</b>
              ${x.day ? `<span style="color:#8b827a;font-size:12px">${esc(x.day)}</span>` : ''}
              ${x.memo ? `<div style="font-size:13px;color:#8b827a;margin-top:3px">${esc(x.memo)}</div>` : ''}
            </div>`).join('') : ''}
        </div>
      </details>`).join('')}
  </div>`;
}

function deleteAiReview(id) {
  if (!data.aiReviews?.itinerary) return;
  data.aiReviews.itinerary = data.aiReviews.itinerary.filter(x => x.id !== id);
  save();
  renderPlanner();
}
