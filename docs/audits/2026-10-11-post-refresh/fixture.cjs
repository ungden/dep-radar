const http = require('node:http');
const fs = require('node:fs');
const mkPro = (i,slug,name,city,home) => ({id:`00000000-0000-4000-8000-00000000000${i}`,slug,display_name:name,city,district:city==='Hà Nội'?'Cầu Giấy':'Quận 1',title:'Hồ sơ kiểm thử UX',bio:'Dữ liệu giả lập dùng riêng cho audit local.',categories:['nail','makeup','camera'],areas:[],highlights:[],home_service:home,studio_address:'Địa điểm QA',max_travel_km:15,years_exp:3,accepting_jobs:true,published:true,identity_status:'none',rating_avg:0,rating_count:0,completed_jobs:0,response_minutes:0,created_at:'2026-10-01T00:00:00Z'});
const pros=[mkPro(1,'qa-ha-noi','QA Hà Nội','Hà Nội',true),mkPro(2,'qa-sai-gon','QA Sài Gòn','TP.HCM',false)];
const specs=[ [0,'nail-gel','hand-foot',400000],[0,'makeup-bridal','two',4800000],[0,'photo-yearbook-group','half',150000],[1,'nail-gel','hand',120000] ];
const prices=specs.map(([p,t,v,price])=>({pro_id:pros[p].id,template_id:t,variant_id:v,price}));
const listings=specs.map(([p,t])=>({pro_id:pros[p].id,template_id:t,active:true}));
const server=http.createServer(async(req,res)=>{ const u=new URL(req.url,'http://127.0.0.1');let mode='data';try{mode=fs.readFileSync('/tmp/dep360-post-refresh-mode','utf8').trim()}catch{};
res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Content-Type','application/json');
if(req.method==='OPTIONS'){res.end();return;}const rpc=u.pathname.split('/rpc/')[1];
if(req.method!=='GET'&&!['work_stats_30d','free_slots','booking_quote'].includes(rpc)){res.statusCode=405;res.end(JSON.stringify({message:'Audit fixture is read only'}));return;}
if(u.pathname.includes('/auth/')){res.statusCode=u.pathname.endsWith('/settings')?200:401;res.end(JSON.stringify(u.pathname.endsWith('/settings')?{external:{google:true,apple:false}}:{message:'Guest audit'}));return;}
if((mode==='error'&&u.pathname.includes('/rest/'))||(mode==='slots-error'&&rpc==='free_slots')){res.statusCode=503;res.end(JSON.stringify({code:'QA_FAILURE',message:'Simulated read failure'}));return;}
let body='';for await(const part of req)body+=part;let args={};try{args=JSON.parse(body)}catch{};let rows=[];const table=u.pathname.split('/').at(-1);
if(mode!=='empty'){if(table==='pros')rows=pros;if(table==='pro_service_prices')rows=prices;if(table==='pro_services')rows=listings;if(rpc==='free_slots')rows=['09:00','09:30','10:00','10:30','11:00','13:00','14:00','15:00','16:00'].map(time=>`${args.p_date||'2026-10-12'}T${time}:00+07:00`);}
for(const[k,v]of u.searchParams){if(v.startsWith('eq.')&&rows[0]&&k in rows[0])rows=rows.filter(r=>String(r[k])===v.slice(3));}
res.end(JSON.stringify(req.headers.accept?.includes('vnd.pgrst.object')?(rows[0]??null):rows));});
server.listen(54321,'127.0.0.1',()=>console.log('Read-only UX fixture on 54321'));
