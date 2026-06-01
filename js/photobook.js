/* ── photobook.js：照片旅遊書、Cloudinary 上傳 ── */
function renderPhotoBook(){$("photoBookView").innerHTML=`<div class="section"><div><h2>照片旅遊書</h2><div class="hint">可選匯出風格，列印或存 PDF 時更像旅行書。</div></div><button class="btn soft noPrint" onclick="print()">匯出 PDF</button></div><div class="card noPrint"><div class="three"><div><label>照片書風格</label><select id="bookStyle" onchange="data.meta.bookStyle=this.value;save()"><option value="fresh" ${data.meta.bookStyle=="fresh"?"selected":""}>韓系清新</option><option value="fun" ${data.meta.bookStyle=="fun"?"selected":""}>活潑可愛</option><option value="diary" ${data.meta.bookStyle=="diary"?"selected":""}>手帳日記</option></select></div><div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div><div><label>照片標題</label><input id="pht"></div></div><label>選擇照片</label><input id="phf" type="file" accept="image/*"><label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea><div class="btns"><button class="btn dark" onclick="addPhoto()">壓縮並加入照片書</button></div></div><div class="bookStyle-${data.meta.bookStyle||"fresh"}"><div class="card"><h2>${esc(data.meta.title)}</h2><div class="box mint">${esc(data.meta.subtitle)}</div></div>${data.days.map(d=>photoBookDay(d)).join("")}</div>`}function photoBookDay(d){let plans=sortedPlans(d.key),photos=data.photos.filter(p=>p.day==d.key),cover=data.dayCovers[d.key];return `<div class="card bookDay"><div class="section"><div><h2>${d.title}｜${d.label}</h2><div class="hint">本日住宿：${hotelFor(d.key)?.name||"未設定"}</div></div><div class="noPrint"><input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></div></div>${cover?`<img class="dayCover" src="${cover}">`:`<div class="dayCover" style="display:grid;place-items:center;color:#999">尚未上傳本日封面圖</div>`}<div>${plans.map(p=>`<div class="box blue" style="margin-bottom:8px"><b>${p.start}-${p.end}｜${esc(p.name)}</b><br>${esc(p.note||"")}</div>`).join("")||'<div class="empty">這天還沒有行程</div>'}</div><div class="grid2" style="margin-top:10px">${photos.map(p=>`<div class="photo"><img src="${p.src}"><h3>${esc(p.title||"照片紀錄")}</h3><p class="mini">${esc(p.memo)}</p><button class="small noPrint" onclick="delPhoto('${p.id}')">刪除</button></div>`).join("")||""}</div></div>`}async function addDayCover(day,file){if(!file)return;data.dayCovers[day]=await compress(file,1400,.78);save()}async function addPhoto(){let f=$("phf").files[0];if(!f)return toast("請選照片");let src=await compress(f,1200,.75);data.photos.unshift({id:uid(),day:$("phd").value,title:$("pht").value,memo:$("phm").value,src});save()}function delPhoto(id){data.photos=data.photos.filter(p=>p.id!=id);save()}function compress(file,maxW=1200,q=.75){return new Promise(res=>{let r=new FileReader();r.onload=e=>{let img=new Image();img.onload=()=>{let scale=Math.min(1,maxW/img.width),c=document.createElement("canvas");c.width=img.width*scale;c.height=img.height*scale;c.getContext("2d").drawImage(img,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",q))};img.src=e.target.result};r.readAsDataURL(file)})}
function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section"><div><h2>📖 照片旅遊書</h2><div class="hint">可選匯出風格，列印或存 PDF 時更像旅行書。</div></div><button class="btn soft noPrint" onclick="print()">匯出 PDF</button></div>
  <div class="card noPrint"><div class="stylePreview"><span class="styleChip">🌿 韓系清新</span><span class="styleChip">🌈 活潑可愛</span><span class="styleChip">✎ 手帳日記</span></div><div class="three"><div><label>照片書風格</label><select id="bookStyle" onchange="data.meta.bookStyle=this.value;save()"><option value="fresh" ${data.meta.bookStyle=="fresh"?"selected":""}>🌿 韓系清新</option><option value="fun" ${data.meta.bookStyle=="fun"?"selected":""}>🌈 活潑可愛</option><option value="diary" ${data.meta.bookStyle=="diary"?"selected":""}>✎ 手帳日記</option></select></div><div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div><div><label>照片標題</label><input id="pht"></div></div><label>選擇照片</label><input id="phf" type="file" accept="image/*"><label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea><div class="btns"><button class="btn dark" onclick="addPhoto()">壓縮並加入照片書</button></div></div>
  <div class="bookStyle-${data.meta.bookStyle||"fresh"}"><div class="card"><h2>${esc(data.meta.title)}</h2><div class="box mint">${esc(data.meta.subtitle)}</div></div>${data.days.map(d=>photoBookDay(d)).join("")}</div>`;
}
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

function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section"><div><h2>📖 照片旅遊書</h2><div class="hint">選模板後，預覽與匯出 PDF 都會套用不同風格。</div></div><button class="btn soft noPrint" onclick="print()">匯出 PDF</button></div>
  <div class="card noPrint"><label>照片書模板</label><div class="templateRail">${templateCard("fresh","🌿 韓系清新","米白淡綠、乾淨圓角")}${templateCard("fun","🌈 活潑可愛","貼紙感、虛線框、繽紛")}${templateCard("diary","✎ 手帳日記","紙張格線、手寫感")}</div>
  <div class="three"><div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div><div><label>照片標題</label><input id="pht"></div><div><label>選擇照片</label><input id="phf" type="file" accept="image/*"></div></div><label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea><div class="btns"><button class="btn dark" onclick="addPhoto()">壓縮並加入照片書</button></div></div>
  <div class="bookTemplate ${data.meta.bookStyle||"fresh"}"><div class="card"><h2>${esc(data.meta.title)}</h2><div class="box mint">${esc(data.meta.subtitle)}</div></div>${data.days.map(d=>photoBookDay(d)).join("")}</div>`;
}
function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section"><div><h2>📖 照片旅遊書</h2><div class="hint">選模板後，預覽與匯出 PDF 都會套用不同風格。</div></div><button class="btn soft noPrint" onclick="print()">匯出 PDF</button></div>
  <div class="card noPrint">
    <label>照片書模板</label>
    <div class="templateRail">
      ${templateCard("fresh","🌿 韓系清新","米白淡綠、乾淨圓角")}
      ${templateCard("fun","🌈 活潑可愛","貼紙感、虛線框、繽紛")}
      ${templateCard("diary","✎ 手帳日記","紙張格線、手寫感")}
    </div>
    <div class="three compactMobile"><div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div><div class="full"><label>照片標題</label><input id="pht"></div></div>
    <label>選擇照片</label><input id="phf" type="file" accept="image/*">
    <label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea>
    <div class="btns"><button class="btn dark" onclick="addPhoto()">壓縮並加入照片書</button></div>
  </div>
  <div class="bookStyle-${data.meta.bookStyle||"fresh"}"><div class="card"><h2>${esc(data.meta.title)}</h2><div class="box mint">${esc(data.meta.subtitle)}</div></div>${data.days.map(d=>photoBookDay(d)).join("")}</div>`;
}

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

async function addDayCover(day,file){
  if(!file)return;
  try{
    const img = await uploadImageFile(file, {maxWidth:1800, quality:.84});
    data.dayCovers[day]=img.src;
    if(!data.dayCoverMeta) data.dayCoverMeta={};
    data.dayCoverMeta[day]=img;
    save();
    toast("本日封面圖已上傳 Cloudinary");
  }catch(err){
    setUploadStatus("");
    alert("封面圖上傳失敗：" + err.message);
  }
}

async function addPhoto(){
  let f=$("phf")?.files?.[0];
  if(!f)return toast("請選照片");
  try{
    const img = await uploadImageFile(f, {maxWidth:1600, quality:.82});
    data.photos.unshift({
      id:uid(),
      day:$("phd").value,
      title:$("pht").value,
      memo:$("phm").value,
      src:img.src,
      publicId:img.publicId,
      cloudinary:true,
      width:img.width,
      height:img.height,
      bytes:img.bytes
    });
    save();
    toast("照片已上傳 Cloudinary 並加入照片書");
  }catch(err){
    setUploadStatus("");
    alert("照片上傳失敗：" + err.message + "\n\n請確認 Cloudinary preset 是 Unsigned，且名稱為 travel_book_unsigned。");
  }
}

function delPhoto(id){
  data.photos=data.photos.filter(p=>p.id!=id);
  save();
}

function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section"><div><h2>📖 照片旅遊書</h2><div class="hint">照片會上傳到 Cloudinary，LocalStorage 只保存圖片網址，較適合長期累積旅行照片。</div></div><button class="btn soft noPrint" onclick="print()">匯出 PDF</button></div>
  <div class="card noPrint">
    <label>照片書模板</label>
    <div class="templateRail">
      ${templateCard("fresh","🌿 韓系清新","米白淡綠、乾淨圓角")}
      ${templateCard("fun","🌈 活潑可愛","貼紙感、虛線框、繽紛")}
      ${templateCard("diary","✎ 手帳日記","紙張格線、手寫感")}
    </div>
    <div class="three compactMobile">
      <div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div>
      <div class="full"><label>照片標題</label><input id="pht"></div>
    </div>
    <label>選擇照片</label><input id="phf" type="file" accept="image/*">
    <label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea>
    <div class="btns"><button class="btn dark" onclick="addPhoto()">上傳並加入照片書</button></div>
    <div class="uploadStatus" id="uploadStatus"></div>
    <div class="mini" style="margin-top:8px">Cloudinary folder：${CLOUDINARY_CONFIG.folder}｜preset：${CLOUDINARY_CONFIG.uploadPreset}</div>
  </div>
  <div class="bookStyle-${data.meta.bookStyle||"fresh"}"><div class="card"><h2>${esc(data.meta.title)}</h2><div class="box mint">${esc(data.meta.subtitle)}</div></div>${data.days.map(d=>photoBookDay(d)).join("")}</div>`;
}

function photoBookDay(d){
  const plans=sortedPlans(d.key);
  const photos=data.photos.filter(p=>p.day==d.key);
  const cover=data.dayCovers[d.key];
  return `<div class="card bookDay">
    <div class="section"><div><h2>${d.title}｜${d.label}</h2><div class="hint">本日住宿：${hotelFor(d.key)?.name||"未設定"}</div></div><div class="noPrint"><input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></div></div>
    ${cover?`<img class="dayCover" src="${cover}">`:`<div class="dayCover" style="display:grid;place-items:center;color:#999">尚未上傳本日封面圖</div>`}
    <div>${plans.map(p=>`<div class="box blue" style="margin-bottom:8px"><b>${p.start}-${p.end}｜${esc(p.name)}</b><br>${esc(p.note||"")}</div>`).join("")||'<div class="empty">這天還沒有行程</div>'}</div>
    <div class="grid2" style="margin-top:10px">${photos.map(p=>`<div class="photo"><img src="${p.src}"><h3>${esc(p.title||"照片紀錄")}</h3><p class="mini">${esc(p.memo)}</p><div class="tags">${p.cloudinary?'<span class="tag green">☁️ Cloudinary</span>':''}</div><button class="small noPrint" onclick="delPhoto('${p.id}')">刪除</button></div>`).join("")||""}</div>
  </div>`;
}
let v18PendingCountry = null;

function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section"><div><h2>📖 照片旅遊書</h2><div class="hint">照片存在 Cloudinary；匯出 PDF 時會依模板套用旅行書排版。</div></div><button class="btn soft noPrint" onclick="print()">匯出 PDF</button></div>
  <div class="card noPrint">
    <label>照片書模板</label>
    <div class="templateRail">
      ${templateCard("fresh","🌿 韓系清新","米白淡綠、乾淨圓角")}
      ${templateCard("fun","🌈 活潑可愛","貼紙感、虛線框、繽紛")}
      ${templateCard("diary","✎ 手帳日記","紙張格線、手寫感")}
    </div>
    <div class="three compactMobile">
      <div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div>
      <div class="full"><label>照片標題</label><input id="pht"></div>
    </div>
    <label>選擇照片</label><input id="phf" type="file" accept="image/*">
    <label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea>
    <div class="btns"><button class="btn dark" onclick="addPhoto()">上傳並加入照片書</button></div>
    <div class="uploadStatus" id="uploadStatus"></div>
    <div class="mini" style="margin-top:8px">Cloudinary folder：${CLOUDINARY_CONFIG.folder}｜preset：${CLOUDINARY_CONFIG.uploadPreset}</div>
  </div>
  <div class="bookStyle-${data.meta.bookStyle||"fresh"}">
    <div class="printCover">
      <h1>${esc(data.meta.title)}</h1>
      <p class="coverSub">${esc(data.meta.subtitle)}</p>
      <div class="coverMeta">
        <div><span class="mini">目的地</span><br><b>${esc(data.trip.dest)}</b></div>
        <div><span class="mini">日期</span><br><b>${short(data.trip.start)} - ${short(data.trip.end)}</b></div>
      </div>
    </div>
    <div class="card"><h2>${esc(data.meta.title)}</h2><div class="box mint">${esc(data.meta.subtitle)}</div></div>
    ${data.days.map(d=>photoBookDay(d)).join("")}
  </div>`;
}

function photoBookDay(d){
  const plans=sortedPlans(d.key);
  const photos=data.photos.filter(p=>p.day==d.key);
  const cover=data.dayCovers[d.key];
  return `<div class="card bookDay">
    <div class="bookDayHeader">
      <div><h2>${d.title}｜${d.label}</h2><div class="hint">本日住宿：${hotelFor(d.key)?.name||"未設定"}</div></div>
      <span class="bookDayBadge">${plans.length} 個行程｜${photos.length} 張照片</span>
      <div class="noPrint"><input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></div>
    </div>
    ${cover?`<img class="dayCover" src="${cover}">`:`<div class="dayCover" style="display:grid;place-items:center;color:#999">尚未上傳本日封面圖</div>`}
    <div class="bookTimeline">${plans.map(p=>`<div class="bookTimelineItem"><div class="bookTimelineTime">${esc(p.start||"--:--")}</div><div class="bookTimelineContent"><b>${activityIcon(p.type)} ${esc(p.name)}</b><div class="mini">${esc(p.end?("結束 "+p.end):"")}</div>${p.note?`<div style="margin-top:4px">${esc(p.note)}</div>`:""}</div></div>`).join("")||'<div class="empty">這天還沒有行程</div>'}</div>
    <div class="photoGridPrint">${photos.map(p=>`<div class="photo"><img src="${p.src}"><h3>${esc(p.title||"照片紀錄")}</h3><p class="mini">${esc(p.memo)}</p><div class="tags">${p.cloudinary?'<span class="tag green">☁️ Cloudinary</span>':''}</div><button class="small noPrint" onclick="delPhoto('${p.id}')">刪除</button></div>`).join("")||""}</div>
  </div>`;
}
let v19PendingDates = null;

async function addTripCover(file){
  if(!file)return;
  try{
    const img = await uploadImageFile(file, {maxWidth:1800, quality:.84});
    data.tripCover=img.src;
    data.tripCoverMeta=img;
    save();
    toast("旅遊書封面已上傳");
  }catch(err){
    setUploadStatus("");
    alert("封面上傳失敗：" + err.message);
  }
}

function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section"><div><h2>📖 照片旅遊書</h2><div class="hint">照片存在 Cloudinary；匯出 PDF 時會依模板套用旅行書排版。</div></div><button class="btn soft noPrint" onclick="print()">匯出 PDF</button></div>
  <div class="card noPrint">
    <label>照片書模板</label>
    <div class="templateRail">
      ${templateCard("fresh","🌿 韓系清新","米白淡綠、乾淨圓角")}
      ${templateCard("fun","🌈 活潑可愛","貼紙感、虛線框、繽紛")}
      ${templateCard("diary","✎ 手帳日記","紙張格線、手寫感")}
    </div>
    <label>整本旅遊書封面照</label>
    <input type="file" accept="image/*" onchange="addTripCover(this.files[0])">
    <div class="mini" style="margin-top:6px">建議尺寸：橫式 1600×1000px 以上，或手機照片 4:3／16:9；匯出 PDF 會自動裁切成封面比例。</div>
    <div class="tripCoverPreview">${data.tripCover?`<img src="${data.tripCover}">`:"尚未上傳整本封面照"}</div>
    <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
    <div class="three compactMobile">
      <div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div>
      <div class="full"><label>照片標題</label><input id="pht"></div>
    </div>
    <label>選擇照片</label><input id="phf" type="file" accept="image/*">
    <div class="mini" style="margin-top:6px">建議尺寸：一般照片 1200×900px 以上；系統會先壓縮再上傳 Cloudinary。</div>
    <label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea>
    <div class="btns"><button class="btn dark" onclick="addPhoto()">上傳並加入照片書</button></div>
    <div class="uploadStatus" id="uploadStatus"></div>
    <div class="mini" style="margin-top:8px">Cloudinary folder：${CLOUDINARY_CONFIG.folder}｜preset：${CLOUDINARY_CONFIG.uploadPreset}</div>
  </div>
  <div class="bookStyle-${data.meta.bookStyle||"fresh"}">
    <div class="printCover">
      <span class="bookOrnament"></span>
      <h1>${esc(data.meta.title)}</h1>
      <p class="coverSub">${esc(data.meta.subtitle)}</p>
      ${data.tripCover?`<img class="printCoverPhoto" src="${data.tripCover}">`:""}
      <div class="coverMeta">
        <div><span class="mini">目的地</span><br><b>${esc(data.trip.dest)}</b></div>
        <div><span class="mini">日期</span><br><b>${short(data.trip.start)} - ${short(data.trip.end)}</b></div>
      </div>
    </div>
    <div class="card"><h2>${esc(data.meta.title)}</h2><div class="box mint">${esc(data.meta.subtitle)}</div></div>
    ${data.days.map(d=>photoBookDay(d)).join("")}
  </div>`;
}

function photoBookDay(d){
  const plans=sortedPlans(d.key);
  const photos=data.photos.filter(p=>p.day==d.key);
  const cover=data.dayCovers[d.key];
  return `<div class="card bookDay">
    <div class="bookDayHeader">
      <div><span class="bookOrnament"></span><h2>${d.title}｜${d.label}</h2><div class="hint">本日住宿：${hotelFor(d.key)?.name||"未設定"}</div></div>
      <span class="bookDayBadge">${plans.length} 個行程｜${photos.length} 張照片</span>
      <div class="noPrint"><input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"><div class="mini">每日封面建議：1600×900px 以上</div></div>
    </div>
    ${cover?`<img class="dayCover" src="${cover}">`:`<div class="dayCover" style="display:grid;place-items:center;color:#999">尚未上傳本日封面圖</div>`}
    <div class="bookTimeline">${plans.map(p=>`<div class="bookTimelineItem"><div class="bookTimelineTime">${esc(p.start||"--:--")}</div><div class="bookTimelineContent"><b>${activityIcon(p.type)} ${esc(p.name)}</b><div class="mini">${esc(p.end?("結束 "+p.end):"")}</div>${p.note?`<div style="margin-top:4px">${esc(p.note)}</div>`:""}</div></div>`).join("")||'<div class="empty">這天還沒有行程</div>'}</div>
    <div class="photoGridPrint">${photos.map(p=>`<div class="photo"><img src="${p.src}"><h3>${esc(p.title||"照片紀錄")}</h3><p class="mini">${esc(p.memo)}</p><div class="tags">${p.cloudinary?'<span class="tag green">☁️ Cloudinary</span>':''}</div><button class="small noPrint" onclick="delPhoto('${p.id}')">刪除</button></div>`).join("")||""}</div>
  </div>`;
}
const APP_VERSION = "v63｜2026-05-30｜登入白名單與多旅程架構版";
console.log("貞選旅管家", APP_VERSION);
let v21PendingFlightOptions = false;
let v21PendingHotelId = null;

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

function exportPhotoBookPDF(){
  alert("匯出 PDF 建議使用電腦下載或列印，版面會比較穩定。手機也可以使用分享或列印功能另存 PDF。");
  print();
}

function photoTagsHtml(tags){
  const raw = String(tags||"").trim();
  if(!raw)return "";
  return `<div class="igTags">${raw.split(/[,\s，、]+/).filter(Boolean).map(t=>`<span class="igTag">${esc(t)}</span>`).join("")}</div>`;
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

function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section"><div><h2>📖 照片旅遊書</h2><div class="hint">封面、每日照片與日記會整理成一本旅行書；照片日記偏 IG 風格，橫圖顯示更好看。</div></div><button class="btn soft noPrint" onclick="exportPhotoBookPDF()">匯出 PDF</button></div>

  <div class="photoBookSectionCard noPrint">
    <div class="photoBookSectionTitle"><h3>① 封面上傳</h3><span>整本旅遊書封面</span></div>
    <div class="photoUploadCard">
      <label>照片書模板</label>
      <div class="templateRail">
        ${templateCard("fresh","🌿 韓系清新","米白淡綠、乾淨圓角")}
        ${templateCard("fun","🌈 活潑可愛","貼紙感、虛線框、繽紛")}
        ${templateCard("diary","✎ 手帳日記","紙張格線、手寫感")}
      </div>
      <label>選擇封面照片</label>
      <input type="file" accept="image/*" onchange="addTripCover(this.files[0])">
      <div class="mini" style="margin-top:6px">建議尺寸：橫式 1600×1000px 以上，或手機照片 4:3／16:9；匯出 PDF 會裁切成與網頁預覽一致的封面比例。</div>
      <div class="photoUploadStatus" id="coverUploadStatus"></div>
      <div class="coverUploadPreview">${data.tripCover?`<img src="${data.tripCover}">`:"尚未上傳整本封面照"}</div>
    </div>
  </div>

  <div class="photoBookSectionCard noPrint">
    <div class="photoBookSectionTitle"><h3>② 照片日記</h3><span>每日照片與心情紀錄</span></div>
    <div class="photoUploadCard">
      <div class="three compactMobile">
        <div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div>
        <div><label>照片標題</label><input id="pht" placeholder="例：海雲台散步"></div>
        <div><label>自訂標籤</label><input id="phtag" placeholder="例：🌊 海邊 咖啡"></div>
      </div>
      <label>選擇照片</label><input id="phf" type="file" accept="image/*">
      <div class="mini" style="margin-top:6px">橫圖會最接近照片書排版；也可用 emoji 或 tag 幫照片分類。</div>
      <label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea>
      <div class="btns"><button class="btn dark" onclick="addPhoto()">上傳並加入照片日記</button></div>
      <div class="photoUploadStatus" id="photoUploadStatus"></div>
    </div>
  </div>

  <div class="bookStyle-${data.meta.bookStyle||"fresh"}">
    <div class="printCover">
      <span class="bookOrnament"></span>
      <h1>${esc(data.meta.title)}</h1>
      <p class="coverSub">${esc(data.meta.subtitle)}</p>
      ${data.tripCover?`<img class="printCoverPhoto" src="${data.tripCover}">`:""}
      <div class="coverMeta">
        <div><span class="mini">目的地</span><br><b>${esc(data.trip.dest)}</b></div>
        <div><span class="mini">日期</span><br><b>${short(data.trip.start)} - ${short(data.trip.end)}</b></div>
      </div>
    </div>
    <div class="card"><h2>${esc(data.meta.title)}</h2><div class="box mint">${esc(data.meta.subtitle)}</div></div>
    ${data.days.map(d=>photoBookDay(d)).join("")}
  </div>`;
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
function exportPhotoBookPDF(){
  alert("匯出 PDF 建議使用電腦下載或列印，版面會比較穩定。這版已改成故事書列印版面，會盡量避免照片與段落被切頁。");
  print();
}

function storyTagsHtml(tags){
  const raw=String(tags||"").trim();
  if(!raw)return "";
  return `<div class="storyTags">${raw.split(/[,\s，、]+/).filter(Boolean).map(t=>`<span class="storyTag">${esc(t)}</span>`).join("")}</div>`;
}

function storyBookPhotoCard(p, idx){
  return `<div class="storyPhotoCard ${idx===0?"featured":""}">
    <div class="storyPhotoImage"><img src="${p.src}"></div>
    <div class="storyPhotoText">
      <h3>${esc(p.title||"照片紀錄")}</h3>
      ${storyTagsHtml(p.tags)}
      <p>${esc(p.memo||"")}</p>
      <button class="small noPrint" onclick="delPhoto('${p.id}')">刪除</button>
    </div>
  </div>`;
}

function storyBookDay(d){
  const plans=sortedPlans(d.key);
  const photos=data.photos.filter(p=>p.day==d.key);
  const cover=data.dayCovers[d.key] || photos[0]?.src || "";
  return `<section class="storyDay">
    <div class="storyDayHeader">
      <div>
        <span class="eyebrow">${d.title}</span>
        <h2>${d.label} 的旅行故事</h2>
        <p>住宿：${hotelFor(d.key)?.name||"未設定"}。今天收錄 ${plans.length} 個行程與 ${photos.length} 張照片。</p>
      </div>
      <div class="bookDayBadge">${plans.length} 行程｜${photos.length} 照片</div>
    </div>
    <div class="storyDayHero ${cover?"":"emptyHero"}">${cover?`<img src="${cover}">`:"尚未上傳本日封面圖"}</div>
    <div class="storyDayBody">
      <div>
        <div class="storyTimelineTitle">今天的路線</div>
        ${storyTimelineHtml(plans)}
      </div>
      <div>
        <div class="storyPhotosTitle">今日照片日記</div>
        ${photos.length?`<div class="storyPhotoLayout">${photos.map(storyBookPhotoCard).join("")}</div>`:`<div class="storyEmpty">還沒有照片日記，先上傳幾張今天的代表照片吧。</div>`}
      </div>
    </div>
  </section>`;
}

function renderPhotoBook(){
  const cover=data.tripCover;
  $("photoBookView").innerHTML=`<div class="section">
    <div><h2>📖 照片旅遊書</h2><div class="hint">把封面、每日封面、行程與照片日記整合成一本故事感旅行書。</div></div>
    <button class="btn soft noPrint" onclick="exportPhotoBookPDF()">匯出 PDF</button>
  </div>

  <div class="photoBookEditor noPrint">
    <div class="storyPanel">
      <div class="storyPanelHead">
        <div><h3>① 旅遊書封面</h3><p>整本旅遊書的主視覺，建議使用橫式照片。</p></div>
        <span class="tag green">整本封面</span>
      </div>
      <div class="templateRail">
        ${templateCard("fresh","🌿 韓系清新","米白淡綠、乾淨圓角")}
        ${templateCard("fun","🌈 活潑可愛","貼紙感、虛線框、繽紛")}
        ${templateCard("diary","✎ 手帳日記","紙張格線、手寫感")}
      </div>
      <label>選擇旅遊書封面照片</label>
      <input type="file" accept="image/*" onchange="addTripCover(this.files[0])">
      <div class="storyUploadNote">建議尺寸：橫式 1600×1000px 以上。匯出 PDF 時會固定比例，不會再讓封面過度放大。</div>
      <div class="photoUploadStatus" id="coverUploadStatus"></div>
      <div class="storyCoverPreview">${cover?`<img src="${cover}">`:"尚未上傳旅遊書封面"}</div>
    </div>

    <div class="storyPanel">
      <div class="storyPanelHead">
        <div><h3>② 每日封面</h3><p>每一天章節的代表照片，讓 PDF 看起來更像一本旅遊書。</p></div>
        <span class="tag blue">Day Cover</span>
      </div>
      ${dayCoverManagerHtml()}
    </div>

    <div class="storyPanel">
      <div class="storyPanelHead">
        <div><h3>③ 照片日記</h3><p>照片會依日期自動收進每一天故事；橫圖效果最好，也可加入 emoji 或標籤。</p></div>
        <span class="tag pink">Photo Diary</span>
      </div>
      <div class="storyPhotoEditorGrid">
        <div><label>照片日期</label><select id="phd">${optsDays(cur)}</select></div>
        <div><label>照片標題</label><input id="pht" placeholder="例：海雲台散步"></div>
        <div><label>自訂標籤</label><input id="phtag" placeholder="例：🌊 海邊 咖啡"></div>
      </div>
      <label>選擇照片</label><input id="phf" type="file" accept="image/*">
      <label>照片日記</label><textarea id="phm" placeholder="這天的天氣、心情、最好吃的一餐、最喜歡的瞬間……"></textarea>
      <div class="btns"><button class="btn dark" onclick="addPhoto()">上傳並加入照片日記</button></div>
      <div class="photoUploadStatus" id="photoUploadStatus"></div>
    </div>
  </div>

  <div class="storyBookPreview bookStyle-${data.meta.bookStyle||"fresh"}">
    <div class="storyBook">
      <section class="storyBookCover">
        ${cover?`<img class="storyBookCoverImage" src="${cover}">`:""}
        <div class="storyBookCoverOverlay"></div>
        <div class="storyBookCoverText">
          <span class="eyebrow">MY TRAVEL BOOK</span>
          <h1>${esc(data.meta.title)}</h1>
          <p>${esc(data.meta.subtitle)}</p>
          <div class="storyBookCoverMeta">
            <span>目的地：${esc(data.trip.dest||"未設定")}</span>
            <span>日期：${short(data.trip.start)} - ${short(data.trip.end)}</span>
            <span>${data.days.length} 天旅行</span>
          </div>
        </div>
      </section>
      ${data.days.map(storyBookDay).join("")}
    </div>
  </div>`;
}
function exportPhotoBookPDF(){
  alert("建議使用電腦 Chrome 匯出 PDF，版面最穩定。平板可預覽與簡單匯出，但 Safari 可能會讓背景、分頁或照片比例略有落差。");
  print();
}
let photoBookMode = "story";

function exportPhotoBookPDF(){
  if(photoBookMode !== "pdf"){
    photoBookMode = "pdf";
    renderPhotoBook();
  }
  alert("已切換到 PDF 預覽模式。建議使用電腦 Chrome 匯出 PDF，平板可預覽但 Safari 可能仍有些微落差。");
  print();
}

function exportPhotoBookPDF(){
  if(typeof photoBookMode !== "undefined" && photoBookMode !== "pdf"){
    photoBookMode = "pdf";
    renderPhotoBook();
  }
  alert("已切換到 PDF 預覽模式。建議使用電腦 Chrome 匯出 PDF，會最接近貞選旅管家的 A4 小冊子排版。");
  print();
}
function photoCountForDay(day){
  return (data.photos||[]).filter(p=>p.day==day).length;
}

async function addPhotoToDay(day, file){
  if(!file)return;
  const count = photoCountForDay(day);
  if(count >= 10){
    toast("這天最多上傳 10 張照片");
    return;
  }
  try{
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, "上傳中...");
    const img = await uploadImageFileForPhotoBook(file, {maxWidth:1600, quality:.82}, `storyPhotoStatus-${day}`);
    const title = $(`storyPhotoTitle-${day}`)?.value || "";
    const tags = $(`storyPhotoTags-${day}`)?.value || "";
    const memo = $(`storyPhotoMemo-${day}`)?.value || "";
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
    save();
    toast("照片已加入這天的照片日記");
  }catch(err){
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, "");
    alert("照片上傳失敗：" + err.message);
  }
}

function storyBookCoverHtml(){
  const cover=data.tripCover;
  if(cover){
    return `<section class="storyBookCover">
      <img class="storyBookCoverImage" src="${cover}">
      <div class="storyBookCoverOverlay"></div>
      <div class="storyBookCoverText">
        <span class="eyebrow">JANESELECT</span>
        <h1>${esc(data.meta.title)}</h1>
        <p>${esc(data.meta.subtitle)}</p>
        <div class="storyBookCoverMeta">
          <span>目的地：${esc(data.trip.dest||"未設定")}</span>
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
}

function storyBookDay(d){
  const plans=sortedPlans(d.key);
  const photos=(data.photos||[]).filter(p=>p.day==d.key);
  const cover=data.dayCovers[d.key] || photos[0]?.src || "";
  const count=photos.length;
  const canUpload=count<10;
  return `<section class="storyDay">
    <div class="storyDayHeader">
      <div>
        <span class="eyebrow">${d.title}</span>
        <h2>${d.label} 的旅行故事</h2>
        <p>住宿：${hotelFor(d.key)?.name||"未設定"}。今天收錄 ${plans.length} 個行程與 ${photos.length} 張照片。</p>
      </div>
      <div class="bookDayBadge">${plans.length} 行程｜${photos.length} 照片</div>
    </div>
    <div class="storyDayHero ${cover?"":"storyInlineEmpty"}">
      ${cover?`<img src="${cover}">`:`<div><div>尚未上傳本日封面圖</div><label class="photoInlineUpload" style="margin-top:10px">＋ 上傳本日封面<input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></label><div class="photoUploadStatus" id="dayCoverStatus-${d.key}"></div></div>`}
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
            <div class="storyPhotoLimit">${count}/10 張照片${canUpload?"，可繼續上傳":"，已達上限"}</div>
          </div>
        </div>
        ${canUpload?`<div class="storyPhotoUploadCard noPrint">
          <div class="storyPhotoQuickFields">
            <input id="storyPhotoTitle-${d.key}" placeholder="照片標題，例如：海雲台散步">
            <input id="storyPhotoTags-${d.key}" placeholder="標籤，例如：🌊 海邊 咖啡">
          </div>
          <input id="storyPhotoMemo-${d.key}" placeholder="一句照片日記">
          <label class="photoInlineUpload">
            ＋ 上傳照片到 ${d.title}
            <input type="file" accept="image/*" onchange="addPhotoToDay('${d.key}',this.files[0])">
          </label>
          <div class="photoUploadStatus" id="storyPhotoStatus-${d.key}"></div>
        </div>`:""}
        ${photos.length?`<div class="storyPhotoLayout">${photos.map(storyBookPhotoCard).join("")}</div>`:`<div class="storyEmpty">還沒有照片日記，先上傳幾張今天的代表照片吧。</div>`}
      </div>
    </div>
  </section>`;
}

function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section">
    <div><h2>📖 照片旅遊書</h2><div class="hint">直接在故事預覽中上傳封面與每日照片；每一天最多 10 張照片。</div></div>
    <button class="btn soft noPrint" onclick="exportPhotoBookPDF()">匯出 PDF</button>
  </div>

  <div class="storyBookPreview bookStyle-${data.meta.bookStyle||"fresh"}">
    <div class="storyBook">
      ${storyBookCoverHtml()}
      ${data.days.map(storyBookDay).join("")}
    </div>
  </div>`;
}
function exportPhotoBookPDF(){
  // 不再切換 PDF 預覽；直接用目前故事預覽列印
  alert("將使用目前故事預覽版面匯出 PDF。正式輸出建議使用電腦 Chrome，版面最穩定。");
  print();
}

function renderPhotoBook(){
  $("photoBookView").innerHTML=`<div class="section">
    <div class="storyOnlyIntro">
      <div>
        <h2>📖 照片旅遊書</h2>
        <div class="hint">直接在故事預覽中上傳封面與每日照片；每一天最多 10 張照片。</div>
      </div>
      <div class="storyOnlyActions noPrint">
        <button class="btn soft" onclick="exportPhotoBookPDF()">匯出 PDF</button>
      </div>
    </div>
  </div>

  <div class="storyBookPreview bookStyle-${data.meta.bookStyle||"fresh"}">
    <div class="storyBook">
      ${storyBookCoverHtml()}
      ${data.days.map(storyBookDay).join("")}
    </div>
  </div>`;
}
/* 不新增原旅行 data 欄位；定位快取獨立存在 localStorage: travelBookMapCache */
const MAP_CACHE_KEY = "travelBookMapCache";
let routeMap = null;
let routeLayer = null;
let routeMapDay = null;

function selectStoryPhotoFile(day, file){
  if(!file){
    delete storyPendingPhotoFiles[day];
    const meta = document.getElementById(`storyPhotoPickMeta-${day}`);
    if(meta) meta.textContent = '請先選擇 1 張照片，再輸入標題與日記內容。';
    return;
  }
  storyPendingPhotoFiles[day] = file;
  const meta = document.getElementById(`storyPhotoPickMeta-${day}`);
  if(meta) meta.textContent = `已選擇：${file.name}`;
}

function clearPendingStoryPhoto(day){
  delete storyPendingPhotoFiles[day];
  const input = document.getElementById(`storyPhotoFile-${day}`);
  if(input) input.value = '';
  const meta = document.getElementById(`storyPhotoPickMeta-${day}`);
  if(meta) meta.textContent = '請先選擇 1 張照片，再輸入標題與日記內容。';
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
    delete storyPendingPhotoFiles[day];
    storyEditingPhotoId = null;
    const ids = [`storyPhotoTitle-${day}`, `storyPhotoTags-${day}`, `storyPhotoMemo-${day}`, `storyPhotoFile-${day}`];
    ids.forEach(id=>{ const el = document.getElementById(id); if(el) el.value = ''; });
    save();
    toast('照片已加入這天的照片日記');
  }catch(err){
    setPhotoUploadStatus(`storyPhotoStatus-${day}`, '');
    alert('照片上傳失敗：' + err.message);
  }
}

function storyPhotoUploadForm(day, count){
  const canUpload = count < 10;
  if(!canUpload) return '';
  const file = storyPendingPhotoFiles[day];
  return `<div class="storyPhotoUploadCard noPrint">
    <div class="storyPhotoPickBox">
      <label class="storyPhotoPickLabel">
        ${file ? '已選擇照片，可繼續補標題與日記' : '＋ 先選擇要上傳的照片'}
        <input id="storyPhotoFile-${day}" type="file" accept="image/*" onchange="selectStoryPhotoFile('${day}',this.files[0])">
      </label>
      <div class="storyPhotoPickMeta" id="storyPhotoPickMeta-${day}">${file ? '已選擇：' + photoAttrEsc(file.name) : '請先選擇 1 張照片，再輸入標題與日記內容。'}</div>
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
}

function storyBookPhotoCard(p, idx){
  const editing = storyEditingPhotoId === p.id;
  return `<div class="storyPhotoCard ${idx===0?"featured":""}">
    <div class="storyPhotoImage"><img src="${p.src}"></div>
    <div class="storyPhotoText">
      <h3>${esc(p.title||"照片紀錄")}</h3>
      ${photoTagsHtml(p.tags)}
      <p>${esc(p.memo||"")}</p>
      <div class="storyPhotoCardActions noPrint">
        <button class="small" onclick="beginEditPhoto('${p.id}')">編輯</button>
        <button class="small" onclick="delPhoto('${p.id}')">刪除</button>
      </div>
      ${editing ? `<div class="storyPhotoEditBox noPrint">
        <label>照片標題</label>
        <input id="editPhotoTitle-${p.id}" value="${photoAttrEsc(p.title||'')}">
        <label>標籤</label>
        <input id="editPhotoTags-${p.id}" value="${photoAttrEsc(p.tags||'')}">
        <label>一句照片日記</label>
        <textarea id="editPhotoMemo-${p.id}">${esc(p.memo||'')}</textarea>
        <div class="storyPhotoEditActions">
          <button class="btn dark" type="button" onclick="saveEditedPhoto('${p.id}')">儲存修改</button>
          <button class="btn soft" type="button" onclick="cancelEditPhoto()">取消</button>
        </div>
      </div>` : ''}
    </div>
  </div>`;
}

function storyBookDay(d){
  const plans = sortedPlans(d.key);
  const photos = (data.photos||[]).filter(p=>p.day==d.key);
  const cover = data.dayCovers[d.key] || photos[0]?.src || '';
  const count = photos.length;
  const canUpload = count < 10;
  return `<section class="storyDay">
    <div class="storyDayHeader">
      <div>
        <span class="eyebrow">${d.title}</span>
        <h2>${d.label} 的旅行故事</h2>
        <p>住宿：${hotelFor(d.key)?.name||"未設定"}。今天收錄 ${plans.length} 個行程與 ${photos.length} 張照片。</p>
      </div>
      <div class="bookDayBadge">${plans.length} 行程｜${photos.length} 照片</div>
    </div>
    <div class="storyDayHero ${cover?"":"storyInlineEmpty"}">
      ${cover ? `<img src="${cover}">` : `<div><div>尚未上傳本日封面圖</div><label class="photoInlineUpload" style="margin-top:10px">＋ 上傳本日封面<input type="file" accept="image/*" onchange="addDayCover('${d.key}',this.files[0])"></label><div class="photoUploadStatus" id="dayCoverStatus-${d.key}"></div></div>`}
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
            <div class="storyPhotoLimit">${count}/10 張照片${canUpload?"，可繼續上傳":"，已達上限"}</div>
          </div>
        </div>
        ${storyPhotoUploadForm(d.key, count)}
        ${photos.length ? `<div class="storyPhotoLayout">${photos.map(storyBookPhotoCard).join("")}</div>` : `<div class="storyEmpty">還沒有照片日記，先上傳幾張今天的代表照片吧。</div>`}
      </div>
    </div>
  </section>`;
}

function renderPhotoBook(){
  document.getElementById('photoBookView').innerHTML = `<div class="section">
    <div class="storyOnlyIntro">
      <div>
        <h2>📖 照片旅遊書</h2>
        <div class="hint">直接在故事預覽中整理封面與每日照片；每一天最多 10 張照片，按下新增後才會正式加入日記。</div>
      </div>
      <div class="storyOnlyActions noPrint">
        <button class="btn soft" onclick="exportPhotoBookPDF()">匯出 PDF</button>
      </div>
    </div>
  </div>
  <div class="storyBookPreview bookStyle-${data.meta.bookStyle||"fresh"}">
    <div class="storyBook">
      ${storyBookCoverHtml()}
      ${data.days.map(storyBookDay).join('')}
    </div>
  </div>`;
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

function storyPhotoUploadForm(day, count){
  const canUpload = count < 10;
  if(!canUpload) return '';
  const file = storyPendingPhotoFiles[day];
  const previewUrl = storyPhotoPreviewUrls[day] || '';
  return `<div class="storyPhotoUploadCard noPrint">
    <div class="storyPhotoPickBox">
      <label class="storyPhotoPickLabel">
        ${file ? '已選擇照片，可繼續補標題與日記' : '＋ 先選擇要上傳的照片'}
        <input id="storyPhotoFile-${day}" type="file" accept="image/*" onchange="selectStoryPhotoFile('${day}',this.files[0])">
      </label>
      <div class="storyPhotoPickMeta" id="storyPhotoPickMeta-${day}">${file ? '已選擇：' + photoAttrEsc(file.name) : '請先選擇 1 張照片，再輸入標題與日記內容。'}</div>
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

function openPhotoEditModal(id){
  const p = (data.photos||[]).find(x=>x.id===id);
  if(!p) return;
  activePhotoEditId = id;
  let modal = document.getElementById('photoEditModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'photoEditModal';
    modal.className = 'photoEditModal noPrint';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div class="photoEditBox">
    <div class="photoEditHeader">
      <div>
        <h3>編輯照片日記</h3>
        <p>只修改照片文字內容，不會更換原照片。</p>
      </div>
      <button class="photoEditClose" onclick="closePhotoEditModal()">×</button>
    </div>
    <img class="photoEditPreview" src="${p.src}">
    <label>照片標題</label>
    <input id="modalPhotoTitle" value="${photoAttrEsc(p.title||'')}">
    <label>標籤</label>
    <input id="modalPhotoTags" value="${photoAttrEsc(p.tags||'')}" placeholder="例如：🌊 海邊 咖啡">
    <label>一句照片日記</label>
    <textarea id="modalPhotoMemo">${esc(p.memo||'')}</textarea>
    <div class="photoEditActions">
      <button class="btn dark" onclick="savePhotoEditModal()">儲存修改</button>
      <button class="btn soft" onclick="closePhotoEditModal()">取消</button>
    </div>
  </div>`;
  modal.classList.add('show');
}

function closePhotoEditModal(){
  const modal = document.getElementById('photoEditModal');
  if(modal) modal.classList.remove('show');
  activePhotoEditId = null;
}

function savePhotoEditModal(){
  const id = activePhotoEditId;
  const p = (data.photos||[]).find(x=>x.id===id);
  if(!p) return;
  p.title = document.getElementById('modalPhotoTitle')?.value || '';
  p.tags = document.getElementById('modalPhotoTags')?.value || '';
  p.memo = document.getElementById('modalPhotoMemo')?.value || '';
  closePhotoEditModal();
  save();
  toast('照片日記已更新');
}

function storyBookPhotoCard(p, idx){
  return `<div class="storyPhotoCard ${idx===0?"featured":""}">
    <div class="storyPhotoImage"><img src="${p.src}"></div>
    <div class="storyPhotoText">
      <h3>${esc(p.title||"照片紀錄")}</h3>
      ${photoTagsHtml(p.tags)}
      <p>${esc(p.memo||"")}</p>
      <div class="storyPhotoCardActions noPrint">
        <button class="small" onclick="openPhotoEditModal('${p.id}')">編輯</button>
        <button class="small" onclick="delPhoto('${p.id}')">刪除</button>
      </div>
    </div>
  </div>`;
}

function renderPhotoBook(){
  document.getElementById('photoBookView').innerHTML = `<div class="section">
    <div class="storyOnlyIntro">
      <div>
        <h2>📖 照片旅遊書</h2>
        <div class="hint">直接在故事預覽中整理封面與每日照片；每一天最多 10 張照片，選照片後可先預覽，按下新增才會正式加入日記。</div>
      </div>
      <div class="storyOnlyActions noPrint">
        <button class="btn soft" onclick="exportPhotoBookPDF()">匯出 PDF</button>
      </div>
    </div>
  </div>
  <div class="storyBookPreview bookStyle-${data.meta.bookStyle||"fresh"}">
    <div class="storyBook">
      ${storyBookCoverHtml()}
      ${data.days.map(storyBookDay).join('')}
    </div>
  </div>`;
}

try{
  if(typeof tab !== 'undefined' && tab === 'photoBook') renderPhotoBook();
}catch(e){}

function exportPhotoBookPDF(){
  ensurePdfBookMount();
  document.body.classList.add("printPhotoBook");
  alert("已產生 PDF 專用 A4 旅行書版面。建議使用電腦 Chrome 匯出，手機／平板列印仍可能因瀏覽器而有些微差異。");
  setTimeout(()=>window.print(), 80);
}

window.addEventListener("afterprint", ()=>{
  document.body.classList.remove("printPhotoBook");
});

/* index.html 保持旅行工具；照片書匯出改為開啟獨立出版頁 */
function openPdfPublisher(autoPrint=false){
  const url = autoPrint ? "export.html?print=1" : "export.html";
  try{
    save();
  }catch(e){}
  window.open(url, "_blank");
}
function exportPhotoBookPDF(){
  openPdfPublisher(true);
}

function openPdfPublisher(autoPrint=false){
  try{ save(); }catch(e){}
  window.open("export.html", "_blank");
}
function exportPhotoBookPDF(){
  openPdfPublisher(false);
}

// 白名單：程式碼內建的 fallback（Firestore 讀取失敗時使用）
const V63_ADMIN_EMAIL = "jan33772001@gmail.com";
let V63_ALLOWED_EMAILS = ["jan33772001@gmail.com"];

// 從 Firestore allowedUsers collection 動態載入白名單
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

storyBookPhotoCard = function(p, idx){
  const ori=v646PhotoOrientation(p);
  return `<div class="storyPhotoCard ${idx===0?'featured':''} orientation-${ori}">
    <div class="storyPhotoImage"><img src="${p.src}"></div>
    <div class="storyPhotoText">
      <h3>${esc(p.title||'照片紀錄')}</h3>
      ${storyTagsHtml(p.tags)}
      <p>${esc(p.memo||'')}</p>
      <button class="small noPrint" onclick="delPhoto('${p.id}')">刪除</button>
    </div>
  </div>`;
};

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

storyBookDay = function(d){
  if(!data.dayCovers) data.dayCovers={};
  const plans=sortedPlans(d.key);
  const photos=(data.photos||[]).filter(p=>p.day==d.key);
  const dayCover=data.dayCovers[d.key] || '';
  const cover=dayCover || photos[0]?.src || '';
  const count=photos.length;
  const canUpload=count<10;
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
            <div class="storyPhotoLimit">${count}/10 張照片${canUpload?'，可繼續上傳':'，已達上限'}</div>
          </div>
        </div>
        ${canUpload?`<div class="storyPhotoUploadCard noPrint">
          <div class="storyPhotoQuickFields">
            <input id="storyPhotoTitle-${d.key}" placeholder="照片標題，例如：海雲台散步">
            <input id="storyPhotoTags-${d.key}" placeholder="標籤，例如：🌊 海邊 咖啡">
          </div>
          <input id="storyPhotoMemo-${d.key}" placeholder="一句照片日記">
          <label class="photoInlineUpload">
            ＋ 上傳照片到 ${d.title}
            <input type="file" accept="image/*" onchange="addPhotoToDay('${d.key}',this.files[0])">
          </label>
          <div class="photoUploadStatus" id="storyPhotoStatus-${d.key}"></div>
        </div>`:''}
        ${photos.length?`<div class="storyPhotoLayout">${photos.map(storyBookPhotoCard).join('')}</div>`:`<div class="storyEmpty">還沒有照片日記，先上傳幾張今天的代表照片吧。</div>`}
      </div>
    </div>
  </section>`;
};

const v646PrevRenderHelp = typeof renderHelp==='function' ? renderHelp : null;
renderHelp = function(...args){
  const r = v646PrevRenderHelp ? v646PrevRenderHelp.apply(this,args) : undefined;
  const log=$('v64UpdateLog') || $('helpView')?.querySelector('.card');
  if(log){
    log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V646_VERSION_TEXT)}</b><br>直飛航班只顯示第 1 段，轉機才開放第 2 段；照片旅遊書的整本封面與每日封面可以刪除後重新上傳，照片縮圖也改為依直式／橫式照片比例顯示。</div>`;
  }
  v646UpdateFooterVersion();
  return r;
};
function photoTagsHtml(){ return ""; }
function storyTagsHtml(){ return ""; }
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
renderHelp = function(...args){
  const r = v650PrevRenderHelp ? v650PrevRenderHelp.apply(this,args) : undefined;
  const log=document.getElementById('v64UpdateLog') || document.getElementById('helpView')?.querySelector('.card');
  if(log){
    log.innerHTML=`<h3>最新更新紀錄</h3><div class="box mint"><b>${esc(V650_VERSION_TEXT)}</b><br>照片旅遊書今日封面不再自動套用第一張照片；可自行上傳封面，或從今日照片日記挑選一張設為封面。今日照片日記移除標籤輸入與顯示，保留照片標題、一句照片日記、編輯與刪除功能。</div>`;
  }
  v650UpdateFooterVersion();
  return r;
};
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

/* ── 啟動（放在最末尾確保所有函式定義完畢） ── */
// Firebase 初始化與 onAuthStateChanged 已由 v63Boot() 負責
// 不再呼叫 initFirebaseSync()，避免雙重監聽器造成 auth/cancelled-popup-request
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    init();
    v63Boot();
  });
} else {
  init();
  v63Boot();
}
