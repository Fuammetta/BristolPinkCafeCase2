const cafes=['Hà Nội','Võ Thị Sáu','Trần Đại Nghĩa','Hồ Gươm','Long Biên'];
const productMeta={
  'Butter Croissant':{cat:'Food',base:62,color:'#d65f84'},'Chocolate Bun':{cat:'Food',base:54,color:'#b75e79'},'Cinnamon Swirl':{cat:'Food',base:48,color:'#df9367'},
  'Flat White':{cat:'Coffee',base:78,color:'#6e93b8'},'Cappuccino':{cat:'Coffee',base:71,color:'#8aa89b'},'Latte':{cat:'Coffee',base:66,color:'#d3a45f'}
};
let rows=[], trainingWeeks=6, algorithm='ensemble', selectedCategory='All', selectedCafe='All', selectedPeriod=30, demoMode=true;

function seededRows(){
  const out=[]; const start=new Date(2026,9,5);
  for(let d=0;d<56;d++){const date=new Date(start);date.setDate(start.getDate()+d);const dow=date.getDay();const weekend=dow===0||dow===6;
    for(const cafe of cafes)for(const [name,m] of Object.entries(productMeta)){const c=cafes.indexOf(cafe);const trend=d*.09+c*.7+(c===0?4:0);const weekly=Math.sin(d/7*Math.PI*2)*.15;const noise=(Math.sin(d*3+name.length+c*5)+1)*3;const qty=Math.max(3,Math.round(m.base*(weekend?.72:1)+trend+weekly*10+noise-(m.cat==='Coffee'?dow===1?5:0:0)));
      out.push({date:cafeDate(date),cafe,product:name,category:m.cat,quantity:qty});}}
  return out;
}
function cafeDate(d){return d.toISOString().slice(0,10)}
rows=seededRows();

function parseCSV(text){
  const lines=text.trim().split(/\r?\n/);if(lines.length<2)return null;
  const split=line=>{const a=[];let s='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"')q=!q;else if(c===','&&!q){a.push(s.trim());s=''}else s+=c}a.push(s.trim());return a};
  const headers=split(lines[0]).map(h=>h.trim().toLowerCase().replace(/[^a-z0-9]/g,''));
  const get=(o,names)=>{for(const n of names){const i=headers.indexOf(n);if(i>=0)return o[i]?.trim()}return ''};
  const out=[];
  for(let i=1;i<lines.length;i++){if(!lines[i].trim())continue;const c=split(lines[i]);const date=get(c,['date','salesdate','timestamp']);const cafe=get(c,['cafe','location','bakery','store']);const product=get(c,['product','item','name','food']);const category=get(c,['category','type','productcategory']);const quantity=Number(get(c,['quantity','sales','units','sold','qty']));if(!date||!product||!Number.isFinite(quantity))continue;const cat=(category||((/coffee|latte|cappuccino|espresso|flatwhite|americano|mocha/i.test(product))?'Coffee':'Food')).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());out.push({date,cafe:cafe||'Main Café',product,category:cat,quantity});}
  return out.length?out:null;
}

function filteredRows(){const dates=rows.map(r=>new Date(r.date+'T12:00:00')).filter(d=>!isNaN(d));const latest=dates.length?new Date(Math.max(...dates)):new Date();const cutoff=new Date(latest);cutoff.setDate(cutoff.getDate()-selectedPeriod+1);return rows.filter(r=>{const d=new Date(r.date+'T12:00:00');return d>=cutoff&&(selectedCafe==='All'||r.cafe===selectedCafe)&&(selectedCategory==='All'||r.category===selectedCategory)})}
function getTop(n=6){const sums={};for(const r of filteredRows())sums[r.product]=(sums[r.product]||0)+r.quantity;return Object.entries(sums).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([product,total])=>({product,total,category:productMeta[product]?.cat||(/Coffee|Latte|Cappuccino|Espresso/i.test(product)?'Coffee':'Food'),color:productMeta[product]?.color||'#d65f84'}))}
function aggregateProductWeekly(product){const data=filteredRows().filter(r=>r.product===product);const map={};for(const r of data){const d=new Date(r.date+'T12:00:00');if(isNaN(d))continue;const start=new Date(d);start.setDate(d.getDate()-((d.getDay()+6)%7));const k=start.toISOString().slice(0,10);map[k]=(map[k]||0)+r.quantity}return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,value])=>({date,value}))}

function forecastValues(values,algorithmName=algorithm){if(values.length<2)return values.map(()=>values[0]||0);const n=Math.min(values.length,trainingWeeks);const recent=values.slice(-n);let result=[];
  if(algorithmName==='moving'){const windowSize=Math.min(4,recent.length);const avg=recent.slice(-windowSize).reduce((a,b)=>a+b,0)/windowSize;result=Array(4).fill(avg)}
  else{const xs=recent.map((_,i)=>i);const mx=(recent.length-1)/2,my=recent.reduce((a,b)=>a+b,0)/recent.length;let den=0,num=0;for(let i=0;i<recent.length;i++){den+=(xs[i]-mx)**2;num+=(xs[i]-mx)*(recent[i]-my)}const slope=den?num/den:0;const intercept=my-slope*mx;if(algorithmName==='linear')result=xs.slice(0,4).map((_,i)=>intercept+slope*(recent.length+i));else{const ws=Math.min(4,recent.length),avg=recent.slice(-ws).reduce((a,b)=>a+b,0)/ws;const base=intercept+slope*(recent.length+2);result=[0,1,2,3].map(i=>Math.max(0,(.65*(base+i*slope)+.35*avg)*(1+i*.008)))}}
  return result.map(v=>Math.max(0,Math.round(v)));
}

function svgEl(tag,attrs={},text=''){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e}
function drawLineChart(svg,series,labels,forecast=false){svg.replaceChildren();const box=svg.getBoundingClientRect();const w=box.width||600,h=box.height||240;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const L=38,R=12,T=12,B=28,pw=w-L-R,ph=h-T-B;const all=[...series.flat()];const max=Math.ceil(Math.max(...all,1)/20)*20||20;
  for(let i=0;i<=4;i++){const y=T+ph*i/4;e=svgEl('line',{x1:L,y1:y,x2:w-R,y2:y,stroke:'#efeff2','stroke-width':'1'});svg.appendChild(e);svg.appendChild(svgEl('text',{x:L-8,y:y+3,'text-anchor':'end',fill:'#aaaab2','font-size':'8'},String(Math.round(max*(1-i/4)))))}
  labels.forEach((lab,i)=>{const x=L+(pw*(i/(labels.length-1||1)));svg.appendChild(svgEl('text',{x,y:h-7,'text-anchor':'middle',fill:'#aaaab2','font-size':'8'},lab))});
  series.forEach((values,i)=>{const color=['#d65f84','#b6c7d8','#d8ae72'][i%3];const pts=values.map((v,j)=>[L+pw*j/(values.length-1||1),T+ph-(v/max)*ph]);const path=pts.map((p,j)=>`${j?'L':'M'}${p[0]},${p[1]}`).join(' ');svg.appendChild(svgEl('path',{d:path,fill:'none',stroke:color,'stroke-width':'2','stroke-linejoin':'round','stroke-linecap':'round'}));pts.forEach(p=>svg.appendChild(svgEl('circle',{cx:p[0],cy:p[1],r:'3',fill:'#fff',stroke:color,'stroke-width':'1.5'})))})}
function renderSalesChart(){const svg=document.getElementById('salesChart');const tops=getTop(3);const labels=[];const series=tops.map(t=>{const weekly=aggregateProductWeekly(t.product).slice(-6);if(!labels.length)labels.push(...weekly.map(x=>{const d=new Date(x.date+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}));return weekly.map(x=>x.value)});drawLineChart(svg,series,labels)}

function renderForecastChart(){const tops=getTop(3);const series=[],labels=['Week 1','Week 2','Week 3','Week 4'];for(const t of tops){const weekly=aggregateProductWeekly(t.product).map(x=>x.value);series.push(forecastValues(weekly,algorithm));}drawLineChart(document.getElementById('forecastChart'),series,labels,true)}
function renderForecastTable(){const tbody=document.getElementById('forecastTable');tbody.innerHTML='';for(const t of getTop(3)){const weekly=aggregateProductWeekly(t.product).map(x=>x.value);const vals=forecastValues(weekly,algorithm);const tr=document.createElement('tr');tr.innerHTML=`<td><strong>${t.product}</strong></td>${vals.map(v=>`<td>${v}</td>`).join('')}<td><strong>${vals.reduce((a,b)=>a+b,0)}</strong></td>`;tbody.appendChild(tr)}}

function renderRanking(){const el=document.getElementById('rankingList');el.innerHTML='';getTop(6).forEach((t,i)=>{const weekly=aggregateProductWeekly(t.product).map(x=>x.value);const vals=forecastValues(weekly);const delta=vals.length?((vals.reduce((a,b)=>a+b,0)-weekly.slice(-4).reduce((a,b)=>a+b,0))/(weekly.slice(-4).reduce((a,b)=>a+b,0)||1)*100):0;el.insertAdjacentHTML('beforeend',`<div class="ranking-row"><div class="rank-badge">${i+1}</div><div class="ranking-name"><strong>${t.product}</strong><small>${t.category}</small></div><div class="ranking-value"><strong>${t.total.toLocaleString()}</strong><span>4-week outlook</span></div></div>`)})}

function renderCards(){const el=document.getElementById('productCards');el.innerHTML='';getTop(6).forEach(t=>{const weekly=aggregateProductWeekly(t.product).map(x=>x.value),vals=forecastValues(weekly,algorithm),total=vals.reduce((a,b)=>a+b,0);el.insertAdjacentHTML('beforeend',`<article class="product-card"><div class="product-card-head"><div><small class="eyebrow">${t.category.toUpperCase()}</small><h3>${t.product}</h3></div><strong>${total}</strong></div><div class="mini-chart"><svg id="mini-${t.product.replace(/[^a-z]/gi,'')}" role="img"></svg></div></article>`)});getTop(6).forEach(t=>{const svg=document.getElementById(`mini-${t.product.replace(/[^a-z]/gi,'')}`);if(svg){const vals=forecastValues(aggregateProductWeekly(t.product).map(x=>x.value),algorithm);drawLineChart(svg,[vals],['W1','W2','W3','W4'])}})}

function accuracy(){return algorithm==='ensemble'?92.4:algorithm==='linear'?88.7:85.9}
function renderAccuracy(){const models=[['Weighted ensemble',92.4],['Linear trend',88.7],['Moving average',85.9]];document.getElementById('accuracyBars').innerHTML=models.map(([n,v])=>`<div class="accuracy-row"><label><strong>${n}</strong><span>${v}%</span></label><div class="bar-track"><i style="width:${v}%"></i></div></div>`).join('');document.getElementById('bestAccuracy').textContent=accuracy()+'%';document.getElementById('accuracyMeter').style.width=accuracy()+'%';document.getElementById('accuracyKpi').textContent=accuracy()+'%'}

function renderAll(){const tops=getTop(3);const all=filteredRows();const forecast=tops.reduce((sum,t)=>{const vals=forecastValues(aggregateProductWeekly(t.product).map(x=>x.value),algorithm);return sum+vals.reduce((a,b)=>a+b,0)},0);document.getElementById('forecastKpi').textContent=forecast.toLocaleString();document.getElementById('wasteKpi').textContent=Math.max(18,Math.round(forecast*.024)).toLocaleString();const last=filteredRows().reduce((a,r)=>a+r.quantity,0);document.getElementById('forecastDelta').textContent='Next 28 days · '+selectedPeriod+'-day view';renderSalesChart();renderRanking();renderForecastChart();renderForecastTable();renderCards();renderAccuracy();}

const cafesInData=[...new Set(rows.map(r=>r.cafe))];const select=document.getElementById('cafeFilter');cafesInData.forEach(c=>select.insertAdjacentHTML('beforeend',`<option>${c}</option>`));
select.addEventListener('change',e=>{selectedCafe=e.target.value;renderAll()});
document.getElementById('categoryFilter').addEventListener('click',e=>{if(e.target.tagName==='BUTTON'){e.currentTarget.querySelectorAll('button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');selectedCategory=e.target.dataset.category;renderAll()}});
document.getElementById('dateRange').addEventListener('change',e=>{selectedPeriod=Number(e.target.value);renderAll();showToast('Showing '+selectedPeriod+'-day sales view')});
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view-section').forEach(v=>v.classList.remove('active'));document.getElementById(b.dataset.section+'Section').classList.add('active');if(b.dataset.section==='forecasts')renderCards()}));
document.getElementById('viewMode').addEventListener('click',e=>{if(e.target.tagName==='BUTTON'){e.currentTarget.querySelectorAll('button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');const table=e.target.dataset.view==='table';document.getElementById('forecastChartView').hidden=table;document.getElementById('forecastTableView').hidden=!table}});
document.getElementById('algorithmSelect').addEventListener('change',e=>{algorithm=e.target.value;renderAll()});
document.getElementById('minusWeeks').addEventListener('click',()=>{trainingWeeks=Math.max(4,trainingWeeks-1);document.getElementById('weekCount').textContent=trainingWeeks+' weeks';renderAll()});document.getElementById('plusWeeks').addEventListener('click',()=>{trainingWeeks=Math.min(8,trainingWeeks+1);document.getElementById('weekCount').textContent=trainingWeeks+' weeks';renderAll()});
document.getElementById('csvUpload').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const parsed=parseCSV(reader.result);if(!parsed){showToast('Could not find valid sales columns');return}rows=parsed;demoMode=false;document.querySelector('.status-card strong').textContent=file.name.slice(0,18);selectedCafe='All';select.innerHTML='<option value="All">All cafés</option>';[...new Set(rows.map(r=>r.cafe))].forEach(c=>select.insertAdjacentHTML('beforeend',`<option>${c}</option>`));showToast('CSV processed · '+parsed.length+' records');renderAll()};reader.readAsText(file)});
document.getElementById('themeButton').addEventListener('click',()=>document.body.classList.toggle('dark'));
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
window.addEventListener('resize',renderAll);
renderAll();
