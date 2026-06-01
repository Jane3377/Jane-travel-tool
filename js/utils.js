/* ── utils.js：工具函式（uid, esc, fmt, toast...） ── */
function uid(){return crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())}function $(id){return document.getElementById(id)}function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])).replaceAll("\\n","<br>")}function fmt(n){return Number(n||0).toLocaleString("zh-TW")}function parseLocalDate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}function formatLocalDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}function short(k){if(!k)return"";const [y,m,d]=k.split("-");return `${Number(m)}/${Number(d)}`}function toast(m){$("toast").textContent=m;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1900)}
function mkDays(s,e){let a=[];if(!s||!e)return a;let sd=parseLocalDate(s),ed=parseLocalDate(e),i=1;for(let d=new Date(sd);d<=ed;d.setDate(d.getDate()+1)){let k=formatLocalDate(d);a.push({key:k,label:`${d.getMonth()+1}/${d.getDate()}`,title:`Day ${i++}`})}return a}
function travelerInputs(){let out="";for(let i=0;i<Number(data.trip.travelerCount||1);i++)out+=`<div><label>旅伴 ${String.fromCharCode(65+i)} 名稱</label><input id="traveler${i}" value="${esc(data.trip.travelers[i]||String.fromCharCode(65+i))}"></div>`;return out}
function timeFromDateTime(dt){return dt?dt.split("T")[1]||"":""}
function dateFromDateTime(dt){return dt?dt.split("T")[0]||"":""}
function activityIcon(type){return type==="餐廳"?"🍜":type==="咖啡廳"?"☕":type==="購物"?"🛍️":type==="交通"||type==="航班"?"✈️":type==="雨天備案"?"☔":type==="其他"?"✨":"📍"}
const oldPlanCards=planCards;
function countryOptions(){
  return Object.keys(cityMapV10).map(c=>`<option value="${c}" ${data.trip.country==c?"selected":""}>${c==="歐洲"?"歐洲區域":c}</option>`).join("")+
    `<option value="其他" ${data.trip.country=="其他"?"selected":""}>其他</option>`;
}
function dateFromDateTime(dt){return dt?dt.split("T")[0]||"":""}
function timeFromDateTime(dt){return dt?dt.split("T")[1]||"":""}
function datesBetween(start,end){
  let arr=[],sd=parseLocalDate(start),ed=parseLocalDate(end);
  for(let d=new Date(sd);d<=ed;d.setDate(d.getDate()+1))arr.push(formatLocalDate(d));
  return arr;
}
function dateBefore(dateStr){
  let d=parseLocalDate(dateStr); d.setDate(d.getDate()-1); return formatLocalDate(d);
}
function countryOptions(){
  return Object.keys(cityMapV10).map(c=>`<option value="${c}" ${data.trip.country==c?"selected":""}>${c==="歐洲"?"歐洲區域":c}</option>`).join("")+
    `<option value="其他" ${data.trip.country=="其他"?"selected":""}>其他</option>`;
}
function countryOptions(){
  const countries = Object.keys(v15CountryCityMaps().cityMap);
  return countries.map(c=>`<option value="${c}" ${data.trip.country==c?"selected":""}>${c==="歐洲"?"歐洲區域":c}</option>`).join("")+
    `<option value="其他" ${data.trip.country=="其他"?"selected":""}>其他</option>`;
}

function activityIcon(type){
  return type==="餐廳"?"🍜":type==="咖啡廳"?"☕":type==="購物"?"🛍️":type==="交通"||type==="航班"?"✈️":type==="住宿"?"🏨":type==="雨天備案"?"☔":type==="其他"?"✨":"📍";
}

function countryOptions(){
  const order=["韓國","日本","中國","香港","新加坡","泰國","越南","美國","歐洲","英國","其他"];
  const existing=Object.keys(currencyMap).filter(c=>!order.includes(c));
  return [...order.filter(c=>c==="其他" || currencyMap[c]),...existing]
    .map(c=>`<option value="${c}" ${data.trip.country==c?"selected":""}>${c}</option>`)
    .join("");
}

