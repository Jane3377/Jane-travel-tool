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
  const el = $(id);
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
    _flushDiaryTexts();
    renderPhotoBook();
  } catch (err) {
    setUploadStatus('coverUploadStatus', '');
    alert('封面上傳失敗：' + err.message);
  }
}

function removeTripCover() {
  if (!confirm('確定刪除封面照？')) return;
  data.tripCover     = null;
  data.tripCoverMeta = null;
  _flushDiaryTexts();
  save();
  renderPhotoBook();
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
  const meta      = document.getElementById(`storyPhotoPickMeta-${day}`);
  const preview   = document.getElementById(`storyPhotoPickPreview-${day}`);
  const details   = document.getElementById(`storyPhotoDetails-${day}`);
  const labelText = document.getElementById(`storyPhotoPickLabelText-${day}`);
  if (meta) meta.textContent = filename ? `已選擇：${filename}` : '';
  if (labelText) labelText.textContent = filename ? '已選擇，可補標題再上傳' : '＋ 選擇照片';
  if (details) details.style.display = filename ? '' : 'none';
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
  delete storyPendingPhotoTags[day];
  const input = document.getElementById(`storyPhotoFile-${day}`);
  if (input) input.value = '';
  updatePhotoPickUI(day, null);
  const title = document.getElementById(`storyPhotoTitle-${day}`);
  const memo  = document.getElementById(`storyPhotoMemo-${day}`);
  if (title) title.value = '';
  if (memo)  memo.value  = '';
}

function selectStoryPhotoTag(day, planId, btn) {
  if (!storyPendingPhotoTags[day]) storyPendingPhotoTags[day] = [];
  const p = data.plans.find(x => x.id === planId);
  if (!p) return;
  const tag = `${activityIcon(p.type)} ${p.name}`;
  const tags = storyPendingPhotoTags[day];
  const idx  = tags.indexOf(tag);
  if (idx >= 0) { tags.splice(idx, 1); btn.classList.remove('active'); }
  else          { tags.push(tag);       btn.classList.add('active'); }
  _updatePendingTagsDisplay(day);
}

function _updatePendingTagsDisplay(day) {
  const container = document.getElementById(`storyPhotoTagSelected-${day}`);
  if (!container) return;
  const tags = storyPendingPhotoTags[day] || [];
  container.innerHTML = tags.map((t, i) =>
    '<span class="storyPhotoTagPillSel"><span class="pillText">' + esc(t) + '</span>'
    + '<button type="button" class="storyPhotoTagRemove" onclick="_removePendingTag(\'' + day + '\',' + i + ')">×</button></span>'
  ).join('');
}

function _removePendingTag(day, idx) {
  const tags = storyPendingPhotoTags[day];
  if (!tags) return;
  const removed = tags.splice(idx, 1)[0];
  document.getElementById(`storyPhotoTagRow-${day}`)?.querySelectorAll('.storyPhotoTagBtn').forEach(btn => {
    if (btn.dataset.tag === removed) btn.classList.remove('active');
  });
  _updatePendingTagsDisplay(day);
}

function addCustomPhotoTagToDay(day, inputId) {
  const input = document.getElementById(inputId);
  const tag   = (input?.value || '').trim();
  if (!tag) return;
  if (!storyPendingPhotoTags[day]) storyPendingPhotoTags[day] = [];
  if (!storyPendingPhotoTags[day].includes(tag)) {
    storyPendingPhotoTags[day].push(tag);
    _updatePendingTagsDisplay(day);
  }
  if (input) input.value = '';
}

function removePhotoTag(photoId, idx) {
  const p = data.photos.find(x => x.id === photoId);
  if (!p) return;
  const tags = _photoTags(p);
  tags.splice(idx, 1);
  p.tags = tags;
  delete p.tag;
  save();
  renderPhotoBook();
}

function addInlinePhotoTag(photoId, inputEl) {
  const tag = (inputEl.value || '').trim();
  if (!tag) return;
  const p = data.photos.find(x => x.id === photoId);
  if (!p) return;
  if (!p.tags) p.tags = _photoTags(p);
  delete p.tag;
  if (!p.tags.includes(tag)) p.tags.push(tag);
  inputEl.value = '';
  save();
  renderPhotoBook();
}

function removePhotoTagFromModal(photoId, idx) {
  const p = data.photos.find(x => x.id === photoId);
  if (!p) return;
  const tags = _photoTags(p);
  tags.splice(idx, 1);
  p.tags = tags;
  delete p.tag;
  save();
  openPhotoEditModal(photoId);
}

function addPhotoTagFromModal(photoId, inputEl) {
  const tag = (inputEl.value || '').trim();
  if (!tag) return;
  const p = data.photos.find(x => x.id === photoId);
  if (!p) return;
  if (!p.tags) p.tags = _photoTags(p);
  delete p.tag;
  if (!p.tags.includes(tag)) p.tags.push(tag);
  inputEl.value = '';
  save();
  openPhotoEditModal(photoId);
}

function _photoTags(p) {
  if (p.tags) return [...p.tags];
  if (p.tag)  return [p.tag];
  return [];
}

function _photoTagsHtml(p, allowEdit) {
  const tags = _photoTags(p);
  if (!tags.length && !allowEdit) return '';
  const pills = tags.map(function(t, ti) {
    const btn = allowEdit
      ? '<button type="button" class="diaryTagRemove" onclick="removePhotoTag(\'' + p.id + '\',' + ti + ')">×</button>'
      : '';
    return '<span class="diaryPhotoTagPillMemo">' + esc(t) + btn + '</span>';
  }).join('');
  const addInput = allowEdit
    ? '<span class="diaryTagInputWrap">' +
      '<input class="diaryTagInput" placeholder="新增標籤"' +
      ' onkeydown="if(event.key===\'Enter\'){addInlinePhotoTag(\'' + p.id + '\',this);event.preventDefault()}">' +
      '<button class="diaryTagAddBtn" type="button"' +
      ' onclick="addInlinePhotoTag(\'' + p.id + '\',this.previousElementSibling)">＋</button>' +
      '</span>'
    : '';
  return '<div class="diaryPhotoTagsRow">' + pills + addInput + '</div>';
}

async function addPhotoToDay(day) {
  const file = storyPendingPhotoFiles[day];
  if (!file) return toast('請先選擇照片');
  if (photosForDay(day).length >= 25) return toast('每天最多 25 張照片');

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
      tags:      (storyPendingPhotoTags[day] || []).slice(),
      src:       result.src,
      publicId:  result.publicId,
      width:     result.width,
      height:    result.height,
      bytes:     result.bytes
    });

    delete storyPendingPhotoTags[day];
    clearPendingPhoto(day);
    _flushDiaryTexts();
    save();
    renderPhotoBook();
    setUploadStatus(statusId, '');
    toast('照片已加入照片日記');
  } catch (err) {
    setUploadStatus(statusId, '');
    alert('照片上傳失敗：' + err.message);
  }
}

function deletePhoto(id) {
  _flushDiaryTexts();
  data.photos = data.photos.filter(p => p.id !== id);
  save();
  renderPhotoBook();
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
      <label>地點標籤</label>
      <div class="diaryPhotoTagsRow" id="modalPhotoTagsList">
        ${_photoTags(p).map((t, i) => `<span class="diaryPhotoTagPillMemo">${esc(t)}<button type="button" class="diaryTagRemove" onclick="removePhotoTagFromModal('${p.id}',${i})">×</button></span>`).join('')}
        <span class="diaryTagInputWrap">
          <input class="diaryTagInput" id="modalPhotoTagInput" placeholder="新增標籤"
            onkeydown="if(event.key==='Enter'){addPhotoTagFromModal('${p.id}',this);event.preventDefault()}">
          <button class="diaryTagAddBtn" type="button"
            onclick="addPhotoTagFromModal('${p.id}',document.getElementById('modalPhotoTagInput'))">＋</button>
        </span>
      </div>
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
   旅日記照片上傳表單
   ══════════════════════════════════════════ */

function storyPhotoUploadForm(day) {
  const count = photosForDay(day).length;
  if (count >= 10) return '';
  const file       = storyPendingPhotoFiles[day];
  const previewUrl = storyPhotoPreviewUrls[day] || '';
  const dayPlans   = sortedPlans(day);
  const selTags    = storyPendingPhotoTags[day] || [];
  return `
    <div class="storyPhotoUploadCard noPrint">
      <div class="storyPhotoPickBox">
        <label class="storyPhotoPickLabel">
          <span id="storyPhotoPickLabelText-${day}">${file ? '已選擇，可補標題再上傳' : '＋ 選擇照片'}</span>
          <input id="storyPhotoFile-${day}" type="file" accept="image/*"
                 onchange="selectStoryPhotoFile('${day}',this.files[0])">
        </label>
        <div class="storyPhotoPickMeta" id="storyPhotoPickMeta-${day}">
          ${file ? `已選擇：${esc(file.name)}` : ''}
        </div>
        <div class="storyPhotoPickPreview ${previewUrl?'show':''}"
             id="storyPhotoPickPreview-${day}">
          ${previewUrl ? `<img src="${previewUrl}">` : ''}
        </div>
      </div>
      <div class="storyPhotoDetails" id="storyPhotoDetails-${day}" style="${file ? '' : 'display:none'}">
        <input id="storyPhotoTitle-${day}" placeholder="照片標題（選填）">
        <input id="storyPhotoMemo-${day}"  placeholder="一句照片日記（選填）">
        <div class="storyPhotoTagLabel">地點標籤</div>
        ${dayPlans.length ? `
        <div class="storyPhotoTagRow" id="storyPhotoTagRow-${day}">
          ${dayPlans.map(p => {
            const tag = activityIcon(p.type) + ' ' + p.name;
            return '<button type="button" class="storyPhotoTagBtn' + (selTags.includes(tag) ? ' active' : '') + '"'
              + ' data-tag="' + esc(tag) + '"'
              + ' title="' + esc(p.name) + '"'
              + ' onclick="selectStoryPhotoTag(\'' + day + '\',\'' + p.id + '\',this)">'
              + esc(tag) + '</button>';
          }).join('')}
        </div>` : ''}
        <div class="storyPhotoTagCustomRow">
          <input class="storyPhotoTagCustomInput" id="storyPhotoTagCustom-${day}" placeholder="自訂標籤"
            onkeydown="if(event.key==='Enter'){addCustomPhotoTagToDay('${day}','storyPhotoTagCustom-${day}');event.preventDefault()}">
          <button type="button" class="storyPhotoTagCustomAdd"
            onclick="addCustomPhotoTagToDay('${day}','storyPhotoTagCustom-${day}')">＋</button>
        </div>
        <div class="storyPhotoTagSelected" id="storyPhotoTagSelected-${day}">
          ${selTags.map((t, i) => '<span class="storyPhotoTagPillSel"><span class="pillText">' + esc(t) + '</span><button type="button" class="storyPhotoTagRemove" onclick="_removePendingTag(\'' + day + '\',' + i + ')">×</button></span>').join('')}
        </div>
        <div class="storyPhotoUploadActions">
          <button class="btn soft" type="button" onclick="clearPendingPhoto('${day}')">清除</button>
          <button class="btn dark" type="button" onclick="addPhotoToDay('${day}')">新增到 ${dayTitle(day)}</button>
        </div>
        <div class="photoUploadStatus" id="storyPhotoStatus-${day}"></div>
      </div>
    </div>`;
}


/* ════════════════════════════════════════
   旅日記（全新排版）
   ════════════════════════════════════════ */

const DIARY_STYLES = {
  fresh:    '🌿 自然植物',
  journal:  '📔 復古手帳',
  magazine: '🏙 城市雜誌',
  film:     '🎞 底片風格',
  story:    '🛍 購物旅遊',
  sketch:   '✏️ 簡約線條',
  polar:    '📷 立可拍',
};

const WEATHER_ICONS = ['☀️','🌤','⛅','🌧','🌪','❄️','🌈'];
const MOOD_ICONS    = ['😊','🥰','😌','🤩','😴','😔','🫠'];

function setDayMood(day, field, value) {
  _flushDiaryTexts();
  if (!data.dayMoods) data.dayMoods = {};
  if (!data.dayMoods[day]) data.dayMoods[day] = {};
  data.dayMoods[day][field] = data.dayMoods[day][field] === value ? '' : value;
  save();
  renderPhotoBook();
}

function saveDayText(day, text) {
  if (!data.dayMoods) data.dayMoods = {};
  if (!data.dayMoods[day]) data.dayMoods[day] = {};
  data.dayMoods[day].text = text;
  save();
}

function _flushDiaryTexts() {
  document.querySelectorAll('.diaryDay[data-day]').forEach(el => {
    const day = el.dataset.day;
    if (!day) return;
    if (!data.dayMoods) data.dayMoods = {};
    if (!data.dayMoods[day]) data.dayMoods[day] = {};
    const textEl = el.querySelector('.diaryDayText[contenteditable]');
    if (textEl) data.dayMoods[day].text = textEl.innerText;
    const itinEl = el.querySelector('.diaryItinerary[contenteditable]');
    if (itinEl) data.dayMoods[day].itinerary = itinEl.innerText;
    const photoTextEl = el.querySelector('.diaryPhotoText[contenteditable]');
    if (photoTextEl) data.dayMoods[day].diaryText = photoTextEl.innerText;
  });
}

function saveDayItinerary(day, text) {
  if (!data.dayMoods) data.dayMoods = {};
  if (!data.dayMoods[day]) data.dayMoods[day] = {};
  data.dayMoods[day].itinerary = text;
  save();
}

function resetDayItinerary(day) {
  if (!data.dayMoods?.[day]) return;
  delete data.dayMoods[day].itinerary;
  save();
  renderPhotoBook();
}

/* 旅日記三個區塊共用的文字色票 */
const DIARY_TEXT_COLORS = [
  { val:'#2c2416', label:'深褐' },
  { val:'#ffffff', label:'白色' },
  { val:'#f5f0e8', label:'奶白' },
  { val:'#2e4a38', label:'森林綠' },
  { val:'#1a1a2e', label:'深藍' },
  { val:'#c45555', label:'珊瑚紅' },
];

/* 由顏色／描邊／粗體組出 inline style 字串 */
function _diaryTextStyle(color, stroke, bold) {
  return [
    color  ? `color:${color}` : '',
    bold   ? 'font-weight:900' : '',
    stroke ? 'text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff' : ''
  ].filter(Boolean).join(';');
}

/* 產生一組顏色工具列；fields 指定要寫入 dayMood 的欄位名稱
   fields = { color:'textColor', stroke:'textStroke', bold:'textBold' } */
function _diaryColorBar(day, label, fields, cur) {
  if (shareViewMode) return '';
  return `
    <div class="diaryTextStyleBar noPrint">
      <span class="diaryStyleBarLabel">${label}</span>
      <div class="diaryColorPalette">
        ${DIARY_TEXT_COLORS.map(c => `
          <button class="diaryColorSwatch ${cur.color===c.val?'active':''}"
                  style="background:${c.val}" title="${c.label}"
                  onclick="setDayMoodField('${day}','${fields.color}','${c.val}')"></button>`).join('')}
        <button class="diaryColorSwatch diaryColorReset ${!cur.color?'active':''}"
                title="預設" onclick="setDayMoodField('${day}','${fields.color}','')">✕</button>
      </div>
    </div>`;
}

function diaryItineraryHtml(d) {
  const mood     = (data.dayMoods || {})[d.key] || {};

  // 分享檢視時，使用者選擇隱藏的行程不顯示
  if (shareViewMode && mood.hideItinerary) return '';

  const plans    = sortedPlans(d.key);
  const hasCustom = mood.itinerary !== undefined;

  let content = '';
  if (hasCustom) {
    content = mood.itinerary
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\n/g,'<br>');
  } else if (plans.length) {
    content = plans.map(p =>
      `${esc(p.start || '--:--')} ${activityIcon(p.type)} ${esc(p.name)}`
    ).join('<br>');
  }

  if (!content && shareViewMode) return '';

  const ce = !shareViewMode;
  const styleAttr = _diaryTextStyle(mood.itinColor, mood.itinStroke, mood.itinBold);
  const colorBar = _diaryColorBar(d.key, '行程',
    { color:'itinColor', stroke:'itinStroke', bold:'itinBold' },
    { color:mood.itinColor, stroke:mood.itinStroke, bold:mood.itinBold });

  return `
    <div class="diaryItinerarySection">
      <div class="diaryItineraryHead">
        <span class="diaryItineraryLabel">今日行程</span>
        ${ce ? `
          <button class="diaryItineraryHide noPrint ${mood.hideItinerary?'isHidden':''}" type="button"
                  onclick="setDayMoodField('${d.key}','toggle:hideItinerary')"
                  title="控制這天的行程是否出現在分享連結">
            ${mood.hideItinerary ? '🙈 分享時隱藏' : '👁 分享時顯示'}</button>` : ''}
        ${ce && hasCustom && plans.length ? `
          <button class="diaryItineraryReset noPrint" type="button"
                  onclick="resetDayItinerary('${d.key}')">↺ 重設</button>` : ''}
      </div>
      ${colorBar}
      <div class="diaryItinerary${hasCustom ? '' : ' fromPlan'}${ce && mood.hideItinerary ? ' diaryDimmed' : ''}"
           ${styleAttr ? `style="${styleAttr}"` : ''}
           ${ce ? `contenteditable="true" onblur="saveDayItinerary('${d.key}',this.innerText)"` : ''}
           data-placeholder="記錄今天去了哪裡…">${content}</div>
    </div>`;
}

function setDiaryStyle(style) {
  _flushDiaryTexts();
  data.meta.bookStyle = style;
  save();
  renderPhotoBook();
}

function setCoverTextColor(color) {
  _flushDiaryTexts();
  data.meta.coverTextColor = color;
  save();
  renderPhotoBook();
}


function reorderDiaryPhoto(photoId, dir) {
  const photo = data.photos.find(p => p.id === photoId);
  if (!photo) return;
  const dayPhotos = data.photos.filter(p => p.day === photo.day);
  const idx = dayPhotos.findIndex(p => p.id === photoId);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= dayPhotos.length) return;
  const swapId = dayPhotos[newIdx].id;
  const gi  = data.photos.findIndex(p => p.id === photoId);
  const gj  = data.photos.findIndex(p => p.id === swapId);
  [data.photos[gi], data.photos[gj]] = [data.photos[gj], data.photos[gi]];
  save();
  renderPhotoBook();
}

/* 照片右上角控制鈕（往前／往後／編輯／刪除）。i 為全清單索引、total 為當天總張數 */
function _diaryPhotoCtrl(p, i, total) {
  if (shareViewMode) return '';
  return `<div class="diaryPhotoCtrl noPrint">
    <button onclick="reorderDiaryPhoto('${p.id}',-1)" ${i===0?'disabled':''} title="往前">↑</button>
    <button onclick="reorderDiaryPhoto('${p.id}',1)"  ${i===total-1?'disabled':''} title="往後">↓</button>
    <button onclick="openPhotoEditModal('${p.id}')">✎</button>
    <button onclick="deletePhoto('${p.id}')">×</button>
  </div>`;
}

/* 照片標題／日記／標籤的文字區塊 */
function _diaryMemosHtml(photos, cap) {
  const withContent = photos.filter(p => p.title || p.memo || _photoTags(p).length);
  if (!withContent.length) return '';
  return `<div class="diaryPhotoMemos">
    ${withContent.map(p => `<div class="diaryPhotoMemoItem"${cap}>
      ${p.title ? `<div class="diaryMemoLabel"${cap}>${esc(p.title)}</div>` : ''}
      ${p.memo  ? `<div class="diaryMemoText">${esc(p.memo)}</div>` : ''}
      ${_photoTagsHtml(p, !shareViewMode)}
    </div>`).join('')}
  </div>`;
}

/* 展開／收合「第 7 張以後」的照片 */
function toggleDiaryPhotoExpand(btn) {
  const wrap = btn.closest('.diaryPhotoExtraWrap');
  if (!wrap) return;
  const expanded = wrap.classList.toggle('expanded');
  btn.textContent = expanded ? '收合照片' : btn.dataset.label;
}

function diaryPhotoGridHtml(photos, capStyle = '') {
  const total = photos.length;
  if (!total) return '<div class="diaryNoPhotos">還沒有照片，點下方上傳</div>';
  const cap = capStyle ? ` style="${capStyle}"` : '';
  const featured = photos.slice(0, 6);
  const extra    = photos.slice(6);

  const extraBlock = extra.length ? `
    <div class="diaryPhotoExtraWrap">
      <button class="diaryExpandBtn noPrint" type="button"
              data-label="展開全部 ${total} 張"
              onclick="toggleDiaryPhotoExpand(this)">展開全部 ${total} 張</button>
      <div class="diaryPhotoExtraInner">
        <div class="diaryPhotoExtra">
          ${extra.map((p, j) => `
          <div class="diaryPhotoItem">
            <img src="${p.src}" alt="${esc(p.title || '')}" loading="lazy">
            ${_diaryPhotoCtrl(p, j + 6, total)}
          </div>`).join('')}
        </div>
        ${_diaryMemosHtml(extra, cap)}
      </div>
    </div>` : '';

  return `
    <div class="diaryPhotoGrid count-${featured.length}">
      ${featured.map((p, i) => `
        <div class="diaryPhotoItem${i === 0 ? ' featured' : ''}">
          <img src="${p.src}" alt="${esc(p.title || '')}">
          ${_diaryPhotoCtrl(p, i, total)}
        </div>`).join('')}
    </div>
    ${_diaryMemosHtml(featured, cap)}
    ${extraBlock}`;
}

function diaryPhotoStoryHtml(photos, capStyle = '') {
  const total = photos.length;
  if (!total) return '<div class="diaryNoPhotos">還沒有照片，點下方上傳</div>';
  const cap = capStyle ? ` style="${capStyle}"` : '';
  const item = (p, i) => `
    <div class="diaryPhotoStoryItem${i % 2 === 1 ? ' alt' : ''}">
      <div class="diaryPhotoStoryImgWrap">
        <img src="${p.src}" alt="${esc(p.title || '')}"${i >= 6 ? ' loading="lazy"' : ''}>
        ${_diaryPhotoCtrl(p, i, total)}
      </div>
      ${(p.title || p.memo || _photoTags(p).length) ? `
      <div class="diaryPhotoStoryText"${cap}>
        ${p.title ? `<div class="diaryPhotoStoryCaption">${esc(p.title)}</div>` : ''}
        ${p.memo  ? `<div class="diaryPhotoStoryMemo">${esc(p.memo)}</div>`   : ''}
        ${_photoTagsHtml(p, !shareViewMode)}
      </div>` : ''}
    </div>`;
  const featured = photos.slice(0, 6);
  const extra    = photos.slice(6);

  const extraBlock = extra.length ? `
    <div class="diaryPhotoExtraWrap">
      <button class="diaryExpandBtn noPrint" type="button"
              data-label="展開全部 ${total} 張"
              onclick="toggleDiaryPhotoExpand(this)">展開全部 ${total} 張</button>
      <div class="diaryPhotoExtraInner">
        <div class="diaryPhotoStoryList">
          ${extra.map((p, j) => item(p, j + 6)).join('')}
        </div>
      </div>
    </div>` : '';

  return `
    <div class="diaryPhotoStoryList">
      ${featured.map((p, i) => item(p, i)).join('')}
    </div>
    ${extraBlock}`;
}

function diaryDayHtml(d) {
  const style   = data.meta.bookStyle || 'fresh';
  const photos  = photosForDay(d.key);
  const mood    = (data.dayMoods || {})[d.key] || {};
  const hotel   = hotelFor(d.key);
  const plans   = sortedPlans(d.key);

  // 今日心情 text
  const text       = mood.text || '';
  const lineText   = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  const textColor  = mood.textColor  || '';
  const textStroke = mood.textStroke || false;
  const textBold   = mood.textBold   || false;

  const isStory = style === 'story' || style === 'sketch' || style === 'polar';

  // 今日心情顏色工具列
  const moodColorBar = _diaryColorBar(d.key, '心情',
    { color:'textColor', stroke:'textStroke', bold:'textBold' },
    { color:textColor, stroke:textStroke, bold:textBold });

  // 照片日記（圖說）顏色工具列 + 圖說 inline style
  const capStyle      = _diaryTextStyle(mood.capColor, mood.capStroke, mood.capBold);
  const photoColorBar = _diaryColorBar(d.key, '照片',
    { color:'capColor', stroke:'capStroke', bold:'capBold' },
    { color:mood.capColor, stroke:mood.capStroke, bold:mood.capBold });

  // 今日心情文字區塊
  const moodStyleAttr = _diaryTextStyle(textColor, textStroke, textBold);
  const moodBlock = shareViewMode
    ? (text ? `<div class="diaryDayText"${moodStyleAttr?` style="${moodStyleAttr}"`:''}>${lineText}</div>` : '')
    : `<div class="diaryDayText" contenteditable="true"
            ${moodStyleAttr ? `style="${moodStyleAttr}"` : ''}
            onblur="saveDayText('${d.key}', this.innerText)"
            data-placeholder="寫下今天的心情…">${lineText}</div>`;

  return `
    <div class="diaryDay diaryStyle-${style}" data-day="${d.key}">

      <div class="diaryDayHeader">
        <div class="diaryDayMeta">
          <span class="diaryDayNum">${esc(d.title)}</span>
          <span class="diaryDayDate">${shortWithDay(d.key)}</span>
          ${hotel ? `<span class="diaryDayHotel">🏨 ${esc(hotel.name)}</span>` : ''}
        </div>
        ${mood.weather || mood.mood
          ? `<div class="diaryMoodBadge">${mood.weather || ''}${mood.mood || ''}</div>` : ''}
      </div>

      ${shareViewMode ? '' : `
        <div class="diaryMoodPicker noPrint">
          <div class="diaryIconRow">
            ${WEATHER_ICONS.map(w => `<button class="diaryIconBtn${mood.weather===w?' active':''}"
              onclick="setDayMood('${d.key}','weather','${w}')">${w}</button>`).join('')}
          </div>
          <div class="diaryIconRow">
            ${MOOD_ICONS.map(m => `<button class="diaryIconBtn${mood.mood===m?' active':''}"
              onclick="setDayMood('${d.key}','mood','${m}')">${m}</button>`).join('')}
          </div>
        </div>`}

      ${diaryItineraryHtml(d)}

      ${moodColorBar}
      <div class="diaryTextSection">${moodBlock}</div>

      ${shareViewMode ? '' : storyPhotoUploadForm(d.key)}

      ${photoColorBar}
      <div class="diaryPhotoSection">${isStory ? diaryPhotoStoryHtml(photos, capStyle) : diaryPhotoGridHtml(photos, capStyle)}</div>
    </div>`;
}

function diaryCoverHtml() {
  const cover = data.tripCover;
  const style = data.meta.bookStyle || 'fresh';

  return `
    ${shareViewMode ? '' : `
      <div class="diarySetup noPrint">
        ${!cover ? `<div class="diarySetupLeft">
          <label class="diarySetupCoverEmpty">
            <span>＋ 上傳封面照</span>
            <input type="file" accept="image/*" onchange="addTripCover(this.files[0])" style="display:none">
          </label>
          <div class="photoUploadStatus" id="coverUploadStatus"></div>
        </div>` : `<div class="photoUploadStatus" id="coverUploadStatus"></div>`}
        <div class="diarySetupRight">
          <div class="diaryStyleLabel">書冊風格</div>
          <div class="diaryStyleBtns">
            ${Object.entries(DIARY_STYLES).map(([k, l]) => `
              <button class="diaryStyleBtn${style===k?' active':''}"
                      onclick="setDiaryStyle('${k}')">
                ${l}
              </button>`).join('')}
          </div>
          <div class="diaryStyleLabel" style="margin-top:10px">封面文字顏色</div>
          <div class="diaryCoverColorRow">
            ${[
              { val:'', label:'風格預設' },
              { val:'#ffffff', label:'白色' },
              { val:'#f5f0e8', label:'奶白' },
              { val:'#f0c060', label:'金黃' },
              { val:'#1a1a1a', label:'黑色' },
              { val:'#2e4a38', label:'深綠' },
              { val:'#1e3a4f', label:'深藍' },
              { val:'#4a3728', label:'深褐' },
            ].map(c => `
              <button class="diaryCoverColorSwatch ${(data.meta.coverTextColor||'')===c.val?'active':''}"
                      title="${c.label}"
                      style="${c.val ? `background:${c.val};` : 'background: linear-gradient(135deg,#eee 50%,#999 50%);'}"
                      onclick="setCoverTextColor('${c.val}')"></button>`).join('')}
          </div>
        </div>
      </div>`}

    <div class="diaryCoverPage diaryStyle-${style}">
      ${cover ? `<img class="diaryCoverBg" src="${cover}">` : ''}
      <div class="diaryCoverOv"></div>
      <div class="diaryCoverDeco"></div>
      <div class="diaryCoverContent" ${data.meta.coverTextColor ? `style="color:${data.meta.coverTextColor}"` : ''}>
        <div class="diaryCoverEyebrow">TRAVEL DIARY</div>
        <h1 class="diaryCoverTitle">${esc(data.meta.title || '我的旅程日記')}</h1>
        <div class="diaryCoverDest">${esc(data.trip.dest || '')}</div>
        <div class="diaryCoverDates">
          ${data.trip.start ? `${short(data.trip.start)} — ${short(data.trip.end)}` : ''}
        </div>
      </div>
      ${shareViewMode ? '' : `
        <div class="diaryCoverOverlayBtns noPrint${cover ? '' : ' no-cover'}">
          <label class="diaryCoverOverlayBtn">
            ${cover ? '更換封面' : '＋ 上傳封面照'}
            <input type="file" accept="image/*" onchange="addTripCover(this.files[0])" style="display:none">
          </label>
          ${cover ? `<button class="diaryCoverOverlayBtn" onclick="removeTripCover()">移除</button>` : ''}
        </div>`}
    </div>`;
}

function exportDiaryPDF() {
  _flushDiaryTexts();
  const cssHref = document.querySelector('link[rel="stylesheet"]')?.href || '';
  const cover   = data.tripCover;
  const style   = data.meta.bookStyle || 'fresh';
  const daysHtml = data.days.map(d => diaryDayHtml(d)).join('');

  const win = window.open('', '_blank');
  if (!win) { toast('請允許彈出視窗後再試'); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(data.meta.title || '旅日記')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap">
${cssHref ? `<link rel="stylesheet" href="${cssHref}">` : ''}
<style>
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  @page { size:A4 portrait; margin:15mm 18mm; }
  body { margin:0; padding:0; background:#f5f0e8; font-family:-apple-system,'Noto Sans TC','PingFang TC',sans-serif; }
  .diaryDay { max-width:none; break-after:page; page-break-after:always; }
  .diaryCoverPage { break-after:page; page-break-after:always; }
  .noPrint, .diaryMoodPicker, .diarySetup, .diaryPhotoCtrl,
  .storyPhotoUploadCard, .diaryTagRemove, .diaryTagInputWrap,
  .diaryPlanTag.suggestion { display:none!important; }
  .diaryDayText { border:none!important; background:transparent!important; }
  /* 匯出時第 7 張以後的照片全部展開 */
  .diaryExpandBtn { display:none!important; }
  .diaryPhotoExtraInner { display:block!important; }
  .diaryTagsSection { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; padding-top:0; }
  .diaryPlanTag { display:inline-flex!important; align-items:center; gap:4px; background:#f0ece6; border-radius:20px; padding:4px 10px; font-size:11px; color:#7a6e64; }
  .diaryPlanTag.active { background:#d9efe6!important; color:#2e4a38!important; font-weight:600; }
  /* Film → 接觸印相表 3 欄 */
  .diaryStyle-film .diaryPhotoSection .diaryPhotoGrid { display:grid!important; grid-template-columns:repeat(3,1fr)!important; overflow:visible!important; }
  .diaryStyle-film .diaryPhotoSection .diaryPhotoGrid .diaryPhotoItem { min-width:unset!important; width:auto!important; }
  /* Story/Sketch：圖文卡片不跨頁 */
  .diaryPhotoStoryItem { break-inside:avoid; page-break-inside:avoid; }
  /* Sketch：格線紙背景確保印出 */
  .diaryStyle-sketch .diaryDay { background-image:linear-gradient(#e8d8b8 1px,transparent 1px)!important; background-size:100% 30px!important; }
  /* PDF 照片高度限制：A4 寬度比手機大，aspect-ratio 不加限制會讓照片塞滿整頁 */
  .diaryPhotoItem { max-height:200px !important; }
  .diaryPhotoGrid.count-1 .diaryPhotoItem { max-height:260px !important; }
  .diaryPhotoGrid.count-3 .diaryPhotoItem:first-child { max-height:280px !important; }
  .diaryPhotoStoryImgWrap { max-height:220px !important; }
  .diaryPhotoStoryImgWrap img { height:100% !important; max-height:220px !important; }

  /* ════════════════════════════════════════
     各風格印刷版設計
     ════════════════════════════════════════ */

  /* 🌿 清新 — 薄荷頁首 */
  .diaryStyle-fresh .diaryDayHeader {
    background: linear-gradient(135deg, #d9efe6 0%, #c0e0d0 100%);
    margin: -24px -20px 18px; padding: 12px 20px; border-radius: 0;
  }
  .diaryStyle-fresh .diaryDayNum  { color: #2e4a38 !important; }
  .diaryStyle-fresh .diaryPhotoItem { border-radius: 10px !important; box-shadow: 0 2px 8px rgba(74,93,78,.18) !important; }

  /* ✎ 手帳 — 舊書頁首 + 保留寶麗來傾斜 */
  .diaryStyle-journal.diaryDay  { background: #fdf8f0 !important; }
  .diaryStyle-journal .diaryDayHeader { border-bottom: 2px solid #a0896e; padding-bottom: 10px; margin-bottom: 18px; }
  .diaryStyle-journal .diaryDayNum  { font-family: Georgia, serif !important; font-size: 1.35rem !important; color: #8b6d4e !important; }
  .diaryStyle-journal .diaryDayDate { font-family: Georgia, serif !important; font-style: italic; color: #a0896e !important; }
  .diaryStyle-journal .diaryPhotoGrid { overflow: visible !important; }

  /* 📰 雜誌 — 深海藍編輯頁首 + 黑邊照片格 */
  .diaryStyle-magazine.diaryDay { border: none; border-bottom: 1px solid #e0e0e8; }
  .diaryStyle-magazine .diaryDayHeader {
    background: #1a1a2e; margin: -24px -20px 18px; padding: 12px 20px;
    display: flex; align-items: center; gap: 14px; border-radius: 0;
  }
  .diaryStyle-magazine .diaryDayNum  { color: #f0c060 !important; font-size: 0.78rem !important; text-transform: uppercase !important; letter-spacing: .14em; font-weight: 900; }
  .diaryStyle-magazine .diaryDayDate { color: #ccc !important; font-size: 0.82rem; }
  .diaryStyle-magazine .diaryDayHotel { background: rgba(255,255,255,.15) !important; color: #f0c060 !important; }
  .diaryStyle-magazine .diaryMoodBadge { margin-left: auto; }
  .diaryStyle-magazine .diaryDayText { color: #1a1a2e !important; font-size: 0.95rem; }
  .diaryStyle-magazine .diaryPhotoGrid { gap: 2px !important; border: 2px solid #1a1a2e !important; border-radius: 0 !important; }
  .diaryStyle-magazine .diaryPhotoItem { border-radius: 0 !important; }

  /* 🎞 底片 — 黑底底片感 */
  .diaryStyle-film.diaryDay  { background: #1c1c1c !important; color: #f0e8d0; }
  .diaryStyle-film .diaryDayHeader {
    background: #000; margin: -24px -20px 14px; padding: 8px 20px;
    border-bottom: 3px solid #f0c060; display: flex; align-items: center; gap: 12px;
  }
  .diaryStyle-film .diaryDayNum  { color: #f0c060 !important; font-family: 'Courier New', monospace !important; font-size: 0.85rem !important; letter-spacing: .08em; }
  .diaryStyle-film .diaryDayDate { color: #888 !important; font-family: 'Courier New', monospace !important; font-size: 0.78rem; }
  .diaryStyle-film .diaryDayHotel { background: #333 !important; color: #aaa !important; }
  .diaryStyle-film .diaryDayText { color: #f0e8d0 !important; font-family: 'Courier New', monospace !important; font-size: 0.9rem; }
  .diaryStyle-film .diaryPhotoSection { background: #111; padding: 8px; }
  .diaryStyle-film .diaryPhotoItem { outline: 3px solid #000 !important; border-radius: 0 !important; }
  .diaryStyle-film .diaryPhotoCaption { font-family: 'Courier New', monospace !important; font-size: 9px; }
  .diaryStyle-film .diaryTagsSection { border-top: 1px solid #333; padding-top: 10px; }
  .diaryStyle-film .diaryPlanTag { background: #333 !important; color: #ccc !important; border-radius: 2px !important; font-family: 'Courier New', monospace !important; }
  .diaryStyle-film .diaryPlanTag.active { background: #2a2000 !important; color: #f0c060 !important; }

  /* ════════════════════════════════════════
     今日行程區塊
     ════════════════════════════════════════ */
  .diaryItinerarySection { margin: 12px 0 6px; }
  .diaryItineraryHead { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .diaryItineraryLabel { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #888; }
  .diaryItinerary { font-size: 0.85rem; line-height: 1.9; color: #555; white-space: pre-wrap; }
  .diaryItinerary.fromPlan { color: #888; font-style: italic; }
  /* 各風格行程色調 */
  .diaryStyle-fresh  .diaryItinerary { color: #2e4a38; border-left: 3px solid #b0d9c4; padding-left: 10px; }
  .diaryStyle-journal .diaryItinerary { font-family: Georgia, serif; color: #7a6040; border-left: 2px solid #c8a878; padding-left: 10px; }
  .diaryStyle-magazine .diaryItinerary { color: #f0e8d8; border-left: 3px solid #f0c060; padding-left: 10px; background: rgba(255,255,255,.05); }
  .diaryStyle-film .diaryItinerary { font-family: 'Courier New', monospace; color: #c8b88a; border-left: 3px solid #f0c060; padding-left: 10px; }
  .diaryStyle-story .diaryItinerary { color: #1e3a4f; border-left: 3px solid #4a8ab0; padding-left: 10px; }
  .diaryStyle-sketch .diaryItinerary { font-family: 'Caveat', cursive; color: #3d2b1a; font-size: 1rem; }
  .diaryStyle-polar  .diaryItinerary { color: #b06060; border-left: 1px solid #e8c0b8; padding-left: 10px; }
  /* 封面裝飾元素 */
  .diaryCoverDeco { position: absolute; inset: 0; pointer-events: none; }
  .diaryStyle-fresh   .diaryCoverDeco { background: radial-gradient(ellipse at 90% 10%, rgba(180,230,200,.35) 0%, transparent 50%), radial-gradient(ellipse at 10% 85%, rgba(140,200,170,.25) 0%, transparent 40%); }
  .diaryStyle-journal .diaryCoverDeco { background: radial-gradient(ellipse at center, rgba(255,245,220,.12) 0%, transparent 70%); border: 3px solid rgba(180,140,90,.4); }
  .diaryStyle-magazine .diaryCoverDeco { background: linear-gradient(to right, rgba(26,26,46,.6) 0%, transparent 50%); }
  .diaryStyle-film    .diaryCoverDeco { background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,.7) 100%); }
  .diaryStyle-story   .diaryCoverDeco { background: linear-gradient(180deg, rgba(30,58,79,.4) 0%, rgba(74,138,176,.2) 50%, transparent 100%); }
  .diaryStyle-sketch  .diaryCoverDeco { border: 4px solid rgba(61,43,26,.5); outline: 1px dashed rgba(61,43,26,.3); outline-offset: -12px; }
  .diaryStyle-polar   .diaryCoverDeco { border: 1px solid rgba(224,200,196,.7); box-shadow: inset 0 0 0 5px rgba(255,255,255,.3), inset 0 0 0 6px rgba(224,200,196,.4); }

  /* 📖 故事 — 藍色扉頁感 */
  .diaryStyle-story.diaryDay  { border-top: 4px solid #1e3a4f; }
  .diaryStyle-story .diaryDayHeader { border-bottom: 1px solid #c8dde8; padding-bottom: 10px; margin-bottom: 16px; }
  .diaryStyle-story .diaryDayNum  { color: #1e3a4f !important; font-size: 1.15rem !important; font-weight: 800; }
  .diaryStyle-story .diaryDayDate { color: #4a8ab0 !important; }
  .diaryStyle-story .diaryDayText { border-left: 3px solid #4a8ab0 !important; padding-left: 12px !important; color: #1e3a4f !important; }
  .diaryStyle-story .diaryPhotoStoryImgWrap { border-radius: 8px !important; overflow: hidden !important; }

  /* ✏️ 手繪 — 手繪邊框全保留 */
  .diaryStyle-sketch.diaryDay { border: 2px solid #3d2b1a !important; box-shadow: 4px 4px 0 #3d2b1a !important; margin-bottom: 24px !important; }
  .diaryStyle-sketch .diaryDayHeader { border-bottom: 2px dashed #8b6040; padding-bottom: 10px; margin-bottom: 14px; }
  .diaryStyle-sketch .diaryPhotoStoryImgWrap { overflow: hidden !important; box-shadow: 4px 4px 0 #3d2b1a !important; }

  /* 📷 立可拍 — 雙層細線框 + 白框照片 */
  .diaryStyle-polar.diaryDay { border: 1px solid #e0c8c4 !important; box-shadow: 0 0 0 4px #fefcfa, 0 0 0 5px #e0c8c4 !important; border-radius: 6px !important; margin-bottom: 28px !important; background: #fff !important; }
  .diaryStyle-polar .diaryDayHeader { border-bottom: 1px solid #f0dcd8; padding-bottom: 10px; margin-bottom: 14px; }
  .diaryStyle-polar .diaryDayNum  { color: #b06060 !important; }
  .diaryStyle-polar .diaryPhotoStoryImgWrap { background: #fff !important; padding: 7px 7px 26px !important; box-shadow: 0 3px 10px rgba(0,0,0,.15) !important; border-radius: 2px !important; overflow: visible !important; }
  .diaryStyle-polar .diaryPhotoStoryImgWrap img { border-radius: 0 !important; }

  /* 各風格 body 背景 */
  body.pStyle-film     { background: #1c1c1c !important; }
  body.pStyle-sketch   { background: #fef6e4 !important; }
  body.pStyle-magazine { background: #e8e8ee !important; }
  body.pStyle-journal  { background: #faf4e8 !important; }
  body.pStyle-polar    { background: #f5eeec !important; }

  @media print { body { background: #fff; } }
</style>
</head>
<body class="pStyle-${style}">
${cover ? `
  <div class="diaryCoverPage diaryStyle-${style}">
    <img class="diaryCoverBg" src="${cover}">
    <div class="diaryCoverOv"></div>
    <div class="diaryCoverDeco"></div>
    <div class="diaryCoverContent">
      <div class="diaryCoverEyebrow">TRAVEL DIARY</div>
      <h1 class="diaryCoverTitle">${esc(data.meta.title || '我的旅程日記')}</h1>
      <div class="diaryCoverDest">${esc(data.trip.dest || '')}</div>
      <div class="diaryCoverDates">${data.trip.start ? `${short(data.trip.start)} — ${short(data.trip.end)}` : ''}</div>
    </div>
  </div>` : ''}
${daysHtml}
<script>window.addEventListener('load',function(){var t=[];if(document.fonts&&document.fonts.ready)t.push(document.fonts.ready);[].forEach.call(document.images,function(img){if(!img.complete)t.push(new Promise(function(r){img.onload=img.onerror=r;}));});Promise.all(t).then(function(){setTimeout(window.print.bind(window),200);});});<\/script>
</body>
</html>`);
  win.document.close();
}
