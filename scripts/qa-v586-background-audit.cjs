const fs=require('fs');
for(const filename of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 const s=fs.readFileSync(filename,'utf8');console.log('FILE '+filename+' BYTES '+s.length);
 const terms=['background-attachment','background-image','body::before','body:before','body::after','body:after','html::before','position:fixed','background-position','background-size','backdrop-filter','background: url','background:url','document.body.style.background','body.style.background','p5-wallpaper','p5-bg-fixed','fixed-backdrop'];
 for(const term of terms){
  let matches=[],p=-1;while((p=s.indexOf(term,p+1))>=0&&matches.length<300)matches.push(p);
  console.log('TERM '+term+' TOTAL_LE '+matches.length+' POS '+matches.slice(0,15).join(','));
  if(['background-attachment','body::before','body:before','body::after','body:after','html::before','document.body.style.background','body.style.background','p5-wallpaper','p5-bg-fixed','fixed-backdrop'].includes(term)){
    matches.slice(0,8).forEach((pos,k)=>console.log('HIT '+term+' '+k+' @'+pos+'\n'+s.slice(Math.max(0,pos-380),pos+640).replace(/\n{3,}/g,'\n\n')+'\n---'));
  }
 }
 const css=[...s.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];
 console.log('STYLES '+css.length);
 css.forEach((m,i)=>{
   const text=m[1];let samples=[];
   for(const x of text.matchAll(/([^{}]{0,180}\{[^{}]{0,400}(?:background-image\s*:|background\s*:)[^{}]{0,300}\})/g)){
     const st=x[1];
     if(/(?:body|html|#americano|body:before|body::before|#root|\.wrap|\.app|\.shell|\.scene|\.backdrop)/i.test(st.slice(0,170))&&(/(?:url\(|fixed|before|after|gradient)/i.test(st)))samples.push(st.replace(/\s+/g,' ').slice(0,560));
   }
   if(samples.length)console.log('CSSBLOCK '+i+' SAMPLES '+samples.length+'\n'+samples.slice(0,22).join('\n###\n'));
 });
}
