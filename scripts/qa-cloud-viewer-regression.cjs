'use strict';
/* Reproduce a Cloud Viewer link opened with 15 players and confirmed scores.
 * The authoritative cloud snapshot must reach local session storage unchanged.
 * Presentation tests in qa-v5814-view-only.cjs then assert static names.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/phase58/cloud-home.js','utf8');
const a=src.indexOf('function joinSafe(result){'),b=src.indexOf('function init(){',a);
assert(a>0&&b>a,'Cloud initial join handler must exist');
const store=new Map();
const key='cloud-joined-unified',history='cloud-joined-unified-history';
const get=k=>{try{return JSON.parse(store.get(k)||'null')}catch{return null}};
const put=(k,v)=>store.set(k,JSON.stringify(v));
const localStorage={
 getItem:k=>store.has(k)?store.get(k):null,
 setItem:(k,v)=>store.set(k,String(v)),
 removeItem:k=>store.delete(k)
};
const identity=s=>String(s?._sessionId||(s?.session||'')+'|'+(s?.date||''));
const ctx={K:{unified:key},ARCH:{unified:history},localStorage,get,put,identity,
 active:(s)=>s?.version===24&&Array.isArray(s.roster)&&Array.isArray(s.rounds)&&s.stage==='stage1',
 Date,Math,JSON,Number,Error,String,Object,Array};
vm.createContext(ctx);vm.runInContext(src.slice(a,b)+'\nthis.joinSafe=joinSafe;',ctx);
const roster=Array.from({length:15},(_,i)=>({id:i+1,names:['Player '+(i+1)]}));
const rounds=Array.from({length:27},(_,i)=>({index:i,matches:[
 {id:'R'+i+'C0',court:1,teams:[[1],[2]],confirmed:false,score:null},
 {id:'R'+i+'C1',court:2,teams:[[3],[4]],confirmed:false,score:null}
]}));
rounds[0].matches[0].confirmed=true;rounds[0].matches[0].score=[3,2];
rounds[19].matches[1].confirmed=true;rounds[19].matches[1].score=[4,1];
const data={_sessionId:'cloud-qa-fixture',version:24,session:'Live QA Session',date:'2026-11-11',
 stage:'stage1',mode:'fp-americano',roster,rounds,currentRound:3,viewRound:20,ui:{modal:null},courts:2,sitout:[]};
const snapshot=JSON.parse(JSON.stringify(data));
const destination=ctx.joinSafe({kind:'unified',code:'ABC123',token:'local-dummy',role:'viewer',revision:5,
 summary:{session:data.session},data});
assert.equal(destination,'/modes/unified/?intent=resume');
const saved=get(key);
assert.equal(saved.roster.length,15,'All 15 player records retained');
assert.deepEqual(saved.roster.map(x=>x.names[0]),snapshot.roster.map(x=>x.names[0]),'No blank names');
assert.deepEqual(saved.rounds,snapshot.rounds,'All confirmed scores and pending fixtures unchanged');
assert.equal(saved.rounds[0].matches[0].confirmed,true);
assert.deepEqual(saved.rounds[0].matches[0].score,[3,2]);
assert.equal(saved.rounds[19].matches[1].confirmed,true);
assert.deepEqual(saved.rounds[19].matches[1].score,[4,1]);
assert.equal(saved.viewRound,3,'Initial viewer follows the authoritative active round');
assert.equal(get('p58-cloud-link-unified').revision,5,'Joined Cloud revision retained');
assert.equal(get('p58-cloud-link-unified').role,'viewer','Never grant edit rights to viewer');
console.log('PASS Cloud Viewer initial join: 15 names, confirmed scores, historical round 20, role viewer, no data loss.');
