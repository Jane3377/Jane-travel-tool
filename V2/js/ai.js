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
    zodiac: $('aiZodiac')?.value      || ''
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
    </div>`;
}

/* ══════════════════════════════════════════
   AI 提示詞產生
   ══════════════════════════════════════════ */

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

function buildSpotsPrompt() {
  const c = buildTripContext();
  return `請依照以下旅行設定，幫我產出可匯入「貞選旅管家」的口袋景點 JSON。

旅行設定：
- 目的地：${c.dest}
- 國家/區域：${c.country}
- 城市/路線：${c.city || c.dest}
- 日期：${c.dates}
- 旅伴：${c.travelers}

旅行日期：
${c.days}

住宿：
${c.hotels}

請注意：
1. 推薦景點、餐廳、咖啡廳、購物、雨天備案。
2. 如果適合某天，請填 day（YYYY-MM-DD 格式）；不確定就留空。
3. 只輸出純 JSON，格式如下：

{
  "spots": [
    {
      "name": "景點名稱",
      "type": "景點/餐廳/咖啡廳/購物/雨天備案/其他",
      "day": "YYYY-MM-DD 或留空",
      "addr": "地址或區域",
      "memo": "推薦理由或注意事項"
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

function showAIPrompt(type = 'spots') {
  const modal = ensureAiModal();
  const prompt = type === 'spots' ? buildSpotsPrompt() : buildItineraryPrompt();
  const title  = type === 'spots' ? 'AI 口袋景點提示詞' : 'AI 行程健檢提示詞';

  modal.innerHTML = `
    <div class="aiPromptBox">
      <div class="section">
        <h3>${esc(title)}</h3>
        <button class="iconBtn" onclick="closeAIPrompt()">×</button>
      </div>
      ${type === 'itinerary' ? aiPrefsHtml() : ''}
      <textarea id="aiPromptText">${esc(prompt)}</textarea>
      <div class="btns">
        <button class="btn dark" onclick="copyAIPrompt()">複製提示詞</button>
        <button class="btn blue" onclick="window.open('https://claude.ai/','_blank')">開啟 Claude AI</button>
        <button class="btn soft" onclick="closeAIPrompt()">關閉</button>
      </div>
    </div>`;
  modal.classList.add('show');
  if ($('aiPromptText')) $('aiPromptText').value = prompt;
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

    if (spots.length) {
      spots.forEach(s => {
        if (!s.name) return;
        const day = data.days.some(d => d.key === s.day) ? s.day : '';
        data.spots.push({
          id: uid(), source: 'AI匯入',
          name: String(s.name || ''), type: String(s.type || '景點'),
          day, addr: String(s.addr || ''), memo: String(s.memo || '')
        });
      });
      save();
      toast(`已匯入 ${spots.length} 個景點`);
      closeImportModal();
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

function openShareModal() {
  let modal = $('itineraryShareModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id        = 'itineraryShareModal';
    modal.className = 'aiPromptModal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="aiPromptBox">
      <div class="section">
        <h3>分享行程</h3>
        <button class="iconBtn" onclick="closeShareModal()">×</button>
      </div>
      <div class="btns">
        <button class="btn dark" onclick="copyItinerary()">複製純文字</button>
        <button class="btn blue" onclick="printItinerary()">列印行程單</button>
        <button class="btn soft" onclick="closeShareModal()">關閉</button>
      </div>
      <pre class="sharePreview">${esc(itineraryText())}</pre>
    </div>`;
  modal.classList.add('show');
}

function closeShareModal() {
  $('itineraryShareModal')?.classList.remove('show');
}

function copyItinerary() {
  const text = itineraryText();
  navigator.clipboard?.writeText(text)
    .then(() => toast('已複製行程'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('已複製行程');
    });
}

function printItinerary() {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html lang="zh-Hant"><head>
    <meta charset="UTF-8"><title>${esc(data.meta.title||'行程')}</title>
    <style>body{font-family:'PingFang TC',sans-serif;max-width:640px;margin:24px auto;font-size:14px;line-height:1.8}
    pre{white-space:pre-wrap;font-family:inherit}</style></head>
    <body><pre>${esc(itineraryText())}</pre></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 200);
}

/* ── AI 健檢建議顯示（在行程頁顯示） ── */
function aiReviewHtml() {
  const reviews = (data?.aiReviews?.itinerary || []).slice(0, 3);
  if (!reviews.length) return '';
  return `<div class="aiReviewList" style="margin-top:14px">
    ${reviews.map(r => `
      <div class="aiReviewCard">
        <div class="aiReviewHead">
          <div>
            <b>AI 健檢建議</b>
            <span>${esc((r.createdAt||'').slice(0,10))}｜只作為調整參考，不會自動覆蓋行程。</span>
          </div>
          <button class="small" onclick="deleteAiReview('${r.id}')">刪除</button>
        </div>
        ${r.summary ? `<div class="box mint" style="margin-top:8px">${esc(r.summary)}</div>` : ''}
        ${r.items?.length ? `<div style="margin-top:8px">${r.items.map(x => `
          <div class="aiReviewItem">
            <span class="tag ${x.level==='注意'?'pink':x.level==='OK'?'green':''}">${esc(x.level)}</span>
            <b>${esc(x.title)}</b>
            ${x.day ? `<span style="color:#8b827a;font-size:12px">${esc(x.day)}</span>` : ''}
            ${x.memo ? `<div style="font-size:13px;color:#8b827a;margin-top:3px">${esc(x.memo)}</div>` : ''}
          </div>`).join('')}</div>` : ''}
      </div>`).join('')}
  </div>`;
}

function deleteAiReview(id) {
  if (!data.aiReviews?.itinerary) return;
  data.aiReviews.itinerary = data.aiReviews.itinerary.filter(x => x.id !== id);
  save();
}
