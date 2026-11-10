/* PADEL 5IVE v5.8.9 — approved Cloud Session WhatsApp copy QA. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const path='public/phase58/cloud-dashboard.js';
const source=fs.readFileSync(path,'utf8');
new vm.Script(source,{filename:path});
const first=source.indexOf('function message(m)');
const end=source.indexOf('async function api(',first);
assert(first>=0&&end>first,'Cloud Session message generator found');
const formatDate=s=>{
 if(!/^\d{4}-\d\d-\d\d$/.test(s||''))return s||'';
 const d=new Date(s+'T12:00:00Z');
 return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d);
};
const context={formatDate,location:{origin:'https://padel5ive.netlify.app'}};
vm.runInNewContext(source.slice(first,end)+'\nthis.renderMessage=message;',context);
const rendered=context.renderMessage({summary:{session:'5IVE TUESDAY',date:'2026-11-10',time:'19:00'},code:'503743',pin:'0886'});
const expected=[
 '*PADEL 5IVE · CLOUD SESSION*',
 '_BEYOND 5IVE. BEYOND PLAY._',
 '',
 '*5IVE TUESDAY*',
 'Tuesday, 10 November 2026 · 19:00',
 '',
 'https://padel5ive.netlify.app',
 '',
 '*SESSION CODE:* 503743',
 '*ACCESS PIN:* 0886',
 '',
 '*HOW TO ACCESS*',
 '1. Open the link → Load Session.',
 '2. Enter Code & PIN → Load Session.',
 '',
 '*HOW TO TAKE CONTROL*',
 '1. Open Menu & Settings → Cloud Session.',
 '2. Tap Take Control.',
 '3. Current controller taps Approve Control Transfer.',
 '',
 '*NOTE*',
 'One controller at a time. Others are View Only. Offline control transfers after the lease expires.'
].join('\n');
assert.equal(rendered,expected,'WhatsApp copy matches organizer-approved final message');
const second=context.renderMessage({summary:{session:'FRIDAY NIGHT',date:'2026-11-13',time:'20:00'},code:'123456',pin:'0042'});
assert(second.includes('*FRIDAY NIGHT*'));
assert(second.includes('Friday, 13 November 2026 · 20:00'));
assert(second.includes('*SESSION CODE:* 123456'));
assert(second.includes('*ACCESS PIN:* 0042'));
assert(!second.includes('503743')&&!second.includes('0886'),'Sample credentials must never be hard-coded');
const viewerContext={...context,viewerLink:m=>m.shortToken
 ?'https://padel5ive.netlify.app/v/'+m.code+'.'+m.shortToken
 :'https://padel5ive.netlify.app/#join='+m.code+'&v='+m.viewerKey};
vm.runInNewContext(source.slice(first,end)+'\nthis.renderMessage=message;',viewerContext);
const viewerMessage=viewerContext.renderMessage({summary:{session:'5IVE TUESDAY',date:'2026-11-10',time:'19:00'},
 code:'7AMR9QKT3Y',viewerKey:'test-private-viewer-token'});
assert(viewerMessage.includes('*JOIN LIVE SESSION*'));
assert(viewerMessage.includes('https://padel5ive.netlify.app/#join=7AMR9QKT3Y&v=test-private-viewer-token'));
assert(viewerMessage.includes('*MANUAL ACCESS*'));
assert(viewerMessage.includes('*SESSION CODE:* 7AMR9QKT3Y'));
assert(!viewerMessage.includes('MODERATOR PIN')&&!viewerMessage.includes('ACCESS PIN'));
const shortMessage=viewerContext.renderMessage({summary:{session:'FRIDAY NIGHT',date:'2026-11-13',time:'20:00'},
 code:'ABCDEF',viewerKey:'old-long-key',shortToken:'ABCDEF1234567890'});
assert(shortMessage.includes('https://padel5ive.netlify.app/v/ABCDEF.ABCDEF1234567890'),
 'New WhatsApp Viewer Link uses secure short path');
assert(!shortMessage.includes('#join='),'No long fragment in new shares');
assert(!shortMessage.includes('MODERATOR PIN')&&!shortMessage.includes('ACCESS PIN'),
 'Short link must never reveal private Moderator PIN');
assert(source.includes('const text=message(meta);')&&source.includes("window.open('https://wa.me/?text='"),
 'WhatsApp action still uses message builder and opens wa.me on user tap');
assert(source.includes('const str=message(meta);')&&source.includes('navigator.clipboard?.writeText(str)'),
 'Copy details uses identical approved message');
assert(source.includes("btn(meta.waiting?'REQUEST SENT · CHECK STATUS':'TAKE CONTROL'"),'Take Control action preserved');
assert(source.includes("btn('APPROVE CONTROL TRANSFER'"),'Approve Transfer action preserved');
console.log('PASS v5.8.9 — exact WhatsApp template, dynamic credentials/date, share+copy and control actions.');
