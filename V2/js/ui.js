/* ================================================================
   ui.js — render 函式、頁面切換、導覽列
   ================================================================ */

/* ── 品牌 Logo HTML ── */
function _brandHtml() {
  const svg = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#4A5D4E"/><rect x="10" y="13" width="40" height="43" rx="10" fill="#FFFAF2"/><path d="M22 13c1.7-5.4 13.9-5.4 15.6 0" fill="none" stroke="#FFFAF2" stroke-width="4" stroke-linecap="round"/><path d="M21 28h18M21 38h14" stroke="#4A5D4E" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="18" r="6" fill="#E5ECE9"/><path d="M45 14v4l3 2" stroke="#4A5D4E" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
  return `<div class="loginBrand"><span class="brandMark">${svg}</span><span>貞選旅管家<small>Janeselect Travel Manager</small></span></div>`;
}

/* ══════════════════════════════════════════
   頁面切換
   ══════════════════════════════════════════ */

function go(v) {
  view = v;
  VIEWS.forEach(([key]) => {
    const el = $(key + 'View');
    if (el) el.classList.toggle('hidden', key !== v);
  });
  if (v === 'planner' && !currentDay) currentDay = cur || data.days?.[0]?.key || '';
  renderNav();
  render();
  scrollTo(0, 0);
}

function showShell(mode) {
  const login   = $('loginView');
  const list    = $('tripListView');
  const app     = $('mainApp');
  const widget  = $('accountWidget');
  if (login)  login.classList.toggle('hidden',  mode !== 'login');
  if (list)   list.classList.toggle('hidden',   mode !== 'list');
  if (app)    app.classList.toggle('hidden',    mode !== 'app');
  if (widget) widget.style.display = mode === 'app' ? '' : 'none';
}

/* ══════════════════════════════════════════
   導覽列
   ══════════════════════════════════════════ */

function renderNav() {
  const tabs   = $('tabs');
  const mobile = $('mobileTopNav') || $('mobile');
  if (tabs) {
    tabs.innerHTML = VIEWS.map(([k, l]) =>
      `<button class="tab ${k===view?'active':''}" onclick="go('${k}')">${l}</button>`
    ).join('');
  }
  if (mobile) {
    // 手機底部只顯示主要幾個
    const mobileViews = [['trip','旅遊地'],['stay','機酒'],['planner','行程'],['spots','景點'],['budget','預算'],['packing','行李'],['photoBook','旅遊書']];
    mobile.innerHTML = mobileViews.map(([k, l]) =>
      `<button class="nav ${k===view?'active':''}" onclick="go('${k}')">${l}</button>`
    ).join('');
  }
}

/* ══════════════════════════════════════════
   Header
   ══════════════════════════════════════════ */

function renderHead() {
  const header = $('header');
  if (!header) return;

  // 更新 badge logo
  const badge = header.querySelector('.badge');
  if (badge) badge.innerHTML = `<svg viewBox="0 0 64 64" width="18" height="18" style="vertical-align:-3px;margin-right:4px" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#4A5D4E"/><rect x="10" y="13" width="40" height="43" rx="10" fill="#FFFAF2"/><path d="M22 13c1.7-5.4 13.9-5.4 15.6 0" fill="none" stroke="#FFFAF2" stroke-width="4" stroke-linecap="round"/><path d="M21 28h18M21 38h14" stroke="#4A5D4E" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="18" r="6" fill="#E5ECE9"/><path d="M45 14v4l3 2" stroke="#4A5D4E" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg> 貞選旅管家`;

  // 標題區
  const titleEl    = $('titleText');
  const subtitleEl = $('subtitleText');
  const destEl     = $('sDest');
  const dateEl     = $('sDate');

  if (titleEl)    titleEl.textContent    = data.meta.title    || '我的旅程手帳';
  if (subtitleEl) subtitleEl.textContent = data.meta.subtitle || '';
  if (destEl)     destEl.textContent     = data.trip.dest     || '未設定';
  if (dateEl)     dateEl.textContent     = data.trip.start && data.trip.end
    ? `${short(data.trip.start)}-${short(data.trip.end)}` : '未設定';

  document.title = data.meta.title || '貞選旅管家';

  ensureAccountSyncLine();
  renderTripSwitchBar();
  applyLockBanner();
}

/* ── 標題編輯 ── */
function editTitle() {
  const val = prompt('請輸入旅程標題', data.meta.title || '');
  if (val !== null && val.trim()) { data.meta.title = val.trim(); save(); }
}
function editSubtitle() {
  const val = prompt('請輸入副標文字', data.meta.subtitle || '');
  if (val !== null && val.trim()) { data.meta.subtitle = val.trim(); save(); }
}

/* ══════════════════════════════════════════
   側邊欄（日曆）
   ══════════════════════════════════════════ */

function renderSide() {
  const daysEl  = $('days');
  const layout  = document.querySelector('.layout');
  const panel   = document.querySelector('.panel');

  if (layout) {
    const showPanel = view === 'planner';
    if (window.innerWidth > 620) {
      layout.style.gridTemplateColumns = showPanel ? '280px 1fr' : '1fr';
    }
    if (panel) panel.style.display = showPanel ? '' : 'none';
  }

  if (!daysEl) return;
  daysEl.innerHTML = data.days.map(d => {
    const hotel = hotelFor(d.key);
    const count = sortedPlans(d.key).length;
    return `
      <div class="day ${d.key === currentDay ? 'active' : ''}"
           onclick="currentDay='${d.key}';cur='${d.key}';go('planner')">
        <b>${d.title}</b>
        <span class="dayDate">${shortWithDay(d.key)}</span>
        <span>${count} 行程｜住宿：${hotel ? esc(hotel.name) : '未設定'}</span>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════
   各頁 render
   ══════════════════════════════════════════ */

function renderTrip() {
  const el = $('tripView');
  if (!el) return;

  const country      = data.trip.country || '韓國';
  const selectedCity = data.trip.city    || (CITY_MAP[country]?.[0] || '');
  const showCustom   = country === '其他' || !CITY_MAP[country]?.includes(selectedCity);
  const h            = editingHotelId ? data.hotels.find(x => x.id === editingHotelId) : null;

  data.hotels.sort((a, b) => String(a.start).localeCompare(b.start));

  el.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 4px">🌏 旅遊地設定</h2>
      <div class="hint" style="margin-bottom:14px">先設定旅遊地、日期、幣別與旅伴。完成後才會開啟航班住宿、行程、口袋景點、預算、行李與旅遊書。</div>
      <div class="three compactMobile">
        <div><label>國家 / 區域</label>
          <select id="country" onchange="countryChanged()">
            ${[...Object.keys(CURRENCY_MAP), '其他'].map(c =>
              `<option value="${c}" ${c===country?'selected':''}>${c}</option>`).join('')}
          </select></div>
        <div><label>城市 / 路線</label>
          <select id="citySelect" onchange="updateCustomCityVisibility()">
            ${cityOptions(country, selectedCity)}
          </select></div>
        <div id="customCityBox" style="display:${showCustom?'':'none'}">
          <label>自訂目的地</label>
          <input id="cityCustom" value="${esc(showCustom ? selectedCity : '')}" placeholder="例：釜山＋慶州">
        </div>
      </div>
      <div class="three compactMobile">
        <div><label>幣別</label>
          <input id="currency" value="${esc(data.trip.currency)}" oninput=""></div>
        <div><label>匯率（1 ${esc(data.trip.currency)} = TWD）</label>
          <input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div>
        <div style="align-self:end">
          <button class="btn blue" onclick="openRateSearch()">查匯率</button>
        </div>
      </div>
      <div class="two">
        <div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div>
        <div><label>回程日</label><input id="end"   type="date" value="${data.trip.end}"></div>
      </div>
      <div class="two">
        <div><label>旅遊人數</label>
          <select id="travelerCount" onchange="previewTravelerCount()">
            ${[1,2,3,4,5,6,7,8].map(n=>
              `<option value="${n}" ${Number(data.trip.travelerCount)===n?'selected':''}>${n} 人</option>`).join('')}
          </select></div>
        <div class="hint" style="align-self:end">目的地：${esc(data.trip.dest||'尚未設定')}</div>
      </div>
      <div class="grid2" id="travelerBox">
        ${Array.from({length: Number(data.trip.travelerCount||1)}, (_,i) =>
          `<div><label>旅伴 ${String.fromCharCode(65+i)}</label>
           <input id="traveler${i}" value="${esc(data.trip.travelers?.[i]||String.fromCharCode(65+i))}"></div>`
        ).join('')}
      </div>
      <div class="btns shareEditOnly"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div>
    </div>`;
}

function renderStay() {
  const el = $('stayView');
  if (!el) return;
  const h = editingHotelId ? data.hotels.find(x => x.id === editingHotelId) : null;
  data.hotels.sort((a, b) => String(a.start).localeCompare(b.start));

  el.innerHTML = `
    <div class="section"><div><h2>✈️ 航班與住宿</h2></div></div>

    <details class="card">
      <summary>✈️ 航班設定</summary>
      <div class="detailBody flightFormWrap">
        <div class="grid2">
          <div class="box blue flightBox"><b class="flightBoxTitle">去程</b>${flightForm('out')}</div>
          <div class="box pink flightBox"><b class="flightBoxTitle">回程</b>${flightForm('back')}</div>
        </div>
        <div class="flightStatusBox" id="flightStatusBox">
          ${flightStatusHtml()}
        </div>
        <div class="btns">
          <button class="btn dark" onclick="saveFlights()">驗證並同步行程</button>
        </div>
      </div>
    </details>

    <details class="card" ${v16KeepHotelOpen || editingHotelId ? 'open' : ''}>
      <summary>🏨 住宿</summary>
      <div class="detailBody">
        <div class="three compactMobile">
          <div class="full"><label>住宿名稱</label><input id="hname" value="${esc(h?.name||'')}"></div>
          <div><label>入住日</label>
            <input id="hstart" type="date" value="${h?.start||data.trip.start}" min="${data.trip.start}" max="${data.trip.end}"></div>
          <div><label>退房日</label>
            <input id="hend"   type="date" value="${h?.end||data.trip.end}"   min="${data.trip.start}" max="${data.trip.end}"></div>
        </div>
        <label>地址</label>
        <div class="two">
          <input id="haddr" value="${esc(h?.addr||'')}" placeholder="可貼上飯店地址">
          <button class="btn blue compact" onclick="searchHotelAddr()">查地圖</button>
        </div>
        <label>備註</label>
        <textarea id="hnote">${esc(h?.note||'')}</textarea>
        <div class="btns">
          <button class="btn dark" onclick="saveHotel()">${h ? '儲存住宿修改' : '新增住宿'}</button>
          ${h ? `<button class="btn soft" onclick="editingHotelId=null;v16KeepHotelOpen=false;renderStay()">取消編輯</button>` : ''}
        </div>
        <div class="grid2" style="margin-top:10px">
          ${data.hotels.map(hotelCard).join('') || '<div class="empty">尚未新增住宿</div>'}
        </div>
      </div>
    </details>`;

  v16KeepHotelOpen = false;
  // 初始化航班段落顯示
  setTimeout(() => { toggleFlightSegments('out'); toggleFlightSegments('back'); }, 0);
  // 航班欄位：輸入後自動儲存（與住宿欄位分開監聽）
  el.querySelector('.flightFormWrap')?.querySelectorAll('input,select,textarea').forEach(input => {
    input.addEventListener('change', () => { v39FlightDirty = true; scheduleFlightAutoSave(); });
    input.addEventListener('input',  () => { v39FlightDirty = true; scheduleFlightAutoSave(); });
  });
}

function flightStatusHtml() {
  const hasPlans  = flightHasPlans();
  const hasBudget = data.expenses.some(e => e.source === '航班');
  const ready     = !v39FlightDirty && flightPlanTemplates().length > 0;
  const disAttr   = ready ? '' : 'disabled';
  return `
    <div class="flightSavedHint">
      <span class="flightStatusSaved ${ready ? '' : 'off'}">${ready ? '航班已儲存' : '請先填寫並存好航班'}</span>
    </div>
    <div class="flightStatusActions">
      ${hasPlans
        ? `<button class="btn soft compact" ${disAttr} onclick="removeFlightPlans()">移除航班行程</button>`
        : `<button class="btn blue compact" ${disAttr} onclick="addFlightToPlans()">帶入行程</button>`}
      ${hasBudget
        ? `<button class="btn soft compact" ${disAttr} onclick="removeFlightBudget()">移除機票預算</button>`
        : `<button class="btn pink compact" ${disAttr} onclick="addFlightBudget()">記一筆來回機票</button>`}
    </div>`;
}

function refreshFlightStatus() {
  const box = $('flightStatusBox');
  if (box) box.innerHTML = flightStatusHtml();
}

function renderPlanner() {
  const el = $('plannerView');
  if (!el) return;
  normalizePlans();
  if (!currentDay) currentDay = cur = data.days?.[0]?.key || '';
  normalizePlanTimes(currentDay);
  const plans = sortedPlans(currentDay);

  el.innerHTML = `
    <div class="section">
      <div><h2>${dayTitle(currentDay)}</h2>
        <div class="hint">住宿：${hotelFor(currentDay)?.name || '未設定'}</div>
      </div>
    </div>

    <details class="card" ${editingPlanId || v16PendingSpotId ? 'open' : ''}>
      <summary>${editingPlanId ? '編輯行程' : '＋ 新增行程'}</summary>
      <div class="detailBody">
        <div class="three compactMobile">
          <div class="full"><label>日期</label>
            <select id="pday">${optsDays(currentDay)}</select></div>
          <div><label>開始</label><input id="ps" type="time" value="10:00" onchange="planStartChange()"></div>
          <div><label>時長</label>
            <select id="pdur" onchange="planDurationChange()">
              <option value="">（選填）</option>
              ${[30,60,90,120,150,180,210,240,270,300].map(m => {
                const h = Math.floor(m/60), r = m%60;
                const label = h && r ? `${h} 小時 ${r} 分` : h ? `${h} 小時` : `${r} 分`;
                return `<option value="${m}">${label}</option>`;
              }).join('')}
            </select></div>
          <div><label>結束 <span id="pdurDisplay" class="pdurDisplay"></span></label>
            <input id="pe" type="time" value="11:30" onchange="planEndChange()" oninput="planEndChange()"></div>
        </div>
        <div class="two">
          <div><label>分類</label><select id="ptype">${optsPlanTypes()}</select></div>
          <div></div>
        </div>
        <label>行程名稱</label>
        <input id="pname">
        <div id="lockedNameHint" class="lockedFieldHint" style="display:none">
          此行程由航班／住宿帶入，名稱不可編輯。
        </div>
        <label>地址（選填）</label>
        <input id="paddress" placeholder="未來地圖功能使用">
        ${data.trip.country === '韓國' ? `
        <div class="two">
          <div><label>韓文名稱（選填）</label><input id="pkrName" placeholder="예: 감천문화마을"></div>
          <div><label>韓文地址（選填）</label><input id="pkrAddr" placeholder="예: 부산광역시 사하구 감내2로 203"></div>
        </div>` : ''}
        <label>注意事項</label><textarea id="pnote"></textarea>
        <label>備註</label><textarea id="pmemo"></textarea>
        <div class="btns">
          <button class="btn dark" onclick="savePlanForm()">${editingPlanId ? '儲存行程' : '加入行程'}</button>
          ${editingPlanId || v16PendingSpotId
            ? '<button class="btn soft" onclick="clearPlanForm()">取消</button>' : ''}
        </div>
      </div>
    </details>

    <div id="pcards">${planCards(plans)}</div>`;

  if (editingPlanId) fillPlanForm(editingPlanId);
  else if (v16PendingSpotId) fillFromSpot(v16PendingSpotId);
  else if ($('pday')) $('pday').value = currentDay;

  applyLockedNameState();

  // AI bar
  const aiBar = el.querySelector('.aiBarPlanner');
  if (!aiBar) {
    const section = el.querySelector('.section');
    if (section) section.insertAdjacentHTML('afterend', `
      <div class="card ${shareViewMode ? '' : 'aiBarPlanner'}">
        ${shareViewMode ? '' : `
        <div class="aiBarLabel">AI 輔助</div>
        <div class="hint" style="margin-bottom:10px">只檢查已排入行程；偏好在產生提示詞時設定。</div>
        <div class="btns">
          <button class="btn dark compact" onclick="showAIPrompt('itinerary')">AI 健檢</button>
          <button class="btn blue compact" onclick="openImportModal()">AI 匯入</button>
        </div>`}
        ${aiReviewHtml()}
      </div>`);
  }
}

function renderSpots() {
  const el = $('spotsView');
  if (!el) return;
  const e        = editingSpotId ? data.spots.find(s => s.id === editingSpotId) : null;
  const isKorea  = data.trip.country === '韓國';

  el.innerHTML = `
    <div class="section">
      <div><h2>📍 口袋景點</h2>
        <div class="hint">可手動新增，也可以用 AI 產出 JSON 後匯入。</div>
      </div>
    </div>

    <div class="card aiBarSpots">
      <div class="aiBarLabel">AI 輔助</div>
      <div class="hint" style="margin-bottom:10px">依航班、住宿、已排入行程與偏好推薦口袋景點。</div>
      <div class="btns">
        <button class="btn dark compact" onclick="showAIPrompt('spots')">AI 找景點</button>
        <button class="btn blue compact" onclick="openImportModal()">AI 匯入</button>
      </div>
    </div>

    <details class="card" ${e ? 'open' : ''}>
      <summary>${e ? '編輯口袋景點' : '＋ 新增口袋景點'}</summary>
      <div class="detailBody">
        <div class="three compactMobile">
          <div class="full"><label>名稱</label><input id="sn" value="${esc(e?.name||'')}"></div>
          <div><label>分類</label>
            <select id="st">
              ${['景點','餐廳','咖啡廳','購物','雨天備案','其他'].map(t=>
                `<option ${e?.type===t?'selected':''}>${t}</option>`).join('')}
            </select></div>
          <div><label>候選日期</label>
            <select id="sd"><option value="">未排</option>${optsDays(e?.day||'')}</select></div>
        </div>
        <label>地址 / 區域</label>
        <div class="two">
          <input id="sa" value="${esc(e?.addr||'')}">
          <button class="btn blue compact" onclick="mapSpotDraft()">查地圖</button>
        </div>
        <label>注意事項</label><textarea id="sm">${esc(e?.memo||'')}</textarea>
        ${isKorea ? `
        <div class="two">
          <div><label>韓文名稱（選填）</label><input id="skrName" value="${esc(e?.krName||'')}" placeholder="예: 감천문화마을"></div>
          <div><label>韓文地址（選填）</label><input id="skrAddr" value="${esc(e?.krAddress||'')}" placeholder="예: 부산광역시 사하구 감내2로 203"></div>
        </div>` : ''}
        <div class="three compactMobile">
          <div class="full"><label>排入行程？</label>
            <select id="sToPlan">
              <option value="no">先放口袋</option>
              <option value="yes">同步排入行程</option>
            </select></div>
          <div><label>預設開始</label><input id="sStart" type="time" value="${esc(e?.start||'10:00')}"></div>
          <div><label>預設結束</label><input id="sEnd"   type="time" value="${esc(e?.end||'11:30')}"></div>
        </div>
        <div class="btns">
          <button class="btn dark" onclick="saveSpot()">${e ? '儲存修改' : '加入景點'}</button>
          ${e ? '<button class="btn soft" onclick="clearSpotForm()">取消編輯</button>' : ''}
        </div>
      </div>
    </details>

    <div class="card spotFilterBar">
      <div class="spotTypeChips">
        ${['全部','景點','餐廳','咖啡廳','購物','雨天備案','其他'].map(t =>
          `<button class="filterChip ${spotFilterType===(t==='全部'?'':t)?'active':''}"
            onclick="spotFilterType='${t==='全部'?'':t}';renderSpots()">${t}</button>`
        ).join('')}
      </div>
      <select class="spotDaySelect" onchange="spotFilterDay=this.value;renderSpots()">
        <option value="">全部日期</option>
        <option value="none" ${spotFilterDay==='none'?'selected':''}>未排</option>
        ${data.days.map(d =>
          `<option value="${d.key}" ${spotFilterDay===d.key?'selected':''}>${d.title}（${d.label}）</option>`
        ).join('')}
      </select>
    </div>

    <div class="grid2">
      ${data.spots.filter(s => {
        if (spotFilterType && s.type !== spotFilterType) return false;
        if (spotFilterDay === 'none' && s.day) return false;
        if (spotFilterDay && spotFilterDay !== 'none' && s.day !== spotFilterDay) return false;
        return true;
      }).map(s => {
        const hasP = spotPlanExists(s);
        return `
          <div class="card ${hasP?'spotUsed':''}">
            <div class="time">${s.day ? dayTitle(s.day) : '未排'}${s.start?' '+esc(s.start):''}</div>
            <div class="place">${activityIcon(s.type)} ${esc(s.name)}</div>
            <div class="tags">
              <span class="tag">${esc(s.type)}</span>
              ${s.addr ? `<span class="tag blue">${esc(s.addr)}</span>` : ''}
              ${s.source==='AI匯入' ? '<span class="tag green">AI 匯入</span>' : ''}
            </div>
            ${s.memo ? `<div class="box pink">${esc(s.memo)}</div>` : ''}
            <div class="btns">
              ${shareViewMode ? '' : (hasP
                ? `<button class="btn soft compact" onclick="returnSpotToPocket('${s.id}')">放回口袋</button>`
                : `<button class="btn soft compact" onclick="useSpot('${s.id}')">排入行程</button>`)}
              <button class="btn blue compact" onclick="openExploreModal('${s.id}')">探索</button>
              <button class="btn soft compact" onclick="openMap('${encodeURIComponent(s.name+' '+(s.addr||data.trip.dest))}')">地圖</button>
              ${isKorea ? `<button class="btn soft compact" onclick="naverMapSpot('${s.id}')">NAVER 地圖</button>` : ''}
              ${isKorea && s.krName ? `<button class="btn soft compact" onclick="copyKoreanText('${s.id}')">複製韓文</button>` : ''}
              <button class="small" onclick="editSpot('${s.id}')">編輯</button>
              <button class="small" onclick="deleteSpot('${s.id}')">刪除</button>
            </div>
          </div>`;
      }).join('') || '<div class="empty">沒有符合條件的景點</div>'}
    </div>`;
}

function renderBudget() {
  const el    = $('budgetView');
  if (!el) return;
  const items = allBudgetItems();

  el.innerHTML = `
    <div class="section">
      <div><h2>💰 預算總覽</h2>
        <div class="hint">新增行程時會自動建立一筆花費，可在這裡補金額。</div>
      </div>
    </div>
    ${budgetSummaryHtml(items)}
    <div class="card shareEditOnly">
      <div class="three compactMobile">
        <div><label>費用類型</label>
          <select id="etype">
            ${['機票','住宿','網路','旅平險','交通票券','景點票券','餐飲','購物','其他']
              .map(t=>`<option>${t}</option>`).join('')}
          </select></div>
        <div><label>項目</label><input id="ename"></div>
        <div><label>付款人</label><select id="epayer">${optsPayer('未定')}</select></div>
      </div>
      <div class="four compactMobile">
        <div><label>${esc(data.trip.currency)} 金額</label>
          <input id="eforeign" type="number" oninput="syncExpenseMoney('f')"></div>
        <div><label>TWD</label>
          <input id="etwd" type="number" oninput="syncExpenseMoney('t')"></div>
        <div><label>付款方式</label>
          <select id="epm">${optsPayMethod('未定')}</select></div>
        <div><label>日期（選填）</label>
          <input id="eday" type="date"></div>
      </div>
      <label>備註</label><input id="ememo">
      <div class="btns">
        <button class="btn dark" onclick="saveExpense()">${editingExpenseId ? '儲存預算' : '新增費用'}</button>
        ${editingExpenseId
          ? '<button class="btn soft" onclick="clearExpenseForm()">取消</button>' : ''}
        <button class="btn blue compact" onclick="openRateSearch()">查匯率</button>
      </div>
    </div>
    <div class="card shareEditOnly">
      <div class="aiBarLabel">AI 輔助</div>
      <div class="hint" style="margin-bottom:10px">檢查可能漏掉的預算項目，匯入後金額預設 0 讓你自行調整。</div>
      <div class="btns">
        <button class="btn dark compact" onclick="showBudgetPrompt()">AI 預算</button>
        <button class="btn blue compact" onclick="openImportModal()">AI 匯入</button>
      </div>
    </div>
    ${budgetListHtml(items)}`;

  if (editingExpenseId) fillExpenseForm(editingExpenseId);
}

function renderPacking() {
  const el      = $('packingView');
  if (!el) return;
  const current = data.packView || 'pre';
  const list    = data.packing.filter(x => x.type === current);

  el.innerHTML = `
    <div class="section"><div><h2>🧳 行李清單</h2></div></div>
    <div class="card">
      <label>清單情境</label>
      <select id="packView" onchange="data.packView=this.value;save()">
        <option value="pre" ${current==='pre'?'selected':''}>出國前</option>
        <option value="out" ${current==='out'?'selected':''}>離開飯店</option>
      </select>
    </div>
    <div class="card shareEditOnly">
      <div class="two">
        <div><label>新增項目</label><input id="pkn"></div>
        <div><label>備註</label><input id="pkm"></div>
      </div>
      <div class="btns">
        <button class="btn dark" onclick="addPackItem()">新增到此清單</button>
        <button class="btn soft" onclick="uncheckCurrentList()">取消勾選</button>
      </div>
    </div>
    <div class="card aiBarPacking">
      <div class="aiBarLabel">AI 輔助</div>
      <div class="hint" style="margin-bottom:10px">依目的地、天數與行程補強行李清單。</div>
      <div class="btns">
        <button class="btn pink compact" onclick="showAIPrompt('packing')">AI 行李</button>
        <button class="btn blue compact" onclick="openImportModal()">AI 匯入</button>
      </div>
    </div>
    <div class="grid2">
      ${list.map(x => `
        <div class="check ${x.checked?'checked':''}">
          <input type="checkbox" ${x.checked?'checked':''} onchange="togglePackItem('${x.id}')">
          <div><strong>${esc(x.name)}</strong><div class="mini">${esc(x.note)}</div></div>
          <button class="small" onclick="deletePackItem('${x.id}')">刪除</button>
        </div>`).join('') || '<div class="empty">此清單尚無項目</div>'}
    </div>`;
}

function renderPhotoBook() {
  const el = $('photoBookView');
  if (!el) return;
  el.innerHTML = `
    <div class="section">
      <div><h2>📖 照片旅遊書</h2>
        <div class="hint">直接在預覽中上傳封面與每日照片，每天最多 10 張。</div>
      </div>
      <div class="noPrint">
        <button class="btn soft" onclick="exportPhotoBookPDF()">匯出 PDF</button>
      </div>
    </div>
    <div class="storyBookPreview bookStyle-${data.meta.bookStyle||'fresh'}">
      <div class="storyBook">
        ${storyBookCoverHtml()}
        ${data.days.map(storyBookDay).join('')}
      </div>
    </div>`;
}

function renderHelp() {
  const el = $('helpView');
  if (!el) return;
  el.innerHTML = `
    <div class="section"><div><h2>說明與備份</h2></div></div>

    <div class="card"><h3>🔄 雲端同步</h3>
      <div class="box mint" id="syncStatus"><span class="syncDot off"></span><b>尚未同步</b></div>
      <div class="btns">
        <button class="btn dark" onclick="saveToCloudNow()">立即同步</button>
        <button class="btn blue" onclick="loadFromCloud({force:true})">載入雲端</button>
      </div>
    </div>

    <div class="card"><h3>📤 分享行程</h3>
      <div class="btns"><button class="btn dark" onclick="openShareModal()">分享行程</button></div>
    </div>

    <div class="card"><h3>💾 備份資料</h3>
      <div class="btns">
        <button class="btn dark" onclick="exportBackup()">匯出備份</button>
        <label class="btn soft" style="display:inline-block">匯入備份
          <input type="file" accept=".json" onchange="importBackup(this.files[0])" style="display:none">
        </label>
      </div>
    </div>

    <div class="card"><h3>🤖 AI 功能</h3>
      <div class="hint" style="margin-bottom:8px">旅遊偏好請在產生提示詞時於 modal 內設定。</div>
      <div class="btns">
        <button class="btn blue" onclick="showAIPrompt('spots')">AI 景點提示詞</button>
        <button class="btn blue" onclick="showAIPrompt('itinerary')">AI 行程健檢</button>
        <button class="btn soft" onclick="openImportModal()">匯入 AI 回傳</button>
      </div>
    </div>

    <div class="card"><h3>🎨 外觀設定</h3>
      <div class="btns"><button class="btn dark" onclick="openThemePanel()">外觀設定</button></div>
    </div>

    <div class="card"><h3>📖 照片旅遊書</h3>
      <div class="btns"><button class="btn dark" onclick="exportPhotoBookPDF()">開啟 PDF 匯出</button></div>
    </div>

    <div class="card"><h3>⚠️ 重置</h3>
      <div class="btns">
        <button class="btn soft"   onclick="loadSampleData()">載入範例</button>
        <button class="btn danger" onclick="resetAllData()">清除全部資料</button>
      </div>
    </div>
    <footer style="text-align:center;padding:24px;color:#aaa;font-size:12px">
      <b>貞選旅管家 ${APP_VERSION}</b>
    </footer>`;
}

/* ══════════════════════════════════════════
   登入 / 旅程清單畫面
   ══════════════════════════════════════════ */

function renderLoginView(message = '') {
  const el = $('loginView');
  if (!el) return;
  el.innerHTML = `
    <div class="gateShell">
      <div class="loginCard">
        ${_brandHtml()}
        <h1>登入以使用旅管家</h1>
        <p>登入後可建立與管理旅程，並跨裝置同步資料。</p>
        ${message ? `<div class="box pink" style="margin-top:12px">${esc(message)}</div>` : ''}
        <div class="btns">
          <button class="btn dark" onclick="firebaseSignIn()">使用 Google 登入</button>
        </div>
        <div class="cloudHint">授權帳號：${ALLOWED_EMAILS.map(esc).join('、')}</div>
      </div>
    </div>`;
}

function renderTripList() {
  const el     = $('tripListView');
  if (!el) return;
  const active   = tripList.filter(t => !t.archived);
  const archived = tripList.filter(t =>  t.archived);

  el.innerHTML = `
    <div class="gateShell">
      <div class="tripListHero">
        <div>
          ${_brandHtml()}
          <h1>我的旅程</h1>
          <p>每趟旅程都是一包獨立資料，資料分開保存。</p>
        </div>
        <div class="tripListCount">${active.length}/${MAX_TRIPS}</div>
      </div>

      <div class="tripGrid">
        ${active.map(tripCard).join('') || '<div class="tripListCard tripColor-cream"><div class="tripCardTop"><h3>還沒有旅程</h3></div></div>'}
      </div>

      ${archived.length ? `
        <details class="tripCreateCard">
          <summary>封存旅程（${archived.length}）</summary>
          <div class="tripGrid">${archived.map(tripCard).join('')}</div>
        </details>` : ''}

      <div class="tripCreateCard">
        <h3>＋ 新增旅程</h3>
        <div class="tripCreateGrid">
          <div><label>旅程名稱</label><input id="newTripTitle" placeholder="例：2026 釜山自由行"></div>
          <div><label>國家</label>
            <select id="newTripCountry" onchange="newTripCountryChanged()">
              ${[...Object.keys(CURRENCY_MAP),'其他'].map(c=>`<option>${c}</option>`).join('')}
            </select></div>
          <div><label>城市 / 路線</label>
            <select id="newTripCitySelect" onchange="newTripCityVisibility()">
              ${cityOptions('韓國', '釜山')}
            </select>
            <input id="newTripCityCustom" placeholder="自訂城市名稱" style="display:none;margin-top:6px">
          </div>
          <div><label>卡片色系</label>
            <input id="newTripColor" type="hidden" value="cream">
            <div class="newTripColorDots">
              ${CARD_COLORS.map(({key,label}, i) =>
                `<button type="button" class="tripColorDot color-${key}${i===0?' active':''}" title="${label}"
                  onclick="$('newTripColor').value='${key}';this.parentElement.querySelectorAll('.tripColorDot').forEach(b=>b.classList.remove('active'));this.classList.add('active')"
                ></button>`).join('')}
            </div></div>
          <div><label>出發日</label><input id="newTripStart" type="date"></div>
          <div><label>回程日</label><input id="newTripEnd"   type="date"></div>
          <div style="align-self:end">
            <button class="btn dark" style="width:100%" onclick="createTrip()">建立旅程</button>
          </div>
        </div>
      </div>

      <div class="btns">
        <button class="btn soft" onclick="firebaseSignOut()">登出</button>
      </div>
    </div>`;
}

function tripCard(t) {
  const color = CARD_COLORS.some(c => c.key === t.cardColor) ? t.cardColor : 'cream';
  return `
    <div class="tripListCard tripColor-${color} ${t.archived?'archived':''}">
      <div class="tripCardTop">
        <div>
          <span class="tripBadge">${t.archived ? '封存' : '旅程'}</span>
          <h3>${esc(t.title || '未命名旅程')}</h3>
        </div>
      </div>
      <div class="tripCardMetaGrid">
        <div><span>目的地</span><b>${esc(t.dest || '未設定')}</b></div>
        <div><span>日期</span><b>${t.start && t.end ? `${short(t.start)}-${short(t.end)}` : '未設定'}</b></div>
      </div>
      <div class="meta">${t.updatedAtClient ? `最後更新：${new Date(t.updatedAtClient).toLocaleDateString('zh-TW')}` : ''}</div>
      <div class="tripCardColorRow">
        ${CARD_COLORS.map(({key, label}) =>
          `<button type="button" class="tripColorDot color-${key}${key === color ? ' active' : ''}" title="${label}"
            onclick="event.stopPropagation();setTripColor('${t.id}','${key}')"></button>`
        ).join('')}
      </div>
      <div class="btns">
        <button class="btn dark compact"  onclick="selectTrip('${t.id}')">繼續編輯</button>
        ${t.archived
          ? `<button class="btn blue compact" onclick="restoreTrip('${t.id}')">還原</button>`
          : `<button class="btn soft compact" onclick="archiveTrip('${t.id}')">封存</button>`}
        <button class="btn danger compact" onclick="deleteTrip('${t.id}')">刪除</button>
      </div>
    </div>`;
}

function setTripColor(id, key) {
  const t = tripList.find(t => t.id === id);
  if (!t) return;
  t.cardColor = key;
  saveTripListCloud();
  renderTripList();
}

function newTripCountryChanged() {
  const country = $('newTripCountry')?.value || '韓國';
  const sel = $('newTripCitySelect');
  if (sel) sel.innerHTML = cityOptions(country, '');
  newTripCityVisibility();
}

function newTripCityVisibility() {
  const sel    = $('newTripCitySelect');
  const custom = $('newTripCityCustom');
  if (!sel || !custom) return;
  custom.style.display = sel.value === '自訂' ? '' : 'none';
}

/* ══════════════════════════════════════════
   主 render
   ══════════════════════════════════════════ */

function render() {
  normalizePlans();
  renderHead();
  renderSide();
  renderTrip();
  renderStay();
  renderPlanner();
  renderSpots();
  renderBudget();
  renderPacking();
  renderPhotoBook();
  renderHelp();
  applyLockBanner();
}

/* ══════════════════════════════════════════
   範例資料 / 重置
   ══════════════════════════════════════════ */

function loadSampleData() {
  data = makeDefaultData();
  data.meta.title    = '釜山小旅行手帳';
  data.meta.subtitle = '把海風、咖啡廳、夜市小吃收進行程裡，準備一趟釜山旅行。';
  data.trip = { dest:'韓國釜山', country:'韓國', city:'釜山', currency:'KRW', rate:.023,
    start:'2026-06-04', end:'2026-06-10', travelerCount:2, travelers:['Jane','Allen'] };
  data.days = mkDays(data.trip.start, data.trip.end);
  data.hotels = [{ id:uid(), name:'城市律動', start:'2026-06-05', end:'2026-06-07', addr:'釜山西面站附近', note:'' }];
  data.spots  = [
    { id:uid(), name:'甘川洞文化村', type:'景點', day:'2026-06-05', addr:'釜山', memo:'', source:'手動' },
    { id:uid(), name:'海雲台',       type:'景點', day:'2026-06-06', addr:'釜山', memo:'', source:'手動' }
  ];
  cur = currentDay = data.days[0].key;
  localSaveTrip();
  render();
  toast('已載入範例');
}

function resetAllData() {
  if (!confirm('確定清除全部資料？')) return;
  data = makeDefaultData();
  cur  = currentDay = data.days?.[0]?.key || '';
  localSaveTrip();
  render();
}
