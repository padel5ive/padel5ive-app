const fs=require('fs');
const home=fs.readFileSync('public/index.html','utf8'),eng=fs.readFileSync('public/modes/unified/index.html','utf8'),club=fs.readFileSync('public/modes/club-match/index.html','utf8');
function at(s,name,marker,before,after){
 const i=s.indexOf(marker);
 console.log('=== '+name+' / '+JSON.stringify(marker)+' @'+i+'===');
 if(i>=0)console.log(s.slice(Math.max(0,i-before),Math.min(s.length,i+after)));
}
console.log('HOME KEY SECTION:');
at(home,'home','const KEY_UNI',200,2300);
at(home,'home','function resume',200,6800);
at(home,'home','function renderResume',100,4500);
console.log('ENGINE KEY/STATE/SESSION:');
for(const [t,b,a] of [['const LIBRARY_KEY',120,600],['const KEY=',120,500],['function stateNew',100,2400],['function library()',600,4000],['function archiveActive',140,1400],['function save()',200,1100],['function homeExistingSessions',400,2200],['function setup(s)',150,4500],['function menu(s)',150,3000],['function champion(s)',100,2800],['function showPublish(state)',130,800],['window.P5PublicResults',150,1600],['function render()',130,1700],['case \'restore\'',200,900],['case \'session-resume\'',200,1300],['const restoreInput',100,800],['setup-date',300,700],['data-act="restore"',250,550],['setup-session',250,900],['function newTournament',100,800],['const sessionId=',200,850],['function publish(state',150,1800]]){
 at(eng,'engine',t,b,a);
}
console.log('CLUB KEYS:');
for(const [t,b,a] of [['LIBRARY',230,700],['session-library',160,400],['function save',100,450],['function render',100,450]])at(club,'club',t,b,a);
