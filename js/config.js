/* ================================================================
   config.js — 常數、設定、資料結構定義
   ================================================================ */

/* ── App 版本 ── */
const APP_VERSION = 'v88';

/* ── Firebase 設定 ── */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDVmuktIzd29IqgOum2KOchgFZi0ofn4tY',
  authDomain: 'travel-tool-50e41.firebaseapp.com',
  projectId: 'travel-tool-50e41',
  storageBucket: 'travel-tool-50e41.firebasestorage.app',
  messagingSenderId: '3477916876',
  appId: '1:3477916876:web:141919efd392b6b5a60669'
};

/* ── Cloudinary 設定 ── */
const CLOUDINARY_CONFIG = {
  cloudName: 'dtpgutlmt',
  uploadPreset: 'travel_book_unsigned',
  folder: 'travel-book',
  maxWidth: 1600,
  quality: 0.82
};

/* ── 白名單（動態從 Firestore allowedUsers 載入，這裡是 fallback） ── */
const ADMIN_EMAIL = 'jan33772001@gmail.com';
let ALLOWED_EMAILS = ['jan33772001@gmail.com'];

/* ── 多旅程系統 ── */
const TRIP_LIST_KEY = 'janeselect_trip_list_v63';
const CURRENT_TRIP_KEY = 'janeselect_currentTripId_v63';
const MAX_TRIPS = 10;

/* ── 裝置鎖 ── */
const DEVICE_KEY = 'janeselectTravelDeviceId';
const LOCK_TTL = 2 * 60 * 1000;       // 2 分鐘沒心跳視為離線
const HEARTBEAT_MS = 35 * 1000;       // 每 35 秒更新一次鎖

/* ── AI 偏好 ── */
const AI_PREF_KEY = 'janeselectAiPrefs_v1';

/* ── 主題系統 ── */
const THEME_KEY = 'travelBookThemePrefs';
const THEME_CONFIG = {
  modes: {
    light: { label: '淺色' },
    dark:  { label: '深色' }
  },
  palettes: {
    seoul: { label: '韓系清新', primary: '#628f80', line: '#eadfd4', card: '#fffdfa' },
    ocean: { label: '海邊藍',   primary: '#4f82a8', line: '#d9e7ef', card: '#fbfdff' },
    latte: { label: '奶茶暖色', primary: '#a57855', line: '#ead9c8', card: '#fffaf4' }
  },
  cardStyles: {
    soft:    { label: '柔和卡片' },
    outline: { label: '清爽線框' },
    solid:   { label: '立體卡片' }
  }
};

/* ── 幣別與匯率 ── */
const CURRENCY_MAP = {
  '韓國': 'KRW', '日本': 'JPY', '泰國': 'THB', '美國': 'USD',
  '越南': 'VND', '新加坡': 'SGD', '歐洲': 'EUR', '英國': 'GBP', '香港': 'HKD'
};
const RATE_MAP = {
  KRW: 0.023, JPY: 0.22, THB: 0.92, USD: 31.5,
  VND: 0.00125, SGD: 24, EUR: 34, GBP: 39, HKD: 4.05
};

/* ── 行程分類 ── */
const PLAN_TYPES = ['景點', '餐廳', '咖啡廳', '購物', '交通', '航班', '住宿', '雨天備案', '其他'];

/* ── 旅程卡片色系 ── */
const CARD_COLORS = [
  { key: 'cream', label: '奶油白' },
  { key: 'mint',  label: '薄荷綠' },
  { key: 'rose',  label: '玫瑰粉' },
  { key: 'sky',   label: '晨霧藍' },
  { key: 'latte', label: '奶茶棕' }
];

/* ── 清單預設項目 ── */
const PACK_DEFAULTS = [
  ['todo', '確認護照效期',       '至少6個月以上'],
  ['todo', '機票 / 登機資訊',    '截圖備份'],
  ['todo', '住宿訂房資訊',       '地址存一份'],
  ['todo', '信用卡 / 換錢',      '分開放'],
  ['todo', '旅遊保險',           '保單號碼'],
  ['todo', '國際漫遊 / SIM 卡',  '出發前確認'],
  ['carry', '護照',              '隨身攜帶'],
  ['carry', '錢包 / 信用卡',     '分開放'],
  ['carry', '手機 / 充電線',     '確認帶了'],
  ['carry', '行動電源',          '放隨身包'],
  ['carry', '常備藥',            '腸胃 / 止痛 / 過敏'],
  ['carry', '轉接頭',            '依國家確認'],
  ['check', '換洗衣物',          '天數 + 備份一套'],
  ['check', '盥洗用品',          '液體注意安檢規定'],
  ['check', '充電器 / 變壓器',   '相機 / 電腦'],
  ['out',   '護照',              '離開飯店前確認'],
  ['out',   '手機 / 充電器',     '床頭插座'],
  ['out',   '錢包 / 信用卡',     '保險箱'],
  ['out',   '衣櫃 / 浴室 / 冰箱', '不要漏東西']
];

/* ── Tab 頁面清單 ── */
const VIEWS = [
  ['planner',   '行程'],
  ['spots',     '口袋景點'],
  ['budget',    '費用'],
  ['packing',   '清單'],
  ['photoBook', '旅遊書'],
  ['trip',      '旅遊地'],
  ['stay',      '航班住宿'],
  ['help',      '說明']
];

/* ── 城市地圖 ── */
const CITY_MAP = {
  '韓國':  ['釜山', '首爾', '濟州', '大邱', '仁川', '自訂'],
  '日本':  ['東京', '大阪', '京都', '福岡', '札幌', '沖繩', '名古屋', '自訂'],
  '泰國':  ['曼谷', '清邁', '普吉', '自訂'],
  '越南':  ['胡志明', '河內', '峴港', '自訂'],
  '新加坡': ['新加坡'],
  '香港':  ['香港'],
  '美國':  ['紐約', '洛杉磯', '舊金山', '西雅圖', '拉斯維加斯', '自訂'],
  '歐洲':  ['自訂'],
  '英國':  ['倫敦', '曼徹斯特', '愛丁堡', '自訂'],
  '其他':  ['自訂']
};

/* ── 常用機場 ── */
const AIRPORT_LIST = [
  '台灣｜TPE 桃園國際機場', '台灣｜TSA 台北松山機場',
  '台灣｜KHH 高雄小港機場', '台灣｜RMQ 台中國際機場',
  '韓國｜ICN 首爾仁川機場', '韓國｜GMP 首爾金浦機場', '韓國｜PUS 釜山金海機場',
  '日本｜NRT 東京成田機場', '日本｜HND 東京羽田機場',
  '日本｜KIX 大阪關西機場', '日本｜FUK 福岡機場',
  '日本｜CTS 新千歲機場',   '日本｜NGO 名古屋中部機場',
  '香港｜HKG 香港國際機場', '新加坡｜SIN 樟宜機場',
  '泰國｜BKK 蘇凡納布機場', '泰國｜DMK 廊曼機場',
  '越南｜SGN 胡志明新山一機場', '越南｜HAN 河內內排機場',
  '中國｜PVG 上海浦東機場', '中國｜SHA 上海虹橋機場',
  '中國｜PEK 北京首都機場',
  '美國｜LAX 洛杉磯機場',   '美國｜SFO 舊金山機場',
  '美國｜JFK 紐約甘迺迪機場',
  '歐洲｜LHR 倫敦希斯洛機場', '歐洲｜CDG 巴黎戴高樂機場',
  '歐洲｜FRA 法蘭克福機場',   '歐洲｜AMS 阿姆斯特丹機場'
];

/* ── 航廈選項 ── */
const TERMINAL_OPTIONS = [
  '未定', 'T1', 'T2', 'T3', 'T4', 'T5',
  '國際線航廈', '國內線航廈', '第一航廈', '第二航廈', '第三航廈', 'Satellite', '其他'
];
