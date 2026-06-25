/* ================================================================
   planner.js — 行程規劃、交通連線
   ================================================================ */

/* ══════════════════════════════════════════
   行程 CRUD
   ══════════════════════════════════════════ */

/* ── 時長連動 ── */
function planStartChange() {
  // 如果有選時長，重算結束時間
  const dur = Number($('pdur')?.value || 0);
  if (dur > 0 && getTimeVal('ps')) planDurationChange();
  else planEndChange();
}

function planDurationChange() {
  const s   = getTimeVal('ps');
  const dur = Number($('pdur')?.value || 0);
  if (!s || !dur) return;
  setTimeVal('pe', addMinutes(s, dur));
  planEndChange();
}

function planEndChange() {
  const s = getTimeVal('ps');
  const e = getTimeVal('pe');
  const el = $('pdurDisplay');
  if (!el) return;
  if (s && e) {
    const mins = timeToMin(e) - timeToMin(s);
    if (mins > 0) {
      const h = Math.floor(mins / 60), m = mins % 60;
      el.textContent = h && m ? `${h} 小時 ${m} 分` : h ? `${h} 小時` : `${m} 分`;
      el.style.display = 'inline';
      // 若符合整 30 分，同步更新時長下拉
      if (mins % 30 === 0 && mins <= 300 && $('pdur')) $('pdur').value = String(mins);
      return;
    }
  }
  el.textContent = '';
  el.style.display = 'none';
}

function planSyncDurDisplay() {
  const s = getTimeVal('ps');
  const e = getTimeVal('pe');
  if (s && e) {
    const mins = timeToMin(e) - timeToMin(s);
    if (mins > 0 && mins % 30 === 0 && mins <= 300 && $('pdur')) $('pdur').value = String(mins);
  }
  planEndChange();
}

function savePlanForm() {
  const name = $form('pname')?.value.trim();
  if (!name) return toast('請輸入地點');

  const wasEditing = !!editingPlanId;
  const day   = $form('pday')?.value || currentDay;
  const start = getTimeVal('ps');
  const end   = getTimeVal('pe');
  const type  = normalizePlanType($form('ptype')?.value);

  const item = {
    day, start, end, type, name,
    address:    $form('paddress')?.value       || '',
    krName:     $form('pkrName')?.value.trim() || '',
    krAddress:  $form('pkrAddr')?.value.trim() || '',
    note:       $form('pnote')?.value          || '',
    memo:       editingPlanId
                  ? (data.plans.find(p => p.id === editingPlanId)?.memo || '')
                  : (v16PendingSpotId ? '由口袋景點帶入' : ''),
    mode:       'foreign',
    foreign:    0,
    twd:        0,
    payer:      '未定',
    payMethod:  '未定',
    adjusted:   false,
    source:     'manual'
  };

  if (editingPlanId) {
    const existing = data.plans.find(p => p.id === editingPlanId);
    if (existing) {
      // 保留內部欄位
      item.source = existing.source;
      if (existing.hotelId) item.hotelId = existing.hotelId;
      Object.assign(existing, item);
      // 同步到對應景點
      const spot = data.spots.find(s => s.planId === existing.id);
      if (spot) {
        spot.name      = item.name;
        spot.type      = item.type;
        spot.addr      = item.address   || '';
        spot.krName    = item.krName    || '';
        spot.krAddress = item.krAddress || '';
        spot.note      = item.note      || '';
        spot.day       = item.day       || spot.day;
      }
    }
    editingPlanId = null;
  } else {
    const plan = { id: uid(), ...item };
    data.plans.push(plan);
    // 自動建立預算
    data.expenses.push({
      id: uid(), source: '行程',
      type: budgetTypeFromPlanType(type),
      name, payer: '未定', payMethod: '未定',
      day, mode: 'TWD', foreign: 0, twd: 0,
      memo: `由${type}行程建立`
    });
  }

  // 如果是從口袋景點帶入
  if (v16PendingSpotId) {
    const spot = data.spots.find(s => s.id === v16PendingSpotId);
    const plan = data.plans.find(p => p.name === name && p.day === day);
    if (spot && plan) {
      spot.planId        = plan.id;
      plan.source        = 'spot';
      plan.lockedName    = true;
      plan.krName        = spot.krName    || '';
      plan.krAddress     = spot.krAddress || '';
    }
    v16PendingSpotId = null;
  }

  currentDay = cur = day;
  save();
  closeAddSheet();
  toast(wasEditing ? '已更新行程' : '已新增行程');
}

function editPlan(id) {
  openEditSheet('plan', id);
}

function deletePlan(id) {
  if (!confirm('確定刪除這個行程？')) return;
  data.plans = data.plans.filter(p => p.id !== id);
  data.conns = data.conns.filter(c => c.a !== id && c.b !== id);
  data.spots.forEach(s => { if (s.planId === id) delete s.planId; });
  if (editingPlanId === id) editingPlanId = null;
  save();
}

function reorderPlan(planId, dir) {
  const plans = sortedPlans(currentDay);
  const idx   = plans.findIndex(p => p.id === planId);
  const next  = idx + dir;
  if (idx < 0 || next < 0 || next >= plans.length) return;

  const a = plans[Math.min(idx, next)];   // earlier slot
  const b = plans[Math.max(idx, next)];   // later slot
  const durA = diffMinutes(a.start, a.end);
  const durB = diffMinutes(b.start, b.end);

  // b takes a's original start; a follows immediately after
  b.start = a.start;
  b.end   = addMinutes(a.start, durB);
  a.start = b.end;
  a.end   = addMinutes(b.end, durA);
  a.adjusted = false;
  b.adjusted = false;

  save();
  renderPlanner();
}

function clearPlanForm() {
  editingPlanId    = null;
  v16PendingSpotId = null;
  renderPlanner();
}

function fillPlanForm(id) {
  const p = data.plans.find(x => x.id === id);
  if (!p) return;
  if ($('pday'))     $('pday').value     = p.day     || currentDay;
  setTimeVal('ps', p.start || '');
  setTimeVal('pe', p.end   || '');
  if ($('ptype'))    $('ptype').value    = normalizePlanType(p.type);
  if ($('pname'))    $('pname').value    = p.name      || '';
  if ($('paddress')) $('paddress').value = p.address   || '';
  if ($('pkrName'))  $('pkrName').value  = p.krName    || '';
  if ($('pkrAddr'))  $('pkrAddr').value  = p.krAddress || '';
  if ($('pnote'))    $('pnote').value    = p.note      || '';
  planSyncDurDisplay();
  applyLockedNameState();
  applyLockedTimeState();
}

function fillFromSpot(spotId) {
  const s = data.spots.find(x => x.id === spotId);
  if (!s) return;
  if ($('pday'))     $('pday').value     = s.day || currentDay;
  if ($('ptype'))    $('ptype').value    = normalizePlanType(s.type);
  if ($('pname'))    { $('pname').value  = s.name; $('pname').readOnly = true; $('pname').classList.add('lockedInput'); }
  if ($('paddress')) $('paddress').value = s.addr      || '';
  if ($('pkrName'))  $('pkrName').value  = s.krName    || '';
  if ($('pkrAddr'))  $('pkrAddr').value  = s.krAddress || '';
  if ($('pnote'))    $('pnote').value    = s.note || s.memo || '';
  if (s.start) setTimeVal('ps', s.start);
  if (s.end)   setTimeVal('pe', s.end);
  planSyncDurDisplay();
  const hint = $('lockedNameHint');
  if (hint) hint.style.display = '';
}

function applyLockedNameState() {
  const p = editingPlanId ? data.plans.find(x => x.id === editingPlanId) : null;
  const locked = !!(p?.lockedName || v16PendingSpotId);
  if ($('pname')) {
    $('pname').readOnly = locked;
    $('pname').classList.toggle('lockedInput', locked);
  }
  const hint = $('lockedNameHint');
  if (hint) hint.style.display = locked ? '' : 'none';
}

function applyLockedTimeState() {
  const p = editingPlanId ? data.plans.find(x => x.id === editingPlanId) : null;
  const locked = !!p?.lockedTime;
  ['psH','psM','peH','peM','pdur'].forEach(id => {
    const el = $(id);
    if (el) el.disabled = locked;
  });
  const hint = $('lockedTimeHint');
  if (hint) hint.style.display = locked ? '' : 'none';
}

function clearAllPlans() {
  if (!confirm('清除所有行程將刪除目前的行程卡片與交通連線，確定嗎？')) return;
  data.plans = [];
  data.conns = [];
  save();
}

/* ══════════════════════════════════════════
   時間自動調整
   ══════════════════════════════════════════ */

function normalizePlanTimes(day) {
  const plans   = sortedPlans(day);
  let changed   = false;

  for (let i = 1; i < plans.length; i++) {
    const prev = plans[i - 1];
    const cur  = plans[i];
    const conn = data.conns.find(c => c.a === prev.id && c.b === cur.id);
    if (!conn) continue;

    const arrival = addMinutes(prev.end, Number(conn.h || 0) * 60 + Number(conn.m || 0));
    if (arrival && timeToMin(arrival) > timeToMin(cur.start)) {
      const dur   = diffMinutes(cur.start, cur.end);
      cur.start   = arrival;
      cur.end     = addMinutes(arrival, dur);
      cur.adjusted = true;
      changed     = true;
    }
  }

  if (changed) {
    silentSave();
    setTimeout(() => toast('部分行程已依交通自動調整'), 100);
  }
}

/* ══════════════════════════════════════════
   交通連線
   ══════════════════════════════════════════ */

function getOrCreateConn(a, b) {
  let conn = data.conns.find(c => c.a === a.id && c.b === b.id);
  if (!conn) {
    conn = {
      id: uid(), a: a.id, b: b.id,
      mode: '大眾運輸', h: 0, m: 0,
      memo: '', fareForeign: 0, fareTwd: 0,
      payer: '未定', payMethod: '未定'
    };
    data.conns.push(conn);
    silentSave();
  }
  return conn;
}

function updateConn(id, key, val) {
  const conn = data.conns.find(c => c.id === id);
  if (!conn) return;
  conn[key] = val;
  silentSave();
  _refreshConnSummary(conn);
}

function connModeIcon(mode) {
  const m = { '走路':'🚶','開車/計程車':'🚗','大眾運輸':'🚌','航班':'✈️','自訂':'🚖' };
  return m[mode] || '🚌';
}

function _refreshConnSummary(conn) {
  const el = document.querySelector(`details.connRow[data-conn-id="${conn.id}"]`);
  if (!el) return;
  const summary = el.querySelector('.connSummary');
  if (!summary) return;
  const totalH    = Number(conn.h || 0);
  const totalM    = Number(conn.m || 0);
  const modeLabel = conn.mode === '自訂' ? (conn.customMode || '自訂') : (conn.mode || '大眾運輸');
  const timeLabel = totalH > 0 && totalM > 0 ? `${totalH}時${totalM}分`
                  : totalH > 0 ? `${totalH}時`
                  : totalM > 0 ? `${totalM}分` : '';
  const planA   = data.plans.find(p => p.id === conn.a);
  const arrival = planA ? addMinutes(planA.end, totalH * 60 + totalM) : '';
  const iconEl    = summary.querySelector('.connModeIcon');
  const modeEl    = summary.querySelector('.connModeLabel');
  const timeEl    = summary.querySelector('.connTimeLabel');
  const arrivalEl = summary.querySelector('.connArrival');
  if (iconEl)    iconEl.textContent    = connModeIcon(conn.mode);
  if (modeEl)    modeEl.textContent    = modeLabel;
  if (timeEl)  { timeEl.textContent    = timeLabel ? `· ${timeLabel}` : ''; }
  if (arrivalEl) { arrivalEl.textContent = arrival ? `→ ${arrival}` : ''; }
  const isWalk = conn.mode === '走路' && (totalH * 60 + totalM) <= 15;
  el.classList.toggle('connRow--walk', isWalk);
}

function toggleNearbyPicker(planId) {
  const el = document.getElementById('nearbyPicker-' + planId);
  if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

function addNearbyToPlan(planId, spotId) {
  const p = data.plans.find(x => x.id === planId);
  if (!p) return;
  if (!p.nearby) p.nearby = [];
  if (!p.nearby.includes(spotId)) { p.nearby.push(spotId); save(); renderPlanner(); }
}

function removeNearbyFromPlan(planId, spotId) {
  const p = data.plans.find(x => x.id === planId);
  if (!p?.nearby) return;
  p.nearby = p.nearby.filter(id => id !== spotId);
  save();
  renderPlanner();
}

function changeConnMode(id, val) {
  const openSet = new Set(
    [...document.querySelectorAll('details.connRow[open]')]
      .map(el => el.dataset.connId).filter(Boolean)
  );
  const conn = data.conns.find(c => c.id === id);
  if (!conn) return;
  conn.mode = val;
  save();
  document.querySelectorAll('details.connRow[data-conn-id]').forEach(el => {
    if (openSet.has(el.dataset.connId)) el.open = true;
  });
}

function connHtml(a, b) {
  const conn     = getOrCreateConn(a, b);
  const totalH   = Number(conn.h || 0);
  const totalM   = Number(conn.m || 0);
  const arrival  = addMinutes(a.end, totalH * 60 + totalM);
  const isTaxi   = conn.mode === '開車/計程車';
  const isKorea  = data.trip.country === '韓國';
  const timeLabel = totalH > 0 && totalM > 0 ? `${totalH}時${totalM}分`
                  : totalH > 0 ? `${totalH}時`
                  : totalM > 0 ? `${totalM}分` : '0分';

  // Summary route buttons — Korea: Naver Map + Google Maps; others: Google Maps only
  const aName = isKorea ? (a.krName || a.name) : a.name;
  const bName = isKorea ? (b.krName || b.name) : b.name;
  const googleMapsBtn = (compact) => `<button class="btn blue ${compact?'compact':''}" onclick="${compact?'event.stopPropagation();':''}openRoute('${jsStr(encodeURIComponent(a.name+' '+data.trip.dest))}','${jsStr(encodeURIComponent(b.name+' '+data.trip.dest))}','${jsStr(conn.mode)}')">Google Maps${compact?'':' 查路線'}</button>`;
  const naverMapBtn   = (compact) => `<button class="btn soft ${compact?'compact':''}" onclick="${compact?'event.stopPropagation();':''}window.open('https://map.naver.com/p/search/${jsStr(encodeURIComponent(bName))}','_blank')">NAVER Map${compact?'':' 搜尋'}</button>`;

  const summaryRouteBtns = isKorea
    ? naverMapBtn(true) + googleMapsBtn(true)
    : googleMapsBtn(true);

  const detailRouteBtns = isKorea
    ? naverMapBtn(false) + googleMapsBtn(false)
    : googleMapsBtn(false);

  const taxiBlock = isTaxi ? `
    <div class="four" style="margin-top:8px">
      <div><label>車資 ${esc(data.trip.currency)}</label>
        <input type="number" value="${conn.fareForeign||''}"
               oninput="updateConn('${conn.id}','fareForeign',this.value)"></div>
      <div><label>車資 TWD</label>
        <input type="number" value="${conn.fareTwd||''}"
               oninput="updateConn('${conn.id}','fareTwd',this.value)"></div>
      <div><label>付款人</label>
        <select onchange="updateConn('${conn.id}','payer',this.value)">
          ${optsPayer(conn.payer)}</select></div>
      <div><label>付款方式</label>
        <select onchange="updateConn('${conn.id}','payMethod',this.value)">
          ${optsPayMethod(conn.payMethod)}</select></div>
    </div>` : '';

  const modeLabel = conn.mode === '自訂' ? (conn.customMode || '自訂') : (conn.mode || '大眾運輸');
  const modeIcon  = connModeIcon(conn.mode);
  const isWalk    = conn.mode === '走路' && (totalH * 60 + totalM) <= 15;

  return `
    <details class="connRow${isWalk ? ' connRow--walk' : ''}" data-conn-id="${conn.id}">
      <summary class="connSummary">
        <span class="connSummaryLine"></span>
        <span class="connSummaryPill">
          <span class="connModeIcon">${modeIcon}</span>
          <span class="connModeLabel">${esc(modeLabel)}</span>
          ${timeLabel ? `<span class="connTimeLabel">· ${timeLabel}</span>` : ''}
          ${arrival  ? `<span class="connArrival">→ ${esc(arrival)}</span>` : ''}
          ${summaryRouteBtns}
        </span>
        <span class="connSummaryLine"></span>
      </summary>
      <div class="connDetail">
        <div class="three">
          <div><label>交通方式</label>
            <select onchange="changeConnMode('${conn.id}',this.value)">
              ${['大眾運輸','走路','開車/計程車','自訂'].map(mode =>
                `<option ${conn.mode===mode?'selected':''}>${mode}</option>`).join('')}
            </select>
            ${conn.mode === '自訂' ? `
            <input style="margin-top:6px" value="${esc(conn.customMode||'')}"
                   placeholder="例：自行車、轉乘、包車"
                   oninput="updateConn('${conn.id}','customMode',this.value)">` : ''}
          </div>
          <div><label>預估時間</label>
            <div class="two">
              <select onchange="updateConn('${conn.id}','h',this.value)">
                ${Array.from({length:24},(_,hi)=>`<option value="${hi}" ${Number(conn.h)===hi?'selected':''}>${hi}時</option>`).join('')}
              </select>
              <select onchange="updateConn('${conn.id}','m',this.value)">
                ${Array.from({length:60},(_,mi)=>`<option value="${mi}" ${Number(conn.m)===mi?'selected':''}>${mi}分</option>`).join('')}
              </select>
            </div></div>
          <div><label>預計抵達</label>
            <input value="${arrival||''}" disabled></div>
        </div>
        ${taxiBlock}
        <div class="btns">${detailRouteBtns}</div>
        <input value="${esc(conn.memo)}" placeholder="交通備註"
               oninput="updateConn('${conn.id}','memo',this.value)">
      </div>
    </details>`;
}

/* ══════════════════════════════════════════
   行程卡片
   ══════════════════════════════════════════ */

function planCard(p, num, total, conflict = false) {
  const isAuto      = p.source === 'flight' || p.source === 'hotel';
  const isKorea     = data.trip.country === '韓國';
  const isTransport = p.type === '交通';
  const mapQuery    = encodeURIComponent(
    isKorea && (p.krAddress || p.krName)
      ? [(p.krAddress||''), (p.krName||p.name)].filter(Boolean).join(' ')
      : [(p.address||''), p.name, data.trip.dest].filter(Boolean).join(' ')
  );
  const hasKr = isKorea && (p.krName || p.krAddress);

  const showMap   = !(p.sourceType === 'flight' && p.type === '航班');
  const mapBtn    = showMap ? `<button class="small" onclick="openMap('${mapQuery}')">Google Maps</button>` : '';
  const naverBtn  = showMap && isKorea
    ? `<button class="small" onclick="window.open('https://map.naver.com/v5/search/${encodeURIComponent(p.krName||p.name)}','_blank')">Naver Map</button>`
    : '';

  const cardContent = `
    <div class="itineraryTop">
      <div class="itineraryTimeBlock">
        <span class="itineraryTime">${esc(p.start||'--:--')}</span>
        ${p.end ? `<span class="itineraryEndTime">至 ${esc(p.end)}</span>` : ''}
      </div>
      <div class="itineraryTitleBlock">
        <h3 class="itineraryTitle">${activityIcon(p.type)} ${esc(p.name)}</h3>
        <div class="itineraryMeta">
          <span class="itineraryTypePill">${esc(p.type||'其他')}</span>
          ${p.source==='flight' ? '<span class="itinerarySourcePill">航班帶入</span>' : ''}
          ${p.source==='hotel'  ? '<span class="itinerarySourcePill">住宿帶入</span>' : ''}
          ${p.adjusted ? '<span class="itineraryTypePill">已自動調整</span>' : ''}
          ${conflict ? '<span class="conflictBadge">⚠ 時間重疊</span>' : ''}
          ${moneyTwd(p) ? `<span class="itinerarySourcePill">TWD ${fmt(moneyTwd(p))}</span>` : ''}
        </div>
        ${p.note ? `<div class="itineraryNote"><b>注意：</b>${esc(p.note)}</div>` : ''}
        ${p.memo ? `<div class="itineraryNote"><b>備註：</b>${esc(p.memo)}</div>` : ''}
        ${hasKr ? `
        <details class="planKrDetails">
          <summary>韓文資訊</summary>
          ${p.krName    ? `<div class="planKrRow"><span>韓文名稱</span><b>${esc(p.krName)}</b><button class="planKrCopy" onclick="event.stopPropagation();copyText('${esc(p.krName)}')">複製</button></div>` : ''}
          ${p.krAddress ? `<div class="planKrRow"><span>韓文地址</span><b>${esc(p.krAddress)}</b><button class="planKrCopy" onclick="event.stopPropagation();copyText('${esc(p.krAddress)}')">複製</button></div>` : ''}
        </details>` : ''}
        ${(() => {
          const nearbyItems = (p.nearby || []).map(id => data.spots.find(s => s.id === id)).filter(Boolean);
          if (!nearbyItems.length && shareViewMode) return '';

          // 地址篩選：優先同地區，其次同日，最後提示沒有地址
          const planArea = (p.address || '').trim();
          const addrMatch = (a, b) => {
            if (!a || !b) return false;
            a = a.trim(); b = b.trim();
            return a === b || a.includes(b) || b.includes(a);
          };
          const alreadyNearby = new Set(p.nearby || []);
          const sameArea = data.spots.filter(s =>
            !alreadyNearby.has(s.id) &&
            (addrMatch(planArea, s.addr) || addrMatch(planArea, s.krAddress))
          );
          const sameDay  = planArea ? [] : data.spots.filter(s =>
            !alreadyNearby.has(s.id) && (!s.day || s.day === p.day)
          );
          const pickable   = sameArea.length ? sameArea : sameDay;
          const noAddrHint = !planArea && !sameDay.length;
          const noMatchHint = planArea && !sameArea.length;

          return `<div class="nearbySection">
            <div class="nearbyHeader">
              <span class="nearbyLabel">🗺 附近走逛</span>
              ${shareViewMode ? '' : `<button class="nearbyAddBtn" onclick="toggleNearbyPicker('${p.id}')">＋</button>`}
            </div>
            ${nearbyItems.map(s => `
              <div class="nearbyItem">
                <button class="nearbyItemBtn" onclick="openNearbySpotDetail('${s.id}')">${activityIcon(s.type)} ${esc(s.name)}</button>
                ${shareViewMode ? '' : `<button class="nearbyRemoveBtn" onclick="removeNearbyFromPlan('${p.id}','${s.id}')">×</button>`}
              </div>`).join('')}
            ${shareViewMode ? '' : `<div class="nearbyPicker" id="nearbyPicker-${p.id}" style="display:none">
              ${sameArea.length ? `<div class="nearbyPickerArea">📍 ${esc(planArea)} 附近</div>` : ''}
              ${pickable.length
                ? pickable.map(s => `<button class="nearbyPickItem" onclick="addNearbyToPlan('${p.id}','${s.id}');toggleNearbyPicker('${p.id}')">${activityIcon(s.type)} ${esc(s.name)}</button>`).join('')
                : noMatchHint
                  ? `<span class="nearbyEmpty">口袋裡沒有「${esc(planArea)}」附近的景點</span>`
                  : '<span class="nearbyEmpty">口袋景點是空的</span>'}
            </div>`}
          </div>`;
        })()}
      </div>
      <div class="itineraryActions">
        ${shareViewMode ? '' : `
          <div class="planMoveRow">
            <button class="planMoveBtn" type="button" onclick="reorderPlan('${p.id}',-1)" title="上移" ${num===1?'disabled':''}>↑</button>
            <button class="planMoveBtn" type="button" onclick="reorderPlan('${p.id}',1)" title="下移" ${num===total?'disabled':''}>↓</button>
          </div>`}
        ${isKorea ? naverBtn : mapBtn}
        ${isKorea ? mapBtn : ''}
        <button class="small" onclick="editPlan('${p.id}')">編輯</button>
        <button class="small" onclick="deletePlan('${p.id}')">刪除</button>
      </div>
    </div>`;

  return `
    <div class="itineraryItem" data-id="${p.id}">
      <div class="itineraryDotWrap">
        ${shareViewMode ? '' : '<span class="dragHandle" title="拖曳排序">⠿</span>'}
        <span class="planIndex${conflict ? ' planIndex--conflict' : ''}">${num}</span>
      </div>
      <article class="itineraryCard${isAuto ? ' planCard--auto' : ''}${conflict ? ' planCard--conflict' : ''}${isTransport ? ' itineraryCard--transport' : ''}">
        ${isTransport ? `
          <details class="transportDetails">
            <summary class="transportSummary">
              <span class="transportSummaryInfo">
                🚗 <span class="transportSummaryName">${esc(p.name)}</span>
                ${p.start ? `<span class="transportSummaryTime">${esc(p.start)}</span>` : ''}
              </span>
              <span class="transportSummaryArrow">▸</span>
            </summary>
            <div class="transportExpanded">${cardContent}</div>
          </details>`
          : cardContent}
      </article>
    </div>`;
}

function plansOverlap(a, b) {
  if (!a.start || !a.end || !b.start || !b.end) return false;
  return timeToMin(a.start) < timeToMin(b.end) && timeToMin(b.start) < timeToMin(a.end);
}

function planCards(plans) {
  if (!plans.length) return '<div class="empty">這天還沒有行程</div>';
  const conflicts = new Set();
  for (let i = 0; i < plans.length; i++) {
    for (let j = i + 1; j < plans.length; j++) {
      if (plansOverlap(plans[i], plans[j])) {
        conflicts.add(plans[i].id);
        conflicts.add(plans[j].id);
      }
    }
  }
  let html = '<div class="itineraryTimeline">';
  plans.forEach((p, i) => {
    if (i > 0) html += connHtml(plans[i-1], p);
    html += planCard(p, i + 1, plans.length, conflicts.has(p.id));
  });
  html += '</div>';
  return html;
}

/* ══════════════════════════════════════════
   行程 v28 normalize（相容舊資料）
   ══════════════════════════════════════════ */

/* ── 拖曳排序 ── */
function initPlannerSortable() {
  const timeline = document.querySelector('#pcards .itineraryTimeline');
  if (!timeline || typeof Sortable === 'undefined') return;
  new Sortable(timeline, {
    animation: 150,
    draggable: '.itineraryItem',
    delay: 400,
    delayOnTouchOnly: true,
    touchStartThreshold: 8,
    forceFallback: true,
    fallbackTolerance: 5,
    onEnd() {
      const items = timeline.querySelectorAll('.itineraryItem[data-id]');
      items.forEach((el, i) => {
        const plan = data.plans.find(p => p.id === el.dataset.id);
        if (plan) plan.sortOrder = i;
      });
      save();
    }
  });
}

/* ── 地圖總覽 ── */
function openDayMap() {
  const isKorea = data.trip.country === '韓國';
  const plans = sortedPlans(currentDay).filter(p =>
    p.krAddress || p.krName || p.address || p.name
  );
  if (!plans.length) return toast('今日沒有行程');

  const queries = plans.map(p =>
    isKorea
      ? (p.krAddress || p.krName || p.address || p.name)
      : (p.address || p.name)
  );

  let url;
  if (queries.length === 1) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queries[0])}`;
  } else {
    const origin      = encodeURIComponent(queries[0]);
    const destination = encodeURIComponent(queries[queries.length - 1]);
    const waypoints   = queries.slice(1, -1).map(encodeURIComponent).join('|');
    const travelmode  = isKorea ? 'transit' : 'driving';
    url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=${travelmode}`;
  }

  window.open(url, '_blank');
  toast(`已開啟今日 ${queries.length} 個地點`);
}

function normalizePlans() {
  const seen = new Set();
  data.plans.forEach(p => {
    if (!p.id) p.id = uid();
    if (seen.has(p.id)) p.id = uid();
    seen.add(p.id);
    p.type = normalizePlanType(p.type);
    if (!p.source) {
      if (p.sourceType === 'flight' || p.memo === '由航班資料帶入') p.source = 'flight';
      else if (p.sourceType === 'hotel' || p.hotelId)              p.source = 'hotel';
      else                                                           p.source = 'manual';
    }
  });
}
