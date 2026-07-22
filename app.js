(() => {
  'use strict';
  const STORAGE_KEY = 'radarAdsData_v1';
  const CONFIG_KEY = 'radarAdsConfig_v1';
  const VERSION = 3;
  const MAX_IMAGE_BYTES = 2.2 * 1024 * 1024;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `ad-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const formatDate = iso => new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso));
  const formatDateTime = iso => new Intl.DateTimeFormat('es-AR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));
  const evaluationMap = {
    yes:{label:'Modelar', phrase:'Vale la pena modelarlo.', cls:'status-yes'},
    maybe:{label:'Revisar', phrase:'Necesita más investigación.', cls:'status-maybe'},
    no:{label:'Descartar', phrase:'No parece una oportunidad prioritaria.', cls:'status-no'}
  };

  // La aplicación comienza vacía. Cada alumno carga únicamente sus propios anuncios.


  let ads = loadAds();
  let config = loadConfig();
  let currentView = 'home';
  let imageData = '';
  let editingId = null;
  let evalFilter = 'all';
  let pendingConfirm = null;
  let pendingImport = null;

  function loadAds(){
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(parsed)) return [];
      // Migra instalaciones anteriores: elimina solo los registros de demostración,
      // sin tocar los anuncios cargados por el alumno.
      const ownAds = parsed.filter(ad => !ad?.isDemo && !String(ad?.id || '').startsWith('demo-'));
      if (ownAds.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(ownAds));
      return ownAds;
    } catch { return []; }
  }
  function loadConfig(){
    try { return {...{name:'',welcomed:false}, ...(JSON.parse(localStorage.getItem(CONFIG_KEY))||{})}; }
    catch { return {name:'',welcomed:false}; }
  }
  function saveAll(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ads)); localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); return true; }
    catch(err){ toast('No se pudieron guardar los datos. El almacenamiento del dispositivo puede estar lleno.', true); return false; }
  }
  function toast(message,isError=false){
    const el=document.createElement('div'); el.className=`toast${isError?' error-toast':''}`; el.textContent=message; $('#toastRegion').appendChild(el); setTimeout(()=>el.remove(),3200);
  }
  function isValidUrl(value){
    try { const u=new URL(value); return ['http:','https:'].includes(u.protocol); } catch { return false; }
  }
  function showView(name){
    currentView=name;
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.go===name));
    if(name==='home') renderHome();
    if(name==='library') renderLibrary();
    if(name==='summary') renderSummary();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function statusBadge(e){ const s=evaluationMap[e]||evaluationMap.maybe; return `<span class="status-badge ${s.cls}">${s.label}</span>`; }
  function imageHtml(ad){ return ad.image ? `<img class="ad-thumb" src="${ad.image}" alt="Captura de ${esc(ad.name)}">` : `<div class="ad-thumb placeholder-thumb" aria-label="Sin captura">◉</div>`; }
  function adCard(ad){
    const notes=ad.notes?`<p class="ad-note">${esc(ad.notes)}</p>`:'';
    return `<article class="ad-card" data-id="${ad.id}">
      <button class="ad-card-main" data-action="detail" data-id="${ad.id}" aria-label="Ver detalle de ${esc(ad.name)}">
        ${imageHtml(ad)}
        <div><div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><h3>${esc(ad.name)}</h3>${statusBadge(ad.evaluation)}</div>
        <div class="ad-meta"><span class="meta-pill">${esc(ad.niche)}</span>${ad.price?`<span class="meta-pill">${esc(ad.price)}</span>`:''}<span class="meta-pill">${Number(ad.activeAds)||0} anuncios</span></div>
        ${notes}<p class="ad-note">Guardado: ${formatDate(ad.createdAt)}</p></div>
      </button>
      <div class="card-actions">
        <button data-action="edit" data-id="${ad.id}">Editar</button>
        <button data-action="duplicate" data-id="${ad.id}">Duplicar</button>
        <a href="${esc(ad.adLink)}" target="_blank" rel="noopener noreferrer">Abrir biblioteca</a>
        ${ad.pageLink?`<a href="${esc(ad.pageLink)}" target="_blank" rel="noopener noreferrer">Abrir fanpage</a>`:''}
        <button data-action="delete" data-id="${ad.id}">Eliminar</button>
      </div>
    </article>`;
  }
  function emptyState(kind){
    const map={
      home:['Tu Radar todavía está vacío.','Comenzá guardando el primer anuncio que encuentres.','Agregar primer anuncio'],
      library:['Todavía no guardaste anuncios.','Cuando encuentres una oferta interesante, agregala a tu Radar para no perderla.','Agregar primer anuncio'],
      filtered:['No encontramos anuncios con esos filtros.','Probá con otra búsqueda o limpiá los filtros.','Limpiar filtros']
    };
    const [title,text,button]=map[kind]; const action=kind==='filtered'?'clear-filters':'go-add';
    return `<div class="empty-state"><div class="empty-icon">◉</div><h3>${title}</h3><p>${text}</p><button class="btn btn-primary" data-action="${action}">${button}</button></div>`;
  }
  function stats(){
    const niches=new Set(ads.map(a=>a.niche.trim().toLowerCase()).filter(Boolean));
    return {total:ads.length, yes:ads.filter(a=>a.evaluation==='yes').length, maybe:ads.filter(a=>a.evaluation==='maybe').length, no:ads.filter(a=>a.evaluation==='no').length, niches:niches.size};
  }
  function renderHome(){
    $('#helloText').textContent=config.name?`Hola, ${config.name}`:'Hola';
    const s=stats();
    $('#homeStats').innerHTML=[['Total guardados',s.total],['Vale la pena modelar',s.yes],['Pendientes de revisar',s.maybe],['Nichos investigados',s.niches]].map(([label,n])=>`<div class="stat-card"><strong>${n}</strong><span>${label}</span></div>`).join('');
    const recent=[...ads].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,3);
    $('#recentAds').innerHTML=recent.length?recent.map(adCard).join(''):emptyState('home');
  }
  function renderNicheOptions(){
    const values=[...new Set(ads.map(a=>a.niche).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const current=$('#nicheFilter').value;
    $('#nicheFilter').innerHTML='<option value="all">Todos los nichos</option>'+values.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if(values.includes(current)) $('#nicheFilter').value=current;
  }
  function filteredAds(){
    const q=$('#searchInput').value.trim().toLowerCase(); const niche=$('#nicheFilter').value; const sort=$('#sortSelect').value;
    let list=ads.filter(a=>(evalFilter==='all'||a.evaluation===evalFilter)&&(niche==='all'||a.niche===niche)&&(!q||[a.name,a.niche,a.notes].join(' ').toLowerCase().includes(q)));
    list.sort((a,b)=>{
      if(sort==='oldest') return new Date(a.createdAt)-new Date(b.createdAt);
      if(sort==='activity-desc') return (Number(b.activeAds)||0)-(Number(a.activeAds)||0);
      if(sort==='activity-asc') return (Number(a.activeAds)||0)-(Number(b.activeAds)||0);
      if(sort==='name') return a.name.localeCompare(b.name,'es');
      return new Date(b.createdAt)-new Date(a.createdAt);
    });
    return list;
  }
  function renderLibrary(){
    renderNicheOptions(); const list=filteredAds();
    $('#libraryCount').textContent=`${list.length} ${list.length===1?'anuncio':'anuncios'}`;
    const hasFilters=evalFilter!=='all'||$('#nicheFilter').value!=='all'||$('#searchInput').value.trim()||$('#sortSelect').value!=='recent';
    $('#clearFiltersBtn').classList.toggle('hidden',!hasFilters);
    $('#libraryList').innerHTML=list.length?list.map(adCard).join(''):(ads.length?emptyState('filtered'):emptyState('library'));
  }
  function renderSummary(){
    if(!ads.length){ $('#summaryContent').innerHTML=`<div class="empty-state"><div class="empty-icon">◔</div><h3>Tu resumen aparecerá cuando comiences a guardar anuncios.</h3><button class="btn btn-primary" data-action="go-add">Agregar primer anuncio</button></div>`; return; }
    const s=stats();
    const counts={}; ads.forEach(a=>counts[a.niche]=(counts[a.niche]||0)+1);
    const nicheRows=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const topActivity=[...ads].sort((a,b)=>(Number(b.activeAds)||0)-(Number(a.activeAds)||0)).slice(0,5);
    const max=Math.max(s.yes,s.maybe,s.no,1);
    const observations=[`Guardaste ${s.total} ${s.total===1?'anuncio':'anuncios'} en total.`, nicheRows[0]?`El nicho más investigado es ${nicheRows[0][0]}.`:'',`Tenés ${s.yes} ${s.yes===1?'oferta marcada':'ofertas marcadas'} para modelar.`,`Hay ${s.maybe} ${s.maybe===1?'anuncio pendiente':'anuncios pendientes'} de revisar.`].filter(Boolean);
    $('#summaryContent').innerHTML=`
      <section class="summary-block"><div class="summary-grid">${[['Total',s.total],['Modelar',s.yes],['Revisar',s.maybe],['Descartar',s.no],['Nichos',s.niches]].map(([l,n])=>`<div class="stat-card"><strong>${n}</strong><span>${l}</span></div>`).join('')}</div></section>
      <section class="summary-block"><div class="section-heading"><h2>Distribución por evaluación</h2></div><div class="form-card distribution">${[['Modelar',s.yes],['Revisar',s.maybe],['Descartar',s.no]].map(([l,n])=>`<div class="distribution-row"><span>${l}</span><div class="bar"><span style="width:${(n/max)*100}%"></span></div><strong>${n}</strong></div>`).join('')}</div></section>
      <section class="summary-block"><div class="section-heading"><h2>Nichos más investigados</h2></div><div class="rank-list">${nicheRows.map(([n,c])=>`<div class="rank-item"><div><strong>${esc(n)}</strong><br><small>${Math.round(c/s.total*100)}% del total</small></div><strong>${c}</strong></div>`).join('')}</div></section>
      <section class="summary-block"><div class="section-heading"><h2>Anuncios con mayor actividad registrada</h2></div><div class="rank-list">${topActivity.map(a=>`<button class="rank-item" data-action="detail" data-id="${a.id}" style="color:inherit;text-align:left;width:100%"><div><strong>${esc(a.name)}</strong><br><small>${esc(a.niche)}</small></div><strong>${Number(a.activeAds)||0}</strong></button>`).join('')}</div></section>
      <section class="summary-block"><div class="section-heading"><h2>Observaciones</h2></div><div class="observation-list">${observations.map(o=>`<div class="observation">${esc(o)}</div>`).join('')}</div></section>`;
  }

  function clearErrors(){ $$('.error').forEach(e=>e.textContent=''); }
  function setError(name,msg){ const el=$(`[data-error="${name}"]`); if(el) el.textContent=msg; }
  function validateForm(){
    clearErrors();
    let ok=true;
    const name=$('#productName').value.trim();
    const niche=$('#niche').value.trim();
    const page=$('#pageLink').value.trim();
    const adLink=$('#adLink').value.trim();
    const active=$('#activeAds').value.trim();
    const price=$('#price').value.trim();
    const notes=$('#notes').value.trim();

    if(!name){setError('productName','Ingresá el nombre del producto u oferta.');ok=false}
    if(!niche){setError('niche','Ingresá o elegí un nicho.');ok=false}
    if(!page||!isValidUrl(page)){setError('pageLink','Ingresá un link válido de la fanpage.');ok=false}
    if(!adLink||!isValidUrl(adLink)){setError('adLink','Ingresá un link válido de la Biblioteca de Anuncios.');ok=false}
    if(active===''||!Number.isInteger(Number(active))||Number(active)<0){setError('activeAds','Ingresá la cantidad de anuncios activos con un número entero igual o mayor a cero.');ok=false}
    if(!price){setError('price','Ingresá el precio de la oferta.');ok=false}
    if(!imageData){setError('image','Cargá una captura del anuncio.');ok=false}
    if(!notes){setError('notes','Escribí qué te llamó la atención.');ok=false}
    if(!$('input[name="evaluation"]:checked')){setError('evaluation','Indicá si conviene modelarlo.');ok=false}
    return ok;
  }
  function formDataToAd(){
    const now=new Date().toISOString(); const old=editingId?ads.find(a=>a.id===editingId):null;
    return {id:editingId||uid(),name:$('#productName').value.trim(),adLink:$('#adLink').value.trim(),pageLink:$('#pageLink').value.trim(),niche:$('#niche').value.trim(),activeAds:Number($('#activeAds').value),price:$('#price').value.trim(),image:imageData,evaluation:$('input[name="evaluation"]:checked').value,notes:$('#notes').value.trim(),createdAt:old?.createdAt||now,updatedAt:now,isDemo:false};
  }
  function saveForm(addAnother=false){
    if(!validateForm()) { toast('Revisá los campos marcados.',true); return false; }
    const ad=formDataToAd();
    if(editingId) ads=ads.map(a=>a.id===editingId?ad:a); else ads.push(ad);
    if(!saveAll()) return false;
    toast(editingId?'Anuncio actualizado correctamente.':'Anuncio guardado correctamente.');
    resetForm(); renderAll();
    showView(addAnother?'add':'library');
    return true;
  }
  function resetForm(){
    $('#adForm').reset(); clearErrors(); imageData=''; editingId=null; $('#adId').value=''; $('#formTitle').textContent='Agregar anuncio'; $('#saveAdBtn').textContent='Guardar en mi Radar'; $('#cancelEditBtn').classList.add('hidden'); $('#imagePreviewWrap').classList.add('hidden'); $('#imagePreview').removeAttribute('src'); $('#notesCount').textContent='0';
  }
  function editAd(id){
    const a=ads.find(x=>x.id===id); if(!a) return;
    editingId=id; $('#adId').value=id; $('#productName').value=a.name; $('#adLink').value=a.adLink; $('#pageLink').value=a.pageLink||''; $('#niche').value=a.niche; $('#activeAds').value=a.activeAds??0; $('#price').value=a.price||''; $('#notes').value=a.notes||''; $(`input[name="evaluation"][value="${a.evaluation}"]`).checked=true; imageData=a.image||'';
    if(imageData){$('#imagePreview').src=imageData;$('#imagePreviewWrap').classList.remove('hidden')}else{$('#imagePreviewWrap').classList.add('hidden')}
    $('#notesCount').textContent=$('#notes').value.length; $('#formTitle').textContent='Editar anuncio'; $('#saveAdBtn').textContent='Guardar cambios'; $('#cancelEditBtn').classList.remove('hidden'); closeModals(); showView('add');
  }
  function duplicateAd(id){ const a=ads.find(x=>x.id===id); if(!a)return; const now=new Date().toISOString(); ads.push({...a,id:uid(),name:`${a.name} (copia)`,createdAt:now,updatedAt:now,isDemo:false}); if(saveAll()){renderAll();toast('Anuncio duplicado correctamente.')} }
  function confirmAction(message,label,action){ pendingConfirm=action; $('#confirmMessage').textContent=message; $('#confirmAcceptBtn').textContent=label; openModal('confirmModal'); }
  function deleteAd(id){ const a=ads.find(x=>x.id===id); if(!a)return; confirmAction('¿Querés eliminar este anuncio de tu Radar?','Eliminar',()=>{ads=ads.filter(x=>x.id!==id);saveAll();closeModals();renderAll();toast('Anuncio eliminado.');}); }
  function detailAd(id){
    const a=ads.find(x=>x.id===id); if(!a)return; const e=evaluationMap[a.evaluation]; $('#detailTitle').textContent=a.name;
    $('#detailBody').innerHTML=`${a.image?`<img class="detail-image" src="${a.image}" alt="Captura de ${esc(a.name)}">`:''}
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><div><p class="eyebrow">${esc(a.niche)}</p><h2>${esc(a.name)}</h2></div>${statusBadge(a.evaluation)}</div>
      <div class="detail-grid"><div class="detail-item"><small>Precio</small><strong>${esc(a.price||'No registrado')}</strong></div><div class="detail-item"><small>Anuncios activos</small><strong>${Number(a.activeAds)||0}</strong></div><div class="detail-item"><small>Creado</small><strong>${formatDateTime(a.createdAt)}</strong></div><div class="detail-item"><small>Modificado</small><strong>${formatDateTime(a.updatedAt)}</strong></div></div>
      <div class="info-box"><h3>Tu evaluación</h3><p>${e.phrase}</p></div>
      ${a.notes?`<h3 style="margin-top:18px">¿Qué te llamó la atención?</h3><p style="color:var(--muted)">${esc(a.notes)}</p>`:''}
      <div class="detail-actions"><a class="btn btn-primary" href="${esc(a.adLink)}" target="_blank" rel="noopener noreferrer">Abrir en la Biblioteca de Anuncios</a>${a.pageLink?`<a class="btn btn-secondary" href="${esc(a.pageLink)}" target="_blank" rel="noopener noreferrer">Abrir fanpage</a>`:''}<button class="btn btn-secondary" data-action="edit" data-id="${a.id}">Editar</button><button class="btn btn-secondary" data-action="duplicate" data-id="${a.id}">Duplicar</button><button class="btn btn-danger" data-action="delete" data-id="${a.id}">Eliminar</button></div>`;
    openModal('detailModal');
  }
  async function compressImage(file){
    if(!file.type.startsWith('image/')) throw new Error('Seleccioná un archivo de imagen.');
    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=data});
    const max=900, scale=Math.min(1,max/Math.max(img.width,img.height)); const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    let out=canvas.toDataURL('image/jpeg',.76); if(out.length>MAX_IMAGE_BYTES*1.37) out=canvas.toDataURL('image/jpeg',.58); if(out.length>MAX_IMAGE_BYTES*1.37) throw new Error('La imagen sigue siendo demasiado pesada. Probá con otra captura.'); return out;
  }
  function openModal(id){ $('#modalBackdrop').classList.remove('hidden'); $(`#${id}`).classList.remove('hidden'); document.body.style.overflow='hidden'; }
  function closeModals(){ $('#modalBackdrop').classList.add('hidden'); $$('.modal').forEach(m=>m.classList.add('hidden')); document.body.style.overflow=''; pendingConfirm=null; }
  function clearFilters(){ evalFilter='all'; $('#searchInput').value=''; $('#nicheFilter').value='all'; $('#sortSelect').value='recent'; $$('#evaluationFilters .chip').forEach(c=>c.classList.toggle('active',c.dataset.evalFilter==='all')); renderLibrary(); }
  function exportData(){
    const payload={version:VERSION,exportedAt:new Date().toISOString(),config,ads}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=`respaldo-radar-anuncios-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(u); toast('Respaldo descargado.');
  }
  function validateImport(obj){ return obj&&typeof obj==='object'&&Array.isArray(obj.ads)&&obj.config&&obj.ads.every(a=>a.id&&a.name&&a.adLink&&a.niche&&a.evaluation); }
  function applyImport(mode){
    if(!pendingImport)return; if(mode==='replace'){ads=pendingImport.ads;config={...config,...pendingImport.config,welcomed:true};}else{const existing=new Map(ads.map(a=>[a.id,a]));pendingImport.ads.forEach(a=>{const newId=existing.has(a.id)?uid():a.id;existing.set(newId,{...a,id:newId});});ads=[...existing.values()];config={...config,...pendingImport.config,welcomed:true};}
    saveAll(); pendingImport=null; closeModals(); renderAll(); toast('Respaldo importado correctamente.');
  }
  function renderAll(){ renderHome(); renderLibrary(); renderSummary(); }
  function setupEvents(){
    document.addEventListener('click',e=>{
      const go=e.target.closest('[data-go]'); if(go){showView(go.dataset.go);return}
      const act=e.target.closest('[data-action]'); if(!act)return; const {action,id}=act.dataset;
      if(action==='detail')detailAd(id); if(action==='edit')editAd(id); if(action==='duplicate')duplicateAd(id); if(action==='delete')deleteAd(id); if(action==='go-add')showView('add'); if(action==='clear-filters')clearFilters();
    });
    $('#startRadarBtn').addEventListener('click',()=>{const name=$('#welcomeName').value.trim();if(!name){setError('welcomeName','Ingresá tu nombre para comenzar.');return;}setError('welcomeName','');config.name=name;config.welcomed=true;saveAll();$('#welcomeOverlay').classList.add('hidden');renderHome();toast('¡Tu Radar está listo!');});
    $('#settingsBtn').addEventListener('click',()=>{$('#settingsName').value=config.name||'';openModal('settingsModal')});
    $$('.close-modal').forEach(b=>b.addEventListener('click',closeModals)); $('#modalBackdrop').addEventListener('click',closeModals); $('#confirmCancelBtn').addEventListener('click',closeModals); $('#confirmAcceptBtn').addEventListener('click',()=>pendingConfirm&&pendingConfirm());
    $('#adForm').addEventListener('submit',e=>{e.preventDefault();saveForm(false)}); $('#saveAnotherBtn').addEventListener('click',()=>saveForm(true)); $('#cancelEditBtn').addEventListener('click',()=>{resetForm();toast('Edición cancelada.')});
    $('#pasteFanpageBtn').addEventListener('click',async()=>{try{$('#pageLink').value=await navigator.clipboard.readText();toast('Link de la fanpage pegado.')}catch{toast('Tu navegador no permitió acceder al portapapeles.',true)}});
    $('#pasteLinkBtn').addEventListener('click',async()=>{try{$('#adLink').value=await navigator.clipboard.readText();toast('Link de la Biblioteca pegado.')}catch{toast('Tu navegador no permitió acceder al portapapeles.',true)}});
    $('#imageInput').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;setError('image','');try{imageData=await compressImage(file);$('#imagePreview').src=imageData;$('#imagePreviewWrap').classList.remove('hidden')}catch(err){setError('image',err.message);e.target.value=''}});
    $('#changeImageBtn').addEventListener('click',()=>$('#imageInput').click()); $('#removeImageBtn').addEventListener('click',()=>{imageData='';$('#imageInput').value='';$('#imagePreviewWrap').classList.add('hidden')});
    $('#notes').addEventListener('input',e=>$('#notesCount').textContent=e.target.value.length);
    $('#searchInput').addEventListener('input',renderLibrary); $('#nicheFilter').addEventListener('change',renderLibrary); $('#sortSelect').addEventListener('change',renderLibrary); $('#clearFiltersBtn').addEventListener('click',clearFilters);
    $('#evaluationFilters').addEventListener('click',e=>{const b=e.target.closest('[data-eval-filter]');if(!b)return;evalFilter=b.dataset.evalFilter;$$('#evaluationFilters .chip').forEach(c=>c.classList.toggle('active',c===b));renderLibrary()});
    $('#saveNameBtn').addEventListener('click',()=>{const name=$('#settingsName').value.trim();if(!name){toast('Ingresá un nombre.',true);return;}config.name=name;saveAll();renderHome();toast('Nombre actualizado.')});
    $('#exportBtn').addEventListener('click',exportData); $('#importInput').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!validateImport(data))throw new Error();pendingImport=data;openModal('importModeModal')}catch{toast('El archivo no tiene una estructura de respaldo válida.',true)}finally{e.target.value=''}};r.readAsText(f)});
    $('#replaceImportBtn').addEventListener('click',()=>applyImport('replace')); $('#mergeImportBtn').addEventListener('click',()=>applyImport('merge'));
    $('#clearAllBtn').addEventListener('click',()=>confirmAction('Esta acción eliminará todos los anuncios guardados y no podrá deshacerse.','Eliminar todos',()=>{ads=[];saveAll();closeModals();renderAll();toast('Todos los anuncios fueron eliminados.')}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModals()});
  }
  function registerSW(){ if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }
  function init(){ setupEvents(); renderAll(); if(!config.welcomed) $('#welcomeOverlay').classList.remove('hidden'); registerSW(); }
  document.addEventListener('DOMContentLoaded',init);
})();
