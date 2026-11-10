const fs=require('node:fs');const paths=['public/index.html','public/modes/unified/index.html','public/modes/club-match/index.html'];
for(const p of paths){
 const s=fs.readFileSync(p,'utf8');
 console.log('===FILE '+p+' BYTES='+Buffer.byteLength(s)+'===');
 const needles=p==='public/index.html'
  ?['window.P5PreviewLaunch=function','P5PreviewLaunch','p54-workspace','p54-mode','p54-form','p54-start','mode-choice','game-mode','mode-card','selectMode','location.assign','location.href','NEW SESSION','START NEW SESSION','Continue','continue','INITIAL SETUP','showWorkspace','sessionStorage','prefetch']
  :['<head>','<script','<style','DOMContentLoaded','window.onload','function setup','function init','function render','localStorage.getItem',"stage===\u0027setup\u0027",'stage=== "setup"','location.assign','<body','defer','Intent='];
 for(const term of needles){
  const found=[];let at=-1;while((at=s.indexOf(term,at+1))!==-1&&found.length<300)found.push(at);
  console.log('TERM '+JSON.stringify(term)+' COUNT<= '+found.length+' POS '+found.slice(0,16));
  const count=p==='public/index.html'?8:2;
  for(const k of found.slice(0,count)){
   const frag=s.slice(Math.max(0,k-800),Math.min(s.length,k+1800));
   console.log('CONTEXT '+term+' @'+k+'\n'+frag.replace(/data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+/g,'[image omitted]').slice(0,2600)+'\nENDCONTEXT');
  }
 }
 const h=s.slice(0,s.indexOf('</head>')+7);
 const scripts=[...h.matchAll(/<script\b([^>]*)>/g)].map(x=>x[0].slice(0,300));
 const links=[...h.matchAll(/<link\b([^>]*?)>/g)].map(x=>x[0].slice(0,350));
 console.log('HEAD scripts '+JSON.stringify(scripts.slice(0,20)));
 console.log('HEAD links '+JSON.stringify(links.slice(0,30)));
}
