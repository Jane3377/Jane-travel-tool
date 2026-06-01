/* ── main.js：初始化、v63Boot、啟動 ── */

function initBase() {
  base = {
    meta: { title: "我的旅程手帳", subtitle: "把想去的地方都收進來，慢慢排成一趟期待出發的旅行。", bookStyle: "fresh" },
    trip: { dest: "韓國釜山", country: "韓國", currency: "KRW", start: "", end: "", rate: .023, travelerCount: 2, travelers: ["A", "B"] },
    days: [], flights: { out: {}, back: {} }, hotels: [], expenses: [], spots: [],
    plans: [], conns: [],
    packing: pack0.map(x => ({ id: uid(), type: x[0], name: x[1], note: x[2], checked: false })),
    packView: "pre", photos: [], dayCovers: {}
  };
}

/* 啟動（放在最末尾確保所有函式定義完畢） */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    initBase();
    data = loadData();
    cur = data.days[0]?.key || data.trip.start || "";
    init();
    v63Boot();
  });
} else {
  initBase();
  data = loadData();
  cur = data.days[0]?.key || data.trip.start || "";
  init();
  v63Boot();
}
