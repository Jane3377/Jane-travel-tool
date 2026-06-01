/* ── stay.js：航班、住宿、旅遊地設定 ── */
function renderTrip(){const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;$("tripView").innerHTML=`<div class="section"><div><h2>旅遊地與機酒</h2><div class="hint">先整理旅行地、日期、幣別、航班、住宿。卡片右側箭頭可展開或收合。</div></div></div><details class="card" open><summary>① 旅遊地與旅伴</summary><div class="detailBody"><div class="three"><div><label>國家</label><select id="country" onchange="countryChanged()">${countryOptions()}</select></div><div><label>目的地 / 城市</label><input id="dest" value="${esc(data.trip.dest)}"></div><div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}"></div></div><div class="three"><div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div><div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div><div><label>匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div></div><div class="two"><div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div><div><label>匯率查詢</label><button class="btn blue" style="width:100%" onclick="openRateSearch()">查看現在匯率</button></div></div><div class="grid2" id="travelerBox">${travelerInputs()}</div><div class="btns"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div></div></details><details class="card"><summary>② 航班與機場接送</summary><div class="detailBody"><div class="grid2"><div class="box blue"><h3>去程</h3>${flightForm("out")}</div><div class="box pink"><h3>回程</h3>${flightForm("back")}</div></div><div class="btns"><button class="btn dark" onclick="saveFlights()">儲存航班</button></div></div></details><details class="card" open><summary>③ 住宿</summary><div class="detailBody"><div class="three"><div><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div><div><label>入住日</label><select id="hstart">${optsDays(h?.start||"")}</select></div><div><label>退房日</label><select id="hend">${optsDays(h?.end||data.days.at(-1)?.key)}</select></div></div><label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue" onclick="searchHotelAddress()">搜尋地圖</button></div><label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea><div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"儲存住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;renderTrip()">取消編輯</button>':""}</div><div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">尚未新增住宿</div>'}</div></div></details>`}
function flightForm(k){let f=data.flights[k];return `<label>航班編號</label><input id="${k}no" value="${esc(f.no)}"><div class="two"><div><label>起飛機場</label><input id="${k}from" value="${esc(f.from)}"></div><div><label>降落機場</label><input id="${k}to" value="${esc(f.to)}"></div></div><div class="two"><div><label>起飛時間</label><input id="${k}dep" type="datetime-local" value="${f.dep}"></div><div><label>降落時間</label><input id="${k}arr" type="datetime-local" value="${f.arr}"></div></div><label>機場接送</label><textarea id="${k}transfer">${esc(f.transfer)}</textarea>`}
function previewTravelerCount(){let n=Number($("travelerCount").value),old=data.trip.travelers||[],html="";for(let i=0;i<n;i++)html+=`<div><label>旅伴 ${String.fromCharCode(65+i)} 名稱</label><input id="traveler${i}" value="${esc(old[i]||String.fromCharCode(65+i))}"></div>`;$("travelerBox").innerHTML=html}function countryChanged(){const c=$("country").value;if(currencyMap[c]){$("currency").value=currencyMap[c];$("rateSetup").value=rateMap[currencyMap[c]]||data.trip.rate}}function openRateSearch(){open(`https://www.google.com/search?q=${encodeURIComponent((data.trip.currency||"KRW")+" TWD 匯率")}`,"_blank")}
function saveBasic(){data.trip.country=$("country").value;data.trip.dest=$("dest").value;data.trip.currency=$("currency").value.toUpperCase();data.trip.start=$("start").value;data.trip.end=$("end").value;data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);data.trip.travelerCount=Number($("travelerCount").value||1);data.trip.travelers=[];for(let i=0;i<data.trip.travelerCount;i++)data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));data.days=mkDays(data.trip.start,data.trip.end);cur=data.days[0]?.key;save();toast("已儲存旅遊地設定")}function saveFlights(){["out","back"].forEach(k=>data.flights[k]={no:$(k+"no").value,from:$(k+"from").value,to:$(k+"to").value,dep:$(k+"dep").value,arr:$(k+"arr").value,transfer:$(k+"transfer").value});save();toast("已儲存航班")}
function hotelCard(h){return `<div class="card"><div class="time">${short(h.start)}→${short(h.end)}</div><div class="place">${esc(h.name)}</div><div class="box mint">${esc(h.addr||"尚未填地址")}<br>${esc(h.note||"")}</div><div class="btns"><button class="small" onclick="editHotel('${h.id}')">編輯</button><button class="small" onclick="map('${encodeURIComponent((h.addr||h.name)+' '+data.trip.dest)}')">地圖</button><button class="small" onclick="addHotelExpense('${h.id}')">帶入預算</button><button class="small" onclick="delHotel('${h.id}')">刪除</button></div></div>`}function saveHotel(){if(!$("hname").value)return toast("請輸入住宿名稱");const item={name:$("hname").value,start:$("hstart").value,end:$("hend").value,addr:$("haddr").value,note:$("hnote").value};if(editingHotelId){Object.assign(data.hotels.find(x=>x.id==editingHotelId),item);editingHotelId=null}else data.hotels.push({id:uid(),...item});save()}function editHotel(id){editingHotelId=id;renderTrip();scrollTo(0,0)}function delHotel(id){if(!confirm("確定刪除住宿？"))return;data.hotels=data.hotels.filter(x=>x.id!=id);if(editingHotelId==id)editingHotelId=null;save()}function searchHotelAddress(){const name=$("hname").value;if(!name)return toast("請先輸入住宿名稱");map(encodeURIComponent(name+" "+data.trip.dest))}function addHotelExpense(id){const h=data.hotels.find(x=>x.id==id);data.expenses.push({id:uid(),source:"住宿",type:"住宿",name:`${short(h.start)}~${short(h.end)} ${h.name}`,payer:"未定",payMethod:"未定",day:"",mode:"TWD",foreign:0,twd:0,memo:"由住宿資料帶入，可編輯金額"});go("budget");toast("已帶入預算，可補金額")}
function currentCity(){
  if(data.trip.city)return data.trip.city;
  const dest=data.trip.dest||"";
  const list=cityMap[data.trip.country]||[];
  const found=list.find(c=>dest.includes(c));
  return found || list[0] || "";
}
function cityOptions(selected){
  const list=cityMap[$("country")?.value || data.trip.country] || [];
  return [`<option value="自訂" ${selected && !list.includes(selected)?"selected":""}>自訂 / 多城市</option>`]
    .concat(list.map(c=>`<option value="${c}" ${selected==c?"selected":""}>${c}</option>`)).join("");
}
function updateDestByCity(){
  const country=$("country").value;
  const city=$("citySelect").value==="自訂" ? $("cityCustom").value.trim() : $("citySelect").value;
  if(currencyMap[country]){
    $("currency").value=currencyMap[country];
    if(!$("rateSetup").value || Number($("rateSetup").value)===0) $("rateSetup").value=rateMap[currencyMap[country]]||data.trip.rate;
  }
  $("dest").value=[country,city].filter(Boolean).join("");
}
function refreshCityOptions(){
  const country=$("country").value;
  const list=cityMap[country]||[];
  $("citySelect").innerHTML=cityOptions(list[0]||"");
  $("cityCustom").value="";
  updateDestByCity();
}
function countryChanged(){refreshCityOptions();}
function renderTrip(){
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  const selectedCity=currentCity();
  const customCity=(cityMap[data.trip.country]||[]).includes(selectedCity)?"":selectedCity;
  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地與機酒</h2><div class="hint">先整理旅行地、日期、幣別、航班、住宿。卡片右側箭頭可展開或收合。</div></div></div>
<details class="card" open><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
  <div class="three"><div><label>國家</label><select id="country" onchange="refreshCityOptions()">${countryOptions()}</select></div><div><label>城市</label><select id="citySelect" onchange="updateDestByCity()">${cityOptions(selectedCity)}</select></div><div><label>自訂城市 / 多城市</label><input id="cityCustom" value="${esc(customCity)}" oninput="updateDestByCity()" placeholder="例：釜山＋慶州"></div></div>
  <div class="three"><div><label>目的地顯示名稱</label><input id="dest" value="${esc(data.trip.dest)}"></div><div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}"></div><div><label>匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div></div>
  <div class="three"><div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div><div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div><div><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查看匯率</button></div></div>
  <div class="two"><div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div><div class="hint" style="align-self:end">付款人會依旅伴名稱顯示。</div></div>
  <div class="grid2" id="travelerBox">${travelerInputs()}</div>
  <div class="btns"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div>
</div></details>

<details class="card"><summary>② ✈️ 航班與機場接送</summary><div class="detailBody">
  <div class="grid2"><div class="box blue"><h3>✈️ 去程</h3>${flightForm("out")}</div><div class="box pink"><h3>🏠 回程</h3>${flightForm("back")}</div></div>
  <div class="btns"><button class="btn dark" onclick="saveFlights()">儲存航班</button><button class="btn soft" onclick="addFlightsToPlans()">帶入首尾行程</button></div>
</div></details>

<details class="card" open><summary>③ 🏨 住宿</summary><div class="detailBody">
  <div class="three"><div><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div><div><label>入住日</label><select id="hstart">${optsDays(h?.start||"")}</select></div><div><label>退房日</label><select id="hend">${optsDays(h?.end||data.days.at(-1)?.key)}</select></div></div>
  <label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">搜尋地圖</button></div>
  <label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea>
  <div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"儲存住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;renderTrip()">取消編輯</button>':""}</div>
  <div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">尚未新增住宿</div>'}</div>
</div></details>`;
}
function flightForm(k){
  let f=data.flights[k];
  const isOut=k==="out";
  return `<label>航班編號</label><input id="${k}no" value="${esc(f.no)}">
  <div class="two"><div><label>起飛機場</label><input id="${k}from" value="${esc(f.from)}"></div><div><label>降落機場</label><input id="${k}to" value="${esc(f.to)}"></div></div>
  <div class="two"><div><label>起飛時間</label><input id="${k}dep" type="datetime-local" value="${f.dep}"></div><div><label>降落時間</label><input id="${k}arr" type="datetime-local" value="${f.arr}"></div></div>
  <div class="flightMiniTitle">${isOut?"如何抵達出發機場":"如何從旅遊地前往回程機場"}</div>
  <textarea id="${k}toAirport" placeholder="${isOut?"例：14:00 從家裡出發到桃園機場":"例：從飯店搭地鐵／計程車到金海機場"}">${esc(f.toAirport||"")}</textarea>
  <div class="flightMiniTitle">${isOut?"如何從降落機場到旅遊地／飯店":"如何從抵達機場回家"}</div>
  <textarea id="${k}fromAirport" placeholder="${isOut?"例：抵達金海機場後搭輕軌到飯店":"例：抵達桃園機場後搭機捷或接送回家"}">${esc(f.fromAirport||"")}</textarea>`;
}
function saveFlights(){
  ["out","back"].forEach(k=>data.flights[k]={
    no:$(k+"no").value,from:$(k+"from").value,to:$(k+"to").value,dep:$(k+"dep").value,arr:$(k+"arr").value,
    toAirport:$(k+"toAirport").value,fromAirport:$(k+"fromAirport").value
  });
  save();toast("已儲存航班");
}
function saveBasic(){
  data.trip.country=$("country").value;
  const selected=$("citySelect").value;
  data.trip.city=selected==="自訂"?$("cityCustom").value.trim():selected;
  data.trip.dest=$("dest").value || [data.trip.country,data.trip.city].filter(Boolean).join("");
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=$("start").value; data.trip.end=$("end").value;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++)data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));
  data.days=mkDays(data.trip.start,data.trip.end); cur=data.days[0]?.key;
  save();toast("已儲存旅遊地設定");
}
function addFlightPlan(day,start,end,type,name,note){
  if(!day||!name)return;
  data.plans.push({id:uid(),day,start:start||"",end:end||start||"",type,name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:note||"",memo:"由航班資料帶入",adjusted:false});
}
function addFlightsToPlans(){
  saveFlights();
  const out=data.flights.out, back=data.flights.back;
  addFlightPlan(dateFromDateTime(out.dep)||data.trip.start,"14:00",timeFromDateTime(out.dep),"交通","前往出發機場",out.toAirport);
  addFlightPlan(dateFromDateTime(out.dep)||data.trip.start,timeFromDateTime(out.dep),timeFromDateTime(out.arr),"航班",`搭乘去程航班 ${out.no||""}`,`${out.from||""} → ${out.to||""}`);
  addFlightPlan(dateFromDateTime(out.arr)||data.trip.start,timeFromDateTime(out.arr),"", "交通","從機場前往飯店 / 市區",out.fromAirport);
  addFlightPlan(dateFromDateTime(back.dep)||data.trip.end,"",timeFromDateTime(back.dep),"交通","從飯店前往回程機場",back.toAirport);
  addFlightPlan(dateFromDateTime(back.dep)||data.trip.end,timeFromDateTime(back.dep),timeFromDateTime(back.arr),"航班",`搭乘回程航班 ${back.no||""}`,`${back.from||""} → ${back.to||""}`);
  addFlightPlan(dateFromDateTime(back.arr)||data.trip.end,timeFromDateTime(back.arr),"", "交通","從機場回家",back.fromAirport);
  save();toast("已把航班與機場接送帶入行程");
}
function currentCity(){
  if(data.trip.city)return data.trip.city;
  const dest=data.trip.dest||"";
  const list=cityMapV10[data.trip.country]||[];
  const found=list.find(c=>dest.includes(c));
  return found || list[0] || "";
}
function cityOptions(selected){
  const list=cityMapV10[$("country")?.value || data.trip.country] || [];
  return [`<option value="自訂" ${selected && !list.includes(selected)?"selected":""}>自訂 / 多城市</option>`]
    .concat(list.map(c=>`<option value="${c}" ${selected==c?"selected":""}>${c}</option>`)).join("");
}
function destinationName(country,city){
  if(!country)return city||"";
  if(country==="香港" && (!city || city==="香港"))return "香港";
  if(country==="新加坡" && (!city || city==="新加坡"))return "新加坡";
  if(country==="歐洲")return city ? `歐洲｜${city}` : "歐洲";
  return [country,city].filter(Boolean).join("");
}
function updateDestByCity(){
  const country=$("country").value;
  const city=$("citySelect").value==="自訂" ? $("cityCustom").value.trim() : $("citySelect").value;
  if(currencyMap[country]){
    $("currency").value=currencyMap[country];
    if(!$("rateSetup").value || Number($("rateSetup").value)===0)$("rateSetup").value=rateMap[currencyMap[country]]||data.trip.rate;
  }
  $("dest").value=destinationName(country,city);
}
function refreshCityOptions(){
  const country=$("country").value;
  const list=cityMapV10[country]||[];
  $("citySelect").innerHTML=cityOptions(list[0]||"");
  $("cityCustom").value="";
  updateDestByCity();
}
function countryChanged(){refreshCityOptions();}

function airportListForCurrentDestination(){
  const city=currentCity();
  let list=[];
  if(city && airportMapV10[city])list=list.concat(airportMapV10[city]);
  if(data.trip.country==="歐洲"){
    ["維也納","布拉格","倫敦","巴黎","羅馬","阿姆斯特丹"].forEach(c=>{ if(airportMapV10[c])list=list.concat(airportMapV10[c]); });
  }
  return [...new Set(list)];
}
function airportPresetSelect(id,targetId,list){
  return `<select id="${id}" onchange="if(this.value) $('${targetId}').value=this.value"><option value="">快速選機場</option>${list.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join("")}<option value="自訂">自訂</option></select>`;
}
function terminalSelect(id,value){
  return `<select id="${id}">${terminalOptionsV10.map(t=>`<option value="${t}" ${value==t?"selected":""}>${t}</option>`).join("")}</select>`;
}
function flightForm(k){
  let f=data.flights[k];
  const isOut=k==="out";
  const destAirports=airportListForCurrentDestination();
  const fromList=isOut?homeAirportsV10:destAirports;
  const toList=isOut?destAirports:homeAirportsV10;
  return `<label>航班編號</label><input id="${k}no" value="${esc(f.no)}">
  <div class="two"><div><label>起飛機場</label>${airportPresetSelect(k+"fromPreset",k+"from",fromList)}<input id="${k}from" value="${esc(f.from)}" style="margin-top:6px"></div><div><label>起飛航廈</label>${terminalSelect(k+"fromTerminal",f.fromTerminal||"未定")}</div></div>
  <div class="two"><div><label>降落機場</label>${airportPresetSelect(k+"toPreset",k+"to",toList)}<input id="${k}to" value="${esc(f.to)}" style="margin-top:6px"></div><div><label>降落航廈</label>${terminalSelect(k+"toTerminal",f.toTerminal||"未定")}</div></div>
  <div class="two"><div><label>起飛時間</label><input id="${k}dep" type="datetime-local" value="${f.dep}"></div><div><label>降落時間</label><input id="${k}arr" type="datetime-local" value="${f.arr}"></div></div>
  <div class="flightMiniTitle">${isOut?"如何抵達出發機場":"如何從旅遊地前往回程機場"}</div>
  <textarea id="${k}toAirport" placeholder="${isOut?"例：14:00 從家裡出發到桃園機場":"例：從飯店搭地鐵／計程車到機場"}">${esc(f.toAirport||"")}</textarea>
  <div class="flightMiniTitle">${isOut?"如何從降落機場到旅遊地／飯店":"如何從抵達機場回家"}</div>
  <textarea id="${k}fromAirport" placeholder="${isOut?"例：抵達後搭輕軌／計程車到飯店":"例：抵達後搭機捷或接送回家"}">${esc(f.fromAirport||"")}</textarea>`;
}
function saveFlights(){
  ["out","back"].forEach(k=>data.flights[k]={
    no:$(k+"no").value,from:$(k+"from").value,to:$(k+"to").value,
    fromTerminal:$(k+"fromTerminal").value,toTerminal:$(k+"toTerminal").value,
    dep:$(k+"dep").value,arr:$(k+"arr").value,
    toAirport:$(k+"toAirport").value,fromAirport:$(k+"fromAirport").value
  });
  save();toast("已儲存航班");
}
function saveBasic(){
  data.trip.country=$("country").value;
  const selected=$("citySelect").value;
  data.trip.city=selected==="自訂"?$("cityCustom").value.trim():selected;
  data.trip.dest=$("dest").value || destinationName(data.trip.country,data.trip.city);
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=$("start").value; data.trip.end=$("end").value;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++)data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));
  data.days=mkDays(data.trip.start,data.trip.end); cur=data.days[0]?.key;
  save();toast("已儲存旅遊地設定");
}

function renderTrip(){
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  const selectedCity=currentCity();
  const customCity=(cityMapV10[data.trip.country]||[]).includes(selectedCity)?"":selectedCity;
  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地與機酒</h2><div class="hint">先整理旅行地、日期、幣別、航班、住宿。卡片右側箭頭可展開或收合。</div></div></div>
<details class="card" open><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
  <div class="three"><div><label>國家 / 區域</label><select id="country" onchange="refreshCityOptions()">${countryOptions()}</select></div><div><label>城市 / 路線</label><select id="citySelect" onchange="updateDestByCity()">${cityOptions(selectedCity)}</select></div><div><label>自訂城市 / 多城市</label><input id="cityCustom" value="${esc(customCity)}" oninput="updateDestByCity()" placeholder="例：釜山＋慶州"></div></div>
  <div class="three"><div><label>目的地顯示名稱</label><input id="dest" value="${esc(data.trip.dest)}"></div><div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}"></div><div><label>匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div></div>
  <div class="three"><div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div><div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div><div><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查看匯率</button></div></div>
  <div class="two"><div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div><div class="hint" style="align-self:end">付款人會依旅伴名稱顯示。</div></div>
  <div class="grid2" id="travelerBox">${travelerInputs()}</div>
  <div class="btns"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div>
</div></details>

<details class="card"><summary>② ✈️ 航班與機場接送</summary><div class="detailBody">
  <div class="grid2"><div class="box blue"><h3>✈️ 去程</h3>${flightForm("out")}</div><div class="box pink"><h3>🏠 回程</h3>${flightForm("back")}</div></div>
  <div class="btns"><button class="btn dark" onclick="saveFlights()">儲存航班</button><button class="btn soft" onclick="addFlightsToPlans()">帶入首尾行程</button></div>
  <div class="hint" style="margin-top:8px">航班帶入行程時會以「地點／交通節點」建立卡片，例如出發機場、航班、抵達機場、前往飯店，方便你後續補交通方式。</div>
</div></details>

<details class="card" open><summary>③ 🏨 住宿</summary><div class="detailBody">
  <div class="three"><div><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div><div><label>入住日</label><select id="hstart">${optsDays(h?.start||"")}</select></div><div><label>退房日</label><select id="hend">${optsDays(h?.end||data.days.at(-1)?.key)}</select></div></div>
  <label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">搜尋地圖</button></div>
  <label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea>
  <div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"儲存住宿修改":"新增住宿"}</button><button class="btn soft" onclick="addHotelsToPlans()">帶入住宿行程</button>${h?'<button class="btn soft" onclick="editingHotelId=null;renderTrip()">取消編輯</button>':""}</div>
  <div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">尚未新增住宿</div>'}</div>
</div></details>`;
}
function addFlightPlan(day,start,end,type,name,note){
  if(!day||!name)return;
  const exists=data.plans.some(p=>p.day===day && p.name===name && p.start===start);
  if(exists)return;
  data.plans.push({id:uid(),day,start:start||"",end:end||start||"",type,name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:note||"",memo:"由航班資料帶入",adjusted:false});
}
function addFlightsToPlans(){
  saveFlights();
  const out=data.flights.out, back=data.flights.back;
  addFlightPlan(dateFromDateTime(out.dep)||data.trip.start,"14:00",timeFromDateTime(out.dep),"交通",`前往 ${out.from||"出發機場"}`,out.toAirport);
  addFlightPlan(dateFromDateTime(out.dep)||data.trip.start,timeFromDateTime(out.dep),timeFromDateTime(out.arr),"航班",`搭乘去程航班 ${out.no||""}`,`${out.from||""}${out.fromTerminal?(" "+out.fromTerminal):""} → ${out.to||""}${out.toTerminal?(" "+out.toTerminal):""}`);
  addFlightPlan(dateFromDateTime(out.arr)||data.trip.start,timeFromDateTime(out.arr),"", "交通",`從 ${out.to||"降落機場"} 前往飯店／市區`,out.fromAirport);
  addFlightPlan(dateFromDateTime(back.dep)||data.trip.end,"",timeFromDateTime(back.dep),"交通",`從飯店前往 ${back.from||"回程機場"}`,back.toAirport);
  addFlightPlan(dateFromDateTime(back.dep)||data.trip.end,timeFromDateTime(back.dep),timeFromDateTime(back.arr),"航班",`搭乘回程航班 ${back.no||""}`,`${back.from||""}${back.fromTerminal?(" "+back.fromTerminal):""} → ${back.to||""}${back.toTerminal?(" "+back.toTerminal):""}`);
  addFlightPlan(dateFromDateTime(back.arr)||data.trip.end,timeFromDateTime(back.arr),"", "交通",`從 ${back.to||"抵達機場"} 回家`,back.fromAirport);
  save();toast("已把航班與機場接送帶入行程");
}
function addHotelPlan(day,start,end,type,name,note){
  if(!day||!name)return;
  const exists=data.plans.some(p=>p.day===day && p.name===name && p.start===start);
  if(exists)return;
  data.plans.push({id:uid(),day,start,end,type,name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:note||"",memo:"由住宿資料帶入",adjusted:false});
}
function addHotelsToPlans(){
  if(!data.hotels.length)return toast("請先新增住宿");
  data.hotels.forEach(h=>{
    addHotelPlan(h.start,"15:00","15:30","住宿",`入住 ${h.name}`,h.addr||h.note||"");
    datesBetween(h.start,h.end).forEach(day=>{
      addHotelPlan(day,"09:00","09:10","住宿",`從 ${h.name} 出發`,h.addr||"");
    });
    datesBetween(h.start,dateBefore(h.end)).forEach(day=>{
      addHotelPlan(day,"21:00","21:10","住宿",`回到 ${h.name}`,h.addr||"");
    });
  });
  save();toast("已將住宿出發／回飯店節點帶入行程");
}
function cityOptions(selected){
  let list=cityMapV10[$("country")?.value || data.trip.country] || [];
  if(($("country")?.value || data.trip.country)==="歐洲")list=list.filter(c=>c!=="奧地利＋捷克");
  return [`<option value="自訂" ${selected && !list.includes(selected)?"selected":""}>自訂</option>`]
    .concat(list.map(c=>`<option value="${c}" ${selected==c?"selected":""}>${c}</option>`)).join("");
}
function updateDestByCity(){
  const country=$("country").value;
  if(currencyMap[country]){
    $("currency").value=currencyMap[country];
    if(!$("rateSetup").value || Number($("rateSetup").value)===0)$("rateSetup").value=rateMap[currencyMap[country]]||data.trip.rate;
  }
  updateCustomCityVisibility();
}
function refreshCityOptions(){
  const country=$("country").value;
  let list=cityMapV10[country]||[];
  if(country==="歐洲")list=list.filter(c=>c!=="奧地利＋捷克");
  $("citySelect").innerHTML=cityOptions(list[0]||"自訂");
  $("cityCustom").value="";
  updateDestByCity();
}
function saveBasic(){
  data.trip.country=$("country").value;
  const selected=$("citySelect").value;
  data.trip.city=selected==="自訂"?$("cityCustom").value.trim():selected;
  data.trip.dest=buildDestinationFromFields();
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=$("start").value; data.trip.end=$("end").value;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++)data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));
  data.days=mkDays(data.trip.start,data.trip.end); cur=data.days[0]?.key;
  silentSave();
  render();
  const details=document.querySelectorAll("#tripView details.card");
  if(details[0])details[0].removeAttribute("open");
  toast("已儲存旅遊地設定");
}
function saveFlights(){
  ["out","back"].forEach(k=>data.flights[k]={
    no:$(k+"no").value,from:$(k+"from").value,to:$(k+"to").value,
    fromTerminal:$(k+"fromTerminal").value,toTerminal:$(k+"toTerminal").value,
    dep:$(k+"dep").value,arr:$(k+"arr").value,
    toAirport:$(k+"toAirport").value,fromAirport:$(k+"fromAirport").value
  });
  silentSave();
  render();
  const details=document.querySelectorAll("#tripView details.card");
  if(details[1])details[1].removeAttribute("open");
  toast("已儲存航班");
}
function renderTrip(){
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  const selectedCity=currentCity();
  const cityList=(cityMapV10[data.trip.country]||[]).filter(c=>c!=="奧地利＋捷克");
  const customCity=cityList.includes(selectedCity)?"":selectedCity;
  const showCustom=shouldShowCustomCity(data.trip.country, cityList.includes(selectedCity)?selectedCity:"自訂");
  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地與機酒</h2><div class="hint">選國家與城市後，系統會自動組成目的地；若選其他或自訂，再輸入目的地名稱。</div></div></div>
<details class="card" open><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
  <div class="three">
    <div><label>國家 / 區域</label><select id="country" onchange="refreshCityOptions()">${countryOptions()}</select></div>
    <div><label>城市 / 路線</label><select id="citySelect" onchange="updateDestByCity()">${cityOptions(selectedCity)}</select></div>
    <div id="customCityBox" style="display:${showCustom?"block":"none"}"><label>自訂目的地名稱</label><input id="cityCustom" value="${esc(customCity)}" oninput="updateDestByCity()" placeholder="例：釜山＋慶州"></div>
  </div>
  <div class="two"><div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}"></div><div><label>匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div></div>
  <div class="three"><div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div><div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div><div><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查看匯率</button></div></div>
  <div class="two"><div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div><div class="hint" style="align-self:end">目前目的地：${esc(data.trip.dest||"尚未設定")}</div></div>
  <div class="grid2" id="travelerBox">${travelerInputs()}</div>
  <div class="btns"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div>
</div></details>

<details class="card"><summary>② ✈️ 航班與機場接送</summary><div class="detailBody">
  <div class="grid2"><div class="box blue"><h3>✈️ 去程</h3>${flightForm("out")}</div><div class="box pink"><h3>🏠 回程</h3>${flightForm("back")}</div></div>
  <div class="btns"><button class="btn dark" onclick="saveFlights()">儲存航班</button><button class="btn soft" onclick="addFlightsToPlans()">帶入首尾行程</button></div>
  <div class="hint" style="margin-top:8px">航班帶入行程時會以「地點／交通節點」建立卡片，例如出發機場、航班、抵達機場、前往飯店。</div>
</div></details>

<details class="card" open><summary>③ 🏨 住宿</summary><div class="detailBody">
  <div class="three"><div><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div><div><label>入住日</label><select id="hstart">${optsDays(h?.start||"")}</select></div><div><label>退房日</label><select id="hend">${optsDays(h?.end||data.days.at(-1)?.key)}</select></div></div>
  <label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">搜尋地圖</button></div>
  <label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea>
  <div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"儲存住宿修改":"新增住宿"}</button><button class="btn soft" onclick="addHotelsToPlans()">帶入住宿行程</button>${h?'<button class="btn soft" onclick="editingHotelId=null;renderTrip()">取消編輯</button>':""}</div>
  <div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">尚未新增住宿</div>'}</div>
</div></details>`;
}
function countryChanged(){finalRefreshCities();}
function saveBasic(){
  const country=$("country").value;
  const city=$("citySelect").value==="自訂"?$("cityCustom").value.trim():$("citySelect").value;
  data.trip.country=country;
  data.trip.city=city;
  data.trip.dest=finalDestName(country,city);
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=$("start").value;
  data.trip.end=$("end").value;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++)data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));
  data.days=mkDays(data.trip.start,data.trip.end);
  cur=data.days[0]?.key||data.trip.start;
  silentSave();
  render();
  const d=document.querySelector("#tripView details.card");
  if(d)d.removeAttribute("open");
  toast("已儲存旅遊地設定");
}
function renderTrip(){
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  const selectedCity=finalCurrentCity();
  const list=cityMapFinal[data.trip.country]||[];
  const customCity=list.includes(selectedCity)?"":selectedCity;
  const showCustom=data.trip.country==="其他"||!list.includes(selectedCity);
  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地與機酒</h2><div class="hint">選國家與城市後，系統會自動組成目的地；若選其他或自訂，再輸入目的地名稱。</div></div></div>
  <details class="card" open><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
    <div class="three">
      <div><label>國家 / 區域</label><select id="country" onchange="finalRefreshCities()">${finalCountryOptions()}</select></div>
      <div><label>城市 / 路線</label><select id="citySelect" onchange="finalToggleCustom()">${finalCityOptions(selectedCity)}</select></div>
      <div id="customCityBox" style="display:${showCustom?"block":"none"}"><label>自訂目的地名稱</label><input id="cityCustom" value="${esc(customCity)}" placeholder="例：釜山＋慶州"></div>
    </div>
    <div class="two"><div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}"></div><div><label>匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div></div>
    <div class="three"><div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div><div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div><div><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查看匯率</button></div></div>
    <div class="two"><div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div><div class="hint" style="align-self:end">目前目的地：${esc(data.trip.dest||"尚未設定")}</div></div>
    <div class="grid2" id="travelerBox">${travelerInputs()}</div>
    <div class="btns"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div>
  </div></details>
  <details class="card"><summary>② ✈️ 航班與機場接送</summary><div class="detailBody"><div class="grid2"><div class="box blue"><h3>✈️ 去程</h3>${flightForm("out")}</div><div class="box pink"><h3>🏠 回程</h3>${flightForm("back")}</div></div><div class="btns"><button class="btn dark" onclick="saveFlights()">儲存航班</button></div></div></details>
  <details class="card" open><summary>③ 🏨 住宿</summary><div class="detailBody">
    <div class="three"><div><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div><div><label>入住日</label><select id="hstart">${optsDays(h?.start||"")}</select></div><div><label>退房日</label><select id="hend">${optsDays(h?.end||data.days.at(-1)?.key)}</select></div></div>
    <label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">搜尋地圖</button></div>
    <label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea>
    <div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"儲存住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;renderTrip()">取消編輯</button>':""}</div>
    <div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">尚未新增住宿</div>'}</div>
  </div></details>`;
}
function v15CountryCityMaps(){
  return {
    cityMap:{
      "韓國":["釜山","首爾","濟州","大邱","仁川"],
      "日本":["東京","大阪","京都","福岡","札幌","沖繩","名古屋"],
      "香港":["香港"],
      "新加坡":["新加坡"],
      "泰國":["曼谷","清邁","普吉"],
      "越南":["峴港","河內","胡志明市"],
      "歐洲":["奧地利","捷克","英國","法國","義大利","德國","荷蘭","西班牙"],
      "美國":["紐約","洛杉磯","舊金山","西雅圖","夏威夷"]
    }
  };
}

function v15DestinationName(country, city){
  if(country==="香港" && (!city || city==="香港")) return "香港";
  if(country==="新加坡" && (!city || city==="新加坡")) return "新加坡";
  if(country==="歐洲") return city ? `歐洲｜${city}` : "歐洲";
  return [country,city].filter(Boolean).join("");
}

function v15CityOptions(selected){
  const list = v15CountryCityMaps().cityMap[$("country")?.value || data.trip.country] || [];
  return [`<option value="自訂" ${selected && !list.includes(selected)?"selected":""}>自訂</option>`]
    .concat(list.map(c=>`<option value="${c}" ${selected==c?"selected":""}>${c}</option>`)).join("");
}

function v15CurrentCity(){
  if(data.trip.city) return data.trip.city;
  const dest = data.trip.dest || "";
  const list = v15CountryCityMaps().cityMap[data.trip.country] || [];
  return list.find(c=>dest.includes(c)) || list[0] || "";
}

function refreshCityOptions(){
  const list = v15CountryCityMaps().cityMap[$("country").value] || [];
  $("citySelect").innerHTML = v15CityOptions(list[0] || "自訂");
  $("cityCustom").value = "";
  updateCustomCityVisibility();
  countryChanged();
}

function updateDestByCity(){
  updateCustomCityVisibility();
  countryChanged();
}

function countryChanged(){
  const c=$("country").value;
  if(currencyMap[c]){
    $("currency").value=currencyMap[c];
    $("rateSetup").value=rateMap[currencyMap[c]]||data.trip.rate;
  }
  const label = $("rateLabel");
  if(label) label.textContent = `匯率：1 ${$("currency").value || data.trip.currency} = TWD`;
}

function saveBasic(){
  data.trip.country=$("country").value;
  const selected = $("citySelect").value;
  data.trip.city = selected==="自訂" ? $("cityCustom").value.trim() : selected;
  data.trip.dest = v15DestinationName(data.trip.country, data.trip.city);
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=$("start").value;
  data.trip.end=$("end").value;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++) data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));
  data.days=mkDays(data.trip.start,data.trip.end);
  cur=data.days[0]?.key;
  silentSave();
  render();
  const d=document.querySelectorAll("#tripView details.card")[0];
  if(d) d.removeAttribute("open");
  toast("已儲存旅遊地設定");
}

function saveFlights(){
  ["out","back"].forEach(k=>data.flights[k]={
    no:$(k+"no").value,
    from:$(k+"from").value,
    to:$(k+"to").value,
    dep:$(k+"dep").value,
    arr:$(k+"arr").value,
    transfer:$(k+"transfer").value
  });
  silentSave();
  render();
  const d=document.querySelectorAll("#tripView details.card")[1];
  if(d) d.removeAttribute("open");
  toast("已儲存航班");
}

function renderTrip(){
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  const selectedCity=v15CurrentCity();
  const list=v15CountryCityMaps().cityMap[data.trip.country]||[];
  const customCity=list.includes(selectedCity)?"":selectedCity;
  const showCustom=data.trip.country==="其他" || !list.includes(selectedCity);
  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地與機酒</h2><div class="hint">一開始先收合，點卡片展開設定；儲存後會自動收合。</div></div></div>

  <details class="card"><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
    <div class="three compactMobile">
      <div><label>國家 / 區域</label><select id="country" onchange="refreshCityOptions()">${countryOptions()}</select></div>
      <div><label>城市 / 路線</label><select id="citySelect" onchange="updateDestByCity()">${v15CityOptions(selectedCity)}</select></div>
      <div id="customCityBox" class="full" style="display:${showCustom?"block":"none"}"><label>自訂目的地</label><input id="cityCustom" value="${esc(customCity)}" oninput="updateDestByCity()" placeholder="例：釜山＋慶州"></div>
    </div>
    <div class="two">
      <div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}" oninput="countryChanged()"></div>
      <div><label id="rateLabel">匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div>
    </div>
    <div class="three compactMobile">
      <div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div>
      <div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div>
      <div class="full"><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查看現在匯率</button></div>
    </div>
    <div class="two">
      <div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div>
      <div class="hint" style="align-self:end">目前目的地：${esc(data.trip.dest||"尚未設定")}</div>
    </div>
    <div class="grid2" id="travelerBox">${travelerInputs()}</div>
    <div class="btns"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div>
  </div></details>

  <details class="card"><summary>② ✈️ 航班與機場接送</summary><div class="detailBody"><div class="grid2"><div class="box blue"><h3>去程</h3>${flightForm("out")}</div><div class="box pink"><h3>回程</h3>${flightForm("back")}</div></div><div class="btns"><button class="btn dark" onclick="saveFlights()">儲存航班</button></div></div></details>

  <details class="card"><summary>③ 🏨 住宿</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div>
      <div><label>入住日</label><input id="hstart" type="date" value="${h?.start||data.trip.start}"></div>
      <div><label>退房日</label><input id="hend" type="date" value="${h?.end||data.trip.end}"></div>
    </div>
    <label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">搜尋地圖</button></div>
    <label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea>
    <div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"儲存住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;renderTrip()">取消編輯</button>':""}</div>
    <div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">尚未新增住宿</div>'}</div>
  </div></details>`;
}

function renderTrip(){
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  const selectedCity=typeof v15CurrentCity==="function" ? v15CurrentCity() : (data.trip.city||"");
  const mapObj=typeof v15CountryCityMaps==="function" ? v15CountryCityMaps().cityMap : {};
  const list=mapObj[data.trip.country]||[];
  const customCity=list.includes(selectedCity)?"":selectedCity;
  const showCustom=data.trip.country==="其他" || !list.includes(selectedCity);

  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地與機酒</h2><div class="hint">點選卡片展開設定；旅遊地與航班儲存後會自動收合，住宿可連續新增多間。</div></div></div>

  <details class="card"><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
    <div class="three compactMobile">
      <div><label>國家 / 區域</label><select id="country" onchange="refreshCityOptions()">${countryOptions()}</select></div>
      <div><label>城市 / 路線</label><select id="citySelect" onchange="updateDestByCity()">${v15CityOptions(selectedCity)}</select></div>
      <div id="customCityBox" class="full" style="display:${showCustom?"block":"none"}"><label>自訂目的地</label><input id="cityCustom" value="${esc(customCity)}" oninput="updateDestByCity()" placeholder="例：釜山＋慶州"></div>
    </div>
    <div class="two">
      <div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}" oninput="countryChanged()"></div>
      <div><label id="rateLabel">匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div>
    </div>
    <div class="three compactMobile">
      <div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div>
      <div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div>
      <div class="full"><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查看現在匯率</button></div>
    </div>
    <div class="two">
      <div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div>
      <div class="hint" style="align-self:end">目前目的地：${esc(data.trip.dest||"尚未設定")}</div>
    </div>
    <div class="grid2" id="travelerBox">${travelerInputs()}</div>
    <div class="btns"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div>
  </div></details>

  <details class="card"><summary>② ✈️ 航班與機場接送</summary><div class="detailBody">
    <div class="grid2"><div class="box blue"><h3>去程</h3>${flightForm("out")}</div><div class="box pink"><h3>回程</h3>${flightForm("back")}</div></div>
    <div class="card" style="box-shadow:none;background:#fffdf8;border:1px solid var(--line);margin-top:10px">
      <label style="display:flex;gap:8px;align-items:center;margin:0;font-weight:900">
        <input id="flightAutoAdd" type="checkbox" checked style="width:auto"> 儲存航班後，自動加入首尾行程
      </label>
      <div class="mini" style="margin-top:6px">會加入前往出發機場、搭乘去程、抵達後前往飯店／市區、回程機場與回家節點。</div>
    </div>
    <div class="btns"><button class="btn dark" onclick="saveFlights()">儲存航班</button></div>
  </div></details>

  <details class="card" ${v16KeepHotelOpen||editingHotelId?"open":""}><summary>③ 🏨 住宿</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div>
      <div><label>入住日</label><input id="hstart" type="date" value="${h?.start||data.trip.start}"></div>
      <div><label>退房日</label><input id="hend" type="date" value="${h?.end||data.trip.end}"></div>
    </div>
    <label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">搜尋地圖</button></div>
    <label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea>
    <div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"儲存住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;v16KeepHotelOpen=true;renderTrip()">取消編輯</button>':""}</div>
    <div class="mini" style="margin-top:6px">新增住宿後會自動加入：入住日辦理入住、每天早上從住宿出發、每天晚上回到當晚住宿。</div>
    <div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">尚未新增住宿</div>'}</div>
  </div></details>`;
}

function saveFlights(){
  ["out","back"].forEach(k=>{
    const transferEl=$(k+"transfer");
    data.flights[k]={
      no:$(k+"no").value,
      from:$(k+"from").value,
      to:$(k+"to").value,
      dep:$(k+"dep").value,
      arr:$(k+"arr").value,
      transfer:transferEl?transferEl.value:"",
      toAirport:$(k+"toAirport")?$(k+"toAirport").value:"",
      fromAirport:$(k+"fromAirport")?$(k+"fromAirport").value:"",
      fromTerminal:$(k+"fromTerminal")?$(k+"fromTerminal").value:"",
      toTerminal:$(k+"toTerminal")?$(k+"toTerminal").value:""
    };
  });

  if($("flightAutoAdd")?.checked){
    v16AddFlightsToPlans(false);
  }

  silentSave();
  render();
  v16CollapseTripDetail(1);
  toast($("flightAutoAdd")?.checked ? "已儲存航班並加入首尾行程" : "已儲存航班");
}

function v16AddFlightsToPlans(doRender=true){
  const out=data.flights.out||{}, back=data.flights.back||{};
  const outDepDay=v16DateFromDT(out.dep)||data.trip.start;
  const outArrDay=v16DateFromDT(out.arr)||outDepDay;
  const backDepDay=v16DateFromDT(back.dep)||data.trip.end;
  const backArrDay=v16DateFromDT(back.arr)||backDepDay;

  v16AddPlanNode({day:outDepDay,start:"14:00",end:v16TimeFromDT(out.dep),type:"交通",name:`前往 ${out.from||"出發機場"}`,note:out.toAirport||out.transfer||"",memo:"由航班資料帶入"});
  v16AddPlanNode({day:outDepDay,start:v16TimeFromDT(out.dep),end:v16TimeFromDT(out.arr),type:"航班",name:`搭乘去程航班 ${out.no||""}`.trim(),note:`${out.from||""} → ${out.to||""}`,memo:"由航班資料帶入"});
  v16AddPlanNode({day:outArrDay,start:v16TimeFromDT(out.arr),end:"",type:"交通",name:`從 ${out.to||"降落機場"} 前往飯店／市區`,note:out.fromAirport||"",memo:"由航班資料帶入"});

  v16AddPlanNode({day:backDepDay,start:"",end:v16TimeFromDT(back.dep),type:"交通",name:`從飯店前往 ${back.from||"回程機場"}`,note:back.toAirport||back.transfer||"",memo:"由航班資料帶入"});
  v16AddPlanNode({day:backDepDay,start:v16TimeFromDT(back.dep),end:v16TimeFromDT(back.arr),type:"航班",name:`搭乘回程航班 ${back.no||""}`.trim(),note:`${back.from||""} → ${back.to||""}`,memo:"由航班資料帶入"});
  v16AddPlanNode({day:backArrDay,start:v16TimeFromDT(back.arr),end:"",type:"交通",name:`從 ${back.to||"抵達機場"} 回家`,note:back.fromAirport||"",memo:"由航班資料帶入"});

  if(doRender) save();
}

function saveHotel(){
  if(!$("hname").value)return toast("請輸入住宿名稱");
  const item={name:$("hname").value,start:$("hstart").value,end:$("hend").value,addr:$("haddr").value,note:$("hnote").value};
  let hotelId=editingHotelId;

  if(editingHotelId){
    Object.assign(data.hotels.find(x=>x.id==editingHotelId),item);
    editingHotelId=null;
  }else{
    hotelId=uid();
    data.hotels.push({id:hotelId,...item});
  }

  v16AddHotelToPlans({id:hotelId,...item});
  v16KeepHotelOpen=true;
  silentSave();
  render();
  v16OpenTripDetail(2);
  toast("已新增住宿並帶入行程");
}

function v16AddHotelToPlans(h){
  if(!h.start||!h.end||!h.name)return;

  v16AddPlanNode({
    day:h.start,
    start:"15:00",
    end:"15:30",
    type:"住宿",
    name:`入住 ${h.name}`,
    note:h.addr||h.note||"",
    memo:"由住宿資料帶入"
  });

  // 每天早上：從前一天晚上住宿的飯店離開。也就是入住後隔天到退房日早上。
  v16DateRange(v16DateAdd(h.start,1), h.end).forEach(day=>{
    v16AddPlanNode({
      day,
      start:"09:00",
      end:"09:10",
      type:"住宿",
      name:`從 ${h.name} 出發`,
      note:h.addr||"",
      memo:"由住宿資料帶入"
    });
  });

  // 每天晚上：回到當晚住宿。住宿晚數為入住日至退房日前一晚。
  v16DateRange(h.start, v16DateAdd(h.end,-1)).forEach(day=>{
    v16AddPlanNode({
      day,
      start:"21:00",
      end:"21:10",
      type:"住宿",
      name:`回到 ${h.name}`,
      note:h.addr||"",
      memo:"由住宿資料帶入"
    });
  });
}

function v18SortHotels(){
  data.hotels.sort((a,b)=>String(a.start||"").localeCompare(String(b.start||"")) || String(a.end||"").localeCompare(String(b.end||"")));
}

function v18TripDefaultForCountry(country){
  const cityMap = (typeof v15CountryCityMaps==="function" ? v15CountryCityMaps().cityMap : {
    "韓國":["釜山","首爾"],"日本":["東京","大阪"],"香港":["香港"],"新加坡":["新加坡"],"美國":["紐約"]
  });
  const city=(cityMap[country]||[""])[0]||"";
  const currency=(typeof currencyMap!=="undefined" && currencyMap[country]) ? currencyMap[country] : "USD";
  const rate=(typeof rateMap!=="undefined" && rateMap[currency]) ? rateMap[currency] : 1;
  const dest=(typeof v15DestinationName==="function") ? v15DestinationName(country,city) : [country,city].filter(Boolean).join("");
  return {country, city, currency, rate, dest};
}

function v18ResetTripForCountry(country){
  const keepMeta = data.meta || {};
  const keepDates = {start:data.trip.start, end:data.trip.end, travelerCount:data.trip.travelerCount, travelers:[...(data.trip.travelers||["A","B"])]};
  const t=v18TripDefaultForCountry(country);

  data.meta={...keepMeta};
  data.trip={
    ...data.trip,
    country:t.country,
    city:t.city,
    dest:t.dest,
    currency:t.currency,
    rate:t.rate,
    start:keepDates.start,
    end:keepDates.end,
    travelerCount:keepDates.travelerCount,
    travelers:keepDates.travelers
  };
  data.days=mkDays(data.trip.start,data.trip.end);
  data.flights={out:{},back:{}};
  data.hotels=[];
  data.expenses=[];
  data.spots=[];
  data.plans=[];
  data.conns=[];
  data.photos=[];
  data.dayCovers={};
  data.dayCoverMeta={};
  data.packing=pack0.map(x=>({id:uid(),type:x[0],name:x[1],note:x[2],checked:false}));
  data.packView="pre";
  cur=data.days[0]?.key||data.trip.start;
}

function cancelCountryReset(){
  v18PendingCountry=null;
  $("countryResetModal").classList.remove("show");
}

function confirmCountryReset(){
  if(!v18PendingCountry)return;
  v18ResetTripForCountry(v18PendingCountry);
  v18PendingCountry=null;
  $("countryResetModal").classList.remove("show");
  save();
  toast("已清空資料並切換旅遊國家");
}

function saveBasic(){
  const selectedCountry=$("country").value;
  if(selectedCountry!==data.trip.country){
    v18PendingCountry=selectedCountry;
    $("country").value=data.trip.country;
    $("countryResetModal").classList.add("show");
    return;
  }

  data.trip.country=$("country").value;
  const selected = $("citySelect").value;
  data.trip.city = selected==="自訂" ? $("cityCustom").value.trim() : selected;
  data.trip.dest = v15DestinationName(data.trip.country, data.trip.city);
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=$("start").value;
  data.trip.end=$("end").value;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++) data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));

  data.days=mkDays(data.trip.start,data.trip.end);
  data.hotels=data.hotels.map(h=>({
    ...h,
    start: h.start < data.trip.start ? data.trip.start : h.start,
    end: h.end > data.trip.end ? data.trip.end : h.end
  }));
  v18SortHotels();
  cur=data.days[0]?.key;
  silentSave();
  render();
  const d=document.querySelectorAll("#tripView details.card")[0];
  if(d) d.removeAttribute("open");
  toast("已儲存旅遊地設定");
}

function renderTrip(){
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  const selectedCity=typeof v15CurrentCity==="function" ? v15CurrentCity() : (data.trip.city||"");
  const mapObj=typeof v15CountryCityMaps==="function" ? v15CountryCityMaps().cityMap : {};
  const list=mapObj[data.trip.country]||[];
  const customCity=list.includes(selectedCity)?"":selectedCity;
  const showCustom=data.trip.country==="其他" || !list.includes(selectedCity);
  v18SortHotels();

  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地與機酒</h2><div class="hint">旅遊國家會影響整份資料，修改國家前會要求確認與備份。</div></div></div>

  <details class="card"><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
    <div class="three compactMobile">
      <div><label>國家 / 區域</label><select id="country" onchange="handleCountrySelectChange()">${countryOptions()}</select></div>
      <div><label>城市 / 路線</label><select id="citySelect" onchange="updateDestByCity()">${v15CityOptions(selectedCity)}</select></div>
      <div id="customCityBox" class="full" style="display:${showCustom?"block":"none"}"><label>自訂目的地</label><input id="cityCustom" value="${esc(customCity)}" oninput="updateDestByCity()" placeholder="例：釜山＋慶州"></div>
    </div>
    <div class="two">
      <div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}" oninput="countryChanged()"></div>
      <div><label id="rateLabel">匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div>
    </div>
    <div class="three compactMobile">
      <div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div>
      <div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div>
      <div class="full"><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查看現在匯率</button></div>
    </div>
    <div class="two">
      <div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div>
      <div class="hint" style="align-self:end">目前目的地：${esc(data.trip.dest||"尚未設定")}</div>
    </div>
    <div class="grid2" id="travelerBox">${travelerInputs()}</div>
    <div class="btns"><button class="btn dark" onclick="saveBasic()">儲存旅遊地設定</button></div>
  </div></details>

  <details class="card"><summary>② ✈️ 航班與機場接送</summary><div class="detailBody">
    <div class="grid2"><div class="box blue"><h3>去程</h3>${flightForm("out")}</div><div class="box pink"><h3>回程</h3>${flightForm("back")}</div></div>
    <div class="card" style="box-shadow:none;background:#fffdf8;border:1px solid var(--line);margin-top:10px">
      <label style="display:flex;gap:8px;align-items:center;margin:0;font-weight:900">
        <input id="flightAutoAdd" type="checkbox" checked style="width:auto"> 儲存航班後，自動加入首尾行程
      </label>
    </div>
    <div class="btns"><button class="btn dark" onclick="saveFlights()">儲存航班</button></div>
  </div></details>

  <details class="card" ${v16KeepHotelOpen||editingHotelId?"open":""}><summary>③ 🏨 住宿</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div>
      <div><label>入住日</label><input id="hstart" type="date" min="${data.trip.start}" max="${data.trip.end}" value="${h?.start||data.trip.start}"></div>
      <div><label>退房日</label><input id="hend" type="date" min="${data.trip.start}" max="${data.trip.end}" value="${h?.end||data.trip.end}"></div>
    </div>
    <label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">搜尋地圖</button></div>
    <label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea>
    <div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"儲存住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;v16KeepHotelOpen=true;renderTrip()">取消編輯</button>':""}</div>
    <div class="hotelSortedNote">住宿會依入住日自動排序；可選日期已限制在旅遊日期內。</div>
    <div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">尚未新增住宿</div>'}</div>
  </div></details>`;
}

function saveHotel(){
  if(!$("hname").value)return toast("請輸入住宿名稱");
  let start=$("hstart").value;
  let end=$("hend").value;
  if(start < data.trip.start || start > data.trip.end || end < data.trip.start || end > data.trip.end){
    return alert("住宿日期必須在旅遊出發日與回程日之間。");
  }
  if(end < start){
    return alert("退房日不可早於入住日。");
  }
  const item={name:$("hname").value,start,end,addr:$("haddr").value,note:$("hnote").value};
  let hotelId=editingHotelId;

  if(editingHotelId){
    Object.assign(data.hotels.find(x=>x.id==editingHotelId),item);
    editingHotelId=null;
  }else{
    hotelId=uid();
    data.hotels.push({id:hotelId,...item});
  }

  v18SortHotels();
  v16AddHotelToPlans({id:hotelId,...item});
  v16KeepHotelOpen=true;
  silentSave();
  render();
  v16OpenTripDetail(2);
  toast("已儲存住宿並依入住日排序");
}

function saveBasic(){
  const selectedCountry=$("country").value;
  if(selectedCountry!==data.trip.country){
    v18PendingCountry=selectedCountry;
    $("country").value=data.trip.country;
    $("countryResetModal").classList.add("show");
    return;
  }

  const newStart=$("start").value;
  const newEnd=$("end").value;
  if((newStart!==data.trip.start || newEnd!==data.trip.end) && data.days?.length){
    v19PendingDates={start:newStart,end:newEnd};
    $("dateResetModal").classList.add("show");
    return;
  }

  data.trip.country=$("country").value;
  const selected = $("citySelect").value;
  data.trip.city = selected==="自訂" ? $("cityCustom").value.trim() : selected;
  data.trip.dest = v15DestinationName(data.trip.country, data.trip.city);
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=newStart;
  data.trip.end=newEnd;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++) data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));

  data.days=mkDays(data.trip.start,data.trip.end);
  v18SortHotels();
  cur=data.days[0]?.key;
  silentSave();
  render();
  const d=document.querySelectorAll("#tripView details.card")[0];
  if(d) d.removeAttribute("open");
  toast("已儲存旅遊地設定");
}

function confirmCountryReset(){
  if(!v18PendingCountry)return;
  const country=v18PendingCountry;
  const keepMeta = data.meta || {};
  const keepDates = {start:data.trip.start, end:data.trip.end, travelerCount:data.trip.travelerCount, travelers:[...(data.trip.travelers||["A","B"])]};
  const t=v18TripDefaultForCountry(country);

  data.meta={...keepMeta};
  data.trip={
    ...data.trip,
    country:t.country,
    city:t.city,
    dest:t.dest,
    currency:t.currency,
    rate:t.rate,
    start:keepDates.start,
    end:keepDates.end,
    travelerCount:keepDates.travelerCount,
    travelers:keepDates.travelers
  };
  data.days=mkDays(data.trip.start,data.trip.end);
  v19ResetVariableData();
  cur=data.days[0]?.key||data.trip.start;
  v18PendingCountry=null;
  $("countryResetModal").classList.remove("show");
  save();
  toast("已清空資料並切換旅遊國家");
}

function saveHotel(){
  if(!$("hname").value)return toast("請輸入住宿名稱");
  let start=$("hstart").value;
  let end=$("hend").value;
  if(start < data.trip.start || start > data.trip.end || end < data.trip.start || end > data.trip.end){
    return alert("住宿日期必須在旅遊出發日與回程日之間。");
  }
  if(end < start){
    return alert("退房日不可早於入住日。");
  }
  const item={name:$("hname").value,start,end,addr:$("haddr").value,note:$("hnote").value};
  let hotelId=editingHotelId;
  let isNew=false;

  if(editingHotelId){
    Object.assign(data.hotels.find(x=>x.id==editingHotelId),item);
    editingHotelId=null;
  }else{
    isNew=true;
    hotelId=uid();
    data.hotels.push({id:hotelId,...item});
  }

  v18SortHotels();
  v16KeepHotelOpen=true;
  silentSave();
  render();
  v16OpenTripDetail(2);

  if(isNew){
    setTimeout(()=>{
      if(confirm("住宿已新增。要把這間住宿帶入行程嗎？")){
        addHotelPlans(hotelId);
      }
      if(confirm("要把這間住宿帶入預算嗎？")){
        addHotelExpense(hotelId);
      }
    },80);
  }else{
    toast("已儲存住宿並依入住日排序");
  }
}

function hotelHasPlans(id){
  return data.plans.some(p=>p.hotelId==id);
}
function hotelHasExpense(id){
  return data.expenses.some(e=>e.hotelId==id);
}

function addHotelPlans(id){
  const h=data.hotels.find(x=>x.id==id);
  if(!h)return;
  v16AddHotelToPlans({...h});
  data.plans.forEach(p=>{
    if(p.memo==="由住宿資料帶入" && (p.name.includes(h.name) || p.note===h.addr)) p.hotelId=id;
  });
  save();
  toast("已帶入住宿行程");
}

function removeHotelPlans(id){
  data.plans=data.plans.filter(p=>p.hotelId!=id);
  data.conns=data.conns.filter(c=>data.plans.some(p=>p.id==c.a) && data.plans.some(p=>p.id==c.b));
  save();
  toast("已移除住宿行程");
}

function addHotelExpense(id){
  const h=data.hotels.find(x=>x.id==id);
  if(!h)return;
  if(hotelHasExpense(id))return toast("這間住宿已帶入預算");
  data.expenses.push({id:uid(),hotelId:id,source:"住宿",type:"住宿",name:`${short(h.start)}~${short(h.end)} ${h.name}`,payer:"未定",payMethod:"未定",day:"",mode:"TWD",foreign:0,twd:0,memo:"由住宿資料帶入，可編輯金額"});
  save();
  toast("已帶入住宿預算");
}

function removeHotelExpense(id){
  data.expenses=data.expenses.filter(e=>e.hotelId!=id);
  save();
  toast("已移除住宿預算");
}

function hotelCard(h){
  const hasP=hotelHasPlans(h.id);
  const hasE=hotelHasExpense(h.id);
  return `<div class="card"><div class="time">${short(h.start)}→${short(h.end)}</div><div class="place">🏨 ${esc(h.name)}</div><div class="box mint">${esc(h.addr||"尚未填地址")}<br>${esc(h.note||"")}</div>
  <div class="hotelActionState">${hasP?'<span class="tag">已帶入行程</span>':'<span class="tag">未帶入行程</span>'}${hasE?'<span class="tag">已帶入預算</span>':'<span class="tag">未帶入預算</span>'}</div>
  <div class="btns">
    <button class="small" onclick="editHotel('${h.id}')">編輯</button>
    <button class="small" onclick="map('${encodeURIComponent((h.addr||h.name)+' '+data.trip.dest)}')">地圖</button>
    ${hasP?`<button class="small" onclick="removeHotelPlans('${h.id}')">移除行程</button>`:`<button class="small" onclick="addHotelPlans('${h.id}')">帶入行程</button>`}
    ${hasE?`<button class="small" onclick="removeHotelExpense('${h.id}')">移除預算</button>`:`<button class="small" onclick="addHotelExpense('${h.id}')">帶入預算</button>`}
    <button class="small" onclick="delHotel('${h.id}')">刪除</button>
  </div></div>`;
}

function delHotel(id){
  data.hotels=data.hotels.filter(h=>h.id!=id);
  data.plans=data.plans.filter(p=>p.hotelId!=id);
  data.expenses=data.expenses.filter(e=>e.hotelId!=id);
  save();
}

function refreshCityOptions(){
  const list = v15CountryCityMaps().cityMap[$("country").value] || [];
  $("citySelect").innerHTML = v15CityOptions(list[0] || "自訂");
  $("cityCustom").value = "";
  updateCustomCityVisibility();
  countryChanged();
}

function saveBasic(){
  const selectedCountry=$("country").value;
  if(selectedCountry!==data.trip.country){
    v18PendingCountry=selectedCountry;
    $("countryResetModal").classList.add("show");
    return;
  }

  const newStart=$("start").value;
  const newEnd=$("end").value;
  if((newStart!==data.trip.start || newEnd!==data.trip.end) && data.days?.length){
    v19PendingDates={start:newStart,end:newEnd};
    $("dateResetModal").classList.add("show");
    return;
  }

  data.trip.country=$("country").value;
  const selected = $("citySelect").value;
  data.trip.city = selected==="自訂" ? $("cityCustom").value.trim() : selected;
  data.trip.dest = v15DestinationName(data.trip.country, data.trip.city);
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=newStart;
  data.trip.end=newEnd;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++) data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));

  data.days=mkDays(data.trip.start,data.trip.end);
  v18SortHotels();
  cur=data.days[0]?.key;
  silentSave();
  render();
  const d=document.querySelectorAll("#tripView details.card")[0];
  if(d) d.removeAttribute("open");
  toast("已儲存旅遊地設定");
}

function saveFlights(){
  ["out","back"].forEach(k=>{
    const transferEl=$(k+"transfer");
    data.flights[k]={
      no:$(k+"no").value,
      from:$(k+"from").value,
      to:$(k+"to").value,
      dep:$(k+"dep").value,
      arr:$(k+"arr").value,
      transfer:transferEl?transferEl.value:"",
      toAirport:$(k+"toAirport")?$(k+"toAirport").value:"",
      fromAirport:$(k+"fromAirport")?$(k+"fromAirport").value:"",
      fromTerminal:$(k+"fromTerminal")?$(k+"fromTerminal").value:"",
      toTerminal:$(k+"toTerminal")?$(k+"toTerminal").value:""
    };
  });
  silentSave();
  render();
  v16CollapseTripDetail(1);
  v21PendingFlightOptions=true;
  $("flightOptionModal").classList.add("show");
}

function closeFlightOptions(){
  v21PendingFlightOptions=false;
  $("flightOptionModal").classList.remove("show");
  toast("已儲存航班");
}

function confirmFlightOptions(){
  if($("flightOptionAddPlans")?.checked){
    v16AddFlightsToPlans(false);
    silentSave();
    render();
    toast("已儲存航班並加入首尾行程");
  }else{
    toast("已儲存航班");
  }
  v21PendingFlightOptions=false;
  $("flightOptionModal").classList.remove("show");
}

function saveHotel(){
  if(!$("hname").value)return toast("請輸入住宿名稱");
  let start=$("hstart").value;
  let end=$("hend").value;
  if(start < data.trip.start || start > data.trip.end || end < data.trip.start || end > data.trip.end){
    return alert("住宿日期必須在旅遊出發日與回程日之間。");
  }
  if(end < start){
    return alert("退房日不可早於入住日。");
  }
  const item={name:$("hname").value,start,end,addr:$("haddr").value,note:$("hnote").value};
  let hotelId=editingHotelId;
  let isNew=false;

  if(editingHotelId){
    Object.assign(data.hotels.find(x=>x.id==editingHotelId),item);
    editingHotelId=null;
  }else{
    isNew=true;
    hotelId=uid();
    data.hotels.push({id:hotelId,...item});
  }

  v18SortHotels();
  v16KeepHotelOpen=true;
  silentSave();
  render();
  v16OpenTripDetail(2);

  if(isNew){
    v21PendingHotelId=hotelId;
    $("hotelOptionModal").classList.add("show");
  }else{
    toast("已儲存住宿並依入住日排序");
  }
}

function closeHotelOptions(){
  v21PendingHotelId=null;
  $("hotelOptionModal").classList.remove("show");
  toast("已新增住宿");
}

function confirmHotelOptions(){
  const id=v21PendingHotelId;
  if(!id)return closeHotelOptions();
  if($("hotelOptionAddPlans")?.checked){
    addHotelPlans(id);
  }
  if($("hotelOptionAddBudget")?.checked){
    addHotelExpense(id);
  }
  v21PendingHotelId=null;
  $("hotelOptionModal").classList.remove("show");
  toast("已完成住宿同步設定");
}

function v16AddFlightsToPlans(doRender=true){
  const out=data.flights.out||{}, back=data.flights.back||{};
  const outDepDay=v16DateFromDT(out.dep)||data.trip.start;
  const outArrDay=v16DateFromDT(out.arr)||outDepDay;
  const backDepDay=v16DateFromDT(back.dep)||data.trip.end;
  const backArrDay=v16DateFromDT(back.arr)||backDepDay;

  v16AddPlanNode({sourceType:"flight",lockedName:true,day:outDepDay,start:"14:00",end:v16TimeFromDT(out.dep),type:"交通",name:`前往 ${out.from||"出發機場"}`,note:out.toAirport||out.transfer||"",memo:"由航班資料帶入"});
  v16AddPlanNode({sourceType:"flight",lockedName:true,day:outDepDay,start:v16TimeFromDT(out.dep),end:v16TimeFromDT(out.arr),type:"航班",name:`搭乘去程航班 ${out.no||""}`.trim(),note:`${out.from||""} → ${out.to||""}`,memo:"由航班資料帶入"});
  v16AddPlanNode({sourceType:"flight",lockedName:true,day:outArrDay,start:v16TimeFromDT(out.arr),end:"",type:"交通",name:`從 ${out.to||"降落機場"} 前往飯店／市區`,note:out.fromAirport||"",memo:"由航班資料帶入"});

  v16AddPlanNode({sourceType:"flight",lockedName:true,day:backDepDay,start:"",end:v16TimeFromDT(back.dep),type:"交通",name:`從飯店前往 ${back.from||"回程機場"}`,note:back.toAirport||back.transfer||"",memo:"由航班資料帶入"});
  v16AddPlanNode({sourceType:"flight",lockedName:true,day:backDepDay,start:v16TimeFromDT(back.dep),end:v16TimeFromDT(back.arr),type:"航班",name:`搭乘回程航班 ${back.no||""}`.trim(),note:`${back.from||""} → ${back.to||""}`,memo:"由航班資料帶入"});
  v16AddPlanNode({sourceType:"flight",lockedName:true,day:backArrDay,start:v16TimeFromDT(back.arr),end:"",type:"交通",name:`從 ${back.to||"抵達機場"} 回家`,note:back.fromAirport||"",memo:"由航班資料帶入"});

  if(doRender) save();
}

function v16AddHotelToPlans(h){
  if(!h.start||!h.end||!h.name)return;

  v16AddPlanNode({
    hotelId:h.id,
    sourceType:"hotel",
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
    v16AddPlanNode({
      hotelId:h.id,
      sourceType:"hotel",
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
    v16AddPlanNode({
      hotelId:h.id,
      sourceType:"hotel",
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
}

function addHotelPlans(id){
  const h=data.hotels.find(x=>x.id==id);
  if(!h)return;
  v16AddHotelToPlans({...h});
  save();
  toast("已帶入住宿行程");
}

function v23ParseDateOnly(s){
  if(!s)return null;
  const [y,m,d]=String(s).split("-").map(Number);
  if(!y||!m||!d)return null;
  return new Date(y,m-1,d).getTime();
}
function v23ParseDateTime(s){
  if(!s)return null;
  const t=new Date(s).getTime();
  return Number.isFinite(t)?t:null;
}
function v23InTripRange(dateStr){
  const d=v23ParseDateOnly(dateStr);
  const s=v23ParseDateOnly(data.trip.start);
  const e=v23ParseDateOnly(data.trip.end);
  return d!==null && s!==null && e!==null && d>=s && d<=e;
}
function v23DateLabel(dateStr){
  if(!dateStr)return "未填";
  return dateStr;
}
function v23TimeToMin(t){
  if(!t)return null;
  const [h,m]=String(t).split(":").map(Number);
  if(!Number.isFinite(h)||!Number.isFinite(m))return null;
  return h*60+m;
}
function v23ValidateFlightTimes(){
  const outDep=$("outdep")?.value || "";
  const outArr=$("outarr")?.value || "";
  const backDep=$("backdep")?.value || "";
  const backArr=$("backarr")?.value || "";

  const required = [
    ["去程起飛時間", outDep],
    ["去程降落時間", outArr],
    ["回程起飛時間", backDep],
    ["回程降落時間", backArr]
  ].filter(x=>!x[1]).map(x=>x[0]);

  if(required.length){
    alert("請先填完整航班時間：\n" + required.join("、"));
    return false;
  }

  const a=v23ParseDateTime(outDep), b=v23ParseDateTime(outArr), c=v23ParseDateTime(backDep), d=v23ParseDateTime(backArr);
  if(!(a<b && b<c && c<d)){
    alert("請確認航班時間順序：\n\n去程起飛時間 < 去程降落時間 < 回程起飛時間 < 回程降落時間");
    return false;
  }

  const tripStart=v23ParseDateOnly(data.trip.start);
  const tripEnd=v23ParseDateOnly(data.trip.end);
  const flightDates=[outDep,outArr,backDep,backArr].map(x=>String(x).split("T")[0]);
  const outside=flightDates.filter(x=>!v23InTripRange(x));
  if(outside.length){
    alert(`航班日期需落在旅遊日期區間內：${data.trip.start} ～ ${data.trip.end}`);
    return false;
  }

  return true;
}

function saveFlights(){
  if(!v23ValidateFlightTimes())return;

  ["out","back"].forEach(k=>{
    const transferEl=$(k+"transfer");
    data.flights[k]={
      no:$(k+"no").value,
      from:$(k+"from").value,
      to:$(k+"to").value,
      dep:$(k+"dep").value,
      arr:$(k+"arr").value,
      transfer:transferEl?transferEl.value:"",
      toAirport:$(k+"toAirport")?$(k+"toAirport").value:"",
      fromAirport:$(k+"fromAirport")?$(k+"fromAirport").value:"",
      fromTerminal:$(k+"fromTerminal")?$(k+"fromTerminal").value:"",
      toTerminal:$(k+"toTerminal")?$(k+"toTerminal").value:""
    };
  });
  silentSave();
  render();
  v16CollapseTripDetail(1);
  v21PendingFlightOptions=true;
  $("flightOptionModal").classList.add("show");
}

function v23ValidateHotelDates(start,end){
  if(!start||!end){
    alert("請填寫住宿入住日與退房日。");
    return false;
  }
  if(!v23InTripRange(start) || !v23InTripRange(end)){
    alert(`住宿日期必須在旅遊日期區間內：${data.trip.start} ～ ${data.trip.end}`);
    return false;
  }
  if(v23ParseDateOnly(end)<v23ParseDateOnly(start)){
    alert("住宿退房日不可早於入住日。");
    return false;
  }
  return true;
}

function saveHotel(){
  if(!$("hname").value)return toast("請輸入住宿名稱");
  let start=$("hstart").value;
  let end=$("hend").value;
  if(!v23ValidateHotelDates(start,end))return;

  const item={name:$("hname").value,start,end,addr:$("haddr").value,note:$("hnote").value};
  let hotelId=editingHotelId;
  let isNew=false;

  if(editingHotelId){
    Object.assign(data.hotels.find(x=>x.id==editingHotelId),item);
    editingHotelId=null;
  }else{
    isNew=true;
    hotelId=uid();
    data.hotels.push({id:hotelId,...item});
  }

  v18SortHotels();
  v16KeepHotelOpen=true;
  silentSave();
  render();
  v16OpenTripDetail(2);

  if(isNew){
    v21PendingHotelId=hotelId;
    $("hotelOptionModal").classList.add("show");
  }else{
    toast("已儲存住宿並依入住日排序");
  }
}

function v23ValidatePlanForm(){
  const day=$("pday")?.value || "";
  const start=$("ps")?.value || "";
  const end=$("pe")?.value || "";
  const type=$("ptype")?.value || "";

  if(!v23InTripRange(day)){
    alert(`行程日期必須在旅遊日期區間內：${data.trip.start} ～ ${data.trip.end}`);
    return false;
  }

  const flexibleTypes=["交通","航班","住宿"];
  if(!flexibleTypes.includes(type)){
    if(!start || !end){
      alert("景點／餐廳／購物等一般行程需填寫開始與結束時間。");
      return false;
    }
  }

  if(start && end){
    const s=v23TimeToMin(start), e=v23TimeToMin(end);
    if(e<s){
      alert("行程結束時間不可早於開始時間。");
      return false;
    }
  }

  return true;
}

function v23NormalizeSpotDate(raw){
  if(!raw)return "";
  return v23InTripRange(raw) ? raw : "";
}

function removeFlightPlans(){
  const ids=data.plans.filter(v24IsFlightPlan).map(p=>p.id);
  data.plans=data.plans.filter(p=>!ids.includes(p.id));
  data.conns=data.conns.filter(c=>!ids.includes(c.a)&&!ids.includes(c.b));
  save();
  toast("已幫你移除航班行程囉！");
}
function addFlightBudget(){
  if(flightHasBudget())return toast("航班預算已經記過囉！");
  const out=data.flights.out||{}, back=data.flights.back||{};
  if(out.no){
    data.expenses.push({id:uid(),sourceType:"flight",source:"航班",type:"機票",name:`去程 ${out.no}`,payer:"未定",payMethod:"未定",day:"",mode:"TWD",foreign:0,twd:0,memo:"由航班資料帶入，可自行補金額"});
  }
  if(back.no){
    data.expenses.push({id:uid(),sourceType:"flight",source:"航班",type:"機票",name:`回程 ${back.no}`,payer:"未定",payMethod:"未定",day:"",mode:"TWD",foreign:0,twd:0,memo:"由航班資料帶入，可自行補金額"});
  }
  if(!out.no && !back.no){
    data.expenses.push({id:uid(),sourceType:"flight",source:"航班",type:"機票",name:"航班機票",payer:"未定",payMethod:"未定",day:"",mode:"TWD",foreign:0,twd:0,memo:"由航班資料帶入，可自行補金額"});
  }
  save();
  toast("已幫你記一筆航班花費！");
}
function removeFlightBudget(){
  data.expenses=data.expenses.filter(e=>!(e.sourceType==="flight" || e.source==="航班"));
  save();
  toast("已幫你移除航班預算囉！");
}
function flightStatusHtml(){
  const hasP=flightHasPlans();
  const hasB=flightHasBudget();
  return `<div class="flightStatusBox">
    <div class="flightStatusGrid">
      <div class="flightStatusItem"><b>行程狀態</b><span class="${hasP?"ok":""}">${hasP?"已匯入行程":"尚未匯入行程"}</span></div>
      <div class="flightStatusItem"><b>預算狀態</b><span class="${hasB?"ok":""}">${hasB?"已匯入預算":"尚未匯入預算"}</span></div>
    </div>
    <div class="flightStatusActions">
      ${hasP?`<button class="btn soft compact" onclick="removeFlightPlans()">移除航班行程</button>`:`<button class="btn blue compact" onclick="v16AddFlightsToPlans(true)">匯入首尾行程</button>`}
      ${hasB?`<button class="btn soft compact" onclick="removeFlightBudget()">移除航班預算</button>`:`<button class="btn pink compact" onclick="addFlightBudget()">記一筆航班花費</button>`}
    </div>
  </div>`;
}

function renderTrip(){
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  const selectedCity=typeof v15CurrentCity==="function" ? v15CurrentCity() : (data.trip.city||"");
  const mapObj=typeof v15CountryCityMaps==="function" ? v15CountryCityMaps().cityMap : {};
  const list=mapObj[data.trip.country]||[];
  const customCity=list.includes(selectedCity)?"":selectedCity;
  const showCustom=data.trip.country==="其他" || !list.includes(selectedCity);
  v18SortHotels();

  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地與機酒</h2><div class="hint">旅遊國家會影響整份資料，修改國家前會要求確認與備份。</div></div></div>

  <details class="card"><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
    <div class="three compactMobile">
      <div><label>國家 / 區域</label><select id="country" onchange="handleCountrySelectChange()">${countryOptions()}</select></div>
      <div><label>城市 / 路線</label><select id="citySelect" onchange="updateDestByCity()">${v15CityOptions(selectedCity)}</select></div>
      <div id="customCityBox" class="full" style="display:${showCustom?"block":"none"}"><label>自訂目的地</label><input id="cityCustom" value="${esc(customCity)}" oninput="updateDestByCity()" placeholder="例：釜山＋慶州"></div>
    </div>
    <div class="two">
      <div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}" oninput="countryChanged()"></div>
      <div><label id="rateLabel">匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div>
    </div>
    <div class="three compactMobile">
      <div><label>出發日</label><input id="start" type="date" value="${data.trip.start}"></div>
      <div><label>回程日</label><input id="end" type="date" value="${data.trip.end}"></div>
      <div class="full"><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查一下匯率</button></div>
    </div>
    <div class="two">
      <div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div>
      <div class="hint" style="align-self:end">目前目的地：${esc(data.trip.dest||"尚未設定")}</div>
    </div>
    <div class="grid2" id="travelerBox">${travelerInputs()}</div>
    <div class="btns"><button class="btn dark" onclick="saveBasic()">存好旅遊地設定</button></div>
  </div></details>

  <details class="card"><summary>② ✈️ 航班與機場接送</summary><div class="detailBody">
    <div class="grid2"><div class="box blue"><h3>去程</h3>${flightForm("out")}</div><div class="box pink"><h3>回程</h3>${flightForm("back")}</div></div>
    ${flightStatusHtml()}
    <div class="btns"><button class="btn dark" onclick="saveFlights()">存好航班設定</button></div>
  </div></details>

  <details class="card" ${v16KeepHotelOpen||editingHotelId?"open":""}><summary>③ 🏨 住宿</summary><div class="detailBody">
    <div class="three compactMobile">
      <div class="full"><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div>
      <div><label>入住日</label><input id="hstart" type="date" min="${data.trip.start}" max="${data.trip.end}" value="${h?.start||data.trip.start}"></div>
      <div><label>退房日</label><input id="hend" type="date" min="${data.trip.start}" max="${data.trip.end}" value="${h?.end||data.trip.end}"></div>
    </div>
    <label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">查地圖</button></div>
    <label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea>
    <div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"存好住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;v16KeepHotelOpen=true;renderTrip()">取消編輯</button>':""}</div>
    <div class="hotelSortedNote">住宿會依入住日自動排序；可選日期已限制在旅遊日期內。</div>
    <div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">還沒有新增住宿</div>'}</div>
  </div></details>`;
}

function saveFlights(){
  if(!v23ValidateFlightTimes())return;

  ["out","back"].forEach(k=>{
    const transferEl=$(k+"transfer");
    data.flights[k]={
      no:$(k+"no").value,
      from:$(k+"from").value,
      to:$(k+"to").value,
      dep:$(k+"dep").value,
      arr:$(k+"arr").value,
      transfer:transferEl?transferEl.value:"",
      toAirport:$(k+"toAirport")?$(k+"toAirport").value:"",
      fromAirport:$(k+"fromAirport")?$(k+"fromAirport").value:"",
      fromTerminal:$(k+"fromTerminal")?$(k+"fromTerminal").value:"",
      toTerminal:$(k+"toTerminal")?$(k+"toTerminal").value:""
    };
  });
  silentSave();
  render();
  v16CollapseTripDetail(1);
  toast("已幫你存好航班囉！");
}

function saveBasic(){
  const selectedCountry=$("country").value;
  if(selectedCountry!==data.trip.country){
    v18PendingCountry=selectedCountry;
    $("countryResetModal").classList.add("show");
    return;
  }

  const newStart=$("start").value;
  const newEnd=$("end").value;
  if((newStart!==data.trip.start || newEnd!==data.trip.end) && data.days?.length){
    v19PendingDates={start:newStart,end:newEnd};
    $("dateResetModal").classList.add("show");
    return;
  }

  data.trip.country=$("country").value;
  const selected = $("citySelect").value;
  data.trip.city = selected==="自訂" ? $("cityCustom").value.trim() : selected;
  data.trip.dest = v15DestinationName(data.trip.country, data.trip.city);
  data.trip.currency=$("currency").value.toUpperCase();
  data.trip.start=newStart;
  data.trip.end=newEnd;
  data.trip.rate=Number($("rateSetup").value||data.trip.rate||1);
  data.trip.travelerCount=Number($("travelerCount").value||1);
  data.trip.travelers=[];
  for(let i=0;i<data.trip.travelerCount;i++) data.trip.travelers.push($("traveler"+i).value||String.fromCharCode(65+i));

  data.days=mkDays(data.trip.start,data.trip.end);
  v18SortHotels();
  cur=data.days[0]?.key;
  silentSave();
  render();
  const d=document.querySelectorAll("#tripView details.card")[0];
  if(d) d.removeAttribute("open");
  toast("已幫你存好囉！");
}

function addFlightBudget(){
  if(flightHasBudget())return toast("航班預算已經記過囉！");
  const out=data.flights.out||{}, back=data.flights.back||{};
  const label=[
    out.no?`去程 ${out.no}`:"",
    back.no?`回程 ${back.no}`:""
  ].filter(Boolean).join("／");

  data.expenses.push({
    id:uid(),
    sourceType:"flight",
    source:"航班",
    type:"機票",
    name: label ? `來回機票（${label}）` : "來回機票",
    payer:"未定",
    payMethod:"未定",
    day:"",
    mode:"TWD",
    foreign:0,
    twd:0,
    memo:"由航班資料帶入，可自行補金額"
  });
  save();
  toast("已幫你記一筆來回機票！");
}

function removeFlightBudget(){
  data.expenses=data.expenses.filter(e=>!(e.sourceType==="flight" || e.source==="航班"));
  save();
  toast("已幫你移除航班預算囉！");
}

function flightStatusHtml(){
  const hasP=flightHasPlans();
  const hasB=flightHasBudget();
  return `<div class="flightStatusBox">
    <div class="flightStatusGrid">
      <div class="flightStatusItem"><b>行程狀態</b><span class="${hasP?"ok":""}">${hasP?"已匯入行程":"尚未匯入行程"}</span></div>
      <div class="flightStatusItem"><b>預算狀態</b><span class="${hasB?"ok":""}">${hasB?"已匯入預算":"尚未匯入預算"}</span></div>
    </div>
    <div class="flightStatusActions">
      ${hasP?`<button class="btn soft compact" onclick="removeFlightPlans()">移除航班行程</button>`:`<button class="btn blue compact" onclick="v16AddFlightsToPlans(true)">匯入首尾行程</button>`}
      ${hasB?`<button class="btn soft compact" onclick="removeFlightBudget()">移除航班預算</button>`:`<button class="btn pink compact" onclick="addFlightBudget()">記一筆來回機票</button>`}
    </div>
  </div>`;
}

const __oldInitFirebaseSync_v25 = initFirebaseSync;
initFirebaseSync = function(){
  renderAccountWidget(null);
  __oldInitFirebaseSync_v25();
};
let syncStatus = "idle";
let lastSyncTime = null;

function v23ValidatePlanForm(){
  const day=$("pday")?.value || "";
  const start=$("ps")?.value || "";
  const end=$("pe")?.value || "";
  const type=$("ptype")?.value || "";

  if(!v23InTripRange(day)){
    alert(`行程日期必須在旅遊日期區間內：${data.trip.start} ～ ${data.trip.end}`);
    return false;
  }

  const flexibleTypes=["交通","航班","住宿"];
  if(!flexibleTypes.includes(type)){
    if(!start || !end){
      alert("景點／餐廳／購物等一般行程需填寫開始與結束時間。");
      return false;
    }
  }

  if(start && end){
    const s=v23TimeToMin(start), e=v23TimeToMin(end);
    if(e<s){
      alert("行程結束時間不可早於開始時間。");
      return false;
    }
  }

  return true;
}

function v23ValidatePlanForm(){
  const day=$("pday")?.value || "";
  const start=$("ps")?.value || "";
  const end=$("pe")?.value || "";
  const type=normalizePlanType($("ptype")?.value || "其他");

  if(!v23InTripRange(day)){
    alert(`行程日期必須在旅遊日期區間內：${data.trip.start} ～ ${data.trip.end}`);
    return false;
  }

  const flexibleTypes=["交通","航班","住宿"];
  if(!flexibleTypes.includes(type)){
    if(!start || !end){
      alert("景點／餐廳／購物等一般行程需填寫開始與結束時間。");
      return false;
    }
  }

  if(start && end){
    const s=v23TimeToMin(start), e=v23TimeToMin(end);
    if(e<s){
      alert("行程結束時間不可早於開始時間。");
      return false;
    }
  }
  return true;
}

function v28PlanId(prefix, parts){
  return [prefix].concat(parts||[]).map(x=>String(x||"").replace(/[^\w\u4e00-\u9fa5-]/g,"-")).join("-");
}

function v28NormalizeSourceFromLegacy(p){
  if(p.source) return p.source;
  if(p.sourceType==="flight" || p.memo==="由航班資料帶入") return "flight";
  if(p.sourceType==="hotel" || p.hotelId || p.memo==="由住宿資料帶入") return "hotel";
  return "manual";
}

function v28NormalizePlans(){
  const seen = new Set();
  (data.plans||[]).forEach((p, idx)=>{
    if(!p.id){
      p.id = uid();
    }
    if(seen.has(p.id)){
      p.id = uid();
    }
    seen.add(p.id);
    p.source = v28NormalizeSourceFromLegacy(p);
    if(!p.sourceType && p.source!=="manual") p.sourceType = p.source;
    if(!p.type || p.type==="undefined") p.type = normalizePlanType ? normalizePlanType(p.type) : "其他";
  });
}

function v28UpsertPlan(plan){
  if(!plan || !plan.id) return null;
  plan.type = normalizePlanType ? normalizePlanType(plan.type) : (plan.type || "其他");
  plan.source = plan.source || "manual";
  if(plan.source !== "manual") plan.sourceType = plan.source;
  const existing = data.plans.find(p=>p.id===plan.id);
  if(existing){
    // 保留使用者可編輯欄位：note/memo 若既有有內容，優先保留；來源資料只更新核心資訊。
    const keepNote = existing.note;
    const keepMemo = existing.memo;
    Object.assign(existing, plan);
    if(keepNote && keepNote !== plan.note) existing.note = keepNote;
    if(keepMemo && keepMemo !== plan.memo) existing.memo = keepMemo;
    existing.source = plan.source;
    existing.sourceType = plan.sourceType || plan.source;
    existing.lockedName = plan.lockedName ?? existing.lockedName;
    return existing.id;
  }else{
    const newPlan = {
      mode:"foreign",
      foreign:0,
      twd:0,
      payer:"未定",
      payMethod:"未定",
      note:"",
      memo:"",
      adjusted:false,
      ...plan
    };
    data.plans.push(newPlan);
    if(typeof createBudgetFromPlanSnapshot==="function"){
      createBudgetFromPlanSnapshot(newPlan);
    }
    return newPlan.id;
  }
}

function v28DeletePlansBySource(source, predicate){
  const removedIds = data.plans
    .filter(p=>p.source===source && (!predicate || predicate(p)))
    .map(p=>p.id);
  data.plans = data.plans.filter(p=>!removedIds.includes(p.id));
  data.conns = (data.conns||[]).filter(c=>!removedIds.includes(c.a) && !removedIds.includes(c.b));
}

function flightPlanTemplates(){
  const out=data.flights.out||{}, back=data.flights.back||{};
  const outDepDay=v16DateFromDT(out.dep)||data.trip.start;
  const outArrDay=v16DateFromDT(out.arr)||outDepDay;
  const backDepDay=v16DateFromDT(back.dep)||data.trip.end;
  const backArrDay=v16DateFromDT(back.arr)||backDepDay;

  return [
    {
      id:"flight-out-to-airport",
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:outDepDay,
      start:"14:00",
      end:v16TimeFromDT(out.dep),
      type:"交通",
      name:`前往 ${out.from||"出發機場"}`,
      note:out.toAirport||out.transfer||"",
      memo:"由航班資料帶入"
    },
    {
      id:"flight-out-plane",
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:outDepDay,
      start:v16TimeFromDT(out.dep),
      end:v16TimeFromDT(out.arr),
      type:"航班",
      name:`搭乘去程航班 ${out.no||""}`.trim() || "搭乘去程航班",
      note:`${out.from||""} → ${out.to||""}`,
      memo:"由航班資料帶入"
    },
    {
      id:"flight-out-arrival-transfer",
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:outArrDay,
      start:v16TimeFromDT(out.arr),
      end:"",
      type:"交通",
      name:`從 ${out.to||"降落機場"} 前往飯店／市區`,
      note:out.fromAirport||"",
      memo:"由航班資料帶入"
    },
    {
      id:"flight-back-to-airport",
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:backDepDay,
      start:"",
      end:v16TimeFromDT(back.dep),
      type:"交通",
      name:`從飯店前往 ${back.from||"回程機場"}`,
      note:back.toAirport||back.transfer||"",
      memo:"由航班資料帶入"
    },
    {
      id:"flight-back-plane",
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:backDepDay,
      start:v16TimeFromDT(back.dep),
      end:v16TimeFromDT(back.arr),
      type:"航班",
      name:`搭乘回程航班 ${back.no||""}`.trim() || "搭乘回程航班",
      note:`${back.from||""} → ${back.to||""}`,
      memo:"由航班資料帶入"
    },
    {
      id:"flight-back-home-transfer",
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:backArrDay,
      start:v16TimeFromDT(back.arr),
      end:"",
      type:"交通",
      name:`從 ${back.to||"抵達機場"} 回家`,
      note:back.fromAirport||"",
      memo:"由航班資料帶入"
    }
  ];
}

function v16AddFlightsToPlans(doRender=true){
  v28NormalizePlans();
  flightPlanTemplates().forEach(p=>v28UpsertPlan(p));
  if(doRender) save();
}

function removeFlightPlans(){
  v28DeletePlansBySource("flight");
  save();
  toast("已幫你移除航班行程囉！");
}

function saveFlights(){
  if(!v23ValidateFlightTimes())return;

  ["out","back"].forEach(k=>{
    const transferEl=$(k+"transfer");
    data.flights[k]={
      no:$(k+"no").value,
      from:$(k+"from").value,
      to:$(k+"to").value,
      dep:$(k+"dep").value,
      arr:$(k+"arr").value,
      transfer:transferEl?transferEl.value:"",
      toAirport:$(k+"toAirport")?$(k+"toAirport").value:"",
      fromAirport:$(k+"fromAirport")?$(k+"fromAirport").value:"",
      fromTerminal:$(k+"fromTerminal")?$(k+"fromTerminal").value:"",
      toTerminal:$(k+"toTerminal")?$(k+"toTerminal").value:""
    };
  });

  // 若航班行程已匯入，修改航班時直接更新既有行程，不新增重複資料。
  if(flightHasPlans()){
    flightPlanTemplates().forEach(p=>v28UpsertPlan(p));
  }

  silentSave();
  render();
  v16CollapseTripDetail(1);
  toast("已幫你存好航班囉！");
}

function hotelHasPlans(id){
  v28NormalizePlans();
  return data.plans.some(p=>p.source==="hotel" && p.hotelId==id);
}

function addHotelPlans(id){
  const h=data.hotels.find(x=>x.id==id);
  if(!h)return;
  v28NormalizePlans();
  // 先移除這間住宿舊節點，再以新版住宿日期重建，避免改日期後殘留舊節點。
  v28DeletePlansBySource("hotel", p=>p.hotelId==id);
  hotelPlanTemplates(h).forEach(p=>v28UpsertPlan(p));
  save();
  toast("已幫你同步住宿行程！");
}

function removeHotelPlans(id){
  v28DeletePlansBySource("hotel", p=>p.hotelId==id);
  save();
  toast("已移除住宿行程");
}

function saveHotel(){
  if(!$("hname").value)return toast("請輸入住宿名稱");
  let start=$("hstart").value;
  let end=$("hend").value;
  if(!v23ValidateHotelDates(start,end))return;

  const item={name:$("hname").value,start,end,addr:$("haddr").value,note:$("hnote").value};
  let hotelId=editingHotelId;
  let isNew=false;

  if(editingHotelId){
    Object.assign(data.hotels.find(x=>x.id==editingHotelId),item);
    editingHotelId=null;
  }else{
    isNew=true;
    hotelId=uid();
    data.hotels.push({id:hotelId,...item});
  }

  v18SortHotels();

  // 若此住宿行程已匯入，修改住宿時同步更新既有行程，不新增重複資料。
  if(!isNew && hotelHasPlans(hotelId)){
    addHotelPlans(hotelId);
  }else{
    v16KeepHotelOpen=true;
    silentSave();
    render();
  }

  v16OpenTripDetail(2);

  if(isNew){
    v21PendingHotelId=hotelId;
    $("hotelOptionModal").classList.add("show");
  }else{
    toast("已幫你存好住宿囉！");
  }
}

function delHotel(id){
  data.hotels=data.hotels.filter(h=>h.id!=id);
  // 刪除住宿時，自動刪除對應住宿行程。
  v28DeletePlansBySource("hotel", p=>p.hotelId==id);
  // 預算暫時維持獨立，不自動刪，避免誤刪已修改金額的花費。
  save();
}

function normalizeFlightObj(f, direction){
  f = f || {};
  if(Array.isArray(f.segments) && f.segments.length){
    const normalizedSegments = f.segments.map(s=>({
      no:s.no||"",
      from:s.from||"",
      to:s.to||"",
      dep:s.dep||"",
      arr:s.arr||""
    }));
    return {
      type: f.type || (normalizedSegments.length > 1 ? "transfer" : "direct"),
      segments: normalizedSegments,
      toAirport:f.toAirport||"",
      fromAirport:f.fromAirport||"",
      transfer:f.transfer||""
    };
  }

  return {
    type: "direct",
    segments: [{
      no:f.no||"",
      from:f.from||"",
      to:f.to||"",
      dep:f.dep||"",
      arr:f.arr||""
    }],
    toAirport:f.toAirport||f.transfer||"",
    fromAirport:f.fromAirport||"",
    transfer:f.transfer||""
  };
}

function flightTypeSelect(k, selected){
  return `<select id="${k}type" onchange="toggleFlightSegments('${k}')">
    <option value="direct" ${selected==="direct"?"selected":""}>直飛</option>
    <option value="transfer" ${selected==="transfer"?"selected":""}>轉機</option>
  </select>`;
}

function flightSegmentForm(k, idx, seg){
  seg = seg || {};
  return `<div class="segmentBox" id="${k}segBox${idx}">
    <div class="segmentTitle">第 ${idx+1} 段航班 <span>${idx===0?"第一段":"第二段／轉機後"}</span></div>
    <div class="three compactMobile">
      <div><label>航班號</label><input id="${k}s${idx}no" value="${esc(seg.no||"")}" placeholder="例：BX794"></div>
      <div><label>出發地 / 機場</label><input id="${k}s${idx}from" value="${esc(seg.from||"")}" placeholder="例：TPE 桃園"></div>
      <div><label>抵達地 / 機場</label><input id="${k}s${idx}to" value="${esc(seg.to||"")}" placeholder="例：PUS 金海"></div>
    </div>
    <div class="two">
      <div><label>起飛時間</label><input id="${k}s${idx}dep" type="datetime-local" value="${seg.dep||""}"></div>
      <div><label>抵達時間</label><input id="${k}s${idx}arr" type="datetime-local" value="${seg.arr||""}"></div>
    </div>
  </div>`;
}

function flightForm(k){
  const f=normalizeFlightObj(data.flights[k],k);
  const segs=[f.segments[0]||{}, f.segments[1]||{}];
  const isOut=k==="out";
  return `<div><label>航班型態</label>${flightTypeSelect(k,f.type||"direct")}<div class="flightTypeHint">直飛顯示 1 段；轉機固定顯示 2 段。每段航班都會各自產生一筆行程。</div></div>
  <div id="${k}segmentsWrap">
    ${flightSegmentForm(k,0,segs[0])}
    ${flightSegmentForm(k,1,segs[1])}
  </div>
  <label>${isOut?"如何抵達出發機場":"如何從旅遊地前往回程機場"}</label>
  <textarea id="${k}toAirport">${esc(f.toAirport||f.transfer||"")}</textarea>
  <label>${isOut?"如何從降落機場到旅遊地／飯店":"如何從抵達機場回家"}</label>
  <textarea id="${k}fromAirport">${esc(f.fromAirport||"")}</textarea>`;
}

function readFlightForm(k){
  const type=$(k+"type")?.value || "direct";
  const count=type==="transfer"?2:1;
  const segments=[];
  for(let i=0;i<count;i++){
    segments.push({
      no:$(k+"s"+i+"no")?.value||"",
      from:$(k+"s"+i+"from")?.value||"",
      to:$(k+"s"+i+"to")?.value||"",
      dep:$(k+"s"+i+"dep")?.value||"",
      arr:$(k+"s"+i+"arr")?.value||""
    });
  }
  return {
    type,
    segments,
    toAirport:$(k+"toAirport")?.value||"",
    fromAirport:$(k+"fromAirport")?.value||"",
    transfer:$(k+"toAirport")?.value||""
  };
}

function validateFlightSegments(){
  const out=readFlightForm("out");
  const back=readFlightForm("back");
  const all=[
    ...out.segments.map((s,i)=>({dir:"去程",idx:i+1,...s})),
    ...back.segments.map((s,i)=>({dir:"回程",idx:i+1,...s}))
  ];

  for(const s of all){
    const missing=[];
    if(!s.no)missing.push("航班號");
    if(!s.from)missing.push("出發地");
    if(!s.to)missing.push("抵達地");
    if(!s.dep)missing.push("起飛時間");
    if(!s.arr)missing.push("抵達時間");
    if(missing.length){
      alert(`${s.dir}第 ${s.idx} 段請填完整：${missing.join("、")}`);
      return false;
    }
    const dep=v23ParseDateTime(s.dep), arr=v23ParseDateTime(s.arr);
    if(!(dep<arr)){
      alert(`${s.dir}第 ${s.idx} 段的抵達時間需晚於起飛時間。`);
      return false;
    }
    const depDay=String(s.dep).split("T")[0], arrDay=String(s.arr).split("T")[0];
    if(!v23InTripRange(depDay) || !v23InTripRange(arrDay)){
      alert(`${s.dir}第 ${s.idx} 段航班日期需落在旅遊日期區間內：${data.trip.start} ～ ${data.trip.end}`);
      return false;
    }
  }

  for(let i=1;i<all.length;i++){
    const prevArr=v23ParseDateTime(all[i-1].arr);
    const curDep=v23ParseDateTime(all[i].dep);
    if(!(prevArr<curDep)){
      alert("請確認航班時間順序：每一段航班的起飛時間都必須晚於上一段的抵達時間。");
      return false;
    }
  }

  return true;
}

function saveFlights(){
  if(!validateFlightSegments())return;
  data.flights.out=readFlightForm("out");
  data.flights.back=readFlightForm("back");

  if(flightHasPlans()){
    syncFlightPlans();
  }

  silentSave();
  render();
  v16CollapseTripDetail(1);
  toast("已幫你存好航班囉！");
}

function flightPlanTemplates(){
  const out=normalizeFlightObj(data.flights.out,"out");
  const back=normalizeFlightObj(data.flights.back,"back");
  const templates=[];

  const firstOut=out.segments[0]||{};
  const lastOut=out.segments[out.segments.length-1]||{};
  const firstBack=back.segments[0]||{};
  const lastBack=back.segments[back.segments.length-1]||{};

  templates.push({
    id:"flight-out-to-airport",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:String(firstOut.dep||data.trip.start).split("T")[0],
    start:"14:00",
    end:v16TimeFromDT(firstOut.dep),
    type:"交通",
    name:`前往 ${firstOut.from||"出發機場"}`,
    note:out.toAirport||"",
    memo:"由航班資料帶入"
  });

  out.segments.forEach((s,i)=>{
    templates.push({
      id:`flight-out-seg-${i}`,
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:String(s.dep||data.trip.start).split("T")[0],
      start:v16TimeFromDT(s.dep),
      end:v16TimeFromDT(s.arr),
      type:"航班",
      name:`搭乘去程第 ${i+1} 段 ${s.no||""}`.trim(),
      note:`${s.from||""} → ${s.to||""}`,
      memo:"由航班資料帶入"
    });
  });

  templates.push({
    id:"flight-out-arrival-transfer",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:String(lastOut.arr||data.trip.start).split("T")[0],
    start:v16TimeFromDT(lastOut.arr),
    end:"",
    type:"交通",
    name:`從 ${lastOut.to||"降落機場"} 前往飯店／市區`,
    note:out.fromAirport||"",
    memo:"由航班資料帶入"
  });

  templates.push({
    id:"flight-back-to-airport",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:String(firstBack.dep||data.trip.end).split("T")[0],
    start:"",
    end:v16TimeFromDT(firstBack.dep),
    type:"交通",
    name:`從飯店前往 ${firstBack.from||"回程機場"}`,
    note:back.toAirport||"",
    memo:"由航班資料帶入"
  });

  back.segments.forEach((s,i)=>{
    templates.push({
      id:`flight-back-seg-${i}`,
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:String(s.dep||data.trip.end).split("T")[0],
      start:v16TimeFromDT(s.dep),
      end:v16TimeFromDT(s.arr),
      type:"航班",
      name:`搭乘回程第 ${i+1} 段 ${s.no||""}`.trim(),
      note:`${s.from||""} → ${s.to||""}`,
      memo:"由航班資料帶入"
    });
  });

  templates.push({
    id:"flight-back-home-transfer",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:String(lastBack.arr||data.trip.end).split("T")[0],
    start:v16TimeFromDT(lastBack.arr),
    end:"",
    type:"交通",
    name:`從 ${lastBack.to||"抵達機場"} 回家`,
    note:back.fromAirport||"",
    memo:"由航班資料帶入"
  });

  return templates;
}

function syncFlightPlans(){
  v28NormalizePlans();
  const templates=flightPlanTemplates();
  const keepIds=templates.map(p=>p.id);
  data.plans=data.plans.filter(p=>p.source!=="flight" || keepIds.includes(p.id));
  data.conns=(data.conns||[]).filter(c=>data.plans.some(p=>p.id===c.a)&&data.plans.some(p=>p.id===c.b));
  templates.forEach(p=>v28UpsertPlan(p));
}

function v16AddFlightsToPlans(doRender=true){
  syncFlightPlans();
  if(doRender) save();
}

function addFlightBudget(){
  if(flightHasBudget())return toast("航班預算已經記過囉！");
  const out=normalizeFlightObj(data.flights.out,"out");
  const back=normalizeFlightObj(data.flights.back,"back");
  const outNos=out.segments.map(s=>s.no).filter(Boolean).join("＋");
  const backNos=back.segments.map(s=>s.no).filter(Boolean).join("＋");
  const label=[outNos?`去程 ${outNos}`:"", backNos?`回程 ${backNos}`:""].filter(Boolean).join("／");

  data.expenses.push({
    id:uid(),
    sourceType:"flight",
    source:"航班",
    type:"機票",
    name: label ? `來回機票（${label}）` : "來回機票",
    payer:"未定",
    payMethod:"未定",
    day:"",
    mode:"TWD",
    foreign:0,
    twd:0,
    memo:"由航班資料帶入，可自行補金額"
  });
  save();
  toast("已幫你記一筆來回機票！");
}

const __renderTripBeforeV29 = renderTrip;
renderTrip = function(){
  __renderTripBeforeV29();
  afterRenderFlightForms();
};
function flightSegmentForm(k, idx, seg){
  seg = seg || {};
  const defaultOpen = idx===0 ? "open" : "";
  return `<details class="segmentBox" id="${k}segBox${idx}" ${defaultOpen}>
    <summary><div class="segmentTitle">第 ${idx+1} 段航班 <span>${idx===0?"第一段":"第二段／轉機後"}</span></div></summary>
    <div class="segmentInner">
      <div class="three compactMobile">
        <div><label>航班號</label><input id="${k}s${idx}no" value="${esc(seg.no||"")}" placeholder="例：BX794"></div>
        <div><label>出發地 / 機場</label><input id="${k}s${idx}from" value="${esc(seg.from||"")}" placeholder="例：TPE 桃園"></div>
        <div><label>抵達地 / 機場</label><input id="${k}s${idx}to" value="${esc(seg.to||"")}" placeholder="例：PUS 金海"></div>
      </div>
      <div class="two">
        <div><label>起飛時間</label><input id="${k}s${idx}dep" type="datetime-local" value="${seg.dep||""}"></div>
        <div><label>抵達時間</label><input id="${k}s${idx}arr" type="datetime-local" value="${seg.arr||""}"></div>
      </div>
    </div>
  </details>`;
}

function flightForm(k){
  const f=normalizeFlightObj(data.flights[k],k);
  const segs=[f.segments[0]||{}, f.segments[1]||{}];
  const isOut=k==="out";
  return `<div class="flightTransferBlock">
    <label>航班型態</label>${flightTypeSelect(k,f.type||"direct")}
    <div class="flightTypeHint">直飛顯示 1 段；轉機固定顯示 2 段。每段航班會各自產生一筆行程。</div>
    <div id="${k}segmentsWrap">
      ${flightSegmentForm(k,0,segs[0])}
      ${flightSegmentForm(k,1,segs[1])}
    </div>
    <label>${isOut?"如何抵達出發機場":"如何從旅遊地前往回程機場"}</label>
    <textarea id="${k}toAirport">${esc(f.toAirport||f.transfer||"")}</textarea>
    <label>${isOut?"如何從降落機場到旅遊地／飯店":"如何從抵達機場回家"}</label>
    <textarea id="${k}fromAirport">${esc(f.fromAirport||"")}</textarea>
  </div>`;
}

const __renderTripBeforeV30 = renderTrip;
renderTrip = function(){
  __renderTripBeforeV30();
  const flightDetails = Array.from(document.querySelectorAll("#tripView details.card"));
  const flightCard = flightDetails[1];
  if(flightCard){
    flightCard.classList.add("flightDense");
  }
  afterRenderFlightForms();
};
function airportOptionsList(){
  return [
    "台灣｜TPE 桃園國際機場",
    "台灣｜TSA 台北松山機場",
    "台灣｜KHH 高雄小港機場",
    "台灣｜RMQ 台中國際機場",
    "韓國｜PUS 釜山金海機場",
    "韓國｜ICN 首爾仁川機場",
    "韓國｜GMP 首爾金浦機場",
    "日本｜NRT 東京成田機場",
    "日本｜HND 東京羽田機場",
    "日本｜KIX 大阪關西機場",
    "日本｜FUK 福岡機場",
    "日本｜CTS 札幌新千歲機場",
    "日本｜NGO 名古屋中部機場",
    "香港｜HKG 香港國際機場",
    "新加坡｜SIN 樟宜機場",
    "泰國｜BKK 曼谷蘇凡納布機場",
    "泰國｜DMK 曼谷廊曼機場",
    "越南｜SGN 胡志明新山一機場",
    "越南｜HAN 河內內排機場",
    "馬來西亞｜KUL 吉隆坡國際機場",
    "菲律賓｜MNL 馬尼拉機場",
    "澳門｜MFM 澳門國際機場",
    "中國｜PVG 上海浦東機場",
    "中國｜SHA 上海虹橋機場",
    "中國｜PEK 北京首都機場",
    "中國｜PKX 北京大興機場",
    "中國｜CAN 廣州白雲機場",
    "中國｜SZX 深圳寶安機場",
    "美國｜LAX 洛杉磯機場",
    "美國｜SFO 舊金山機場",
    "美國｜JFK 紐約甘迺迪機場",
    "歐洲｜LHR 倫敦希斯洛機場",
    "歐洲｜CDG 巴黎戴高樂機場",
    "歐洲｜FRA 法蘭克福機場",
    "歐洲｜AMS 阿姆斯特丹史基浦機場",
    "歐洲｜VIE 維也納機場",
    "歐洲｜PRG 布拉格機場"
  ];
}

function airportDatalistHtml(){
  return `<datalist id="airportList">${airportOptionsList().map(a=>`<option value="${esc(a)}"></option>`).join("")}</datalist>`;
}

function terminalOptions(selected=""){
  const opts=["未定","T1","T2","T3","T4","T5","國際線航廈","國內線航廈","第一航廈","第二航廈","第三航廈","Satellite / 衛星航廈","其他"];
  const safe = selected || "未定";
  return opts.map(x=>`<option value="${x}" ${String(safe)===x?"selected":""}>${x}</option>`).join("");
}

function normalizeFlightObj(f, direction){
  f = f || {};
  if(Array.isArray(f.segments) && f.segments.length){
    const normalizedSegments = f.segments.map(s=>({
      no:s.no||"",
      from:s.from||"",
      to:s.to||"",
      dep:s.dep||"",
      arr:s.arr||"",
      fromTerminal:s.fromTerminal||"",
      toTerminal:s.toTerminal||""
    }));
    return {
      type: f.type || (normalizedSegments.length > 1 ? "transfer" : "direct"),
      segments: normalizedSegments,
      toAirport:f.toAirport||"",
      fromAirport:f.fromAirport||"",
      transfer:f.transfer||""
    };
  }

  return {
    type: "direct",
    segments: [{
      no:f.no||"",
      from:f.from||"",
      to:f.to||"",
      dep:f.dep||"",
      arr:f.arr||"",
      fromTerminal:f.fromTerminal||"",
      toTerminal:f.toTerminal||""
    }],
    toAirport:f.toAirport||f.transfer||"",
    fromAirport:f.fromAirport||"",
    transfer:f.transfer||""
  };
}

function flightSegmentForm(k, idx, seg){
  seg = seg || {};
  const defaultOpen = idx===0 ? "open" : "";
  return `<details class="segmentBox" id="${k}segBox${idx}" ${defaultOpen}>
    <summary><div class="segmentTitle">第 ${idx+1} 段航班 <span>${idx===0?"第一段":"第二段／轉機後"}</span></div></summary>
    <div class="segmentInner">
      <div class="three compactMobile">
        <div><label>航班號</label><input id="${k}s${idx}no" value="${esc(seg.no||"")}" placeholder="例：BX794"></div>
        <div><label>出發地 / 機場</label><input id="${k}s${idx}from" list="airportList" value="${esc(seg.from||"")}" placeholder="可選清單或自行輸入"></div>
        <div><label>抵達地 / 機場</label><input id="${k}s${idx}to" list="airportList" value="${esc(seg.to||"")}" placeholder="可選清單或自行輸入"></div>
      </div>
      <div class="terminalPair">
        <div><label>出發航廈</label><select id="${k}s${idx}fromTerminal">${terminalOptions(seg.fromTerminal||"未定")}</select></div>
        <div><label>抵達航廈</label><select id="${k}s${idx}toTerminal">${terminalOptions(seg.toTerminal||"未定")}</select></div>
      </div>
      <div class="two">
        <div><label>起飛時間</label><input id="${k}s${idx}dep" type="datetime-local" value="${seg.dep||""}"></div>
        <div><label>抵達時間</label><input id="${k}s${idx}arr" type="datetime-local" value="${seg.arr||""}"></div>
      </div>
      <div class="airportQuickHint">機場清單已優先放台灣與亞洲常用機場；找不到也可以直接手動輸入。</div>
    </div>
  </details>`;
}

function flightForm(k){
  const f=normalizeFlightObj(data.flights[k],k);
  const segs=[f.segments[0]||{}, f.segments[1]||{}];
  const isOut=k==="out";
  return `<div class="flightTransferBlock">
    ${airportDatalistHtml()}
    <label>航班型態</label>${flightTypeSelect(k,f.type||"direct")}
    <div class="flightTypeHint">直飛顯示 1 段；轉機固定顯示 2 段。每段航班會各自產生一筆行程。</div>
    <div id="${k}segmentsWrap">
      ${flightSegmentForm(k,0,segs[0])}
      ${flightSegmentForm(k,1,segs[1])}
    </div>
    <label>${isOut?"如何抵達出發機場":"如何從旅遊地前往回程機場"}</label>
    <textarea id="${k}toAirport">${esc(f.toAirport||f.transfer||"")}</textarea>
    <label>${isOut?"如何從降落機場到旅遊地／飯店":"如何從抵達機場回家"}</label>
    <textarea id="${k}fromAirport">${esc(f.fromAirport||"")}</textarea>
  </div>`;
}

function readFlightForm(k){
  const type=$(k+"type")?.value || "direct";
  const count=type==="transfer"?2:1;
  const segments=[];
  for(let i=0;i<count;i++){
    segments.push({
      no:$(k+"s"+i+"no")?.value||"",
      from:$(k+"s"+i+"from")?.value||"",
      to:$(k+"s"+i+"to")?.value||"",
      dep:$(k+"s"+i+"dep")?.value||"",
      arr:$(k+"s"+i+"arr")?.value||"",
      fromTerminal:$(k+"s"+i+"fromTerminal")?.value||"",
      toTerminal:$(k+"s"+i+"toTerminal")?.value||""
    });
  }
  return {
    type,
    segments,
    toAirport:$(k+"toAirport")?.value||"",
    fromAirport:$(k+"fromAirport")?.value||"",
    transfer:$(k+"toAirport")?.value||""
  };
}

function terminalNote(s){
  const fromT=s.fromTerminal && s.fromTerminal!=="未定" ? `出發航廈：${s.fromTerminal}` : "";
  const toT=s.toTerminal && s.toTerminal!=="未定" ? `抵達航廈：${s.toTerminal}` : "";
  return [fromT,toT].filter(Boolean).join("｜");
}

function flightPlanTemplates(){
  const out=normalizeFlightObj(data.flights.out,"out");
  const back=normalizeFlightObj(data.flights.back,"back");
  const templates=[];

  const firstOut=out.segments[0]||{};
  const lastOut=out.segments[out.segments.length-1]||{};
  const firstBack=back.segments[0]||{};
  const lastBack=back.segments[back.segments.length-1]||{};

  templates.push({
    id:"flight-out-to-airport",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:String(firstOut.dep||data.trip.start).split("T")[0],
    start:"14:00",
    end:v16TimeFromDT(firstOut.dep),
    type:"交通",
    name:`前往 ${firstOut.from||"出發機場"}`,
    note:out.toAirport||"",
    memo:"由航班資料帶入"
  });

  out.segments.forEach((s,i)=>{
    templates.push({
      id:`flight-out-seg-${i}`,
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:String(s.dep||data.trip.start).split("T")[0],
      start:v16TimeFromDT(s.dep),
      end:v16TimeFromDT(s.arr),
      type:"航班",
      name:`搭乘去程第 ${i+1} 段 ${s.no||""}`.trim(),
      note:[`${s.from||""} → ${s.to||""}`, terminalNote(s)].filter(Boolean).join("\n"),
      memo:"由航班資料帶入"
    });
  });

  templates.push({
    id:"flight-out-arrival-transfer",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:String(lastOut.arr||data.trip.start).split("T")[0],
    start:v16TimeFromDT(lastOut.arr),
    end:"",
    type:"交通",
    name:`從 ${lastOut.to||"降落機場"} 前往飯店／市區`,
    note:out.fromAirport||"",
    memo:"由航班資料帶入"
  });

  templates.push({
    id:"flight-back-to-airport",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:String(firstBack.dep||data.trip.end).split("T")[0],
    start:"",
    end:v16TimeFromDT(firstBack.dep),
    type:"交通",
    name:`從飯店前往 ${firstBack.from||"回程機場"}`,
    note:back.toAirport||"",
    memo:"由航班資料帶入"
  });

  back.segments.forEach((s,i)=>{
    templates.push({
      id:`flight-back-seg-${i}`,
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:String(s.dep||data.trip.end).split("T")[0],
      start:v16TimeFromDT(s.dep),
      end:v16TimeFromDT(s.arr),
      type:"航班",
      name:`搭乘回程第 ${i+1} 段 ${s.no||""}`.trim(),
      note:[`${s.from||""} → ${s.to||""}`, terminalNote(s)].filter(Boolean).join("\n"),
      memo:"由航班資料帶入"
    });
  });

  templates.push({
    id:"flight-back-home-transfer",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:String(lastBack.arr||data.trip.end).split("T")[0],
    start:v16TimeFromDT(lastBack.arr),
    end:"",
    type:"交通",
    name:`從 ${lastBack.to||"抵達機場"} 回家`,
    note:back.fromAirport||"",
    memo:"由航班資料帶入"
  });

  return templates;
}
function flightForm(k){
  const f=normalizeFlightObj(data.flights[k],k);
  const segs=[f.segments[0]||{}, f.segments[1]||{}];
  const isOut=k==="out";
  return `<div class="flightTransferBlock">
    ${airportDatalistHtml()}
    <label>航班型態</label>${flightTypeSelect(k,f.type||"direct")}
    <div class="flightTypeHint">直飛 1 段，轉機 2 段；航班日期允許落在出發日前 3 天～回程日後 3 天。</div>
    <div id="${k}segmentsWrap">
      ${flightSegmentForm(k,0,segs[0])}
      ${flightSegmentForm(k,1,segs[1])}
    </div>
    <label>${isOut?"抵達出發機場方式":"前往回程機場方式"}</label>
    <textarea id="${k}toAirport" placeholder="${isOut?"例：14:00 從家出發，搭機捷到桃園機場":"例：從飯店搭地鐵／計程車到機場"}">${esc(f.toAirport||f.transfer||"")}</textarea>
    <label>${isOut?"降落後到市區／飯店":"抵達後回家方式"}</label>
    <textarea id="${k}fromAirport" placeholder="${isOut?"例：金海機場搭輕軌轉地鐵到飯店":"例：抵達桃園後搭機捷／接送回家"}">${esc(f.fromAirport||"")}</textarea>
  </div>`;
}

function validateFlightSegments(){
  const out=readFlightForm("out");
  const back=readFlightForm("back");
  const all=[
    ...out.segments.map((s,i)=>({dir:"去程",idx:i+1,...s})),
    ...back.segments.map((s,i)=>({dir:"回程",idx:i+1,...s}))
  ];

  for(const s of all){
    const missing=[];
    if(!s.no)missing.push("航班號");
    if(!s.from)missing.push("出發地");
    if(!s.to)missing.push("抵達地");
    if(!s.dep)missing.push("起飛時間");
    if(!s.arr)missing.push("抵達時間");
    if(missing.length){
      alert(`${s.dir}第 ${s.idx} 段請填完整：${missing.join("、")}`);
      return false;
    }
    const dep=v23ParseDateTime(s.dep), arr=v23ParseDateTime(s.arr);
    if(!(dep<arr)){
      alert(`${s.dir}第 ${s.idx} 段的抵達時間需晚於起飛時間。`);
      return false;
    }
    const depDay=String(s.dep).split("T")[0], arrDay=String(s.arr).split("T")[0];
    if(!v32InFlightDateRange(depDay) || !v32InFlightDateRange(arrDay)){
      alert(`${s.dir}第 ${s.idx} 段航班日期可填：${v32FlightDateRangeText()}\n\n這個範圍比旅行日期前後各多 3 天，用來支援跨時區與跨日航班。`);
      return false;
    }
  }

  for(let i=1;i<all.length;i++){
    const prevArr=v23ParseDateTime(all[i-1].arr);
    const curDep=v23ParseDateTime(all[i].dep);
    if(!(prevArr<curDep)){
      alert("請確認航班時間順序：每一段航班的起飛時間都必須晚於上一段的抵達時間。");
      return false;
    }
  }

  return true;
}

function flightSegmentForm(k, idx, seg){
  seg = seg || {};
  const defaultOpen = idx===0 ? "open" : "";
  return `<details class="segmentBox" id="${k}segBox${idx}" ${defaultOpen}>
    <summary><div class="segmentTitle">第 ${idx+1} 段航班 <span>${idx===0?"第一段":"第二段／轉機後"}</span></div></summary>
    <div class="segmentInner">
      <div class="three compactMobile">
        <div><label>航班號</label><input id="${k}s${idx}no" value="${esc(seg.no||"")}" placeholder="例：BX794"></div>
        <div><label>出發地 / 機場</label><input id="${k}s${idx}from" list="airportList" value="${esc(seg.from||"")}" placeholder="可選或輸入"></div>
        <div><label>抵達地 / 機場</label><input id="${k}s${idx}to" list="airportList" value="${esc(seg.to||"")}" placeholder="可選或輸入"></div>
      </div>
      <div class="terminalPair">
        <div><label>出發航廈</label><select id="${k}s${idx}fromTerminal">${terminalOptions(seg.fromTerminal||"未定")}</select></div>
        <div><label>抵達航廈</label><select id="${k}s${idx}toTerminal">${terminalOptions(seg.toTerminal||"未定")}</select></div>
      </div>
      <div class="two">
        <div><label>起飛時間</label><input id="${k}s${idx}dep" type="datetime-local" value="${seg.dep||""}"></div>
        <div><label>抵達時間</label><input id="${k}s${idx}arr" type="datetime-local" value="${seg.arr||""}"></div>
      </div>
      <div class="airportQuickHint">台灣與亞洲機場優先列出；找不到可手動輸入。</div>
    </div>
  </details>`;
}
function v15CountryCityMaps(){
  return {
    cityMap:{
      "韓國":["釜山","首爾","濟州","大邱","仁川","自訂"],
      "日本":["東京","大阪","京都","福岡","札幌","沖繩","名古屋","自訂"],
      "中國":["上海","北京","廣州","深圳","杭州","成都","重慶","西安","青島","廈門","南京","蘇州","自訂"],
      "香港":["香港"],
      "新加坡":["新加坡"],
      "泰國":["曼谷","清邁","普吉","自訂"],
      "越南":["胡志明","河內","峴港","自訂"],
      "美國":["紐約","洛杉磯","舊金山","西雅圖","拉斯維加斯","自訂"],
      "歐洲":["自訂"],
      "英國":["倫敦","曼徹斯特","愛丁堡","自訂"],
      "其他":["自訂"]
    }
  };
}

function v15CityOptions(selected=""){
  const list=(v15CountryCityMaps().cityMap[$("country")?.value || data.trip.country] || ["自訂"]);
  const safeSelected = selected && list.includes(selected) ? selected : (list[0] || "自訂");
  return list.map(c=>`<option value="${c}" ${c===safeSelected?"selected":""}>${c}</option>`).join("");
}

function v15CurrentCity(){
  const city=data.trip.city || "";
  if(city)return city;
  const dest=data.trip.dest || "";
  const country=data.trip.country || "";
  return dest.replace(country,"").trim() || (v15CountryCityMaps().cityMap[country]?.[0] || "");
}

function v15DestinationName(country, city){
  if(country==="香港" || country==="新加坡")return country;
  if(country==="其他"){
    return city || "自訂目的地";
  }
  return `${country}${city||""}`;
}

function updateDestByCity(){
  updateCustomCityVisibility();
  countryChanged();
}

function refreshCityOptions(){
  const citySel=$("citySelect");
  if(!citySel)return;
  const list = v15CountryCityMaps().cityMap[$("country").value] || ["自訂"];
  citySel.innerHTML = v15CityOptions(list[0] || "自訂");
  const custom=$("cityCustom");
  if(custom)custom.value="";
  updateCustomCityVisibility();
  countryChanged();
}

function countryChanged(){
  const c=$("country")?.value || data.trip.country;
  if($("currency") && currencyMap[c]){
    $("currency").value=currencyMap[c];
  }
  if($("rateSetup") && currencyMap[c]){
    $("rateSetup").value=rateMap[currencyMap[c]]||data.trip.rate;
  }
  const citySel=$("citySelect");
  const custom=$("cityCustom");
  if(citySel){
    const city=citySel.value==="自訂" ? (custom?.value || "") : citySel.value;
    const dest=v15DestinationName(c, city);
    const destInput=$("dest");
    if(destInput)destInput.value=dest;
  }
}
function flightPlanTemplates(){
  const out=normalizeFlightObj(data.flights.out,"out");
  const back=normalizeFlightObj(data.flights.back,"back");
  const templates=[];

  const outSegs=(out.segments && out.segments.length ? out.segments : [{}]);
  const backSegs=(back.segments && back.segments.length ? back.segments : [{}]);
  const firstOut=outSegs[0]||{};
  const lastOut=outSegs[outSegs.length-1]||{};
  const firstBack=backSegs[0]||{};
  const lastBack=backSegs[backSegs.length-1]||{};

  templates.push({
    id:"flight-out-to-airport",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:v36DateFromDT(firstOut.dep, data.trip.start),
    start:"",
    end:v36TimeFromDT(firstOut.dep),
    type:"交通",
    name:`出發去 ${firstOut.from||"機場"}`,
    note:out.toAirport||"",
    memo:"由航班資料帶入"
  });

  outSegs.forEach((s,i)=>{
    templates.push({
      id:`flight-out-seg-${i}`,
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:v36DateFromDT(s.dep, data.trip.start),
      start:v36TimeFromDT(s.dep),
      end:v36TimeFromDT(s.arr),
      type:"航班",
      name:v36FlightName("out", i, outSegs.length, s.no||""),
      note:[`${s.from||""} → ${s.to||""}`, terminalNote(s)].filter(Boolean).join("\n"),
      memo:"由航班資料帶入"
    });
  });

  templates.push({
    id:"flight-out-arrival-transfer",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:v36DateFromDT(lastOut.arr, data.trip.start),
    start:v36TimeFromDT(lastOut.arr),
    end:"",
    type:"交通",
    name:`從 ${lastOut.to||"抵達機場"} 前往市區／飯店`,
    note:out.fromAirport||"",
    memo:"由航班資料帶入"
  });

  templates.push({
    id:"flight-back-to-airport",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:v36DateFromDT(firstBack.dep, data.trip.end),
    start:"",
    end:v36TimeFromDT(firstBack.dep),
    type:"交通",
    name:`從飯店前往 ${firstBack.from||"回程機場"}`,
    note:back.toAirport||"",
    memo:"由航班資料帶入"
  });

  backSegs.forEach((s,i)=>{
    templates.push({
      id:`flight-back-seg-${i}`,
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:v36DateFromDT(s.dep, data.trip.end),
      start:v36TimeFromDT(s.dep),
      end:v36TimeFromDT(s.arr),
      type:"航班",
      name:v36FlightName("back", i, backSegs.length, s.no||""),
      note:[`${s.from||""} → ${s.to||""}`, terminalNote(s)].filter(Boolean).join("\n"),
      memo:"由航班資料帶入"
    });
  });

  templates.push({
    id:"flight-back-home-transfer",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:v36DateFromDT(lastBack.arr, data.trip.end),
    start:v36TimeFromDT(lastBack.arr),
    end:"",
    type:"交通",
    name:`從 ${lastBack.to||"抵達機場"} 回家`,
    note:back.fromAirport||"",
    memo:"由航班資料帶入"
  });

  return templates;
}

function syncFlightPlans(){
  v28NormalizePlans();
  const templates=flightPlanTemplates();
  const keepIds=templates.map(p=>p.id);
  data.plans=data.plans.filter(p=>p.source!=="flight" || keepIds.includes(p.id));
  data.conns=(data.conns||[]).filter(c=>data.plans.some(p=>p.id===c.a)&&data.plans.some(p=>p.id===c.b));
  templates.forEach(p=>v28UpsertPlan(p));
}

function v16AddFlightsToPlans(doRender=true){
  syncFlightPlans();
  if(doRender) save();
  toast("已幫你把航班帶入行程囉！");
}

function saveFlights(){
  if(!validateFlightSegments())return;
  data.flights.out=readFlightForm("out");
  data.flights.back=readFlightForm("back");

  if(flightHasPlans()){
    syncFlightPlans();
  }

  silentSave();
  render();
  v16CollapseTripDetail(1);
  toast("已幫你存好航班囉！");
}
function flightSegmentForm(k, idx, seg){
  seg = seg || {};
  const defaultOpen = idx===0 ? "open" : "";
  const fromId=`${k}s${idx}from`;
  const toId=`${k}s${idx}to`;
  return `<details class="segmentBox" id="${k}segBox${idx}" ${defaultOpen}>
    <summary><div class="segmentTitle">第 ${idx+1} 段航班 <span>${idx===0?"第一段":"第二段／轉機後"}</span></div></summary>
    <div class="segmentInner">

      <div class="flightDesktopOnly">
        <div class="three compactMobile">
          <div><label>航班號</label><input id="${k}s${idx}no" value="${esc(seg.no||"")}" placeholder="例：BX794"></div>
          <div><label>出發地 / 機場</label><input id="${fromId}" list="airportList" value="${esc(seg.from||"")}" placeholder="可選清單或自行輸入"></div>
          <div><label>抵達地 / 機場</label><input id="${toId}" list="airportList" value="${esc(seg.to||"")}" placeholder="可選清單或自行輸入"></div>
        </div>
        <div class="terminalPair">
          <div><label>出發航廈</label><select id="${k}s${idx}fromTerminal">${terminalOptions(seg.fromTerminal||"未定")}</select></div>
          <div><label>抵達航廈</label><select id="${k}s${idx}toTerminal">${terminalOptions(seg.toTerminal||"未定")}</select></div>
        </div>
        <div class="two">
          <div><label>起飛時間</label><input id="${k}s${idx}dep" type="datetime-local" value="${seg.dep||""}"></div>
          <div><label>抵達時間</label><input id="${k}s${idx}arr" type="datetime-local" value="${seg.arr||""}"></div>
        </div>
      </div>

      <div class="flightMobileOnly">
        <div class="mobileAirportGrid">
          <div><label>航班號</label><input id="${k}s${idx}noM" value="${esc(seg.no||"")}" placeholder="例：BX794"></div>
          <div><label>出發地 / 機場</label>${v38AirportSelectHtml(`${k}s${idx}fromM`, seg.from||"")}</div>
          <div><label>抵達地 / 機場</label>${v38AirportSelectHtml(`${k}s${idx}toM`, seg.to||"")}</div>
          <div><label>出發航廈</label>${v38TerminalSelectHtml(`${k}s${idx}fromTerminalM`, seg.fromTerminal||"未定")}</div>
          <div><label>抵達航廈</label>${v38TerminalSelectHtml(`${k}s${idx}toTerminalM`, seg.toTerminal||"未定")}</div>
        </div>
        <div class="mobileTimeGrid">
          <div>
            <label>起飛時間</label>
            <div class="mobileTimePair">
              <div><input id="${k}s${idx}depDateM" type="date" value="${v38DatePart(seg.dep)}"></div>
              <div><input id="${k}s${idx}depTimeM" type="time" value="${v38TimePart(seg.dep)}"></div>
            </div>
          </div>
          <div>
            <label>抵達時間</label>
            <div class="mobileTimePair">
              <div><input id="${k}s${idx}arrDateM" type="date" value="${v38DatePart(seg.arr)}"></div>
              <div><input id="${k}s${idx}arrTimeM" type="time" value="${v38TimePart(seg.arr)}"></div>
            </div>
          </div>
        </div>
        <div class="mobileFieldNote">手機版將日期與時間分開填，儲存後仍會寫回原本航班時間欄位。</div>
      </div>

      <div class="airportQuickHint">台灣與亞洲機場優先列出；找不到可手動輸入。</div>
    </div>
  </details>`;
}

function readFlightForm(k){
  const type=$(k+"type")?.value || "direct";
  const count=type==="transfer"?2:1;
  const segments=[];
  const mobile=v38IsMobileFlightUI();

  for(let i=0;i<count;i++){
    if(mobile){
      segments.push({
        no:$(k+"s"+i+"noM")?.value||"",
        from:v38GetAirportValue(`${k}s${i}fromM`),
        to:v38GetAirportValue(`${k}s${i}toM`),
        dep:v38JoinDateTime(`${k}s${i}depDateM`,`${k}s${i}depTimeM`),
        arr:v38JoinDateTime(`${k}s${i}arrDateM`,`${k}s${i}arrTimeM`),
        fromTerminal:$(k+"s"+i+"fromTerminalM")?.value||"",
        toTerminal:$(k+"s"+i+"toTerminalM")?.value||""
      });
    }else{
      segments.push({
        no:$(k+"s"+i+"no")?.value||"",
        from:$(k+"s"+i+"from")?.value||"",
        to:$(k+"s"+i+"to")?.value||"",
        dep:$(k+"s"+i+"dep")?.value||"",
        arr:$(k+"s"+i+"arr")?.value||"",
        fromTerminal:$(k+"s"+i+"fromTerminal")?.value||"",
        toTerminal:$(k+"s"+i+"toTerminal")?.value||""
      });
    }
  }

  return {
    type,
    segments,
    toAirport:$(k+"toAirport")?.value||"",
    fromAirport:$(k+"fromAirport")?.value||"",
    transfer:$(k+"toAirport")?.value||""
  };
}
let v39FlightDirty = false;

function v39ParseLocalDT(dt){
  if(!dt)return null;
  const [d,t] = String(dt).split("T");
  if(!d || !t)return null;
  const [y,m,day]=d.split("-").map(Number);
  const [hh,mm]=t.split(":").map(Number);
  if(!y||!m||!day||!Number.isFinite(hh)||!Number.isFinite(mm))return null;
  return new Date(y,m-1,day,hh,mm,0,0);
}
function v39Pad(n){return String(n).padStart(2,"0")}
function v39FormatDate(d){
  if(!d)return "";
  return `${d.getFullYear()}-${v39Pad(d.getMonth()+1)}-${v39Pad(d.getDate())}`;
}
function v39FormatTime(d){
  if(!d)return "";
  return `${v39Pad(d.getHours())}:${v39Pad(d.getMinutes())}`;
}
function v39AddMinutes(dt, minutes){
  const d=v39ParseLocalDT(dt);
  if(!d)return null;
  return new Date(d.getTime()+minutes*60000);
}
function v39DateFromDT(dt, fallback){
  const d=v39ParseLocalDT(dt);
  return d ? v39FormatDate(d) : (fallback || data.trip.start);
}
function v39TimeFromDT(dt){
  const d=v39ParseLocalDT(dt);
  return d ? v39FormatTime(d) : "";
}
function v39DateFromDateObj(d, fallback){
  return d ? v39FormatDate(d) : (fallback || data.trip.start);
}
function v39TimeFromDateObj(d){
  return d ? v39FormatTime(d) : "";
}

function v39FlightSnapshotFromData(){
  return JSON.stringify({
    out: normalizeFlightObj(data.flights.out,"out"),
    back: normalizeFlightObj(data.flights.back,"back")
  });
}
function v39FlightSnapshotFromForm(){
  try{
    return JSON.stringify({
      out: readFlightForm("out"),
      back: readFlightForm("back")
    });
  }catch(e){
    return "";
  }
}
function v39SavedFlightReady(){
  const out=normalizeFlightObj(data.flights.out,"out");
  const back=normalizeFlightObj(data.flights.back,"back");
  const all=[...(out.segments||[]),...(back.segments||[])];
  if(!all.length)return false;
  return all.every(s=>s.no && s.from && s.to && s.dep && s.arr);
}
function v39MarkFlightDirty(){
  const formSig=v39FlightSnapshotFromForm();
  const dataSig=v39FlightSnapshotFromData();
  v39FlightDirty = !!formSig && formSig !== dataSig;
  v39RenderFlightStatusOnly();
}
function v39CanUseFlightActions(){
  return !v39FlightDirty && v39SavedFlightReady();
}

function flightStatusInnerHtml(){
  const hasP=flightHasPlans();
  const hasB=flightHasBudget();
  const canUse=v39CanUseFlightActions();
  const stateText = v39FlightDirty ? "有尚未儲存的航班修改" : (v39SavedFlightReady() ? "航班已儲存" : "請先填寫並存好航班");
  const stateClass = v39FlightDirty ? "warn" : (v39SavedFlightReady() ? "" : "off");
  const disabledAttr = canUse ? "" : "disabled";
  const actionHint = v39FlightDirty
    ? "請先按「存好航班設定」，再帶入行程或預算。"
    : (v39SavedFlightReady() ? "可選擇是否帶入行程或記一筆來回機票。" : "航班資料存好後，才會開放帶入行程與預算。");

  return `
    <div class="flightSavedHint"><span class="flightStatusSaved ${stateClass}">${stateText}</span><br>${actionHint}</div>
    <div class="flightStatusGrid">
      <div class="flightStatusItem"><b>行程</b><span class="${hasP?"ok":""}">${hasP?"已帶入行程":"尚未帶入行程"}</span></div>
      <div class="flightStatusItem"><b>機票預算</b><span class="${hasB?"ok":""}">${hasB?"已記錄預算":"尚未記錄預算"}</span></div>
    </div>
    <div class="flightStatusActions">
      ${hasP
        ? `<button class="btn soft compact" ${disabledAttr} onclick="removeFlightPlans()">移除航班行程</button>`
        : `<button class="btn blue compact" ${disabledAttr} onclick="v16AddFlightsToPlans(true)">帶入行程</button>`}
      ${hasB
        ? `<button class="btn soft compact" ${disabledAttr} onclick="removeFlightBudget()">移除機票預算</button>`
        : `<button class="btn pink compact" ${disabledAttr} onclick="addFlightBudget()">記一筆來回機票</button>`}
    </div>`;
}

function flightStatusHtml(){
  return `<div class="flightStatusBox" id="flightStatusMount">${flightStatusInnerHtml()}</div>`;
}

function v39RenderFlightStatusOnly(){
  const mount=$("flightStatusMount");
  if(mount)mount.innerHTML=flightStatusInnerHtml();
}

document.addEventListener("input", function(e){
  if(e.target && e.target.closest && e.target.closest("#tripView .flightDense")){
    v39MarkFlightDirty();
  }
}, true);
document.addEventListener("change", function(e){
  if(e.target && e.target.closest && e.target.closest("#tripView .flightDense")){
    v39MarkFlightDirty();
  }
}, true);

function v39FlightName(direction, idx, segCount, no){
  const isOut = direction === "out";
  if(segCount <= 1){
    return isOut ? `搭乘去程飛機${no ? " " + no : ""}` : `搭乘回程飛機${no ? " " + no : ""}`;
  }
  return isOut ? `搭乘去程第 ${idx+1} 段飛機${no ? " " + no : ""}` : `搭乘回程第 ${idx+1} 段飛機${no ? " " + no : ""}`;
}

function flightPlanTemplates(){
  const out=normalizeFlightObj(data.flights.out,"out");
  const back=normalizeFlightObj(data.flights.back,"back");
  const templates=[];

  const outSegs=(out.segments && out.segments.length ? out.segments : [{}]);
  const backSegs=(back.segments && back.segments.length ? back.segments : [{}]);
  const firstOut=outSegs[0]||{};
  const lastOut=outSegs[outSegs.length-1]||{};
  const firstBack=backSegs[0]||{};
  const lastBack=backSegs[backSegs.length-1]||{};

  const outAirportArrive = v39AddMinutes(firstOut.dep, -120);
  const outCityEnd = v39AddMinutes(lastOut.arr, 60);
  const backAirportArrive = v39AddMinutes(firstBack.dep, -120);
  const backHomeEnd = v39AddMinutes(lastBack.arr, 60);

  // 去程：出發去機場，結束時間 = 起飛前 2 小時
  templates.push({
    id:"flight-out-to-airport",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:v39DateFromDateObj(outAirportArrive, v39DateFromDT(firstOut.dep, data.trip.start)),
    start:"",
    end:v39TimeFromDateObj(outAirportArrive),
    type:"交通",
    name:`出發去 ${firstOut.from||"機場"}`,
    note:out.toAirport||"",
    memo:"由航班資料帶入"
  });

  // 去程：每段航班，起訖時間 = 航班起飛 / 抵達時間
  outSegs.forEach((s,i)=>{
    templates.push({
      id:`flight-out-seg-${i}`,
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:v39DateFromDT(s.dep, data.trip.start),
      start:v39TimeFromDT(s.dep),
      end:v39TimeFromDT(s.arr),
      type:"航班",
      name:v39FlightName("out", i, outSegs.length, s.no||""),
      note:[`${s.from||""} → ${s.to||""}`, terminalNote(s)].filter(Boolean).join("\n"),
      memo:"由航班資料帶入"
    });
  });

  // 去程：抵達機場去市區 / 飯店，開始 = 航班抵達，結束 = +1 小時
  templates.push({
    id:"flight-out-arrival-transfer",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:v39DateFromDT(lastOut.arr, data.trip.start),
    start:v39TimeFromDT(lastOut.arr),
    end:v39TimeFromDateObj(outCityEnd),
    type:"交通",
    name:`從 ${lastOut.to||"抵達機場"} 前往市區／飯店`,
    note:out.fromAirport||"",
    memo:"由航班資料帶入"
  });

  // 回程：從飯店去回程機場，結束時間 = 起飛前 2 小時
  templates.push({
    id:"flight-back-to-airport",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:v39DateFromDateObj(backAirportArrive, v39DateFromDT(firstBack.dep, data.trip.end)),
    start:"",
    end:v39TimeFromDateObj(backAirportArrive),
    type:"交通",
    name:`從飯店前往 ${firstBack.from||"回程機場"}`,
    note:back.toAirport||"",
    memo:"由航班資料帶入"
  });

  // 回程：每段航班
  backSegs.forEach((s,i)=>{
    templates.push({
      id:`flight-back-seg-${i}`,
      source:"flight",
      sourceType:"flight",
      lockedName:true,
      day:v39DateFromDT(s.dep, data.trip.end),
      start:v39TimeFromDT(s.dep),
      end:v39TimeFromDT(s.arr),
      type:"航班",
      name:v39FlightName("back", i, backSegs.length, s.no||""),
      note:[`${s.from||""} → ${s.to||""}`, terminalNote(s)].filter(Boolean).join("\n"),
      memo:"由航班資料帶入"
    });
  });

  // 回程：抵達後回家，開始 = 航班抵達，結束 = +1 小時
  templates.push({
    id:"flight-back-home-transfer",
    source:"flight",
    sourceType:"flight",
    lockedName:true,
    day:v39DateFromDT(lastBack.arr, data.trip.end),
    start:v39TimeFromDT(lastBack.arr),
    end:v39TimeFromDateObj(backHomeEnd),
    type:"交通",
    name:`從 ${lastBack.to||"抵達機場"} 回家`,
    note:back.fromAirport||"",
    memo:"由航班資料帶入"
  });

  return templates;
}

function syncFlightPlans(){
  v28NormalizePlans();
  const templates=flightPlanTemplates();
  const keepIds=templates.map(p=>p.id);
  data.plans=data.plans.filter(p=>p.source!=="flight" || keepIds.includes(p.id));
  data.conns=(data.conns||[]).filter(c=>data.plans.some(p=>p.id===c.a)&&data.plans.some(p=>p.id===c.b));
  templates.forEach(p=>v28UpsertPlan(p));
}

function v16AddFlightsToPlans(doRender=true){
  if(!v39CanUseFlightActions()){
    toast(v39FlightDirty ? "請先存好航班設定" : "請先填寫並存好航班");
    return;
  }
  syncFlightPlans();
  if(doRender) save();
  toast("已幫你把航班帶入行程囉！");
}

function addFlightBudget(){
  if(!v39CanUseFlightActions()){
    toast(v39FlightDirty ? "請先存好航班設定" : "請先填寫並存好航班");
    return;
  }
  if(flightHasBudget())return toast("航班預算已經記過囉！");
  const out=normalizeFlightObj(data.flights.out,"out");
  const back=normalizeFlightObj(data.flights.back,"back");
  const outNos=out.segments.map(s=>s.no).filter(Boolean).join("＋");
  const backNos=back.segments.map(s=>s.no).filter(Boolean).join("＋");
  const label=[outNos?`去程 ${outNos}`:"", backNos?`回程 ${backNos}`:""].filter(Boolean).join("／");

  data.expenses.push({
    id:uid(),
    sourceType:"flight",
    source:"航班",
    type:"機票",
    name: label ? `來回機票（${label}）` : "來回機票",
    payer:"未定",
    payMethod:"未定",
    day:"",
    mode:"TWD",
    foreign:0,
    twd:0,
    memo:"由航班資料帶入，可自行補金額"
  });
  save();
  toast("已幫你記一筆來回機票！");
}

function saveFlights(){
  if(!validateFlightSegments())return;
  const alreadyHasPlans = flightHasPlans();

  data.flights.out=readFlightForm("out");
  data.flights.back=readFlightForm("back");
  v39FlightDirty=false;

  if(alreadyHasPlans){
    syncFlightPlans();
  }

  silentSave();
  render();
  v16CollapseTripDetail(1);
  toast(alreadyHasPlans ? "已存好航班，並更新行程囉！" : "已幫你存好航班囉！");
}
function flightSegmentForm(k, idx, seg){
  seg = seg || {};
  const defaultOpen = idx===0 ? "open" : "";
  const fromId=`${k}s${idx}from`;
  const toId=`${k}s${idx}to`;
  return `<details class="segmentBox" id="${k}segBox${idx}" ${defaultOpen}>
    <summary><div class="segmentTitle">第 ${idx+1} 段航班 <span>${idx===0?"第一段":"第二段／轉機後"}</span></div></summary>
    <div class="segmentInner">

      <div class="flightDesktopOnly">
        <div class="three compactMobile">
          <div><label>航班號</label><input id="${k}s${idx}no" value="${esc(seg.no||"")}" placeholder="例：BX794"></div>
          <div><label>出發地 / 機場</label><input id="${fromId}" list="airportList" value="${esc(seg.from||"")}" placeholder="可選清單或自行輸入"></div>
          <div><label>抵達地 / 機場</label><input id="${toId}" list="airportList" value="${esc(seg.to||"")}" placeholder="可選清單或自行輸入"></div>
        </div>
        <div class="terminalPair">
          <div><label>出發航廈</label><select id="${k}s${idx}fromTerminal">${terminalOptions(seg.fromTerminal||"未定")}</select></div>
          <div><label>抵達航廈</label><select id="${k}s${idx}toTerminal">${terminalOptions(seg.toTerminal||"未定")}</select></div>
        </div>
        <div class="two">
          <div><label>起飛時間</label><input id="${k}s${idx}dep" type="datetime-local" value="${seg.dep||""}"></div>
          <div><label>抵達時間</label><input id="${k}s${idx}arr" type="datetime-local" value="${seg.arr||""}"></div>
        </div>
      </div>

      <div class="flightMobileOnly">
        <div class="mobileAirportGrid">
          <div><label>航班號</label><input id="${k}s${idx}noM" value="${esc(seg.no||"")}" placeholder="例：BX794"></div>
          <div><label>出發地 / 機場</label>${v38AirportSelectHtml(`${k}s${idx}fromM`, seg.from||"")}</div>
          <div><label>抵達地 / 機場</label>${v38AirportSelectHtml(`${k}s${idx}toM`, seg.to||"")}</div>
          <div><label>出發航廈</label>${v38TerminalSelectHtml(`${k}s${idx}fromTerminalM`, seg.fromTerminal||"未定")}</div>
          <div><label>抵達航廈</label>${v38TerminalSelectHtml(`${k}s${idx}toTerminalM`, seg.toTerminal||"未定")}</div>
        </div>

        <div class="mobileTimeGrid">
          <div class="mobileTimeBlock">
            <div class="mobileTimeTitle">起飛</div>
            <div class="mobileTimePair">
              <div class="mobileTimeField"><span class="mobileTimeIcon">📅</span><input id="${k}s${idx}depDateM" type="date" value="${v38DatePart(seg.dep)}"></div>
              <div class="mobileTimeField"><span class="mobileTimeIcon">🕒</span><input id="${k}s${idx}depTimeM" type="time" value="${v38TimePart(seg.dep)}"></div>
            </div>
          </div>
          <div class="mobileTimeBlock">
            <div class="mobileTimeTitle">抵達</div>
            <div class="mobileTimePair">
              <div class="mobileTimeField"><span class="mobileTimeIcon">📅</span><input id="${k}s${idx}arrDateM" type="date" value="${v38DatePart(seg.arr)}"></div>
              <div class="mobileTimeField"><span class="mobileTimeIcon">🕒</span><input id="${k}s${idx}arrTimeM" type="time" value="${v38TimePart(seg.arr)}"></div>
            </div>
          </div>
        </div>

        <div class="mobileFieldNote">手機版分開填日期與時間，儲存後仍會寫回原本航班時間欄位。</div>
      </div>

      <div class="airportQuickHint">台灣與亞洲機場優先列出；找不到可手動輸入。</div>
    </div>
  </details>`;
}
function renderTrip(){
  const selectedCity=typeof v15CurrentCity==="function" ? v15CurrentCity() : (data.trip.city||"");
  const mapObj=typeof v15CountryCityMaps==="function" ? v15CountryCityMaps().cityMap : {};
  const list=mapObj[data.trip.country]||[];
  const customCity=list.includes(selectedCity)?"":selectedCity;
  const showCustom=data.trip.country==="其他" || !list.includes(selectedCity);
  $("tripView").innerHTML=`<div class="section"><div><h2>🌏 旅遊地設定</h2><div class="hint">先設定旅遊地、日期、幣別與旅伴。完成後才會開啟航班住宿、行程、口袋景點、預算、行李與旅遊書。</div></div></div>
  <details class="card" open><summary>① 🌏 旅遊地與旅伴</summary><div class="detailBody">
    <div class="three compactMobile"><div><label>國家 / 區域</label><select id="country" onchange="handleCountrySelectChange()">${countryOptions()}</select></div><div><label>城市 / 路線</label><select id="citySelect" onchange="updateDestByCity()">${v15CityOptions(selectedCity)}</select></div><div id="customCityBox" class="full" style="display:${showCustom?"block":"none"}"><label>自訂目的地</label><input id="cityCustom" value="${esc(customCity)}" oninput="updateDestByCity()" placeholder="例：釜山＋慶州"></div></div>
    <div class="two"><div><label>幣別</label><input id="currency" value="${esc(data.trip.currency)}" oninput="countryChanged()"></div><div><label id="rateLabel">匯率：1 ${esc(data.trip.currency)} = TWD</label><input id="rateSetup" type="number" step="0.0001" value="${data.trip.rate}"></div></div>
    <div class="three compactMobile"><div><label>出發日</label><input id="start" type="date" value="${data.trip.start||""}"></div><div><label>回程日</label><input id="end" type="date" value="${data.trip.end||""}"></div><div class="full"><label>匯率查詢</label><button class="btn blue compact" onclick="openRateSearch()">查一下匯率</button></div></div>
    <div class="two"><div><label>旅遊人數</label><select id="travelerCount" onchange="previewTravelerCount()">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${Number(data.trip.travelerCount)==n?"selected":""}>${n} 人</option>`).join("")}</select></div><div class="hint" style="align-self:end">目前目的地：${esc(data.trip.dest||"尚未設定")}</div></div>
    <div class="grid2" id="travelerBox">${travelerInputs()}</div>
    <div class="btns"><button class="btn dark" onclick="saveBasic()">存好旅遊地設定</button><button class="btn soft" onclick="v63BackToTripList()">回我的旅程</button></div>
  </div></details>`;
}
function renderStay(){
  if(!$("stayView"))return;
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  if(!v63TripReady()){
    $("stayView").innerHTML=`<div class="empty">請先完成旅遊地設定，才能使用航班住宿。</div>`;
    return;
  }
  if(typeof v18SortHotels==="function")v18SortHotels();
  $("stayView").innerHTML=`<div class="section"><div><h2>✈️ 航班住宿</h2><div class="hint">這裡只管理航班、機場接送與住宿；旅遊地設定已拆到前一個頁籤。</div></div></div>
  <details class="card" open><summary>① ✈️ 航班與機場接送</summary><div class="detailBody"><div class="grid2"><div class="box blue"><h3>去程</h3>${flightForm("out")}</div><div class="box pink"><h3>回程</h3>${flightForm("back")}</div></div>${typeof flightStatusHtml==="function"?flightStatusHtml():""}<div class="btns"><button class="btn dark" onclick="saveFlights()">存好航班設定</button></div></div></details>
  <details class="card" ${v16KeepHotelOpen||editingHotelId?"open":""}><summary>② 🏨 住宿</summary><div class="detailBody"><div class="three compactMobile"><div class="full"><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div><div><label>入住日</label><input id="hstart" type="date" min="${data.trip.start}" max="${data.trip.end}" value="${h?.start||data.trip.start}"></div><div><label>退房日</label><input id="hend" type="date" min="${data.trip.start}" max="${data.trip.end}" value="${h?.end||data.trip.end}"></div></div><label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">查地圖</button></div><label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea><div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"存好住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;v16KeepHotelOpen=true;renderStay()">取消編輯</button>':""}</div><div class="hotelSortedNote">住宿會依入住日自動排序；可選日期已限制在旅遊日期內。</div><div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">還沒有新增住宿</div>'}</div></div></details>`;
}
function editHotel(id){editingHotelId=id;v16KeepHotelOpen=true;go("stay");}
function renderStay(){
  if(!$("stayView"))return;
  const h=editingHotelId?data.hotels.find(x=>x.id==editingHotelId):null;
  if(!v63TripReady()){
    $("stayView").innerHTML=`<div class="empty">請先完成旅遊地設定，才能使用航班住宿。</div>`;
    return;
  }
  if(typeof v18SortHotels==="function")v18SortHotels();
  $("stayView").innerHTML=`<div class="section"><div><h2>✈️ 航班住宿</h2><div class="hint">這裡只管理航班、機場接送與住宿；旅遊地設定已拆到前一個頁籤。</div></div></div>
  <details class="card flightDense stayFlightCard" open><summary>① ✈️ 航班與機場接送</summary><div class="detailBody"><div class="stayFlightGrid"><div class="box blue"><h3>去程</h3>${flightForm("out")}</div><div class="box pink"><h3>回程</h3>${flightForm("back")}</div></div>${typeof flightStatusHtml==="function"?flightStatusHtml():""}<div class="btns" style="max-width:920px;margin-left:auto;margin-right:auto"><button class="btn dark" onclick="saveFlights()">存好航班設定</button></div></div></details>
  <details class="card" ${v16KeepHotelOpen||editingHotelId?"open":""}><summary>② 🏨 住宿</summary><div class="detailBody"><div class="three compactMobile"><div class="full"><label>住宿名稱</label><input id="hname" value="${esc(h?.name||"")}"></div><div><label>入住日</label><input id="hstart" type="date" min="${data.trip.start}" max="${data.trip.end}" value="${h?.start||data.trip.start}"></div><div><label>退房日</label><input id="hend" type="date" min="${data.trip.start}" max="${data.trip.end}" value="${h?.end||data.trip.end}"></div></div><label>地址</label><div class="two"><input id="haddr" value="${esc(h?.addr||"")}" placeholder="可手動貼上飯店地址"><button class="btn blue compact" onclick="searchHotelAddress()">查地圖</button></div><label>備註</label><textarea id="hnote">${esc(h?.note||"")}</textarea><div class="btns"><button class="btn dark" onclick="saveHotel()">${h?"存好住宿修改":"新增住宿"}</button>${h?'<button class="btn soft" onclick="editingHotelId=null;v16KeepHotelOpen=true;renderStay()">取消編輯</button>':""}</div><div class="hotelSortedNote">住宿會依入住日自動排序；可選日期已限制在旅遊日期內。</div><div class="grid2" style="margin-top:10px">${data.hotels.map(hotelCard).join("")||'<div class="empty">還沒有新增住宿</div>'}</div></div></details>`;
}
document.addEventListener("input", function(e){
  if(e.target && e.target.closest && e.target.closest("#stayView .flightDense")){
    if(typeof v39MarkFlightDirty==="function")v39MarkFlightDirty();
  }
}, true);
document.addEventListener("change", function(e){
  if(e.target && e.target.closest && e.target.closest("#stayView .flightDense")){
    if(typeof v39MarkFlightDirty==="function")v39MarkFlightDirty();
  }
}, true);
v631BrandTitle();

const V632_VERSION = "v63.2";
const V632_LOCAL_META_SUFFIX = "__meta";
let v632LastSyncState = {kind:"off", title:"尚未同步", desc:"", at:0};

