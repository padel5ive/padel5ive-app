import fs from 'node:fs';
const must=[
 'public/index.html','public/og-cover.jpg',
 'public/modes/unified/index.html','public/modes/club-match/index.html',
 'public/results/unified/index.html','public/results/showdown/index.html',
 'netlify/functions/unified-results.mjs','netlify/functions/results.mjs',
 'public/assets/p5-direct-pdf.js','public/assets/p5-reporting-foundation.js',
 'public/assets/p5-reporting-foundation.css','public/assets/p5-interactive-results.js',
 'public/assets/p5-results-visual-v5514.css','public/assets/p5-results-nav-v5514.js',
 'public/assets/p5-showdown-engine.js','public/assets/p5-fair-cycle-v5515.js','public/assets/p5-showdown-results-v5514.js',
 'public/assets/p5-showdown-results-v5514.css','public/assets/fixed-master-official-results.css'
];
for(const p of must)if(!fs.existsSync(p)||fs.statSync(p).size<100)throw Error('Missing required deploy file: '+p);
const read=p=>fs.readFileSync(p,'utf8');
const home=read('public/index.html'),unified=read('public/modes/unified/index.html'),club=read('public/modes/club-match/index.html'),routes=read('netlify.toml');
if(!home.includes('window.P5PreviewLaunch=function')||!home.includes('START NEW SESSION'))throw Error('Unified launcher changed unexpectedly');
if(!unified.includes('P5PublicResults')||!unified.includes("case 'pdf-download'"))throw Error('Unified dashboard or PDF export damaged');
if(!club.includes('TEAM SHOWDOWN')&&!club.includes('Team Showdown'))throw Error('Team Showdown dashboard missing');
if(!unified.includes('P5ReportUI.openShare')||!club.includes('P5ReportUI.openShare'))throw Error('Shared publisher not wired to both dashboards');
if(!club.includes('P5DirectPDF.exportShowdown(showdownReportData())'))throw Error('Team Showdown direct PDF not connected');
if(!routes.includes('publish = "public"')||!routes.includes('functions = "netlify/functions"'))throw Error('Netlify publishing or functions config missing');
if(!read('netlify/functions/unified-share-page.mjs').includes("path: '/u/:id'")||!read('netlify/functions/unified-social-image.mjs').includes("path: '/social/u/*'")||!routes.includes('to = "/results/showdown/index.html"'))throw Error('Public results routes missing');
const viewer=read('public/assets/p5-interactive-results.js');
if(!viewer.includes('Knockout Bracket')||!viewer.includes('Analyze Your')||!viewer.includes('fetch(\'/api/unified-results'))throw Error('Unified real data viewer missing');
if(viewer.includes('P5_QA_DATA')||viewer.includes('data=check(window.P5_QA_DATA)'))throw Error('Unified QA demo accidentally included');
const showdown=read('public/assets/p5-showdown-results-v5514.js');
if(!showdown.includes("fetch('/api/results?id='")||!showdown.includes('E.stage1Stats(data)')||!showdown.includes('E.verdict(data)'))throw Error('Showdown real-data adapter missing');
if(showdown.includes('DEMO_DATA')||showdown.includes('P5_QA_DATA'))throw Error('Team Showdown fixture leaked into production');
const legacy=read('public/modes/unified/index.html');
if(legacy.includes("act('Download Official Report HTML'"))throw Error('Legacy HTML report export present');
console.log('PADEL 5IVE v5.5.15 fairness/reporting deployment checks passed:',must.length,'files.');
