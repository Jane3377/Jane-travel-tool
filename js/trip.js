/* ── trip.js：v63 多旅程系統、帳號 Widget ── */
function tripDocRef(){
  if(!fbUser) throw new Error("尚未登入");
  return fbDb.collection("users").doc(fbUser.uid).collection("trips").doc(CLOUD_TRIP_ID);
}

function toggleAccountMenu(){
  $("accountMenu")?.classList.toggle("show");
}
function closeAccountMenu(){
  $("accountMenu")?.classList.remove("show");
}
document.addEventListener("click", function(e){
  const w=$("accountWidget");
  if(w && !w.contains(e.target)) closeAccountMenu();
});

function initialsFromUser(user){
  const name=user?.displayName || user?.email || "登入";
  if(!user)return "登入";
  const parts=name.split(/\s+/).filter(Boolean);
  if(parts.length>=2)return (parts[0][0]+parts[1][0]).toUpperCase();
  return name.slice(0,2).toUpperCase();
}

function renderAccountWidget(user){
  const logged=!!user;
  const avatar=$("accountAvatar");
  const label=$("accountLabel");
  const name=$("accountName");
  const email=$("accountEmail");
  if(!avatar)return;

  if(logged){
    if(user.photoURL){
      avatar.innerHTML=`<img src="${user.photoURL}" alt="avatar">`;
    }else{
      avatar.textContent=initialsFromUser(user);
    }
    if(label)label.textContent="已登入";
    if(name)name.textContent=user.displayName || "Google 帳號";
    if(email)email.textContent=user.email || "";
  }else{
    avatar.textContent="登入";
    if(label)label.textContent="Google 登入";
    if(name)name.textContent="尚未登入";
    if(email)email.textContent="登入後可跨裝置同步";
  }

  ["menuLoad","menuSave","menuLogout"].forEach(id=>{
    if($(id))$(id).style.display=logged?"block":"none";
  });
  if($("menuLogin"))$("menuLogin").style.display=logged?"none":"block";
}

function renderAccountWidget(user){
  const logged=!!user;
  const avatar=$("accountAvatar");
  const label=$("accountLabel");
  const name=$("accountName");
  const email=$("accountEmail");
  if(!avatar)return;

  if(logged){
    if(user.photoURL){
      avatar.innerHTML=`<img src="${user.photoURL}" alt="avatar">`;
    }else{
      avatar.textContent=initialsFromUser(user);
    }
    if(label)label.textContent="已登入";
    if(name)name.textContent=user.displayName || "Google 帳號";
    if(email)email.textContent=user.email || "";
  }else{
    avatar.textContent="登入";
    if(label)label.textContent="Google 登入";
    if(name)name.textContent="尚未登入";
    if(email)email.textContent="登入後可跨裝置同步";
    syncStatus="idle";
    lastSyncTime=null;
  }

  ["menuLoad","menuSave","menuLogout"].forEach(id=>{
    if($(id))$(id).style.display=logged?"block":"none";
  });
  if($("menuLogin"))$("menuLogin").style.display=logged?"none":"block";
  updateAccountSyncLine();
}

function ensureAccountMenuSyncLine(){
  const menu=$("accountMenu");
  if(menu && !$("accountSyncLine")){
    const who=menu.querySelector(".who");
    if(who){
      who.insertAdjacentHTML("afterend", `<div class="accountSyncLine" id="accountSyncLine"><span class="dot"></span>尚未同步</div>`);
    }
  }
  updateAccountSyncLine();
}

const __oldToggleAccountMenu_v26 = toggleAccountMenu;
toggleAccountMenu = function(){
  ensureAccountMenuSyncLine();
  __oldToggleAccountMenu_v26();
};

function ensureAccountMenuSyncLine(){
  const menu=$("accountMenu");
  if(menu && !$("accountSyncLine")){
    const who=menu.querySelector(".who");
    if(who){
      who.insertAdjacentHTML("afterend", `<div class="accountSyncLine" id="accountSyncLine"><span class="dot"></span>尚未同步</div>`);
    }
  }
  updateAccountSyncLine();
}
let currentDay = cur || data?.days?.[0]?.key || data?.trip?.start || "";

const PLAN_TYPES = ["景點","餐廳","咖啡廳","購物","交通","航班","住宿","雨天備案","其他"];

async function v63LoadWhitelistFromCloud() {
  try {
    if (!fbDb) return;
    const snap = await fbDb.collection("allowedUsers").get();
    if (!snap.empty) {
      const emails = [];
      snap.forEach(doc => emails.push(doc.id.toLowerCase()));
      V63_ALLOWED_EMAILS = emails;
      // 管理員永遠有效
      if (!V63_ALLOWED_EMAILS.includes(V63_ADMIN_EMAIL)) {
        V63_ALLOWED_EMAILS.push(V63_ADMIN_EMAIL);
      }
    }
  } catch (e) {
    // 讀取失敗（Rules 限制或網路問題）→ 沿用內建清單
    console.warn("白名單讀取失敗，使用內建清單", e.message);
  }
}
const V63_MAX_TRIPS = 10;
const V63_TRIP_LIST_KEY_PREFIX = "janeselect_trip_list_v63";
const V63_CURRENT_TRIP_KEY = "janeselect_currentTripId_v63";
let currentTripId = localStorage.getItem(V63_CURRENT_TRIP_KEY) || "";
let tripList = [];
let v63AuthPassed = false;
let v63Booted = false;

function v63UserKey(){
  return (fbUser?.uid || "guest");
}
function v63CloneBase(){
  const d=structuredClone(base);
  d.days=mkDays(d.trip.start,d.trip.end);
  return d;
}
function v63NormalizeData(s){
  let d=v63CloneBase();
  if(s && typeof s === "object") Object.assign(d,s);
  d.meta={...base.meta,...(s?.meta||{})};
  d.trip={...base.trip,...(s?.trip||{})};
  if(!d.trip.travelers){
    d.trip.travelers=[d.trip.a||"A",d.trip.b||"B"];
    d.trip.travelerCount=d.trip.travelers.length;
  }
  d.flights={out:{...base.flights.out,...(s?.flights?.out||{})},back:{...base.flights.back,...(s?.flights?.back||{})}};
  if(!d.days?.length && d.trip?.start && d.trip?.end)d.days=mkDays(d.trip.start,d.trip.end);
  if(!d.packing?.length)d.packing=base.packing.map(x=>({...x,id:x.id||uid()}));
  if(!d.expenses)d.expenses=[];
  if(!d.hotels)d.hotels=[];
  if(!d.spots)d.spots=[];
  if(!d.plans)d.plans=[];
  if(!d.conns)d.conns=[];
  if(!d.photos)d.photos=[];
  if(!d.dayCovers)d.dayCovers={};
  return d;
}
function v63PersistTripLocal(){
  if(currentTripId){
    localStorage.setItem(getLocalTripKey(currentTripId), JSON.stringify(data));
  }
}
function v63TripIndexRef(){
  if(!fbUser) throw new Error("尚未登入");
  return fbDb.collection("users").doc(fbUser.uid).collection("tripIndex").doc("list");
}
function tripDocRef(){
  if(!fbUser) throw new Error("尚未登入");
  if(!currentTripId) throw new Error("尚未選擇旅程");
  return fbDb.collection("users").doc(fbUser.uid).collection("trips").doc(currentTripId);
}
function v63IsAllowed(user){
  const email=(user?.email||"").toLowerCase();
  return V63_ALLOWED_EMAILS.map(x=>x.toLowerCase()).includes(email);
}
function v63TripReady(){
  return !!(data?.trip?.country && data?.trip?.dest && data?.trip?.start && data?.trip?.end && data?.days?.length);
}
function v63LoadTripListLocal(){
  try{return JSON.parse(localStorage.getItem(getTripListKey())||"[]").filter(Boolean)}catch(e){return []}
}
function v63SaveTripListLocal(){
  localStorage.setItem(getTripListKey(), JSON.stringify(tripList));
}
async function loadTrips(){
  tripList = v63LoadTripListLocal();
  if(fbUser && fbDb){
    try{
      const snap=await v63TripIndexRef().get();
      if(snap.exists && Array.isArray(snap.data()?.trips)){
        tripList=snap.data().trips;
        v63SaveTripListLocal();
      }else if(tripList.length){
        await v63TripIndexRef().set({trips:tripList,updatedAtClient:Date.now(),ownerEmail:fbUser.email||""},{merge:true});
      }
    }catch(e){
      console.warn("loadTrips fallback local", e);
    }
  }
  return tripList;
}
async function v63SaveTripListCloud(){
  v63SaveTripListLocal();
  if(fbUser && fbDb){
    try{await v63TripIndexRef().set({trips:tripList,updatedAtClient:Date.now(),ownerEmail:fbUser.email||""},{merge:true});}catch(e){console.warn(e)}
  }
}
function v63TripMetaFromData(id=currentTripId){
  return {
    id,
    title:data?.meta?.title || data?.trip?.dest || "未命名旅程",
    dest:data?.trip?.dest || "未設定",
    country:data?.trip?.country || "",
    start:data?.trip?.start || "",
    end:data?.trip?.end || "",
    updatedAtClient:Date.now(),
    archived:false
  };
}
async function v63UpdateCurrentTripMeta(saveCloud=true){
  if(!currentTripId)return;
  const idx=tripList.findIndex(t=>t.id===currentTripId);
  const old=idx>=0?tripList[idx]:{};
  const meta={...old,...v63TripMetaFromData(currentTripId),archived:old.archived||false};
  if(idx>=0)tripList[idx]=meta; else tripList.unshift(meta);
  if(saveCloud) await v63SaveTripListCloud(); else v63SaveTripListLocal();
}
function v63DefaultTripData({title,country,city,start,end}){
  const d=v63CloneBase();
  d.meta.title=title || "我的新旅程";
  d.trip.country=country || "韓國";
  d.trip.city=city || "釜山";
  d.trip.dest=typeof v15DestinationName==="function" ? v15DestinationName(d.trip.country,d.trip.city) : [d.trip.country,d.trip.city].filter(Boolean).join("");
  d.trip.currency=currencyMap[d.trip.country] || "USD";
  d.trip.rate=rateMap[d.trip.currency] || 1;
  d.trip.start=start || "";
  d.trip.end=end || "";
  d.days=d.trip.start && d.trip.end ? mkDays(d.trip.start,d.trip.end) : [];
  d.flights={out:{...base.flights.out},back:{...base.flights.back}};
  d.hotels=[]; d.expenses=[]; d.spots=[]; d.plans=[]; d.conns=[]; d.photos=[]; d.dayCovers={};
  d.packing=base.packing.map(x=>({...x,id:uid(),checked:false}));
  return d;
}
function v63CurrentTripTitle(){
  const t=tripList.find(x=>x.id===currentTripId);
  return t?.title || data?.meta?.title || "目前旅程";
}
function v63ShowShell(mode){
  const login=$("loginView"), list=$("tripListView"), app=$("mainApp")||document.querySelector(".app");
  if(login)login.classList.toggle("hidden",mode!=="login");
  if(list)list.classList.toggle("hidden",mode!=="list");
  if(app)app.classList.toggle("hidden",mode!=="app");
  if($("accountWidget"))$("accountWidget").style.display = mode==="app" ? "" : "none";
}
function renderLoginView(message=""){
  const el=$("loginView"); if(!el)return;
  const signed=!!fbUser;
  el.innerHTML=`<div class="gateShell"><div class="loginCard">
    <div class="loginBrand">J｜貞選旅管家</div>
    <h1>Janeselect Travel Manager</h1>
    <p>登入後才能建立與管理旅程。現階段採 Email 白名單開放，每個帳號最多可建立 ${V63_MAX_TRIPS} 個旅程。</p>
    ${message?`<div class="box pink" style="margin-top:12px">${esc(message)}</div>`:""}
    <div class="btns"><button class="btn dark" onclick="firebaseSignIn()">使用 Google 登入</button>${signed?'<button class="btn soft" onclick="firebaseSignOut()">登出目前帳號</button>':''}</div>
    <div class="cloudHint">目前白名單：${V63_ALLOWED_EMAILS.map(esc).join("、")}</div>
  </div></div>`;
}
function renderTripList(){
  const el=$("tripListView"); if(!el)return;
  const active=tripList.filter(t=>!t.archived);
  const archived=tripList.filter(t=>t.archived);
  el.innerHTML=`<div class="gateShell">
    <div class="tripListHero"><div><div class="loginBrand">J｜貞選旅管家</div><h1>我的旅程</h1><p>每趟旅程都是一包獨立資料：旅遊地、航班住宿、行程、口袋景點、預算、行李與旅遊書都會分開保存。</p></div><div class="tripListCount">${active.length}/${V63_MAX_TRIPS} 個旅程</div></div>
    <div class="tripGrid">${active.map(v63TripCard).join("") || '<div class="tripListCard"><h3>還沒有旅程</h3><div class="meta">先在下方新增第一趟旅程。</div></div>'}</div>
    ${archived.length?`<details class="tripCreateCard"><summary style="cursor:pointer;font-weight:950">封存旅程</summary><div class="tripGrid">${archived.map(v63TripCard).join("")}</div></details>`:""}
    <div class="tripCreateCard"><h3>＋ 新增旅程</h3><div class="tripCreateGrid"><div><label>旅程名稱</label><input id="newTripTitle" placeholder="例：2026 釜山自由行"></div><div><label>國家 / 區域</label><select id="newTripCountry" onchange="v63NewTripCountryChanged()">${Object.keys(currencyMap).map(c=>`<option value="${c}">${c}</option>`).join("")}<option value="其他">其他</option></select></div><div><label>城市 / 路線</label><input id="newTripCity" value="釜山"></div><div><label>出發日</label><input id="newTripStart" type="date"></div><div><label>回程日</label><input id="newTripEnd" type="date"></div><div style="align-self:end"><button class="btn dark" style="width:100%" onclick="createTrip()">建立旅程</button></div></div><div class="cloudHint">建立後會先進入旅遊地設定；完成旅遊地後才會解鎖其他功能。</div></div>
    <div class="btns"><button class="btn soft" onclick="firebaseSignOut()">登出</button></div>
  </div>`;
}
function v63TripCard(t){
  return `<div class="tripListCard ${t.archived?"archived":""}"><span class="tripBadge">${t.archived?"已封存":"旅程"}</span><h3>${esc(t.title||"未命名旅程")}</h3><div class="meta">${esc(t.dest||"未設定目的地")}<br>${t.start&&t.end?`${esc(short(t.start))} - ${esc(short(t.end))}`:"尚未完成日期設定"}</div><div class="btns"><button class="btn dark compact" onclick="selectTrip('${t.id}')">繼續編輯</button>${t.archived?`<button class="btn blue compact" onclick="restoreTrip('${t.id}')">還原</button>`:`<button class="btn soft compact" onclick="archiveTrip('${t.id}')">封存</button>`}</div></div>`;
}
function v63NewTripCountryChanged(){
  const c=$("newTripCountry")?.value;
  const map=typeof v15CountryCityMaps==="function" ? v15CountryCityMaps().cityMap : {};
  const first=(map[c]||[])[0] || "";
  if($("newTripCity"))$("newTripCity").value=first;
}
async function createTrip(){
  const active=tripList.filter(t=>!t.archived);
  if(active.length>=V63_MAX_TRIPS)return toast(`每個帳號最多只能建立 ${V63_MAX_TRIPS} 個旅程`);
  const title=$("newTripTitle")?.value.trim() || "我的新旅程";
  const country=$("newTripCountry")?.value || "韓國";
  const city=$("newTripCity")?.value.trim() || "";
  const start=$("newTripStart")?.value || "";
  const end=$("newTripEnd")?.value || "";
  if(!start || !end)return toast("請先選擇出發日與回程日");
  if(start>end)return toast("回程日不可早於出發日");
  const id=`trip_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  currentTripId=id;
  localStorage.setItem(V63_CURRENT_TRIP_KEY,id);
  data=v63DefaultTripData({title,country,city,start,end});
  cur=data.days?.[0]?.key || data.trip.start;
  tripList.unshift(v63TripMetaFromData(id));
  v63PersistTripLocal();
  await v63SaveTripListCloud();
  await saveToCloudNow();
  v63ShowShell("app");
  view="trip";
  renderNav(); render(); scrollTo(0,0);
  toast("已建立旅程");
}
async function selectTrip(id){
  currentTripId=id;
  localStorage.setItem(V63_CURRENT_TRIP_KEY,id);
  let loaded=false;
  if(fbUser && fbDb){
    try{
      const snap=await tripDocRef().get();
      if(snap.exists && snap.data()?.data){
        data=v63NormalizeData(snap.data().data);
        loaded=true;
      }
    }catch(e){console.warn(e)}
  }
  if(!loaded){
    try{data=v63NormalizeData(JSON.parse(localStorage.getItem(getLocalTripKey(id))||"{}"));}catch(e){data=v63CloneBase()}
  }
  cur=data.days?.[0]?.key || data.trip?.start || cur;
  v63PersistTripLocal();
  cloudReady=!!(fbUser && currentTripId);
  if(cloudUnsub){cloudUnsub(); cloudUnsub=null;}
  if(fbUser && fbDb)listenCloudChanges();
  v63ShowShell("app");
  view = v63TripReady() ? "trip" : "trip";
  renderNav(); render(); scrollTo(0,0);
}
async function archiveTrip(id){
  if(!confirm("確定要封存這趟旅程？資料不會刪除，可在封存旅程中還原。"))return;
  const t=tripList.find(x=>x.id===id); if(t)t.archived=true;
  if(currentTripId===id){currentTripId=""; localStorage.removeItem(V63_CURRENT_TRIP_KEY);}
  await v63SaveTripListCloud();
  renderTripList();
}
async function restoreTrip(id){
  const t=tripList.find(x=>x.id===id); if(t)t.archived=false;
  await v63SaveTripListCloud();
  renderTripList();
}
function deleteTrip(id){ return archiveTrip(id); }
async function v63HandleAuth(user){
  fbUser=user||null;
  v63AuthPassed=!!(user && v63IsAllowed(user));
  if(!user){
    currentTripId="";
    cloudReady=false;
    renderLoginView();
    v63ShowShell("login");
    renderAccountWidget?.(null);
    return;
  }
  if(!v63AuthPassed){
    currentTripId="";
    cloudReady=false;
    renderLoginView(`${user.email || "這個帳號"} 尚未在白名單中，請改用授權帳號登入。`);
    v63ShowShell("login");
    renderAccountWidget?.(user);
    return;
  }
  await loadTrips();
  renderAccountWidget?.(user);
  if(currentTripId && tripList.some(t=>t.id===currentTripId && !t.archived)){
    await selectTrip(currentTripId);
  }else{
    currentTripId="";
    localStorage.removeItem(V63_CURRENT_TRIP_KEY);
    renderTripList();
    v63ShowShell("list");
  }
}
function v63BackToTripList(){
  v63UpdateCurrentTripMeta(true);
  currentTripId="";
  localStorage.removeItem(V63_CURRENT_TRIP_KEY);
  renderTripList();
  v63ShowShell("list");
}
function v63RenderTripSwitchBar(){
  const header=document.querySelector("#mainApp header") || document.querySelector(".app header");
  if(!header || !currentTripId)return;
  let bar=$("tripSwitchBar");
  if(!bar){bar=document.createElement("div");bar.id="tripSwitchBar";bar.className="tripSwitchBar noPrint";header.appendChild(bar);}
  bar.innerHTML=`<div class="miniTrip"><b>${esc(v63CurrentTripTitle())}</b><br>${esc(data.trip.dest||"未設定目的地")}｜${data.trip.start&&data.trip.end?`${esc(short(data.trip.start))}-${esc(short(data.trip.end))}`:"尚未完成日期"}</div><div class="btns" style="margin:0"><button class="btn soft compact" onclick="v63BackToTripList()">切換旅程</button><button class="btn blue compact" onclick="saveToCloudNow()">同步</button></div>`;
}
async function v63Boot(){
  if(v63Booted)return;
  v63Booted=true;
  views.splice(0, views.length, ["trip","旅遊地"],["stay","航班住宿"],["planner","行程"],["spots","口袋景點"],["budget","預算"],["packing","行李"],["photoBook","旅遊書"],["help","說明"]);
  if(!$("stayView")){
    const stay=document.createElement("section"); stay.id="stayView"; stay.className="hidden";
    $("plannerView")?.before(stay);
  }
  renderLoginView();
  v63ShowShell("login");
  if(!fbAuth && window.firebase){
    try{
      if(!firebase.apps.length)fbApp=firebase.initializeApp(FIREBASE_CONFIG); else fbApp=firebase.app();
      fbAuth=firebase.auth(); fbDb=firebase.firestore();
    }catch(e){renderLoginView("Firebase 初始化失敗："+(e.message||e)); return;}
  }
  if(fbAuth){
    // 先讀雲端白名單，再掛 auth 監聽
    await v63LoadWhitelistFromCloud();
    fbAuth.onAuthStateChanged(v63HandleAuth);
  }
}
v63Boot();

function v631BrandTitle(){
  document.title="貞選旅管家";
}
function renderTripList(){
  const el=$("tripListView"); if(!el)return;
  const active=tripList.filter(t=>!t.archived);
  const archived=tripList.filter(t=>t.archived);
  el.innerHTML=`<div class="gateShell">
    <div class="tripListHero"><div><div class="loginBrand">J｜貞選旅管家</div><h1>我的旅程</h1><p>每趟旅程都是一包獨立資料：旅遊地、航班住宿、行程、口袋景點、預算、行李與旅遊書都會分開保存。</p></div><div class="tripListCount">${active.length}/${V63_MAX_TRIPS} 個旅程</div></div>
    <div class="tripGrid">${active.map(v63TripCard).join("") || '<div class="tripListCard"><div class="tripCardTop"><div><span class="tripBadge">尚未開始</span><h3>還沒有旅程</h3></div><div class="tripCardIcon">J</div></div><div class="meta">先在下方新增第一趟旅程。</div></div>'}</div>
    ${archived.length?`<details class="tripCreateCard"><summary style="cursor:pointer;font-weight:950">封存旅程</summary><div class="tripGrid">${archived.map(v63TripCard).join("")}</div></details>`:""}
    <div class="tripCreateCard"><h3>＋ 新增旅程</h3><div class="tripCreateGrid"><div><label>旅程名稱</label><input id="newTripTitle" placeholder="例：2026 釜山自由行"></div><div><label>國家 / 區域</label><select id="newTripCountry" onchange="v63NewTripCountryChanged()">${Object.keys(currencyMap).map(c=>`<option value="${c}">${c}</option>`).join("")}<option value="其他">其他</option></select></div><div><label>城市 / 路線</label><input id="newTripCity" value="釜山"></div><div><label>出發日</label><input id="newTripStart" type="date"></div><div><label>回程日</label><input id="newTripEnd" type="date"></div><div style="align-self:end"><button class="btn dark" style="width:100%" onclick="createTrip()">建立旅程</button></div></div><div class="cloudHint">建立後會先進入旅遊地設定；完成旅遊地後才會解鎖其他功能。</div></div>
    <div class="btns"><button class="btn soft" onclick="firebaseSignOut()">登出</button></div>
  </div>`;
  v631BrandTitle();
}
function v63TripCard(t){
  const dateText=t.start&&t.end?`${esc(short(t.start))} - ${esc(short(t.end))}`:"尚未完成";
  const destText=t.dest||"未設定目的地";
  return `<div class="tripListCard ${t.archived?"archived":""}">
    <div class="tripCardTop"><div><span class="tripBadge">${t.archived?"已封存":"旅程"}</span><h3>${esc(t.title||"未命名旅程")}</h3></div><div class="tripCardIcon">J</div></div>
    <div class="tripCardMetaGrid"><div><span>目的地</span><b>${esc(destText)}</b></div><div><span>日期</span><b>${dateText}</b></div></div>
    <div class="meta">${t.updatedAtClient?`最後更新：${new Date(t.updatedAtClient).toLocaleDateString("zh-TW")}`:"尚未同步更新時間"}</div>
    <div class="btns"><button class="btn dark compact" onclick="selectTrip('${t.id}')">繼續編輯</button>${t.archived?`<button class="btn blue compact" onclick="restoreTrip('${t.id}')">還原</button>`:`<button class="btn soft compact" onclick="archiveTrip('${t.id}')">封存</button>`}</div>
  </div>`;
}
function tripDocRef(){
  if(!fbUser) throw new Error("尚未登入");
  if(!currentTripId) throw new Error("尚未選擇旅程");
  return fbDb.collection("users").doc(fbUser.uid).collection("trips").doc(currentTripId);
}
function v63PersistTripLocal(){
  if(currentTripId){
    localStorage.setItem(getLocalTripKey(currentTripId), JSON.stringify(data));
    v632SetLocalMeta(currentTripId,{updatedAtClient:v632Now(), tripId:currentTripId, title:data?.meta?.title||"", dest:data?.trip?.dest||""});
    try{ localStorage.setItem("voyageMemoData", JSON.stringify(data)); }catch(e){}
  }
}
async function v63SaveTripListCloud(){
  v63SaveTripListLocal();
  if(fbUser && fbDb){
    await v632SaveTripIndexCloud();
  }
}
async function loadTrips(){
  const localList=v63LoadTripListLocal();
  tripList=[...localList];
  if(fbUser && fbDb){
    try{
      const snap=await v63TripIndexRef().get();
      const cloudList=(snap.exists && Array.isArray(snap.data()?.trips)) ? snap.data().trips : [];
      const map=new Map();
      [...cloudList,...localList].forEach(t=>{
        if(!t?.id)return;
        const old=map.get(t.id);
        if(!old || Number(t.updatedAtClient||0)>=Number(old.updatedAtClient||0))map.set(t.id,t);
      });
      tripList=[...map.values()].sort((a,b)=>Number(b.updatedAtClient||0)-Number(a.updatedAtClient||0));
      v63SaveTripListLocal();
      if(tripList.length)await v632SaveTripIndexCloud();
    }catch(e){
      console.warn("loadTrips fallback local", e);
      setSyncStatus("off","旅程清單同步失敗",e.message||String(e));
    }
  }
  return tripList;
}
async function selectTrip(id){
  currentTripId=id;
  localStorage.setItem(V63_CURRENT_TRIP_KEY,id);
  cloudReady=false;
  if(cloudUnsub){cloudUnsub(); cloudUnsub=null;}

  let localData=null, localMeta=v632GetLocalMeta(id), cloudDoc=null;
  try{
    const raw=localStorage.getItem(getLocalTripKey(id));
    if(raw)localData=v63NormalizeData(JSON.parse(raw));
  }catch(e){console.warn("local trip load failed",e)}

  if(fbUser && fbDb){
    try{
      const snap=await tripDocRef().get();
      if(snap.exists && snap.data()?.data)cloudDoc=snap.data();
    }catch(e){
      console.warn("cloud trip load failed",e);
      setSyncStatus("off","雲端讀取失敗",e.message||String(e));
    }
  }

  const cloudUpdated=Number(cloudDoc?.updatedAtClient||0);
  const localUpdated=Number(localMeta?.updatedAtClient||0);
  suppressCloudSave=true;
  if(cloudDoc?.data && cloudUpdated>=localUpdated){
    data=v63NormalizeData(cloudDoc.data);
    lastCloudUpdatedAt=cloudUpdated;
    setSyncStatus("on","已載入雲端資料",`旅程：${cloudDoc.tripMeta?.title || v63CurrentTripTitle()}`);
  }else if(localData){
    data=localData;
    if(cloudDoc?.data){
      setSyncStatus("warn","本機資料較新","即將補同步到雲端");
    }else{
      setSyncStatus("warn","雲端尚無此旅程","即將建立雲端資料");
    }
  }else if(cloudDoc?.data){
    data=v63NormalizeData(cloudDoc.data);
    lastCloudUpdatedAt=cloudUpdated;
  }else{
    data=v63CloneBase();
    setSyncStatus("off","尚無旅程資料","請先設定旅遊地");
  }
  cur=data.days?.[0]?.key || data.trip?.start || cur;
  v63PersistTripLocal();
  suppressCloudSave=false;
  cloudReady=!!(fbUser && currentTripId && v632IsAllowed());
  if(cloudReady)listenCloudChanges();

  v63ShowShell("app");
  view="trip";
  renderNav(); render(); scrollTo(0,0);

  if(cloudReady && (!cloudDoc?.data || localUpdated>cloudUpdated+1000)){
    scheduleCloudSave("selectTrip-local-newer");
  }
}
async function createTrip(){
  const active=tripList.filter(t=>!t.archived);
  if(active.length>=V63_MAX_TRIPS)return toast(`每個帳號最多只能建立 ${V63_MAX_TRIPS} 個旅程`);
  const title=$("newTripTitle")?.value.trim() || "我的新旅程";
  const country=$("newTripCountry")?.value || "韓國";
  const city=$("newTripCity")?.value.trim() || "";
  const start=$("newTripStart")?.value || "";
  const end=$("newTripEnd")?.value || "";
  if(!start || !end)return toast("請先選擇出發日與回程日");
  if(start>end)return toast("回程日不可早於出發日");
  const id=`trip_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  currentTripId=id;
  localStorage.setItem(V63_CURRENT_TRIP_KEY,id);
  data=v63DefaultTripData({title,country,city,start,end});
  cur=data.days?.[0]?.key || data.trip.start;
  tripList.unshift(v63TripMetaFromData(id));
  v63PersistTripLocal();
  cloudReady=!!(fbUser && currentTripId && v632IsAllowed());
  try{
    await v63SaveTripListCloud();
    if(cloudReady)await saveToCloudNow({silent:true,reason:"createTrip"});
  }catch(e){
    setSyncStatus("off","建立雲端旅程失敗",e.message||String(e));
  }
  if(cloudReady)listenCloudChanges();
  v63ShowShell("app");
  view="trip";
  renderNav(); render(); scrollTo(0,0);
  toast("已建立旅程");
}
async function v63HandleAuth(user){
  fbUser=user||null;
  v63AuthPassed=!!(user && v63IsAllowed(user));
  if(cloudUnsub){cloudUnsub(); cloudUnsub=null;}
  if(!user){
    currentTripId=""; cloudReady=false;
    renderLoginView(); v63ShowShell("login"); renderAccountWidget?.(null);
    setSyncStatus("off","尚未登入","登入 Google 後可跨裝置同步");
    return;
  }
  if(!v63AuthPassed){
    currentTripId=""; cloudReady=false;
    renderLoginView(`${user.email || "這個帳號"} 尚未在白名單中，請改用授權帳號登入。`);
    v63ShowShell("login"); renderAccountWidget?.(user);
    setSyncStatus("off","帳號未授權",user.email||"");
    return;
  }
  setSyncStatus("warn","登入成功","載入旅程清單中");
  await loadTrips();
  renderAccountWidget?.(user);
  const savedId=localStorage.getItem(V63_CURRENT_TRIP_KEY)||currentTripId;
  if(savedId && tripList.some(t=>t.id===savedId && !t.archived)){
    await selectTrip(savedId);
  }else{
    currentTripId=""; localStorage.removeItem(V63_CURRENT_TRIP_KEY); cloudReady=false;
    renderTripList(); v63ShowShell("list");
    setSyncStatus("on","已載入旅程清單",`${tripList.filter(t=>!t.archived).length} 個旅程`);
  }
}
function v63RenderTripSwitchBar(){
  const header=document.querySelector("#mainApp header") || document.querySelector(".app header");
  if(!header || !currentTripId)return;
  let bar=$("tripSwitchBar");
  if(!bar){bar=document.createElement("div");bar.id="tripSwitchBar";bar.className="tripSwitchBar noPrint";header.appendChild(bar);}
  bar.innerHTML=`<div class="miniTrip"><b>${esc(v63CurrentTripTitle())}</b><br>${esc(data.trip.dest||"未設定目的地")}｜${data.trip.start&&data.trip.end?`${esc(short(data.trip.start))}-${esc(short(data.trip.end))}`:"尚未完成日期"}<br>${v632StatusBadge()}</div><div class="btns" style="margin:0"><button class="btn soft compact" onclick="v63BackToTripList()">切換</button><button class="btn blue compact" onclick="loadFromCloud({force:true})">載入</button><button class="btn dark compact" onclick="saveToCloudNow()">同步</button></div>`;
}
function v634ThemeLabel(){
  const prefs=applyThemePrefs(getThemePrefs());
  const mode=THEME_CONFIG.modes[prefs.mode]?.label || "淺色";
  const palette=THEME_CONFIG.palettes[prefs.palette]?.label || "韓系清新";
  return `${palette}・${mode}`;
}
function v635ThemePanelHtml(){
  const prefs=applyThemePrefs(getThemePrefs());
  return `<div class="themePanelBackdrop noPrint" id="themePanelBackdrop" onclick="if(event.target===this)closeThemePanel()">
    <div class="themePanel" role="dialog" aria-modal="true" aria-labelledby="themePanelTitle">
      <div class="themePanelHead">
        <div><h3 id="themePanelTitle">🎨 外觀設定</h3><p>調整整體色系、明暗與卡片風格。這只會改畫面外觀，不會影響旅程資料。</p></div>
        <button class="themeCloseBtn" type="button" onclick="closeThemePanel()">×</button>
      </div>
      <div class="themePanelControls">
        <div class="themeField"><label>明暗模式</label><select id="themeModeSelect" onchange="setThemePrefs({mode:this.value})">${themeOptions(THEME_CONFIG.modes,prefs.mode)}</select></div>
        <div class="themeField"><label>色系風格</label><select id="themePaletteSelect" onchange="setThemePrefs({palette:this.value})">${themeOptions(THEME_CONFIG.palettes,prefs.palette)}</select></div>
        <div class="themeField"><label>卡片樣式</label><select id="themeCardStyleSelect" onchange="setThemePrefs({cardStyle:this.value})">${themeOptions(THEME_CONFIG.cardStyles,prefs.cardStyle)}</select></div>
      </div>
      <div class="themePanelSwatches"><span class="themeSwatch seoul"></span><span class="themeSwatch ocean"></span><span class="themeSwatch latte"></span></div>
      <div class="themePanelNote">外觀設定目前只儲存在這台裝置，不會改變旅程資料，也不會影響雲端同步。</div>
    </div>
  </div>`;
}
function v636ColorKey(v){
  return V636_CARD_COLORS.some(c=>c.key===v) ? v : "cream";
}
function v636ColorOptions(selected="cream"){
  const val=v636ColorKey(selected);
  return V636_CARD_COLORS.map(c=>`<option value="${c.key}" ${c.key===val?"selected":""}>${c.label}</option>`).join("");
}
function v636ColorDots(selected="cream", id=""){
  const val=v636ColorKey(selected);
  return `<div class="tripColorDots" aria-label="旅程卡片色系">${V636_CARD_COLORS.map(c=>`<button type="button" class="tripColorDot color-${c.key} ${c.key===val?"active":""}" title="${c.label}" onclick="updateTripCardColor('${id}','${c.key}')"></button>`).join("")}</div>`;
}
function v636DeleteTripCloud(id){
  if(!(fbUser && fbDb && id))return Promise.resolve();
  return fbDb.collection("users").doc(fbUser.uid).collection("trips").doc(id).delete().catch(e=>{
    console.warn("delete trip cloud failed", e);
    toast("雲端刪除失敗，已保留本機資料");
    throw e;
  });
}
function v637FooterHtml(){
  return `<footer id="siteFooter" class="siteFooter noPrint">
    <div class="siteFooterBrand">貞選旅管家 <span>Janeselect Travel Manager</span></div>
    <div class="siteFooterVersion">${esc(V637_VERSION_TEXT)}</div>
    <div class="siteFooterLinks">
      <button type="button" onclick="v637PolicyToast('服務條款')">服務條款</button>
      <span>・</span>
      <button type="button" onclick="v637PolicyToast('隱私權政策')">隱私權政策</button>
      <span>・</span>
      <button type="button" onclick="v637PolicyToast('聯絡我們')">聯絡我們</button>
    </div>
    <div class="siteFooterCopy">© 2026 Janeselect Travel Manager. All rights reserved.</div>
  </footer>`;
}
function v637PolicyToast(name){ toast(`${name}內容尚未設定，之後可接到獨立頁面或後台設定。`); }
function v637EnsureFooter(){
  document.querySelectorAll('.app > footer').forEach(f=>f.classList.add('legacyFooter'));
  let f=$('siteFooter');
  if(!f){ document.body.insertAdjacentHTML('beforeend', v637FooterHtml()); }
  else { f.outerHTML=v637FooterHtml(); }
}

/* 讓 login/list/app 切換時，footer 都存在 */
const __v637ShowShell = typeof v63ShowShell === 'function' ? v63ShowShell : null;
if(__v637ShowShell){
  v63ShowShell = function(mode){
    __v637ShowShell(mode);
    v637EnsureFooter();
  };
}

function v637EnsureEditModal(){
  if($('titleEditModal'))return;
  document.body.insertAdjacentHTML('beforeend', `<div class="titleEditModal noPrint" id="titleEditModal" aria-hidden="true">
    <div class="titleEditBox">
      <div class="titleEditHead">
        <div><span class="titleEditKicker">貞選旅管家</span><h3 id="titleEditHeading">編輯文字</h3></div>
        <button type="button" class="iconBtn" onclick="v637CloseTitleModal()">×</button>
      </div>
      <div class="titleEditBody">
        <label id="titleEditLabel">內容</label>
        <textarea id="titleEditInput"></textarea>
        <div class="hint" id="titleEditHint">修改後會儲存在目前旅程資料中，並隨同步保存。</div>
      </div>
      <div class="btns titleEditActions">
        <button class="btn soft" type="button" onclick="v637CloseTitleModal()">取消</button>
        <button class="btn dark" type="button" onclick="v637SaveTitleModal()">儲存</button>
      </div>
    </div>
  </div>`);
}
let v637EditMode='title';
function v637OpenTitleModal(mode){
  v637EnsureEditModal();
  v637EditMode=mode;
  const isTitle=mode==='title';
  $('titleEditHeading').textContent=isTitle?'編輯旅程標題':'編輯旅程副標';
  $('titleEditLabel').textContent=isTitle?'旅程標題':'副標文字';
  $('titleEditInput').value=isTitle?(data.meta.title||'我的旅程'):(data.meta.subtitle||base.meta.subtitle||'');
  $('titleEditInput').style.minHeight=isTitle?'88px':'150px';
  $('titleEditModal').classList.add('show');
  $('titleEditModal').setAttribute('aria-hidden','false');
  setTimeout(()=>$('titleEditInput')?.focus(),30);
}
function v637CloseTitleModal(){
  const m=$('titleEditModal');
  if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true');}
}
function v637SaveTitleModal(){
  const value=($('titleEditInput')?.value||'').trim();
  if(!value)return toast('請輸入內容');
  if(v637EditMode==='title') data.meta.title=value;
  else data.meta.subtitle=value;
  v637CloseTitleModal();
  save();
  toast('已更新旅程文字');
}
editTitle = function(){ v637OpenTitleModal('title'); };
editSubtitle = function(){ v637OpenTitleModal('subtitle'); };

function v637ColorDotSet(selected='cream', id='', mode='trip'){
  const val=typeof v636ColorKey==='function'?v636ColorKey(selected):(selected||'cream');
  const colors=[['cream','奶油白'],['mint','薄荷綠'],['rose','玫瑰粉'],['sky','晨霧藍'],['latte','奶茶棕']];
  return `<div class="tripColorDots" role="group" aria-label="卡片色系">${colors.map(([k,label])=>{
    const active=k===val?' active':'';
    const onclick=mode==='new'?`v637SetNewTripColor('${k}')`:`updateTripCardColor('${id}','${k}')`;
    return `<button type="button" class="tripColorDot color-${k}${active}" title="${label}" aria-label="${label}" onclick="${onclick}"></button>`;
  }).join('')}</div>`;
}
function v637SetNewTripColor(color){
  const v=typeof v636ColorKey==='function'?v636ColorKey(color):(color||'cream');
  const input=$('newTripColor'); if(input)input.value=v;
  const box=$('newTripColorDots');
  if(box)box.innerHTML=v637ColorDotSet(v,'','new');
}

/* 覆寫旅程清單：新增頁尾一致；新增旅程色系改圓點；旅程卡片不顯示下拉 */
renderTripList = function(){
  const el=$('tripListView'); if(!el)return;
  const active=tripList.filter(t=>!t.archived);
  const archived=tripList.filter(t=>t.archived);
  el.innerHTML=`<div class="gateShell">
    <div class="tripListHero"><div><div class="loginBrand">貞選旅管家</div><h1>我的旅程</h1><p>每趟旅程都是一包獨立資料：旅遊地、航班住宿、行程、口袋景點、預算、行李與旅遊書都會分開保存。</p></div><div class="tripListCount">${active.length}/${V63_MAX_TRIPS} 個旅程</div></div>
    <div class="tripGrid">${active.map(v63TripCard).join('') || '<div class="tripListCard tripColor-cream"><div class="tripCardTop"><div><span class="tripBadge">尚未開始</span><h3>還沒有旅程</h3></div></div><div class="meta">先在下方新增第一趟旅程。</div></div>'}</div>
    ${archived.length?`<details class="tripCreateCard" open><summary style="cursor:pointer;font-weight:950">封存旅程</summary><div class="tripGrid">${archived.map(v63TripCard).join('')}</div></details>`:''}
    <div class="tripCreateCard"><h3>＋ 新增旅程</h3><div class="tripCreateGrid"><div><label>旅程名稱</label><input id="newTripTitle" placeholder="例：2026 釜山自由行"></div><div><label>國家 / 區域</label><select id="newTripCountry" onchange="v63NewTripCountryChanged()">${Object.keys(currencyMap).map(c=>`<option value="${c}">${c}</option>`).join('')}<option value="其他">其他</option></select></div><div><label>城市 / 路線</label><input id="newTripCity" value="釜山"></div><div><label>卡片色系</label><input id="newTripColor" type="hidden" value="cream"><div id="newTripColorDots" class="newTripColorDots">${v637ColorDotSet('cream','','new')}</div></div><div><label>出發日</label><input id="newTripStart" type="date"></div><div><label>回程日</label><input id="newTripEnd" type="date"></div><div style="align-self:end"><button class="btn dark" style="width:100%" onclick="createTrip()">建立旅程</button></div></div><div class="cloudHint">建立後會先進入旅遊地設定；完成旅遊地後才會解鎖其他功能。旅程卡片色系只影響清單外觀，不會改變旅行資料。</div></div>
    <div class="btns"><button class="btn soft" onclick="firebaseSignOut()">登出</button></div>
  </div>`;
  if(typeof v631BrandTitle==='function')v631BrandTitle();
  v637EnsureFooter();
};

v63TripCard = function(t){
  const dateText=t.start&&t.end?`${esc(short(t.start))} - ${esc(short(t.end))}`:'尚未完成';
  const destText=t.dest||'未設定目的地';
  const color=typeof v636ColorKey==='function'?v636ColorKey(t.cardColor):'cream';
  return `<div class="tripListCard tripColor-${color} ${t.archived?'archived':''}">
    <div class="tripCardTop"><div><span class="tripBadge">${t.archived?'已封存':'旅程'}</span><h3>${esc(t.title||'未命名旅程')}</h3></div></div>
    <div class="tripCardMetaGrid"><div><span>目的地</span><b>${esc(destText)}</b></div><div><span>日期</span><b>${dateText}</b></div></div>
    <div class="meta">${t.updatedAtClient?`最後更新：${new Date(t.updatedAtClient).toLocaleDateString('zh-TW')}`:'尚未同步更新時間'}</div>
    <div class="tripCardTools"><div class="tripColorControl"><span>卡片色系</span>${v637ColorDotSet(color,t.id,'trip')}</div></div>
    <div class="btns">
      <button class="btn dark compact" onclick="selectTrip('${t.id}')">繼續編輯</button>
      ${t.archived?`<button class="btn blue compact" onclick="restoreTrip('${t.id}')">還原</button>`:`<button class="btn soft compact" onclick="archiveTrip('${t.id}')">封存</button>`}
      <button class="btn danger compact" onclick="deleteTrip('${t.id}')">刪除</button>
    </div>
  </div>`;
};

const v637Style=document.createElement('style');
v637Style.textContent=`
  .legacyFooter{display:none!important;}
  .siteFooter{max-width:1160px;margin:22px auto 26px;padding:18px 14px 26px;text-align:center;color:var(--theme-muted,var(--muted));font-size:12px;line-height:1.7;}
  .siteFooterBrand{font-weight:950;color:var(--theme-ink,var(--ink));letter-spacing:.03em;}
  .siteFooterBrand span{font-weight:750;color:var(--theme-muted,var(--muted));}
  .siteFooterVersion{margin-top:4px;}
  .siteFooterLinks{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap;}
  .siteFooterLinks button{border:0;background:transparent;color:var(--theme-muted,var(--muted));font-size:12px;font-weight:850;padding:4px 5px;border-radius:999px;}
  .siteFooterLinks button:hover{color:var(--theme-ink,var(--ink));background:rgba(255,255,255,.55);}
  .siteFooterCopy{margin-top:4px;color:color-mix(in srgb,var(--theme-muted,var(--muted)) 76%, transparent);}
  .titleEditModal{position:fixed;inset:0;background:rgba(44,38,32,.38);display:none;align-items:center;justify-content:center;padding:18px;z-index:180;}
  .titleEditModal.show{display:flex;}
  .titleEditBox{width:min(560px,100%);max-height:86vh;overflow:auto;background:rgba(255,255,255,.98);border:1px solid rgba(255,255,255,.9);box-shadow:0 24px 70px rgba(44,42,41,.16);border-radius:24px;padding:18px;}
  .titleEditHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;}
  .titleEditHead h3{margin:4px 0 0;font-size:22px;}
  .titleEditKicker{display:inline-flex;border-radius:999px;background:var(--theme-primary-weak,#edf8f3);color:var(--theme-primary,#4A5D4E);padding:5px 9px;font-size:12px;font-weight:950;}
  .titleEditBody textarea{min-height:130px;line-height:1.65;}
  .titleEditActions{justify-content:flex-end;}
  .tripColorSelect{display:none!important;}
  .tripCardTools{justify-content:flex-start!important;}
  .newTripColorDots{padding-top:5px;}
  @media(max-width:620px){
    .siteFooter{margin:18px auto 24px;padding-bottom:calc(24px + env(safe-area-inset-bottom));font-size:11.5px;}
    .titleEditBox{border-radius:22px;padding:16px;}
    .titleEditActions .btn{flex:1 1 auto;}
    .tripColorControl{justify-content:space-between;width:100%;}
  }
  @media print{.siteFooter,.titleEditModal{display:none!important;}}
`;
document.head.appendChild(v637Style);

document.addEventListener('DOMContentLoaded',()=>{
  v637EnsureFooter();
  v637EnsureEditModal();
});
setTimeout(v637EnsureFooter, 300);

const V64_VERSION_SHORT = '版本：v64｜2026-05-31';
const V64_VERSION_TEXT = 'v64｜2026-05-31｜AI 輔助整合與口袋景點探索版';

function v649DeviceName(){
  const ua = navigator.userAgent || "";
  if(/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return "iPad";
  if(/iPhone/i.test(ua)) return "iPhone";
  if(/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android 手機" : "Android 平板";
  if(/Mac/i.test(ua)) return "Mac";
  if(/Windows/i.test(ua)) return "Windows";
  return "此裝置";
}
function v649Now(){return Date.now();}
function v649LockPayload(){
  return {
    deviceId:v649DeviceId,
    deviceName:v649DeviceName(),
    uid:fbUser?.uid || "",
    email:fbUser?.email || "",
    tripId:currentTripId || "",
    updatedAtClient:v649Now()
  };
}
function v649IsOtherActiveLock(lock){
  if(!lock || !lock.deviceId) return false;
  if(lock.deviceId === v649DeviceId) return false;
  const at = Number(lock.updatedAtClient || 0);
  return !!at && (v649Now() - at) < V649_LOCK_TTL;
}
function v649LockOwnerText(lock=v649LockOwner){
  if(!lock) return "其他裝置";
  const name = lock.deviceName || "其他裝置";
  const time = lock.updatedAtClient ? new Date(lock.updatedAtClient).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}) : "";
  return `${name}${time ? '（' + time + '）' : ''}`;
}
function v649StopHeartbeat(){
  if(v649HeartbeatTimer){clearInterval(v649HeartbeatTimer); v649HeartbeatTimer=null;}
}
function v649StartHeartbeat(){
  v649StopHeartbeat();
  if(v649ReadOnly || !fbUser || !currentTripId || !fbDb) return;
  v649HeartbeatTimer = setInterval(async()=>{
    try{
      if(!v649ReadOnly && fbUser && currentTripId && fbDb){
        await tripDocRef().set({editingLock:v649LockPayload(), lockUpdatedAtClient:v649Now()},{merge:true});
      }
    }catch(e){console.warn('v64.9 lock heartbeat failed', e);}
  }, V649_HEARTBEAT_MS);
}
function v649SetReadOnly(on, lock=null){
  v649ReadOnly = !!on;
  v649LockOwner = lock || null;
  document.body.classList.toggle('v649-readonly', v649ReadOnly);
  if(v649ReadOnly){
    v649StopHeartbeat();
    if(typeof setSyncStatus === 'function') setSyncStatus('warn','檢視模式',`這趟旅程目前由 ${v649LockOwnerText(lock)} 編輯`);
  }
  v649ApplyLockBanner();
  try{ if(typeof updateAccountSyncLine === 'function') updateAccountSyncLine(); }catch(e){}
}
function v649EnsureBanner(){
  const header=document.querySelector('#mainApp header') || document.querySelector('.app header');
  if(!header || !currentTripId) return null;
  let el=document.getElementById('v649LockBanner');
  if(!el){
    el=document.createElement('div');
    el.id='v649LockBanner';
    el.className='v649LockBanner noPrint v649-allow';
    header.appendChild(el);
  }
  return el;
}
function v649ApplyLockBanner(){
  const el=v649EnsureBanner();
  if(!el) return;
  if(!fbUser || !currentTripId){el.remove(); return;}
  if(v649ReadOnly){
    el.className='v649LockBanner noPrint v649-allow viewOnly';
    el.innerHTML=`<div><b>檢視模式：避免多裝置同步互相覆蓋</b><span>這趟旅程目前由 ${esc(v649LockOwnerText())} 編輯。此裝置可查看與載入最新雲端資料，但不會自動同步覆蓋。</span></div><div class="btns"><button class="btn blue compact v649-allow" onclick="loadFromCloud({force:true})">載入最新</button><button class="btn dark compact v649-allow" onclick="v649TakeOverEdit()">接手編輯</button></div>`;
  }else{
    el.className='v649LockBanner noPrint v649-allow editing';
    el.innerHTML=`<div><b>目前由此裝置編輯</b><span>${esc(v649DeviceName())} 正在編輯這趟旅程。其他裝置會進入檢視模式，避免舊資料覆蓋。</span></div><div class="btns"><button class="btn blue compact v649-allow" onclick="saveToCloudNow()">同步</button><button class="btn soft compact v649-allow" onclick="loadFromCloud({force:true})">載入</button></div>`;
  }
}
async function v649AcquireEditLock({takeover=false}={}){
  if(!fbUser || !fbDb || !currentTripId || typeof tripDocRef !== 'function'){
    v649SetReadOnly(false,null);
    return true;
  }
  try{
    const ref=tripDocRef();
    const snap=await ref.get();
    const lock=snap.exists ? (snap.data()?.editingLock || null) : null;
    if(v649IsOtherActiveLock(lock) && !takeover){
      v649SetReadOnly(true, lock);
      v649StartLockListener();
      return false;
    }
    await ref.set({editingLock:v649LockPayload(), lockUpdatedAtClient:v649Now()},{merge:true});
    v649SetReadOnly(false,null);
    v649StartHeartbeat();
    v649StartLockListener();
    if(typeof setSyncStatus === 'function') setSyncStatus('on','已取得編輯權',`${v649DeviceName()} 可編輯並同步`);
    return true;
  }catch(e){
    console.warn('v64.9 acquire lock failed', e);
    // 鎖定失敗時採保守策略：不讓此裝置寫回，避免覆蓋雲端。
    v649SetReadOnly(true, {deviceName:'雲端鎖定狀態未知', updatedAtClient:v649Now()});
    return false;
  }
}
function v649StartLockListener(){
  try{ if(v649LockUnsub){v649LockUnsub(); v649LockUnsub=null;} }catch(e){}
  if(!fbUser || !fbDb || !currentTripId || typeof tripDocRef !== 'function') return;
  const tripIdAtStart=currentTripId;
  try{
    v649LockUnsub = tripDocRef().onSnapshot(snap=>{
      if(tripIdAtStart !== currentTripId || !snap.exists) return;
      const lock=snap.data()?.editingLock || null;
      if(v649IsOtherActiveLock(lock)){
        if(!v649ReadOnly || v649LockOwner?.deviceId !== lock.deviceId){
          v649SetReadOnly(true, lock);
          toast(`已切換檢視模式：${v649LockOwnerText(lock)} 正在編輯`);
        }
      }else if(lock?.deviceId === v649DeviceId && v649ReadOnly){
        v649SetReadOnly(false,null);
        v649StartHeartbeat();
      }
    },err=>console.warn('v64.9 lock listener failed', err));
  }catch(e){console.warn(e);}
}
async function v649TakeOverEdit(){
  if(!fbUser || !currentTripId) return toast('請先登入並選擇旅程');
  const ok = confirm('要改由此裝置接手編輯嗎？\n\n系統會先載入雲端最新資料，再取得編輯權，避免用舊資料覆蓋。');
  if(!ok) return;
  try{
    v649SetReadOnly(false,null); // 暫時放行載入；save 仍會重新檢查鎖。
    if(typeof loadFromCloud === 'function') await loadFromCloud({force:true, silent:true, skipLock:true});
    await v649AcquireEditLock({takeover:true});
    render();
    toast('已接手編輯，並載入最新雲端資料');
  }catch(e){
    v649SetReadOnly(true, v649LockOwner);
    alert('接手編輯失敗：' + (e?.message || e));
  }
}
async function v649EnsureCanWrite(){
  if(!fbUser || !currentTripId) return false;
  if(v649ReadOnly) return false;
  try{
    const snap=await tripDocRef().get();
    const lock=snap.exists ? (snap.data()?.editingLock || null) : null;
    if(v649IsOtherActiveLock(lock)){
      v649SetReadOnly(true, lock);
      return false;
    }
    if(!lock || lock.deviceId !== v649DeviceId || (v649Now() - Number(lock.updatedAtClient||0)) > V649_LOCK_TTL){
      return await v649AcquireEditLock({takeover:false});
    }
    return true;
  }catch(e){
    console.warn('v64.9 ensure write failed', e);
    v649SetReadOnly(true,{deviceName:'雲端鎖定狀態未知',updatedAtClient:v649Now()});
    return false;
  }
}

const v649PrevCloudPayload = typeof cloudPayload === 'function' ? cloudPayload : null;
cloudPayload = function(){
  const payload = v649PrevCloudPayload ? v649PrevCloudPayload() : {data:JSON.parse(JSON.stringify(data)), updatedAtClient:Date.now()};
  payload.appVersion = V649_VERSION_SHORT;
  payload.deviceId = v649DeviceId;
  payload.deviceName = v649DeviceName();
  payload.editingLock = v649LockPayload();
  payload.lockUpdatedAtClient = v649Now();
  return payload;
};

const v649PrevScheduleCloudSave = typeof scheduleCloudSave === 'function' ? scheduleCloudSave : null;
scheduleCloudSave = function(reason='auto'){
  if(v649SelectingTrip) return;
  if(v649ReadOnly){
    if(typeof setSyncStatus === 'function') setSyncStatus('warn','檢視模式','此裝置不會自動同步，避免覆蓋編輯裝置。');
    v649ApplyLockBanner();
    return;
  }
  return v649PrevScheduleCloudSave ? v649PrevScheduleCloudSave(reason) : undefined;
};

const v649PrevSaveToCloudNow = typeof saveToCloudNow === 'function' ? saveToCloudNow : null;
saveToCloudNow = async function(options={}){
  if(v649ReadOnly && !options.allowReadOnly){
    setSyncStatus('warn','檢視模式','請先接手編輯，才可以同步寫入。');
    toast('目前是檢視模式，請先接手編輯');
    return false;
  }
  if(fbUser && currentTripId){
    const canWrite = await v649EnsureCanWrite();
    if(!canWrite){
      setSyncStatus('warn','檢視模式',`這趟旅程由 ${v649LockOwnerText()} 編輯中`);
      return false;
    }
  }
  const result = v649PrevSaveToCloudNow ? await v649PrevSaveToCloudNow(options) : false;
  if(result){
    v649StartHeartbeat();
    v649ApplyLockBanner();
  }
  return result;
};

const v649PrevSave = typeof save === 'function' ? save : null;
save = function(){
  if(v649ReadOnly){
    toast('目前是檢視模式，請先接手編輯');
    setSyncStatus('warn','檢視模式','此裝置不會儲存變更，避免覆蓋雲端。');
    if(typeof loadFromCloud === 'function') setTimeout(()=>loadFromCloud({silent:true,force:true,skipLock:true}),120);
    return;
  }
  return v649PrevSave ? v649PrevSave.apply(this,arguments) : undefined;
};
const v649PrevSilentSave = typeof silentSave === 'function' ? silentSave : null;
silentSave = function(){
  if(v649ReadOnly) return;
  return v649PrevSilentSave ? v649PrevSilentSave.apply(this,arguments) : undefined;
};

const v649PrevSelectTrip = typeof selectTrip === 'function' ? selectTrip : null;
selectTrip = async function(id){
  v649SelectingTrip = true;
  try{
    const r = v649PrevSelectTrip ? await v649PrevSelectTrip(id) : undefined;
    v649SelectingTrip = false;
    await v649AcquireEditLock({takeover:false});
    v649ApplyLockBanner();
    return r;
  }catch(e){
    v649SelectingTrip = false;
    throw e;
  }
};

const v649PrevCreateTrip = typeof createTrip === 'function' ? createTrip : null;
createTrip = async function(){
  const r = v649PrevCreateTrip ? await v649PrevCreateTrip.apply(this,arguments) : undefined;
  if(currentTripId) await v649AcquireEditLock({takeover:true});
  v649ApplyLockBanner();
  return r;
};

const v649PrevLoadFromCloud = typeof loadFromCloud === 'function' ? loadFromCloud : null;
loadFromCloud = async function(options={}){
  const r = v649PrevLoadFromCloud ? await v649PrevLoadFromCloud(options) : false;
  v649ApplyLockBanner();
  return r;
};

const v649PrevRender = typeof render === 'function' ? render : null;
render = function(){
  const r = v649PrevRender ? v649PrevRender.apply(this,arguments) : undefined;
  v649ApplyLockBanner();
  return r;
};

const v649PrevBackToTripList = typeof v63BackToTripList === 'function' ? v63BackToTripList : null;
v63BackToTripList = function(){
  v649StopHeartbeat();
  if(v649LockUnsub){try{v649LockUnsub();}catch(e){} v649LockUnsub=null;}
  v649SetReadOnly(false,null);
  return v649PrevBackToTripList ? v649PrevBackToTripList.apply(this,arguments) : undefined;
};

const v649PrevSignOut = typeof firebaseSignOut === 'function' ? firebaseSignOut : null;
firebaseSignOut = function(){
  v649StopHeartbeat();
  if(v649LockUnsub){try{v649LockUnsub();}catch(e){} v649LockUnsub=null;}
  return v649PrevSignOut ? v649PrevSignOut.apply(this,arguments) : undefined;
};

const v649PrevSetSyncStatus = typeof setSyncStatus === 'function' ? setSyncStatus : null;
setSyncStatus = function(kind,title,desc){
  let k=kind, t=title, d=desc;
  if(v649ReadOnly && kind === 'on' && String(title||'').includes('同步')){
    k='warn'; t='檢視模式'; d=`這趟旅程由 ${v649LockOwnerText()} 編輯中`;
  }
  const r = v649PrevSetSyncStatus ? v649PrevSetSyncStatus(k,t,d) : undefined;
  try{ if(typeof updateAccountSyncLine === 'function') updateAccountSyncLine(); }catch(e){}
  return r;
};

const v649PrevSyncLabel = typeof v648SyncLabelFromState === 'function' ? v648SyncLabelFromState : null;
v648SyncLabelFromState = function(){
  if(v649ReadOnly) return '檢視模式';
  return v649PrevSyncLabel ? v649PrevSyncLabel() : (fbUser ? '尚未同步' : '尚未登入');
};
const v649PrevSyncDot = typeof v648SyncDotClassFromState === 'function' ? v648SyncDotClassFromState : null;
v648SyncDotClassFromState = function(){
  if(v649ReadOnly) return 'syncing';
  return v649PrevSyncDot ? v649PrevSyncDot() : '';
};

const v649PrevRenderHelp = typeof renderHelp === 'function' ? renderHelp : null;
renderHelp = function(){
  const r = v649PrevRenderHelp ? v649PrevRenderHelp.apply(this,arguments) : undefined;
  const log=document.getElementById('v64UpdateLog') || document.getElementById('helpView')?.querySelector('.card');
  if(log){
    log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V649_VERSION_TEXT)}</b><br>新增單一編輯裝置鎖：同一帳號可在多裝置登入，但同一趟旅程同時間只允許一台裝置編輯，其他裝置會進入檢視模式，避免舊資料自動同步覆蓋新資料。可用「接手編輯」先載入雲端最新資料後切換編輯權。</div>`;
  }
  v649UpdateFooterVersion();
  return r;
};
function v649UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V649_VERSION_SHORT);
}
setTimeout(()=>{try{v649UpdateFooterVersion(); v649ApplyLockBanner();}catch(e){console.warn(e)}},520);
window.addEventListener('beforeunload',()=>{v649StopHeartbeat();});

const V650_VERSION_SHORT = "v65.0｜2026-05-31";
const V650_VERSION_TEXT = "v65.0｜照片旅遊書封面與照片日記流程整理版";

/* 標籤欄位從 UI 移除；舊資料保留但不顯示、不再編輯。 */
