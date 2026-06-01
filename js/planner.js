/* ── planner.js ── */

function createBudgetFromPlanSnapshot(plan){if(!plan||!plan.name)return;const source=plan.source||plan.sourceType||"";if(source==="flight"||source==="hotel")return;const pType=normalizePlanType(plan.type);data.expenses.push({id:uid(),source:"行程",type:budgetTypeFromPlanType(pType),name:plan.name,payer:"未定",payMethod:"未定",day:plan.day||"",mode:"TWD",foreign:0,twd:0,memo:`由${pType}行程建立，可自行補金額`})}
function setCurrentDay(day,options={}){if(day&&v23InTripRange(day)){currentDay=day;cur=day}else if(data.days?.[0]?.key){currentDay=data.days[0].key;cur=currentDay}if(options.render!==false){renderDays();if(view==="planner")renderPlanner({preserveForm:options.preserveForm})}}
function getPlanFormDraft(){if(!$("pday"))return null;return{day:$("pday")?.value||currentDay,start:$("ps")?.value||"",end:$("pe")?.value||"",type:normalizePlanType($("ptype")?.value||"景點"),name:$("pname")?.value||"",note:$("pnote")?.value||"",memo:$("pmemo")?.value||""}}
function applyPlanFormDraft(draft){if(!draft||!$("pday"))return;$("pday").value=draft.day||currentDay;$("ps").value=draft.start||"";$("pe").value=draft.end||"";$("ptype").value=normalizePlanType(draft.type);$("pname").value=draft.name||"";$("pnote").value=draft.note||"";$("pmemo").value=draft.memo||"";v21ApplyLockedNameState()}
function handlePlanDayChange(day){const draft=getPlanFormDraft();draft.day=day;setCurrentDay(day,{render:false});renderPlanner({preserveForm:true});applyPlanFormDraft(draft)}
function v21ApplyLockedNameState(){const p=editingPlanId?data.plans.find(x=>x.id==editingPlanId):null;const locked=!!(p?.lockedName||v16PendingSpotId);if($("pname")){$("pname").readOnly=locked;$("pname").classList.toggle("lockedInput",locked)}if($("lockedNameHint"))$("lockedNameHint").style.display=locked?"block":"none"}

/* v645 最終版 v16FillPendingSpot（含時間帶入） */
function v16FillPendingSpot(){const s=data.spots.find(x=>x.id==v16PendingSpotId);if(!s)return;const safeType=normalizePlanType(["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點");$("pday").value=s.day||currentDay||cur;$("ptype").value=safeType;$("pname").value=s.name;if($("paddress"))$("paddress").value=s.addr||"";$("pnote").value=s.memo;$("pmemo").value="由口袋景點帶入";$("pname").readOnly=true;$("pname").classList.add("lockedInput");if($("lockedNameHint"))$("lockedNameHint").style.display="block";if($("ps")&&s.start)$("ps").value=s.start;if($("pe")&&s.end)$("pe").value=s.end}

/* 最終版 fillPlanForm（含 address 欄） */
function fillPlanForm(id){let p=data.plans.find(x=>x.id==id);if(!p)return;p.type=normalizePlanType(p.type);if(typeof p.address==="undefined")p.address="";$("pday").value=p.day||currentDay||cur;$("ps").value=p.start||"";$("pe").value=p.end||"";$("ptype").value=p.type;$("pname").value=p.name||"";if($("paddress"))$("paddress").value=p.address||"";$("pnote").value=p.note||"";$("pmemo").value=p.memo||"";v21ApplyLockedNameState()}
function clearPlanForm(){editingPlanId=null;v16PendingSpotId=null;renderPlanner()}

/* 最終版 savePlanForm（含 address 欄 + v28 normalize） */
function editPlan(id){editingPlanId=id;go("planner")}
function delPlan(id){data.plans=data.plans.filter(x=>x.id!=id);data.conns=data.conns.filter(c=>c.a!=id&&c.b!=id);data.spots.forEach(s=>{if(s.planId==id)delete s.planId});save()}
function clearAllPlans(){if(!confirm("清除所有行程會刪除目前已排入的行程卡片與行程間交通連線。確定要清除嗎？"))return;data.plans=[];data.conns=[];save()}

/* ── 行程連線 (connHtml) ── */
function connHtml(a,b){let c=data.conns.find(x=>x.a==a.id&&x.b==b.id);if(!c){c={id:uid(),a:a.id,b:b.id,mode:"大眾運輸",h:0,m:30,memo:"",fareForeign:0,fareTwd:0,payer:"未定",payMethod:"未定"};data.conns.push(c);silentSave()}const arrival=addMinutes(a.end,(Number(c.h||0)*60+Number(c.m||0)));const taxiBlock=c.mode==="開車/計程車"?`<div class="four" style="margin-top:8px"><div><label>車資 ${esc(data.trip.currency)}</label><input value="${c.fareForeign||""}" type="number" oninput="updConn('${c.id}','fareForeign',this.value)"></div><div><label>車資 TWD</label><input value="${c.fareTwd||""}" type="number" oninput="updConn('${c.id}','fareTwd',this.value)"></div><div><label>付款人</label><select onchange="updConn('${c.id}','payer',this.value)">${optsPayer(c.payer)}</select></div><div><label>付款方式</label><select onchange="updConn('${c.id}','payMethod',this.value)">${optsPayMethod(c.payMethod)}</select></div></div>`:"";return`<div class="connector"><div class="arrow">↓</div><div class="connbox"><div class="three"><div><label>交通</label><select onchange="changeConnMode('${c.id}',this.value)"><option ${c.mode=="大眾運輸"?"selected":""}>大眾運輸</option><option ${c.mode=="走路"?"selected":""}>走路</option><option ${c.mode=="開車/計程車"?"selected":""}>開車/計程車</option></select></div><div><label>預估時間</label><div class="two"><select onchange="updConn('${c.id}','h',this.value)">${hourOptions(c.h)}</select><select onchange="updConn('${c.id}','m',this.value)">${minuteOptions(c.m)}</select></div></div><div><label>預估抵達</label><input value="${arrival||""}" disabled></div></div>${taxiBlock}<div class="btns"><button class="btn blue" onclick="route('${encodeURIComponent(a.name+" "+data.trip.dest)}','${encodeURIComponent(b.name+" "+data.trip.dest)}','${c.mode}')">Google Maps 查路線</button></div><input value="${esc(c.memo)}" placeholder="交通備註" oninput="updConn('${c.id}','memo',this.value)"></div></div>`}
function hourOptions(v){let out="";for(let h=0;h<=23;h++)out+=`<option value="${h}" ${Number(v)==h?"selected":""}>${h}時</option>`;return out}
function minuteOptions(v){let out="";for(let m=0;m<=59;m++)out+=`<option value="${m}" ${Number(v)==m?"selected":""}>${m}分</option>`;return out}
function changeConnMode(id,v){let c=data.conns.find(x=>x.id==id);c.mode=v;save()}
function updConn(id,k,v){let c=data.conns.find(x=>x.id==id);c[k]=v;save()}

/* ── 行程時間正規化 ── */
function normalizePlanTimes(day){let plans=sortedPlans(day),changed=false;for(let i=1;i<plans.length;i++){let prev=plans[i-1],curP=plans[i],c=data.conns.find(x=>x.a==prev.id&&x.b==curP.id);if(!c)continue;let arrival=addMinutes(prev.end,Number(c.h||0)*60+Number(c.m||0));if(arrival&&timeToMin(arrival)>timeToMin(curP.start)){let dur=diffMinutes(curP.start,curP.end);curP.start=arrival;curP.end=addMinutes(arrival,dur);curP.adjusted=true;changed=true}}if(changed){silentSave();if(!adjustToastShown){adjustToastShown=true;setTimeout(()=>toast("部分行程已依交通抵達時間自動調整"),100)}}}

/* ── 口袋景點 ── */
function syncPlanMoney(src){let rate=Number(data.trip.rate||1);if(src=="f")$("ptwd").value=Math.round(Number($("pforeign").value||0)*rate);else $("pforeign").value=Math.round(Number($("ptwd").value||0)/rate)}
function renderDays(){normalizeAllPlanTypes();if($("days"))$("days").innerHTML=data.days.map(d=>{let h=hotelFor(d.key),n=data.plans.filter(p=>p.day==d.key).length;return`<div class="day ${d.key==currentDay?"active":""}" onclick="setCurrentDay('${d.key}',{preserveForm:true});go('planner')"><b>${d.title}｜${d.label}</b><span>${n} 行程｜住宿：${h?esc(h.name):"未設定"}</span></div>`}).join("")}
function renderSide(){const layout=document.querySelector(".layout"),panel=document.querySelector(".panel");if(layout){layout.classList.toggle("withCalendar",view==="planner");layout.classList.toggle("noCalendar",view!=="planner");if(window.innerWidth>620)layout.style.gridTemplateColumns=view==="planner"?"280px 1fr":"1fr";else layout.style.gridTemplateColumns=""}if(panel)panel.style.display=view==="planner"?"":"none";renderDays();const btns=document.querySelector(".panel .btns");if(btns)btns.innerHTML=`<button class="btn danger compact" onclick="clearAllPlans()">清除所有行程</button>`}

/* ── renderTrip（旅遊地設定，含 v643 out-of-range notice） ── */
function renderPlanner(options={}){v28NormalizePlans();normalizeAllPlanTypes();const draft=options.preserveForm?getPlanFormDraft():null;cur=currentDay||cur||data.days?.[0]?.key;normalizePlanTimes(cur);let plans=sortedPlans(cur);$("plannerView").innerHTML=`<div class="section"><div><h2>${dayTitle(cur)}</h2><div class="hint">住宿：${hotelFor(cur)?.name||"未設定"}。行程依開始時間排序。</div></div><button class="iconBtn smallIcon" onclick="clearPlanForm()">＋</button></div>
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
      <label>地址（選填，未來地圖功能使用）</label>
      <input id="paddress" placeholder="例：Haeundae Beach, Busan 或 韓國釜山海雲台">
      <div class="planAddressHint">此欄位保留作為未來地圖串接用；目前不會自動呼叫地圖 API。</div>
    </div>
    <label>注意事項</label><textarea id="pnote"></textarea>
    <label>備註</label><textarea id="pmemo"></textarea>
    <div class="planBudgetHint">新增行程時會自動在「預算」建立一筆花費；之後可到預算頁自行編輯或刪除，不會與行程連動。</div>
    <div class="btns"><button class="btn dark" onclick="savePlanForm()">${editingPlanId?"存好行程":"加入行程"}</button>${editingPlanId||v16PendingSpotId?'<button class="btn soft" onclick="clearPlanForm()">取消編輯 / 新增</button>':""}</div>
  </div>
</div></details>
<div id="pcards">${planCards(plans)}</div>`;
if(editingPlanId)fillPlanForm(editingPlanId);
else if(v16PendingSpotId)v16FillPendingSpot();
else if(draft)applyPlanFormDraft({...draft,day:cur});
else if($("pday"))$("pday").value=cur;
v21ApplyLockedNameState()}

/* itineraryTimeText */
function itineraryTimeText(p){const s=p.start||"--:--";const e=p.end||"";return{start:s,end:e}}
function itinerarySourceText(p){if(p.sourceType==="flight"||p.source==="flight")return"航班帶入";if(p.sourceType==="hotel"||p.source==="hotel")return"住宿帶入";if(p.sourceType==="spot")return"口袋景點帶入";return""}
function itineraryMapQuery(p){const primary=(p.address||"").trim();if(primary)return[primary,data.trip.dest,data.trip.country].filter(Boolean).join(" ");return[(p.name||""),data.trip.dest,data.trip.country].filter(Boolean).join(" ")}

/* premiumPlanCard（itinerary 樣式） */
function premiumPlanCard(p){const t=itineraryTimeText(p),mapQuery=itineraryMapQuery(p),sourceText=itinerarySourceText(p);return`<div class="itineraryItem" data-id="${p.id}"><div class="itineraryDotWrap"><span class="itineraryDot"></span></div><article class="itineraryCard"><div class="itineraryTop"><div class="itineraryTimeBlock"><span class="itineraryTime">${esc(t.start)}</span>${t.end?`<span class="itineraryEndTime">至 ${esc(t.end)}</span>`:""}</div><div class="itineraryTitleBlock"><div class="itineraryTitleLine"><h3 class="itineraryTitle">${activityIcon(p.type)} ${esc(p.name)}</h3></div><div class="itineraryMeta"><span class="itineraryTypePill">${esc(p.type||"其他")}</span>${sourceText?`<span class="itinerarySourcePill">${esc(sourceText)}</span>`:""} ${p.address?'<span class="itineraryAddressPill">已填地址</span>':""} ${p.adjusted?'<span class="itineraryTypePill">已依交通調整</span>':""} ${moneyForeign(p)||moneyTwd(p)?`<span class="itinerarySourcePill">${esc(data.trip.currency)} ${fmt(moneyForeign(p))}｜TWD ${fmt(moneyTwd(p))}</span>`:""}</div>${p.note?`<div class="itineraryNote"><b>注意：</b>${esc(p.note)}</div>`:""} ${p.memo?`<div class="itineraryNote"><b>備註：</b>${esc(p.memo)}</div>`:""}</div><div class="itineraryActions"><button class="small" onclick="routeCurrent('${encodeURIComponent(mapQuery)}')">地圖</button><button class="small" onclick="editPlan('${p.id}')">編輯</button><button class="small" onclick="delPlan('${p.id}')">刪除</button></div></div></article></div>`}

/* planCards（itinerary 時間軸樣式） */
function planCards(plans){normalizeAllPlanTypes();if(!plans.length)return'<div class="empty">這天還沒有行程</div>';let html=`<div class="itineraryTimeline">`;plans.forEach((p,i)=>{p.type=normalizePlanType(p.type);if(i>0)html+=connHtml(plans[i-1],p);html+=premiumPlanCard(p)});html+="</div>";return html}

/* ── renderSpots（最終版，含 v64 AI 探索按鈕直接注入） ── */
