/* ================================================================
   planner.js — 行程規劃、交通連線
   ================================================================ */

/* ══════════════════════════════════════════
   行程 CRUD
   ══════════════════════════════════════════ */

function savePlanForm() {
  const name = $('pname')?.value.trim();
  if (!name) return toast('請輸入行程名稱');

  const day   = $('pday')?.value || currentDay;
  const start = $('ps')?.value   || '';
  const end   = $('pe')?.value   || '';
  const type  = normalizePlanType($('ptype')?.value);

  const item = {
    day, start, end, type, name,
    address:    $('paddress')?.value || '',
    note:       $('pnote')?.value    || '',
    memo:       $('pmemo')?.value    || '',
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
      // 保留鎖定欄位
      if (existing.lockedName) {
        item.name       = existing.name;
        item.source     = existing.source;
        item.lockedName = true;
        if (existing.hotelId) item.hotelId = existing.hotelId;
      }
      Object.assign(existing, item);
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
      spot.planId = plan.id;
      plan.source = 'spot';
      plan.lockedName = true;
    }
    v16PendingSpotId = null;
  }

  currentDay = cur = day;
  save();
  toast(editingPlanId ? '已更新行程' : '已新增行程');
}

function editPlan(id) {
  editingPlanId = id;
  go('planner');
}

function deletePlan(id) {
  if (!confirm('確定刪除這個行程？')) return;
  data.plans = data.plans.filter(p => p.id !== id);
  data.conns = data.conns.filter(c => c.a !== id && c.b !== id);
  data.spots.forEach(s => { if (s.planId === id) delete s.planId; });
  if (editingPlanId === id) editingPlanId = null;
  save();
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
  if ($('ps'))       $('ps').value       = p.start   || '';
  if ($('pe'))       $('pe').value       = p.end     || '';
  if ($('ptype'))    $('ptype').value    = normalizePlanType(p.type);
  if ($('pname'))    $('pname').value    = p.name    || '';
  if ($('paddress')) $('paddress').value = p.address || '';
  if ($('pnote'))    $('pnote').value    = p.note    || '';
  if ($('pmemo'))    $('pmemo').value    = p.memo    || '';
  applyLockedNameState();
}

function fillFromSpot(spotId) {
  const s = data.spots.find(x => x.id === spotId);
  if (!s) return;
  if ($('pday'))     $('pday').value     = s.day || currentDay;
  if ($('ptype'))    $('ptype').value    = normalizePlanType(s.type);
  if ($('pname'))    { $('pname').value  = s.name; $('pname').readOnly = true; $('pname').classList.add('lockedInput'); }
  if ($('paddress')) $('paddress').value = s.addr || '';
  if ($('pnote'))    $('pnote').value    = s.memo || '';
  if ($('pmemo'))    $('pmemo').value    = '由口袋景點帶入';
  if ($('ps') && s.start) $('ps').value = s.start;
  if ($('pe') && s.end)   $('pe').value = s.end;
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
      mode: '大眾運輸', h: 0, m: 30,
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
  if (conn) { conn[key] = val; save(); }
}

function changeConnMode(id, val) {
  updateConn(id, 'mode', val);
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

  // Summary route button — Kakao for Korea, Google Maps for others
  const aName = isKorea ? (a.krName || a.name) : a.name;
  const bName = isKorea ? (b.krName || b.name) : b.name;
  const summaryRouteBtn = isKorea
    ? `<button class="btn blue compact" onclick="event.stopPropagation();window.open('https://map.kakao.com/?sName=${encodeURIComponent(aName)}&eName=${encodeURIComponent(bName)}','_blank')">Kakao 路線</button>`
    : `<button class="btn blue compact" onclick="event.stopPropagation();openRoute('${encodeURIComponent(a.name+' '+data.trip.dest)}','${encodeURIComponent(b.name+' '+data.trip.dest)}','${conn.mode}')">Google Maps</button>`;

  const detailRouteBtn = isKorea
    ? `<button class="btn blue" onclick="window.open('https://map.kakao.com/?sName=${encodeURIComponent(aName)}&eName=${encodeURIComponent(bName)}','_blank')">Kakao Maps 查路線</button>`
    : `<button class="btn blue" onclick="openRoute('${encodeURIComponent(a.name+' '+data.trip.dest)}','${encodeURIComponent(b.name+' '+data.trip.dest)}','${conn.mode}')">Google Maps 查路線</button>`;

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

  return `
    <details class="connRow">
      <summary class="connSummary">
        <span>${esc(conn.mode || '大眾運輸')}</span>
        <span>${timeLabel}</span>
        ${arrival ? `<span>→ 預計抵達 ${esc(arrival)}</span>` : ''}
        ${summaryRouteBtn}
      </summary>
      <div class="connDetail">
        <div class="three">
          <div><label>交通方式</label>
            <select onchange="changeConnMode('${conn.id}',this.value)">
              ${['大眾運輸','走路','開車/計程車'].map(mode =>
                `<option ${conn.mode===mode?'selected':''}>${mode}</option>`).join('')}
            </select></div>
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
        <div class="btns">${detailRouteBtn}</div>
        <input value="${esc(conn.memo)}" placeholder="交通備註"
               oninput="updateConn('${conn.id}','memo',this.value)">
      </div>
    </details>`;
}

/* ══════════════════════════════════════════
   行程卡片
   ══════════════════════════════════════════ */

function planCard(p, num = null) {
  const isAuto   = num === null;
  const mapQuery = encodeURIComponent(
    [(p.address||''), p.name, data.trip.dest].filter(Boolean).join(' ')
  );
  return `
    <div class="itineraryItem">
      <div class="itineraryDotWrap">
        ${isAuto
          ? '<span class="itineraryDot"></span>'
          : `<span class="planIndex">${num}</span>`}
      </div>
      <article class="itineraryCard${isAuto ? ' planCard--auto' : ''}">
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
              ${moneyTwd(p) ? `<span class="itinerarySourcePill">TWD ${fmt(moneyTwd(p))}</span>` : ''}
            </div>
            ${p.note ? `<div class="itineraryNote"><b>注意：</b>${esc(p.note)}</div>` : ''}
            ${p.memo ? `<div class="itineraryNote"><b>備註：</b>${esc(p.memo)}</div>` : ''}
          </div>
          <div class="itineraryActions">
            <button class="small" onclick="openMap('${mapQuery}')">地圖</button>
            <button class="small" onclick="editPlan('${p.id}')">編輯</button>
            <button class="small" onclick="deletePlan('${p.id}')">刪除</button>
          </div>
        </div>
      </article>
    </div>`;
}

function planCards(plans) {
  if (!plans.length) return '<div class="empty">這天還沒有行程</div>';
  let html = '<div class="itineraryTimeline">';
  let manualIndex = 0;
  plans.forEach((p, i) => {
    const isAuto = p.source === 'flight' || p.source === 'hotel';
    const num = isAuto ? null : ++manualIndex;
    if (i > 0) html += connHtml(plans[i-1], p);
    html += planCard(p, num);
  });
  html += '</div>';
  return html;
}

/* ══════════════════════════════════════════
   行程 v28 normalize（相容舊資料）
   ══════════════════════════════════════════ */

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
