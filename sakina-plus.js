/* SAKINA Plus: إصلاحات الهاتف + متابعة الصلوات + السبحة + القبلة
   يعتمد على Firebase نفسه وحساب المستخدم نفسه، ولا يغيّر أي ميزة موجودة. */
import {getApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getDatabase,ref,get,set,update,increment} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const app=getApp(),auth=getAuth(app),db=getDatabase(app);
const $=id=>document.getElementById(id),pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>ymd(new Date());
const ar=n=>Number(n).toLocaleString('ar-EG',{useGrouping:false});
const uid=()=>auth.currentUser?.uid;
const R=(...p)=>ref(db,['users',uid(),...p].join('/'));
function toast(m,err){const t=$('toast');if(!t)return;t.textContent=m;t.className='show'+(err?' err':'');clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',3000)}
async function safe(fn){try{return await fn()}catch(e){toast(navigator.onLine?'تعذّر الحفظ، تحقق من صلاحيات قاعدة البيانات':'لا يوجد اتصال بالإنترنت',1)}}
const ic=d=>`<svg class="ic" viewBox="0 0 24 24"><path d="${d}"/></svg>`;

/* ---------- CSS ---------- */
const st=document.createElement('style');st.textContent=`
body.lock{overflow:hidden;touch-action:none}
nav{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
#navX{display:none}
.pp{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.8rem 1rem;border:1px solid var(--bd);border-radius:16px;margin-bottom:.6rem;background:var(--card)}
.pp.ok{border-color:var(--pri);background:rgba(63,193,176,.14)}
.pp button{min-width:96px}
.pcal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.3rem}
.pcal button{padding:.3rem 0;min-height:44px;background:var(--card);border:1px solid var(--bd);color:var(--tx);font-size:.85rem;border-radius:10px;line-height:1.3}
.pcal button small{display:block;font-size:.65rem;color:var(--mu)}
.pcal button.full{background:linear-gradient(135deg,#f3cd7a,#d9a63f);color:#2a1e03;border-color:transparent}
.pcal button.full small{color:#4a3508}
.pcal button.part{border-color:var(--au)}
.pcal button.sel{outline:2px solid var(--pri)}
.pcal .h{background:none;border:0;min-height:0;color:var(--mu);font-weight:700;pointer-events:none}
#tsBtn{width:min(260px,70vw);height:min(260px,70vw);border-radius:50%;font-size:3.4rem;font-weight:700;display:grid;place-items:center;margin:1rem auto;background:radial-gradient(circle at 30% 25%,var(--pri),var(--lap));box-shadow:0 14px 40px rgba(42,80,200,.4),inset 0 0 0 8px rgba(255,255,255,.12);user-select:none;-webkit-user-select:none}
#tsBtn.done{animation:tsp .7s 2}
@keyframes tsp{50%{transform:scale(1.07);box-shadow:0 0 0 24px rgba(236,188,88,.25)}}
#qWrap{width:min(320px,86vw);margin:1rem auto}
@media(max-width:800px){
 nav{height:100vh;height:100dvh;padding-bottom:calc(5rem + env(safe-area-inset-bottom));padding-top:calc(1rem + env(safe-area-inset-top))}
 nav button{min-height:46px;margin:2px 0}#navX{display:flex;justify-content:center;margin-bottom:.4rem}
 button{min-height:42px}#abar button{min-height:40px}
 #ov.on{backdrop-filter:blur(2px)}
}`;document.head.appendChild(st);

/* ---------- القائمة الجانبية: إغلاق + منع تمرير الخلفية + تأكيد الخروج ---------- */
const nav=$('nav');
const navX=document.createElement('button');navX.id='navX';navX.className='alt';navX.textContent='إغلاق القائمة';
navX.onclick=()=>{nav.classList.remove('open');$('ov').classList.remove('on')};nav.prepend(navX);
new MutationObserver(()=>document.body.classList.toggle('lock',nav.classList.contains('open'))).observe(nav,{attributes:true,attributeFilter:['class']});
document.addEventListener('click',e=>{if(e.target.closest('#out,#out2,#vOut')&&!confirm('هل تريد تسجيل الخروج؟')){e.stopPropagation();e.preventDefault()}},true);

/* ---------- القائمة: صفحات جديدة ---------- */
const NEW=[['ptrack','متابعة الصلوات','M5 13l4 4L19 7M3 4h18v16H3z'],['tasbih','السبحة','M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v4l3 2'],['qibla','اتجاه القبلة','M12 2l4 10-4-2-4 2zM12 22v-8M5 18h14']];
const out=$('out');
const grp=document.createElement('div');grp.className='grp';grp.textContent='أدوات جديدة';
out.before(grp);
NEW.forEach(n=>{const b=document.createElement('button');b.dataset.p=n[0];b.innerHTML=ic(n[2])+n[1];out.before(b)});
const main=document.querySelector('main');
const sec=(id,html)=>{const s=document.createElement('section');s.id=id;s.className='pg hide';s.innerHTML=html;main.appendChild(s)};

/* ---------- متابعة الصلوات ---------- */
const PR=[['Fajr','الفجر'],['Dhuhr','الظهر'],['Asr','العصر'],['Maghrib','المغرب'],['Isha','العشاء']];
sec('ptrack',`<h2>متابعة الصلوات</h2>
<p class="help">اضغط «تمت» بعد كل صلاة. تُحفظ في حسابك، ويمكنك اختيار أي يوم من التقويم لمراجعته أو تعديله.</p>
<div class="card"><div class="mu" id="ptD"></div><div id="ptList"></div><div class="bar"><i id="ptBar" style="width:0"></i></div><p class="mu" id="ptPct"></p></div>
<div class="grid" id="ptSt"></div>
<div class="card"><div class="row" style="justify-content:space-between"><button id="pcP" class="alt">السابق</button><b id="pcT"></b><button id="pcN" class="alt">التالي</button></div><div class="pcal" id="pcal" style="margin-top:.8rem"></div></div>`);
let PL={},pSel=today(),pM=new Date();pM.setDate(1);
const cnt=d=>PR.filter(p=>PL[d]?.[p[0]]).length;
async function loadPT(){PL=(await safe(()=>get(R('prayerLog'))))?.val()||{};drawPT()}
function drawPT(){
  const c=cnt(pSel);
  $('ptD').textContent=(pSel===today()?'اليوم — ':'')+new Date(pSel+'T00:00').toLocaleDateString('ar',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  $('ptList').innerHTML=PR.map(p=>{const on=!!PL[pSel]?.[p[0]];return `<div class="pp ${on?'ok':''}"><b>${p[1]}</b><button data-pk="${p[0]}" class="${on?'alt':''}">${on?'تمت — تراجع':'تمت'}</button></div>`}).join('');
  $('ptBar').style.width=c/5*100+'%';$('ptPct').textContent=`أُنجز ${ar(c)} من ${ar(5)} (${ar(Math.round(c/5*100))}٪)`;
  $$('[data-pk]').forEach(b=>b.onclick=async()=>{const k=b.dataset.pk,on=!PL[pSel]?.[k];
    try{await set(R('prayerLog',pSel,k),on?true:null);(PL[pSel]=PL[pSel]||{})[k]=on?true:undefined;drawPT()}catch(e){toast('تعذّر الحفظ، تحقق من الاتصال وقواعد قاعدة البيانات',1)}});
  const keys=Object.keys(PL),full=keys.filter(d=>cnt(d)===5).length;
  const wk=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return cnt(ymd(d))}).reduce((a,b)=>a+b,0);
  const mk=ymd(pM).slice(0,7),mt=keys.filter(d=>d.startsWith(mk)).reduce((a,d)=>a+cnt(d),0);
  const dim=new Date(pM.getFullYear(),pM.getMonth()+1,0).getDate();
  const card=(t,v)=>`<div class="card"><div class="mu">${t}</div><div class="big">${v}</div></div>`;
  $('ptSt').innerHTML=card('أيام اكتملت فيها الصلوات',ar(full))+card('آخر ٧ أيام',ar(Math.round(wk/35*100))+'٪')+card('الشهر المعروض',ar(Math.round(mt/(dim*5)*100))+'٪');
  const y=pM.getFullYear(),m=pM.getMonth(),first=new Date(y,m,1).getDay();
  $('pcT').textContent=pM.toLocaleDateString('ar',{month:'long',year:'numeric'});
  let h=['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'].map(d=>`<button class="h">${d}</button>`).join('')+'<span></span>'.repeat(first);
  for(let d=1;d<=dim;d++){const k=ymd(new Date(y,m,d)),n=cnt(k);h+=`<button data-pd="${k}" class="${n===5?'full':n?'part':''} ${k===pSel?'sel':''}">${ar(d)}<small>${n?ar(n)+'/'+ar(5):''}</small></button>`}
  $('pcal').innerHTML=h;
  $$('[data-pd]').forEach(b=>b.onclick=()=>{pSel=b.dataset.pd;drawPT()});
}
$('pcP').onclick=()=>{pM.setMonth(pM.getMonth()-1);drawPT()};$('pcN').onclick=()=>{pM.setMonth(pM.getMonth()+1);drawPT()};
function $$(s){return [...document.querySelectorAll(s)]}

/* ---------- السبحة ---------- */
sec('tasbih',`<h2>السبحة الإلكترونية</h2>
<div class="card" style="text-align:center">
 <div class="row" style="justify-content:center" id="tsChips"></div>
 <div class="grid" style="margin-top:.8rem"><label>ذكر مخصص<input id="tsC" placeholder="اكتب ذكرك هنا"></label>
 <label>الهدف<select id="tsG"><option>33</option><option selected>100</option><option>1000</option><option value="0">رقم أكتبه</option></select></label>
 <label>هدف مخصص<input id="tsGC" class="num" inputmode="numeric" placeholder="مثال: 500"></label></div>
 <h3 id="tsName">سبحان الله</h3>
 <button id="tsBtn">0</button><div class="mu" id="tsInfo"></div>
 <div class="row" style="justify-content:center;margin-top:.8rem"><button id="tsR" class="alt">إعادة تعيين العداد</button><label class="row" style="margin:0"><input type="checkbox" id="tsV" style="margin:0"> اهتزاز عند الضغط</label></div></div>
<div class="grid"><div class="card"><div class="mu">تسبيحات اليوم</div><div class="big" id="tsDay">0</div></div><div class="card"><div class="mu">إجمالي كل الأيام</div><div class="big" id="tsAll">0</div></div></div>
<div class="card"><h3>سجل آخر 7 أيام</h3><div id="tsLog"></div></div>`);
const DH=['سبحان الله','الحمد لله','الله أكبر','أستغفر الله','لا إله إلا الله','اللهم صل وسلم على نبينا محمد'];
let TS={n:0,name:DH[0],pend:0,log:{},t:null};
$('tsChips').innerHTML=DH.map(d=>`<button class="chip alt" data-dh="${d}">${d}</button>`).join('');
try{$('tsV').checked=localStorage.getItem('sk_vib')!=='0'}catch(e){}
$('tsV').onchange=e=>{try{localStorage.setItem('sk_vib',e.target.checked?'1':'0')}catch(x){}};
const goal=()=>+$('tsG').value||parseInt($('tsGC').value,10)||100;
document.addEventListener('input',e=>{if(e.target.id==='tsGC')e.target.value=e.target.value.replace(/\D/g,'')});
$$('[data-dh]').forEach(b=>b.onclick=()=>{TS.name=b.dataset.dh;TS.n=0;drawTS()});
$('tsC').oninput=e=>{const v=e.target.value.trim();if(v){TS.name=v;TS.n=0;drawTS()}};
function drawTS(){$('tsName').textContent=TS.name;$('tsBtn').textContent=ar(TS.n);$('tsInfo').textContent=`الهدف: ${ar(goal())} — المتبقي ${ar(Math.max(0,goal()-TS.n))}`;
  const d=TS.log[today()]||0;$('tsDay').textContent=ar(d);$('tsAll').textContent=ar(Object.values(TS.log).reduce((a,b)=>a+b,0));
  $('tsLog').innerHTML=[...Array(7)].map((_,i)=>{const x=new Date();x.setDate(x.getDate()-i);const k=ymd(x);return `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--bd)"><span>${k}</span><b>${ar(TS.log[k]||0)}</b></div>`}).join('')}
$('tsBtn').onclick=()=>{TS.n++;TS.pend++;TS.log[today()]=(TS.log[today()]||0)+1;
  try{if($('tsV').checked&&navigator.vibrate)navigator.vibrate(TS.n===goal()?[120,60,120]:15)}catch(e){}
  const b=$('tsBtn');b.classList.remove('done');if(TS.n===goal()){void b.offsetWidth;b.classList.add('done');toast('ما شاء الله، بلغت هدفك: '+ar(goal()))}
  drawTS();clearTimeout(TS.t);TS.t=setTimeout(flushTS,1500)};
async function flushTS(){if(!TS.pend||!uid())return;const n=TS.pend;TS.pend=0;await safe(()=>update(R('tasbih',today()),{count:increment(n),date:today()}))}
addEventListener('pagehide',flushTS);
$('tsR').onclick=()=>{TS.n=0;drawTS()};
async function loadTS(){const v=(await safe(()=>get(R('tasbih'))))?.val()||{};TS.log={};Object.values(v).forEach(x=>{if(x.date)TS.log[x.date]=x.count||0});drawTS()}
$('tsG').onchange=drawTS;$('tsGC').oninput=drawTS;

/* ---------- القبلة ---------- */
sec('qibla',`<h2>اتجاه القبلة</h2>
<p class="help">اضغط الزر وامنح الإذن بتحديد الموقع (لا يُطلب الموقع إلا هنا). ضع الهاتف أفقيًا وبعيدًا عن المعادن والمغناطيس. إن كانت الحركة غير دقيقة حرّك الهاتف على شكل رقم 8 لمعايرة البوصلة. الدقة تعتمد على مستشعرات جهازك ودقة الموقع.</p>
<div class="card" style="text-align:center"><button id="qGo">تحديد اتجاه القبلة</button>
<div id="qWrap"><svg viewBox="-110 -110 220 220"><g id="qDial"><circle r="100" fill="none" stroke="var(--bd)" stroke-width="3"/><text y="-82" text-anchor="middle" fill="var(--au)" font-size="16" font-weight="700">N</text>
<g id="qNeedle"><path d="M0-90L12-10L0-22L-12-10Z" fill="var(--au)"/><circle r="6" fill="var(--pri)"/></g></g></svg></div>
<div class="big" id="qDeg">—</div><p class="mu" id="qMsg">لم يتم تحديد الموقع بعد.</p></div>`);
let QB=null,QH=null;
const toRad=x=>x*Math.PI/180;
function bearing(la,lo){const a=toRad(la),b=toRad(21.4225),d=toRad(39.8262-lo);
  return (Math.atan2(Math.sin(d)*Math.cos(b),Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(d))*180/Math.PI+360)%360}
function drawQ(){if(QB==null)return;$('qDeg').textContent=ar(Math.round(QB))+'° من الشمال';
  if(QH==null){$('qDial').setAttribute('transform','rotate(0)');$('qNeedle').setAttribute('transform',`rotate(${QB})`);$('qMsg').textContent='جهازك لا يوفر بوصلة: وجّه الشمال الحقيقي إلى أعلى الشاشة، والسهم يشير للقبلة (بالدرجة المذكورة).';return}
  $('qDial').setAttribute('transform',`rotate(${-QH})`);$('qNeedle').setAttribute('transform',`rotate(${QB})`);
  const diff=Math.abs(((QB-QH+540)%360)-180);$('qMsg').textContent=diff<5?'أنت متجه نحو القبلة':'أدر الهاتف حتى يشير السهم إلى أعلى الشاشة'}
function onOri(e){const h=e.webkitCompassHeading!=null?e.webkitCompassHeading:(e.absolute&&e.alpha!=null?360-e.alpha:null);if(h!=null){QH=h;drawQ()}}
$('qGo').onclick=async()=>{
  if(!navigator.geolocation)return toast('المتصفح لا يدعم تحديد الموقع',1);
  navigator.geolocation.getCurrentPosition(async p=>{QB=bearing(p.coords.latitude,p.coords.longitude);drawQ();
    try{if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission){const r=await DeviceOrientationEvent.requestPermission();if(r!=='granted')return drawQ()}
      addEventListener('deviceorientationabsolute',onOri,true);addEventListener('deviceorientation',onOri,true)}catch(e){}
    setTimeout(()=>{if(QH==null)drawQ()},1500)},()=>toast('لم يتم السماح بالموقع',1),{enableHighAccuracy:true,timeout:15000})};

/* ---------- ربط الصفحات ---------- */
const H={ptrack:loadPT,tasbih:loadTS,qibla:drawQ};
document.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b&&H[b.dataset.p])setTimeout(H[b.dataset.p],0)});
