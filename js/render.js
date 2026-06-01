/* ── render.js ── */

function v24IsFlightPlan(p){return p?.source==="flight"||p?.sourceType==="flight"||p?.memo==="由航班資料帶入"}
function flightHasPlans(){v28NormalizePlans();return data.plans.some(v24IsFlightPlan)}
function flightHasBudget(){return data.expenses.some(e=>e.sourceType==="flight"||e.source==="航班")}

/* ── v16 日期工具 ── */
function cancelDateReset(){v19PendingDates=null;v643PendingBasic=null;$("dateResetModal")?.classList.remove("show")}
function confirmDateReset(){v643ConfirmDateAdjust("range")}
function getTripListKey(){return`${V63_TRIP_LIST_KEY_PREFIX}_${v63UserKey()}`}
function getLocalTripKey(tripId=currentTripId){return`janeselect_travel_data_v63_${v63UserKey()}_${tripId||"draft"}`}
function renderHead(){const h=$("header");if(!h)return;h.innerHTML=`<div class="brand"><button type="button" class="brandBtn" onclick="v637OpenTitleModal('title')" title="點擊編輯標題"><span class="brandMark" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false"><rect x="10" y="13" width="40" height="43" rx="10"></rect><path d="M22 13c1.7-5.4 13.9-5.4 15.6 0"></path><path d="M21 28h18M21 38h14"></path><circle cx="45" cy="18" r="6"></circle><path d="M45 14v4l3 2"></path></svg></span><div class="brandText"><span class="brandTitle">${esc(data.meta.title||"我的旅程")}</span><span class="brandSub">${esc(data.trip.dest||"貞選旅管家")}</span></div></button></div><nav class="tabs noPrint" id="tabs">${views.map(([k,l])=>`<button class="tab ${view===k?"active":""}" onclick="go('${k}')">${l}</button>`).join("")}</nav>`;ensureAccountThemeButton();v63RenderTripSwitchBar();v649ApplyLockBanner()}

/* ── renderNav ── */
function renderNav(){const tabs=document.querySelectorAll(".tab");tabs.forEach(t=>t.classList.toggle("active",t.dataset.view===view||t.getAttribute("onclick")===`go('${view}')`));const mobileNav=document.querySelectorAll(".nav");mobileNav.forEach(n=>{const v=n.getAttribute("data-view")||n.getAttribute("onclick")?.match(/go\('([^']+)'\)/)?.[1];if(v)n.classList.toggle("active",v===view)});if($("mobileTopNav")){const btns=$("mobileTopNav").querySelectorAll("button");btns.forEach(b=>{const v=b.getAttribute("data-view")||b.getAttribute("onclick")?.match(/go\('([^']+)'\)/)?.[1];if(v)b.classList.toggle("active",v===view)})}renderHead()}

/* ── go ── */
function go(v){view=v;views.forEach(x=>$(x[0]+"View")?.classList.toggle("hidden",x[0]!=v));renderNav();if(v==="planner"){if(!currentDay)currentDay=cur||data.days?.[0]?.key;cur=currentDay}render();scrollTo(0,0)}

/* ── render（v649 版，含 ApplyLockBanner） ── */
function render(){v28NormalizePlans();normalizeAllPlanTypes();if(!currentDay)currentDay=cur||data.days?.[0]?.key||data.trip?.start;cur=currentDay;adjustToastShown=false;renderHead();renderSide();renderStay();renderTrip();renderPlanner();renderSpots();renderBudget();renderPacking();renderPhotoBook();renderHelp();v649ApplyLockBanner();try{v64AfterRender()}catch(e){}}

/* ── renderSide ── */
function renderHelp(){$("helpView").innerHTML=`<div class="section"><div><h2>說明與備份</h2><div class="hint">資料備份、雲端同步、Cloudinary 照片說明、AI 提示詞用法。</div></div></div>

<div class="card"><h3>🔄 雲端同步狀態</h3>
  <div class="box mint" id="syncStatus"><span class="syncDot off"></span><b>尚未同步</b></div>
  <div class="box mint" style="margin-top:10px"><b>目前同步路徑：</b>${esc(v632CloudPathText())}<br>如果平板有資料、手機看不到，請先在有資料的裝置按「強制同步」，再到另一台裝置按「載入」。</div>
  <div class="btns">
    <button class="btn dark" onclick="saveToCloudNow()">強制同步</button>
    <button class="btn blue" onclick="loadFromCloud({force:true})">載入雲端</button>
  </div>
</div>

<div class="card"><h3>📤 分享行程</h3><div class="box mint">可以把整趟行程轉成純文字，複製分享給旅伴；或列印成一張行程單。</div><div class="btns"><button class="btn dark" onclick="v653OpenItineraryShare()">分享行程</button></div></div>

<div class="card"><h3>💾 備份資料</h3><div class="box blue">匯出備份會下載 JSON；匯入備份會覆蓋目前資料。若要修改國家或日期，建議先匯出備份。</div><div class="btns"><button class="btn dark" onclick="exportBackup()">匯出備份</button><label class="btn soft" style="display:inline-block">匯入備份<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0])" style="display:none"></label></div></div>

<div class="card"><h3>🤖 AI 口袋景點</h3><div class="box mint">在「景點」頁按 AI 景點提示詞，複製給 Claude AI（claude.ai），回傳純 JSON 後匯入口袋景點。</div><div class="btns"><button class="btn blue" onclick="v64ShowPrompt('spots')">AI 景點提示詞</button></div></div>

<div class="card"><h3>🩺 AI 行程健檢</h3>${v641PrefsHtml()}<div class="box mint" style="margin-top:10px">填寫偏好後，複製提示詞給 Claude AI，回傳 JSON 後可匯入本機儲存做為參考。</div><div class="btns"><button class="btn blue" onclick="v64ShowPrompt('itinerary')">AI 行程健檢提示詞</button><button class="btn soft" onclick="v64OpenImportModal()">匯入 AI 建議</button></div>${v641ReviewHtml()}</div>

<div class="card"><h3>🎨 外觀設定</h3><div class="box mint">可以切換色系（韓系清新、海邊藍、奶茶暖色）、明暗模式與卡片樣式，只影響 UI 外觀，不影響旅程資料。</div><div class="btns"><button class="btn dark" onclick="openThemePanel()">外觀設定</button></div></div>

<div class="card"><h3>📖 照片旅遊書</h3><div class="box mint">照片上傳到 Cloudinary 雲端，LocalStorage 只存圖片網址，適合長期累積旅行照片。每天最多 10 張，匯出 PDF 在電腦 Chrome 效果最穩定。</div><div class="btns"><button class="btn dark" onclick="openPdfPublisher(false)">開啟 PDF 出版頁</button></div><div class="cloudHint">Cloudinary folder：${esc(CLOUDINARY_CONFIG.folder)}｜preset：${esc(CLOUDINARY_CONFIG.uploadPreset)}</div></div>

<div class="card"><h3>🔑 帳號與資料</h3><div class="box mint"><b>旅程資料</b>：儲存在 Firestore（Firebase），路徑 users/{uid}/trips/{tripId}。每個帳號最多 ${V63_MAX_TRIPS} 個旅程。</div><div class="cloudHint">目前授權 email：${esc(V63_ALLOWED_EMAILS.join("、"))}</div></div>

<div class="card"><h3>🔄 還原範例資料</h3><div class="box pink">清除全部資料後將無法復原，建議先匯出備份。</div><div class="btns"><button class="btn soft" onclick="sample()">載入範例</button><button class="btn danger" onclick="resetAll()">重設資料</button></div></div>
<footer style="text-align:center;padding:24px;color:#aaa;font-size:12px"><strong style="color:#888">${esc(APP_VERSION)}</strong></footer>`}

/* ── Firebase 初始化 ── */
function init(){applyThemePrefs(getThemePrefs());data=loadData();cur=data.days?.[0]?.key||data.trip?.start||"";currentDay=cur;v637EnsureEditModal();v637EnsureFooter();document.addEventListener("input",function(e){if(e.target&&e.target.closest&&e.target.closest("#stayView .flightDense"))v39MarkFlightDirty()},true);document.addEventListener("change",function(e){if(e.target&&e.target.closest&&e.target.closest("#stayView .flightDense"))v39MarkFlightDirty()},true);document.addEventListener("click",function(e){if(!e.target.classList.contains("v649-allow")){const banner=$("v649LockBanner");if(banner&&banner.classList.contains("viewOnly")&&!banner.contains(e.target)){toast("目前是檢視模式，不可編輯。請點「接手編輯」按鈕。")}}});ensureThemePanel()}

/* ── 以 DOMContentLoaded 為 Gate 確保 DOM 先就緒 ── */
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){init();initFirebaseSync()})}else{init();initFirebaseSync()}

/* v39 flight dirty listener */
document.addEventListener("input",function(e){if(e.target&&e.target.closest&&e.target.closest("#stayView .flightDense"))v39MarkFlightDirty()},true);
document.addEventListener("change",function(e){if(e.target&&e.target.closest&&e.target.closest("#stayView .flightDense"))v39MarkFlightDirty()},true);

/* v64 render hook：每次 render 後注入 AI bar */
// v64AfterRender 已整合進 render() 函式末尾

console.log("貞選旅管家", APP_VERSION);
