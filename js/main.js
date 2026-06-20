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
