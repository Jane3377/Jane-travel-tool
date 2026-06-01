/* ── data.js：loadData、save、Firebase sync、裝置鎖 ── */
function loadData(){try{const s=JSON.parse(localStorage.getItem("travel_book_v8"))||JSON.parse(localStorage.getItem("travel_book_v7"))||{};let d=structuredClone(base);Object.assign(d,s);d.meta={...base.meta,...(s.meta||{})};d.trip={...base.trip,...(s.trip||{})};if(!d.trip.travelers){d.trip.travelers=[d.trip.a||"A",d.trip.b||"B"];d.trip.travelerCount=d.trip.travelers.length}d.flights={out:{...base.flights.out,...(s.flights?.out||{})},back:{...base.flights.back,...(s.flights?.back||{})}};if(!d.days?.length)d.days=mkDays(d.trip.start,d.trip.end);if(!d.packing?.length)d.packing=base.packing;if(!d.expenses)d.expenses=[];if(!d.dayCovers)d.dayCovers={};return d}catch(e){let d=structuredClone(base);d.days=mkDays(d.trip.start,d.trip.end);return d}}
function save(){localStorage.setItem("travel_book_v8",JSON.stringify(data));render()}function silentSave(){localStorage.setItem("travel_book_v8",JSON.stringify(data))}function travelerName(v){if(v==="共同"||v==="未定")return v;return data.trip.travelers[Number(v)]||v||"未定"}function dayTitle(k){let d=data.days.find(x=>x.key==k);return d?`${d.title}｜${d.label}`:k}function hotelFor(k){return data.hotels.find(h=>k>=h.start&&k<=h.end)}function moneyTwd(item){return item.mode==="TWD"?Number(item.twd||0):Math.round(Number(item.foreign||0)*Number(data.trip.rate||0))}function moneyForeign(item){return item.mode==="TWD"?Math.round(Number(item.twd||0)/Number(data.trip.rate||1)):Number(item.foreign||0)}function payMethodLabel(v){return v==="cash"?"現金":v==="card"?"刷卡":v==="transfer"?"轉帳":v||"未定"}
function sample(){data=structuredClone(base);data.meta.title="釜山小旅行手帳";data.meta.subtitle="把海風、咖啡廳、夜市小吃和想拍的街景慢慢收進行程裡，準備一趟剛剛好的釜山旅行。";data.trip={dest:"韓國釜山",country:"韓國",currency:"KRW",start:"2026-06-04",end:"2026-06-10",rate:.023,travelerCount:2,travelers:["Jane","Allen"]};data.days=mkDays(data.trip.start,data.trip.end);data.flights.out={no:"BX 範例去程",from:"TPE 桃園",to:"PUS 金海",dep:"2026-06-04T10:00",arr:"2026-06-04T13:20",transfer:"抵達後搭機場輕軌或計程車前往飯店。"};data.flights.back={no:"BX 範例回程",from:"PUS 金海",to:"TPE 桃園",dep:"2026-06-10T14:30",arr:"2026-06-10T16:10",transfer:"建議提早 3 小時出發。"};data.hotels=[{id:uid(),name:"城市律動",start:"2026-06-05",end:"2026-06-07",addr:"釜山西面站附近",note:"近地鐵，晚上回飯店方便。"}];data.expenses=[{id:uid(),source:"住宿",type:"住宿",name:"6/5~6/7 城市律動",payer:"1",payMethod:"card",day:"",mode:"TWD",foreign:0,twd:18000,memo:"範例"}];data.spots=[["甘川洞文化村","景點","2026-06-05"],["海雲台","景點","2026-06-06"],["西面商圈","購物","2026-06-07"]].map(x=>({id:uid(),name:x[0],type:x[1],day:x[2],addr:"釜山",memo:"範例口袋景點"}));cur=data.days[0].key;save();toast("已加入範例")}function resetAll(){if(!confirm("確定清除全部資料？"))return;localStorage.removeItem("travel_book_v8");data=loadData();cur=data.days[0].key;render()}
const cityMap={
  "韓國":["釜山","首爾","濟州","大邱","仁川"],
  "日本":["東京","大阪","京都","福岡","札幌","沖繩","名古屋"],
  "泰國":["曼谷","清邁","普吉"],
  "美國":["紐約","洛杉磯","舊金山","西雅圖","夏威夷"],
  "越南":["峴港","河內","胡志明市"],
  "新加坡":["新加坡"],
  "歐洲":["巴黎","倫敦","維也納","布拉格","羅馬","阿姆斯特丹"],
  "英國":["倫敦","愛丁堡"],
  "香港":["香港"]
};
function initFirebaseSync(){
  if(!window.firebase){
    setSyncStatus("off","Firebase SDK 尚未載入","請確認網路連線或 GitHub Pages 是否可載入 Firebase CDN。");
    return;
  }

  if(!firebase.apps.length){
    fbApp = firebase.initializeApp(FIREBASE_CONFIG);
  }else{
    fbApp = firebase.app();
  }

  fbAuth = firebase.auth();
  fbDb = firebase.firestore();

  fbAuth.onAuthStateChanged(async user=>{
    fbUser = user || null;
    cloudReady = false;

    if(cloudUnsub){
      cloudUnsub();
      cloudUnsub = null;
    }

    if(!user){
      updateAuthButtons(false);
      setSyncStatus("off","尚未登入","登入 Google 後可跨裝置同步。");
      return;
    }

    updateAuthButtons(true);

    const email = (user.email || "").toLowerCase();
    if(email !== ALLOWED_EMAIL){
      setSyncStatus("off","此 Google 帳號尚未授權",`${email} 不在白名單中。請登出後改用授權帳號。`);
      return;
    }

    setSyncStatus("warn","登入成功，檢查雲端資料中",email);

    try{
      await firstCloudLoadOrCreate();
      cloudReady = true;
      listenCloudChanges();
      scheduleCloudSave();
    }catch(err){
      cloudReady = false;
      setSyncStatus("off","雲端同步失敗",err.message || "請檢查 Firestore Rules、白名單 email 與網路。");
    }
  });
}

function setSyncStatus(kind,title,desc){
  const el=$("syncStatus");
  if(!el)return;
  const dotClass = kind==="on"?"on":kind==="warn"?"warn":"off";
  el.innerHTML = `<span class="syncDot ${dotClass}"></span><b>${esc(title||"")}</b><br>${esc(desc||"")}`;
}

function firebaseSignIn(){
  if(!fbAuth)return toast("Firebase 尚未初始化");
  const provider = new firebase.auth.GoogleAuthProvider();
  fbAuth.signInWithPopup(provider).catch(err=>{
    alert("登入失敗：" + err.message + "\n\n若你在 GitHub Pages 遇到授權問題，請確認 Firebase Auth 的 Authorized domains 已加入你的 GitHub Pages 網域。");
  });
}

function firebaseSignOut(){
  if(fbAuth) fbAuth.signOut();
}

function cloudPayload(){
  return {
    appVersion: typeof APP_VERSION !== "undefined" ? APP_VERSION : "unknown",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAtClient: Date.now(),
    ownerEmail: fbUser?.email || "",
    data: JSON.parse(JSON.stringify(data))
  };
}

function listenCloudChanges(){
  const ref=tripDocRef();
  cloudUnsub = ref.onSnapshot(snap=>{
    if(!snap.exists || !snap.data()?.data || !cloudReady)return;
    const doc=snap.data();
    const remoteUpdated = doc.updatedAtClient || 0;
    if(remoteUpdated && remoteUpdated > lastCloudUpdatedAt + 5000){
      lastCloudUpdatedAt = remoteUpdated;
      setSyncStatus("warn","雲端有較新的資料","可按「載入雲端」更新此裝置。");
    }
  }, err=>{
    setSyncStatus("off","雲端監聽失敗",err.message);
  });
}

function scheduleCloudSave(){
  if(suppressCloudSave || !cloudReady || !fbUser)return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(saveToCloudNow,900);
}

async function saveToCloudNow(){
  if(!fbUser)return toast("請先登入 Google");
  const email=(fbUser.email||"").toLowerCase();
  if(email!==ALLOWED_EMAIL)return toast("此帳號尚未授權同步");

  try{
    setSyncStatus("warn","同步中","正在儲存到 Firestore...");
    const now=Date.now();
    lastCloudUpdatedAt = now;
    const payload = cloudPayload();
    payload.updatedAtClient = now;
    await tripDocRef().set(payload,{merge:true});
    localStorage.setItem("travel_book_v22_cloud_backup", JSON.stringify(data));
    setSyncStatus("on","已同步雲端",`最後同步：${new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}`);
  }catch(err){
    setSyncStatus("off","同步失敗",err.message || "請檢查 Firestore Rules 與白名單。");
  }
}

async function loadFromCloud(){
  if(!fbUser)return toast("請先登入 Google");
  if(!confirm("載入雲端資料會覆蓋目前此裝置上的資料。建議先到「說明」匯出備份。確定載入嗎？"))return;

  try{
    const snap=await tripDocRef().get();
    if(!snap.exists || !snap.data()?.data)return toast("雲端目前沒有資料");
    suppressCloudSave = true;
    data=snap.data().data;
    if(!data.days?.length && data.trip?.start && data.trip?.end)data.days=mkDays(data.trip.start,data.trip.end);
    cur=data.days?.[0]?.key||data.trip?.start||cur;
    localStorage.setItem("travel_book_v12",JSON.stringify(data));
    render();
    suppressCloudSave = false;
    setSyncStatus("on","已載入雲端資料",`登入：${fbUser.email}`);
  }catch(err){
    suppressCloudSave=false;
    setSyncStatus("off","載入雲端失敗",err.message);
  }
}

const originalSaveForFirebase = save;
save = function(){
  localStorage.setItem("travel_book_v12", JSON.stringify(data));
  render();
  scheduleCloudSave();
};

const originalSilentSaveForFirebase = silentSave;
silentSave = function(){
  localStorage.setItem("travel_book_v12", JSON.stringify(data));
  scheduleCloudSave();
};

const originalRenderHelpForFirebase = renderHelp;
renderHelp = function(){
  $("helpView").innerHTML=`<div class="section"><div><h2>說明與備份</h2><div class="hint">資料備份、Cloudinary 照片、Firebase 跨裝置同步。</div></div></div>
  <div class="card"><h3>Firebase 跨裝置同步</h3><div class="box mint">登入授權 Google 帳號後，旅遊資料會同步到 Firestore。照片本體仍存在 Cloudinary，Firestore 只保存圖片網址與旅行資料。</div><div class="btns"><button class="btn dark" onclick="saveToCloudNow()">立即同步到雲端</button><button class="btn blue" onclick="loadFromCloud()">載入雲端資料</button></div><div class="cloudHint">目前授權 email：${ALLOWED_EMAIL}</div></div>
  <div class="card"><h3>AI 口袋景點</h3><div class="box mint">在「景點」頁按 AI 景點提示詞，複製給 AI。AI 回傳純 JSON 後，存成 .txt 或 .json，再匯入口袋景點。</div></div>
  <div class="card"><h3>備份資料</h3><div class="box blue">匯出備份會下載 JSON。匯入備份會覆蓋目前資料。若要修改國家或日期，建議先匯出備份。</div><div class="btns"><button class="btn dark" onclick="exportBackup()">匯出備份</button><label class="btn soft" style="display:inline-block">匯入備份<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0])" style="display:none"></label></div></div>`;
};
function setSyncStatus(kind,title,desc){
  const el=$("syncStatus");
  if(!el)return;
  const dotClass = kind==="on"?"on":kind==="warn"?"warn":"off";
  const shortTitle = String(title||"").replace("已同步雲端","同步好了").replace("同步中","同步中");
  el.innerHTML = `<span class="syncDot ${dotClass}"></span><b>${esc(shortTitle)}</b>${desc?`<br>${esc(desc)}`:""}`;
}

async function saveToCloudNow(){
  if(!fbUser)return toast("請先登入 Google");
  const email=(fbUser.email||"").toLowerCase();
  if(email!==ALLOWED_EMAIL)return toast("這個帳號還沒授權同步");

  try{
    setSyncStatus("warn","同步中","正在存到雲端...");
    const now=Date.now();
    lastCloudUpdatedAt = now;
    const payload = cloudPayload();
    payload.updatedAtClient = now;
    await tripDocRef().set(payload,{merge:true});
    localStorage.setItem("travel_book_v22_cloud_backup", JSON.stringify(data));
    setSyncStatus("on","同步好了",`${new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}`);
  }catch(err){
    setSyncStatus("off","同步失敗",err.message || "請檢查 Firestore Rules 與白名單。");
  }
}
function showSyncMini(text){
  const el=$("syncMini");
  if(!el)return;
  el.textContent=text||"已同步";
  el.classList.add("show");
  clearTimeout(window.__syncMiniTimer);
  window.__syncMiniTimer=setTimeout(()=>el.classList.remove("show"),1600);
}

function setSyncStatus(kind,title,desc){
  const t=String(title||"");
  if(t.includes("已同步") || t.includes("同步好了")){
    showSyncMini("已同步");
  }else if(t.includes("同步中")){
    showSyncMini("同步中...");
  }else if(t.includes("已載入")){
    showSyncMini("已載入雲端");
  }else if(t.includes("已建立")){
    showSyncMini("已建立雲端資料");
  }else if(t.includes("失敗") || kind==="off"){
    showSyncMini(t || "同步異常");
  }
  // 保留舊 syncStatus 的文字更新，雖然卡片已隱藏，避免其他流程依賴。
  const el=$("syncStatus");
  if(el){
    const dotClass = kind==="on"?"on":kind==="warn"?"warn":"off";
    el.innerHTML = `<span class="syncDot ${dotClass}"></span><b>${esc(title||"")}</b>${desc?`<br>${esc(desc)}`:""}`;
  }
}

function updateAccountSyncLine(){
  const el=$("accountSyncLine");
  if(!el)return;
  const dotClass = syncStatus==="syncing" ? "syncing" : syncStatus==="success" ? "success" : syncStatus==="error" ? "error" : "";
  el.innerHTML = `<span class="dot ${dotClass}"></span>${esc(syncStatusText())}`;
}

function setSyncStatus(kind,title,desc){
  const t=String(title||"");
  if(kind==="warn" || t.includes("同步中")){
    syncStatus="syncing";
    showSyncMini("同步中...");
  }else if(kind==="on" || t.includes("已同步") || t.includes("同步好了") || t.includes("已載入") || t.includes("已建立")){
    syncStatus="success";
    lastSyncTime=new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"});
    if(t.includes("已載入")) showSyncMini("已載入雲端");
    else showSyncMini("已同步");
  }else if(kind==="off" || t.includes("失敗") || t.includes("尚未授權")){
    syncStatus="error";
    showSyncMini(t || "同步失敗");
  }
  updateAccountSyncLine();

  const el=$("syncStatus");
  if(el){
    const dotClass = kind==="on"?"on":kind==="warn"?"warn":"off";
    el.innerHTML = `<span class="syncDot ${dotClass}"></span><b>${esc(title||"")}</b>${desc?`<br>${esc(desc)}`:""}`;
  }
}

function loadData(){
  try{
    const raw = currentTripId ? localStorage.getItem(getLocalTripKey(currentTripId)) : null;
    const fallback = localStorage.getItem("travel_book_v12") || localStorage.getItem("travel_book_v8") || localStorage.getItem("travel_book_v7");
    const s = JSON.parse(raw || fallback || "{}");
    return v63NormalizeData(s);
  }catch(e){
    return v63CloneBase();
  }
}
function save(){
  v63PersistTripLocal();
  v63UpdateCurrentTripMeta(false);
  render();
  scheduleCloudSave();
}
function silentSave(){
  v63PersistTripLocal();
  v63UpdateCurrentTripMeta(false);
  scheduleCloudSave();
}
async function saveToCloudNow(){
  if(!fbUser)return toast("請先登入 Google");
  if(!v63IsAllowed(fbUser))return toast("這個帳號還沒授權同步");
  if(!currentTripId)return toast("請先選擇旅程");
  try{
    setSyncStatus("warn","同步中","正在存到雲端...");
    const now=Date.now();
    lastCloudUpdatedAt=now;
    const payload=cloudPayload();
    payload.updatedAtClient=now;
    payload.tripMeta=v63TripMetaFromData(currentTripId);
    await tripDocRef().set(payload,{merge:true});
    await v63UpdateCurrentTripMeta(true);
    localStorage.setItem(`janeselect_cloud_backup_${currentTripId}`, JSON.stringify(data));
    setSyncStatus("on","同步好了",`${new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}`);
  }catch(err){
    setSyncStatus("off","同步失敗",err.message || "請檢查 Firestore Rules 與白名單。")
  }
}
async function loadFromCloud(){
  if(!fbUser)return toast("請先登入 Google");
  if(!currentTripId)return toast("請先選擇旅程");
  try{
    const snap=await tripDocRef().get();
    if(!snap.exists || !snap.data()?.data)return toast("這趟旅程雲端目前沒有資料");
    suppressCloudSave=true;
    data=v63NormalizeData(snap.data().data);
    cur=data.days?.[0]?.key || data.trip?.start || cur;
    v63PersistTripLocal();
    render();
    suppressCloudSave=false;
    setSyncStatus("on","已載入雲端資料",`旅程：${v63CurrentTripTitle()}`);
  }catch(err){
    suppressCloudSave=false;
    setSyncStatus("off","載入雲端失敗",err.message);
  }
}
function listenCloudChanges(){
  if(!fbUser || !currentTripId)return;
  const ref=tripDocRef();
  cloudUnsub=ref.onSnapshot(snap=>{
    if(!snap.exists || !snap.data()?.data || !cloudReady)return;
    const doc=snap.data();
    const remoteUpdated=doc.updatedAtClient || 0;
    if(remoteUpdated && remoteUpdated > lastCloudUpdatedAt + 5000){
      lastCloudUpdatedAt=remoteUpdated;
      setSyncStatus("warn","雲端有較新的資料","可按「載入雲端」更新此裝置。")
    }
  },err=>setSyncStatus("off","雲端監聽失敗",err.message));
}
const __v63SaveBasic = saveBasic;
saveBasic=function(){
  __v63SaveBasic();
  setTimeout(()=>v63UpdateCurrentTripMeta(true),60);
};
function v632Now(){ return Date.now(); }
function v632LocalMetaKey(tripId=currentTripId){ return `${getLocalTripKey(tripId)}${V632_LOCAL_META_SUFFIX}`; }
function v632GetLocalMeta(tripId=currentTripId){
  try{return JSON.parse(localStorage.getItem(v632LocalMetaKey(tripId))||"{}");}catch(e){return {};}
}
function v632SetLocalMeta(tripId=currentTripId, meta={}){
  if(!tripId)return;
  localStorage.setItem(v632LocalMetaKey(tripId), JSON.stringify({...v632GetLocalMeta(tripId), ...meta}));
}
function v632IsAllowed(){
  return !!(fbUser && typeof v63IsAllowed === "function" && v63IsAllowed(fbUser));
}
function v632CanUseCloud(showToast=false){
  if(!fbUser){ if(showToast)toast("請先登入 Google"); return false; }
  if(!v632IsAllowed()){ if(showToast)toast("這個帳號還沒授權同步"); return false; }
  if(!fbDb){ if(showToast)toast("Firebase 尚未初始化"); return false; }
  if(!currentTripId){ if(showToast)toast("請先選擇旅程"); return false; }
  return true;
}
function v632CloudPathText(){
  if(!fbUser || !currentTripId)return "尚未選擇旅程";
  return `users/${fbUser.uid}/trips/${currentTripId}`;
}
function cloudPayload(){
  return {
    appVersion: V632_VERSION,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAtClient: v632Now(),
    ownerEmail: fbUser?.email || "",
    tripId: currentTripId || "",
    tripMeta: typeof v63TripMetaFromData === "function" ? v63TripMetaFromData(currentTripId) : {},
    data: JSON.parse(JSON.stringify(data))
  };
}
function setSyncStatus(kind,title,desc){
  v632LastSyncState={kind:kind||"off",title:title||"",desc:desc||"",at:v632Now()};
  const dotClass = kind==="on"?"on":kind==="warn"?"warn":"off";
  const shortTitle = String(title||"").replace("已同步雲端","同步好了").replace("已同步到雲端","同步好了");
  const html = `<span class="syncDot ${dotClass}"></span><b>${esc(shortTitle)}</b>${desc?`<br>${esc(desc)}`:""}`;
  const el=$("syncStatus"); if(el)el.innerHTML=html;
  const mini=$("syncMini");
  if(mini){ mini.textContent = `${shortTitle}${desc?"｜"+desc:""}`; mini.classList.add("show"); setTimeout(()=>mini.classList.remove("show"),1800); }
  const line=$("accountSyncLine");
  if(line){
    const state = kind==="on"?"success":kind==="warn"?"syncing":kind==="off"?"error":"";
    line.innerHTML = `<span class="dot ${state}"></span>${esc(shortTitle||"同步狀態")}`;
  }
}
function v632StatusBadge(){
  const s=v632LastSyncState || {};
  const kind=s.kind||"off";
  const label=kind==="on"?"雲端已同步":kind==="warn"?"雲端同步中":"雲端未確認";
  const time=s.at?new Date(s.at).toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"}):"";
  return `<span class="syncCloudBadge ${kind}">${label}${time?`｜${time}`:""}</span>`;
}
function save(){
  v63PersistTripLocal();
  if(typeof v63UpdateCurrentTripMeta === "function")v63UpdateCurrentTripMeta(false);
  render();
  scheduleCloudSave("save");
}
function silentSave(){
  v63PersistTripLocal();
  if(typeof v63UpdateCurrentTripMeta === "function")v63UpdateCurrentTripMeta(false);
  scheduleCloudSave("silentSave");
}
function scheduleCloudSave(reason="auto"){
  if(suppressCloudSave)return;
  if(!v632CanUseCloud(false))return;
  cloudReady=true;
  clearTimeout(cloudSaveTimer);
  setSyncStatus("warn","同步排程中", reason==="auto"?"即將存到雲端":`即將存到雲端：${reason}`);
  cloudSaveTimer=setTimeout(()=>saveToCloudNow({silent:true,reason}),900);
}
async function v632SaveTripIndexCloud(){
  if(!fbUser || !fbDb)return;
  try{
    await v63TripIndexRef().set({
      trips:tripList,
      updatedAtClient:v632Now(),
      ownerEmail:fbUser.email||"",
      appVersion:V632_VERSION
    },{merge:true});
  }catch(e){
    console.warn("tripIndex save failed", e);
    throw e;
  }
}
async function saveToCloudNow(options={}){
  const silent=!!options.silent;
  if(!v632CanUseCloud(true))return false;
  try{
    clearTimeout(cloudSaveTimer);
    setSyncStatus("warn","同步中",`寫入：${v632CloudPathText()}`);
    const now=v632Now();
    lastCloudUpdatedAt=now;
    const payload=cloudPayload();
    payload.updatedAtClient=now;
    payload.tripMeta={...payload.tripMeta, updatedAtClient:now};
    await tripDocRef().set(payload,{merge:true});
    cloudReady=true;
    v632SetLocalMeta(currentTripId,{updatedAtClient:now, cloudUpdatedAtClient:now, cloudPath:v632CloudPathText()});
    if(typeof v63UpdateCurrentTripMeta === "function"){
      await v63UpdateCurrentTripMeta(false);
      await v632SaveTripIndexCloud();
    }
    localStorage.setItem(`janeselect_cloud_backup_${currentTripId}`, JSON.stringify(data));
    localStorage.setItem("travel_book_v22_cloud_backup", JSON.stringify(data));
    setSyncStatus("on","同步好了",`${new Date(now).toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}`);
    if(!silent)toast("已同步到雲端");
    return true;
  }catch(err){
    const msg=err?.message || String(err) || "請檢查 Firestore Rules 與網路。";
    setSyncStatus("off","同步失敗",msg);
    if(!silent)alert("同步失敗："+msg+"\n\n請確認 Firestore Rules 允許 users/{uid}/trips/{tripId} 與 users/{uid}/tripIndex/list 讀寫。");
    return false;
  }
}
async function loadFromCloud(options={}){
  const silent=!!options.silent;
  if(!v632CanUseCloud(true))return false;
  if(!silent && !options.force && !confirm("載入雲端資料會覆蓋目前此裝置上的同一趟旅程資料。確定載入嗎？"))return false;
  try{
    setSyncStatus("warn","載入中",`讀取：${v632CloudPathText()}`);
    const snap=await tripDocRef().get();
    if(!snap.exists || !snap.data()?.data){
      if(!silent)toast("這趟旅程雲端目前沒有資料");
      setSyncStatus("off","雲端無資料",v632CloudPathText());
      return false;
    }
    suppressCloudSave=true;
    const doc=snap.data();
    data=v63NormalizeData(doc.data);
    cur=data.days?.[0]?.key || data.trip?.start || cur;
    v63PersistTripLocal();
    lastCloudUpdatedAt=doc.updatedAtClient || v632Now();
    suppressCloudSave=false;
    cloudReady=true;
    render();
    setSyncStatus("on","已載入雲端資料",`旅程：${v63CurrentTripTitle()}`);
    return true;
  }catch(err){
    suppressCloudSave=false;
    const msg=err?.message || String(err);
    setSyncStatus("off","載入雲端失敗",msg);
    if(!silent)alert("載入雲端失敗："+msg);
    return false;
  }
}
function listenCloudChanges(){
  if(!v632CanUseCloud(false))return;
  if(cloudUnsub){cloudUnsub(); cloudUnsub=null;}
  const listeningTripId=currentTripId;
  cloudUnsub=tripDocRef().onSnapshot(snap=>{
    if(!snap.exists || !snap.data()?.data || !cloudReady)return;
    if(listeningTripId!==currentTripId)return;
    const doc=snap.data();
    const remoteUpdated=doc.updatedAtClient || 0;
    const localMeta=v632GetLocalMeta(currentTripId);
    const localUpdated=localMeta.updatedAtClient || 0;
    if(remoteUpdated && remoteUpdated > Math.max(lastCloudUpdatedAt, localUpdated) + 1200){
      lastCloudUpdatedAt=remoteUpdated;
      setSyncStatus("warn","雲端有較新的資料","可按「載入」更新此裝置");
    }
  },err=>setSyncStatus("off","雲端監聽失敗",err.message));
}
async function v632CheckCloud(){
  if(!v632CanUseCloud(true))return;
  try{
    const snap=await tripDocRef().get();
    if(!snap.exists)return alert(`雲端尚未建立此旅程\n路徑：${v632CloudPathText()}`);
    const doc=snap.data()||{};
    const d=doc.data||{};
    alert(`雲端檢查成功\n路徑：${v632CloudPathText()}\n更新時間：${doc.updatedAtClient?new Date(doc.updatedAtClient).toLocaleString("zh-TW"):"未知"}\n行程：${Array.isArray(d.plans)?d.plans.length:0} 筆\n住宿：${Array.isArray(d.hotels)?d.hotels.length:0} 筆\n景點：${Array.isArray(d.spots)?d.spots.length:0} 筆`);
  }catch(e){
    alert("雲端檢查失敗："+(e.message||String(e)));
  }
}
const __v632RenderHelp = renderHelp;
renderHelp=function(){
  __v632RenderHelp();
  const el=$("helpView");
  if(el){
    el.insertAdjacentHTML("afterbegin", `<div class="card"><h3>v63.2 雲端同步檢查</h3><div class="box mint">目前同步路徑：${esc(v632CloudPathText())}<br>如果平板有資料、手機看不到，請先在有資料的裝置按「強制同步」，再到另一台裝置按「載入」。</div><div class="btns"><button class="btn dark" onclick="saveToCloudNow()">強制同步</button><button class="btn blue" onclick="loadFromCloud({force:true})">載入雲端</button><button class="btn soft" onclick="v632CheckCloud()">檢查雲端筆數</button></div></div>`);
  }
};
// 重新標示目前版本，保留頁尾原資訊之外再補 v63.2 狀態。
document.addEventListener("DOMContentLoaded",()=>{
  const footer=document.querySelector("footer strong");
  if(footer && !footer.textContent.includes("v63.2"))footer.textContent="版本：v63.2｜2026-05-30｜多旅程雲端同步穩定修正版";
});
function v647CanUseCloud(showToast=false){
  if(typeof v632CanUseCloud === 'function') return v632CanUseCloud(showToast);
  if(!fbUser){ if(showToast) toast('請先登入 Google'); return false; }
  if(!fbDb){ if(showToast) toast('Firebase 尚未初始化'); return false; }
  if(!currentTripId){ if(showToast) toast('請先選擇旅程'); return false; }
  return true;
}

scheduleCloudSave = function(reason='auto'){
  if(suppressCloudSave) return;
  if(!v647CanUseCloud(false)){
    if(typeof setSyncStatus === 'function') setSyncStatus('warn','本機已儲存','登入後可手動同步到雲端。');
    return;
  }
  v647LastSaveReason = reason;
  clearTimeout(cloudSaveTimer);
  clearTimeout(v647CloudSaveTimer);
  if(typeof setSyncStatus === 'function') setSyncStatus('warn','等待同步','已先儲存在本機，稍後寫入雲端。');
  v647CloudSaveTimer = setTimeout(()=>saveToCloudNow({silent:true, reason}), 1800);
};

saveToCloudNow = async function(options={}){
  const silent=!!options.silent;
  if(!v647CanUseCloud(true)) return false;
  if(v647CloudSaveInFlight){
    v647CloudSaveQueued = true;
    if(typeof setSyncStatus === 'function') setSyncStatus('warn','同步排隊中','上一筆資料仍在寫入，完成後會再同步一次。');
    return false;
  }
  v647CloudSaveInFlight = true;
  v647CloudSaveQueued = false;
  try{
    clearTimeout(cloudSaveTimer);
    clearTimeout(v647CloudSaveTimer);
    if(typeof setSyncStatus === 'function') setSyncStatus('warn','同步中','正在寫入雲端資料。');
    const now = typeof v632Now === 'function' ? v632Now() : Date.now();
    lastCloudUpdatedAt = now;
    const payload = typeof cloudPayload === 'function' ? cloudPayload() : {data:JSON.parse(JSON.stringify(data))};
    payload.updatedAtClient = now;
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    payload.tripMeta = {...(payload.tripMeta||{}), updatedAtClient:now};
    await tripDocRef().set(payload,{merge:true});
    cloudReady = true;
    if(typeof v63UpdateCurrentTripMeta === 'function'){
      await v63UpdateCurrentTripMeta(false);
      if(typeof v632SaveTripIndexCloud === 'function') await v632SaveTripIndexCloud();
    }
    if(typeof v632SetLocalMeta === 'function'){
      v632SetLocalMeta(currentTripId,{updatedAtClient:now, cloudUpdatedAtClient:now, cloudPath: typeof v632CloudPathText==='function'?v632CloudPathText():''});
    }
    try{
      localStorage.setItem(`janeselect_cloud_backup_${currentTripId}`, JSON.stringify(data));
      localStorage.setItem('travel_book_v22_cloud_backup', JSON.stringify(data));
    }catch(e){}
    if(typeof setSyncStatus === 'function') setSyncStatus('on','同步好了',`${new Date(now).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}`);
    if(!silent) toast('已同步到雲端');
    v647CloudSaveInFlight = false;
    if(v647CloudSaveQueued){
      v647CloudSaveQueued = false;
      setTimeout(()=>saveToCloudNow({silent:true, reason:'queued'}), 350);
    }
    return true;
  }catch(err){
    v647CloudSaveInFlight = false;
    const msg=err?.message || String(err) || '請檢查 Firestore Rules、白名單與網路。';
    if(typeof setSyncStatus === 'function') setSyncStatus('off','同步失敗',msg);
    if(!silent) alert('同步失敗：'+msg);
    return false;
  }
};

/* 照片日記：恢復「先選照片 → 填標題/標籤/一句日記 → 新增」流程。 */
if(typeof storyPendingPhotoFiles === 'undefined') window.storyPendingPhotoFiles = {};
if(typeof storyPhotoPreviewUrls === 'undefined') window.storyPhotoPreviewUrls = {};

function v647PhotoAttr(v){
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function v647ClearPhotoInputs(day){
  [`storyPhotoTitle-${day}`,`storyPhotoTags-${day}`,`storyPhotoMemo-${day}`,`storyPhotoFile-${day}`].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
}

if(typeof selectStoryPhotoFile !== 'function'){
  window.selectStoryPhotoFile = function(day,file){
    if(!file){ delete storyPendingPhotoFiles[day]; return; }
    storyPendingPhotoFiles[day]=file;
  };
}
if(typeof clearPendingStoryPhoto !== 'function'){
  window.clearPendingStoryPhoto = function(day){
    delete storyPendingPhotoFiles[day];
    v647ClearPhotoInputs(day);
  };
}

storyPhotoUploadForm = function(day, count){
  if(count>=10) return '';
  const file = storyPendingPhotoFiles[day];
  const previewUrl = (typeof storyPhotoPreviewUrls !== 'undefined' && storyPhotoPreviewUrls[day]) ? storyPhotoPreviewUrls[day] : '';
  return `<div class="storyPhotoUploadCard noPrint">
    <div class="storyPhotoPickBox">
      <label class="storyPhotoPickLabel">
        ${file ? '已選擇照片，可繼續補標題與日記' : '＋ 先選擇要上傳的照片'}
        <input id="storyPhotoFile-${day}" type="file" accept="image/*" onchange="selectStoryPhotoFile('${day}',this.files[0])">
      </label>
      <div class="storyPhotoPickMeta" id="storyPhotoPickMeta-${day}">${file ? '已選擇：' + v647PhotoAttr(file.name) : '請先選擇 1 張照片，再輸入標題、標籤與一句照片日記。'}</div>
      <div class="storyPhotoPickPreview ${previewUrl?'show':''}" id="storyPhotoPickPreview-${day}">${previewUrl?`<img src="${previewUrl}"><div>預覽照片：新增後會上傳到照片日記</div>`:''}</div>
    </div>
    <div class="storyPhotoQuickFields">
      <input id="storyPhotoTitle-${day}" placeholder="照片標題，例如：海雲台散步">
      <input id="storyPhotoTags-${day}" placeholder="標籤，例如：🌊 海邊 咖啡">
    </div>
    <input id="storyPhotoMemo-${day}" placeholder="一句照片日記">
    <div class="storyPhotoUploadActions">
      <button class="btn soft" type="button" onclick="clearPendingStoryPhoto('${day}')">清除照片</button>
      <button class="btn dark" type="button" onclick="addPhotoToDay('${day}')">新增到 ${dayTitle(day)}</button>
    </div>
    <div class="photoUploadStatus" id="storyPhotoStatus-${day}"></div>
  </div>`;
};

addPhotoToDay = async function(day){
  const file = storyPendingPhotoFiles[day];
  if(!file) return toast('請先選擇照片');
  const count = typeof photoCountForDay === 'function' ? photoCountForDay(day) : (data.photos||[]).filter(p=>p.day===day).length;
  if(count>=10) return toast('這天最多上傳 10 張照片');
  try{
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, '上傳中...');
    const img = await uploadImageFileForPhotoBook(file, {maxWidth:1600, quality:.82}, `storyPhotoStatus-${day}`);
    data.photos.unshift({
      id:uid(),
      day,
      title:document.getElementById(`storyPhotoTitle-${day}`)?.value || '',
      tags:document.getElementById(`storyPhotoTags-${day}`)?.value || '',
      memo:document.getElementById(`storyPhotoMemo-${day}`)?.value || '',
      src:img.src,
      publicId:img.publicId,
      cloudinary:true,
      width:img.width,
      height:img.height,
      bytes:img.bytes
    });
    if(typeof clearPendingStoryPhoto === 'function') clearPendingStoryPhoto(day); else {delete storyPendingPhotoFiles[day]; v647ClearPhotoInputs(day);}
    save();
    toast('照片已加入這天的照片日記');
  }catch(err){
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, '');
    alert('照片上傳失敗：' + (err?.message || err));
  }
};

storyBookPhotoCard = function(p, idx){
  const ori = typeof v646PhotoOrientation === 'function' ? v646PhotoOrientation(p) : 'landscape';
  const editBtn = typeof openPhotoEditModal === 'function'
    ? `<button class="small" onclick="openPhotoEditModal('${p.id}')">編輯</button>`
    : `<button class="small" onclick="beginEditPhoto('${p.id}')">編輯</button>`;
  return `<div class="storyPhotoCard ${idx===0?'featured':''} orientation-${ori}">
    <div class="storyPhotoImage"><img src="${p.src}"></div>
    <div class="storyPhotoText">
      <h3>${esc(p.title||'照片紀錄')}</h3>
      ${typeof storyTagsHtml==='function' ? storyTagsHtml(p.tags) : (typeof photoTagsHtml==='function' ? photoTagsHtml(p.tags) : '')}
      <p>${esc(p.memo||'')}</p>
      <div class="storyPhotoCardActions noPrint">
        ${editBtn}
        <button class="small" onclick="delPhoto('${p.id}')">刪除</button>
      </div>
    </div>
  </div>`;
};

storyBookDay = function(d){
  if(!data.dayCovers) data.dayCovers={};
  const plans=sortedPlans(d.key);
  const photos=(data.photos||[]).filter(p=>p.day==d.key);
  const dayCover=data.dayCovers[d.key] || '';
  const cover=dayCover || photos[0]?.src || '';
  const count=photos.length;
  const hasCustomDayCover=!!dayCover;
  return `<section class="storyDay">
    <div class="storyDayHeader">
      <div>
        <span class="eyebrow">${d.title}</span>
        <h2>${d.label} 的旅行故事</h2>
        <p>住宿：${hotelFor(d.key)?.name||'未設定'}。今天收錄 ${plans.length} 個行程與 ${photos.length} 張照片。</p>
      </div>
      <div class="bookDayBadge">${plans.length} 行程｜${photos.length} 照片</div>
    </div>
    <div class="storyDayHero ${cover?'':'storyInlineEmpty'}">
      ${cover?`<img src="${cover}">`:`<div><div>尚未上傳本日封面圖</div><label class="photoInlineUpload" style="margin-top:10px">＋ 上傳本日封面<input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></label><div class="photoUploadStatus" id="dayCoverStatus-${d.key}"></div></div>`}
      ${cover?`<div class="storyDayCoverActions noPrint">
        <label class="photoInlineUpload">${hasCustomDayCover?'更換封面':'設定為每日封面'}<input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></label>
        ${hasCustomDayCover?`<button type="button" class="danger" onclick="removeDayCover('${d.key}')">刪除封面</button>`:''}
        <div class="photoUploadStatus" id="dayCoverStatus-${d.key}"></div>
      </div>`:''}
    </div>
    <div class="storyDayBody">
      <div>
        <div class="storyTimelineTitle">今天的路線</div>
        ${storyTimelineHtml(plans)}
      </div>
      <div>
        <div class="storyPhotoUploadRow">
          <div>
            <div class="storyPhotosTitle">今日照片日記</div>
            <div class="storyPhotoLimit">${count}/10 張照片${count<10?'，可繼續上傳':'，已達上限'}</div>
          </div>
        </div>
        ${storyPhotoUploadForm(d.key,count)}
        ${photos.length?`<div class="storyPhotoLayout">${photos.map(storyBookPhotoCard).join('')}</div>`:`<div class="storyEmpty">還沒有照片日記，先上傳幾張今天的代表照片吧。</div>`}
      </div>
    </div>
  </section>`;
};

/* 說明與版本 */
const v647PrevRenderHelp = typeof renderHelp === 'function' ? renderHelp : null;
renderHelp = function(...args){
  const r = v647PrevRenderHelp ? v647PrevRenderHelp.apply(this,args) : undefined;
  const log=$('v64UpdateLog') || $('helpView')?.querySelector('.card');
  if(log){
    log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V647_VERSION_TEXT)}</b><br>修正照片旅遊書同步狀態偶爾卡住的問題，改成排隊式雲端同步；今日照片日記恢復「先選照片、再填標題/標籤/一句日記、最後新增」流程，並保留照片日記編輯與刪除。</div>`;
  }
  v647UpdateFooterVersion();
  return r;
};
function v647UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V647_VERSION_SHORT);
}
setTimeout(()=>{try{v647UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},420);
const V648_VERSION_SHORT = "v64.8｜2026-05-31";
const V648_VERSION_TEXT = "v64.8｜同步狀態顯示修正版";

