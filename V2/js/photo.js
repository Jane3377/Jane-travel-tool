/* ================================================================
   photo.js — 照片旅遊書、Cloudinary 上傳
   ================================================================ */

/* ══════════════════════════════════════════
   Cloudinary 上傳
   ══════════════════════════════════════════ */

async function compressImage(file, maxWidth = 1600, quality = 0.82) {
  const img = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const image = new Image();
      image.onload  = () => res(image);
      image.onerror = rej;
      image.src     = e.target.result;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
  const scale  = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(img.width  * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise(res => canvas.toBlob(blob => res(blob), 'image/jpeg', quality));
}

async function uploadToCloudinary(blob, filename = 'photo.jpg') {
  const form = new FormData();
  form.append('file',           blob, filename.replace(/\.[^.]+$/, '') + '.jpg');
  form.append('upload_preset',  CLOUDINARY_CONFIG.uploadPreset);
  if (CLOUDINARY_CONFIG.folder) form.append('folder', CLOUDINARY_CONFIG.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    { method: 'POST', body: form }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `上傳失敗 (HTTP ${res.status})`);
  }
  const result = await res.json();
  return {
    src:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    bytes:    result.bytes
  };
}

function setUploadStatus(id, msg) {
  const el = $(id) || document.getElementById(id);
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('show', !!msg);
}

/* ══════════════════════════════════════════
   旅遊書封面
   ══════════════════════════════════════════ */

async function addTripCover(file) {
  if (!file) return;
  try {
    setUploadStatus('coverUploadStatus', '上傳中...');
    const blob   = await compressImage(file, 1800, 0.84);
    const result = await uploadToCloudinary(blob, file.name);
    data.tripCover     = result.src;
    data.tripCoverMeta = result;
    save();
    setUploadStatus('coverUploadStatus', '');
    toast('封面已上傳');
  } catch (err) {
    setUploadStatus('coverUploadStatus', '');
    alert('封面上傳失敗：' + err.message);
  }
}

function removeTripCover() {
  if (!confirm('確定刪除整本旅遊書封面？')) return;
  delete data.tripCover;
  delete data.tripCoverMeta;
  save();
}

/* ══════════════════════════════════════════
   每日封面
   ══════════════════════════════════════════ */

async function addDayCover(day, file) {
  if (!file) return;
  try {
    const blob   = await compressImage(file, 1800, 0.84);
    const result = await uploadToCloudinary(blob, file.name);
    if (!data.dayCovers)    data.dayCovers    = {};
    if (!data.dayCoverMeta) data.dayCoverMeta = {};
    data.dayCovers[day]    = result.src;
    data.dayCoverMeta[day] = { source: 'upload', updatedAt: Date.now() };
    save();
    toast('今日封面已上傳');
  } catch (err) {
    alert('封面上傳失敗：' + err.message);
  }
}

function removeDayCover(day) {
  if (!confirm('確定刪除今日封面？')) return;
  delete data.dayCovers?.[day];
  delete data.dayCoverMeta?.[day];
  save();
}

function setDayCoverFromPhoto(day, photoId) {
  const p = data.photos.find(x => x.id === photoId);
  if (!p?.src) return toast('找不到這張照片');
  if (!data.dayCovers)    data.dayCovers    = {};
  if (!data.dayCoverMeta) data.dayCoverMeta = {};
  data.dayCovers[day]    = p.src;
  data.dayCoverMeta[day] = { source: 'photo', photoId, updatedAt: Date.now() };
  save();
  toast('已設為今日封面');
}

/* ══════════════════════════════════════════
   照片日記
   ══════════════════════════════════════════ */

function photosForDay(day) {
  return (data.photos || []).filter(p => p.day === day);
}

function selectStoryPhotoFile(day, file) {
  // 清舊的 preview URL
  if (storyPhotoPreviewUrls[day]) {
    try { URL.revokeObjectURL(storyPhotoPreviewUrls[day]); } catch (e) {}
    delete storyPhotoPreviewUrls[day];
  }
  if (!file) {
    delete storyPendingPhotoFiles[day];
    updatePhotoPickUI(day, null);
    return;
  }
  storyPendingPhotoFiles[day] = file;
  const url = URL.createObjectURL(file);
  storyPhotoPreviewUrls[day]  = url;
  updatePhotoPickUI(day, url, file.name);
}

function updatePhotoPickUI(day, url, filename) {
  const meta    = document.getElementById(`storyPhotoPickMeta-${day}`);
  const preview = document.getElementById(`storyPhotoPickPreview-${day}`);
  if (meta) meta.textContent = filename ? `已選擇：${filename}` : '請先選擇照片';
  if (preview) {
    if (url) {
      preview.classList.add('show');
      preview.innerHTML = `<img src="${url}"><div>預覽</div>`;
    } else {
      preview.classList.remove('show');
      preview.innerHTML = '';
    }
  }
}

function clearPendingPhoto(day) {
  if (storyPhotoPreviewUrls[day]) {
    try { URL.revokeObjectURL(storyPhotoPreviewUrls[day]); } catch (e) {}
    delete storyPhotoPreviewUrls[day];
  }
  delete storyPendingPhotoFiles[day];
  const input = document.getElementById(`storyPhotoFile-${day}`);
  if (input) input.value = '';
  updatePhotoPickUI(day, null);
  const title = document.getElementById(`storyPhotoTitle-${day}`);
  const memo  = document.getElementById(`storyPhotoMemo-${day}`);
  if (title) title.value = '';
  if (memo)  memo.value  = '';
}

async function addPhotoToDay(day) {
  const file = storyPendingPhotoFiles[day];
  if (!file) return toast('請先選擇照片');
  if (photosForDay(day).length >= 10) return toast('每天最多 10 張照片');

  const statusId = `storyPhotoStatus-${day}`;
  try {
    setUploadStatus(statusId, '壓縮中...');
    const blob   = await compressImage(file, 1600, 0.82);
    setUploadStatus(statusId, '上傳中...');
    const result = await uploadToCloudinary(blob, file.name);

    data.photos.unshift({
      id:        uid(),
      day,
      title:     document.getElementById(`storyPhotoTitle-${day}`)?.value || '',
      memo:      document.getElementById(`storyPhotoMemo-${day}`)?.value  || '',
      src:       result.src,
      publicId:  result.publicId,
      width:     result.width,
      height:    result.height,
      bytes:     result.bytes
    });

    clearPendingPhoto(day);
    save();
    setUploadStatus(statusId, '');
    toast('照片已加入照片日記');
  } catch (err) {
    setUploadStatus(statusId, '');
    alert('照片上傳失敗：' + err.message);
  }
}

function deletePhoto(id) {
  data.photos = data.photos.filter(p => p.id !== id);
  save();
}

/* ── 照片編輯 modal ── */
function openPhotoEditModal(id) {
  const p = data.photos.find(x => x.id === id);
  if (!p) return;
  activePhotoEditId = id;
  let modal = $('photoEditModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id        = 'photoEditModal';
    modal.className = 'photoEditModal noPrint';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="photoEditBox">
      <div class="photoEditHeader">
        <div><h3>編輯照片</h3></div>
        <button class="photoEditClose" onclick="closePhotoEditModal()">×</button>
      </div>
      <img class="photoEditPreview" src="${p.src}">
      <label>照片標題</label>
      <input id="modalPhotoTitle" value="${esc(p.title||'')}">
      <label>一句照片日記</label>
      <textarea id="modalPhotoMemo">${esc(p.memo||'')}</textarea>
      <div class="photoEditActions">
        <button class="btn dark" onclick="savePhotoEdit()">儲存</button>
        <button class="btn soft" onclick="closePhotoEditModal()">取消</button>
      </div>
    </div>`;
  modal.classList.add('show');
}

function closePhotoEditModal() {
  $('photoEditModal')?.classList.remove('show');
}

function savePhotoEdit() {
  const p = data.photos.find(x => x.id === activePhotoEditId);
  if (!p) return;
  p.title = $('modalPhotoTitle')?.value || '';
  p.memo  = $('modalPhotoMemo')?.value  || '';
  closePhotoEditModal();
  save();
  toast('已更新照片日記');
}

/* ── 照片方向判斷 ── */
function photoOrientation(p) {
  const w = Number(p?.width  || 0);
  const h = Number(p?.height || 0);
  if (w && h) {
    if (h > w * 1.08) return 'portrait';
    if (w > h * 1.08) return 'landscape';
    return 'square';
  }
  return 'landscape';
}

/* ══════════════════════════════════════════
   旅遊書 HTML 產生器
   ══════════════════════════════════════════ */

function storyBookCoverHtml() {
  const cover = data.tripCover;
  return `
    <section class="storyBookCover noPrint">
      <div class="v65CoverEditor">
        <div class="v65CoverPreview">
          ${cover
            ? `<img src="${cover}"><button type="button" onclick="removeTripCover()">移除封面</button>`
            : '<div class="v65NoCover">尚未上傳封面照</div>'}
        </div>
        <div>
          <label>選擇封面照片</label>
          <input type="file" accept="image/*" onchange="addTripCover(this.files[0])">
          <div class="photoUploadStatus" id="coverUploadStatus"></div>
        </div>
        <div class="templateRail">
          ${['fresh','fun','diary'].map(k =>
            `<div class="templateCard ${data.meta.bookStyle===k?'active':''}"
                  onclick="data.meta.bookStyle='${k}';save()">
               <b>${{fresh:'🌿 韓系清新',fun:'🌈 活潑可愛',diary:'✎ 手帳日記'}[k]}</b>
             </div>`
          ).join('')}
        </div>
      </div>
    </section>
    <section class="storyBookCover printOnly">
      ${cover ? `<img class="storyBookCoverImage" src="${cover}">` : ''}
      <div class="storyBookCoverText">
        <span class="eyebrow">MY TRAVEL BOOK</span>
        <h1>${esc(data.meta.title || '我的旅行手帳')}</h1>
        <p>${esc(data.meta.subtitle || '')}</p>
        <div class="storyBookCoverMeta">
          <span>${esc(data.trip.dest || '')}</span>
          <span>${short(data.trip.start)} - ${short(data.trip.end)}</span>
        </div>
      </div>
    </section>`;
}

function storyPhotoCard(p, idx) {
  const ori = photoOrientation(p);
  return `
    <div class="storyPhotoCard ${idx===0?'featured':''} orientation-${ori}">
      <div class="storyPhotoImage"><img src="${p.src}" alt="${esc(p.title||'')}"></div>
      <div class="storyPhotoText">
        <h3>${esc(p.title || '照片紀錄')}</h3>
        <p>${esc(p.memo || '')}</p>
        <div class="storyPhotoCardActions noPrint">
          <button class="small" onclick="openPhotoEditModal('${p.id}')">編輯</button>
          <button class="small" onclick="deletePhoto('${p.id}')">刪除</button>
        </div>
      </div>
    </div>`;
}

function storyDayCoverCandidates(day) {
  const photos = photosForDay(day);
  if (!photos.length) return '<div class="v65DayCoverHint">尚無照片，可直接上傳封面。</div>';
  return `
    <div class="v65DayCoverHint">從今日照片選一張當封面：</div>
    <div class="v65CoverCandidates">
      ${photos.slice(0, 10).map(p => `
        <div class="v65CoverCandidate">
          <img src="${p.src}">
          <button type="button" onclick="setDayCoverFromPhoto('${day}','${p.id}')">設為封面</button>
        </div>`).join('')}
    </div>`;
}

function storyPhotoUploadForm(day) {
  const count = photosForDay(day).length;
  if (count >= 10) return '';
  const file       = storyPendingPhotoFiles[day];
  const previewUrl = storyPhotoPreviewUrls[day] || '';
  return `
    <div class="storyPhotoUploadCard noPrint">
      <div class="storyPhotoPickBox">
        <label class="storyPhotoPickLabel">
          ${file ? '已選擇，可補標題再上傳' : '＋ 選擇照片'}
          <input id="storyPhotoFile-${day}" type="file" accept="image/*"
                 onchange="selectStoryPhotoFile('${day}',this.files[0])">
        </label>
        <div class="storyPhotoPickMeta" id="storyPhotoPickMeta-${day}">
          ${file ? `已選擇：${esc(file.name)}` : '請先選擇照片'}
        </div>
        <div class="storyPhotoPickPreview ${previewUrl?'show':''}"
             id="storyPhotoPickPreview-${day}">
          ${previewUrl ? `<img src="${previewUrl}">` : ''}
        </div>
      </div>
      <input id="storyPhotoTitle-${day}" placeholder="照片標題">
      <input id="storyPhotoMemo-${day}"  placeholder="一句照片日記">
      <div class="storyPhotoUploadActions">
        <button class="btn soft" type="button" onclick="clearPendingPhoto('${day}')">清除</button>
        <button class="btn dark" type="button" onclick="addPhotoToDay('${day}')">新增到 ${dayTitle(day)}</button>
      </div>
      <div class="photoUploadStatus" id="storyPhotoStatus-${day}"></div>
    </div>`;
}

function storyBookDay(d) {
  const plans  = sortedPlans(d.key);
  const photos = photosForDay(d.key);
  const cover  = data.dayCovers?.[d.key] || photos[0]?.src || '';
  return `
    <section class="storyDay">
      <div class="storyDayHeader">
        <div>
          <span class="eyebrow">${d.title}</span>
          <h2>${d.label}</h2>
          <p>住宿：${hotelFor(d.key)?.name || '未設定'}｜${plans.length} 行程｜${photos.length} 張照片</p>
        </div>
        <div class="bookDayBadge">${plans.length} 行程</div>
      </div>
      <div class="storyDayCoverBlock noPrint">
        <div class="v65CoverUploadRow">
          <label>今日封面：<input type="file" accept="image/*"
                 onchange="addDayCover('${d.key}',this.files[0])"></label>
          ${cover && data.dayCovers?.[d.key]
            ? `<button class="small" onclick="removeDayCover('${d.key}')">移除</button>` : ''}
        </div>
        ${storyDayCoverCandidates(d.key)}
      </div>
      <div class="storyDayHero ${cover?'':'storyInlineEmpty'}">
        ${cover ? `<img src="${cover}">` : '<div>尚未上傳封面</div>'}
      </div>
      <div class="storyDayBody">
        <div>
          <div class="storyTimelineTitle">今天的路線</div>
          ${plans.length
            ? `<div class="storyTimeline">${plans.map(p=>`
                <div class="storyTimelineItem">
                  <div class="storyTimelineTime">${esc(p.start||'--:--')}</div>
                  <div><b>${activityIcon(p.type)} ${esc(p.name)}</b>
                    ${p.note?`<span>｜${esc(p.note)}</span>`:''}
                  </div>
                </div>`).join('')}</div>`
            : '<div class="storyEmpty">這天還沒有行程</div>'}
        </div>
        <div>
          <div class="storyPhotosTitle">今日照片日記 ${photos.length}/10</div>
          ${storyPhotoUploadForm(d.key)}
          ${photos.length
            ? `<div class="storyPhotoLayout">${photos.map(storyPhotoCard).join('')}</div>`
            : '<div class="storyEmpty">還沒有照片，上傳幾張今天的代表照片吧。</div>'}
        </div>
      </div>
    </section>`;
}

function exportPhotoBookPDF() {
  open('export.html', '_blank');
}
