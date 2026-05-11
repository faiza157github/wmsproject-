// ═══ DATA ═══
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
const monthly={freshWaterTank:[547,664,770,838,957,1016,994,884,785,957,621,655],withdraw:[580,700,810,880,1000,1060,1040,930,830,1000,660,690],recycle:[99,110,79,111,101,86,70,115,94,147,246,172],discharge:[34,58,96,100,99,98,78,85,74,120,82,69]};
const monthly2={freshWaterTank:[480,560,640,710,820,890,860,780,700,830,550,600],withdraw:[510,590,672,748,860,935,902,820,738,872,580,632],recycle:[80,92,65,94,84,70,58,98,78,124,208,142],discharge:[28,48,82,88,86,84,66,72,62,104,70,58]};
const monthlyU={freshWaterTank:[180,220,280,310,360,400,380,340,300,360,210,100],withdraw:[190,232,295,326,378,420,399,357,315,378,220,105],recycle:[32,38,28,40,36,30,24,42,34,52,88,62],discharge:[12,18,32,36,30,28,24,26,22,38,24,10]};
const kpiMeta={freshWaterTank:{label:'Fresh Water Tank',icon:'&#128167;',tag:'Intake',line:'#38b6ff'},withdraw:{label:'Withdraw',icon:'&#128260;',tag:'Pumped out',line:'#a78bfa'},recycle:{label:'Recycle',icon:'&#9851;&#65039;',tag:'Recovered',line:'#6ee7b7'},discharge:{label:'Discharge',icon:'&#11015;&#65039;',tag:'WWTP out',line:'#fbbf24'}};
const factoryData={dpl1:{monthly:[547,664,770,838,957,1016,994,884,785,957,621,655],out:[34,58,96,100,99,98,78,85,74,120,82,69]},dpl2:{monthly:[480,560,640,710,820,890,860,780,700,830,550,600],out:[28,48,82,88,86,84,66,72,62,104,70,58]},uril:{monthly:[180,220,280,310,360,400,380,340,300,360,210,100],out:[12,18,32,36,30,28,24,26,22,38,24,10]}};
const now=new Date(),cm=Math.min(now.getMonth(),11),frac=now.getDate()/new Date(now.getFullYear(),now.getMonth()+1,0).getDate();

// ═══ STATE ═══
let activePeriod='td';
let bccMeter='all',bccMeter2='all',bccMeterU='all';
let fccFactory='all',ovRcFactory='all';
let globalFilter={from:null,to:null};
const charts={};
const liveR={wpu:12.5,dpu:3.8,wpu2:10.2,dpu2:3.1,wpuU:4.2,dpuU:1.1};
const fs={};
function getfs(id){return fs[id]||(fs[id]={p:'daily',w:'',mo:'',yr:''});}

// ═══ HELPERS ═══
function fmt(n){return Math.round(n).toLocaleString();}
function seed(n){let x=Math.sin(n+1)*9999;return x-Math.floor(x);}
function gc(){return{grid:'rgba(200,215,235,0.45)',tick:'#8898aa'};}
function dc(id){if(charts[id]){try{charts[id].destroy();}catch(e){}delete charts[id];}}
function touch(){const e=document.getElementById('last-updated');if(e)e.textContent='Updated '+new Date().toLocaleTimeString('en-US',{hour12:false});}
function toggleSidebar(){document.body.classList.toggle('sb-collapsed');setTimeout(()=>{Object.values(charts).forEach(c=>{try{c.resize();}catch(e){}});},280);}
const TT={backgroundColor:'rgba(12,36,97,0.95)',titleColor:'#a0c4f0',titleFont:{family:"'IBM Plex Mono',monospace",size:11,weight:'600'},bodyColor:'#d0e4ff',bodyFont:{family:"'IBM Plex Mono',monospace",size:11},borderColor:'rgba(56,182,255,0.22)',borderWidth:1,padding:11,cornerRadius:9};

// ═══ DATE SELECTOR LOGIC ═══
function handleDS(id){
  const p=document.getElementById(id+'-period')?.value||'daily';
  const w=document.getElementById(id+'-week')?.value||'';
  const mo=document.getElementById(id+'-month')?.value||'';
  const yr=document.getElementById(id+'-year')?.value||'';
  fs[id]={p,w,mo,yr};
  const wSel=document.getElementById(id+'-week');
  const mSel=document.getElementById(id+'-month');
  if(wSel){wSel.disabled=(p==='monthly'||p==='yearly');}
  if(mSel){mSel.disabled=(p==='yearly');}
  const map={bcc:renderBccChart,rc1:renderRcChart,bcc2:renderBccChart2,rc2:renderRcChart2,bccU:renderBccChartU,rcU:renderRcChartU,fcc:renderFactoryChart,ovrc:renderOvRcChart};
  if(map[id])map[id]();
}

// ═══ LABEL/DATA GENERATORS ═══
function getLabels(id){
  const{p,w}=getfs(id);
  if(p==='daily'){
    return['10:30AM','11:30AM','12:30PM','1:30PM','2:30PM','3:30PM','4:30PM','5:30PM','6:30PM','7:30PM','8:30PM','9:30PM','10:30PM','11:30PM','12:30AM','1:30AM','2:30AM','3:30AM','4:30AM','5:30AM','6:30AM','7:30AM','8:30AM','9:30AM'];
  }
  if(p==='weekly'){
    const wk=parseInt(w)||1;
    const start=(wk-1)*7+1;
    const end=Math.min(start+6,31);
    const arr=[];
    for(let d=start;d<=end;d++)arr.push('Day '+d);
    return arr;
  }
  if(p==='monthly'){return months;}
  if(p==='yearly'){return['2023','2024','2025','2026','2027','2028'];}
  return months;
}
function getSubLabel(id){
  const{p,w,mo,yr}=getfs(id);
  const yStr=yr?' \u00b7 '+yr:'';
  const mName=mo?monthNames[parseInt(mo)-1]:'';
  if(p==='daily')return(mName?mName+' \u00b7 ':'')+'Today \u00b7 24 Hours'+yStr;
  if(p==='weekly'){
    const wk=parseInt(w)||1;
    const start=(wk-1)*7+1,end=Math.min(start+6,31);
    return(mName?mName+' \u00b7 ':'')+`Week ${wk} (Days ${start}\u2013${end})`+yStr;
  }
  if(p==='monthly')return 'Monthly \u00b7 Jan\u2013Dec'+(yr?' '+yr:' 2023');
  if(p==='yearly')return'Yearly \u00b7 2023\u20132028';
  return '';
}
function getYF(yr){if(!yr)return 1;const y=parseInt(yr);return isNaN(y)?1:Math.max(0.5,1+(y-2023)*0.07);}
function genD(base,id){
  const{p,w,mo,yr}=getfs(id);
  const factor=getYF(yr);
  const labels=getLabels(id);
  const n=labels.length;
  if(p==='monthly'){return base.map(v=>Math.round(v*factor));}
  if(p==='yearly'){const total=base.reduce((a,b)=>a+b,0)*factor;return[0,1,2,3,4,5].map(i=>Math.round(total/6*(0.75+i*0.065+seed(i+base[0])*0.08)));}
  const total=base.reduce((a,b)=>a+b,0)*factor;
  const mScale=mo?base[parseInt(mo)-1]/Math.max(1,base.reduce((a,b)=>a+b,0)*12)*12:1;
  return Array.from({length:n},(_,i)=>Math.round((total/12/n)*mScale*(0.65+Math.sin(i/3.2+base[0]%5)*0.28+seed(i+base[0])*0.28)));
}
function genRc(base,id){
  const{p,mo,yr}=getfs(id);
  const factor=getYF(yr);
  const labels=getLabels(id);
  if(p==='monthly'){return base.freshWaterTank.map((v,i)=>v>0?+(base.recycle[i]/v*100*factor).toFixed(1):0);}
  if(p==='yearly'){return[0,1,2,3,4,5].map(i=>+(11+i*1.4+seed(i+base.freshWaterTank[0])*2.5).toFixed(1));}
  const moIdx=mo?parseInt(mo)-1:cm;
  const rcPct=base.freshWaterTank[moIdx]>0?(base.recycle[moIdx]/base.freshWaterTank[moIdx]*100):12;
  return Array.from({length:labels.length},(_,i)=>+(rcPct*(0.7+Math.sin(i/3)*0.3+seed(i+5)*0.35)).toFixed(1));
}

// ═══ BAR CHART RENDERER ═══
function renderBar(canvasId,id,baseData,meterKey,titleId,subId,legId){
  const allK=['freshWaterTank','withdraw','discharge'];
  const allL=['Fresh Water Tank','Withdraw','Discharge'];
  const allC=['#1558b0','#7c3aed','#f59e0b'];
  const keys=meterKey==='all'?allK:[meterKey];
  const labels=getLabels(id);
  if(document.getElementById(titleId))document.getElementById(titleId).textContent=meterKey==='all'?'Water Consumption Analysis':(kpiMeta[meterKey]?.label||meterKey)+' \u2013 Analysis';
  if(document.getElementById(subId))document.getElementById(subId).innerHTML=getSubLabel(id);
  if(document.getElementById(legId))document.getElementById(legId).innerHTML=keys.map(k=>{const i=allK.indexOf(k);return`<div class="leg"><div class="leg-dot" style="background:${allC[i<0?0:i]}"></div>${allL[i<0?0:i]}</div>`;}).join('');
  dc(canvasId);
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const{grid,tick}=gc();
  const datasets=keys.map(k=>{
    const i=allK.indexOf(k);
    const c=allC[i<0?0:i];
    const g=ctx.createLinearGradient(0,0,0,290);g.addColorStop(0,c+'ee');g.addColorStop(1,c+'44');
    return{label:allL[i<0?0:i],data:genD(baseData[k],id),backgroundColor:g,borderColor:c,borderWidth:1.5,borderRadius:5,borderSkipped:false};
  });
  charts[canvasId]=new Chart(canvas,{type:'bar',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},animation:{duration:380},plugins:{legend:{display:false},tooltip:{...TT,callbacks:{title:i=>'  '+i[0].label,label:c=>`  ${c.dataset.label}: ${c.parsed.y.toLocaleString()} m\u00b3`}}},scales:{x:{grid:{display:false},ticks:{color:'#8898aa',font:{size:7.5},maxRotation:50,autoSkip:labels.length>16},border:{display:false}},y:{grid:{color:grid},beginAtZero:true,ticks:{color:tick,font:{size:9.5},callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v},border:{display:false}}}},plugins:[{id:'bl',afterDatasetsDraw(chart){const c3=chart.ctx;chart.data.datasets.forEach((ds,di)=>{const meta=chart.getDatasetMeta(di);if(meta.hidden)return;meta.data.forEach((bar,idx)=>{const val=ds.data[idx];if(!val)return;const bH=bar.base-bar.y;const txt=val>=1000?(val/1000).toFixed(1)+'k':String(val);c3.save();if(bH>30){c3.translate(bar.x,bar.y+bH/2);c3.rotate(-Math.PI/2);c3.font=`700 7.5px 'IBM Plex Mono',monospace`;c3.textAlign='center';c3.textBaseline='middle';c3.fillStyle='rgba(255,255,255,0.93)';c3.fillText(txt,0,0);}else if(bH>14){c3.font=`700 7px 'IBM Plex Mono',monospace`;c3.textAlign='center';c3.textBaseline='bottom';c3.fillStyle='#0c2461';c3.fillText(txt,bar.x,bar.y-2);}c3.restore();});});}}]});
}
function renderBccChart(){renderBar('bccChart','bcc',monthly,bccMeter,'bcc-title','bcc-sub','bcc-leg');}
function renderBccChart2(){renderBar('dpl2BccChart','bcc2',monthly2,bccMeter2,'bcc2-title','bcc2-sub','bcc2-leg');}
function renderBccChartU(){renderBar('urilBccChart','bccU',monthlyU,bccMeterU,'bccU-title','bccU-sub','bccU-leg');}
function setMeter(m,btn){bccMeter=m;document.querySelectorAll('#view-dpl1 .mbtn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');renderBccChart();}
function setMeter2(m,btn){bccMeter2=m;document.querySelectorAll('#view-dpl2 .mbtn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');renderBccChart2();}
function setMeterU(m,btn){bccMeterU=m;document.querySelectorAll('#view-uril .mbtn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');renderBccChartU();}

// ═══ RECYCLE CHART ═══
function renderRcGen(canvasId,id,base,badgeId){
  const labels=getLabels(id);
  const data=genRc(base,id);
  const badge=document.getElementById(badgeId);if(badge)badge.innerHTML=getSubLabel(id);
  dc(canvasId);
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const ag=ctx.createLinearGradient(0,0,0,230);ag.addColorStop(0,'rgba(14,170,96,0.22)');ag.addColorStop(1,'rgba(14,170,96,0.0)');
  const{tick}=gc();
  charts[canvasId]=new Chart(canvas,{type:'bar',data:{labels,datasets:[{type:'bar',label:'Volume',data,backgroundColor:'rgba(14,170,96,0.2)',borderColor:'rgba(14,170,96,0.48)',borderWidth:1,borderRadius:5,order:2},{type:'line',label:'Recycle %',data,borderColor:'#0eaa60',borderWidth:2.5,pointRadius:labels.length>15?0:4,pointHoverRadius:7,pointBackgroundColor:'#fff',pointBorderColor:'#0eaa60',pointBorderWidth:2,fill:true,backgroundColor:ag,tension:0.42,order:1}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},animation:{duration:380},plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(5,40,25,0.92)',titleColor:'#80e8b0',titleFont:{family:"'IBM Plex Mono',monospace",size:11},bodyColor:'#c0f0d8',bodyFont:{family:"'IBM Plex Mono',monospace",size:11},borderColor:'rgba(14,170,96,0.28)',borderWidth:1,padding:9,cornerRadius:7,callbacks:{title:i=>'  '+i[0].label,label:c=>`  Recycle: ${c.parsed.y.toFixed(1)}%`}}},scales:{x:{grid:{display:false},ticks:{color:'#8898aa',font:{size:7.5},maxRotation:50,autoSkip:labels.length>16},border:{display:false}},y:{grid:{color:'rgba(200,215,235,0.4)'},beginAtZero:true,suggestedMax:30,ticks:{color:tick,font:{size:9.5},callback:v=>v+'%'},border:{display:false}}}}});
}
function renderRcChart(){renderRcGen('rcChart','rc1',monthly,'rc1-badge');}
function renderRcChart2(){renderRcGen('dpl2RcChart','rc2',monthly2,'rc2-badge');}
function renderRcChartU(){renderRcGen('urilRcChart','rcU',monthlyU,'rcU-badge');}

// ═══ FACTORY COMPARISON CHART ═══
function renderFactoryChart(){
  const labels=getLabels('fcc');
  const sub=document.getElementById('fcc-sub');
  if(sub)sub.innerHTML=getSubLabel('fcc')+(fccFactory==='all'?'':' \u00b7 '+fccFactory.toUpperCase());
  const fColors={dpl1:'#1558b0',dpl2:'#7c3aed',uril:'#0a9e8a'};
  const fNames={dpl1:'DPL 1',dpl2:'DPL 2',uril:'URIL'};
  const keys=fccFactory==='all'?['dpl1','dpl2','uril']:[fccFactory];
  let datasets=[];
  keys.forEach(k=>{
    const c=fColors[k];
    const inData=genD(factoryData[k].monthly,'fcc');
    const totalIn=factoryData[k].monthly.reduce((a,b)=>a+b,0);
    const totalOut=factoryData[k].out.reduce((a,b)=>a+b,0);
    const ratio=totalIn>0?totalOut/totalIn:0.1;
    const outData=inData.map((v,i)=>Math.round(v*ratio*(0.85+seed(i+k.length+10)*0.3)));
    datasets.push({label:fNames[k]+' IN',data:inData,backgroundColor:c+'cc',borderColor:c,borderWidth:1.5,borderRadius:4,borderSkipped:false});
    datasets.push({label:fNames[k]+' OUT',data:outData,backgroundColor:c+'44',borderColor:c+'99',borderWidth:1.5,borderRadius:4,borderSkipped:false});
  });
  const leg=document.getElementById('fcc-legend');
  if(leg)leg.innerHTML=keys.map(k=>`<div class="leg"><div class="leg-dot" style="background:${fColors[k]}"></div>${fNames[k]} IN</div><div class="leg"><div class="leg-dot" style="background:${fColors[k]}44;border:1px solid ${fColors[k]}88"></div>${fNames[k]} OUT</div>`).join('');
  dc('factoryChart');
  const canvas=document.getElementById('factoryChart');if(!canvas)return;
  const{grid,tick}=gc();
  charts['factoryChart']=new Chart(canvas,{type:'bar',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},animation:{duration:380},plugins:{legend:{display:false},tooltip:{...TT,callbacks:{title:i=>'  '+i[0].label,label:c=>`  ${c.dataset.label}: ${c.parsed.y.toLocaleString()} m\u00b3`}}},scales:{x:{grid:{display:false},ticks:{color:'#8898aa',font:{size:7.5},maxRotation:50,autoSkip:labels.length>16},border:{display:false}},y:{grid:{color:grid},beginAtZero:true,ticks:{color:tick,font:{size:9.5},callback:v=>v>=1000?(v/1000).toFixed(1)+'k':v},border:{display:false}}}},plugins:[{id:'fL',afterDatasetsDraw(chart){const c3=chart.ctx;chart.data.datasets.forEach((ds,di)=>{const meta=chart.getDatasetMeta(di);if(meta.hidden)return;meta.data.forEach((bar,idx)=>{const val=ds.data[idx];if(!val)return;const bH=bar.base-bar.y;const txt=val>=1000?(val/1000).toFixed(1)+'k':String(val);c3.save();if(bH>28){c3.translate(bar.x,bar.y+bH/2);c3.rotate(-Math.PI/2);c3.font=`700 7px 'IBM Plex Mono',monospace`;c3.textAlign='center';c3.textBaseline='middle';c3.fillStyle='rgba(255,255,255,0.92)';c3.fillText(txt,0,0);}else if(bH>14){c3.font=`700 7px 'IBM Plex Mono',monospace`;c3.textAlign='center';c3.textBaseline='bottom';c3.fillStyle='#0c2461';c3.fillText(txt,bar.x,bar.y-2);}c3.restore();});});}}]});
}
function setFccFactory(f,btn){fccFactory=f;document.querySelectorAll('#fcc-factory-tabs .ttab').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');renderFactoryChart();}

// ═══ OVERVIEW RECYCLE CHART ═══
function renderOvRcChart(){
  const labels=getLabels('ovrc');
  const badge=document.getElementById('ov-rc-badge');
  if(badge)badge.innerHTML=getSubLabel('ovrc');
  const cols={dpl1:'#1558b0',dpl2:'#7c3aed',uril:'#0a9e8a'};
  const names={dpl1:'DPL 1',dpl2:'DPL 2',uril:'URIL'};
  const bases={dpl1:monthly,dpl2:monthly2,uril:monthlyU};
  const keys=ovRcFactory==='all'?['dpl1','dpl2','uril']:[ovRcFactory];
  // share the ovrc filter state across factory subkeys
  const ovrcState=getfs('ovrc');
  const datasets=keys.map(k=>{
    const c=cols[k];
    const tempId='ovrc_'+k;
    fs[tempId]={...ovrcState};
    const data=genRc(bases[k],tempId);
    return{label:names[k],data,backgroundColor:c+'bb',borderColor:c,borderWidth:1.5,borderRadius:4,borderSkipped:false};
  });
  const leg=document.getElementById('ov-rc-leg');
  if(leg)leg.innerHTML=keys.map(k=>`<div class="leg"><div class="leg-dot" style="background:${cols[k]}"></div>${names[k]}</div>`).join('');
  dc('ovRcChart');
  const canvas=document.getElementById('ovRcChart');if(!canvas)return;
  const{grid,tick}=gc();
  charts['ovRcChart']=new Chart(canvas,{type:'bar',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},animation:{duration:380},plugins:{legend:{display:false},tooltip:{...TT,callbacks:{title:i=>'  '+i[0].label,label:c=>`  ${c.dataset.label}: ${c.parsed.y.toFixed(1)}%`}}},scales:{x:{grid:{display:false},ticks:{color:'#8898aa',font:{size:7.5},maxRotation:50,autoSkip:labels.length>16},border:{display:false}},y:{grid:{color:grid},beginAtZero:true,suggestedMax:25,ticks:{color:tick,font:{size:9.5},callback:v=>v+'%'},border:{display:false}}}},plugins:[{id:'rL',afterDatasetsDraw(chart){const c3=chart.ctx;chart.data.datasets.forEach((ds,di)=>{const meta=chart.getDatasetMeta(di);if(meta.hidden)return;meta.data.forEach((bar,idx)=>{const val=ds.data[idx];if(!val)return;const bH=bar.base-bar.y;const txt=val.toFixed(1)+'%';c3.save();if(bH>28){c3.translate(bar.x,bar.y+bH/2);c3.rotate(-Math.PI/2);c3.font=`700 7px 'IBM Plex Mono',monospace`;c3.textAlign='center';c3.textBaseline='middle';c3.fillStyle='rgba(255,255,255,0.92)';c3.fillText(txt,0,0);}else if(bH>14){c3.font=`700 7px 'IBM Plex Mono',monospace`;c3.textAlign='center';c3.textBaseline='bottom';c3.fillStyle='#0c2461';c3.fillText(txt,bar.x,bar.y-2);}c3.restore();});});}}]});
}
function setOvRcFactory(f,btn){ovRcFactory=f;document.querySelectorAll('#ov-rc-factory-tabs .ttab').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');renderOvRcChart();}

// ═══ KPI CARDS ═══
function sparkline(arr,color){const max=Math.max(...arr),min=Math.min(...arr),pts=arr.map((v,i)=>`${i*(100/(arr.length-1))},${22-((v-min)/(max-min||1))*18}`).join(' ');return`<div class="kpi-spark"><svg viewBox="0 0 100 24" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;}
function scaleArr(arr){let m=activePeriod==='td'?.18:activePeriod==='mtd'?frac:1;if(globalFilter.from&&globalFilter.to){const d=Math.max(1,(new Date(globalFilter.to)-new Date(globalFilter.from))/86400000+1);m=Math.min(1,d/365);}return arr.map(v=>Math.max(0,Math.round(v*m)));}
function getVal(arr){if(globalFilter.from&&globalFilter.to)return scaleArr(arr).reduce((s,v)=>s+v,0);if(activePeriod==='ytd')return arr.reduce((s,v)=>s+v,0);if(activePeriod==='mtd')return Math.round(arr[cm]*frac);return Math.round(arr[cm]*.18);}
function makeRcCard(fwtArr,rcArr){
  const pct=getVal(fwtArr)>0?getVal(rcArr)/getVal(fwtArr)*100:0;
  const cf=fwtArr[cm],cr=rcArr[cm],pf=fwtArr[Math.max(cm-1,0)],pr=rcArr[Math.max(cm-1,0)];
  const dp=(cf>0?cr/cf*100:0)-(pf>0?pr/pf*100:0);
  const tc=dp>0?'up':dp<0?'dn':'neu',ts=dp>0?`&#9650; +${Math.abs(dp).toFixed(1)}%`:dp<0?`&#9660; ${Math.abs(dp).toFixed(1)}%`:'&ndash;';
  const pd={td:'Till Today',mtd:'MTD',ytd:'YTD'};
  return`<div class="kpi-card" style="--kline:#34d399"><div class="kpi-top"><div class="kpi-icon">&#128202;</div><span class="kpi-badge">Rate</span></div><div class="kpi-lbl">Recycle Rate</div><div class="kpi-val">${pct.toFixed(1)}<span class="kpi-unit">%</span></div><div class="kpi-sep"></div><div class="kpi-foot"><span class="kpi-trend ${tc}">${ts}</span><span class="kpi-period">${pd[activePeriod]}</span></div></div>`;
}
function renderKPIsFor(elId,arr){
  const el=document.getElementById(elId);if(!el)return;
  const pd={td:'Till Today',mtd:'MTD',ytd:'YTD'};
  el.innerHTML=['freshWaterTank','withdraw','recycle','discharge'].map(k=>{
    const m=kpiMeta[k],v=getVal(arr[k]);
    const curr=arr[k][cm],prev=arr[k][Math.max(cm-1,0)],diff=curr-prev;
    const tc=diff>0?'up':diff<0?'dn':'neu',ts=diff>0?`&#9650; +${fmt(diff)}`:diff<0?`&#9660; ${fmt(Math.abs(diff))}`:'&ndash;';
    const _c=`<div class="kpi-card" style="--kline:${m.line}"><div class="kpi-top"><div class="kpi-icon">${m.icon}</div><span class="kpi-badge">${m.tag}</span></div><div class="kpi-lbl">${m.label}</div><div class="kpi-val">${fmt(v)}<span class="kpi-unit">m&#179;</span></div>${sparkline(arr[k],m.line)}<div class="kpi-sep"></div><div class="kpi-foot"><span class="kpi-trend ${tc}">${ts}</span><span class="kpi-period">${pd[activePeriod]}</span></div></div>`;
    return k==='recycle'?_c+makeRcCard(arr.freshWaterTank,arr.recycle):_c;
  }).join('');
}
function renderKPIs(){renderKPIsFor('dpl1-kpi',monthly);}
function renderKPIs2(){renderKPIsFor('dpl2-kpi',monthly2);}
function renderKPIsU(){renderKPIsFor('uril-kpi',monthlyU);}

// ═══ OVERVIEW FACTORY CARDS ═══
function updateOverviewCards(p){
  const pLabel={td:'Till Today',mtd:'Month to Date',ytd:'Year to Date'};
  const maxIn={dpl1:9688,dpl2:8420,uril:3240};
  function getV(arr){if(p==='ytd')return arr.reduce((a,b)=>a+b,0);if(p==='mtd')return Math.round(arr[cm]*frac);return Math.round(arr[arr.length-1]*.18);}
  [{k:'dpl1',inArr:factoryData.dpl1.monthly,outArr:factoryData.dpl1.out},{k:'dpl2',inArr:factoryData.dpl2.monthly,outArr:factoryData.dpl2.out},{k:'uril',inArr:factoryData.uril.monthly,outArr:factoryData.uril.out}].forEach(({k,inArr,outArr})=>{
    const inV=getV(inArr),outV=getV(outArr);
    const el=id=>document.getElementById(id);
    if(el('fvn-'+k))el('fvn-'+k).textContent=fmt(inV);
    if(el('fin-'+k))el('fin-'+k).textContent=fmt(inV);
    if(el('fout-'+k))el('fout-'+k).textContent=fmt(outV);
    if(el('fl-'+k))el('fl-'+k).textContent=pLabel[p]+' \u00b7 Water Usage';
    const inPct=Math.min(Math.round(inV/maxIn[k]*100),100);
    const outPct=inV>0?Math.min(Math.round(outV/inV*100),100):0;
    const inBar=document.getElementById('fin-bar-'+k);
    if(inBar)inBar.style.width=inPct+'%';
    if(el('fob-'+k))el('fob-'+k).style.width=outPct+'%';
  });
}

// ═══ GLOBAL FILTER ═══
function applyGlobalFilter(){globalFilter.from=document.getElementById('from-date')?.value||null;globalFilter.to=document.getElementById('to-date')?.value||null;renderKPIs();renderKPIs2();renderKPIsU();updateOverviewCards(activePeriod);touch();}
function resetGlobalFilter(){globalFilter={from:null,to:null};['from-date','to-date'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});renderKPIs();renderKPIs2();renderKPIsU();updateOverviewCards(activePeriod);touch();}

// ═══ PERIOD ═══
function setPeriod(p,btn){
  activePeriod=p;
  document.querySelectorAll('.pbtn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  const a=document.querySelector('.view.active');
  if(!a){renderLive(true);touch();return;}
  if(a.id==='view-dpl1'){renderKPIs();renderBccChart();renderRcChart();}
  else if(a.id==='view-dpl2'){renderKPIs2();renderBccChart2();renderRcChart2();}
  else if(a.id==='view-uril'){renderKPIsU();renderBccChartU();renderRcChartU();}
  else if(a.id==='view-overview'){updateOverviewCards(p);renderFactoryChart();renderOvRcChart();}
  renderLive(true);touch();
}

// ═══ NAVIGATION ═══
function switchView(name,el){
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
  if(el)el.classList.add('active');
  document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
  const target=document.getElementById('view-'+name);
  if(!target)return;
  target.classList.add('active');
  const titles={overview:'Overview',dpl1:'DPL 1',dpl2:'DPL 2',uril:'URIL',review:'Annual Review'};
  const pgEl=document.getElementById('page-title');
  if(pgEl)pgEl.textContent=titles[name]||name;
  const pg=document.querySelector('.period-grp');
  if(pg)pg.style.display=name==='review'?'none':'flex';
  const gf=document.getElementById('global-filter');
  if(gf)gf.style.display=name==='review'?'none':'flex';
  setTimeout(()=>{
    try {
      if(name==='overview'){updateOverviewCards(activePeriod);renderFactoryChart();renderOvRcChart();}
      else if(name==='dpl1'){renderKPIs();renderBccChart();renderRcChart();}
      else if(name==='dpl2'){renderKPIs2();renderBccChart2();renderRcChart2();}
      else if(name==='uril'){renderKPIsU();renderBccChartU();renderRcChartU();}
      else if(name==='review')renderReview();
      touch();
    } catch(e){console.error('switchView render error:',e);}
  },80);
}

// ═══ LIVE ═══
function liveM(){if(activePeriod==='ytd')return 1.85;if(activePeriod==='mtd')return 1.35;return 1;}
function animN(el,v){if(!el)return;const s=parseFloat(el.textContent)||0,t0=performance.now();function step(t){const pp=Math.min((t-t0)/380,1),e=1-Math.pow(1-pp,3);el.textContent=(s+(v-s)*e).toFixed(2);if(pp<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
function setLM(id,v,a=true){const el=document.getElementById(id);if(!el)return;if(a)animN(el,v);else el.textContent=v.toFixed(2);}
function renderLive(a=true){const m=liveM();setLM('live-wpu',liveR.wpu*m,a);setLM('live-dpu',liveR.dpu*m,a);setLM('dpl2-wpu',liveR.wpu2*m,a);setLM('dpl2-dpu',liveR.dpu2*m,a);setLM('uril-wpu',liveR.wpuU*m,a);setLM('uril-dpu',liveR.dpuU*m,a);}
function startLive(){
  renderLive(false);
  setInterval(()=>{
    liveR.wpu=Math.max(8,Math.min(20,liveR.wpu+(Math.random()-.5)*.8));
    liveR.dpu=Math.max(2,Math.min(8,liveR.dpu+(Math.random()-.5)*.4));
    liveR.wpu2=Math.max(7,Math.min(18,liveR.wpu2+(Math.random()-.5)*.8));
    liveR.dpu2=Math.max(1.5,Math.min(7,liveR.dpu2+(Math.random()-.5)*.4));
    liveR.wpuU=Math.max(3,Math.min(8,liveR.wpuU+(Math.random()-.5)*.5));
    liveR.dpuU=Math.max(0.5,Math.min(3,liveR.dpuU+(Math.random()-.5)*.3));
    renderLive(false);
  },2000);
}

// ═══ REVIEW ═══
const revData={dpl1:{name:'DPL 1',color:'#1558b0',accent:'#38b6ff',m:{freshWaterTank:[547,664,770,838,957,1016,994,884,785,957,621,655],withdraw:[580,700,810,880,1000,1060,1040,930,830,1000,660,690],recycle:[99,110,79,111,101,86,70,115,94,147,246,172],discharge:[34,58,96,100,99,98,78,85,74,120,82,69]}},dpl2:{name:'DPL 2',color:'#7c3aed',accent:'#a78bfa',m:{freshWaterTank:[480,560,640,710,820,890,860,780,700,830,550,600],withdraw:[510,590,672,748,860,935,902,820,738,872,580,632],recycle:[80,92,65,94,84,70,58,98,78,124,208,142],discharge:[28,48,82,88,86,84,66,72,62,104,70,58]}},uril:{name:'URIL',color:'#0a9e8a',accent:'#6ee7b7',m:{freshWaterTank:[180,220,280,310,360,400,380,340,300,360,210,100],withdraw:[190,232,295,326,378,420,399,357,315,378,220,105],recycle:[32,38,28,40,36,30,24,42,34,52,88,62],discharge:[12,18,32,36,30,28,24,26,22,38,24,10]}}};
let revPlant='dpl1',revYear=2023;
function setRevPlant(pl,btn){revPlant=pl;document.querySelectorAll('.rev-plant-btn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');renderReview();}
function setRevYear(yr){revYear=parseInt(yr);renderReview();}
function getYD(pl,yr){const base=revData[pl].m;if(yr===2023)return base;const f=1+(yr-2023)*0.07;const r={};Object.keys(base).forEach(k=>{r[k]=base[k].map((v,i)=>Math.round(v*f*(0.96+Math.sin(i*yr*0.1)*0.04)));});return r;}
function downloadRevPdf(){
  const d=revData[revPlant];const m=getYD(revPlant,revYear);
  const tW=m.freshWaterTank.reduce((a,b)=>a+b,0),tR=m.recycle.reduce((a,b)=>a+b,0),tD=m.discharge.reduce((a,b)=>a+b,0),tWd=m.withdraw.reduce((a,b)=>a+b,0);
  const rc=(tW>0?tR/tW*100:0).toFixed(1);
  const rows=months.map((mo,i)=>{const rp=m.freshWaterTank[i]>0?(m.recycle[i]/m.freshWaterTank[i]*100).toFixed(1):'0.0';return`<tr><td>${mo}</td><td>${m.freshWaterTank[i].toLocaleString()}</td><td>${m.withdraw[i].toLocaleString()}</td><td>${m.recycle[i].toLocaleString()}</td><td>${m.discharge[i].toLocaleString()}</td><td>${rp}%</td></tr>`;}).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${d.name} ${revYear}</title><style>body{font-family:Arial,sans-serif;margin:28px;color:#0d1f3c}h1{font-size:19px;color:#0c2461;border-bottom:3px solid #1558b0;padding-bottom:8px}h2{font-size:14px;color:#1558b0;margin-top:18px}.kg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}.k{background:#f0f6ff;border-radius:7px;padding:11px;border-left:4px solid #1558b0;text-align:center}.kv{font-size:19px;font-weight:700;color:#0c2461}.kl{font-size:10px;color:#6b7280;margin-top:3px}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:11px}th{background:#0c2461;color:#fff;padding:6px 9px;text-align:left}td{padding:5px 9px;border-bottom:1px solid #e5e7eb}.ft{margin-top:22px;font-size:9px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:8px}</style></head><body><h1>&#128167; ${d.name} &ndash; Annual Water Report ${revYear}</h1><p style="color:#6b7280;font-size:11px">${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} &middot; Dawlance WMS</p><h2>Annual KPIs</h2><div class="kg"><div class="k"><div class="kv">${fmt(tW)} m&#179;</div><div class="kl">Fresh Water Tank</div></div><div class="k"><div class="kv">${fmt(tWd)} m&#179;</div><div class="kl">Withdraw</div></div><div class="k" style="border-color:#10b981"><div class="kv" style="color:#059669">${fmt(tR)} m&#179;</div><div class="kl">Recycle (${rc}%)</div></div><div class="k" style="border-color:#d97706"><div class="kv" style="color:#d97706">${fmt(tD)} m&#179;</div><div class="kl">Discharge</div></div></div><h2>Monthly Breakdown</h2><table><thead><tr><th>Month</th><th>FWT</th><th>Withdraw</th><th>Recycle</th><th>Discharge</th><th>Rc%</th></tr></thead><tbody>${rows}<tr style="background:#f0f6ff;font-weight:700"><td>TOTAL</td><td>${tW.toLocaleString()}</td><td>${tWd.toLocaleString()}</td><td>${tR.toLocaleString()}</td><td>${tD.toLocaleString()}</td><td>${rc}%</td></tr></tbody></table><div class="ft">Dawlance WMS &middot; ${d.name} &middot; ${revYear}</div></body></html>`;
  const win=window.open('','_blank');
  if(!win){alert('Please allow popups to download the PDF');return;}
  win.document.write(html);win.document.close();
  setTimeout(()=>{win.focus();win.print();},500);
}
function renderReview(){
  const d=revData[revPlant];const m=getYD(revPlant,revYear);const{grid,tick}=gc();
  const tW=m.freshWaterTank.reduce((a,b)=>a+b,0),tR=m.recycle.reduce((a,b)=>a+b,0),tD=m.discharge.reduce((a,b)=>a+b,0),tWd=m.withdraw.reduce((a,b)=>a+b,0);
  const rcPct=tW>0?(tR/tW*100).toFixed(1)+'%':'0%',rc=tW>0?(tR/tW*100).toFixed(1):'0';
  const kHtml=[{icon:'&#128167;',tag:'Annual',lbl:'Fresh Water Tank',val:fmt(tW),unit:'m&#179;',l:'#38b6ff'},{icon:'&#128260;',tag:'Annual',lbl:'Withdraw',val:fmt(tWd),unit:'m&#179;',l:d.accent},{icon:'&#9851;&#65039;',tag:'Recovered',lbl:'Recycle',val:fmt(tR),unit:'m&#179;',l:'#6ee7b7'},{icon:'&#128202;',tag:'Rate',lbl:'Recycle Rate',val:rc,unit:'%',l:'#34d399'},{icon:'&#11015;&#65039;',tag:'Disposed',lbl:'Discharge',val:fmt(tD),unit:'m&#179;',l:'#fbbf24'}].map(k=>`<div class="kpi-card" style="--kline:${k.l}"><div class="kpi-top"><div class="kpi-icon">${k.icon}</div><span class="kpi-badge">${k.tag}</span></div><div class="kpi-lbl">${k.lbl}</div><div class="kpi-val">${k.val}<span class="kpi-unit">${k.unit}</span></div><div class="kpi-sep"></div><div class="kpi-foot"><span class="kpi-trend neu">Annual</span><span class="kpi-period">${revYear}</span></div></div>`).join('');
  const tHtml=months.map((mo,i)=>{const rp=m.freshWaterTank[i]>0?(m.recycle[i]/m.freshWaterTank[i]*100).toFixed(1):'0.0';return`<tr><td class="td-b">${mo}</td><td>${m.freshWaterTank[i].toLocaleString()}</td><td>${m.withdraw[i].toLocaleString()}</td><td style="color:#059669;font-weight:600">${m.recycle[i].toLocaleString()}</td><td style="color:#d97706;font-weight:600">${m.discharge[i].toLocaleString()}</td><td style="color:#6366f1;font-weight:600">${rp}%</td></tr>`;}).join('')+`<tr style="background:#f5f8ff"><td class="td-b">TOTAL</td><td style="color:#1558b0;font-weight:700">${tW.toLocaleString()}</td><td style="color:#7c3aed;font-weight:700">${tWd.toLocaleString()}</td><td style="color:#059669;font-weight:700">${tR.toLocaleString()}</td><td style="color:#d97706;font-weight:700">${tD.toLocaleString()}</td><td style="color:#6366f1;font-weight:700">${rcPct}</td></tr>`;
  const peakMo=months[m.freshWaterTank.indexOf(Math.max(...m.freshWaterTank))];
  const bestRcI=m.recycle.indexOf(Math.max(...m.recycle));
  const bestRcPct=m.freshWaterTank[bestRcI]>0?(m.recycle[bestRcI]/m.freshWaterTank[bestRcI]*100).toFixed(1):'0';
  const maxDisMo=months[m.discharge.indexOf(Math.max(...m.discharge))];
  const minMo=months[m.freshWaterTank.indexOf(Math.min(...m.freshWaterTank))];
  const insights=[{bg:'rgba(21,88,176,0.09)',s:'#1558b0',t:`<strong>Peak in ${peakMo}</strong> &ndash; ${fmt(Math.max(...m.freshWaterTank))} m&#179; intake, highest of ${revYear}.`},{bg:'rgba(16,185,129,0.09)',s:'#059669',t:`<strong>Best recycle in ${months[bestRcI]}</strong> &ndash; ${fmt(m.recycle[bestRcI])} m&#179; at ${bestRcPct}% efficiency.`},{bg:'rgba(245,158,11,0.09)',s:'#d97706',t:`<strong>${maxDisMo} highest discharge</strong> &ndash; ${fmt(Math.max(...m.discharge))} m&#179; via WWTP.`},{bg:'rgba(239,68,68,0.07)',s:'#dc2626',t:`<strong>${minMo} lowest intake</strong> &ndash; dropped to ${fmt(Math.min(...m.freshWaterTank))} m&#179;.`},{bg:'rgba(99,102,241,0.07)',s:'#6366f1',t:`<strong>${rc}% overall recycle rate</strong> &ndash; ${revYear===2023?'target 20% for 2024':revYear<2026?'improving year on year':'exceeding targets'}.`}].map(ins=>`<div class="ins"><div class="ins-ic" style="background:${ins.bg}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${ins.s}" stroke-width="2.2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg></div><div class="ins-txt">${ins.t}</div></div>`).join('');
  const el=document.getElementById('rev-content');if(!el)return;
  el.innerHTML=`<div style="display:flex;flex-direction:column;gap:15px;animation:fadeUp .28s ease"><div class="kpi-grid">${kHtml}</div><div class="rev-grid"><div class="rev-card"><div class="rev-card-title">Monthly Breakdown <span class="rbadge rbadge-ok">${d.name} &middot; ${revYear}</span></div><div style="overflow:auto;max-height:270px"><table class="sum-tbl"><thead><tr><th>Month</th><th>FWT m&#179;</th><th>Withdraw</th><th>Recycle</th><th>Discharge</th><th>Rc%</th></tr></thead><tbody>${tHtml}</tbody></table></div></div><div class="rev-card"><div class="rev-card-title">Key Insights <span class="rbadge rbadge-warn">${d.name} &middot; ${revYear}</span></div><div class="insights">${insights}</div></div></div><div class="rev-chart-card"><div style="font-family:'Rajdhani',sans-serif;font-size:.9rem;font-weight:700;color:#0c2461;margin-bottom:12px">Full Year Flow &ndash; ${d.name} <span class="rbadge" style="background:rgba(21,88,176,0.07);color:#1558b0;border:1px solid rgba(21,88,176,0.17);margin-left:6px">All Metrics &middot; ${revYear}</span></div><div style="position:relative;height:210px"><canvas id="revChart"></canvas></div><div class="chart-legend" style="margin-top:10px"><div class="leg"><div class="leg-dot" style="background:${d.color}"></div>Fresh Water Tank</div><div class="leg"><div class="leg-dot" style="background:${d.accent}"></div>Withdraw</div><div class="leg"><div class="leg-dot" style="background:#10b981"></div>Recycle</div><div class="leg"><div class="leg-dot" style="background:#f59e0b"></div>Discharge</div></div></div></div>`;
  dc('revChart');
  const canvas=document.getElementById('revChart');if(!canvas)return;
  charts['revChart']=new Chart(canvas,{type:'line',data:{labels:months,datasets:[{label:'Fresh Water Tank',data:m.freshWaterTank,borderColor:d.color,backgroundColor:d.color+'12',fill:true,borderWidth:2.5,pointRadius:4,pointBackgroundColor:'#fff',pointBorderColor:d.color,tension:0.35},{label:'Withdraw',data:m.withdraw,borderColor:d.accent,fill:false,borderWidth:2,pointRadius:3,pointBackgroundColor:'#fff',pointBorderColor:d.accent,tension:0.35,borderDash:[5,3]},{label:'Recycle',data:m.recycle,borderColor:'#10b981',fill:false,borderWidth:2,pointRadius:3,pointBackgroundColor:'#fff',pointBorderColor:'#10b981',tension:0.35,borderDash:[3,4]},{label:'Discharge',data:m.discharge,borderColor:'#f59e0b',fill:false,borderWidth:2,pointRadius:3,pointBackgroundColor:'#fff',pointBorderColor:'#f59e0b',tension:0.35,borderDash:[2,5]}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{...TT,callbacks:{title:i=>'  '+i[0].label,label:c=>'  '+c.dataset.label+': '+c.parsed.y.toLocaleString()+' m\u00b3'}}},scales:{x:{grid:{display:false},ticks:{color:tick,font:{size:9.5}},border:{display:false}},y:{grid:{color:grid},beginAtZero:true,ticks:{color:tick,font:{size:9.5},callback:v=>v.toLocaleString()},border:{display:false}}}}});
}

// ═══ INIT ═══
window.addEventListener('resize',()=>{Object.values(charts).forEach(c=>{try{c.resize();}catch(e){}});});

function init(){
  // Init filter states
  fs['rc1']={p:'monthly',w:'',mo:'',yr:''};
  fs['rc2']={p:'monthly',w:'',mo:'',yr:''};
  fs['rcU']={p:'monthly',w:'',mo:'',yr:''};
  fs['ovrc']={p:'monthly',w:'',mo:'',yr:''};
  fs['bcc']={p:'daily',w:'',mo:'',yr:''};
  fs['bcc2']={p:'daily',w:'',mo:'',yr:''};
  fs['bccU']={p:'daily',w:'',mo:'',yr:''};
  fs['fcc']={p:'daily',w:'',mo:'',yr:''};

  if(typeof Chart==='undefined'){
    console.error('Chart.js not loaded yet, retrying...');
    setTimeout(init,200);
    return;
  }

  try{
    updateOverviewCards(activePeriod);
    renderFactoryChart();
    renderOvRcChart();
    renderLive(false);
    startLive();
    touch();
    setInterval(()=>{const e=document.getElementById('clock');if(e)e.textContent=new Date().toLocaleTimeString('en-US',{hour12:false});},1000);
    // Set initial clock immediately
    const e=document.getElementById('clock');if(e)e.textContent=new Date().toLocaleTimeString('en-US',{hour12:false});
  } catch(err){
    console.error('Init error:',err);
  }
}

// Wait for DOM and Chart.js
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
} else {
  init();
}
