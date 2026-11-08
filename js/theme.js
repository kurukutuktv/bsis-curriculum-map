/* theme.js – Light / Dark switch for both pages. Only these two themes exist (no "system" mode):
   light unless the visitor picked dark. Loaded in <head> so the saved theme applies before first paint. */
(function(){
"use strict";
var KEY = 'bsis-theme', root = document.documentElement;

function saved(){ try{ return localStorage.getItem(KEY)==='dark' ? 'dark' : 'light'; }catch(e){ return 'light'; } }
function apply(t){
  root.setAttribute('data-theme', t);
  var bs = document.querySelectorAll('[data-theme-set]');
  for(var i=0;i<bs.length;i++) bs[i].setAttribute('aria-pressed', String(bs[i].getAttribute('data-theme-set')===t));
}

apply(saved());
document.addEventListener('DOMContentLoaded', function(){
  apply(root.getAttribute('data-theme'));
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-theme-set]'); if(!b) return;
    var t = b.getAttribute('data-theme-set')==='dark' ? 'dark' : 'light';
    try{ localStorage.setItem(KEY, t); }catch(err){}
    apply(t);
  });
});
})();
