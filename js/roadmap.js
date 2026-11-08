/* roadmap.js – interactive course roadmap (roadmap.html?c=<SLUG>)
   Reads window.ROADMAPS[slug] (generated from the OBTL by source/build.py). */
(function(){
"use strict";
var B = window.BSIS, $ = B.$, esc = B.esc, ICON_OK = B.ICON_OK;
var MOBILE = window.matchMedia('(max-width:819px)');

/* ---------- which roadmap? ---------- */
var params = new URLSearchParams(location.search);
var slug = B.slug(params.get('c') || '');

function showMsg(html){ var m=$('msg'); m.innerHTML=html; m.hidden=false; }
function showHub(){
  $('hub').hidden=false;
  B.renderRoadmapCards($('rmcards'), function(m){
    return (window.CURRICULUM||{courses:[]}).courses.some(function(c){ return B.slug(c.code)===m.slug; });
  });
  $('head').innerHTML='<p class="eyebrow">City College of Calapan · BSIS</p><h1>Course Roadmaps</h1><p class="sub">Interactive study paths generated from each course\'s OBTL</p>';
  document.title='Course Roadmaps · BSIS Curriculum Map';
}

if(!slug){ showHub(); return; }
var entry = B.manifestFor(slug);
if(!entry){
  showHub();
  showMsg('No roadmap named <b>'+esc(params.get('c'))+'</b> was found. Pick one below.');
  return;
}
var s = document.createElement('script');
s.src = 'js/roadmaps/'+encodeURIComponent(slug)+'.js';
s.onload = function(){
  var d = (window.ROADMAPS||{})[slug];
  if(d) start(d); else { showHub(); showMsg('The roadmap file for <b>'+esc(slug)+'</b> is empty.'); }
};
s.onerror = function(){ showHub(); showMsg('The roadmap file for <b>'+esc(slug)+'</b> could not be loaded.'); };
document.head.appendChild(s);

/* ======================================================= */
function start(D){
  var items = D.items, store = B.progressKey(slug);
  var nodes = {}, order = [];          // id -> node info, reading order
  var state = B.getJSON(store, {}) || {};
  var inMap = ((window.CURRICULUM||{}).courses||[]).filter(function(c){ return B.slug(c.code)===slug; })[0] || null;

  /* ---------- model ---------- */
  items.forEach(function(it){
    if(it.type==='exam'){
      nodes[it.id] = {id:it.id, kind:'exam', item:it, text:it.name, hay:(it.name+' '+it.mode).toLowerCase()};
      order.push(it.id); it.leaves=[]; return;
    }
    it.leaves = [];
    nodes[it.id] = {id:it.id, kind:'week', item:it, text:it.topics[0]||('Week '+it.label),
      hay:('week '+it.label+' '+it.topics[0]+' '+it.ilo).toLowerCase()};
    order.push(it.id);
    it.topics.forEach(function(t,i){
      if(i===0) return;
      var id=it.id+':t'+i;
      nodes[id]={id:id,kind:'topic',item:it,text:t,hay:t.toLowerCase()}; order.push(id); it.leaves.push(id);
    });
    it.at.forEach(function(a,i){
      var id=it.id+':a'+i;
      nodes[id]={id:id,kind:'at',item:it,text:a.text,mco:a.mco,hay:a.text.toLowerCase()}; order.push(id); it.leaves.push(id);
    });
  });

  function own(id){ return state[id]||''; }
  function status(id){
    var n=nodes[id];
    if(n.kind==='week' && n.item.leaves.length){
      var ls=n.item.leaves.map(own), act=ls.filter(function(x){return x!=='skip'});
      if(!act.length) return 'skip';
      if(act.every(function(x){return x==='done'})) return 'done';
      if(act.some(function(x){return x==='done'||x==='prog'}) || own(id)==='prog') return 'prog';
      return '';
    }
    return own(id);
  }
  function setStatus(id, st){
    var n=nodes[id];
    function put(k,v){ if(v) state[k]=v; else delete state[k]; }
    put(id, st);
    if(n.kind==='week' && st!=='prog') n.item.leaves.forEach(function(l){ put(l, st); });
    B.setJSON(store, state);
    refresh();
  }
  function progress(){
    var done=0, total=0;
    items.forEach(function(it){
      var ids = (it.type==='week' && it.leaves.length) ? it.leaves : [it.id];
      ids.forEach(function(id){ var st=own(id); if(st==='skip') return; total++; if(st==='done') done++; });
    });
    return {done:done,total:total,pct: total? Math.round(done*100/total) : 0};
  }

  /* ---------- header ---------- */
  function renderHead(){
    var p = progress();
    var h='<div class="rhead"><div class="txt"><p class="eyebrow">'+esc(D.code)+(D.term?' · '+esc(D.term):'')+'</p>'
      +'<h1>'+esc(D.title)+'</h1>'
      +'<div class="meta2"><span><b>'+esc(D.units)+'</b> units</span>'
      +(D.prereq?'<span>Pre-requisite: <b>'+esc(D.prereq)+'</b></span>':'')
      +(D.preparedBy?'<span>Prepared by <b>'+esc(D.preparedBy)+'</b></span>':'')+'</div>'
      +'<div class="links">';
    if(inMap){
      h+='<a class="btn" href="index.html#'+encodeURIComponent(inMap.code)+'">View in curriculum map</a>';
      mappedPilo(inMap).forEach(function(m){
        h+='<a class="pchip" href="index.html#pilo-'+m.code+'" title="'+esc(m.text)+'">'+m.code+' · '+m.letters+'</a>';
      });
    } else {
      h+='<span class="tag-note" title="This course is not part of the CMO curriculum map">elective · not in the CMO map</span>';
    }
    h+='</div></div>'
      +'<div class="ring" aria-label="Progress"><svg viewBox="0 0 76 76" aria-hidden="true"><circle class="bg" cx="38" cy="38" r="32" fill="none" stroke-width="8"/><circle class="fg" id="ringfg" cx="38" cy="38" r="32" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="0 201.06"/></svg>'
      +'<div><div class="num" id="ringnum"></div><div class="cap" id="ringcap"></div></div></div></div>';
    $('head').innerHTML=h;
    document.title = D.code+' roadmap · BSIS Curriculum Map';
  }
  function mappedPilo(c){
    var P=window.CURRICULUM.pilo, rows = c.mode==='course' ? [c.codes] : c.codes, ord={I:1,E:2,D:3}, out=[];
    for(var i=0;i<10;i++){
      var set={}; rows.forEach(function(r){ if(r[i]) set[r[i]]=1; });
      var ls=Object.keys(set).sort(function(a,b){return ord[a]-ord[b]});
      if(ls.length) out.push({code:P[i].code,text:P[i].text,letters:ls.join('/')});
    }
    return out;
  }

  /* ---------- flow ---------- */
  function checkBtn(id){
    return '<button type="button" class="chk" data-chk="'+id+'" aria-label="Toggle done" title="Mark as done">'+ICON_OK+'</button>';
  }
  function nodeHTML(id){
    var n=nodes[id], t=esc(n.text), cls='node '+(n.kind==='week'?'main':n.kind==='topic'?'sub':n.kind==='at'?'at':'exam');
    var inner;
    if(n.kind==='week'){
      var it=n.item, wk=(it.start!==it.end?'Weeks ':'Week ')+esc(it.label);
      var cnt=function(a){ return a.length; };
      inner='<span class="eyebrow2">'+wk+'</span>'+t
        +'<span class="pills">'
        +(it.tla.f2f.length?'<span class="pill">F2F '+cnt(it.tla.f2f)+'</span>':'')
        +(it.tla.async.length?'<span class="pill">Async '+cnt(it.tla.async)+'</span>':'')
        +(it.tla.sync.length?'<span class="pill">Sync '+cnt(it.tla.sync)+'</span>':'')
        +'</span>';
    } else if(n.kind==='at'){
      inner=(n.mco?'<span class="mco" title="Module course outcome '+n.mco+'">MCO'+n.mco+'</span>':'')+t.replace(/^MCO\s*\d\s*[:\-–.]?\s*/,'');
    } else if(n.kind==='exam'){
      inner='<span class="eyebrow2">Examination</span>'+t;
    } else inner=t;
    return '<div class="'+cls+'" role="button" tabindex="0" data-id="'+id+'" data-hay="'+esc(n.hay)+'">'+checkBtn(id)+'<span class="tx">'+inner+'</span></div>';
  }
  function renderFlow(){
    var h='';
    items.forEach(function(it){
      if(it.type==='exam'){
        h+='<div class="row" data-w="'+it.id+'"><div class="col l"></div><div class="mainwrap">'+nodeHTML(it.id)+'</div><div class="col r"></div></div>';
        return;
      }
      var L='',R='';
      it.leaves.forEach(function(l){ if(nodes[l].kind==='topic') L+=nodeHTML(l); else R+=nodeHTML(l); });
      h+='<div class="row" data-w="'+it.id+'"><div class="col l">'+L+'</div><div class="mainwrap">'+nodeHTML(it.id)+'</div><div class="col r">'+R+'</div></div>';
    });
    $('rows').innerHTML=h;
  }

  /* connectors (desktop only) */
  var drawQueued=false;
  function queueDraw(){ if(drawQueued) return; drawQueued=true; requestAnimationFrame(function(){ drawQueued=false; draw(); }); }
  function el(id){ return document.querySelector('.node[data-id="'+id+'"]'); }
  function draw(){
    var svg=$('links'); if(MOBILE.matches){ svg.innerHTML=''; return; }
    var fr=$('flow').getBoundingClientRect(), p='';
    function pt(r,side){ return side==='l'? [r.left-fr.left, r.top-fr.top+r.height/2] : side==='r'? [r.right-fr.left, r.top-fr.top+r.height/2]
      : side==='t'? [r.left-fr.left+r.width/2, r.top-fr.top] : [r.left-fr.left+r.width/2, r.bottom-fr.top]; }
    var prev=null;
    items.forEach(function(it){
      var m=el(it.id); if(!m) return;
      var mr=m.getBoundingClientRect();
      if(prev){
        var a=pt(prev.r,'b'), b=pt(mr,'t');
        p+='<path class="spine'+(prev.done&&status(it.id)==='done'?' done':'')+'" d="M'+a[0]+','+a[1]+' L'+b[0]+','+b[1]+'"/>';
      }
      prev={r:mr, done:status(it.id)==='done'};
      (it.leaves||[]).forEach(function(l){
        var e=el(l); if(!e || e.offsetParent===null) return;
        var r=e.getBoundingClientRect(), left=nodes[l].kind==='topic';
        var a=pt(mr,left?'l':'r'), b=pt(r,left?'r':'l'), mx=(a[0]+b[0])/2;
        p+='<path class="side lk-'+(left?'l':'r')+(status(l)==='done'?' done':'')+'" d="M'+a[0]+','+a[1]+' C'+mx+','+a[1]+' '+mx+','+b[1]+' '+b[0]+','+b[1]+'"/>';
      });
    });
    svg.innerHTML=p;
  }

  /* ---------- refresh (status colours, ring, timeline, summary) ---------- */
  function refresh(){
    Object.keys(nodes).forEach(function(id){
      var e=el(id); if(!e) return;
      var st=status(id);
      e.classList.toggle('done',st==='done'); e.classList.toggle('prog',st==='prog'); e.classList.toggle('skip',st==='skip');
      var c=e.querySelector('.chk'); if(c){ c.title = st==='done'?'Mark as not done':'Mark as done'; c.setAttribute('aria-pressed', st==='done'); }
    });
    var p=progress();
    B.setJSON(B.summaryKey(slug), {pct:p.pct, done:p.done, total:p.total});
    var fg=$('ringfg'); if(fg){ fg.setAttribute('stroke-dasharray', (201.06*p.pct/100).toFixed(2)+' 201.06'); }
    if($('ringnum')){ $('ringnum').textContent=p.pct+'%'; $('ringcap').textContent=p.done+' of '+p.total+' done'; }
    document.querySelectorAll('.tl').forEach(function(b){
      var st=status(b.getAttribute('data-id'));
      b.classList.toggle('done',st==='done'); b.classList.toggle('prog',st==='prog'); b.classList.toggle('skip',st==='skip');
    });
    if(openId) renderDrawerStatus();
    queueDraw();
  }

  /* ---------- overview: timeline, heat matrix, grading ---------- */
  function short(it){
    if(it.type==='exam') return it.id==='prelim'?'Pre':it.id==='midterm'?'Mid':it.id==='final'?'Fin':it.name.slice(0,3);
    return it.label;
  }
  function renderTimeline(){
    var h='';
    items.forEach(function(it){
      var span = it.type==='exam' ? 1 : Math.max(1,(it.end-it.start)+1);
      h+='<button type="button" class="tl'+(it.type==='exam'?' exam':'')+'" style="--span:'+span+'" data-id="'+it.id+'" title="'
        +esc(it.type==='exam'?it.name:'Week '+it.label+': '+(it.topics[0]||''))+'">'+esc(short(it))+'</button>';
    });
    $('timeline').innerHTML=h;
    $('tlLegend').innerHTML='<span><i class="sw main"></i>Week / unit</span><span><i class="sw exam"></i>Examination</span><span><i class="sw done"></i>Done</span><span><i class="sw prog"></i>In progress</span>';
  }
  function renderHeat(){
    var rowsDef=[['F2F','f2f'],['Async','async'],['Sync','sync'],['Assess.','at']];
    var counts=rowsDef.map(function(r){
      return items.map(function(it){
        if(it.type==='exam') return r[1]==='at'?1:0;
        return r[1]==='at'? it.at.length : it.tla[r[1]].length;
      });
    });
    var max=1; counts.forEach(function(r){ r.forEach(function(n){ if(n>max) max=n; }); });
    var cols=items.length;
    var h='<div style="display:grid;grid-template-columns:62px repeat('+cols+',minmax(26px,1fr));gap:3px;min-width:'+(62+cols*30)+'px">';
    h+='<div></div>'+items.map(function(it){ return '<div class="ch">'+esc(short(it))+'</div>'; }).join('');
    rowsDef.forEach(function(r,ri){
      h+='<div class="rl">'+r[0]+'</div>';
      items.forEach(function(it,ci){
        var n=counts[ri][ci];
        h+='<button type="button" class="hc" data-n="'+n+'" data-id="'+it.id+'" '+(n?'':'tabindex="-1" aria-hidden="true" ')
          +'style="'+(n?'opacity:'+(0.35+0.65*n/max).toFixed(2):'')+'" title="'+esc(r[0]+' · '+(it.type==='exam'?it.name:'Week '+it.label)+': '+n)+'">'+(n||'')+'</button>';
      });
    });
    h+='</div>';
    $('heat').innerHTML=h;
  }
  var GCOL=['#2451c6','#1d7a46','#b45309','#7a3fb5'];
  function renderGrading(){
    var g=D.grading, box=$('grading');
    if(!g.components.length){ box.innerHTML='<p class="small">The OBTL lists no grading components.</p>'; return; }
    var R=54, C=2*Math.PI*R, off=0, circles='', legend='';
    g.components.forEach(function(c,i){
      var len=C*c.pct/100;
      circles+='<circle data-gi="'+i+'" cx="75" cy="75" r="'+R+'" stroke="'+GCOL[i%4]+'" stroke-dasharray="'+len.toFixed(2)+' '+(C-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'"><title>'+esc(c.label)+' '+c.pct+'%</title></circle>';
      off+=len;
      legend+='<div data-gi="'+i+'"><i style="background:'+GCOL[i%4]+'"></i>'+esc(c.label)+'<b>'+c.pct+'%</b></div>';
    });
    var h='<div class="donut"><svg viewBox="0 0 150 150" role="img" aria-label="Grading distribution">'+circles+'</svg><div class="mid"><b id="gmb">100%</b><span id="gms">Total</span></div></div>'
      +'<div class="glegend">'+legend+'</div>';
    if(g.breakdown.length){
      var sc=['#5d7fd8','#4aa57a','#d99a4a'];
      h+='<div class="gsub"><p>Class Standing breakdown</p><div class="stack">'
        +g.breakdown.map(function(b,i){ return '<span style="flex:'+b.pct+';background:'+sc[i%3]+'" title="'+esc(b.label+(b.detail?' – '+b.detail:'')+' '+b.pct+'%')+'">'+b.pct+'%</span>'; }).join('')
        +'</div>'
        +g.breakdown.map(function(b){ return '<p><b>'+esc(b.label)+' '+b.pct+'%</b>'+(b.detail?' – '+esc(b.detail):'')+'</p>'; }).join('')+'</div>';
    }
    box.innerHTML=h;
    function hover(i){
      var c=g.components[i];
      $('gmb').textContent = c? c.pct+'%' : '100%'; $('gms').textContent = c? c.label : 'Total';
      box.querySelectorAll('circle').forEach(function(x){ x.classList.toggle('on', c && +x.getAttribute('data-gi')===i); });
    }
    box.querySelectorAll('[data-gi]').forEach(function(x){
      x.addEventListener('mouseenter',function(){ hover(+x.getAttribute('data-gi')); });
      x.addEventListener('mouseleave',function(){ hover(-1); });
    });
  }

  /* ---------- about / readings ---------- */
  function ri(s){ return String(s).replace(/<(?!\/?i>)[^>]*>/g,''); }
  function renderAbout(){
    var h='';
    if(D.description) h+='<details><summary>Course description</summary><div class="inner"><p>'+esc(D.description)+'</p></div></details>';
    if(D.cilo.length) h+='<details><summary>Course intended learning outcomes ('+D.cilo.length+')</summary><div class="inner"><ol>'+D.cilo.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></div></details>';
    if(D.pilo.length) h+='<details><summary>Program outcomes listed in the OBTL ('+D.pilo.length+')</summary><div class="inner"><ul>'+D.pilo.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div></details>';
    [['basic','Basic readings'],['extended','Extended readings']].forEach(function(k){
      var gs=D.readings[k[0]]; if(!gs.length) return;
      var n=gs.reduce(function(a,g){return a+g.items.length;},0);
      h+='<details><summary>'+k[1]+' ('+n+')</summary><div class="inner refs">'
        +gs.map(function(g){ return (g.heading?'<h4>'+esc(g.heading)+'</h4>':'')+g.items.map(function(x){return '<p>'+ri(x)+'</p>';}).join(''); }).join('')+'</div></details>';
    });
    h+='<p class="small">Generated from <b>'+esc(D.source.file)+'</b> ('+esc(D.source.extracted)+'). To update this roadmap, replace the OBTL and run the build (see source/README.md).</p>';
    $('about').innerHTML=h;
  }

  /* ---------- drawer ---------- */
  var openId=null, lastFocus=null;
  function nodeLabel(n){
    var it=n.item;
    if(n.kind==='exam') return 'Examination';
    return (it.start!==it.end?'Weeks ':'Week ')+it.label;
  }
  function list(a){ return a.length? '<ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>' : '<p class="small">None listed.</p>'; }
  function openNode(id, push){
    var n=nodes[id]; if(!n) return;
    openId=id; lastFocus=document.activeElement;
    var it=n.item;
    $('dCode').textContent = nodeLabel(n)+(n.kind==='topic'?' · Topic':n.kind==='at'?' · Assessment':n.kind==='week'?' · Unit':'');
    $('dTitle').textContent = n.text;
    $('dFacts').innerHTML = n.kind==='at' && n.mco ? '<span>Module course outcome <b>MCO'+n.mco+'</b></span>' : '';
    var b='<div class="sec" style="margin-top:0"><h3><span>Progress</span></h3><div class="stbar" id="stbar"></div></div>';
    if(n.kind==='exam'){
      b+='<div class="sec"><h3><span>Format</span></h3><p class="kv">'+(it.mode?esc(it.mode):'Not specified in the OBTL.')+'</p></div>';
      var ex=D.grading.components.filter(function(c){return c.key===it.id})[0];
      if(ex) b+='<div class="sec"><h3><span>Weight in the final grade</span></h3><p class="kv"><b>'+ex.pct+'%</b></p></div>';
    } else {
      b+='<div class="sec"><h3><span>Intended learning outcome</span></h3><p class="kv">'+esc(it.ilo||'Not specified.')+'</p></div>';
      if(n.kind==='week'){
        b+='<div class="sec"><h3><span>Topics</span></h3>'+list(it.topics)+'</div>';
      } else if(n.kind==='topic'){
        b+='<div class="sec"><h3><span>Part of</span></h3><p class="kv">'+esc(it.topics[0]||'')+'</p></div>';
      }
      b+='<div class="sec"><h3><span>Teaching and learning activities</span></h3>'
        +'<div class="tlaitem"><b>Face-to-face</b>'+list(it.tla.f2f)+'</div>'
        +'<div class="tlaitem"><b>Asynchronous</b>'+list(it.tla.async)+'</div>'
        +'<div class="tlaitem"><b>Synchronous</b>'+list(it.tla.sync)+'</div></div>';
      if(n.kind==='week' || n.kind==='at'){
        b+='<div class="sec"><h3><span>Assessment tasks</span></h3>'+(it.at.length? '<ul>'+it.at.map(function(a){return '<li>'+esc(a.text)+'</li>';}).join('')+'</ul>' : '<p class="small">None listed.</p>')+'</div>';
      }
    }
    var i=order.indexOf(id);
    b+='<div class="navrow"><button class="btn" type="button" data-nav="-1"'+(i<=0?' disabled':'')+'>← Previous</button>'
      +'<button class="btn" type="button" data-nav="1"'+(i>=order.length-1?' disabled':'')+'>Next →</button></div>';
    $('dBody').innerHTML=b; $('dBody').scrollTop=0;
    renderDrawerStatus();
    $('scrim').classList.add('on'); $('drawer').classList.add('on'); $('drawer').setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    if(push!==false){ try{ history.replaceState(null,'','#'+id); }catch(e){} }
    setTimeout(function(){ $('dClose').focus(); },30);
  }
  function renderDrawerStatus(){
    var bar=$('stbar'); if(!bar||!openId) return;
    var st=status(openId);
    var defs=[['done','Done'],['prog','In progress'],['skip','Skip'],['','Reset']];
    bar.innerHTML=defs.map(function(d){
      var on = d[0]===st && d[0]!=='';
      return '<button type="button" class="btn'+(d[0]==='done'&&on?' done':'')+'" data-st="'+d[0]+'" aria-pressed="'+on+'">'+d[1]+'</button>';
    }).join('');
  }
  function closeDrawer(){
    if(!$('drawer').classList.contains('on')) return;
    $('scrim').classList.remove('on'); $('drawer').classList.remove('on'); $('drawer').setAttribute('aria-hidden','true');
    document.body.style.overflow=''; openId=null;
    try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- jump / search ---------- */
  function jump(id){
    var e=el(id); if(!e) return;
    e.scrollIntoView({behavior:'smooth',block:'center'});
    e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash');
  }
  var hitList=[], hitPos=-1;
  function runSearch(){
    var t=$('rq').value.toLowerCase().split(/\s+/).filter(Boolean);
    hitList=[]; hitPos=-1;
    document.querySelectorAll('.node').forEach(function(e){
      var ok = t.length && t.every(function(x){ return e.getAttribute('data-hay').indexOf(x)>=0; });
      var vis = e.offsetParent!==null;
      e.classList.toggle('hit', !!(ok && vis));
      if(ok && vis) hitList.push(e);
    });
    $('flow').classList.toggle('searching', t.length>0);
    $('hits').textContent = t.length ? (hitList.length? hitList.length+' match'+(hitList.length>1?'es':'')+' · Enter = next' : 'No match') : '';
  }

  /* ---------- events ---------- */
  document.addEventListener('click',function(ev){
    var t=ev.target, c;
    if((c=t.closest('[data-chk]'))){
      ev.stopPropagation();
      var id=c.getAttribute('data-chk'); setStatus(id, status(id)==='done'?'':'done'); return;
    }
    if((c=t.closest('.node'))){ openNode(c.getAttribute('data-id')); return; }
    if((c=t.closest('.tl, .hc'))){ if(c.getAttribute('data-n')==='0') return; jump(c.getAttribute('data-id')); return; }
    if((c=t.closest('[data-st]'))){ if(openId) setStatus(openId, c.getAttribute('data-st')); return; }
    if((c=t.closest('[data-nav]'))){
      var j=order.indexOf(openId)+ +c.getAttribute('data-nav');
      if(j>=0 && j<order.length){ var nid=order[j]; openNode(nid); jump(nid); }
      return;
    }
    if(t===$('scrim')||t.closest('#dClose')) closeDrawer();
  });
  document.addEventListener('keydown',function(ev){
    if(ev.key==='Escape'){ closeDrawer(); return; }
    var tag=document.activeElement.tagName;
    if(ev.key==='/' && !/INPUT|TEXTAREA/.test(tag) && !$('drawer').classList.contains('on')){ ev.preventDefault(); $('rq').focus(); $('rq').select(); }
    if((ev.key==='Enter'||ev.key===' ') && document.activeElement.classList.contains('node')){ ev.preventDefault(); openNode(document.activeElement.getAttribute('data-id')); }
    if(ev.key==='Tab' && $('drawer').classList.contains('on')){
      var f=Array.prototype.filter.call($('drawer').querySelectorAll('button'),function(b){return !b.disabled;}); if(!f.length) return;
      var first=f[0], last=f[f.length-1];
      if(ev.shiftKey && document.activeElement===first){ ev.preventDefault(); last.focus(); }
      else if(!ev.shiftKey && document.activeElement===last){ ev.preventDefault(); first.focus(); }
    }
  });
  $('rq').addEventListener('input', runSearch);
  $('rq').addEventListener('keydown',function(ev){
    if(ev.key==='Enter' && hitList.length){ ev.preventDefault(); hitPos=(hitPos+1)%hitList.length; jump(hitList[hitPos].getAttribute('data-id')); }
    if(ev.key==='Escape'){ this.value=''; runSearch(); this.blur(); }
  });
  function toggleCol(btn, cls){
    var on=btn.getAttribute('aria-pressed')!=='true';
    btn.setAttribute('aria-pressed', on); $('flowwrap').classList.toggle(cls, !on);
    runSearch(); queueDraw();
  }
  $('tTopics').addEventListener('click',function(){ toggleCol(this,'hide-topics'); });
  $('tAt').addEventListener('click',function(){ toggleCol(this,'hide-at'); });
  $('bReset').addEventListener('click',function(){
    if(!Object.keys(state).length){ B.toast('Nothing to reset'); return; }
    if(!window.confirm('Clear all progress saved in this browser for '+D.code+'?')) return;
    state={}; B.store.del(store); refresh(); B.toast('Progress reset');
  });
  window.addEventListener('resize', queueDraw);
  if(MOBILE.addEventListener) MOBILE.addEventListener('change', queueDraw);
  if(window.ResizeObserver) new ResizeObserver(queueDraw).observe($('flow'));
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(queueDraw);
  window.addEventListener('storage',function(e){ if(e.key===store){ state=B.getJSON(store,{})||{}; refresh(); } });

  /* ---------- go ---------- */
  renderHead(); renderTimeline(); renderHeat(); renderGrading(); renderFlow(); renderAbout();
  $('view').hidden=false;
  refresh();
  var h0=decodeURIComponent(location.hash.replace('#',''));
  if(h0 && nodes[h0]){ openNode(h0,false); setTimeout(function(){ jump(h0); },60); }
  queueDraw();
}
})();
