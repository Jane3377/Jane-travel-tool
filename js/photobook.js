/* ── photobook.js ── */

function setUploadStatus(message){const el=$("uploadStatus");if(el){el.textContent=message||"";el.classList.toggle("show",!!message)}}
function setPhotoUploadStatus(id,message){const el=$(id)||document.getElementById(id);if(el){el.textContent=message||"";el.classList.toggle("show",!!message)}}
function loadImageFromFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=e=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=e.target.result};reader.onerror=reject;reader.readAsDataURL(file)})}
async function compressImageToBlob(file,maxWidth=CLOUDINARY_CONFIG.maxWidth,quality=CLOUDINARY_CONFIG.quality){const img=await loadImageFromFile(file);const scale=Math.min(1,maxWidth/img.width);const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);return new Promise(resolve=>{canvas.toBlob(blob=>resolve(blob),"image/jpeg",quality)})}
async function uploadBlobToCloudinary(blob,filename="travel-photo.jpg"){const form=new FormData();form.append("file",blob,filename.replace(/\.[^.]+$/,"")+".jpg");form.append("upload_preset",CLOUDINARY_CONFIG.uploadPreset);if(CLOUDINARY_CONFIG.folder)form.append("folder",CLOUDINARY_CONFIG.folder);const url=`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;const res=await fetch(url,{method:"POST",body:form});if(!res.ok){const err=await res.json();throw new Error(err?.error?.message||`Cloudinary 上傳失敗 (HTTP ${res.status})`)}const result=await res.json();return{src:result.secure_url,publicId:result.public_id,width:result.width,height:result.height,bytes:result.bytes,format:result.format}}
async function uploadImageFile(file,options={}){const maxWidth=options.maxWidth||CLOUDINARY_CONFIG.maxWidth;const quality=options.quality||CLOUDINARY_CONFIG.quality;setUploadStatus("壓縮中...");const blob=await compressImageToBlob(file,maxWidth,quality);setUploadStatus("上傳中...");const result=await uploadBlobToCloudinary(blob,file.name);setUploadStatus("");return result}
async function uploadImageFileForPhotoBook(file,options={},statusId="photoUploadStatus"){const maxWidth=options.maxWidth||1600,quality=options.quality||.82;setPhotoUploadStatus(statusId,"壓縮中...");const blob=await compressImageToBlob(file,maxWidth,quality);setPhotoUploadStatus(statusId,"上傳中...");const result=await uploadBlobToCloudinary(blob,file.name);setPhotoUploadStatus(statusId,"");return result}

/* 整本封面 / 每日封面 */
async function addTripCover(file){if(!file)return;try{const img=await uploadImageFile(file,{maxWidth:1800,quality:.84});data.tripCover=img.src;data.tripCoverMeta=img;save();toast("旅遊書封面已上傳")}catch(err){setUploadStatus("");alert("封面上傳失敗："+err.message)}}
function removeTripCover(){if(!data.tripCover)return;if(!confirm("確定刪除整本旅遊書封面照片？"))return;delete data.tripCover;delete data.tripCoverMeta;save();toast("已刪除整本封面照片")}
async function addDayCover(day,file){if(!file)return;try{const img=await uploadImageFile(file,{maxWidth:1800,quality:.84});if(!data.dayCovers)data.dayCovers={};if(!data.dayCoverMeta)data.dayCoverMeta={};data.dayCovers[day]=img.src;data.dayCoverMeta[day]={source:"upload",updatedAtClient:Date.now()};save();toast("今日封面已上傳")}catch(err){alert("封面上傳失敗："+err.message)}}
function removeDayCover(day){if(!data.dayCovers||!data.dayCovers[day])return;if(!confirm("確定刪除這一天的封面照片？"))return;delete data.dayCovers[day];if(data.dayCoverMeta)delete data.dayCoverMeta[day];save();toast("已刪除本日封面照片")}

/* 照片日記 */
function photoCountForDay(day){return(data.photos||[]).filter(p=>p.day==day).length}
function v65PhotosForDay(day){return(data.photos||[]).filter(p=>p.day==day)}
function v65PhotoCountForDay(day){return v65PhotosForDay(day).length}
function v65SetDayCoverFromPhoto(day,photoId){const p=(data.photos||[]).find(x=>x.id===photoId);if(!p||!p.src)return toast("找不到這張照片");if(!data.dayCovers)data.dayCovers={};if(!data.dayCoverMeta)data.dayCoverMeta={};data.dayCovers[day]=p.src;data.dayCoverMeta[day]={source:"photo",photoId:p.id,updatedAtClient:Date.now()};save();toast("已設為今日封面")}
function setDayCoverFromPhoto(day,photoId){return v65SetDayCoverFromPhoto(day,photoId)}
function v65DayCoverCandidates(day,photos){if(!photos||!photos.length)return`<div class="v65DayCoverHint">今日照片日記還沒有照片。你可以先自行上傳封面，或稍後從今日照片中挑選。</div>`;return`<div><div class="v65DayCoverHint">也可以從今日照片日記選一張當封面：</div><div class="v65CoverCandidates">${photos.slice(0,10).map(p=>`<div class="v65CoverCandidate"><img src="${p.src}" alt=""><button type="button" onclick="setDayCoverFromPhoto('${day}','${p.id}')">設為今日封面</button></div>`).join("")}</div></div>`}
function delPhoto(id){data.photos=data.photos.filter(p=>p.id!=id);save()}

/* 照片上傳表單（帶預覽，v65 最終版） */
function v65PhotoAttr(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function revokeStoryPhotoPreview(day){if(storyPhotoPreviewUrls[day]){try{URL.revokeObjectURL(storyPhotoPreviewUrls[day])}catch(e){}delete storyPhotoPreviewUrls[day]}}
function selectStoryPhotoFile(day,file){revokeStoryPhotoPreview(day);if(!file){delete storyPendingPhotoFiles[day];const meta=document.getElementById(`storyPhotoPickMeta-${day}`),preview=document.getElementById(`storyPhotoPickPreview-${day}`);if(meta)meta.textContent="請先選擇 1 張照片，再輸入標題與一句照片日記。";if(preview){preview.classList.remove("show");preview.innerHTML=""}return}storyPendingPhotoFiles[day]=file;const url=URL.createObjectURL(file);storyPhotoPreviewUrls[day]=url;const meta=document.getElementById(`storyPhotoPickMeta-${day}`);if(meta)meta.textContent=`已選擇：${file.name}`;const preview=document.getElementById(`storyPhotoPickPreview-${day}`);if(preview){preview.classList.add("show");preview.innerHTML=`<img src="${url}"><div>預覽照片：新增後會上傳到照片日記</div>`}}
function clearPendingStoryPhoto(day){revokeStoryPhotoPreview(day);delete storyPendingPhotoFiles[day];const input=document.getElementById(`storyPhotoFile-${day}`);if(input)input.value="";const meta=document.getElementById(`storyPhotoPickMeta-${day}`);if(meta)meta.textContent="請先選擇 1 張照片，再輸入標題與一句照片日記。";const preview=document.getElementById(`storyPhotoPickPreview-${day}`);if(preview){preview.classList.remove("show");preview.innerHTML=""}}
function storyPhotoUploadForm(day,count){if(count>=10)return"";const file=storyPendingPhotoFiles[day];const previewUrl=storyPhotoPreviewUrls[day]||"";return`<div class="storyPhotoUploadCard noPrint"><div class="storyPhotoPickBox"><label class="storyPhotoPickLabel">${file?"已選擇照片，可繼續補標題與日記":"＋ 先選擇要上傳的照片"}<input id="storyPhotoFile-${day}" type="file" accept="image/*" onchange="selectStoryPhotoFile('${day}',this.files[0])"></label><div class="storyPhotoPickMeta" id="storyPhotoPickMeta-${day}">${file?"已選擇："+v65PhotoAttr(file.name):"請先選擇 1 張照片，再輸入標題與一句照片日記。"}</div><div class="storyPhotoPickPreview ${previewUrl?"show":""}" id="storyPhotoPickPreview-${day}">${previewUrl?`<img src="${previewUrl}"><div>預覽照片：新增後會上傳到照片日記</div>`:""}</div></div><div class="storyPhotoQuickFields v65NoTags"><input id="storyPhotoTitle-${day}" placeholder="照片標題，例如：海雲台散步"></div><input id="storyPhotoMemo-${day}" placeholder="一句照片日記"><div class="storyPhotoUploadActions"><button class="btn soft" type="button" onclick="clearPendingStoryPhoto('${day}')">清除照片</button><button class="btn dark" type="button" onclick="addPhotoToDay('${day}')">新增到 ${dayTitle(day)}</button></div><div class="photoUploadStatus" id="storyPhotoStatus-${day}"></div></div>`}

/* v65 最終版 addPhotoToDay */
async function addPhotoToDay(day){const file=storyPendingPhotoFiles[day];if(!file)return toast("請先選擇照片");const count=v65PhotoCountForDay(day);if(count>=10)return toast("這天最多上傳 10 張照片");try{setPhotoUploadStatus(`storyPhotoStatus-${day}`,"上傳中...");const img=await uploadImageFileForPhotoBook(file,{maxWidth:1600,quality:.82},`storyPhotoStatus-${day}`);data.photos.unshift({id:uid(),day,title:document.getElementById(`storyPhotoTitle-${day}`)?.value||"",memo:document.getElementById(`storyPhotoMemo-${day}`)?.value||"",tags:"",src:img.src,publicId:img.publicId,cloudinary:true,width:img.width,height:img.height,bytes:img.bytes});if(typeof clearPendingStoryPhoto==="function")clearPendingStoryPhoto(day);["storyPhotoTitle-"+day,"storyPhotoMemo-"+day,"storyPhotoFile-"+day].forEach(id=>{const el=document.getElementById(id);if(el)el.value=""});save();toast("照片已加入這天的照片日記")}catch(err){setPhotoUploadStatus(`storyPhotoStatus-${day}`,"");alert("照片上傳失敗："+(err?.message||err))}}

/* v65 最終版照片編輯 modal */
function openPhotoEditModal(id){const p=(data.photos||[]).find(x=>x.id===id);if(!p)return;window.activePhotoEditId=id;let modal=document.getElementById("photoEditModal");if(!modal){modal=document.createElement("div");modal.id="photoEditModal";modal.className="photoEditModal noPrint";document.body.appendChild(modal)}modal.innerHTML=`<div class="photoEditBox"><div class="photoEditHeader"><div><h3>編輯照片日記</h3><p>只修改照片標題與一句照片日記，不會更換原照片。</p></div><button class="photoEditClose" onclick="closePhotoEditModal()">×</button></div><img class="photoEditPreview" src="${p.src}"><label>照片標題</label><input id="modalPhotoTitle" value="${v65PhotoAttr(p.title||"")}"><label>一句照片日記</label><textarea id="modalPhotoMemo">${esc(p.memo||"")}</textarea><div class="photoEditActions"><button class="btn dark" onclick="savePhotoEditModal()">儲存修改</button><button class="btn soft" onclick="closePhotoEditModal()">取消</button></div></div>`;modal.classList.add("show")}
function closePhotoEditModal(){document.getElementById("photoEditModal")?.classList.remove("show")}
function v646PhotoOrientation(p){const w=Number(p?.width||0),h=Number(p?.height||0);if(w&&h){if(h>w*1.08)return"portrait";if(w>h*1.08)return"landscape";return"square"}return"landscape"}

/* 標籤（v65 起不顯示） */
function photoTagsHtml(){return""}
function storyTagsHtml(){return""}

/* ── 備份匯出匯入 ── */
function storyBookCoverHtml(){const cover=data.tripCover;return`<section class="storyBookCover noPrint v65CoverSection">
  <div class="v65CoverEditor">
    <div class="v65CoverPreview">${cover?`<img class="storyBookCoverImage" src="${cover}"><button class="v65RemoveCoverBtn" type="button" onclick="removeTripCover()">移除封面</button>`:'<div class="v65NoCover">尚未上傳整本旅遊書封面照</div>'}</div>
    <div class="v65CoverMeta">
      <label>選擇旅遊書封面照片</label>
      <input type="file" accept="image/*" onchange="addTripCover(this.files[0])">
      <div class="storyUploadNote">建議橫式 1600×1000px 以上。</div>
      <div class="photoUploadStatus" id="coverUploadStatus"></div>
    </div>
    <div class="v65CoverText">
      <div class="templateRail">
        ${templateCard("fresh","🌿 韓系清新","米白淡綠、乾淨圓角")}
        ${templateCard("fun","🌈 活潑可愛","貼紙感、虛線框、繽紛")}
        ${templateCard("diary","✎ 手帳日記","紙張格線、手寫感")}
      </div>
    </div>
  </div>
</section>
<section class="storyBookCover printOnly">
  ${cover?`<img class="storyBookCoverImage" src="${cover}">`:""}
  <div class="storyBookCoverOverlay"></div>
  <div class="storyBookCoverText">
    <span class="eyebrow">MY TRAVEL BOOK</span>
    <h1>${esc(data.meta.title||"我的旅行手帳")}</h1>
    <p>${esc(data.meta.subtitle||"")}</p>
    <div class="storyBookCoverMeta">
      <span>目的地：${esc(data.trip.dest||"未設定")}</span>
      <span>${esc(short(data.trip.start))} - ${esc(short(data.trip.end))}</span>
    </div>
  </div>
</section>`}

/* storyTimelineHtml */
function storyTimelineHtml(plans){if(!plans.length)return`<div class="storyEmpty">這天還沒有安排正式行程，可以先用照片記錄旅途。</div>`;return`<div class="storyTimeline">${plans.map(p=>`<div class="storyTimelineItem"><div class="storyTimelineTime">${esc(p.start||"--:--")}</div><div class="storyTimelineContent"><b>${activityIcon(p.type)} ${esc(p.name)}</b><span>${esc(p.end?`至 ${p.end}`:"")} ${p.note?`｜${p.note}`:""}</span></div></div>`).join("")}</div>`}

/* v65 最終版 storyBookPhotoCard */
function storyBookPhotoCard(p,idx){const ori=typeof v646PhotoOrientation==="function"?v646PhotoOrientation(p):"landscape";const editBtn=`<button class="small" onclick="openPhotoEditModal('${p.id}')">編輯</button>`;return`<div class="storyPhotoCard ${idx===0?"featured":""} orientation-${ori}"><div class="storyPhotoImage"><img src="${p.src}" alt="${v65PhotoAttr(p.title||"")}"></div><div class="storyPhotoText"><h3>${esc(p.title||"照片紀錄")}</h3><p>${esc(p.memo||"")}</p><div class="storyPhotoCardActions noPrint">${editBtn}<button class="small" onclick="delPhoto('${p.id}')">刪除</button></div></div></div>`}

/* v65 最終版 storyBookDay（含封面候選選擇功能） */
function storyBookDay(d){const plans=sortedPlans(d.key);const photos=v65PhotosForDay(d.key);const cover=data.dayCovers?.[d.key]||photos[0]?.src||"";const count=photos.length;return`<section class="storyDay">
  <div class="storyDayHeader">
    <div>
      <span class="eyebrow">${d.title}</span>
      <h2>${d.label} 的旅行故事</h2>
      <p>住宿：${hotelFor(d.key)?.name||"未設定"}。今天收錄 ${plans.length} 個行程與 ${count} 張照片。</p>
    </div>
    <div class="bookDayBadge">${plans.length} 行程｜${count} 照片</div>
  </div>
  <div class="storyDayCoverBlock noPrint">
    <div class="v65CoverUploadRow">
      <label>今日封面照片：<input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></label>
      ${cover&&data.dayCovers?.[d.key]?`<button class="small" onclick="removeDayCover('${d.key}')">移除封面</button>`:""}
    </div>
    <div class="photoUploadStatus" id="dayCoverStatus-${d.key}"></div>
    ${v65DayCoverCandidates(d.key,photos)}
  </div>
  <div class="storyDayHero ${cover?"":"storyInlineEmpty"}">
    ${cover?`<img src="${cover}">`:'<div>尚未上傳本日封面圖</div>'}
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
          <div class="storyPhotoLimit">${count}/10 張照片${count<10?"，可繼續上傳":"，已達上限"}</div>
        </div>
      </div>
      ${storyPhotoUploadForm(d.key,count)}
      ${photos.length?`<div class="storyPhotoLayout">${photos.map(storyBookPhotoCard).join("")}</div>`:`<div class="storyEmpty">還沒有照片日記，先上傳幾張今天的代表照片吧。</div>`}
    </div>
  </div>
</section>`}

/* ── v650 最終版 renderPhotoBook ── */
function renderPhotoBook(){$("photoBookView").innerHTML=`<div class="section">
  <div class="storyOnlyIntro">
    <div><h2>📖 照片旅遊書</h2><div class="hint">直接在故事預覽中上傳封面與每日照片；每一天最多 10 張照片。</div></div>
    <div class="storyOnlyActions noPrint"><button class="btn soft" onclick="openPdfPublisher(false)">匯出 PDF</button></div>
  </div>
</div>
<div class="storyBookPreview bookStyle-${data.meta.bookStyle||"fresh"}">
  <div class="storyBook">
    ${storyBookCoverHtml()}
    ${data.days.map(storyBookDay).join("")}
  </div>
</div>`}
function exportPhotoBookPDF(){openPdfPublisher(false)}
function openPdfPublisher(autoPrint=false){const url=autoPrint?"export.html?print=1":"export.html";open(url,"_blank")}
function addPhoto(){toast("請直接在旅遊書各天章節中使用「新增到照片日記」上傳照片。")}

/* ── v653 分享功能 ── */
function v653Html(v,fallback=""){return esc(String(v??fallback))}
function v653Clean(v){return String(v||"").replace(/<br>/g,"\n").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"')}
function v653DatePart(dt){return dt?String(dt).split("T")[0]:""}
function v653TimePart(dt){return dt&&String(dt).includes("T")?String(dt).split("T")[1].slice(0,5):""}
function v653PlanIcon(type){return activityIcon(normalizePlanType(type))}
function v653FlightObj(f){return normalizeFlightObj(f,"")}
function v653FlightSegments(f){return v653FlightObj(f).segments||[]}
function v653HasFlight(f){const segs=v653FlightSegments(f);return segs.length&&segs.some(s=>s.no||s.from||s.dep)}
function v653FlightLabel(dir){return dir==="out"?"去程":"回程"}
function v653FlightLines(k,f){if(!v653HasFlight(f))return[];const segs=v653FlightSegments(f);const lines=[`${v653FlightLabel(k)}航班`];segs.forEach((s,i)=>{lines.push(`第${i+1}段：${s.no||""}  ${s.from||""}→${s.to||""}  ${v653TimePart(s.dep)||""}起飛  ${v653TimePart(s.arr)||""}抵達`)});return lines}
function v653FlightHtml(k,f){const lines=v653FlightLines(k,f);if(!lines.length)return"";return`<div class="v653FlightBlock"><b>${lines[0]}</b><ul>${lines.slice(1).map(l=>`<li>${esc(l)}</li>`).join("")}</ul></div>`}
function v653HotelLines(h){return[`住宿：${h.name}  ${short(h.start)}-${short(h.end)}`]}
function v653HotelHtml(h){return`<div class="v653HotelRow"><span>${esc(h.name)}</span><span>${esc(short(h.start))}-${esc(short(h.end))}</span></div>`}
function v653TripRange(){return`${data.trip.start||""} ～ ${data.trip.end||""}`}
function v653AllPlans(){return data.days.map(d=>{const plans=sortedPlans(d.key);if(!plans.length)return null;return{day:d,plans}}).filter(Boolean)}
function v653ItineraryText(){const lines=[`【${data.meta.title||"我的旅程"}】`,`目的地：${data.trip.dest||"未設定"}`,`日期：${v653TripRange()}`,""];if(v653HasFlight(data.flights.out))lines.push(...v653FlightLines("out",data.flights.out),"");if(v653HasFlight(data.flights.back))lines.push(...v653FlightLines("back",data.flights.back),"");if(data.hotels.length)lines.push(...data.hotels.flatMap(h=>v653HotelLines(h)),"");v653AllPlans().forEach(({day,plans})=>{lines.push(`== ${day.title}｜${day.label} ==`);plans.forEach(p=>{const s=p.start||"--:--",e=p.end?"→"+p.end:"";lines.push(`${s}${e}  ${p.name||""}${p.note?" 【"+p.note+"】":""}`)});lines.push("")});return lines.join("\n")}
function v653ShareHtml(){const hasOut=v653HasFlight(data.flights.out),hasBack=v653HasFlight(data.flights.back);return`<div class="v653ShareContent"><h3>${esc(data.meta.title||"我的旅程")}</h3><p class="v653TripRange">📅 ${esc(v653TripRange())}｜${esc(data.trip.dest||"未設定")}</p>${hasOut?v653FlightHtml("out",data.flights.out):""}${hasBack?v653FlightHtml("back",data.flights.back):""}${data.hotels.map(h=>`<div class="v653Hotel">${v653HotelHtml(h)}</div>`).join("")}${v653AllPlans().map(({day,plans})=>`<div class="v653Day"><div class="v653DayTitle">${esc(day.title)}｜${esc(day.label)}</div><ul>${plans.map(p=>`<li><span class="v653Time">${esc(p.start||"--:--")}</span> ${esc(p.name||"")}${p.note?`<small>｜${esc(p.note)}</small>`:""}</li>`).join("")}</ul></div>`).join("")}</div>`}
function v653EnsureShareModal(){let modal=$("v653ShareModal");if(!modal){modal=document.createElement("div");modal.id="v653ShareModal";modal.className="v653ShareModal";document.body.appendChild(modal)}return modal}
function v653OpenItineraryShare(){const modal=v653EnsureShareModal();modal.innerHTML=`<div class="v653ShareBox"><div class="section"><h3>分享行程</h3><button class="iconBtn" onclick="v653CloseItineraryShare()">×</button></div><div class="v653ShareActions"><button class="btn dark compact" onclick="v653CopyItinerary()">複製純文字版</button><button class="btn blue compact" onclick="v653PrintItinerary()">列印行程單</button><button class="btn soft compact" onclick="v653CloseItineraryShare()">關閉</button></div><div class="v653SharePreview">${v653ShareHtml()}</div></div>`;modal.classList.add("show")}
function v653CloseItineraryShare(){$("v653ShareModal")?.classList.remove("show")}
function v653CopyItinerary(){const text=v653ItineraryText();navigator.clipboard?.writeText(text).then(()=>toast("已複製行程文字")).catch(()=>{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);toast("已複製行程文字")})}
function v653PrintableHtml(){return`<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><title>${v653Html(data.meta.title||"旅程行程單")}</title><style>body{font-family:'PingFang TC','Noto Sans TC',sans-serif;max-width:680px;margin:24px auto;font-size:14px;line-height:1.7;color:#3f3a35}h1{margin-bottom:4px}p{color:#8b827a;margin-top:0}section{margin-bottom:20px;page-break-inside:avoid}h3{border-bottom:1px solid #eadfd4;padding-bottom:4px;margin-bottom:8px}ul{padding-left:18px;margin:0}li{margin-bottom:2px}</style></head><body><h1>${v653Html(data.meta.title||"旅程行程單")}</h1><p>📅 ${v653Html(v653TripRange())}｜${v653Html(data.trip.dest||"未設定")}</p><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.8">${v653Html(v653ItineraryText())}</pre></body></html>`}
function v653PrintItinerary(){const w=window.open("","_blank","width=800,height=900");if(!w)return;w.document.write(v653PrintableHtml());w.document.close();setTimeout(()=>w.print(),200)}
function v653InsertPlannerShareButton(){const section=document.querySelector("#plannerView .section");if(!section||$("v653PlannerShareBtn"))return;const btn=document.createElement("button");btn.id="v653PlannerShareBtn";btn.className="btn soft compact noPrint";btn.textContent="分享行程";btn.onclick=v653OpenItineraryShare;section.appendChild(btn)}

/* ── v641 AI 偏好系統 ── */
const V641_STYLES=["","輕鬆慢旅","高效率踩點","美食咖啡優先","拍照打卡優先","親子友善","購物優先","文化歷史優先","自然風景優先","雨天備案優先"];
const V641_MBTIS=["","INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
const V641_ZODIACS=["","牡羊座","金牛座","雙子座","巨蟹座","獅子座","處女座","天秤座","天蠍座","射手座","摩羯座","水瓶座","雙魚座"];
