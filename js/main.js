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
   裝到主畫面的 PWA 沒有重新整理鈕，iOS 切回前景常喚醒舊頁面。
   切回前景時比對 config.js 內的 APP_VERSION，有新版就自動重載。 */
let _updateChecking = false;
async function checkForUpdate(opts = {}) {
  const manual = !!opts.manual;
  if (_updateChecking) return;
  _updateChecking = true;
  try {
    const res = await fetch('./config.js', { cache: 'no-store' });
    const txt = await res.text();
    const m   = txt.match(/APP_VERSION\s*=\s*'([^']+)'/);
    if (m && m[1] && m[1] !== APP_VERSION) {
      toast('有新版本，更新中…');
      setTimeout(() => location.reload(), 600);
      return;   // 重載後 _updateChecking 自然重置
    }
    if (manual) toast('已是最新版本 ' + APP_VERSION);
  } catch (e) {
    if (manual) toast('檢查更新失敗，請確認網路');
  }
  _updateChecking = false;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate();
});
