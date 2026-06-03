/* ================================================================
   spots.js — 口袋景點
   ================================================================ */

let spotFilterType = '';
let spotFilterDay  = '';

function saveSpot() {
  if (!$('sn')?.value) return toast('請輸入景點名稱');

  const item = {
    name:      $('sn').value,
    type:      $('st')?.value || '景點',
    day:       $('sd')?.value || '',
    addr:      $('sa')?.value || '',
    note:      $('sm')?.value || '',
    memo:      editingSpotId ? (data.spots.find(s => s.id === editingSpotId)?.memo || '') : '',
    start:     getTimeVal('sStart'),
    end:       getTimeVal('sEnd'),
    krName:    $('skrName')?.value || '',
    krAddress: $('skrAddr')?.value || ''
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
        address:   item.addr      || '',
        note:      item.note      || '',
        memo:      '由口袋景點帶入',
        krName:    item.krName    || '',
        krAddress: item.krAddress || '',
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

  const planDay = s.day || currentDay || data.days?.[0]?.key || '';
  const plan = {
    id: uid(), source: 'spot', sourceType: 'spot', lockedName: true,
    day:       planDay,
    start:     s.start || '10:00',
    end:       s.end   || '11:30',
    type:      normalizePlanType(s.type),
    name:      s.name,
    address:   s.addr      || '',
    note:      s.memo      || '',
    memo:      '由口袋景點帶入',
    krName:    s.krName    || '',
    krAddress: s.krAddress || '',
    mode: 'foreign', foreign: 0, twd: 0, payer: '未定', payMethod: '未定',
    adjusted: false
  };
  data.plans.push(plan);
  s.planId = plan.id;
  data.expenses.push({
    id: uid(), source: '行程',
    type: budgetTypeFromPlanType(s.type),
    name: s.name, payer: '未定', payMethod: '未定',
    day: planDay, mode: 'TWD', foreign: 0, twd: 0,
    memo: `由${s.type}行程建立`
  });

  currentDay = cur = planDay;
  save();
  toast(`已排入 ${dayTitle(planDay)}`);
  go('planner');
  scrollTo(0, 0);
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
  const kw  = encodeURIComponent($('exploreKeyword')?.value || (_exploreSpot?.name || ''));
  const kwRaw = $('exploreKeyword')?.value || (_exploreSpot?.name || '');

  if (type === 'blog') {
    window.open(`https://www.google.com/search?q=${kw}+遊記心得`, '_blank'); return;
  }
  if (type === 'video') {
    window.open(`https://www.youtube.com/results?search_query=${kw}`, '_blank'); return;
  }
  if (type === 'checkin') {
    window.open(`https://www.google.com/search?q=${kw}+site:instagram.com+OR+site:facebook.com+OR+site:threads.net`, '_blank'); return;
  }
  if (type === 'official') {
    window.open(`https://www.google.com/search?q=${kw}+官方網站`, '_blank'); return;
  }
  if (type === 'ai') {
    const s = _exploreSpot || {};
    const prompt = `我正在規劃 ${data.trip.dest || '旅程'}，想快速了解這個景點是否值得排入行程。

景點：${s.name || ''}
分類：${s.type || ''}
地址／區域：${s.addr || '（未填）'}${s.memo ? '\n備註：' + s.memo : ''}

請幫我整理：
1. 這個景點大概長什麼樣、適合怎麼玩。
2. 建議停留時間。
3. 適合安排在早上、下午或晚上。
4. 附近可順遊的方向。
5. 可能要注意的排隊、交通、天氣或公休日問題。
6. 如果我貼上遊記或搜尋結果連結，請幫我整理重點，不要直接複製原文。

搜尋關鍵字參考：${kwRaw}`;

    // 關閉探索 modal，顯示提示詞 modal
    closeExploreModal();
    _showSpotAiModal(prompt);
  }
}

function _showSpotAiModal(prompt) {
  let modal = $('spotAiModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'spotAiModal';
    modal.className = 'aiPromptModal';
    modal.onclick = e => { if (e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="aiPromptBox">
      <div class="aiModalHead">
        <div>
          <h3>AI 摘要</h3>
          <p>可把搜尋結果或遊記連結一起貼給 AI，整理成玩法重點。</p>
        </div>
        <button class="aiModalClose" onclick="$('spotAiModal').classList.remove('show')">×</button>
      </div>
      <textarea id="spotAiPromptText" readonly style="font-size:12px;line-height:1.6;min-height:200px;background:#f7f3ec">${esc(prompt)}</textarea>
      <div class="aiTargetBtns">
        <button class="btn dark"  onclick="_openSpotAiTarget('chatgpt')">ChatGPT</button>
        <button class="btn blue"  onclick="_openSpotAiTarget('gemini')">Gemini</button>
        <button class="btn soft"  onclick="_openSpotAiTarget('claude')">Claude</button>
      </div>
      <div class="btns" style="margin-top:8px">
        <button class="btn soft compact" onclick="_copySpotAiPrompt()">複製</button>
        <button class="btn soft compact" onclick="$('spotAiModal').classList.remove('show')">關閉</button>
      </div>
    </div>`;
  modal.classList.add('show');
}

function _copySpotAiPrompt() {
  const text = $('spotAiPromptText')?.value || '';
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  });
  toast('已複製提示詞');
}

function _openSpotAiTarget(target) {
  const text = $('spotAiPromptText')?.value || '';
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  });
  toast('已複製，請在新分頁貼上');
  const url = target === 'gemini' ? 'https://gemini.google.com/app'
            : target === 'claude' ? 'https://claude.ai/'
            : 'https://chatgpt.com/';
  window.open(url, '_blank');
}

function naverMapSpot(id) {
  const s = data.spots.find(x => x.id === id);
  if (!s) return;
  const q = encodeURIComponent(s.krName || s.name);
  window.open(`https://map.naver.com/p/search/${q}`, '_blank');
}

function copyKoreanText(id) {
  const s = data.spots.find(x => x.id === id);
  if (!s?.krName) return;
  const text = [s.krName, s.krAddress].filter(Boolean).join('\n');
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  });
  toast('已複製，可貼到 NAVER 記事');
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
          name:      String(s.name      || ''),
          type:      String(s.type      || '景點'),
          day,
          addr:      String(s.addr      || s.address || ''),
          memo:      String(s.memo      || s.note    || ''),
          start:     String(s.start     || ''),
          end:       String(s.end       || ''),
          krName:    String(s.krName    || ''),
          krAddress: String(s.krAddress || '')
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
