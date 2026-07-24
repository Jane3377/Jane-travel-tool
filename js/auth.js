/* ================================================================
   auth.js — 登入、多旅程系統、裝置鎖
   ================================================================ */

/* ══════════════════════════════════════════
   登入 / 登出
   ══════════════════════════════════════════ */

function firebaseSignIn() {
  if (!fbAuth) return toast('Firebase 尚未初始化');
  fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .catch(err => alert('登入失敗：' + err.message));
}

function firebaseSignOut() {
  stopHeartbeat();
  stopLockListener();
  if (fbAuth) fbAuth.signOut();
}

/* ══════════════════════════════════════════
   Auth 狀態變更處理
   ══════════════════════════════════════════ */

async function handleAuth(user) {
  fbUser = user || null;

  // 停止舊的監聽
  if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }
  stopTripListListener();

  // 未登入
  if (!user) {
    currentTripId = '';
    cloudReady = false;
    renderLoginView();
    showShell('login');
    renderAccountWidget(null);
    setSyncStatus('off', '尚未登入', '登入 Google 後可跨裝置同步');
    return;
  }

  // 帳號未授權
  if (!isAllowed(user)) {
    currentTripId = '';
    cloudReady = false;
    renderLoginView(`${user.email} 尚未在授權名單中，請聯絡管理員。`);
    showShell('login');
    renderAccountWidget(user);
    setSyncStatus('off', '帳號未授權', user.email || '');
    return;
  }

  // 登入成功 → 載入旅程清單，並啟動即時監聽（跨裝置同步）
  setSyncStatus('warn', '登入成功', '載入旅程清單中');
  await loadTripListCloud();
  listenTripList();
  renderAccountWidget(user);

  // 嘗試恢復上次的旅程
  const savedId = localStorage.getItem(CURRENT_TRIP_KEY) || currentTripId;
  if (savedId && tripList.some(t => t.id === savedId && !t.archived)) {
    await selectTrip(savedId);
  } else {
    currentTripId = '';
    localStorage.removeItem(CURRENT_TRIP_KEY);
    cloudReady = false;
    renderTripList();
    showShell('list');
    setSyncStatus('on', '已載入旅程清單', `${tripList.filter(t => !t.archived).length} 個旅程`);
  }
}

/* ══════════════════════════════════════════
   多旅程操作
   ══════════════════════════════════════════ */

async function selectTrip(id) {
  selectingTrip = true;
  try {
    currentTripId = id;
    localStorage.setItem(CURRENT_TRIP_KEY, id);
    cloudReady = false;
    if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }

    // 讀本機 + 雲端，取較新的
    const local     = localLoadTrip(id);
    const localMeta = localGetTripMeta(id);
    let cloudDoc    = null;

    if (fbUser && fbDb) {
      try {
        const snap = await tripDocRef(id).get();
        if (snap.exists && snap.data()?.data) cloudDoc = snap.data();
      } catch (e) {
        console.warn('selectTrip cloud fetch failed', e);
        setSyncStatus('off', '雲端讀取失敗', e.message);
      }
    }

    suppressCloudSave = true;
    const cloudTime = Number(cloudDoc?.updatedAtClient || 0);
    const localTime = Number(localMeta?.updatedAtClient || 0);

    if (cloudDoc?.data && cloudTime >= localTime) {
      data = normalizeData(cloudDoc.data);
      lastCloudUpdatedAt = cloudTime;
      setSyncStatus('on', '已載入雲端資料', cloudDoc.tripMeta?.title || '');
    } else if (local) {
      data = normalizeData(local);
      setSyncStatus('warn', '本機資料較新', '即將補同步到雲端');
    } else if (cloudDoc?.data) {
      data = normalizeData(cloudDoc.data);
      lastCloudUpdatedAt = cloudTime;
    } else {
      data = makeDefaultData();
      setSyncStatus('off', '尚無旅程資料', '請先設定旅遊地');
    }

    cur = currentDay = data.days?.[0]?.key || data.trip?.start || '';
    _photoBookTabTouched = false;   // 換旅程後，旅遊書子頁依新旅程階段重新套預設
    localSaveTrip();
    suppressCloudSave = false;

    cloudReady = canUseCloud();
    if (cloudReady) listenCloudChanges();

    showShell('app');
    go(data.trip?.dest ? 'planner' : 'trip');

    // 如果本機比雲端新，補同步
    if (cloudReady && local && localTime > cloudTime + 1000) {
      scheduleCloudSave(2000);
    }

    selectingTrip = false;

    // 取得編輯鎖
    await acquireEditLock();
    applyLockBanner();

  } catch (e) {
    selectingTrip = false;
    throw e;
  }
}

async function createTrip() {
  const active = tripList.filter(t => !t.archived);
  if (active.length >= MAX_TRIPS) {
    toast(`每個帳號最多 ${MAX_TRIPS} 個旅程`);
    return;
  }

  const title    = $('newTripTitle')?.value.trim() || '我的新旅程';
  const country  = $('newTripCountry')?.value || '韓國';
  const citySelect = $('newTripCitySelect');
  const city = (citySelect?.value === '自訂')
    ? ($('newTripCityCustom')?.value.trim() || '')
    : (citySelect?.value || '');
  const start    = $('newTripStart')?.value || '';
  const end      = $('newTripEnd')?.value || '';
  const cardColor = $('newTripColor')?.value || 'cream';

  if (!start || !end) return toast('請選擇出發日與回程日');
  if (start > end)    return toast('回程日不可早於出發日');

  const id = `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  currentTripId = id;
  localStorage.setItem(CURRENT_TRIP_KEY, id);

  data = makeDefaultData();
  data.meta.title   = title;
  data.trip.country = country;
  data.trip.city    = city;
  data.trip.dest    = destName(country, city);
  data.trip.currency = CURRENCY_MAP[country] || 'USD';
  data.trip.rate     = RATE_MAP[data.trip.currency] || 1;
  data.trip.start   = start;
  data.trip.end     = end;
  data.days         = mkDays(start, end);

  cur = currentDay = data.days[0]?.key || start;

  tripList.unshift({ ...currentTripMeta(), cardColor });
  localSaveTrip();
  cloudReady = canUseCloud();

  try {
    await saveTripListCloud();
    if (cloudReady) await saveToCloudNow();
  } catch (e) {
    setSyncStatus('off', '建立雲端旅程失敗', e.message);
  }

  if (cloudReady) listenCloudChanges();
  showShell('app');
  go('trip');
  toast('已建立旅程');
  await acquireEditLock({ takeover: true });
  applyLockBanner();
}

async function archiveTrip(id) {
  if (!confirm('確定封存這趟旅程？可在封存清單中還原。')) return;
  const t = tripList.find(x => x.id === id);
  if (t) t.archived = true;
  if (currentTripId === id) {
    currentTripId = '';
    localStorage.removeItem(CURRENT_TRIP_KEY);
  }
  await saveTripListCloud();
  renderTripList();
}

async function restoreTrip(id) {
  const t = tripList.find(x => x.id === id);
  if (t) t.archived = false;
  await saveTripListCloud();
  renderTripList();
}

async function deleteTrip(id) {
  const t = tripList.find(x => x.id === id);
  if (!t) return;
  if (!confirm(`確定刪除「${t.title || '這趟旅程'}」？此動作不可復原。`)) return;

  // 刪雲端
  if (fbUser && fbDb) {
    try {
      await fbDb.collection('users').doc(fbUser.uid)
        .collection('trips').doc(id).delete();
    } catch (e) { console.warn('delete trip cloud failed', e); }
  }

  tripList = tripList.filter(x => x.id !== id);
  try { localStorage.removeItem(tripDataKey(id)); } catch (e) {}

  if (currentTripId === id) {
    currentTripId = '';
    localStorage.removeItem(CURRENT_TRIP_KEY);
  }

  await saveTripListCloud();
  renderTripList();
  toast('已刪除旅程');
}

function backToTripList() {
  stopHeartbeat();
  stopLockListener();
  setReadOnly(false, null);
  updateTripMeta(true);
  currentTripId = '';
  localStorage.removeItem(CURRENT_TRIP_KEY);
  renderTripList();
  showShell('list');
}

/* ══════════════════════════════════════════
   裝置鎖
   ══════════════════════════════════════════ */

function deviceName() {
  const ua = navigator.userAgent || '';
  if (/iPad/i.test(ua))    return 'iPad';
  if (/iPhone/i.test(ua))  return 'iPhone';
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'Android 手機' : 'Android 平板';
  if (/Mac/i.test(ua))     return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  return '此裝置';
}

function lockPayload() {
  return {
    deviceId,
    deviceName:      deviceName(),
    uid:             fbUser?.uid    || '',
    email:           fbUser?.email  || '',
    tripId:          currentTripId  || '',
    updatedAtClient: Date.now()
  };
}

function isOtherActiveLock(lock) {
  if (!lock?.deviceId || lock.deviceId === deviceId) return false;
  return (Date.now() - Number(lock.updatedAtClient || 0)) < LOCK_TTL;
}

function lockOwnerText(lock = deviceLockOwner) {
  if (!lock) return '其他裝置';
  const time = lock.updatedAtClient
    ? new Date(lock.updatedAtClient).toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' })
    : '';
  return `${lock.deviceName || '其他裝置'}${time ? '（' + time + '）' : ''}`;
}

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

function startHeartbeat() {
  stopHeartbeat();
  if (deviceReadOnly || !fbUser || !currentTripId || !fbDb) return;
  heartbeatTimer = setInterval(async () => {
    try {
      if (!deviceReadOnly && fbUser && currentTripId && fbDb) {
        await tripDocRef().set(
          { editingLock: lockPayload(), lockUpdatedAtClient: Date.now() },
          { merge: true }
        );
      }
    } catch (e) { console.warn('heartbeat failed', e); }
  }, HEARTBEAT_MS);
}

function stopLockListener() {
  if (lockUnsub) { try { lockUnsub(); } catch (e) {} lockUnsub = null; }
}

function startLockListener() {
  stopLockListener();
  if (!fbUser || !fbDb || !currentTripId) return;
  const watchId = currentTripId;
  try {
    lockUnsub = tripDocRef().onSnapshot(snap => {
      if (watchId !== currentTripId || !snap.exists) return;
      const lock = snap.data()?.editingLock || null;
      if (isOtherActiveLock(lock)) {
        if (!deviceReadOnly || deviceLockOwner?.deviceId !== lock.deviceId) {
          setReadOnly(true, lock);
          toast(`已切換檢視模式：${lockOwnerText(lock)} 正在編輯`);
        }
      } else if (lock?.deviceId === deviceId && deviceReadOnly) {
        setReadOnly(false, null);
        startHeartbeat();
      }
    }, err => console.warn('lock listener failed', err));
  } catch (e) { console.warn(e); }
}

function setReadOnly(on, lock = null) {
  deviceReadOnly  = !!on;
  deviceLockOwner = lock || null;
  document.body.classList.toggle('readonly', deviceReadOnly);
  if (deviceReadOnly) {
    stopHeartbeat();
    setSyncStatus('warn', '檢視模式', `由 ${lockOwnerText(lock)} 編輯中`);
  }
  applyLockBanner();
  updateSyncLine();
}

async function acquireEditLock(options = {}) {
  if (!fbUser || !fbDb || !currentTripId) {
    setReadOnly(false, null);
    return true;
  }
  try {
    const snap = await tripDocRef().get();
    const lock = snap.exists ? (snap.data()?.editingLock || null) : null;
    if (isOtherActiveLock(lock) && !options.takeover) {
      setReadOnly(true, lock);
      startLockListener();
      return false;
    }
    await tripDocRef().set(
      { editingLock: lockPayload(), lockUpdatedAtClient: Date.now() },
      { merge: true }
    );
    setReadOnly(false, null);
    startHeartbeat();
    startLockListener();
    return true;
  } catch (e) {
    console.warn('acquireEditLock failed', e);
    setReadOnly(true, { deviceName: '雲端鎖定狀態未知', updatedAtClient: Date.now() });
    return false;
  }
}

async function ensureCanWrite() {
  if (!fbUser || !currentTripId) return false;
  if (deviceReadOnly) return false;
  try {
    const snap = await tripDocRef().get();
    const lock = snap.exists ? (snap.data()?.editingLock || null) : null;
    if (isOtherActiveLock(lock)) {
      setReadOnly(true, lock);
      return false;
    }
    if (!lock || lock.deviceId !== deviceId ||
        (Date.now() - Number(lock.updatedAtClient || 0)) > LOCK_TTL) {
      return await acquireEditLock();
    }
    return true;
  } catch (e) {
    console.warn('ensureCanWrite failed', e);
    return false;
  }
}

async function takeOverEdit() {
  if (!fbUser || !currentTripId) return toast('請先登入並選擇旅程');
  if (!confirm('要改由此裝置接手編輯嗎？系統會先載入最新資料再取得編輯權。')) return;
  try {
    await loadFromCloud({ force: true, silent: true });
    await acquireEditLock({ takeover: true });
    render();
    toast('已接手編輯，並載入最新雲端資料');
  } catch (e) {
    setReadOnly(true, deviceLockOwner);
    alert('接手編輯失敗：' + (e?.message || e));
  }
}

/* ══════════════════════════════════════════
   Firebase 初始化 + 啟動
   ══════════════════════════════════════════ */

async function bootFirebase() {
  if (!window.firebase) {
    setSyncStatus('off', 'Firebase SDK 尚未載入', '請確認網路連線');
    return;
  }
  if (!firebase.apps.length) fbApp = firebase.initializeApp(FIREBASE_CONFIG);
  else fbApp = firebase.app();

  fbAuth = firebase.auth();
  fbDb   = firebase.firestore();
  fbDb.enablePersistence({ synchronizeTabs: true }).catch(err => {
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
      console.warn('Firestore persistence error:', err);
    }
  });

  // 檢查是否為分享連結（?share=TOKEN）
  const urlToken = new URLSearchParams(window.location.search).get('share');
  if (urlToken) {
    await loadSharedTrip(urlToken);
    return;
  }

  const diaryToken = new URLSearchParams(window.location.search).get('diary');
  if (diaryToken) {
    await loadSharedDiary(diaryToken);
    return;
  }

  // 載入白名單後再掛 auth 監聽
  await loadWhitelist();
  fbAuth.onAuthStateChanged(handleAuth);
}

/* ══════════════════════════════════════════
   分享唯讀模式（獨立行程頁）
   ══════════════════════════════════════════ */

async function loadSharedTrip(token) {
  shareViewMode  = true;
  shareViewToken = token;
  shareSection   = null;   // 一律從首頁開始
  sharePackList  = null;   // 清單情境回到第一個
  shareSpotFilter = '';    // 口袋景點篩選回到全部

  // 先顯示 loading
  const loginEl = $('loginView');
  if (loginEl) loginEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:80vh;flex-direction:column;gap:12px;color:#8b827a">
      ${_brandHtml()}
      <p>載入分享行程中…</p>
    </div>`;
  showShell('login');

  try {
    const snap = await fbDb.collection('publicShares').doc(token).get();
    if (!snap.exists || !snap.data()?.data) {
      _renderShareError('找不到此分享連結，可能已被停用或尚未產生資料。');
      return;
    }

    data = normalizeData(snap.data().data);
    _renderSharePage();

    // 即時監聽更新
    fbDb.collection('publicShares').doc(token).onSnapshot(snap2 => {
      if (!snap2.exists || !snap2.data()?.data) return;
      data = normalizeData(snap2.data().data);
      _renderSharePage();
    }, err => console.warn('share listener error', err));

  } catch (e) {
    _renderShareError('載入失敗：' + (e.message || e));
  }
}

/* 分享頁分區設定 */
const SHARE_SECTIONS = {
  flights: { icon:'✈️', name:'航班資訊', build: () => _buildShareFlightHtml() },
  hotels:  { icon:'🏨', name:'住宿資訊', build: () => _buildShareHotelHtml() },
  days:    { icon:'🗓', name:'每日行程', build: () => _buildShareDaysHtml() },
  spots:   { icon:'📍', name:'口袋景點', build: () => _buildShareSpotsHtml() },
  packing: { icon:'📋', name:'清單',     build: () => _buildSharePackingHtml() },
  budget:  { icon:'💰', name:'費用總覽', build: () => _buildShareBudgetHtml() }
};

function goShareSection(key) { shareSection = key; _renderSharePage(); window.scrollTo(0, 0); }
function goShareHome()       { shareSection = null; _renderSharePage(); window.scrollTo(0, 0); }

function _shareBudgetVisible() { return !!data.meta?.shareBudget; }

function _renderSharePage() {
  const el = $('loginView');
  if (!el) return;
  // 預算未開放分享時，不允許進入該分區
  if (shareSection === 'budget' && !_shareBudgetVisible()) shareSection = null;
  if (shareSection && SHARE_SECTIONS[shareSection]) _renderShareSectionPage(el);
  else { shareSection = null; _renderShareHomePage(el); }
  showShell('login');
}

const _SHARE_MODAL = `
  <div class="spDetailModal" id="spDetailModal" onclick="if(event.target===this)closeSharePlanDetail()"></div>
  <div class="spDetailModal" id="spExploreModal" onclick="if(event.target===this)closeShareSpotExplore()"></div>`;

function _shareHeroHtml() {
  const title     = data.meta?.title || '我的旅程';
  const dest      = data.trip?.dest  || '';
  const start     = data.trip?.start || '';
  const end       = data.trip?.end   || '';
  const coverImg  = data.handbook?.cover || '';
  const count     = Number(data.trip?.travelerCount || 1);
  const travelers = Array.from({ length: count }, (_, i) => data.trip?.travelers?.[i] || String.fromCharCode(65 + i));
  const totalDays = (data.days || []).length;
  const nights    = Math.max(0, totalDays - 1);
  const now       = new Date().toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' });
  return `
    <div class="spHero" ${coverImg ? `style="background-image:url('${esc(coverImg)}');background-size:cover;background-position:center"` : ''}>
      ${coverImg ? '<div class="spHeroOverlay"></div>' : ''}
      <div class="spHeroContent">
        <div class="spBrand">貞選旅管家</div>
        <h1 class="spTitle">${esc(title)}</h1>
        <div class="spMeta">${esc(dest)}${start ? `｜${short(start)} — ${short(end)}` : ''}${totalDays ? `｜${totalDays}天${nights}夜` : ''}</div>
        ${travelers.length > 0 ? `<div class="spTravelers">${travelers.map(esc).join('・')}</div>` : ''}
      </div>
      <div class="spSyncBadge">⟳ 已更新 ${now}</div>
    </div>`;
}

/* 首頁：封面 + 功能卡片（含摘要） */
function _renderShareHomePage(el) {
  const totalDays   = (data.days || []).length;
  const hotels      = data.hotels || [];
  const unscheduled = (data.spots || []).filter(s => !spotPlanExists(s));
  const packItems   = data.packing || [];

  const out  = normalizeFlightObj(data.flights?.out  || {});
  const back = normalizeFlightObj(data.flights?.back || {});
  const hasOut  = (out.segments  || []).some(s => s.no || s.from);
  const hasBack = (back.segments || []).some(s => s.no || s.from);
  const flightSum = hasOut && hasBack ? '去程・回程' : hasOut ? '僅去程' : hasBack ? '僅回程' : '尚未設定';

  const rate     = Number(data.trip?.rate || 1);
  const expenses = data.expenses || [];
  const total    = expenses.reduce((s, e) => s + (e.mode === 'TWD' ? Number(e.twd || 0) : Math.round(Number(e.foreign || 0) * rate)), 0);
  const budgetSum = expenses.length ? `TWD ${total.toLocaleString('zh-TW')}` : '尚無記錄';

  const cards = [
    { key:'flights', sum: flightSum },
    { key:'hotels',  sum: hotels.length ? `${hotels.length} 間` : '尚未設定' },
    { key:'days',    sum: totalDays ? `${totalDays} 天` : '尚未安排' },
    { key:'spots',   sum: `${unscheduled.length} 個` },
    { key:'packing', sum: packItems.length ? `${packItems.length} 項` : '尚無項目' }
  ];
  if (_shareBudgetVisible()) cards.push({ key:'budget', sum: budgetSum });

  el.innerHTML = `
    <div class="spPage">
      ${_shareHeroHtml()}
      <div class="spBody">
        <div class="spHomeGrid">
          ${cards.map(c => {
            const s = SHARE_SECTIONS[c.key];
            return `
            <button class="spCard" onclick="goShareSection('${c.key}')">
              <span class="spCardIcon">${s.icon}</span>
              <span class="spCardName">${s.name}</span>
              <span class="spCardSummary">${esc(c.sum)}</span>
              <span class="spCardArrow">›</span>
            </button>`;
          }).join('')}
        </div>
      </div>
      <div class="spFooter">貞選旅管家 Janeselect Travel Manager<br>此頁面由旅行主辦人即時同步</div>
    </div>
    ${_SHARE_MODAL}`;
}

/* 分區內頁：返回列 + 該區完整內容（全部展開） */
function _renderShareSectionPage(el) {
  const sec = SHARE_SECTIONS[shareSection];
  el.innerHTML = `
    <div class="spPage spSectionPage">
      <div class="spBackBar">
        <button class="spBackBtn" onclick="goShareHome()">‹ 返回</button>
        <span class="spSectionTitle">${sec.icon} ${sec.name}</span>
      </div>
      <div class="spBody">${sec.build()}</div>
      <div class="spFooter">貞選旅管家 Janeselect Travel Manager<br>此頁面由旅行主辦人即時同步</div>
    </div>
    ${_SHARE_MODAL}`;
}

/* 每日行程（全部展開，不收合） */
function _buildShareDaysHtml() {
  const days = data.days || [];
  if (!days.length) return `<div class="spEmpty">尚未安排行程</div>`;
  return days.map((d, idx) => {
    const plans = sortedPlans(d.key);
    const hotel = hotelFor(d.key);
    const color = ['#4A7C59','#3A6EA5','#B85C5C','#7A5EA7','#C17E3C','#2A8090','#8A6040','#5B7EA8'][idx % 8];
    return `
      <div class="spDayBlock">
        <div class="spDayBlockHead" style="--sp-color:${color}">
          <span class="spDayLabel" style="color:${color}">${esc(d.title)}</span>
          <span class="spDayDate">${shortWithDay(d.key)}</span>
          <span class="spDayCnt">${plans.length}</span>
        </div>
        <div class="spAccordionBody">
          ${hotel ? `<div class="spHotelChip">🏨 ${esc(hotel.name)}</div>` : ''}
          ${plans.length ? plans.map(p => {
            const time = p.start || '';
            const nearbyItems = (p.nearby || []).map(id => (data.spots || []).find(s => s.id === id)).filter(Boolean);
            return `
              <div class="spPlanRow spPlanRowTap" onclick="openSharePlanDetail('${p.id}')">
                <span class="spPlanTime">${esc(time)}</span>
                <div class="spPlanInfo">
                  <div class="spPlanName">${activityIcon(p.type)} ${esc(p.name || '未命名')}</div>
                  ${p.address ? `<div class="spPlanAddr">📍 ${esc(p.address)}</div>` : ''}
                  ${nearbyItems.length ? `<div class="spPlanNearby">${nearbyItems.map(s => `<span class="spNearbyTag">${activityIcon(s.type)} ${esc(s.name)}</span>`).join('')}</div>` : ''}
                </div>
                <span class="spPlanChevron">›</span>
              </div>`;
          }).join('') : `<div class="spEmpty">這天尚未安排行程</div>`}
        </div>
      </div>`;
  }).join('');
}

/* 口袋景點：分類篩選 + 依候選日期排序 + 點入探索 */
function goShareSpotFilter(t) { shareSpotFilter = t; _renderSharePage(); }

function _buildShareSpotsHtml() {
  const spots = (data.spots || []).filter(s => !spotPlanExists(s));
  if (!spots.length) return `<div class="spEmpty">尚無口袋景點</div>`;

  // 分類篩選 chips
  const types = [];
  spots.forEach(s => { const t = s.type || '其他'; if (!types.includes(t)) types.push(t); });
  let cur = shareSpotFilter;
  if (cur && !types.includes(cur)) cur = '';
  const chips = `<div class="spPackTabs">
    <button class="spPackTab ${!cur ? 'active' : ''}" onclick="goShareSpotFilter('')">全部<span class="spPackTabCnt">${spots.length}</span></button>
    ${types.map(t => `<button class="spPackTab ${cur === t ? 'active' : ''}" onclick="goShareSpotFilter('${esc(t)}')">${esc(t)}<span class="spPackTabCnt">${spots.filter(s => (s.type || '其他') === t).length}</span></button>`).join('')}
  </div>`;

  // 篩選 + 依候選日期排序（有日期者依日期遞增在前，未定者在後）
  const list = (cur ? spots.filter(s => (s.type || '其他') === cur) : spots.slice())
    .sort((a, b) => {
      const da = a.day || '', db = b.day || '';
      if (da && db) return da < db ? -1 : da > db ? 1 : 0;
      if (da) return -1;
      if (db) return 1;
      return 0;
    });

  const cards = list.map(s => `
    <div class="spSpotCard spSpotCardTap" onclick="openShareSpotExplore('${s.id}')">
      ${s.photo ? `<img class="spSpotThumb" src="${esc(s.photo)}" loading="lazy">` : ''}
      <div class="spSpotInner">
        <div class="spSpotName">${activityIcon(s.type)} ${esc(s.name)}</div>
        ${s.addr ? `<div class="spSpotAddr">📍 ${esc(s.addr)}</div>` : ''}
        ${s.memo || s.note ? `<div class="spSpotNote">${esc(s.memo || s.note)}</div>` : ''}
      </div>
      <div class="spSpotSide">
        <span class="spSpotDate">${s.day ? shortWithDay(s.day) : '未定'}</span>
        <span class="spPlanChevron">›</span>
      </div>
    </div>`).join('');

  return `${chips}<div class="spSpotsGrid">${cards}</div>`;
}

/* 口袋景點探索（唯讀分享頁）：四種外部搜尋 + 地圖 */
function openShareSpotExplore(id) {
  const s = (data.spots || []).find(x => x.id === id);
  if (!s) return;
  const kw     = encodeURIComponent([s.name, s.addr || '', data.trip?.dest || ''].filter(Boolean).join(' '));
  const isKorea = data.trip?.country === '韓國';
  const mapQ   = encodeURIComponent(s.krName || s.addr || s.name);
  const gMap   = encodeURIComponent(s.addr || s.name);
  const modal  = document.getElementById('spExploreModal');
  if (!modal) return;
  modal.innerHTML = `
    <div class="spDetailBox">
      <div class="spDetailHandle"></div>
      <div class="spDetailHead">
        <div class="spDetailIcon">${activityIcon(s.type)}</div>
        <div class="spDetailTitleWrap">
          <div class="spDetailTitle">${esc(s.name)}</div>
          ${s.addr ? `<div class="spDetailTime">📍 ${esc(s.addr)}</div>` : ''}
        </div>
        <button class="spDetailClose" onclick="closeShareSpotExplore()">✕</button>
      </div>
      <div class="spExploreGrid">
        <a class="spExploreBtn" target="_blank" rel="noopener" href="https://www.google.com/search?q=${kw}+遊記心得">📝 遊記</a>
        <a class="spExploreBtn" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${kw}">▶️ 影片</a>
        <a class="spExploreBtn" target="_blank" rel="noopener" href="https://www.google.com/search?q=${kw}+site:instagram.com+OR+site:facebook.com+OR+site:threads.net">📸 打卡</a>
        <a class="spExploreBtn" target="_blank" rel="noopener" href="https://www.google.com/search?q=${kw}+官方網站">🏢 官方</a>
        <a class="spExploreBtn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${gMap}">🗺 Google 地圖</a>
        ${isKorea ? `<a class="spExploreBtn" target="_blank" rel="noopener" href="https://map.naver.com/v5/search/${mapQ}">🇰🇷 Naver 地圖</a>` : ''}
      </div>
    </div>`;
  modal.classList.add('show');
}

function closeShareSpotExplore() {
  document.getElementById('spExploreModal')?.classList.remove('show');
}

function _buildShareFlightHtml() {
  const out  = normalizeFlightObj(data.flights?.out  || {});
  const back = normalizeFlightObj(data.flights?.back || {});
  const fmtDt = s => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  const segHtml = seg => !seg.no && !seg.from ? '' : `
    <div class="spFlightSeg">
      <span class="spFlightNo">✈️ ${esc(seg.no || '—')}</span>
      <span class="spFlightRoute">${esc(seg.from||'')}${seg.to ? ` → ${esc(seg.to)}` : ''}</span>
      ${seg.dep ? `<span class="spFlightTime">${fmtDt(seg.dep)} → ${fmtDt(seg.arr)}</span>` : ''}
    </div>`;
  const dirHtml = (f, label) => {
    const segs = (f.segments||[]).filter(s => s.no || s.from);
    if (!segs.length) return '';
    return `
      <div class="spFlightDir">
        <div class="spFlightDirLabel">${label}</div>
        ${segs.map(segHtml).join('')}
        ${f.toAirport   ? `<div class="spFlightNote">🚌 ${esc(f.toAirport)}</div>`   : ''}
        ${f.fromAirport ? `<div class="spFlightNote">🚌 ${esc(f.fromAirport)}</div>` : ''}
      </div>`;
  };
  const html = dirHtml(out, '去程') + dirHtml(back, '回程');
  return html || `<div class="spEmpty">尚未設定航班</div>`;
}

function _buildShareHotelHtml() {
  if (!data.hotels?.length) return `<div class="spEmpty">尚未新增住宿</div>`;
  return data.hotels.map(h => `
    <div class="spHotelItem">
      <div class="spHotelName">🏨 ${esc(h.name)}</div>
      ${h.start ? `<div class="spHotelDates">${short(h.start)} — ${short(h.end)}</div>` : ''}
      ${h.addr ? `<div class="spHotelAddr">📍 ${esc(h.addr)}</div>` : ''}
      ${h.note ? `<div class="spHotelNote">${esc(h.note)}</div>` : ''}
    </div>`).join('');
}

function _buildShareBudgetHtml() {
  const expenses = data.expenses || [];
  if (!expenses.length) return `<div class="spEmpty">尚無費用記錄</div>`;

  const rate   = Number(data.trip?.rate || 1);
  const curr   = data.trip?.currency || 'KRW';
  const toTwd  = item => item.mode === 'TWD' ? Number(item.twd||0) : Math.round(Number(item.foreign||0) * rate);
  const total  = expenses.reduce((s, e) => s + toTwd(e), 0);

  const byType = {};
  expenses.forEach(e => {
    const t = e.type || '其他';
    byType[t] = (byType[t] || 0) + toTwd(e);
  });

  const typeRows = Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, amt]) => `
    <div class="spBudgetRow">
      <span class="spBudgetType">${esc(type)}</span>
      <span class="spBudgetAmt">TWD ${Number(amt).toLocaleString('zh-TW')}</span>
    </div>`).join('');

  return `
    <div class="spBudgetTotal">
      <span>總計</span>
      <strong>TWD ${Number(total).toLocaleString('zh-TW')}</strong>
    </div>
    <div class="spBudgetMeta">匯率：1 ${esc(curr)} = ${rate} TWD</div>
    ${typeRows}`;
}

function goSharePackList(id) { sharePackList = id; _renderSharePage(); }

function _buildSharePackingHtml() {
  const items = data.packing || [];
  const lists = data.packLists?.length
    ? data.packLists
    : [{ id: 'todo', name: '行前待辦' }, { id: 'carry', name: '手提行李' }, { id: 'check', name: '托運行李' }, { id: 'out', name: '離開飯店檢查' }];
  if (!lists.length) return `<div class="spEmpty">尚無清單項目</div>`;

  // 預設選第一個清單情境；若選的清單已不存在則回退到第一個
  let cur = sharePackList;
  if (!cur || !lists.some(l => l.id === cur)) cur = lists[0].id;

  const tabs = `<div class="spPackTabs">${lists.map(l => {
    const cnt = items.filter(x => x.type === l.id).length;
    return `<button class="spPackTab ${l.id === cur ? 'active' : ''}" onclick="goSharePackList('${l.id}')">${esc(l.name)}<span class="spPackTabCnt">${cnt}</span></button>`;
  }).join('')}</div>`;

  const listItems = items.filter(x => x.type === cur);
  const body = listItems.length
    ? listItems.map(x => `
        <div class="spPackItem ${x.checked ? 'spPackChecked' : ''}">
          <span class="spPackCheck">${x.checked ? '✓' : '○'}</span>
          <span class="spPackName">${esc(x.name)}</span>
          ${x.note ? `<span class="spPackNote">${esc(x.note)}</span>` : ''}
        </div>`).join('')
    : `<div class="spEmpty">這個清單還沒有項目</div>`;

  return `${tabs}<div class="spPackList">${body}</div>`;
}

function openSharePlanDetail(planId) {
  const p = (data.plans || []).find(x => x.id === planId);
  if (!p) return;

  // 嘗試找對應的口袋景點（名稱或地址匹配）
  const spot = (data.spots || []).find(s =>
    s.name === p.name ||
    (p.address && s.addr && (s.addr.includes(p.address) || p.address.includes(s.addr)))
  );

  const isKorea = data.trip?.country === '韓國';
  const mapQ    = encodeURIComponent(p.krName || p.address || p.name);
  const mapBtn  = p.address || p.name
    ? `<a class="spDetailMapBtn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || p.name)}" target="_blank">Google Maps</a>
       ${isKorea ? `<a class="spDetailMapBtn spDetailMapBtnNaver" href="https://map.naver.com/v5/search/${mapQ}" target="_blank">Naver Map</a>` : ''}`
    : '';

  const modal = document.getElementById('spDetailModal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="spDetailBox">
      <div class="spDetailHandle"></div>
      <div class="spDetailHead">
        <div class="spDetailIcon">${activityIcon(p.type)}</div>
        <div class="spDetailTitleWrap">
          <div class="spDetailTitle">${esc(p.name || '未命名')}</div>
          ${p.start ? `<div class="spDetailTime">${esc(p.start)}${p.end ? ' — ' + esc(p.end) : ''}</div>` : ''}
        </div>
        <button class="spDetailClose" onclick="closeSharePlanDetail()">✕</button>
      </div>

      ${spot?.photo ? `<img class="spDetailPhoto" src="${esc(spot.photo)}" loading="lazy">` : ''}

      <div class="spDetailBody">
        ${p.address ? `
          <div class="spDetailSection">
            <div class="spDetailLabel">地址</div>
            <div class="spDetailVal">${esc(p.address)}</div>
            ${mapBtn ? `<div class="spDetailMapBtns">${mapBtn}</div>` : ''}
          </div>` : (mapBtn ? `<div class="spDetailMapBtns" style="margin-bottom:12px">${mapBtn}</div>` : '')}

        ${p.krName || p.krAddress ? `
          <div class="spDetailSection spDetailKr">
            ${p.krName    ? `<div class="spDetailVal">🇰🇷 ${esc(p.krName)}</div>`    : ''}
            ${p.krAddress ? `<div class="spDetailVal" style="font-size:12px;color:#8b827a">${esc(p.krAddress)}</div>` : ''}
          </div>` : ''}

        ${p.note ? `
          <div class="spDetailSection">
            <div class="spDetailLabel">備註</div>
            <div class="spDetailVal spDetailNote">${esc(p.note)}</div>
          </div>` : ''}

        ${spot?.memo || spot?.note ? `
          <div class="spDetailSection">
            <div class="spDetailLabel">景點筆記</div>
            <div class="spDetailVal spDetailNote">${esc(spot.memo || spot.note)}</div>
          </div>` : ''}

        ${(() => {
          const nearbyItems = (p.nearby || []).map(id => (data.spots || []).find(s => s.id === id)).filter(Boolean);
          return nearbyItems.length ? `
          <div class="spDetailSection">
            <div class="spDetailLabel">附近逛逛</div>
            <div class="spDetailNearby">${nearbyItems.map(s => `<span class="spNearbyTag">${activityIcon(s.type)} ${esc(s.name)}</span>`).join('')}</div>
          </div>` : '';
        })()}
      </div>
    </div>`;

  modal.classList.add('show');
}

function closeSharePlanDetail() {
  document.getElementById('spDetailModal')?.classList.remove('show');
}

function printSharePage() {
  const w = window.open('', '_blank');
  if (!w) { alert('請允許瀏覽器開啟新視窗後再試一次。'); return; }
  const title   = data.meta?.title || '旅程行程';
  const dest    = data.trip?.dest  || '';
  const start   = data.trip?.start || '';
  const end     = data.trip?.end   || '';

  const dayHtml = (data.days || []).map(d => {
    const plans = sortedPlans(d.key);
    return `<div class="item">
      <div class="dayHead">${esc(d.title)}｜${esc(d.label)}</div>
      ${plans.length ? plans.map((p, i) => {
        const time = [p.start, p.end].filter(Boolean).join('－') || '未定';
        const autoTag = p.source === 'flight' ? ' ✈️' : p.source === 'hotel' ? ' 🏨' : '';
        return `<div class="plan">
          <span class="pill">${i + 1}. ${esc(time)}</span>
          <div>
            <div class="main">${esc(p.name||'未命名')}${autoTag}</div>
            ${p.address ? `<div class="mini">地址：${esc(p.address)}</div>` : ''}
            ${p.note    ? `<div class="mini">說明：${esc(p.note)}</div>`    : ''}
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
  .hero { padding:28px; background:linear-gradient(135deg,#FFFDFC,#F2F6F4);
          border-bottom:1px solid #E2DDD5 }
  .brand { display:inline-flex; border-radius:999px; background:#F2F6F4;
           color:#4A5D4E; border:1px solid #E2DDD5;
           padding:7px 12px; font-size:12px; font-weight:900; margin-bottom:14px }
  h1 { font-size:26px; margin:0 0 6px }
  .sub { color:#8B827A; font-size:13px }
  .content { padding:22px }
  .sec { border:1px solid #E2DDD5; border-radius:20px; padding:16px;
         margin-bottom:14px; break-inside:avoid; background:#fff }
  h2 { font-size:15px; margin:0 0 10px }
  .item { border:1px solid #EEE8DF; border-radius:14px; padding:11px;
          margin:8px 0; break-inside:avoid }
  .dayHead { font-weight:900; margin-bottom:8px; font-size:14px }
  .plan { display:grid; grid-template-columns:90px 1fr; gap:8px; margin:6px 0; align-items:start }
  .pill { display:inline-flex; justify-content:center; border-radius:999px;
          background:#F3EEE8; color:#6F6257; padding:4px 8px;
          font-size:11px; font-weight:900; white-space:nowrap }
  .main { font-weight:900; line-height:1.5 }
  .mini { color:#8B827A; font-size:12px; margin-top:3px }
  .footer { text-align:center; color:#8B827A; font-size:11px;
            padding:14px; border-top:1px solid #E2DDD5 }
  @media print {
    body { background:#fff; padding:0 }
    .page { box-shadow:none; border:0; border-radius:0 }
  }
</style></head>
<body><div class="page">
  <div class="hero">
    <div class="brand">貞選旅管家</div>
    <h1>${esc(title)}</h1>
    <div class="sub">${esc(dest)}${start ? '｜' + start + ' — ' + end : ''}</div>
  </div>
  <div class="content">
    <div class="sec"><h2>✈️ 機票與交通</h2>${_buildFlightSection().replace(/class="share/g,'class="')}</div>
    <div class="sec"><h2>🏨 住宿資訊</h2>${_buildHotelSection().replace(/class="share/g,'class="')}</div>
    <div class="sec"><h2>🗓️ 每日行程</h2>${dayHtml}</div>
  </div>
  <div class="footer">貞選旅管家 Janeselect Travel Manager</div>
</div>
<script>setTimeout(()=>window.print(),350)<\/script>
</body></html>`);
  w.document.close();
}

function _renderShareError(msg) {
  const el = $('loginView');
  if (el) {
    el.innerHTML = `
      <div class="gateCard" style="max-width:460px;margin:60px auto;text-align:center">
        ${_brandHtml()}
        <h2 style="margin:0 0 12px">無法開啟分享連結</h2>
        <p style="color:#8b827a;margin:0 0 20px">${esc(msg)}</p>
        <a class="btn dark" href="${window.location.pathname}">返回首頁</a>
      </div>`;
  }
  showShell('login');
}

async function loadSharedDiary(token) {
  shareViewMode = true;
  const loginEl = $('loginView');
  if (loginEl) loginEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:80vh;flex-direction:column;gap:12px;color:#8b827a">
      ${_brandHtml()}
      <p>載入旅遊日記中…</p>
    </div>`;
  showShell('login');
  try {
    const snap = await fbDb.collection('publicDiaries').doc(token).get();
    if (!snap.exists || !snap.data()?.data) {
      if (loginEl) loginEl.innerHTML = `<div class="gateCard" style="max-width:460px;margin:60px auto;text-align:center">${_brandHtml()}<h2>找不到此遊記</h2><p style="color:#8b827a">連結可能已失效或被取消發布</p></div>`;
      return;
    }
    data = normalizeData(snap.data().data);
    _renderDiaryViewPage(token);
    fbDb.collection('publicDiaries').doc(token).onSnapshot(snap2 => {
      if (!snap2.exists || !snap2.data()?.data) return;
      data = normalizeData(snap2.data().data);
      _renderDiaryViewPage(token);
    }, err => console.warn('diary listener error', err));
  } catch (e) {
    if (loginEl) loginEl.innerHTML = `<div class="gateCard" style="max-width:460px;margin:60px auto;text-align:center">${_brandHtml()}<h2>載入失敗</h2><p style="color:#8b827a">${esc(e.message)}</p></div>`;
  }
}

function _renderDiaryViewPage(token) {
  const ds = data.diaryShare || {};
  const font = ['noto', 'serif', 'wenkai', 'cubic', 'klee', 'maru'].includes(ds.font) ? ds.font : 'noto';
  const el = $('loginView');
  if (!el) return;
  el.innerHTML = `
    <div class="diaryViewPage">
      <div class="diaryViewWrap diaryFont-${font}">
        ${diaryCoverHtml()}
        ${data.days.map(d => diaryDayHtml(d)).join('')}
      </div>
      <div class="diaryViewFooter">貞選旅管家 Janeselect Travel Manager<br>此遊記由旅行主辦人分享</div>
    </div>`;
  showShell('login');
}
