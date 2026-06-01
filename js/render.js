/* ── render.js：主 render、UI、主題、初始化 ── */
function init(){renderNav();render()}function renderNav(){$("tabs").innerHTML=views.map(v=>`<button class="tab ${v[0]==view?"active":""}" onclick="go('${v[0]}')">${v[1]}</button>`).join("");$("mobile").innerHTML=[["trip","旅遊地"],["planner","行程"],["spots","景點"],["budget","預算"],["photoBook","照片書"]].map(v=>`<button class="nav ${v[0]==view?"active":""}" onclick="go('${v[0]}')">${v[1]}</button>`).join("")}function go(v){view=v;views.forEach(x=>$(x[0]+"View").classList.toggle("hidden",x[0]!=v));renderNav();render();scrollTo(0,0)}
function render(){renderHead();renderSide();renderTrip();renderPlanner();renderSpots();renderBudget();renderPacking();renderPhotoBook();renderHelp()}function renderHead(){$("titleText").textContent=data.meta.title||"我的旅跡手帳";document.title=data.meta.title||"我的旅跡手帳";$("subtitleText").textContent=data.meta.subtitle||base.meta.subtitle;$("sDest").textContent=data.trip.dest||"未設定";$("sDate").textContent=data.trip.start?`${short(data.trip.start)}-${short(data.trip.end)}`:"未設定"}function editTitle(){const v=prompt("請輸入旅行手帳標題",data.meta.title||"我的旅跡手帳");if(v!==null&&v.trim()){data.meta.title=v.trim();save()}}function editSubtitle(){const v=prompt("請輸入副標文字",data.meta.subtitle||base.meta.subtitle);if(v!==null&&v.trim()){data.meta.subtitle=v.trim();save()}}
function renderHelp(){$("helpView").innerHTML=`<div class="section"><div><h2>說明與備份</h2><div class="hint">工具使用方式、資料備份與還原放在這裡。</div></div></div><div class="card"><h3>備份資料</h3><div class="box mint">匯出備份會下載 JSON 檔。匯入備份會覆蓋目前資料。</div><div class="btns"><button class="btn dark" onclick="exportBackup()">匯出備份</button><label class="btn soft" style="display:inline-block">匯入備份<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0])" style="display:none"></label></div></div><div class="card"><h3>使用提醒</h3><div class="box blue">目前不使用付費 Google Maps API，所以地圖功能採用開啟 Google Maps 查詢，再手動貼地址或調整時間。</div></div>`}function exportBackup(){let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`travel-book-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}function importBackup(file){if(!file)return;if(!confirm("匯入備份會覆蓋目前資料，確定繼續？"))return;let r=new FileReader();r.onload=e=>{try{data=JSON.parse(e.target.result);if(!data.days?.length)data.days=mkDays(data.trip.start,data.trip.end);localStorage.setItem("travel_book_v8",JSON.stringify(data));cur=data.days[0]?.key||data.trip.start;render();toast("已匯入備份")}catch(err){toast("備份檔格式錯誤")}};r.readAsText(file)}
function aiSchemaText(){
  return `{
  "spots": [
    {
      "name": "景點或餐廳名稱",
      "type": "景點/餐廳/咖啡廳/購物/雨天備案/其他",
      "day": "YYYY-MM-DD，可留空",
      "addr": "地址或區域",
      "memo": "注意事項"
    }
  ],
  "plans": [
    {
      "day": "YYYY-MM-DD",
      "start": "HH:MM",
      "end": "HH:MM",
      "type": "景點/餐廳/咖啡廳/購物/交通/航班/住宿/其他",
      "name": "行程卡片名稱，以地點或交通節點為主",
      "note": "注意事項",
      "memo": "補充備註",
      "foreign": 0,
      "twd": 0,
      "payer": "未定",
      "payMethod": "未定"
    }
  ]
}`;
}
function generateAIPrompt(){
  const hotels=data.hotels.map(h=>`${short(h.start)}~${short(h.end)} ${h.name}${h.addr?("，地址/區域："+h.addr):""}`).join("\\n") || "尚未設定住宿";
  const flights=[
    data.flights.out.no?`去程 ${data.flights.out.no}：${data.flights.out.from} ${data.flights.out.dep} → ${data.flights.out.to} ${data.flights.out.arr}`:"",
    data.flights.back.no?`回程 ${data.flights.back.no}：${data.flights.back.from} ${data.flights.back.dep} → ${data.flights.back.to} ${data.flights.back.arr}`:""
  ].filter(Boolean).join("\\n") || "尚未設定航班";
  const days=data.days.map(d=>`${d.key}（${d.title}｜${d.label}）`).join("\\n");
  const prompt=`請你依照以下旅行設定，幫我規劃一份可匯入「旅跡手帳 HTML 工具」的行程 JSON。

旅行設定：
- 目的地：${data.trip.dest}
- 國家/區域：${data.trip.country}
- 城市/路線：${data.trip.city||""}
- 日期：${data.trip.start} ～ ${data.trip.end}
- 幣別：${data.trip.currency}
- 旅伴：${(data.trip.travelers||[]).join("、")}

旅行日期：
${days}

航班：
${flights}

住宿：
${hotels}

請注意：
1. 行程卡片名稱請以「地點」或「交通節點」為主，例如「甘川洞文化村」、「從金海機場前往飯店」、「入住城市律動」。
2. 每天行程不要排太滿，交通與用餐要留緩衝。
3. 如果有口袋景點，也請放入 spots。
4. 請只輸出純 JSON，不要 Markdown，不要解釋文字。
5. JSON 格式必須完全符合以下 schema：

${aiSchemaText()}`;
  const blob=new Blob([prompt],{type:"text/plain;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`AI行程提示詞-${data.trip.dest||"travel"}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  if(navigator.clipboard){navigator.clipboard.writeText(prompt).then(()=>toast("已下載提示詞，也已複製到剪貼簿")).catch(()=>toast("已下載 AI 提示詞"))}
  else toast("已下載 AI 提示詞");
}
function importAIItinerary(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const obj=JSON.parse(normalizeImportedJsonText(e.target.result));
      const spots=Array.isArray(obj.spots)?obj.spots:[];
      const plans=Array.isArray(obj.plans)?obj.plans:(Array.isArray(obj)?obj:[]);
      spots.forEach(s=>{
        if(!s.name)return;
        data.spots.push({id:uid(),name:String(s.name||""),type:String(s.type||"景點"),day:String(s.day||""),addr:String(s.addr||s.address||""),memo:String(s.memo||s.note||"")});
      });
      plans.forEach(p=>{
        if(!p.day||!p.name)return;
        data.plans.push({
          id:uid(),day:String(p.day),start:String(p.start||"10:00"),end:String(p.end||"11:00"),
          type:String(p.type||"景點"),name:String(p.name),mode:"foreign",
          foreign:Number(p.foreign||0),twd:Number(p.twd||0),
          payer:String(p.payer||"未定"),payMethod:String(p.payMethod||"未定"),
          note:String(p.note||""),memo:String(p.memo||"AI 匯入"),adjusted:false
        });
      });
      save();
      toast(`已匯入 ${plans.length} 個行程、${spots.length} 個口袋景點`);
    }catch(err){
      alert("匯入失敗：請確認檔案是純 JSON，且包含 plans 或 spots。");
    }
  };
  r.readAsText(file);
}
function renderHelp(){
  $("helpView").innerHTML=`<div class="section"><div><h2>說明與備份</h2><div class="hint">工具使用方式、資料備份、AI 行程匯入與還原放在這裡。</div></div></div>
  <div class="card"><h3>AI 行程提示詞與匯入</h3><div class="box mint">可以先按「產出 AI 提示詞」，把下載的文字貼給 AI。AI 回傳 JSON 後，存成 .json 或 .txt，再用「匯入行程」上傳，就會把 plans 匯入行程、spots 匯入口袋景點。</div><div class="btns"><button class="btn pink" onclick="generateAIPrompt()">產出 AI 提示詞</button><label class="btn blue" style="display:inline-block">匯入行程<input type="file" accept=".json,application/json,.txt,text/plain" onchange="importAIItinerary(this.files[0])" style="display:none"></label></div></div>
  <div class="card"><h3>備份資料</h3><div class="box mint">匯出備份會下載 JSON 檔。匯入備份會覆蓋目前資料。</div><div class="btns"><button class="btn dark" onclick="exportBackup()">匯出備份</button><label class="btn soft" style="display:inline-block">匯入備份<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0])" style="display:none"></label></div></div>
  <div class="card"><h3>機場與地圖</h3><div class="box blue">選擇國家與城市後，航班欄位會提供常用機場快速選單。飯店與景點的地圖功能目前採用開啟 Google Maps 查詢，再手動貼地址。</div></div>
  <div class="card"><h3>住宿與航班帶入行程</h3><div class="box pink">航班可以帶入首尾交通節點；住宿可以帶入入住、每日出發、回飯店節點。這些卡片仍可到行程頁編輯時間與內容。</div></div>`;
}
function shouldShowCustomCity(country,cityValue){
  return country==="其他" || cityValue==="自訂";
}
function updateCustomCityVisibility(){
  const box=$("customCityBox");
  if(!box)return;
  const country=$("country").value;
  const cityValue=$("citySelect").value;
  box.style.display=shouldShowCustomCity(country,cityValue)?"block":"none";
}
function buildDestinationFromFields(){
  const country=$("country").value;
  const cityValue=$("citySelect").value;
  const custom=$("cityCustom")?.value.trim()||"";
  const city=cityValue==="自訂"?custom:cityValue;
  return destinationName(country,city);
}
function spotsPromptSchema(){
  return `{
  "spots": [
    {
      "name": "景點或餐廳名稱",
      "type": "景點/餐廳/咖啡廳/購物/雨天備案/其他",
      "day": "YYYY-MM-DD，可留空",
      "addr": "地址或區域",
      "memo": "注意事項、推薦理由、適合時段"
    }
  ]
}`;
}
function generateSpotAIPrompt(){
  const days=data.days.map(d=>`${d.key}（${d.title}｜${d.label}）`).join("\\n");
  const hotels=data.hotels.map(h=>`${short(h.start)}~${short(h.end)} ${h.name}${h.addr?("，地址/區域："+h.addr):""}`).join("\\n") || "尚未設定住宿";
  const prompt=`請依照以下旅行設定，幫我產出可匯入「旅跡手帳 HTML 工具」的口袋景點 TXT/JSON 檔內容。

旅行設定：
- 目的地：${data.trip.dest}
- 國家/區域：${data.trip.country}
- 城市/路線：${data.trip.city||""}
- 日期：${data.trip.start} ～ ${data.trip.end}
- 旅伴：${(data.trip.travelers||[]).join("、")}

旅行日期：
${days}

住宿：
${hotels}

請注意：
1. 請推薦景點、餐廳、咖啡廳、購物、雨天備案。
2. 如果適合某一天，請填 day；不確定就留空。
3. 請只輸出純 JSON，不要 Markdown，不要說明文字。
4. JSON 格式必須完全符合：

${spotsPromptSchema()}`;
  const blob=new Blob([prompt],{type:"text/plain;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`AI口袋景點提示詞-${data.trip.dest||"travel"}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  if(navigator.clipboard){navigator.clipboard.writeText(prompt).then(()=>toast("已下載提示詞，也已複製到剪貼簿")).catch(()=>toast("已下載 AI 口袋景點提示詞"))}
  else toast("已下載 AI 口袋景點提示詞");
}
function renderHelp(){
  $("helpView").innerHTML=`<div class="section"><div><h2>說明與備份</h2><div class="hint">工具使用方式、資料備份與還原放在這裡。</div></div></div>
  <div class="card"><h3>口袋景點 AI 匯入</h3><div class="box mint">到「口袋景點」按「AI 景點提示詞」，把下載的提示詞貼給 AI。AI 回傳純 JSON 後，存成 .txt 或 .json，再匯入口袋景點。</div></div>
  <div class="card"><h3>備份資料</h3><div class="box mint">匯出備份會下載 JSON 檔。匯入備份會覆蓋目前資料。</div><div class="btns"><button class="btn dark" onclick="exportBackup()">匯出備份</button><label class="btn soft" style="display:inline-block">匯入備份<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0])" style="display:none"></label></div></div>
  <div class="card"><h3>手機版介面</h3><div class="box blue">旅行日曆在手機版改成橫向滑動，不再一直置頂，避免佔住畫面。主要操作可用底部導覽切換。</div></div>
  <div class="card"><h3>機場與地圖</h3><div class="box blue">選擇國家與城市後，航班欄位會提供常用機場快速選單。飯店與景點的地圖功能目前採用開啟 Google Maps 查詢，再手動貼地址。</div></div>`;
}
const cityMapFinal={
  "韓國":["釜山","首爾","濟州","大邱","仁川"],
  "日本":["東京","大阪","京都","福岡","札幌","沖繩","名古屋"],
  "香港":["香港"],
  "新加坡":["新加坡"],
  "泰國":["曼谷","清邁","普吉"],
  "越南":["峴港","河內","胡志明市"],
  "歐洲":["奧地利","捷克","英國","法國","義大利","德國","荷蘭","西班牙"],
  "美國":["紐約","洛杉磯","舊金山","西雅圖","夏威夷"],
  "英國":["倫敦","愛丁堡","曼徹斯特"]
};
function finalCountryOptions(){
  return Object.keys(cityMapFinal).map(c=>`<option value="${c}" ${data.trip.country==c?"selected":""}>${c==="歐洲"?"歐洲區域":c}</option>`).join("")+
    `<option value="其他" ${data.trip.country=="其他"?"selected":""}>其他</option>`;
}
function finalCurrentCity(){
  if(data.trip.city)return data.trip.city;
  const dest=data.trip.dest||"";
  const list=cityMapFinal[data.trip.country]||[];
  return list.find(c=>dest.includes(c)) || list[0] || "";
}
function finalCityOptions(selected){
  const list=cityMapFinal[$("country")?.value || data.trip.country] || [];
  return `<option value="自訂" ${selected && !list.includes(selected)?"selected":""}>自訂</option>`+
    list.map(c=>`<option value="${c}" ${selected==c?"selected":""}>${c}</option>`).join("");
}
function finalDestName(country,city){
  if(country==="香港"&&(!city||city==="香港"))return"香港";
  if(country==="新加坡"&&(!city||city==="新加坡"))return"新加坡";
  if(country==="歐洲")return city?`歐洲｜${city}`:"歐洲";
  if(country==="其他")return city||"其他";
  return [country,city].filter(Boolean).join("");
}
function finalToggleCustom(){
  const box=$("customCityBox");
  if(!box)return;
  box.style.display=($("country").value==="其他"||$("citySelect").value==="自訂")?"block":"none";
}
function finalRefreshCities(){
  const country=$("country").value;
  const list=cityMapFinal[country]||[];
  $("citySelect").innerHTML=finalCityOptions(list[0]||"");
  $("cityCustom").value="";
  if(currencyMap[country]){
    $("currency").value=currencyMap[country];
    if(!$("rateSetup").value||Number($("rateSetup").value)===0)$("rateSetup").value=rateMap[currencyMap[country]]||data.trip.rate;
  }
  finalToggleCustom();
}
function finalSpotPromptText(){
  const days=data.days.map(d=>`${d.key}（${d.title}｜${d.label}）`).join("\n");
  const hotels=data.hotels.map(h=>`${short(h.start)}~${short(h.end)} ${h.name}${h.addr?("，地址/區域："+h.addr):""}`).join("\n")||"尚未設定住宿";
  return `請依照以下旅行設定，幫我產出可匯入「旅跡手帳 HTML 工具」的口袋景點資料。

旅行設定：
- 目的地：${data.trip.dest}
- 國家/區域：${data.trip.country}
- 城市/路線：${data.trip.city||""}
- 日期：${data.trip.start} ～ ${data.trip.end}
- 旅伴：${(data.trip.travelers||[]).join("、")}

旅行日期：
${days}

住宿：
${hotels}

請推薦景點、餐廳、咖啡廳、購物、雨天備案。如果適合某一天，請填 day；不確定就留空。

請只輸出純 JSON，不要 Markdown，不要說明文字。JSON 格式如下：
{
  "spots": [
    {
      "name": "景點或餐廳名稱",
      "type": "景點/餐廳/咖啡廳/購物/雨天備案/其他",
      "day": "YYYY-MM-DD，可留空",
      "addr": "地址或區域",
      "memo": "推薦理由、注意事項、適合時段"
    }
  ]
}

請將最後結果整理成一個可下載的 .txt 檔案，內容只放純 JSON，不要加入 Markdown、說明文字或程式碼區塊。`;
}
function ensurePromptModal(){
  let m=document.getElementById("aiPromptModal");
  if(m)return m;
  m=document.createElement("div");
  m.id="aiPromptModal";m.className="aiModal";
  m.innerHTML=`<div class="aiModalBox"><div class="section"><h3>AI 口袋景點提示詞</h3><button class="iconBtn" onclick="closeSpotPrompt()">×</button></div><textarea id="aiPromptText"></textarea><div class="btns"><button class="btn dark" onclick="copySpotPrompt()">複製提示詞</button><button class="btn soft" onclick="closeSpotPrompt()">關閉</button></div></div>`;
  document.body.appendChild(m);
  return m;
}
function showSpotPrompt(){const m=ensurePromptModal();document.getElementById("aiPromptText").value=finalSpotPromptText();m.classList.add("show");}
function closeSpotPrompt(){document.getElementById("aiPromptModal")?.classList.remove("show");}
function copySpotPrompt(){const t=document.getElementById("aiPromptText");t.select();document.execCommand("copy");toast("已複製提示詞");}
function finalCleanJson(t){t=String(t||"").trim();if(t.startsWith("```"))t=t.replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();let a=t.indexOf("{"),b=t.lastIndexOf("}");return a>=0&&b>a?t.slice(a,b+1):t;}
function templateCard(k,title,desc){return `<div class="templateCard ${data.meta.bookStyle===k?"active":""}" onclick="data.meta.bookStyle='${k}';save()"><b>${title}</b><span class="mini">${desc}</span></div>`}
function renderHelp(){
  $("helpView").innerHTML=`<div class="section"><div><h2>說明與備份</h2><div class="hint">工具使用方式、資料備份與還原放在這裡。</div></div></div>
  <div class="card"><h3>AI 口袋景點</h3><div class="box mint">在「口袋景點」按「AI 景點提示詞」可開啟彈窗並複製提示詞。AI 回傳 .txt 或 .json 後可匯入，匯入的景點會標示 📥 AI 匯入。</div></div>
  <div class="card"><h3>備份資料</h3><div class="box mint">匯出備份會下載 JSON 檔。匯入備份會覆蓋目前資料。</div><div class="btns"><button class="btn dark" onclick="exportBackup()">匯出備份</button><label class="btn soft" style="display:inline-block">匯入備份<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0])" style="display:none"></label></div></div>
  <div class="card"><h3>手機版介面</h3><div class="box blue">旅行日曆在手機版是橫向滑動日期卡，不再一直置頂。行程頁已移除本日統計卡，預算統計集中在預算頁。</div></div>
  <div class="card"><h3>機場與地圖</h3><div class="box blue">目前不使用付費 Google Maps API，所以地圖功能採用開啟 Google Maps 查詢，再手動貼地址或調整交通時間。</div></div>`;
}
function renderNav(){
  const full = views.map(v=>`<button class="tab ${v[0]==view?"active":""}" onclick="go('${v[0]}')">${v[1]}</button>`).join("");
  $("tabs").innerHTML = full;
  const mobileItems = [
    ["trip","旅遊地"],["planner","行程"],["spots","景點"],["budget","預算"],["packing","行李"],["photoBook","照片書"],["help","說明"]
  ];
  const mobileHtml = mobileItems.map(v=>`<button class="nav ${v[0]==view?"active":""}" onclick="go('${v[0]}')">${v[1]}</button>`).join("");
  if($("mobileTopNav")) $("mobileTopNav").innerHTML = mobileHtml;
  $("mobile").innerHTML = mobileItems.slice(0,5).map(v=>`<button class="nav ${v[0]==view?"active":""}" onclick="go('${v[0]}')">${v[1]}</button>`).join("");
}

function updateCustomCityVisibility(){
  const box = $("customCityBox");
  if(!box) return;
  box.style.display = ($("country").value==="其他" || $("citySelect").value==="自訂") ? "block" : "none";
}

function showSpotFormOpenAttr(){
  return editingSpotId ? "open" : "";
}

function spotsPromptSchema(){
  return `{
  "spots": [
    {
      "name": "景點或餐廳名稱",
      "type": "景點/餐廳/咖啡廳/購物/雨天備案/其他",
      "day": "YYYY-MM-DD，可留空",
      "addr": "地址或區域",
      "memo": "注意事項、推薦理由、適合時段"
    }
  ]
}`;
}

function buildSpotPrompt(){
  const days=data.days.map(d=>`${d.key}（${d.title}｜${d.label}）`).join("\\n");
  const hotels=data.hotels.map(h=>`${short(h.start)}~${short(h.end)} ${h.name}${h.addr?("，地址/區域："+h.addr):""}`).join("\\n") || "尚未設定住宿";
  return `請依照以下旅行設定，幫我產出可匯入「旅跡手帳 HTML 工具」的口袋景點 TXT/JSON 檔內容。

旅行設定：
- 目的地：${data.trip.dest}
- 國家/區域：${data.trip.country}
- 城市/路線：${data.trip.city||""}
- 日期：${data.trip.start} ～ ${data.trip.end}
- 旅伴：${(data.trip.travelers||[]).join("、")}

旅行日期：
${days}

住宿：
${hotels}

請注意：
1. 請推薦景點、餐廳、咖啡廳、購物、雨天備案。
2. 如果適合某一天，請填 day；不確定就留空。
3. 請只輸出純 JSON，不要 Markdown，不要說明文字。
4. JSON 格式必須完全符合：

${spotsPromptSchema()}

請將最後結果整理成一個可下載的 .txt 檔案，內容只放純 JSON，不要加入 Markdown、說明文字或程式碼區塊。`;
}

function templateCard(k,title,desc){
  return `<div class="templateCard ${data.meta.bookStyle==k?"active":""}" onclick="data.meta.bookStyle='${k}';save()"><b>${title}</b><span class="mini">${desc}</span></div>`;
}
let v16KeepHotelOpen = false;
let v16PendingSpotId = null;

function handleCountrySelectChange(){
  const newCountry=$("country").value;
  if(newCountry!==data.trip.country){
    v18PendingCountry=newCountry;
    $("country").value=data.trip.country;
    $("countryResetModal").classList.add("show");
    return;
  }
  refreshCityOptions();
}

function v19ResetVariableData(){
  data.flights={out:{},back:{}};
  data.hotels=[];
  data.expenses=[];
  data.spots=[];
  data.plans=[];
  data.conns=[];
  data.photos=[];
  data.dayCovers={};
  data.dayCoverMeta={};
  data.tripCover="";
  data.tripCoverMeta=null;
  data.packing=pack0.map(x=>({id:uid(),type:x[0],name:x[1],note:x[2],checked:false}));
  data.packView="pre";
}

function cancelDateReset(){
  v19PendingDates=null;
  $("dateResetModal").classList.remove("show");
}

function confirmDateReset(){
  if(!v19PendingDates)return;
  data.trip.start=v19PendingDates.start;
  data.trip.end=v19PendingDates.end;
  data.days=mkDays(data.trip.start,data.trip.end);
  v19ResetVariableData();
  cur=data.days[0]?.key||data.trip.start;
  v19PendingDates=null;
  $("dateResetModal").classList.remove("show");
  save();
  toast("已清空資料並修改旅行日期");
}

function handleCountrySelectChange(){
  // v21: 不在選國家當下跳重置，避免城市清單還停留舊國家。
  refreshCityOptions();
}

function updateAuthButtons(isIn){
  $("loginBtn")?.classList.toggle("hidden", isIn);
  $("logoutBtn")?.classList.toggle("hidden", !isIn);
  $("cloudLoadBtn")?.classList.toggle("hidden", !isIn);
  $("cloudSaveBtn")?.classList.toggle("hidden", !isIn);
}

async function firstCloudLoadOrCreate(){
  const ref=tripDocRef();
  const snap=await ref.get();

  if(snap.exists){
    const doc=snap.data();
    if(doc?.data){
      suppressCloudSave = true;
      data = doc.data;
      if(!data.days?.length && data.trip?.start && data.trip?.end) data.days = mkDays(data.trip.start,data.trip.end);
      cur = data.days?.[0]?.key || data.trip?.start || cur;
      localStorage.setItem("travel_book_v12", JSON.stringify(data));
      localStorage.setItem("travel_book_v22_cloud_backup", JSON.stringify(data));
      render();
      suppressCloudSave = false;
      lastCloudUpdatedAt = doc.updatedAtClient || 0;
      setSyncStatus("on","已載入雲端資料",`登入：${fbUser.email}`);
      return;
    }
  }

  await ref.set(cloudPayload(), {merge:true});
  setSyncStatus("on","已建立雲端資料",`登入：${fbUser.email}`);
}

function v24IsFlightPlan(p){
  return p?.sourceType==="flight" || p?.memo==="由航班資料帶入";
}
function flightHasPlans(){
  return data.plans.some(v24IsFlightPlan);
}
function flightHasBudget(){
  return data.expenses.some(e=>e.sourceType==="flight" || e.source==="航班");
}
function updateAuthButtons(isIn){
  // v25: 舊版同步卡片已隱藏，改由右上角頭像選單控制。
  renderAccountWidget(fbUser);
}

function syncStatusText(){
  if(syncStatus==="syncing") return "同步中";
  if(syncStatus==="success") return lastSyncTime ? `已同步 ${lastSyncTime}` : "已同步";
  if(syncStatus==="error") return "同步失敗";
  return "尚未同步";
}

function normalizeAllPlanTypes(){
  (data.plans||[]).forEach(p=>{
    p.type = normalizePlanType(p.type);
  });
}

function go(v){
  view=v;
  views.forEach(x=>$(x[0]+"View").classList.toggle("hidden",x[0]!=v));
  renderNav();
  if(v==="planner"){
    if(!currentDay) currentDay=cur||data.days?.[0]?.key;
    cur=currentDay;
  }
  render();
  scrollTo(0,0);
}

function render(){
  normalizeAllPlanTypes();
  if(!currentDay) currentDay=cur||data.days?.[0]?.key||data.trip?.start;
  cur=currentDay;
  renderHead();renderSide();renderTrip();renderPlanner();renderSpots();renderBudget();renderPacking();renderPhotoBook();renderHelp();
}
/*
新行程資料結構：
{
  id: "唯一值，可為 uid() 或系統產生的穩定 key",
  source: "manual" | "flight" | "hotel",
  sourceType: "舊版相容欄位，保留不破壞既有 UI",
  day, start, end, type, name, note, memo, ...
}

同步規則：
- flight 來源行程使用固定 id，例如 flight-out-airport、flight-out-plane。
- hotel 來源行程使用 hotel.id + 日期 + 節點，例如 hotel-{hotelId}-morning-{date}。
- 再次匯入或修改來源資料時，用 id 找到既有行程並更新，不新增重複行程。
- 舊資料若沒有 id/source，normalize 時補上 id，source 預設 manual。
*/

function v24IsFlightPlan(p){
  return p?.source==="flight" || p?.sourceType==="flight" || p?.memo==="由航班資料帶入";
}

function flightHasPlans(){
  v28NormalizePlans();
  return data.plans.some(v24IsFlightPlan);
}

function hotelPlanTemplates(h){
  if(!h || !h.id || !h.start || !h.end || !h.name) return [];
  const arr = [];
  arr.push({
    id:v28PlanId("hotel",[h.id,"checkin",h.start]),
    source:"hotel",
    sourceType:"hotel",
    hotelId:h.id,
    lockedName:true,
    day:h.start,
    start:"15:00",
    end:"15:30",
    type:"住宿",
    name:`入住 ${h.name}`,
    note:h.addr||h.note||"",
    memo:"由住宿資料帶入"
  });

  v16DateRange(v16DateAdd(h.start,1), h.end).forEach(day=>{
    arr.push({
      id:v28PlanId("hotel",[h.id,"morning",day]),
      source:"hotel",
      sourceType:"hotel",
      hotelId:h.id,
      lockedName:true,
      day,
      start:"09:00",
      end:"09:10",
      type:"住宿",
      name:`從 ${h.name} 出發`,
      note:h.addr||"",
      memo:"由住宿資料帶入"
    });
  });

  v16DateRange(h.start, v16DateAdd(h.end,-1)).forEach(day=>{
    arr.push({
      id:v28PlanId("hotel",[h.id,"night",day]),
      source:"hotel",
      sourceType:"hotel",
      hotelId:h.id,
      lockedName:true,
      day,
      start:"21:00",
      end:"21:10",
      type:"住宿",
      name:`回到 ${h.name}`,
      note:h.addr||"",
      memo:"由住宿資料帶入"
    });
  });
  return arr;
}

function render(){
  v28NormalizePlans();
  normalizeAllPlanTypes();
  if(!currentDay) currentDay=cur||data.days?.[0]?.key||data.trip?.start;
  cur=currentDay;
  renderHead();renderSide();renderTrip();renderPlanner();renderSpots();renderBudget();renderPacking();renderPhotoBook();renderHelp();
}
/*
新資料結構：
data.flights.out / data.flights.back = {
  type: "direct" | "transfer",
  segments: [
    { no, from, to, dep, arr },
    { no, from, to, dep, arr }
  ],
  toAirport,
  fromAirport,
  transfer
}

UI：
- 預設直飛 direct：1 段
- 轉機 transfer：固定 2 段

行程同步：
- 每一段航班都會產生一筆 source=flight 的行程
- 固定 id：flight-out-seg-0、flight-out-seg-1、flight-back-seg-0、flight-back-seg-1
- 修改航班時 upsert 更新既有行程，不重複新增
*/

function afterRenderFlightForms(){
  ["out","back"].forEach(k=>toggleFlightSegments(k));
}

function toggleFlightSegments(k){
  const type=$(k+"type")?.value || normalizeFlightObj(data.flights[k],k).type || "direct";
  const box1=$(k+"segBox1");
  if(box1) box1.style.display = type==="transfer" ? "block" : "none";
}

function flightHasBudget(){
  return data.expenses.some(e=>e.sourceType==="flight" || e.source==="航班");
}

function budgetCardRows(items){
  if(!items.length)return '<div class="empty">尚未新增預算</div>';
  return `<div class="budgetList">${items.map(x=>`
    <details class="budgetItem">
      <summary>
        <div class="budgetItemTitle">
          <b>${esc(x.name)}</b>
          <span>${esc(x.type)}｜${x.day?esc(x.day):"未指定日期"}｜${esc(x.source)}</span>
        </div>
        <div class="budgetAmount">TWD ${fmt(x.twd)}</div>
      </summary>
      <div class="budgetItemBody">
        <div class="budgetMetaGrid">
          <div class="budgetMeta"><span>付款人</span><b>${esc(travelerName(x.payer))}</b></div>
          <div class="budgetMeta"><span>付款方式</span><b>${esc(payMethodLabel(x.payMethod))}</b></div>
          <div class="budgetMeta"><span>${esc(data.trip.currency)}</span><b>${fmt(x.foreign)}</b></div>
          <div class="budgetMeta"><span>備註</span><b>${esc(x.memo||"—")}</b></div>
        </div>
        ${x.editable?`<div class="btns"><button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button></div>`:""}
      </div>
    </details>`).join("")}</div>`;
}

function v32DateAdd(dateStr, days){
  const d=parseLocalDate(dateStr);
  d.setDate(d.getDate()+days);
  return formatLocalDate(d);
}
function v32InFlightDateRange(dateStr){
  const d=v23ParseDateOnly(dateStr);
  const s=v23ParseDateOnly(v32DateAdd(data.trip.start,-3));
  const e=v23ParseDateOnly(v32DateAdd(data.trip.end,3));
  return d!==null && s!==null && e!==null && d>=s && d<=e;
}
function v32FlightDateRangeText(){
  return `${v32DateAdd(data.trip.start,-3)} ～ ${v32DateAdd(data.trip.end,3)}`;
}

function budgetDesktopRows(items){
  if(!items.length)return '<tr><td colspan="9">尚未新增預算</td></tr>';
  return items.map(x=>`<tr>
    <td>${esc(x.source)}</td>
    <td>${x.day?esc(x.day):"—"}</td>
    <td>${esc(x.type)}</td>
    <td>${esc(x.name)}</td>
    <td>${esc(travelerName(x.payer))}</td>
    <td>${esc(payMethodLabel(x.payMethod))}</td>
    <td class="num">${fmt(x.foreign)}</td>
    <td class="num">${fmt(x.twd)}</td>
    <td class="ops">${x.editable?`<button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button>`:""}</td>
  </tr>`).join("");
}

function budgetMobileCards(items){
  if(!items.length)return '<div class="empty">尚未新增預算</div>';
  return `<div class="budgetMobileList">${items.map(x=>`
    <div class="budgetMobileCard">
      <div class="budgetMobileHead">
        <div><b>${esc(x.name)}</b><span>${esc(x.source)}｜${x.day?esc(x.day):"未指定日期"}</span></div>
        <div class="budgetMobileAmount">TWD ${fmt(x.twd)}</div>
      </div>
      <div class="budgetMobileGrid">
        <div class="k">來源</div><div class="v">${esc(x.source)}</div>
        <div class="k">日期</div><div class="v">${x.day?esc(x.day):"—"}</div>
        <div class="k">類型</div><div class="v">${esc(x.type)}</div>
        <div class="k">付款人</div><div class="v">${esc(travelerName(x.payer))}</div>
        <div class="k">付款方式</div><div class="v">${esc(payMethodLabel(x.payMethod))}</div>
        <div class="k">${esc(data.trip.currency)}</div><div class="v num">${fmt(x.foreign)}</div>
        <div class="k">TWD</div><div class="v num">${fmt(x.twd)}</div>
        <div class="k">備註</div><div class="v">${esc(x.memo||"—")}</div>
      </div>
      ${x.editable?`<div class="budgetMobileOps"><button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button></div>`:""}
    </div>`).join("")}</div>`;
}

function updateCustomCityVisibility(){
  const citySel=$("citySelect");
  const box=$("customCityBox");
  if(!citySel || !box)return;
  box.style.display = citySel.value==="自訂" || $("country")?.value==="其他" ? "block" : "none";
}

function handleCountrySelectChange(){
  refreshCityOptions();
}

function v36DateFromDT(dt, fallback){
  if(!dt)return fallback || data.trip.start;
  return String(dt).split("T")[0] || fallback || data.trip.start;
}
function v36TimeFromDT(dt){
  if(!dt)return "";
  const part = String(dt).split("T")[1] || "";
  return part.slice(0,5);
}
function v36FlightName(direction, idx, segCount, no){
  const isOut = direction === "out";
  if(segCount <= 1){
    return isOut ? `搭乘去程飛機${no ? " " + no : ""}` : `搭乘回程飛機${no ? " " + no : ""}`;
  }
  return isOut ? `搭乘去程第 ${idx+1} 段飛機${no ? " " + no : ""}` : `搭乘回程第 ${idx+1} 段飛機${no ? " " + no : ""}`;
}

function v38AirportOptions(){
  return typeof airportOptionsList==="function" ? airportOptionsList() : [
    "台灣｜TPE 桃園國際機場","台灣｜TSA 台北松山機場","台灣｜KHH 高雄小港機場",
    "韓國｜PUS 釜山金海機場","韓國｜ICN 首爾仁川機場",
    "日本｜NRT 東京成田機場","日本｜HND 東京羽田機場","日本｜KIX 大阪關西機場",
    "香港｜HKG 香港國際機場","新加坡｜SIN 樟宜機場","其他／手動輸入"
  ];
}

function v38AirportSelectValue(val){
  const list=v38AirportOptions();
  if(list.includes(val))return val;
  return val ? "__custom__" : "";
}

function v38AirportCustomValue(val){
  const list=v38AirportOptions();
  return val && !list.includes(val) ? val : "";
}

function v38AirportSelectHtml(id, val){
  const selected=v38AirportSelectValue(val);
  const options=['<option value="">請選擇機場</option>']
    .concat(v38AirportOptions().map(a=>`<option value="${esc(a)}" ${selected===a?"selected":""}>${esc(a)}</option>`))
    .concat([`<option value="__custom__" ${selected==="__custom__"?"selected":""}>其他／手動輸入</option>`])
    .join("");
  return `<select class="mobileAirportSelect" id="${id}Sel" onchange="v38ToggleAirportCustom('${id}')">${options}</select>
    <input class="mobileAirportCustom ${selected==="__custom__"?"":"hidden"}" id="${id}Custom" value="${esc(v38AirportCustomValue(val))}" placeholder="手動輸入機場 / 地點">`;
}

function v38ToggleAirportCustom(id){
  const sel=$(id+"Sel");
  const custom=$(id+"Custom");
  if(!sel || !custom)return;
  custom.classList.toggle("hidden", sel.value!=="__custom__");
}

function v38GetAirportValue(id){
  const sel=$(id+"Sel");
  const custom=$(id+"Custom");
  if(!sel)return "";
  if(sel.value==="__custom__")return custom?.value || "";
  return sel.value || "";
}

function v38DatePart(dt){
  return dt ? String(dt).split("T")[0] : "";
}
function v38TimePart(dt){
  return dt && String(dt).includes("T") ? String(dt).split("T")[1].slice(0,5) : "";
}
function v38JoinDateTime(dateId, timeId){
  const d=$(dateId)?.value || "";
  const t=$(timeId)?.value || "";
  return d && t ? `${d}T${t}` : "";
}

function v38TerminalSelectHtml(id, val){
  return `<select class="mobileTerminalSelect" id="${id}">${terminalOptions(val||"未定")}</select>`;
}

function v38IsMobileFlightUI(){
  return window.matchMedia && window.matchMedia("(max-width:620px)").matches;
}

function dayCoverManagerHtml(){
  return `<div class="dayCoverManager">${data.days.map(d=>{
    const cover=data.dayCovers[d.key];
    return `<div class="dayCoverTile">
      <div class="dayCoverThumb">${cover?`<img src="${cover}">`:`${d.title}<br>${d.label}`}</div>
      <div class="dayCoverTileBody">
        <b>${d.title}｜${d.label}</b>
        <span>${cover?"已設定每日封面":"尚未設定每日封面"}</span><br>
        <label class="dayCoverUploadLabel">
          ${cover?"更換封面":"上傳封面"}
          <input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])" style="display:none">
        </label>
        <div class="photoUploadStatus" id="dayCoverStatus-${d.key}"></div>
      </div>
    </div>`;
  }).join("")}</div>`;
}

function storyTimelineHtml(plans){
  if(!plans.length)return `<div class="storyEmpty">這天還沒有安排正式行程，可以先用照片記錄旅途。</div>`;
  return `<div class="storyTimeline">${plans.map(p=>`
    <div class="storyTimelineItem">
      <div class="storyTimelineTime">${esc(p.start||"--:--")}</div>
      <div class="storyTimelineContent">
        <b>${activityIcon(p.type)} ${esc(p.name)}</b>
        <span>${esc(p.end?`至 ${p.end}`:"")} ${p.note?`｜${p.note}`:""}</span>
      </div>
    </div>`).join("")}</div>`;
}

function setPhotoBookMode(mode){
  photoBookMode = mode === "pdf" ? "pdf" : "story";
  renderPhotoBook();
}

function pdfTagsHtml(tags){
  const raw=String(tags||"").trim();
  if(!raw)return "";
  return `<div class="pdfTags">${raw.split(/[,\s，、]+/).filter(Boolean).map(t=>`<span class="pdfTag">${esc(t)}</span>`).join("")}</div>`;
}

function pdfPhotoCard(p, idx){
  return `<div class="pdfPhoto ${idx===0?"featured":""}">
    <div class="pdfPhotoImage"><img src="${p.src}"></div>
    <div class="pdfPhotoText">
      <h3>${esc(p.title||"照片紀錄")}</h3>
      ${pdfTagsHtml(p.tags)}
      <p>${esc(p.memo||"")}</p>
    </div>
  </div>`;
}

function pdfTimelineHtml(plans){
  if(!plans.length)return `<div class="pdfEmpty">這天還沒有行程，可以先用照片記錄旅途。</div>`;
  return `<div class="pdfTimeline">${plans.slice(0,9).map(p=>`
    <div class="pdfTimelineItem">
      <div class="pdfTimelineTime">${esc(p.start||"--:--")}</div>
      <div class="pdfTimelineContent">
        <b>${activityIcon(p.type)} ${esc(p.name)}</b>
        <span>${esc(p.end?`至 ${p.end}`:"")} ${p.note?`｜${p.note}`:""}</span>
      </div>
    </div>`).join("")}</div>`;
}

function pdfDayPage(d){
  const plans=sortedPlans(d.key);
  const photos=data.photos.filter(p=>p.day==d.key);
  const cover=data.dayCovers[d.key] || photos[0]?.src || "";
  return `<section class="pdfPage">
    <div class="pdfPageInner">
      <div class="pdfDayTop">
        <div>
          <span class="eyebrow">${d.title}</span>
          <h2>${d.label} 的旅行故事</h2>
          <p>住宿：${hotelFor(d.key)?.name||"未設定"}。今天收錄 ${plans.length} 個行程與 ${photos.length} 張照片。</p>
        </div>
        <div class="pdfDayBadge">${plans.length} 行程｜${photos.length} 照片</div>
      </div>
      <div class="pdfDayHero">${cover?`<img src="${cover}">`:"尚未上傳本日封面圖"}</div>
      <div class="pdfSectionTitle">今天的路線</div>
      ${pdfTimelineHtml(plans)}
      <div class="pdfSectionTitle">今日照片日記</div>
      ${photos.length?`<div class="pdfPhotos">${photos.slice(0,5).map(pdfPhotoCard).join("")}</div>`:`<div class="pdfEmpty">還沒有照片日記，先上傳幾張今天的代表照片吧。</div>`}
    </div>
  </section>`;
}

function pdfPreviewHtml(){
  const cover=data.tripCover;
  return `<div class="pdfPreviewHint noPrint">這是 PDF 預覽模式，會以 A4 紙張感呈現。正式匯出建議使用電腦 Chrome；平板 Safari 仍可能有些微差異。</div>
  <div class="pdfPreviewWrap">
    <section class="pdfPage pdfCoverPage">
      <div class="pdfPageInner">
        <span class="pdfCoverLabel">MY TRAVEL BOOK</span>
        <h1 class="pdfCoverTitle">${esc(data.meta.title)}</h1>
        <p class="pdfCoverSub">${esc(data.meta.subtitle)}</p>
        ${cover?`<img class="pdfCoverImage" src="${cover}">`:`<div class="pdfCoverEmpty">尚未上傳旅遊書封面</div>`}
        <div class="pdfCoverMeta">
          <div><span>目的地</span><b>${esc(data.trip.dest||"未設定")}</b></div>
          <div><span>日期</span><b>${short(data.trip.start)} - ${short(data.trip.end)}</b></div>
          <div><span>天數</span><b>${data.days.length} 天旅行</b></div>
        </div>
      </div>
    </section>
    ${data.days.map(pdfDayPage).join("")}
  </div>`;
}

const __renderPhotoBookBeforeV45 = renderPhotoBook;
renderPhotoBook = function(){
  __renderPhotoBookBeforeV45();

  const section = $("photoBookView")?.querySelector(".section");
  if(section){
    const btnBox = section.querySelector(".btn.soft.noPrint")?.parentElement || section;
    const switchHtml = `<div class="photoBookModeSwitch noPrint">
      <button class="${photoBookMode==="story"?"active":""}" onclick="setPhotoBookMode('story')">故事預覽</button>
      <button class="${photoBookMode==="pdf"?"active":""}" onclick="setPhotoBookMode('pdf')">PDF 預覽</button>
    </div>`;
    if(!section.querySelector(".photoBookModeSwitch")){
      section.insertAdjacentHTML("beforeend", switchHtml);
    }
  }

  const preview = $("photoBookView")?.querySelector(".storyBookPreview");
  if(preview){
    preview.classList.toggle("pdfMode", photoBookMode==="pdf");
    const old = preview.querySelector(".pdfPreviewHint");
    const oldWrap = preview.querySelector(".pdfPreviewWrap");
    if(old) old.remove();
    if(oldWrap) oldWrap.remove();
    preview.insertAdjacentHTML("afterbegin", pdfPreviewHtml());
  }
};
/*
theme config 範例：
const THEME_CONFIG = {
  modes: {
    light: { label: "淺色" },
    dark: { label: "深色" }
  },
  palettes: {
    seoul: { label: "韓系清新", primary:"#628f80", line:"#eadfd4", card:"#fffdfa" },
    ocean: { label: "海邊藍", primary:"#4f82a8", line:"#d9e7ef", card:"#fbfdff" },
    latte: { label: "奶茶暖色", primary:"#a57855", line:"#ead9c8", card:"#fffaf4" }
  },
  cardStyles: {
    soft: { label:"柔和卡片" },
    outline: { label:"清爽線框" },
    solid: { label:"立體卡片" }
  }
};
*/

const THEME_CONFIG = {
  modes: {
    light: { label: "淺色" },
    dark: { label: "深色" }
  },
  palettes: {
    seoul: { label: "韓系清新", primary:"#628f80", line:"#eadfd4", card:"#fffdfa" },
    ocean: { label: "海邊藍", primary:"#4f82a8", line:"#d9e7ef", card:"#fbfdff" },
    latte: { label: "奶茶暖色", primary:"#a57855", line:"#ead9c8", card:"#fffaf4" }
  },
  cardStyles: {
    soft: { label:"柔和卡片" },
    outline: { label:"清爽線框" },
    solid: { label:"立體卡片" }
  }
};

const THEME_STORAGE_KEY = "travelBookThemePrefs";

function getThemePrefs(){
  try{
    return JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || "{}");
  }catch(e){
    return {};
  }
}

function saveThemePrefs(prefs){
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
}

function applyThemePrefs(prefs=getThemePrefs()){
  const safe = {
    mode: THEME_CONFIG.modes[prefs.mode] ? prefs.mode : "light",
    palette: THEME_CONFIG.palettes[prefs.palette] ? prefs.palette : "seoul",
    cardStyle: THEME_CONFIG.cardStyles[prefs.cardStyle] ? prefs.cardStyle : "soft"
  };
  document.body.setAttribute("data-theme-mode", safe.mode);
  document.body.setAttribute("data-theme-palette", safe.palette);
  document.body.setAttribute("data-card-style", safe.cardStyle);
  return safe;
}

function setThemePrefs(partial){
  const current = applyThemePrefs(getThemePrefs());
  const next = {...current, ...partial};
  saveThemePrefs(next);
  applyThemePrefs(next);
  renderThemeWidgetState();
  toast("主題已套用");
}

function themeOptions(obj, selected){
  return Object.entries(obj).map(([key,val])=>`<option value="${key}" ${key===selected?"selected":""}>${val.label}</option>`).join("");
}

function toggleThemeWidget(){
  const el=$("themeWidget");
  if(el)el.classList.toggle("open");
}

function renderThemeWidget(){
  const prefs = applyThemePrefs(getThemePrefs());
  return `<div class="themeWidget noPrint" id="themeWidget">
    <div class="themeWidgetHead">
      <div>
        <b>🎨 主題切換</b>
        <div class="mini">只套用 UI 外觀，不影響旅行資料。</div>
      </div>
      <button class="themeToggleBtn" onclick="toggleThemeWidget()">調整</button>
    </div>
    <div class="themeSwatches">
      <span class="themeSwatch seoul"></span>
      <span class="themeSwatch ocean"></span>
      <span class="themeSwatch latte"></span>
    </div>
    <div class="themeControls">
      <div>
        <label>明暗模式</label>
        <select id="themeModeSelect" onchange="setThemePrefs({mode:this.value})">${themeOptions(THEME_CONFIG.modes,prefs.mode)}</select>
      </div>
      <div>
        <label>色系風格</label>
        <select id="themePaletteSelect" onchange="setThemePrefs({palette:this.value})">${themeOptions(THEME_CONFIG.palettes,prefs.palette)}</select>
      </div>
      <div>
        <label>卡片樣式</label>
        <select id="themeCardStyleSelect" onchange="setThemePrefs({cardStyle:this.value})">${themeOptions(THEME_CONFIG.cardStyles,prefs.cardStyle)}</select>
      </div>
    </div>
  </div>`;
}

function renderThemeWidgetState(){
  const prefs = applyThemePrefs(getThemePrefs());
  if($("themeModeSelect")) $("themeModeSelect").value = prefs.mode;
  if($("themePaletteSelect")) $("themePaletteSelect").value = prefs.palette;
  if($("themeCardStyleSelect")) $("themeCardStyleSelect").value = prefs.cardStyle;
}

function injectThemeWidget(){
  const header=document.querySelector("header");
  if(!header || $("themeWidget"))return;
  header.insertAdjacentHTML("beforeend", renderThemeWidget());
  renderThemeWidgetState();
}

const __renderHeadBeforeV46 = renderHead;
renderHead = function(){
  __renderHeadBeforeV46();
  injectThemeWidget();
};

const __initBeforeV46 = init;
init = function(){
  applyThemePrefs(getThemePrefs());
  __initBeforeV46();
  injectThemeWidget();
};
function mapCacheRead(){
  try{return JSON.parse(localStorage.getItem(MAP_CACHE_KEY)||"{}");}
  catch(e){return {};}
}
function mapCacheWrite(cache){
  try{localStorage.setItem(MAP_CACHE_KEY, JSON.stringify(cache));}
  catch(e){}
}
function routeSearchText(plan){
  const base = [
    plan.name || "",
    plan.note || "",
    data.trip.dest || "",
    data.trip.country || "",
    data.trip.city || ""
  ].filter(Boolean).join(" ");
  return base.trim();
}
function routePlanCandidates(dayKey){
  return sortedPlans(dayKey)
    .filter(p => p && p.name && !["航班"].includes(p.type))
    .slice(0, 10);
}
async function geocodeOSM(query){
  const cache = mapCacheRead();
  const key = query.toLowerCase().trim();
  if(cache[key]) return cache[key];

  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(query);
  const res = await fetch(url, {headers: {"Accept":"application/json"}});
  if(!res.ok) throw new Error("OSM 搜尋失敗");
  const arr = await res.json();
  if(!arr || !arr[0]) return null;

  const item = {
    lat: Number(arr[0].lat),
    lng: Number(arr[0].lon),
    display: arr[0].display_name || query
  };
  cache[key] = item;
  mapCacheWrite(cache);
  return item;
}
function ensureRouteMap(dayKey){
  const id = "routeMapCanvas-" + dayKey;
  if(routeMap && routeMapDay === dayKey){
    setTimeout(()=>routeMap.invalidateSize(), 80);
    return routeMap;
  }
  if(routeMap){
    routeMap.remove();
    routeMap = null;
    routeLayer = null;
  }
  routeMapDay = dayKey;
  routeMap = L.map(id, {scrollWheelZoom:false, zoomControl:true});
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(routeMap);
  routeLayer = L.layerGroup().addTo(routeMap);
  setTimeout(()=>routeMap.invalidateSize(), 120);
  return routeMap;
}
function routeMarkerIcon(num){
  return L.divIcon({
    className:"",
    html:`<div class="routeMarker">${num}</div>`,
    iconSize:[28,28],
    iconAnchor:[14,14],
    popupAnchor:[0,-14]
  });
}
async function buildRouteMap(dayKey, force=false){
  const status = $("routeMapStatus-" + dayKey);
  const unfoundBox = $("routeMapUnfound-" + dayKey);
  const unfoundList = $("routeMapUnfoundList-" + dayKey);
  const plans = routePlanCandidates(dayKey);

  if(!plans.length){
    if(status) status.textContent = "這天還沒有可定位的行程。";
    return;
  }

  if(status) status.textContent = "正在用 OpenStreetMap 搜尋當天行程位置...";
  const map = ensureRouteMap(dayKey);
  routeLayer.clearLayers();

  const found = [];
  const unfound = [];

  for(let i=0;i<plans.length;i++){
    const p = plans[i];
    const q = routeSearchText(p);
    try{
      const pos = await geocodeOSM(q);
      if(pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng)){
        found.push({plan:p, pos});
      }else{
        unfound.push(p);
      }
    }catch(e){
      unfound.push(p);
    }
    // be gentle to public Nominatim
    await new Promise(r=>setTimeout(r, 180));
  }

  if(found.length){
    const latlngs = [];
    found.forEach((x,idx)=>{
      const ll = [x.pos.lat, x.pos.lng];
      latlngs.push(ll);
      L.marker(ll, {icon:routeMarkerIcon(idx+1)})
        .bindPopup(`<b>${esc(x.plan.start||"--:--")} ${esc(x.plan.name)}</b><br>${esc(x.plan.type||"行程")}<br><small>${esc(x.pos.display)}</small>`)
        .addTo(routeLayer);
    });
    if(latlngs.length >= 2){
      L.polyline(latlngs, {weight:3, opacity:.72, dashArray:"7 8"}).addTo(routeLayer);
    }
    map.fitBounds(L.latLngBounds(latlngs), {padding:[28,28], maxZoom:14});
    if(status) status.textContent = `已定位 ${found.length} 個行程，並依時間順序連成今日路線。`;
  }else{
    map.setView([35.1796,129.0756], 11);
    if(status) status.textContent = "目前沒有定位成功的行程，可以補更明確的景點名稱或地址。";
  }

  if(unfound.length){
    if(unfoundBox) unfoundBox.classList.add("show");
    if(unfoundList) unfoundList.innerHTML = unfound.map(p=>`<li>${esc(p.start||"--:--")} ${esc(p.name||"未命名行程")}</li>`).join("");
  }else{
    if(unfoundBox) unfoundBox.classList.remove("show");
    if(unfoundList) unfoundList.innerHTML = "";
  }
}
function toggleRouteMap(dayKey){
  const card = $("routeMapCard-" + dayKey);
  if(!card)return;
  const open = !card.classList.contains("open");
  card.classList.toggle("open", open);
  const btn = $("routeMapToggle-" + dayKey);
  if(btn) btn.textContent = open ? "收合" : "展開";
  if(open){
    setTimeout(()=>buildRouteMap(dayKey), 60);
  }
}
function clearRouteMapCacheForDay(dayKey){
  // 不需要精準刪除，先提供重抓：清空全部地圖快取但不碰旅行 data
  localStorage.removeItem(MAP_CACHE_KEY);
  toast("已清除地圖定位快取，請重新產生路線");
  buildRouteMap(dayKey, true);
}
function routeMapHtml(dayKey){
  const plans = routePlanCandidates(dayKey);
  return `<div class="routeMapCard" id="routeMapCard-${dayKey}">
    <div class="routeMapHead" onclick="toggleRouteMap('${dayKey}')">
      <div>
        <h3>🗺 今日路線地圖</h3>
        <p>使用 OpenStreetMap 依當天行程名稱搜尋位置，顯示 marker 與順序路線。</p>
      </div>
      <button type="button" class="routeMapToggle" id="routeMapToggle-${dayKey}" onclick="event.stopPropagation();toggleRouteMap('${dayKey}')">展開</button>
    </div>
    <div class="routeMapBody">
      <div class="routeMapCanvas" id="routeMapCanvas-${dayKey}"></div>
      <div class="routeMapActions">
        <button class="small" onclick="buildRouteMap('${dayKey}',true)">重新產生路線</button>
        <button class="small" onclick="clearRouteMapCacheForDay('${dayKey}')">清除地圖快取</button>
        <span class="routeMapStatus" id="routeMapStatus-${dayKey}">${plans.length?`可定位行程 ${plans.length} 筆，展開後會開始搜尋。`:"這天還沒有可定位的行程。"}</span>
      </div>
      <div class="routeMapLegend">${plans.slice(0,6).map((p,i)=>`<span>${i+1}. ${esc(p.name)}</span>`).join("")}</div>
      <div class="routeMapUnfound" id="routeMapUnfound-${dayKey}">
        <b>尚未定位成功</b>
        <ul id="routeMapUnfoundList-${dayKey}"></ul>
      </div>
    </div>
  </div>`;
}
function v54EnsurePlanAddress(){
  (data.plans||[]).forEach(p=>{
    if(typeof p.address === "undefined") p.address = "";
  });
}

const __v28NormalizePlansBeforeV54 = v28NormalizePlans;
v28NormalizePlans = function(){
  __v28NormalizePlansBeforeV54();
  v54EnsurePlanAddress();
};

const __v28UpsertPlanBeforeV54 = v28UpsertPlan;
v28UpsertPlan = function(plan){
  if(plan){
    if(plan.source==="flight" || plan.source==="hotel"){
      plan.address = "";
    }else if(typeof plan.address === "undefined"){
      plan.address = "";
    }
  }
  return __v28UpsertPlanBeforeV54(plan);
};

function routeSearchText(plan){
  const address = (plan.address || "").trim();
  if(address){
    return [address, data.trip.dest || "", data.trip.country || ""].filter(Boolean).join(" ").trim();
  }
  return [
    plan.name || "",
    plan.note || "",
    data.trip.dest || "",
    data.trip.country || "",
    data.trip.city || ""
  ].filter(Boolean).join(" ").trim();
}

function routePlanCandidates(dayKey){
  return sortedPlans(dayKey)
    .filter(p => p && p.name && !["航班"].includes(p.type))
    .slice(0, 10);
}
/*
保留：
- plan.address 選填欄位
- 舊資料相容：沒有 address 視為空字串
- OSM / Geoapify / Google Maps 未來可沿用 address

暫停：
- 今日路線地圖 UI
- 自動地圖定位
- API Key 相關功能

不變：
- 行程新增 / 編輯 / 刪除核心流程
- 預算資料結構與自動建立預算
- 照片書顯示
- 航班 / 住宿 / 口袋景點既有關聯邏輯
*/
function photoAttrEsc(v){
  return String(v ?? "").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function beginEditPhoto(id){
  storyEditingPhotoId = id;
  renderPhotoBook();
}

function cancelEditPhoto(){
  storyEditingPhotoId = null;
  renderPhotoBook();
}

function saveEditedPhoto(id){
  const p = (data.photos||[]).find(x=>x.id===id);
  if(!p) return;
  p.title = document.getElementById(`editPhotoTitle-${id}`)?.value || '';
  p.tags = document.getElementById(`editPhotoTags-${id}`)?.value || '';
  p.memo = document.getElementById(`editPhotoMemo-${id}`)?.value || '';
  storyEditingPhotoId = null;
  save();
  toast('照片日記已更新');
}

function beginEditPhoto(id){
  openPhotoEditModal(id);
}

function pdfEsc(v){
  return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function pdfPlain(v, fallback="未設定"){
  const s = String(v ?? "").trim();
  return s || fallback;
}

function pdfTags(tags){
  const raw = String(tags||"").trim();
  if(!raw) return "";
  return `<div class="pdfPhotoTags">${raw.split(/[,\\s，、]+/).filter(Boolean).slice(0,5).map(t=>`<span>${pdfEsc(t)}</span>`).join("")}</div>`;
}

function pdfPhotoChunks(photos, size=4){
  const out=[];
  for(let i=0;i<photos.length;i+=size) out.push(photos.slice(i,i+size));
  return out.length ? out : [[]];
}

function pdfCoverPage(){
  const cover = data.tripCover || "";
  const fallbackCover = (data.photos||[])[0]?.src || "";
  const img = cover || fallbackCover;
  return `<section class="pdfPage pdfCover">
    ${img ? `<img class="pdfCoverPhoto" src="${img}">` : ""}
    <div class="pdfCoverShade"></div>
    <div class="pdfCoverContent">
      <span class="pdfEyebrow">VOYAGEMEMO</span>
      <h1>${pdfEsc(data.meta.title || "我的旅行手帳")}</h1>
      <div class="pdfCoverSub">${pdfEsc(data.meta.subtitle || "把想去的地方、走過的路與照片，整理成一本旅行書。")}</div>
      <div class="pdfMetaChips">
        <span>目的地：${pdfEsc(data.trip.dest || "未設定")}</span>
        <span>日期：${pdfEsc(short(data.trip.start))} - ${pdfEsc(short(data.trip.end))}</span>
        <span>${(data.days||[]).length} 天旅行</span>
      </div>
    </div>
  </section>`;
}

function pdfOverviewPage(){
  const totalPlans = (data.plans||[]).length;
  const totalPhotos = (data.photos||[]).length;
  const totalHotels = (data.hotels||[]).length;
  return `<section class="pdfPage">
    <div class="pdfPageHeader">
      <div>
        <span class="pdfEyebrow">TRIP OVERVIEW</span>
        <h2>旅行總覽</h2>
        <p>用一頁整理這趟旅程的日期、目的地與每日章節。</p>
      </div>
      <div class="pdfPageNo">PAGE 02</div>
    </div>
    <div class="pdfOverviewGrid">
      <div class="pdfInfoCard"><span>Destination</span><b>${pdfEsc(data.trip.dest || "未設定")}</b></div>
      <div class="pdfInfoCard"><span>Date</span><b>${pdfEsc(short(data.trip.start))} - ${pdfEsc(short(data.trip.end))}</b></div>
      <div class="pdfInfoCard"><span>Itinerary</span><b>${totalPlans} 個行程</b></div>
      <div class="pdfInfoCard"><span>Memory</span><b>${totalPhotos} 張照片｜${totalHotels} 筆住宿</b></div>
    </div>
    <div class="pdfMiniDays">
      ${(data.days||[]).map(d=>{
        const plans = sortedPlans(d.key);
        const photos = (data.photos||[]).filter(p=>p.day==d.key);
        const hotel = hotelFor(d.key)?.name || "未設定住宿";
        return `<div class="pdfMiniDay">
          <b>${pdfEsc(d.title)}｜${pdfEsc(d.label)}</b>
          <span>${pdfEsc(hotel)}</span>
          <span>${plans.length} 個行程・${photos.length} 張照片</span>
        </div>`;
      }).join("")}
    </div>
  </section>`;
}

function pdfDayChapterPage(d, pageNo){
  const plans = sortedPlans(d.key);
  const photos = (data.photos||[]).filter(p=>p.day==d.key);
  const cover = data.dayCovers?.[d.key] || photos[0]?.src || "";
  const hotel = hotelFor(d.key)?.name || "未設定";
  return `<section class="pdfPage">
    <div class="pdfPageHeader">
      <div>
        <span class="pdfEyebrow">${pdfEsc(d.title)}</span>
        <h2>${pdfEsc(d.label)} 的旅行故事</h2>
        <p>住宿：${pdfEsc(hotel)}。今天收錄 ${plans.length} 個行程與 ${photos.length} 張照片。</p>
      </div>
      <div class="pdfPageNo">PAGE ${String(pageNo).padStart(2,"0")}</div>
    </div>
    <div class="pdfChapterHero ${cover ? "" : "empty"}">
      ${cover ? `<img src="${cover}">` : "尚未上傳本日封面"}
    </div>
    <div class="pdfDaySummary">
      <div class="pdfDayStats">
        <b>${plans.length}</b>
        <span>今日行程</span>
        <b style="margin-top:7mm">${photos.length}</b>
        <span>今日照片</span>
      </div>
      <div class="pdfTimeline">
        ${plans.length ? plans.slice(0,9).map(p=>`<div class="pdfTimelineItem">
          <div class="pdfTime">${pdfEsc(p.start || "--:--")}</div>
          <div class="pdfTimelineText">
            <b>${activityIcon(p.type)} ${pdfEsc(p.name || "未命名行程")}</b>
            <span>${p.end ? `至 ${pdfEsc(p.end)}` : ""}${p.note ? `｜${pdfEsc(p.note)}` : ""}</span>
          </div>
        </div>`).join("") : `<div class="pdfEmptyBox">這天還沒有正式行程。<br>可以用照片留下旅行的空白與自由。</div>`}
      </div>
    </div>
  </section>`;
}

function pdfDayPhotoPages(d, startPageNo){
  const photos = (data.photos||[]).filter(p=>p.day==d.key);
  const chunks = pdfPhotoChunks(photos, 4);
  return chunks.map((chunk, idx)=>`<section class="pdfPage">
    <div class="pdfPageHeader">
      <div>
        <span class="pdfEyebrow">${pdfEsc(d.title)} PHOTO DIARY</span>
        <h2>今日照片日記${chunks.length>1 ? ` ${idx+1}/${chunks.length}` : ""}</h2>
        <p>${pdfEsc(d.label)} 的畫面、心情與小片段。</p>
      </div>
      <div class="pdfPageNo">PAGE ${String(startPageNo + idx).padStart(2,"0")}</div>
    </div>
    ${chunk.length ? `<div class="pdfPhotoGrid">
      ${chunk.map(p=>`<div class="pdfPhotoCard">
        <img src="${p.src}">
        <h3>${pdfEsc(p.title || "照片紀錄")}</h3>
        ${pdfTags(p.tags)}
        <p>${pdfEsc(p.memo || " ")}</p>
      </div>`).join("")}
    </div>` : `<div class="pdfEmptyBox">這一天還沒有照片日記。<br>等你補上照片後，這裡會變成專屬的回憶頁。</div>`}
  </section>`).join("");
}

function pdfEndingPage(pageNo){
  return `<section class="pdfPage pdfEnding">
    <h2>旅程，會被好好收藏。</h2>
    <p>那些走過的路、吃過的飯、偶然遇見的風景，都會慢慢變成記憶裡很亮的一頁。</p>
    <div class="pdfEndingMark">END OF JOURNEY</div>
  </section>`;
}

function buildPhotoBookPDF(){
  let pageNo = 1;
  const pages = [];
  pages.push(pdfCoverPage()); pageNo++;
  pages.push(pdfOverviewPage()); pageNo++;
  (data.days||[]).forEach(d=>{
    pages.push(pdfDayChapterPage(d, pageNo)); pageNo++;
    const photos = (data.photos||[]).filter(p=>p.day==d.key);
    const photoPageCount = Math.max(1, Math.ceil(photos.length / 4));
    pages.push(pdfDayPhotoPages(d, pageNo));
    pageNo += photoPageCount;
  });
  pages.push(pdfEndingPage(pageNo));
  return `<div class="pdfBook">${pages.join("")}</div>`;
}

function ensurePdfBookMount(){
  let mount = document.getElementById("pdfBookPrintMount");
  if(!mount){
    mount = document.createElement("div");
    mount.id = "pdfBookPrintMount";
    document.body.appendChild(mount);
  }
  mount.innerHTML = buildPhotoBookPDF();
  return mount;
}

function getTripListKey(){
  return `${V63_TRIP_LIST_KEY_PREFIX}_${v63UserKey()}`;
}
function getLocalTripKey(tripId=currentTripId){
  return `janeselect_travel_data_v63_${v63UserKey()}_${tripId || "draft"}`;
}
function firstCloudLoadOrCreate(){
  return currentTripId ? loadFromCloud().catch(()=>{}) : Promise.resolve();
}
function renderNav(){
  const items=views.map(v=>{
    const locked=!v63TripReady() && !["trip","help"].includes(v[0]);
    return `<button class="tab ${v[0]==view?"active":""} ${locked?"lockedTab":""}" onclick="go('${v[0]}')">${v[1]}</button>`;
  }).join("");
  if($("tabs"))$("tabs").innerHTML=items;
  const mobileItems=views.filter(v=>["trip","stay","planner","spots","budget","packing","photoBook","help"].includes(v[0]));
  const mobileHtml=mobileItems.map(v=>{const locked=!v63TripReady() && !["trip","help"].includes(v[0]); return `<button class="nav ${v[0]==view?"active":""} ${locked?"lockedTab":""}" onclick="go('${v[0]}')">${v[1]}</button>`}).join("");
  if($("mobileTopNav"))$("mobileTopNav").innerHTML=mobileHtml;
  if($("mobile"))$("mobile").innerHTML=mobileItems.slice(0,5).map(v=>{const locked=!v63TripReady() && !["trip","help"].includes(v[0]); return `<button class="nav ${v[0]==view?"active":""} ${locked?"lockedTab":""}" onclick="go('${v[0]}')">${v[1]}</button>`}).join("");
}
function go(v){
  if(!currentTripId){renderTripList();v63ShowShell("list");return;}
  if(v!=="trip" && v!=="help" && !v63TripReady()){
    toast("請先完成旅遊地設定，才能使用其他功能");
    v="trip";
  }
  view=v;
  views.forEach(x=>$(x[0]+"View")?.classList.toggle("hidden",x[0]!=v));
  renderNav();
  if(v==="planner"){
    if(!currentDay) currentDay=cur||data.days?.[0]?.key;
    cur=currentDay;
  }
  render();
  scrollTo(0,0);
}
function render(){
  renderHead();
  renderSide();
  renderTrip();
  renderStay();
  renderPlanner();
  renderSpots();
  renderBudget();
  renderPacking();
  renderPhotoBook();
  renderHelp();
  v63RenderTripSwitchBar();
}
function renderHead(){
  $("titleText").textContent=data.meta.title||"貞選旅管家";
  document.title=(data.meta.title||"貞選旅管家") + "｜Janeselect Travel Manager";
  $("subtitleText").textContent=data.meta.subtitle||base.meta.subtitle;
  $("sDest").textContent=data.trip.dest||"未設定";
  $("sDate").textContent=data.trip.start&&data.trip.end?`${short(data.trip.start)}-${short(data.trip.end)}`:"未設定";
}
function renderHead(){
  $("titleText").textContent=data.meta.title||"貞選旅管家";
  v631BrandTitle();
  $("subtitleText").textContent=data.meta.subtitle||base.meta.subtitle;
  $("sDest").textContent=data.trip.dest||"未設定";
  $("sDate").textContent=data.trip.start&&data.trip.end?`${short(data.trip.start)}-${short(data.trip.end)}`:"未設定";
}
function renderThemeWidget(){
  const prefs=applyThemePrefs(getThemePrefs());
  return `<div class="themeWidget noPrint" id="themeWidget">
    <button class="themeOpenBtn" type="button" onclick="openThemePanel()">
      <span>🎨 外觀設定</span><span class="themeCurrentText" id="themeCurrentText">${esc(v634ThemeLabel())}</span>
    </button>
  </div>
  <div class="themePanelBackdrop noPrint" id="themePanelBackdrop" onclick="if(event.target===this)closeThemePanel()">
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
      <div class="themePanelNote">目前先維持本機外觀偏好設定；未來如果要做多人共享旅程，也可以再改成 Firestore 使用者設定。</div>
    </div>
  </div>`;
}
function openThemePanel(){
  const el=$("themePanelBackdrop");
  if(el){renderThemeWidgetState();el.classList.add("show");}
}
function closeThemePanel(){
  const el=$("themePanelBackdrop");
  if(el)el.classList.remove("show");
}
function toggleThemeWidget(){openThemePanel();}
function renderThemeWidgetState(){
  const prefs=applyThemePrefs(getThemePrefs());
  if($("themeModeSelect")) $("themeModeSelect").value = prefs.mode;
  if($("themePaletteSelect")) $("themePaletteSelect").value = prefs.palette;
  if($("themeCardStyleSelect")) $("themeCardStyleSelect").value = prefs.cardStyle;
  if($("themeCurrentText")) $("themeCurrentText").textContent = v634ThemeLabel();
}
function injectThemeWidget(){
  if(!document.body)return;
  if($("themeWidget")){
    renderThemeWidgetState();
    return;
  }
  const anchor=$("mobileTopNav") || $("tabs") || document.querySelector("#mainApp header") || document.querySelector(".app header");
  if(anchor){
    anchor.insertAdjacentHTML("afterend", renderThemeWidget());
    renderThemeWidgetState();
  }
}
document.addEventListener("keydown", function(e){
  if(e.key==="Escape")closeThemePanel();
});
document.addEventListener("DOMContentLoaded",()=>{
  const footer=document.querySelector("footer strong");
  if(footer)footer.textContent="版本：v63.4｜2026-05-30｜外觀設定與頁籤可讀性優化版";
});
function removeInlineThemeWidgets(){
  document.querySelectorAll('.themeWidget').forEach(el=>el.remove());
}
function ensureThemePanel(){
  if(!document.body)return;
  if(!$('themePanelBackdrop')){
    document.body.insertAdjacentHTML('beforeend', v635ThemePanelHtml());
  }
  renderThemeWidgetState();
}
function ensureAccountThemeButton(){
  const menu=$('accountMenu');
  if(!menu || $('menuTheme'))return;
  const logout=$('menuLogout');
  const btn=document.createElement('button');
  btn.id='menuTheme';
  btn.type='button';
  btn.textContent='外觀設定';
  btn.onclick=function(){ closeAccountMenu?.(); openThemePanel(); };
  if(logout) menu.insertBefore(btn, logout);
  else menu.appendChild(btn);
}
function injectThemeWidget(){
  removeInlineThemeWidgets();
  ensureThemePanel();
  ensureAccountThemeButton();
}
function openThemePanel(){
  ensureThemePanel();
  const el=$('themePanelBackdrop');
  if(el){ renderThemeWidgetState(); el.classList.add('show'); }
}
function closeThemePanel(){
  const el=$('themePanelBackdrop');
  if(el)el.classList.remove('show');
}
function toggleThemeWidget(){ openThemePanel(); }
const __renderAccountWidgetBeforeV635 = renderAccountWidget;
renderAccountWidget = function(user){
  __renderAccountWidgetBeforeV635(user);
  ensureAccountThemeButton();
};
const __toggleAccountMenuBeforeV635 = toggleAccountMenu;
toggleAccountMenu = function(){
  ensureAccountThemeButton();
  __toggleAccountMenuBeforeV635();
};
document.addEventListener('DOMContentLoaded',()=>{
  removeInlineThemeWidgets();
  ensureThemePanel();
  ensureAccountThemeButton();
  const footer=document.querySelector('footer strong');
  if(footer)footer.textContent='版本：v63.5｜2026-05-30｜外觀設定位置修正版';
});
const V636_VERSION = "v63.6";
const V636_CARD_COLORS = [
  {key:"cream", label:"奶油白"},
  {key:"mint", label:"薄荷綠"},
  {key:"rose", label:"玫瑰粉"},
  {key:"sky", label:"晨霧藍"},
  {key:"latte", label:"奶茶棕"}
];
async function updateTripCardColor(id,color){
  const t=tripList.find(x=>x.id===id);
  if(!t)return;
  t.cardColor=v636ColorKey(color);
  t.updatedAtClient=Date.now();
  v63SaveTripListLocal?.();
  renderTripList();
  try{ await v63SaveTripListCloud?.(); }catch(e){ console.warn(e); }
  toast("已更新旅程卡片色系");
}

/* 重新覆寫旅程清單：拿掉 J 圖示、加入色系欄位 */
renderTripList = function(){
  const el=$("tripListView"); if(!el)return;
  const active=tripList.filter(t=>!t.archived);
  const archived=tripList.filter(t=>t.archived);
  el.innerHTML=`<div class="gateShell">
    <div class="tripListHero"><div><div class="loginBrand">貞選旅管家</div><h1>我的旅程</h1><p>每趟旅程都是一包獨立資料：旅遊地、航班住宿、行程、口袋景點、預算、行李與旅遊書都會分開保存。</p></div><div class="tripListCount">${active.length}/${V63_MAX_TRIPS} 個旅程</div></div>
    <div class="tripGrid">${active.map(v63TripCard).join("") || '<div class="tripListCard tripColor-cream"><div class="tripCardTop"><div><span class="tripBadge">尚未開始</span><h3>還沒有旅程</h3></div></div><div class="meta">先在下方新增第一趟旅程。</div></div>'}</div>
    ${archived.length?`<details class="tripCreateCard" open><summary style="cursor:pointer;font-weight:950">封存旅程</summary><div class="tripGrid">${archived.map(v63TripCard).join("")}</div></details>`:""}
    <div class="tripCreateCard"><h3>＋ 新增旅程</h3><div class="tripCreateGrid"><div><label>旅程名稱</label><input id="newTripTitle" placeholder="例：2026 釜山自由行"></div><div><label>國家 / 區域</label><select id="newTripCountry" onchange="v63NewTripCountryChanged()">${Object.keys(currencyMap).map(c=>`<option value="${c}">${c}</option>`).join("")}<option value="其他">其他</option></select></div><div><label>城市 / 路線</label><input id="newTripCity" value="釜山"></div><div><label>卡片色系</label><select id="newTripColor">${v636ColorOptions("cream")}</select></div><div><label>出發日</label><input id="newTripStart" type="date"></div><div><label>回程日</label><input id="newTripEnd" type="date"></div><div style="align-self:end"><button class="btn dark" style="width:100%" onclick="createTrip()">建立旅程</button></div></div><div class="cloudHint">建立後會先進入旅遊地設定；完成旅遊地後才會解鎖其他功能。旅程卡片色系只影響清單外觀，不會改變旅行資料。</div></div>
    <div class="btns"><button class="btn soft" onclick="firebaseSignOut()">登出</button></div>
  </div>`;
  if(typeof v631BrandTitle==="function")v631BrandTitle();
};

v63TripCard = function(t){
  const dateText=t.start&&t.end?`${esc(short(t.start))} - ${esc(short(t.end))}`:"尚未完成";
  const destText=t.dest||"未設定目的地";
  const color=v636ColorKey(t.cardColor);
  return `<div class="tripListCard tripColor-${color} ${t.archived?"archived":""}">
    <div class="tripCardTop"><div><span class="tripBadge">${t.archived?"已封存":"旅程"}</span><h3>${esc(t.title||"未命名旅程")}</h3></div></div>
    <div class="tripCardMetaGrid"><div><span>目的地</span><b>${esc(destText)}</b></div><div><span>日期</span><b>${dateText}</b></div></div>
    <div class="meta">${t.updatedAtClient?`最後更新：${new Date(t.updatedAtClient).toLocaleDateString("zh-TW")}`:"尚未同步更新時間"}</div>
    <div class="tripCardTools">
      <div class="tripColorControl"><span>卡片色系</span>${v636ColorDots(color,t.id)}</div>
      <select class="tripColorSelect" onchange="updateTripCardColor('${t.id}',this.value)">${v636ColorOptions(color)}</select>
    </div>
    <div class="btns">
      <button class="btn dark compact" onclick="selectTrip('${t.id}')">繼續編輯</button>
      ${t.archived?`<button class="btn blue compact" onclick="restoreTrip('${t.id}')">還原</button>`:`<button class="btn soft compact" onclick="archiveTrip('${t.id}')">封存</button>`}
      <button class="btn danger compact" onclick="deleteTrip('${t.id}')">刪除</button>
    </div>
  </div>`;
};

/* 覆寫新增旅程：多讀一個 cardColor 欄位，寫入旅程索引 */
createTrip = async function(){
  const active=tripList.filter(t=>!t.archived);
  if(active.length>=V63_MAX_TRIPS)return toast(`每個帳號最多只能建立 ${V63_MAX_TRIPS} 個旅程`);
  const title=$("newTripTitle")?.value.trim() || "我的新旅程";
  const country=$("newTripCountry")?.value || "韓國";
  const city=$("newTripCity")?.value.trim() || "";
  const start=$("newTripStart")?.value || "";
  const end=$("newTripEnd")?.value || "";
  const cardColor=v636ColorKey($("newTripColor")?.value || "cream");
  if(!start || !end)return toast("請先選擇出發日與回程日");
  if(start>end)return toast("回程日不可早於出發日");
  const id=`trip_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  currentTripId=id;
  localStorage.setItem(V63_CURRENT_TRIP_KEY,id);
  data=v63DefaultTripData({title,country,city,start,end});
  cur=data.days?.[0]?.key || data.trip.start;
  tripList.unshift({...v63TripMetaFromData(id), cardColor});
  v63PersistTripLocal();
  await v63SaveTripListCloud();
  await saveToCloudNow();
  v63ShowShell("app");
  view="trip";
  renderNav(); render(); scrollTo(0,0);
  toast("已建立旅程");
};

/* 真正刪除旅程：刪 Firestore trip doc、本機資料、tripIndex。封存仍保留原行為。 */
deleteTrip = async function(id){
  const t=tripList.find(x=>x.id===id);
  if(!t)return;
  const title=t.title || "這趟旅程";
  const ok=confirm(`確定要刪除「${title}」嗎？\n\n刪除後會從旅程清單移除，並嘗試刪除雲端旅程資料。這個動作不能從網頁內復原。`);
  if(!ok)return;
  try{
    if(fbUser && fbDb)await v636DeleteTripCloud(id);
    tripList=tripList.filter(x=>x.id!==id);
    try{localStorage.removeItem(getLocalTripKey(id));}catch(e){}
    try{localStorage.removeItem(`${getLocalTripKey(id)}__meta`);}catch(e){}
    if(currentTripId===id){
      currentTripId="";
      localStorage.removeItem(V63_CURRENT_TRIP_KEY);
      if(cloudUnsub){cloudUnsub(); cloudUnsub=null;}
      cloudReady=false;
    }
    await v63SaveTripListCloud();
    renderTripList();
    v63ShowShell("list");
    toast("已刪除旅程");
  }catch(e){
    console.warn(e);
  }
};

/* 若舊旅程沒有顏色，補預設色，不影響資料內容 */
const __v636LoadTripsBefore = loadTrips;
loadTrips = async function(){
  const list=await __v636LoadTripsBefore();
  let changed=false;
  tripList=(tripList||[]).map(t=>{
    if(!t.cardColor){changed=true; return {...t, cardColor:"cream"};}
    return {...t, cardColor:v636ColorKey(t.cardColor)};
  });
  if(changed){v63SaveTripListLocal?.(); try{await v63SaveTripListCloud?.();}catch(e){}}
  return tripList;
};

/* 樣式：五色卡片、移除 J 固定個人化符號 */
const v636Style=document.createElement("style");
v636Style.textContent=`
  .tripListHero .loginBrand{letter-spacing:.08em;}
  .tripListCard{position:relative;isolation:isolate;}
  .tripListCard::before{content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;opacity:.78;}
  .tripListCard.tripColor-cream::before{background:linear-gradient(135deg,#fffdfa,#f7f3ec);}
  .tripListCard.tripColor-mint::before{background:linear-gradient(135deg,#f8fffb,#e2f3eb);}
  .tripListCard.tripColor-rose::before{background:linear-gradient(135deg,#fffafb,#f8e4ea);}
  .tripListCard.tripColor-sky::before{background:linear-gradient(135deg,#fbfdff,#e4f0f7);}
  .tripListCard.tripColor-latte::before{background:linear-gradient(135deg,#fffaf4,#efe2d4);}
  .tripCardIcon{display:none!important;}
  .tripCardTop{display:block!important;}
  .tripCardTools{margin:10px 0 2px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
  .tripColorControl{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px;font-weight:900;}
  .tripColorDots{display:inline-flex;gap:6px;align-items:center;}
  .tripColorDot{width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--line),0 3px 8px rgba(88,72,55,.08);padding:0;cursor:pointer;}
  .tripColorDot.active{box-shadow:0 0 0 2px var(--ink),0 4px 10px rgba(88,72,55,.12);}
  .tripColorDot.color-cream{background:#f7f3ec;}
  .tripColorDot.color-mint{background:#d9efe6;}
  .tripColorDot.color-rose{background:#f8dfe8;}
  .tripColorDot.color-sky{background:#dceefa;}
  .tripColorDot.color-latte{background:#ead9c8;}
  .tripColorSelect{width:auto!important;min-width:118px!important;min-height:32px!important;padding:5px 28px 5px 9px!important;border-radius:999px!important;font-size:12px!important;background:#fff!important;}
  .tripListCard .btn.danger.compact{background:linear-gradient(180deg,#fff1f1,#ffd8d8)!important;color:#a85252!important;}
  @media(max-width:620px){
    .tripCardTools{display:grid;grid-template-columns:1fr;gap:7px;}
    .tripColorControl{justify-content:space-between;}
    .tripColorSelect{width:100%!important;}
    .tripListCard .btns .btn{flex:1 1 auto;}
  }
`;
document.head.appendChild(v636Style);

document.addEventListener('DOMContentLoaded',()=>{
  const footer=document.querySelector('footer strong');
  if(footer)footer.textContent='版本：v63.6｜2026-05-31｜旅程卡片刪除與色系管理版';
});

const V637_VERSION_TEXT = '版本：v63.7｜2026-05-31｜頁尾、標題編輯彈窗與旅程卡片色系優化版';

function cancelDateReset(){
  v19PendingDates=null;
  v643PendingBasic=null;
  $("dateResetModal")?.classList.remove("show");
}
function confirmDateReset(){
  /* 舊版按鈕若被瀏覽器快取呼叫，也改走安全的增減天數，不再清空資料。 */
  v643ConfirmDateAdjust('range');
}
function pdfTagsHtml(){ return ""; }
function pdfTags(){ return ""; }

function setDayCoverFromPhoto(day, photoId){
  return v65SetDayCoverFromPhoto(day, photoId);
}

