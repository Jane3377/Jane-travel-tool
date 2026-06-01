/* ── spots.js ── */

function spotPlanExists(s){return!!(s.planId&&data.plans.some(p=>p.id==s.planId))}
function returnSpotToPocket(id){const s=data.spots.find(x=>x.id==id);if(!s||!s.planId)return;if(!confirm("要把這個景點放回口袋，並移除已排入的行程嗎？"))return;data.plans=data.plans.filter(p=>p.id!=s.planId);data.conns=data.conns.filter(c=>c.a!=s.planId&&c.b!=s.planId);delete s.planId;save()}
function useSpot(id){let s=data.spots.find(x=>x.id==id);if(!s)return;setCurrentDay(s.day||currentDay||cur,{render:false});v16PendingSpotId=id;editingPlanId=null;go("planner");setTimeout(()=>{const form=document.querySelector("#plannerView details.card");if(form)form.setAttribute("open","");v16FillPendingSpot();scrollTo(0,0)},80)}
function editSpot(id){editingSpotId=id;renderSpots();scrollTo(0,0)}
function delSpot(id){if(!confirm("確定刪除景點？"))return;data.spots=data.spots.filter(x=>x.id!=id);if(editingSpotId==id)editingSpotId=null;save()}
function clearSpotForm(){editingSpotId=null;renderSpots()}
function mapSpotDraft(){const q=($("sn").value+" "+$("sa").value+" "+data.trip.dest).trim();if(!$("sn").value)return toast("請先輸入景點名稱");map(encodeURIComponent(q))}

/* v645 最終版 saveSpot（含時間欄位 + v23 正規化） */
function v645TimeValue(v,fallback=""){const t=String(v||"").trim();const m=t.match(/^(\d{1,2}):(\d{2})/);if(!m)return fallback;const h=String(Math.min(23,Math.max(0,Number(m[1])))).padStart(2,"0");const mm=String(Math.min(59,Math.max(0,Number(m[2])))).padStart(2,"0");return`${h}:${mm}`}
function importSpotFile(file){if(!file)return;const r=new FileReader();r.onload=e=>{try{const obj=JSON.parse(normalizeImportedJsonText(e.target.result));const spots=Array.isArray(obj.spots)?obj.spots:(Array.isArray(obj)?obj:[]);let cleared=0;spots.forEach(s=>{if(!s.name)return;const rawDay=String(s.day||"");const safeDay=v23NormalizeSpotDate(rawDay);if(rawDay&&!safeDay)cleared++;data.spots.push({id:uid(),name:String(s.name||""),type:String(s.type||"景點"),day:safeDay,start:String(s.start||""),end:String(s.end||""),addr:String(s.addr||s.address||""),memo:String(s.memo||s.note||""),krName:String(s.krName||s.kr_name||""),krAddress:String(s.krAddress||s.kr_address||""),source:"AI匯入"})});save();toast(cleared>0?`已匯入 ${spots.length} 個口袋景點；${cleared} 個日期超出旅程，已改為未排`:`已匯入 ${spots.length} 個口袋景點`)}catch(err){alert("匯入失敗：請確認 TXT 內容是純 JSON，且包含 spots。")}};r.readAsText(file)}

/* 範例資料 */
function renderSpots(){const e=editingSpotId?data.spots.find(s=>s.id==editingSpotId):null;$("spotsView").innerHTML=`<div class="section"><div><h2>📍 口袋景點</h2><div class="hint">可手動新增，也可以用 AI 產出 TXT/JSON 後匯入。</div></div><button class="iconBtn smallIcon" onclick="clearSpotForm();setTimeout(()=>document.querySelector('#spotsView details.card')?.setAttribute('open',''),0)">＋</button></div>
<div class="card"><div class="btns">
  <button class="btn pink compact" onclick="showAIPrompt()">AI 景點提示詞</button>
  <label class="btn blue compact" style="display:inline-block">匯入口袋景點<input type="file" accept=".json,application/json,.txt,text/plain" onchange="importSpotFile(this.files[0])" style="display:none"></label>
</div></div>
<details class="card" ${e?"open":""}><summary>${e?"編輯口袋景點":"＋ 新增口袋景點"}</summary><div class="detailBody">
  <div class="three compactMobile">
    <div class="full"><label>名稱</label><input id="sn" value="${esc(e?.name||"")}"></div>
    <div><label>分類</label><select id="st">${["景點","餐廳","咖啡廳","購物","雨天備案","其他"].map(t=>`<option ${e?.type==t?"selected":""}>${t}</option>`).join("")}</select></div>
    <div><label>候選日期</label><select id="sd"><option value="">未排</option>${optsDays(e?.day||"")}</select></div>
  </div>
  <label>地址 / 區域</label>
  <div class="two"><input id="sa" value="${esc(e?.addr||"")}"><button class="btn blue compact" onclick="mapSpotDraft()">查地圖</button></div>
  <label>注意事項</label><textarea id="sm">${esc(e?.memo||"")}</textarea>
  <div class="three compactMobile">
    <div class="full"><label>排入行程？</label><select id="sToPlan"><option value="no">先放口袋</option><option value="yes">同步排入行程</option></select></div>
    <div><label>預設開始</label><input id="sStart" type="time" value="${esc(e?.start||"10:00")}"></div>
    <div><label>預設結束</label><input id="sEnd" type="time" value="${esc(e?.end||"11:30")}"></div>
  </div>
  <div class="btns">
    <button class="btn dark" onclick="saveSpot()">${e?"儲存景點修改":"加入景點"}</button>
    ${e?'<button class="btn soft" onclick="clearSpotForm()">取消編輯</button>':""}
  </div>
</div></details>
<div class="grid2">${data.spots.map(s=>{const hasP=spotPlanExists(s);return`<div class="card ${hasP?"spotUsed":""}"><div class="time">${s.day?dayTitle(s.day):"未排"}${s.start?` ${esc(s.start)}`:""}</div><div class="place">${activityIcon(s.type)} ${esc(s.name)}</div><div class="tags"><span class="tag">${esc(s.type)}</span><span class="tag blue">${esc(s.addr)}</span>${s.source==="AI匯入"?'<span class="tag green">📥 AI 匯入</span>':""}</div><div class="box pink">${esc(s.memo)}</div><div class="btns">${hasP?`<button class="btn soft compact" onclick="returnSpotToPocket('${s.id}')">放回口袋</button>`:`<button class="btn soft compact" onclick="useSpot('${s.id}')">排入行程</button>`}<button class="btn blue compact" onclick="map('${encodeURIComponent(s.name+" "+(s.addr||data.trip.dest))}')">地圖</button><button class="small" onclick="editSpot('${s.id}')">編輯</button><button class="small" onclick="delSpot('${s.id}')">刪除</button></div></div>`}).join("")||'<div class="empty">尚未加入口袋景點</div>'}</div>`}

/* ── renderBudget（卡片式，最終版） ── */
