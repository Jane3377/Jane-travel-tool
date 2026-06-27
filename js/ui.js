/* ================================================================
   ui.js — render 函式、頁面切換、導覽列
   ================================================================ */

const DAY_PALETTE = ['#4A7C59','#3A6EA5','#B85C5C','#7A5EA7','#C17E3C','#2A8090','#8A6040','#5B7EA8'];

function spotTypeSlug(type) {
  const m = {'景點':'spot','餐廳':'food','咖啡廳':'cafe','購物':'shop','雨天備案':'rain','交通':'transit','航班':'flight','住宿':'hotel'};
  return m[type] || 'other';
}

/* ── 品牌 Logo HTML ── */
function _brandHtml() {
  const svg = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#4A5D4E"/><rect x="10" y="13" width="40" height="43" rx="10" fill="#FFFAF2"/><path d="M22 13c1.7-5.4 13.9-5.4 15.6 0" fill="none" stroke="#FFFAF2" stroke-width="4" stroke-linecap="round"/><path d="M21 28h18M21 38h14" stroke="#4A5D4E" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="18" r="6" fill="#E5ECE9"/><path d="M45 14v4l3 2" stroke="#4A5D4E" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
  return `<div class="loginBrand"><span class="brandMark">${svg}</span><span>貞選旅管家<small>Janeselect Travel Manager</small></span></div>`;
}

/* ══════════════════════════════════════════
   頁面切換
   ══════════════════════════════════════════ */

function go(v, opts = {}) {
  if (v === 'budget' && view !== 'budget') {
    _budgetSort = 'date';
    _budgetFilterType = '';
    _budgetFilterDay = '';
  }
  view = v;
  VIEWS.forEach(([key]) => {
    const el = $(key + 'View');
    if (el) el.classList.toggle('hidden', key !== v);
  });
  if (v === 'planner' && !opts.keepDay) {
    const today = todayPlanKey();
    if (today) currentDay = cur = today;
    else if (!currentDay) currentDay = cur = data.days?.[0]?.key || '';
  }
  // 旅遊書：未手動切換過時，依旅程階段套用預設子頁
  if (v === 'photoBook' && !_photoBookTabTouched) {
    photoBookTab = defaultPhotoBookTab();
  }
  renderNav();
  render();
  updateFab();
  scrollTo(0, 0);
}

function goToTodayPlan() {
  currentDay = cur = todayPlanKey() || data.days?.[0]?.key || '';
  go('planner');
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
  if (mode !== 'list') { const s = $('newTripSheetOverlay'); if (s) s.hidden = true; }
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
    // 與桌機分頁共用 VIEWS，確保名稱一致（手機列可橫向捲動）
    mobile.innerHTML = VIEWS.map(([k, l]) =>
      `<button class="nav ${k===view?'active':''}" onclick="go('${k}')">${l}</button>`
    ).join('');
  }
  renderSetupStrip();
}

/* ══════════════════════════════════════════
   FAB 浮動新增鈕
   ══════════════════════════════════════════ */

const _FAB_VIEWS = ['planner', 'spots', 'budget', 'packing'];

function updateFab() {
  const fab = $('fabAdd');
  if (!fab) return;
  const inEdit = (view === 'planner' && (editingPlanId || v16PendingSpotId))
              || (view === 'spots'   && editingSpotId)
              || (view === 'budget'  && editingExpenseId);
  const show = _FAB_VIEWS.includes(view) && !shareViewMode && !deviceReadOnly && !inEdit;
  fab.classList.toggle('fabHidden', !show);
}

function openAddSheet() {
  if (view === 'planner' && (editingPlanId || v16PendingSpotId)) { toast('請先完成當前編輯'); return; }
  if (view === 'spots'   && editingSpotId)    { toast('請先完成當前編輯'); return; }
  if (view === 'budget'  && editingExpenseId) { toast('請先完成當前編輯'); return; }
  const overlay = $('addSheetOverlay');
  const body    = $('addSheetBody');
  const titleEl = $('addSheetTitle');
  if (!overlay || !body) return;
  if (view === 'budget') {
    if (titleEl) titleEl.textContent = '快速記帳';
    body.innerHTML = _quickExpenseFormHtml();
    overlay.hidden = false;
    document.body.classList.add('sheetOpen');
    setTimeout(() => document.getElementById('qname')?.focus(), 100);
    return;
  }
  const titles = { planner: '新增行程', spots: '新增口袋景點', packing: '新增清單項目' };
  if (titleEl) titleEl.textContent = titles[view] || '新增';
  body.innerHTML = _addFormHtml(view);
  overlay.hidden = false;
  document.body.classList.add('sheetOpen');
  if (view === 'planner' && $('pday')) $('pday').value = currentDay;
}

function switchToFullExpenseForm() {
  const body    = $('addSheetBody');
  const titleEl = $('addSheetTitle');
  if (!body) return;
  if (titleEl) titleEl.textContent = '新增費用';
  body.innerHTML = _addFormHtml('budget');
}

function _quickExpenseFormHtml() {
  const defDay = currentDay || '';
  const cur    = esc(data.trip.currency || 'KRW');
  const chips = QUICK_TYPES.map(t =>
    `<button class="quickTypeChip${t === _quickExpenseType ? ' active' : ''}" data-type="${esc(t)}" onclick="selectQuickType('${esc(t)}')">${esc(t)}</button>`
  ).join('');
  return `
    <div class="quickTypeChips">${chips}</div>
    <div style="margin:12px 0 8px"><label>項目</label>
      <input id="qname" placeholder="例：午餐、地鐵票…" autocomplete="off"></div>
    <div class="quickAmtWrap">
      <label>${cur} 金額</label>
      <input id="qforeign" class="quickAmtInput" type="number" inputmode="numeric" placeholder="0" oninput="updateQuickTwdPreview()">
      <div id="qtwdPreview" class="quickTwdPreview"></div>
    </div>
    <div style="margin:12px 0 16px"><label>日期</label>
      <input id="qday" type="date" value="${defDay}" required></div>
    <div class="btns">
      <button class="btn dark" onclick="saveQuickExpense()">記帳</button>
      <button class="btn soft" onclick="closeAddSheet()">取消</button>
    </div>
    <div class="quickSwitchRow">
      <button class="quickSwitchLink" onclick="switchToFullExpenseForm()">填完整表單（幣別 / 付款方式…）</button>
    </div>`;
}

function closeAddSheet() {
  editingPlanId    = null;
  editingSpotId    = null;
  editingExpenseId = null;
  const overlay = $('addSheetOverlay');
  if (overlay) overlay.hidden = true;
  document.body.classList.remove('sheetOpen');
  updateFab();
}

function closeAddSheetOnBackdrop(e) {
  if (e.target === $('addSheetOverlay')) closeAddSheet();
}

function openEditSheet(type, id) {
  const overlay = $('addSheetOverlay');
  const body    = $('addSheetBody');
  const titleEl = $('addSheetTitle');
  if (!overlay || !body) return;

  const titles = { plan: '編輯行程', spot: '編輯景點', expense: '編輯費用' };
  if (titleEl) titleEl.textContent = titles[type] || '編輯';

  if (type === 'plan') {
    editingPlanId = id;
    const e = data.plans.find(p => p.id === id);
    body.innerHTML = _addFormHtml('planner', e);
    setTimeout(() => planSyncDurDisplay(), 0);
  } else if (type === 'spot') {
    editingSpotId = id;
    const e = data.spots.find(s => s.id === id);
    body.innerHTML = _addFormHtml('spots', e);
  } else if (type === 'expense') {
    editingExpenseId = id;
    const e = data.expenses.find(x => x.id === id);
    body.innerHTML = _addFormHtml('budget', e);
  }

  overlay.hidden = false;
  document.body.classList.add('sheetOpen');
  updateFab();
}

function _addFormHtml(v, e = null) {
  const isKorea = data.trip.country === '韓國';
  const isEdit  = !!e;
  if (v === 'planner') {
    return `
      <div class="three compactMobile">
        <div class="full"><label>日期</label>
          <select id="pday">${optsDays(e?.day || currentDay)}</select></div>
        <div><label>開始</label>${timeSelHtml('ps', e?.start || '10:00', 'planStartChange()')}</div>
        <div><label>時長</label>
          <select id="pdur" onchange="planDurationChange()">
            <option value="">—</option>
            ${[30,60,90,120,150,180,210,240,270,300].map(m => {
              const h = Math.floor(m/60), r = m%60;
              const label = h && r ? `${h} 小時 ${r} 分` : h ? `${h} 小時` : `${r} 分`;
              return `<option value="${m}">${label}</option>`;
            }).join('')}
          </select></div>
        <div><label>結束 <span id="pdurDisplay" class="pdurDisplay"></span></label>
          ${timeSelHtml('pe', e?.end || '11:30', 'planEndChange()')}</div>
      </div>
      <div class="two">
        <div><label>分類</label><select id="ptype">${optsPlanTypes(e?.type||'景點')}</select></div>
        <div></div>
      </div>
      <label>名稱</label>
      <input id="pname" value="${esc(e?.name||'')}">
      <label>地址</label>
      <input id="paddress" value="${esc(e?.address||'')}">
      ${isKorea ? `
      <div class="two">
        <div><label>韓文名稱（選填）</label><input id="pkrName" placeholder="예: 감천문화마을" value="${esc(e?.krName||'')}"></div>
        <div><label>韓文地址（選填）</label><input id="pkrAddr" placeholder="예: 부산광역시 사하구 감내2로 203" value="${esc(e?.krAddress||'')}"></div>
      </div>` : ''}
      <label>說明</label><textarea id="pnote">${esc(e?.note||'')}</textarea>
      <div class="btns">
        <button class="btn dark" onclick="savePlanForm()">${isEdit ? '儲存修改' : '加入行程'}</button>
        <button class="btn soft" onclick="closeAddSheet()">取消</button>
      </div>`;
  }
  if (v === 'spots') {
    return `
      <div class="three compactMobile">
        <div class="full"><label>名稱</label><input id="sn" value="${esc(e?.name||'')}"></div>
        <div><label>分類</label>
          <select id="st">
            ${['景點','餐廳','咖啡廳','購物','雨天備案','其他'].map(t =>
              `<option ${t===(e?.type||'')?'selected':''}>${t}</option>`).join('')}
          </select></div>
        <div><label>候選日期</label>
          <select id="sd"><option value="">未排</option>${optsDays(e?.day||'')}</select></div>
      </div>
      <label>地址 / 區域</label>
      <div class="two">
        <input id="sa" value="${esc(e?.addr||'')}">
        <button class="btn blue compact" onclick="mapSpotDraft()">查地圖</button>
      </div>
      <label>說明</label><textarea id="sm">${esc(e?.note||'')}</textarea>
      ${isKorea ? `
      <div class="two">
        <div><label>韓文名稱（選填）</label><input id="skrName" placeholder="예: 감천문화마을" value="${esc(e?.krName||'')}"></div>
        <div><label>韓文地址（選填）</label><input id="skrAddr" placeholder="예: 부산광역시 사하구 감내2로 203" value="${esc(e?.krAddress||'')}"></div>
      </div>` : ''}
      ${!isEdit ? `
      <div class="three compactMobile">
        <div class="full"><label>排入行程？</label>
          <select id="sToPlan">
            <option value="no">先放口袋</option>
            <option value="yes">同步排入行程</option>
          </select></div>
        <div><label>預設開始</label>${timeSelHtml('sStart', '10:00')}</div>
        <div><label>預設結束</label>${timeSelHtml('sEnd', '11:30')}</div>
      </div>` : ''}
      <div class="btns">
        <button class="btn dark" onclick="saveSpot()">${isEdit ? '儲存修改' : '加入景點'}</button>
        <button class="btn soft" onclick="closeAddSheet()">取消</button>
      </div>`;
  }
  if (v === 'budget') {
    const defType = e?.type || '餐飲';
    const defMode = e?.mode || 'foreign';
    const defRate = e?.expRate != null ? e.expRate : (data.trip.rate || '');
    return `
      <div class="three compactMobile">
        <div><label>費用類型</label>
          <select id="etype">
            ${['餐飲','機票','住宿','網路','旅平險','交通票券','景點票券','購物','其他'].map(t =>
              `<option ${t===defType?'selected':''}>${t}</option>`).join('')}
          </select></div>
        <div><label>項目</label><input id="ename" value="${esc(e?.name||'')}"></div>
        <div><label>日期</label>
          <input id="eday" type="date" value="${e?.day||''}"></div>
      </div>
      <div class="payModeRow">
        <span class="payModeLabel">付款幣別</span>
        <label class="payModeRadio"><input type="radio" name="epaymode" value="foreign" onchange="updatePayMode()" ${defMode!=='TWD'?'checked':''}> 外幣</label>
        <label class="payModeRadio"><input type="radio" name="epaymode" value="TWD" onchange="updatePayMode()" ${defMode==='TWD'?'checked':''}> 台幣</label>
      </div>
      <div id="foreignWrap" ${defMode==='TWD'?'hidden':''}>
        <div class="two compactMobile" style="margin-bottom:8px">
          <div><label>${esc(data.trip.currency)} 金額</label>
            <input id="eforeign" type="number" value="${e?.foreign||''}" oninput="syncExpenseMoney('f')"></div>
          <div><label>匯率</label>
            <input id="eexprate" type="number" step="0.001" value="${defRate}" oninput="syncExpenseRate()"></div>
        </div>
      </div>
      <div><label>TWD</label>
        <input id="etwd" type="number" value="${e?.twd||''}" oninput="syncExpenseMoney('t')"></div>
      <div class="three compactMobile">
        <div><label>付款方式（選填）</label>
          <select id="epm">${optsPayMethod(e?.payMethod||'未定')}</select></div>
        <div><label>付款人（選填）</label>
          <select id="epayer">${optsPayer(e?.payer||'未定')}</select></div>
        <div><label>備註（選填）</label>
          <input id="ememo" value="${esc(e?.memo||'')}"></div>
      </div>
      <div class="btns">
        <button class="btn dark" onclick="saveExpense()">${isEdit ? '儲存修改' : '新增費用'}</button>
        <button class="btn soft" onclick="closeAddSheet()">取消</button>
      </div>`;
  }
  if (v === 'packing') {
    return `
      <div class="two">
        <div><label>新增項目</label><input id="pkn"></div>
        <div><label>備註</label><input id="pkm"></div>
      </div>
      <div class="btns">
        <button class="btn dark" onclick="addPackItem()">新增到此清單</button>
        <button class="btn soft" onclick="closeAddSheet()">取消</button>
      </div>`;
  }
  return '';
}

function showImportBanner(tripName) {
  const existing = $('importBanner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id        = 'importBanner';
  banner.className = 'importBanner';
  banner.innerHTML = `↑ 已從備份匯入：<b>${esc(tripName)}</b><button class="importBannerClose" onclick="this.parentElement.remove()">✕</button>`;
  const header = $('header');
  if (header) header.insertAdjacentElement('afterend', banner);
  else document.body.prepend(banner);
  setTimeout(() => banner?.remove(), 7000);
}

function renderSetupStrip() {
  const el = $('setupStrip');
  if (!el) return;
  const inSetup = view === 'trip' || view === 'stay';
  const dest = data.trip?.dest;
  if (inSetup || !dest) { el.innerHTML = ''; el.style.display = 'none'; return; }
  const start = data.trip.start ? short(data.trip.start) : '';
  const end   = data.trip.end   ? short(data.trip.end)   : '';
  const dateStr = start ? `${start}–${end}` : '';
  const hasFlights = (data.flights?.out?.segments?.length > 0) || (data.flights?.back?.segments?.length > 0);
  const hotelCount = data.hotels?.length || 0;
  const cs = tripCountdownState();
  let countdownChip = '';
  if (cs) {
    if (cs.state === 'pre') {
      countdownChip = `<button class="stripChip countdown-pre" onclick="go('planner')">📅 還有 ${cs.days} 天出發</button>`;
    } else if (cs.state === 'during') {
      countdownChip = `<button class="stripChip countdown-during" onclick="goToTodayPlan()">🗺️ Day ${cs.dayNum} 旅行中</button>`;
    } else {
      const ago = cs.daysAgo === 1 ? '昨天結束' : `${cs.daysAgo} 天前`;
      countdownChip = `<button class="stripChip countdown-post" onclick="go('photoBook')">💭 旅遊回憶 · ${ago}</button>`;
    }
  }
  el.style.display = '';
  el.innerHTML = `
    ${countdownChip}
    <button class="stripChip" onclick="go('trip')">📍 ${esc(dest)}${dateStr ? ' ' + dateStr : ''}</button>
    <button class="stripChip ${hasFlights ? 'done' : 'pending'}" onclick="go('stay')">✈️ ${hasFlights ? '航班已設定' : '航班未設定'}</button>
    <button class="stripChip ${hotelCount ? 'done' : 'pending'}" onclick="go('stay')">🏨 ${hotelCount ? hotelCount + ' 間住宿' : '住宿未設定'}</button>`;
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
  daysEl.innerHTML = data.days.map((d, i) => {
    const hotel = hotelFor(d.key);
    const count = sortedPlans(d.key).length;
    const color = DAY_PALETTE[i % DAY_PALETTE.length];
    return `
      <div class="day ${d.key === currentDay ? 'active' : ''}"
           style="--day-color:${color}"
           onclick="currentDay='${d.key}';cur='${d.key}';go('planner',{keepDay:true})">
        <b>${d.title}</b>
        <span class="dayDate">${shortWithDay(d.key)}</span>
        <span class="dayMeta"><span class="dayCnt">${count}</span> 項${hotel ? `｜${esc(hotel.name)}` : ''}</span>
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
      <div class="hint" style="margin-bottom:14px">先設定旅遊地、日期、幣別與旅伴。完成後才會開啟航班住宿、行程、口袋景點、費用、清單與旅遊書。</div>
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
        ? `<button class="btn soft compact" ${disAttr} onclick="removeFlightBudget()">移除機票費用</button>`
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
  if (!currentDay) currentDay = cur = todayPlanKey() || data.days?.[0]?.key || '';
  normalizePlanTimes(currentDay);
  const plans = sortedPlans(currentDay);
  const _dayIdx   = data.days.findIndex(d => d.key === currentDay);
  const _dayColor = DAY_PALETTE[_dayIdx >= 0 ? _dayIdx % DAY_PALETTE.length : 0];

  el.innerHTML = `
    <div class="section plannerDaySection" style="--day-color:${_dayColor}">
      <div>
        <h2>${dayTitle(currentDay)} <span class="plannerDayCnt">${plans.length} 項</span></h2>
        <div class="hint">住宿：${hotelFor(currentDay)?.name || '未設定'}</div>
      </div>
      <button class="btn soft compact" onclick="openDayMap()" title="在 Google Maps 查看今日行程路線">🗺 地圖</button>
    </div>

    <details class="card${editingPlanId || v16PendingSpotId ? '' : ' addInlineForm'}" ${editingPlanId || v16PendingSpotId ? 'open' : ''}>
      <summary>${editingPlanId ? '編輯行程' : '＋ 新增行程'}</summary>
      <div class="detailBody">
        <div class="three compactMobile">
          <div class="full"><label>日期</label>
            <select id="pday">${optsDays(currentDay)}</select></div>
          <div><label>開始</label>${timeSelHtml('ps', '10:00', 'planStartChange()')}</div>
          <div><label>時長</label>
            <select id="pdur" onchange="planDurationChange()">
              <option value="">—</option>
              ${[30,60,90,120,150,180,210,240,270,300].map(m => {
                const h = Math.floor(m/60), r = m%60;
                const label = h && r ? `${h} 小時 ${r} 分` : h ? `${h} 小時` : `${r} 分`;
                return `<option value="${m}">${label}</option>`;
              }).join('')}
            </select></div>
          <div><label>結束 <span id="pdurDisplay" class="pdurDisplay"></span></label>
            ${timeSelHtml('pe', '11:30', 'planEndChange()')}</div>
        </div>
        <div class="two">
          <div><label>分類</label><select id="ptype">${optsPlanTypes()}</select></div>
          <div></div>
        </div>
        <div id="lockedTimeHint" class="lockedFieldHint" style="display:none">
          飛行時間由航班設定決定，請從「航班」頁調整。
        </div>
        <label>名稱</label>
        <input id="pname">
        <div id="lockedNameHint" class="lockedFieldHint" style="display:none">
          此行程由航班／住宿帶入，名稱不可編輯。
        </div>
        <label>地址</label>
        <input id="paddress">
        ${data.trip.country === '韓國' ? `
        <div class="two">
          <div><label>韓文名稱（選填）</label><input id="pkrName" placeholder="예: 감천문화마을"></div>
          <div><label>韓文地址（選填）</label><input id="pkrAddr" placeholder="예: 부산광역시 사하구 감내2로 203"></div>
        </div>` : ''}
        <label>說明</label><textarea id="pnote"></textarea>
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
  initPlannerSortable();
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

    <details class="card${e ? '' : ' addInlineForm'}" ${e ? 'open' : ''}>
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
        <label>說明</label><textarea id="sm">${esc(e?.note || e?.memo || '')}</textarea>
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
          <div><label>預設開始</label>${timeSelHtml('sStart', e?.start||'10:00')}</div>
          <div><label>預設結束</label>${timeSelHtml('sEnd', e?.end||'11:30')}</div>
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
      <div class="spotFilterRow2">
        <select class="spotDaySelect" onchange="spotFilterDay=this.value;renderSpots()">
          <option value="">全部日期</option>
          <option value="none" ${spotFilterDay==='none'?'selected':''}>未排入行程</option>
          ${data.days.map(d =>
            `<option value="${d.key}" ${spotFilterDay===d.key?'selected':''}>${d.title}（${d.label}）</option>`
          ).join('')}
        </select>
        <select class="spotSortSelect" onchange="spotSortMode=this.value;renderSpots()">
          <option value="default" ${spotSortMode==='default'?'selected':''}>加入順序</option>
          <option value="stars"   ${spotSortMode==='stars'  ?'selected':''}>最愛優先 ❤️</option>
          <option value="day"     ${spotSortMode==='day'    ?'selected':''}>依日期</option>
        </select>
        <button class="btn soft compact" onclick="openSpotsMap()" title="在 Google Maps 查看景點位置">🗺 地圖</button>
      </div>
    </div>

    ${(() => {
      // 篩選
      let filtered = data.spots.filter(s => {
        if (spotFilterType && s.type !== spotFilterType) return false;
        if (spotFilterDay === 'none') {
          const plan = s.planId ? data.plans.find(p => p.id === s.planId) : null;
          if (plan) return false;
        }
        if (spotFilterDay && spotFilterDay !== 'none') {
          const plan = s.planId ? data.plans.find(p => p.id === s.planId) : null;
          const effectiveDay = plan?.day || s.day || '';
          if (effectiveDay !== spotFilterDay) return false;
        }
        return true;
      });

      // 排序
      if (spotSortMode === 'stars') {
        filtered = [...filtered].sort((a, b) => (b.stars || 0) - (a.stars || 0));
      } else if (spotSortMode === 'day') {
        filtered = [...filtered].sort((a, b) => {
          const pa = a.planId ? data.plans.find(p => p.id === a.planId) : null;
          const pb = b.planId ? data.plans.find(p => p.id === b.planId) : null;
          const da = pa?.day || a.day || 'zzzz';
          const db = pb?.day || b.day || 'zzzz';
          return da.localeCompare(db);
        });
      }

      const starsHtml = (s) => {
        const n = s.stars || 0;
        return `<div class="spotStars">
          ${[1,2,3].map(i =>
            `<button class="spotStar ${i<=n?'on':''}" data-sid="${s.id}" data-idx="${i}" onclick="setSpotStars('${s.id}',${i})">${i<=n?'❤':'♡'}</button>`
          ).join('')}
        </div>`;
      };

      const spotCardHtml = s => {
        const hasP = spotPlanExists(s);
        const slug = spotTypeSlug(s.type);
        const linkedPlan = hasP ? data.plans.find(p => p.id === s.planId) : null;
        return `
          <div class="card spotCard${hasP ? ' spotScheduled' : ''}">
            ${s.photo ? `
              <div class="spotCardThumb">
                <img src="${s.photo}" alt="${esc(s.name)}">
                ${shareViewMode ? '' : `<button class="spotThumbRemove" onclick="removeSpotPhoto('${s.id}')" title="移除圖">×</button>`}
              </div>` : ''}
            <div class="spotCardInner">
              <div class="spotCardTitleRow">
                <div class="place">${activityIcon(s.type)} ${esc(s.name)}</div>
                ${shareViewMode ? '' : starsHtml(s)}
              </div>
              <div class="tags">
                <span class="spotTypePill spotType-${slug}">${activityIcon(s.type)} ${esc(s.type)}</span>
                ${hasP
                  ? `<span class="tag spotScheduledTag">✅ ${linkedPlan ? dayTitle(linkedPlan.day) + (linkedPlan.start ? ' · ' + esc(linkedPlan.start) : '') : '已排入'}</span>`
                  : '<span class="tag muted">未排</span>'}
                ${s.addr ? `<span class="tag blue">${esc(s.addr)}</span>` : ''}
                ${s.source==='AI匯入' ? '<span class="tag green">AI</span>' : ''}
              </div>
              ${s.memo ? `<div class="box pink">${esc(s.memo)}</div>` : ''}
              <div class="btns">
                ${shareViewMode ? '' : (hasP
                  ? `<button class="btn soft compact" onclick="returnSpotToPocket('${s.id}')">放回口袋</button>`
                  : `<button class="btn soft compact" onclick="useSpot('${s.id}')">排入行程</button>`)}
                <button class="btn blue compact" onclick="openExploreModal('${s.id}')">探索</button>
                <button class="btn soft compact" onclick="openMap('${jsStr(encodeURIComponent(s.name+' '+(s.addr||data.trip.dest)))}')">地圖</button>
                ${isKorea ? `<button class="btn soft compact" onclick="naverMapSpot('${s.id}')">NAVER</button>` : ''}
                ${isKorea && s.krName ? `<button class="btn soft compact" onclick="copyKoreanText('${s.id}')">韓文</button>` : ''}
                ${shareViewMode ? '' : `<label class="btn soft compact" title="上傳縮圖" style="cursor:pointer">
                  ${s.photo ? '🔄' : '📷'}
                  <input type="file" accept="image/*" onchange="uploadSpotPhoto('${s.id}',this.files[0])" style="display:none">
                </label>`}
                ${shareViewMode ? '' : `<button class="small" onclick="editSpot('${s.id}')">編輯</button>
                <button class="small" onclick="deleteSpot('${s.id}')">刪除</button>`}
              </div>
            </div>
          </div>`;
      };

      const scheduled   = filtered.filter(s =>  spotPlanExists(s));
      const unscheduled = filtered.filter(s => !spotPlanExists(s));

      return `
        ${scheduled.length ? `
          <details class="scheduledSpotsWrap">
            <summary class="scheduledSpotsHead">
              ✅ 已排入行程
              <span class="scheduledSpotsCnt">${scheduled.length}</span>
            </summary>
            <div class="grid2 scheduledSpotsGrid">
              ${scheduled.map(spotCardHtml).join('')}
            </div>
          </details>` : ''}
        <div class="grid2">
          ${unscheduled.map(spotCardHtml).join('') || '<div class="empty">沒有符合條件的景點</div>'}
        </div>`;
    })()}`;
}

function renderBudget() {
  const el    = $('budgetView');
  if (!el) return;
  const items = allBudgetItems();

  el.innerHTML = `
    <div class="section">
      <div><h2>💰 費用總覽</h2>
        <div class="hint">新增行程時會自動建立一筆花費，可在這裡補金額。</div>
      </div>
    </div>
    ${budgetSummaryHtml(items)}
    <details class="card shareEditOnly aiSection">
      <summary class="addFormSummary">🤖 AI 輔助</summary>
      <div class="detailBody">
        <div class="hint" style="margin-bottom:10px">檢查可能漏掉的費用項目，匯入後金額預設 0 讓你自行調整。</div>
        <div class="btns">
          <button class="btn dark compact" onclick="showBudgetPrompt()">AI 費用</button>
          <button class="btn blue compact" onclick="openImportModal()">AI 匯入</button>
        </div>
      </div>
    </details>
    ${budgetFilterBarHtml(items)}
    ${budgetListHtml(items)}`;
}

function renderPacking() {
  const el      = $('packingView');
  if (!el) return;
  const current = data.packView || 'pre';
  const lists   = data.packLists || [{ id: 'todo', name: '行前待辦' }, { id: 'carry', name: '手提行李' }, { id: 'check', name: '托運行李' }, { id: 'out', name: '離開飯店檢查' }];
  const list    = data.packing.filter(x => x.type === current);
  const builtIn = new Set(['todo', 'carry', 'check', 'out']);

  el.innerHTML = `
    <div class="section"><div><h2>📋 清單</h2></div></div>
    <div class="card">
      <label>清單情境</label>
      <div class="packListRow">
        <select id="packView" onchange="data.packView=this.value;renderPacking()">
          ${lists.map(l => `<option value="${l.id}" ${l.id===current?'selected':''}>${esc(l.name)}</option>`).join('')}
        </select>
        <button class="iconBtn smallIcon" title="管理清單" onclick="togglePackListEditor()">✎</button>
      </div>
      <div id="packListEditor" hidden>
        <div class="packListEditorItems">
          ${lists.map(l => `
            <div class="packListEditRow">
              <input class="packListNameInput" value="${esc(l.name)}"
                     onchange="renamePackList('${l.id}',this.value)"
                     placeholder="清單名稱">
              ${!builtIn.has(l.id)
                ? `<button class="iconBtn smallIcon" onclick="deletePackList('${l.id}')">×</button>`
                : `<span class="packListBuiltIn">預設</span>`}
            </div>`).join('')}
        </div>
        <div class="packListAddRow">
          <input id="newPackListName" placeholder="輸入新清單名稱…">
          <button class="btn dark compact" onclick="addPackList()">＋ 新增</button>
        </div>
      </div>
    </div>
    <div class="card shareEditOnly addInlineForm">
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
          <div class="checkContent"><strong>${esc(x.name)}</strong><div class="mini">${esc(x.note)}</div></div>
          <button class="small packDeleteBtn" onclick="deletePackItem('${x.id}')">刪除</button>
        </div>`).join('') || '<div class="empty">此清單尚無項目</div>'}
    </div>`;
}

let _photoBookHtmlCache = '';

/* 依旅程階段決定旅遊書預設子頁：出發前（或未設日期）→ 旅程手冊；旅行中／後 → 旅日記 */
function defaultPhotoBookTab() {
  const cs = tripCountdownState();
  return (!cs || cs.state === 'pre') ? 'handbook' : 'diary';
}

/* 使用者手動切換旅遊書子頁（之後就不再自動套預設） */
function setPhotoBookTab(tab) {
  photoBookTab = tab;
  _photoBookTabTouched = true;
  renderPhotoBook();
}

function renderPhotoBook() {
  const el = $('photoBookView');
  if (!el) return;

  const newHtml = `
    <div class="section noPrint">
      <div><h2>📖 旅遊書</h2></div>
    </div>
    <div class="bookSubTabs noPrint">
      <button class="bookSubTab ${photoBookTab === 'handbook' ? 'active' : ''}"
              onclick="setPhotoBookTab('handbook')">旅程手冊</button>
      <button class="bookSubTab ${photoBookTab === 'diary' ? 'active' : ''}"
              onclick="setPhotoBookTab('diary')">旅日記</button>
    </div>
    ${photoBookTab === 'handbook' ? handbookHtml() : _diaryHtml()}`;
  if (newHtml === _photoBookHtmlCache) return;
  _photoBookHtmlCache = newHtml;
  el.innerHTML = newHtml;
}

function _diaryHtml() {
  const ds = data.diaryShare || {};
  const font = ['noto','serif','wenkai','cubic','klee','maru'].includes(ds.font) ? ds.font : 'noto';
  const fontLabel = { noto: '黑體 Aa', serif: '明體 Aa', wenkai: '楷書 Aa', cubic: '像素 Aa', klee: '手寫 Aa', maru: '圓體 Aa' };
  return `
    <div class="diaryActionBar noPrint">
      <div class="diaryFontRow">
        ${['noto','serif','wenkai','cubic','klee','maru'].map(f => `
          <button class="diaryFontBtn diaryFontBtn-${f} ${font===f?'active':''}"
                  onclick="setDiaryFont('${f}')">${fontLabel[f]}</button>`).join('')}
      </div>
      <div class="diaryPublishRow">
        ${ds.published
          ? `<button class="btn dark compact" onclick="publishDiary()">🔄 更新遊記</button>
             <button class="btn soft compact" onclick="copyDiaryLink()">📋 複製連結</button>
             <button class="btn danger compact" onclick="unpublishDiary()">取消發布</button>`
          : `<button class="btn dark compact" onclick="publishDiary()">🌐 發布遊記</button>`}
        <button class="btn soft compact" onclick="exportDiaryPDF()">📄 匯出 PDF</button>
      </div>
    </div>
    <div class="diaryWrap diaryFont-${font}">
      ${diaryCoverHtml()}
      ${data.days.map(d => diaryDayHtml(d)).join('')}
    </div>`;
}

function renderHelp() {
  const el = $('helpView');
  if (!el) return;
  el.innerHTML = `
    <div class="section"><div><h2>使用說明</h2></div></div>

    <div class="card"><h3>🗺 行程</h3>
      <p class="helpText">安排每天的行程節點（景點、餐廳、咖啡廳、交通、住宿等）。可設定時間、拖曳排序，點節點可編輯或刪除。按「AI 健檢」能檢查行程鬆緊、動線是否順，再用「AI 匯入」把回覆貼回來。</p>
    </div>

    <div class="card"><h3>📍 口袋景點</h3>
      <p class="helpText">先把想去的地方收集起來，之後再分配到各天行程。可手動新增，或用「AI 找景點」依你的偏好產生口袋名單再匯入。</p>
    </div>

    <div class="card"><h3>💰 費用</h3>
      <p class="helpText">記錄每筆花費，支援外幣／台幣與即時匯率換算，可指定付款人、分類與日期，並依分類或日期篩選、查看總計。</p>
    </div>

    <div class="card"><h3>🧳 清單</h3>
      <p class="helpText">行前待辦、手提行李、托運行李、離開飯店檢查四份清單可勾選。用「AI 行李」依天氣與天數產生建議清單。</p>
    </div>

    <div class="card"><h3>📖 旅遊書</h3>
      <p class="helpText">分成「旅程手冊」與「旅日記」兩部分。手冊整理行程總覽可匯出 PDF 或分享到 LINE；旅日記能上傳照片、寫每日心情、選擇版型，每天最多 25 張照片，也能發布成分享連結或匯出 PDF。</p>
    </div>

    <div class="card"><h3>✈️ 旅遊地・航班住宿</h3>
      <p class="helpText">「旅遊地」設定國家、城市與日期；「航班住宿」登記去回程航班與住宿，存好後可一鍵帶入首尾行程與費用。</p>
    </div>

    <div class="card"><h3>👤 帳號與資料（右上角頭像）</h3>
      <p class="helpText">點右上角頭像可：Google 登入、雲端同步（跨裝置）、外觀設定、<b>匯出／匯入備份</b>，以及<b>清除全部資料</b>。登入後資料會自動雲端同步。</p>
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

/* ── 旅程排序 ── */
function _sortTripList(trips) {
  const today = formatLocalDate(new Date());
  const rank = t => {
    if (!t.start) return 3;
    if (today >= t.start && today <= (t.end || t.start)) return 1;
    if (t.start > today) return 2;
    return 4;
  };
  return [...trips].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 2) return (a.start || '').localeCompare(b.start || '');
    if (ra === 4) return (b.end || '').localeCompare(a.end || '');
    return 0;
  });
}

/* ── 新增旅程 Bottom Sheet ── */
function openNewTripSheet() {
  let overlay = $('newTripSheetOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'newTripSheetOverlay';
    overlay.className = 'addSheetOverlay';
    overlay.addEventListener('click', e => { if (e.target === overlay) closeNewTripSheet(); });
    overlay.innerHTML = `
      <div class="addSheet" id="newTripSheet">
        <div class="addSheetHandle"></div>
        <div class="addSheetHeader">
          <span class="addSheetTitle">新增旅程</span>
          <button class="addSheetClose" onclick="closeNewTripSheet()">✕</button>
        </div>
        <div class="addSheetBody" style="padding:0 20px 40px">
          <div class="tripCreateGrid" style="margin-top:16px">
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
            <div><label>出發日</label><input id="newTripStart" type="date"></div>
            <div><label>回程日</label><input id="newTripEnd"   type="date"></div>
            <div style="align-self:end;margin-top:4px">
              <button class="tripBtnPrimary" style="width:100%;height:46px" onclick="createTrip()">建立旅程</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.querySelector('#newTripSheet')?.classList.add('open'));
}

function closeNewTripSheet() {
  const overlay = $('newTripSheetOverlay');
  if (!overlay) return;
  const sheet = overlay.querySelector('#newTripSheet');
  if (sheet) sheet.classList.remove('open');
  setTimeout(() => { if (overlay) overlay.hidden = true; }, 320);
}

/* ── 更多選單 ── */
let _openTripMenuId = null;

function openTripMenu(id, btn) {
  const menuId = `tripMenu_${id}`;
  const menu = document.getElementById(menuId);
  if (!menu) return;
  if (!menu.hidden) { closeTripMenu(); return; }
  closeTripMenu();
  menu.hidden = false;
  _openTripMenuId = id;
}

function closeTripMenu() {
  if (!_openTripMenuId) return;
  const menu = document.getElementById(`tripMenu_${_openTripMenuId}`);
  if (menu) menu.hidden = true;
  _openTripMenuId = null;
}

document.addEventListener('click', e => {
  if (_openTripMenuId && !e.target.closest?.('.tripMoreMenu') && !e.target.closest?.('.tripMoreBtn')) {
    closeTripMenu();
  }
});

/* ── 旅程清單渲染 ── */
function renderTripList() {
  const el = $('tripListView');
  if (!el) return;
  const today    = formatLocalDate(new Date());
  const allActive = tripList.filter(t => !t.archived);
  const archived  = tripList.filter(t =>  t.archived);
  const sorted    = _sortTripList(allActive);

  const upcoming = sorted.filter(t => !t.start || today <= (t.end || t.start));
  const past     = sorted.filter(t =>  t.start &&  (t.end || t.start) < today);

  const nextTrip = sorted.find(t => t.start && today <= (t.end || t.start));
  let heroBadge = '';
  if (nextTrip) {
    if (today >= nextTrip.start) {
      heroBadge = `<div class="tripHeroBadge tripHeroBadge-active">🗺️ 旅行中・${esc(nextTrip.dest || nextTrip.title || '')}</div>`;
    } else {
      heroBadge = `<div class="tripHeroBadge tripHeroBadge-upcoming">🗓 還有 ${daysBetween(today, nextTrip.start)} 天出發・${esc(nextTrip.dest || nextTrip.title || '')}</div>`;
    }
  }

  el.innerHTML = `
    <div class="gateShell">
      <div class="tripHeroCard">
        ${_brandHtml()}
        <h1 class="tripHeroTitle">我的旅程</h1>
        ${heroBadge}
        <p class="tripHeroCount">共 ${allActive.length} 趟旅程</p>
        <div class="tripHeroActions">
          <button class="tripBtnPrimary" onclick="openNewTripSheet()">＋ 新增旅程</button>
          <button class="tripBtnSecondary" onclick="$('backupFileInput').click()">↑ 匯入備份</button>
        </div>
      </div>

      ${upcoming.length ? `
        <div class="tripSection">
          <h2 class="tripSectionTitle">即將出發</h2>
          <div class="tripCardList2">${upcoming.map(tripCard).join('')}</div>
        </div>` : allActive.length === 0 ? `
        <div class="tripEmptyState">
          <div class="tripEmptyIcon">🗺️</div>
          <p>還沒有旅程</p>
          <p class="tripEmptyHint">點擊「＋ 新增旅程」開始規劃</p>
        </div>` : ''}

      ${past.length ? `
        <div class="tripSection">
          <h2 class="tripSectionTitle">過去旅程</h2>
          <div class="tripCardList2">${past.map(tripCard).join('')}</div>
        </div>` : ''}

      ${archived.length ? `
        <details class="tripArchiveSection2">
          <summary>封存旅程（${archived.length}）</summary>
          <div class="tripCardList2" style="margin-top:10px">${archived.map(tripCard).join('')}</div>
        </details>` : ''}

      <div class="tripListFooter">
        <button class="btn soft" onclick="firebaseSignOut()">登出</button>
      </div>
    </div>`;
}

function _tripDestDisplay(t) {
  if (!t.dest) return '';
  if (t.country && t.dest !== t.country && t.dest.startsWith(t.country)) {
    const city = t.dest.slice(t.country.length);
    return city ? `${t.country}・${city}` : t.country;
  }
  return t.dest;
}

function tripCard(t) {
  const today  = formatLocalDate(new Date());
  const status = !t.start ? 'draft'
    : today >= t.start && today <= (t.end || t.start) ? 'active'
    : t.start > today ? 'upcoming'
    : 'past';
  const statusLabel = {
    upcoming: `還有 ${daysBetween(today, t.start)} 天`,
    active:   '進行中',
    past:     '已結束',
    draft:    '草稿'
  }[status];
  const duration = t.start && t.end ? daysBetween(t.start, t.end) + 1 : null;
  const dateStr  = t.start
    ? `${short(t.start)} – ${short(t.end || t.start)}${duration ? ` · ${duration} 天` : ''}`
    : '日期未設定';
  const btnLabel   = status === 'past' ? '查看旅程' : '繼續規劃';
  const destDisplay = _tripDestDisplay(t);
  // 旅程名稱為主標題；若沒有名稱則以目的地 fallback
  const hasCustomTitle = t.title && t.title !== t.dest && t.title !== '未命名旅程';
  const mainTitle  = hasCustomTitle ? t.title : (t.dest || '未命名旅程');
  const showDest   = hasCustomTitle && destDisplay;

  return `
    <div class="tripCard2 tripStatus2-${status}${t.archived ? ' archived' : ''}">
      <div class="tripCard2Top">
        <div class="tripStatusChip2 tripStatusChip2-${status}">${statusLabel}</div>
        <div style="position:relative">
          <button class="tripMoreBtn" onclick="openTripMenu('${t.id}',this)" title="更多">⋯</button>
          <div class="tripMoreMenu" id="tripMenu_${t.id}" hidden>
            ${t.archived
              ? `<button onclick="restoreTrip('${t.id}');closeTripMenu()">還原旅程</button>`
              : `<button onclick="archiveTrip('${t.id}');closeTripMenu()">封存旅程</button>`}
            <button class="tripMenuDanger" onclick="deleteTrip('${t.id}');closeTripMenu()">刪除旅程</button>
          </div>
        </div>
      </div>
      <div class="tripCard2Title">${esc(mainTitle)}</div>
      ${showDest ? `<div class="tripCard2DestRow">${esc(destDisplay)}</div>` : ''}
      <div class="tripCard2Date">${dateStr}</div>
      ${t.updatedAtClient ? `<div class="tripCard2Updated">更新於 ${new Date(t.updatedAtClient).toLocaleDateString('zh-TW')}</div>` : ''}
      ${t.importedAt ? `<div class="tripCard2ImportedTag">📥 匯入於 ${new Date(t.importedAt).toLocaleDateString('zh-TW')}</div>` : ''}
      <div class="tripCard2Footer">
        <button class="tripCardMainBtn" onclick="startSelectTrip('${t.id}',this)">${btnLabel}</button>
      </div>
    </div>`;
}

function startSelectTrip(id, btn) {
  if (selectingTrip) return;
  btn.disabled    = true;
  btn.textContent = '開啟中…';
  selectTrip(id).catch(e => {
    btn.disabled    = false;
    btn.textContent = '繼續編輯';
    toast('開啟旅程失敗，請重試');
    console.error('selectTrip failed', e);
  });
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
  if (view === 'trip')      renderTrip();
  if (view === 'stay')      renderStay();
  if (view === 'planner')   renderPlanner();
  if (view === 'spots')     renderSpots();
  if (view === 'budget')    renderBudget();
  if (view === 'packing')   renderPacking();
  if (view === 'photoBook') renderPhotoBook();
  if (view === 'help')      renderHelp();
  applyLockBanner();
  updateFab();
}

/* ══════════════════════════════════════════
   重置
   ══════════════════════════════════════════ */

function resetAllData() {
  if (!confirm('確定清除全部資料？')) return;
  data = makeDefaultData();
  cur  = currentDay = data.days?.[0]?.key || '';
  localSaveTrip();
  render();
}
