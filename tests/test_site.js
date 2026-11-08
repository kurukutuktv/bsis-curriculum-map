const { chromium } = require('playwright');
const base = 'http://localhost:8765/';
let fails = 0;
function ok(c, m){ if(!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m); }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:1360,height:900}, deviceScaleFactor:1 });
  await ctx.grantPermissions(['clipboard-read','clipboard-write'], {origin:'http://localhost:8765'});
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push(String(e)));

  // ---------- MAP
  await p.goto(base+'index.html');
  ok(await p.locator('#tbody tr').count()===21, 'map: 21 rows');
  ok(await p.locator('a.iconbtn.rm').count()===1, 'map: exactly one Roadmap button (CC106 is in the CMO map; IS Elec_1 is not)');
  ok(await p.locator('#rmcards .rmcard').count()===2, 'map: 2 roadmap cards');
  ok((await p.locator('#rmcards').innerText()).includes('elective'), 'map: HCI card labelled elective');
  await p.fill('#q','service worker');
  const rows = await p.locator('#tbody tr').allInnerTexts();
  ok(rows.length===1 && rows[0].includes('CC106') && rows[0].includes('Roadmap'), 'map: roadmap-topic search finds CC106 with Roadmap snippet: '+rows.map(r=>r.replace(/\s+/g,' ').slice(0,120)).join('|'));
  await p.fill('#q','');
  await p.click('#onlyRm'); ok(await p.locator('#tbody tr').count()===1, 'map: With roadmap filter');
  await p.click('#onlyRm');
  await p.click('th.p button[data-p="2"]'); const n3 = await p.locator('#tbody tr').count(); ok(n3>0 && n3<21, 'map: IS03 filter -> '+n3);
  await p.click('#unfilter');
  await p.click('#tbody tr[data-code="CC106"]');
  ok(await p.locator('#drawer.on').count()===1, 'map: drawer opens'); 
  ok((await p.locator('#dBody .rmbox a').getAttribute('href')).includes('roadmap.html?c=CC106'), 'map: drawer roadmap link');
  await p.click('[data-copy="piloD"]'); const clip = await p.evaluate(()=>navigator.clipboard.readText());
  ok(/^1\. /.test(clip), 'map: copy PILO numbered: '+clip.slice(0,50));
  await p.keyboard.press('Escape');
  await p.goto(base+'index.html#IS103'); ok(await p.locator('#drawer.on').count()===1, 'map: deep link opens drawer');
  await p.screenshot({path:'shots/map-desktop.png'});

  // data identical to source of truth
  const data = await p.evaluate(()=>JSON.stringify({pilo:window.CURRICULUM.pilo,courses:window.CURRICULUM.courses.map(c=>{const o={};['code','title','pre','units','page','mode','los','codes'].forEach(k=>o[k]=c[k]);return o;})}));
  require('fs').writeFileSync('shots/data_browser.json', data);

  // ---------- ROADMAP
  await p.evaluate(()=>localStorage.clear());
  await p.goto(base+'roadmap.html?c=CC106');
  await p.waitForSelector('#rows .row');
  const nWeeks = await p.locator('.row').count();
  ok(nWeeks===15, 'roadmap: 15 rows (12 week groups + 3 exams), got '+nWeeks);
  ok(await p.locator('.node.main').count()===12 && await p.locator('.node.exam').count()===3, 'roadmap: 12 week nodes + 3 exam nodes');
  const subs = await p.locator('.node.sub').count(), ats = await p.locator('.node.at').count();
  console.log('     sub nodes', subs, 'at nodes', ats);
  ok(await p.locator('#links path.spine').count()===14, 'roadmap: 14 spine links');
  ok(await p.locator('#links path.side').count()===subs+ats, 'roadmap: one connector per leaf');
  ok((await p.locator('#head h1').innerText()).length>3, 'roadmap: title');
  ok(await p.locator('.pchip').count()>0, 'roadmap: PILO chips for mapped course');
  ok(await p.locator('.tl').count()===15, 'roadmap: timeline blocks');
  ok(await p.locator('.heat .hc').count()===60, 'roadmap: heat cells');
  ok(await p.locator('.donut circle').count()===4, 'roadmap: donut segments');
  // status
  await p.click('[data-chk="w1"]');
  ok(await p.locator('.node[data-id="w1"].done').count()===1, 'roadmap: week 1 done (no leaves except AT -> cascades)');
  const sum1 = await p.evaluate(()=>JSON.parse(localStorage.getItem('bsis-roadmap-sum:CC106')));
  console.log('     summary', JSON.stringify(sum1));
  ok(sum1.done>=1 && sum1.pct>0, 'roadmap: summary stored');
  // open drawer on a leaf
  const firstSub = p.locator('.node.sub').first(); const sid = await firstSub.getAttribute('data-id');
  await firstSub.click(); ok(await p.locator('#drawer.on').count()===1, 'roadmap: drawer opens for topic');
  await p.click('#stbar [data-st="prog"]'); ok(await p.locator('.node[data-id="'+sid+'"].prog').count()===1, 'roadmap: topic in progress');
  await p.click('#stbar [data-st="skip"]'); ok(await p.locator('.node[data-id="'+sid+'"].skip').count()===1, 'roadmap: topic skipped');
  await p.click('[data-nav="1"]');
  await p.keyboard.press('Escape');
  // persistence
  await p.reload(); await p.waitForSelector('#rows .row');
  ok(await p.locator('.node[data-id="w1"].done').count()===1 && await p.locator('.node[data-id="'+sid+'"].skip').count()===1, 'roadmap: progress persists after reload');
  // map reflects progress
  await p.goto(base+'index.html'); ok((await p.locator('#rmcards').innerText()).match(/\d+ of \d+ done/)!==null, 'map: card shows progress');
  ok((await p.locator('a.iconbtn.rm .pct').count())===1, 'map: row button shows %');
  await p.goto(base+'roadmap.html?c=CC106');
  await p.waitForSelector('#rows .row');
  // search
  await p.fill('#rq','manifest'); const hits = await p.locator('.node.hit').count(); ok(hits>0, 'roadmap: search hits '+hits);
  await p.press('#rq','Enter'); await p.fill('#rq','');
  // toggles
  await p.click('#tTopics'); ok(await p.locator('.col.l').first().isHidden(), 'roadmap: topics column hidden');
  await p.waitForTimeout(150); ok(await p.locator('#links path.lk-l').count()===0, 'roadmap: topic connectors removed');
  await p.click('#tTopics');
  // reset
  p.once('dialog', d=>d.accept()); await p.click('#bReset');
  ok(await p.locator('.node.done').count()===0, 'roadmap: reset clears');
  await p.screenshot({path:'shots/roadmap-desktop-top.png'});
  await p.locator('.row').nth(3).scrollIntoViewIfNeeded();
  await p.click('[data-chk="w2-3"]').catch(()=>{});
  await p.screenshot({path:'shots/roadmap-desktop-flow.png'});
  await p.screenshot({path:'shots/roadmap-full.png', fullPage:true});

  // HCI
  await p.goto(base+'roadmap.html?c=ISELEC1'); await p.waitForSelector('#rows .row');
  ok(await p.locator('.row').count()===15, 'hci: 15 rows');
  ok(await p.locator('.pchip').count()===0 && (await p.locator('.tag-note').count())===1, 'hci: elective tag, no pilo chips');
  // hub + bad slug
  await p.goto(base+'roadmap.html'); ok(await p.locator('#rmcards .rmcard').count()===2, 'hub: 2 cards');
  await p.goto(base+'roadmap.html?c=../../x'); ok((await p.locator('#msg').innerText()).includes('No roadmap'), 'bad slug handled');

  // mobile
  const mctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const m = await mctx.newPage(); m.on('pageerror', e=>errs.push(String(e))); m.on('console', x=>{ if(x.type()==='error') errs.push(x.text()); });
  await m.goto(base+'roadmap.html?c=CC106'); await m.waitForSelector('#rows .row');
  const sw = await m.evaluate(()=>document.documentElement.scrollWidth); ok(sw<=392, 'mobile roadmap: no horizontal scroll ('+sw+')');
  await m.screenshot({path:'shots/roadmap-mobile.png'});
  await m.locator('.row').nth(2).scrollIntoViewIfNeeded(); await m.screenshot({path:'shots/roadmap-mobile-flow.png'});
  await m.goto(base+'index.html'); const sw2 = await m.evaluate(()=>document.documentElement.scrollWidth); ok(sw2<=392, 'mobile map: no page-level horizontal scroll ('+sw2+')');
  await m.screenshot({path:'shots/map-mobile.png'});

  // dark
  const dctx = await b.newContext({ viewport:{width:1360,height:900}, colorScheme:'dark' });
  const d = await dctx.newPage(); await d.goto(base+'roadmap.html?c=CC106'); await d.waitForSelector('#rows .row'); await d.locator('.row').nth(2).scrollIntoViewIfNeeded(); await d.screenshot({path:'shots/roadmap-dark.png'});

  ok(errs.length===0, 'no console errors '+JSON.stringify(errs));
  await b.close();
  console.log(fails? ('FAILED '+fails):'ALL OK');
})();
