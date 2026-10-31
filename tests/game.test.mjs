import {test} from 'node:test';
import assert from 'node:assert/strict';
import {closesAt, validatePrediction, scorePrediction} from '../lib/game.mjs';
const start = '2026-11-02T12:00:00Z';
const players = ['a','b','c','d','e','f','g','h','i'];
test('deadline is 20 minutes after start, and exact cutoff is closed', () => {
 const close=closesAt(start); assert.equal(close,Date.parse(start)+1200000);
 assert.doesNotThrow(()=>validatePrediction({name:' Pat ',picks:['a','b','c'],players,start,now:close-1}));
 assert.throws(()=>validatePrediction({name:'Pat',picks:['a','b','c'],players,start,now:close}),/closed/);
});
test('accepts exactly three distinct participants and nonempty name',()=>{
 assert.throws(()=>validatePrediction({name:' ',picks:['a','b','c'],players,start,now:0}));
 assert.throws(()=>validatePrediction({name:'Pat',picks:['a','a','c'],players,start,now:0}));
 assert.throws(()=>validatePrediction({name:'Pat',picks:['a','b','z'],players,start,now:0}));
});
test('scores exact positions, wrong positions, and tied ranks once each',()=>{
 const ranks={a:1,b:2,c:2,d:3};
 assert.equal(scorePrediction(['a','b','d'],ranks),9);
 assert.equal(scorePrediction(['a','c','b'],ranks),7);
 assert.equal(scorePrediction(['d','a','e'],ranks),2);
});
