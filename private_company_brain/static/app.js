let currentUser='u1';
let appUsers=[];
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];

async function api(url,opts){const r=await fetch(url,opts);if(!r.ok)throw new Error(await r.text());return r.json()}
function esc(s){return String(s??'').replace(/[&<>\'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]));}
function fmtDate(s){return s&&s!=='-'?new Date(s+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—'}
function initials(name=''){return String(name).split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase()||'U';}
function currentRole(users){return (users||[]).find(u=>u.id===currentUser)||null}
function showToast(message, tone='success'){
  const toast=$('#toast');
  if(!toast) return;
  toast.textContent=message;
  toast.className=`toast visible ${tone}`;
  window.clearTimeout(showToast.timer);
  showToast.timer=window.setTimeout(()=>toast.classList.remove('visible'),3200);
}

function updateUserDisplay(){
  const user=currentRole(appUsers); if(!user) return;
  const nameEl=$('#currentUserName');
  const roleEl=$('#currentUserRole');
  const avatarEl=$('#currentUserAvatar');
  if(nameEl) nameEl.textContent=user.name;
  if(roleEl) roleEl.textContent=`${user.role} · L${user.clearance} — ${user.department || 'Operations'}`;
  if(avatarEl) avatarEl.textContent=initials(user.name);
  const sel=$('#userSelect'); if(sel) sel.value=currentUser;
  $$('[data-user-id]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.userId===currentUser));
}

function closeUserMenu(){
  const menu=$('#accountMenu'); const toggle=$('#userMenuToggle');
  if(menu) menu.classList.add('hidden');
  if(toggle) toggle.setAttribute('aria-expanded','false');
}

async function boot(){
  appUsers=await api('/api/users');
  const sel=$('#userSelect');
  if(sel){
    sel.innerHTML=appUsers.map(u=>`<option value="${u.id}">${esc(u.name)} · ${esc(u.role)}</option>`).join('');
    sel.value=currentUser;
    sel.onchange=()=>{currentUser=sel.value; updateUserDisplay(); loadAll(); };
  }
  const menuList=$('#accountMenuList');
  if(menuList){
    menuList.innerHTML=appUsers.map(u=>`<button class="account-option ${u.id===currentUser?'selected':''}" type="button" data-user-id="${u.id}">
      <span class="avatar avatar-sm">${initials(u.name)}</span>
      <span class="account-copy"><strong>${esc(u.name)}</strong><small>${esc(u.role)} · L${u.clearance}</small></span>
    </button>`).join('');
    menuList.querySelectorAll('[data-user-id]').forEach(btn=>{
      btn.addEventListener('click',()=>{ currentUser=btn.dataset.userId; updateUserDisplay(); loadAll(); closeUserMenu(); });
    });
  }
  const toggle=$('#userMenuToggle');
  if(toggle){
    toggle.addEventListener('click',(event)=>{ event.stopPropagation(); const menu=$('#accountMenu'); if(!menu) return; menu.classList.toggle('hidden'); toggle.setAttribute('aria-expanded', String(!menu.classList.contains('hidden'))); });
  }
  document.addEventListener('click',(event)=>{
    const menu=$('#accountMenu'); const toggleBtn=$('#userMenuToggle');
    if(!menu || !toggleBtn) return;
    if(!menu.contains(event.target) && !toggleBtn.contains(event.target)) closeUserMenu();
  });
  $$('.nav').forEach(n=>n.addEventListener('click',()=>showPage(n.dataset.page)));
  const query=$('#query');
  if(query) query.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey) && event.key==='Enter'){
      event.preventDefault();
      askBrain();
    }
  });
  updateUserDisplay();
  loadAll();
}

function showPage(page){
  $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
  $$('.page').forEach(p=>p.classList.remove('active-page'));
  const target=$('#page-'+page); if(target) target.classList.add('active-page');
  const map={brain:['Company Brain','Living organizational memory under customer control'],memory:['Memory','Persistent organizational context'],decisions:['Decisions','Explainable institutional decision history'],graph:['Knowledge graph','Relationships behind enterprise data'],sources:['Sources & sync','Connectors, ingestion and freshness'],security:['Privacy & access','Customer-controlled intelligence']};
  const config=map[page]||map.brain;
  const title=$('#pageTitle'); const sub=$('#pageSub');
  if(title) title.textContent=config[0];
  if(sub) sub.textContent=config[1];
  if(page==='memory') loadMemories();
  if(page==='decisions') loadDecisions();
  if(page==='graph') renderGraph('#graphLarge');
  if(page==='sources') loadSources();
  if(page==='security') loadSecurity();
}

async function loadAll(){
  await Promise.all([
    loadStats(),
    loadRole(),
    renderGraph('#graph'),
    loadTimeline(),
    loadAccessDemo(),
    askBrain(),
    loadMemories(),
    loadDecisions(),
    loadSources(),
    loadSecurity(),
  ]);
  updateUserDisplay();
}

async function loadStats(){
  const d=await api('/api/stats');
  const indexed=$('#statIndexed'); if(indexed) indexed.textContent=d.indexed_objects.toLocaleString();
  const relations=$('#statRelations'); if(relations) relations.textContent=d.relationships.toLocaleString();
  const memory=$('#statMemory'); if(memory) memory.textContent=d.counts.memories.toLocaleString();
}

async function loadRole(){
  const u=await api('/api/access?user_id='+currentUser); const scope=$('#authScope');
  if(scope) scope.textContent=`CLEARANCE ${u.user.clearance} · ${u.user.department.toUpperCase()}`;
}

function fillQ(q){ $('#query').value=q; askBrain(); }

async function askBrain(){
  const wrap=$('#answerWrap'); const q=$('#query').value.trim(); if(!q) return;
  if(wrap){
    wrap.classList.remove('hidden');
    wrap.innerHTML='<div class="thinking"><span class="spinner"></span> Resolving entities · checking permissions · reconstructing memory · verifying evidence…</div>';
  }
  const d=await api('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:currentUser,query:q})});
  const qType=$('#queryType'); if(qType) qType.textContent=(d.mode||'summary').replaceAll('-',' · ').toUpperCase();
  const sources=(d.sources||[]).slice(0,6).map(s=>`<div class="source-row"><span class="source-kind">${esc(s.kind)}</span><div><b>${esc(s.title)}</b><span>${esc(s.source_system||'Internal')}</span></div><strong>${Math.round((s.score||.9)*100)}%</strong></div>`).join('');
  const mem=(d.memory||[]).slice(0,3).map(m=>`<div class="memory-mini"><span>${esc(m.memory_type.replaceAll('_',' '))}</span>${esc(m.text)}</div>`).join('');
  const timeline=(d.timeline||[]).slice(0,7).map(e=>`<div class="mini-event"><b>${fmtDate(e.date)}</b><span>${esc(e.title)}</span></div>`).join('');
  const cand=(d.candidates||[]).map(c=>`<div class="candidate"><div><b>${esc(c.name)}</b><span>${esc(c.role)}</span></div><strong>${c.score}</strong></div>`).join('');
  if(wrap){
    wrap.innerHTML=`<div class="answer-head"><div><div class="answer-title">Brain synthesis</div><div class="answer-sub">${esc(d.mode||'summary')} · retrieved under clearance ${currentUser}</div></div><div class="confidence"><b>${Math.round((d.confidence||0)*100)}%</b><span>confidence</span></div></div><div class="answer-grid"><div><div class="answer-text">${esc(d.answer||'')}</div>${(d.caveats||[]).map(c=>`<div class="caveat">⚠ ${esc(c)}</div>`).join('')} ${mem?`<div class="subhead">Persistent memory</div>${mem}`:''}</div><div><div class="subhead">Evidence chain</div>${sources||'<div class="empty">No authorized evidence found.</div>'}${cand?`<div class="subhead">Expert ranking</div>${cand}`:''}</div></div>${timeline?`<div class="subhead">Timeline reconstructed</div><div class="mini-timeline">${timeline}</div>`:''}`;
  }
}

async function loadTimeline(){
  const d=await api(`/api/timeline/p1?user_id=${currentUser}`);
  const target=$('#timeline'); if(!target) return;
  target.innerHTML=(d.events||[]).map(e=>`<div class="tl-item"><div class="tl-date">${fmtDate(e.date)}</div><div class="tl-pin ${e.kind||'event'}"></div><div><div class="tl-title">${esc(e.title)}</div><div class="tl-summary">${esc(e.summary)}</div></div></div>`).join('') || '<div class="empty">No timeline events visible.</div>';
}

async function renderGraph(targetSelector){
  const target=$(targetSelector); if(!target) return;
  const d=await api(`/api/graph?user_id=${currentUser}`);
  target.innerHTML='';
  const W=target.clientWidth||800; const H=target.classList.contains('graph-tall')?520:300;
  const pos={};
  const groups={person:(d.nodes||[]).filter(n=>n.type==='person'),project:(d.nodes||[]).filter(n=>n.type==='project'),customer:(d.nodes||[]).filter(n=>n.type==='customer')};
  const arrange=(arr)=>arr.forEach((n,i)=>pos[n.id]={x:(i+1)*W/(arr.length+1||2),y: i%2===0?60:120});
  arrange(groups.person); arrange(groups.project); arrange(groups.customer);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.classList.add('graph-svg');
  (d.edges||[]).forEach(edge=>{ if(!pos[edge.source]||!pos[edge.target]) return; const a=pos[edge.source], b=pos[edge.target]; const line=document.createElementNS(svg.namespaceURI,'line'); line.setAttribute('x1',a.x); line.setAttribute('y1',a.y); line.setAttribute('x2',b.x); line.setAttribute('y2',b.y); line.setAttribute('class','edge'); svg.appendChild(line); });
  (d.nodes||[]).forEach(node=>{ const p=pos[node.id]; if(!p) return; const g=document.createElementNS(svg.namespaceURI,'g'); g.setAttribute('transform',`translate(${p.x},${p.y})`); const c=document.createElementNS(svg.namespaceURI,'circle'); c.setAttribute('r',node.type==='project'?25:21); c.setAttribute('class','node-circle '+node.type); g.appendChild(c); const t=document.createElementNS(svg.namespaceURI,'text'); t.setAttribute('y',42); t.setAttribute('text-anchor','middle'); t.setAttribute('class','node-text'); t.textContent=node.label; g.appendChild(t); const s=document.createElementNS(svg.namespaceURI,'text'); s.setAttribute('y',57); s.setAttribute('text-anchor','middle'); s.setAttribute('class','node-meta'); s.textContent=node.meta; g.appendChild(s); svg.appendChild(g); });
  target.appendChild(svg);
}

async function loadAccessDemo(){
  const d=await api('/api/users');
  const target=$('#accessDemo'); if(!target) return;
  target.innerHTML=d.map(u=>`<div class="role-card ${u.id===currentUser?'selected':''}"><div class="avatar big ${u.clearance===4?'':u.clearance===3?'blue':'grey'}">${initials(u.name)}</div><div><b>${esc(u.name)}</b><span>${esc(u.role)} · clearance ${u.clearance}</span></div><div class="access-bar"><i style="width:${u.clearance*25}%"></i></div></div>`).join('')+'<p class="muted">Current identity is applied before retrieval and again before answer composition.</p>';
}

async function loadMemories(){
  const d=await api(`/api/memories?user_id=${currentUser}`);
  const ms=d.memories || [];
  const metrics=$('#memoryMetrics'); if(metrics){ metrics.innerHTML=[['CURRENT TRUTH',ms.filter(m=>m.memory_type==='current_truth').length],['DECISION REASONS',ms.filter(m=>m.memory_type==='decision_reason').length],['HIGH CONFIDENCE',ms.filter(m=>m.confidence>=.93).length]].map(x=>`<div class="metric"><span>${x[0]}</span><b>${x[1]}</b></div>`).join(''); }
  const list=$('#memoryList'); if(!list) return;
  list.innerHTML=ms.map(m=>{ const ids = Array.isArray(m.source_ids)?m.source_ids:JSON.parse(m.source_ids||'[]'); return `<article class="memory-card"><div class="memory-card-top"><span class="badge">${esc(m.memory_type.replaceAll('_',' '))}</span><span>${fmtDate(m.date_from)}${m.date_to?' → '+fmtDate(m.date_to):' → current'}</span><strong>${Math.round(m.confidence*100)}%</strong></div><p>${esc(m.text)}</p><div class="memory-foot"><span>${esc(m.subject_type)} · ${esc(m.subject_id)}</span><span>${ids.length} evidence links</span></div></article>`; }).join('') || '<div class="empty">No visible memories for this clearance.</div>';
}

async function loadDecisions(){
  const d=await api(`/api/decisions?user_id=${currentUser}`);
  const target=$('#decisionList'); if(!target) return;
  const userMap=new Map((appUsers||[]).map(u=>[u.id,u]));
  target.innerHTML=(d.decisions||[]).map(item=>{ const owner=userMap.get(item.owner_id) || {name:'Unknown'}; return `<article class="decision-card"><div class="decision-head"><div><span class="badge">${esc(item.status)}</span><h4>${esc(item.title)}</h4></div><strong>${fmtDate(item.date)}</strong></div><p>${esc(item.rationale)}</p><div class="decision-meta"><span>Owner: ${esc(owner.name)}</span><span>${(item.evidence_ids||[]).length} evidence items</span></div></article>`; }).join('') || '<div class="empty">No decisions available under this access scope.</div>';
}

async function loadSources(){
  const [connectors, syncRuns]=await Promise.all([api('/api/connectors'), api('/api/sync-runs?limit=6')]);
  const connectorGrid=$('#connectorGrid');
  if(connectorGrid){
    connectorGrid.innerHTML=(connectors.connectors||[]).map(c=>`<div class="connector-card">
      <div class="connector-top"><span class="badge">${esc(c.kind)}</span><span class="status-good">${esc(c.status)}</span></div>
      <h4>${esc(c.name)}</h4><p>${esc(c.description)}</p>
      <div class="connector-foot"><span>${Number(c.records).toLocaleString()} records</span><span>last sync ${fmtDate(c.last_sync?.slice(0,10))}</span></div>
      <button class="ghost sync-button" type="button" data-connector-id="${esc(c.id)}">Sync now</button>
    </div>`).join('');
    connectorGrid.querySelectorAll('[data-connector-id]').forEach(button=>{
      button.addEventListener('click',()=>syncConnector(button.dataset.connectorId,button));
    });
  }
  const syncList=$('#syncRuns'); if(syncList){ syncList.innerHTML=(syncRuns.runs||[]).map(r=>`<div class="sync-row"><div><strong>${esc(r.connector_id)}</strong><span>${esc(r.notes)}</span></div><div class="sync-stats"><b>${Number(r.records_ingested).toLocaleString()}</b><small>${esc(r.status)}</small></div></div>`).join(''); }
}

async function syncConnector(connectorId, button){
  if(!connectorId) return;
  const original=button?.textContent || 'Sync now';
  if(button){
    button.disabled=true;
    button.textContent='Syncing…';
  }
  try{
    const result=await api(`/api/connectors/${encodeURIComponent(connectorId)}/sync`,{method:'POST'});
    showToast(`${result.records_ingested.toLocaleString()} records synced locally.`);
    await loadSources();
    await loadStats();
  }catch(error){
    showToast('Sync failed. The local connector was not changed.','error');
    console.error(error);
    if(button){
      button.disabled=false;
      button.textContent=original;
    }
  }
}

async function loadSecurity(){
  const data=await api('/api/access?user_id='+currentUser);
  const target=$('#permissionMatrix'); if(!target) return;
  const rows=[{level:1,label:'Public'},{level:2,label:'Internal'},{level:3,label:'Confidential'},{level:4,label:'Restricted'}];
  const currentLevel=data.user?.clearance || 1;
  target.innerHTML=`<div class="matrix-grid">${rows.map(r=>`<div class="matrix-row ${r.level <= currentLevel ? 'enabled' : ''}"><span>${r.label}</span><strong>L${r.level}</strong></div>`).join('')}</div>`;
}

window.addEventListener('DOMContentLoaded', boot);
