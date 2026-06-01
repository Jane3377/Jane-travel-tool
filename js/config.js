/* ── config.js：常數、Firebase 設定、base 資料結構 ── */
/* 貞選旅管家 v66.0 */

/* Firebase 設定 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDVmuktIzd29IqgOum2KOchgFZi0ofn4tY",
  authDomain: "travel-tool-50e41.firebaseapp.com",
  projectId: "travel-tool-50e41",
  storageBucket: "travel-tool-50e41.firebasestorage.app",
  messagingSenderId: "3477916876",
  appId: "1:3477916876:web:141919efd392b6b5a60669",
  measurementId: "G-FT2Y6WL5D5"
};

const ADMIN_EMAIL = "jan33772001@gmail.com";
const V63_ADMIN_EMAIL = "jan33772001@gmail.com";
let V63_ALLOWED_EMAILS = ["jan33772001@gmail.com"];

/* Cloudinary 設定 */
const CLOUDINARY_CONFIG = {
  cloudName: "dtpgutlmt",
  uploadPreset: "travel_book_unsigned",
  folder: "travel-book",
  maxUploadBytes: 10 * 1024 * 1024,
  maxWidth: 1600,
  quality: 0.82
};

/* 基本常數 */
const views = [["trip","旅遊地"],["planner","行程"],["spots","口袋景點"],["budget","預算"],["packing","行李"],["photoBook","照片書"],["help","說明"]];

const currencyMap = {"韓國":"KRW","日本":"JPY","泰國":"THB","美國":"USD","越南":"VND","新加坡":"SGD","歐洲":"EUR","英國":"GBP","香港":"HKD"};
const rateMap = {KRW:.023,JPY:.22,THB:.92,USD:31.5,VND:.00125,SGD:24,EUR:34,GBP:39,HKD:4.05};

const pack0 = [
  ["pre","護照","出門前確認"],["pre","機票 / 登機資訊","截圖備份"],
  ["pre","住宿訂房資訊","地址存一份"],["pre","信用卡 / 現金","分開放"],
  ["pre","旅遊保險","保單號碼"],["pre","轉接頭","依國家確認"],
  ["pre","行動電源","放隨身包"],["pre","常備藥","腸胃 / 止痛 / 過敏"],
  ["out","護照","離開飯店前確認"],["out","手機 / 充電器","床頭插座"],
  ["out","錢包 / 信用卡","保險箱"],["out","衣櫃 / 浴室 / 冰箱","不要漏東西"]
];

/* base 資料結構（loadData fallback 用） */
// 注意：base.packing 用到 uid()，所以在 utils.js 載入後才能呼叫
// 實際初始化在 main.js 的 initBase() 中執行
let base = null;

/* 全域狀態變數 */
let data = null;
let cur = "";
let view = "trip";
let drag = null;
let editingSpotId = null;
let editingHotelId = null;
let editingExpenseId = null;
let editingPlanId = null;
let adjustToastShown = false;

/* Firebase 全域變數 */
let fbApp = null, fbAuth = null, fbDb = null, fbUser = null;
let cloudReady = false, cloudSaveTimer = null, suppressCloudSave = false, cloudUnsub = null;
let lastCloudUpdatedAt = 0;
let v632LastSyncState = { kind: "off", title: "尚未同步", desc: "", at: 0 };

/* v649 裝置鎖 */
const V649_DEVICE_KEY = "janeselectTravelDeviceId";
const V649_LOCK_TTL = 2 * 60 * 1000;
const V649_HEARTBEAT_MS = 35 * 1000;
let v649DeviceId = localStorage.getItem(V649_DEVICE_KEY) || `dev_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
localStorage.setItem(V649_DEVICE_KEY, v649DeviceId);
let v649ReadOnly = false;
let v649LockOwner = null;
let v649HeartbeatTimer = null;
let v649LockUnsub = null;
let v649SelectingTrip = false;

/* v647 雲端同步佇列 */
let v647CloudSaveInFlight = false;
let v647CloudSaveQueued = false;
let v647CloudSaveTimer = null;
let v647LastSaveReason = "auto";

/* v63 多旅程 */
const V63_MAX_TRIPS = 10;
const V63_TRIP_LIST_KEY_PREFIX = "janeselect_trip_list_v63";
const V63_CURRENT_TRIP_KEY = "janeselect_currentTripId_v63";
let currentTripId = localStorage.getItem(V63_CURRENT_TRIP_KEY) || "";
let tripList = [];
let v63AuthPassed = false;
let v63Booted = false;

/* AI */
const V641_PREF_KEY = "janeselectAiPrefs_v1";
let storyPendingPhotoFiles = {};
let storyPhotoPreviewUrls = {};
