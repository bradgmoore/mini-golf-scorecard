import { originalPlayers, totalAt as rawTotalAt, leadersAt as rawLeadersAt, rankedAt as rawRankedAt, metrics as rawMetrics, sum, validatePlayers } from './analytics.js';
const $=s=>document.querySelector(s), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=()=>structuredClone(originalPlayers), key='putt-report-scorecard-v1';
let players=copy(), edited=false, storageAvailable=true;
try {const saved=JSON.parse(localStorage.getItem(key));if(validatePlayers(saved)){players=saved.map((p,i)=>({...p,color:originalPlayers[i].color}));edited=true;}}catch{storageAvailable=false;}
let recordedPlayers=structuredClone(players), fraud=false;
let hole=18, mode='total', range='all', cumulative=false, visible=new Set(players.map(p=>p.id)), timer=null;
const bounds=()=>range==='front'?[1,9]:range==='back'?[10,18]:[1,18];
const totalAt=(p,h)=>rawTotalAt(p,h,bounds()[0]);
const leadersAt=(ps,h)=>rawLeadersAt(ps,h,bounds()[0]);
const rankedAt=(ps,h)=>rawRankedAt(ps,h,bounds()[0]);
const metrics=ps=>rawMetrics(ps,...bounds());
function applyAlternate(){
 players=structuredClone(recordedPlayers);
 if(fraud){const ordered=rawRankedAt(recordedPlayers,18);players=players.map(p=>({...p,scores:[...(p.id==='brad'?ordered[0]:p.id==='phil'?ordered[2]:ordered[1]).scores]}));}
 $('#alternate-notice').hidden=!fraud;
 document.body.classList.toggle('alternate-mode',fraud);
}
const signed=n=>n===0?'E':`${n>0?'+':''}${n}`;
const names=ps=>ps.map(p=>p.name).join(' & ');
function renderStandings(){
 const [start,end]=bounds(),count=end-start+1,stats=metrics(players), winners=leadersAt(players,end), next=stats.find(p=>p.total>stats[0].total);
 $('#result-label').textContent=range==='front'?'FRONT NINE RESULT':range==='back'?'BACK NINE RESULT':'THE WINNING ROUND';
 $('#winner-name').textContent=names(winners);$('#winner-score').textContent=stats[0].total;$('#winner-par').textContent=`${signed(stats[0].par)} to par`;
 $('#winner-margin').textContent=winners.length>1?`Shared victory${next?` · ${next.total-stats[0].total} strokes ahead`:''}`:`A ${next.total-stats[0].total}-stroke victory`;
 $('#standings').innerHTML=stats.map(p=>{const rank=1+stats.filter(q=>q.total<p.total).length;return `<article class="standing-card" style="--player:${p.color}"><div class="standing-top"><div class="player-heading"><span class="rank">${String(rank).padStart(2,'0')}</span><strong>${esc(p.name)}</strong></div><span class="rank-label">${rank===1?'WINNER':`${p.total-stats[0].total} BACK`}</span></div><div class="standing-main"><strong>${p.total}</strong><span>strokes</span><small>${signed(p.par)} to par</small></div><div class="standing-details"><span>OUT <b>${p.front}</b></span><span>IN <b>${p.back}</b></span><span>BEST HOLE <b>${Math.min(...p.scores.slice(start-1,end))}</b></span></div></article>`}).join('');
 const winner=stats[0], aces=players.flatMap(p=>p.scores.flatMap((s,i)=>s===1&&i+1>=start&&i+1<=end?[{p,h:i+1}]:[]));
 let lastChange=start;
 for(let h=start+1;h<=end;h++){if(leadersAt(players,h).map(p=>p.id).sort().join(',')!==leadersAt(players,h-1).map(p=>p.id).sort().join(','))lastChange=h;}
 const holeLeads=Array.from({length:count},(_,i)=>leadersAt(players,start+i));
 const onlyLead=holeLeads.filter(l=>l.length===1&&l[0].id===winner.id).length;
 $('#insights').innerHTML=`<article class="insight"><div class="stat">${String(lastChange).padStart(2,'0')}</div><strong>The final lead change</strong><p>${esc(names(winners))} ${winners.length===1?'held the outright lead':'shared the lead'} from hole ${lastChange} through hole ${end}.</p></article><article class="insight"><div class="stat">${aces.length?String(aces.length).padStart(2,'0'):String(winner.pars).padStart(2,'0')}</div><strong>${aces.length?'Hole-in-one moments':'Par or better'}</strong><p>${aces.length?aces.map(a=>`${esc(a.p.name)} aced hole ${a.h}.`).join(' '):`${esc(winner.name)} scored two strokes or fewer on ${winner.pars} holes.`}</p></article><article class="insight"><div class="stat">${String(winner.leadHoles).padStart(2,'0')}<span style="font-size:15px"> / ${count}</span></div><strong>Holes at the top</strong><p>${esc(winner.name)} led outright after ${onlyLead} holes and shared the lead after ${winner.leadHoles-onlyLead}. Lead is measured after each completed hole.</p></article>`;
 const brad=players.find(p=>p.id==='brad'),phil=players.find(p=>p.id==='phil');let wins=0,ties=0,losses=0;
 for(let h=start;h<=end;h++){const difference=brad.scores[h-1]-phil.scores[h-1];if(difference<0)wins++;else if(difference===0)ties++;else losses++;}
 const margin=totalAt(brad,end)-totalAt(phil,end);
 $('#matchup').innerHTML=`<div><strong>${esc(brad.name)} vs ${esc(phil.name)}</strong><span>${range==='all'?'Full round':range==='front'?'Front nine':'Back nine'} · ${margin===0?'Tied on strokes':margin<0?`${esc(brad.name)} wins by ${-margin}`:`${esc(phil.name)} wins by ${margin}`} ${margin===0?'':'strokes'}</span></div><div class="match-record"><span><b>${wins}</b> hole wins</span><span><b>${ties}</b> ties</span><span><b>${losses}</b> hole losses</span></div>`;
 $('#storage-status').textContent=edited?(storageAvailable?'Edited · saved locally':'Edited · this session'):'Original card';
}
function renderToggles(){
 $('#player-toggles').innerHTML=players.map(p=>`<button data-player="${p.id}" aria-pressed="${visible.has(p.id)}" style="--player:${p.color}"><i class="dot"></i>${esc(p.name)}</button>`).join('');
}
function chartValue(p,h){if(mode==='total')return totalAt(p,h);if(mode==='par')return totalAt(p,h)-2*(h-bounds()[0]+1);return totalAt(p,h)-Math.min(...players.map(q=>totalAt(q,h)));}
function drawChart(){
 const [start,end]=bounds(),count=end-start+1;
 const active=players.filter(p=>visible.has(p.id));
 const vals=active.flatMap(p=>Array.from({length:count+1},(_,i)=>chartValue(p,start-1+i)));
 let min=Math.min(0,...vals),max=Math.max(4,...vals);const step=(max-min)>45?10:(max-min)>20?5:(max-min)>10?4:2;
 min=Math.floor(min/step)*step;max=Math.ceil(max/step)*step;if(max===min)max=min+step;
 const width=Math.max(300,Math.round($('#chart-container').clientWidth));
 $('#chart').setAttribute('viewBox',`0 0 ${width} 330`);
 const right=width-20,x=h=>48+(h-start+1)*(right-48)/count,y=v=>278-(v-min)/(max-min)*250;
 let html='';for(let v=min;v<=max;v+=step)html+=`<line class="grid" x1="48" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text x="34" y="${y(v)+4}" text-anchor="end">${mode==='par'?signed(v):v}</text>`;
 html+='<text x="48" y="14">'+(mode==='gap'?'STROKES BEHIND THE LEADER':mode==='par'?'CUMULATIVE SCORE TO PAR':'CUMULATIVE STROKES')+'</text>';
 for(let h=start-1;h<=end;h++){if(width<500&&h>start-1&&h%2===1)continue;html+=`<text x="${x(h)}" y="307" text-anchor="middle">${h===start-1?'Start':h}</text>`;}
 html+=`<text x="${right}" y="329" text-anchor="end">HOLE</text><line class="selected-line" x1="${x(hole)}" x2="${x(hole)}" y1="25" y2="280"/>`;
 for(const p of active){const points=Array.from({length:count+1},(_,i)=>{const h=start-1+i;return `${x(h)},${y(chartValue(p,h))}`;});html+=`<polyline class="series" points="${points.join(' ')}" stroke="${p.color}" opacity=".2"/><polyline class="series" points="${points.slice(0,hole-start+2).join(' ')}" stroke="${p.color}"/>`;for(let h=start;h<=end;h++)html+=`<circle cx="${x(h)}" cy="${y(chartValue(p,h))}" r="${h===hole?5:2.7}" fill="${p.color}" opacity="${h<=hole?1:.35}" stroke="#fffefa" stroke-width="1.5"/>`;}
 for(let h=start;h<=end;h++)html+=`<rect class="hit" data-hole="${h}" x="${x(h)-(right-48)/(count*2)}" y="20" width="${(right-48)/count}" height="268"><title>Hole ${h}: ${esc(names(leadersAt(players,h)))} leads. ${players.map(p=>`${esc(p.name)} ${totalAt(p,h)}`).join(', ')} cumulative strokes.</title></rect>`;
 $('#chart').innerHTML=html;$('#chart-description').textContent=(range==='all'?'Full round. ':range==='front'?'Holes 1–9, starting from zero. ':'Holes 10–18, starting from zero. ')+(mode==='total'?'Cumulative strokes after each hole. Lower is better.':mode==='par'?'Cumulative strokes above or below par 2 per hole. Lower is better.':'Distance behind the selected section’s leader after each hole. Zero means in the lead.');
}
function renderTimeline(){
 const [start,end]=bounds(),count=end-start+1;$('#lead-timeline').style.gridTemplateColumns=`repeat(${count},1fr)`;
 $('#lead-timeline').innerHTML=Array.from({length:count},(_,i)=>{const h=start+i;let ls=leadersAt(players,h);let bg=ls.length===1?ls[0].color:`repeating-linear-gradient(135deg,${ls.map((p,j)=>`${p.color} ${j*6}px,${p.color} ${(j+1)*6}px`).join(',')})`;return `<button data-hole="${h}" aria-pressed="${hole===h}" aria-label="Hole ${h}: ${esc(names(ls))} ${ls.length===1?'leads':'tied for lead'}" title="${esc(names(ls))}${ls.length>1?' · tied':''}" style="--lead-bg:${bg}"><i></i>${h}</button>`}).join('');
}
function renderSummary(){
 const [start,end]=bounds();$('#hole-slider').min=start;$('#hole-slider').max=end;
 const ls=leadersAt(players,hole), ranks=rankedAt(players,hole), low=totalAt(ranks[0],hole), next=ranks.find(p=>totalAt(p,hole)>low);
 $('#hole-value').textContent=hole;$('#hole-slider').value=hole;
 $('#hole-summary').innerHTML=`<div><strong>${esc(names(ls))} ${hole===end?(ls.length>1?'share the win':'wins'):(ls.length>1?'share the lead':'leads')} ${next?`by ${totalAt(next,hole)-low} stroke${totalAt(next,hole)-low===1?'':'s'}`:''}</strong><p>After hole ${hole} · ${hole===end?(range==='all'?'Round complete':'Nine complete'):`${end-hole} holes to play`}${ls.length>1?' · Tied on cumulative strokes':''}</p></div><div class="hole-standing">${ranks.map(p=>`<span style="--player:${p.color}"><i class="dot"></i>${esc(p.name)} <b>${totalAt(p,hole)}</b></span>`).join('')}</div>`;
}
function renderTable(){
 const start=range==='back'?10:1,end=range==='front'?9:18;
 $('#score-table thead').innerHTML=`<tr><th scope="col">Hole</th><th scope="col">Par</th>${players.map(p=>`<th scope="col" style="--player:${p.color}"><i class="dot"></i>${esc(p.name)}</th>`).join('')}<th scope="col">Section leader</th></tr>`;
 $('#score-table tbody').innerHTML=Array.from({length:end-start+1},(_,i)=>{const h=start+i,ls=leadersAt(players,h),best=Math.min(...players.map(p=>p.scores[h-1]));return `<tr class="${hole===h?'selected-row ':''}${h===9?'nine-end':''}"><td><button class="hole-link" data-hole="${h}" aria-label="Explore hole ${h}" aria-pressed="${hole===h}">${String(h).padStart(2,'0')}</button></td><td>${cumulative?2*(h-bounds()[0]+1):2}</td>${players.map(p=>`<td><span class="score-cell ${!cumulative&&p.scores[h-1]===best?'best':''}">${cumulative?totalAt(p,h):p.scores[h-1]}</span></td>`).join('')}<td><span class="leader-label">${ls.map(p=>`<i class="dot" style="--player:${p.color}"></i>`).join('')}${esc(names(ls))}${ls.length>1?' · tie':''}</span></td></tr>`}).join('');
 const rows=range==='all'?[['Front 9',0,9],['Back 9',9,18],['Final total',0,18]]:range==='front'?[['Front 9',0,9]]:[['Back 9',9,18]];
 $('#score-table tfoot').innerHTML=rows.map(([label,a,b])=>`<tr><td>${label}</td><td>${2*(b-a)}</td>${players.map(p=>`<td><span class="score-cell">${sum(p.scores.slice(a,b))}</span></td>`).join('')}<td>${b===18&&a===0?`${esc(names(leadersAt(players,18)))} · ${leadersAt(players,18).length>1?'shared win':'winner'}`:'Section totals'}</td></tr>`).join('');
 $('.table-key span:first-child').style.display=cumulative?'none':'flex';
}
function selectHole(h){hole=Number(h);drawChart();renderTimeline();renderSummary();renderTable();$('#chart-tooltip').hidden=true;}
function renderAll(){renderStandings();renderToggles();selectHole(hole);}
function stopReplay(){clearInterval(timer);timer=null;$('#play-button span').textContent='Replay';$('#play-button').setAttribute('aria-label','Replay round');}
function manualHole(h){stopReplay();selectHole(h);}
$('#hole-slider').addEventListener('input',e=>manualHole(e.target.value));
$('#finish-button').addEventListener('click',()=>manualHole(bounds()[1]));
$('#lead-timeline').addEventListener('click',e=>{const b=e.target.closest('[data-hole]');if(b)manualHole(b.dataset.hole)});
$('#score-table').addEventListener('click',e=>{const b=e.target.closest('[data-hole]');if(b)manualHole(b.dataset.hole)});
$('#chart').addEventListener('click',e=>{if(e.target.dataset.hole)manualHole(e.target.dataset.hole)});
$('#chart').addEventListener('pointermove',e=>{const h=Number(e.target.dataset.hole);if(!h){$('#chart-tooltip').hidden=true;return;}const tip=$('#chart-tooltip');tip.innerHTML=`<strong>After hole ${h}</strong>${players.filter(p=>visible.has(p.id)).map(p=>`<div style="--player:${p.color}"><i class="dot"></i>${esc(p.name)}<b>${mode==='par'?signed(chartValue(p,h)):chartValue(p,h)}</b></div>`).join('')}`;tip.hidden=false;const box=$('#chart-container').getBoundingClientRect();tip.style.left=`${Math.max(0,Math.min(e.clientX-box.left+12,box.width-tip.offsetWidth))}px`;});
$('#chart').addEventListener('pointerleave',()=>{$('#chart-tooltip').hidden=true});
$('#chart-modes').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;mode=b.dataset.mode;$('#chart-modes').querySelectorAll('button').forEach(q=>q.setAttribute('aria-pressed',q===b));drawChart();});
$('#player-toggles').addEventListener('click',e=>{const b=e.target.closest('[data-player]');if(!b)return;const id=b.dataset.player;if(visible.has(id)){if(visible.size===1)return;visible.delete(id)}else visible.add(id);renderToggles();drawChart();});
function setRange(next){stopReplay();range=next;hole=bounds()[1];document.querySelectorAll('[data-range]').forEach(q=>q.setAttribute('aria-pressed',q.dataset.range===range));renderAll();}
for(const id of ['#table-ranges','#round-ranges'])$(id).addEventListener('click',e=>{const b=e.target.closest('[data-range]');if(b)setRange(b.dataset.range);});
$('#fraud-toggle').addEventListener('change',e=>{stopReplay();fraud=e.target.checked;applyAlternate();renderAll();});
$('#cumulative-toggle').addEventListener('change',e=>{cumulative=e.target.checked;renderTable();});
$('#play-button').addEventListener('click',()=>{if(timer){stopReplay();return;}if(hole===bounds()[1])selectHole(bounds()[0]);$('#play-button span').textContent='Pause';$('#play-button').setAttribute('aria-label','Pause replay');timer=setInterval(()=>{if(hole>=bounds()[1]){stopReplay();return;}selectHole(hole+1);if(hole===bounds()[1])stopReplay();},900);});
const csvCell=s=>'"'+String(s).replaceAll('"','""')+'"';
$('#export-button').addEventListener('click',()=>{const [start,end]=bounds();const rows=[['Scorecard',fraud?'Alternate / creative scorekeeping':'Recorded scores'],['Section',range],['Hole','Par',...players.map(p=>p.name),...players.map(p=>p.name+' running total'),'Overall leader'],...Array.from({length:end-start+1},(_,j)=>{const i=start-1+j;return [i+1,2,...players.map(p=>p.scores[i]),...players.map(p=>totalAt(p,i+1)),names(leadersAt(players,i+1))]}),['Front 9',18,...players.map(p=>sum(p.scores.slice(0,9)))],['Back 9',18,...players.map(p=>sum(p.scores.slice(9)))],['Selected section total',2*(end-start+1),...players.map(p=>totalAt(p,end))]];const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mini-golf-${range}${fraud?'-alternate':''}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function editorFields(data){$('#edit-fields').innerHTML=data.map(p=>`<fieldset class="editor-player" style="border-left:0;border-right:0;border-bottom:0;margin:0"><legend class="sr-only">${esc(p.name)} scores</legend><label>Player <input name="${p.id}-name" type="text" value="${esc(p.name)}" required maxlength="30" aria-label="${esc(p.name)} name"></label><div class="editor-holes">${p.scores.map((s,i)=>`<label>Hole ${i+1}<input name="${p.id}-${i}" type="number" min="1" max="20" step="1" required value="${s}" aria-label="${esc(p.name)}, hole ${i+1}"></label>`).join('')}</div></fieldset>`).join('');}
$('#edit-button').addEventListener('click',()=>{stopReplay();editorFields(recordedPlayers);$('#edit-dialog').showModal();});
$('#close-dialog').addEventListener('click',()=>$('#edit-dialog').close());
$('#reset-button').addEventListener('click',()=>{recordedPlayers=copy();applyAlternate();edited=false;try{localStorage.removeItem(key)}catch{}editorFields(recordedPlayers);renderAll();$('#edit-dialog').close();});
$('#edit-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.target);const next=originalPlayers.map(p=>({...p,name:String(data.get(p.id+'-name')).trim(),scores:p.scores.map((_,i)=>Number(data.get(p.id+'-'+i)))}));if(!validatePlayers(next)){const input=e.target.querySelector('input[type=text]');input.setCustomValidity('Enter a player name and whole-number scores from 1 to 20.');input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});return;}recordedPlayers=next;applyAlternate();edited=JSON.stringify(recordedPlayers)!==JSON.stringify(originalPlayers);try{localStorage.setItem(key,JSON.stringify(recordedPlayers))}catch{storageAvailable=false;}renderAll();$('#edit-dialog').close();});
let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(drawChart);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopReplay();});
renderAll();
