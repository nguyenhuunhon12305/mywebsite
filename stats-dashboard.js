/* Thống kê thực tế khi apiBase được cấu hình. Không bao giờ sử dụng số liệu giả lập. */
(()=>{
  'use strict';
  const cfg=window.NHN_ANALYTICS_CONFIG || {};
  const api=String(cfg.apiBase||'').replace(/\/$/,'');
  const enabled=/^https:\/\//.test(api);
  const $=selector=>document.querySelector(selector);
  const fmt=n=>new Intl.NumberFormat('vi-VN').format(n);
  const names=[['tai-lieu.html','Tài liệu'],['index.html','Trang chủ'],['gioi-thieu.html','Giới thiệu'],['du-an.html','Dự án'],['lien-he.html','Liên hệ'],['thong-ke.html','Thống kê']];
  let period=7,chartType='views',data=null;
  const setStatus=(label,connected=false)=>{const el=$('#stats-connection');el.lastChild.textContent=label;el.classList.toggle('connected',connected);};
  const setValue=(id,v)=>{$(id).textContent=v===null||v===undefined?'—':fmt(v);};
  const dayLabel=(offset)=>{let d=new Date();d.setDate(d.getDate()-offset);return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;};
  const setSelected=(items,chosen)=>items.forEach(el=>{const current=el===chosen;el.classList.toggle('active',current);el.setAttribute('aria-pressed',String(current));});
  function renderPopular(){
    const pages=data?.pages||[];
    const map=new Map(pages.map(p=>[p.path,Number(p.views)||0]));
    const rows=names.map(([path,name])=>({path,name,value:map.get(path)??(data?0:null)}));
    if(data) rows.sort((a,b)=>b.value-a.value);
    const max=Math.max(0,...rows.map(r=>r.value||0));
    $('#stats-popular-list').innerHTML=rows.slice(0,5).map((r,i)=>
      `<div class="stats-popular-row"><div class="stats-popular-name"><span>${String(i+1).padStart(2,'0')} · ${r.name}</span><span class="stats-popular-value">${r.value===null?'—':fmt(r.value)}</span></div><div class="stats-track" role="progressbar" aria-label="${r.name}" aria-valuemin="0" aria-valuemax="${max||1}" aria-valuenow="${r.value||0}"><div class="stats-bar" style="width:${max?(100*(r.value||0)/max).toFixed(1):0}%"></div></div></div>`
    ).join('');
  }
  function drawChart(){
    const svg=$('#stats-trend-chart');
    $('#stats-chart-legend').textContent=chartType==='views'?'Lượt xem trang':'Khách riêng';
    $('#stats-chart-range').textContent=`${period} ngày gần đây`;
    const days=data?.daily||[];
    if(!days.length){svg.innerHTML='';$('#stats-chart-empty').hidden=false;return;}
    $('#stats-chart-empty').hidden=true;
    const values=days.map(d=>Math.max(0,Number(d[chartType])||0));
    const mobile=window.innerWidth<650;
    const left=mobile?48:58,right=mobile?422:726,top=20,bottom=235,width=right-left,height=bottom-top;
    svg.setAttribute('viewBox',mobile?'0 0 450 280':'0 0 760 280');
    const peak=Math.max(1,...values), scale=Math.max(1,Math.ceil(peak*1.16/4))*4;
    const pts=values.map((v,i)=>({x:left+(values.length===1?0:i*width/(values.length-1)),y:bottom-v*height/scale,v}));
    const line=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    const area=`${line} L${right} ${bottom} L${left} ${bottom} Z`;
    const grid=Array.from({length:5},(_,i)=>{const y=bottom-i*height/4;return `<line class="stats-gridline" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text class="stats-axislabel" x="${left-12}" y="${y+5}" text-anchor="end">${fmt(Math.round(scale*i/4))}</text>`;}).join('');
    const xlabels=pts.map((p,i)=>{
      if(period===30 && i%(mobile?7:5)!==0 && i!==29)return '';
      return `<text class="stats-axislabel" x="${p.x}" y="${bottom+26}" text-anchor="middle">${dayLabel(values.length-1-i)}</text>`;
    }).join('');
    const dots=pts.filter((p,i)=>period===7||i%5===0||i===29).map(p=>`<circle class="stats-plotdot" cx="${p.x}" cy="${p.y}" r="4"/>`).join('');
    svg.innerHTML=`<defs><linearGradient id="stats-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#40b38b" stop-opacity=".24"/><stop offset="1" stop-color="#40b38b" stop-opacity=".01"/></linearGradient></defs>${grid}${xlabels}<path d="${area}" fill="url(#stats-fill)"/><path class="stats-plotline" d="${line}"/>${dots}`;
  }
  function render(){
    setValue('#stats-pageviews',data?.views);
    setValue('#stats-browsers',data?.browsers);
    setValue('#stats-accounts',data?.accounts);
    $('#stats-growth').textContent=data?.growth===null||data?.growth===undefined?'—':`${data.growth>=0?'+':''}${data.growth.toLocaleString('vi-VN',{maximumFractionDigits:1})}%`;
    renderPopular();drawChart();
  }
  async function load(){
    if(!enabled){setStatus('Chưa kết nối');data=null;render();return;}
    setStatus('Đang tải');
    try{
      const res=await fetch(`${api}/api/summary?days=${period}`,{cache:'no-store',mode:'cors'});
      if(!res.ok)throw Error('HTTP '+res.status);
      const result=await res.json();
      if(!result||!Array.isArray(result.daily)||!Array.isArray(result.pages))throw Error('invalid response');
      data=result;render();setStatus('Đang hoạt động',true);
    }catch(err){data=null;render();setStatus('Chưa kết nối');}
  }
  document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{
    period=Number(button.dataset.period);setSelected(document.querySelectorAll('[data-period]'),button);load();
  }));
  document.querySelectorAll('[data-chart]').forEach(button=>button.addEventListener('click',()=>{
    chartType=button.dataset.chart;setSelected(document.querySelectorAll('[data-chart]'),button);drawChart();
  }));
  window.addEventListener('resize',()=>{if(data)drawChart();});
  async function initGoogleSignIn(){
    const clientId=String(cfg.googleClientId||'');
    if(!enabled||!clientId)return;
    const target=$('#stats-signin');
    target.hidden=false;
    const script=document.createElement('script');
    script.async=true;script.defer=true;script.src='https://accounts.google.com/gsi/client';
    script.onload=()=>{
      if(!window.google?.accounts?.id)return;
      window.google.accounts.id.initialize({client_id:clientId,callback:async ({credential})=>{
        if(!credential)return;
        try{
          const response=await fetch(`${api}/api/signin`,{method:'POST',mode:'cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential})});
          if(!response.ok)throw new Error('Login rejected');
          await load();
        }catch(e){setStatus('Không thể đăng nhập');}
      }});
      window.google.accounts.id.renderButton(target,{type:'standard',theme:'outline',size:'medium',shape:'pill',text:'signin_with',width:185});
    };
    document.head.appendChild(script);
  }
  render();load();initGoogleSignIn();
})();
