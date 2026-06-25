/* ================================================================
   packing.js — 行李清單
   ================================================================ */

function addPackItem() {
  const pkn  = $form('pkn');
  const pkm  = $form('pkm');
  const name = pkn?.value.trim();
  if (!name) return;
  data.packing.push({
    id: uid(), type: data.packView || 'pre',
    name, note: pkm?.value || '', checked: false
  });
  if (pkn) pkn.value = '';
  if (pkm) pkm.value = '';
  save();
  closeAddSheet();
}

function togglePackItem(id) {
  const item = data.packing.find(x => x.id === id);
  if (item) { item.checked = !item.checked; save(); }
}

function deletePackItem(id) {
  data.packing = data.packing.filter(x => x.id !== id);
  save();
}

function uncheckCurrentList() {
  data.packing.filter(x => x.type === (data.packView || 'pre'))
    .forEach(x => x.checked = false);
  save();
}

function togglePackListEditor() {
  const el = $('packListEditor');
  if (el) el.hidden = !el.hidden;
}

function addPackList() {
  const input = $('newPackListName');
  const name  = input?.value.trim();
  if (!name) return toast('請輸入清單名稱');
  if (!data.packLists) data.packLists = [];
  const id = uid();
  data.packLists.push({ id, name });
  data.packView = id;
  save();
}

function renamePackList(id, name) {
  const l = (data.packLists || []).find(x => x.id === id);
  if (l && name.trim()) { l.name = name.trim(); save(); }
}

function deletePackList(id) {
  if (!confirm('刪除此清單也會刪除其中所有項目，確定嗎？')) return;
  data.packLists = (data.packLists || []).filter(x => x.id !== id);
  data.packing   = data.packing.filter(x => x.type !== id);
  if (data.packView === id) data.packView = data.packLists[0]?.id || 'todo';
  save();
}
