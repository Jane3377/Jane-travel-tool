/* ── main.js：啟動入口（最後載入） ── */

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

function startup() {
  // 1. 載入本機資料
  data = loadData();
  cur = data.days?.[0]?.key || data.trip?.start || "";
  currentDay = cur;
  // 2. 初始化 UI
  init();
  // 3. 啟動 Firebase + 旅程系統
  v63Boot();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startup);
} else {
  startup();
}
