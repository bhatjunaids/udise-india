/* UDISE+ India Dashboard app. Injected into template.html by build_site.py.
   Expects global D = {yearsA, yearsB, states, extraOld, lvlA, lvlB, d, cite}. */
"use strict";
const YA = D.yearsA, YB = D.yearsB, YRS = YA.concat(YB);
const LA = D.lvlA, LB = D.lvlB;               // outcome display levels per era
const MGMT = ["All managements","Government","Govt Aided","Pvt Unaided (Recog.)","Others"];
const MGMT_SHORT = ["Total","Govt","Aided","Private","Others"];
const GEN = ["Boys","Girls","Total"];
const S = n => getComputedStyle(document.documentElement).getPropertyValue('--s'+n).trim();

const cell = (st,y) => (D.d[st]||{})[y] || {};
const fmtIN = n => n==null?"–":Math.round(n).toLocaleString('en-IN');
const fmt1 = n => n==null?"–":(Math.round(n*10)/10).toLocaleString('en-IN',{minimumFractionDigits:1,maximumFractionDigits:1});
function fmtC(n){ if(n==null) return "–"; const a=Math.abs(n);
  if(a>=1e7) return (n/1e7).toLocaleString('en-IN',{maximumFractionDigits:2})+" Cr";
  if(a>=1e5) return (n/1e5).toLocaleString('en-IN',{maximumFractionDigits:1})+" L";
  return fmtIN(n); }
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");

/* ---------------- metric registry ----------------
   era: 'all' (single series, break marker), 'A', 'B'
   kind: count | infra | equity | outcome
   get(st, y, o) with o = {m: mgmt idx, l: level idx, g: 0/1/2}      */
const METRICS = {
  s:   {label:"Schools",   era:"all", kind:"count", mgmt:true, unit:"n", fam:"schools",
        get:(st,y,o)=>{const a=cell(st,y).s; return a?a[o.m||0]:null;}},
  t:   {label:"Teachers",  era:"all", kind:"count", mgmt:true, unit:"n", fam:"teachers",
        get:(st,y,o)=>{const a=cell(st,y).t; return a?a[o.m||0]:null;}},
  e:   {label:"Enrolment", era:"all", kind:"count", mgmt:true, unit:"n", fam:"enrol",
        get:(st,y,o)=>{const a=cell(st,y).e; return a?a[o.m||0]:null;}},
  ptr: {label:"Pupil–teacher ratio", era:"both", kind:"outcome", unit:"ratio", fam:"ptr", lvl:e=>e==="A"?LA:LB,
        get:(st,y,o)=>pick1(cell(st,y).ptr, o)},
  ger: {label:"GER", era:"both", kind:"outcome", unit:"pct", gender:true, fam:"ger",
        lvl:e=>e==="A"?["Primary (I–V)","Upper Primary (VI–VIII)","Elementary (I–VIII)","Secondary (IX–X)","Higher Secondary (XI–XII)"]:LB,
        get:(st,y,o)=>pick3(cell(st,y).ger, o, 3)},
  ner: {label:"NER", era:"both", kind:"outcome", unit:"pct", gender:true, fam:"ner",
        lvl:e=>e==="A"?["Primary (I–V)","Upper Primary (VI–VIII)","Elementary (I–VIII)","Secondary (IX–X)","Higher Secondary (XI–XII)"]:LB,
        get:(st,y,o)=>pick3(cell(st,y).ner, o, 3)},
  gpi: {label:"Gender Parity Index (GER)", era:"both", kind:"equity", unit:"idx", fam:"gpi",
        lvl:e=>e==="A"?["Primary (I–V)","Upper Primary (VI–VIII)","Elementary (I–VIII)","Secondary (IX–X)","Higher Secondary (XI–XII)"]:LB,
        get:(st,y,o)=>pick1(cell(st,y).gpi, o)},
  dr:  {label:"Dropout rate", era:"both", kind:"outcome", unit:"pct", gender:true, fam:"dropout",
        lvl:e=>e==="A"?["Primary (I–V)","Upper Primary (VI–VIII)","Secondary (IX–X)"]
                      :["Preparatory (III–V)","Middle (VI–VIII)","Secondary (IX–XII)"],
        get:(st,y,o)=>pick3(cell(st,y).dr, o, 2)},
  tr:  {label:"Transition rate", era:"both", kind:"outcome", unit:"pct", gender:true, fam:"transition",
        lvl:e=>e==="A"?["Primary→Upper Primary (V→VI)","Upper Primary→Secondary (VIII→IX)","Secondary→Hr Sec (X→XI)"]
                      :["Foundational→Preparatory","Preparatory→Middle","Middle→Secondary"],
        get:(st,y,o)=>pick3(cell(st,y).tr, o, 2)},
  rr:  {label:"Retention rate", era:"both", kind:"outcome", unit:"pct", gender:true, fam:"retention",
        lvl:e=>e==="A"?["Primary (I–V)","Elementary (I–VIII)","Secondary (I–X)","Higher Secondary (I–XII)"]
                      :["Foundational","Preparatory","Middle","Secondary"],
        get:(st,y,o)=>pick3(cell(st,y).rr, o, 3)},
  // infrastructure (% of schools, all managements)
  inel:{label:"Functional electricity %", era:"all", kind:"infra", unit:"pct", fam:"in_elec",  get:(st,y)=>inf(st,y,'el',1)},
  inwa:{label:"Drinking water %",         era:"all", kind:"infra", unit:"pct", fam:"in_water", get:(st,y)=>inf(st,y,'wa',1)},
  inbt:{label:"Functional boys' toilet %",era:"all", kind:"infra", unit:"pct", fam:"in_btoilet",get:(st,y)=>inf(st,y,'bt',1)},
  ingt:{label:"Functional girls' toilet %",era:"all",kind:"infra", unit:"pct", fam:"in_gtoilet",get:(st,y)=>inf(st,y,'gt',1)},
  inli:{label:"Library %",  era:"all", kind:"infra", unit:"pct", fam:"in_library", get:(st,y)=>inf(st,y,'li',0)},
  inco:{label:"Computer %", era:"all", kind:"infra", unit:"pct", fam:"in_computer",get:(st,y)=>inf(st,y,'co',0)},
  inne:{label:"Internet %", era:"all", kind:"infra", unit:"pct", fam:"in_internet",get:(st,y)=>inf(st,y,'ne',0)},
  inra:{label:"CWSN ramps %", era:"all", kind:"infra", unit:"pct", fam:"in_ramps", get:(st,y)=>inf(st,y,'ra',0)},
  // equity scalars
  sc:  {label:"SC share of enrolment", era:"B", kind:"equity", unit:"pct", fam:"social", get:(st,y)=>soc(st,y,1)},
  stt: {label:"ST share of enrolment", era:"B", kind:"equity", unit:"pct", fam:"social", get:(st,y)=>soc(st,y,2)},
  obc: {label:"OBC share of enrolment", era:"all", kind:"equity", unit:"pct", fam:"obc_pct",
        get:(st,y)=>{const c=cell(st,y); return c.obcT!=null?c.obcT:soc(st,y,3);}},
  mus: {label:"Muslim share of enrolment", era:"B", kind:"equity", unit:"pct", fam:"social", get:(st,y)=>soc(st,y,4)},
  /* Era A publishes an overall "Primary to Higher Secondary" minority column;
     the NEP tables give it per stage only, with no overall, so this indicator
     is pre-NEP-only rather than silently empty for recent years. Use the
     Muslim share from Table 2.4 for NEP-era minority enrolment. */
  mino:{label:"All-minority share % (pre-NEP only)", era:"A", kind:"equity", unit:"pct", fam:"minority_pct",
        get:(st,y)=>{const c=cell(st,y); return c.minT!=null?c.minT:null;}},
  cwsn:{label:"CWSN enrolment", era:"all", kind:"equity", unit:"n", fam:"cwsn",
        get:(st,y)=>{const c=cell(st,y); return c.cwsnT!=null?c.cwsnT:null;}},
};
function eraOf(y){ return YA.includes(y) ? "A" : "B"; }
/* Level index 3 is Secondary in every era and indicator, so it is the default
   wherever the caller doesn't name a level. */
const DEF_LVL = 3;
/* Reads a [level x (Boys,Girls,Total)] block.

   An *explicitly requested* level that the year doesn't publish returns null —
   never a clamped neighbour — so 2018-19 retention (three levels, not four)
   shows "–" instead of the Secondary figure labelled "Higher Secondary".
   When no level is requested, fall back to the last level that year does have,
   so the default view isn't empty. */
function pick3(arr, o, defIdx){
  if(!arr) return null;
  const n = arr.length/3|0;
  let l = o.l;
  if(l==null){ l = defIdx==null?DEF_LVL:defIdx; if(l>=n) l=n-1; }
  else if(l>=n || l<0) return null;
  const g = o.g==null?2:o.g;
  return arr[l*3+g]!=null ? arr[l*3+g] : null;
}
/* Same contract for one-value-per-level blocks (PTR, GPI). */
function pick1(arr, o){
  if(!arr) return null;
  let l = o.l;
  if(l==null){ l = Math.min(DEF_LVL, arr.length-1); }
  else if(l>=arr.length || l<0) return null;
  return arr[l]!=null ? arr[l] : null;
}
/* How many levels a given indicator actually publishes in a given year.
   India's row is the reference — every state shares the year's table shape. */
function nLevels(key, y){
  const m=METRICS[key];
  if(!m || !m.lvl) return 0;
  const KEYS={ger:'ger',ner:'ner',dr:'dr',tr:'tr',rr:'rr',ptr:'ptr',gpi:'gpi'};
  const a=cell('India',y)[KEYS[key]];
  if(!a) return m.lvl(eraOf(y)).length;
  return (key==='ptr'||key==='gpi') ? a.length : (a.length/3|0);
}
function inf(st,y,k,fi){ const o=(cell(st,y).inf||{})[k]; return o?o[fi]!=null?o[fi]:o[0]:null; }
function soc(st,y,i){ const a=cell(st,y).soc; return a?a[i]:null; }
function metricYears(key){ const m=METRICS[key];
  return m.era==="A"?YA : m.era==="B"?YB : m.era==="both"?null : YRS; }
function fmtOf(key){ const m=METRICS[key];
  return m.unit==="n"?fmtC : m.unit==="ratio"?fmtIN : m.unit==="idx"?(v=>v==null?"–":v.toFixed(2)) : fmt1; }
function fullFmtOf(key){ const m=METRICS[key]; return m.unit==="n"?fmtIN:fmtOf(key); }
function citeOf(key,y){
  const m=METRICS[key]; if(!m||!D.cite[y]) return null;
  let fams = m.mgmt ? [m.fam+".m0"] : [m.fam];
  const c = D.cite[y][fams[0]] || D.cite[y][m.fam];
  return c ? `Table ${c[0]}, p.${c[1].join("–")} of the ${y} report` : null;
}

/* ---------------- charts ---------------- */
function lineChart(el, series, xlabels, opts){
  opts=opts||{};
  const W=560, H=opts.h||300, mL=52, mR=112, mT=12, mB=28, iw=W-mL-mR, ih=H-mT-mB;
  const vals=series.flatMap(s=>s.values).filter(v=>v!=null);
  if(!vals.length){ el.innerHTML='<p class="note">No data for this selection.</p>'; return; }
  let max=Math.max(...vals); if(max<=0) max=1;
  const niceMax=niceCeil(max*1.06), min=0;
  const x=i=>mL+iw*(xlabels.length===1?0.5:i/(xlabels.length-1));
  const y=v=>mT+ih*(1-(v-min)/(niceMax-min));
  const fmt=opts.fmt||fmtC;
  let g='';
  for(let t2=0;t2<=4;t2++){
    const v=min+(niceMax-min)*t2/4, yy=y(v);
    g+=`<line x1="${mL}" y1="${yy}" x2="${W-mR}" y2="${yy}" stroke="var(--grid)"/>`;
    g+=`<text x="${mL-8}" y="${yy+3.5}" text-anchor="end" font-size="10.5" fill="var(--muted)">${fmt(v)}</text>`;
  }
  g+=`<line x1="${mL}" y1="${mT+ih}" x2="${W-mR}" y2="${mT+ih}" stroke="var(--axis)"/>`;
  xlabels.forEach((yr,i)=>{ g+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="10" fill="var(--muted)">${yr.slice(2)}</text>`; });
  if(opts.breakAfter!=null && opts.breakAfter < xlabels.length-1){
    const bx=(x(opts.breakAfter)+x(opts.breakAfter+1))/2;
    g+=`<line x1="${bx}" y1="${mT-2}" x2="${bx}" y2="${mT+ih}" stroke="var(--s2)" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    g+=`<text x="${bx}" y="${mT+6}" text-anchor="middle" font-size="9" fill="var(--s2)">methodology</text>`;
    g+=`<text x="${bx}" y="${mT+16}" text-anchor="middle" font-size="9" fill="var(--s2)">break</text>`;
  }
  const ends=series.filter(s=>s.values[s.values.length-1]!=null)
    .map(s=>({s,yy:y(s.values[s.values.length-1])})).sort((a,b)=>a.yy-b.yy);
  for(let i=1;i<ends.length;i++) if(ends[i].yy-ends[i-1].yy<12) ends[i].yy=ends[i-1].yy+12;
  series.forEach(s=>{
    const pts=s.values.map((v,i)=>v==null?null:[x(i),y(v)]);
    let d='',pen=false;
    pts.forEach((p,i)=>{
      if(!p){pen=false;return;}
      const brk = opts.breakAfter!=null && i===opts.breakAfter+1;
      d+=((pen&&!brk)?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1); pen=true;
    });
    g+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"${s.dashed?' stroke-dasharray="5 4"':''}/>`;
    pts.forEach(p=>{ if(p) g+=`<circle cx="${p[0]}" cy="${p[1]}" r="3.3" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`; });
  });
  ends.forEach(e2=>{
    const nm=e2.s.name.length>15?e2.s.name.slice(0,14)+'…':e2.s.name;
    g+=`<text x="${W-mR+8}" y="${e2.yy+3.5}" font-size="11" font-weight="600" fill="var(--ink2)">${esc(nm)}</text>`;
  });
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg><div class="tip"></div>`;
  const svg=el.querySelector('svg'), tip=el.querySelector('.tip');
  svg.addEventListener('mousemove',ev=>{
    const r=svg.getBoundingClientRect(), px=(ev.clientX-r.left)*W/r.width;
    let bi=0,bd=1e9;
    xlabels.forEach((_,i)=>{const dd=Math.abs(px-x(i)); if(dd<bd){bd=dd;bi=i;}});
    const rows=series.filter(s=>s.values[bi]!=null).map(s=>
      `<div class="tr"><span class="n"><span class="sw" style="background:${s.color}"></span>${esc(s.name)}</span><span class="val">${fmt(s.values[bi])}</span></div>`).join('');
    tip.innerHTML=`<div class="ty">${xlabels[bi]}</div>${rows||'<span class="n">no data</span>'}`;
    tip.style.display='block';
    const cw=el.getBoundingClientRect();
    let lx=(ev.clientX-cw.left)+14; if(lx+150>cw.width) lx=(ev.clientX-cw.left)-160;
    tip.style.left=lx+'px'; tip.style.top=Math.max(0,(ev.clientY-cw.top)-20)+'px';
  });
  svg.addEventListener('mouseleave',()=>tip.style.display='none');
}
function niceCeil(v){ const p=Math.pow(10,Math.floor(Math.log10(v)));
  for(const m of [1,1.2,1.5,2,2.5,3,4,5,6,8,10]) if(m*p>=v) return m*p; return 10*p; }
const legendHTML=s=>s.map(x=>`<span class="it"><span class="sw" style="background:${x.color}"></span>${esc(x.name)}</span>`).join('');
function segControl(el, labels, initial, onchange){
  el.innerHTML='';
  labels.forEach((l,i)=>{ const b=document.createElement('button');
    b.textContent=l; b.setAttribute('aria-pressed', i===initial);
    b.addEventListener('click',()=>{ el.querySelectorAll('button').forEach((x,j)=>x.setAttribute('aria-pressed',j===i)); onchange(i); });
    el.appendChild(b); });
}
function stateSelect(id, onchange){
  const sel=document.getElementById(id);
  D.states.forEach(s=>{ const o=document.createElement('option'); o.value=o.textContent=s; sel.appendChild(o); });
  sel.value="India"; sel.addEventListener('change',onchange);
  return sel;
}

/* ---------------- tabs ---------------- */
const TABS=[["overview","Overview"],["compare","Compare states"],["infra","Infrastructure"],
  ["equity","Equity"],["outA","Outcomes 2018-22"],["outB","Outcomes 2022-26"],["table","All states"]];
const tabsEl=document.getElementById('tabs');
TABS.forEach(([id,lab],i)=>{ const b=document.createElement('button');
  b.role="tab"; b.dataset.tab=id; b.textContent=lab; b.setAttribute('aria-selected', i===0);
  b.addEventListener('click',()=>{ tabsEl.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));
    TABS.forEach(([t])=>document.getElementById('tab-'+t).hidden=(t!==id)); });
  tabsEl.appendChild(b); });

/* ============ OVERVIEW ============ */
(function(){
  const root=document.getElementById('tab-overview');
  root.innerHTML=`<div class="controls"><div class="ctl"><span class="eyebrow">State / UT</span><select id="ov-state"></select></div></div>
  <div class="era-note">Counts below span both eras; the dashed orange divider marks the 2022-23 switch to student-level records — level definitions and outcome indicators are <b>not comparable across it</b> (see the two Outcomes tabs).</div>
  <div class="tiles" id="ov-tiles"></div><div class="grid2" id="ov-counts"></div><div class="grid2" id="ov-infra"></div>`;
  stateSelect('ov-state', render);
  function tile(label,val,dtxt,cls,sub){
    return `<div class="tile"><div class="eyebrow">${label}</div><div class="v">${val}</div>
    <div class="d ${cls}">${dtxt}</div>${sub?`<div class="hint">${sub}</div>`:''}</div>`; }
  function render(){
    const st=document.getElementById('ov-state').value;
    let h='';
    [['s','Schools'],['e','Enrolment'],['t','Teachers']].forEach(([k,lab])=>{
      const v0=METRICS[k].get(st,YB[0],{m:0}), v1=METRICS[k].get(st,YB[YB.length-1],{m:0});
      const d=(v0&&v1!=null)?(v1-v0)/v0*100:null;
      const cls=d==null?'flat':(d>0.05?'up':(d<-0.05?'down':'flat'));
      h+=tile(lab, fmtC(v1), (d==null?'–':(d>0?'+':'')+fmt1(d)+'%')+` <span class="vs">vs ${YB[0]}</span>`, cls);
    });
    [['inel','Functional electricity'],['ingt',"Girls' toilet"],['inne','Internet']].forEach(([k,lab])=>{
      const y1=YRS[YRS.length-1], v1=METRICS[k].get(st,y1), v0=METRICS[k].get(st,YRS[0]);
      const d=(v0!=null&&v1!=null)?v1-v0:null;
      h+=tile(lab, v1==null?'–':fmt1(v1)+'%', (d==null?'–':(d>0?'+':'')+fmt1(d)+' pp')+` <span class="vs">vs ${YRS[0]}</span>`, d==null?'flat':(d>=0?'up':'down'));
    });
    document.getElementById('ov-tiles').innerHTML=h;
    const cc=document.getElementById('ov-counts'); cc.innerHTML='';
    [['s','Schools'],['e','Enrolment'],['t','Teachers']].forEach(([k,lab])=>{
      const card=document.createElement('div'); card.className='card';
      const series=[1,2,3,4].map((m,i)=>({name:MGMT_SHORT[m],color:S(i+1),values:YRS.map(y=>METRICS[k].get(st,y,{m}))}));
      series.push({name:'Total',color:'var(--muted)',dashed:true,values:YRS.map(y=>METRICS[k].get(st,y,{m:0}))});
      card.innerHTML=`<h3>${lab} by management</h3><p class="note">${esc(st)} · dashed divider = methodology break</p>
        <div class="legend">${legendHTML(series)}</div><div class="chart-wrap"></div>`;
      cc.appendChild(card);
      lineChart(card.querySelector('.chart-wrap'),series,YRS,{breakAfter:YA.length-1});
    });
    const ic=document.getElementById('ov-infra'); ic.innerHTML='';
    [[['inel','Electricity (functional)'],['inwa','Drinking water'],['inli','Library']],
     [['inbt',"Boys' toilet (func.)"],['ingt',"Girls' toilet (func.)"],['inra','CWSN ramps']],
     [['inco','Computer'],['inne','Internet']]].forEach(group=>{
      const card=document.createElement('div'); card.className='card';
      const series=group.map(([k,lab],i)=>({name:lab,color:S(i+1),values:YRS.map(y=>METRICS[k].get(st,y))}));
      card.innerHTML=`<h3>% of schools — ${group.map(g=>g[1]).join(' · ')}</h3><p class="note">${esc(st)}, all managements</p>
        <div class="legend">${legendHTML(series)}</div><div class="chart-wrap"></div>`;
      ic.appendChild(card);
      lineChart(card.querySelector('.chart-wrap'),series,YRS,{fmt:fmt1,h:270,breakAfter:YA.length-1});
    });
  }
  render();
})();

/* ============ COMPARE ============ */
const cmp={metric:'e', m:0, l:null, g:2, sel:new Map()};
(function(){
  const root=document.getElementById('tab-compare');
  root.innerHTML=`<div class="controls">
    <div class="ctl"><span class="eyebrow">Indicator</span><select id="cmp-metric"></select></div>
    <div class="ctl" id="cmp-mgmt-w"><span class="eyebrow">Management</span><div class="seg" id="cmp-mgmt"></div></div>
    <div class="ctl" id="cmp-lvl-w" style="display:none"><span class="eyebrow">Level</span><div class="seg" id="cmp-lvl"></div></div>
    <div class="ctl" id="cmp-gen-w" style="display:none"><span class="eyebrow">Gender</span><div class="seg" id="cmp-gen"></div></div>
    <div class="ctl" id="cmp-era-w" style="display:none"><span class="eyebrow">Era</span><div class="seg" id="cmp-era"></div></div></div>
  <div class="controls"><div class="ctl"><span class="eyebrow">States (up to 8)</span>
    <div class="statebox" id="cmp-states"></div><div class="hint" id="cmp-hint"></div></div></div>
  <div class="card" style="margin-bottom:14px"><h3 id="cmp-title"></h3><p class="note" id="cmp-note"></p>
    <div class="legend" id="cmp-legend"></div><div class="chart-wrap" id="cmp-chart"></div></div>
  <div class="tablecard"><div class="tscroll"><table id="cmp-table"></table></div></div>`;
  const groups=[["Core counts",["e","s","t"]],["Infrastructure %",["inel","inwa","inbt","ingt","inli","inco","inne","inra"]],
    ["Equity",["sc","stt","obc","mus","mino","gpi","cwsn"]],["Outcomes (era-specific)",["ger","ner","dr","tr","rr","ptr"]]];
  const msel=document.getElementById('cmp-metric');
  groups.forEach(([glab,keys])=>{ const og=document.createElement('optgroup'); og.label=glab;
    keys.forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=METRICS[k].label; og.appendChild(o); });
    msel.appendChild(og); });
  msel.value='e';
  msel.addEventListener('change',()=>{ cmp.metric=msel.value; cmp.l=null; sync(); render(); });
  segControl(document.getElementById('cmp-mgmt'),MGMT_SHORT,0,i=>{cmp.m=i;render();});
  ["Uttar Pradesh","Bihar","Madhya Pradesh","Rajasthan","Maharashtra"].forEach(s=>{ if(D.d[s]) assign(s); });
  let era='B';
  segControl(document.getElementById('cmp-era'),["2018-22 (pre-NEP)","2022-26 (NEP)"],1,i=>{era=i?'B':'A'; cmp.l=null; sync(); render();});
  function assign(s){ const used=new Set(cmp.sel.values());
    for(const sl of [1,2,3,4,5,6,7,8]) if(!used.has(sl)){cmp.sel.set(s,sl); return true;} return false; }
  function cmpEra(){ const m=METRICS[cmp.metric]; return m.era==='both'?era:m.era; }
  function years(){ const e=cmpEra(); return e==='A'?YA:e==='B'?YB:YRS; }
  function sync(){
    const m=METRICS[cmp.metric];
    document.getElementById('cmp-mgmt-w').style.display=m.mgmt?'':'none';
    document.getElementById('cmp-era-w').style.display=m.era==='both'?'':'none';
    const lw=document.getElementById('cmp-lvl-w'), gw=document.getElementById('cmp-gen-w');
    if(m.lvl){ lw.style.display='';
      const labels=m.lvl(cmpEra()==='A'?'A':'B');
      const init=Math.min(cmp.l==null?labels.length-1:cmp.l,labels.length-1); cmp.l=init;
      segControl(document.getElementById('cmp-lvl'),labels,init,i=>{cmp.l=i;render();});
    } else lw.style.display='none';
    if(m.gender){ gw.style.display=''; segControl(document.getElementById('cmp-gen'),GEN,cmp.g,i=>{cmp.g=i;render();}); }
    else gw.style.display='none';
  }
  function buildBox(){
    const box=document.getElementById('cmp-states'); box.innerHTML='';
    D.states.forEach(s=>{
      const lab=document.createElement('label'); const cb=document.createElement('input');
      cb.type='checkbox'; cb.checked=cmp.sel.has(s); lab.className=cb.checked?'on':'';
      cb.addEventListener('change',()=>{
        if(cb.checked){ if(!assign(s)){ cb.checked=false; hint('Limit is 8 — deselect one first.'); return; } }
        else cmp.sel.delete(s);
        lab.className=cb.checked?'on':''; render();
      });
      lab.appendChild(cb); lab.appendChild(document.createTextNode(s)); box.appendChild(lab);
    });
  }
  function hint(msg){ const h=document.getElementById('cmp-hint'); h.textContent=msg;
    setTimeout(()=>h.textContent=cmp.sel.size+' selected',2500); }
  function render(){
    document.getElementById('cmp-hint').textContent=cmp.sel.size+' selected';
    const m=METRICS[cmp.metric], ys=years(), fmt=fmtOf(cmp.metric);
    const o={m:cmp.m,l:cmp.l,g:cmp.g};
    const series=[...cmp.sel.keys()].map(st=>({name:st,color:S(cmp.sel.get(st)),values:ys.map(y=>m.get(st,y,o))}));
    let desc=m.label;
    if(m.mgmt) desc+=' — '+MGMT[cmp.m];
    if(m.lvl) desc+=' — '+m.lvl(cmpEra())[cmp.l];
    if(m.gender) desc+=' · '+GEN[cmp.g];
    document.getElementById('cmp-title').textContent=desc;
    document.getElementById('cmp-note').textContent =
      m.era==='all'&&ys.length===8 ? 'Series spans the 2022-23 methodology break (dashed divider); compare within an era.' :
      m.era==='both' ? `Shown for ${cmpEra()==='A'?'2018-19 → 2021-22 (pre-NEP levels)':'2022-23 → 2025-26 (NEP stages)'} only — the eras are not comparable.` : '';
    document.getElementById('cmp-legend').innerHTML=legendHTML(series);
    lineChart(document.getElementById('cmp-chart'),series,ys,
      {fmt,h:330,breakAfter:(m.era==='all'&&ys.length===8)?YA.length-1:null});
    const full=fullFmtOf(cmp.metric);
    let h='<thead><tr><th>State / UT</th>'+ys.map(y=>`<th>${y}</th>`).join('')+'<th>Δ first→last</th></tr></thead><tbody>';
    series.forEach(s=>{
      const a=s.values.find(v=>v!=null), b=[...s.values].reverse().find(v=>v!=null);
      let dt='–';
      if(a!=null&&b!=null) dt = m.unit==='n' ? (b-a>=0?'+':'')+fmtIN(b-a) : (b-a>=0?'+':'')+fmt1(b-a)+(m.unit==='pct'?' pp':'');
      h+=`<tr><td><span class="sw" style="background:${s.color};margin-right:7px"></span>${esc(s.name)}</td>`
        +s.values.map(v=>`<td>${full(v)}</td>`).join('')+`<td>${dt}</td></tr>`;
    });
    document.getElementById('cmp-table').innerHTML=h+'</tbody>';
  }
  sync(); buildBox(); render();
})();

/* ============ INFRASTRUCTURE ============ */
(function(){
  const root=document.getElementById('tab-infra');
  root.innerHTML=`<div class="controls"><div class="ctl"><span class="eyebrow">Year</span><select id="if-year"></select></div></div>
  <div class="tablecard"><div class="tscroll"><table id="if-table"></table></div></div>
  <p class="hint">% of schools, all managements. Electricity/toilets are <b>functional</b>; water/library/computer/internet/ramps are availability. Click headers to sort. <span id="if-cite"></span></p>`;
  const ysel=document.getElementById('if-year');
  YRS.forEach(y=>{const o=document.createElement('option');o.value=o.textContent=y;ysel.appendChild(o);});
  ysel.value=YRS[YRS.length-1]; ysel.addEventListener('change',render);
  const COLS=[['inel','Electricity'],['inwa','Water'],['inbt',"Boys' toilet"],['ingt',"Girls' toilet"],
    ['inli','Library'],['inco','Computer'],['inne','Internet'],['inra','Ramps']];
  let sort={col:1,dir:-1};
  function render(){
    const y=ysel.value;
    const rows=D.states.filter(s=>s!=='India').map(st=>({st,v:COLS.map(([k])=>METRICS[k].get(st,y))}));
    const ci=sort.col-1;
    rows.sort((a,b)=>{ if(sort.col===0) return a.st.localeCompare(b.st)*sort.dir;
      const av=a.v[ci],bv=b.v[ci]; if(av==null)return 1; if(bv==null)return -1; return (av-bv)*sort.dir; });
    const india={st:'India',v:COLS.map(([k])=>METRICS[k].get('India',y))};
    const arr=c=>sort.col===c?` <span class="arr">${sort.dir>0?'▲':'▼'}</span>`:'';
    let h='<thead><tr><th class="sortable" data-c="0">State / UT'+arr(0)+'</th>'
      +COLS.map((c,i)=>`<th class="sortable" data-c="${i+1}">${c[1]}${arr(i+1)}</th>`).join('')+'</tr></thead><tbody>';
    h+=`<tr class="india"><td>India</td>${india.v.map(v=>`<td>${fmt1(v)}</td>`).join('')}</tr>`;
    rows.forEach(r=>{h+=`<tr><td>${esc(r.st)}</td>${r.v.map(v=>`<td>${fmt1(v)}</td>`).join('')}</tr>`;});
    document.getElementById('if-table').innerHTML=h+'</tbody>';
    document.getElementById('if-table').querySelectorAll('th.sortable').forEach(th=>{
      th.addEventListener('click',()=>{ const c=+th.dataset.c;
        sort=(sort.col===c)?{col:c,dir:-sort.dir}:{col:c,dir:c===0?1:-1}; render(); });
    });
    const cites=COLS.map(([k])=>citeOf(k,y)).filter(Boolean);
    document.getElementById('if-cite').textContent=cites.length?`Source: ${y} report, Tables ${cites.map(c=>c.match(/Table ([\d.]+)/)[1]).join(', ')}.`:'';
  }
  render();
})();

/* ============ EQUITY ============ */
(function(){
  const root=document.getElementById('tab-equity');
  root.innerHTML=`<div class="controls"><div class="ctl"><span class="eyebrow">Year</span><select id="eq-year"></select></div></div>
  <div class="era-note" id="eq-note"></div>
  <div class="tablecard"><div class="tscroll"><table id="eq-table"></table></div></div>
  <p class="hint" id="eq-cite"></p>`;
  const ysel=document.getElementById('eq-year');
  YRS.forEach(y=>{const o=document.createElement('option');o.value=o.textContent=y;ysel.appendChild(o);});
  ysel.value=YRS[YRS.length-1]; ysel.addEventListener('change',render);
  let sort={col:1,dir:-1};
  function render(){
    const y=ysel.value, isB=eraOf(y)==='B';
    const COLS = isB
      ? [['sc','SC %'],['stt','ST %'],['obc','OBC %'],['mus','Muslim %'],['gpi','GPI (overall)'],['cwsn','CWSN enrolment']]
      : [['obc','OBC %'],['mino','Minority %'],['gpi','GPI (overall)'],['cwsn','CWSN enrolment']];
    document.getElementById('eq-note').innerHTML = isB
      ? 'Shares of total enrolment by social category (NEP-era, student-level records).'
      : 'Pre-NEP years publish OBC and minority shares (not SC/ST shares) in the national booklets; SC/ST appear from 2022-23.';
    const rows=D.states.filter(s=>s!=='India').map(st=>({st,v:COLS.map(([k])=>METRICS[k].get(st,y,{}))}));
    const ci=sort.col-1;
    if(sort.col>COLS.length) sort={col:1,dir:-1};
    rows.sort((a,b)=>{ if(sort.col===0) return a.st.localeCompare(b.st)*sort.dir;
      const av=a.v[ci],bv=b.v[ci]; if(av==null)return 1; if(bv==null)return -1; return (av-bv)*sort.dir; });
    const india={st:'India',v:COLS.map(([k])=>METRICS[k].get('India',y,{}))};
    const arr=c=>sort.col===c?` <span class="arr">${sort.dir>0?'▲':'▼'}</span>`:'';
    const f=(v,i)=>COLS[i][0]==='cwsn'?fmtIN(v):COLS[i][0]==='gpi'?(v==null?'–':v.toFixed(2)):fmt1(v);
    let h='<thead><tr><th class="sortable" data-c="0">State / UT'+arr(0)+'</th>'
      +COLS.map((c,i)=>`<th class="sortable" data-c="${i+1}">${c[1]}${arr(i+1)}</th>`).join('')+'</tr></thead><tbody>';
    h+=`<tr class="india"><td>India</td>${india.v.map((v,i)=>`<td>${f(v,i)}</td>`).join('')}</tr>`;
    rows.forEach(r=>{h+=`<tr><td>${esc(r.st)}</td>${r.v.map((v,i)=>`<td>${f(v,i)}</td>`).join('')}</tr>`;});
    document.getElementById('eq-table').innerHTML=h+'</tbody>';
    document.getElementById('eq-table').querySelectorAll('th.sortable').forEach(th=>{
      th.addEventListener('click',()=>{ const c=+th.dataset.c;
        sort=(sort.col===c)?{col:c,dir:-sort.dir}:{col:c,dir:c===0?1:-1}; render(); });
    });
    const cites=[...new Set(COLS.map(([k])=>citeOf(k,y)).filter(Boolean))];
    document.getElementById('eq-cite').textContent=cites.length?'Source: '+cites.join(' · '):'';
  }
  render();
})();

/* ============ OUTCOMES (two era tabs) ============ */
function buildOutcomes(rootId, era){
  const ys=era==='A'?YA:YB;
  const root=document.getElementById(rootId);
  root.innerHTML=`<div class="era-note">${era==='A'
    ? 'Pre-NEP era: levels are Primary (I–V), Upper Primary (VI–VIII), Secondary (IX–X), Higher Secondary (XI–XII); data is school-aggregated. Not comparable with 2022-23 onward.'
    : 'NEP era: stages are Foundational (pre-primary–II), Preparatory (III–V), Middle (VI–VIII), Secondary (IX–XII); data is from individual student records. Not comparable with earlier years.'}</div>
  <div class="controls">
    <div class="ctl"><span class="eyebrow">Indicator</span><select id="${rootId}-m">
      ${['ger','ner','dr','tr','rr','ptr','gpi'].map(k=>`<option value="${k}">${METRICS[k].label}</option>`).join('')}</select></div>
    <div class="ctl"><span class="eyebrow">Level</span><div class="seg" id="${rootId}-l"></div></div>
    <div class="ctl" id="${rootId}-gw"><span class="eyebrow">Gender</span><div class="seg" id="${rootId}-g"></div></div>
    <div class="ctl"><span class="eyebrow">States (up to 8)</span><div class="statebox" id="${rootId}-s"></div><div class="hint" id="${rootId}-hint"></div></div>
  </div>
  <div class="card" style="margin-bottom:14px"><h3 id="${rootId}-title"></h3><p class="note" id="${rootId}-cite"></p>
    <div class="legend" id="${rootId}-legend"></div><div class="chart-wrap" id="${rootId}-chart"></div></div>
  <div class="tablecard"><div class="tscroll"><table id="${rootId}-table"></table></div></div>`;
  const st8=new Map(); ["India","Uttar Pradesh","Bihar","Kerala"].forEach(s=>{ if(D.d[s]) st8.set(s,st8.size+1); });
  let metric='ger', lvl=null, gen=2;
  const msel=document.getElementById(rootId+'-m');
  msel.addEventListener('change',()=>{metric=msel.value; lvl=null; sync(); render();});
  function sync(){
    const m=METRICS[metric], labels=m.lvl(era);
    if(lvl==null||lvl>=labels.length) lvl=labels.length-1;
    if(metric==='dr'||metric==='tr') lvl=Math.min(lvl,labels.length-1);
    segControl(document.getElementById(rootId+'-l'),labels,lvl,i=>{lvl=i;render();});
    const gw=document.getElementById(rootId+'-gw');
    if(m.gender){ gw.style.display=''; segControl(document.getElementById(rootId+'-g'),GEN,gen,i=>{gen=i;render();}); }
    else gw.style.display='none';
  }
  const box=document.getElementById(rootId+'-s');
  D.states.forEach(s=>{
    const lab=document.createElement('label'); const cb=document.createElement('input');
    cb.type='checkbox'; cb.checked=st8.has(s); lab.className=cb.checked?'on':'';
    cb.addEventListener('change',()=>{
      if(cb.checked){ if(st8.size>=8){cb.checked=false; return;} st8.set(s,(Math.max(0,...st8.values())%8)+1); }
      else st8.delete(s);
      lab.className=cb.checked?'on':''; render();
    });
    lab.appendChild(cb); lab.appendChild(document.createTextNode(s)); box.appendChild(lab);
  });
  function render(){
    const m=METRICS[metric], o={l:lvl,g:gen}, fmt=fmtOf(metric);
    document.getElementById(rootId+'-hint').textContent=st8.size+' selected';
    const series=[...st8.keys()].map((st,i)=>({name:st,color:S((i%8)+1),values:ys.map(y=>m.get(st,y,o))}));
    let t=`${m.label} — ${m.lvl(era)[lvl]}`; if(m.gender) t+=' · '+GEN[gen];
    document.getElementById(rootId+'-title').textContent=t;
    document.getElementById(rootId+'-cite').textContent=(citeOf(metric,ys[ys.length-1])||'')+' (and corresponding tables in earlier reports)';
    document.getElementById(rootId+'-legend').innerHTML=legendHTML(series);
    lineChart(document.getElementById(rootId+'-chart'),series,ys,{fmt,h:320});
    let h='<thead><tr><th>State / UT</th>'+ys.map(y=>`<th>${y}</th>`).join('')+'</tr></thead><tbody>';
    series.forEach(s=>{ h+=`<tr><td><span class="sw" style="background:${s.color};margin-right:7px"></span>${esc(s.name)}</td>`
      +s.values.map(v=>`<td>${fmt(v)}</td>`).join('')+'</tr>'; });
    document.getElementById(rootId+'-table').innerHTML=h+'</tbody>';
  }
  sync(); render();
}
buildOutcomes('tab-outA','A');
buildOutcomes('tab-outB','B');

/* ============ ALL STATES ============ */
(function(){
  const root=document.getElementById('tab-table');
  root.innerHTML=`<div class="controls">
    <div class="ctl"><span class="eyebrow">Year</span><select id="tb-year"></select></div>
    <div class="ctl"><span class="eyebrow">Indicator</span><select id="tb-metric"></select></div></div>
  <div class="tablecard"><div class="tscroll"><table id="tb-table"></table></div></div>
  <p class="hint" id="tb-cite">Click a column header to sort. India stays pinned on top.</p>`;
  const ysel=document.getElementById('tb-year'), msel=document.getElementById('tb-metric');
  YRS.forEach(y=>{const o=document.createElement('option');o.value=o.textContent=y;ysel.appendChild(o);});
  ysel.value=YRS[YRS.length-1];
  [['e','Enrolment'],['s','Schools'],['t','Teachers'],['ger','GER'],['ner','NER'],['dr','Dropout'],['tr','Transition'],['rr','Retention'],['ptr','PTR'],['gpi','GPI']]
    .forEach(([k,l])=>{const o=document.createElement('option');o.value=k;o.textContent=l;msel.appendChild(o);});
  let sort={col:1,dir:-1};
  ysel.addEventListener('change',render); msel.addEventListener('change',()=>{sort={col:1,dir:-1};render();});
  function render(){
    const y=ysel.value, k=msel.value, m=METRICS[k], era=eraOf(y);
    let cols, get;
    if(m.mgmt){ cols=['Total','Government','Govt Aided','Pvt Unaided','Others','Private share %'];
      get=st=>{const a=cell(st,y)[k]; if(!a) return cols.map(()=>null);
        return [...a, a[0]?a[3]/a[0]*100:null]; };
    } else { const labels=m.lvl(era); cols=labels;
      get=st=>labels.map((_,i)=>m.get(st,y,{l:i,g:2}));
    }
    if((m.era==='A'&&era!=='A')||(m.era==='B'&&era!=='B')){
      document.getElementById('tb-table').innerHTML='<tbody><tr><td>Not published for '+y+'.</td></tr></tbody>'; return;
    }
    const rows=D.states.filter(s=>s!=='India').map(st=>({st,v:get(st)}));
    const ci=sort.col-1;
    rows.sort((a,b)=>{ if(sort.col===0) return a.st.localeCompare(b.st)*sort.dir;
      const av=a.v[ci],bv=b.v[ci]; if(av==null)return 1; if(bv==null)return -1; return (av-bv)*sort.dir; });
    const india={st:'India',v:get('India')};
    const f=(v,i)=>m.mgmt?(i===5?fmt1(v)+'%':fmtIN(v)):fmtOf(k)(v);
    const arr=c=>sort.col===c?` <span class="arr">${sort.dir>0?'▲':'▼'}</span>`:'';
    let h='<thead><tr><th class="sortable" data-c="0">State / UT'+arr(0)+'</th>'
      +cols.map((c,i)=>`<th class="sortable" data-c="${i+1}">${c}${arr(i+1)}</th>`).join('')+'</tr></thead><tbody>';
    h+=`<tr class="india"><td>India</td>${india.v.map((v,i)=>`<td>${f(v,i)}</td>`).join('')}</tr>`;
    rows.forEach(r=>{h+=`<tr><td>${esc(r.st)}</td>${r.v.map((v,i)=>`<td>${f(v,i)}</td>`).join('')}</tr>`;});
    const tb=document.getElementById('tb-table');
    tb.innerHTML=h+'</tbody>';
    tb.querySelectorAll('th.sortable').forEach(th=>{
      th.addEventListener('click',()=>{ const c=+th.dataset.c;
        sort=(sort.col===c)?{col:c,dir:-sort.dir}:{col:c,dir:c===0?1:-1}; render(); });
    });
    document.getElementById('tb-cite').textContent='Click a column header to sort. '+(citeOf(k,y)?'Source: '+citeOf(k,y)+'.':'');
  }
  render();
})();

/* ============ ASK (smart search) ============ */
(function(){
  const input=document.getElementById('ask-input'), ans=document.getElementById('ask-answer');
  const EX=["GER in Bihar 2023-24","Compare girls toilets in UP vs Kerala","Top 5 states by PTR",
    "Dropout rate for girls in Rajasthan","Internet in schools in Assam","SC share of enrolment in Punjab",
    "Which state has the lowest dropout rate?"];
  const chips=document.getElementById('ask-chips');
  EX.forEach(q=>{ const b=document.createElement('button'); b.textContent=q;
    b.addEventListener('click',()=>{input.value=q; go();}); chips.appendChild(b); });
  const ALIAS={up:"Uttar Pradesh",mp:"Madhya Pradesh",tn:"Tamil Nadu",ap:"Andhra Pradesh",hp:"Himachal Pradesh",
    uk:"Uttarakhand",uttaranchal:"Uttarakhand",wb:"West Bengal",jk:"Jammu & Kashmir",jammu:"Jammu & Kashmir",
    kashmir:"Jammu & Kashmir",orissa:"Odisha",pondicherry:"Puducherry",chattisgarh:"Chhattisgarh",
    chhatisgarh:"Chhattisgarh",andaman:"Andaman & Nicobar Islands",nicobar:"Andaman & Nicobar Islands",
    dnh:"Dadra & Nagar Haveli and Daman & Diu",daman:"Dadra & Nagar Haveli and Daman & Diu",
    dadra:"Dadra & Nagar Haveli and Daman & Diu",nct:"Delhi",telengana:"Telangana"};
  const normQ=s=>s.toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
  function findStates(qn){
    let s=' '+qn+' '; const hits=[];
    D.states.slice().sort((a,b)=>b.length-a.length).forEach(st=>{
      const key=' '+normQ(st)+' ';
      const i=s.indexOf(key);
      if(i>=0){ hits.push({st,i}); s=s.replace(key,' '.repeat(key.length)); }
    });
    for(const [al,st] of Object.entries(ALIAS)){
      if(hits.some(h=>h.st===st)) continue;
      const m=s.match(new RegExp('\\b'+al+'\\b'));
      if(m&&D.d[st]) hits.push({st,i:m.index});
    }
    return hits.sort((a,b)=>a.i-b.i).map(h=>h.st);
  }
  function parse(raw){
    const qn=normQ(raw);
    const p={states:findStates(qn),metric:null,m:null,l:null,g:null,year:null,sup:null};
    const has=re=>re.test(qn);
    if(has(/\bger\b|gross enrolment/)) p.metric='ger';
    else if(has(/\bner\b|net enrolment/)) p.metric='ner';
    else if(has(/dropout|drop out/)) p.metric='dr';
    else if(has(/transition/)) p.metric='tr';
    else if(has(/retention/)) p.metric='rr';
    else if(has(/\bptr\b|pupil teacher|pupil-teacher/)) p.metric='ptr';
    else if(has(/\bgpi\b|gender parity/)) p.metric='gpi';
    else if(has(/electricity|power/)) p.metric='inel';
    else if(has(/water/)) p.metric='inwa';
    else if(has(/toilet|washroom/)) p.metric=has(/boy/)?'inbt':'ingt';
    else if(has(/library/)) p.metric='inli';
    else if(has(/computer/)) p.metric='inco';
    else if(has(/internet|wifi|wi fi/)) p.metric='inne';
    else if(has(/ramp/)) p.metric='inra';
    else if(has(/cwsn|special needs|disabilit/)) p.metric='cwsn';
    else if(has(/\bsc\b|scheduled caste/)) p.metric='sc';
    else if(has(/\bst\b|scheduled tribe/)) p.metric='stt';
    else if(has(/obc/)) p.metric='obc';
    else if(has(/muslim/)) p.metric='mus';
    else if(has(/minorit/)) p.metric='mino';
    else if(has(/school/)) p.metric='s';
    else if(has(/teacher/)) p.metric='t';
    else if(has(/enrol|student|children/)) p.metric='e';
    if(p.metric&&METRICS[p.metric].mgmt){
      if(has(/\b(government|govt|sarkari)\b/)&&!has(/aided/)) p.m=1;
      else if(has(/aided/)) p.m=2;
      else if(has(/private|unaided/)) p.m=3;
    }
    if(has(/foundational|pre primary|preprimary/)) p.l={A:0,B:0};
    else if(has(/upper primary|middle/)) p.l={A:1,B:2};
    else if(has(/preparatory/)) p.l={A:1,B:1};
    else if(has(/higher secondary|hr sec/)) p.l={A:4,B:3};
    else if(has(/secondary|high school/)) p.l={A:3,B:3};
    else if(has(/elementary/)) p.l={A:2,B:2};
    else if(has(/primary/)) p.l={A:0,B:1};
    if(has(/\b(boys?|male)\b/)) p.g=0; else if(has(/\b(girls?|female|women)\b/)) p.g=1;
    let m=qn.match(/\b(20\d{2})\s*-\s*(\d{2})\b/);
    if(m){ const lbl=m[1]+'-'+m[2]; if(YRS.includes(lbl)) p.year=lbl; }
    else{ m=qn.match(/\b(20\d{2})\b/);
      if(m){ p.year=YRS.find(y=>y.startsWith(m[1]))||YRS.find(y=>y.endsWith(String(+m[1]%100)))||null; } }
    const desc=has(/\b(top|highest|most|largest|best|maximum|max)\b/);
    const asc=has(/\b(bottom|lowest|least|smallest|minimum|min|worst|which state has the lowest)\b/);
    if(desc||asc){ const n=qn.match(/\b(?:top|bottom)\s+(\d{1,2})\b/);
      p.sup={dir:asc?'asc':'desc', n:n?Math.min(+n[1],36):5}; }
    return p;
  }
  /* Resolve a single level index used by BOTH the label and the value, clamped
     to what the year actually publishes — so the answer never reads e.g.
     "Higher Secondary" above a Secondary number. */
  function lvlIdx(p,y){
    const m=METRICS[p.metric];
    if(!m.lvl) return null;
    const n=nLevels(p.metric,y);
    let i = p.l==null ? DEF_LVL : p.l[eraOf(y)];
    return Math.max(0, Math.min(i, n-1));
  }
  function describe(p,y){
    const m=METRICS[p.metric]; let d=m.label;
    if(m.mgmt&&p.m) d+=' — '+MGMT[p.m];
    if(m.lvl){ const labels=m.lvl(eraOf(y)); const i=lvlIdx(p,y);
      d+=' — '+labels[Math.min(i,labels.length-1)]; }
    if(m.gender&&p.g!=null) d+=' · '+GEN[p.g];
    return d;
  }
  function val(p,st,y){
    return METRICS[p.metric].get(st,y,{m:p.m||0,l:lvlIdx(p,y),g:p.g==null?2:p.g}); }
  function card(html){ ans.innerHTML=`<div class="card">${html}<button class="close" aria-label="close">✕</button></div>`;
    ans.querySelector('.close').addEventListener('click',()=>ans.innerHTML=''); }
  function yearTable(p,states,ys){
    const fmt=fullFmtOf(p.metric);
    let h='<div class="tscroll"><table><thead><tr><th>State</th>'+ys.map(y=>`<th${y===p.year?' class="hl"':''}>${y}</th>`).join('')+'</tr></thead><tbody>';
    states.forEach(st=>{ h+=`<tr><td>${esc(st)}</td>`+ys.map(y=>`<td${y===p.year?' class="hl"':''}>${fmt(val(p,st,y))}</td>`).join('')+'</tr>'; });
    return h+'</tbody></table></div>';
  }
  function go(){
    const q=input.value.trim(); if(!q) return;
    const p=parse(q);
    if(!p.metric&&!p.states.length){
      card(`<p class="lead">I couldn't read that. Try naming a state and an indicator — e.g. <i>"${EX[0]}"</i> or <i>"${EX[2]}"</i>.</p>`); return;
    }
    if(!p.metric){ // state overview
      const st=p.states[0], y=p.year||YRS[YRS.length-1];
      const list=[['e','Enrolment'],['s','Schools'],['t','Teachers'],['inel','Functional electricity %'],['ingt',"Girls' toilet %"],['inne','Internet %']];
      let rows=list.map(([k,l])=>{ const v=METRICS[k].get(st,y,{m:0});
        return `<div class="tr"><span class="n">${l}</span><span class="val">${(METRICS[k].unit==='n'?fmtC:fmt1)(v)}</span></div>`; }).join('');
      card(`<p class="lead"><b>${esc(st)}</b> — snapshot, ${y}</p>${rows}
        <p class="hint">Ask a specific indicator for trends, or open the Overview tab and pick ${esc(st)}.</p>`); return;
    }
    const m=METRICS[p.metric];
    if(p.sup){
      const y=p.year|| (m.era==='A'?YA[YA.length-1]:YRS[YRS.length-1]);
      const list=D.states.filter(s=>s!=='India').map(st=>({st,v:val(p,st,y)})).filter(r=>r.v!=null);
      list.sort((a,b)=>p.sup.dir==='desc'?b.v-a.v:a.v-b.v);
      const fmt=fullFmtOf(p.metric);
      let h=`<p class="lead">${p.sup.dir==='desc'?'Top':'Lowest'} ${p.sup.n} states by <b>${describe(p,y)}</b>, ${y}</p><div class="tscroll"><table><tbody>`;
      list.slice(0,p.sup.n).forEach((r,i)=>{ h+=`<tr><td>${i+1}. ${esc(r.st)}</td><td>${fmt(r.v)}</td></tr>`; });
      h+=`</tbody></table></div><p class="hint">India: ${fmt(val(p,'India',y))}${citeOf(p.metric,y)?' · Source: '+citeOf(p.metric,y):''}</p>`;
      card(h); return;
    }
    const states=p.states.length?p.states:['India'];
    if(m.era==='both'&&!p.year){
      const yA=YA, yB=YB;
      let h=`<p class="lead"><b>${states.map(esc).join(', ')}</b> — ${describe(p,yB[yB.length-1])}</p>`;
      h+=`<p class="note">2022-23 → today (NEP stages)</p>`+yearTable(p,states,yB);
      h+=`<p class="note" style="margin-top:8px">2018-19 → 2021-22 (pre-NEP levels — not comparable with above)</p>`+yearTable(p,states,yA);
      h+=`<p class="hint">${citeOf(p.metric,yB[yB.length-1])||''}</p>`;
      card(h); return;
    }
    const ys = p.year ? (m.era==='both'?(eraOf(p.year)==='A'?YA:YB):(m.era==='A'?YA:m.era==='B'?YB:YRS))
                      : (m.era==='A'?YA:m.era==='B'?YB:YRS);
    const y1=p.year||ys[ys.length-1];
    const fmt=fullFmtOf(p.metric);
    let lead;
    if(states.length===1){
      lead=`<p class="lead"><b>${esc(states[0])}</b> — ${describe(p,y1)}, ${y1}: <b>${fmt(val(p,states[0],y1))}</b>`
        +(states[0]!=='India'?` <span class="hint">(India: ${fmt(val(p,'India',y1))})</span>`:'')+`</p>`;
    } else {
      const parts=states.map(st=>`${esc(st)}: <b>${fmt(val(p,st,y1))}</b>`).join(' · ');
      lead=`<p class="lead">${describe(p,y1)}, ${y1} — ${parts}</p>`;
    }
    let h=lead+yearTable(p,states,ys);
    if(m.era==='all'&&ys.length===8) h+=`<p class="hint">Series crosses the 2022-23 methodology break — compare within an era.</p>`;
    h+=`<p class="hint">${citeOf(p.metric,y1)||''}</p>`;
    card(h);
  }
  document.getElementById('ask-go').addEventListener('click',go);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); });
})();

/* ============ footer ============ */
document.getElementById('foot').innerHTML=`
<b>Source:</b> UDISE+ national reports 2018-19 → 2025-26, Department of School Education &amp; Literacy, Ministry of Education, Government of India (udiseplus.gov.in).
Every indicator's table number and page are cited in-context; full mapping in the repository's <code>pipeline/</code>.<br>
<b>Comparability:</b> From 2022-23 UDISE+ uses NEP stages (Foundational/Preparatory/Middle/Secondary) and individual student records; the Ministry states these figures are not strictly comparable with earlier school-aggregated reports. This dashboard never draws outcome trends across that break.<br>
<b>Managements:</b> Government incl. KVS/NVS and state governments; "Private" is Private Unaided (Recognized); unrecognized private schools sit inside "Others".<br>
<b>Notes:</b> GER can exceed 100% (over/under-age enrolment). Dropout is not published for the first stage of either era. 2018-19 and 2019-20 report Dadra &amp; Nagar Haveli and Daman &amp; Diu separately (merged UT thereafter); Ladakh appears from 2019-20.`;
