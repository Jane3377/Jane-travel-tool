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

function saveFlights() {
  if (!validateFlightForm()) return;
  const hadPlans = flightHasPlans();
  data.flights.out  = readFlightForm('out');
  data.flights.back = readFlightForm('back');
  v39FlightDirty = false;
  if (hadPlans) syncFlightPlans();
  silentSave();
  renderStay();
  toast(hadPlans ? '已存好航班，並更新行程' : '已存好航班');
}

/* ── 航班行程同步 ── */
function flightHasPlans() {
  return data.plans.some(p => p.source === 'flight');
}

function flightPlanTemplates() {
  const out  = normalizeFlightObj(data.flights.out);
  const back = normalizeFlightObj(data.flights.back);
  const tpls = [];

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

  const makeNode = (id, dir, name, dayTime, type, note) => ({
    id, source: 'flight', sourceType: 'flight', lockedName: true,
    day: dayTime.day, start: '', end: dayTime.time,
    type, name, note: note || '', memo: '由航班資料帶入'
  });

  // 去程
  const os = out.segments[0] || {};
  const ol = out.segments[out.segments.length - 1] || {};
  if (os.dep) tpls.push(makeNode('flight-out-to-airport', 'out', `出發去 ${os.from || '機場'}`, addMin(os.dep, -120), '交通', out.toAirport));
  out.segments.forEach((s, i) => {
    if (!s.dep) return;
    tpls.push({
      id: `flight-out-seg-${i}`, source: 'flight', sourceType: 'flight', lockedName: true,
      day: pad(s.dep).day, start: pad(s.dep).time, end: pad(s.arr).time,
      type: '航班', name: `去程飛機${s.no ? ' ' + s.no : ''}`,
      note: `${s.from || ''} → ${s.to || ''}`, memo: '由航班資料帶入'
    });
  });
  if (ol.arr) tpls.push(makeNode('flight-out-arrival', 'out', `從 ${ol.to || '機場'} 前往飯店`, addMin(ol.arr, 60), '交通', out.fromAirport));

  // 回程
  const bs = back.segments[0] || {};
  const bl = back.segments[back.segments.length - 1] || {};
  if (bs.dep) tpls.push(makeNode('flight-back-to-airport', 'back', `從飯店前往 ${bs.from || '機場'}`, addMin(bs.dep, -120), '交通', back.toAirport));
  back.segments.forEach((s, i) => {
    if (!s.dep) return;
    tpls.push({
      id: `flight-back-seg-${i}`, source: 'flight', sourceType: 'flight', lockedName: true,
      day: pad(s.dep).day, start: pad(s.dep).time, end: pad(s.arr).time,
      type: '航班', name: `回程飛機${s.no ? ' ' + s.no : ''}`,
      note: `${s.from || ''} → ${s.to || ''}`, memo: '由航班資料帶入'
    });
  });
  if (bl.arr) tpls.push(makeNode('flight-back-home', 'back', `從 ${bl.to || '機場'} 回家`, addMin(bl.arr, 60), '交通', back.fromAirport));

  return tpls.filter(t => t.day);
}

function syncFlightPlans() {
  const tpls    = flightPlanTemplates();
  const keepIds = new Set(tpls.map(t => t.id));
  data.plans    = data.plans.filter(p => p.source !== 'flight' || keepIds.has(p.id));
  tpls.forEach(tpl => {
    const idx = data.plans.findIndex(p => p.id === tpl.id);
    if (idx >= 0) Object.assign(data.plans[idx], tpl);
    else data.plans.push({ mode:'foreign', foreign:0, twd:0, payer:'未定', payMethod:'未定', ...tpl });
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
  if (data.expenses.some(e => e.source === '航班')) return toast('航班預算已記過');
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
  toast('已移除航班預算');
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
        ${hasB ? '<span class="tag">已帶入預算</span>' : '<span class="tag muted">未帶入預算</span>'}
      </div>
      <div class="btns">
        <button class="small" onclick="editHotel('${h.id}')">編輯</button>
        <button class="small" onclick="openMap('${encodeURIComponent((h.addr||h.name)+' '+data.trip.dest)}')">地圖</button>
        ${hasP
          ? `<button class="small" onclick="removeHotelPlans('${h.id}')">移除行程</button>`
          : `<button class="small" onclick="addHotelPlans('${h.id}')">帶入行程</button>`}
        ${hasB
          ? `<button class="small" onclick="removeHotelBudget('${h.id}')">移除預算</button>`
          : `<button class="small" onclick="addHotelBudget('${h.id}')">帶入預算</button>`}
        <button class="small danger" onclick="deleteHotel('${h.id}')">刪除</button>
      </div>
    </div>`;
}

function saveHotel() {
  if (!$('hname').value) return toast('請輸入住宿名稱');
  const start = $('hstart').value;
  const end   = $('hend').value;
  if (!start || !end) return toast('請填入住日與退房日');

  const item = {
    name:  $('hname').value,
    start, end,
    addr:  $('haddr').value,
    note:  $('hnote').value
  };

  let hotelId;
  if (editingHotelId) {
    hotelId = editingHotelId;
    Object.assign(data.hotels.find(h => h.id === editingHotelId), item);
    if (hotelHasPlans(hotelId)) addHotelPlans(hotelId);
    editingHotelId = null;
    save();
    toast('已更新住宿');
  } else {
    hotelId = uid();
    data.hotels.push({ id: hotelId, ...item });
    data.hotels.sort((a, b) => String(a.start).localeCompare(b.start));
    v16KeepHotelOpen = true;
    silentSave();
    renderStay();
    // 顯示選項 modal
    $('hotelOptionModal')?.classList.add('show');
    return;
  }
}

function editHotel(id) {
  editingHotelId = id;
  v16KeepHotelOpen = true;
  renderStay();
  scrollTo(0, 0);
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
  const id = data.hotels[data.hotels.length - 1]?.id;
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

  const make = (day, start, end, name) => ({
    id: `hotel-${id}-${day}-${name.slice(0,4)}`, source: 'hotel', sourceType: 'hotel',
    hotelId: id, lockedName: true, day, start, end,
    type: '住宿', name, note: h.addr || '', memo: '由住宿資料帶入',
    mode: 'foreign', foreign: 0, twd: 0, payer: '未定', payMethod: '未定'
  });

  data.plans.push(make(h.start, '15:00', '15:30', `入住 ${h.name}`));
  dateRange(dateAdd(h.start, 1), h.end).forEach(day =>
    data.plans.push(make(day, '09:00', '09:10', `從 ${h.name} 出發`))
  );
  dateRange(h.start, dateAdd(h.end, -1)).forEach(day =>
    data.plans.push(make(day, '21:00', '21:10', `回到 ${h.name}`))
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
  if (hotelHasBudget(id)) return toast('住宿預算已記過');
  const h = data.hotels.find(x => x.id === id);
  if (!h) return;
  data.expenses.push({
    id: uid(), hotelId: id, source: '住宿', type: '住宿',
    name: `${short(h.start)}~${short(h.end)} ${h.name}`,
    payer: '未定', payMethod: '未定', day: '',
    mode: 'TWD', foreign: 0, twd: 0, memo: '由住宿資料帶入'
  });
  save();
  toast('已帶入住宿預算');
}

function removeHotelBudget(id) {
  data.expenses = data.expenses.filter(e => e.hotelId !== id);
  save();
  toast('已移除住宿預算');
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
