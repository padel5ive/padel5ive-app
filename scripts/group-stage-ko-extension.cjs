'use strict';
module.exports=function koUpgrade(source){
 function one(a,b){if(source.split(a).length!==2)throw Error('KO extension anchor drift: '+a);source=source.replace(a,()=>b);}
 function all(a,b){if(!source.includes(a))throw Error('KO extension anchor missing: '+a);source=source.split(a).join(b);}
 one("const matchFormat=(ko,isFinal=false)=>isFinal?(ko?.finalFormat||'first6'):(ko?.regularFormat||'first4');",
 "const matchFormat=(ko,isFinal=false,matchId=null)=>{const id=Number(matchId);if(ko?.tournamentFormats){if(id===32)return ko.tournamentFormats.bronze;if(id===21||id===22)return ko.tournamentFormats.semi;if(id>=13&&id<=16)return ko.tournamentFormats.quarter;}return isFinal?(ko?.finalFormat||'first6'):(ko?.regularFormat||'first4');};");
 one("function definitions(format){","function definitions(format,bronze=false){");
 one("if(format==='single')return [...a,...b,...c,wFinal];","if(format==='single')return [...a,...b,...c,wFinal,...(bronze?[{id:32,g:'B',r:1,slots:['L21','L22']}]:[])];");
 all("definitions(ko.format)","definitions(ko.format,ko.bronzeEnabled)");
 one("matchFormat(ko,d.g==='F'||ko.format==='single'&&d.id===25)","matchFormat(ko,d.g==='F'||ko.format==='single'&&d.id===25,d.id)");
 one("const label=(m,format)=>m.g==='F'?","const label=(m,format)=>m.g==='B'?'BRONZE MATCH':m.g==='F'?");
 one("  ko.champion=decider?.valid?","  const bronze=ko.bronzeEnabled?map[32]:null;ko.thirdPlace=bronze?.valid?ko.teams[bronze.winner-1].ids:null;\n  const complete=decider?.valid&&(!ko.bronzeEnabled||bronze?.valid);\n  ko.champion=complete?");
 all("=decider?.valid?","=complete?");
 all("matchFormat(ko,m.final)","matchFormat(ko,m.final,m.masterId)");
 one("function descendants(format,id){","function descendants(format,id,bronze=false){");
 one("const defs=definitions(format),seen","const defs=definitions(format,bronze),seen");
 one("fmt=matchFormat(ko,final);","fmt=matchFormat(ko,final,match.id);");
 one("descendants(ko.format,match.id)","descendants(ko.format,match.id,ko.bronzeEnabled)");
 one("s.ko=ko;s.stage='ko';dispatch(s);return ko;","if(s.mode==='fp-group-stage'){const cfg=s.groupKOOptions||{};ko.tournamentFormats={quarter:allowedFormat.has(cfg.quarter)?cfg.quarter:ko.regularFormat,semi:allowedFormat.has(cfg.semi)?cfg.semi:ko.regularFormat,bronze:allowedFormat.has(cfg.bronzeFormat)?cfg.bronzeFormat:ko.regularFormat};ko.bronzeEnabled=format==='single'&&!!cfg.bronze&&seeds.length>=4;ko.thirdPlace=null;}s.ko=ko;s.stage='ko';dispatch(s);return ko;");
 return source;
};
