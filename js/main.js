/* ================================================================
   main.js — 啟動入口
   ================================================================ */

function init() {
  // 套用主題
  applyThemePrefs(getThemePrefs());

  // 載入本機資料
  data = loadData();
  cur  = currentDay = data.days?.[0]?.key || data.trip?.start || '';

  // 事件監聽
  document.addEventListener('click', e => {
    // 點外面關閉帳號選單
    const widget = $('accountWidget');
    if (widget && !widget.contains(e.target)) closeAccountMenu();
  });

  // 航班表單變更偵測（在 renderStay 裡綁定，這裡不需重複）
}

async function boot() {
  init();

  if (!window.firebase) {
    console.error('Firebase SDK 尚未載入');
    return;
  }

  await bootFirebase();
}

/* ── 外部帶入景點（iOS 捷徑 / 分享） ──
   支援兩種參數：
   1) ?spotText=...  ← 建議：把「分享」的整段文字丟進來，由 App 解析名稱／網址／地址
      （iOS 捷徑只要 2 步：取得輸入內容的文字 → 打開 URL，最穩定，不用在捷徑裡爬網頁）
   2) ?spotName=&spotAddr=&spotUrl=  ← 舊版：捷徑已自行拆好欄位時仍可用 */
let _incomingSpot = null;

/* 把分享的整段文字解析成 { name, addr, url }
   常見格式：
     台北101\nhttps://maps.app.goo.gl/xxxx
     Check out 台北101 on Google Maps: https://maps.app.goo.gl/xxxx
     在 Google 地圖上查看「台北101」：https://maps.app.goo.gl/xxxx */
function _parseSharedPlaceText(raw) {
  let text = String(raw || '').replace(/\r/g, '').trim();
  if (!text) return null;

  // 取出網址
  let url = '';
  const m = text.match(/https?:\/\/[^\s]+/);
  if (m) { url = m[0]; text = text.replace(m[0], ' '); }

  // 優先抓引號「」『』"" 內的名稱
  let name = '';
  const q = text.match(/[「『“"]([^」』”"]{1,80})[」』”"]/);
  if (q) name = q[1];

  if (!name) {
    // 去掉常見的分享句型前後綴
    let t = text
      .replace(/check out\s+/ig, '')
      .replace(/\s+on google maps.*$/ig, '')
      .replace(/在\s*google\s*地圖(上)?查看/ig, '')
      .replace(/google\s*地圖/ig, '')
      .replace(/[:：]\s*$/g, '');
    // 取第一行非空、且不是網址的文字
    const line = t.split('\n').map(x => x.trim())
                  .find(x => x && !/^https?:\/\//i.test(x));
    name = line || '';
  }

  name = name.replace(/^[「『“"]+|[」』”"：:]+$/g, '').trim();
  return { name, url, addr: '' };
}

(function parseIncomingSpot() {
  try {
    const p = new URLSearchParams(location.search);
    if (p.get('diary') || p.get('share')) return;          // 分享檢視模式，不處理

    const rawText = p.get('spotText');
    let s = null;
    if (rawText) {
      s = _parseSharedPlaceText(rawText);
      // 若捷徑另外帶了乾淨網址，優先採用
      const explicitUrl = (p.get('spotUrl') || '').trim();
      if (s && explicitUrl) s.url = explicitUrl;
    } else {
      const name = (p.get('spotName') || '').trim();
      const url  = (p.get('spotUrl')  || '').trim();
      const addr = (p.get('spotAddr') || '').trim();
      if (name || url) s = { name, url, addr };
    }

    if (!s || (!s.name && !s.url)) return;
    _incomingSpot = s;
    history.replaceState(null, '', location.pathname);      // 清網址，避免重整重複匯入
  } catch (e) {}
})();

function applyIncomingSpot() {
  if (!_incomingSpot || !currentTripId || !data || !Array.isArray(data.spots)) return;
  const s = _incomingSpot; _incomingSpot = null;

  const hasName = !!(s.name && s.name.trim());
  const spot = {
    id: uid(), source: '地圖匯入',
    name: hasName ? s.name.trim() : '待命名地點',
    type: '景點', day: '',
    addr: s.addr || '',
    memo: '',
    note: s.url ? `地圖連結：${s.url}` : '',
    krName: '', krAddress: ''
  };
  data.spots.push(spot);
  save();

  if (typeof go === 'function') go('spots');
  // 名稱抓不到（只有連結）時，打開編輯讓使用者一鍵命名；抓得到就直接完成
  if (hasName) {
    toast('已加入口袋景點：' + spot.name);
  } else {
    toast('已加入景點，請確認名稱');
    if (typeof openEditSheet === 'function') setTimeout(() => openEditSheet('spot', spot.id), 300);
  }
}

/* ── 啟動 ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

/* ── PWA Service Worker ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

/* ── PWA 自動更新 ──
   開啟／切回前景時，向伺服器（no-store）比對 config.js 內的 APP_VERSION。
   有新版 → 彈窗讓使用者選「立即更新／稍後」；更新時清快取 + 更新 SW，確保抓到新版。 */
const PENDING_UPDATE_KEY = 'janeselect_pending_update';
let _updateChecking   = false;
let _updatePrompted   = false;   // 目前是否正顯示更新彈窗
let _promptVersion    = '';      // 彈窗顯示的新版本
let _dismissedVersion = '';      // 使用者按「稍後」的版本（本次 session 不再自動提示）

async function checkForUpdate(opts = {}) {
  const manual = !!opts.manual;
  if (_updateChecking) return;
  _updateChecking = true;
  try {
    const res = await fetch('./config.js?_=' + Date.now(), { cache: 'no-store' });
    const txt = await res.text();
    const m   = txt.match(/APP_VERSION\s*=\s*'([^']+)'/);
    if (m && m[1] && m[1] !== APP_VERSION) {
      if (manual || m[1] !== _dismissedVersion) showUpdatePrompt(m[1]);
    } else if (manual) {
      toast('已是最新版本 ' + APP_VERSION);
    }
  } catch (e) {
    if (manual) toast('檢查更新失敗，請確認網路');
  }
  _updateChecking = false;
}

function _ensureUpdateModal() {
  let modal = document.getElementById('updateModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'updateModal';
    modal.className = 'updateModal';
    document.body.appendChild(modal);
  }
  return modal;
}

function showUpdatePrompt(newVer) {
  if (_updatePrompted) return;
  _updatePrompted = true;
  _promptVersion  = newVer;
  const modal = _ensureUpdateModal();
  modal.innerHTML = `
    <div class="updateBox" id="updateBox">
      <div class="updateIcon">🎉</div>
      <h3>有新版本</h3>
      <p>可更新到 <b>${esc(newVer)}</b>（目前 ${esc(APP_VERSION)}），取得最新功能與修正。</p>
      <div class="btns">
        <button class="btn dark" onclick="doAppUpdate('${esc(newVer)}')">立即更新</button>
        <button class="btn soft" onclick="dismissUpdate()">稍後</button>
      </div>
    </div>`;
  modal.classList.add('show');
}

function dismissUpdate() {
  document.getElementById('updateModal')?.classList.remove('show');
  _dismissedVersion = _promptVersion;   // 這個版本本次 session 不再自動彈
  _updatePrompted = false;
}

async function doAppUpdate(newVer) {
  const box = document.getElementById('updateBox');
  if (box) box.innerHTML = `
    <div class="updateSpinner"></div>
    <h3>更新中…</h3>
    <p>正在取得最新版本，請稍候</p>`;
  try { localStorage.setItem(PENDING_UPDATE_KEY, newVer); } catch (e) {}
  // 更新 Service Worker + 清掉所有快取，確保重載時抓到全新檔案
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (e) {}
  setTimeout(() => location.reload(), 500);
}

function showUpdateDone(ver) {
  const modal = _ensureUpdateModal();
  modal.innerHTML = `
    <div class="updateBox">
      <div class="updateIcon">✅</div>
      <h3>更新完成</h3>
      <p>已更新到最新版 <b>${esc(ver)}</b></p>
      <div class="btns"><button class="btn dark" onclick="dismissUpdate()">確認</button></div>
    </div>`;
  modal.classList.add('show');
  _updatePrompted = true;
}

// 重載後：若剛完成更新，顯示「更新完成」；若沒更新成功則再檢查
function _confirmUpdateAfterReload() {
  let pending = null;
  try { pending = localStorage.getItem(PENDING_UPDATE_KEY); } catch (e) {}
  if (!pending) return;
  try { localStorage.removeItem(PENDING_UPDATE_KEY); } catch (e) {}
  if (pending === APP_VERSION) {
    setTimeout(() => showUpdateDone(APP_VERSION), 700);
  } else {
    // 沒吃到新版 → 再檢查一次（會再彈更新）
    setTimeout(() => checkForUpdate(), 1500);
  }
}

// 開啟即檢查（涵蓋 index.html 被快取、版本落後的情況）
window.addEventListener('load', () => {
  _confirmUpdateAfterReload();
  setTimeout(() => checkForUpdate(), 1200);
});

// 切回前景再檢查（PWA 常喚醒舊頁面）
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate();
});
