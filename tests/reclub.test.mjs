import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseReclubHtml,validateReclubUrl} from '../lib/reclub.mjs';
test('accepts only HTTPS Reclub event links',()=>{
 assert.equal(validateReclubUrl('https://reclub.co/vi/m/TQAA2S'),'https://reclub.co/vi/m/TQAA2S');
 for(const url of ['https://evil.example/vi/m/TQAA2S','http://reclub.co/vi/m/TQAA2S','https://reclub.co.evil.example/m/x','https://reclub.co/admin']) assert.throws(()=>validateReclubUrl(url));
});
test('reports missing or malformed tournament data',()=>{
 assert.throws(()=>parseReclubHtml('<html></html>'),/unavailable/);
 assert.throws(()=>parseReclubHtml('<script id="__NUXT_DATA__">[]</script>'),/unavailable/);
});
