const views=[["trip","旅遊地"],["planner","行程"],["spots","口袋景點"],["budget","預算"],["packing","行李"],["photoBook","照片書"],["help","說明"]];
const currencyMap={"韓國":"KRW","日本":"JPY","泰國":"THB","美國":"USD","越南":"VND","新加坡":"SGD","歐洲":"EUR","英國":"GBP","香港":"HKD"};const rateMap={KRW:.023,JPY:.22,THB:.92,USD:31.5,VND:.00125,SGD:24,EUR:34,GBP:39,HKD:4.05};
const pack0=[["pre","護照","出門前確認"],["pre","機票 / 登機資訊","截圖備份"],["pre","住宿訂房資訊","地址存一份"],["pre","信用卡 / 現金","分開放"],["pre","旅遊保險","保單號碼"],["pre","轉接頭","依國家確認"],["pre","行動電源","放隨身包"],["pre","常備藥","腸胃 / 止痛 / 過敏"],["out","護照","離開飯店前確認"],["out","手機 / 充電器","床頭插座"],["out","錢包 / 信用卡","保險箱"],["out","衣櫃 / 浴室 / 冰箱","不要漏東西"]];
const base={meta:{title:"釜山小旅行手帳",subtitle:"把想去的海邊、巷弄、咖啡香與晚餐清單都收進來，慢慢排成一趟期待出發的旅行。",bookStyle:"fresh"},trip:{dest:"韓國釜山",country:"韓國",currency:"KRW",start:"2026-06-04",end:"2026-06-10",rate:.023,travelerCount:2,travelers:["A","B"]},days:[],flights:{out:{no:"",from:"",to:"",dep:"",arr:"",transfer:""},back:{no:"",from:"",to:"",dep:"",arr:"",transfer:""}},hotels:[],expenses:[],spots:[],plans:[],conns:[],packing:pack0.map(x=>({id:uid(),type:x[0],name:x[1],note:x[2],checked:false})),packView:"pre",photos:[],dayCovers:{}};
let data=loadData(),cur=data.days[0]?.key||data.trip.start,view="trip",drag=null,editingSpotId=null,editingHotelId=null,editingExpenseId=null,editingPlanId=null,adjustToastShown=false;
function uid(){return crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())}function $(id){return document.getElementById(id)}function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])).replaceAll("\\n","<br>")}function fmt(n){return Number(n||0).toLocaleString("zh-TW")}function parseLocalDate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}function formatLocalDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}function short(k){if(!k)return"";const [y,m,d]=k.split("-");return `${Number(m)}/${Number(d)}`}function toast(m){$("toast").textContent=m;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1900)}
function mkDays(s,e){let a=[];if(!s||!e)return a;let sd=parseLocalDate(s),ed=parseLocalDate(e),i=1;for(let d=new Date(sd);d<=ed;d.setDate(d.getDate()+1)){let k=formatLocalDate(d);a.push({key:k,label:`${d.getMonth()+1}/${d.getDate()}`,title:`Day ${i++}`})}return a}
function init(){renderNav();render()}function renderNav(){$("tabs").innerHTML=views.map(v=>`<button class="tab ${v[0]==view?"active":""}" onclick="go('${v[0]}')">${v[1]}</button>`).join("");$("mobile").innerHTML=[["trip","旅遊地"],["planner","行程"],["spots","景點"],["budget","預算"],["photoBook","照片書"]].map(v=>`<button class="nav ${v[0]==view?"active":""}" onclick="go('${v[0]}')">${v[1]}</button>`).join("")}function go(v){view=v;views.forEach(x=>$(x[0]+"View").classList.toggle("hidden",x[0]!=v));renderNav();render();scrollTo(0,0)}
function travelerInputs(){let out="";for(let i=0;i<Number(data.trip.travelerCount||1);i++)out+=`<div><label>旅伴 ${String.fromCharCode(65+i)} 名稱</label><input id="traveler${i}" value="${esc(data.trip.travelers[i]||String.fromCharCode(65+i))}"></div>`;return out}
function previewTravelerCount(){let n=Number($("travelerCount").value),old=data.trip.travelers||[],html="";for(let i=0;i<n;i++)html+=`<div><label>旅伴 ${String.fromCharCode(65+i)} 名稱</label><input id="traveler${i}" value="${esc(old[i]||String.fromCharCode(65+i))}"></div>`;$("travelerBox").innerHTML=html}function countryChanged(){const c=$("country").value;if(currencyMap[c]){$("currency").value=currencyMap[c];$("rateSetup").value=rateMap[currencyMap[c]]||data.trip.rate}}function openRateSearch(){open(`https://www.google.com/search?q=${encodeURIComponent((data.trip.currency||"KRW")+" TWD 匯率")}`,"_blank")}
function mapSpotDraft(){const q=($("sn").value+" "+$("sa").value+" "+data.trip.dest).trim();if(!$("sn").value)return toast("請先輸入景點名稱");map(encodeURIComponent(q))}function clearSpotForm(){editingSpotId=null;renderSpots()}function saveSpot(){if(!$("sn").value)return toast("請輸入名稱");const item={name:$("sn").value,type:$("st").value,day:$("sd").value,addr:$("sa").value,memo:$("sm").value};let id=editingSpotId;if(id){Object.assign(data.spots.find(x=>x.id==id),item);editingSpotId=null}else{id=uid();data.spots.push({id,...item})}if($("sToPlan").value==="yes"){let day=item.day||cur;data.plans.push({id:uid(),day,start:$("sStart").value,end:$("sEnd").value,type:["景點","餐廳","咖啡廳","購物","其他"].includes(item.type)?item.type:"景點",name:item.name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:item.memo,memo:"由口袋景點帶入",adjusted:false})}save()}function editSpot(id){editingSpotId=id;renderSpots();scrollTo(0,0)}function delSpot(id){if(!confirm("確定刪除景點？"))return;data.spots=data.spots.filter(x=>x.id!=id);if(editingSpotId==id)editingSpotId=null;save()}function useSpot(id){let s=data.spots.find(x=>x.id==id);go("planner");setTimeout(()=>{editingPlanId=null;renderPlanner();setTimeout(()=>{$("pday").value=s.day||cur;$("ptype").value=["景點","餐廳","咖啡廳","購物","其他"].includes(s.type)?s.type:"景點";$("pname").value=s.name;$("pnote").value=s.memo},20)},20)}
function sortedPlans(day){return data.plans.filter(p=>p.day==day).sort((a,b)=>String(a.start).localeCompare(String(b.start))||String(a.end).localeCompare(String(b.end)))}
function connHtml(a,b){let c=data.conns.find(x=>x.a==a.id&&x.b==b.id);if(!c){c={id:uid(),a:a.id,b:b.id,mode:"大眾運輸",h:0,m:30,memo:"",fareForeign:0,fareTwd:0,payer:"未定",payMethod:"未定"};data.conns.push(c);silentSave()}const arrival=addMinutes(a.end,(Number(c.h||0)*60+Number(c.m||0)));const taxiBlock=c.mode==="開車/計程車"?`<div class="four" style="margin-top:8px"><div><label>車資 ${esc(data.trip.currency)}</label><input value="${c.fareForeign||""}" type="number" oninput="updConn('${c.id}','fareForeign',this.value)"></div><div><label>車資 TWD</label><input value="${c.fareTwd||""}" type="number" oninput="updConn('${c.id}','fareTwd',this.value)"></div><div><label>付款人</label><select onchange="updConn('${c.id}','payer',this.value)">${optsPayer(c.payer)}</select></div><div><label>付款方式</label><select onchange="updConn('${c.id}','payMethod',this.value)">${optsPayMethod(c.payMethod)}</select></div></div>`:"";return `<div class="connector"><div class="arrow">↓</div><div class="connbox"><div class="three"><div><label>交通</label><select onchange="changeConnMode('${c.id}',this.value)"><option ${c.mode=="大眾運輸"?"selected":""}>大眾運輸</option><option ${c.mode=="走路"?"selected":""}>走路</option><option ${c.mode=="開車/計程車"?"selected":""}>開車/計程車</option></select></div><div><label>預估時間</label><div class="two"><select onchange="updConn('${c.id}','h',this.value)">${hourOptions(c.h)}</select><select onchange="updConn('${c.id}','m',this.value)">${minuteOptions(c.m)}</select></div></div><div><label>預估抵達</label><input value="${arrival||""}" disabled></div></div>${taxiBlock}<div class="btns"><button class="btn blue" onclick="route('${encodeURIComponent(a.name+' '+data.trip.dest)}','${encodeURIComponent(b.name+' '+data.trip.dest)}','${c.mode}')">Google Maps 查路線</button></div><input value="${esc(c.memo)}" placeholder="交通備註" oninput="updConn('${c.id}','memo',this.value)"></div></div>`}
function hourOptions(v){let out="";for(let h=0;h<=23;h++)out+=`<option value="${h}" ${Number(v)==h?"selected":""}>${h}時</option>`;return out}function minuteOptions(v){let out="";for(let m=0;m<=59;m++)out+=`<option value="${m}" ${Number(v)==m?"selected":""}>${m}分</option>`;return out}function changeConnMode(id,v){let c=data.conns.find(x=>x.id==id);c.mode=v;alert("交通方式已變更，建議重新開 Google Maps 查路線，並確認預估時間。");save()}function addMinutes(t,min){if(!t)return"";let [h,m]=t.split(":").map(Number),total=h*60+m+Number(min||0);total=((total%1440)+1440)%1440;return String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0")}function diffMinutes(a,b){if(!a||!b)return 60;let [ah,am]=a.split(":").map(Number),[bh,bm]=b.split(":").map(Number);return Math.max(15,bh*60+bm-(ah*60+am))}function timeToMin(t){if(!t)return 0;let [h,m]=t.split(":").map(Number);return h*60+m}
function normalizePlanTimes(day){let plans=sortedPlans(day),changed=false;for(let i=1;i<plans.length;i++){let prev=plans[i-1],curP=plans[i],c=data.conns.find(x=>x.a==prev.id&&x.b==curP.id);if(!c)continue;let arrival=addMinutes(prev.end,Number(c.h||0)*60+Number(c.m||0));if(arrival&&timeToMin(arrival)>timeToMin(curP.start)){let dur=diffMinutes(curP.start,curP.end);curP.start=arrival;curP.end=addMinutes(arrival,dur);curP.adjusted=true;changed=true}}if(changed){silentSave();if(!adjustToastShown){adjustToastShown=true;setTimeout(()=>toast("部分行程已依交通抵達時間自動調整"),100)}}}
function syncPlanMoney(src){let rate=Number(data.trip.rate||1);if(src=="f")$("ptwd").value=Math.round(Number($("pforeign").value||0)*rate);else $("pforeign").value=Math.round(Number($("ptwd").value||0)/rate)}function savePlanForm(){if(!$("pname").value)return toast("請輸入行程名稱");let item={day:$("pday").value,start:$("ps").value,end:$("pe").value,type:$("ptype").value,name:$("pname").value,mode:"foreign",foreign:Number($("pforeign").value||0),twd:Number($("ptwd").value||0),payer:$("pp").value,payMethod:$("ppm").value,note:$("pnote").value,memo:$("pmemo").value,adjusted:false};if(editingPlanId){Object.assign(data.plans.find(p=>p.id==editingPlanId),item);editingPlanId=null}else data.plans.push({id:uid(),...item});cur=item.day;save()}function fillPlanForm(id){let p=data.plans.find(x=>x.id==id);if(!p)return;["pday","ps","pe","ptype","pname","pforeign","ptwd","pp","ppm","pnote","pmemo"].forEach((id2,i)=>$(id2).value=[p.day,p.start,p.end,p.type,p.name,moneyForeign(p),moneyTwd(p),p.payer,p.payMethod||"未定",p.note,p.memo][i])}function editPlan(id){editingPlanId=id;go("planner")}function clearPlanForm(){editingPlanId=null;renderPlanner();scrollTo(0,0)}function delPlan(id){if(!confirm("確定刪除行程？"))return;data.plans=data.plans.filter(x=>x.id!=id);data.conns=data.conns.filter(c=>c.a!=id&&c.b!=id);if(editingPlanId==id)editingPlanId=null;save()}function updConn(id,k,v){let c=data.conns.find(x=>x.id==id);c[k]=v;save()}function map(q){open("https://www.google.com/maps/search/?api=1&query="+q,"_blank")}function routeCurrent(q){map(q)}function route(a,b,m){let mode=m=="走路"?"walking":m=="開車/計程車"?"driving":"transit";open(`https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}&travelmode=${mode}`,"_blank")}
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
const oldPlanCards=planCards;
const cityMapV10={
  "韓國":["釜山","首爾","濟州","大邱","仁川"],
  "日本":["東京","大阪","京都","福岡","札幌","沖繩","名古屋"],
  "泰國":["曼谷","清邁","普吉"],
  "美國":["紐約","洛杉磯","舊金山","西雅圖","夏威夷"],
  "越南":["峴港","河內","胡志明市"],
  "新加坡":["新加坡"],
  "香港":["香港"],
  "歐洲":["奧地利＋捷克","奧地利","捷克","英國","法國","義大利","德國","荷蘭","西班牙"],
  "英國":["倫敦","愛丁堡","曼徹斯特"]
};
const airportMapV10={
  "釜山":["PUS 金海國際機場"],
  "首爾":["ICN 仁川國際機場","GMP 金浦國際機場"],
  "濟州":["CJU 濟州國際機場"],
  "東京":["NRT 成田國際機場","HND 羽田機場"],
  "大阪":["KIX 關西國際機場","ITM 大阪伊丹機場"],
  "京都":["KIX 關西國際機場"],
  "福岡":["FUK 福岡機場"],
  "札幌":["CTS 新千歲機場"],
  "沖繩":["OKA 那霸機場"],
  "香港":["HKG 香港國際機場"],
  "新加坡":["SIN 樟宜機場"],
  "曼谷":["BKK 素萬那普機場","DMK 廊曼機場"],
  "清邁":["CNX 清邁國際機場"],
  "普吉":["HKT 普吉國際機場"],
  "峴港":["DAD 峴港國際機場"],
  "河內":["HAN 內排國際機場"],
  "胡志明市":["SGN 新山一國際機場"],
  "維也納":["VIE 維也納國際機場"],
  "布拉格":["PRG 布拉格瓦茨拉夫哈維爾機場"],
  "倫敦":["LHR 希斯洛機場","LGW 蓋威克機場"],
  "巴黎":["CDG 戴高樂機場","ORY 奧利機場"],
  "羅馬":["FCO 羅馬菲烏米奇諾機場"],
  "阿姆斯特丹":["AMS 史基浦機場"],
  "台北":["TPE 桃園國際機場","TSA 台北松山機場"],
  "高雄":["KHH 高雄國際機場"],
  "台中":["RMQ 台中國際機場"]
};
const homeAirportsV10=["TPE 桃園國際機場","TSA 台北松山機場","KHH 高雄國際機場","RMQ 台中國際機場"];
const terminalOptionsV10=["未定","第一航廈","第二航廈","第三航廈","國內線航廈","國際線航廈"];

function currentCity(){
  if(data.trip.city)return data.trip.city;
  const dest=data.trip.dest||"";
  const list=cityMapV10[data.trip.country]||[];
  const found=list.find(c=>dest.includes(c));
  return found || list[0] || "";
}
function destinationName(country,city){
  if(!country)return city||"";
  if(country==="香港" && (!city || city==="香港"))return "香港";
  if(country==="新加坡" && (!city || city==="新加坡"))return "新加坡";
  if(country==="歐洲")return city ? `歐洲｜${city}` : "歐洲";
  return [country,city].filter(Boolean).join("");
}

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

function addFlightPlan(day,start,end,type,name,note){
  if(!day||!name)return;
  const exists=data.plans.some(p=>p.day===day && p.name===name && p.start===start);
  if(exists)return;
  data.plans.push({id:uid(),day,start:start||"",end:end||start||"",type,name,mode:"foreign",foreign:0,twd:0,payer:"未定",payMethod:"未定",note:note||"",memo:"由航班資料帶入",adjusted:false});
}
function dateFromDateTime(dt){return dt?dt.split("T")[0]||"":""}
function timeFromDateTime(dt){return dt?dt.split("T")[1]||"":""}
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
function datesBetween(start,end){
  let arr=[],sd=parseLocalDate(start),ed=parseLocalDate(end);
  for(let d=new Date(sd);d<=ed;d.setDate(d.getDate()+1))arr.push(formatLocalDate(d));
  return arr;
}
function dateBefore(dateStr){
  let d=parseLocalDate(dateStr); d.setDate(d.getDate()-1); return formatLocalDate(d);
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
function cityOptions(selected){
  let list=cityMapV10[$("country")?.value || data.trip.country] || [];
  if(($("country")?.value || data.trip.country)==="歐洲")list=list.filter(c=>c!=="奧地利＋捷克");
  return [`<option value="自訂" ${selected && !list.includes(selected)?"selected":""}>自訂</option>`]
    .concat(list.map(c=>`<option value="${c}" ${selected==c?"selected":""}>${c}</option>`)).join("");
}
function shouldShowCustomCity(country,cityValue){
  return country==="其他" || cityValue==="自訂";
}
function buildDestinationFromFields(){
  const country=$("country").value;
  const cityValue=$("citySelect").value;
  const custom=$("cityCustom")?.value.trim()||"";
  const city=cityValue==="自訂"?custom:cityValue;
  return destinationName(country,city);
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


function clearAllPlans(){
  if(!confirm("清除所有行程會刪除目前已排入的行程卡片與行程間交通連線。建議先到「說明」匯出備份，再繼續。確定要清除嗎？")) return;
  data.plans=[];
  data.conns=[];
  save();
}


function showSpotFormOpenAttr(){
  return editingSpotId ? "open" : "";
}


function activityIcon(type){
  return type==="餐廳"?"🍜":type==="咖啡廳"?"☕":type==="購物"?"🛍️":type==="交通"||type==="航班"?"✈️":type==="住宿"?"🏨":type==="雨天備案"?"☔":type==="其他"?"✨":"📍";
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

function showAIPrompt(){
  let modal=$("aiPromptModal");
  if(!modal){
    document.body.insertAdjacentHTML("beforeend",`<div class="aiPromptModal" id="aiPromptModal"><div class="aiPromptBox"><div class="section"><h3>AI 口袋景點提示詞</h3><button class="iconBtn" onclick="closeAIPrompt()">×</button></div><textarea id="aiPromptText"></textarea><div class="btns"><button class="btn dark" onclick="copyAIPrompt()">複製提示詞</button><button class="btn soft" onclick="closeAIPrompt()">關閉</button></div></div></div>`);
  }
  $("aiPromptText").value=buildSpotPrompt();
  $("aiPromptModal").classList.add("show");
}

function closeAIPrompt(){
  $("aiPromptModal")?.classList.remove("show");
}

function copyAIPrompt(){
  const el=$("aiPromptText");
  el.select();
  document.execCommand("copy");
  toast("已複製提示詞");
}

function normalizeImportedJsonText(text){
  let t=text.trim();
  if(t.startsWith("```")) t=t.replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();
  const first=t.indexOf("{"), last=t.lastIndexOf("}");
  if(first>=0&&last>first) t=t.slice(first,last+1);
  return t;
}


function templateCard(k,title,desc){
  return `<div class="templateCard ${data.meta.bookStyle==k?"active":""}" onclick="data.meta.bookStyle='${k}';save()"><b>${title}</b><span class="mini">${desc}</span></div>`;
}
let v16KeepHotelOpen = false;
let v16PendingSpotId = null;

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
function v16OpenTripDetail(index){
  const details=document.querySelectorAll("#tripView details.card");
  if(details[index])details[index].setAttribute("open","");
}
function v16CollapseTripDetail(index){
  const details=document.querySelectorAll("#tripView details.card");
  if(details[index])details[index].removeAttribute("open");
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


const CLOUDINARY_CONFIG = {
  cloudName: "dtpgutlmt",
  uploadPreset: "travel_book_unsigned",
  folder: "travel-book",
  maxUploadBytes: 10 * 1024 * 1024,
  maxWidth: 1600,
  quality: 0.82
};

function setUploadStatus(message){
  const el = $("uploadStatus");
  if(el){
    el.textContent = message || "";
    el.classList.toggle("show", !!message);
  }
}

function loadImageFromFile(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImageToBlob(file, maxWidth=CLOUDINARY_CONFIG.maxWidth, quality=CLOUDINARY_CONFIG.quality){
  const img = await loadImageFromFile(file);
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise(resolve=>{
    canvas.toBlob(blob => resolve(blob), "image/jpeg", quality);
  });
}

async function uploadBlobToCloudinary(blob, filename="travel-photo.jpg"){
  const form = new FormData();
  form.append("file", blob, filename.replace(/\.[^.]+$/,"") + ".jpg");
  form.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
  if(CLOUDINARY_CONFIG.folder) form.append("folder", CLOUDINARY_CONFIG.folder);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  const res = await fetch(url, { method:"POST", body:form });
  const json = await res.json();
  if(!res.ok){
    throw new Error(json?.error?.message || "Cloudinary 上傳失敗");
  }
  return json;
}

async function uploadImageFile(file, options={}){
  if(!file) throw new Error("請先選擇照片");
  if(file.size > CLOUDINARY_CONFIG.maxUploadBytes){
    toast("照片較大，會先壓縮再上傳");
  }

  setUploadStatus("正在壓縮照片...");
  const blob = await compressImageToBlob(
    file,
    options.maxWidth || CLOUDINARY_CONFIG.maxWidth,
    options.quality || CLOUDINARY_CONFIG.quality
  );

  setUploadStatus("正在上傳到 Cloudinary...");
  const uploaded = await uploadBlobToCloudinary(blob, file.name || "travel-photo.jpg");
  setUploadStatus("");

  return {
    src: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
    bytes: uploaded.bytes,
    cloudinary: true
  };
}


function delPhoto(id){
  data.photos=data.photos.filter(p=>p.id!=id);
  save();
}


let v18PendingCountry = null;

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


let v19PendingDates = null;

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


function hotelHasExpense(id){
  return data.expenses.some(e=>e.hotelId==id);
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


const APP_VERSION = "v63｜2026-05-30｜登入白名單與多旅程架構版";
console.log("貞選旅管家", APP_VERSION);
let v21PendingFlightOptions = false;
let v21PendingHotelId = null;


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


function v21ApplyLockedNameState(){
  const p=editingPlanId?data.plans.find(x=>x.id==editingPlanId):null;
  const locked=!!(p?.lockedName || v16PendingSpotId);
  if($("pname")){
    $("pname").readOnly=locked;
    $("pname").classList.toggle("lockedInput",locked);
  }
  if($("lockedNameHint")) $("lockedNameHint").style.display=locked?"block":"none";
}


const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDVmuktIzd29IqgOum2KOchgFZi0ofn4tY",
  authDomain: "travel-tool-50e41.firebaseapp.com",
  projectId: "travel-tool-50e41",
  storageBucket: "travel-tool-50e41.firebasestorage.app",
  messagingSenderId: "3477916876",
  appId: "1:3477916876:web:141919efd392b6b5a60669",
  measurementId: "G-FT2Y6WL5D5"
};

const ALLOWED_EMAIL = "jan33772001@gmail.com";
const CLOUD_TRIP_ID = "main";

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let fbUser = null;
let cloudReady = false;
let cloudSaveTimer = null;
let suppressCloudSave = false;
let cloudUnsub = null;
let lastCloudUpdatedAt = 0;

function initFirebaseSync(){
  // Firebase 初始化與 auth 監聽由 v63Boot() 負責
  // 保留此函式避免 call site 報錯
}


function firebaseSignIn(){
  if(!fbAuth)return toast("Firebase 尚未初始化");
  const provider = new firebase.auth.GoogleAuthProvider();
  fbAuth.signInWithPopup(provider).catch(err=>{
    alert("登入失敗：" + err.message + "\n\n若你在 GitHub Pages 遇到授權問題，請確認 Firebase Auth 的 Authorized domains 已加入你的 GitHub Pages 網域。");
  });
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


function v23NormalizeSpotDate(raw){
  if(!raw)return "";
  return v23InTripRange(raw) ? raw : "";
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


function fillExpenseForm(id){
  const e=data.expenses.find(x=>x.id==id);
  if(!e)return;
  $("etype").value=e.type||"其他";
  $("ename").value=e.name||"";
  $("epayer").value=e.payer||"未定";
  $("eforeign").value=moneyForeign(e)||0;
  $("etwd").value=moneyTwd(e)||0;
  $("epm").value=e.payMethod||"未定";
  $("eday").value=e.day||"";
  $("ememo").value=e.memo||"";
}


function saveExpenseForm(){
  if(!$("ename").value)return toast("請輸入費用項目");
  const item={source:"額外費用",type:$("etype").value,name:$("ename").value,payer:$("epayer").value,payMethod:$("epm").value,day:$("eday").value,mode:"foreign",foreign:Number($("eforeign").value||0),twd:Number($("etwd").value||0),memo:$("ememo").value};
  if(editingExpenseId){
    Object.assign(data.expenses.find(e=>e.id==editingExpenseId),item);
    editingExpenseId=null;
  }else{
    data.expenses.push({id:uid(),...item});
  }
  save();
  toast("已幫你記好這筆花費！");
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


function updateAuthButtons(isIn){
  // v25: 舊版同步卡片已隱藏，改由右上角頭像選單控制。
  renderAccountWidget(fbUser);
}

function showSyncMini(text){
  const el=$("syncMini");
  if(!el)return;
  el.textContent=text||"已同步";
  el.classList.add("show");
  clearTimeout(window.__syncMiniTimer);
  window.__syncMiniTimer=setTimeout(()=>el.classList.remove("show"),1600);
}


function removeFlightBudget(){
  data.expenses=data.expenses.filter(e=>!(e.sourceType==="flight" || e.source==="航班"));
  save();
  toast("已幫你移除航班預算囉！");
}


let syncStatus = "idle";
let lastSyncTime = null;

function syncStatusText(){
  if(syncStatus==="syncing") return "同步中";
  if(syncStatus==="success") return lastSyncTime ? `已同步 ${lastSyncTime}` : "已同步";
  if(syncStatus==="error") return "同步失敗";
  return "尚未同步";
}


function delPlan(id){
  // 暫時不做來源同步刪除，也不連動預算。
  data.plans=data.plans.filter(x=>x.id!=id);
  data.conns=data.conns.filter(c=>c.a!=id&&c.b!=id);
  save();
}

function budgetRows(){
  const rows=[];
  data.expenses.forEach(x=>rows.push(`<tr><td>${esc(x.source||"額外費用")}</td><td>${x.day?esc(x.day):"—"}</td><td>${esc(x.type)}</td><td>${esc(x.name)}</td><td>${esc(travelerName(x.payer))}</td><td>${esc(payMethodLabel(x.payMethod))}</td><td>${fmt(moneyForeign(x))}</td><td>${fmt(moneyTwd(x))}</td><td><button class="small" onclick="editExpense('${x.id}')">編輯</button><button class="small" onclick="delExpense('${x.id}')">刪除</button></td></tr>`));

  data.conns.filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0).forEach(c=>rows.push(`<tr><td>交通</td><td>—</td><td>${esc(c.mode)}</td><td>行程間交通</td><td>${esc(travelerName(c.payer))}</td><td>${esc(payMethodLabel(c.payMethod))}</td><td>${fmt(c.fareForeign||0)}</td><td>${fmt(c.fareTwd||0)}</td><td></td></tr>`));
  return rows.join("")||'<tr><td colspan="9">尚未新增預算</td></tr>';
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
let currentDay = cur || data?.days?.[0]?.key || data?.trip?.start || "";

const PLAN_TYPES = ["景點","餐廳","咖啡廳","購物","交通","航班","住宿","雨天備案","其他"];

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

function normalizeAllPlanTypes(){
  (data.plans||[]).forEach(p=>{
    p.type = normalizePlanType(p.type);
  });
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


function handlePlanDayChange(day){
  const draft=getPlanFormDraft();
  draft.day=day;
  setCurrentDay(day,{render:false});
  renderPlanner({preserveForm:true});
  applyPlanFormDraft(draft);
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

function v24IsFlightPlan(p){
  return p?.source==="flight" || p?.sourceType==="flight" || p?.memo==="由航班資料帶入";
}

function flightHasPlans(){
  v28NormalizePlans();
  return data.plans.some(v24IsFlightPlan);
}


function removeFlightPlans(){
  v28DeletePlansBySource("flight");
  save();
  toast("已幫你移除航班行程囉！");
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


function flightTypeSelect(k, selected){
  return `<select id="${k}type" onchange="toggleFlightSegments('${k}')">
    <option value="direct" ${selected==="direct"?"selected":""}>直飛</option>
    <option value="transfer" ${selected==="transfer"?"selected":""}>轉機</option>
  </select>`;
}


function afterRenderFlightForms(){
  ["out","back"].forEach(k=>toggleFlightSegments(k));
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


/* 航班段落改為可摺疊 details，並加密度 class */


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


function terminalNote(s){
  const fromT=s.fromTerminal && s.fromTerminal!=="未定" ? `出發航廈：${s.fromTerminal}` : "";
  const toT=s.toTerminal && s.toTerminal!=="未定" ? `抵達航廈：${s.toTerminal}` : "";
  return [fromT,toT].filter(Boolean).join("｜");
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

function budgetAllItems(){
  const items=[];
  (data.expenses||[]).forEach(x=>{
    items.push({
      id:x.id,
      source:x.source||"預算",
      day:x.day||"",
      type:x.type||"其他",
      name:x.name||"未命名費用",
      payer:x.payer||"未定",
      payMethod:x.payMethod||"未定",
      foreign:moneyForeign(x),
      twd:moneyTwd(x),
      memo:x.memo||"",
      editable:true,
      kind:"expense"
    });
  });
  (data.conns||[])
    .filter(c=>Number(c.fareTwd||0)>0||Number(c.fareForeign||0)>0)
    .forEach((c,i)=>{
      items.push({
        id:"conn-"+i,
        source:"交通",
        day:"",
        type:c.mode||"交通",
        name:"行程間交通",
        payer:c.payer||"未定",
        payMethod:c.payMethod||"未定",
        foreign:Number(c.fareForeign||0),
        twd:Number(c.fareTwd||0),
        memo:"",
        editable:false,
        kind:"conn"
      });
    });
  return items;
}

function budgetTypeSummary(items){
  const map={};
  items.forEach(x=>{
    const amount=Number(x.twd||0);
    if(amount<=0)return;
    const type=x.type||"其他";
    map[type]=(map[type]||0)+amount;
  });
  return Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .map(([type,total])=>({type,total}));
}

function renderBudgetSummary(items){
  const groups=budgetTypeSummary(items);
  const total=items.reduce((s,x)=>s+Number(x.twd||0),0);
  const groupHtml=groups.map(g=>`<div class="budgetSummaryCard"><b>${esc(g.type)}</b><strong>TWD ${fmt(g.total)}</strong></div>`).join("");
  return `<div class="budgetSummaryGrid">
    <div class="budgetSummaryCard total"><b>總費用</b><strong>TWD ${fmt(total)}</strong></div>
    ${groupHtml || '<div class="budgetSummaryCard"><b>尚未有費用</b><strong>TWD 0</strong></div>'}
  </div>`;
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

function budgetDetailsHtml(items){
  return `<div class="budgetDesktopTable table">
    <table class="budgetDetailTable">
      <thead><tr>
        <th>來源</th>
        <th>日期</th>
        <th>類型</th>
        <th>項目</th>
        <th>付款人</th>
        <th>付款方式</th>
        <th>${esc(data.trip.currency)}</th>
        <th>TWD</th>
        <th>操作</th>
      </tr></thead>
      <tbody>${budgetDesktopRows(items)}</tbody>
    </table>
  </div>
  <div class="budgetMobileCards">${budgetMobileCards(items)}</div>`;
}

// 1) 航班 / 住宿來源行程不自動建立預算；口袋景點 / 手動行程仍會建立。
// 不改資料結構，只調整建立預算的小邏輯。
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
function delSpot(id){
  data.spots=data.spots.filter(x=>x.id!=id);
  if(editingSpotId==id)editingSpotId=null;
  save();
  toast("已刪除口袋景點");
}

// 2) 刪除預算項目不用彈跳確認。
function delExpense(id){
  data.expenses=data.expenses.filter(x=>x.id!=id);
  if(editingExpenseId==id)editingExpenseId=null;
  save();
  toast("已刪除預算");
}

// 3) 新增中國到旅遊國家與城市對應；盡量相容既有 v15 的城市選單流程。
currencyMap["中國"]="CNY";
rateMap["CNY"]=4.35;

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

function countryOptions(){
  const order=["韓國","日本","中國","香港","新加坡","泰國","越南","美國","歐洲","英國","其他"];
  const existing=Object.keys(currencyMap).filter(c=>!order.includes(c));
  return [...order.filter(c=>c==="其他" || currencyMap[c]),...existing]
    .map(c=>`<option value="${c}" ${data.trip.country==c?"selected":""}>${c}</option>`)
    .join("");
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

function updateCustomCityVisibility(){
  const citySel=$("citySelect");
  const box=$("customCityBox");
  if(!citySel || !box)return;
  box.style.display = citySel.value==="自訂" || $("country")?.value==="其他" ? "block" : "none";
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

function handleCountrySelectChange(){
  refreshCityOptions();
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
function setPhotoUploadStatus(id, message){
  const el=$(id);
  if(!el)return;
  el.textContent=message||"";
  el.classList.toggle("show", !!message);
}

async function uploadImageFileForPhotoBook(file, options={}, statusId="photoUploadStatus"){
  if(!file) throw new Error("請先選擇照片");
  if(file.size > CLOUDINARY_CONFIG.maxUploadBytes){
    setPhotoUploadStatus(statusId, "照片較大，正在壓縮中...");
  }else{
    setPhotoUploadStatus(statusId, "上傳中，先幫你壓縮照片...");
  }

  const blob = await compressImageToBlob(
    file,
    options.maxWidth || CLOUDINARY_CONFIG.maxWidth,
    options.quality || CLOUDINARY_CONFIG.quality
  );

  setPhotoUploadStatus(statusId, "上傳中...");
  const uploaded = await uploadBlobToCloudinary(blob, file.name || "travel-photo.jpg");
  setPhotoUploadStatus(statusId, "");

  return {
    src: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
    bytes: uploaded.bytes,
    cloudinary: true
  };
}


async function addTripCover(file){
  if(!file)return;
  try{
    setPhotoUploadStatus("coverUploadStatus", "上傳中...");
    const img = await uploadImageFileForPhotoBook(file, {maxWidth:1800, quality:.84}, "coverUploadStatus");
    data.tripCover=img.src;
    data.tripCoverMeta=img;
    save();
    setPhotoUploadStatus("coverUploadStatus", "");
    toast("旅遊書封面已上傳");
  }catch(err){
    setPhotoUploadStatus("coverUploadStatus", "");
    alert("封面上傳失敗：" + err.message);
  }
}

async function addDayCover(day,file){
  if(!file)return;
  try{
    setPhotoUploadStatus(`dayCoverStatus-${day}`, "上傳中...");
    const img = await uploadImageFileForPhotoBook(file, {maxWidth:1800, quality:.84}, `dayCoverStatus-${day}`);
    data.dayCovers[day]=img.src;
    if(!data.dayCoverMeta) data.dayCoverMeta={};
    data.dayCoverMeta[day]=img;
    save();
    setPhotoUploadStatus(`dayCoverStatus-${day}`, "");
    toast("本日封面圖已上傳");
  }catch(err){
    setPhotoUploadStatus(`dayCoverStatus-${day}`, "");
    alert("封面圖上傳失敗：" + err.message);
  }
}

async function addPhoto(){
  let f=$("phf")?.files?.[0];
  if(!f)return toast("請選照片");
  try{
    const img = await uploadImageFileForPhotoBook(f, {maxWidth:1600, quality:.82}, "photoUploadStatus");
    data.photos.unshift({
      id:uid(),
      day:$("phd").value,
      title:$("pht").value,
      memo:$("phm").value,
      tags:$("phtag")?.value || "",
      src:img.src,
      publicId:img.publicId,
      cloudinary:true,
      width:img.width,
      height:img.height,
      bytes:img.bytes
    });
    save();
    toast("照片已加入照片日記");
  }catch(err){
    setPhotoUploadStatus("photoUploadStatus", "");
    alert("照片上傳失敗：" + err.message);
  }
}


function photoBookDay(d){
  const plans=sortedPlans(d.key);
  const photos=data.photos.filter(p=>p.day==d.key);
  const cover=data.dayCovers[d.key];
  return `<div class="card bookDay">
    <div class="bookDayHeader">
      <div><span class="bookOrnament"></span><h2>${d.title}｜${d.label}</h2><div class="hint">本日住宿：${hotelFor(d.key)?.name||"未設定"}</div></div>
      <span class="bookDayBadge">${plans.length} 個行程｜${photos.length} 張照片</span>
      <div class="noPrint">
        <label class="small" style="display:inline-block;cursor:pointer">上傳本日封面<input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])" style="display:none"></label>
        <div class="mini">每日封面建議：橫式 1600×900px 以上</div>
        <div class="photoUploadStatus" id="dayCoverStatus-${d.key}"></div>
      </div>
    </div>
    ${cover?`<img class="dayCover" src="${cover}">`:`<div class="dayCover" style="display:grid;place-items:center;color:#999">尚未上傳本日封面圖</div>`}
    <div class="bookTimeline">${plans.map(p=>`<div class="bookTimelineItem"><div class="bookTimelineTime">${esc(p.start||"--:--")}</div><div class="bookTimelineContent"><b>${activityIcon(p.type)} ${esc(p.name)}</b><div class="mini">${esc(p.end?("結束 "+p.end):"")}</div>${p.note?`<div style="margin-top:4px">${esc(p.note)}</div>`:""}</div></div>`).join("")||'<div class="empty">這天還沒有行程</div>'}</div>
    <div class="photoGridPrint igPhotoGrid">${photos.map(p=>`
      <div class="photo igPhotoCard">
        <div class="igPhotoFrame"><img src="${p.src}"></div>
        <div class="igPhotoBody">
          <h3>${esc(p.title||"照片紀錄")}</h3>
          ${photoTagsHtml(p.tags)}
          <p class="mini">${esc(p.memo||"")}</p>
          <button class="small noPrint" onclick="delPhoto('${p.id}')">刪除</button>
        </div>
      </div>`).join("")||""}</div>
  </div>`;
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


let photoBookMode = "story";

function setPhotoBookMode(mode){
  photoBookMode = mode === "pdf" ? "pdf" : "story";
  renderPhotoBook();
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


function photoCountForDay(day){
  return (data.photos||[]).filter(p=>p.day==day).length;
}


/* 不新增原旅行 data 欄位；定位快取獨立存在 localStorage: travelBookMapCache */
const MAP_CACHE_KEY = "travelBookMapCache";
let routeMap = null;
let routeLayer = null;
let routeMapDay = null;

function mapCacheRead(){
  try{return JSON.parse(localStorage.getItem(MAP_CACHE_KEY)||"{}");}
  catch(e){return {};}
}
function mapCacheWrite(cache){
  try{localStorage.setItem(MAP_CACHE_KEY, JSON.stringify(cache));}
  catch(e){}
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

function v54EnsurePlanAddress(){
  (data.plans||[]).forEach(p=>{
    if(typeof p.address === "undefined") p.address = "";
  });
}


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

// 啟動移至檔案末尾
let storyPendingPhotoFiles = window.storyPendingPhotoFiles || {};
let storyEditingPhotoId = null;

function photoAttrEsc(v){
  return String(v ?? "").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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


try{
  if(typeof tab !== 'undefined' && tab === 'photoBook') renderPhotoBook();
}catch(e){}
let storyPhotoPreviewUrls = window.storyPhotoPreviewUrls || {};
let activePhotoEditId = null;

function revokeStoryPhotoPreview(day){
  if(storyPhotoPreviewUrls[day]){
    try{ URL.revokeObjectURL(storyPhotoPreviewUrls[day]); }catch(e){}
    delete storyPhotoPreviewUrls[day];
  }
}

function selectStoryPhotoFile(day, file){
  revokeStoryPhotoPreview(day);
  if(!file){
    delete storyPendingPhotoFiles[day];
    const meta = document.getElementById(`storyPhotoPickMeta-${day}`);
    const preview = document.getElementById(`storyPhotoPickPreview-${day}`);
    if(meta) meta.textContent = '請先選擇 1 張照片，再輸入標題與日記內容。';
    if(preview){
      preview.classList.remove('show');
      preview.innerHTML = '';
    }
    return;
  }
  storyPendingPhotoFiles[day] = file;
  const url = URL.createObjectURL(file);
  storyPhotoPreviewUrls[day] = url;

  const meta = document.getElementById(`storyPhotoPickMeta-${day}`);
  if(meta) meta.textContent = `已選擇：${file.name}`;

  const preview = document.getElementById(`storyPhotoPickPreview-${day}`);
  if(preview){
    preview.classList.add('show');
    preview.innerHTML = `<img src="${url}"><div>預覽照片：新增後會上傳到照片日記</div>`;
  }
}

function clearPendingStoryPhoto(day){
  revokeStoryPhotoPreview(day);
  delete storyPendingPhotoFiles[day];
  const input = document.getElementById(`storyPhotoFile-${day}`);
  if(input) input.value = '';
  const meta = document.getElementById(`storyPhotoPickMeta-${day}`);
  if(meta) meta.textContent = '請先選擇 1 張照片，再輸入標題與日記內容。';
  const preview = document.getElementById(`storyPhotoPickPreview-${day}`);
  if(preview){
    preview.classList.remove('show');
    preview.innerHTML = '';
  }
}


async function addPhotoToDay(day){
  const file = storyPendingPhotoFiles[day];
  if(!file){
    toast('請先選擇照片');
    return;
  }
  const count = photoCountForDay(day);
  if(count >= 10){
    toast('這天最多上傳 10 張照片');
    return;
  }
  try{
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, '上傳中...');
    const img = await uploadImageFileForPhotoBook(file, {maxWidth:1600, quality:.82}, `storyPhotoStatus-${day}`);
    const title = document.getElementById(`storyPhotoTitle-${day}`)?.value || '';
    const tags = document.getElementById(`storyPhotoTags-${day}`)?.value || '';
    const memo = document.getElementById(`storyPhotoMemo-${day}`)?.value || '';
    data.photos.unshift({
      id:uid(),
      day:day,
      title:title,
      memo:memo,
      tags:tags,
      src:img.src,
      publicId:img.publicId,
      cloudinary:true,
      width:img.width,
      height:img.height,
      bytes:img.bytes
    });
    clearPendingStoryPhoto(day);
    activePhotoEditId = null;
    const ids = [`storyPhotoTitle-${day}`, `storyPhotoTags-${day}`, `storyPhotoMemo-${day}`];
    ids.forEach(id=>{ const el = document.getElementById(id); if(el) el.value = ''; });
    save();
    toast('照片已加入這天的照片日記');
  }catch(err){
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, '');
    alert('照片上傳失敗：' + err.message);
  }
}


function closePhotoEditModal(){
  const modal = document.getElementById('photoEditModal');
  if(modal) modal.classList.remove('show');
  activePhotoEditId = null;
}


function beginEditPhoto(id){
  openPhotoEditModal(id);
}


try{
  if(typeof tab !== 'undefined' && tab === 'photoBook') renderPhotoBook();
}catch(e){}
function pdfEsc(v){
  return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function pdfPlain(v, fallback="未設定"){
  const s = String(v ?? "").trim();
  return s || fallback;
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


window.addEventListener("afterprint", ()=>{
  document.body.classList.remove("printPhotoBook");
});
/* index.html 保持旅行工具；照片書匯出改為開啟獨立出版頁 */
function openPdfPublisher(autoPrint=false){
  try{ save(); }catch(e){}
  window.open("export.html", "_blank");
}
function exportPhotoBookPDF(){
  openPdfPublisher(false);
}
const V63_ALLOWED_EMAILS = ["jan33772001@gmail.com"];
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
function getTripListKey(){
  return `${V63_TRIP_LIST_KEY_PREFIX}_${v63UserKey()}`;
}
function getLocalTripKey(tripId=currentTripId){
  return `janeselect_travel_data_v63_${v63UserKey()}_${tripId || "draft"}`;
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
function v63TripIndexRef(){
  if(!fbUser) throw new Error("尚未登入");
  return fbDb.collection("users").doc(fbUser.uid).collection("tripIndex").doc("list");
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
function v63NewTripCountryChanged(){
  const c=$("newTripCountry")?.value;
  const map=typeof v15CountryCityMaps==="function" ? v15CountryCityMaps().cityMap : {};
  const first=(map[c]||[])[0] || "";
  if($("newTripCity"))$("newTripCity").value=first;
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
function firstCloudLoadOrCreate(){
  return currentTripId ? loadFromCloud().catch(()=>{}) : Promise.resolve();
}
function editHotel(id){editingHotelId=id;v16KeepHotelOpen=true;go("stay");}
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
    try{
      const snap=await fbDb.collection("allowedUsers").get();
      if(!snap.empty){
        const emails=[];
        snap.forEach(doc=>emails.push(doc.id.toLowerCase()));
        V63_ALLOWED_EMAILS=emails;
        if(!V63_ALLOWED_EMAILS.includes("jan33772001@gmail.com"))
          V63_ALLOWED_EMAILS.push("jan33772001@gmail.com");
      }
    }catch(e){console.warn("白名單讀取失敗，使用內建",e.message);}
    fbAuth.onAuthStateChanged(v63HandleAuth);
  }
}
// v63Boot 移至末尾
function v631BrandTitle(){
  document.title="貞選旅管家";
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
function tripDocRef(){
  if(!fbUser) throw new Error("尚未登入");
  if(!currentTripId) throw new Error("尚未選擇旅程");
  return fbDb.collection("users").doc(fbUser.uid).collection("trips").doc(currentTripId);
}
function v632StatusBadge(){
  const s=v632LastSyncState || {};
  const kind=s.kind||"off";
  const label=kind==="on"?"雲端已同步":kind==="warn"?"雲端同步中":"雲端未確認";
  const time=s.at?new Date(s.at).toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"}):"";
  return `<span class="syncCloudBadge ${kind}">${label}${time?`｜${time}`:""}</span>`;
}
function v63PersistTripLocal(){
  if(currentTripId){
    localStorage.setItem(getLocalTripKey(currentTripId), JSON.stringify(data));
    v632SetLocalMeta(currentTripId,{updatedAtClient:v632Now(), tripId:currentTripId, title:data?.meta?.title||"", dest:data?.trip?.dest||""});
    try{ localStorage.setItem("voyageMemoData", JSON.stringify(data)); }catch(e){}
  }
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
async function v63SaveTripListCloud(){
  v63SaveTripListLocal();
  if(fbUser && fbDb){
    await v632SaveTripIndexCloud();
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
// 重新標示目前版本，保留頁尾原資訊之外再補 v63.2 狀態。
document.addEventListener("DOMContentLoaded",()=>{
  const footer=document.querySelector("footer strong");
  if(footer && !footer.textContent.includes("v63.2"))footer.textContent="版本：v63.2｜2026-05-30｜多旅程雲端同步穩定修正版";
});
function v634ThemeLabel(){
  const prefs=applyThemePrefs(getThemePrefs());
  const mode=THEME_CONFIG.modes[prefs.mode]?.label || "淺色";
  const palette=THEME_CONFIG.palettes[prefs.palette]?.label || "韓系清新";
  return `${palette}・${mode}`;
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
function renderThemeWidgetState(){
  const prefs=applyThemePrefs(getThemePrefs());
  if($("themeModeSelect")) $("themeModeSelect").value = prefs.mode;
  if($("themePaletteSelect")) $("themePaletteSelect").value = prefs.palette;
  if($("themeCardStyleSelect")) $("themeCardStyleSelect").value = prefs.cardStyle;
  if($("themeCurrentText")) $("themeCurrentText").textContent = v634ThemeLabel();
}
document.addEventListener("keydown", function(e){
  if(e.key==="Escape")closeThemePanel();
});
document.addEventListener("DOMContentLoaded",()=>{
  const footer=document.querySelector("footer strong");
  if(footer)footer.textContent="版本：v63.4｜2026-05-30｜外觀設定與頁籤可讀性優化版";
});
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
loadTrips = async function(){
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

function v637PolicyToast(name){ toast(`${name}內容尚未設定，之後可接到獨立頁面或後台設定。`); }
function v637EnsureFooter(){
  document.querySelectorAll('.app > footer').forEach(f=>f.classList.add('legacyFooter'));
  let f=$('siteFooter');
  if(!f){ document.body.insertAdjacentHTML('beforeend', v637FooterHtml()); }
  else { f.outerHTML=v637FooterHtml(); }
}

/* 讓 login/list/app 切換時，footer 都存在 */
  v63ShowShell = function(mode){
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

function v64SafeOpen(url){
  if(typeof openExternal === 'function') return openExternal(url);
  try{ window.open(String(url||''), '_blank', 'noopener,noreferrer'); }catch(e){}
}
function v64Copy(text, doneText='已複製'){
  const t=String(text||'');
  if(navigator.clipboard && window.isSecureContext){
    return navigator.clipboard.writeText(t).then(()=>toast(doneText)).catch(()=>v64FallbackCopy(t,doneText));
  }
  return Promise.resolve(v64FallbackCopy(t,doneText));
}
function v64FallbackCopy(text, doneText){
  const ta=document.createElement('textarea');
  ta.value=String(text||'');
  ta.style.position='fixed';
  ta.style.left='-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try{ document.execCommand('copy'); toast(doneText || '已複製'); }
  catch(e){ toast('複製失敗，請手動複製'); }
  ta.remove();
}
function v64Clean(v){ return String(v||'').replace(/\s+/g,' ').trim(); }
function v64JsonText(raw){
  if(typeof normalizeImportedJsonText === 'function') return normalizeImportedJsonText(raw);
  let t=String(raw||'').trim();
  if(t.startsWith('```')) t=t.replace(/^```json/i,'').replace(/^```/,'').replace(/```$/,'').trim();
  const first=t.indexOf('{'), last=t.lastIndexOf('}');
  if(first>=0 && last>first) t=t.slice(first,last+1);
  return t;
}
function v64TripContext(){
  const days=(data.days||[]).map(d=>`${d.key}（${d.title}｜${d.label}）`).join('\n') || '尚未設定日期';
  const hotels=(data.hotels||[]).map(h=>`${short(h.start)}~${short(h.end)} ${h.name}${h.addr?'｜'+h.addr:''}${h.note?'｜'+h.note:''}`).join('\n') || '尚未設定住宿';
  const plans=(data.plans||[]).sort((a,b)=>String(a.day).localeCompare(String(b.day))||String(a.start).localeCompare(String(b.start))).map(p=>`${p.day} ${p.start||''}-${p.end||''}｜${p.type||'行程'}｜${p.name}${p.address||p.addr?'｜地址：'+(p.address||p.addr):''}${p.note?'｜注意：'+p.note:''}`).join('\n') || '尚未建立行程';
  const spots=(data.spots||[]).map(s=>`${s.name}｜${s.type||'景點'}｜${s.day||'未排'}｜${s.addr||''}｜${s.memo||''}`).join('\n') || '尚未加入口袋景點';
  const expenses=(data.expenses||[]).map(x=>`${x.type||'費用'}｜${x.name||''}｜TWD ${moneyTwd(x)||0}｜${x.memo||''}`).join('\n') || '尚未新增額外費用';
  const packing=(data.packing||[]).map(x=>`${x.type==='out'?'離開飯店':'出國前'}｜${x.name}｜${x.note||''}`).join('\n') || '尚未建立行李清單';
  return {days,hotels,plans,spots,expenses,packing};
}
function v64EnsureAiPromptModal(){
  if($('v64AiPromptModal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="v64AiModal noPrint" id="v64AiPromptModal" aria-hidden="true">
    <div class="v64AiBox">
      <div class="v64AiHead">
        <div><h3 id="v64AiPromptTitle">AI 輔助</h3><p id="v64AiPromptDesc">複製提示詞後，可貼到 ChatGPT 或 Gemini 使用。</p></div>
        <button type="button" class="iconBtn" onclick="v64CloseAiPrompt()">×</button>
      </div>
      <textarea id="v64AiPromptText"></textarea>
      <div class="btns">
        <button class="btn dark" type="button" onclick="v64OpenAiTarget('chatgpt')">ChatGPT</button>
        <button class="btn blue" type="button" onclick="v64OpenAiTarget('gemini')">Gemini</button>
        <button class="btn soft" type="button" onclick="v64CopyAiPrompt()">複製</button>
        <button class="btn" type="button" onclick="v64CloseAiPrompt()">關閉</button>
      </div>
    </div>
  </div>`);
}
function v64CloseAiPrompt(){
  $('v64AiPromptModal')?.classList.remove('show');
  $('v64AiPromptModal')?.setAttribute('aria-hidden','true');
}
function v64CopyAiPrompt(){
  const t=$('v64AiPromptText')?.value || '';
  v64Copy(t,'已複製提示詞');
}
function v64OpenAiTarget(target){
  const t=$('v64AiPromptText')?.value || '';
  v64Copy(t,'已複製提示詞');
  v64SafeOpen(target==='gemini' ? 'https://gemini.google.com/app' : 'https://chatgpt.com/');
}

function v64EnsureImportModal(){
  if($('v64AiImportModal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="v64AiModal noPrint" id="v64AiImportModal" aria-hidden="true">
    <div class="v64AiBox">
      <div class="v64AiHead">
        <div><h3>AI 匯入</h3><p>貼上 AI 回傳的 JSON，系統會先解析成可調整的資料，再新增到目前旅程。</p></div>
        <button type="button" class="iconBtn" onclick="v64CloseImportModal()">×</button>
      </div>
      <textarea id="v64AiImportText" placeholder="請貼上 AI 回傳的 JSON"></textarea>
      <div class="v64ImportPreview" id="v64AiImportPreview">支援：口袋景點、行李清單、預算草稿。AI 不會直接覆蓋既有資料。</div>
      <div class="btns">
        <button class="btn dark" type="button" onclick="v64ImportAiText()">匯入</button>
        <button class="btn soft" type="button" onclick="v64CloseImportModal()">關閉</button>
      </div>
    </div>
  </div>`);
}
function v64CloseImportModal(){
  $('v64AiImportModal')?.classList.remove('show');
  $('v64AiImportModal')?.setAttribute('aria-hidden','true');
}
function v64ArrayFromImport(obj, fallbackKey){
  if(Array.isArray(obj)) return obj;
  if(Array.isArray(obj.items)) return obj.items;
  if(fallbackKey && Array.isArray(obj[fallbackKey])) return obj[fallbackKey];
  if(Array.isArray(obj.spots)) return obj.spots;
  return [];
}
function v64ShowImportReview(summary){
  v64EnsureImportModal();
  $('v64AiImportPreview').innerHTML = `<b>行程健檢結果</b><br>${esc(summary)}`;
}

function v64SpotQuery(s){
  return v64Clean([s?.name, s?.addr, data.trip?.dest].filter(Boolean).join(' '));
}
function v64GoogleSearchUrl(q){
  return 'https://www.google.com/search?q=' + encodeURIComponent(v64Clean(q));
}
function v64YoutubeSearchUrl(q){
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(v64Clean(q));
}
function v64GoogleImageUrl(q){
  return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(v64Clean(q));
}
function v64OfficialSearchUrl(q){
  return 'https://www.google.com/search?q=' + encodeURIComponent(v64Clean(q + ' official tourism'));
}
function v64OpenSpotExplore(id){
  const s=(data.spots||[]).find(x=>x.id===id);
  if(!s) return toast('找不到景點');
  if(!$('v64SpotExploreModal')){
    document.body.insertAdjacentHTML('beforeend', `<div class="v64AiModal noPrint" id="v64SpotExploreModal" aria-hidden="true">
      <div class="v64AiBox">
        <div class="v64AiHead">
          <div><h3 id="v64ExploreTitle">景點探索</h3><p id="v64ExploreDesc"></p></div>
          <button type="button" class="iconBtn" onclick="v64CloseSpotExplore()">×</button>
        </div>
        <div class="v64ExploreQuery" id="v64ExploreQuery"></div>
        <div class="v64ExploreGrid" id="v64ExploreActions"></div>
      </div>
    </div>`);
  }
  const q=v64SpotQuery(s);
  $('v64ExploreTitle').textContent=s.name || '景點探索';
  $('v64ExploreDesc').textContent=[s.type, s.addr].filter(Boolean).join('｜') || '快速查找遊記、影片、打卡與官方資料。';
  $('v64ExploreQuery').innerHTML=`搜尋關鍵字：<b>${esc(q)}</b>`;
  const actions=[
    ['遊記', v64GoogleSearchUrl(q + ' 遊記 怎麼玩')],
    ['影片', v64YoutubeSearchUrl(q + ' vlog')],
    ['打卡', v64GoogleImageUrl(q + ' 打卡 照片')],
    ['官方', v64OfficialSearchUrl(q)],
    ['AI 摘要', null]
  ];
  $('v64ExploreActions').innerHTML=actions.map((a,i)=>`<button class="btn ${i===0?'dark':i===4?'pink':'soft'}" type="button" data-v64-explore="${i}">${esc(a[0])}</button>`).join('');
  $('v64ExploreActions').querySelectorAll('[data-v64-explore]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const idx=Number(btn.dataset.v64Explore);
      if(idx===4) return v64ShowPrompt('spot_summary','AI 摘要','可把搜尋結果或遊記連結一起貼給 AI，整理成玩法重點。',id);
      v64SafeOpen(actions[idx][1]);
    });
  });
  $('v64SpotExploreModal').classList.add('show');
  $('v64SpotExploreModal').setAttribute('aria-hidden','false');
}
function v64CloseSpotExplore(){
  $('v64SpotExploreModal')?.classList.remove('show');
  $('v64SpotExploreModal')?.setAttribute('aria-hidden','true');
}

function v64ReplaceOldSpotAiBar(){
  const root=$('spotsView');
  if(!root) return;
  root.querySelectorAll('#v64AiBar-spots').forEach(x=>x.remove());
  const old=[...root.querySelectorAll('.card')].find(card=>/AI 景點提示詞|匯入口袋景點/.test(card.textContent||''));
  if(old){
    old.outerHTML=v64AiBarHtml('spots');
  }else{
    const section=root.querySelector('.section');
    section?.insertAdjacentHTML('afterend', v64AiBarHtml('spots'));
  }
}
function v64AddSpotExploreButtons(){
  const root=$('spotsView');
  if(!root) return;
  root.querySelectorAll('.card').forEach(card=>{
    if(!card.querySelector('.place')) return;
    if(card.querySelector('[data-v64-spot-explore]')) return;
    const btns=card.querySelector('.btns');
    if(!btns) return;
    const m=(btns.innerHTML||'').match(/editSpot\('([^']+)'\)/) || (btns.innerHTML||'').match(/useSpot\('([^']+)'\)/);
    if(!m) return;
    const id=m[1];
    btns.insertAdjacentHTML('afterbegin', `<button class="btn soft compact v64SpotExploreBtn" data-v64-spot-explore="${id}" onclick="v64OpenSpotExplore('${id}')">探索</button>`);
  });
}
function v64PatchSpots(){
  v64ReplaceOldSpotAiBar();
  v64AddSpotExploreButtons();
}
try{
  if(typeof v637FooterHtml === 'function'){
    v637FooterHtml = function(){
      return `<footer id="siteFooter" class="siteFooter noPrint">
        <div class="siteFooterBrand">貞選旅管家 <span>Janeselect Travel Manager</span></div>
        <div class="siteFooterVersion">${esc(V64_VERSION_SHORT)}</div>
        <div class="siteFooterLinks">
          <button type="button" onclick="v637PolicyToast('服務條款')">服務條款</button><span>・</span>
          <button type="button" onclick="v637PolicyToast('隱私權政策')">隱私權政策</button><span>・</span>
          <button type="button" onclick="v637PolicyToast('聯絡我們')">聯絡我們</button>
        </div>
        <div class="siteFooterCopy">© 2026 Janeselect Travel Manager. All rights reserved.</div>
      </footer>`;
    };
  }
  if(typeof v641UpdateFooterVersion === 'function'){
    v641UpdateFooterVersion = v64UpdateFooterVersion;
  }
}catch(e){}

const v64OriginalRenderSpots = typeof renderSpots === 'function' ? renderSpots : null;
if(v64OriginalRenderSpots && !v64OriginalRenderSpots.__v64AiWrapped){
  renderSpots.__v64AiWrapped=true;
}
const v64OriginalRenderPlanner = typeof renderPlanner === 'function' ? renderPlanner : null;
if(v64OriginalRenderPlanner && !v64OriginalRenderPlanner.__v64AiWrapped){
  renderPlanner.__v64AiWrapped=true;
}
const v64OriginalRenderPacking = typeof renderPacking === 'function' ? renderPacking : null;
if(v64OriginalRenderPacking && !v64OriginalRenderPacking.__v64AiWrapped){
  renderPacking = function(...args){
    const r=v64OriginalRenderPacking.apply(this,args);
    setTimeout(()=>v64InsertAiBar('packingView','packing'),0);
    return r;
  };
  renderPacking.__v64AiWrapped=true;
}
const v64OriginalRenderBudget = typeof renderBudget === 'function' ? renderBudget : null;
if(v64OriginalRenderBudget && !v64OriginalRenderBudget.__v64AiWrapped){
  renderBudget = function(...args){
    const r=v64OriginalRenderBudget.apply(this,args);
    setTimeout(()=>v64InsertAiBar('budgetView','budget'),0);
    return r;
  };
  renderBudget.__v64AiWrapped=true;
}

/* 說明頁：最新更新紀錄只保留最新版，其他歷史更新移除。 */

function v64AfterRender(){
  v64PatchSpots();
  v64InsertAiBar('plannerView','planner');
  v64InsertAiBar('packingView','packing');
  v64InsertAiBar('budgetView','budget');
  v64UpdateFooterVersion();
  if(typeof v641PatchAnchorTargets === 'function') v641PatchAnchorTargets(document);
}
const v64OriginalRender = typeof render === 'function' ? render : null;
if(v64OriginalRender && !v64OriginalRender.__v64AiWrapped){
  render.__v64AiWrapped=true;
}
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(v64AfterRender,300);
  setTimeout(v64AfterRender,900);
});
setTimeout(()=>{
  v64AfterRender();
  try{ if(typeof render === 'function') render(); }catch(e){}
},500);
const V641_VERSION_SHORT = '版本：v64.1｜2026-05-31';
const V641_VERSION_TEXT = 'v64.1｜2026-05-31｜AI 健檢偏好與匯入顯示優化版';
const V641_PREF_KEY = 'janeselectAiPrefs_v1';

function v641LoadPrefs(){
  try{return JSON.parse(localStorage.getItem(V641_PREF_KEY)||'{}')||{};}catch(e){return {};}
}
function v641SavePrefsFromDom(){
  const prefs={
    style:$('v641TravelStyle')?.value||'',
    mbti:$('v641Mbti')?.value||'',
    zodiac:$('v641Zodiac')?.value||''
  };
  try{localStorage.setItem(V641_PREF_KEY,JSON.stringify(prefs));}catch(e){}
  return prefs;
}
function v641PrefsText(){
  const p=v641SavePrefsFromDom();
  const parts=[];
  if(p.style) parts.push('旅遊風格偏好：'+p.style);
  if(p.mbti) parts.push('MBTI：'+p.mbti);
  if(p.zodiac) parts.push('星座：'+p.zodiac);
  return parts.length ? parts.join('\n') : '未填寫，請以一般旅遊者需求判斷。';
}
function v641PrefsHtml(){
  const p=v641LoadPrefs();
  const styles=['','輕鬆慢旅','高效率踩點','美食咖啡優先','拍照打卡優先','親子友善','購物優先','文化歷史優先','自然風景優先','雨天備案優先'];
  const mbtis=['','INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
  const zodiacs=['','牡羊座','金牛座','雙子座','巨蟹座','獅子座','處女座','天秤座','天蠍座','射手座','摩羯座','水瓶座','雙魚座'];
  const opts=(arr,val)=>arr.map(x=>`<option value="${esc(x)}" ${x===(val||'')?'selected':''}>${x?esc(x):'不指定'}</option>`).join('');
  return `<div class="v641Prefs">
    <div class="v641PrefsTitle">偏好參考（非必填）</div>
    <div class="v641PrefsGrid">
      <div><label>旅遊風格</label><select id="v641TravelStyle" onchange="v641SavePrefsFromDom()">${opts(styles,p.style)}</select></div>
      <div><label>MBTI</label><select id="v641Mbti" onchange="v641SavePrefsFromDom()">${opts(mbtis,p.mbti)}</select></div>
      <div><label>星座</label><select id="v641Zodiac" onchange="v641SavePrefsFromDom()">${opts(zodiacs,p.zodiac)}</select></div>
    </div>
  </div>`;
}
function v641EnsureAiReviews(){
  if(!data.aiReviews || typeof data.aiReviews!=='object') data.aiReviews={};
  if(!Array.isArray(data.aiReviews.itinerary)) data.aiReviews.itinerary=[];
  return data.aiReviews.itinerary;
}
function v641SaveItineraryReview(obj){
  const reviews=v641EnsureAiReviews();
  const review={
    id:uid(),
    createdAt:new Date().toISOString(),
    summary:String(obj.summary||''),
    items:Array.isArray(obj.items)?obj.items.map(x=>({
      day:String(x.day||''),
      level:String(x.level||'建議'),
      title:String(x.title||'AI 建議'),
      memo:String(x.memo||'')
    })).filter(x=>x.title||x.memo):[]
  };
  if(!review.summary && review.items.length){
    review.summary=review.items.map(x=>`${x.day||''} ${x.title}：${x.memo}`).join('\n');
  }
  reviews.unshift(review);
  data.aiReviews.itinerary=reviews.slice(0,5);
  return review;
}
function v641DeleteReview(id){
  if(!data.aiReviews?.itinerary) return;
  data.aiReviews.itinerary=data.aiReviews.itinerary.filter(x=>x.id!==id);
  save();
}
function v641ReviewHtml(){
  const reviews=(data.aiReviews?.itinerary||[]).slice(0,3);
  if(!reviews.length) return '';
  return `<div class="v641ReviewList">
    ${reviews.map(r=>`<div class="v641ReviewCard">
      <div class="v641ReviewHead"><div><b>AI 健檢建議</b><span>${esc((r.createdAt||'').slice(0,10))}｜只作為調整參考，不會自動覆蓋行程。</span></div><button class="small" onclick="v641DeleteReview('${r.id}')">刪除</button></div>
      ${r.summary?`<div class="box mint">${esc(r.summary)}</div>`:''}
      ${r.items?.length?`<div class="v641ReviewItems">${r.items.map(x=>`<div class="v641ReviewItem"><em>${esc(x.day||'全旅程')}｜${esc(x.level||'建議')}</em><strong>${esc(x.title||'AI 建議')}</strong>${esc(x.memo||'')}</div>`).join('')}</div>`:''}
    </div>`).join('')}
  </div>`;
}

/* 重新定義 AI prompt 內容：行程健檢不再包含口袋景點 */
const v641OriginalBuildPrompt = typeof v64BuildPrompt==='function' ? v64BuildPrompt : null;

/* 重設 AI 工具列：保留短按鈕，但在行程加偏好欄位 */
const v641OriginalAiBarHtml = typeof v64AiBarHtml==='function' ? v64AiBarHtml : null;

/* 匯入視窗支援指定目前期待的匯入類型，讓行程健檢不再無感 */
const v641OriginalOpenImportModal = typeof v64OpenImportModal==='function' ? v64OpenImportModal : null;
v64OpenImportModal = function(expectedType){
  v64EnsureImportModal();
  $('v64AiImportText').value='';
  const msg = expectedType==='itinerary'
    ? '請貼上 AI 健檢回傳的 JSON。匯入後會出現在行程頁的「AI 健檢建議」卡片，不會自動改時間或重排行程。'
    : '支援：口袋景點、行李清單、預算草稿。AI 不會直接覆蓋既有資料。';
  $('v64AiImportPreview').textContent=msg;
  $('v64AiImportModal').dataset.expectedType=expectedType||'';
  $('v64AiImportModal').classList.add('show');
  $('v64AiImportModal').setAttribute('aria-hidden','false');
};

const v641OriginalImportAiObject = typeof v64ImportAiObject==='function' ? v64ImportAiObject : null;

v64ImportAiText = function(){
  const raw=$('v64AiImportText')?.value || '';
  if(!raw.trim()) return toast('請先貼上 AI 回覆');
  try{
    const obj=JSON.parse(v64JsonText(raw));
    const result=v64ImportAiObject(obj);
    if(!result.count) throw new Error('no items');
    silentSave();
    render();
    v64CloseImportModal();
    if(result.label==='AI 健檢建議'){
      setTimeout(()=>go('planner'),80);
      toast('已匯入 AI 健檢建議');
    }else{
      toast(`已匯入 ${result.count} 筆${result.label}`);
    }
  }catch(e){
    $('v64AiImportPreview').textContent='匯入失敗：請確認貼上的是純 JSON，且格式符合 AI 提示詞要求。';
  }
};

/* 將 AI 健檢建議卡片接在行程 AI 區塊下方 */
const v641OriginalInsertAiBar = typeof v64InsertAiBar==='function' ? v64InsertAiBar : null;
v64InsertAiBar = function(viewId, kind){
  const root=$(viewId);
  if(!root) return;
  if(v641OriginalInsertAiBar) v641OriginalInsertAiBar(viewId, kind);
  if(kind==='planner'){
    root.querySelectorAll('#v641ReviewBlock').forEach(x=>x.remove());
    const bar=root.querySelector('#v64AiBar-planner');
    const html=v641ReviewHtml();
    if(bar && html) bar.insertAdjacentHTML('afterend', `<div id="v641ReviewBlock">${html}</div>`);
  }
};

/* 修正探索中 AI 摘要彈窗層級；點 AI 摘要時提示詞一定在最上層 */
const v641OriginalShowPrompt = typeof v64ShowPrompt==='function' ? v64ShowPrompt : null;
v64ShowPrompt = function(type, title, desc, spotId){
  if(v641OriginalShowPrompt) v641OriginalShowPrompt(type,title,desc,spotId);
  const modal=$('v64AiPromptModal');
  if(modal){
    modal.style.zIndex='360';
    modal.classList.add('show');
  }
};

/* 更新說明頁與頁尾版本，只保留最新版紀錄 */
v64UpdateFooterVersion = function(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V641_VERSION_SHORT);
  if(typeof v637EnsureFooter === 'function') v637EnsureFooter();
};

setTimeout(()=>{
  try{v64AfterRender?.(); v64UpdateFooterVersion(); if(typeof render==='function')render();}catch(e){console.warn(e)}
},250);
function v64BrandRestoreMarkSvg(){
  return `<span class="brandMark" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false"><rect x="10" y="13" width="40" height="43" rx="10"></rect><path d="M22 13c1.7-5.4 13.9-5.4 15.6 0"></path><path d="M21 28h18M21 38h14"></path><circle cx="45" cy="18" r="6"></circle><path d="M45 14v4l3 2"></path></svg></span>`;
}
function v64BrandRestoreFavicon(){
  const fav=document.getElementById('janeselectFavicon');
  if(!fav)return;
  fav.href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%234A5D4E'/%3E%3Cpath d='M20 18h25a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H20a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z' fill='%23FFFAF2'/%3E%3Cpath d='M22 16c2-7 17-7 19 0' fill='none' stroke='%23FFFAF2' stroke-width='4' stroke-linecap='round'/%3E%3Cpath d='M24 31h17M24 40h13' stroke='%234A5D4E' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='45' cy='19' r='7' fill='%23E5ECE9'/%3E%3Cpath d='M45 15v5l4 2' stroke='%234A5D4E' stroke-width='2.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
  fav.dataset.v64BrandRestored='1';
}
function v64BrandRestoreApply(){
  document.title = (data?.meta?.title ? data.meta.title + '｜' : '') + '貞選旅管家';
  document.querySelectorAll('.badge').forEach(el=>{
    el.innerHTML = `${v64BrandRestoreMarkSvg()}<span>貞選旅管家</span>`;
    el.dataset.v64BrandRestored='1';
  });
  document.querySelectorAll('.loginBrand').forEach(el=>{
    el.innerHTML = `${v64BrandRestoreMarkSvg()}<span><b>貞選旅管家</b><small>Janeselect Travel Manager</small></span>`;
    el.dataset.v64BrandRestored='1';
  });
  document.querySelectorAll('.siteFooterBrand').forEach(el=>{
    el.innerHTML='貞選旅管家 <span>Janeselect Travel Manager</span>';
  });
  v64BrandRestoreFavicon();
}
(function(){
  const prevRenderHead = typeof renderHead==='function' ? renderHead : null;
  if(prevRenderHead && !window.__v64BrandRestoreRenderHeadPatched){
    renderHead = function(...args){
      const r = prevRenderHead.apply(this,args);
      v64BrandRestoreApply();
      return r;
    };
    window.__v64BrandRestoreRenderHeadPatched=true;
  }
  const prevRenderLogin = typeof renderLoginView==='function' ? renderLoginView : null;
  if(prevRenderLogin && !window.__v64BrandRestoreLoginPatched){
    renderLoginView = function(...args){
      const r = prevRenderLogin.apply(this,args);
      v64BrandRestoreApply();
      return r;
    };
    window.__v64BrandRestoreLoginPatched=true;
  }
  const prevRenderList = typeof renderTripList==='function' ? renderTripList : null;
  if(prevRenderList && !window.__v64BrandRestoreListPatched){
    renderTripList = function(...args){
      const r = prevRenderList.apply(this,args);
      v64BrandRestoreApply();
      return r;
    };
    window.__v64BrandRestoreListPatched=true;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    v64BrandRestoreApply();
    setTimeout(v64BrandRestoreApply,280);
    setTimeout(v64BrandRestoreApply,900);
  });
  setTimeout(v64BrandRestoreApply,120);
})();
const V643_VERSION_SHORT = "v64.3｜2026-05-31";
const V643_VERSION_TEXT = "v64.3｜日期調整保護與資料保留版";
let v643PendingBasic = null;

function v643ReadTripBasicFromForm(){
  const selectedCountry = $("country")?.value || data.trip.country || "";
  const cityEl = $("citySelect");
  let selectedCity = cityEl ? cityEl.value : (data.trip.city || "");
  let city = selectedCity;
  if(selectedCity === "自訂" && $("cityCustom")) city = $("cityCustom").value.trim();
  const dest = (typeof v15DestinationName === 'function')
    ? v15DestinationName(selectedCountry, city)
    : (($("dest")?.value || data.trip.dest || "").trim());
  const count = Number($("travelerCount")?.value || data.trip.travelerCount || 1);
  const travelers=[];
  for(let i=0;i<count;i++) travelers.push($("traveler"+i)?.value || data.trip.travelers?.[i] || String.fromCharCode(65+i));
  return {
    country:selectedCountry,
    city,
    dest,
    currency:($("currency")?.value || data.trip.currency || "").toUpperCase(),
    rate:Number($("rateSetup")?.value || data.trip.rate || 1),
    travelerCount:count,
    travelers,
    start:$("start")?.value || data.trip.start || "",
    end:$("end")?.value || data.trip.end || ""
  };
}
function v643ApplyBasicFields(basic){
  if(!basic) return;
  data.trip.country = basic.country;
  data.trip.city = basic.city;
  data.trip.dest = basic.dest;
  data.trip.currency = basic.currency;
  data.trip.rate = basic.rate;
  data.trip.travelerCount = basic.travelerCount;
  data.trip.travelers = basic.travelers;
}
function v643DaysBetween(a,b){
  if(!a || !b) return 0;
  const d1=parseLocalDate(a), d2=parseLocalDate(b);
  return Math.round((d2-d1)/86400000);
}
function v643ShiftDate(value, offset){
  if(!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value;
  const d=parseLocalDate(value);
  d.setDate(d.getDate()+Number(offset||0));
  return formatLocalDate(d);
}
function v643ShiftDateTime(value, offset){
  if(!value || !/^\d{4}-\d{2}-\d{2}T/.test(String(value))) return value;
  return v643ShiftDate(value.slice(0,10), offset) + value.slice(10);
}
function v643WithinRange(day,start,end){
  if(!day || !start || !end) return true;
  return day >= start && day <= end;
}
function v643OutOfRangeCounts(start,end){
  const out={plans:0,spots:0,expenses:0,photos:0,covers:0,hotels:0,total:0};
  (data.plans||[]).forEach(x=>{ if(x.day && !v643WithinRange(x.day,start,end)) out.plans++; });
  (data.spots||[]).forEach(x=>{ if(x.day && !v643WithinRange(x.day,start,end)) out.spots++; });
  (data.expenses||[]).forEach(x=>{ if(x.day && !v643WithinRange(x.day,start,end)) out.expenses++; });
  (data.photos||[]).forEach(x=>{ if(x.day && !v643WithinRange(x.day,start,end)) out.photos++; });
  Object.keys(data.dayCovers||{}).forEach(k=>{ if(!v643WithinRange(k,start,end)) out.covers++; });
  (data.hotels||[]).forEach(h=>{ if((h.start && !v643WithinRange(h.start,start,end)) || (h.end && !v643WithinRange(h.end,start,end))) out.hotels++; });
  out.total=out.plans+out.spots+out.expenses+out.photos+out.covers+out.hotels;
  return out;
}
function v643EnsureDateModal(){
  let modal=$("dateResetModal");
  if(!modal){
    modal=document.createElement('div');
    modal.id='dateResetModal';
    modal.className='resetModal';
    document.body.appendChild(modal);
  }
  modal.className='resetModal v643DateModal';
  return modal;
}
function v643DateSummaryHtml(){
  const p=v643PendingBasic;
  if(!p) return '';
  const oldStart=data.trip.start || '';
  const oldEnd=data.trip.end || '';
  const oldDays=(data.days||mkDays(oldStart,oldEnd)||[]).length;
  const newDays=mkDays(p.start,p.end).length;
  const deltaStart=v643DaysBetween(oldStart,p.start);
  const out=v643OutOfRangeCounts(p.start,p.end);
  const moveText = deltaStart===0 ? '起始日沒有改變，通常選「增減天數」即可。' : `起始日變動 ${deltaStart>0?'往後':'往前'} ${Math.abs(deltaStart)} 天，可選「整趟平移」。`;
  const outText = out.total ? `新日期範圍外目前有 ${out.total} 筆資料，系統會保留，不會刪除。` : '目前看起來沒有資料落在新日期範圍外。';
  return `<div class="v643DateCompare">
    <div><span>原日期</span><b>${esc(oldStart||'未設定')} ～ ${esc(oldEnd||'未設定')}</b><small>${oldDays||0} 天</small></div>
    <div><span>新日期</span><b>${esc(p.start||'未設定')} ～ ${esc(p.end||'未設定')}</b><small>${newDays||0} 天</small></div>
  </div>
  <div class="box mint v643SafeNote"><b>這次不會清空資料。</b><br>${esc(outText)}<br>${esc(moveText)}</div>`;
}
function v643OpenDateAdjustModal(){
  const modal=v643EnsureDateModal();
  modal.innerHTML=`<div class="resetBox v643DateBox">
    <h3>調整旅遊日期</h3>
    <div class="hint">請選擇這次日期變更的情境。系統會保留你已輸入的行程、住宿、預算、照片書、行李與 AI 建議。</div>
    ${v643DateSummaryHtml()}
    <div class="v643DateChoices">
      <button class="v643DateChoice" onclick="v643ConfirmDateAdjust('range')">
        <b>增減天數</b>
        <span>適合：起始日正確，只是多一天或少一天。既有日期內資料保留；超出範圍資料只暫存保留。</span>
      </button>
      <button class="v643DateChoice" onclick="v643ConfirmDateAdjust('shift')">
        <b>整趟平移</b>
        <span>適合：整趟旅行日期錯一天或多天。行程、住宿、照片、預算日期會一起往前或往後移。</span>
      </button>
    </div>
    <div class="btns"><button class="btn soft" onclick="cancelDateReset()">取消</button></div>
  </div>`;
  modal.classList.add('show');
}
function cancelDateReset(){
  v19PendingDates=null;
  v643PendingBasic=null;
  $("dateResetModal")?.classList.remove("show");
}
function v643ShiftTripDateData(offset){
  if(!offset) return;
  (data.plans||[]).forEach(x=>{ if(x.day) x.day=v643ShiftDate(x.day,offset); });
  (data.spots||[]).forEach(x=>{ if(x.day) x.day=v643ShiftDate(x.day,offset); });
  (data.expenses||[]).forEach(x=>{ if(x.day) x.day=v643ShiftDate(x.day,offset); });
  (data.photos||[]).forEach(x=>{ if(x.day) x.day=v643ShiftDate(x.day,offset); });
  (data.hotels||[]).forEach(h=>{ if(h.start) h.start=v643ShiftDate(h.start,offset); if(h.end) h.end=v643ShiftDate(h.end,offset); });
  if(data.dayCovers){
    const next={};
    Object.keys(data.dayCovers).forEach(k=>{ next[v643ShiftDate(k,offset)] = data.dayCovers[k]; });
    data.dayCovers=next;
  }
  if(data.dayCoverMeta){
    const next={};
    Object.keys(data.dayCoverMeta).forEach(k=>{ next[v643ShiftDate(k,offset)] = data.dayCoverMeta[k]; });
    data.dayCoverMeta=next;
  }
  if(data.flights){
    ['out','back'].forEach(k=>{
      if(data.flights[k]){
        data.flights[k].dep=v643ShiftDateTime(data.flights[k].dep,offset);
        data.flights[k].arr=v643ShiftDateTime(data.flights[k].arr,offset);
      }
    });
  }
  cur=v643ShiftDate(cur,offset);
  if(window.currentDay) currentDay=v643ShiftDate(currentDay,offset);
}
function v643AfterDateApplyToast(mode,outBefore){
  if(mode==='shift') return toast('已整趟平移日期，資料已保留');
  if(outBefore?.total) return toast(`已調整日期，${outBefore.total} 筆日期外資料已安全保留`);
  toast('已調整日期，資料已保留');
}
function v643ConfirmDateAdjust(mode){
  const basic=v643PendingBasic;
  if(!basic) return cancelDateReset();
  const oldStart=data.trip.start;
  const outBefore=v643OutOfRangeCounts(basic.start,basic.end);
  v643ApplyBasicFields(basic);
  if(mode==='shift'){
    const offset=v643DaysBetween(oldStart,basic.start);
    v643ShiftTripDateData(offset);
  }
  data.trip.start=basic.start;
  data.trip.end=basic.end;
  data.days=mkDays(data.trip.start,data.trip.end);
  if(!data.days.some(d=>d.key===cur)) cur=data.days[0]?.key || data.trip.start;
  if(window.currentDay && !data.days.some(d=>d.key===currentDay)) currentDay=cur;
  if(typeof v18SortHotels==='function') v18SortHotels();
  v643PendingBasic=null;
  v19PendingDates=null;
  $("dateResetModal")?.classList.remove("show");
  silentSave();
  render();
  if(typeof v63UpdateCurrentTripMeta==='function') setTimeout(()=>v63UpdateCurrentTripMeta(true),80);
  v643AfterDateApplyToast(mode,outBefore);
}
function confirmDateReset(){
  /* 舊版按鈕若被瀏覽器快取呼叫，也改走安全的增減天數，不再清空資料。 */
  v643ConfirmDateAdjust('range');
}
function v643SaveBasicNoDateChange(basic){
  v643ApplyBasicFields(basic);
  data.trip.start=basic.start;
  data.trip.end=basic.end;
  data.days=mkDays(data.trip.start,data.trip.end);
  if(!data.days.some(d=>d.key===cur)) cur=data.days[0]?.key || data.trip.start;
  if(typeof v18SortHotels==='function') v18SortHotels();
  silentSave();
  render();
  const d=document.querySelectorAll("#tripView details.card")[0];
  if(d) d.removeAttribute("open");
  if(typeof v63UpdateCurrentTripMeta==='function') setTimeout(()=>v63UpdateCurrentTripMeta(true),80);
  toast("已幫你存好囉！");
}
/* 最後覆寫 saveBasic：日期改變時不再清空。 */
saveBasic=function(){
  const basic=v643ReadTripBasicFromForm();
  if(basic.country !== data.trip.country){
    v18PendingCountry=basic.country;
    if($("country")) $("country").value=data.trip.country;
    $("countryResetModal")?.classList.add("show");
    return;
  }
  const dateChanged = basic.start !== data.trip.start || basic.end !== data.trip.end;
  if(dateChanged && data.days?.length){
    v643PendingBasic=basic;
    v19PendingDates={start:basic.start,end:basic.end};
    v643OpenDateAdjustModal();
    return;
  }
  v643SaveBasicNoDateChange(basic);
};
function v643OutOfRangeNoticeHtml(){
  if(!data?.trip?.start || !data?.trip?.end) return '';
  const out=v643OutOfRangeCounts(data.trip.start,data.trip.end);
  if(!out.total) return '';
  return `<div class="card v643OutNotice"><h3>日期外資料已保留</h3><div class="box pink">目前有 ${out.total} 筆資料不在旅遊日期範圍內，系統沒有刪除它們。若需要恢復，可再延長日期或把旅程日期平移回來。</div></div>`;
}
const v643PrevRenderTrip = typeof renderTrip==='function' ? renderTrip : null;
if(v643PrevRenderTrip && !window.__v643RenderTripPatched){
  renderTrip=function(...args){
    const r=v643PrevRenderTrip.apply(this,args);
    const root=$("tripView");
    if(root && !root.querySelector('.v643OutNotice')) root.insertAdjacentHTML('beforeend', v643OutOfRangeNoticeHtml());
    return r;
  };
  window.__v643RenderTripPatched=true;
}
const v643PrevRenderHelp = typeof renderHelp==='function' ? renderHelp : null;
if(v643PrevRenderHelp && !window.__v643HelpPatched){
  window.__v643HelpPatched=true;
}
function v643UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V643_VERSION_SHORT);
  document.querySelectorAll('footer').forEach(el=>{
    if(!el.innerHTML.includes('Janeselect Travel Manager')){
      el.innerHTML=`貞選旅管家 Janeselect Travel Manager<br><strong>${V643_VERSION_SHORT}</strong>`;
    }
  });
}
setTimeout(()=>{try{v643UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},300);
const V644_VERSION_SHORT = "v64.4｜2026-05-31";
const V644_VERSION_TEXT = "v64.4｜AI 找景點提示詞強化與介面收合版";

function v644FlightOne(label, f){
  if(!f) return `${label}：尚未填寫`;
  const segs = Array.isArray(f.segments) ? f.segments : [];
  if(segs.length){
    const lines = segs.map((s,i)=>`  第 ${i+1} 段：${s.no||s.flightNo||''}｜${s.from||''} → ${s.to||''}｜${s.dep||s.departure||''} → ${s.arr||s.arrival||''}`).join('\n');
    return `${label}：\n${lines}${f.transfer?'\n機場接送：'+f.transfer:''}`;
  }
  const core = [f.no||f.flightNo||'', `${f.from||''} → ${f.to||''}`, `${f.dep||f.departure||''} → ${f.arr||f.arrival||''}`].filter(x=>String(x).replace(/[→｜\s]/g,'')).join('｜');
  return `${label}：${core||'尚未填寫'}${f.transfer?'｜機場接送：'+f.transfer:''}`;
}
function v644FlightContext(){
  const fs=data.flights||{};
  return [v644FlightOne('去程航班',fs.out), v644FlightOne('回程航班',fs.back)].join('\n');
}
function v644PlannerByDayContext(){
  const days=data.days||[];
  if(!days.length) return '尚未設定旅行日期';
  return days.map(d=>{
    const hotel=typeof hotelFor==='function' ? hotelFor(d.key) : null;
    const ps=(data.plans||[]).filter(p=>p.day===d.key).sort((a,b)=>String(a.start).localeCompare(String(b.start))).map(p=>`  - ${p.start||''}-${p.end||''}｜${p.type||'行程'}｜${p.name||''}${p.addr||p.address?'｜地址：'+(p.addr||p.address):''}${p.note?'｜注意：'+p.note:''}`);
    return `${d.key}（${d.title||''}｜${d.label||''}）｜住宿：${hotel?hotel.name:'未設定'}\n${ps.length?ps.join('\n'):'  - 目前尚未排入行程'}`;
  }).join('\n');
}
function v644ExistingSpotContext(){
  const spots=data.spots||[];
  if(!spots.length) return '尚未加入口袋景點';
  return spots.map(s=>`${s.name||''}｜${s.type||'景點'}｜${s.day||'未排'}｜${s.addr||''}｜${s.memo||''}`).join('\n');
}
function v644PrefsText(){
  if(typeof v641SavePrefsFromDom==='function') return v641PrefsText();
  return '未填寫，請以一般旅遊者需求判斷。';
}

const v644PrevBuildPrompt = typeof v64BuildPrompt==='function' ? v64BuildPrompt : null;

function v644EnsurePromptOptionsModal(){
  if($('v644PromptOptionsModal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="v64AiModal v644OptionsModal noPrint" id="v644PromptOptionsModal" aria-hidden="true">
    <div class="v64AiBox v644OptionsBox">
      <div class="v64AiHead">
        <div><h3 id="v644OptionsTitle">AI 輔助</h3><p id="v644OptionsDesc">偏好可不填，會用來調整 AI 建議方向。</p></div>
        <button type="button" class="iconBtn" onclick="v644ClosePromptOptions()">×</button>
      </div>
      <div id="v644OptionsPrefs"></div>
      <div class="box mint v644OptionsNote" id="v644OptionsNote"></div>
      <div class="btns">
        <button class="btn dark" type="button" onclick="v644GeneratePromptFromOptions()">產生提示詞</button>
        <button class="btn soft" type="button" onclick="v644ClosePromptOptions()">取消</button>
      </div>
    </div>
  </div>`);
}
function v644OpenPromptOptions(kind){
  v644EnsurePromptOptionsModal();
  const isSpot = kind==='spots';
  $('v644PromptOptionsModal').dataset.kind=kind;
  $('v644OptionsTitle').textContent = isSpot ? 'AI 找景點' : 'AI 健檢';
  $('v644OptionsDesc').textContent = isSpot ? '加入偏好後，AI 會依航班、住宿與已排入行程推薦更適合的口袋景點。' : '加入偏好後，AI 會用更貼近你的旅行節奏檢查行程。';
  $('v644OptionsPrefs').innerHTML = (typeof v641PrefsHtml==='function') ? v641PrefsHtml() : '';
  $('v644OptionsNote').innerHTML = isSpot
    ? '提示詞會帶入航班、住宿、已排入行程與既有口袋景點，讓 AI 推薦備選日期與建議時間。'
    : 'AI 健檢只會檢查已排入行程，不會把口袋景點當成正式行程。';
  $('v644PromptOptionsModal').classList.add('show');
  $('v644PromptOptionsModal').setAttribute('aria-hidden','false');
}
function v644ClosePromptOptions(){
  $('v644PromptOptionsModal')?.classList.remove('show');
  $('v644PromptOptionsModal')?.setAttribute('aria-hidden','true');
}
function v644GeneratePromptFromOptions(){
  const kind=$('v644PromptOptionsModal')?.dataset.kind || 'spots';
  if(typeof v641SavePrefsFromDom==='function') v641SavePrefsFromDom();
  v644ClosePromptOptions();
  if(kind==='spots') return v64ShowPrompt('spots','AI 找景點','請 AI 依航班、住宿、已排入行程與偏好推薦口袋景點。');
  return v64ShowPrompt('itinerary','AI 健檢','請 AI 檢查已排入行程的順路性與節奏。');
}

const v644PrevAiBarHtml = typeof v64AiBarHtml==='function' ? v64AiBarHtml : null;
v64AiBarHtml = function(kind){
  if(kind==='spots'){
    return `<div class="v64AiBar v644AiBar" id="v64AiBar-spots">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>依航班、住宿、已排入行程與偏好推薦口袋景點。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v644OpenPromptOptions('spots')">AI 找景點</button>
        <button class="btn blue compact" onclick="v64OpenImportModal()">AI 匯入</button>
      </div>
    </div>`;
  }
  if(kind==='planner'){
    return `<div class="v64AiBar v644AiBar" id="v64AiBar-planner">
      <div class="v64AiBarHead"><div><b>AI 輔助</b><span>只檢查已排入行程；偏好在產生提示詞時設定。</span></div></div>
      <div class="v64AiActions">
        <button class="btn pink compact" onclick="v644OpenPromptOptions('itinerary')">AI 健檢</button>
        <button class="btn blue compact" onclick="v64OpenImportModal('itinerary')">AI 匯入</button>
      </div>
    </div>`;
  }
  return v644PrevAiBarHtml ? v644PrevAiBarHtml(kind) : '';
};

function v644ValidDay(day){
  return !!day && (data.days||[]).some(d=>d.key===day);
}
function v644SpotMemo(s){
  const memo=String(s.memo||s.note||s.reason||'');
  const st=String(s.start||s.suggestedStart||s.recommendedStart||'');
  const en=String(s.end||s.suggestedEnd||s.recommendedEnd||'');
  const dur=String(s.duration||s.stay||s.stayTime||'');
  const parts=[];
  if(st || en) parts.push(`建議時段：${st||'未定'}${en?'－'+en:''}`);
  if(dur) parts.push(`建議停留：${dur}`);
  return [parts.join('｜'), memo].filter(Boolean).join('\n');
}
const v644PrevImportAiObject = typeof v64ImportAiObject==='function' ? v64ImportAiObject : null;

const v644PrevRenderHelp = typeof renderHelp==='function' ? renderHelp : null;
function v644UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V644_VERSION_SHORT);
}
setTimeout(()=>{try{v644UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},320);
const V645_VERSION_SHORT = "v64.5｜2026-05-31";
const V645_VERSION_TEXT = "v64.5｜AI 口袋景點時間欄位修正版";

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
function removeTripCover(){
  if(!data.tripCover)return;
  if(!confirm('確定刪除整本旅遊書封面照片？刪除後可以重新上傳。'))return;
  delete data.tripCover;
  delete data.tripCoverMeta;
  save();
  toast('已刪除整本封面照片');
}
function removeDayCover(day){
  if(!data.dayCovers || !data.dayCovers[day])return;
  if(!confirm('確定刪除這一天的封面照片？刪除後可以重新上傳。'))return;
  delete data.dayCovers[day];
  if(data.dayCoverMeta) delete data.dayCoverMeta[day];
  save();
  toast('已刪除本日封面照片');
}

function v646PhotoOrientation(p){
  const w=Number(p?.width||0), h=Number(p?.height||0);
  if(w && h){
    if(h > w*1.08) return 'portrait';
    if(w > h*1.08) return 'landscape';
    return 'square';
  }
  return 'landscape';
}


storyBookCoverHtml = function(){
  const cover=data.tripCover;
  if(cover){
    return `<section class="storyBookCover">
      <img class="storyBookCoverImage" src="${cover}">
      <div class="storyBookCoverOverlay"></div>
      <div class="storyCoverActions noPrint">
        <label class="photoInlineUpload">更換封面<input type="file" accept="image/*" onchange="addTripCover(this.files[0])"></label>
        <button type="button" class="danger" onclick="removeTripCover()">刪除封面</button>
        <div class="photoUploadStatus" id="coverUploadStatus"></div>
      </div>
      <div class="storyBookCoverText">
        <span class="eyebrow">JANESELECT</span>
        <h1>${esc(data.meta.title)}</h1>
        <p>${esc(data.meta.subtitle)}</p>
        <div class="storyBookCoverMeta">
          <span>目的地：${esc(data.trip.dest||'未設定')}</span>
          <span>日期：${short(data.trip.start)} - ${short(data.trip.end)}</span>
          <span>${data.days.length} 天旅行</span>
        </div>
      </div>
    </section>`;
  }
  return `<section class="storyBookCover storyInlineEmpty noPrint">
    <div>
      <span class="eyebrow">JANESELECT</span>
      <h1>${esc(data.meta.title)}</h1>
      <p>${esc(data.meta.subtitle)}</p>
      <div style="margin-top:16px">
        <label class="photoInlineUpload">
          ＋ 上傳整本封面
          <input type="file" accept="image/*" onchange="addTripCover(this.files[0])">
        </label>
        <div class="photoUploadStatus" id="coverUploadStatus"></div>
      </div>
    </div>
  </section>`;
};


const v646PrevRenderHelp = typeof renderHelp==='function' ? renderHelp : null;
function v646UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V646_VERSION_SHORT);
}
setTimeout(()=>{try{v646UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},380);
const V647_VERSION_SHORT = "v64.7｜2026-05-31";
const V647_VERSION_TEXT = "v64.7｜照片日記上傳與同步穩定修正版";

/* 同步：避免照片刪除/上傳後短時間連續 save 造成狀態卡在等待同步。 */
let v647CloudSaveInFlight = false;
let v647CloudSaveQueued = false;
let v647CloudSaveTimer = null;
let v647LastSaveReason = "";

function v647CanUseCloud(showToast=false){
  if(typeof v632CanUseCloud === 'function') return v632CanUseCloud(showToast);
  if(!fbUser){ if(showToast) toast('請先登入 Google'); return false; }
  if(!fbDb){ if(showToast) toast('Firebase 尚未初始化'); return false; }
  if(!currentTripId){ if(showToast) toast('請先選擇旅程'); return false; }
  return true;
}


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


/* 說明與版本 */
const v647PrevRenderHelp = typeof renderHelp === 'function' ? renderHelp : null;
function v647UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V647_VERSION_SHORT);
}
setTimeout(()=>{try{v647UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},420);
const V648_VERSION_SHORT = "v64.8｜2026-05-31";
const V648_VERSION_TEXT = "v64.8｜同步狀態顯示修正版";

function v648FormatSyncTime(at){
  const t = Number(at || 0);
  if(!t) return "";
  try{return new Date(t).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});}catch(e){return "";}
}

/* 右上角帳號選單原本有自己的「尚未同步」狀態，與雲端 setSyncStatus 沒有完全連動。
   這裡只修顯示層：同步成功後，帳號選單也會改成已同步；不改 Firestore 寫入流程。 */
updateAccountSyncLine = function(){
  const el = document.getElementById('accountSyncLine');
  if(!el) return;
  const dotClass = v648SyncDotClassFromState();
  const label = v648SyncLabelFromState();
  el.innerHTML = `<span class="dot ${dotClass}"></span>${esc(label)}`;
};

const v648PreviousSetSyncStatus = typeof setSyncStatus === 'function' ? setSyncStatus : null;

const v648PreviousToggleAccountMenu = typeof toggleAccountMenu === 'function' ? toggleAccountMenu : null;
toggleAccountMenu = function(){
  if(typeof ensureAccountMenuSyncLine === 'function') ensureAccountMenuSyncLine();
  updateAccountSyncLine();
  if(v648PreviousToggleAccountMenu) v648PreviousToggleAccountMenu();
};

const v648PreviousRenderAccountWidget = typeof renderAccountWidget === 'function' ? renderAccountWidget : null;
renderAccountWidget = function(user){
  const r = v648PreviousRenderAccountWidget ? v648PreviousRenderAccountWidget(user) : undefined;
  if(typeof ensureAccountMenuSyncLine === 'function') ensureAccountMenuSyncLine();
  updateAccountSyncLine();
  return r;
};

const v648PreviousSaveToCloudNow = typeof saveToCloudNow === 'function' ? saveToCloudNow : null;
saveToCloudNow = async function(options={}){
  const result = v648PreviousSaveToCloudNow ? await v648PreviousSaveToCloudNow(options) : false;
  if(result){
    const now = (typeof v632Now === 'function' ? v632Now() : Date.now());
    if(typeof v632LastSyncState !== 'undefined') v632LastSyncState = {kind:'on', title:'同步好了', desc:'', at:now};
    try{
      if(typeof syncStatus !== 'undefined') syncStatus='success';
      if(typeof lastSyncTime !== 'undefined') lastSyncTime = new Date(now).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
    }catch(e){}
    updateAccountSyncLine();
  }
  return result;
};

const v648PrevRenderHelp = typeof renderHelp === 'function' ? renderHelp : null;
function v648UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V648_VERSION_SHORT);
}
setTimeout(()=>{try{v648UpdateFooterVersion(); updateAccountSyncLine();}catch(e){console.warn(e)}},480);
const V649_VERSION_SHORT = "v64.9｜2026-05-31";
const V649_VERSION_TEXT = "v64.9｜單一編輯裝置與同步防覆蓋版";
const V649_DEVICE_KEY = "janeselectTravelDeviceId";
const V649_LOCK_TTL = 2 * 60 * 1000;
const V649_HEARTBEAT_MS = 35 * 1000;
let v649DeviceId = localStorage.getItem(V649_DEVICE_KEY) || `dev_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
localStorage.setItem(V649_DEVICE_KEY, v649DeviceId);
let v649ReadOnly = false;
let v649LockOwner = null;
let v649HeartbeatTimer = null;
let v649LockUnsub = null;
let v649SelectingTrip = false;

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
function v649UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V649_VERSION_SHORT);
}
setTimeout(()=>{try{v649UpdateFooterVersion(); v649ApplyLockBanner();}catch(e){console.warn(e)}},520);
window.addEventListener('beforeunload',()=>{v649StopHeartbeat();});
const V650_VERSION_SHORT = "v65.0｜2026-05-31";
const V650_VERSION_TEXT = "v65.0｜照片旅遊書封面與照片日記流程整理版";

/* 標籤欄位從 UI 移除；舊資料保留但不顯示、不再編輯。 */
function photoTagsHtml(){ return ""; }
function storyTagsHtml(){ return ""; }
function pdfTagsHtml(){ return ""; }
function pdfTags(){ return ""; }

function v65PhotoAttr(v){
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function v65PhotosForDay(day){
  return (data.photos||[]).filter(p=>p.day==day);
}
function v65PhotoCountForDay(day){
  return v65PhotosForDay(day).length;
}
function v65SetDayCoverFromPhoto(day, photoId){
  const p=(data.photos||[]).find(x=>x.id===photoId);
  if(!p || !p.src) return toast('找不到這張照片');
  if(!data.dayCovers) data.dayCovers={};
  if(!data.dayCoverMeta) data.dayCoverMeta={};
  data.dayCovers[day]=p.src;
  data.dayCoverMeta[day]={source:'photo', photoId:p.id, updatedAtClient:Date.now()};
  save();
  toast('已設為今日封面');
}
function setDayCoverFromPhoto(day, photoId){
  return v65SetDayCoverFromPhoto(day, photoId);
}

function v65DayCoverCandidates(day, photos){
  if(!photos || !photos.length) return `<div class="v65DayCoverHint">今日照片日記還沒有照片。你可以先自行上傳封面，或稍後從今日照片中挑選。</div>`;
  return `<div>
    <div class="v65DayCoverHint">也可以從今日照片日記選一張當封面：</div>
    <div class="v65CoverCandidates">
      ${photos.slice(0,10).map(p=>`<div class="v65CoverCandidate">
        <img src="${p.src}" alt="">
        <button type="button" onclick="setDayCoverFromPhoto('${day}','${p.id}')">設為今日封面</button>
      </div>`).join('')}
    </div>
  </div>`;
}

function storyPhotoUploadForm(day, count){
  if(count>=10) return '';
  const file = (typeof storyPendingPhotoFiles !== 'undefined') ? storyPendingPhotoFiles[day] : null;
  const previewUrl = (typeof storyPhotoPreviewUrls !== 'undefined' && storyPhotoPreviewUrls[day]) ? storyPhotoPreviewUrls[day] : '';
  return `<div class="storyPhotoUploadCard noPrint">
    <div class="storyPhotoPickBox">
      <label class="storyPhotoPickLabel">
        ${file ? '已選擇照片，可繼續補標題與日記' : '＋ 先選擇要上傳的照片'}
        <input id="storyPhotoFile-${day}" type="file" accept="image/*" onchange="selectStoryPhotoFile('${day}',this.files[0])">
      </label>
      <div class="storyPhotoPickMeta" id="storyPhotoPickMeta-${day}">${file ? '已選擇：' + v65PhotoAttr(file.name) : '請先選擇 1 張照片，再輸入標題與一句照片日記。'}</div>
      <div class="storyPhotoPickPreview ${previewUrl?'show':''}" id="storyPhotoPickPreview-${day}">${previewUrl?`<img src="${previewUrl}"><div>預覽照片：新增後會上傳到照片日記</div>`:''}</div>
    </div>
    <div class="storyPhotoQuickFields v65NoTags">
      <input id="storyPhotoTitle-${day}" placeholder="照片標題，例如：海雲台散步">
    </div>
    <input id="storyPhotoMemo-${day}" placeholder="一句照片日記">
    <div class="storyPhotoUploadActions">
      <button class="btn soft" type="button" onclick="clearPendingStoryPhoto('${day}')">清除照片</button>
      <button class="btn dark" type="button" onclick="addPhotoToDay('${day}')">新增到 ${dayTitle(day)}</button>
    </div>
    <div class="photoUploadStatus" id="storyPhotoStatus-${day}"></div>
  </div>`;
}

addPhotoToDay = async function(day){
  const file = (typeof storyPendingPhotoFiles !== 'undefined') ? storyPendingPhotoFiles[day] : null;
  if(!file) return toast('請先選擇照片');
  const count = v65PhotoCountForDay(day);
  if(count>=10) return toast('這天最多上傳 10 張照片');
  try{
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, '上傳中...');
    const img = await uploadImageFileForPhotoBook(file, {maxWidth:1600, quality:.82}, `storyPhotoStatus-${day}`);
    data.photos.unshift({
      id:uid(),
      day,
      title:document.getElementById(`storyPhotoTitle-${day}`)?.value || '',
      memo:document.getElementById(`storyPhotoMemo-${day}`)?.value || '',
      tags:'',
      src:img.src,
      publicId:img.publicId,
      cloudinary:true,
      width:img.width,
      height:img.height,
      bytes:img.bytes
    });
    if(typeof clearPendingStoryPhoto === 'function') clearPendingStoryPhoto(day);
    ['storyPhotoTitle-'+day,'storyPhotoMemo-'+day,'storyPhotoFile-'+day].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
    save();
    toast('照片已加入這天的照片日記');
  }catch(err){
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, '');
    alert('照片上傳失敗：' + (err?.message || err));
  }
};

function openPhotoEditModal(id){
  const p=(data.photos||[]).find(x=>x.id===id);
  if(!p) return;
  window.activePhotoEditId = id;
  let modal=document.getElementById('photoEditModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='photoEditModal';
    modal.className='photoEditModal noPrint';
    document.body.appendChild(modal);
  }
  modal.innerHTML=`<div class="photoEditBox">
    <div class="photoEditHeader">
      <div>
        <h3>編輯照片日記</h3>
        <p>只修改照片標題與一句照片日記，不會更換原照片。</p>
      </div>
      <button class="photoEditClose" onclick="closePhotoEditModal()">×</button>
    </div>
    <img class="photoEditPreview" src="${p.src}">
    <label>照片標題</label>
    <input id="modalPhotoTitle" value="${v65PhotoAttr(p.title||'')}">
    <label>一句照片日記</label>
    <textarea id="modalPhotoMemo">${esc(p.memo||'')}</textarea>
    <div class="photoEditActions">
      <button class="btn dark" onclick="savePhotoEditModal()">儲存修改</button>
      <button class="btn soft" onclick="closePhotoEditModal()">取消</button>
    </div>
  </div>`;
  modal.classList.add('show');
}
function savePhotoEditModal(){
  const id=window.activePhotoEditId;
  const p=(data.photos||[]).find(x=>x.id===id);
  if(!p) return;
  p.title=document.getElementById('modalPhotoTitle')?.value || '';
  p.memo=document.getElementById('modalPhotoMemo')?.value || '';
  if(typeof closePhotoEditModal === 'function') closePhotoEditModal();
  save();
  toast('照片日記已更新');
}

storyBookPhotoCard = function(p, idx){
  const ori = typeof v646PhotoOrientation === 'function' ? v646PhotoOrientation(p) : 'landscape';
  const editBtn = `<button class="small" onclick="openPhotoEditModal('${p.id}')">編輯</button>`;
  return `<div class="storyPhotoCard ${idx===0?'featured':''} orientation-${ori}">
    <div class="storyPhotoImage"><img src="${p.src}"></div>
    <div class="storyPhotoText">
      <h3>${esc(p.title||'照片紀錄')}</h3>
      <p>${esc(p.memo||'')}</p>
      <div class="storyPhotoCardActions noPrint">
        <button class="small v65PhotoCoverPill" onclick="setDayCoverFromPhoto('${p.day}','${p.id}')">設為今日封面</button>
        ${editBtn}
        <button class="small" onclick="delPhoto('${p.id}')">刪除</button>
      </div>
    </div>
  </div>`;
};

storyBookDay = function(d){
  if(!data.dayCovers) data.dayCovers={};
  const plans=sortedPlans(d.key);
  const photos=v65PhotosForDay(d.key);
  const cover=data.dayCovers[d.key] || '';
  const count=photos.length;
  return `<section class="storyDay">
    <div class="storyDayHeader">
      <div>
        <span class="eyebrow">${d.title}</span>
        <h2>${d.label} 的旅行故事</h2>
        <p>住宿：${hotelFor(d.key)?.name||'未設定'}。今天收錄 ${plans.length} 個行程與 ${photos.length} 張照片。</p>
      </div>
      <div class="bookDayBadge">${plans.length} 行程｜${photos.length} 照片</div>
    </div>
    <div class="storyDayHero ${cover?'':'storyInlineEmpty v65DayCoverEmpty'}">
      ${cover?`<img src="${cover}">`:`<div class="v65DayCoverEmptyInner">
        <div>
          <div class="v65DayCoverTitle">尚未設定今日封面</div>
          <div class="v65DayCoverHint">今日封面可以自行上傳，也可以從今日照片日記挑一張。沒有設定前，不會自動拿照片代替封面。</div>
        </div>
        <div class="v65DayCoverActions noPrint">
          <label class="photoInlineUpload">＋ 自行上傳封面<input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></label>
          <div class="photoUploadStatus" id="dayCoverStatus-${d.key}"></div>
        </div>
        ${v65DayCoverCandidates(d.key, photos)}
      </div>`}
      ${cover?`<div class="storyDayCoverActions noPrint">
        <label class="photoInlineUpload">更換封面<input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></label>
        <button type="button" class="danger" onclick="removeDayCover('${d.key}')">刪除封面</button>
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

const v650PrevRenderPhotoBook = typeof renderPhotoBook === 'function' ? renderPhotoBook : null;
renderPhotoBook = function(){
  const el=document.getElementById('photoBookView');
  if(!el) return v650PrevRenderPhotoBook ? v650PrevRenderPhotoBook() : undefined;
  el.innerHTML = `<div class="section">
    <div class="storyOnlyIntro">
      <div>
        <h2>📖 照片旅遊書</h2>
        <div class="hint">照片旅遊書定位為「旅遊中快速記錄、旅遊後整理回憶」。今日封面可自行上傳，或從當天照片日記挑選；照片日記已簡化為照片標題與一句日記。</div>
      </div>
      <div class="storyOnlyActions noPrint">
        <button class="btn soft" onclick="exportPhotoBookPDF()">匯出 PDF</button>
      </div>
    </div>
  </div>
  <div class="storyBookPreview bookStyle-${data.meta.bookStyle||'fresh'}">
    <div class="storyBook">
      ${storyBookCoverHtml()}
      ${data.days.map(storyBookDay).join('')}
    </div>
  </div>`;
};

const v650PrevRenderHelp = typeof renderHelp === 'function' ? renderHelp : null;
function v650UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V650_VERSION_SHORT);
}
setTimeout(()=>{try{v650UpdateFooterVersion(); if(typeof render==='function') render();}catch(e){console.warn(e)}},560);
const V653_VERSION_SHORT = "v66.0｜2026-05-31｜現行功能基準整理版";
const V653_VERSION_TEXT = "v66.0｜現行功能基準整理版";

function v653Html(v){
  return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function v653Clean(v){ return String(v||'').replace(/\s+/g,' ').trim(); }
function v653DatePart(dt){ return String(dt||'').split('T')[0] || ''; }
function v653TimePart(dt){ return String(dt||'').split('T')[1]?.slice(0,5) || ''; }
function v653DateTimeText(dt){
  const d=v653DatePart(dt), t=v653TimePart(dt);
  if(d && t) return `${short(d)} ${t}`;
  return t || (d ? short(d) : '未定');
}
function v653PlanIcon(type){
  return type==='餐廳'?'🍽️':type==='咖啡廳'?'☕':type==='購物'?'🛍️':type==='交通'?'🚕':type==='航班'?'✈️':type==='住宿'?'🏨':type==='其他'?'📝':'📍';
}
function v653FlightObj(k){
  try{
    return typeof normalizeFlightObj === 'function' ? normalizeFlightObj(data?.flights?.[k], k) : (data?.flights?.[k]||{});
  }catch(e){
    return data?.flights?.[k]||{};
  }
}
function v653FlightSegments(k){
  const f=v653FlightObj(k);
  if(Array.isArray(f.segments) && f.segments.length) return f.segments;
  if(f.no || f.from || f.to || f.dep || f.arr) return [{no:f.no||'',from:f.from||'',to:f.to||'',dep:f.dep||'',arr:f.arr||''}];
  return [];
}
function v653HasFlight(k){
  const f=v653FlightObj(k), segs=v653FlightSegments(k);
  return segs.some(s=>s.no||s.from||s.to||s.dep||s.arr) || !!(f.toAirport||f.fromAirport||f.transfer);
}
function v653FlightLabel(k){ return k==='out'?'去程':'回程'; }
function v653FlightLines(k){
  const f=v653FlightObj(k), segs=v653FlightSegments(k), lines=[];
  if(!v653HasFlight(k)) return lines;
  lines.push(`${v653FlightLabel(k)}${f.type==='transfer'?'（轉機）':'（直飛）'}`);
  segs.forEach((s,i)=>{
    const route=[s.from,s.to].filter(Boolean).join(' → ') || '航線未填';
    const dt=[v653DateTimeText(s.dep), v653DateTimeText(s.arr)].filter(Boolean).join(' → ');
    lines.push(`  第 ${i+1} 段 ${s.no||'航班未填'}｜${route}`);
    if(dt) lines.push(`      ${dt}`);
  });
  if(f.toAirport || f.transfer) lines.push(`  機場交通：${v653Clean(f.toAirport||f.transfer)}`);
  if(f.fromAirport) lines.push(`  抵達後交通：${v653Clean(f.fromAirport)}`);
  return lines;
}
function v653FlightHtml(k){
  const f=v653FlightObj(k), segs=v653FlightSegments(k);
  if(!v653HasFlight(k)) return `<div class="v652FlightItem"><div class="v652MiniText">${v653FlightLabel(k)}尚未填寫航班資訊</div></div>`;
  const segHtml=segs.map((s,i)=>{
    const route=[s.from,s.to].filter(Boolean).join(' → ') || '航線未填';
    const time=[v653DateTimeText(s.dep), v653DateTimeText(s.arr)].filter(Boolean).join(' → ');
    return `<div class="v652FlightItem"><div class="v652FlightLine"><span class="v652TimePill">第 ${i+1} 段</span><div><div class="v652MainText">✈️ ${v653Html(s.no||'航班未填')}｜${v653Html(route)}</div><div class="v652MiniText">${v653Html(time||'時間未填')}</div></div></div></div>`;
  }).join('');
  const transfer=[f.toAirport||f.transfer?`機場交通：${v653Clean(f.toAirport||f.transfer)}`:'', f.fromAirport?`抵達後交通：${v653Clean(f.fromAirport)}`:''].filter(Boolean);
  return `<div class="v652ShareSubTitle">${v653FlightLabel(k)}｜${f.type==='transfer'?'轉機':'直飛'}</div><div class="v652FlightGrid">${segHtml}${transfer.length?`<div class="v652FlightItem"><div class="v652MiniText">${v653Html(transfer.join('｜'))}</div></div>`:''}</div>`;
}
function v653HotelLines(){
  const hotels=data?.hotels||[];
  if(!hotels.length) return ['尚未填寫住宿資訊'];
  return hotels.map(h=>{
    const range=[h.start?short(h.start):'', h.end?short(h.end):''].filter(Boolean).join(' → ');
    const bits=[`${range} ${h.name||'住宿未命名'}`.trim()];
    if(h.addr) bits.push(`地址：${v653Clean(h.addr)}`);
    if(h.note) bits.push(`備註：${v653Clean(h.note)}`);
    return bits.join('｜');
  });
}
function v653HotelHtml(){
  const hotels=data?.hotels||[];
  if(!hotels.length) return `<div class="v652HotelItem"><div class="v652MiniText">尚未填寫住宿資訊</div></div>`;
  return `<div class="v652HotelGrid">${hotels.map(h=>{
    const range=[h.start?short(h.start):'', h.end?short(h.end):''].filter(Boolean).join(' → ');
    return `<div class="v652HotelItem"><div class="v652MainText">🏨 ${v653Html(h.name||'住宿未命名')}</div><div class="v652MiniText">${v653Html(range||'日期未填')}${h.addr?`｜${v653Html(h.addr)}`:''}${h.note?`<br>${v653Html(h.note)}`:''}</div></div>`;
  }).join('')}</div>`;
}
function v653TripRange(){
  return data?.trip?.start ? `${short(data.trip.start)}－${short(data.trip.end)}` : '未設定日期';
}
function v653AllPlans(){
  return (data?.plans||[]).filter(p=>!(p.source==='flight'||p.source==='hotel'));
}
function v653ItineraryText(){
  const title=v653Clean(data?.meta?.title)||'我的旅行行程';
  const dest=v653Clean(data?.trip?.dest)||'未設定目的地';
  const lines=[];
  lines.push(`貞選旅管家｜${title}`);
  lines.push(`${dest}｜${v653TripRange()}`);
  lines.push('');
  lines.push('【機票】');
  ['out','back'].forEach(k=>{
    const arr=v653FlightLines(k);
    if(arr.length) lines.push(...arr);
  });
  if(!v653HasFlight('out') && !v653HasFlight('back')) lines.push('尚未填寫航班資訊');
  lines.push('');
  lines.push('【住宿】');
  v653HotelLines().forEach(x=>lines.push(x));
  lines.push('');
  lines.push('【每日行程】');
  (data.days||[]).forEach(d=>{
    const plans=sortedPlans(d.key).filter(p=>!(p.source==='flight'||p.source==='hotel'));
    lines.push(`${d.title}｜${d.label}`);
    if(!plans.length){
      lines.push('  尚未安排正式行程');
    }else{
      plans.forEach(p=>{
        const time=[p.start,p.end].filter(Boolean).join('－') || '未定時間';
        lines.push(`  ${time}　${v653PlanIcon(p.type)} ${v653Clean(p.name)}`);
        if(p.address) lines.push(`      地址：${v653Clean(p.address)}`);
        if(p.note) lines.push(`      注意：${v653Clean(p.note)}`);
      });
    }
    lines.push('');
  });
  lines.push('— Janeselect Travel Manager —');
  return lines.join('\n');
}
function v653ShareHtml(){
  const title=v653Clean(data?.meta?.title)||'我的旅行行程';
  const dest=v653Clean(data?.trip?.dest)||'未設定目的地';
  const dayHtml=(data.days||[]).map(d=>{
    const plans=sortedPlans(d.key).filter(p=>!(p.source==='flight'||p.source==='hotel'));
    return `<div class="v652DayItem"><div class="v652DayHead"><b>${v653Html(d.title)}｜${v653Html(d.label)}</b><span class="v652TimePill">${plans.length} 個行程</span></div>${plans.length?`<div class="v652PlanList">${plans.map(p=>{
      const time=[p.start,p.end].filter(Boolean).join('－')||'未定時間';
      return `<div class="v652PlanRow"><span class="v652TimePill">${v653Html(time)}</span><div><div class="v652PlanName">${v653PlanIcon(p.type)} ${v653Html(p.name||'未命名行程')}</div>${p.address?`<div class="v652PlanNote">地址：${v653Html(p.address)}</div>`:''}${p.note?`<div class="v652PlanNote">注意：${v653Html(p.note)}</div>`:''}</div></div>`;
    }).join('')}</div>`:`<div class="v652MiniText">尚未安排正式行程</div>`}</div>`;
  }).join('');
  return `<div class="v653ShareBox" role="dialog" aria-modal="true" aria-label="分享簡易行程">
    <div class="v653ShareHero">
      <div class="v653ShareHeroTop">
        <div>
          <div class="v653ShareBrand">貞選旅管家 Janeselect Travel Manager</div>
          <h3>${v653Html(title)}</h3>
          <p>${v653Html(dest)}｜${v653Html(v653TripRange())}</p>
        </div>
        <button class="v653ShareClose" type="button" onclick="v653CloseItineraryShare()" aria-label="關閉分享彈窗">×</button>
      </div>
    </div>
    <div class="v653ShareScroll">
      <div class="v653ShareSection"><h4>✈️ 機票與交通</h4>${v653FlightHtml('out')}${v653FlightHtml('back')}</div>
      <div class="v653ShareSection"><h4>🏨 住宿資訊</h4>${v653HotelHtml()}</div>
      <div class="v653ShareSection"><h4>🗓️ 每日簡易行程</h4><div class="v652HotelGrid">${dayHtml}</div></div>
    </div>
    <div class="v653ShareActions">
      <button class="btn soft" type="button" onclick="v653CopyItinerary()">複製分享文字</button>
      <button class="btn dark" type="button" onclick="v653PrintItinerary()">匯出 PDF / 列印</button>
    </div>
  </div>`;
}
function v653EnsureShareModal(){
  let modal=document.getElementById('itineraryShareModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='itineraryShareModal';
    document.body.appendChild(modal);
  }
  modal.className='itineraryShareModal v653ShareModal noPrint';
  modal.onclick=function(e){
    if(e.target===modal) v653CloseItineraryShare();
  };
  return modal;
}
function v653OpenItineraryShare(){
  const modal=v653EnsureShareModal();
  modal.innerHTML=v653ShareHtml();
  modal.classList.add('show');
}
function v653CloseItineraryShare(){
  document.getElementById('itineraryShareModal')?.classList.remove('show');
}
async function v653CopyItinerary(){
  const txt=v653ItineraryText();
  try{
    await navigator.clipboard.writeText(txt);
    toast('已複製分享文字');
  }catch(e){
    const ta=document.createElement('textarea');
    ta.value=txt;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';
    ta.style.left='-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('已複製分享文字');
  }
}
function v653PrintableHtml(){
  const title=v653Clean(data?.meta?.title)||'簡易行程';
  const dayPrint=(data.days||[]).map(d=>{
    const plans=sortedPlans(d.key).filter(p=>!(p.source==='flight'||p.source==='hotel'));
    return `<div class="item"><div class="main">${v653Html(d.title)}｜${v653Html(d.label)}</div>${plans.length?plans.map(p=>`<div class="plan"><span class="pill">${v653Html([p.start,p.end].filter(Boolean).join('－')||'未定')}</span><div><div class="main">${v653PlanIcon(p.type)} ${v653Html(p.name||'未命名行程')}</div>${p.address?`<div class="mini">地址：${v653Html(p.address)}</div>`:''}${p.note?`<div class="mini">注意：${v653Html(p.note)}</div>`:''}</div></div>`).join(''):`<div class="mini">尚未安排正式行程</div>`}</div>`;
  }).join('');
  return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${v653Html(title)}</title><style>
    @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:"PingFang TC","Noto Sans TC","Helvetica Neue",-apple-system,BlinkMacSystemFont,sans-serif;color:#2C2A29;background:#F7F3EC;margin:0;padding:24px}.page{max-width:900px;margin:auto;background:#FFFDFC;border:1px solid #E2DDD5;border-radius:28px;overflow:hidden;box-shadow:0 18px 48px rgba(44,42,41,.08)}.hero{padding:28px;background:linear-gradient(135deg,#FFFDFC,#F2F6F4);border-bottom:1px solid #E2DDD5}.brand{display:inline-flex;border-radius:999px;background:#F2F6F4;color:#4A5D4E;border:1px solid #E2DDD5;padding:7px 12px;font-size:12px;font-weight:900;margin-bottom:14px}h1{font-size:30px;margin:0 0 8px}.sub{color:#8B827A;line-height:1.6}.content{padding:22px}.sec{border:1px solid #E2DDD5;border-radius:20px;padding:16px;margin-bottom:14px;break-inside:avoid;background:#fff}h2{font-size:17px;margin:0 0 10px}.v652FlightItem,.v652HotelItem,.item{border:1px solid #EEE8DF;border-radius:16px;padding:11px;margin:8px 0;break-inside:avoid}.v652FlightLine,.plan{display:grid;grid-template-columns:84px 1fr;gap:9px;margin:7px 0}.v652TimePill,.pill{display:inline-flex;justify-content:center;border-radius:999px;background:#F3EEE8;color:#6F6257;padding:5px 8px;font-size:11px;font-weight:900;margin-right:6px;white-space:nowrap}.v652MainText,.v652PlanName,.main{font-weight:900;line-height:1.5}.v652MiniText,.v652PlanNote,.mini{color:#8B827A;font-size:12px;line-height:1.55;margin-top:4px}.v652ShareSubTitle{display:inline-flex;border-radius:999px;background:#F2F6F4;color:#4A5D4E;padding:5px 9px;font-size:11px;font-weight:900;margin:4px 0 8px}.v652FlightGrid,.v652HotelGrid{display:grid;gap:8px}.footer{text-align:center;color:#8B827A;font-size:11px;padding:16px;border-top:1px solid #E2DDD5}@media(max-width:620px){body{padding:12px}.page{border-radius:20px}.v652FlightLine,.plan{grid-template-columns:1fr}}@media print{body{background:#fff;padding:0}.page{box-shadow:none;border:0;border-radius:0}.hero{padding:0 0 8mm}.content{padding:8mm 0 0}.sec{page-break-inside:avoid}.noPrint{display:none!important}}
  </style></head><body><div class="page"><div class="hero"><div class="brand">貞選旅管家 Janeselect Travel Manager</div><h1>${v653Html(title)}</h1><div class="sub">${v653Html(data?.trip?.dest||'')}｜${v653Html(v653TripRange())}</div></div><div class="content"><div class="sec"><h2>✈️ 機票與交通</h2>${v653FlightHtml('out')}${v653FlightHtml('back')}</div><div class="sec"><h2>🏨 住宿資訊</h2>${v653HotelHtml()}</div><div class="sec"><h2>🗓️ 每日簡易行程</h2>${dayPrint}</div></div><div class="footer">貞選旅管家 Janeselect Travel Manager</div></div><script>setTimeout(()=>window.print(),350)<\/script></body></html>`;
}
function v653PrintItinerary(){
  const w=window.open('', '_blank');
  if(!w) return alert('請允許瀏覽器開啟新視窗後再試一次。');
  w.document.open();
  w.document.write(v653PrintableHtml());
  w.document.close();
}
function v653InsertPlannerShareButton(){
  const root=document.getElementById('plannerView');
  if(!root) return;
  const section=root.querySelector('.section');
  if(!section) return;
  let btn=root.querySelector('#v653PlannerShareBtn') || root.querySelector('#v651PlannerShareBtn');
  if(!btn){
    btn=document.createElement('button');
    section.appendChild(btn);
  }else if(btn.parentElement!==section){
    section.appendChild(btn);
  }
  btn.id='v653PlannerShareBtn';
  btn.type='button';
  btn.className='v651PlannerShareBtn v653PlannerShareBtn noPrint';
  btn.textContent='分享簡易行程';
  btn.onclick=v653OpenItineraryShare;
}
function v653UpdateFooterVersion(){
  document.querySelectorAll('footer strong,.siteFooterVersion').forEach(el=>el.textContent=V653_VERSION_SHORT);
}
function v653UpdateHelpLog(){
  const log=document.getElementById('v64UpdateLog') || document.getElementById('helpView')?.querySelector('.card');
  if(log){
    log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V653_VERSION_TEXT)}</b><br>本版整理為現行維護基準：保留目前正在呈現與使用的旅程清單、登入同步、行程、住宿航班、預算、行李、AI 輔助、照片旅遊書與簡易行程分享流程；移除程式內大量歷史補丁說明文字，並把簡易行程分享的統計移除邏輯整併回現行函式。資料結構、localStorage key、Firestore 路徑、Cloudinary 圖片網址與既有介面設定皆未調整，保留未來 admin.html / admin.js 後台擴充彈性。</div>`;
  }
}
window.v651OpenItineraryShare = v653OpenItineraryShare;
window.v651CopyItinerary = v653CopyItinerary;
window.v651PrintItinerary = v653PrintItinerary;
window.v651CloseItineraryShare = v653CloseItineraryShare;
window.v651ItineraryText = v653ItineraryText;

const v653PrevRenderPlanner = typeof renderPlanner === 'function' ? renderPlanner : null;
if(v653PrevRenderPlanner && !v653PrevRenderPlanner.__v653ShareWrapped){
  renderPlanner = function(...args){
    const r = v653PrevRenderPlanner.apply(this,args);
    setTimeout(v653InsertPlannerShareButton,80);
    return r;
  };
  renderPlanner.__v653ShareWrapped = true;
}

const v653PrevRenderHelp = typeof renderHelp === 'function' ? renderHelp : null;
if(v653PrevRenderHelp && !v653PrevRenderHelp.__v653Wrapped){
  renderHelp = function(...args){
    const r = v653PrevRenderHelp.apply(this,args);
    v653UpdateHelpLog();
    v653UpdateFooterVersion();
    return r;
  };
  renderHelp.__v653Wrapped = true;
}

setTimeout(()=>{try{v653UpdateFooterVersion(); v653InsertPlannerShareButton(); v653UpdateHelpLog(); if(typeof render==='function') render();}catch(e){console.warn(e)}},980);
setTimeout(()=>{try{v653UpdateFooterVersion(); v653InsertPlannerShareButton(); v653UpdateHelpLog();}catch(e){console.warn(e)}},1300);

/* ── 啟動（所有函式定義完畢後執行） ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    init();
    v63Boot();
  });
} else {
  init();
  v63Boot();
}
