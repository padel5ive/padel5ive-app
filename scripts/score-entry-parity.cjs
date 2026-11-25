/* Shared score picker for Match Control and Team Showdown. */
'use strict';
const fs = require('node:fs');

function scorePicker(name, target, value, attributes) {
 const options = Array.from({length: target + 1}, (_, games) =>
  `<option value="${games}" ${value !== '' && Number(value) === games ? 'selected' : ''}>${games}</option>`).join('');
 return `<select class="p5-score-control" ${attributes} aria-label="Final games for ${esc(name)}"><option value="">—</option>${options}</select>`;
}

const css = `
:is(#p5-modal-root,#app) .p5-score-entry {
 color-scheme:dark;
}
:is(#p5-modal-root,#app) :is(.p5-score-entry .p5-score-wells,.p5-score-entry.p5-score-wells) {
 display:grid!important;
 grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr)!important;
 align-items:end!important;
 column-gap:8px!important;
}
:is(#p5-modal-root,#app) .p5-score-entry .p5-score-well {
 display:grid!important;
 grid-template-rows:1fr 54px;
 align-self:stretch;
 align-items:end!important;
 gap:7px!important;
 width:100%;
 min-width:0!important;
 max-width:none;
 margin:0;
 text-align:center;
}
:is(#p5-modal-root,#app) .p5-score-entry .p5-score-well > :is(strong,span) {
 min-height:30px!important;
 justify-content:center!important;
 text-align:center;
 line-height:1.35;
 overflow-wrap:anywhere;
}
:is(#p5-modal-root,#app) .p5-score-entry .p5-score-divider {
 display:grid;
 place-items:center;
 align-self:end;
 height:54px;
 margin:0!important;
 padding:0!important;
 line-height:1;
 font-size:16px;
 font-weight:650;
 color:#bfae94;
}
:is(#p5-modal-root,#app) .p5-score-entry .p5-score-control {
 appearance:none;
 -webkit-appearance:none;
 display:block!important;
 box-sizing:border-box;
 width:100%!important;
 min-width:0!important;
 height:54px!important;
 min-height:54px!important;
 margin:0!important;
 padding:0 26px!important;
 cursor:pointer;
 border:1px solid #647989!important;
 border-radius:10px!important;
 color:#f5eee3!important;
 background:#11212e url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='10' viewBox='0 0 14 10'%3E%3Cpath d='m2 2.5 5 5 5-5' fill='none' stroke='%23d8bb94' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 10px center!important;
 box-shadow:inset 0 1px 5px rgba(0,0,0,.19);
 line-height:1.2;
 font-family:inherit;
 font-size:24px!important;
 font-weight:750!important;
 font-variant-numeric:tabular-nums;
 text-align:center;
 text-align-last:center;
}
:is(#p5-modal-root,#app) .p5-score-entry .p5-score-control:has(option[value=""]:checked) {
 color:#aabcc8!important;
}
:is(#p5-modal-root,#app) .p5-score-entry .p5-score-control:focus-visible {
 border-color:#d8bb94!important;
 outline:2px solid #d8bb94!important;
 outline-offset:2px;
}
#p5-modal-root .p5-score-entry #modal-error:not([style]) {
 display:none!important;
}
#app .p5-score-entry .p5-score-format {
 color:#b7c4cc;
 font-size:10px;
 font-weight:700;
 letter-spacing:.09em;
 text-transform:uppercase;
}
#app .p5-score-entry.history-inline-editor .history-edit-actions {
 grid-column:1/-1;
}
`;

// Keep each engine's own dialog, confirmation, validation and scoring actions.
function transform(file, apply) {
 let html = fs.readFileSync(file, 'utf8');
 function removeBetween(first, next) {
  const start = html.indexOf(first);
  const end = html.indexOf(next, start + first.length);
  if (start < 0 || end < 0) throw Error(file + ': missing obsolete score handler anchors');
  html = html.slice(0, start) + html.slice(end);
 }
 function replace(before, after) {
  const count = html.split(before).length - 1;
  if (count !== 1) throw Error(file + ': score entry anchor count ' + count + ' for ' + before.slice(0, 70));
  html = html.replace(before, () => after);
 }
 apply(replace, removeBetween);
 const head = html.indexOf('</head>');
 if (head < 0 || head > html.indexOf('<body')) throw Error(file + ': missing document head');
 html = html.slice(0, head) + '<style id="p5-score-entry-style">\n' + css + '</style>\n' + html.slice(head);
 fs.writeFileSync(file, html);
}

transform('public/modes/unified/index.html', replace => {
 const modal = ' function modal(s){';
 replace(modal, ' '+scorePicker.toString()+'\n'+modal);
 replace(
  'class="p5-score-dual-team"><span class="p5-polish-team-label">SIDE ${side.toUpperCase()}</span>',
  'class="p5-score-dual-team p5-score-well">'
 );
 replace(
  '<select class="p5-score-dual-select" id="p5-score-${side}" data-p5-score-side="${side}" aria-label="Final games for ${esc(name)}"><option value="" ${value===\'\'?\'selected\':\'\'}>—</option>${Array.from({length:target+1},(_,i)=>`<option value="${i}" ${value===i?\'selected\':\'\'}>${i}</option>`).join(\'\')}</select>',
  '${scorePicker(name,target,value,`id="p5-score-${side}" data-p5-score-side="${side}"`)}'
 );
 // Score entry events use the side attribute, independent of appearance.
 replace("if(e.target.matches('.p5-score-dual-select'))updatePolishScore(e.target.dataset.p5ScoreSide);if(e.target.id", "if(e.target.matches('[data-p5-score-side]'))updatePolishScore(e.target.dataset.p5ScoreSide);if(e.target.id");
 replace("if(e.target.matches('.p5-score-dual-select'))updatePolishScore(e.target.dataset.p5ScoreSide);\n", "if(e.target.matches('[data-p5-score-side]'))updatePolishScore(e.target.dataset.p5ScoreSide);\n");
 replace('<div class="p5-score-dual-grid">', '<div class="p5-score-dual-grid p5-score-wells">');
 replace('<span class="p5-score-dual-vs">×</span>', '<span class="p5-score-dual-vs p5-score-divider" aria-hidden="true">×</span>');
 replace('p5-v2-modal ${m.type===\'roster\'', 'p5-v2-modal ${m.type===\'score\'||m.type===\'ko-edit\'?\'p5-score-entry\':\'\'} ${m.type===\'roster\'');
});

function showdownScoreGrid(format, sideA, sideB, attributes, scoreA = '', scoreB = '') {
 const well = (side, name, value) => `<label class="p5-score-well"><span>${esc(name)}</span>${scorePicker(name, format.target, value ?? '', attributes(side))}</label>`;
 return `${well('A',sideA,scoreA)}<span class="p5-score-divider" aria-hidden="true">×</span>${well('B',sideB,scoreB)}`;
}

function showdownScoreHint(format) {
 return format.kind === 'total' ? 'Enter one score; the other updates.' : 'Choose the losing score; winner scores '+format.target+'.';
}

function syncShowdownScore(field) {
 const grid = field.closest('[data-score-target]');
 const other = grid.querySelector('.p5-score-control[data-side="'+(field.dataset.side === 'A' ? 'B' : 'A')+'"]');
 const target = Number(grid.dataset.scoreTarget);
 const score = Number(field.value);
 if (field.value === '') other.value = '';
 else if (grid.dataset.scoreKind === 'total') other.value = String(target - score);
 else if (score < target) other.value = String(target);
 else if (Number(other.value) === target) other.value = '';
}

const showcaseHelpers = [scorePicker, showdownScoreGrid, showdownScoreHint, syncShowdownScore]
 .map(fn => fn.toString()).join('\n');
const gridAttrs = 'data-score-kind="${f.kind}" data-score-target="${f.target}"';
const formatLabel = '<div class="p5-score-format">${f.kind===\'total\'?\'Total of \':\'First to \'}${f.target}</div>';

function updateShowdownHistoryAndEvents(replace, removeBetween) {
 const historyStart = '<div class="history-inline-editor" role="group" aria-label="Edit match score"><label>${esc(club(\'A\'))}<input type="number" min="0" max="${E.fmt(state.setup.format).target}" inputmode="numeric" data-history-score data-id="${id}" data-side="A" value="${m.scoreA}"></label><span aria-hidden="true">–</span><label>${esc(club(\'B\'))}<input type="number" min="0" max="${E.fmt(state.setup.format).target}" inputmode="numeric" data-history-score data-id="${id}" data-side="B" value="${m.scoreB}"></label>';
 replace(' container.innerHTML=`'+historyStart, ' const f=E.fmt(state.setup.format);\n container.innerHTML=`<div class="history-inline-editor p5-score-entry p5-score-wells" role="group" aria-label="Edit match score" '+gridAttrs+'>${showdownScoreGrid(f,club(\'A\'),club(\'B\'),side=>`data-history-score data-id="${id}" data-side="${side}"`,m.scoreA,m.scoreB)}');
 replace("if(el.matches('[data-stage1-score]'))setAutoScore(el);if(el.matches('[data-history-score]'))setHistoryAutoScore(el);if(el.matches('[data-custom-score]'))setDuelAutoScore(el);", "if(el.matches('.p5-score-control'))syncShowdownScore(el);");
 removeBetween('function setAutoScore(input)', 'function getLineup(');
 replace("document.addEventListener('change',e=>{const el=e.target;", "document.addEventListener('change',e=>{const el=e.target;if(el.matches('.p5-score-control'))syncShowdownScore(el);");
}

transform('public/modes/club-match/v097/index.html', (replace, removeBetween) => {
 const dialog = 'function stage1ScoreDialogHTML(match){';
 replace(dialog, showcaseHelpers+'\n'+dialog);
 replace('<div class="p5-v2-modal p5-showdown-score-modal" role="dialog" aria-modal="true" aria-label="Confirm Match Score">\n',
  '<div class="p5-v2-modal p5-showdown-score-modal p5-score-entry" role="dialog" aria-modal="true" aria-label="Confirm Match Score">\n');
 replace('<h2>CONFIRM MATCH SCORE</h2>\n <div class="p5-v2-modal-score"><label><span>${esc(pA)}</span><input id="modal-a" type="number" min="0" max="${f.target}" inputmode="numeric" data-stage1-score data-id="${match.id}" data-side="A" placeholder="–" aria-label="${esc(pA)} games"></label><span class="p5sm-modal-versus">×</span><label><span>${esc(pB)}</span><input id="modal-b" type="number" min="0" max="${f.target}" inputmode="numeric" data-stage1-score data-id="${match.id}" data-side="B" placeholder="–" aria-label="${esc(pB)} games"></label></div>',
  '<h2>CONFIRM MATCH SCORE</h2>\n '+formatLabel+'\n <div class="p5-v2-modal-score p5-score-wells" '+gridAttrs+'>${showdownScoreGrid(f,pA,pB,side=>`id="modal-${side.toLowerCase()}" data-stage1-score data-id="${match.id}" data-side="${side}"`)}</div>');
 replace('${f.kind===\'total\'?`Total of ${f.target} · opponent auto-fills`:`First to ${f.target} · enter both scores`}', '${showdownScoreHint(f)}');
 replace('class="p5-v2-modal p5-showdown-score-modal" role="dialog" aria-modal="true" aria-label="Confirm Match Score"><div class="p5sm-modal-over">${lbl}',
  'class="p5-v2-modal p5-showdown-score-modal p5-score-entry" role="dialog" aria-modal="true" aria-label="Confirm Match Score"><div class="p5sm-modal-over">${lbl}');
 replace('<div class="p5sm-modal-pairs"><span>${esc(m.playersA.map(playerName).join(\' & \'))}</span><span>${esc(m.playersB.map(playerName).join(\' & \'))}</span></div>${scoreEditor', '${scoreEditor');
 const duelStart = '<div class="duel-score-grid"><label><span>${esc(club(\'A\'))}</span><input type="number" min="0" max="${f.target}" inputmode="numeric" data-custom-score="${kind}" data-id="${m.id}" data-side="A" value="${score(\'scoreA\')}" aria-label="${esc(club(\'A\'))} score"></label><strong>×</strong><label><span>${esc(club(\'B\'))}</span><input type="number" min="0" max="${f.target}" inputmode="numeric" data-custom-score="${kind}" data-id="${m.id}" data-side="B" value="${score(\'scoreB\')}" aria-label="${esc(club(\'B\'))} score"></label></div>';
 replace(duelStart, formatLabel+'<div class="duel-score-grid p5-score-wells" '+gridAttrs+'>${showdownScoreGrid(f,m.playersA.map(playerName).join(\' & \'),m.playersB.map(playerName).join(\' & \'),side=>`data-custom-score="${kind}" data-id="${m.id}" data-side="${side}"`,score(\'scoreA\'),score(\'scoreB\'))}</div>');
 replace('${f.kind===\'total\'?`Total of ${f.target} · opponent auto-fills`:`First to ${f.target} · no draws`}', '${showdownScoreHint(f)}');
 updateShowdownHistoryAndEvents(replace, removeBetween);
});

// Previously saved Classic sessions have inline score entry with the same format rules.
transform('public/modes/club-match/index.html', (replace, removeBetween) => {
 const court = 'function courtHTML(match){';
 replace(court, showcaseHelpers+'\n'+court);
 replace('<article class="court live-court" data-court-match="${match.id}">', '<article class="court live-court p5-score-entry" data-court-match="${match.id}">');
 replace('<div class="scorepairs">\n   <div class="scorepair"', '<div class="scorepairs p5-score-wells" '+gridAttrs+'>\n   <div class="scorepair p5-score-well"');
 replace('<div class="court-score-separator">:</div>\n   <div class="scorepair"', '<span class="p5-score-divider" aria-hidden="true">×</span>\n   <div class="scorepair p5-score-well"');
 for (const [side, name] of [['A','pA'], ['B','pB']]) {
  replace(
   '<input class="court-score-input" type="number" inputmode="numeric" min="0" max="${f.target}" placeholder="–" data-stage1-score data-id="${match.id}" data-side="'+side+'" aria-label="${esc('+name+')} games on Court ${match.court}">',
   '${scorePicker('+name+',f.target,\'\',`data-stage1-score data-id="${match.id}" data-side="'+side+'"`)}'
  );
 }
 replace('${f.kind===\'total\'?`Total of ${f.target} · Opponent auto-fills`:`First to ${f.target} · Enter both scores`}', '${showdownScoreHint(f)}');
 const duel = '<div class="duel-score-section"><div class="duel-score-grid"><label><span>${esc(club(\'A\'))}</span><input type="number" min="0" max="${f.target}" inputmode="numeric" data-custom-score="${kind}" data-id="${m.id}" data-side="A" value="${score(\'scoreA\')}" aria-label="${esc(club(\'A\'))} score"></label><strong>:</strong><label><span>${esc(club(\'B\'))}</span><input type="number" min="0" max="${f.target}" inputmode="numeric" data-custom-score="${kind}" data-id="${m.id}" data-side="B" value="${score(\'scoreB\')}" aria-label="${esc(club(\'B\'))} score"></label></div>';
 replace(duel, '<div class="duel-score-section p5-score-entry">'+formatLabel+'<div class="duel-score-grid p5-score-wells" '+gridAttrs+'>${showdownScoreGrid(f,club(\'A\'),club(\'B\'),side=>`data-custom-score="${kind}" data-id="${m.id}" data-side="${side}"`,score(\'scoreA\'),score(\'scoreB\'))}</div>');
 replace('${f.kind===\'total\'?`Total of ${f.target} · opponent auto-fills`:`First to ${f.target} · no draws`}', '${showdownScoreHint(f)}');
 updateShowdownHistoryAndEvents(replace, removeBetween);
});

console.log('PASS shared score picker: Match Control, knockout and Team Showdown');
