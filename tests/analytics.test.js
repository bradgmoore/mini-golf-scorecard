import test from 'node:test';
import assert from 'node:assert/strict';
import {originalPlayers as p,totalAt,leadersAt,metrics,validatePlayers} from '../dist/analytics.js';
test('transcribed card has checked front, back, and grand totals',()=>{
 assert.deepEqual(metrics(p).map(x=>[x.name,x.front,x.back,x.total]),[['Phil',28,22,50],['Brad',29,25,54],['Taryn',32,37,69]]);
});
test('lead history accounts for ties and the final comeback',()=>{
 const names=h=>leadersAt(p,h).map(x=>x.name);
 assert.deepEqual(names(2),['Phil','Brad','Taryn']);
 assert.deepEqual(names(8),['Brad']);assert.deepEqual(names(11),['Phil','Brad']);
 for(const h of [13,14,15])assert.deepEqual(names(h),['Brad']);
 for(const h of [16,17,18])assert.deepEqual(names(h),['Phil']);
 assert.equal(totalAt(p[1],18)-totalAt(p[0],18),4);
});
test('validates saved scores, preserving recorded sixes and rejecting incomplete or fractional data',()=>{
 assert.ok(validatePlayers(p));const bad=structuredClone(p);bad[0].scores[1]=2.5;assert.equal(validatePlayers(bad),false);
 bad[0].scores[1]=3;bad[0].name=' ';assert.equal(validatePlayers(bad),false);
});
test('supports tied final winners after corrections',()=>{
 const corrected=structuredClone(p);corrected[1].scores=corrected[0].scores.slice();
 assert.deepEqual(leadersAt(corrected,18).map(x=>x.name),['Phil','Brad']);
});
