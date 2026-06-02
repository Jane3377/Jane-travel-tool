/* ================================================================
   spots.js — 口袋景點
   ================================================================ */

function saveSpot() {
  if (!$('sn')?.value) return toast('請輸入景點名稱');

  const item = {
    name:  $('sn').value,
    type:  $('st')?.value || '景點',
    day:   $('sd')?.value || '',
    addr:  $('sa')?.value || '',
    memo:  $('sm')?.value || '',
    start: $('sStart')?.value || '',
    end:   $('sEnd')?.value   || ''
  };

  if (editingSpotId) {
    Object.assign(data.spots.find(s => s.id === editingSpotId), item);
    editingSpotId = null;
  } else {
    const spot = { id: uid(), ...item, source: '手動' };
    data.spots.push(spot);

    // 同步排入行程
    if ($('sToPlan')?.value === 'yes') {
      const planDay = item.day || currentDay;
      const plan = {
        id: uid(), source: 'spot', sourceType: 'spot', lockedName: true,
        day: planDay,
        start: item.start || '10:00',
        end:   item.end   || '11:30',
        type:  normalizePlanType(item.type),
        name:  item.name,
        address: item.addr || '',
        note:  item.memo || '',
        memo:  '由口袋景點帶入',
        mode: 'foreign', foreign: 0, twd: 0, payer: '未定', payMethod: '未定',
        adjusted: false
      };
      data.plans.push(plan);
      spot.planId = plan.id;
      data.expenses.push({
        id: uid(), source: '行程',
        type: budgetTypeFromPlanType(item.type),
        name: item.name, payer: '未定', payMethod: '未定',
        day: planDay, mode: 'TWD', foreign: 0, twd: 0,
        memo: `由${item.type}行程建立`
      });
    }
  }
  save();
}

function editSpot(id) {
  editingSpotId = id;
  renderSpots();
  scrollTo(0, 0);
}

function deleteSpot(id) {
  if (!confirm('確定刪除景點？')) return;
  data.spots = data.spots.filter(s => s.id !== id);
  if (editingSpotId === id) editingSpotId = null;
  save();
}

function clearSpotForm() {
  editingSpotId = null;
  renderSpots();
}

function mapSpotDraft() {
  const q = (($('sn')?.value || '') + ' ' + ($('sa')?.value || '') + ' ' + data.trip.dest).trim();
  if (!$('sn')?.value) return toast('請先輸入景點名稱');
  openMap(encodeURIComponent(q));
}

function useSpot(id) {
  const s = data.spots.find(x => x.id === id);
  if (!s) return;
  v16PendingSpotId = id;
  editingPlanId    = null;
  go('planner');
  setTimeout(() => {
    const form = document.querySelector('#plannerView details.card');
    if (form) form.setAttribute('open', '');
    fillFromSpot(id);
    scrollTo(0, 0);
  }, 80);
}

function returnSpotToPocket(id) {
  const s = data.spots.find(x => x.id === id);
  if (!s?.planId) return;
  if (!confirm('要把景點放回口袋，並移除已排入的行程嗎？')) return;
  data.plans = data.plans.filter(p => p.id !== s.planId);
  data.conns = data.conns.filter(c => c.a !== s.planId && c.b !== s.planId);
  delete s.planId;
  save();
}

function spotPlanExists(s) {
  return !!(s.planId && data.plans.some(p => p.id === s.planId));
}

/* ══════════════════════════════════════════
   探索景點 Modal
   ══════════════════════════════════════════ */

let _exploreSpot = null;

function openExploreModal(id) {
  _exploreSpot = data.spots.find(s => s.id === id);
  if (!_exploreSpot) return;

  let modal = $('exploreModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'exploreModal';
    modal.className = 'exploreModal';
    modal.onclick = e => { if (e.target === modal) closeExploreModal(); };
    document.body.appendChild(modal);
  }

  const s = _exploreSpot;
  const keyword = [s.name, s.addr || '', data.trip.dest].filter(Boolean).join(' ');

  modal.innerHTML = `
    <div class="exploreBox">
      <div class="exploreHead">
        <div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.type)}${s.addr ? '｜' + esc(s.addr) : ''}</p>
        </div>
        <button class="exploreClose" onclick="closeExploreModal()">×</button>
      </div>
      <div class="exploreKeywordRow">
        <span class="exploreKeywordLabel">搜尋關鍵字：</span>
        <input id="exploreKeyword" class="exploreKeywordInput" value="${esc(keyword)}">
      </div>
      <div class="exploreGrid">
        <button class="btn dark" onclick="runExplore('blog')">遊記</button>
        <button class="btn soft" onclick="runExplore('video')">影片</button>
        <button class="btn soft" onclick="runExplore('checkin')">打卡</button>
        <button class="btn soft" onclick="runExplore('official')">官方</button>
        <button class="btn soft exploreAiBtn" onclick="runExplore('ai')">AI 摘要</button>
      </div>
    </div>`;
  modal.classList.add('show');
}

function closeExploreModal() {
  $('exploreModal')?.classList.remove('show');
}

function runExplore(type) {
  const kw = encodeURIComponent($('exploreKeyword')?.value || (_exploreSpot?.name || ''));
  const urls = {
    blog:     `https://www.google.com/search?q=${kw}+遊記心得`,
    video:    `https://www.youtube.com/results?search_query=${kw}`,
    checkin:  `https://www.google.com/search?q=${kw}+打卡推薦`,
    official: `https://www.google.com/search?q=${kw}+官方網站`
  };
  if (type === 'ai') {
    const s    = _exploreSpot || {};
    const name = $('exploreKeyword')?.value || s.name || '';
    const prompt = `請幫我簡單介紹「${name}」，包含：
- 景點特色與亮點
- 建議停留時間
- 開放時間與票價（如有）
- 交通方式
- 注意事項或小提醒

請用繁體中文條列式回覆，簡潔清楚即可。`;
    navigator.clipboard?.writeText(prompt).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    });
    toast('已複製 AI 摘要提示詞，請貼到 AI 工具');
    window.open('https://claude.ai/', '_blank');
    return;
  }
  if (urls[type]) window.open(urls[type], '_blank');
}

function importSpotFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let text = e.target.result.trim();
      // 清理 markdown code block
      text = text.replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const first = text.indexOf('{'), last = text.lastIndexOf('}');
      if (first >= 0 && last > first) text = text.slice(first, last + 1);

      const obj   = JSON.parse(text);
      const spots = Array.isArray(obj.spots) ? obj.spots : (Array.isArray(obj) ? obj : []);
      let cleared = 0;

      spots.forEach(s => {
        if (!s.name) return;
        const day = (s.day && data.days.some(d => d.key === s.day)) ? s.day : '';
        if (s.day && !day) cleared++;
        data.spots.push({
          id: uid(), source: 'AI匯入',
          name:  String(s.name  || ''),
          type:  String(s.type  || '景點'),
          day,
          addr:  String(s.addr  || s.address || ''),
          memo:  String(s.memo  || s.note    || ''),
          start: String(s.start || ''),
          end:   String(s.end   || '')
        });
      });

      save();
      toast(cleared
        ? `已匯入 ${spots.length} 個景點；${cleared} 個日期超出旅程已清空`
        : `已匯入 ${spots.length} 個景點`);
    } catch (err) {
      alert('匯入失敗：請確認內容是合法的 JSON 格式，且包含 spots 陣列。\n\n錯誤：' + err.message);
    }
  };
  reader.readAsText(file);
}
