import { env } from 'cloudflare:workers';
import { parseReclubHtml, validateReclubUrl } from '../../../lib/reclub.mjs';
import { scorePrediction } from '../../../lib/game.mjs';

export const dynamic = 'force-dynamic';
const E = env as unknown as { DB: D1Database, ADMIN_PASSWORD?: string, KIMI_API_KEY?: string, KIMI_MODEL?: string };
const json = (x: unknown, status = 200, headers?: HeadersInit) => Response.json(x, { status, headers: { 'Cache-Control':'no-store', ...headers }});
async function digest(s:string) { const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)); return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join(''); }
async function admin(req:Request) { if(!E.ADMIN_PASSWORD) return false; const token=(req.headers.get('cookie')||'').match(/(?:^|;\s*)ug_admin=([^;]+)/)?.[1]; return token === await digest('ugadaika-admin:'+E.ADMIN_PASSWORD); }
async function current() { return await E.DB.prepare('SELECT * FROM tournaments WHERE active=1 LIMIT 1').first<any>(); }
function obj(row:any) {return {id:row.id,title:row.title,start:row.start,players:JSON.parse(row.players),results:row.results?JSON.parse(row.results):null};}
export async function GET(req:Request) { try {
 const row=await current(); if(!row)return json({event:null,now:Date.now()});
 const event=obj(row); const now=Date.now(); const browser=new URL(req.url).searchParams.get('browser')||'';
 const own=browser?await E.DB.prepare('SELECT name,picks FROM predictions WHERE tournament_id=? AND browser=?').bind(row.id,browser).first<any>():null;
 let predictions:any[]=[];
 if(now>=row.start+1200000){const r=await E.DB.prepare('SELECT name,picks FROM predictions WHERE tournament_id=? ORDER BY created ASC').bind(row.id).all<any>(); predictions=r.results.map(p=>({name:p.name,picks:JSON.parse(p.picks),score:event.results?scorePrediction(JSON.parse(p.picks),event.results):null}));}
 return json({event,now,own:own?{name:own.name,picks:JSON.parse(own.picks)}:null,predictions});
 }catch(e){console.error(e);return json({error:'Could not load tournament'},500);} }
export async function POST(req:Request) { try {
 const body=await req.json() as any; const action=body.action;
 if(action==='login') { if(!E.ADMIN_PASSWORD || typeof body.password!=='string' || body.password!==E.ADMIN_PASSWORD)return json({error:'Incorrect password'},401); const token=await digest('ugadaika-admin:'+E.ADMIN_PASSWORD);return json({ok:true},200,{'Set-Cookie':`ug_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`}); }
 if(action==='predict'){
  const row=await current(); if(!row)return json({error:'No active tournament'},400);
  const players=JSON.parse(row.players); const ids=players.map((p:any)=>p.id); const {name,picks,browser}=body;
  if(typeof name!=='string'||!name.trim()||name.trim().length>80||typeof browser!=='string'||!/^[a-f0-9-]{36}$/.test(browser)||!Array.isArray(picks)||picks.length!==3||new Set(picks).size!==3||picks.some((p:string)=>!ids.includes(p)))return json({error:'Please enter your name and choose three different players'},400);
  try {const result=await E.DB.prepare('INSERT INTO predictions (id,tournament_id,browser,name,picks,created) SELECT ?,id,?,?,?,? FROM tournaments WHERE id=? AND active=1 AND start+1200000>?').bind(crypto.randomUUID(),browser,name.trim(),JSON.stringify(picks),Date.now(),row.id,Date.now()).run(); if(!result.meta.changes)return json({error:'Predictions are closed'},400); }catch {return json({error:'A prediction was already submitted from this browser'},400);} return json({ok:true});
 }
 if(!await admin(req))return json({error:'Organizer login required'},401);
 if(action==='import') {const u=validateReclubUrl(body.url);const res=await fetch(u,{redirect:'manual',headers:{'User-Agent':'Mozilla/5.0'}});if(!res.ok)throw Error('Unable to fetch Reclub page');const data=parseReclubHtml(await res.text());return json(data);}
 if(action==='recognize'){
  if(!E.KIMI_API_KEY)return json({error:'KIMI_API_KEY is not configured'},503);
  if(typeof body.image!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(body.image)||body.image.length>7000000)return json({error:'Please upload a PNG, JPEG or WebP image under 5 MB'},400);
  const model=E.KIMI_MODEL||'kimi-k2.6';
  const response=await fetch('https://api.moonshot.ai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${E.KIMI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'user',content:[{type:'text',text:'Read this Reclub screenshot. Return only JSON, no markdown. For a participant list: {"title":"...","start":"...","players":[{"name":"..."}]}. For standings: {"results":[{"name":"...","rank":1}]}. Preserve shared ranks and include every player in ranks 1 to 3. Do not guess unreadable text.'},{type:'image_url',image_url:{url:body.image}}]}]})});
  if(!response.ok){
   const details:any=await response.json().catch(()=>null);
   const reason=String(details?.error?.message||'Unknown API error').slice(0,300);
   throw Error(`Kimi API ${response.status}: ${reason}`);
  }
  const x:any=await response.json();const content=x.choices?.[0]?.message?.content||'';const clean=content.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
  try{return json({data:JSON.parse(clean)});}catch{throw Error('Kimi returned an unreadable response. Please enter the names manually or try another screenshot.');}
 }
 if(action==='publish'){
  const previous=await current(); if(previous&&!previous.results)return json({error:'Publish results for the current tournament first'},400);
  const {title,start,players}=body;const time=Date.parse(start);
  if(typeof title!=='string'||!title.trim()||!Number.isFinite(time)||!Array.isArray(players)||players.length!==9||players.some((p:any)=>!p.id||!p.name)||new Set(players.map((p:any)=>p.id)).size!==9)return json({error:'Enter a title, start time and nine distinct players'},400);
  await E.DB.batch([E.DB.prepare('UPDATE tournaments SET active=0 WHERE active=1'),E.DB.prepare('INSERT INTO tournaments(id,title,start,players,active) VALUES(?,?,?,?,1)').bind(crypto.randomUUID(),title.trim(),time,JSON.stringify(players))]);return json({ok:true});
 }
 if(action==='results'){
  const row=await current();if(!row||row.results)return json({error:'Results already published or no active tournament'},400);if(Date.now()<row.start+1200000)return json({error:'Wait until predictions close'},400);
  const ids=JSON.parse(row.players).map((p:any)=>p.id);const ranks=body.ranks;
  if(!ranks||typeof ranks!=='object'||Object.keys(ranks).some(id=>!ids.includes(id)||![1,2,3].includes(ranks[id]))||!Object.values(ranks).includes(1))return json({error:'Choose valid official rankings including first place'},400);
  const result=await E.DB.prepare('UPDATE tournaments SET results=? WHERE id=? AND results IS NULL').bind(JSON.stringify(ranks),row.id).run();if(!result.meta.changes)return json({error:'Results already published'},400);return json({ok:true});
 }
 return json({error:'Unknown request'},400);
 }catch(e){console.error(e);return json({error:e instanceof Error?e.message:'Request failed'},400);} }
