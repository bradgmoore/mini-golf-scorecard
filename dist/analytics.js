export const originalPlayers = [
  { id: 'phil', name: 'Phil', color: '#22765a', scores: [2,3,2,5,3,2,3,6,2,2,3,3,3,3,2,2,2,2] },
  { id: 'brad', name: 'Brad', color: '#c27635', scores: [3,2,4,4,2,2,3,5,4,2,2,4,1,3,2,4,4,3] },
  { id: 'taryn', name: 'Taryn', color: '#7764aa', scores: [3,2,2,5,4,5,3,5,3,2,3,4,5,4,5,5,6,3] }
];
export const sum = scores => scores.reduce((a,b)=>a+b,0);
export const totalAt = (player,hole,start=1) => sum(player.scores.slice(start-1,hole));
export function leadersAt(players,hole,start=1) {
  const low = Math.min(...players.map(p=>totalAt(p,hole,start)));
  return players.filter(p=>totalAt(p,hole,start)===low);
}
export function rankedAt(players,hole,start=1) { return [...players].sort((a,b)=>totalAt(a,hole,start)-totalAt(b,hole,start)); }
export function metrics(players,start=1,end=18) {
  return players.map(p=>({...p, total:totalAt(p,end,start), front:totalAt(p,9), back:sum(p.scores.slice(9)), par:totalAt(p,end,start)-2*(end-start+1),
    leadHoles:Array.from({length:end-start+1},(_,i)=>leadersAt(players,start+i,start).some(l=>l.id===p.id)).filter(Boolean).length,
    holeWins:p.scores.slice(start-1,end).filter((score,i)=>score===Math.min(...players.map(q=>q.scores[start-1+i]))).length,
    pars:p.scores.slice(start-1,end).filter(s=>s<=2).length
  })).sort((a,b)=>a.total-b.total);
}
export function validatePlayers(players) {
  return Array.isArray(players) && players.length===3 && players.every((p,i)=>p.id===originalPlayers[i].id && typeof p.name==='string' && p.name.trim().length>0 && p.name.length<=30 && Array.isArray(p.scores) && p.scores.length===18 && p.scores.every(s=>Number.isInteger(s)&&s>=1&&s<=20));
}
