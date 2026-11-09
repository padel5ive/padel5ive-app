/* PADEL 5IVE v5.6.3 — navigation regression smoke (no browser deps). */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const css=fs.readFileSync('public/pwa-standalone-layout-v5601.css','utf8');
const boot=fs.readFileSync('public/pwa-register.js','utf8');
const navSrc=fs.readFileSync('public/pwa/navigation-v5603.js','utf8');
const app='public/modes/unified/index.html',show='public/modes/club-match/index.html';
for (const f of [app,show]) {
 const h=fs.readFileSync(f,'utf8');
 assert.ok(h.includes('id="p54-home-link"'),f+' home control');
 assert.ok(h.includes('rel="manifest"'),f+' PWA manifest');
 assert.ok(h.includes('/pwa-register.js'),f+' register');
}
assert.ok(boot.includes('/pwa/navigation-v5603.js'),'PWA bootstrap must load nav fix');
assert.equal(css.includes('position: sticky'),false,'PWA must not use overlaying sticky nav');
assert.ok(css.includes('position: relative !important'),'nav must be in normal document flow');
assert.ok(css.includes('min-height: 44px'),'home tap target must be 44px');
assert.ok(css.includes('(display-mode: standalone)'),'CSS only targets installed PWA');
assert.ok(navSrc.includes("history.scrollRestoration = 'manual'"));
assert.ok(navSrc.includes("classList.contains('p54-active')"));
const listeners={},bodyClass={active:false};
const doc={readyState:'complete',scrollingElement:{scrollTop:655},body:{classList:{contains(n){return n==='p54-active'&&bodyClass.active}}},addEventListener(name,fn){listeners['doc:'+name]=fn},querySelector(name){return name==='#p54-workspace'?workspace:null}};
const workspace={scrollTop:800};
const location={href:'https://deploy-preview-1--padel5ive.netlify.app/modes/unified/',origin:'https://deploy-preview-1--padel5ive.netlify.app',assign(url){this.assigned=url}};
let observed;
class MutationObserverMock{constructor(fn){observed=fn}observe(){}}
const window={matchMedia:()=>({matches:true}),scrollTo(){doc.scrollingElement.scrollTop=0}};
const context={window,document:doc,history:{scrollRestoration:'auto'},MutationObserver:MutationObserverMock,requestAnimationFrame:fn=>fn(),location,URL,addEventListener(name,fn){listeners['window:'+name]=fn}};
vm.runInNewContext(navSrc,context,{filename:'navigation-v5603.js'});
assert.equal(context.history.scrollRestoration,'manual');
assert.equal(doc.scrollingElement.scrollTop,0,'restored page should open at top');
bodyClass.active=true;observed();
assert.equal(workspace.scrollTop,0,'mode selection scroll reset on opening');
listeners['doc:click']({target:{closest:q=>q==='a#p54-home-link'?{getAttribute:()=> '../../'}:null},preventDefault(){this.prevented=true}});
assert.equal(location.assigned,'https://deploy-preview-1--padel5ive.netlify.app/');

// v5.6.4: Safari/PWA parity guardrails for three separate viewports.
const shell=fs.readFileSync('public/index.html','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
const headers=fs.readFileSync('public/_headers','utf8');
assert.ok(shell.includes('id="p54-workspace"'),'Mode selector must keep its own scroll viewport');
assert.ok(shell.includes('class="p542-topline"'),'Mode chooser Home navbar must exist');
for(const sel of ['#portal .masthead','#portal .p541-home-actions','#portal .signature',
  '#p54-workspace.p54-workspace','#p54-workspace .p542-topline',
  'body > nav.p54-app-nav','body > nav.p54-app-nav > a#p54-home-link']) {
  assert.ok(css.includes(sel),'Safe-area CSS selector missing: '+sel);
}
assert.ok(css.includes('overscroll-behavior-y: contain'),'Mode chooser scroll must remain contained');
assert.ok(css.includes('padding-top: calc(var(--p5-standalone-safe-top) + 5px)'),'iPhone mode chooser safe-area guard');
assert.ok(!css.includes('position: fixed !important'),'PWA nav must never overlay match header');
assert.ok(!css.includes('translateY('),'PWA visual parity must not translate whole pages');
assert.ok(sw.includes('p5-pwa-lab-v565-1'),'Service worker cache version must match update');
assert.ok(sw.includes("'/pwa-standalone-layout-v5601.css'"),'Offline PWA must precache standalone layout');
assert.ok(headers.includes('/pwa-standalone-layout-v5601.css'),'PWA stylesheet must revalidate');


/* PWA 5.6.5 — header integration guardrails */
const compactSrc=fs.readFileSync('public/pwa/header-compact-v5605.js','utf8');
assert.ok(boot.includes('/pwa/header-compact-v5605.js'),'new app header script must load');
assert.ok(sw.includes("'/pwa/header-compact-v5605.js'"),'new header script must precache');
assert.ok(css.includes('body.p5-pwa-compact-nav > nav.p54-app-nav { display: none !important; }'));
assert.ok(css.includes('body.p5-pwa-compact-nav .p5-pwa-header-footer'));
assert.ok(css.includes('header.brand-banner.master-brand .hero-right'),'Team Showdown badge must clear footer');
assert.ok(css.includes('calc(var(--p5-standalone-safe-top) + 30px)'),'Header safe area must be retained');
assert.ok(!css.includes('position: sticky'),'No sticky navbar in PWA');
assert.ok(compactSrc.includes("link.textContent = '← HOME'"),'Must reuse existing Home link');
assert.ok(compactSrc.includes('footer.append(link, caption)'),'Home link moves inside header');
assert.ok(compactSrc.includes("if (!nav || !link || !header) return;"),'Do not hide nav if layout missing');
assert.ok(compactSrc.includes('body > div.wrap > header.brand-banner.master-brand'),'Team Showdown must share integration');
assert.ok(compactSrc.includes("document.body.classList.add('p5-pwa-compact-nav')"),'Hide old nav only after insertion');

console.log('PWA navigation and standalone visual parity: in-flow navbar, 44px target, scroll reset and Home destination PASS');
