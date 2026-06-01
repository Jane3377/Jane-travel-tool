/* ── main.js：啟動入口 ── */

async function v63LoadWhitelistFromCloud() {
  try {
    if (!fbDb) return;
    const snap = await fbDb.collection("allowedUsers").get();
    if (!snap.empty) {
      const emails = [];
      snap.forEach(doc => emails.push(doc.id.toLowerCase()));
      V63_ALLOWED_EMAILS = emails;
      if (!V63_ALLOWED_EMAILS.includes(V63_ADMIN_EMAIL)) {
        V63_ALLOWED_EMAILS.push(V63_ADMIN_EMAIL);
      }
    }
  } catch (e) {
    console.warn("白名單讀取失敗，使用內建清單", e.message);
  }
}

// 啟動：確保所有模組載入完畢後才執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    init();
    v63Boot();
  });
} else {
  init();
  v63Boot();
}
