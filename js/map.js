/* map.js – curriculum map page (index.html).
   Behaviour ported 1:1 from the single-file version; roadmap links added. */
(function(){
"use strict";
var B = window.BSIS, $ = B.$, esc = B.esc, ICON_COPY = B.ICON_COPY, ICON_ROUTE = B.ICON_ROUTE;
var DATA = window.CURRICULUM;
var PILO = DATA.pilo, COURSES = DATA.courses;
var ORDER = {I:1,E:2,D:3};
var fmt = 'num';
var saved = B.store.get('bsis-fmt'); if(saved==='code'||saved==='num') fmt=saved;

/* ---------- derived data ---------- */
COURSES.forEach(function(c){
  var rows = c.mode==='course' ? [c.codes] : c.codes;
  c.union = [];
  for(var i=0;i<10;i++){
    var set = {};
    rows.forEach(function(r){ if(r[i]) set[r[i]]=1; });
    c.union.push(Object.keys(set).sort(function(a,b){return ORDER[a]-ORDER[b]}));
  }
  c.piloIdx = [];
  c.union.forEach(function(u,i){ if(u.length) c.piloIdx.push(i); });
  c.hay = [c.code, c.title, c.pre, String(c.units)]
    .concat(c.los)
    .concat(c.piloIdx.map(function(i){return PILO[i].code+' '+PILO[i].attr+' '+PILO[i].text}))
    .join(' \n ').toLowerCase();
  c.rm = B.manifestFor(B.slug(c.code)) || null;   // roadmap (if an OBTL was added)
});
function rmOf(c){ return c.rm; }

/* ---------- copy text ---------- */
function piloLines(idxs){
  return idxs.map(function(i,n){
    var p=PILO[i];
    return fmt==='code' ? (p.code+' – '+p.text) : ((n+1)+'. '+p.text);
  }).join('\n');
}
function courseText(c){
  var out = [c.code+' – '+c.title, 'Units: '+c.units, 'Pre-requisite: '+c.pre];
  if(c.los.length){ out.push('', 'Course Learning Outcomes:'); c.los.forEach(function(t,i){ out.push('LO'+(i+1)+'. '+t); }); }
  return out.join('\n');
}
function losText(c){ return c.los.map(function(t,i){return 'LO'+(i+1)+'. '+t}).join('\n'); }

/* ---------- state ---------- */
var query='', activePilo=-1, onlyRm=false;

function tokens(){ return query.toLowerCase().split(/\s+/).filter(Boolean); }
function rmHay(c){ return c.rm && c.rm.hay ? c.rm.hay.toLowerCase() : ''; }
function matches(c){
  if(onlyRm && !c.rm) return false;
  if(activePilo>=0 && !c.union[activePilo].length) return false;
  var t=tokens(), rh=rmHay(c);
  for(var i=0;i<t.length;i++){ if(c.hay.indexOf(t[i])<0 && rh.indexOf(t[i])<0) return false; }
  return true;
}
function snippet(c){
  var t=tokens(); if(!t.length) return '';
  var head=(c.code+' '+c.title+' '+c.pre).toLowerCase();
  if(t.every(function(x){return head.indexOf(x)>=0})) return '';
  for(var i=0;i<c.los.length;i++){
    var lo=c.los[i].toLowerCase();
    if(t.some(function(x){return lo.indexOf(x)>=0})) return 'LO'+(i+1)+': '+c.los[i];
  }
  for(var j=0;j<c.piloIdx.length;j++){
    var p=PILO[c.piloIdx[j]], ph=(p.code+' '+p.attr+' '+p.text).toLowerCase();
    if(t.some(function(x){return ph.indexOf(x)>=0})) return p.code+': '+p.text;
  }
  var rh=rmHay(c);
  if(rh && t.some(function(x){return rh.indexOf(x)>=0})){
    var parts=c.rm.hay.split(' \n ');
    for(var k=0;k<parts.length;k++){
      var pl=parts[k].toLowerCase();
      if(t.some(function(x){return pl.indexOf(x)>=0})) return 'Roadmap: '+parts[k];
    }
    return 'Roadmap topic';
  }
  return '';
}

/* ---------- table ---------- */
function renderHead(){
  var h='<tr><th scope="col">Code</th><th scope="col">Course</th><th scope="col">Pre-requisite</th><th scope="col" style="text-align:center">Units</th>';
  PILO.forEach(function(p,i){
    h+='<th class="p'+(i===activePilo?' hl':'')+'" scope="col"><button type="button" data-p="'+i+'" aria-pressed="'+(i===activePilo)+'" title="'+esc(p.code+' – '+p.text)+'">'+p.code+'</button></th>';
  });
  h+='<th scope="col"></th></tr>';
  $('thead').innerHTML=h;
}
function cellHTML(u){
  if(!u.length) return '';
  var top=u[u.length-1];
  return '<span class="cell '+top+(u.length>1?' x':'')+'">'+u.join('/')+'</span>';
}
function rmButton(c, cls){
  var s=B.summary(c.rm.slug), extra = s && s.pct ? ' <span class="pct">'+s.pct+'%</span>' : '';
  return '<a class="iconbtn rm'+(cls||'')+'" href="roadmap.html?c='+encodeURIComponent(c.rm.slug)+'" title="Open the roadmap of '+esc(c.code)+'">'+ICON_ROUTE+'<span>Roadmap</span>'+extra+'</a>';
}
function renderRows(){
  var list=COURSES.filter(matches), h='';
  list.forEach(function(c){
    var sn=snippet(c);
    h+='<tr tabindex="0" data-code="'+c.code+'" aria-label="'+esc(c.code+' '+c.title)+'">'
      +'<td class="code">'+esc(c.code)+'</td>'
      +'<td class="title">'+esc(c.title)+(sn?'<span class="snip">'+esc(sn)+'</span>':'')+'</td>'
      +'<td class="pre">'+esc(c.pre)+'</td>'
      +'<td class="u">'+c.units+'</td>';
    for(var i=0;i<10;i++) h+='<td class="p'+(i===activePilo?' hl':'')+'">'+cellHTML(c.union[i])+'</td>';
    h+='<td class="act">'+(rmOf(c)?rmButton(c):'')
      +'<button class="iconbtn" type="button" data-copy="pilo" data-code="'+c.code+'" title="Copy the PILO of '+esc(c.code)+'">'+ICON_COPY+'<span>PILO</span></button></td></tr>';
  });
  $('tbody').innerHTML=h;
  $('empty').hidden = list.length>0;
  $('map').style.display = list.length? '' : 'none';
  var m='<span>'+list.length+' of '+COURSES.length+' courses</span>';
  if(activePilo>=0){
    m+='<span class="chip">Mapped to '+PILO[activePilo].code+' <button type="button" id="unfilter" aria-label="Remove filter '+PILO[activePilo].code+'">✕</button></span>';
  }
  $('meta').innerHTML=m;
  var u=$('unfilter'); if(u) u.onclick=function(){activePilo=-1; renderAll();};
}
function renderAll(){ renderHead(); renderRows(); }

/* ---------- PILO reference ---------- */
function renderPiloRef(){
  var h='';
  PILO.forEach(function(p,i){
    h+='<div class="pilo" id="pilo-'+p.code+'"><div><div class="c">'+p.code+'</div></div>'
      +'<div><div class="a">'+esc(p.attr)+'</div><p class="t">'+esc(p.text)+'</p></div>'
      +'<button class="iconbtn" type="button" data-copy="piloOne" data-i="'+i+'">'+ICON_COPY+'<span>Copy</span></button></div>';
  });
  $('pilolist').innerHTML=h;
  $('copyAllPilo').innerHTML=ICON_COPY+'<span>Copy all 10 PILO</span>';
}

/* ---------- roadmap cards ---------- */
function renderCards(){
  B.renderRoadmapCards($('rmcards'), function(m){
    return COURSES.some(function(c){ return B.slug(c.code)===m.slug; });
  });
}

/* ---------- drawer ---------- */
var lastFocus=null, openCode=null;
function byCode(code){ return COURSES.filter(function(x){return x.code===code})[0]; }
function openDrawer(code, push){
  var c=byCode(code); if(!c) return;
  openCode=code; lastFocus=document.activeElement;
  $('dCode').textContent=c.code;
  $('dTitle').textContent=c.title;
  $('dFacts').innerHTML='<span><b>'+c.units+'</b> units</span><span>Pre-requisite: <b>'+esc(c.pre)+'</b></span><span class="small">CMO p. '+c.page+'</span>';
  var b='<div class="actions">'
    +'<button class="btn primary" type="button" data-copy="piloD">'+ICON_COPY+'<span>Copy PILO</span></button>'
    +'<button class="btn" type="button" data-copy="courseD">'+ICON_COPY+'<span>Copy course</span></button>'
    +(c.los.length?'<button class="btn" type="button" data-copy="losD">'+ICON_COPY+'<span>Copy outcomes</span></button>':'')
    +'</div><p class="small" style="margin:6px 0 0">“Copy course” = code, title, units, pre-requisite and learning outcomes.</p>';

  if(c.rm){
    var s=B.summary(c.rm.slug);
    b+='<div class="rmbox"><p><b>Roadmap available</b><br><span class="small">'+c.rm.weekGroups+' weekly units · '+c.rm.topics+' topics · '+c.rm.assessments+' assessments'
      +(s?' · '+s.pct+'% done':'')+'</span></p>'
      +'<a class="btn primary" href="roadmap.html?c='+encodeURIComponent(c.rm.slug)+'">'+ICON_ROUTE+'<span>Open roadmap</span></a></div>';
  } else {
    b+='<div class="rmbox none"><p class="small">No roadmap yet – it is created when the OBTL of this course is added.</p></div>';
  }

  b+='<div class="sec"><h3><span>Course learning outcomes</span></h3>';
  if(!c.los.length){
    b+='<p class="small">The CMO map lists no learning outcomes for this course.</p>';
  } else {
    c.los.forEach(function(t,i){
      b+='<div class="lo"><div class="n">LO'+(i+1)+'</div><div><p>'+esc(t)+'</p>';
      if(c.mode==='lo'){
        b+='<div class="codes">'+codesChips(c.codes[i])+'</div>';
      }
      b+='</div><button class="iconbtn" type="button" data-copy="loOne" data-i="'+i+'" title="Copy LO'+(i+1)+'">'+ICON_COPY+'<span>Copy</span></button></div>';
    });
  }
  b+='</div>';

  b+='<div class="sec"><h3><span>PILO map</span></h3>'+miniTable(c)+'</div>';

  b+='<div class="sec"><h3><span>Mapped PILO ('+c.piloIdx.length+')</span></h3>';
  c.piloIdx.forEach(function(i){
    var p=PILO[i];
    b+='<div class="dp"><div class="c">'+p.code+'</div><div><div class="a">'+esc(p.attr)+'</div><p>'+esc(p.text)+'</p>'
      +'<div class="l">'+c.union[i].map(function(l){return '<span class="cell '+l+'">'+l+'</span>'}).join('')+'</div></div>'
      +'<button class="iconbtn" type="button" data-copy="piloOne" data-i="'+i+'">'+ICON_COPY+'<span>Copy</span></button></div>';
  });
  b+='</div>';
  if(c.mode==='course' && c.los.length>1){
    b+='<p class="small" style="margin-top:18px">The CMO prints one set of codes for all learning outcomes of this course.</p>';
  }
  $('dBody').innerHTML=b;
  $('dBody').scrollTop=0;
  $('scrim').classList.add('on'); $('drawer').classList.add('on'); $('drawer').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  if(push!==false){ try{ history.replaceState(null,'','#'+code); }catch(e){ location.hash=code; } }
  setTimeout(function(){ $('dClose').focus(); },30);
}
function codesChips(r){
  var h='';
  r.forEach(function(l,i){ if(l) h+='<span class="cell '+l+'" title="'+esc(PILO[i].text)+'">'+PILO[i].code+' · '+l+'</span>'; });
  return h || '<span class="small">No code printed</span>';
}
function miniTable(c){
  var h='<table class="mini"><thead><tr><th></th>'+PILO.map(function(p){return '<th>'+p.code.replace('IS','')+'</th>'}).join('')+'</tr></thead><tbody>';
  if(c.mode==='course'){
    h+='<tr><td>'+(c.los.length>1?'All LOs':(c.los.length?'LO1':'Course'))+'</td>'+c.codes.map(function(l){return '<td class="'+l+'">'+l+'</td>'}).join('')+'</tr>';
  } else {
    c.codes.forEach(function(r,i){ h+='<tr><td>LO'+(i+1)+'</td>'+r.map(function(l){return '<td class="'+l+'">'+l+'</td>'}).join('')+'</tr>'; });
  }
  h+='</tbody></table><p class="small" style="margin:6px 0 0">Columns 01–10 = IS01–IS10.</p>';
  return h;
}
function closeDrawer(){
  if(!$('drawer').classList.contains('on')) return;
  $('scrim').classList.remove('on'); $('drawer').classList.remove('on'); $('drawer').setAttribute('aria-hidden','true');
  document.body.style.overflow=''; openCode=null;
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
  if(lastFocus && lastFocus.focus) lastFocus.focus();
}

/* ---------- events ---------- */
document.addEventListener('click',function(ev){
  var t=ev.target;
  var cp=t.closest('[data-copy]');
  if(cp){
    ev.stopPropagation();
    var kind=cp.getAttribute('data-copy'), c, i;
    if(kind==='pilo'){ c=byCode(cp.getAttribute('data-code')); B.copy(piloLines(c.piloIdx), cp, 'PILO of '+c.code); }
    else if(kind==='piloD'){ c=byCode(openCode); B.copy(piloLines(c.piloIdx), cp, 'PILO of '+c.code); }
    else if(kind==='courseD'){ c=byCode(openCode); B.copy(courseText(c), cp, c.code+' details'); }
    else if(kind==='losD'){ c=byCode(openCode); B.copy(losText(c), cp, 'Outcomes'); }
    else if(kind==='loOne'){ c=byCode(openCode); i=+cp.getAttribute('data-i'); B.copy('LO'+(i+1)+'. '+c.los[i], cp, 'LO'+(i+1)); }
    else if(kind==='piloOne'){ i=+cp.getAttribute('data-i'); B.copy(fmt==='code'? PILO[i].code+' – '+PILO[i].text : PILO[i].text, cp, PILO[i].code); }
    return;
  }
  if(t.closest('a.rm')) return;                     // roadmap link: let the browser navigate
  var ph=t.closest('th.p button');
  if(ph){ var i2=+ph.getAttribute('data-p'); activePilo = (activePilo===i2)? -1 : i2; renderAll(); return; }
  var tr=t.closest('#tbody tr');
  if(tr){ openDrawer(tr.getAttribute('data-code')); return; }
  if(t===$('scrim')||t.closest('#dClose')) closeDrawer();
});
$('copyAllPilo').addEventListener('click',function(){
  var all=PILO.map(function(_,i){return i});
  B.copy(piloLines(all), this, 'All PILO');
});
$('tbody').addEventListener('keydown',function(ev){
  if((ev.key==='Enter'||ev.key===' ') && ev.target.matches('tr')){ ev.preventDefault(); openDrawer(ev.target.getAttribute('data-code')); }
});
document.addEventListener('keydown',function(ev){
  if(ev.key==='Escape') closeDrawer();
  if(ev.key==='/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !$('drawer').classList.contains('on')){ ev.preventDefault(); $('q').focus(); $('q').select(); }
  if(ev.key==='Tab' && $('drawer').classList.contains('on')){
    var f=$('drawer').querySelectorAll('button, a[href]'); if(!f.length) return;
    var first=f[0], last=f[f.length-1];
    if(ev.shiftKey && document.activeElement===first){ ev.preventDefault(); last.focus(); }
    else if(!ev.shiftKey && document.activeElement===last){ ev.preventDefault(); first.focus(); }
  }
});
$('q').addEventListener('input',function(){
  query=this.value; $('clear').style.display=query?'block':'none'; renderRows();
});
$('clear').addEventListener('click',function(){ $('q').value=''; query=''; this.style.display='none'; renderRows(); $('q').focus(); });
$('onlyRm').addEventListener('click',function(){
  onlyRm=!onlyRm; this.setAttribute('aria-pressed',onlyRm); renderRows();
});
function setFmt(f){
  fmt=f; $('fmtNum').setAttribute('aria-pressed',f==='num'); $('fmtCode').setAttribute('aria-pressed',f==='code');
  B.store.set('bsis-fmt',f);
}
$('fmtNum').onclick=function(){setFmt('num')}; $('fmtCode').onclick=function(){setFmt('code')};
window.addEventListener('hashchange',function(){
  var h=location.hash.replace('#','');
  if(h && byCode(h)) openDrawer(h,false); else if(!h) closeDrawer();
});
/* progress may have changed in another tab / after coming back from a roadmap */
window.addEventListener('pageshow',function(){ renderRows(); renderCards(); });

/* ---------- init ---------- */
setFmt(fmt);
renderPiloRef();
renderAll();
renderCards();
var h0=location.hash.replace('#','');
if(h0 && byCode(h0)) openDrawer(h0,false);
})();
