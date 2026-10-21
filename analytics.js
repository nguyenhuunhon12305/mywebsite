/* Tracking nhẹ, chỉ hoạt động sau khi kết nối backend. */
(()=>{
  "use strict";
  const c=window.NHN_ANALYTICS_CONFIG || {};
  if(!/^https:\/\//.test(c.apiBase||"")) return;
  const path=location.pathname.split("/").pop()||"index.html";
  if(!["index.html","gioi-thieu.html","du-an.html","tai-lieu.html","lien-he.html","thong-ke.html"].includes(path))return;
  let visitorId;
  try {
    visitorId=localStorage.getItem("nhn-visitor-id-v1");
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(visitorId||"")){
      visitorId=crypto.randomUUID();
      localStorage.setItem("nhn-visitor-id-v1",visitorId);
    }
  }catch(e){visitorId=crypto.randomUUID();}
  fetch(c.apiBase.replace(/\/$/,"")+"/api/hit",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({path,visitorId}),keepalive:true,mode:"cors"
  }).catch(()=>{});
})();
