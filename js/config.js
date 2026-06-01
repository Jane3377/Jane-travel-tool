/* ── config.js：常數、設定、全域狀態 ── */

/* =========================================
   貞選旅管家 v66.0-clean
   整理後版本：移除所有 wrapper 鏈，直接整合最終函式
   資料結構、localStorage key、Firestore 路徑、Cloudinary 設定均未變動
   ========================================= */

/* ── base 資料結構（必須最先定義，loadData 會用到） ── */
var base; // 在常數區之後完整定義；先宣告避免 TDZ 問題

/* ── 版本常數 ── */
const APP_VERSION = "v66.0-clean｜2026-05-31";
const V653_VERSION_SHORT = "v66.0｜2026-05-31";
const V649_DEVICE_KEY = "janeselectTravelDeviceId";
const V649_LOCK_TTL = 2 * 60 * 1000;
const V649_HEARTBEAT_MS = 35 * 1000;
const V641_PREF_KEY = "janeselectAiPrefs_v1";

/* ── 基本常數 ── */
const views = [["trip","旅遊地"],["stay","航班住宿"],["planner","行程"],["spots","口袋景點"],["budget","預算"],["packing","行李"],["photoBook","旅遊書"],["help","說明"]];
const currencyMap = {"韓國":"KRW","日本":"JPY","泰國":"THB","美國":"USD","越南":"VND","新加坡":"SGD","歐洲":"EUR","英國":"GBP","香港":"HKD"};
const rateMap = {KRW:.023,JPY:.22,THB:.92,USD:31.5,VND:.00125,SGD:24,EUR:34,GBP:39,HKD:4.05};
const pack0 = [["pre","護照","出門前確認"],["pre","機票 / 登機資訊","截圖備份"],["pre","住宿訂房資訊","地址存一份"],["pre","信用卡 / 現金","分開放"],["pre","旅遊保險","保單號碼"],["pre","轉接頭","依國家確認"],["pre","行動電源","放隨身包"],["pre","常備藥","腸胃 / 止痛 / 過敏"],["out","護照","離開飯店前確認"],["out","手機 / 充電器","床頭插座"],["out","錢包 / 信用卡","保險箱"],["out","衣櫃 / 浴室 / 冰箱","不要漏東西"]];
const PLAN_TYPES = ["景點","餐廳","咖啡廳","購物","交通","航班","住宿","雨天備案","其他"];
const CLOUDINARY_CONFIG = {cloudName:"dtpgutlmt",uploadPreset:"travel_book_unsigned",folder:"travel-book",maxUploadBytes:10*1024*1024,maxWidth:1600,quality:.82};
const FIREBASE_CONFIG = {apiKey:"AIzaSyDVmuktIzd29IqgOum2KOchgFZi0ofn4tY",authDomain:"travel-tool-50e41.firebaseapp.com",projectId:"travel-tool-50e41",storageBucket:"travel-tool-50e41.firebasestorage.app",messagingSenderId:"3477916876",appId:"1:3477916876:web:141919efd392b6b5a60669",measurementId:"G-FT2Y6WL5D5"};
const V63_ADMIN_EMAIL = "jan33772001@gmail.com";
let V63_ALLOWED_EMAILS = ["jan33772001@gmail.com"];
const V63_MAX_TRIPS = 10;
const V63_TRIP_LIST_KEY_PREFIX = "janeselect_trip_list_v63";
const V63_CURRENT_TRIP_KEY = "janeselect_currentTripId_v63";
const THEME_CONFIG = {modes:{light:{label:"淺色"},dark:{label:"深色"}},palettes:{seoul:{label:"韓系清新",primary:"#628f80",line:"#eadfd4",card:"#fffdfa"},ocean:{label:"海邊藍",primary:"#4f82a8",line:"#d9e7ef",card:"#fbfdff"},latte:{label:"奶茶暖色",primary:"#a57855",line:"#ead9c8",card:"#fffaf4"}},cardStyles:{soft:{label:"柔和卡片"},outline:{label:"清爽線框"},solid:{label:"立體卡片"}}};
const THEME_STORAGE_KEY = "travelBookThemePrefs";

/* ── v643 日期常數 ── */
const V636_CARD_COLORS = [{key:"cream",label:"奶油白"},{key:"mint",label:"薄荷綠"},{key:"rose",label:"玫瑰粉"},{key:"sky",label:"晨霧藍"},{key:"latte",label:"奶茶棕"}];

/* ── 狀態變數 ── */
let currentTripId = localStorage.getItem(V63_CURRENT_TRIP_KEY) || "";
let tripList = [];
let v63AuthPassed = false;
let v63Booted = false;
let fbApp = null, fbAuth = null, fbDb = null, fbUser = null;
let cloudReady = false, cloudSaveTimer = null, suppressCloudSave = false, cloudUnsub = null;
let lastCloudUpdatedAt = 0;
let v632LastSyncState = {kind:"off",title:"尚未同步",desc:"",at:0};

/* v649 裝置鎖狀態 */
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

/* 其他全域狀態 */
let storyPendingPhotoFiles = {};
let storyPhotoPreviewUrls = {};
let v19PendingDates = null;
let v18PendingCountry = null;
let v21PendingFlightOptions = false;
let v21PendingHotelId = null;
let v16KeepHotelOpen = false;
let v16PendingSpotId = null;
let v39FlightDirty = false;
let adjustToastShown = false;
let syncStatus = "idle", lastSyncTime = null;
let v643PendingBasic = null;
let activePhotoEditId = null;

/* 行程編輯狀態 */
let view = "trip", drag = null;
let editingSpotId = null, editingHotelId = null;
let editingExpenseId = null, editingPlanId = null;
let currentDay = "";


/* ── base 資料結構定義（必須在 loadData/v63NormalizeData 之前） ── */
base = {
  meta:{title:"釜山小旅行手帳",subtitle:"把想去的海邊、巷弄、咖啡香與晚餐清單都收進來，慢慢排成一趟期待出發的旅行。",bookStyle:"fresh"},
  trip:{dest:"韓國釜山",country:"韓國",city:"釜山",currency:"KRW",start:"2026-06-04",end:"2026-06-10",rate:.023,travelerCount:2,travelers:["A","B"]},
  days:[],
  flights:{out:{type:"direct",segments:[],toAirport:"",fromAirport:""},back:{type:"direct",segments:[],toAirport:"",fromAirport:""}},
  hotels:[],expenses:[],spots:[],plans:[],conns:[],
  packing:[
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"pre",name:"護照",note:"出門前確認",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"pre",name:"機票 / 登機資訊",note:"截圖備份",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"pre",name:"住宿訂房資訊",note:"地址存一份",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"pre",name:"信用卡 / 現金",note:"分開放",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"pre",name:"旅遊保險",note:"保單號碼",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"pre",name:"轉接頭",note:"依國家確認",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"pre",name:"行動電源",note:"放隨身包",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"pre",name:"常備藥",note:"腸胃 / 止痛 / 過敏",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"out",name:"護照",note:"離開飯店前確認",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"out",name:"手機 / 充電器",note:"床頭插座",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"out",name:"錢包 / 信用卡",note:"保險箱",checked:false},
    {id:crypto.randomUUID?.()??String(Date.now()+Math.random()),type:"out",name:"衣櫃 / 浴室 / 冰箱",note:"不要漏東西",checked:false}
  ],
  packView:"pre",photos:[],dayCovers:{},dayCoverMeta:{},aiReviews:{}
};
var data = JSON.parse(JSON.stringify(base));
var cur = "";

/* ── 核心工具函式 ── */
