import { useState, useEffect, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --green:#1D9E75;--green-light:#E1F5EE;--green-mid:#9FE1CB;--green-dark:#0F6E56;
  --amber:#EF9F27;--amber-light:#FAEEDA;
  --red:#E24B4A;--red-light:#FCEBEB;
  --blue:#378ADD;--blue-light:#E6F1FB;--blue-dark:#185FA5;
  --coral-light:#FAECE7;--coral:#D85A30;
  --pink-light:#FBEAF0;--pink:#993556;
  --purple-light:#F0EBFF;--purple:#7C4DCC;
  --sidebar-w:220px;--header-h:58px;
  --radius:12px;--radius-sm:8px;--radius-xs:6px;
  --shadow:0 1px 3px rgba(0,0,0,.08);--shadow-md:0 4px 16px rgba(0,0,0,.1);
  --fd:'Sora',sans-serif;--fb:'DM Sans',sans-serif;
}
body{font-family:var(--fb);background:#f0f2f0;color:#1a1a1a;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased}
.app-shell{display:grid;grid-template-columns:var(--sidebar-w) 1fr;min-height:100vh;transition:grid-template-columns .25s ease}
.app-shell[data-sidebar="closed"]{grid-template-columns:64px 1fr}
.main-area{display:flex;flex-direction:column;min-height:100vh;overflow:hidden}
.page-content{flex:1;padding:1.5rem;overflow-y:auto;max-width:1140px;width:100%;margin:0 auto}

/* SIDEBAR */
.sidebar{background:#0e1f1a;color:#fff;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;transition:all .25s ease}
.sidebar-logo{display:flex;align-items:center;gap:10px;padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.logo-mark{width:32px;height:32px;border-radius:9px;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.logo-name{font-family:var(--fd);font-size:15px;font-weight:600;color:#fff;white-space:nowrap}
.logo-tagline{font-size:10px;color:rgba(255,255,255,.4);white-space:nowrap}
.sidebar-nav{flex:1;padding:10px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--radius-sm);cursor:pointer;color:rgba(255,255,255,.55);font-size:13px;font-weight:400;transition:all .15s;white-space:nowrap;overflow:hidden;border:none;background:none;width:100%;text-align:left;font-family:var(--fb)}
.nav-item:hover{color:#fff;background:rgba(255,255,255,.07)}
.nav-item.active{color:#fff;background:rgba(29,158,117,.22)}
.nav-icon{font-size:18px;flex-shrink:0;width:20px;text-align:center}
.nav-badge{margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:600;padding:1px 6px;border-radius:10px;flex-shrink:0}
.sidebar-footer{padding:12px 8px;border-top:1px solid rgba(255,255,255,.07)}
.g-btn{display:flex;align-items:center;gap:8px;width:100%;padding:9px 10px;border-radius:var(--radius-sm);border:1px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.7);font-size:12px;cursor:pointer;white-space:nowrap;overflow:hidden;transition:all .15s;font-family:var(--fb)}
.g-btn:hover{background:rgba(255,255,255,.07);color:#fff}
.g-btn.connected{border-color:rgba(29,158,117,.5);color:var(--green-mid)}

/* HEADER */
.header{height:var(--header-h);background:#fff;border-bottom:1px solid #e8ede8;display:flex;align-items:center;padding:0 1.5rem;gap:12px;flex-shrink:0;position:sticky;top:0;z-index:10}
.hdr-toggle{width:32px;height:32px;border-radius:var(--radius-xs);border:none;background:none;cursor:pointer;color:#666;display:flex;align-items:center;justify-content:center;font-size:18px}
.hdr-toggle:hover{background:#f0f2f0}
.hdr-title{font-family:var(--fd);font-weight:500;font-size:16px;color:#1a1a1a}
.hdr-spacer{flex:1}
.family-avatars{display:flex;gap:4px;align-items:center}
.av-chip{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;cursor:pointer;transition:all .15s;font-family:var(--fd)}
.av-chip:hover{transform:scale(1.1)}
.sync-badge{font-size:11px;color:var(--green);display:flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid var(--green-light);border-radius:20px;background:var(--green-light)}

/* CARDS */
.card{background:#fff;border-radius:var(--radius);border:1px solid #e8ede8;padding:1.25rem}
.card-title{font-family:var(--fd);font-size:12px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.05em;margin-bottom:1rem;display:flex;align-items:center;gap:6px}
.card-title i{font-size:15px;color:var(--green)}
.g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;margin-bottom:1rem}
.g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1rem}
.g4{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:1rem}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.st{font-family:var(--fd);font-size:16px;font-weight:600;color:#1a1a1a;display:flex;align-items:center;gap:8px}
.st i{font-size:18px;color:var(--green)}

/* STATS */
.stat{background:#fff;border-radius:var(--radius);border:1px solid #e8ede8;padding:1rem 1.25rem;display:flex;flex-direction:column;gap:4px}
.stat.accent{border-left:3px solid var(--green)}
.stat.alert{border-left:3px solid var(--red)}
.stat-n{font-family:var(--fd);font-size:28px;font-weight:600;color:#1a1a1a;line-height:1}
.stat-l{font-size:12px;color:#888;display:flex;align-items:center;gap:5px}
.stat-l i{font-size:13px;color:var(--green)}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-sm);font-size:13px;font-weight:500;cursor:pointer;border:1px solid #d4d4d4;background:#fff;color:#1a1a1a;transition:all .15s;font-family:var(--fb)}
.btn:hover{background:#f5f5f5;border-color:#bbb}
.btn-p{background:var(--green);color:#fff;border-color:var(--green)}
.btn-p:hover{background:var(--green-dark);border-color:var(--green-dark)}
.btn-s{padding:5px 10px;font-size:12px}
.btn-ic{width:30px;height:30px;padding:0;justify-content:center;border:none;background:none;color:#888;border-radius:var(--radius-xs)}
.btn-ic:hover{background:#f0f2f0;color:#333}
.btn-d{border-color:#fcc;background:#fff;color:var(--red)}
.btn-d:hover{background:var(--red-light)}

/* PILLS */
.pill{display:inline-flex;align-items:center;font-size:11px;font-weight:500;padding:2px 9px;border-radius:20px;white-space:nowrap}
.pill-g{background:var(--green-light);color:var(--green-dark)}
.pill-a{background:var(--amber-light);color:#854F0B}
.pill-r{background:var(--red-light);color:#A32D2D}
.pill-b{background:var(--blue-light);color:var(--blue-dark)}
.pill-c{background:var(--coral-light);color:var(--coral)}
.pill-k{background:var(--pink-light);color:var(--pink)}
.pill-p{background:var(--purple-light);color:var(--purple)}
.pill-gr{background:#f0f2f0;color:#555}

/* DOC ITEMS */
.doc-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--radius-xs);border:1px solid #eef0ee;background:#fafbfa;transition:border-color .15s}
.doc-item:hover{border-color:#c8d4c8}
.doc-ic{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.doc-ic.pdf{background:var(--coral-light);color:var(--coral)}
.doc-ic.img{background:var(--blue-light);color:var(--blue-dark)}
.doc-ic.note{background:var(--amber-light);color:#854F0B}
.doc-ic.folder{background:var(--green-light);color:var(--green-dark)}
.doc-nm{flex:1;font-size:13px;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* VISIT */
.vi{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #f0f0f0}
.vi:last-child{border-bottom:none}
.vi-date{min-width:44px;text-align:center;background:#f5f7f5;border-radius:var(--radius-xs);padding:6px 4px;flex-shrink:0}
.vi-day{font-family:var(--fd);font-size:18px;font-weight:600;color:#1a1a1a;line-height:1}
.vi-mon{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.05em}
.vi-ttl{font-size:14px;font-weight:500;color:#1a1a1a}
.vi-sub{font-size:12px;color:#888;margin-top:1px}

/* MED */
.med{border:1px solid #e8ede8;border-radius:var(--radius);padding:1rem 1.1rem;margin-bottom:10px;background:#fff;transition:box-shadow .15s}
.med:hover{box-shadow:var(--shadow-md)}
.med-nm{font-family:var(--fd);font-size:15px;font-weight:600;color:#1a1a1a}
.med-pr{font-size:12px;color:#888;margin-top:1px}
.tc{display:inline-flex;align-items:center;gap:4px;font-size:11px;background:#f5f7f5;border:1px solid #e0e4e0;border-radius:20px;padding:3px 10px;color:#1a1a1a}
.tc i{font-size:12px;color:var(--green)}
.med-nt{font-size:12px;color:#888;margin-top:8px;padding:6px 8px;background:#fafbfa;border-radius:6px;border-left:2px solid var(--green-mid)}
.med-lk{display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap}
.lk-sm{font-size:11px;color:var(--blue-dark);display:inline-flex;align-items:center;gap:3px;cursor:pointer}
.lk-sm:hover{text-decoration:underline}

/* TRIP */
.trip{background:#fff;border-radius:var(--radius);border:1px solid #e8ede8;overflow:hidden;transition:box-shadow .2s}
.trip:hover{box-shadow:var(--shadow-md)}
.trip-h{padding:14px 16px;background:#f8faf8;border-bottom:1px solid #e8ede8}
.trip-nm{font-family:var(--fd);font-size:16px;font-weight:600}
.trip-bd{padding:12px 16px}
.trip-ft{padding:10px 16px;border-top:1px solid #f0f0f0;display:flex;align-items:center;gap:10px}
.pb{height:4px;background:#eef0ee;border-radius:2px;flex:1}
.pf{height:100%;border-radius:2px;background:var(--green);transition:width .3s ease}
.ci{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px}
.ci input[type=checkbox]{accent-color:var(--green);width:14px;height:14px;cursor:pointer}
.ci.done{color:#aaa;text-decoration:line-through}

/* DIARY */
.de{border-left:2px solid var(--green-mid);padding:0 0 18px 16px;position:relative}
.de::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--green);position:absolute;left:-5px;top:4px}
.de-dt{font-size:11px;color:#aaa;margin-bottom:3px}
.de-ttl{font-size:14px;font-weight:500;color:#1a1a1a}
.de-tx{font-size:13px;color:#666;margin-top:4px;line-height:1.55}
.pt{display:flex;gap:6px;margin-top:8px}
.ph{width:42px;height:42px;border-radius:6px;background:#f0f2f0;border:1px solid #e8e8e8;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:16px}

/* MEMBER CARD */
.mem-card{background:#fff;border-radius:var(--radius);border:1px solid #e8ede8;padding:1.25rem;display:flex;flex-direction:column;gap:10px;transition:box-shadow .15s;position:relative}
.mem-card:hover{box-shadow:var(--shadow-md)}
.mem-av{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:18px;font-weight:600;flex-shrink:0;margin-bottom:4px}
.mem-name{font-family:var(--fd);font-size:16px;font-weight:600;color:#1a1a1a}
.mem-row{display:flex;align-items:center;gap:6px;font-size:12px;color:#666}
.mem-row i{font-size:14px;color:var(--green)}
.mem-actions{display:flex;gap:6px;margin-top:4px}
.color-swatch{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:border-color .1s;flex-shrink:0}
.color-swatch.sel{border-color:#1a1a1a}

/* EXPENSE */
.exp-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f5f5f5}
.exp-row:last-child{border-bottom:none}
.exp-cat{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.exp-desc{flex:1;font-size:13px;color:#1a1a1a}
.exp-sub{font-size:11px;color:#aaa}
.exp-amount{font-family:var(--fd);font-size:14px;font-weight:600}
.exp-amount.pos{color:var(--green-dark)}
.exp-amount.neg{color:var(--red)}
.budget-bar{height:8px;background:#eef0ee;border-radius:4px;margin-top:6px;overflow:hidden}
.budget-fill{height:100%;border-radius:4px;transition:width .4s ease}

/* MODAL / FORMS */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100;padding:1rem}
.modal{background:#fff;border-radius:var(--radius);padding:1.5rem;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.18)}
.modal-t{font-family:var(--fd);font-size:17px;font-weight:600;margin-bottom:1.25rem}
.fg{margin-bottom:1rem}
.fl{font-size:12px;font-weight:500;color:#555;margin-bottom:4px;display:block}
.fi{width:100%;padding:8px 10px;border:1px solid #dde;border-radius:var(--radius-xs);font-size:13px;font-family:var(--fb);color:#1a1a1a;background:#fff;transition:border-color .15s;outline:none}
.fi:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(29,158,117,.1)}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fa{display:flex;gap:8px;justify-content:flex-end;margin-top:1.25rem}
select.fi{cursor:pointer}

/* MISC */
.ri{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f5f5}
.ri:last-child{border-bottom:none}
.rd{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.rw{font-size:11px;color:#aaa;white-space:nowrap}
.upz{border:1.5px dashed #c8d4c8;border-radius:var(--radius);padding:1.5rem;text-align:center;color:#888;font-size:13px;cursor:pointer;transition:all .15s}
.upz:hover{background:var(--green-light);border-color:var(--green-mid);color:var(--green-dark)}
.upz i{font-size:24px;display:block;margin-bottom:6px}
.gb{background:linear-gradient(135deg,#e8f5e9,#e3f2fd);border:1px solid #c8e6c9;border-radius:var(--radius);padding:1rem 1.25rem;display:flex;align-items:center;gap:12px;margin-bottom:1rem}
.gb-t{flex:1}.gb-t strong{font-size:14px;font-weight:500;display:block;color:#1a1a1a}.gb-t span{font-size:12px;color:#555}
.empty{text-align:center;padding:2rem 1rem;color:#aaa}.empty i{font-size:32px;display:block;margin-bottom:8px}.empty p{font-size:13px}
.itabs{display:flex;gap:4px;margin-bottom:1rem;flex-wrap:wrap}
.itab{font-size:12px;padding:5px 12px;border-radius:20px;cursor:pointer;background:#f0f2f0;color:#666;border:none;font-family:var(--fb);transition:all .15s}
.itab.active{background:var(--green);color:#fff}
.itab:hover:not(.active){background:#e4e8e4}

/* GUIDE */
.guide-step{display:flex;gap:14px;padding:16px 0;border-bottom:1px solid #f0f0f0}
.guide-step:last-child{border-bottom:none}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--green);color:#fff;font-family:var(--fd);font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.step-body h4{font-family:var(--fd);font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:4px}
.step-body p{font-size:13px;color:#555;line-height:1.6}
.step-body code{background:#f0f2f0;padding:1px 6px;border-radius:4px;font-size:12px;font-family:monospace;color:var(--coral)}
.step-body a{color:var(--blue-dark);text-decoration:none}
.step-body a:hover{text-decoration:underline}
.step-body ul{margin:6px 0 0 16px;display:flex;flex-direction:column;gap:3px}
.guide-section{margin-bottom:1.5rem}
.guide-section h3{font-family:var(--fd);font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--green-light);display:flex;align-items:center;gap:8px}
.tip-box{background:var(--amber-light);border:1px solid #e8c97a;border-radius:var(--radius-xs);padding:10px 14px;font-size:12px;color:#6b3e00;margin-top:8px;display:flex;gap:8px;align-items:flex-start}

::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#c8d4c8;border-radius:3px}
@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.page-content>*{animation:fi .22s ease both}
`;

/* ═══════════════════════════════════════════════════════════════
   DEFAULTS
═══════════════════════════════════════════════════════════════ */
const COLORS = [
  {c:"#1D9E75",bg:"#E1F5EE"},{c:"#185FA5",bg:"#E6F1FB"},{c:"#854F0B",bg:"#FAEEDA"},
  {c:"#993556",bg:"#FBEAF0"},{c:"#D85A30",bg:"#FAECE7"},{c:"#7C4DCC",bg:"#F0EBFF"},
  {c:"#0e1f1a",bg:"#e0e8e5"},{c:"#C0392B",bg:"#FDEDEC"},
];
const DEF_FAMILY = [
  {id:"marco",name:"Marco",initials:"MA",role:"Padre",bday:"1983-04-15",blood:"A+",cf:"MRCVRD83D15H501X",phone:"333 1234567",color:"#1D9E75",bg:"#E1F5EE"},
  {id:"sofia",name:"Sofia",initials:"SO",role:"Madre",bday:"1986-07-22",blood:"B+",cf:"SFAVRD86L62H501K",phone:"333 7654321",color:"#854F0B",bg:"#FAEEDA"},
  {id:"luca", name:"Luca", initials:"LU",role:"Figlio",bday:"2016-11-03",blood:"A+",cf:"LCAVRD16S03H501Z",phone:"",          color:"#185FA5",bg:"#E6F1FB"},
  {id:"nonna",name:"Nonna",initials:"NO",role:"Nonna", bday:"1948-02-28",blood:"O-",cf:"NNIVRD48B68H501P",phone:"06 1234567",color:"#993556",bg:"#FBEAF0"},
];
const DEF_DOCS = [
  {id:"d1",name:"Tessera sanitaria Marco",type:"pdf",category:"Identità",    person:"marco",date:"2025-05-12",expiry:null,        size:"210 KB"},
  {id:"d2",name:"Vaccinazioni Luca 2025", type:"img",category:"Salute",      person:"luca", date:"2025-05-03",expiry:null,        size:"1.2 MB"},
  {id:"d3",name:"Note visita cardiologica",type:"note",category:"Salute",    person:"nonna",date:"2025-04-28",expiry:null,        size:"4 KB"},
  {id:"d4",name:"Patente Marco",          type:"pdf",category:"Identità",    person:"marco",date:"2020-06-28",expiry:"2025-06-28",size:"450 KB"},
  {id:"d5",name:"Passaporto Sofia",       type:"pdf",category:"Identità",    person:"sofia",date:"2019-09-14",expiry:"2025-09-14",size:"380 KB"},
  {id:"d6",name:"Assicurazione auto 2025",type:"pdf",category:"Assicurazioni",person:null,  date:"2024-11-02",expiry:"2025-11-02",size:"620 KB"},
  {id:"d7",name:"Contratto affitto",      type:"pdf",category:"Casa",        person:null,   date:"2024-01-15",expiry:null,        size:"1.8 MB"},
];
const DEF_MEDS = [
  {id:"m1",name:"Amoxicillina 500mg",person:"luca", category:"Antibiotico", times:["08:00","13:00","20:00"],notes:"Con cibo · 7 giorni",startDate:"2025-05-19",endDate:"2025-05-26",active:true,attachments:[{name:"Foglio illustrativo",type:"pdf"}],producerUrl:"https://farmaci.aifa.gov.it"},
  {id:"m2",name:"Vitamina D 1000 UI",person:"sofia",category:"Integratore", times:["20:00"],               notes:"Con pasto serale",   startDate:"2025-01-01",endDate:null,         active:true,attachments:[{name:"Foto confezione",type:"img"}],     producerUrl:""},
  {id:"m3",name:"Bisoprololo 5mg",   person:"nonna",category:"Cardiologico",times:["07:30"],               notes:"A digiuno",          startDate:"2024-03-01",endDate:null,         active:true,attachments:[{name:"Ricetta medica",type:"pdf"}],      producerUrl:"https://farmaci.aifa.gov.it"},
  {id:"m4",name:"Omega 3",           person:"marco",category:"Integratore", times:["13:00"],               notes:"Con pranzo",         startDate:"2025-02-01",endDate:null,         active:true,attachments:[],                                       producerUrl:""},
];
const DEF_VISITS = [
  {id:"v1",title:"Pediatra",  person:"luca", doctor:"Dott. Ferrara",location:"Via Roma 4",    date:"2025-05-28",time:"15:30",status:"confirmed",attachments:[]},
  {id:"v2",title:"Cardiologo",person:"nonna",doctor:"Dott. Marino", location:"Osp. Cardarelli",date:"2025-06-03",time:"10:00",status:"pending",  attachments:[{name:"Ecocardio",type:"pdf"}]},
  {id:"v3",title:"Oculista",  person:"sofia",doctor:"Studio Rossi", location:"Via Napoli 22", date:"2025-06-12",time:"09:00",status:"new",       attachments:[]},
];
const DEF_THERAPIES = [
  {id:"t1",title:"Fisioterapia",person:"marco",doctor:"Dott. Bianchi",  total:8,   done:3,   schedule:"Martedì 10:00"},
  {id:"t2",title:"Logopedia",   person:"luca", doctor:"Dott.ssa Verde", total:null,done:null,schedule:"Martedì 16:30"},
];
const DEF_TRIPS = [
  {
    id:"tr1", name:"Barcellona", emoji:"🏛️", dates:"24–28 mag 2026",
    dateFrom:"2026-05-24", dateTo:"2026-05-28",
    persons:["marco","sofia","luca","nonna"], status:"imminent", budget:2400,
    notes:"Soggiorno nel quartiere Eixample. Portare adattatori per prese spagnole.",
    /* ── voli ── */
    flights:[
      {id:"f1",type:"andata",company:"Ryanair",from:"Roma FCO",to:"Barcellona BCN",
       date:"2026-05-24",time:"07:15",arrival:"09:30",flightNum:"FR1234",
       bookingRef:"RYA-XK9271",bookingUrl:"https://ryanair.com",ticketUrl:"",
       checkinOpen:"2026-05-22",checkinDeadline:"2026-05-24T04:15",checkinDone:false,
       boardingPass:false,seats:"14A,14B,15A,15B"},
      {id:"f2",type:"ritorno",company:"Ryanair",from:"Barcellona BCN",to:"Roma FCO",
       date:"2026-05-28",time:"18:45",arrival:"20:55",flightNum:"FR5678",
       bookingRef:"RYA-XK9272",bookingUrl:"https://ryanair.com",ticketUrl:"",
       checkinOpen:"2026-05-26",checkinDeadline:"2026-05-28T15:45",checkinDone:false,
       boardingPass:false,seats:"14A,14B,15A,15B"},
    ],
    /* ── hotel ── */
    hotels:[
      {id:"h1",name:"Hotel Arts Barcelona",stars:4,address:"Carrer de la Marina 19-21",
       checkIn:"2026-05-24",checkInTime:"15:00",checkOut:"2026-05-28",checkOutTime:"11:00",
       bookingRef:"BK-748291",bookingUrl:"https://booking.com",confirmUrl:"",
       checkinDone:false,phone:"+34 93 221 1000",notes:"Colazione inclusa. Chiedere camera vista mare."},
    ],
    /* ── trasporti aggiuntivi ── */
    transports:[
      {id:"tr_a",type:"treno",desc:"Aeroport–Plaça Catalunya",date:"2026-05-24",time:"10:00",bookingRef:"",cost:14,notes:"L9 Sud metro"},
    ],
    /* ── itinerario giorno per giorno ── */
    itinerary:[
      {id:"it1",day:"2026-05-24",title:"Arrivo e Barceloneta",items:["Atterraggio 09:30","Check-in hotel ore 15","Passeggiata Barceloneta","Cena tapas El Xampanyet"]},
      {id:"it2",day:"2026-05-25",title:"Gaudí Day",items:["Sagrada Família ore 9 (prenotato)","Pranzo Eixample","Casa Batlló pomeriggio","Park Güell al tramonto"]},
      {id:"it3",day:"2026-05-26",title:"Cultura e shopping",items:["Museu Picasso","Barri Gòtic","Las Ramblas","Mercat de la Boqueria","Shopping Passeig de Gràcia"]},
      {id:"it4",day:"2026-05-27",title:"Gita a Montserrat",items:["Partenza 08:30 con treno","Montserrat visita monastero","Pranzo in quota","Rientro ore 17"]},
      {id:"it5",day:"2026-05-28",title:"Partenza",items:["Check-out ore 11","Ultima passeggiata","Aeroporto ore 15:00","Volo ritorno 18:45"]},
    ],
    /* ── bagagli / cose da portare ── */
    packing:[
      {id:"pk1",cat:"Documenti",items:[{t:"Carta identità / passaporto",done:true},{t:"Tessera sanitaria europea",done:true},{t:"Patente (Marco)",done:false},{t:"Voucher hotel stampato",done:false},{t:"Boarding pass scaricati",done:false}]},
      {id:"pk2",cat:"Abbigliamento",items:[{t:"Magliette (3 a testa)",done:false},{t:"Pantaloni / shorts",done:false},{t:"Scarpe comode da camminata",done:true},{t:"Giacca leggera sera",done:false},{t:"Costume da bagno",done:false}]},
      {id:"pk3",cat:"Farmaci & salute",items:[{t:"Farmaci cronici (Nonna)",done:false},{t:"Kit pronto soccorso",done:false},{t:"Crema solare",done:false},{t:"Antidolorifico / antistaminico",done:false}]},
      {id:"pk4",cat:"Tecnologia",items:[{t:"Adattatori presa spagnola",done:false},{t:"Powerbank",done:true},{t:"Cuffie bambini (Luca)",done:false},{t:"Macchina fotografica + caricatore",done:false}]},
    ],
    /* ── checklist generica ── */
    checklist:[
      {id:"c1",text:"Voli prenotati",done:true},{id:"c2",text:"Hotel confermato",done:true},
      {id:"c3",text:"Check-in volo andata",done:false},{id:"c4",text:"Boarding pass scaricati",done:false},
      {id:"c5",text:"Valuta / carta forex",done:false},{id:"c6",text:"Farmaci da viaggio",done:false},
    ],
    docs:[{name:"Voli BCN confermati",type:"pdf"},{name:"Hotel Barcellona voucher",type:"pdf"},{name:"Itinerario Barcellona",type:"note"}],
    reminders:[
      {id:"r1",text:"Check-in online volo andata",when:"2026-05-22",color:"#185FA5"},
      {id:"r2",text:"Partenza aeroporto",when:"2026-05-24",color:"#1D9E75"},
      {id:"r3",text:"Check-out hotel",when:"2026-05-28",color:"#EF9F27"},
    ],
    expenses:[
      {id:"e1",desc:"Voli A/R x4",cat:"transport",amount:640,date:"2026-04-10",person:"marco"},
      {id:"e2",desc:"Hotel 4 notti",cat:"lodging",amount:880,date:"2026-04-12",person:"sofia"},
      {id:"e3",desc:"Acconto ristorante",cat:"food",amount:120,date:"2026-05-20",person:"marco"},
    ],
    diary:[],
  },
  {
    id:"tr2", name:"Trentino", emoji:"⛰️", dates:"14–21 ago 2026",
    dateFrom:"2026-08-14", dateTo:"2026-08-21",
    persons:["marco","sofia","luca"], status:"planning", budget:1800,
    notes:"Zona Val di Fassa. Cercare struttura pet-friendly.",
    flights:[],
    hotels:[],
    transports:[{id:"tr_a",type:"auto",desc:"Partenza da Roma con auto",date:"2026-08-14",time:"06:00",bookingRef:"",cost:0,notes:"Sosta pranzo a Verona"}],
    itinerary:[],
    packing:[
      {id:"pk1",cat:"Montagna",items:[{t:"Scarponi da trekking",done:false},{t:"Bastoncini",done:false},{t:"Zaino 30L",done:false},{t:"Crema solare alta protezione",done:false}]},
      {id:"pk2",cat:"Documenti",items:[{t:"Carta identità",done:false},{t:"Tessera sanitaria",done:false}]},
    ],
    checklist:[
      {id:"c1",text:"Periodo scelto",done:true},{id:"c2",text:"Struttura da prenotare",done:false},
      {id:"c3",text:"Attività bambini",done:false},{id:"c4",text:"Trasporto",done:false},
      {id:"c5",text:"Assicurazione viaggio",done:false},{id:"c6",text:"Bagagli & zaini",done:false},
    ],
    docs:[], reminders:[{id:"r1",text:"Prenotare struttura",when:"2026-06-15",color:"#EF9F27"}],
    expenses:[], diary:[],
  },
];
const DEF_DIARY = [
  {id:"di1",location:"Roma",  date:"2026-04-12",title:"Weekend al Colosseo",text:"Luca ha adorato la visita guidata dei gladiatori. Sofia ha fotografato tutto. Pizza a Trastevere — la migliore della vita secondo Marco.",photos:7,persons:["marco","sofia","luca"]},
  {id:"di2",location:"Napoli",date:"2026-03-01",title:"Gita a Pompei",       text:"Straordinaria. Marco ha fatto la guida ufficiale di famiglia con la sua app. Pranzo al museo degli scavi.",photos:2,persons:["marco","nonna"]},
];
const EXP_CATS = {transport:{label:"Trasporto",icon:"✈️",color:"#185FA5",bg:"#E6F1FB"},lodging:{label:"Alloggio",icon:"🏨",color:"#993556",bg:"#FBEAF0"},food:{label:"Cibo",icon:"🍽️",color:"#854F0B",bg:"#FAEEDA"},activities:{label:"Attività",icon:"🎡",color:"#0F6E56",bg:"#E1F5EE"},shopping:{label:"Shopping",icon:"🛍️",color:"#D85A30",bg:"#FAECE7"},other:{label:"Altro",icon:"💳",color:"#555",bg:"#f0f2f0"}};

/* ═══════════════════════════════════════════════════════════════
   CONTEXT
═══════════════════════════════════════════════════════════════ */
const Ctx = createContext(null);
function load(k,d){try{const s=localStorage.getItem("fh_"+k);return s?JSON.parse(s):d;}catch{return d;}}
function usePersist(k,d){const[s,set]=useState(()=>load(k,d));useEffect(()=>{try{localStorage.setItem("fh_"+k,JSON.stringify(s));}catch{}},[k,s]);return[s,set];}

function Provider({children}){
  const[family,  setFamily]  =usePersist("family",  DEF_FAMILY);
  const[docs,    setDocs]    =usePersist("docs",     DEF_DOCS);
  const[meds,    setMeds]    =usePersist("meds",     DEF_MEDS);
  const[visits,  setVisits]  =usePersist("visits",   DEF_VISITS);
  const[therapies]           =usePersist("ther",     DEF_THERAPIES);
  const[trips,   setTrips]   =usePersist("trips",    DEF_TRIPS);
  const[diary,   setDiary]   =usePersist("diary",    DEF_DIARY);
  const[gConn,   setGConn]   =useState(false);

  const ctx={
    family,docs,meds,visits,therapies,trips,diary,gConn,setGConn,
    addDoc:    d  =>setDocs(p   =>[...p,{...d, id:"d"+Date.now()}]),
    removeDoc: id =>setDocs(p   =>p.filter(x=>x.id!==id)),
    addMed:    m  =>setMeds(p   =>[...p,{...m, id:"m"+Date.now()}]),
    removeMed: id =>setMeds(p   =>p.filter(x=>x.id!==id)),
    addVisit:  v  =>setVisits(p =>[...p,{...v, id:"v"+Date.now()}]),
    removeVisit:id=>setVisits(p =>p.filter(x=>x.id!==id)),
    addTrip:   t  =>setTrips(p  =>[...p,{...t, id:"tr"+Date.now()}]),
    addDiary:  e  =>setDiary(p  =>[{...e,id:"di"+Date.now()},...p]),
    addMember: m  =>setFamily(p =>[...p,{...m, id:"fm"+Date.now()}]),
    updateMember:(id,data)=>setFamily(p=>p.map(m=>m.id===id?{...m,...data}:m)),
    removeMember:id=>setFamily(p=>p.filter(m=>m.id!==id)),
    toggleCL:(tid,cid)=>setTrips(p=>p.map(t=>t.id!==tid?t:{...t,checklist:t.checklist.map(c=>c.id===cid?{...c,done:!c.done}:c)})),
    togglePacking:(tid,pid,idx)=>setTrips(p=>p.map(t=>t.id!==tid?t:{...t,packing:t.packing.map(pk=>pk.id!==pid?pk:{...pk,items:pk.items.map((it,i)=>i!==idx?it:{...it,done:!it.done})})})),
    toggleFlightCheckin:(tid,fid)=>setTrips(p=>p.map(t=>t.id!==tid?t:{...t,flights:t.flights.map(f=>f.id!==fid?f:{...f,checkinDone:!f.checkinDone})})),
    toggleHotelCheckin:(tid,hid)=>setTrips(p=>p.map(t=>t.id!==tid?t:{...t,hotels:t.hotels.map(h=>h.id!==hid?h:{...h,checkinDone:!h.checkinDone})})),
    addItineraryItem:(tid,dayId,text)=>setTrips(p=>p.map(t=>t.id!==tid?t:{...t,itinerary:t.itinerary.map(d=>d.id!==dayId?d:{...d,items:[...d.items,text]})})),
    addDiaryEntry:(tid,entry)=>setTrips(p=>p.map(t=>t.id!==tid?t:{...t,diary:[{...entry,id:"de"+Date.now()},...(t.diary||[])]})),
    addExpense:(tid,exp)=>setTrips(p=>p.map(t=>t.id!==tid?t:{...t,expenses:[...(t.expenses||[]),{...exp,id:"ex"+Date.now()}]})),
    removeExpense:(tid,eid)=>setTrips(p=>p.map(t=>t.id!==tid?t:{...t,expenses:(t.expenses||[]).filter(e=>e.id!==eid)})),
  };
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}
const useF=()=>useContext(Ctx);

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const daysUntil=d=>d?Math.ceil((new Date(d)-new Date())/864e5):null;
const getFm=(fam,id)=>fam.find(f=>f.id===id);
const docIcon={pdf:"ti-file-type-pdf",img:"ti-photo",note:"ti-notes",folder:"ti-folder"};
const timeIcon=h=>h<12?"ti-sun":h<18?"ti-sun-high":"ti-moon";
const fmtDate=d=>new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"});
const fmtAge=bday=>{if(!bday)return"";const d=new Date(bday),n=new Date(),y=n.getFullYear()-d.getFullYear()-((n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))?1:0);return y+" anni";};

function StatusPill({s}){const m={confirmed:["pill-g","Conf."],pending:["pill-a","Da conf."],new:["pill-b","Nuovo"]};const[c,l]=m[s]||["pill-gr",s];return <span className={`pill ${c}`}>{l}</span>;}
function ExpiryPill({days}){if(days===null)return null;if(days<0)return<span className="pill pill-r">Scaduto</span>;if(days<=30)return<span className="pill pill-r">{days} gg</span>;if(days<=90)return<span className="pill pill-a">{days} gg</span>;return<span className="pill pill-g">{days} gg</span>;}

const CATS=["Tutte","Identità","Salute","Assicurazioni","Casa","Scuola","Altro"];
const MED_CATS=["Antibiotico","Cardiologico","Integratore","Antiinfiammatorio","Antidolorifico","Neurologico","Altro"];
const CAT_PILL={Antibiotico:"pill-r",Cardiologico:"pill-c",Integratore:"pill-a",Antiinfiammatorio:"pill-b",Antidolorifico:"pill-k",Neurologico:"pill-g",Altro:"pill-gr"};
const STATUS_TRIP={imminent:["pill-a","In arrivo"],planning:["pill-b","Pianificazione"],past:["pill-gr","Passato"]};

/* ═══════════════════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════════════════ */
function Modal({title,onClose,children}){return(<div className="overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-t">{title}</div>{children}</div></div>);}

/* helper: legge un File e restituisce dataURL */
function readFile(file){
  return new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(file);});
}
/* helper: apre Google Calendar "quick-add" in una nuova tab */
function openCalendarEvent(doc){
  if(!doc.expiry)return;
  const dt=new Date(doc.expiry);
  const ymd=dt.toISOString().replace(/-/g,"").slice(0,8);
  const text=encodeURIComponent(`⚠️ Scadenza: ${doc.name}`);
  const dates=`${ymd}/${ymd}`;
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${encodeURIComponent("Scadenza documento — Family Hub")}`, "_blank");
}

function AddDocModal({onClose}){
  const{addDoc,family,gConn}=useF();
  const[f,sf]=useState({name:"",type:"pdf",category:"Identità",person:"",date:new Date().toISOString().slice(0,10),expiry:"",size:"",driveUrl:"",preview:null,fileData:null});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const[dragging,setDragging]=useState(false);

  const handleFile=async(file)=>{
    if(!file)return;
    const isImg=file.type.startsWith("image/");
    const isPdf=file.type==="application/pdf";
    const type=isImg?"img":isPdf?"pdf":"note";
    const size=file.size>1048576?`${(file.size/1048576).toFixed(1)} MB`:`${Math.round(file.size/1024)} KB`;
    const name=f.name||file.name.replace(/\.[^/.]+$/,"");
    let preview=null;
    if(isImg){preview=await readFile(file);}
    sf(p=>({...p,name,type,size,preview,fileData:file.name}));
  };

  const onDrop=e=>{e.preventDefault();setDragging(false);const file=e.dataTransfer.files[0];if(file)handleFile(file);};
  const onFileInput=e=>{const file=e.target.files[0];if(file)handleFile(file);};

  const submit=()=>{
    if(!f.name)return;
    addDoc(f);
    onClose();
  };

  return(<Modal title="📄 Nuovo documento" onClose={onClose}>
    {/* ── zona upload ── */}
    <div className="fg">
      <label className="fl">File (PDF o immagine)</label>
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={onDrop}
        style={{border:`2px dashed ${dragging?"#1D9E75":"#c8d4c8"}`,borderRadius:10,padding:"1rem",textAlign:"center",cursor:"pointer",background:dragging?"#E1F5EE":"#fafbfa",transition:"all .15s",marginBottom:4}}
        onClick={()=>document.getElementById("fh-file-input").click()}
      >
        {f.preview
          ? <img src={f.preview} alt="anteprima" style={{maxHeight:90,borderRadius:6,objectFit:"contain"}}/>
          : f.fileData
            ? <div style={{fontSize:13,color:"#1D9E75"}}><i className="ti ti-check" style={{fontSize:20,display:"block",marginBottom:4}}/>{f.fileData}</div>
            : <div style={{color:"#aaa",fontSize:13}}><i className="ti ti-upload" style={{fontSize:24,display:"block",marginBottom:4}}/>{gConn?"Trascina o clicca · verrà caricato su Drive":"Trascina o clicca · salvato localmente"}</div>
        }
      </div>
      <input id="fh-file-input" type="file" accept=".pdf,image/*" style={{display:"none"}} onChange={onFileInput}/>
    </div>

    {/* ── link Drive manuale ── */}
    <div className="fg">
      <label className="fl"><i className="ti ti-brand-google-drive" style={{color:"#34A853",marginRight:4}}/>Link Google Drive (opzionale)</label>
      <input className="fi" value={f.driveUrl} onChange={e=>s("driveUrl",e.target.value)} placeholder="https://drive.google.com/file/d/..."/>
      <div style={{fontSize:11,color:"#aaa",marginTop:3}}>Incolla il link di condivisione di un file già presente su Drive</div>
    </div>

    <div className="fg"><label className="fl">Nome documento *</label><input className="fi" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Es. Tessera sanitaria Marco"/></div>
    <div className="fr">
      <div className="fg"><label className="fl">Tipo</label><select className="fi" value={f.type} onChange={e=>s("type",e.target.value)}><option value="pdf">PDF</option><option value="img">Immagine</option><option value="note">Nota</option><option value="folder">Cartella</option></select></div>
      <div className="fg"><label className="fl">Categoria</label><select className="fi" value={f.category} onChange={e=>s("category",e.target.value)}>{CATS.filter(c=>c!=="Tutte").map(c=><option key={c}>{c}</option>)}</select></div>
    </div>
    <div className="fr">
      <div className="fg"><label className="fl">Membro</label><select className="fi" value={f.person} onChange={e=>s("person",e.target.value)}><option value="">Famiglia</option>{family.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div className="fg"><label className="fl">Data documento</label><input type="date" className="fi" value={f.date} onChange={e=>s("date",e.target.value)}/></div>
    </div>
    <div className="fg">
      <label className="fl">Data scadenza (opzionale)</label>
      <input type="date" className="fi" value={f.expiry} onChange={e=>s("expiry",e.target.value)}/>
      {f.expiry&&<div style={{fontSize:11,color:"#1D9E75",marginTop:3}}>💡 Dopo il salvataggio puoi aggiungere questa scadenza a Google Calendar direttamente dall'archivio</div>}
    </div>
    <div className="fa">
      <button className="btn" onClick={onClose}>Annulla</button>
      <button className="btn btn-p" onClick={submit}><i className="ti ti-plus"/> Aggiungi</button>
    </div>
  </Modal>);
}

function AddMedModal({onClose}){
  const{addMed,family}=useF();
  const[f,sf]=useState({name:"",person:family[0]?.id||"",category:"Altro",times:["08:00"],notes:"",startDate:new Date().toISOString().slice(0,10),endDate:"",producerUrl:"",active:true,attachments:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const addT=()=>sf(p=>({...p,times:[...p.times,"12:00"]}));
  const setT=(i,v)=>sf(p=>({...p,times:p.times.map((t,j)=>j===i?v:t)}));
  const delT=i=>sf(p=>({...p,times:p.times.filter((_,j)=>j!==i)}));
  return(<Modal title="💊 Nuovo farmaco" onClose={onClose}>
    <div className="fg"><label className="fl">Nome farmaco *</label><input className="fi" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Es. Amoxicillina 500mg"/></div>
    <div className="fr">
      <div className="fg"><label className="fl">Paziente</label><select className="fi" value={f.person} onChange={e=>s("person",e.target.value)}>{family.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div className="fg"><label className="fl">Categoria</label><select className="fi" value={f.category} onChange={e=>s("category",e.target.value)}>{MED_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
    </div>
    <div className="fg"><label className="fl">Orari di assunzione</label>
      {f.times.map((t,i)=>(<div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}><input type="time" className="fi" value={t} onChange={e=>setT(i,e.target.value)} style={{flex:1}}/>{f.times.length>1&&<button className="btn btn-s btn-d" onClick={()=>delT(i)}><i className="ti ti-x"/></button>}</div>))}
      <button className="btn btn-s" onClick={addT}><i className="ti ti-plus"/> Aggiungi orario</button>
    </div>
    <div className="fr">
      <div className="fg"><label className="fl">Inizio</label><input type="date" className="fi" value={f.startDate} onChange={e=>s("startDate",e.target.value)}/></div>
      <div className="fg"><label className="fl">Fine (vuoto=cronica)</label><input type="date" className="fi" value={f.endDate} onChange={e=>s("endDate",e.target.value)}/></div>
    </div>
    <div className="fg"><label className="fl">Note</label><input className="fi" value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Es. Con cibo, a digiuno..."/></div>
    <div className="fg"><label className="fl">Link produttore</label><input className="fi" value={f.producerUrl} onChange={e=>s("producerUrl",e.target.value)} placeholder="https://..."/></div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={()=>{if(f.name){addMed(f);onClose();}}}><i className="ti ti-plus"/> Aggiungi</button></div>
  </Modal>);
}

function AddVisitModal({onClose}){
  const{addVisit,family}=useF();
  const[f,sf]=useState({title:"",person:family[0]?.id||"",doctor:"",location:"",date:"",time:"10:00",status:"new",attachments:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  return(<Modal title="🏥 Nuova visita" onClose={onClose}>
    <div className="fg"><label className="fl">Tipo visita *</label><input className="fi" value={f.title} onChange={e=>s("title",e.target.value)} placeholder="Es. Cardiologo, Pediatra..."/></div>
    <div className="fr">
      <div className="fg"><label className="fl">Paziente</label><select className="fi" value={f.person} onChange={e=>s("person",e.target.value)}>{family.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div className="fg"><label className="fl">Stato</label><select className="fi" value={f.status} onChange={e=>s("status",e.target.value)}><option value="new">Nuovo</option><option value="confirmed">Confermata</option><option value="pending">Da confermare</option></select></div>
    </div>
    <div className="fg"><label className="fl">Medico / Struttura</label><input className="fi" value={f.doctor} onChange={e=>s("doctor",e.target.value)} placeholder="Es. Dott. Ferrara"/></div>
    <div className="fg"><label className="fl">Indirizzo</label><input className="fi" value={f.location} onChange={e=>s("location",e.target.value)} placeholder="Es. Via Roma 4"/></div>
    <div className="fr">
      <div className="fg"><label className="fl">Data *</label><input type="date" className="fi" value={f.date} onChange={e=>s("date",e.target.value)}/></div>
      <div className="fg"><label className="fl">Ora</label><input type="time" className="fi" value={f.time} onChange={e=>s("time",e.target.value)}/></div>
    </div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={()=>{if(f.title&&f.date){addVisit(f);onClose();}}}><i className="ti ti-plus"/> Aggiungi</button></div>
  </Modal>);
}

function AddMemberModal({onClose,editing}){
  const{addMember,updateMember}=useF();
  const[f,sf]=useState(editing||{name:"",initials:"",role:"",bday:"",blood:"",cf:"",phone:"",color:COLORS[0].c,bg:COLORS[0].bg});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const selColor=({c,bg})=>sf(p=>({...p,color:c,bg}));
  const submit=()=>{
    if(!f.name)return;
    if(editing){updateMember(editing.id,f);}else{addMember(f);}
    onClose();
  };
  return(<Modal title={editing?"✏️ Modifica membro":"👤 Nuovo membro famiglia"} onClose={onClose}>
    <div className="fr">
      <div className="fg"><label className="fl">Nome *</label><input className="fi" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Es. Marco"/></div>
      <div className="fg"><label className="fl">Iniziali</label><input className="fi" value={f.initials} onChange={e=>s("initials",e.target.value.slice(0,2).toUpperCase())} placeholder="MA" maxLength={2}/></div>
    </div>
    <div className="fr">
      <div className="fg"><label className="fl">Ruolo</label><input className="fi" value={f.role} onChange={e=>s("role",e.target.value)} placeholder="Es. Padre, Figlio..."/></div>
      <div className="fg"><label className="fl">Data di nascita</label><input type="date" className="fi" value={f.bday} onChange={e=>s("bday",e.target.value)}/></div>
    </div>
    <div className="fr">
      <div className="fg"><label className="fl">Gruppo sanguigno</label><input className="fi" value={f.blood} onChange={e=>s("blood",e.target.value)} placeholder="A+, O-, ..."/></div>
      <div className="fg"><label className="fl">Telefono</label><input className="fi" value={f.phone} onChange={e=>s("phone",e.target.value)} placeholder="333 1234567"/></div>
    </div>
    <div className="fg"><label className="fl">Codice fiscale</label><input className="fi" value={f.cf} onChange={e=>s("cf",e.target.value.toUpperCase())} placeholder="MRCVRD83D15H501X" style={{fontFamily:"monospace"}}/></div>
    <div className="fg"><label className="fl">Colore identificativo</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
        {COLORS.map((col,i)=>(<div key={i} className={`color-swatch ${f.color===col.c?"sel":""}`} style={{background:col.c}} onClick={()=>selColor(col)}/>))}
      </div>
    </div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={submit}><i className="ti ti-check"/> {editing?"Salva modifiche":"Aggiungi"}</button></div>
  </Modal>);
}

function AddExpenseModal({trip,onClose}){
  const{addExpense}=useF();
  const[f,sf]=useState({desc:"",cat:"transport",amount:"",date:new Date().toISOString().slice(0,10),person:""});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  return(<Modal title={`💶 Nuova spesa — ${trip.emoji} ${trip.name}`} onClose={onClose}>
    <div className="fg"><label className="fl">Descrizione *</label><input className="fi" value={f.desc} onChange={e=>s("desc",e.target.value)} placeholder="Es. Voli A/R, Hotel, Cena..."/></div>
    <div className="fr">
      <div className="fg"><label className="fl">Categoria</label><select className="fi" value={f.cat} onChange={e=>s("cat",e.target.value)}>{Object.entries(EXP_CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
      <div className="fg"><label className="fl">Importo (€) *</label><input type="number" className="fi" value={f.amount} onChange={e=>s("amount",+e.target.value)} placeholder="0.00"/></div>
    </div>
    <div className="fg"><label className="fl">Data</label><input type="date" className="fi" value={f.date} onChange={e=>s("date",e.target.value)}/></div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={()=>{if(f.desc&&f.amount){addExpense(trip.id,f);onClose();}}}><i className="ti ti-plus"/> Aggiungi spesa</button></div>
  </Modal>);
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR + HEADER
═══════════════════════════════════════════════════════════════ */
const NAV=[
  {id:"dashboard",label:"Dashboard",        icon:"ti-layout-dashboard"},
  {id:"archive",  label:"Archivio",          icon:"ti-folders"},
  {id:"health",   label:"Salute & Terapie",  icon:"ti-heart-rate-monitor"},
  {id:"travel",   label:"Viaggi",             icon:"ti-plane"},
  {id:"family",   label:"Membri famiglia",    icon:"ti-users"},
  {id:"expenses", label:"Spese di viaggio",   icon:"ti-cash"},
  {id:"guide",    label:"📖 Guida setup",     icon:"ti-help-circle"},
];
const PAGE_TITLE={dashboard:"Dashboard",archive:"Archivio Digitale",health:"Salute & Terapie",travel:"Viaggi",family:"Membri Famiglia",expenses:"Spese di Viaggio",guide:"Guida all'installazione"};

function Sidebar({tab,setTab,open}){
  const{docs,gConn,setGConn}=useF();
  const expiring=docs.filter(d=>{const dy=daysUntil(d.expiry);return dy!==null&&dy>=0&&dy<=60;}).length;
  return(
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">🏠</div>
        {open&&<div><div className="logo-name">Family Hub</div><div className="logo-tagline">drive & care</div></div>}
      </div>
      <div className="sidebar-nav">
        {NAV.map(n=>(
          <button key={n.id} className={`nav-item ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)} title={!open?n.label:undefined}>
            <i className={`ti ${n.icon} nav-icon`}/>
            {open&&<span>{n.label}</span>}
            {open&&n.id==="archive"&&expiring>0&&<span className="nav-badge">{expiring}</span>}
            {open&&n.id==="guide"&&<span className="nav-badge" style={{background:"var(--blue-dark)"}}>new</span>}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className={`g-btn ${gConn?"connected":""}`} onClick={()=>setGConn(v=>!v)}>
          <i className="ti ti-brand-google" style={{fontSize:15}}/>
          {open&&<span>{gConn?"Google connesso ✓":"Connetti Google"}</span>}
        </button>
      </div>
    </nav>
  );
}

function Header({tab,open,setOpen}){
  const{family,gConn}=useF();
  return(
    <header className="header">
      <button className="hdr-toggle" onClick={()=>setOpen(v=>!v)}><i className={`ti ${open?"ti-layout-sidebar-left-collapse":"ti-layout-sidebar-left-expand"}`}/></button>
      <div className="hdr-title">{PAGE_TITLE[tab]}</div>
      <div className="hdr-spacer"/>
      <div className="family-avatars">{family.map(m=>(<div key={m.id} className="av-chip" style={{background:m.bg,color:m.color}} title={m.name}>{m.initials}</div>))}</div>
      {gConn&&<div className="sync-badge"><i className="ti ti-check" style={{fontSize:12}}/> Drive & Calendar</div>}
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
function Dashboard(){
  const{docs,meds,visits,trips,family,gConn,setGConn}=useF();
  const expiring=docs.filter(d=>{const dy=daysUntil(d.expiry);return dy!==null&&dy>=0&&dy<=90;});
  const todayMeds=meds.filter(m=>m.active);
  const upVisits=[...visits].sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);
  const imminent=trips.filter(t=>t.status==="imminent");
  const reminders=[
    ...todayMeds.flatMap(m=>m.times.map(t=>({text:`${getFm(family,m.person)?.name||m.person} — ${m.name}`,when:`ore ${t}`,color:"#E24B4A"}))),
    ...expiring.slice(0,2).map(d=>({text:`Scadenza: ${d.name}`,when:`${daysUntil(d.expiry)} gg`,color:"#EF9F27"})),
    ...imminent.flatMap(t=>t.reminders.map(r=>({...r,text:`${t.name}: ${r.text}`}))),
  ].slice(0,7);
  return(
    <div>
      {!gConn&&(<div className="gb"><i className="ti ti-brand-google" style={{fontSize:22,color:"#4285F4",flexShrink:0}}/><div className="gb-t"><strong>Connetti Google per tutte le funzioni</strong><span>Drive per i documenti · Calendar per promemoria farmaci e visite</span></div><button className="btn btn-p btn-s" onClick={()=>setGConn(true)}><i className="ti ti-plug"/> Connetti (demo)</button></div>)}
      <div className="g4">
        <div className="stat accent"><div className="stat-n">{docs.length}</div><div className="stat-l"><i className="ti ti-files"/>Documenti</div></div>
        <div className="stat"><div className="stat-n">{todayMeds.length}</div><div className="stat-l"><i className="ti ti-pill"/>Farmaci attivi</div></div>
        <div className={`stat ${expiring.length>0?"alert":""}`}><div className="stat-n" style={expiring.length>0?{color:"#E24B4A"}:{}}>{expiring.length}</div><div className="stat-l"><i className="ti ti-clock"/>Scadenze vicine</div></div>
        <div className="stat"><div className="stat-n">{trips.length}</div><div className="stat-l"><i className="ti ti-plane"/>Viaggi</div></div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-title"><i className="ti ti-bell"/>Promemoria del giorno</div>
          {reminders.length===0?<div className="empty"><i className="ti ti-checks"/><p>Nessun promemoria oggi</p></div>
            :reminders.map((r,i)=>(<div key={i} className="ri"><div className="rd" style={{background:r.color}}/><div style={{flex:1,fontSize:13}}>{r.text}</div><div className="rw">{r.when}</div></div>))}
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-calendar-event"/>Prossime visite</div>
          {upVisits.length===0?<div className="empty"><i className="ti ti-calendar-off"/><p>Nessuna visita pianificata</p></div>
            :upVisits.map(v=>{const d=new Date(v.date),fm=getFm(family,v.person);return(
              <div key={v.id} className="vi">
                <div className="vi-date"><div className="vi-day">{d.getDate().toString().padStart(2,"0")}</div><div className="vi-mon">{d.toLocaleDateString("it-IT",{month:"short"})}</div></div>
                <div style={{flex:1}}><div className="vi-ttl">{v.title} — <span style={{color:fm?.color}}>{fm?.name}</span></div><div className="vi-sub">{v.doctor} · ore {v.time}</div></div>
                <StatusPill s={v.status}/>
              </div>
            );})}
        </div>
      </div>
      {expiring.length>0&&(<div className="card"><div className="card-title"><i className="ti ti-alert-triangle"/>Documenti in scadenza</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{expiring.map(d=>(<div key={d.id} className="doc-item" style={{flex:"1",minWidth:200}}><div className={`doc-ic ${d.type}`}><i className={`ti ${docIcon[d.type]||"ti-file"}`}/></div><div className="doc-nm">{d.name}</div><ExpiryPill days={daysUntil(d.expiry)}/></div>))}</div></div>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ARCHIVE
═══════════════════════════════════════════════════════════════ */
function DocPreviewModal({doc,onClose}){
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:640}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:600}}>{doc.name}</div>
          <button className="btn-ic btn" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        {doc.preview&&<img src={doc.preview} alt={doc.name} style={{width:"100%",borderRadius:8,objectFit:"contain",maxHeight:340,background:"#f5f5f5"}}/>}
        {!doc.preview&&doc.type==="pdf"&&<div style={{textAlign:"center",padding:"2rem",background:"#fafbfa",borderRadius:8,border:"1px solid #eee"}}><i className="ti ti-file-type-pdf" style={{fontSize:48,color:"#D85A30",display:"block",marginBottom:8}}/><div style={{fontSize:13,color:"#888"}}>Anteprima PDF non disponibile in demo<br/>Con Google Drive verrà visualizzato inline</div></div>}
        <div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
          {doc.driveUrl&&<a href={doc.driveUrl} target="_blank" rel="noreferrer" className="btn btn-p btn-s"><i className="ti ti-brand-google-drive"/> Apri su Drive</a>}
          <button className="btn btn-s" onClick={()=>openCalendarEvent(doc)} disabled={!doc.expiry}><i className="ti ti-calendar-plus"/> {doc.expiry?`Scadenza in Calendar`:"Nessuna scadenza"}</button>
          <div style={{flex:1}}/>
          <div style={{fontSize:12,color:"#aaa",alignSelf:"center"}}>{doc.category}{doc.size?` · ${doc.size}`:""}</div>
        </div>
      </div>
    </div>
  );
}

function Archive(){
  const{docs,addDoc,removeDoc,family,gConn}=useF();
  const[cat,setCat]=useState("Tutte");
  const[per,setPer]=useState("tutti");
  const[search,setSearch]=useState("");
  const[modal,setModal]=useState(false);
  const[preview,setPreview]=useState(null);
  const[draggingZone,setDraggingZone]=useState(false);

  const filtered=docs.filter(d=>{
    if(cat!=="Tutte"&&d.category!==cat)return false;
    if(per!=="tutti"&&d.person!==per)return false;
    if(search&&!d.name.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  const expiring=[...docs].filter(d=>{const dy=daysUntil(d.expiry);return dy!==null&&dy>=0&&dy<=90;}).sort((a,b)=>daysUntil(a.expiry)-daysUntil(b.expiry));

  /* drag-and-drop sulla zona principale → apre modal precompilato */
  const onZoneDrop=e=>{
    e.preventDefault();setDraggingZone(false);
    const file=e.dataTransfer.files[0];
    if(file){setModal(true);}  /* AddDocModal gestirà il file internamente */
  };

  return(
    <div>
      {modal&&<AddDocModal onClose={()=>setModal(false)}/>}
      {preview&&<DocPreviewModal doc={preview} onClose={()=>setPreview(null)}/>}

      {/* banner Google Drive */}
      {gConn
        ?(<div className="gb"><i className="ti ti-brand-google-drive" style={{fontSize:22,color:"#34A853",flexShrink:0}}/><div className="gb-t"><strong>Google Drive connesso</strong><span>I file caricati vengono archiviati su Drive e accessibili da tutti i dispositivi</span></div><button className="btn btn-s" onClick={()=>window.open("https://drive.google.com","_blank")}><i className="ti ti-external-link"/> Apri Drive</button></div>)
        :(<div style={{background:"#f8faf8",border:"1px solid #e0e8e0",borderRadius:12,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:"1rem",fontSize:13,color:"#555"}}><i className="ti ti-info-circle" style={{color:"var(--green)",fontSize:18,flexShrink:0}}/><span>Connetti Google nella barra laterale per caricare i file su Drive e aggiungere le scadenze a Calendar.</span></div>)
      }

      <div className="g2">
        {/* ── colonna sinistra: lista documenti ── */}
        <div>
          <div className="sh">
            <div className="st"><i className="ti ti-folders"/>Documenti ({filtered.length})</div>
            <button className="btn btn-p btn-s" onClick={()=>setModal(true)}><i className="ti ti-plus"/>Aggiungi</button>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            <input className="fi" style={{flex:1,minWidth:150}} placeholder="🔍 Cerca..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="fi" style={{width:"auto"}} value={per} onChange={e=>setPer(e.target.value)}>
              <option value="tutti">Tutti</option>
              {family.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="itabs">{CATS.map(c=><button key={c} className={`itab ${cat===c?"active":""}`} onClick={()=>setCat(c)}>{c}</button>)}</div>

          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {filtered.length===0
              ?<div className="empty"><i className="ti ti-file-off"/><p>Nessun documento trovato</p></div>
              :filtered.map(d=>{
                const fm=getFm(family,d.person);
                const hasDrive=!!d.driveUrl;
                const hasPreview=!!d.preview;
                return(
                  <div key={d.id} className="doc-item" style={{cursor:"pointer"}} onClick={()=>setPreview(d)}>
                    {/* icona / thumbnail */}
                    {hasPreview
                      ?<img src={d.preview} alt={d.name} style={{width:30,height:30,borderRadius:6,objectFit:"cover",flexShrink:0}}/>
                      :<div className={`doc-ic ${d.type}`}><i className={`ti ${docIcon[d.type]||"ti-file"}`}/></div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div className="doc-nm">{d.name}</div>
                      <div style={{fontSize:11,color:"#aaa",display:"flex",gap:6,alignItems:"center",marginTop:1}}>
                        <span>{d.category}{fm?` · ${fm.name}`:""}</span>
                        {d.size&&<span>· {d.size}</span>}
                        {hasDrive&&<span style={{color:"#34A853",display:"flex",alignItems:"center",gap:2}}><i className="ti ti-brand-google-drive" style={{fontSize:11}}/>Drive</span>}
                      </div>
                    </div>
                    {d.expiry&&<ExpiryPill days={daysUntil(d.expiry)}/>}
                    <div style={{display:"flex",gap:2}} onClick={e=>e.stopPropagation()}>
                      {hasDrive&&<button className="btn-ic btn" title="Apri su Drive" onClick={()=>window.open(d.driveUrl,"_blank")}><i className="ti ti-brand-google-drive" style={{color:"#34A853"}}/></button>}
                      {d.expiry&&<button className="btn-ic btn" title="Aggiungi scadenza a Calendar" onClick={()=>openCalendarEvent(d)}><i className="ti ti-calendar-plus" style={{color:"var(--blue-dark)"}}/></button>}
                      <button className="btn-ic btn btn-d" onClick={()=>removeDoc(d.id)}><i className="ti ti-trash"/></button>
                    </div>
                  </div>
                );
              })
            }
          </div>

          {/* zona drag-and-drop */}
          <div style={{marginTop:14}}
            onDragOver={e=>{e.preventDefault();setDraggingZone(true);}}
            onDragLeave={()=>setDraggingZone(false)}
            onDrop={onZoneDrop}
            onClick={()=>setModal(true)}
          >
            <div className="upz" style={draggingZone?{background:"#E1F5EE",borderColor:"#1D9E75"}:{}}>
              <i className="ti ti-cloud-upload"/>
              {gConn?"Trascina qui o clicca per caricare su Google Drive":"Trascina qui o clicca per aggiungere un documento"}
              <br/><span style={{fontSize:11}}>PDF, immagini, note · puoi anche incollare un link Drive</span>
            </div>
          </div>
        </div>

        {/* ── colonna destra: scadenzario + appunti ── */}
        <div>
          <div className="sh"><div className="st"><i className="ti ti-alarm"/>Scadenzario</div></div>
          {expiring.length===0
            ?<div className="card"><div className="empty"><i className="ti ti-checks"/><p>Nessuna scadenza nei prossimi 90 giorni</p></div></div>
            :<div className="card" style={{padding:0,overflow:"hidden"}}>
              {expiring.map((d,i)=>{
                const dy=daysUntil(d.expiry),dt=new Date(d.expiry),fm=getFm(family,d.person),urg=dy<=30;
                return(
                  <div key={d.id} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 14px",borderBottom:i<expiring.length-1?"1px solid #f0f0f0":"none",background:urg?"#fffbfb":"#fff"}}>
                    <div className="vi-date" style={urg?{background:"#fff0f0"}:{}}>
                      <div className="vi-day" style={urg?{color:"#A32D2D"}:{}}>{dt.getDate().toString().padStart(2,"0")}</div>
                      <div className="vi-mon">{dt.toLocaleDateString("it-IT",{month:"short"})}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:500}}>{d.name}</div>
                      <div style={{fontSize:12,color:"#888"}}>{d.category}{fm?` · ${fm.name}`:""}</div>
                    </div>
                    <ExpiryPill days={dy}/>
                    <div style={{display:"flex",gap:4}}>
                      {d.driveUrl&&<button className="btn btn-s" title="Apri su Drive" onClick={()=>window.open(d.driveUrl,"_blank")}><i className="ti ti-brand-google-drive" style={{color:"#34A853"}}/></button>}
                      <button
                        className="btn btn-s"
                        title="Aggiungi promemoria scadenza a Google Calendar"
                        onClick={()=>openCalendarEvent(d)}
                        style={{color:"var(--blue-dark)"}}
                      >
                        <i className="ti ti-calendar-plus"/> Calendar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          }

          <div className="sh" style={{marginTop:"1.25rem"}}>
            <div className="st"><i className="ti ti-notes"/>Appunti rapidi</div>
            <button className="btn btn-p btn-s"><i className="ti ti-plus"/>Nota</button>
          </div>
          <div className="card">
            <textarea className="fi" rows={5} placeholder="Scrivi un appunto per la famiglia..." style={{resize:"vertical",fontSize:13}}/>
            <div style={{marginTop:8,display:"flex",justifyContent:"flex-end"}}>
              <button className="btn btn-p btn-s"><i className="ti ti-device-floppy"/> Salva</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEALTH
═══════════════════════════════════════════════════════════════ */
function Health(){
  const{meds,visits,therapies,family,addMed,removeMed,addVisit,removeVisit,gConn}=useF();
  const[tab,setTab]=useState("meds");
  const[per,setPer]=useState("tutti");
  const[modMed,setModMed]=useState(false);
  const[modVis,setModVis]=useState(false);
  const fMeds=meds.filter(m=>per==="tutti"||m.person===per);
  const fVisits=[...visits].filter(v=>per==="tutti"||v.person===per).sort((a,b)=>new Date(a.date)-new Date(b.date));
  return(
    <div>
      {modMed&&<AddMedModal onClose={()=>setModMed(false)}/>}
      {modVis&&<AddVisitModal onClose={()=>setModVis(false)}/>}
      <div style={{display:"flex",gap:12,marginBottom:"1rem",alignItems:"center",flexWrap:"wrap"}}>
        <div className="itabs" style={{marginBottom:0}}>
          <button className={`itab ${tab==="meds"?"active":""}`} onClick={()=>setTab("meds")}>💊 Farmaci ({meds.filter(m=>m.active).length})</button>
          <button className={`itab ${tab==="visits"?"active":""}`} onClick={()=>setTab("visits")}>🏥 Visite ({visits.length})</button>
          <button className={`itab ${tab==="ther"?"active":""}`} onClick={()=>setTab("ther")}>🩺 Terapie ({therapies.length})</button>
        </div>
        <div style={{flex:1}}/>
        <select className="fi" style={{width:"auto"}} value={per} onChange={e=>setPer(e.target.value)}><option value="tutti">Tutta la famiglia</option>{family.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
      </div>
      {tab==="meds"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-pill"/>Farmaci</div><button className="btn btn-p btn-s" onClick={()=>setModMed(true)}><i className="ti ti-plus"/>Aggiungi</button></div>
        {fMeds.length===0?<div className="card"><div className="empty"><i className="ti ti-pill-off"/><p>Nessun farmaco registrato</p></div></div>
          :fMeds.map(m=>{const fm=getFm(family,m.person);return(
            <div key={m.id} className="med">
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                <div><div className="med-nm">{m.name}</div><div className="med-pr" style={{color:fm?.color}}><i className="ti ti-user" style={{fontSize:11}}/> {fm?.name||m.person} · {m.endDate?"in corso":"cronico"}</div></div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}><span className={`pill ${CAT_PILL[m.category]||"pill-gr"}`}>{m.category}</span><button className="btn-ic btn btn-d" onClick={()=>removeMed(m.id)}><i className="ti ti-trash"/></button></div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{m.times.map((t,i)=><div key={i} className="tc"><i className={`ti ${timeIcon(parseInt(t))}`}/>{t}</div>)}</div>
              {m.notes&&<div className="med-nt">{m.notes}</div>}
              <div className="med-lk">
                {m.attachments.map((a,i)=><span key={i} className="lk-sm"><i className={`ti ${a.type==="pdf"?"ti-file-type-pdf":"ti-photo"}`}/>{a.name}</span>)}
                {m.producerUrl&&<span className="lk-sm"><i className="ti ti-external-link"/>Scheda produttore</span>}
                <div style={{flex:1}}/>
                {gConn&&<button className="btn btn-s"><i className="ti ti-calendar-plus"/>Calendar</button>}
                <button className="btn btn-s"><i className="ti ti-upload"/>Allega</button>
              </div>
            </div>
          );})}
      </div>)}
      {tab==="visits"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-stethoscope"/>Visite specialistiche</div><button className="btn btn-p btn-s" onClick={()=>setModVis(true)}><i className="ti ti-plus"/>Aggiungi</button></div>
        {fVisits.length===0?<div className="card"><div className="empty"><i className="ti ti-calendar-off"/><p>Nessuna visita</p></div></div>
          :<div className="card" style={{padding:0,overflow:"hidden"}}>
            {fVisits.map((v,i)=>{const d=new Date(v.date),fm=getFm(family,v.person);return(
              <div key={v.id} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 16px",borderBottom:i<fVisits.length-1?"1px solid #f0f0f0":"none"}}>
                <div className="vi-date"><div className="vi-day">{d.getDate().toString().padStart(2,"0")}</div><div className="vi-mon">{d.toLocaleDateString("it-IT",{month:"short"})}</div></div>
                <div style={{flex:1}}><div className="vi-ttl">{v.title} — <span style={{color:fm?.color}}>{fm?.name}</span></div><div className="vi-sub">{v.doctor}{v.location?` · ${v.location}`:""} · ore {v.time}</div>{v.attachments?.length>0&&<div style={{marginTop:4,display:"flex",gap:8}}>{v.attachments.map((a,j)=><span key={j} className="lk-sm"><i className={`ti ${a.type==="pdf"?"ti-file-type-pdf":"ti-photo"}`}/>{a.name}</span>)}</div>}</div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}><StatusPill s={v.status}/>{gConn&&<button className="btn btn-s"><i className="ti ti-calendar-plus"/></button>}<button className="btn btn-s"><i className="ti ti-upload"/></button><button className="btn-ic btn btn-d" onClick={()=>removeVisit(v.id)}><i className="ti ti-trash"/></button></div>
              </div>
            );})}
          </div>}
      </div>)}
      {tab==="ther"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-activity"/>Terapie in corso</div><button className="btn btn-p btn-s"><i className="ti ti-plus"/>Aggiungi</button></div>
        {therapies.length===0?<div className="card"><div className="empty"><i className="ti ti-activity-off"/><p>Nessuna terapia</p></div></div>
          :therapies.map(t=>{const fm=getFm(family,t.person),pct=t.total?Math.round(t.done/t.total*100):null;return(
            <div key={t.id} className="card" style={{marginBottom:10}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:40,height:40,borderRadius:10,background:fm?.bg||"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-massage" style={{fontSize:20,color:fm?.color||"#888"}}/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:500,fontSize:15}}>{t.title} — <span style={{color:fm?.color}}>{fm?.name}</span></div>
                  <div style={{fontSize:12,color:"#888",marginTop:2}}>{t.doctor} · {t.schedule}</div>
                  {pct!==null&&(<div style={{marginTop:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888",marginBottom:4}}><span>Progresso: {t.done}/{t.total} sedute</span><span>{pct}%</span></div><div className="pb"><div className="pf" style={{width:`${pct}%`}}/></div></div>)}
                </div>
                <div style={{display:"flex",gap:6}}>{gConn&&<button className="btn btn-s"><i className="ti ti-calendar-plus"/></button>}<button className="btn btn-s"><i className="ti ti-edit"/></button></div>
              </div>
            </div>
          );})}
      </div>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRAVEL — sezione completa con dettaglio viaggio
═══════════════════════════════════════════════════════════════ */
const openCalCL=(text,dateStr)=>{if(!dateStr)return;const ymd=dateStr.replace(/-/g,"").slice(0,8);window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${ymd}/${ymd}`,"_blank");};

function AddTripModal({onClose}){
  const{addTrip,family}=useF();
  const[f,sf]=useState({name:"",emoji:"✈️",dateFrom:"",dateTo:"",persons:[],status:"planning",budget:0,notes:"",flights:[],hotels:[],transports:[],itinerary:[],packing:[{id:"pk1",cat:"Documenti",items:[{t:"Carta identità / passaporto",done:false},{t:"Tessera sanitaria",done:false}]},{id:"pk2",cat:"Abbigliamento",items:[{t:"Abbigliamento",done:false},{t:"Scarpe comode",done:false}]},{id:"pk3",cat:"Farmaci",items:[{t:"Farmaci personali",done:false},{t:"Kit pronto soccorso",done:false}]}],checklist:[{id:"c1",text:"Trasporto prenotato",done:false},{id:"c2",text:"Alloggio confermato",done:false},{id:"c3",text:"Check-in effettuato",done:false},{id:"c4",text:"Biglietti scaricati",done:false},{id:"c5",text:"Valuta / carte",done:false},{id:"c6",text:"Assicurazione viaggio",done:false}],docs:[],reminders:[],expenses:[],diary:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const tog=id=>s("persons",f.persons.includes(id)?f.persons.filter(p=>p!==id):[...f.persons,id]);
  return(<Modal title="✈️ Nuovo viaggio" onClose={onClose}>
    <div className="fr">
      <div className="fg"><label className="fl">Emoji</label><input className="fi" value={f.emoji} onChange={e=>s("emoji",e.target.value)} style={{textAlign:"center",fontSize:20}}/></div>
      <div className="fg" style={{flex:3}}><label className="fl">Destinazione *</label><input className="fi" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Es. Barcellona, Trentino..."/></div>
    </div>
    <div className="fr">
      <div className="fg"><label className="fl">Dal</label><input type="date" className="fi" value={f.dateFrom} onChange={e=>s("dateFrom",e.target.value)}/></div>
      <div className="fg"><label className="fl">Al</label><input type="date" className="fi" value={f.dateTo} onChange={e=>s("dateTo",e.target.value)}/></div>
    </div>
    <div className="fr">
      <div className="fg"><label className="fl">Stato</label><select className="fi" value={f.status} onChange={e=>s("status",e.target.value)}><option value="planning">Pianificazione</option><option value="imminent">In arrivo</option><option value="past">Passato</option></select></div>
      <div className="fg"><label className="fl">Budget (€)</label><input type="number" className="fi" value={f.budget} onChange={e=>s("budget",+e.target.value)}/></div>
    </div>
    <div className="fg"><label className="fl">Note</label><input className="fi" value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Es. Portare adattatori..."/></div>
    <div className="fg"><label className="fl">Chi partecipa</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{family.map(m=>(<div key={m.id} onClick={()=>tog(m.id)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${f.persons.includes(m.id)?m.color:"#ddd"}`,background:f.persons.includes(m.id)?m.bg:"#fff",color:f.persons.includes(m.id)?m.color:"#888",cursor:"pointer",fontSize:13,fontWeight:500,userSelect:"none"}}>{m.name}</div>))}</div>
    </div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={()=>{if(f.name){addTrip({...f,dates:f.dateFrom&&f.dateTo?`${f.dateFrom} → ${f.dateTo}`:f.name});onClose();}}}><i className="ti ti-plus"/> Crea viaggio</button></div>
  </Modal>);
}

function TripDiaryModal({onClose,tripId}){
  const{addDiaryEntry,family}=useF();
  const[f,sf]=useState({location:"",date:new Date().toISOString().slice(0,10),title:"",text:"",type:"giornata",mood:"😊",persons:[],photos:0});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const tog=id=>s("persons",f.persons.includes(id)?f.persons.filter(p=>p!==id):[...f.persons,id]);
  const MOODS=["😊","😍","😎","🥰","😮","😴","🤩","😂"];
  const TYPES=["giornata","escursione","ristorante","museo","avventura","shopping","relax","altro"];
  return(<Modal title="📖 Nuova voce diario" onClose={onClose}>
    <div className="fr">
      <div className="fg"><label className="fl">Luogo *</label><input className="fi" value={f.location} onChange={e=>s("location",e.target.value)} placeholder="Es. Barcellona..."/></div>
      <div className="fg"><label className="fl">Data</label><input type="date" className="fi" value={f.date} onChange={e=>s("date",e.target.value)}/></div>
    </div>
    <div className="fr">
      <div className="fg"><label className="fl">Tipo</label><select className="fi" value={f.type} onChange={e=>s("type",e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
      <div className="fg"><label className="fl">Umore</label><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>{MOODS.map(m=><span key={m} onClick={()=>s("mood",m)} style={{fontSize:22,cursor:"pointer",opacity:f.mood===m?1:.3,transition:"opacity .15s"}}>{m}</span>)}</div></div>
    </div>
    <div className="fg"><label className="fl">Titolo *</label><input className="fi" value={f.title} onChange={e=>s("title",e.target.value)} placeholder="Es. Sagrada Família all'alba"/></div>
    <div className="fg"><label className="fl">Racconto</label><textarea className="fi" rows={4} value={f.text} onChange={e=>s("text",e.target.value)} placeholder="Scrivi com'è andata..." style={{resize:"vertical"}}/></div>
    <div className="fg"><label className="fl">Chi c'era</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{family.map(m=>(<div key={m.id} onClick={()=>tog(m.id)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${f.persons.includes(m.id)?m.color:"#ddd"}`,background:f.persons.includes(m.id)?m.bg:"#fff",color:f.persons.includes(m.id)?m.color:"#888",cursor:"pointer",fontSize:13,fontWeight:500,userSelect:"none"}}>{m.name}</div>))}</div></div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={()=>{if(f.title&&f.location){addDiaryEntry(tripId,f);onClose();}}}><i className="ti ti-plus"/> Salva</button></div>
  </Modal>);
}

function TripDetail({trip,onBack}){
  const{toggleCL,togglePacking,toggleFlightCheckin,toggleHotelCheckin,family}=useF();
  const[tab,setTab]=useState("overview");
  const[modDiary,setModDiary]=useState(false);
  const plist=trip.persons.map(id=>getFm(family,id)).filter(Boolean);
  const[pc,pl]=STATUS_TRIP[trip.status]||["pill-gr",trip.status];
  const totalPacking=trip.packing?.reduce((s,pk)=>s+pk.items.length,0)||0;
  const donePacking=trip.packing?.reduce((s,pk)=>s+pk.items.filter(i=>i.done).length,0)||0;
  return(
    <div>
      {modDiary&&<TripDiaryModal onClose={()=>setModDiary(false)} tripId={trip.id}/>}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1rem",flexWrap:"wrap"}}>
        <button className="btn btn-s" onClick={onBack}><i className="ti ti-arrow-left"/> Tutti i viaggi</button>
        <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700}}>{trip.emoji} {trip.name}</div>
        <span className={`pill ${pc}`}>{pl}</span>
        <div style={{flex:1}}/>
        <div style={{fontSize:13,color:"#888"}}>{trip.dates}</div>
        <div style={{display:"flex",gap:4}}>{plist.map(m=><div key={m.id} style={{width:26,height:26,borderRadius:"50%",background:m.bg,color:m.color,fontSize:10,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{m.initials}</div>)}</div>
      </div>
      {trip.notes&&<div style={{background:"#fffbee",border:"1px solid #ffe080",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#6b4e00",marginBottom:"1rem"}}>📝 {trip.notes}</div>}
      <div className="itabs">
        <button className={`itab ${tab==="overview"?"active":""}`} onClick={()=>setTab("overview")}>📋 Riepilogo</button>
        <button className={`itab ${tab==="flights"?"active":""}`} onClick={()=>setTab("flights")}>✈️ Voli/Treni ({trip.flights?.length||0})</button>
        <button className={`itab ${tab==="hotel"?"active":""}`} onClick={()=>setTab("hotel")}>🏨 Hotel ({trip.hotels?.length||0})</button>
        <button className={`itab ${tab==="itinerary"?"active":""}`} onClick={()=>setTab("itinerary")}>🗺️ Itinerario ({trip.itinerary?.length||0}gg)</button>
        <button className={`itab ${tab==="packing"?"active":""}`} onClick={()=>setTab("packing")}>🎒 Bagaglio ({donePacking}/{totalPacking})</button>
        <button className={`itab ${tab==="diary"?"active":""}`} onClick={()=>setTab("diary")}>📖 Diario ({trip.diary?.length||0})</button>
        <button className={`itab ${tab==="deadlines"?"active":""}`} onClick={()=>setTab("deadlines")}>⏰ Scadenze</button>
      </div>

      {tab==="overview"&&(<div className="g2">
        <div>
          <div className="sh"><div className="st"><i className="ti ti-list-check"/>Checklist</div></div>
          <div className="card">
            {trip.checklist.map(c=>(<div key={c.id} className={`ci ${c.done?"done":""}`}><input type="checkbox" checked={c.done} onChange={()=>toggleCL(trip.id,c.id)}/>{c.text}</div>))}
            <div style={{marginTop:12,height:4,background:"#eee",borderRadius:2}}><div style={{height:"100%",borderRadius:2,background:"var(--green)",width:`${Math.round(trip.checklist.filter(c=>c.done).length/trip.checklist.length*100)}%`,transition:"width .3s"}}/></div>
            <div style={{fontSize:12,color:"#888",marginTop:4,textAlign:"right"}}>{trip.checklist.filter(c=>c.done).length}/{trip.checklist.length} completate</div>
          </div>
        </div>
        <div>
          <div className="sh"><div className="st"><i className="ti ti-bell"/>Prossime scadenze</div></div>
          <div className="card">
            {trip.flights?.filter(f=>!f.checkinDone).map(f=>(<div key={f.id} className="ri"><div className="rd" style={{background:"#185FA5"}}/><div style={{flex:1,fontSize:13}}>Check-in {f.type} {f.company} {f.flightNum}</div><div className="rw">{f.checkinOpen}</div><button className="btn btn-s" style={{fontSize:11}} onClick={()=>openCalCL(`Check-in volo ${f.flightNum}`,f.checkinOpen)}><i className="ti ti-calendar-plus"/></button></div>))}
            {trip.hotels?.filter(h=>!h.checkinDone).map(h=>(<div key={h.id} className="ri"><div className="rd" style={{background:"#993556"}}/><div style={{flex:1,fontSize:13}}>Check-in {h.name}</div><div className="rw">{h.checkIn} {h.checkInTime}</div><button className="btn btn-s" style={{fontSize:11}} onClick={()=>openCalCL(`Check-in ${h.name}`,h.checkIn)}><i className="ti ti-calendar-plus"/></button></div>))}
            {trip.reminders?.map((r,i)=>(<div key={i} className="ri"><div className="rd" style={{background:r.color}}/><div style={{flex:1,fontSize:13}}>{r.text}</div><div className="rw">{r.when}</div><button className="btn btn-s" style={{fontSize:11}} onClick={()=>openCalCL(r.text,r.when)}><i className="ti ti-calendar-plus"/></button></div>))}
            {!trip.flights?.length&&!trip.hotels?.length&&!trip.reminders?.length&&<div className="empty"><i className="ti ti-checks"/><p>Nessuna scadenza</p></div>}
          </div>
        </div>
      </div>)}

      {tab==="flights"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-plane"/>Voli & trasporti</div><button className="btn btn-p btn-s"><i className="ti ti-plus"/>Aggiungi volo</button></div>
        {(!trip.flights||trip.flights.length===0)&&<div className="card"><div className="empty"><i className="ti ti-plane-off"/><p>Nessun volo — clicca Aggiungi</p></div></div>}
        {trip.flights?.map(f=>(
          <div key={f.id} className="card" style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>{f.type==="andata"?"🛫":"🛬"} {f.from} → {f.to}<span className={`pill ${f.type==="andata"?"pill-b":"pill-g"}`}>{f.type.toUpperCase()}</span></div>
                <div style={{fontSize:13,color:"#888",marginTop:3}}>{f.company} · {f.flightNum} · {f.date} · Partenza {f.time} → Arrivo {f.arrival}</div>
                {f.seats&&<div style={{fontSize:12,color:"#aaa",marginTop:2}}>Posti: {f.seats}</div>}
              </div>
              <div style={{fontSize:12,color:"#888",textAlign:"right"}}>Ref: <strong>{f.bookingRef}</strong></div>
            </div>
            <div style={{background:f.checkinDone?"#f0faf5":"#fff8f0",border:`1px solid ${f.checkinDone?"#9FE1CB":"#f8c49a"}`,borderRadius:8,padding:"10px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <input type="checkbox" checked={f.checkinDone} onChange={()=>toggleFlightCheckin(trip.id,f.id)} style={{width:16,height:16,accentColor:"var(--green)",cursor:"pointer"}}/>
                <div style={{flex:1}}><div style={{fontWeight:500,fontSize:13}}>Check-in online {f.checkinDone?"✅ Completato":"⏳ Da fare"}</div><div style={{fontSize:11,color:"#888"}}>Apre: {f.checkinOpen} · Scadenza: {f.checkinDeadline}</div></div>
                <button className="btn btn-s" onClick={()=>openCalCL(`Check-in volo ${f.flightNum}`,f.checkinOpen)}><i className="ti ti-calendar-plus"/> Reminder</button>
                {f.bookingUrl&&<a href={f.bookingUrl} target="_blank" rel="noreferrer" className="btn btn-s btn-p"><i className="ti ti-external-link"/> Fai check-in</a>}
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:10}}>{f.bookingUrl&&<a href={f.bookingUrl} target="_blank" rel="noreferrer" className="btn btn-s"><i className="ti ti-external-link"/> Gestisci</a>}<button className="btn btn-s"><i className="ti ti-qrcode"/> Boarding pass</button></div>
          </div>
        ))}
        {trip.transports?.length>0&&(<><div className="sh" style={{marginTop:"1rem"}}><div className="st"><i className="ti ti-bus"/>Trasporti aggiuntivi</div></div>
          <div className="card">{trip.transports.map(t=>(<div key={t.id} className="ri"><div style={{width:30,height:30,borderRadius:8,background:"#E6F1FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{t.type==="treno"?"🚂":t.type==="auto"?"🚗":t.type==="bus"?"🚌":"🚢"}</div><div style={{flex:1}}><div style={{fontWeight:500,fontSize:13}}>{t.desc}</div><div style={{fontSize:11,color:"#888"}}>{t.date} {t.time}{t.notes?` · ${t.notes}`:""}</div></div>{t.cost>0&&<div style={{fontFamily:"var(--fd)",fontWeight:600,fontSize:13}}>€{t.cost}</div>}</div>))}</div>
        </>)}
      </div>)}

      {tab==="hotel"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-building"/>Alloggio</div><button className="btn btn-p btn-s"><i className="ti ti-plus"/>Aggiungi hotel</button></div>
        {(!trip.hotels||trip.hotels.length===0)&&<div className="card"><div className="empty"><i className="ti ti-building-off"/><p>Nessun alloggio — clicca Aggiungi</p></div></div>}
        {trip.hotels?.map(h=>(
          <div key={h.id} className="card" style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
              <div><div style={{fontFamily:"var(--fd)",fontSize:17,fontWeight:700}}>🏨 {h.name} {"⭐".repeat(h.stars||0)}</div><div style={{fontSize:13,color:"#888",marginTop:3}}>{h.address}</div>{h.phone&&<div style={{fontSize:12,color:"#aaa",marginTop:2}}><i className="ti ti-phone" style={{fontSize:11}}/> {h.phone}</div>}</div>
              <div style={{fontSize:12,color:"#888",textAlign:"right"}}>Ref: <strong>{h.bookingRef}</strong></div>
            </div>
            <div style={{display:"flex",gap:12,marginBottom:10}}>
              <div style={{flex:1,background:"#f8faf8",borderRadius:8,padding:"10px 14px",border:"1px solid #eef0ee"}}><div style={{fontSize:11,color:"#888",marginBottom:2}}>CHECK-IN</div><div style={{fontFamily:"var(--fd)",fontWeight:600,fontSize:15}}>{h.checkIn}</div><div style={{fontSize:12,color:"#888"}}>dalle ore {h.checkInTime}</div></div>
              <div style={{flex:1,background:"#f8faf8",borderRadius:8,padding:"10px 14px",border:"1px solid #eef0ee"}}><div style={{fontSize:11,color:"#888",marginBottom:2}}>CHECK-OUT</div><div style={{fontFamily:"var(--fd)",fontWeight:600,fontSize:15}}>{h.checkOut}</div><div style={{fontSize:12,color:"#888"}}>entro ore {h.checkOutTime}</div></div>
            </div>
            <div style={{background:h.checkinDone?"#f0faf5":"#f5f0ff",border:`1px solid ${h.checkinDone?"#9FE1CB":"#c8b4f0"}`,borderRadius:8,padding:"10px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <input type="checkbox" checked={h.checkinDone} onChange={()=>toggleHotelCheckin(trip.id,h.id)} style={{width:16,height:16,accentColor:"var(--green)",cursor:"pointer"}}/>
                <div style={{flex:1}}><div style={{fontWeight:500,fontSize:13}}>Check-in {h.checkinDone?"✅ Confermato":"⏳ Da fare"}</div>{h.notes&&<div style={{fontSize:11,color:"#888"}}>{h.notes}</div>}</div>
                <button className="btn btn-s" onClick={()=>openCalCL(`Check-in ${h.name}`,h.checkIn)}><i className="ti ti-calendar-plus"/> Check-in</button>
                <button className="btn btn-s" onClick={()=>openCalCL(`Check-out ${h.name}`,h.checkOut)}><i className="ti ti-calendar-plus"/> Check-out</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:10}}>{h.bookingUrl&&<a href={h.bookingUrl} target="_blank" rel="noreferrer" className="btn btn-s"><i className="ti ti-external-link"/> Gestisci</a>}<button className="btn btn-s"><i className="ti ti-map-pin"/> Mappa</button></div>
          </div>
        ))}
      </div>)}

      {tab==="itinerary"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-map-2"/>Itinerario giorno per giorno</div><button className="btn btn-p btn-s"><i className="ti ti-plus"/>Aggiungi giorno</button></div>
        {(!trip.itinerary||trip.itinerary.length===0)&&<div className="card"><div className="empty"><i className="ti ti-calendar-off"/><p>Itinerario vuoto — aggiungi i giorni del viaggio</p></div></div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {trip.itinerary?.map((day,i)=>{
            const d=new Date(day.day);
            return(<div key={day.id} className="card">
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{textAlign:"center",background:"var(--green)",color:"#fff",borderRadius:10,padding:"8px 10px",minWidth:52,flexShrink:0}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,lineHeight:1}}>{d.getDate().toString().padStart(2,"0")}</div>
                  <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".04em",opacity:.85}}>{d.toLocaleDateString("it-IT",{month:"short"})}</div>
                  <div style={{fontSize:10,opacity:.7}}>Giorno {i+1}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--fd)",fontWeight:600,fontSize:15,marginBottom:8}}>{day.title}</div>
                  {day.items.map((item,j)=>(<div key={j} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,marginBottom:4}}><div style={{width:6,height:6,borderRadius:"50%",background:"var(--green-mid)",flexShrink:0}}/>{item}</div>))}
                  <button className="btn btn-s" style={{marginTop:8,fontSize:11}}><i className="ti ti-plus"/> Aggiungi attività</button>
                </div>
              </div>
            </div>);
          })}
        </div>
      </div>)}

      {tab==="packing"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-backpack"/>Lista bagaglio</div><div style={{fontSize:13,color:donePacking===totalPacking?"var(--green)":"#888",fontWeight:500}}>{donePacking}/{totalPacking} pronti</div></div>
        <div className="g2">
          {trip.packing?.map(pk=>(
            <div key={pk.id} className="card">
              <div style={{fontFamily:"var(--fd)",fontWeight:600,fontSize:14,marginBottom:10,color:"var(--green-dark)"}}>{pk.cat}</div>
              {pk.items.map((it,idx)=>(<div key={idx} className={`ci ${it.done?"done":""}`}><input type="checkbox" checked={it.done} onChange={()=>togglePacking(trip.id,pk.id,idx)}/>{it.t}</div>))}
              <button className="btn btn-s" style={{marginTop:8,fontSize:11,width:"100%"}}><i className="ti ti-plus"/> Aggiungi voce</button>
            </div>
          ))}
        </div>
      </div>)}

      {tab==="diary"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-book-2"/>Diario del viaggio</div><button className="btn btn-p btn-s" onClick={()=>setModDiary(true)}><i className="ti ti-pencil"/>Scrivi</button></div>
        {(!trip.diary||trip.diary.length===0)?<div className="card"><div className="empty"><i className="ti ti-book-off"/><p>Diario vuoto — inizia a scrivere i ricordi!</p></div></div>
          :<div className="card">{trip.diary.map((e,i)=>{const parts=(e.persons||[]).map(id=>getFm(family,id)).filter(Boolean);return(
            <div key={e.id} className="de" style={{paddingBottom:i<trip.diary.length-1?18:0}}>
              <div className="de-dt">{e.location} · {fmtDate(e.date)} {e.mood&&<span style={{fontSize:16}}>{e.mood}</span>}</div>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}><div className="de-ttl">{e.title}</div><div style={{display:"flex",gap:3}}>{parts.map(m=><div key={m.id} style={{width:20,height:20,borderRadius:"50%",background:m.bg,color:m.color,fontSize:8,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{m.initials}</div>)}</div></div>
              {e.type&&<span className="pill pill-gr" style={{fontSize:10,marginTop:4}}>{e.type}</span>}
              <div className="de-tx">{e.text}</div>
            </div>
          );})}
          </div>}
      </div>)}

      {tab==="deadlines"&&(<div>
        <div className="sh"><div className="st"><i className="ti ti-clock"/>Tutte le scadenze</div></div>
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          {trip.flights?.flatMap(f=>[
            {label:`Check-in volo ${f.flightNum} (${f.type}) — apre`,date:f.checkinOpen,done:f.checkinDone,icon:"✈️"},
            {label:`Scadenza check-in ${f.flightNum}`,date:f.checkinDeadline?.slice(0,10),done:f.checkinDone,icon:"⏰"},
          ]).filter(x=>x.date).map((item,i,arr)=>(
            <div key={"f"+i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:i<arr.length-1?"1px solid #f0f0f0":"none"}}>
              <span style={{fontSize:18}}>{item.icon}</span>
              <div style={{flex:1}}><div style={{fontWeight:500,fontSize:13,textDecoration:item.done?"line-through":"none",color:item.done?"#aaa":"inherit"}}>{item.label}</div><div style={{fontSize:11,color:"#888"}}>{item.date}</div></div>
              {item.done?<span className="pill pill-g">✓</span>:<ExpiryPill days={daysUntil(item.date)}/>}
              <button className="btn btn-s" onClick={()=>openCalCL(item.label,item.date)} style={{fontSize:11}}><i className="ti ti-calendar-plus"/></button>
            </div>
          ))}
          {trip.hotels?.flatMap(h=>[
            {label:`Check-in ${h.name}`,date:h.checkIn,done:h.checkinDone,icon:"🏨"},
            {label:`Check-out ${h.name}`,date:h.checkOut,done:false,icon:"🔑"},
          ]).filter(x=>x.date).map((item,i,arr)=>(
            <div key={"h"+i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{fontSize:18}}>{item.icon}</span>
              <div style={{flex:1}}><div style={{fontWeight:500,fontSize:13}}>{item.label}</div><div style={{fontSize:11,color:"#888"}}>{item.date}</div></div>
              {item.done?<span className="pill pill-g">✓</span>:<ExpiryPill days={daysUntil(item.date)}/>}
              <button className="btn btn-s" onClick={()=>openCalCL(item.label,item.date)} style={{fontSize:11}}><i className="ti ti-calendar-plus"/></button>
            </div>
          ))}
          {trip.reminders?.map((r,i)=>(
            <div key={"r"+i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #f0f0f0"}}>
              <div className="rd" style={{background:r.color,width:10,height:10}}/>
              <div style={{flex:1}}><div style={{fontWeight:500,fontSize:13}}>{r.text}</div><div style={{fontSize:11,color:"#888"}}>{r.when}</div></div>
              <ExpiryPill days={daysUntil(r.when)}/>
              <button className="btn btn-s" onClick={()=>openCalCL(r.text,r.when)} style={{fontSize:11}}><i className="ti ti-calendar-plus"/></button>
            </div>
          ))}
          {!trip.flights?.length&&!trip.hotels?.length&&!trip.reminders?.length&&<div className="empty"><i className="ti ti-checks"/><p>Nessuna scadenza</p></div>}
        </div>
      </div>)}
    </div>
  );
}

function Travel(){
  const{trips,diary,family,addTrip}=useF();
  const[view,setView]=useState("list");
  const[modTrip,setModTrip]=useState(false);
  const selectedTrip=trips.find(t=>t.id===view);
  const sorted=[...trips].sort((a,b)=>{const o={imminent:0,planning:1,past:2};return(o[a.status]??2)-(o[b.status]??2);});
  if(selectedTrip)return <TripDetail trip={selectedTrip} onBack={()=>setView("list")}/>;
  return(
    <div>
      {modTrip&&<AddTripModal onClose={()=>setModTrip(false)}/>}
      <div className="sh"><div className="st"><i className="ti ti-map-2"/>I miei viaggi</div><button className="btn btn-p btn-s" onClick={()=>setModTrip(true)}><i className="ti ti-plus"/>Nuovo viaggio</button></div>
      {sorted.length===0?<div className="card"><div className="empty"><i className="ti ti-plane-off"/><p>Nessun viaggio — inizia aggiungendone uno!</p></div></div>
        :<div className="g2">{sorted.map(t=>{
          const[pc,pl]=STATUS_TRIP[t.status]||["pill-gr",t.status];
          const done=t.checklist.filter(c=>c.done).length,pct=Math.round(done/t.checklist.length*100);
          const plist=t.persons.map(id=>getFm(family,id)).filter(Boolean);
          const nextFlight=t.flights?.find(f=>!f.checkinDone);
          const nextHotel=t.hotels?.find(h=>!h.checkinDone);
          return(
            <div key={t.id} className="trip" style={{cursor:"pointer"}} onClick={()=>setView(t.id)}>
              <div className="trip-h">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div className="trip-nm">{t.emoji} {t.name}</div><div style={{fontSize:12,color:"#888",marginTop:2}}>{t.dates}</div><div style={{display:"flex",gap:4,marginTop:6}}>{plist.map(m=><div key={m.id} style={{width:22,height:22,borderRadius:"50%",background:m.bg,color:m.color,fontSize:9,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{m.initials}</div>)}</div></div>
                  <span className={`pill ${pc}`}>{pl}</span>
                </div>
              </div>
              <div className="trip-bd">
                {nextFlight&&<div style={{background:"#EBF4FF",border:"1px solid #b3d4ff",borderRadius:6,padding:"6px 10px",fontSize:12,marginBottom:8,color:"#185FA5"}}>✈️ Check-in {nextFlight.company} apre: {nextFlight.checkinOpen}</div>}
                {nextHotel&&<div style={{background:"#FFF0F6",border:"1px solid #f0b3d4",borderRadius:6,padding:"6px 10px",fontSize:12,marginBottom:8,color:"#993556"}}>🏨 Check-in {nextHotel.name}: {nextHotel.checkIn} ore {nextHotel.checkInTime}</div>}
                {t.checklist.slice(0,4).map(c=>(<div key={c.id} className={`ci ${c.done?"done":""}`}><input type="checkbox" checked={c.done} readOnly/>{c.text}</div>))}
                {t.checklist.length>4&&<div style={{fontSize:11,color:"#aaa",marginTop:4}}>+{t.checklist.length-4} altre voci</div>}
              </div>
              <div className="trip-ft">
                <span style={{fontSize:12,color:"#888"}}>{done}/{t.checklist.length}</span>
                <div className="pb"><div className="pf" style={{width:`${pct}%`}}/></div>
                <span style={{fontSize:12,color:pct===100?"var(--green)":"#888"}}>{pct}%</span>
                <button className="btn btn-s btn-p" onClick={e=>{e.stopPropagation();setView(t.id);}} style={{fontSize:11}}>Apri →</button>
              </div>
            </div>
          );
        })}</div>
      }
      {diary.length>0&&(<>
        <div className="sh" style={{marginTop:"1.5rem"}}><div className="st"><i className="ti ti-book-2"/>Diario di famiglia (tutti i viaggi)</div></div>
        <div className="card">{diary.map((e,i)=>{const parts=(e.persons||[]).map(id=>getFm(family,id)).filter(Boolean);return(
          <div key={e.id} className="de" style={{paddingBottom:i<diary.length-1?18:0}}>
            <div className="de-dt">{e.location} · {fmtDate(e.date)}</div>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}><div className="de-ttl">{e.title}</div><div style={{display:"flex",gap:3}}>{parts.map(m=><div key={m.id} style={{width:20,height:20,borderRadius:"50%",background:m.bg,color:m.color,fontSize:8,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{m.initials}</div>)}</div></div>
            <div className="de-tx">{e.text}</div>
            {e.photos>0&&<div className="pt">{Array.from({length:Math.min(3,e.photos)}).map((_,j)=><div key={j} className="ph"><i className="ti ti-photo"/></div>)}{e.photos>3&&<div className="ph" style={{fontSize:11,color:"#888"}}>+{e.photos-3}</div>}</div>}
          </div>
        );})}
        </div>
      </>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FAMILY MEMBERS  ★ NEW
═══════════════════════════════════════════════════════════════ */
function FamilyMembers(){
  const{family,removeMember,meds,visits}=useF();
  const[modal,setModal]=useState(null); // null | "add" | memberObj
  const getMedCount=id=>meds.filter(m=>m.person===id&&m.active).length;
  const getVisitCount=id=>visits.filter(v=>v.person===id).length;
  return(
    <div>
      {modal==="add"&&<AddMemberModal onClose={()=>setModal(null)}/>}
      {modal&&modal!=="add"&&<AddMemberModal onClose={()=>setModal(null)} editing={modal}/>}
      <div className="sh">
        <div className="st"><i className="ti ti-users"/>Membri della famiglia ({family.length})</div>
        <button className="btn btn-p btn-s" onClick={()=>setModal("add")}><i className="ti ti-user-plus"/>Aggiungi membro</button>
      </div>
      <div className="g3">
        {family.map(m=>(
          <div key={m.id} className="mem-card">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div className="mem-av" style={{background:m.bg,color:m.color}}>{m.initials}</div>
              <div>
                <div className="mem-name">{m.name}</div>
                <span className="pill pill-gr" style={{fontSize:10}}>{m.role||"Membro"}</span>
              </div>
            </div>
            {m.bday&&<div className="mem-row"><i className="ti ti-cake"/><span>{fmtDate(m.bday)} · {fmtAge(m.bday)}</span></div>}
            {m.blood&&<div className="mem-row"><i className="ti ti-droplet"/><span>Gruppo sanguigno: <strong>{m.blood}</strong></span></div>}
            {m.phone&&<div className="mem-row"><i className="ti ti-phone"/><span>{m.phone}</span></div>}
            {m.cf&&<div className="mem-row"><i className="ti ti-id"/><code style={{fontSize:11,fontFamily:"monospace",background:"#f5f5f5",padding:"1px 5px",borderRadius:4}}>{m.cf}</code></div>}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <div style={{flex:1,background:"#f8faf8",border:"1px solid #eef0ee",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:600,color:"var(--green)"}}>{getMedCount(m.id)}</div>
                <div style={{fontSize:11,color:"#888"}}>Farmaci</div>
              </div>
              <div style={{flex:1,background:"#f8faf8",border:"1px solid #eef0ee",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:600,color:"var(--blue-dark)"}}>{getVisitCount(m.id)}</div>
                <div style={{fontSize:11,color:"#888"}}>Visite</div>
              </div>
            </div>
            <div className="mem-actions">
              <button className="btn btn-s" style={{flex:1}} onClick={()=>setModal(m)}><i className="ti ti-edit"/>Modifica</button>
              {family.length>1&&<button className="btn btn-s btn-d" onClick={()=>{if(window.confirm(`Rimuovere ${m.name}?`))removeMember(m.id);}}><i className="ti ti-trash"/></button>}
            </div>
          </div>
        ))}
        <div className="mem-card" style={{border:"1.5px dashed #c8d4c8",background:"#fafbfa",alignItems:"center",justifyContent:"center",cursor:"pointer",minHeight:200}} onClick={()=>setModal("add")}>
          <div style={{textAlign:"center",color:"#aaa"}}>
            <div style={{fontSize:32,marginBottom:8}}>+</div>
            <div style={{fontSize:13}}>Aggiungi membro</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRAVEL EXPENSES  ★ NEW
═══════════════════════════════════════════════════════════════ */
function TravelExpenses(){
  const{trips,family,addExpense,removeExpense}=useF();
  const[selTrip,setSelTrip]=useState(trips[0]?.id||"");
  const[modal,setModal]=useState(false);
  const trip=trips.find(t=>t.id===selTrip);
  const expenses=trip?.expenses||[];
  const total=expenses.reduce((s,e)=>s+Number(e.amount),0);
  const budget=trip?.budget||0;
  const pct=budget>0?Math.min(100,Math.round(total/budget*100)):0;
  const bycat=Object.entries(EXP_CATS).map(([k,v])=>({...v,key:k,tot:expenses.filter(e=>e.cat===k).reduce((s,e)=>s+Number(e.amount),0)})).filter(c=>c.tot>0);
  const fmtEur=n=>`€ ${Number(n).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  return(
    <div>
      {modal&&trip&&<AddExpenseModal trip={trip} onClose={()=>setModal(false)}/>}
      <div className="sh">
        <div className="st"><i className="ti ti-cash"/>Spese di viaggio</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select className="fi" style={{width:"auto"}} value={selTrip} onChange={e=>setSelTrip(e.target.value)}>
            {trips.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
          </select>
          <button className="btn btn-p btn-s" onClick={()=>setModal(true)} disabled={!trip}><i className="ti ti-plus"/>Aggiungi spesa</button>
        </div>
      </div>
      {!trip?<div className="card"><div className="empty"><i className="ti ti-plane-off"/><p>Nessun viaggio disponibile — creane uno nella sezione Viaggi</p></div></div>:(<>
        <div className="g4" style={{marginBottom:"1rem"}}>
          <div className="stat accent"><div className="stat-n">{fmtEur(total)}</div><div className="stat-l"><i className="ti ti-receipt"/>Totale speso</div></div>
          <div className="stat"><div className="stat-n">{fmtEur(budget)}</div><div className="stat-l"><i className="ti ti-target"/>Budget</div></div>
          <div className={`stat ${budget>0&&total>budget?"alert":""}`}><div className="stat-n" style={budget>0&&total>budget?{color:"var(--red)"}:{color:"var(--green)"}}>{fmtEur(Math.max(0,budget-total))}</div><div className="stat-l"><i className="ti ti-wallet"/>Rimanente</div></div>
          <div className="stat"><div className="stat-n">{expenses.length}</div><div className="stat-l"><i className="ti ti-list"/>Voci</div></div>
        </div>
        {budget>0&&(<div className="card" style={{marginBottom:"1rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}>
            <span style={{fontWeight:500}}>Utilizzo budget</span>
            <span style={{color:pct>100?"var(--red)":pct>80?"var(--amber)":"var(--green)",fontWeight:600}}>{pct}%</span>
          </div>
          <div className="budget-bar"><div className="budget-fill" style={{width:`${pct}%`,background:pct>100?"var(--red)":pct>80?"var(--amber)":"var(--green)"}}/></div>
          {bycat.length>0&&(<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
            {bycat.map(c=>(<div key={c.key} style={{display:"flex",align:"center",gap:6,background:c.bg,border:`1px solid ${c.color}22`,borderRadius:8,padding:"6px 10px",fontSize:12}}>
              <span>{c.icon}</span><span style={{color:c.color,fontWeight:500}}>{c.label}</span><span style={{color:"#888"}}>· {fmtEur(c.tot)}</span>
            </div>))}
          </div>)}
        </div>)}
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"#f8faf8",borderBottom:"1px solid #e8ede8",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"var(--fd)",fontWeight:600,fontSize:14}}>{trip.emoji} {trip.name} — Registro spese</span>
            <span className="pill pill-gr">{trip.dates}</span>
          </div>
          {expenses.length===0?<div className="empty"><i className="ti ti-receipt-off"/><p>Nessuna spesa registrata — aggiungi la prima!</p></div>
            :[...expenses].reverse().map((e,i)=>{const cat=EXP_CATS[e.cat]||EXP_CATS.other;return(
              <div key={e.id} className="exp-row" style={{padding:"10px 16px"}}>
                <div className="exp-cat" style={{background:cat.bg}}>{cat.icon}</div>
                <div style={{flex:1}}>
                  <div className="exp-desc">{e.desc}</div>
                  <div className="exp-sub">{cat.label} · {e.date?fmtDate(e.date):""}</div>
                </div>
                <div className="exp-amount neg">{fmtEur(e.amount)}</div>
                <button className="btn-ic btn btn-d" style={{marginLeft:6}} onClick={()=>removeExpense(trip.id,e.id)}><i className="ti ti-trash"/></button>
              </div>
            );})}
          {expenses.length>0&&(<div style={{padding:"12px 16px",borderTop:"1px solid #e8ede8",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fafbfa"}}>
            <span style={{fontSize:13,color:"#888"}}>Totale</span>
            <span style={{fontFamily:"var(--fd)",fontWeight:600,fontSize:16}}>{fmtEur(total)}</span>
          </div>)}
        </div>
      </>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETUP GUIDE  ★ NEW
═══════════════════════════════════════════════════════════════ */
function Guide(){
  const[sec,setSec]=useState("local");
  return(
    <div>
      <div className="card" style={{marginBottom:"1rem",background:"linear-gradient(135deg,#0e1f1a,#1D9E75)",color:"#fff",border:"none"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:600,marginBottom:6}}>📖 Guida all'installazione</div>
        <p style={{fontSize:13,opacity:.85,lineHeight:1.6}}>Segui questi passaggi per installare Family Hub sul tuo computer o su un server, con o senza integrazione Google.</p>
      </div>
      <div className="itabs">
        <button className={`itab ${sec==="local"?"active":""}`} onClick={()=>setSec("local")}>💻 Installazione locale</button>
        <button className={`itab ${sec==="deploy"?"active":""}`} onClick={()=>setSec("deploy")}>🌐 Deploy online</button>
        <button className={`itab ${sec==="google"?"active":""}`} onClick={()=>setSec("google")}>🔗 Google Drive & Calendar</button>
        <button className={`itab ${sec==="faq"?"active":""}`} onClick={()=>setSec("faq")}>❓ FAQ</button>
      </div>

      {sec==="local"&&(
        <div>
          <div className="card guide-section">
            <h3><span>🛠️</span> Prerequisiti</h3>
            <div className="guide-step"><div className="step-num">1</div><div className="step-body"><h4>Installa Node.js</h4><p>Scarica e installa Node.js (versione 18 o superiore) da <a href="https://nodejs.org" target="_blank">nodejs.org</a>. Verifica con: <code>node --version</code> e <code>npm --version</code> nel terminale.</p></div></div>
            <div className="guide-step"><div className="step-num">2</div><div className="step-body"><h4>Installa Git (opzionale ma consigliato)</h4><p>Scarica Git da <a href="https://git-scm.com" target="_blank">git-scm.com</a> — ti servirà per clonare il progetto e tenerlo aggiornato.</p></div></div>
          </div>
          <div className="card guide-section">
            <h3><span>📦</span> Crea il progetto React</h3>
            <div className="guide-step"><div className="step-num">1</div><div className="step-body"><h4>Crea l'app con Vite</h4><p>Apri il terminale e lancia:</p><br/><code>npm create vite@latest family-hub -- --template react</code><br/><br/><p>Poi entra nella cartella e installa le dipendenze:</p><br/><code>cd family-hub &amp;&amp; npm install</code></div></div>
            <div className="guide-step"><div className="step-num">2</div><div className="step-body"><h4>Aggiungi le icone Tabler</h4><p>Installa il pacchetto delle icone usate nell'app:</p><br/><code>npm install @tabler/icons-webfont</code><br/><br/><p>Poi nel file <code>src/main.jsx</code> aggiungi in cima:</p><br/><code>import '@tabler/icons-webfont/dist/tabler-icons.min.css'</code></div></div>
            <div className="guide-step"><div className="step-num">3</div><div className="step-body"><h4>Inserisci il codice dell'app</h4><p>Copia il contenuto del file <code>FamilyHub.jsx</code> (scaricato sopra) e incollalo in <code>src/App.jsx</code>. Poi apri <code>src/main.jsx</code> e assicurati che contenga:</p><br/><code>import React from 'react'</code><br/><code>import ReactDOM from 'react-dom/client'</code><br/><code>import App from './App.jsx'</code><br/><code>ReactDOM.createRoot(document.getElementById('root')).render(&lt;App /&gt;)</code></div></div>
            <div className="guide-step"><div className="step-num">4</div><div className="step-body"><h4>Avvia l'app in locale</h4><p>Nel terminale, dalla cartella del progetto:</p><br/><code>npm run dev</code><br/><br/><p>Apri il browser su <code>http://localhost:5173</code> — l'app è pronta! I dati vengono salvati nel <strong>localStorage</strong> del browser.</p><div className="tip-box">💡 I dati sono persistenti tra sessioni sullo stesso browser. Per condividere tra dispositivi serve il backend (vedi sezione Deploy o Google).</div></div></div>
          </div>
        </div>
      )}

      {sec==="deploy"&&(
        <div>
          <div className="card guide-section">
            <h3><span>🚀</span> Deploy gratuito su Vercel (consigliato)</h3>
            <div className="guide-step"><div className="step-num">1</div><div className="step-body"><h4>Prepara la build</h4><p>Dal terminale nella cartella del progetto:</p><br/><code>npm run build</code><br/><br/><p>Viene creata la cartella <code>dist/</code> con i file ottimizzati.</p></div></div>
            <div className="guide-step"><div className="step-num">2</div><div className="step-body"><h4>Crea un account Vercel</h4><p>Vai su <a href="https://vercel.com" target="_blank">vercel.com</a> e crea un account gratuito (puoi accedere con GitHub). Poi installa la CLI:</p><br/><code>npm install -g vercel</code></div></div>
            <div className="guide-step"><div className="step-num">3</div><div className="step-body"><h4>Deploy in un comando</h4><p>Dalla cartella del progetto:</p><br/><code>vercel --prod</code><br/><br/><p>Segui le istruzioni a schermo. In 2 minuti l'app sarà online su un URL tipo <code>https://family-hub-xxx.vercel.app</code></p></div></div>
            <div className="guide-step"><div className="step-num">4</div><div className="step-body"><h4>Dominio personalizzato (opzionale)</h4><p>Dal pannello Vercel puoi aggiungere un dominio personalizzato (es. <code>familyhub.tuonome.it</code>) — il certificato HTTPS è incluso e gratuito.</p></div></div>
          </div>
          <div className="card guide-section">
            <h3><span>🌿</span> Alternativa: Netlify</h3>
            <div className="guide-step"><div className="step-num">1</div><div className="step-body"><h4>Deploy via drag & drop</h4><p>Vai su <a href="https://netlify.com" target="_blank">netlify.com</a>, crea un account gratuito e trascina la cartella <code>dist/</code> direttamente nel browser. L'app è live istantaneamente — zero configurazione.</p></div></div>
          </div>
          <div className="card guide-section">
            <h3><span>🐳</span> Docker (per uso domestico su NAS o Raspberry Pi)</h3>
            <div className="guide-step"><div className="step-num">1</div><div className="step-body"><h4>Crea il Dockerfile</h4><p>Nella root del progetto crea un file <code>Dockerfile</code>:</p><br/><code>FROM node:18-alpine AS build</code><br/><code>WORKDIR /app</code><br/><code>COPY . .</code><br/><code>RUN npm install &amp;&amp; npm run build</code><br/><br/><code>FROM nginx:alpine</code><br/><code>COPY --from=build /app/dist /usr/share/nginx/html</code><br/><code>EXPOSE 80</code></div></div>
            <div className="guide-step"><div className="step-num">2</div><div className="step-body"><h4>Build e avvio container</h4><code>docker build -t family-hub .</code><br/><code>docker run -p 8080:80 family-hub</code><br/><br/><p>L'app è accessibile su <code>http://localhost:8080</code> o dall'IP locale del tuo NAS/Raspberry.</p></div></div>
          </div>
        </div>
      )}

      {sec==="google"&&(
        <div>
          <div className="card guide-section">
            <h3><span>🔧</span> Configurazione Google Cloud Console</h3>
            <div className="guide-step"><div className="step-num">1</div><div className="step-body"><h4>Crea un progetto Google Cloud</h4><p>Vai su <a href="https://console.cloud.google.com" target="_blank">console.cloud.google.com</a>, accedi con il tuo account Google e clicca su <strong>"Crea progetto"</strong>. Dai un nome (es. "FamilyHub").</p></div></div>
            <div className="guide-step"><div className="step-num">2</div><div className="step-body"><h4>Abilita le API necessarie</h4><p>Nel menu laterale vai su <strong>API e Servizi → Libreria</strong> e abilita queste due API:</p><ul><li><strong>Google Drive API</strong> — per archiviare e leggere documenti</li><li><strong>Google Calendar API</strong> — per creare promemoria farmaci e visite</li></ul></div></div>
            <div className="guide-step"><div className="step-num">3</div><div className="step-body"><h4>Crea le credenziali OAuth 2.0</h4><p>Vai su <strong>API e Servizi → Credenziali → Crea credenziali → ID client OAuth</strong>. Scegli "Applicazione web", aggiungi <code>http://localhost:5173</code> come origine autorizzata (e il tuo dominio di produzione). Copia <strong>Client ID</strong> e <strong>Client Secret</strong>.</p></div></div>
            <div className="guide-step"><div className="step-num">4</div><div className="step-body"><h4>Configura la schermata di consenso OAuth</h4><p>Vai su <strong>Schermata consenso OAuth</strong>, seleziona "Esterno", inserisci il nome app ("Family Hub") e la tua email. Aggiungi gli scope: <code>drive.file</code> e <code>calendar.events</code>. Aggiungi la tua email come utente di test.</p></div></div>
          </div>
          <div className="card guide-section">
            <h3><span>💻</span> Integrazione nel codice</h3>
            <div className="guide-step"><div className="step-num">5</div><div className="step-body"><h4>Installa la libreria Google</h4><code>npm install @react-oauth/google</code></div></div>
            <div className="guide-step"><div className="step-num">6</div><div className="step-body"><h4>Aggiungi il Client ID all'app</h4><p>Crea il file <code>.env</code> nella root:</p><br/><code>VITE_GOOGLE_CLIENT_ID=il-tuo-client-id.apps.googleusercontent.com</code><br/><br/><p>Nel codice, sostituisci il pulsante "Connetti Google" con:</p><br/><code>import {"{ GoogleOAuthProvider, useGoogleLogin }"} from '@react-oauth/google'</code><br/><br/><p>Avvolgi l'app nel provider e usa <code>useGoogleLogin</code> con scope <code>https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events</code></p></div></div>
            <div className="guide-step"><div className="step-num">7</div><div className="step-body"><h4>Carica file su Drive</h4><p>Usa l'API multipart per caricare PDF e foto:</p><br/><code>POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart</code><br/><br/><p>Authorization: <code>Bearer {"<access_token>"}</code> — il token viene fornito dal login Google.</p></div></div>
            <div className="guide-step"><div className="step-num">8</div><div className="step-body"><h4>Crea eventi su Calendar</h4><p>Per ogni farmaco con orario, chiama:</p><br/><code>POST https://www.googleapis.com/calendar/v3/calendars/primary/events</code><br/><br/><p>Con body JSON contenente <code>summary</code> (nome farmaco), <code>start/end</code> (data+ora) e <code>recurrence: ["RRULE:FREQ=DAILY"]</code> per la ripetizione quotidiana.</p><div className="tip-box">⚠️ Il token di accesso scade dopo 1 ora: implementa il refresh token per uso continuativo.</div></div></div>
          </div>
        </div>
      )}

      {sec==="faq"&&(
        <div>
          <div className="card guide-section">
            <h3><span>❓</span> Domande frequenti</h3>
            <div className="guide-step"><div className="step-num"><i className="ti ti-help" style={{fontSize:13}}/></div><div className="step-body"><h4>I dati si perdono se cancello il browser?</h4><p>Sì — in questa versione i dati sono nel localStorage. Per persistenza vera usa Google Drive (connetti con OAuth) oppure aggiungi un backend con database (SQLite, Supabase, Firebase).</p></div></div>
            <div className="guide-step"><div className="step-num"><i className="ti ti-help" style={{fontSize:13}}/></div><div className="step-body"><h4>Posso usarlo su mobile?</h4><p>Sì — il deploy su Vercel/Netlify crea automaticamente un'app web accessibile da qualsiasi smartphone via browser. Per un'app nativa aggiungi <strong>Capacitor</strong> (<code>npm install @capacitor/core @capacitor/ios @capacitor/android</code>) e build per iOS/Android.</p></div></div>
            <div className="guide-step"><div className="step-num"><i className="ti ti-help" style={{fontSize:13}}/></div><div className="step-body"><h4>Come condivido i dati tra i componenti della famiglia?</h4><p>Opzione 1 — <strong>Google Drive</strong>: i dati JSON vengono salvati su un file Drive condiviso. Opzione 2 — <strong>Supabase</strong> (gratuito fino a 500MB): crea un progetto su <a href="https://supabase.com" target="_blank">supabase.com</a>, usa <code>npm install @supabase/supabase-js</code> e sostituisci localStorage con le chiamate al database in tempo reale.</p></div></div>
            <div className="guide-step"><div className="step-num"><i className="ti ti-help" style={{fontSize:13}}/></div><div className="step-body"><h4>Posso ricevere notifiche push per i farmaci?</h4><p>Sì — aggiungi un Service Worker all'app React e usa la <strong>Web Push API</strong>. Per notifiche mobile, il modo più semplice è tramite Google Calendar (ogni promemoria farmaco diventa un evento con notifica automatica sullo smartphone).</p></div></div>
            <div className="guide-step"><div className="step-num"><i className="ti ti-help" style={{fontSize:13}}/></div><div className="step-body"><h4>L'app è sicura per dati sanitari?</h4><p>Per uso personale/familiare sì. Se la deploi online, usa sempre <strong>HTTPS</strong> (Vercel/Netlify lo includono), valuta l'aggiunta di autenticazione (es. con <a href="https://clerk.com" target="_blank">Clerk.dev</a>, gratuito fino a 10.000 utenti) e non archiviare dati sanitari sensibili su server di terze parti senza cifratura.</p></div></div>
            <div className="guide-step"><div className="step-num"><i className="ti ti-help" style={{fontSize:13}}/></div><div className="step-body"><h4>Posso personalizzare ulteriormente l'app?</h4><p>Assolutamente — il codice è completamente tuo. Puoi aggiungere sezioni (spese domestiche, lista della spesa, orari scolastici), cambiare i colori nel blocco CSS in cima al file (<code>:root {"{ --green: ... }"}</code>), o integrare altri servizi come WhatsApp Business API per i promemoria via messaggio.</p></div></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function App(){
  const[tab,setTab]=useState("dashboard");
  const[open,setOpen]=useState(true);
  const pages={dashboard:<Dashboard/>,archive:<Archive/>,health:<Health/>,travel:<Travel/>,family:<FamilyMembers/>,expenses:<TravelExpenses/>,guide:<Guide/>};
  return(
    <Provider>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css"/>
      <div className="app-shell" data-sidebar={open?"open":"closed"}>
        <Sidebar tab={tab} setTab={setTab} open={open}/>
        <div className="main-area">
          <Header tab={tab} open={open} setOpen={setOpen}/>
          <main className="page-content">{pages[tab]}</main>
        </div>
      </div>
    </Provider>
  );
}

