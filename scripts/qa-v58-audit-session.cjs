/* v5.8 Home Resume/final state and Arrival/Reshuffle source audit. */
const fs=require('node:fs');
const home=fs.readFileSync('public/index.html','utf8'),unified=fs.readFileSync('public/modes/unified/index.html','utf8');
for(const [title,src,needle,before,after] of [
 ['Home Resume renderer',home,"node.textContent=(secondary?item.label+' · ':'RESUME · ')",2900,1850],
 ['Home Resume element',home,'id="p54-resume"',450,550],
 ['Home Session collector',home,'const sessions=[]',1200,2600],
 ['Arrival panel gate',unified,'const prematch=s.currentRound===0&&done(s)===0',350,1450],
 ['Arrival guard',unified,"function canReshuffle(){",160,700]
]){
 const i=src.lastIndexOf(needle);
 console.log('\n==== '+title+' @'+i+' ====\n'+(i>=0?src.slice(Math.max(0,i-before),Math.min(src.length,i+after)):'NOT FOUND'));
}
