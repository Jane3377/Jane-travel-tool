/* ================================================================
   stay.js — 航班、住宿
   ================================================================ */

/* ══════════════════════════════════════════
   航班工具
   ══════════════════════════════════════════ */

function normalizeFlightObj(f) {
  f = f || {};
  if (Array.isArray(f.segments) && f.segments.length) {
    return {
      type: f.type || (f.segments.length > 1 ? 'transfer' : 'direct'),
      segments: f.segments.map(s => ({
        no: s.no||'', from: s.from||'', to: s.to||'',
        dep: s.dep||'', arr: s.arr||'',
        fromTerminal: s.fromTerminal||'', toTerminal: s.toTerminal||''
      })),
      toAirport: f.toAirport||f.transfer||'',
      fromAirport: f.fromAirport||''
    };
  }
  return {
    type: 'direct',
    segments: [{ no: f.no||'', from: f.from||'', to: f.to||'',
                 dep: f.dep||'', arr: f.arr||'',
                 fromTerminal: f.fromTerminal||'', toTerminal: f.toTerminal||'' }],
    toAirport: f.toAirport||f.transfer||'',
    fromAirport: f.fromAirport||''
  };
}

function airportDatalistHtml() {
  return `<datalist id="airportList">${AIRPORT_LIST.map(a => `<option value="${esc(a)}">`).join('')}</datalist>`;
}

function terminalSelect(id, value) {
  return `<select id="${id}">${TERMINAL_OPTIONS.map(t =>
    `<option value="${t}" ${t === (value||'未定') ? 'selected' : ''}>${t}</option>`
  ).join('')}</select>`;
}

function flightSegmentForm(k, idx, seg = {}) {
  const open = idx === 0 ? 'open' : '';
  return `
    <details class="segmentBox" id="${k}segBox${idx}" ${open}>
      <summary>第 ${idx+1} 段航班</summary>
      <div class="segmentInner">
        ${airportDatalistHtml()}
        <div class="three compactMobile">
          <div><label>航班號</label><input id="${k}s${idx}no" value="${esc(seg.no||'')}" placeholder="BX794"></div>
          <div><label>出發地</label><input id="${k}s${idx}from" list="airportList" value="${esc(seg.from||'')}"></div>
          <div><label>抵達地</label><input id="${k}s${idx}to"   list="airportList" value="${esc(seg.to||'')}"></div>
        </div>
        <div class="two">
          <div><label>出發航廈</label>${terminalSelect(`${k}s${idx}fromTerminal`, seg.fromTerminal)}</div>
          <div><label>抵達航廈</label>${terminalSelect(`${k}s${idx}toTerminal`,   seg.toTerminal)}</div>
        </div>
        <div class="two">
          <div><label>起飛時間</label><input id="${k}s${idx}dep" type="datetime-local" value="${seg.dep||''}"></div>
          <div><label>抵達時間</label><input id="${k}s${idx}arr" type="datetime-local" value="${seg.arr||''}"></div>
        </div>
      </div>
    </details>`;
}

function flightForm(k) {
  const f    = normalizeFlightObj(data.flights[k]);
  const segs = [f.segments[0]||{}, f.segments[1]||{}];
  const type = f.type || 'direct';
  const isOut = k === 'out';
  return `
    <div data-flight-dir="${k}" data-flight-type="${type}">
      <label>航班型態</label>
      <select id="${k}type" onchange="toggleFlightSegments('${k}')">
        <option value="direct"   ${type==='direct'   ? 'selected':''}>直飛</option>
        <option value="transfer" ${type==='transfer' ? 'selected':''}>轉機</option>
      </select>
      ${flightSegmentForm(k, 0, segs[0])}
      <div id="${k}seg1Wrap" ${type!=='transfer' ? 'style="display:none"' : ''}>
        ${flightSegmentForm(k, 1, segs[1])}
      </div>
      <label>${isOut ? '抵達出發機場方式' : '前往回程機場方式'}</label>
      <textarea id="${k}toAirport" placeholder="${isOut ? '例：搭機捷到桃園機場' : '例：從飯店搭地鐵到機場'}">${esc(f.toAirport||'')}</textarea>
      <label>${isOut ? '降落後到市區方式' : '抵達後回家方式'}</label>
      <textarea id="${k}fromAirport" placeholder="${isOut ? '例：搭輕軌轉地鐵到飯店' : '例：搭機捷回家'}">${esc(f.fromAirport||'')}</textarea>
    </div>`;
}

function toggleFlightSegments(k) {
  const type  = $(`${k}type`)?.value || 'direct';
  const wrap  = document.querySelector(`[data-flight-dir="${k}"]`);
  const extra = $(`${k}seg1Wrap`);
  if (wrap)  wrap.setAttribute('data-flight-type', type);
  if (extra) extra.style.display = type === 'transfer' ? '' : 'none';
}

function readFlightForm(k) {
  const type  = $(`${k}type`)?.value || 'direct';
  const count = type === 'transfer' ? 2 : 1;
  const segs  = [];
  for (let i = 0; i < count; i++) {
    segs.push({
      no:           $(`${k}s${i}no`)?.value           || '',
      from:         $(`${k}s${i}from`)?.value         || '',
      to:           $(`${k}s${i}to`)?.value           || '',
      dep:          $(`${k}s${i}dep`)?.value          || '',
      arr:          $(`${k}s${i}arr`)?.value          || '',
      fromTerminal: $(`${k}s${i}fromTerminal`)?.value || '',
      toTerminal:   $(`${k}s${i}toTerminal`)?.value   || ''
    });
  }
  return {
    type,
    segments:    segs,
    toAirport:   $(`${k}toAirport`)?.value   || '',
    fromAirport: $(`${k}fromAirport`)?.value || ''
  };
}

function validateFlightForm() {
  for (const k of ['out', 'back']) {
    const f    = readFlightForm(k);
    const dir  = k === 'out' ? '去程' : '回程';
    for (let i = 0; i < f.segments.length; i++) {
      const s    = f.segments[i];
      const miss = [];
      if (!s.no)  miss.push('航班號');
      if (!s.from) miss.push('出發地');
      if (!s.to)   miss.push('抵達地');
      if (!s.dep)  miss.push('起飛時間');
      if (!s.arr)  miss.push('抵達時間');
      if (miss.length) { alert(`${dir}第${i+1}段請填完整：${miss.join('、')}`); return false; }
      if (new Date(s.dep) >= new Date(s.arr)) {
        alert(`${dir}第${i+1}段抵達時間需晚於起飛時間`); return false;
      }
    }
  }
  return true;
}

/* 輸入後自動儲存（不驗證），防止資料因忘按按鈕而遺失 */
let _flightAutoSaveTimer = null;
function scheduleFlightAutoSave() {
  clearTimeout(_flightAutoSaveTimer);
  _flightAutoSaveTimer = setTimeout(() => {
    data.flights.out  = readFlightForm('out');
    data.flights.back = readFlightForm('back');
    silentSave();
    v39FlightDirty = false;
    refreshFlightStatus();
  }, 600);
}

/* 驗證後同步行程／預算 */
function saveFlights() {
  if (!validateFlightForm()) return;
  clearTimeout(_flightAutoSaveTimer);
  const hadPlans = flightHasPlans();
  data.flights.out  = readFlightForm('out');
  data.flights.back = readFlightForm('back');
  v39FlightDirty = false;
  if (hadPlans) syncFlightPlans();
  silentSave();
  renderStay();
  toast(hadPlans ? '已驗證航班並更新行程' : '已驗證並儲存航班');
}

/* ── 航班行程同步 ── */
function flightHasPlans() {
  return data.plans.some(p => p.source === 'flight');
}

// 產出「機場地點卡」+「航班交通連線」（以地點為主，飛機變成兩張機場卡之間的交通）
function flightPlanData() {
  const outF  = normalizeFlightObj(data.flights.out);
  const backF = normalizeFlightObj(data.flights.back);
  const plans = [], conns = [];

  const pad = dt => {
    if (!dt) return { day: data.trip.start || '', time: '' };
    const [d, t] = String(dt).split('T');
    return { day: d || '', time: (t || '').slice(0, 5) };
  };
  const addMin = (dt, min) => {
    if (!dt) return { day: '', time: '' };
    const d = new Date(new Date(dt).getTime() + min * 60000);
    return { day: formatLocalDate(d), time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` };
  };
  const durHM = (dep, arr) => {
    if (!dep || !arr) return { h: 0, m: 0 };
    let min = Math.round((new Date(arr) - new Date(dep)) / 60000);
    if (!(min > 0)) min = 0;
    return { h: Math.floor(min / 60), m: min % 60 };
  };
  const durLabel = (dep, arr) => {
    const { h, m } = durHM(dep, arr);
    return h && m ? `${h}時${m}分` : h ? `${h}時` : m ? `${m}分` : '';
  };

  [['out', outF, '去程'], ['back', backF, '回程']].forEach(([dir, f, dirLabel]) => {
    const segs = f.segments.filter(s => s.dep || s.from || s.to);
    if (!segs.length) return;
    const N = segs.length;
    const airId = i => `flight-${dir}-air-${i}`;

    // 機場地點卡：N 段航班 → N+1 張機場卡
    for (let i = 0; i <= N; i++) {
      const isFirst = i === 0, isLast = i === N;
      const airport = isFirst ? (segs[0].from || '機場') : (segs[i-1].to || '機場');
      const arrTerm = isFirst ? '' : (segs[i-1].toTerminal || '');
      const depTerm = isLast  ? '' : (segs[i].fromTerminal || '');
      const term    = isFirst ? depTerm : isLast ? arrTerm : (arrTerm || depTerm);

      let day, start, end;
      if (isFirst)     { const p = pad(segs[0].dep), e = addMin(segs[0].dep, -120); day = e.day || p.day; start = e.time; end = p.time; }
      else if (isLast) { const p = pad(segs[N-1].arr); day = p.day; start = p.time; end = p.time; }
      else             { const a = pad(segs[i-1].arr), d = pad(segs[i].dep); day = a.day; start = a.time; end = d.time; }

      const lines = [];
      if (isFirst)     lines.push(`${dirLabel}出發${term ? `｜${term}` : ''}`);
      else if (isLast) lines.push(`${dirLabel}抵達${term ? `｜${term}` : ''}`);
      else             lines.push(`轉機${arrTerm ? `｜抵達 ${arrTerm}` : ''}${depTerm ? ` → 出發 ${depTerm}` : ''}`);
      if (!isLast) {                                    // 備援：把離站航班資訊寫在出發機場卡
        const s = segs[i], dl = durLabel(s.dep, s.arr);
        lines.push(`✈️ ${s.no || '航班'}${dl ? `｜飛行約 ${dl}` : ''}`);
      }
      if (isFirst && f.toAirport)   lines.push(f.toAirport);
      if (isLast  && f.fromAirport) lines.push(f.fromAirport);

      plans.push({
        id: airId(i), source: 'flight', sourceType: 'flight', lockedName: true, lockedTime: true,
        day, start, end, type: '交通',
        name: `${airport}${term ? ` ${term}` : ''}`,
        note: lines.join('\n'), memo: '由航班資料帶入'
      });
    }

    // 航班交通連線：每段航班 = 相鄰兩張機場卡之間的 ✈️ 連線
    for (let i = 0; i < N; i++) {
      const s = segs[i], { h, m } = durHM(s.dep, s.arr);
      conns.push({
        id: `flight-${dir}-conn-${i}`, a: airId(i), b: airId(i + 1),
        mode: '航班', h, m,
        memo: `${s.no ? s.no + ' ' : ''}${s.from || ''}→${s.to || ''}`.trim(),
        fareForeign: 0, fareTwd: 0, payer: '未定', payMethod: '未定'
      });
    }
  });

  return { plans: plans.filter(p => p.day), conns };
}

// 相容舊呼叫：只要卡片清單
function flightPlanTemplates() {
  return flightPlanData().plans;
}

function syncFlightPlans() {
  const { plans: tpls, conns: cpls } = flightPlanData();
  const keepIds = new Set(tpls.map(t => t.id));
  data.plans    = data.plans.filter(p => p.source !== 'flight' || keepIds.has(p.id));
  tpls.forEach(tpl => {
    const idx = data.plans.findIndex(p => p.id === tpl.id);
    if (idx >= 0) Object.assign(data.plans[idx], tpl);
    else data.plans.push({ mode:'foreign', foreign:0, twd:0, payer:'未定', payMethod:'未定', ...tpl });
  });

  // 同步航班交通連線（id 以 flight-…-conn 開頭）
  if (!Array.isArray(data.conns)) data.conns = [];
  const connKeep = new Set(cpls.map(c => c.id));
  data.conns = data.conns.filter(c => !String(c.id).startsWith('flight-') || connKeep.has(c.id));
  cpls.forEach(cpl => {
    const idx = data.conns.findIndex(c => c.id === cpl.id);
    if (idx >= 0) Object.assign(data.conns[idx], cpl);
    else data.conns.push(cpl);
  });
}

function addFlightToPlans() {
  if (v39FlightDirty) return toast('請先存好航班設定');
  if (!flightPlanTemplates().length) return toast('請先填寫並存好航班');
  syncFlightPlans();
  save();
  toast('已把航班帶入行程');
}

function removeFlightPlans() {
  data.plans = data.plans.filter(p => p.source !== 'flight');
  data.conns = data.conns.filter(c =>
    data.plans.some(p => p.id === c.a) && data.plans.some(p => p.id === c.b)
  );
  save();
  toast('已移除航班行程');
}

function addFlightBudget() {
  if (data.expenses.some(e => e.source === '航班')) return toast('航班費用已記過');
  const out  = normalizeFlightObj(data.flights.out);
  const back = normalizeFlightObj(data.flights.back);
  const outNo  = out.segments.map(s => s.no).filter(Boolean).join('+');
  const backNo = back.segments.map(s => s.no).filter(Boolean).join('+');
  const name   = [outNo && `去程 ${outNo}`, backNo && `回程 ${backNo}`].filter(Boolean).join('／');
  data.expenses.push({
    id: uid(), source: '航班', type: '機票',
    name: name ? `來回機票（${name}）` : '來回機票',
    payer: '未定', payMethod: '未定', day: '', mode: 'TWD', foreign: 0, twd: 0,
    memo: '由航班資料帶入'
  });
  save();
  toast('已記一筆來回機票');
}

function removeFlightBudget() {
  data.expenses = data.expenses.filter(e => e.source !== '航班');
  save();
  toast('已移除航班費用');
}

/* ══════════════════════════════════════════
   住宿 CRUD
   ══════════════════════════════════════════ */

function hotelHasPlans(id) {
  return data.plans.some(p => p.source === 'hotel' && p.hotelId === id);
}
function hotelHasBudget(id) {
  return data.expenses.some(e => e.hotelId === id);
}

function hotelCard(h) {
  const hasP = hotelHasPlans(h.id);
  const hasB = hotelHasBudget(h.id);
  return `
    <div class="card">
      <div class="time">${short(h.start)} → ${short(h.end)}</div>
      <div class="place">🏨 ${esc(h.name)}</div>
      <div class="box mint">${esc(h.addr || '尚未填地址')}<br>${esc(h.note || '')}</div>
      <div class="hotelTags">
        ${hasP ? '<span class="tag">已帶入行程</span>' : '<span class="tag muted">未帶入行程</span>'}
        ${hasB ? '<span class="tag">已帶入費用</span>' : '<span class="tag muted">未帶入費用</span>'}
      </div>
      <div class="btns">
        <button class="small" onclick="editHotel('${h.id}')">編輯</button>
        <button class="small" onclick="openMap('${encodeURIComponent((h.addr||h.name)+' '+data.trip.dest)}')">地圖</button>
        ${hasP
          ? `<button class="small" onclick="removeHotelPlans('${h.id}')">移除行程</button>`
          : `<button class="small" onclick="addHotelPlans('${h.id}')">帶入行程</button>`}
        ${hasB
          ? `<button class="small" onclick="removeHotelBudget('${h.id}')">移除費用</button>`
          : `<button class="small" onclick="addHotelBudget('${h.id}')">帶入費用</button>`}
        <button class="small danger" onclick="deleteHotel('${h.id}')">刪除</button>
      </div>
      ${docsSectionHtml(h.docs, `addHotelDocs('${h.id}',this)`, id => `removeHotelDoc('${h.id}','${id}')`, '訂房確認…')}
    </div>`;
}

/* ── 訂購檔案／截圖（航班 + 住宿共用） ── */
function docItemHtml(doc, removeCall) {
  if (doc.kind === 'pdf') {
    return `<div class="docItem">
      <a class="docPdf" href="${esc(doc.src)}" target="_blank" rel="noopener" title="${esc(doc.name || 'PDF')}">📄<span>${esc(doc.name || 'PDF')}</span></a>
      <button class="docDel" onclick="${removeCall}" title="刪除">×</button>
    </div>`;
  }
  return `<div class="docItem">
    <a href="${esc(doc.src)}" target="_blank" rel="noopener"><img class="docThumb" src="${esc(doc.src)}" alt="${esc(doc.name || '')}" loading="lazy"></a>
    <button class="docDel" onclick="${removeCall}" title="刪除">×</button>
  </div>`;
}
function docsSectionHtml(docs, addCall, removeCallFn, placeholder) {
  docs = docs || [];
  return `
    <div class="docSection">
      <div class="docHead">📎 訂購檔案／截圖
        <label class="docAddBtn">＋ 上傳
          <input type="file" accept="image/*,application/pdf" multiple style="display:none" onchange="${addCall}">
        </label>
      </div>
      <div class="docGrid">${
        docs.map(d => docItemHtml(d, removeCallFn(d.id))).join('')
        || `<span class="docEmpty">尚未上傳（${esc(placeholder)}）</span>`
      }</div>
    </div>`;
}
function flightDocsHtml() {
  return docsSectionHtml(data.flightDocs, 'addFlightDocs(this)', id => `removeFlightDoc('${id}')`, '機票訂單、電子機票…');
}

async function _uploadDocsFrom(input, targetArr) {
  const files = [...(input.files || [])];
  input.value = '';
  if (!files.length) return 0;
  let n = 0;
  for (const f of files) {
    try {
      toast(/\.pdf$/i.test(f.name || '') ? 'PDF 轉檔上傳中…' : '上傳中…');
      const docs = await uploadDocToCloudinary(f);   // 一律回傳陣列
      docs.forEach(d => { targetArr.push({ id: uid(), ...d }); n++; });
    } catch (e) {
      toast('上傳失敗：' + e.message);
    }
  }
  return n;
}
async function addFlightDocs(input) {
  if (!Array.isArray(data.flightDocs)) data.flightDocs = [];
  const n = await _uploadDocsFrom(input, data.flightDocs);
  if (n) { save(); renderStay(); toast(`已上傳 ${n} 個檔案`); }
}
function removeFlightDoc(id) {
  if (!confirm('刪除這個檔案？')) return;
  data.flightDocs = (data.flightDocs || []).filter(d => d.id !== id);
  save(); renderStay();
}
async function addHotelDocs(hotelId, input) {
  const h = data.hotels.find(x => x.id === hotelId);
  if (!h) return;
  if (!Array.isArray(h.docs)) h.docs = [];
  const n = await _uploadDocsFrom(input, h.docs);
  if (n) { save(); renderStay(); toast(`已上傳 ${n} 個檔案`); }
}
function removeHotelDoc(hotelId, id) {
  const h = data.hotels.find(x => x.id === hotelId);
  if (!h) return;
  if (!confirm('刪除這個檔案？')) return;
  h.docs = (h.docs || []).filter(d => d.id !== id);
  save(); renderStay();
}

let _pendingHotelId = null;   // 剛新增的住宿 id（供「帶入行程/費用」選項使用）

function saveHotel() {
  if (!$('hname')?.value) return toast('請輸入住宿名稱');
  const start = $('hstart').value;
  const end   = $('hend').value;
  if (!start || !end) return toast('請填入住日與退房日');

  const item = { name: $('hname').value, start, end, addr: $('haddr').value, note: $('hnote').value };
  const editing = editingHotelId;

  if (editing) {
    Object.assign(data.hotels.find(h => h.id === editing) || {}, item);
    if (hotelHasPlans(editing)) addHotelPlans(editing);   // 日期改了 → 重建住宿行程
    data.hotels.sort((a, b) => String(a.start).localeCompare(b.start));
    closeHotelForm();
    save();
    renderStay();
    toast('已更新住宿');
  } else {
    const hotelId = uid();
    data.hotels.push({ id: hotelId, ...item });
    data.hotels.sort((a, b) => String(a.start).localeCompare(b.start));
    _pendingHotelId = hotelId;
    closeHotelForm();
    silentSave();
    renderStay();
    $('hotelOptionModal')?.classList.add('show');   // 詢問是否帶入行程/費用
  }
}

function openHotelForm(id) {
  editingHotelId = id || null;
  const h = id ? data.hotels.find(x => x.id === id) : null;
  let modal = $('hotelFormModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'hotelFormModal';
    modal.className = 'aiPromptModal';
    modal.onclick = e => { if (e.target === modal) closeHotelForm(); };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="aiPromptBox">
      <div class="section">
        <h3>${h ? '編輯住宿' : '新增住宿'}</h3>
        <button class="iconBtn" onclick="closeHotelForm()">×</button>
      </div>
      <label>住宿名稱</label>
      <input id="hname" value="${esc(h?.name || '')}" placeholder="例：首爾樂天飯店">
      <div class="two">
        <div><label>入住日</label>
          <input id="hstart" type="date" value="${h?.start || data.trip.start}" min="${data.trip.start}" max="${data.trip.end}"></div>
        <div><label>退房日</label>
          <input id="hend" type="date" value="${h?.end || data.trip.end}" min="${data.trip.start}" max="${data.trip.end}"></div>
      </div>
      <label>地址</label>
      <div class="two">
        <input id="haddr" value="${esc(h?.addr || '')}" placeholder="可貼上飯店地址">
        <button class="btn blue compact" onclick="searchHotelAddr()">查地圖</button>
      </div>
      <label>備註</label>
      <textarea id="hnote">${esc(h?.note || '')}</textarea>
      <div class="btns" style="margin-top:12px">
        <button class="btn dark" onclick="saveHotel()">${h ? '儲存修改' : '新增住宿'}</button>
        <button class="btn soft" onclick="closeHotelForm()">取消</button>
      </div>
    </div>`;
  modal.classList.add('show');
  setTimeout(() => $('hname')?.focus(), 50);
}

function closeHotelForm() {
  $('hotelFormModal')?.classList.remove('show');
  editingHotelId = null;
}

function editHotel(id) {
  openHotelForm(id);
}

function deleteHotel(id) {
  if (!confirm('確定刪除住宿？相關行程也會一併移除。')) return;
  data.hotels   = data.hotels.filter(h => h.id !== id);
  data.plans    = data.plans.filter(p => !(p.source === 'hotel' && p.hotelId === id));
  data.expenses = data.expenses.filter(e => e.hotelId !== id);
  if (editingHotelId === id) editingHotelId = null;
  save();
}

function searchHotelAddr() {
  const name = $('hname')?.value;
  if (!name) return toast('請先輸入住宿名稱');
  openMap(encodeURIComponent(name + ' ' + data.trip.dest));
}

function closeHotelOptions() {
  $('hotelOptionModal')?.classList.remove('show');
  toast('已新增住宿');
}

function confirmHotelOptions() {
  const id = _pendingHotelId || data.hotels[data.hotels.length - 1]?.id;
  _pendingHotelId = null;
  if (!id) return closeHotelOptions();
  if ($('hotelOptionAddPlans')?.checked) addHotelPlans(id);
  if ($('hotelOptionAddBudget')?.checked) addHotelBudget(id);
  $('hotelOptionModal')?.classList.remove('show');
  save();
  toast('已完成住宿設定');
}

function addHotelPlans(id) {
  const h = data.hotels.find(x => x.id === id);
  if (!h) return;
  // 先清除舊的住宿行程
  data.plans = data.plans.filter(p => !(p.source === 'hotel' && p.hotelId === id));

  // 名稱一律用飯店名，動作（Check in／出發／回飯店）寫在說明，交通連線才不會看錯
  const make = (day, start, end, role, action) => ({
    id: `hotel-${id}-${day}-${role}`, source: 'hotel', sourceType: 'hotel',
    hotelId: id, lockedName: true, day, start, end,
    type: '住宿', name: h.name, address: h.addr || '',
    note: action + (h.addr ? `\n${h.addr}` : ''), memo: '由住宿資料帶入',
    mode: 'foreign', foreign: 0, twd: 0, payer: '未定', payMethod: '未定'
  });

  data.plans.push(make(h.start, '15:00', '15:30', 'in', 'Check in 入住'));
  dateRange(dateAdd(h.start, 1), h.end).forEach(day =>
    data.plans.push(make(day, '09:00', '09:10', 'out', '從飯店出發'))
  );
  dateRange(h.start, dateAdd(h.end, -1)).forEach(day =>
    data.plans.push(make(day, '21:00', '21:10', 'back', '回到飯店休息'))
  );

  save();
  toast('已帶入住宿行程');
}

function removeHotelPlans(id) {
  data.plans = data.plans.filter(p => !(p.source === 'hotel' && p.hotelId === id));
  save();
  toast('已移除住宿行程');
}

function addHotelBudget(id) {
  if (hotelHasBudget(id)) return toast('住宿費用已記過');
  const h = data.hotels.find(x => x.id === id);
  if (!h) return;
  data.expenses.push({
    id: uid(), hotelId: id, source: '住宿', type: '住宿',
    name: `${short(h.start)}~${short(h.end)} ${h.name}`,
    payer: '未定', payMethod: '未定', day: '',
    mode: 'TWD', foreign: 0, twd: 0, memo: '由住宿資料帶入'
  });
  save();
  toast('已帶入住宿費用');
}

function removeHotelBudget(id) {
  data.expenses = data.expenses.filter(e => e.hotelId !== id);
  save();
  toast('已移除住宿費用');
}

/* ══════════════════════════════════════════
   旅遊地設定
   ══════════════════════════════════════════ */

function saveBasic() {
  const country = $('country')?.value || data.trip.country;
  const cityEl  = $('citySelect');
  let city = cityEl?.value || '';
  if (city === '自訂') city = $('cityCustom')?.value.trim() || '';

  // 換國家 → 提示清空
  if (country !== data.trip.country) {
    if (!confirm(`切換到「${country}」會清空目前的航班、住宿、行程等資料，確定嗎？`)) {
      if ($('country')) $('country').value = data.trip.country;
      return;
    }
    const newData = makeDefaultData();
    newData.trip.country      = country;
    newData.trip.city         = city;
    newData.trip.dest         = destName(country, city);
    newData.trip.currency     = CURRENCY_MAP[country] || 'USD';
    newData.trip.rate         = RATE_MAP[newData.trip.currency] || 1;
    newData.trip.start        = $('start')?.value || '';
    newData.trip.end          = $('end')?.value   || '';
    newData.trip.travelerCount = Number($('travelerCount')?.value || 2);
    newData.trip.travelers    = readTravelers(newData.trip.travelerCount);
    newData.days              = mkDays(newData.trip.start, newData.trip.end);
    data = newData;
    save();
    toast('已切換國家，資料已重置');
    return;
  }

  // 換日期 → 提示重算
  const newStart = $('start')?.value || data.trip.start;
  const newEnd   = $('end')?.value   || data.trip.end;
  const dateChanged = newStart !== data.trip.start || newEnd !== data.trip.end;

  data.trip.country      = country;
  data.trip.city         = city;
  data.trip.dest         = destName(country, city);
  data.trip.currency     = ($('currency')?.value || data.trip.currency).toUpperCase();
  data.trip.rate         = Number($('rateSetup')?.value || data.trip.rate || 1);
  data.trip.travelerCount = Number($('travelerCount')?.value || 1);
  data.trip.travelers    = readTravelers(data.trip.travelerCount);
  data.trip.start        = newStart;
  data.trip.end          = newEnd;

  if (dateChanged) {
    data.days = mkDays(data.trip.start, data.trip.end);
    cur = currentDay = data.days[0]?.key || data.trip.start;
  }

  save();
  toast('已儲存旅遊地設定');
}

function readTravelers(count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push($(`traveler${i}`)?.value || data.trip.travelers?.[i] || String.fromCharCode(65 + i));
  }
  return arr;
}

function previewTravelerCount() {
  const n    = Number($('travelerCount')?.value || 1);
  const old  = data.trip.travelers || [];
  const html = Array.from({ length: n }, (_, i) =>
    `<div><label>旅伴 ${String.fromCharCode(65+i)} 名稱</label>
     <input id="traveler${i}" value="${esc(old[i] || String.fromCharCode(65+i))}"></div>`
  ).join('');
  if ($('travelerBox')) $('travelerBox').innerHTML = html;
}

function countryChanged() {
  const c = $('country')?.value;
  if (c && CURRENCY_MAP[c]) {
    if ($('currency'))  $('currency').value  = CURRENCY_MAP[c];
    if ($('rateSetup')) $('rateSetup').value = RATE_MAP[CURRENCY_MAP[c]] || data.trip.rate;
  }
  // 更新城市選單
  const cityList = CITY_MAP[c] || ['自訂'];
  const cityEl   = $('citySelect');
  if (cityEl) {
    cityEl.innerHTML = cityList.map(city =>
      `<option value="${city}">${city}</option>`
    ).join('');
  }
  updateCustomCityVisibility();
}

function updateCustomCityVisibility() {
  const country = $('country')?.value || '';
  const city    = $('citySelect')?.value || '';
  const show    = country === '其他' || city === '自訂';
  const box     = $('customCityBox');
  if (box) box.style.display = show ? '' : 'none';
}
