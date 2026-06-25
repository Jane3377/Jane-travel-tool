/* ================================================================
   db.js — 資料存取：localStorage + Firebase Firestore
   ================================================================ */

/* ── localStorage key 工具 ── */
function userKey() {
  return fbUser?.uid || 'guest';
}
function tripDataKey(tripId = currentTripId) {
  return `janeselect_travel_data_v63_${userKey()}_${tripId || 'draft'}`;
}
function tripMetaKey(tripId = currentTripId) {
  return `${tripDataKey(tripId)}__meta`;
}
function tripListKey() {
  return `${TRIP_LIST_KEY}_${userKey()}`;
}

/* ── Firestore doc 參照 ── */
function tripDocRef(tripId = currentTripId) {
  if (!fbUser) throw new Error('尚未登入');
  if (!tripId) throw new Error('尚未選擇旅程');
  return fbDb.collection('users').doc(fbUser.uid).collection('trips').doc(tripId);
}
function tripIndexRef() {
  if (!fbUser) throw new Error('尚未登入');
  return fbDb.collection('users').doc(fbUser.uid).collection('tripIndex').doc('list');
}
function publicShareRef(token) {
  if (!fbDb) throw new Error('Firebase 未初始化');
  return fbDb.collection('publicShares').doc(token);
}

/* ── 本機存取 ── */
function localSaveTrip() {
  if (!currentTripId) return;
  try {
    localStorage.setItem(tripDataKey(), JSON.stringify(data));
    localStorage.setItem(tripMetaKey(), JSON.stringify({
      updatedAtClient: Date.now(),
      tripId: currentTripId,
      title: data.meta?.title || '',
      dest:  data.trip?.dest  || ''
    }));
  } catch (e) {
    console.warn('localSaveTrip failed', e);
  }
}
function localLoadTrip(tripId) {
  try {
    const raw = localStorage.getItem(tripDataKey(tripId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function localGetTripMeta(tripId) {
  try {
    return JSON.parse(localStorage.getItem(tripMetaKey(tripId)) || '{}');
  } catch (e) {
    return {};
  }
}
function localSaveTripList() {
  try {
    localStorage.setItem(tripListKey(), JSON.stringify(tripList));
  } catch (e) {
    console.warn('localSaveTripList failed', e);
  }
}
function localLoadTripList() {
  try {
    return JSON.parse(localStorage.getItem(tripListKey()) || '[]').filter(Boolean);
  } catch (e) {
    return [];
  }
}

/* ── 資料正規化 ── */
function normalizeData(raw) {
  const d = makeDefaultData();
  if (!raw || typeof raw !== 'object') return d;

  Object.assign(d, raw);
  d.meta    = { ...makeDefaultData().meta,    ...(raw.meta    || {}) };
  d.trip    = { ...makeDefaultData().trip,    ...(raw.trip    || {}) };
  d.flights = {
    out:  { type: 'direct', segments: [], toAirport: '', fromAirport: '', ...(raw.flights?.out  || {}) },
    back: { type: 'direct', segments: [], toAirport: '', fromAirport: '', ...(raw.flights?.back || {}) }
  };

  // 相容舊版 travelers
  if (!d.trip.travelers?.length) {
    d.trip.travelers = [d.trip.a || 'A', d.trip.b || 'B'];
    d.trip.travelerCount = d.trip.travelers.length;
  }

  // 確保各陣列存在
  ['hotels','expenses','spots','plans','conns','photos','days'].forEach(k => {
    if (!Array.isArray(d[k])) d[k] = [];
  });
  if (!d.dayCovers)    d.dayCovers    = {};
  if (!d.dayCoverMeta) d.dayCoverMeta = {};
  if (!d.aiReviews)    d.aiReviews    = {};
  if (!d.packing?.length)   d.packing   = makePacking();
  if (!d.packLists?.length) d.packLists = [{ id: 'todo', name: '行前待辦' }, { id: 'carry', name: '手提行李' }, { id: 'check', name: '托運行李' }, { id: 'out', name: '離開飯店檢查' }];
  if (!d.diaryShare) d.diaryShare = { token: '', published: false, font: 'noto', publishedAt: null };

  // 重建 days
  if (!d.days?.length && d.trip.start && d.trip.end) {
    d.days = mkDays(d.trip.start, d.trip.end);
  }

  return d;
}

/* ── 本機讀取（啟動時用） ── */
function loadData(tripId = currentTripId) {
  const local = localLoadTrip(tripId);
  if (local) return normalizeData(local);

  // 相容舊版 key
  for (const key of ['travel_book_v12', 'travel_book_v8', 'travel_book_v7']) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return normalizeData(JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }
  return makeDefaultData();
}

/* ── 儲存（本機 + 排隊雲端） ── */
function save() {
  if (shareViewMode) return;
  if (deviceReadOnly) {
    toast('目前是檢視模式，請先接手編輯');
    return;
  }
  localSaveTrip();
  updateTripMeta();
  render();
  scheduleCloudSave();
}

function silentSave() {
  if (shareViewMode || deviceReadOnly) return;
  localSaveTrip();
  updateTripMeta();
  scheduleCloudSave();
}

/* ── 雲端儲存排隊（防止並發） ── */
function scheduleCloudSave(delay = 1800) {
  if (deviceReadOnly || suppressCloudSave) return;
  if (!canUseCloud()) return;

  clearTimeout(cloudSaveDebounce);
  setSyncStatus('warn', '等待同步', '已先儲存在本機');
  cloudSaveDebounce = setTimeout(() => saveToCloudNow(), delay);
}

/* ── 立即同步到雲端 ── */
async function saveToCloudNow() {
  if (deviceReadOnly) {
    toast('目前是檢視模式，請先接手編輯');
    return false;
  }
  if (!canUseCloud()) return false;

  // 防並發
  if (cloudSaveInFlight) {
    cloudSaveQueued = true;
    setSyncStatus('warn', '同步排隊中', '上一筆還在寫入');
    return false;
  }

  // 裝置鎖確認
  const canWrite = await ensureCanWrite();
  if (!canWrite) return false;

  cloudSaveInFlight = true;
  cloudSaveQueued   = false;

  try {
    setSyncStatus('warn', '同步中', '正在寫入雲端');
    const now = Date.now();
    await tripDocRef().set({
      data:            JSON.parse(JSON.stringify(data)),
      updatedAt:       firebase.firestore.FieldValue.serverTimestamp(),
      updatedAtClient: now,
      ownerEmail:      fbUser.email || '',
      tripId:          currentTripId,
      tripMeta:        currentTripMeta(),
      deviceId,
      editingLock:     lockPayload(),
      lockUpdatedAtClient: now
    }, { merge: true });

    lastCloudUpdatedAt = now;
    localGetTripMeta(currentTripId); // refresh
    localStorage.setItem(tripMetaKey(), JSON.stringify({
      updatedAtClient: now,
      cloudUpdatedAtClient: now,
      tripId: currentTripId
    }));

    await saveTripListCloud();

    // 同步公開分享（如有分享連結）
    if (data.meta?.shareToken) {
      try {
        await publicShareRef(data.meta.shareToken).set({
          data:       JSON.parse(JSON.stringify(data)),
          updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
          ownerEmail: fbUser.email || '',
          tripMeta:   { title: data.meta?.title || '', dest: data.trip?.dest || '' }
        });
      } catch (e) {
        console.warn('publicShare sync failed', e);
      }
    }

    setSyncStatus('on', '同步好了', new Date(now).toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' }));

    cloudSaveInFlight = false;
    if (cloudSaveQueued) {
      cloudSaveQueued = false;
      setTimeout(() => saveToCloudNow(), 300);
    }
    return true;
  } catch (err) {
    cloudSaveInFlight = false;
    setSyncStatus('off', '同步失敗', err.message || '請檢查網路與 Firestore Rules');
    return false;
  }
}

/* ── 從雲端載入 ── */
async function loadFromCloud(options = {}) {
  if (!options.force && !confirm('載入雲端資料會覆蓋目前此裝置的資料，確定嗎？')) return false;
  if (!canUseCloud()) return false;

  try {
    setSyncStatus('warn', '載入中', '讀取雲端資料');
    const snap = await tripDocRef().get();
    if (!snap.exists || !snap.data()?.data) {
      toast('雲端尚無此旅程的資料');
      setSyncStatus('off', '雲端無資料', '');
      return false;
    }

    suppressCloudSave = true;
    const doc = snap.data();
    data = normalizeData(doc.data);
    cur = currentDay = data.days?.[0]?.key || data.trip.start || '';
    localSaveTrip();
    lastCloudUpdatedAt = doc.updatedAtClient || Date.now();
    suppressCloudSave = false;

    render();
    setSyncStatus('on', '已載入雲端資料', `旅程：${data.meta.title || ''}`);
    return true;
  } catch (err) {
    suppressCloudSave = false;
    setSyncStatus('off', '載入失敗', err.message);
    return false;
  }
}

/* ── 監聽雲端變更 ── */
function listenCloudChanges() {
  if (!canUseCloud()) return;
  if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }

  const listeningId = currentTripId;
  cloudUnsub = tripDocRef().onSnapshot(snap => {
    if (listeningId !== currentTripId || !snap.exists || !cloudReady) return;
    const remote = snap.data()?.updatedAtClient || 0;
    const local  = localGetTripMeta().updatedAtClient || 0;
    if (remote > Math.max(lastCloudUpdatedAt, local) + 1200) {
      setSyncStatus('warn', '雲端有較新資料', '可按「載入」更新');
    }
  }, err => setSyncStatus('off', '雲端監聽失敗', err.message));
}

/* ── 旅程清單雲端同步 ── */
async function saveTripListCloud() {
  localSaveTripList();
  if (!fbUser || !fbDb) return;
  try {
    await tripIndexRef().set({
      trips:           tripList,
      updatedAtClient: Date.now(),
      ownerEmail:      fbUser.email || ''
    }, { merge: true });
  } catch (e) {
    console.warn('saveTripListCloud failed', e);
  }
}
async function loadTripListCloud() {
  if (!fbUser || !fbDb) return localLoadTripList();
  try {
    const snap = await tripIndexRef().get();
    const cloud = snap.exists && Array.isArray(snap.data()?.trips) ? snap.data().trips : [];
    const local = localLoadTripList();
    const map   = new Map();
    [...cloud, ...local].forEach(t => {
      if (!t?.id) return;
      const old = map.get(t.id);
      if (!old || Number(t.updatedAtClient || 0) >= Number(old.updatedAtClient || 0))
        map.set(t.id, t);
    });
    tripList = [...map.values()].sort((a, b) => Number(b.updatedAtClient || 0) - Number(a.updatedAtClient || 0));
    localSaveTripList();
    await saveTripListCloud();
  } catch (e) {
    console.warn('loadTripListCloud fallback local', e);
    tripList = localLoadTripList();
  }
  return tripList;
}

/* ── 白名單動態載入 ── */
async function loadWhitelist() {
  try {
    if (!fbDb) return;
    const snap = await fbDb.collection('allowedUsers').get();
    if (!snap.empty) {
      const emails = [];
      snap.forEach(doc => emails.push(doc.id.toLowerCase()));
      ALLOWED_EMAILS = emails;
      if (!ALLOWED_EMAILS.includes(ADMIN_EMAIL))
        ALLOWED_EMAILS.push(ADMIN_EMAIL);
    }
  } catch (e) {
    console.warn('loadWhitelist failed, using fallback', e.message);
  }
}

/* ── 備份匯出入 ── */
function exportBackup() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `travel-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function importBackup(file) {
  if (!file) return;
  if (!confirm('匯入備份會覆蓋目前資料，確定嗎？')) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      data = normalizeData(JSON.parse(e.target.result));
      localSaveTrip();
      cur = currentDay = data.days?.[0]?.key || data.trip.start || '';
      render();
      toast('已匯入備份');
    } catch {
      toast('備份檔格式錯誤');
    }
  };
  reader.readAsText(file);
}

/* ── 旅程 meta ── */
function currentTripMeta() {
  return {
    id:              currentTripId,
    title:           data.meta?.title || data.trip?.dest || '未命名旅程',
    dest:            data.trip?.dest  || '',
    country:         data.trip?.country || '',
    start:           data.trip?.start   || '',
    end:             data.trip?.end     || '',
    updatedAtClient: Date.now(),
    archived:        false
  };
}
function updateTripMeta(saveCloud = false) {
  if (!currentTripId) return;
  const idx = tripList.findIndex(t => t.id === currentTripId);
  const old = idx >= 0 ? tripList[idx] : {};
  const meta = { ...old, ...currentTripMeta(), archived: old.archived || false, cardColor: old.cardColor || 'cream' };
  if (idx >= 0) tripList[idx] = meta; else tripList.unshift(meta);
  if (saveCloud) saveTripListCloud(); else localSaveTripList();
}

/* ── 輔助判斷 ── */
function isAllowed(user) {
  const email = (user?.email || '').toLowerCase();
  return ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(email);
}
function canUseCloud() {
  return !!(fbUser && isAllowed(fbUser) && fbDb && currentTripId);
}
