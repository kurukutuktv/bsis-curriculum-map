/* common.js – helpers shared by index.html and roadmap.html.  Exposes window.BSIS */
(function(){
"use strict";
var B = window.BSIS = window.BSIS || {};

B.$ = function(id){ return document.getElementById(id); };
B.esc = function(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
B.slug = function(code){ return String(code).replace(/[^A-Za-z0-9]/g,'').toUpperCase(); };

B.ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
B.ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
B.ICON_ROUTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8.2 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/></svg>';

/* ---------- storage that never throws ---------- */
B.store = {
  get: function(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set: function(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
  del: function(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
B.getJSON = function(k, fallback){ try{ var v=B.store.get(k); return v? JSON.parse(v) : fallback; }catch(e){ return fallback; } };
B.setJSON = function(k, v){ B.store.set(k, JSON.stringify(v)); };

/* ---------- toast + clipboard ---------- */
var toastTimer;
B.toast = function(msg){
  var t=B.$('toast'); if(!t) return;
  t.textContent=msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer=setTimeout(function(){ t.classList.remove('on'); },1600);
};
B.writeClipboard = function(text){
  if(navigator.clipboard && window.isSecureContext){ return navigator.clipboard.writeText(text); }
  return new Promise(function(res,rej){
    var ta=document.createElement('textarea'); ta.value=text; ta.setAttribute('readonly','');
    ta.style.position='fixed'; ta.style.top='-1000px'; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy') ? res() : rej(new Error('copy failed')); }catch(e){ rej(e); }
    document.body.removeChild(ta);
  });
};
B.copy = function(text, btn, label){
  B.writeClipboard(text).then(function(){
    B.toast((label||'Copied')+' copied');
    if(btn){
      var orig=btn.innerHTML; btn.classList.add('done');
      btn.innerHTML = B.ICON_OK + '<span>Copied</span>';
      setTimeout(function(){ btn.classList.remove('done'); btn.innerHTML=orig; },1400);
    }
  }).catch(function(){ B.toast('Copy failed – select the text and copy manually'); });
};

/* ---------- roadmap registry ---------- */
B.manifest = function(){ return window.ROADMAP_MANIFEST || []; };
B.manifestFor = function(slug){ return B.manifest().filter(function(m){ return m.slug===slug; })[0]; };
B.progressKey = function(slug){ return 'bsis-roadmap:'+slug; };
B.summaryKey  = function(slug){ return 'bsis-roadmap-sum:'+slug; };
B.summary = function(slug){ return B.getJSON(B.summaryKey(slug), null); };

/* cards listing every available roadmap (shown on both pages) */
B.renderRoadmapCards = function(el, inMap){
  var list=B.manifest(), h='';
  if(!list.length){ el.innerHTML='<p class="small">No roadmaps have been added yet.</p>'; return; }
  list.forEach(function(m){
    var s=B.summary(m.slug), pct=s? s.pct : 0;
    var mapped = inMap && inMap(m);
    h+='<a class="rmcard" href="roadmap.html?c='+encodeURIComponent(m.slug)+'">'
      +'<div class="k"><span>'+B.esc(m.code)+'</span>'+(mapped?'':'<span class="tag-note" title="This course is not part of the CMO curriculum map">elective</span>')+'</div>'
      +'<div class="t">'+B.esc(m.title)+'</div>'
      +'<div class="m">'+B.esc(m.term||'')+' · '+m.weekGroups+' weekly units · '+m.topics+' topics · '+m.assessments+' assessments</div>'
      +'<div class="pb" aria-hidden="true"><i style="width:'+pct+'%"></i></div>'
      +'<div class="m">'+(s? (s.done+' of '+s.total+' done · '+pct+'%') : 'Not started')+'</div>'
      +'<div class="go">Open roadmap →</div></a>';
  });
  el.innerHTML=h;
};
})();
