/* ── spots.js：口袋景點 ── */
function renderSpots(){const e=editingSpotId?data.spots.find(s=>s.id==editingSpotId):null;$("spotsView").innerHTML=`<div class="section"><div><h2>口袋景點</h2><div class="hint">新增時可以直接查地圖，也可以選擇是否立即排入行程。</div></div><button class="iconBtn smallIcon" onclick="clearSpotForm()">＋</button></div><div class="card"><div class="three"><div><label>名稱</label><input id="sn" value="${esc(e?.name||"")}"></div><div><label>分類</label><select id="st">${["景點","餐廳","咖啡廳","購物","雨天備案","其他"].map(t=>`<option ${e?.type==t?"selected":""}>${t}</option>`).join("")}</select></div><div><label>候選日期</label><select id="sd"><option value="">未排</option>${optsDays(e?.day||"")}</select></div></div><label>地址 / 區域</label><div class="two"><input id="sa" value="${esc(e?.addr||"")}"><button class="btn blue" onclick="mapSpotDraft()">查地圖</button></div><label>注意事項</label><textarea id="sm">${esc(e?.memo||"")}</textarea><div class="three"><div><label>排入行程？</label><select id="sToPlan"><option value="no">先放口袋</option><option value="yes">同步排入行程</option></select></div><div><label>預設開始</label><input id="sStart" type="time" value="10:00"></div><div><label>預設結束</label><input id="sEnd" type="time" value="11:30"></div></div><div class="btns"><button class="btn dark" onclick="saveSpot()">${e?"儲存景點修改":"加入景點"}</button>${e?'<button class="btn soft" onclick="clearSpotForm()">取消編輯</button>':""}</div></div><div class="grid2">${data.spots.map(s=>`<div class="card"><div class="time">${s.day?dayTitle(s.day):"未排"}</div><div class="place">${esc(s.name)}</div><div class="tags"><span class="tag">${esc(s.type)}</span><span class="tag blue">${esc(s.addr)}</span></div><div class="box pink">${esc(s.memo)}</div><div class="btns"><button class="btn soft" onclick="useSpot('${s.id}')">排入行程</button><button class="btn blue" onclick="map('${encodeURIComponent(s.name+' '+(s.addr||data.trip.dest))}')">地圖</button><button class="small" onclick="editSpot('${s.id}')">編輯</button><button class="small" onclick="delSpot('${s.id}')">刪除</button></div></div>`).join("")||'<div class="empty">尚未加入口袋景點</div>'}</div>`}
function mapSpotDraft(){const q=($("sn").value+" "+$("sa").value+" "+data.trip.dest).trim();if(!$("sn").value)return toast("請先輸入景點名稱");map(encodeURIComponent(q))}function clearSpotForm(){editingSpotId=null;renderSpots()}function saveSpot(){if(!$("sn").value)return toast("請輸入名稱");const item={name:$("sn").value,type:$("st").value,day:$("sd").value,addr:$("sa").value,memo:$("sm").value};let id=editingSpotId;if(id){Object.assign(data.spots.find(x=>x.id==id),item);editingSpotId=null}else{id=uid();data.spots.push({id,...item})}if($("sToPlan").value==="yes"){let day=item.day||cur;data.plans.push({id:uid(),day,start:$("sStart").value,end:$("sEnd").value,type:["景點","餐廳","咖啡廳","購物","其他"].includes(item.type)?item.type:"景點",name:item.name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:item.memo,memo:"由口袋景點帶入",adjusted:false})}save()}function editSpot(id){editingSpotId=id;renderSpots();scrollTo(0,0)}function delSpot(id){if(!confirm("確定刪除景點？"))return;data.spots=data.spots.filter(x=>x.id!=id);if(editingSpotId==id)editingSpotId=null;save()}function useSpot(id){let s=data.spots.find(x=>x.id==id);go("planner");setTimeout(()=>{editingPlanId=null;renderPlanner();setTimeout(()=>{$("pday").value=s.day||cur;$("ptype").value=["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點";$("pname").value=s.name;$("pnote").value=s.memo},20)},20)}
function renderSpots(){
  const e=editingSpotId?data.spots.find(s=>s.id==editingSpotId):null;
  $("spotsView").innerHTML=`<div class="section"><div><h2>📍 口袋景點</h2><div class="hint">新增時可以直接查地圖，也可以選擇是否立即排入行程。</div></div><button class="iconBtn smallIcon" onclick="clearSpotForm()">＋</button></div>
  <div class="card"><div class="three"><div><label>名稱</label><input id="sn" value="${esc(e?.name||"")}"></div><div><label>分類</label><select id="st">${["景點","餐廳","咖啡廳","購物","雨天備案","其他"].map(t=>`<option ${e?.type==t?"selected":""}>${t}</option>`).join("")}</select></div><div><label>候選日期</label><select id="sd"><option value="">未排</option>${optsDays(e?.day||"")}</select></div></div>
  <label>地址 / 區域</label><div class="two"><input id="sa" value="${esc(e?.addr||"")}"><button class="btn blue compact" onclick="mapSpotDraft()">查地圖</button></div>
  <label>注意事項</label><textarea id="sm">${esc(e?.memo||"")}</textarea>
  <div class="three"><div><label>排入行程？</label><select id="sToPlan"><option value="no">先放口袋</option><option value="yes">同步排入行程</option></select></div><div><label>預設開始</label><input id="sStart" type="time" value="10:00"></div><div><label>預設結束</label><input id="sEnd" type="time" value="11:30"></div></div>
  <div class="btns"><button class="btn dark" onclick="saveSpot()">${e?"儲存景點修改":"加入景點"}</button>${e?'<button class="btn soft" onclick="clearSpotForm()">取消編輯</button>':""}</div></div>
  <div class="grid2">${data.spots.map(s=>`<div class="card"><div class="time">${s.day?dayTitle(s.day):"未排"}</div><div class="place">${activityIcon(s.type)} ${esc(s.name)}</div><div class="tags"><span class="tag">${esc(s.type)}</span><span class="tag blue">${esc(s.addr)}</span></div><div class="box pink">${esc(s.memo)}</div><div class="btns"><button class="btn soft compact" onclick="useSpot('${s.id}')">排入行程</button><button class="btn blue compact" onclick="map('${encodeURIComponent(s.name+' '+(s.addr||data.trip.dest))}')">地圖</button><button class="small" onclick="editSpot('${s.id}')">編輯</button><button class="small" onclick="delSpot('${s.id}')">刪除</button></div></div>`).join("")||'<div class="empty">尚未加入口袋景點</div>'}</div>`;
}
function normalizeImportedJsonText(text){
  let t=text.trim();
  if(t.startsWith("```")){
    t=t.replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();
  }
  const first=t.indexOf("{"), last=t.lastIndexOf("}");
  if(first>=0&&last>first)t=t.slice(first,last+1);
  return t;
}
function normalizeImportedJsonText(text){
  let t=text.trim();
  if(t.startsWith("```"))t=t.replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();
  const first=t.indexOf("{"),last=t.lastIndexOf("}");
  if(first>=0&&last>first)t=t.slice(first,last+1);
  return t;
}
function importSpotFile(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const obj=JSON.parse(normalizeImportedJsonText(e.target.result));
      const spots=Array.isArray(obj.spots)?obj.spots:(Array.isArray(obj)?obj:[]);
      spots.forEach(s=>{
        if(!s.name)return;
        data.spots.push({id:uid(),name:String(s.name||""),type:String(s.type||"景點"),day:String(s.day||""),addr:String(s.addr||s.address||""),memo:String(s.memo||s.note||"")});
      });
      save();
      toast(`已匯入 ${spots.length} 個口袋景點`);
    }catch(err){
      alert("匯入失敗：請確認 TXT 內容是純 JSON，且包含 spots。");
    }
  };
  r.readAsText(file);
}
function renderSpots(){
  const e=editingSpotId?data.spots.find(s=>s.id==editingSpotId):null;
  $("spotsView").innerHTML=`<div class="section"><div><h2>📍 口袋景點</h2><div class="hint">可手動新增，也可以產出 AI 提示詞後匯入口袋景點 TXT/JSON。</div></div><button class="iconBtn smallIcon" onclick="clearSpotForm()">＋</button></div>
  <div class="card"><div class="btns"><button class="btn pink compact" onclick="generateSpotAIPrompt()">AI 景點提示詞</button><label class="btn blue compact" style="display:inline-block">匯入口袋景點<input type="file" accept=".json,application/json,.txt,text/plain" onchange="importSpotFile(this.files[0])" style="display:none"></label></div></div>
  <div class="card"><div class="three"><div><label>名稱</label><input id="sn" value="${esc(e?.name||"")}"></div><div><label>分類</label><select id="st">${["景點","餐廳","咖啡廳","購物","雨天備案","其他"].map(t=>`<option ${e?.type==t?"selected":""}>${t}</option>`).join("")}</select></div><div><label>候選日期</label><select id="sd"><option value="">未排</option>${optsDays(e?.day||"")}</select></div></div>
  <label>地址 / 區域</label><div class="two"><input id="sa" value="${esc(e?.addr||"")}"><button class="btn blue compact" onclick="mapSpotDraft()">查地圖</button></div>
  <label>注意事項</label><textarea id="sm">${esc(e?.memo||"")}</textarea>
  <div class="three"><div><label>排入行程？</label><select id="sToPlan"><option value="no">先放口袋</option><option value="yes">同步排入行程</option></select></div><div><label>預設開始</label><input id="sStart" type="time" value="10:00"></div><div><label>預設結束</label><input id="sEnd" type="time" value="11:30"></div></div>
  <div class="btns"><button class="btn dark" onclick="saveSpot()">${e?"儲存景點修改":"加入景點"}</button>${e?'<button class="btn soft" onclick="clearSpotForm()">取消編輯</button>':""}</div></div>
  <div class="grid2">${data.spots.map(s=>`<div class="card"><div class="time">${s.day?dayTitle(s.day):"未排"}</div><div class="place">${activityIcon(s.type)} ${esc(s.name)}</div><div class="tags"><span class="tag">${esc(s.type)}</span><span class="tag blue">${esc(s.addr)}</span></div><div class="box pink">${esc(s.memo)}</div><div class="btns"><button class="btn soft compact" onclick="useSpot('${s.id}')">排入行程</button><button class="btn blue compact" onclick="map('${encodeURIComponent(s.name+' '+(s.addr||data.trip.dest))}')">地圖</button><button class="small" onclick="editSpot('${s.id}')">編輯</button><button class="small" onclick="delSpot('${s.id}')">刪除</button></div></div>`).join("")||'<div class="empty">尚未加入口袋景點</div>'}</div>`;
}
function importSpotFile(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const obj=JSON.parse(finalCleanJson(e.target.result));
      const spots=Array.isArray(obj.spots)?obj.spots:(Array.isArray(obj)?obj:[]);
      spots.forEach(s=>{
        if(!s.name)return;
        data.spots.push({id:uid(),name:String(s.name||""),type:String(s.type||"景點"),day:String(s.day||""),addr:String(s.addr||s.address||""),memo:String(s.memo||s.note||""),source:"AI匯入"});
      });
      save();
      toast(`已匯入 ${spots.length} 個口袋景點`);
    }catch(err){alert("匯入失敗：請確認 TXT/JSON 內容是純 JSON，且包含 spots。");}
  };
  r.readAsText(file);
}
function renderSpots(){
  const e=editingSpotId?data.spots.find(s=>s.id==editingSpotId):null;
  $("spotsView").innerHTML=`<div class="section"><div><h2>📍 口袋景點</h2><div class="hint">可手動新增，也可以用 AI 產出 TXT/JSON 後匯入。</div></div><button class="iconBtn smallIcon" onclick="clearSpotForm()">＋</button></div>
  <div class="card"><div class="btns"><button class="btn pink compact" onclick="showSpotPrompt()">AI 景點提示詞</button><label class="btn blue compact" style="display:inline-block">匯入口袋景點<input type="file" accept=".json,application/json,.txt,text/plain" onchange="importSpotFile(this.files[0])" style="display:none"></label></div></div>
  <div class="card"><div class="three"><div><label>名稱</label><input id="sn" value="${esc(e?.name||"")}"></div><div><label>分類</label><select id="st">${["景點","餐廳","咖啡廳","購物","雨天備案","其他"].map(t=>`<option ${e?.type==t?"selected":""}>${t}</option>`).join("")}</select></div><div><label>候選日期</label><select id="sd"><option value="">未排</option>${optsDays(e?.day||"")}</select></div></div>
  <label>地址 / 區域</label><div class="two"><input id="sa" value="${esc(e?.addr||"")}"><button class="btn blue compact" onclick="mapSpotDraft()">查地圖</button></div>
  <label>注意事項</label><textarea id="sm">${esc(e?.memo||"")}</textarea>
  <div class="three"><div><label>排入行程？</label><select id="sToPlan"><option value="no">先放口袋</option><option value="yes">同步排入行程</option></select></div><div><label>預設開始</label><input id="sStart" type="time" value="10:00"></div><div><label>預設結束</label><input id="sEnd" type="time" value="11:30"></div></div>
  <div class="btns"><button class="btn dark" onclick="saveSpot()">${e?"儲存景點修改":"加入景點"}</button>${e?'<button class="btn soft" onclick="clearSpotForm()">取消編輯</button>':""}</div></div>
  <div class="grid2">${data.spots.map(s=>`<div class="card"><div class="time">${s.day?dayTitle(s.day):"未排"}</div><div class="place">${esc(s.name)}</div><div class="tags"><span class="tag">${esc(s.type)}</span><span class="tag blue">${esc(s.addr)}</span>${s.source==="AI匯入"?'<span class="tag green">📥 AI 匯入</span>':""}</div><div class="box pink">${esc(s.memo)}</div><div class="btns"><button class="btn soft compact" onclick="useSpot('${s.id}')">排入行程</button><button class="btn blue compact" onclick="map('${encodeURIComponent(s.name+' '+(s.addr||data.trip.dest))}')">地圖</button><button class="small" onclick="editSpot('${s.id}')">編輯</button><button class="small" onclick="delSpot('${s.id}')">刪除</button></div></div>`).join("")||'<div class="empty">尚未加入口袋景點</div>'}</div>`;
}
function renderSpots(){
  const e=editingSpotId?data.spots.find(s=>s.id==editingSpotId):null;
  $("spotsView").innerHTML=`<div class="section"><div><h2>📍 口袋景點</h2><div class="hint">可手動新增，也可以用 AI 產出 TXT/JSON 後匯入。</div></div><button class="iconBtn smallIcon" onclick="clearSpotForm(); setTimeout(()=>document.querySelector('#spotsView details.card')?.setAttribute('open',''),0)">＋</button></div>
  <div class="card"><div class="btns"><button class="btn pink compact" onclick="showAIPrompt()">AI 景點提示詞</button><label class="btn blue compact" style="display:inline-block">匯入口袋景點<input type="file" accept=".json,application/json,.txt,text/plain" onchange="importSpotFile(this.files[0])" style="display:none"></label></div></div>
  <details class="card" ${showSpotFormOpenAttr()}><summary>${e?"編輯口袋景點":"＋ 新增口袋景點"}</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>名稱</label><input id="sn" value="${esc(e?.name||"")}"></div>
      <div><label>分類</label><select id="st">${["景點","餐廳","咖啡廳","購物","雨天備案","其他"].map(t=>`<option ${e?.type==t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div><label>候選日期</label><select id="sd"><option value="">未排</option>${optsDays(e?.day||"")}</select></div>
    </div>
    <label>地址 / 區域</label><div class="two"><input id="sa" value="${esc(e?.addr||"")}"><button class="btn blue compact" onclick="mapSpotDraft()">查地圖</button></div>
    <label>注意事項</label><textarea id="sm">${esc(e?.memo||"")}</textarea>
    <div class="three compactMobile">
      <div class="full"><label>排入行程？</label><select id="sToPlan"><option value="no">先放口袋</option><option value="yes">同步排入行程</option></select></div>
      <div><label>預設開始</label><input id="sStart" type="time" value="10:00"></div>
      <div><label>預設結束</label><input id="sEnd" type="time" value="11:30"></div>
    </div>
    <div class="btns"><button class="btn dark" onclick="saveSpot()">${e?"儲存景點修改":"加入景點"}</button>${e?'<button class="btn soft" onclick="clearSpotForm()">取消編輯</button>':""}</div>
  </div></details>
  <div class="grid2">${data.spots.map(s=>`<div class="card"><div class="time">${s.day?dayTitle(s.day):"未排"}</div><div class="place">${activityIcon(s.type)} ${esc(s.name)}</div><div class="tags"><span class="tag">${esc(s.type)}</span><span class="tag blue">${esc(s.addr)}</span>${s.source==="AI匯入"?'<span class="tag green">📥 AI 匯入</span>':""}</div><div class="box pink">${esc(s.memo)}</div><div class="btns"><button class="btn soft compact" onclick="useSpot('${s.id}')">排入行程</button><button class="btn blue compact" onclick="map('${encodeURIComponent(s.name+' '+(s.addr||data.trip.dest))}')">地圖</button><button class="small" onclick="editSpot('${s.id}')">編輯</button><button class="small" onclick="delSpot('${s.id}')">刪除</button></div></div>`).join("")||'<div class="empty">尚未加入口袋景點</div>'}</div>`;
}

function useSpot(id){
  let s=data.spots.find(x=>x.id==id);
  go("planner");
  setTimeout(()=>{
    editingPlanId=null;
    renderPlanner();
    setTimeout(()=>{
      const form=document.querySelector("#plannerView details.card");
      if(form) form.setAttribute("open","");
      $("pday").value=s.day||cur;
      $("ptype").value=["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點";
      $("pname").value=s.name;
      $("pnote").value=s.memo;
      scrollTo(0,0);
    },50);
  },50);
}

function normalizeImportedJsonText(text){
  let t=text.trim();
  if(t.startsWith("```")) t=t.replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();
  const first=t.indexOf("{"), last=t.lastIndexOf("}");
  if(first>=0&&last>first) t=t.slice(first,last+1);
  return t;
}

function importSpotFile(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const obj=JSON.parse(normalizeImportedJsonText(e.target.result));
      const spots=Array.isArray(obj.spots)?obj.spots:(Array.isArray(obj)?obj:[]);
      spots.forEach(s=>{
        if(!s.name)return;
        data.spots.push({id:uid(),name:String(s.name||""),type:String(s.type||"景點"),day:String(s.day||""),addr:String(s.addr||s.address||""),memo:String(s.memo||s.note||""),source:"AI匯入"});
      });
      save();
      toast(`已匯入 ${spots.length} 個口袋景點`);
    }catch(err){
      alert("匯入失敗：請確認 TXT 內容是純 JSON，且包含 spots。");
    }
  };
  r.readAsText(file);
}

function useSpot(id){
  let s=data.spots.find(x=>x.id==id);
  if(!s)return;
  cur=s.day||cur;
  v16PendingSpotId=id;
  editingPlanId=null;
  go("planner");
  setTimeout(()=>{
    const form=document.querySelector("#plannerView details.card");
    if(form)form.setAttribute("open","");
    v16FillPendingSpot();
    scrollTo(0,0);
  },80);
}

function spotPlanExists(s){
  return !!(s.planId && data.plans.some(p=>p.id==s.planId));
}

function returnSpotToPocket(id){
  const s=data.spots.find(x=>x.id==id);
  if(!s || !s.planId)return;
  if(!confirm("要把這個景點放回口袋，並移除已排入的行程嗎？"))return;
  data.plans=data.plans.filter(p=>p.id!=s.planId);
  data.conns=data.conns.filter(c=>c.a!=s.planId && c.b!=s.planId);
  delete s.planId;
  save();
}

function renderSpots(){
  const e=editingSpotId?data.spots.find(s=>s.id==editingSpotId):null;
  $("spotsView").innerHTML=`<div class="section"><div><h2>📍 口袋景點</h2><div class="hint">已排入行程的景點會變成灰底，也可以放回口袋。</div></div><button class="iconBtn smallIcon" onclick="clearSpotForm(); setTimeout(()=>document.querySelector('#spotsView details.card')?.setAttribute('open',''),0)">＋</button></div>
  <div class="card"><div class="btns"><button class="btn pink compact" onclick="showAIPrompt()">AI 景點提示詞</button><label class="btn blue compact" style="display:inline-block">匯入口袋景點<input type="file" accept=".json,application/json,.txt,text/plain" onchange="importSpotFile(this.files[0])" style="display:none"></label></div></div>
  <details class="card" ${editingSpotId?"open":""}><summary>${e?"編輯口袋景點":"＋ 新增口袋景點"}</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>名稱</label><input id="sn" value="${esc(e?.name||"")}"></div>
      <div><label>分類</label><select id="st">${["景點","餐廳","咖啡廳","購物","雨天備案","其他"].map(t=>`<option ${e?.type==t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div><label>候選日期</label><select id="sd"><option value="">未排</option>${optsDays(e?.day||"")}</select></div>
    </div>
    <label>地址 / 區域</label><div class="two"><input id="sa" value="${esc(e?.addr||"")}"><button class="btn blue compact" onclick="mapSpotDraft()">查地圖</button></div>
    <label>注意事項</label><textarea id="sm">${esc(e?.memo||"")}</textarea>
    <div class="three compactMobile">
      <div class="full"><label>排入行程？</label><select id="sToPlan"><option value="no">先放口袋</option><option value="yes">同步排入行程</option></select></div>
      <div><label>預設開始</label><input id="sStart" type="time" value="10:00"></div>
      <div><label>預設結束</label><input id="sEnd" type="time" value="11:30"></div>
    </div>
    <div class="btns"><button class="btn dark" onclick="saveSpot()">${e?"儲存景點修改":"加入景點"}</button>${e?'<button class="btn soft" onclick="clearSpotForm()">取消編輯</button>':""}</div>
  </div></details>
  <div class="grid2">${data.spots.map(s=>{
    const added=spotPlanExists(s);
    return `<div class="card ${added?"spot-added":""}"><div class="time">${s.day?dayTitle(s.day):"未排"}</div><div class="place">${activityIcon(s.type)} ${esc(s.name)}</div><div class="tags"><span class="tag">${esc(s.type)}</span><span class="tag blue">${esc(s.addr)}</span>${s.source==="AI匯入"?'<span class="tag green">📥 AI 匯入</span>':""}${added?'<span class="tag">已加入行程</span>':""}</div><div class="box pink">${esc(s.memo)}</div><div class="btns">${added?`<button class="btn soft compact" onclick="returnSpotToPocket('${s.id}')">放回口袋</button>`:`<button class="btn soft compact" onclick="useSpot('${s.id}')">排入行程</button>`}<button class="btn blue compact" onclick="map('${encodeURIComponent(s.name+' '+(s.addr||data.trip.dest))}')">地圖</button><button class="small" onclick="editSpot('${s.id}')">編輯</button><button class="small" onclick="delSpot('${s.id}')">刪除</button></div></div>`;
  }).join("")||'<div class="empty">尚未加入口袋景點</div>'}</div>`;
}

function saveSpot(){
  if(!$("sn").value)return toast("請輸入名稱");
  const item={name:$("sn").value,type:$("st").value,day:$("sd").value,addr:$("sa").value,memo:$("sm").value};
  let id=editingSpotId;
  let spot;

  if(id){
    spot=data.spots.find(x=>x.id==id);
    Object.assign(spot,item);
    editingSpotId=null;
  }else{
    id=uid();
    spot={id,...item,source:"手動"};
    data.spots.push(spot);
  }

  if($("sToPlan").value==="yes"){
    const day=item.day||cur;
    const planId=uid();
    data.plans.push({id:planId,day,start:$("sStart").value,end:$("sEnd").value,type:["景點","餐廳","咖啡廳","購物","其他"].includes(item.type)?item.type:"景點",name:item.name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:item.memo,memo:"由口袋景點帶入",adjusted:false});
    spot.planId=planId;
  }
  save();
}
const CLOUDINARY_CONFIG = {
  cloudName: "dtpgutlmt",
  uploadPreset: "travel_book_unsigned",
  folder: "travel-book",
  maxUploadBytes: 10 * 1024 * 1024,
  maxWidth: 1600,
  quality: 0.82
};

function saveSpot(){
  if(!$("sn").value)return toast("請輸入名稱");
  const item={name:$("sn").value,type:$("st").value,day:$("sd").value,addr:$("sa").value,memo:$("sm").value};
  let id=editingSpotId;
  let spot;

  if(id){
    spot=data.spots.find(x=>x.id==id);
    Object.assign(spot,item);
    editingSpotId=null;
  }else{
    id=uid();
    spot={id,...item,source:"手動"};
    data.spots.push(spot);
  }

  if($("sToPlan").value==="yes"){
    const day=item.day||cur;
    const planId=uid();
    data.plans.push({id:planId,sourceType:"spot",lockedName:true,day,start:$("sStart").value,end:$("sEnd").value,type:["景點","餐廳","咖啡廳","購物","其他"].includes(item.type)?item.type:"景點",name:item.name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:item.memo,memo:"由口袋景點帶入",adjusted:false});
    spot.planId=planId;
  }
  save();
}

function importSpotFile(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const obj=JSON.parse(normalizeImportedJsonText(e.target.result));
      const spots=Array.isArray(obj.spots)?obj.spots:(Array.isArray(obj)?obj:[]);
      let cleared=0;
      spots.forEach(s=>{
        if(!s.name)return;
        const rawDay=String(s.day||"");
        const safeDay=v23NormalizeSpotDate(rawDay);
        if(rawDay && !safeDay)cleared++;
        data.spots.push({id:uid(),name:String(s.name||""),type:String(s.type||"景點"),day:safeDay,addr:String(s.addr||s.address||""),memo:String(s.memo||s.note||""),source:"AI匯入"});
      });
      save();
      if(cleared>0){
        toast(`已匯入 ${spots.length} 個口袋景點；${cleared} 個日期超出旅程，已改為未排`);
      }else{
        toast(`已匯入 ${spots.length} 個口袋景點`);
      }
    }catch(err){
      alert("匯入失敗：請確認 TXT 內容是純 JSON，且包含 spots。");
    }
  };
  r.readAsText(file);
}

function useSpot(id){
  let s=data.spots.find(x=>x.id==id);
  if(!s)return;
  setCurrentDay(s.day||currentDay||cur,{render:false});
  v16PendingSpotId=id;
  editingPlanId=null;
  go("planner");
  setTimeout(()=>{
    const form=document.querySelector("#plannerView details.card");
    if(form)form.setAttribute("open","");
    v16FillPendingSpot();
    scrollTo(0,0);
  },80);
}

function saveSpot(){
  if(!$("sn").value)return toast("請輸入名稱");
  const item={name:$("sn").value,type:normalizePlanType($("st").value),day:$("sd").value,addr:$("sa").value,memo:$("sm").value};
  let id=editingSpotId;
  let spot;

  if(id){
    spot=data.spots.find(x=>x.id==id);
    Object.assign(spot,item);
    editingSpotId=null;
  }else{
    id=uid();
    spot={id,...item,source:"手動"};
    data.spots.push(spot);
  }

  if($("sToPlan").value==="yes"){
    const day=item.day||currentDay||cur;
    const planId=uid();
    const p={id:planId,sourceType:"spot",lockedName:true,day,start:$("sStart").value,end:$("sEnd").value,type:normalizePlanType(item.type),name:item.name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:item.memo,memo:"由口袋景點帶入",adjusted:false};
    data.plans.push(p);
    createBudgetFromPlanSnapshot(p);
    spot.planId=planId;
  }
  save();
}

function delSpot(id){
  data.spots=data.spots.filter(x=>x.id!=id);
  if(editingSpotId==id)editingSpotId=null;
  save();
  toast("已刪除口袋景點");
}

// 2) 刪除預算項目不用彈跳確認。
function v645TimeValue(v, fallback=""){
  const t=String(v||"").trim();
  const m=t.match(/^(\d{1,2}):(\d{2})/);
  if(!m) return fallback;
  const h=String(Math.min(23,Math.max(0,Number(m[1])))).padStart(2,'0');
  const mm=String(Math.min(59,Math.max(0,Number(m[2])))).padStart(2,'0');
  return `${h}:${mm}`;
}
function v645SpotStart(s){return v645TimeValue(s?.start || s?.suggestedStart || s?.recommendedStart || s?.startTime || "");}
function v645SpotEnd(s){return v645TimeValue(s?.end || s?.suggestedEnd || s?.recommendedEnd || s?.endTime || "");}
function v645SpotTimeText(s){
  const st=v645SpotStart(s), en=v645SpotEnd(s);
  if(st && en) return `${st}－${en}`;
  if(st) return `${st} 開始`;
  if(en) return `${en} 結束`;
  return "";
}
function v645EnhanceSpotTimeUi(){
  const edit = editingSpotId ? (data.spots||[]).find(s=>s.id===editingSpotId) : null;
  if(edit){
    if($('sStart')) $('sStart').value = v645SpotStart(edit) || '10:00';
    if($('sEnd')) $('sEnd').value = v645SpotEnd(edit) || '11:30';
  }
  const cards=document.querySelectorAll('#spotsView > .grid2 > .card');
  cards.forEach((card,i)=>{
    const s=(data.spots||[])[i];
    if(!s || card.querySelector('.v645SpotTimeTag')) return;
    const text=v645SpotTimeText(s);
    if(!text) return;
    const tags=card.querySelector('.tags');
    if(tags) tags.insertAdjacentHTML('beforeend', `<span class="tag yellow v645SpotTimeTag">⏰ ${esc(text)}</span>`);
  });
}

const v645PrevRenderSpots = typeof renderSpots==='function' ? renderSpots : null;
renderSpots = function(...args){
  const r = v645PrevRenderSpots ? v645PrevRenderSpots.apply(this,args) : undefined;
  try{ v645EnhanceSpotTimeUi(); }catch(e){ console.warn(e); }
  return r;
};

saveSpot = function(){
  if(!$('sn')?.value) return toast('請輸入名稱');
  const item={
    name:$('sn').value,
    type:typeof normalizePlanType==='function' ? normalizePlanType($('st').value) : $('st').value,
    day:$('sd').value,
    addr:$('sa').value,
    memo:$('sm').value,
    start:v645TimeValue($('sStart')?.value || ''),
    end:v645TimeValue($('sEnd')?.value || '')
  };
  let id=editingSpotId;
  let spot;
  if(id){
    spot=(data.spots||[]).find(x=>x.id===id);
    if(spot) Object.assign(spot,item);
    editingSpotId=null;
  }else{
    id=uid();
    spot={id,...item,source:'手動'};
    data.spots.push(spot);
  }
  if($('sToPlan')?.value==='yes'){
    const day=item.day || (typeof currentDay!=='undefined' ? currentDay : cur) || cur;
    const planId=uid();
    const p={
      id:planId,
      sourceType:'spot',
      lockedName:true,
      day,
      start:item.start || '10:00',
      end:item.end || '11:30',
      type:typeof normalizePlanType==='function' ? normalizePlanType(item.type) : item.type,
      name:item.name,
      address:item.addr || '',
      mode:'foreign',foreign:0,twd:0,payer:'未定',payMethod:'未定',
      note:item.memo,
      memo:'由口袋景點帶入',
      adjusted:false
    };
    data.plans.push(p);
    if(typeof createBudgetFromPlanSnapshot==='function') createBudgetFromPlanSnapshot(p);
    if(spot) spot.planId=planId;
  }
  save();
};

const v645PrevFillPendingSpot = typeof v16FillPendingSpot==='function' ? v16FillPendingSpot : null;
v16FillPendingSpot = function(...args){
  const s=(data.spots||[]).find(x=>x.id===v16PendingSpotId);
  const r = v645PrevFillPendingSpot ? v645PrevFillPendingSpot.apply(this,args) : undefined;
  if(s){
    const st=v645SpotStart(s), en=v645SpotEnd(s);
    if($('ps') && st) $('ps').value=st;
    if($('pe') && en) $('pe').value=en;
  }
  return r;
};

function v645SpotMemo(s){
  const memo=String(s.memo||s.note||s.reason||'');
  const dur=String(s.duration||s.stay||s.stayTime||'');
  const parts=[];
  if(dur) parts.push(`建議停留：${dur}`);
  return [parts.join('｜'), memo].filter(Boolean).join('\n');
}

const v645PrevImportAiObject = typeof v64ImportAiObject==='function' ? v64ImportAiObject : null;
v64ImportAiObject = function(obj){
  const type=String(obj.janeselect_import_type || obj.type || '').trim();
  if(type==='spots' || Array.isArray(obj.spots)){
    const items = (typeof v64ArrayFromImport==='function') ? v64ArrayFromImport(obj,'spots') : (Array.isArray(obj.spots)?obj.spots:[]);
    let count=0;
    items.forEach(s=>{
      if(!s || !s.name) return;
      const rawDay=String(s.day||'');
      const day=(typeof v644ValidDay==='function') ? (v644ValidDay(rawDay)?rawDay:'') : rawDay;
      const start=v645SpotStart(s);
      const end=v645SpotEnd(s);
      data.spots.push({
        id:uid(),
        name:String(s.name||''),
        type:String(s.type||'景點'),
        day,
        start,
        end,
        addr:String(s.addr||s.address||''),
        memo:v645SpotMemo(s),
        krName:String(s.krName||s.kr_name||''),
        krAddress:String(s.krAddress||s.kr_address||''),
        source:'ai'
      });
      count++;
    });
    if(count) return {count, label:'口袋景點'};
  }
  return v645PrevImportAiObject ? v645PrevImportAiObject(obj) : {count:0,label:'資料'};
};

/* 更新提示詞：明確告訴 AI day/start/end 會直接進入口袋景點欄位，不是寫進 memo */
const v645PrevSpotPrompt = typeof v644SpotPrompt==='function' ? v644SpotPrompt : null;
v644SpotPrompt = function(){
  const base = v645PrevSpotPrompt ? v645PrevSpotPrompt() : (typeof v64BuildPrompt==='function' ? v64BuildPrompt('spots') : '');
  return String(base).replace('每個推薦都要給「備選日期 day」與「建議時間 start/end」。如果不確定可留空，但請在 memo 說明適合早上/下午/晚上。',
    '每個推薦都要盡量填「備選日期 day」與「建議時間 start/end」，這三個欄位會直接匯入口袋景點的候選日期、預設開始、預設結束欄位；如果真的不確定才留空，並在 memo 說明適合早上/下午/晚上。');
};
if(typeof v64BuildPrompt==='function'){
  const v645PrevBuildPrompt = v64BuildPrompt;
  v64BuildPrompt = function(type, spotId){
    if(type==='spots') return v644SpotPrompt();
    return v645PrevBuildPrompt(type, spotId);
  };
}

const v645PrevRenderHelp = typeof renderHelp==='function' ? renderHelp : null;
renderHelp = function(...args){
  const r = v645PrevRenderHelp ? v645PrevRenderHelp.apply(this,args) : undefined;
  const log=$('v64UpdateLog') || $('helpView')?.querySelector('.card');
  if(log){
    log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V645_VERSION_TEXT)}</b><br>AI 匯入口袋景點時，會把 AI 回傳的 day / start / end 直接寫入口袋景點的候選日期、預設開始、預設結束欄位；之後點「排入行程」會自動帶入行程表單，不會只寫在備註裡。</div>`;
  }
  v645UpdateFooterVersion();
  return r;
};
function v645UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V645_VERSION_SHORT);
}
setTimeout(()=>{try{v645UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},360);
const V646_VERSION_SHORT = "v64.6｜2026-05-31";
const V646_VERSION_TEXT = "v64.6｜航班直飛與照片書操作修正版";

/* 航班：直飛只顯示第一段，轉機才顯示第二段；資料讀取仍沿用 readFlightForm 的 type/count。 */
flightForm = function(k){
  const f=normalizeFlightObj(data.flights[k],k);
  const segs=[f.segments[0]||{}, f.segments[1]||{}];
  const isOut=k==="out";
  const type=f.type||"direct";
  return `<div class="flightTransferBlock" data-flight-dir="${k}" data-flight-type="${type}">
    ${airportDatalistHtml()}
    <label>航班型態</label>${flightTypeSelect(k,type)}
    <div class="flightTypeHint">直飛只填第 1 段；轉機時才會顯示第 2 段航班。航班日期允許落在出發日前 3 天～回程日後 3 天。</div>
    <div id="${k}segmentsWrap">
      ${flightSegmentForm(k,0,segs[0])}
      <div class="${type==='transfer'?'':'v646-hidden-segment'}" id="${k}segExtraWrap1">${flightSegmentForm(k,1,segs[1])}</div>
    </div>
    <label>${isOut?"抵達出發機場方式":"前往回程機場方式"}</label>
    <textarea id="${k}toAirport" placeholder="${isOut?"例：14:00 從家出發，搭機捷到桃園機場":"例：從飯店搭地鐵／計程車到機場"}">${esc(f.toAirport||f.transfer||"")}</textarea>
    <label>${isOut?"降落後到市區／飯店":"抵達後回家方式"}</label>
    <textarea id="${k}fromAirport" placeholder="${isOut?"例：金海機場搭輕軌轉地鐵到飯店":"例：抵達桃園後搭機捷／接送回家"}">${esc(f.fromAirport||"")}</textarea>
  </div>`;
};

const v646PrevToggleFlightSegments = typeof toggleFlightSegments==='function' ? toggleFlightSegments : null;
toggleFlightSegments = function(k){
  const type=$(k+"type")?.value || normalizeFlightObj(data.flights[k],k).type || "direct";
  const wrap=document.querySelector(`[data-flight-dir="${k}"]`);
  if(wrap) wrap.setAttribute('data-flight-type', type);
  const extra=$(k+"segExtraWrap1") || $(k+"segBox1");
  if(extra){
    extra.classList.toggle('v646-hidden-segment', type!=="transfer");
    if(extra.style) extra.style.display = type==="transfer" ? "" : "none";
  }
  if(v646PrevToggleFlightSegments && !$(k+"segExtraWrap1")){
    try{v646PrevToggleFlightSegments(k);}catch(e){}
  }
};

/* 照片書：封面與每日封面可刪除後重傳。 */
