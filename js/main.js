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
