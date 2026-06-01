/* ================================================================
   state.js — 全域狀態與資料結構
   ================================================================ */

/* ── 資料結構預設值（新旅程的初始資料） ── */
function makeDefaultData() {
  return {
    meta: {
      title: '我的旅程手帳',
      subtitle: '把想去的地方都收進來，慢慢排成一趟期待出發的旅行。',
      bookStyle: 'fresh'
    },
    trip: {
      dest: '',
      country: '韓國',
      city: '釜山',
      currency: 'KRW',
      rate: 0.023,
      start: '',
      end: '',
      travelerCount: 2,
      travelers: ['A', 'B']
    },
    days: [],
    flights: {
      out:  { type: 'direct', segments: [], toAirport: '', fromAirport: '' },
      back: { type: 'direct', segments: [], toAirport: '', fromAirport: '' }
    },
    hotels:     [],
    expenses:   [],
    spots:      [],
    plans:      [],
    conns:      [],
    packing:    makePacking(),
    packView:   'pre',
    photos:     [],
    dayCovers:  {},
    dayCoverMeta: {},
    aiReviews:  {},
    tripCover:  null
  };
}

function makePacking() {
  return PACK_DEFAULTS.map(([type, name, note]) => ({
    id: uid(), type, name, note, checked: false
  }));
}

/* ── 旅程資料（目前選中的旅程） ── */
let data = makeDefaultData();

/* ── UI 狀態 ── */
let view         = 'trip';    // 目前頁面
let currentDay   = '';        // 行程頁面選中的日期
let cur          = '';        // 同 currentDay（相容舊程式碼）

/* ── 編輯狀態 ── */
let editingSpotId    = null;
let editingHotelId   = null;
let editingExpenseId = null;
let editingPlanId    = null;

/* ── 航班狀態 ── */
let v39FlightDirty = false;

/* ── 住宿暫存 ── */
let v16KeepHotelOpen  = false;
let v16PendingSpotId  = null;
let v18PendingCountry = null;
let v21PendingFlightOptions = false;
let v21PendingHotelId       = null;

/* ── 日期調整暫存 ── */
let pendingDateAdjust = null;

/* ── 照片暫存 ── */
let storyPendingPhotoFiles = {};
let storyPhotoPreviewUrls  = {};
let activePhotoEditId      = null;

/* ── 多旅程系統 ── */
let currentTripId = localStorage.getItem(CURRENT_TRIP_KEY) || '';
let tripList      = [];
let v63AuthPassed = false;
let v63Booted     = false;

/* ── Firebase 連線 ── */
let fbApp  = null;
let fbAuth = null;
let fbDb   = null;
let fbUser = null;

/* ── 雲端同步狀態 ── */
let cloudReady        = false;
let cloudSaveTimer    = null;
let suppressCloudSave = false;
let cloudUnsub        = null;
let lastCloudUpdatedAt = 0;
let syncState = { kind: 'off', title: '尚未同步', desc: '', at: 0 };

/* v647 雲端同步佇列（避免並發） */
let cloudSaveInFlight  = false;
let cloudSaveQueued    = false;
let cloudSaveDebounce  = null;

/* ── 裝置鎖 ── */
let deviceId = localStorage.getItem(DEVICE_KEY)
  || `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
localStorage.setItem(DEVICE_KEY, deviceId);

let deviceReadOnly   = false;
let deviceLockOwner  = null;
let heartbeatTimer   = null;
let lockUnsub        = null;
let selectingTrip    = false;
