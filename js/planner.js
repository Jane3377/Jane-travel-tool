/* ── planner.js：行程規劃、行程卡片、交通連線 ── */
function renderSide(){$("days").innerHTML=data.days.map(d=>{let h=hotelFor(d.key),n=data.plans.filter(p=>p.day==d.key).length;return `<div class="day ${d.key==cur?"active":""}" onclick="cur='${d.key}';go('planner')"><b>${d.title}｜${d.label}</b><span>${n} 行程｜住宿：${h?esc(h.name):"未設定"}</span></div>`}).join("")}function optsDays(selected=""){return data.days.map(d=>`<option value="${d.key}" ${d.key==selected?"selected":""}>${d.label} ${d.title}</option>`).join("")}function optsPayer(selected="未定"){let opts=data.trip.travelers.map((n,i)=>[String(i),n]);opts.push(["共同","共同"],["未定","未定"]);return opts.map(x=>`<option value="${x[0]}" ${String(x[0])===String(selected)?"selected":""}>${esc(x[1])}</option>`).join("")}function optsPayMethod(selected="未定"){return [["cash","現金"],["card","刷卡"],["transfer","轉帳"],["未定","未定"]].map(x=>`<option value="${x[0]}" ${x[0]==selected?"selected":""}>${x[1]}</option>`).join("")}function countryOptions(){return Object.keys(currencyMap).map(c=>`<option value="${c}" ${data.trip.country==c?"selected":""}>${c}</option>`).join("")+`<option value="其他" ${data.trip.country=="其他"?"selected":""}>其他</option>`}
function sortedPlans(day){return data.plans.filter(p=>p.day==day).sort((a,b)=>String(a.start).localeCompare(String(b.start))||String(a.end).localeCompare(String(b.end)))}
function renderPlanner(){normalizePlanTimes(cur);let plans=sortedPlans(cur);$("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">行程依開始時間排序。若交通抵達時間晚於下一個開始時間，系統會提醒並自動調整。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div><div class="card"><div class="four"><div><label>日期</label><select id="pday">${optsDays(cur)}</select></div><div><label>開始</label><input id="ps" type="time" value="10:00"></div><div><label>結束</label><input id="pe" type="time" value="11:30"></div><div><label>分類</label><select id="ptype"><option>景點</option><option>餐廳</option><option>咖啡廳</option><option>購物</option><option>其他</option></select></div></div><label>行程名稱</label><input id="pname"><div class="four"><div><label>${esc(data.trip.currency)} 金額</label><input id="pforeign" type="number" oninput="syncPlanMoney('f')"></div><div><label>TWD</label><input id="ptwd" type="number" oninput="syncPlanMoney('t')"></div><div><label>付款人</label><select id="pp">${optsPayer("未定")}</select></div><div><label>付款方式</label><select id="ppm">${optsPayMethod("未定")}</select></div></div><label>注意事項</label><textarea id="pnote"></textarea><label>備註</label><textarea id="pmemo"></textarea><div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"儲存行程":"加入行程"}</button>${editingPlanId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div></div><div class="stats"><div class="stat"><span>本日行程</span><strong>${plans.length}</strong></div><div class="stat"><span>本日 TWD</span><strong>${fmt(plans.reduce((s,p)=>s+moneyTwd(p),0))}</strong></div><div class="stat"><span>本日 ${esc(data.trip.currency)}</span><strong>${fmt(plans.reduce((s,p)=>s+moneyForeign(p),0))}</strong></div><div class="stat"><span>全旅程</span><strong>${data.plans.length}</strong></div></div><div id="pcards">${planCards(plans)}</div>`;if(editingPlanId)fillPlanForm(editingPlanId)}
function planCards(plans){if(!plans.length)return'<div class="empty">這天還沒有行程</div>';let html="";plans.forEach((p,i)=>{if(i>0)html+=connHtml(plans[i-1],p);html+=`<div class="card plan" data-id="${p.id}"><div class="section"><div><div class="time">${p.start}-${p.end}</div><div class="place">${esc(p.name)}</div><div class="tags"><span class="tag">${esc(p.type)}</span><span class="tag pink">${esc(travelerName(p.payer))}｜${esc(payMethodLabel(p.payMethod))}</span><span class="tag yellow">${esc(data.trip.currency)} ${fmt(moneyForeign(p))}</span><span class="tag blue">TWD ${fmt(moneyTwd(p))}</span>${p.adjusted?'<span class="tag green">已依交通調整</span>':""}</div></div><div><button class="small" onclick="routeCurrent('${encodeURIComponent(p.name+' '+data.trip.dest)}')">地圖</button><button class="small" onclick="editPlan('${p.id}')">編輯</button><button class="small" onclick="delPlan('${p.id}')">刪除</button></div></div><div class="grid2"><div class="box pink"><b>注意</b><br>${esc(p.note)}</div><div class="box blue"><b>備註</b><br>${esc(p.memo)}</div></div></div>`});return html}
function connHtml(a,b){let c=data.conns.find(x=>x.a==a.id&&x.b==b.id);if(!c){c={id:uid(),a:a.id,b:b.id,mode:"大眾運輸",h:0,m:30,memo:"",fareForeign:0,fareTwd:0,payer:"未定",payMethod:"未定"};data.conns.push(c);silentSave()}const arrival=addMinutes(a.end,(Number(c.h||0)*60+Number(c.m||0)));const taxiBlock=c.mode==="開車/計程車"?`<div class="four" style="margin-top:8px"><div><label>車資 ${esc(data.trip.currency)}</label><input value="${c.fareForeign||""}" type="number" oninput="updConn('${c.id}','fareForeign',this.value)"></div><div><label>車資 TWD</label><input value="${c.fareTwd||""}" type="number" oninput="updConn('${c.id}','fareTwd',this.value)"></div><div><label>付款人</label><select onchange="updConn('${c.id}','payer',this.value)">${optsPayer(c.payer)}</select></div><div><label>付款方式</label><select onchange="updConn('${c.id}','payMethod',this.value)">${optsPayMethod(c.payMethod)}</select></div></div>`:"";return `<div class="connector"><div class="arrow">↓</div><div class="connbox"><div class="three"><div><label>交通</label><select onchange="changeConnMode('${c.id}',this.value)"><option ${c.mode=="大眾運輸"?"selected":""}>大眾運輸</option><option ${c.mode=="走路"?"selected":""}>走路</option><option ${c.mode=="開車/計程車"?"selected":""}>開車/計程車</option></select></div><div><label>預估時間</label><div class="two"><select onchange="updConn('${c.id}','h',this.value)">${hourOptions(c.h)}</select><select onchange="updConn('${c.id}','m',this.value)">${minuteOptions(c.m)}</select></div></div><div><label>預估抵達</label><input value="${arrival||""}" disabled></div></div>${taxiBlock}<div class="btns"><button class="btn blue" onclick="route('${encodeURIComponent(a.name+' '+data.trip.dest)}','${encodeURIComponent(b.name+' '+data.trip.dest)}','${c.mode}')">Google Maps 查路線</button></div><input value="${esc(c.memo)}" placeholder="交通備註" oninput="updConn('${c.id}','memo',this.value)"></div></div>`}
function hourOptions(v){let out="";for(let h=0;h<=23;h++)out+=`<option value="${h}" ${Number(v)==h?"selected":""}>${h}時</option>`;return out}function minuteOptions(v){let out="";for(let m=0;m<=59;m++)out+=`<option value="${m}" ${Number(v)==m?"selected":""}>${m}分</option>`;return out}function changeConnMode(id,v){let c=data.conns.find(x=>x.id==id);c.mode=v;alert("交通方式已變更，建議重新開 Google Maps 查路線，並確認預估時間。");save()}function addMinutes(t,min){if(!t)return"";let [h,m]=t.split(":").map(Number),total=h*60+m+Number(min||0);total=((total%1440)+1440)%1440;return String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0")}function diffMinutes(a,b){if(!a||!b)return 60;let [ah,am]=a.split(":").map(Number),[bh,bm]=b.split(":").map(Number);return Math.max(15,bh*60+bm-(ah*60+am))}function timeToMin(t){if(!t)return 0;let [h,m]=t.split(":").map(Number);return h*60+m}
function normalizePlanTimes(day){let plans=sortedPlans(day),changed=false;for(let i=1;i<plans.length;i++){let prev=plans[i-1],curP=plans[i],c=data.conns.find(x=>x.a==prev.id&&x.b==curP.id);if(!c)continue;let arrival=addMinutes(prev.end,Number(c.h||0)*60+Number(c.m||0));if(arrival&&timeToMin(arrival)>timeToMin(curP.start)){let dur=diffMinutes(curP.start,curP.end);curP.start=arrival;curP.end=addMinutes(arrival,dur);curP.adjusted=true;changed=true}}if(changed){silentSave();if(!adjustToastShown){adjustToastShown=true;setTimeout(()=>toast("部分行程已依交通抵達時間自動調整"),100)}}}
function syncPlanMoney(src){let rate=Number(data.trip.rate||1);if(src=="f")$("ptwd").value=Math.round(Number($("pforeign").value||0)*rate);else $("pforeign").value=Math.round(Number($("ptwd").value||0)/rate)}function savePlanForm(){if(!$("pname").value)return toast("請輸入行程名稱");let item={day:$("pday").value,start:$("ps").value,end:$("pe").value,type:$("ptype").value,name:$("pname").value,mode:"foreign",foreign:Number($("pforeign").value||0),twd:Number($("ptwd").value||0),payer:$("pp").value,payMethod:$("ppm").value,note:$("pnote").value,memo:$("pmemo").value,adjusted:false};if(editingPlanId){Object.assign(data.plans.find(p=>p.id==editingPlanId),item);editingPlanId=null}else data.plans.push({id:uid(),...item});cur=item.day;save()}function fillPlanForm(id){let p=data.plans.find(x=>x.id==id);if(!p)return;["pday","ps","pe","ptype","pname","pforeign","ptwd","pp","ppm","pnote","pmemo"].forEach((id2,i)=>$(id2).value=[p.day,p.start,p.end,p.type,p.name,moneyForeign(p),moneyTwd(p),p.payer,p.payMethod||"未定",p.note,p.memo][i])}function editPlan(id){editingPlanId=id;go("planner")}function clearPlanForm(){editingPlanId=null;renderPlanner();scrollTo(0,0)}function delPlan(id){if(!confirm("確定刪除行程？"))return;data.plans=data.plans.filter(x=>x.id!=id);data.conns=data.conns.filter(c=>c.a!=id&&c.b!=id);if(editingPlanId==id)editingPlanId=null;save()}function updConn(id,k,v){let c=data.conns.find(x=>x.id==id);c[k]=v;save()}function map(q){open("https://www.google.com/maps/search/?api=1&query="+q,"_blank")}function routeCurrent(q){map(q)}function route(a,b,m){let mode=m=="走路"?"walking":m=="開車/計程車"?"driving":"transit";open(`https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}&travelmode=${mode}`,"_blank")}
function planCards(plans){
  if(!plans.length)return'<div class="empty">這天還沒有行程</div>';
  let html="";
  plans.forEach((p,i)=>{
    if(i>0)html+=connHtml(plans[i-1],p);
    html+=`<div class="card plan" draggable="true" data-id="${p.id}"><div class="section"><div><div class="time">${p.start}-${p.end}</div><div class="place">${activityIcon(p.type)} ${esc(p.name)}</div><div class="tags"><span class="tag">${esc(p.type)}</span><span class="tag pink">${esc(travelerName(p.payer))}｜${esc(payMethodLabel(p.payMethod))}</span><span class="tag yellow">${esc(data.trip.currency)} ${fmt(moneyForeign(p))}</span><span class="tag blue">TWD ${fmt(moneyTwd(p))}</span>${p.adjusted?'<span class="tag green">已依交通調整</span>':""}</div></div><div><button class="small" onclick="routeCurrent('${encodeURIComponent(p.name+' '+data.trip.dest)}')">地圖</button><button class="small" onclick="editPlan('${p.id}')">編輯</button><button class="small" onclick="delPlan('${p.id}')">刪除</button></div></div><div class="grid2"><div class="box pink"><b>注意</b><br>${esc(p.note)}</div><div class="box blue"><b>備註</b><br>${esc(p.memo)}</div></div></div>`;
  });
  return html;
}
function renderSide(){
  $("days").innerHTML=data.days.map(d=>{
    let h=hotelFor(d.key),n=data.plans.filter(p=>p.day==d.key).length;
    return `<div class="day ${d.key==cur?"active":""}" onclick="cur='${d.key}';go('planner')"><b>${d.title}｜${d.label}</b><span>${n} 行程｜住宿：${h?esc(h.name):"未設定"}</span></div>`;
  }).join("");
  const side=document.querySelector(".panel");
  if(side){
    side.querySelector(".btns").innerHTML=`<button class="btn pink" onclick="generateAIPrompt()">產出 AI 提示詞</button><label class="btn blue" style="display:inline-block">匯入行程<input type="file" accept=".json,application/json,.txt,text/plain" onchange="importAIItinerary(this.files[0])" style="display:none"></label>`;
  }
}
function renderSide(){
  $("days").innerHTML=data.days.map(d=>{
    let h=hotelFor(d.key),n=data.plans.filter(p=>p.day==d.key).length;
    return `<div class="day ${d.key==cur?"active":""}" onclick="cur='${d.key}';go('planner')"><b>${d.title}｜${d.label}</b><span>${n} 行程｜住宿：${h?esc(h.name):"未設定"}</span></div>`;
  }).join("");
  const side=document.querySelector(".panel");
  if(side){
    side.querySelector(".btns").innerHTML=`<button class="btn danger" onclick="clearAllPlans()">清除所有行程</button>`;
  }
}
function clearAllPlans(){
  if(!confirm("清除所有行程會刪除目前已排入的行程卡片與行程間交通連線。建議先到「說明」匯出備份，再繼續。確定要清除嗎？"))return;
  data.plans=[];
  data.conns=[];
  silentSave();
  render();
  toast("已清除所有行程資料");
}
function renderSide(){
  $("days").innerHTML=data.days.map(d=>{
    let h=hotelFor(d.key),n=data.plans.filter(p=>p.day==d.key).length;
    return `<div class="day ${d.key==cur?"active":""}" onclick="cur='${d.key}';go('planner')"><b>${d.title}｜${d.label}</b><span>${n} 行程｜住宿：${h?esc(h.name):"未設定"}</span></div>`;
  }).join("");
  const side=document.querySelector(".panel");
  const btns=side?.querySelector(".btns");
  if(btns)btns.innerHTML=`<button class="btn danger compact" onclick="clearAllPlans()">清除所有行程</button>`;
}
function clearAllPlans(){
  if(!confirm("清除所有行程會刪除目前已排入的行程卡片與行程間交通連線。建議先到「說明」匯出備份，再繼續。確定要清除嗎？"))return;
  data.plans=[];data.conns=[];silentSave();render();toast("已清除所有行程資料");
}
function renderPlanner(){
  normalizePlanTimes(cur);
  let plans=sortedPlans(cur);
  $("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
  <details class="card" ${editingPlanId?"open":""}><summary>${editingPlanId?"編輯行程":"＋ 新增行程"}</summary><div class="detailBody">
    <div class="four"><div><label>日期</label><select id="pday">${optsDays(cur)}</select></div><div><label>開始</label><input id="ps" type="time" value="10:00"></div><div><label>結束</label><input id="pe" type="time" value="11:30"></div><div><label>分類</label><select id="ptype"><option>景點</option><option>餐廳</option><option>咖啡廳</option><option>購物</option><option>交通</option><option>航班</option><option>住宿</option><option>其他</option></select></div></div>
    <label>行程名稱</label><input id="pname">
    <div class="four"><div><label>${esc(data.trip.currency)} 金額</label><input id="pforeign" type="number" oninput="syncPlanMoney('f')"></div><div><label>TWD</label><input id="ptwd" type="number" oninput="syncPlanMoney('t')"></div><div><label>付款人</label><select id="pp">${optsPayer("未定")}</select></div><div><label>付款方式</label><select id="ppm">${optsPayMethod("未定")}</select></div></div>
    <label>注意事項</label><textarea id="pnote"></textarea><label>備註</label><textarea id="pmemo"></textarea>
    <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"儲存行程":"加入行程"}</button>${editingPlanId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
  </div></details>
  <div id="pcards">${planCards(plans)}</div>`;
  if(editingPlanId)fillPlanForm(editingPlanId);
}
function renderSide(){
  $("days").innerHTML=data.days.map(d=>{
    let h=hotelFor(d.key),n=data.plans.filter(p=>p.day==d.key).length;
    return `<div class="day ${d.key==cur?"active":""}" onclick="cur='${d.key}';go('planner')"><b>${d.title}｜${d.label}</b><span>${n} 行程｜住宿：${h?esc(h.name):"未設定"}</span></div>`;
  }).join("");
  const btns = document.querySelector(".panel .btns");
  if(btns) btns.innerHTML = `<button class="btn danger compact" onclick="clearAllPlans()">清除所有行程</button>`;
}

function clearAllPlans(){
  if(!confirm("清除所有行程會刪除目前已排入的行程卡片與行程間交通連線。建議先到「說明」匯出備份，再繼續。確定要清除嗎？")) return;
  data.plans=[];
  data.conns=[];
  save();
}

function renderPlanner(){
  normalizePlanTimes(cur);
  let plans=sortedPlans(cur);
  $("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
  <details class="card" ${editingPlanId?"open":""}><summary>${editingPlanId?"編輯行程":"＋ 新增行程"}</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>日期</label><select id="pday">${optsDays(cur)}</select></div>
      <div><label>開始</label><input id="ps" type="time" value="10:00"></div>
      <div><label>結束</label><input id="pe" type="time" value="11:30"></div>
    </div>
    <div class="two">
      <div><label>分類</label><select id="ptype"><option>景點</option><option>餐廳</option><option>咖啡廳</option><option>購物</option><option>交通</option><option>航班</option><option>住宿</option><option>其他</option></select></div>
      <div><label>付款方式</label><select id="ppm">${optsPayMethod("未定")}</select></div>
    </div>
    <label>行程名稱</label><input id="pname">
    <div class="four compactMobile">
      <div><label>${esc(data.trip.currency)} 金額</label><input id="pforeign" type="number" oninput="syncPlanMoney('f')"></div>
      <div><label>TWD</label><input id="ptwd" type="number" oninput="syncPlanMoney('t')"></div>
      <div class="full"><label>付款人</label><select id="pp">${optsPayer("未定")}</select></div>
    </div>
    <label>注意事項</label><textarea id="pnote"></textarea>
    <label>備註</label><textarea id="pmemo"></textarea>
    <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"儲存行程":"加入行程"}</button>${editingPlanId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
  </div></details>
  <div id="pcards">${planCards(plans)}</div>`;
  if(editingPlanId)fillPlanForm(editingPlanId);
}

function v16DateAdd(dateStr, days){
  const [y,m,d]=dateStr.split("-").map(Number);
  const dt=new Date(y,m-1,d);
  dt.setDate(dt.getDate()+days);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}
function v16DateRange(start,endInclusive){
  const arr=[];
  if(!start||!endInclusive)return arr;
  let d=v16ParseDate(start), end=v16ParseDate(endInclusive);
  for(;d<=end;d.setDate(d.getDate()+1)){
    arr.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }
  return arr;
}
function v16ParseDate(s){
  const [y,m,d]=s.split("-").map(Number);
  return new Date(y,m-1,d);
}
function v16DateFromDT(dt){return dt ? String(dt).split("T")[0] : ""}
function v16TimeFromDT(dt){return dt ? (String(dt).split("T")[1]||"") : ""}
function v16PlanExists(day,name,start){
  return data.plans.some(p=>p.day===day && p.name===name && (p.start||"")===(start||""));
}
function v16AddPlanNode(item){
  if(!item.day||!item.name)return null;
  if(v16PlanExists(item.day,item.name,item.start)) return null;
  const plan={id:uid(),mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:"",memo:"",adjusted:false,...item};
  data.plans.push(plan);
  return plan.id;
}
function v16OpenTripDetail(index){
  const details=document.querySelectorAll("#tripView details.card");
  if(details[index])details[index].setAttribute("open","");
}
function v16CollapseTripDetail(index){
  const details=document.querySelectorAll("#tripView details.card");
  if(details[index])details[index].removeAttribute("open");
}

function renderSide(){
  const layout=document.querySelector(".layout");
  const panel=document.querySelector(".panel");
  if(layout){
    layout.classList.toggle("withCalendar", view==="planner");
    layout.classList.toggle("noCalendar", view!=="planner");
    if(window.innerWidth>620){
      layout.style.gridTemplateColumns = view==="planner" ? "280px 1fr" : "1fr";
    }else{
      layout.style.gridTemplateColumns = "";
    }
  }
  if(panel) panel.style.display = view==="planner" ? "" : "none";
  $("days").innerHTML=data.days.map(d=>{
    let h=hotelFor(d.key),n=data.plans.filter(p=>p.day==d.key).length;
    return `<div class="day ${d.key==cur?"active":""}" onclick="cur='${d.key}';go('planner')"><b>${d.title}｜${d.label}</b><span>${n} 行程｜住宿：${h?esc(h.name):"未設定"}</span></div>`;
  }).join("");
  const btns = document.querySelector(".panel .btns");
  if(btns) btns.innerHTML = `<button class="btn danger compact" onclick="clearAllPlans()">清除所有行程</button>`;
}

function renderPlanner(){
  normalizePlanTimes(cur);
  let plans=sortedPlans(cur);
  $("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
  <details class="card" ${editingPlanId||v16PendingSpotId?"open":""}><summary>${editingPlanId?"編輯行程":"＋ 新增行程"}</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>日期</label><select id="pday" onchange="cur=this.value; renderPlanner();">${optsDays(cur)}</select></div>
      <div><label>開始</label><input id="ps" type="time" value="10:00"></div>
      <div><label>結束</label><input id="pe" type="time" value="11:30"></div>
    </div>
    <div class="two">
      <div><label>分類</label><select id="ptype"><option>景點</option><option>餐廳</option><option>咖啡廳</option><option>購物</option><option>交通</option><option>航班</option><option>住宿</option><option>其他</option></select></div>
      <div><label>付款方式</label><select id="ppm">${optsPayMethod("未定")}</select></div>
    </div>
    <label>行程名稱</label><input id="pname">
    <div class="four compactMobile">
      <div><label>${esc(data.trip.currency)} 金額</label><input id="pforeign" type="number" oninput="syncPlanMoney('f')"></div>
      <div><label>TWD</label><input id="ptwd" type="number" oninput="syncPlanMoney('t')"></div>
      <div class="full"><label>付款人</label><select id="pp">${optsPayer("未定")}</select></div>
    </div>
    <label>注意事項</label><textarea id="pnote"></textarea>
    <label>備註</label><textarea id="pmemo"></textarea>
    <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"儲存行程":"加入行程"}</button>${editingPlanId||v16PendingSpotId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
  </div></details>
  <div id="pcards">${planCards(plans)}</div>`;
  if(editingPlanId) fillPlanForm(editingPlanId);
  if(v16PendingSpotId) v16FillPendingSpot();
}

function v16FillPendingSpot(){
  const s=data.spots.find(x=>x.id==v16PendingSpotId);
  if(!s)return;
  $("pday").value=s.day||cur;
  $("ptype").value=["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點";
  $("pname").value=s.name;
  $("pnote").value=s.memo;
}

function savePlanForm(){
  if(!$("pname").value)return toast("請輸入行程名稱");
  let item={day:$("pday").value,start:$("ps").value,end:$("pe").value,type:$("ptype").value,name:$("pname").value,mode:"foreign",foreign:Number($("pforeign").value||0),twd:Number($("ptwd").value||0),payer:$("pp").value,payMethod:$("ppm").value,note:$("pnote").value,memo:$("pmemo").value,adjusted:false};
  let planId=editingPlanId;

  if(editingPlanId){
    Object.assign(data.plans.find(p=>p.id==editingPlanId),item);
    editingPlanId=null;
  }else{
    planId=uid();
    data.plans.push({id:planId,...item});
  }

  if(v16PendingSpotId){
    const spot=data.spots.find(s=>s.id==v16PendingSpotId);
    if(spot) spot.planId=planId;
    v16PendingSpotId=null;
  }

  cur=item.day;
  save();
}

function clearPlanForm(){
  editingPlanId=null;
  v16PendingSpotId=null;
  renderPlanner();
}

function delPlan(id){
  data.plans=data.plans.filter(x=>x.id!=id);
  data.conns=data.conns.filter(c=>c.a!=id&&c.b!=id);
  data.spots.forEach(s=>{ if(s.planId==id) delete s.planId; });
  save();
}

function savePlanForm(){
  if(!$("pname").value)return toast("請輸入行程名稱");
  let item={day:$("pday").value,start:$("ps").value,end:$("pe").value,type:$("ptype").value,name:$("pname").value,mode:"foreign",foreign:Number($("pforeign").value||0),twd:Number($("ptwd").value||0),payer:$("pp").value,payMethod:$("ppm").value,note:$("pnote").value,memo:$("pmemo").value,adjusted:false};
  let planId=editingPlanId;

  if(editingPlanId){
    const existing=data.plans.find(p=>p.id==editingPlanId);
    if(existing?.lockedName){
      item.name=existing.name;
      item.sourceType=existing.sourceType;
      item.lockedName=true;
      if(existing.hotelId)item.hotelId=existing.hotelId;
    }
    Object.assign(existing,item);
    editingPlanId=null;
  }else{
    planId=uid();
    data.plans.push({id:planId,...item});
  }

  if(v16PendingSpotId){
    const spot=data.spots.find(s=>s.id==v16PendingSpotId);
    const p=data.plans.find(x=>x.id==planId);
    if(spot && p){
      spot.planId=planId;
      p.sourceType="spot";
      p.lockedName=true;
      p.name=spot.name;
      p.memo=p.memo || "由口袋景點帶入";
    }
    v16PendingSpotId=null;
  }

  cur=item.day;
  save();
}

function renderPlanner(){
  normalizePlanTimes(cur);
  let plans=sortedPlans(cur);
  $("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
  <details class="card" ${editingPlanId||v16PendingSpotId?"open":""}><summary>${editingPlanId?"編輯行程":"＋ 新增行程"}</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>日期</label><select id="pday" onchange="cur=this.value; renderPlanner();">${optsDays(cur)}</select></div>
      <div><label>開始</label><input id="ps" type="time" value="10:00"></div>
      <div><label>結束</label><input id="pe" type="time" value="11:30"></div>
    </div>
    <div class="two">
      <div><label>分類</label><select id="ptype"><option>景點</option><option>餐廳</option><option>咖啡廳</option><option>購物</option><option>交通</option><option>航班</option><option>住宿</option><option>其他</option></select></div>
      <div><label>付款方式</label><select id="ppm">${optsPayMethod("未定")}</select></div>
    </div>
    <label>行程名稱</label><input id="pname">
    <div id="lockedNameHint" class="lockedFieldHint" style="display:none">此行程由航班／住宿／口袋景點帶入，名稱不可編輯；可回來源資料調整。</div>
    <div class="four compactMobile">
      <div><label>${esc(data.trip.currency)} 金額</label><input id="pforeign" type="number" oninput="syncPlanMoney('f')"></div>
      <div><label>TWD</label><input id="ptwd" type="number" oninput="syncPlanMoney('t')"></div>
      <div class="full"><label>付款人</label><select id="pp">${optsPayer("未定")}</select></div>
    </div>
    <label>注意事項</label><textarea id="pnote"></textarea>
    <label>備註</label><textarea id="pmemo"></textarea>
    <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"儲存行程":"加入行程"}</button>${editingPlanId||v16PendingSpotId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
  </div></details>
  <div id="pcards">${planCards(plans)}</div>`;
  if(editingPlanId) fillPlanForm(editingPlanId);
  if(v16PendingSpotId) v16FillPendingSpot();
  v21ApplyLockedNameState();
}

function fillPlanForm(id){
  let p=data.plans.find(x=>x.id==id);
  if(!p)return;
  ["pday","ps","pe","ptype","pname","pforeign","ptwd","pp","ppm","pnote","pmemo"].forEach((id2,i)=>$(id2).value=[p.day,p.start,p.end,p.type,p.name,moneyForeign(p),moneyTwd(p),p.payer,p.payMethod||"未定",p.note,p.memo][i]);
  v21ApplyLockedNameState();
}

function v16FillPendingSpot(){
  const s=data.spots.find(x=>x.id==v16PendingSpotId);
  if(!s)return;
  $("pday").value=s.day||cur;
  $("ptype").value=["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點";
  $("pname").value=s.name;
  $("pnote").value=s.memo;
  $("pname").readOnly=true;
  $("pname").classList.add("lockedInput");
  $("lockedNameHint").style.display="block";
}

function v21ApplyLockedNameState(){
  const p=editingPlanId?data.plans.find(x=>x.id==editingPlanId):null;
  const locked=!!(p?.lockedName || v16PendingSpotId);
  if($("pname")){
    $("pname").readOnly=locked;
    $("pname").classList.toggle("lockedInput",locked);
  }
  if($("lockedNameHint")) $("lockedNameHint").style.display=locked?"block":"none";
}

function savePlanForm(){
  if(!$("pname").value)return toast("請輸入行程名稱");
  if(!v23ValidatePlanForm())return;

  let item={day:$("pday").value,start:$("ps").value,end:$("pe").value,type:$("ptype").value,name:$("pname").value,mode:"foreign",foreign:Number($("pforeign").value||0),twd:Number($("ptwd").value||0),payer:$("pp").value,payMethod:$("ppm").value,note:$("pnote").value,memo:$("pmemo").value,adjusted:false};
  let planId=editingPlanId;

  if(editingPlanId){
    const existing=data.plans.find(p=>p.id==editingPlanId);
    if(existing?.lockedName){
      item.name=existing.name;
      item.sourceType=existing.sourceType;
      item.lockedName=true;
      if(existing.hotelId)item.hotelId=existing.hotelId;
    }
    Object.assign(existing,item);
    editingPlanId=null;
  }else{
    planId=uid();
    data.plans.push({id:planId,...item});
  }

  if(v16PendingSpotId){
    const spot=data.spots.find(s=>s.id==v16PendingSpotId);
    const p=data.plans.find(x=>x.id==planId);
    if(spot && p){
      spot.planId=planId;
      p.sourceType="spot";
      p.lockedName=true;
      p.name=spot.name;
      p.memo=p.memo || "由口袋景點帶入";
    }
    v16PendingSpotId=null;
  }

  cur=item.day;
  save();
}

function createBudgetFromPlanSnapshot(plan){
  // 不建立關聯 id/sourceId，只複製當下行程文字成一筆可獨立編輯的預算。
  if(!plan || !plan.name)return;
  data.expenses.push({
    id:uid(),
    source:"行程",
    type:plan.type || "其他",
    name:plan.name,
    payer:"未定",
    payMethod:"未定",
    day:plan.day || "",
    mode:"TWD",
    foreign:0,
    twd:0,
    memo:"由行程建立，可自行補金額"
  });
}

function renderPlanner(){
  normalizePlanTimes(cur);
  let plans=sortedPlans(cur);
  $("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
  <details class="card" ${editingPlanId||v16PendingSpotId?"open":""}><summary>${editingPlanId?"編輯行程":"＋ 新增行程"}</summary><div class="detailBody">
    <div class="planFormLite">
      <div class="three compactMobile">
        <div class="full"><label>日期</label><select id="pday" onchange="cur=this.value; renderPlanner();">${optsDays(cur)}</select></div>
        <div><label>開始</label><input id="ps" type="time" value="10:00"></div>
        <div><label>結束</label><input id="pe" type="time" value="11:30"></div>
      </div>
      <div><label>分類</label><select id="ptype"><option>景點</option><option>餐廳</option><option>咖啡廳</option><option>購物</option><option>交通</option><option>航班</option><option>住宿</option><option>其他</option></select></div>
      <div><label>行程名稱</label><input id="pname"></div>
      <div id="lockedNameHint" class="lockedFieldHint" style="display:none">此行程由航班／住宿／口袋景點帶入，名稱不可編輯；備註可以自由修改。</div>
      <label>注意事項</label><textarea id="pnote"></textarea>
      <label>備註</label><textarea id="pmemo"></textarea>
      <div class="planBudgetHint">新增行程時會自動在「預算」建立一筆花費；之後可到預算頁自行編輯或刪除，不會與行程連動。</div>
      <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"存好行程":"加入行程"}</button>${editingPlanId||v16PendingSpotId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
    </div>
  </div></details>
  <div id="pcards">${planCards(plans)}</div>`;
  if(editingPlanId) fillPlanForm(editingPlanId);
  if(v16PendingSpotId) v16FillPendingSpot();
  v21ApplyLockedNameState();
}

function fillPlanForm(id){
  let p=data.plans.find(x=>x.id==id);
  if(!p)return;
  $("pday").value=p.day||cur;
  $("ps").value=p.start||"";
  $("pe").value=p.end||"";
  $("ptype").value=p.type||"景點";
  $("pname").value=p.name||"";
  $("pnote").value=p.note||"";
  $("pmemo").value=p.memo||"";
  v21ApplyLockedNameState();
}

function v16FillPendingSpot(){
  const s=data.spots.find(x=>x.id==v16PendingSpotId);
  if(!s)return;
  $("pday").value=s.day||cur;
  $("ptype").value=["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點";
  $("pname").value=s.name;
  $("pnote").value=s.memo;
  $("pmemo").value="由口袋景點帶入";
  $("pname").readOnly=true;
  $("pname").classList.add("lockedInput");
  $("lockedNameHint").style.display="block";
}

function savePlanForm(){
  if(!$("pname").value)return toast("請輸入行程名稱");
  if(!v23ValidatePlanForm())return;

  let item={
    day:$("pday").value,
    start:$("ps").value,
    end:$("pe").value,
    type:$("ptype").value,
    name:$("pname").value,
    mode:"foreign",
    foreign:0,
    twd:0,
    payer:"未定",
    payMethod:"未定",
    note:$("pnote").value,
    memo:$("pmemo").value,
    adjusted:false
  };
  let planId=editingPlanId;
  let isNew=false;

  if(editingPlanId){
    const existing=data.plans.find(p=>p.id==editingPlanId);
    if(existing?.lockedName){
      item.name=existing.name;
      item.sourceType=existing.sourceType;
      item.lockedName=true;
      if(existing.hotelId)item.hotelId=existing.hotelId;
    }
    Object.assign(existing,item);
    editingPlanId=null;
  }else{
    isNew=true;
    planId=uid();
    data.plans.push({id:planId,...item});
  }

  if(v16PendingSpotId){
    const spot=data.spots.find(s=>s.id==v16PendingSpotId);
    const p=data.plans.find(x=>x.id==planId);
    if(spot && p){
      spot.planId=planId;
      p.sourceType="spot";
      p.lockedName=true;
      p.name=spot.name;
      p.memo=p.memo || "由口袋景點帶入";
    }
    v16PendingSpotId=null;
  }

  const savedPlan=data.plans.find(x=>x.id==planId);
  if(isNew && savedPlan){
    createBudgetFromPlanSnapshot(savedPlan);
  }

  cur=item.day;
  save();
  toast(isNew ? "行程加好了，也幫你先記一筆花費！" : "已幫你存好行程囉！");
}

function planCards(plans){
  if(!plans.length)return`<div class="empty">這天還沒有行程</div>`;
  let html="";
  plans.forEach((p,i)=>{
    if(i>0)html+=connHtml(plans[i-1],p);
    html+=`<div class="card plan"><div class="section"><div><div class="time">${p.start||"--:--"}-${p.end||"--:--"}</div><div class="place">${activityIcon(p.type)} ${esc(p.name)}</div><div class="tags planCardMeta"><span class="tag">${esc(p.type)}</span>${p.sourceType?`<span class="tag blue">${p.sourceType==="flight"?"航班帶入":p.sourceType==="hotel"?"住宿帶入":p.sourceType==="spot"?"口袋景點帶入":"來源帶入"}</span>`:""}${p.adjusted?'<span class="tag green">已依交通調整</span>':""}</div></div><div><button class="small" onclick="map('${encodeURIComponent(p.name+' '+data.trip.dest)}')">地圖</button><button class="small" onclick="editPlan('${p.id}')">編輯</button><button class="small" onclick="delPlan('${p.id}')">刪除</button></div></div><div class="grid2"><div class="box pink"><b>注意</b><br>${esc(p.note||"")}</div><div class="box blue"><b>備註</b><br>${esc(p.memo||"")}</div></div></div>`;
  });
  return html;
}

function v16AddPlanNode(item){
  if(!item.day||!item.name)return null;
  if(v16PlanExists(item.day,item.name,item.start)) return null;
  const plan={id:uid(),mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:"",memo:"",adjusted:false,...item};
  data.plans.push(plan);
  // 自動產生的航班/住宿行程也建立一筆可獨立刪改的預算；不建立關聯。
  createBudgetFromPlanSnapshot(plan);
  return plan.id;
}

function delPlan(id){
  // 暫時不做來源同步刪除，也不連動預算。
  data.plans=data.plans.filter(x=>x.id!=id);
  data.conns=data.conns.filter(c=>c.a!=id&&c.b!=id);
  save();
}

function normalizePlanType(type){
  if(!type || type==="undefined" || type==="null") return "其他";
  const t=String(type).trim();
  if(!t) return "其他";
  if(PLAN_TYPES.includes(t)) return t;
  return "其他";
}

function budgetTypeFromPlanType(type){
  const t=normalizePlanType(type);
  const map={
    "景點":"景點票券",
    "餐廳":"餐飲",
    "咖啡廳":"餐飲",
    "購物":"購物",
    "交通":"交通票券",
    "航班":"機票",
    "住宿":"住宿",
    "雨天備案":"其他",
    "其他":"其他"
  };
  return map[t] || "其他";
}

function setCurrentDay(day, options={}){
  if(day && v23InTripRange(day)){
    currentDay = day;
    cur = day;
  }else if(data.days?.[0]?.key){
    currentDay = data.days[0].key;
    cur = currentDay;
  }

  if(options.render !== false){
    renderDays();
    if(view==="planner") renderPlanner({preserveForm: options.preserveForm});
  }
}

function getPlanFormDraft(){
  if(!$("pday")) return null;
  return {
    day:$("pday")?.value || currentDay,
    start:$("ps")?.value || "",
    end:$("pe")?.value || "",
    type:normalizePlanType($("ptype")?.value || "景點"),
    name:$("pname")?.value || "",
    note:$("pnote")?.value || "",
    memo:$("pmemo")?.value || ""
  };
}

function applyPlanFormDraft(draft){
  if(!draft || !$("pday")) return;
  $("pday").value = draft.day || currentDay;
  $("ps").value = draft.start || "";
  $("pe").value = draft.end || "";
  $("ptype").value = normalizePlanType(draft.type);
  $("pname").value = draft.name || "";
  $("pnote").value = draft.note || "";
  $("pmemo").value = draft.memo || "";
  v21ApplyLockedNameState();
}

function renderDays(){
  normalizeAllPlanTypes();
  $("days").innerHTML=data.days.map(d=>{
    let h=hotelFor(d.key),n=data.plans.filter(p=>p.day==d.key).length;
    return `<div class="day ${d.key==currentDay?"active":""}" onclick="setCurrentDay('${d.key}',{preserveForm:true});go('planner')"><b>${d.title}｜${d.label}</b><span>${n} 行程｜住宿：${h?esc(h.name):"未設定"}</span></div>`;
  }).join("");
}

function renderSide(){
  const layout=document.querySelector(".layout");
  const panel=document.querySelector(".panel");
  if(layout){
    layout.classList.toggle("withCalendar", view==="planner");
    layout.classList.toggle("noCalendar", view!=="planner");
    if(window.innerWidth>620){
      layout.style.gridTemplateColumns = view==="planner" ? "280px 1fr" : "1fr";
    }else{
      layout.style.gridTemplateColumns = "";
    }
  }
  if(panel) panel.style.display = view==="planner" ? "" : "none";
  renderDays();
  const btns = document.querySelector(".panel .btns");
  if(btns) btns.innerHTML = `<button class="btn danger compact" onclick="clearAllPlans()">清除所有行程</button>`;
}

function optsPlanTypes(selected="景點"){
  const safe=normalizePlanType(selected);
  return PLAN_TYPES.map(t=>`<option value="${t}" ${safe===t?"selected":""}>${t}</option>`).join("");
}

function createBudgetFromPlanSnapshot(plan){
  // 不建立關聯 id/sourceId，只複製當下行程文字成一筆可獨立編輯的預算。
  if(!plan || !plan.name)return;
  const pType=normalizePlanType(plan.type);
  data.expenses.push({
    id:uid(),
    source:"行程",
    type:budgetTypeFromPlanType(pType),
    name:plan.name,
    payer:"未定",
    payMethod:"未定",
    day:plan.day || "",
    mode:"TWD",
    foreign:0,
    twd:0,
    memo:`由${pType}行程建立，可自行補金額`
  });
}

function renderPlanner(options={}){
  normalizeAllPlanTypes();
  const draft = options.preserveForm ? getPlanFormDraft() : null;
  cur=currentDay || cur || data.days?.[0]?.key;
  normalizePlanTimes(cur);
  let plans=sortedPlans(cur);
  $("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
  <details class="card" ${(editingPlanId||v16PendingSpotId||draft)?"open":""}><summary>${editingPlanId?"編輯行程":"＋ 新增行程"}</summary><div class="detailBody">
    <div class="planFormLite">
      <div class="three compactMobile">
        <div class="full"><label>日期</label><select id="pday" onchange="handlePlanDayChange(this.value)">${optsDays(cur)}</select></div>
        <div><label>開始</label><input id="ps" type="time" value="10:00"></div>
        <div><label>結束</label><input id="pe" type="time" value="11:30"></div>
      </div>
      <div><label>分類</label><select id="ptype">${optsPlanTypes("景點")}</select></div>
      <div><label>行程名稱</label><input id="pname"></div>
      <div id="lockedNameHint" class="lockedFieldHint" style="display:none">此行程由航班／住宿／口袋景點帶入，名稱不可編輯；備註可以自由修改。</div>
      <label>注意事項</label><textarea id="pnote"></textarea>
      <label>備註</label><textarea id="pmemo"></textarea>
      <div class="planBudgetHint">新增行程時會自動在「預算」建立一筆花費；之後可到預算頁自行編輯或刪除，不會與行程連動。</div>
      <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"存好行程":"加入行程"}</button>${editingPlanId||v16PendingSpotId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
    </div>
  </div></details>
  <div id="pcards">${planCards(plans)}</div>`;

  if(editingPlanId) fillPlanForm(editingPlanId);
  else if(v16PendingSpotId) v16FillPendingSpot();
  else if(draft) applyPlanFormDraft({...draft, day:cur});
  else if($("pday")) $("pday").value=cur;

  v21ApplyLockedNameState();
}

function handlePlanDayChange(day){
  const draft=getPlanFormDraft();
  draft.day=day;
  setCurrentDay(day,{render:false});
  renderPlanner({preserveForm:true});
  applyPlanFormDraft(draft);
}

function fillPlanForm(id){
  let p=data.plans.find(x=>x.id==id);
  if(!p)return;
  p.type=normalizePlanType(p.type);
  $("pday").value=p.day||currentDay||cur;
  $("ps").value=p.start||"";
  $("pe").value=p.end||"";
  $("ptype").value=p.type;
  $("pname").value=p.name||"";
  $("pnote").value=p.note||"";
  $("pmemo").value=p.memo||"";
  v21ApplyLockedNameState();
}

function v16FillPendingSpot(){
  const s=data.spots.find(x=>x.id==v16PendingSpotId);
  if(!s)return;
  const safeType=normalizePlanType(["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點");
  $("pday").value=s.day||currentDay||cur;
  $("ptype").value=safeType;
  $("pname").value=s.name;
  $("pnote").value=s.memo;
  $("pmemo").value="由口袋景點帶入";
  $("pname").readOnly=true;
  $("pname").classList.add("lockedInput");
  $("lockedNameHint").style.display="block";
}

function savePlanForm(){
  if(!$("pname").value)return toast("請輸入行程名稱");
  if(!v23ValidatePlanForm())return;

  const safeType=normalizePlanType($("ptype").value);
  let item={
    day:$("pday").value,
    start:$("ps").value,
    end:$("pe").value,
    type:safeType,
    name:$("pname").value,
    mode:"foreign",
    foreign:0,
    twd:0,
    payer:"未定",
    payMethod:"未定",
    note:$("pnote").value,
    memo:$("pmemo").value,
    adjusted:false
  };
  let planId=editingPlanId;
  let isNew=false;

  if(editingPlanId){
    const existing=data.plans.find(p=>p.id==editingPlanId);
    if(existing?.lockedName){
      item.name=existing.name;
      item.sourceType=existing.sourceType;
      item.lockedName=true;
      if(existing.hotelId)item.hotelId=existing.hotelId;
    }
    Object.assign(existing,item);
    existing.type=normalizePlanType(existing.type);
    editingPlanId=null;
  }else{
    isNew=true;
    planId=uid();
    data.plans.push({id:planId,...item});
  }

  if(v16PendingSpotId){
    const spot=data.spots.find(s=>s.id==v16PendingSpotId);
    const p=data.plans.find(x=>x.id==planId);
    if(spot && p){
      spot.planId=planId;
      p.sourceType="spot";
      p.lockedName=true;
      p.name=spot.name;
      p.type=normalizePlanType(p.type || spot.type || "景點");
      p.memo=p.memo || "由口袋景點帶入";
    }
    v16PendingSpotId=null;
  }

  const savedPlan=data.plans.find(x=>x.id==planId);
  if(isNew && savedPlan){
    savedPlan.type=normalizePlanType(savedPlan.type);
    createBudgetFromPlanSnapshot(savedPlan);
  }

  setCurrentDay(item.day,{render:false});
  save();
  toast(isNew ? "行程加好了，也幫你先記一筆花費！" : "已幫你存好行程囉！");
}

function planCards(plans){
  normalizeAllPlanTypes();
  if(!plans.length)return`<div class="empty">這天還沒有行程</div>`;
  let html="";
  plans.forEach((p,i)=>{
    p.type=normalizePlanType(p.type);
    if(i>0)html+=connHtml(plans[i-1],p);
    html+=`<div class="card plan"><div class="section"><div><div class="time">${p.start||"--:--"}-${p.end||"--:--"}</div><div class="place">${activityIcon(p.type)} ${esc(p.name)}</div><div class="tags planCardMeta"><span class="tag">${esc(p.type)}</span>${p.sourceType?`<span class="tag blue">${p.sourceType==="flight"?"航班帶入":p.sourceType==="hotel"?"住宿帶入":p.sourceType==="spot"?"口袋景點帶入":"來源帶入"}</span>`:""}${p.adjusted?'<span class="tag green">已依交通調整</span>':""}</div></div><div><button class="small" onclick="map('${encodeURIComponent(p.name+' '+data.trip.dest)}')">地圖</button><button class="small" onclick="editPlan('${p.id}')">編輯</button><button class="small" onclick="delPlan('${p.id}')">刪除</button></div></div><div class="grid2"><div class="box pink"><b>注意</b><br>${esc(p.note||"")}</div><div class="box blue"><b>備註</b><br>${esc(p.memo||"")}</div></div></div>`;
  });
  return html;
}

function v16AddPlanNode(item){
  if(!item.day||!item.name)return null;
  item.type=normalizePlanType(item.type);
  if(v16PlanExists(item.day,item.name,item.start)) return null;
  const plan={id:uid(),mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:"",memo:"",adjusted:false,...item};
  plan.type=normalizePlanType(plan.type);
  data.plans.push(plan);
  createBudgetFromPlanSnapshot(plan);
  return plan.id;
}

function clearPlanForm(){
  editingPlanId=null;
  v16PendingSpotId=null;
  renderPlanner();
}

function savePlanForm(){
  if(!$("pname").value)return toast("請輸入行程名稱");
  if(!v23ValidatePlanForm())return;

  const safeType=normalizePlanType($("ptype").value);
  let item={
    day:$("pday").value,
    start:$("ps").value,
    end:$("pe").value,
    type:safeType,
    name:$("pname").value,
    source:"manual",
    mode:"foreign",
    foreign:0,
    twd:0,
    payer:"未定",
    payMethod:"未定",
    note:$("pnote").value,
    memo:$("pmemo").value,
    adjusted:false
  };
  let planId=editingPlanId;
  let isNew=false;

  if(editingPlanId){
    const existing=data.plans.find(p=>p.id==editingPlanId);
    if(existing?.lockedName){
      item.name=existing.name;
      item.source=existing.source || v28NormalizeSourceFromLegacy(existing);
      item.sourceType=existing.sourceType;
      item.lockedName=true;
      if(existing.hotelId)item.hotelId=existing.hotelId;
    }
    Object.assign(existing,item);
    existing.type=normalizePlanType(existing.type);
    editingPlanId=null;
  }else{
    isNew=true;
    planId=uid();
    data.plans.push({id:planId,...item});
  }

  if(v16PendingSpotId){
    const spot=data.spots.find(s=>s.id==v16PendingSpotId);
    const p=data.plans.find(x=>x.id==planId);
    if(spot && p){
      spot.planId=planId;
      p.source="manual";
      p.sourceType="spot";
      p.lockedName=true;
      p.name=spot.name;
      p.type=normalizePlanType(p.type || spot.type || "景點");
      p.memo=p.memo || "由口袋景點帶入";
    }
    v16PendingSpotId=null;
  }

  const savedPlan=data.plans.find(x=>x.id==planId);
  if(isNew && savedPlan){
    savedPlan.type=normalizePlanType(savedPlan.type);
    createBudgetFromPlanSnapshot(savedPlan);
  }

  setCurrentDay(item.day,{render:false});
  save();
  toast(isNew ? "行程加好了，也幫你先記一筆花費！" : "已幫你存好行程囉！");
}

function createBudgetFromPlanSnapshot(plan){
  if(!plan || !plan.name)return;

  const source = plan.source || plan.sourceType || "";
  if(source==="flight" || source==="hotel"){
    return;
  }

  const pType = typeof normalizePlanType === "function" ? normalizePlanType(plan.type) : (plan.type || "其他");
  data.expenses.push({
    id:uid(),
    source:"行程",
    type:typeof budgetTypeFromPlanType === "function" ? budgetTypeFromPlanType(pType) : pType,
    name:plan.name,
    payer:"未定",
    payMethod:"未定",
    day:plan.day || "",
    mode:"TWD",
    foreign:0,
    twd:0,
    memo:`由${pType}行程建立，可自行補金額`
  });
}

// 2) 刪除口袋景點不用彈跳確認。
function itineraryTimeText(p){
  const s = p.start || "--:--";
  const e = p.end || "";
  return {start:s, end:e};
}

function itinerarySourceText(p){
  if(p.source==="flight" || p.sourceType==="flight") return "航班帶入";
  if(p.source==="hotel" || p.sourceType==="hotel") return "住宿帶入";
  if(p.source==="spot" || p.sourceType==="spot") return "口袋景點";
  return "手動行程";
}

function premiumPlanCard(p){
  const t = itineraryTimeText(p);
  const locked = p.lockedName || p.source==="flight" || p.source==="hotel";
  return `<div class="itineraryItem" data-id="${p.id}">
    <div class="itineraryDotWrap"><span class="itineraryDot"></span></div>
    <article class="itineraryCard">
      <div class="itineraryTop">
        <div class="itineraryTimeBlock">
          <span class="itineraryTime">${esc(t.start)}</span>
          ${t.end?`<span class="itineraryEndTime">至 ${esc(t.end)}</span>`:""}
        </div>
        <div class="itineraryTitleBlock">
          <div class="itineraryTitleLine">
            <span class="itineraryMapIcon" title="預留地圖定位">📍</span>
            <h3 class="itineraryTitle">${activityIcon(p.type)} ${esc(p.name)}</h3>
          </div>
          <div class="itineraryMeta">
            <span class="itineraryTypePill">${esc(p.type||"其他")}</span>
            <span class="itinerarySourcePill">${esc(itinerarySourceText(p))}</span>
            ${p.adjusted?'<span class="itineraryTypePill">已依交通調整</span>':""}
            ${moneyForeign(p)||moneyTwd(p)?`<span class="itinerarySourcePill">${esc(data.trip.currency)} ${fmt(moneyForeign(p))}｜TWD ${fmt(moneyTwd(p))}</span>`:""}
          </div>
          ${p.note?`<div class="itineraryNote"><b>注意：</b>${esc(p.note)}</div>`:""}
          ${p.memo?`<div class="itineraryNote"><b>備註：</b>${esc(p.memo)}</div>`:""}
        </div>
        <div class="itineraryActions">
          <button class="small" onclick="routeCurrent('${encodeURIComponent((p.name||"")+" "+(data.trip.dest||""))}')">地圖</button>
          <button class="small" onclick="editPlan('${p.id}')">編輯</button>
          <button class="small" onclick="delPlan('${p.id}')">刪除</button>
        </div>
      </div>
    </article>
  </div>`;
}

function planCards(plans){
  if(!plans.length) return '<div class="itineraryEmpty">這天還沒有行程，新增第一個景點後就會形成時間軸。</div>';
  let html='<div class="itineraryTimeline">';
  plans.forEach((p,i)=>{
    if(i>0) html += connHtml(plans[i-1],p);
    html += premiumPlanCard(p);
  });
  html += '</div>';
  return html;
}
function premiumPlanCard(p){
  const t = itineraryTimeText(p);
  return `<div class="itineraryItem" data-id="${p.id}">
    <div class="itineraryDotWrap"><span class="itineraryDot"></span></div>
    <article class="itineraryCard">
      <div class="itineraryTop">
        <div class="itineraryTimeBlock">
          <span class="itineraryTime">${esc(t.start)}</span>
          ${t.end?`<span class="itineraryEndTime">至 ${esc(t.end)}</span>`:""}
        </div>
        <div class="itineraryTitleBlock">
          <div class="itineraryTitleLine">
            <h3 class="itineraryTitle">${activityIcon(p.type)} ${esc(p.name)}</h3>
          </div>
          <div class="itineraryMeta">
            <span class="itineraryTypePill">${esc(p.type||"其他")}</span>
            <span class="itinerarySourcePill">${esc(itinerarySourceText(p))}</span>
            ${p.adjusted?'<span class="itineraryTypePill">已依交通調整</span>':""}
            ${moneyForeign(p)||moneyTwd(p)?`<span class="itinerarySourcePill">${esc(data.trip.currency)} ${fmt(moneyForeign(p))}｜TWD ${fmt(moneyTwd(p))}</span>`:""}
          </div>
          ${p.note?`<div class="itineraryNote"><b>注意：</b>${esc(p.note)}</div>`:""}
          ${p.memo?`<div class="itineraryNote"><b>備註：</b>${esc(p.memo)}</div>`:""}
        </div>
        <div class="itineraryActions">
          <button class="small" onclick="routeCurrent('${encodeURIComponent((p.name||"")+" "+(data.trip.dest||""))}')">地圖</button>
          <button class="small" onclick="editPlan('${p.id}')">編輯</button>
          <button class="small" onclick="delPlan('${p.id}')">刪除</button>
        </div>
      </div>
    </article>
  </div>`;
}

const __renderPlannerBeforeV51Map = renderPlanner;
renderPlanner = function(){
  __renderPlannerBeforeV51Map();
  const view = $("plannerView");
  if(!view) return;
  const heading = view.querySelector(".section");
  if(heading && !$("routeMapCard-" + cur)){
    heading.insertAdjacentHTML("afterend", routeMapHtml(cur));
  }
};
/*
資料結構最小擴充：
plan.address = ""  // 選填；舊資料沒有 address 時自動視為空字串

設計原則：
- 不改預算資料結構，行程建立預算時不帶 address
- 不改照片書顯示，照片書不顯示 address
- 航班 / 住宿自動帶入行程 address 預設留空
- 口袋景點排入行程時，可用既有 addr 帶入 plan.address，提升地圖定位準確度
- OSM / 未來 Google Maps 都可優先使用 address
*/

function getPlanFormDraft(){
  if(!$("pday")) return null;
  return {
    day:$("pday")?.value || currentDay,
    start:$("ps")?.value || "",
    end:$("pe")?.value || "",
    type:normalizePlanType($("ptype")?.value || "景點"),
    name:$("pname")?.value || "",
    address:$("paddress")?.value || "",
    note:$("pnote")?.value || "",
    memo:$("pmemo")?.value || ""
  };
}

function applyPlanFormDraft(draft){
  if(!draft || !$("pday")) return;
  $("pday").value = draft.day || currentDay;
  $("ps").value = draft.start || "";
  $("pe").value = draft.end || "";
  $("ptype").value = normalizePlanType(draft.type);
  $("pname").value = draft.name || "";
  if($("paddress")) $("paddress").value = draft.address || "";
  $("pnote").value = draft.note || "";
  $("pmemo").value = draft.memo || "";
  v21ApplyLockedNameState();
}

function renderPlanner(options={}){
  v28NormalizePlans();
  normalizeAllPlanTypes();
  const draft = options.preserveForm ? getPlanFormDraft() : null;
  cur=currentDay || cur || data.days?.[0]?.key;
  normalizePlanTimes(cur);
  let plans=sortedPlans(cur);
  $("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
  ${typeof routeMapHtml==="function" ? routeMapHtml(cur) : ""}
  <details class="card" ${(editingPlanId||v16PendingSpotId||draft)?"open":""}><summary>${editingPlanId?"編輯行程":"＋ 新增行程"}</summary><div class="detailBody">
    <div class="planFormLite">
      <div class="three compactMobile">
        <div class="full"><label>日期</label><select id="pday" onchange="handlePlanDayChange(this.value)">${optsDays(cur)}</select></div>
        <div><label>開始</label><input id="ps" type="time" value="10:00"></div>
        <div><label>結束</label><input id="pe" type="time" value="11:30"></div>
      </div>
      <div><label>分類</label><select id="ptype">${optsPlanTypes("景點")}</select></div>
      <div><label>行程名稱</label><input id="pname"></div>
      <div id="lockedNameHint" class="lockedFieldHint" style="display:none">此行程由航班／住宿／口袋景點帶入，名稱不可編輯；備註可以自由修改。</div>
      <div>
        <label>地址 / 地圖定位資訊（選填）</label>
        <input id="paddress" placeholder="例：Haeundae Beach, Busan 或 韓國釜山海雲台">
        <div class="planAddressHint">用於 OpenStreetMap 定位；可留空。未來若改接 Google Maps API 也能沿用這個欄位。</div>
      </div>
      <label>注意事項</label><textarea id="pnote"></textarea>
      <label>備註</label><textarea id="pmemo"></textarea>
      <div class="planBudgetHint">新增行程時會自動在「預算」建立一筆花費；地址不會帶入預算或照片書。</div>
      <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"存好行程":"加入行程"}</button>${editingPlanId||v16PendingSpotId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
    </div>
  </div></details>
  <div id="pcards">${planCards(plans)}</div>`;

  if(editingPlanId) fillPlanForm(editingPlanId);
  else if(v16PendingSpotId) v16FillPendingSpot();
  else if(draft) applyPlanFormDraft({...draft, day:cur});
  else if($("pday")) $("pday").value=cur;

  v21ApplyLockedNameState();
}

function fillPlanForm(id){
  let p=data.plans.find(x=>x.id==id);
  if(!p)return;
  p.type=normalizePlanType(p.type);
  if(typeof p.address === "undefined") p.address = "";
  $("pday").value=p.day||currentDay||cur;
  $("ps").value=p.start||"";
  $("pe").value=p.end||"";
  $("ptype").value=p.type;
  $("pname").value=p.name||"";
  if($("paddress")) $("paddress").value=p.address||"";
  $("pnote").value=p.note||"";
  $("pmemo").value=p.memo||"";
  v21ApplyLockedNameState();
}

function v16FillPendingSpot(){
  const s=data.spots.find(x=>x.id==v16PendingSpotId);
  if(!s)return;
  const safeType=normalizePlanType(["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點");
  $("pday").value=s.day||currentDay||cur;
  $("ptype").value=safeType;
  $("pname").value=s.name;
  if($("paddress")) $("paddress").value=s.addr||"";
  $("pnote").value=s.memo;
  $("pmemo").value="由口袋景點帶入";
  $("pname").readOnly=true;
  $("pname").classList.add("lockedInput");
  $("lockedNameHint").style.display="block";
}

function savePlanForm(){
  if(!$("pname").value)return toast("請輸入行程名稱");
  if(!v23ValidatePlanForm())return;

  const safeType=normalizePlanType($("ptype").value);
  let item={
    day:$("pday").value,
    start:$("ps").value,
    end:$("pe").value,
    type:safeType,
    name:$("pname").value,
    address:$("paddress")?.value || "",
    source:"manual",
    mode:"foreign",
    foreign:0,
    twd:0,
    payer:"未定",
    payMethod:"未定",
    note:$("pnote").value,
    memo:$("pmemo").value,
    adjusted:false
  };
  let planId=editingPlanId;
  let isNew=false;

  if(editingPlanId){
    const existing=data.plans.find(p=>p.id==editingPlanId);
    if(existing?.lockedName){
      item.name=existing.name;
      item.source=existing.source || v28NormalizeSourceFromLegacy(existing);
      item.sourceType=existing.sourceType;
      item.lockedName=true;
      if(existing.hotelId)item.hotelId=existing.hotelId;

      // 航班 / 住宿自動帶入的行程地址維持空白，避免和來源資料混淆
      if(item.source==="flight" || item.source==="hotel"){
        item.address="";
      }
    }
    Object.assign(existing,item);
    existing.type=normalizePlanType(existing.type);
    if(typeof existing.address === "undefined") existing.address="";
    editingPlanId=null;
  }else{
    isNew=true;
    planId=uid();
    data.plans.push({id:planId,...item});
  }

  if(v16PendingSpotId){
    const spot=data.spots.find(s=>s.id==v16PendingSpotId);
    const p=data.plans.find(x=>x.id==planId);
    if(spot && p){
      spot.planId=planId;
      p.source="manual";
      p.sourceType="spot";
      p.lockedName=true;
      p.name=spot.name;
      p.type=normalizePlanType(p.type || spot.type || "景點");
      p.address=spot.addr||p.address||"";
      p.memo=p.memo || "由口袋景點帶入";
    }
    v16PendingSpotId=null;
  }

  const savedPlan=data.plans.find(x=>x.id==planId);
  if(isNew && savedPlan){
    savedPlan.type=normalizePlanType(savedPlan.type);
    if(typeof savedPlan.address === "undefined") savedPlan.address="";
    createBudgetFromPlanSnapshot(savedPlan); // 預算函數不使用 address
  }

  setCurrentDay(item.day,{render:false});
  save();
  toast(isNew ? "行程加好了，也幫你先記一筆花費！" : "已幫你存好行程囉！");
}

function itineraryMapQuery(p){
  const primary = (p.address || "").trim();
  if(primary) return [primary, data.trip.dest, data.trip.country].filter(Boolean).join(" ");
  return [(p.name||""), data.trip.dest, data.trip.country].filter(Boolean).join(" ");
}

function premiumPlanCard(p){
  const t = itineraryTimeText(p);
  const mapQuery = itineraryMapQuery(p);
  return `<div class="itineraryItem" data-id="${p.id}">
    <div class="itineraryDotWrap"><span class="itineraryDot"></span></div>
    <article class="itineraryCard">
      <div class="itineraryTop">
        <div class="itineraryTimeBlock">
          <span class="itineraryTime">${esc(t.start)}</span>
          ${t.end?`<span class="itineraryEndTime">至 ${esc(t.end)}</span>`:""}
        </div>
        <div class="itineraryTitleBlock">
          <div class="itineraryTitleLine">
            <h3 class="itineraryTitle">${activityIcon(p.type)} ${esc(p.name)}</h3>
          </div>
          <div class="itineraryMeta">
            <span class="itineraryTypePill">${esc(p.type||"其他")}</span>
            <span class="itinerarySourcePill">${esc(itinerarySourceText(p))}</span>
            ${p.address?'<span class="itineraryAddressPill">已填地址</span>':""}
            ${p.adjusted?'<span class="itineraryTypePill">已依交通調整</span>':""}
            ${moneyForeign(p)||moneyTwd(p)?`<span class="itinerarySourcePill">${esc(data.trip.currency)} ${fmt(moneyForeign(p))}｜TWD ${fmt(moneyTwd(p))}</span>`:""}
          </div>
          ${p.note?`<div class="itineraryNote"><b>注意：</b>${esc(p.note)}</div>`:""}
          ${p.memo?`<div class="itineraryNote"><b>備註：</b>${esc(p.memo)}</div>`:""}
        </div>
        <div class="itineraryActions">
          <button class="small" onclick="routeCurrent('${encodeURIComponent(mapQuery)}')">地圖</button>
          <button class="small" onclick="editPlan('${p.id}')">編輯</button>
          <button class="small" onclick="delPlan('${p.id}')">刪除</button>
        </div>
      </div>
    </article>
  </div>`;
}

function renderPlanner(options={}){
  v28NormalizePlans();
  normalizeAllPlanTypes();
  const draft = options.preserveForm ? getPlanFormDraft() : null;
  cur=currentDay || cur || data.days?.[0]?.key;
  normalizePlanTimes(cur);
  let plans=sortedPlans(cur);
  $("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
  <details class="card" ${(editingPlanId||v16PendingSpotId||draft)?"open":""}><summary>${editingPlanId?"編輯行程":"＋ 新增行程"}</summary><div class="detailBody">
    <div class="planFormLite">
      <div class="three compactMobile">
        <div class="full"><label>日期</label><select id="pday" onchange="handlePlanDayChange(this.value)">${optsDays(cur)}</select></div>
        <div><label>開始</label><input id="ps" type="time" value="10:00"></div>
        <div><label>結束</label><input id="pe" type="time" value="11:30"></div>
      </div>
      <div><label>分類</label><select id="ptype">${optsPlanTypes("景點")}</select></div>
      <div><label>行程名稱</label><input id="pname"></div>
      <div id="lockedNameHint" class="lockedFieldHint" style="display:none">此行程由航班／住宿／口袋景點帶入，名稱不可編輯；備註可以自由修改。</div>
      <div>
        <label>地址 / 地圖定位資訊（選填）</label>
        <input id="paddress" placeholder="例：Haeundae Beach, Busan 或 韓國釜山海雲台">
        <div class="planAddressHint">此欄位先保留作為未來地圖串接使用；目前不會自動呼叫地圖 API，也不會帶入預算或照片書。</div>
      </div>
      <label>注意事項</label><textarea id="pnote"></textarea>
      <label>備註</label><textarea id="pmemo"></textarea>
      <div class="planBudgetHint">新增行程時會自動在「預算」建立一筆花費；地址不會帶入預算或照片書。</div>
      <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"存好行程":"加入行程"}</button>${editingPlanId||v16PendingSpotId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
    </div>
  </div></details>
  <div id="pcards">${planCards(plans)}</div>`;

  if(editingPlanId) fillPlanForm(editingPlanId);
  else if(v16PendingSpotId) v16FillPendingSpot();
  else if(draft) applyPlanFormDraft({...draft, day:cur});
  else if($("pday")) $("pday").value=cur;

  v21ApplyLockedNameState();
}

// init() 移至檔案末尾執行，確保所有函式定義完畢
// initFirebaseSync() 移至檔案末尾執行

let storyPendingPhotoFiles = window.storyPendingPhotoFiles || {};
let storyEditingPhotoId = null;

