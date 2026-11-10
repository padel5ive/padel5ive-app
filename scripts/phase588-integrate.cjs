/* PADEL 5IVE v5.8.8 — prewarm selected Initial Setup engine only. */
'use strict';
const fs=require('node:fs');
const homePath='public/index.html',swPath='public/sw.js';
let home=fs.readFileSync(homePath,'utf8');
const script='<script defer src="/phase588/setup-prewarm-v588.js"></script>';
if(!home.includes(script)){
 const token='</body>',i=home.lastIndexOf(token);
 if(i<0)throw Error('v588: missing Home body terminator');
 home=home.slice(0,i)+script+'\n'+home.slice(i);
}
const navOld='setTimeout(()=>location.assign(url.href),230);';
const navNew='setTimeout(()=>location.assign(url.href),64);';
if(home.includes(navOld)){
 if(home.split(navOld).length!==2)throw Error('v588: multiple navigation delay targets');
 home=home.replace(navOld,navNew);
}else if(!home.includes(navNew))throw Error('v588: original navigation behavior changed');
fs.writeFileSync(homePath,home);

let sw=fs.readFileSync(swPath,'utf8');
const prefix="const APP_PAGES = new Set([";
const prewarm="/* Phase 5.8.8: Prepare only the selected game engine.\n   Do not cache API/results; every non-prewarmed navigation is network-first. */\nconst P5_SETUP_WARM_MAX_AGE_MS = 90000;\nlet p5SetupWarm = null;\nfunction p5SetupPath(mode) {\n  return mode === 'club' ? '/modes/club-match/' :\n    mode === 'unified' ? '/modes/unified/' : null;\n}\nfunction p5PrewarmSetup(mode) {\n  const path=p5SetupPath(mode);\n  if(!path)return Promise.resolve(false);\n  const existing=p5SetupWarm;\n  if(existing && existing.path===path &&\n    Date.now()-existing.started<P5_SETUP_WARM_MAX_AGE_MS)return existing.promise;\n  const item={path,started:Date.now(),promise:null,response:null};\n  p5SetupWarm=item;\n  item.promise=fetch(new Request(path,{credentials:'same-origin',cache:'no-cache'}))\n    .then(async response=>{\n      if(!isSafeResponse(response)||p5SetupWarm!==item)return false;\n      item.response=response.clone();\n      await cacheSuccessful(CACHE_PAGES,path,response);\n      return true;\n    }).catch(()=>false);\n  return item.promise;\n}\nasync function p5GetFreshWarmSetup(path) {\n  const item=p5SetupWarm;\n  if(!item||item.path!==path||\n    Date.now()-item.started>P5_SETUP_WARM_MAX_AGE_MS)return null;\n  if(!item.response){\n    await Promise.race([\n      item.promise,\n      new Promise(resolve=>setTimeout(resolve,420))\n    ]);\n  }\n  if(!item.response)return null;\n  p5SetupWarm=null;\n  return item.response.clone();\n}";
if(!sw.includes('function p5PrewarmSetup(mode)')){
 if(sw.split(prefix).length!==2)throw Error('v588: unexpected SW insertion point');
 sw=sw.replace(prefix,prewarm+'\n'+prefix);
}
const oldNav="    event.respondWith(networkFirst(req, path, CACHE_PAGES, true));\n    return;";
const newNav="    // Only freshly prepared NEW setups bypass the ordinary network-first path.\n    if(url.searchParams.get('intent')==='new' &&\n       (path==='/modes/unified/'||path==='/modes/club-match/')){\n      event.respondWith((async()=>{\n        const warm=await p5GetFreshWarmSetup(path);\n        return warm||networkFirst(req,path,CACHE_PAGES,true);\n      })());\n      return;\n    }\n    event.respondWith(networkFirst(req, path, CACHE_PAGES, true));\n    return;";
if(!sw.includes('const warm=await p5GetFreshWarmSetup(path);')){
 if(sw.split(oldNav).length!==2)throw Error('v588: navigate handler modified upstream');
 sw=sw.replace(oldNav,newNav);
}
const oldMessage="if (event.data && event.data.type === 'P5_APPLY_UPDATE') self.skipWaiting();";
const newMessage="if (event.data && event.data.type === 'P5_APPLY_UPDATE') self.skipWaiting();\n  if (event.data && event.data.type === 'P5_PREWARM_SETUP') {\n    event.waitUntil(p5PrewarmSetup(event.data.mode));\n  }";
if(!sw.includes("event.data.type === 'P5_PREWARM_SETUP'")){
 if(sw.split(oldMessage).length!==2)throw Error('v588: existing update control changed');
 sw=sw.replace(oldMessage,newMessage);
}
const version=/const VERSION = '(.*?)';/;
if(!sw.includes("const VERSION = 'p5-pwa-setup-prewarm-v588-1';")){
 if(!version.test(sw))throw Error('v588: SW version missing');
 sw=sw.replace(version,"const VERSION = 'p5-pwa-setup-prewarm-v588-1';");
}
fs.writeFileSync(swPath,sw);
if(!home.includes(script)||!sw.includes('P5_PREWARM_SETUP'))throw Error('v588: integration incomplete');
console.log('v5.8.8: selected-mode prewarm and faster Continue navigation enabled.');
