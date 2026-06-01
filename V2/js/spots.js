/* ================================================================
   spots.js — 口袋景點
   ================================================================ */

function saveSpot() {
  if (!$('sn')?.value) return toast('請輸入景點名稱');

  const item = {
    name:  $('sn').value,
    type:  $('st')?.value || '景點',
    day:   $('sd')?.value || '',
    addr:  $('sa')?.value || '',
    memo:  $('sm')?.value || '',
    start: $('sStart')?.value || '',
    end:   $('sEnd')?.value   || ''
  };

  if (editingSpotId) {
    Object.assign(data.spots.find(s => s.id === editingSpotId), item);
    editingSpotId = null;
  } else {
    const spot = { id: uid(), ...item, source: '手動' };
    data.spots.push(spot);

    // 同步排入行程
    if ($('sToPlan')?.value === 'yes') {
      const planDay = item.day || currentDay;
      const plan = {
        id: uid(), source: 'spot', sourceType: 'spot', lockedName: true,
        day: planDay,
        start: item.start || '10:00',
        end:   item.end   || '11:30',
        type:  normalizePlanType(item.type),
        name:  item.name,
        address: item.addr || '',
        note:  item.memo || '',
        memo:  '由口袋景點帶入',
        mode: 'foreign', foreign: 0, twd: 0, payer: '未定', payMethod: '未定',
        adjusted: false
      };
      data.plans.push(plan);
      spot.planId = plan.id;
      data.expenses.push({
        id: uid(), source: '行程',
        type: budgetTypeFromPlanType(item.type),
        name: item.name, payer: '未定', payMethod: '未定',
        day: planDay, mode: 'TWD', foreign: 0, twd: 0,
        memo: `由${item.type}行程建立`
      });
    }
  }
  save();
}

function editSpot(id) {
  editingSpotId = id;
  renderSpots();
  scrollTo(0, 0);
}

function deleteSpot(id) {
  if (!confirm('確定刪除景點？')) return;
  data.spots = data.spots.filter(s => s.id !== id);
  if (editingSpotId === id) editingSpotId = null;
  save();
}

function clearSpotForm() {
  editingSpotId = null;
  renderSpots();
}

function mapSpotDraft() {
  const q = (($('sn')?.value || '') + ' ' + ($('sa')?.value || '') + ' ' + data.trip.dest).trim();
  if (!$('sn')?.value) return toast('請先輸入景點名稱');
  openMap(encodeURIComponent(q));
}

function useSpot(id) {
  const s = data.spots.find(x => x.id === id);
  if (!s) return;
  v16PendingSpotId = id;
  editingPlanId    = null;
  go('planner');
  setTimeout(() => {
    const form = document.querySelector('#plannerView details.card');
    if (form) form.setAttribute('open', '');
    fillFromSpot(id);
    scrollTo(0, 0);
  }, 80);
}

function returnSpotToPocket(id) {
  const s = data.spots.find(x => x.id === id);
  if (!s?.planId) return;
  if (!confirm('要把景點放回口袋，並移除已排入的行程嗎？')) return;
  data.plans = data.plans.filter(p => p.id !== s.planId);
  data.conns = data.conns.filter(c => c.a !== s.planId && c.b !== s.planId);
  delete s.planId;
  save();
}

function spotPlanExists(s) {
  return !!(s.planId && data.plans.some(p => p.id === s.planId));
}

function importSpotFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let text = e.target.result.trim();
      // 清理 markdown code block
      text = text.replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const first = text.indexOf('{'), last = text.lastIndexOf('}');
      if (first >= 0 && last > first) text = text.slice(first, last + 1);

      const obj   = JSON.parse(text);
      const spots = Array.isArray(obj.spots) ? obj.spots : (Array.isArray(obj) ? obj : []);
      let cleared = 0;

      spots.forEach(s => {
        if (!s.name) return;
        const day = (s.day && data.days.some(d => d.key === s.day)) ? s.day : '';
        if (s.day && !day) cleared++;
        data.spots.push({
          id: uid(), source: 'AI匯入',
          name:  String(s.name  || ''),
          type:  String(s.type  || '景點'),
          day,
          addr:  String(s.addr  || s.address || ''),
          memo:  String(s.memo  || s.note    || ''),
          start: String(s.start || ''),
          end:   String(s.end   || '')
        });
      });

      save();
      toast(cleared
        ? `已匯入 ${spots.length} 個景點；${cleared} 個日期超出旅程已清空`
        : `已匯入 ${spots.length} 個景點`);
    } catch (err) {
      alert('匯入失敗：請確認內容是合法的 JSON 格式，且包含 spots 陣列。\n\n錯誤：' + err.message);
    }
  };
  reader.readAsText(file);
}
