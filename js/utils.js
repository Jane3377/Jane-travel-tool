/* ── utils.js ── */

function uid(){return crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())}
function $(id){return document.getElementById(id)}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":'&#039;'}[m])).replaceAll("\\n","<br>")}
function fmt(n){return Number(n||0).toLocaleString("zh-TW")}
function parseLocalDate(s){const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function formatLocalDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function short(k){if(!k)return"";const[y,m,d]=k.split("-");return `${Number(m)}/${Number(d)}`}
function toast(m){$("toast").textContent=m;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1900)}
function mkDays(s,e){let a=[];if(!s||!e)return a;let sd=parseLocalDate(s),ed=parseLocalDate(e),i=1;for(let d=new Date(sd);d<=ed;d.setDate(d.getDate()+1)){let k=formatLocalDate(d);a.push({key:k,label:`${d.getMonth()+1}/${d.getDate()}`,title:`Day ${i++}`})}return a}
function dayTitle(k){let d=data.days.find(x=>x.key==k);return d?`${d.title}｜${d.label}`:k}
function hotelFor(k){return data.hotels.find(h=>k>=h.start&&k<=h.end)}
function travelerName(v){if(v==="共同"||v==="未定")return v;return data.trip.travelers[Number(v)]||v||"未定"}
function moneyTwd(item){return item.mode==="TWD"?Number(item.twd||0):Math.round(Number(item.foreign||0)*Number(data.trip.rate||0))}
function moneyForeign(item){return item.mode==="TWD"?Math.round(Number(item.twd||0)/Number(data.trip.rate||1)):Number(item.foreign||0)}
function payMethodLabel(v){return v==="cash"?"現金":v==="card"?"刷卡":v==="transfer"?"轉帳":v||"未定"}
function openRateSearch(){open(`https://www.google.com/search?q=${encodeURIComponent((data.trip.currency||"KRW")+" TWD 匯率")}`,"_blank")}
function map(q){open("https://www.google.com/maps/search/?api=1&query="+q,"_blank")}
function routeCurrent(q){map(q)}
function route(a,b,m){let mode=m=="走路"?"walking":m=="開車/計程車"?"driving":"transit";open(`https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}&travelmode=${mode}`,"_blank")}
function addMinutes(t,min){if(!t)return"";let[h,m]=t.split(":").map(Number),total=h*60+m+Number(min||0);total=((total%1440)+1440)%1440;return String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0")}
function diffMinutes(a,b){if(!a||!b)return 60;let[ah,am]=a.split(":").map(Number),[bh,bm]=b.split(":").map(Number);return Math.max(15,bh*60+bm-(ah*60+am))}
function timeToMin(t){if(!t)return 0;let[h,m]=t.split(":").map(Number);return h*60+m}
function sortedPlans(day){return data.plans.filter(p=>p.day==day).sort((a,b)=>String(a.start).localeCompare(String(b.start))||String(a.end).localeCompare(String(b.end)))}
function travelerInputs(){let out="";for(let i=0;i<Number(data.trip.travelerCount||1);i++)out+=`<div><label>旅伴 ${String.fromCharCode(65+i)} 名稱</label><input id="traveler${i}" value="${esc(data.trip.travelers[i]||String.fromCharCode(65+i))}"></div>`;return out}
function optsDays(selected=""){return data.days.map(d=>`<option value="${d.key}" ${d.key==selected?"selected":""}>${d.label} ${d.title}</option>`).join("")}
function optsPayer(selected="未定"){let opts=data.trip.travelers.map((n,i)=>[String(i),n]);opts.push(["共同","共同"],["未定","未定"]);return opts.map(x=>`<option value="${x[0]}" ${String(x[0])===String(selected)?"selected":""}>${esc(x[1])}</option>`).join("")}
function optsPayMethod(selected="未定"){return [["cash","現金"],["card","刷卡"],["transfer","轉帳"],["未定","未定"]].map(x=>`<option value="${x[0]}" ${x[0]==selected?"selected":""}>${x[1]}</option>`).join("")}

/* ── v15 城市/國家/目的地 ── */
function countryOptions(){const order=["韓國","日本","中國","香港","新加坡","泰國","越南","美國","歐洲","英國","其他"];const existing=Object.keys(currencyMap).filter(c=>!order.includes(c));return[...order.filter(c=>c==="其他"||currencyMap[c]),...existing].map(c=>`<option value="${c}" ${data.trip.country==c?"selected":""}>${c}</option>`).join("")}
function activityIcon(type){return type==="餐廳"?"🍜":type==="咖啡廳"?"☕":type==="購物"?"🛍️":type==="交通"||type==="航班"?"✈️":type==="住宿"?"🏨":type==="雨天備案"?"☔":type==="其他"?"✨":"📍"}
function templateCard(k,title,desc){return`<div class="templateCard ${data.meta.bookStyle==k?"active":""}" onclick="data.meta.bookStyle='${k}';save()"><b>${title}</b><span class="mini">${desc}</span></div>`}

/* ── v28 行程正規化 ── */
function normalizeImportedJsonText(text){let t=text.trim();if(t.startsWith("```"))t=t.replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();const first=t.indexOf("{"),last=t.lastIndexOf("}");if(first>=0&&last>first)t=t.slice(first,last+1);return t}

/* v23 口袋景點日期正規化 */
function v23NormalizeSpotDate(raw){if(!raw)return"";return v23InTripRange(raw)?raw:""}
