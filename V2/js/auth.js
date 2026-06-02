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

  // 登入成功 → 載入旅程清單
  setSyncStatus('warn', '登入成功', '載入旅程清單中');
  await loadTripListCloud();
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
    localSaveTrip();
    suppressCloudSave = false;

    cloudReady = canUseCloud();
    if (cloudReady) listenCloudChanges();

    showShell('app');
    view = 'trip';
    renderNav();
    render();
    scrollTo(0, 0);

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
  view = 'trip';
  renderNav();
  render();
  scrollTo(0, 0);
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
    setReadOnly(false, null);
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

  // 檢查是否為分享連結（?share=TOKEN）
  const urlToken = new URLSearchParams(window.location.search).get('share');
  if (urlToken) {
    await loadSharedTrip(urlToken);
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

function _renderSharePage() {
  const el = $('loginView');
  if (!el) return;

  const title  = data.meta?.title || '我的旅程';
  const dest   = data.trip?.dest  || '';
  const start  = data.trip?.start ? short(data.trip.start) : '';
  const end    = data.trip?.end   ? short(data.trip.end)   : '';
  const now    = new Date().toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' });

  el.innerHTML = `
    <div class="sharePg noPrint">
      <div class="sharePgHead">
        <div class="sharePgHeroRow">
          <div>
            ${_brandHtml()}
            <h1 class="sharePgTitle">${esc(title)}</h1>
            <p class="sharePgSub">${esc(dest)}${start ? '｜' + start + ' — ' + end : ''}</p>
          </div>
          <div class="sharePgActions">
            <button class="btn dark" onclick="printSharePage()">匯出 PDF</button>
            <span class="shareSyncBadge">已更新 ${esc(now)}</span>
          </div>
        </div>
      </div>
      <div class="sharePgBody">
        <div class="shareSection"><h4>✈️ 機票與交通</h4>${_buildFlightSection()}</div>
        <div class="shareSection"><h4>🏨 住宿資訊</h4>${_buildHotelSection()}</div>
        <div class="shareSection"><h4>🗓️ 每日行程</h4>${_buildDaySection()}</div>
      </div>
      <div class="sharePgFooter">貞選旅管家 Janeselect Travel Manager｜此頁面即時更新</div>
    </div>`;

  showShell('login');
}

function printSharePage() {
  const w = window.open('', '_blank');
  if (!w) { alert('請允許瀏覽器開啟新視窗後再試一次。'); return; }
  const title   = data.meta?.title || '旅程行程';
  const dest    = data.trip?.dest  || '';
  const start   = data.trip?.start || '';
  const end     = data.trip?.end   || '';

  const dayHtml = (data.days || []).map(d => {
    const plans = sortedPlans(d.key).filter(p => p.source !== 'flight' && p.source !== 'hotel');
    return `<div class="item">
      <div class="dayHead">${esc(d.title)}｜${esc(d.label)}</div>
      ${plans.length ? plans.map(p => {
        const time = [p.start, p.end].filter(Boolean).join('－') || '未定';
        return `<div class="plan">
          <span class="pill">${esc(time)}</span>
          <div>
            <div class="main">${esc(p.name||'未命名')}</div>
            ${p.address ? `<div class="mini">地址：${esc(p.address)}</div>` : ''}
            ${p.note    ? `<div class="mini">注意：${esc(p.note)}</div>`    : ''}
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
