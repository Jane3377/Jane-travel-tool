/* ================================================================
   state.js — 全域狀態與資料結構
   ================================================================ */

/* ── 資料結構預設值（新旅程的初始資料） ── */
function makeDefaultData() {
  return {
    meta: {
      title: '我的旅程手帳',
      subtitle: '把想去的地方都收進來，慢慢排成一趟期待出發的旅行。',
      bookStyle: 'fresh',
      diaryFont: 'noto'
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
    packView:   'todo',
    packLists:  [{ id: 'todo', name: '行前待辦' }, { id: 'carry', name: '手提行李' }, { id: 'check', name: '托運行李' }, { id: 'out', name: '離開飯店檢查' }],
    photos:     [],
    dayCovers:  {},
    dayCoverMeta: {},
    aiReviews:  {},
    tripCover:  null,
    dayMoods:   {},
    handbook:   {},
    diaryShare: {
      token: '',
      published: false,
      font: 'noto',
      publishedAt: null
    }
  };
}

function makePacking() {
  // uid() 在 utils.js 定義，此函式只在 init() 之後被呼叫，所以是安全的
  // 如果在模組載入時被意外呼叫，用 fallback
  const safeUid = typeof uid === 'function' ? uid : () => String(Date.now() + Math.random());
  return PACK_DEFAULTS.map(([type, name, note]) => ({
    id: safeUid(), type, name, note, checked: false
  }));
}

/* ── 旅程資料（目前選中的旅程） ── */
let data = null; // 在 main.js 的 init() 裡初始化，確保 uid() 已載入

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

/* ── 旅遊書子頁 ── */
let photoBookTab = 'handbook';

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

/* ── 分享唯讀模式 ── */
let shareViewMode  = false;
let shareViewToken = null;
