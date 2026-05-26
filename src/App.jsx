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
.de::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--green);position:absolute;left:-5px;top:4px}
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

/* MODAL FORMS */
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
.page-content{animation:fi .22s ease both}
`;

/* ═══════════════════════════════════════════════════════════════
   DEFAULTS
═══════════════════════════════════════════════════════════════ */
const COLORS=[
  {c:"#1D9E75",bg:"#E1F5EE"},{c:"#185FA5",bg:"#E6F1FB"},{c:"#854F0B",bg:"#FAEEDA"},
  {c:"#993556",bg:"#FBEAF0"},{c:"#D85A30",bg:"#FAECE7"},{c:"#7C4DCC",bg:"#F0EBFF"},
  {c:"#0e1f1a",bg:"#e0e8e5"},{c:"#C0392B",bg:"#FDEDEC"},
];

const DEF_FAMILY=[
  {id:"marco",name:"Marco",initials:"MA",role:"Padre",bday:"1983-04-15",blood:"A+",cf:"MRCVRD83D15H501X",phone:"333 1234567",color:"#1D9E75",bg:"#E1F5EE"},
  {id:"sofia",name:"Sofia",initials:"SO",role:"Madre",bday:"1986-07-22",blood:"B+",cf:"SFAVRD86L62H501K",phone:"333 7654321",color:"#854F0B",bg:"#FAEEDA"},
  {id:"luca",name:"Luca",initials:"LU",role:"Figlio",bday:"2016-11-03",blood:"A+",cf:"LCAVRD16S03H501Z",phone:"",color:"#185FA5",bg:"#E6F1FB"},
  {id:"nonna",name:"Nonna",initials:"NO",role:"Nonna",bday:"1948-02-28",blood:"O-",cf:"NNIVRD48B68H501P",phone:"06 1234567",color:"#993556",bg:"#FBEAF0"},
];

const DEF_DOCS=[
  {id:"d1",name:"Tessera sanitaria Marco",type:"pdf",category:"Identità",person:"marco",date:"2025-05-12",expiry:null,size:"210 KB"},
  {id:"d2",name:"Vaccinazioni Luca 2025",type:"img",category:"Salute",person:"luca",date:"2025-05-03",expiry:null,size:"1.2 MB"},
  {id:"d3",name:"Note visita cardiologica",type:"note",category:"Salute",person:"nonna",date:"2025-04-28",expiry:null,size:"4 KB"},
  {id:"d4",name:"Patente Marco",type:"pdf",category:"Identità",person:"marco",date:"2020-06-28",expiry:"2025-06-28",size:"450 KB"},
  {id:"d5",name:"Passaporto Sofia",type:"pdf",category:"Identità",person:"sofia",date:"2019-09-14",expiry:"2025-09-14",size:"380 KB"},
  {id:"d6",name:"Assicurazione auto 2025",type:"pdf",category:"Assicurazioni",person:null,date:"2024-11-02",expiry:"2025-11-02",size:"620 KB"},
  {id:"d7",name:"Contratto affitto",type:"pdf",category:"Casa",person:null,date:"2024-01-15",expiry:null,size:"1.8 MB"},
];

const DEF_MEDS=[
  {id:"m1",name:"Amoxicillina 500mg",person:"luca",category:"Antibiotico",times:["08:00","13:00","20:00"],notes:"Con cibo · 7 giorni",startDate:"2025-05-19",endDate:"2025-05-26",active:true,attachments:[{name:"Foglio illustrativo",type:"pdf"}],producerUrl:"https://farmaci.aifa.gov.it"},
  {id:"m2",name:"Vitamina D 1000 UI",person:"sofia",category:"Integratore",times:["20:00"],notes:"Con pasto serale",startDate:"2025-01-01",endDate:null,active:true,attachments:[{name:"Foto confezione",type:"img"}],producerUrl:""},
  {id:"m3",name:"Bisoprololo 5mg",person:"nonna",category:"Cardiologico",times:["07:30"],notes:"A digiuno",startDate:"2024-03-01",endDate:null,active:true,attachments:[{name:"Ricetta medica",type:"pdf"}],producerUrl:"https://farmaci.aifa.gov.it"},
  {id:"m4",name:"Omega 3",person:"marco",category:"Integratore",times:["13:00"],notes:"Con pranzo",startDate:"2025-02-01",endDate:null,active:true,attachments:[],producerUrl:""},
];

const DEF_VISITS=[
  {id:"v1",title:"Pediatra",person:"luca",doctor:"Dott. Ferrara",location:"Via Roma 4",date:"2025-05-28",time:"15:30",status:"confirmed",attachments:[]},
  {id:"v2",title:"Cardiologo",person:"nonna",doctor:"Dott. Marino",location:"Osp. Cardarelli",date:"2025-06-03",time:"10:00",status:"pending",attachments:[{name:"Ecocardio",type:"pdf"}]},
  {id:"v3",title:"Oculista",person:"sofia",doctor:"Studio Rossi",location:"Via Napoli 22",date:"2025-06-12",time:"09:00",status:"new",attachments:[]},
];

const DEF_THERAPIES=[
  {id:"t1",title:"Fisioterapia",person:"marco",doctor:"Dott. Bianchi",total:8,done:3,schedule:"Martedì 10:00"},
  {id:"t2",title:"Logopedia",person:"luca",doctor:"Dott.ssa Verde",total:null,done:null,schedule:"Martedì 16:30"},
];

const DEF_TRIPS=[
  {id:"tr1",name:"Barcellona",emoji:"✈️",dates:"24–28 mag 2026",dateFrom:"2026-05-24",dateTo:"2026-05-28",
   persons:["marco","sofia","luca","nonna"],status:"imminent",budget:2400,
   notes:"Soggiorno nel quartiere Eixample. Portare adattatori per prese spagnole.",
   flights:[
     {id:"f1",type:"andata",company:"Ryanair",from:"Roma FCO",to:"Barcellona BCN",date:"2026-05-24",time:"07:15",arrival:"09:30",flightNum:"FR1234",bookingRef:"RYA-XK9271",bookingUrl:"https://ryanair.com",ticketUrl:"",checkinOpen:"2026-05-22",checkinDeadline:"2026-05-24T04:15",checkinDone:false,boardingPass:false,seats:"14A,14B,15A,15B"},
     {id:"f2",type:"ritorno",company:"Ryanair",from:"Barcellona BCN",to:"Roma FCO",date:"2026-05-28",time:"18:45",arrival:"20:55",flightNum:"FR5678",bookingRef:"RYA-XK9272",bookingUrl:"https://ryanair.com",ticketUrl:"",checkinOpen:"2026-05-26",checkinDeadline:"2026-05-28T15:45",checkinDone:false,boardingPass:false,seats:"14A,14B,15A,15B"},
   ],
   hotels:[{id:"h1",name:"Hotel Arts Barcelona",stars:4,address:"Carrer de la Marina 19-21",checkIn:"2026-05-24",checkInTime:"15:00",checkOut:"2026-05-28",checkOutTime:"11:00",bookingRef:"BK-748291",bookingUrl:"https://booking.com",confirmUrl:"",checkinDone:false,phone:"+34 93 221 1000",notes:"Colazione inclusa. Chiedere camera vista mare."}],
   transports:[{id:"tra",type:"treno",desc:"Aeroporto→Plaça Catalunya",date:"2026-05-24",time:"10:00",bookingRef:"",cost:14,notes:"L9 Sud metro"}],
   itinerary:[
     {id:"it1",day:"2026-05-24",title:"Arrivo e Barceloneta",items:["Atterraggio 09:30","Check-in hotel ore 15","Passeggiata Barceloneta","Cena tapas El Xampanyet"]},
     {id:"it2",day:"2026-05-25",title:"Gaudí Day",items:["Sagrada Família ore 9 (prenotato)","Pranzo Eixample","Casa Batlló pomeriggio","Park Güell al tramonto"]},
     {id:"it3",day:"2026-05-26",title:"Cultura e shopping",items:["Museu Picasso","Barri Gòtic","Las Ramblas","Mercat de la Boqueria","Shopping Passeig de Gràcia"]},
     {id:"it4",day:"2026-05-27",title:"Gita a Montserrat",items:["Partenza 08:30 con treno","Montserrat visita monastero","Pranzo in quota","Rientro ore 17"]},
     {id:"it5",day:"2026-05-28",title:"Partenza",items:["Check-out ore 11","Ultima passeggiata","Aeroporto ore 15:00","Volo ritorno 18:45"]},
   ],
   packing:[
     {id:"pk1",cat:"Documenti",items:[{t:"Carta identità / passaporto",done:true},{t:"Tessera sanitaria europea",done:true},{t:"Patente Marco",done:false},{t:"Voucher hotel stampato",done:false},{t:"Boarding pass scaricati",done:false}]},
     {id:"pk2",cat:"Abbigliamento",items:[{t:"Magliette (3 a testa)",done:false},{t:"Pantaloni/shorts",done:false},{t:"Scarpe comode da camminata",done:true},{t:"Giacca leggera sera",done:false},{t:"Costume da bagno",done:false}]},
     {id:"pk3",cat:"Farmaci & salute",items:[{t:"Farmaci cronici Nonna",done:false},{t:"Kit pronto soccorso",done:false},{t:"Crema solare",done:false},{t:"Antidolorifico/antistaminico",done:false}]},
     {id:"pk4",cat:"Tecnologia",items:[{t:"Adattatori presa spagnola",done:false},{t:"Powerbank",done:true},{t:"Cuffie bambini Luca",done:false},{t:"Macchina fotografica + caricatore",done:false}]},
   ],
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
     {id:"e1",desc:"Voli AR x4",cat:"transport",amount:640,date:"2026-04-10",person:"marco"},
     {id:"e2",desc:"Hotel 4 notti",cat:"lodging",amount:880,date:"2026-04-12",person:"sofia"},
     {id:"e3",desc:"Acconto ristorante",cat:"food",amount:120,date:"2026-05-20",person:"marco"},
   ],
   diary:[],
  },
  {id:"tr2",name:"Trentino",emoji:"🏔️",dates:"14–21 ago 2026",dateFrom:"2026-08-14",dateTo:"2026-08-21",
   persons:["marco","sofia","luca"],status:"planning",budget:1800,
   notes:"Zona Val di Fassa. Cercare struttura pet-friendly.",
   flights:[],hotels:[],
   transports:[{id:"tra",type:"auto",desc:"Partenza da Roma con auto",date:"2026-08-14",time:"06:00",bookingRef:"",cost:0,notes:"Sosta pranzo a Verona"}],
   itinerary:[],
   packing:[
     {id:"pk1",cat:"Montagna",items:[{t:"Scarponi da trekking",done:false},{t:"Bastoncini",done:false},{t:"Zaino 30L",done:false},{t:"Crema solare alta protezione",done:false}]},
     {id:"pk2",cat:"Documenti",items:[{t:"Carta d'identità",done:false},{t:"Tessera sanitaria",done:false}]},
   ],
   checklist:[
     {id:"c1",text:"Periodo scelto",done:true},{id:"c2",text:"Struttura da prenotare",done:false},
     {id:"c3",text:"Attività bambini",done:false},{id:"c4",text:"Trasporto",done:false},
     {id:"c5",text:"Assicurazione viaggio",done:false},{id:"c6",text:"Bagagli/zaini",done:false},
   ],
   docs:[],
   reminders:[{id:"r1",text:"Prenotare struttura",when:"2026-06-15",color:"#EF9F27"}],
   expenses:[],diary:[],
  },
];

const DEF_DIARY=[
  {id:"di1",location:"Roma",date:"2026-04-12",title:"Weekend al Colosseo",text:"Luca ha adorato la visita guidata dei gladiatori. Sofia ha fotografato tutto. Pizza a Trastevere la migliore della vita secondo Marco.",photos:7,persons:["marco","sofia","luca"]},
  {id:"di2",location:"Napoli",date:"2026-03-01",title:"Gita a Pompei",text:"Straordinaria. Marco ha fatto la guida ufficiale di famiglia con la sua app. Pranzo al museo degli scavi.",photos:2,persons:["marco","nonna"]},
];

const EXP_CATS={
  transport:{label:"Trasporto",icon:"✈️",color:"#185FA5",bg:"#E6F1FB"},
  lodging:{label:"Alloggio",icon:"🏨",color:"#993556",bg:"#FBEAF0"},
  food:{label:"Cibo",icon:"🍽️",color:"#854F0B",bg:"#FAEEDA"},
  activities:{label:"Attività",icon:"🎭",color:"#0F6E56",bg:"#E1F5EE"},
  shopping:{label:"Shopping",icon:"🛍️",color:"#D85A30",bg:"#FAECE7"},
  other:{label:"Altro",icon:"💳",color:"#555",bg:"#f0f2f0"},
};

/* ═══════════════════════════════════════════════════════════════
   CONTEXT
═══════════════════════════════════════════════════════════════ */
const Ctx=createContext(null);
function load(k,d){try{const s=localStorage.getItem("fh:"+k);return s?JSON.parse(s):d;}catch{return d;}}
function usePersist(k,d){const[s,set]=useState(()=>load(k,d));useEffect(()=>{try{localStorage.setItem("fh:"+k,JSON.stringify(s));}catch{};},[k,s]);return[s,set];}

const uid=(p="id")=>`${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;

const ensureTrip=t=>({
  emoji:"✈️",name:"",dates:"",dateFrom:"",dateTo:"",persons:[],status:"planning",
  budget:0,notes:"",flights:[],hotels:[],transports:[],itinerary:[],packing:[],
  checklist:[],docs:[],reminders:[],expenses:[],diary:[],...t
});

function Provider({children}){
  const[family,  setFamily]  =usePersist("family",  DEF_FAMILY);
  const[docs,    setDocs]    =usePersist("docs",     DEF_DOCS);
  const[meds,    setMeds]    =usePersist("meds",     DEF_MEDS);
  const[visits,  setVisits]  =usePersist("visits",   DEF_VISITS);
  const[therapies]           =usePersist("ther",     DEF_THERAPIES);
  const[trips,   setTrips]   =usePersist("trips",    DEF_TRIPS);
  const[diary,   setDiary]   =usePersist("diary",    DEF_DIARY);
  const[gConn,   setGConn]   =useState(false);

  /* ── helpers interni ── */
  const mapTrip=(tid,fn)=>setTrips(p=>p.map(t=>t.id!==tid?t:ensureTrip(fn(ensureTrip(t)))));

  const ctx={
    family,docs,meds,visits,therapies,trips,diary,gConn,setGConn,

    /* docs */
    addDoc:    d  =>setDocs(p  =>[...p,{...d,id:"d"+Date.now()}]),
    removeDoc: id =>setDocs(p  =>p.filter(x=>x.id!==id)),

    /* meds */
    addMed:    m  =>setMeds(p  =>[...p,{...m,id:"m"+Date.now()}]),
    removeMed: id =>setMeds(p  =>p.filter(x=>x.id!==id)),

    /* visits */
    addVisit:  v  =>setVisits(p=>[...p,{...v,id:"v"+Date.now()}]),
    removeVisit:id=>setVisits(p=>p.filter(x=>x.id!==id)),

    /* diary globale */
    addDiary:  e  =>setDiary(p =>[{...e,id:"di"+Date.now()},...p]),

    /* family */
    addMember: m  =>setFamily(p=>[...p,{...m,id:"fm"+Date.now()}]),
    updateMember:(id,data)=>setFamily(p=>p.map(m=>m.id===id?{...m,...data}:m)),
    removeMember:id=>setFamily(p=>p.filter(m=>m.id!==id)),

    /* ── TRIPS CRUD ── */
    addTrip: t=>setTrips(p=>[...p,ensureTrip({
      ...t,id:uid("tr"),
      dates:t.dateFrom&&t.dateTo?`${t.dateFrom} → ${t.dateTo}`:t.name,
      checklist:t.checklist||[
        {id:"c1",text:"Trasporto prenotato",done:false},{id:"c2",text:"Alloggio confermato",done:false},
        {id:"c3",text:"Check-in effettuato",done:false},{id:"c4",text:"Biglietti scaricati",done:false},
        {id:"c5",text:"Valuta / carte",done:false},{id:"c6",text:"Assicurazione viaggio",done:false},
      ],
      packing:t.packing||[
        {id:"pk1",cat:"Documenti",items:[{t:"Carta identità / passaporto",done:false},{t:"Tessera sanitaria",done:false}]},
        {id:"pk2",cat:"Abbigliamento",items:[{t:"Abbigliamento",done:false},{t:"Scarpe comode",done:false}]},
        {id:"pk3",cat:"Farmaci",items:[{t:"Farmaci personali",done:false},{t:"Kit pronto soccorso",done:false}]},
      ],
    })]),
    updateTrip:(tid,data)=>setTrips(p=>p.map(t=>t.id!==tid?t:ensureTrip({...t,...data,dates:data.dateFrom&&data.dateTo?`${data.dateFrom} → ${data.dateTo}`:(data.dates||t.dates)}))),
    removeTrip: tid=>setTrips(p=>p.filter(t=>t.id!==tid)),

    /* flights */
    addFlight:(tid,fl)=>mapTrip(tid,t=>({...t,flights:[...(t.flights||[]),{id:uid("f"),type:"andata",company:"",from:"",to:"",date:"",time:"",arrival:"",flightNum:"",bookingRef:"",bookingUrl:"",checkinOpen:"",checkinDeadline:"",checkinDone:false,boardingPass:false,seats:"",...fl}]})),
    updateFlight:(tid,fid,data)=>mapTrip(tid,t=>({...t,flights:(t.flights||[]).map(f=>f.id!==fid?f:{...f,...data})})),
    removeFlight:(tid,fid)=>mapTrip(tid,t=>({...t,flights:(t.flights||[]).filter(f=>f.id!==fid)})),

    /* hotels */
    addHotel:(tid,h)=>mapTrip(tid,t=>({...t,hotels:[...(t.hotels||[]),{id:uid("h"),name:"",stars:3,address:"",checkIn:"",checkInTime:"",checkOut:"",checkOutTime:"",bookingRef:"",bookingUrl:"",checkinDone:false,phone:"",notes:"",...h}]})),
    updateHotel:(tid,hid,data)=>mapTrip(tid,t=>({...t,hotels:(t.hotels||[]).map(h=>h.id!==hid?h:{...h,...data})})),
    removeHotel:(tid,hid)=>mapTrip(tid,t=>({...t,hotels:(t.hotels||[]).filter(h=>h.id!==hid)})),

    /* itinerary */
    addItineraryDay:(tid,day)=>mapTrip(tid,t=>({...t,itinerary:[...(t.itinerary||[]),{id:uid("it"),day:"",title:"",items:[],...day}]})),
    updateItineraryDay:(tid,did,data)=>mapTrip(tid,t=>({...t,itinerary:(t.itinerary||[]).map(d=>d.id!==did?d:{...d,...data})})),
    removeItineraryDay:(tid,did)=>mapTrip(tid,t=>({...t,itinerary:(t.itinerary||[]).filter(d=>d.id!==did)})),

    /* packing */
    addPackingItem:(tid,cat,item)=>mapTrip(tid,t=>{
      const pk=[...(t.packing||[])];
      const idx=pk.findIndex(p=>(p.cat||"").toLowerCase()===cat.toLowerCase());
      if(idx===-1)pk.push({id:uid("pk"),cat,items:[{t:item.t||"",done:!!item.done}]});
      else pk[idx]={...pk[idx],items:[...(pk[idx].items||[]),{t:item.t||"",done:!!item.done}]};
      return{...t,packing:pk};
    }),
    updatePackingItem:(tid,pid,idx,data)=>mapTrip(tid,t=>({...t,packing:(t.packing||[]).map(pk=>pk.id!==pid?pk:{...pk,items:(pk.items||[]).map((it,i)=>i!==idx?it:{...it,...data})})})),
    removePackingItem:(tid,pid,idx)=>mapTrip(tid,t=>({...t,packing:(t.packing||[]).map(pk=>pk.id!==pid?pk:{...pk,items:(pk.items||[]).filter((_,i)=>i!==idx)}).filter(pk=>(pk.items||[]).length>0)})),

    /* reminders */
    addReminder:(tid,r)=>mapTrip(tid,t=>({...t,reminders:[...(t.reminders||[]),{id:uid("r"),text:"",when:"",color:"#378ADD",...r}]})),
    updateReminder:(tid,rid,data)=>mapTrip(tid,t=>({...t,reminders:(t.reminders||[]).map(r=>r.id!==rid?r:{...r,...data})})),
    removeReminder:(tid,rid)=>mapTrip(tid,t=>({...t,reminders:(t.reminders||[]).filter(r=>r.id!==rid)})),

    /* toggle helpers */
    toggleCL:(tid,cid)=>mapTrip(tid,t=>({...t,checklist:t.checklist.map(c=>c.id!==cid?c:{...c,done:!c.done})})),
    togglePacking:(tid,pid,idx)=>mapTrip(tid,t=>({...t,packing:t.packing.map(pk=>pk.id!==pid?pk:{...pk,items:pk.items.map((it,i)=>i!==idx?it:{...it,done:!it.done})})})),
    toggleFlightCheckin:(tid,fid)=>mapTrip(tid,t=>({...t,flights:t.flights.map(f=>f.id!==fid?f:{...f,checkinDone:!f.checkinDone})})),
    toggleHotelCheckin:(tid,hid)=>mapTrip(tid,t=>({...t,hotels:t.hotels.map(h=>h.id!==hid?h:{...h,checkinDone:!h.checkinDone})})),

    /* misc trip */
    addItineraryItem:(tid,dayId,text)=>mapTrip(tid,t=>({...t,itinerary:t.itinerary.map(d=>d.id!==dayId?d:{...d,items:[...d.items,text]})})),
    addDiaryEntry:(tid,entry)=>mapTrip(tid,t=>({...t,diary:[{...entry,id:"de"+Date.now()},...(t.diary||[])]})),
    addExpense:(tid,exp)=>mapTrip(tid,t=>({...t,expenses:[...(t.expenses||[]),{...exp,id:"ex"+Date.now()}]})),
    removeExpense:(tid,eid)=>mapTrip(tid,t=>({...t,expenses:(t.expenses||[]).filter(e=>e.id!==eid)})),
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
   MODALS — generici
═══════════════════════════════════════════════════════════════ */
function Modal({title,onClose,children}){
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-t">{title}</div>
        {children}
      </div>
    </div>
  );
}

function readFile(file){return new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(file);});}

function openCalendarEvent(doc){
  if(!doc.expiry)return;
  const dt=new Date(doc.expiry);
  const ymd=dt.toISOString().replace(/-/g,"").slice(0,8);
  const text=encodeURIComponent(`⚠️ Scadenza: ${doc.name}`);
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${ymd}/${ymd}&details=${encodeURIComponent("Scadenza documento — Family Hub")}`, "_blank");
}

/* ═══════════════════════════════════════════════════════════════
   MODALS — documenti / meds / visite / membro / spesa
═══════════════════════════════════════════════════════════════ */
function AddDocModal({onClose}){
  const{addDoc,family,gConn}=useF();
  const[f,sf]=useState({name:"",type:"pdf",category:"Identità",person:"",date:new Date().toISOString().slice(0,10),expiry:"",size:"",driveUrl:"",preview:null,fileData:null});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const[dragging,setDragging]=useState(false);
  const handleFile=async file=>{
    if(!file)return;
    const isImg=file.type.startsWith("image/"),isPdf=file.type==="application/pdf";
    const type=isImg?"img":isPdf?"pdf":"note";
    const size=file.size>1048576?`${(file.size/1048576).toFixed(1)} MB`:`${Math.round(file.size/1024)} KB`;
    const name=f.name||file.name.replace(/\.[^/.]+$/,"");
    let preview=null;if(isImg)preview=await readFile(file);
    sf(p=>({...p,name,type,size,preview,fileData:file.name}));
  };
  const onDrop=e=>{e.preventDefault();setDragging(false);const file=e.dataTransfer.files[0];if(file)handleFile(file);};
  const onFileInput=e=>{const file=e.target.files[0];if(file)handleFile(file);};
  return(<Modal title="📄 Nuovo documento" onClose={onClose}>
    <div className="fg">
      <label className="fl">File (PDF o immagine)</label>
      <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={onDrop}
        style={{border:`2px dashed ${dragging?"#1D9E75":"#c8d4c8"}`,borderRadius:10,padding:"1rem",textAlign:"center",cursor:"pointer",background:dragging?"#E1F5EE":"#fafbfa",transition:"all .15s",marginBottom:4}}
        onClick={()=>document.getElementById("fh-file-input").click()}>
        {f.preview?<img src={f.preview} alt="anteprima" style={{maxHeight:90,borderRadius:6,objectFit:"contain"}}/>
          :f.fileData?<div style={{fontSize:13,color:"#1D9E75"}}><i className="ti ti-check" style={{fontSize:20,display:"block",marginBottom:4}}/>{f.fileData}</div>
          :<div style={{color:"#aaa",fontSize:13}}><i className="ti ti-upload" style={{fontSize:24,display:"block",marginBottom:4}}/>{gConn?"Trascina o clicca · verrà caricato su Drive":"Trascina o clicca · salvato localmente"}</div>}
      </div>
      <input id="fh-file-input" type="file" accept=".pdf,image/*" style={{display:"none"}} onChange={onFileInput}/>
    </div>
    <div className="fg"><label className="fl"><i className="ti ti-brand-google-drive" style={{color:"#34A853",marginRight:4}}/>Link Google Drive (opzionale)</label><input className="fi" value={f.driveUrl} onChange={e=>s("driveUrl",e.target.value)} placeholder="https://drive.google.com/file/d/..."/></div>
    <div className="fg"><label className="fl">Nome documento *</label><input className="fi" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Es. Tessera sanitaria Marco"/></div>
    <div className="fr">
      <div className="fg"><label className="fl">Tipo</label><select className="fi" value={f.type} onChange={e=>s("type",e.target.value)}><option value="pdf">PDF</option><option value="img">Immagine</option><option value="note">Nota</option><option value="folder">Cartella</option></select></div>
      <div className="fg"><label className="fl">Categoria</label><select className="fi" value={f.category} onChange={e=>s("category",e.target.value)}>{CATS.filter(c=>c!=="Tutte").map(c=><option key={c}>{c}</option>)}</select></div>
    </div>
    <div className="fr">
      <div className="fg"><label className="fl">Membro</label><select className="fi" value={f.person} onChange={e=>s("person",e.target.value)}><option value="">Famiglia</option>{family.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div className="fg"><label className="fl">Data documento</label><input type="date" className="fi" value={f.date} onChange={e=>s("date",e.target.value)}/></div>
    </div>
    <div className="fg"><label className="fl">Data scadenza (opzionale)</label><input type="date" className="fi" value={f.expiry} onChange={e=>s("expiry",e.target.value)}/>{f.expiry&&<div style={{fontSize:11,color:"#1D9E75",marginTop:3}}>💡 Puoi aggiungere questa scadenza a Google Calendar dall'archivio</div>}</div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={()=>{if(f.name){addDoc(f);onClose();}}}><i className="ti ti-plus"/> Aggiungi</button></div>
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
      <div className="fg"><label className="fl">Stato</label><select className="fi" value={f.status} onChange={e=>s("status",e.target.value)}><option value="new">Nuova</option><option value="confirmed">Confermata</option><option value="pending">Da confermare</option></select></div>
    </div>
    <div className="fg"><label className="fl">Medico / Struttura</label><input className="fi" value={f.doctor} onChange={e=>s("doctor",e.target.value)} placeholder="Es. Dott. Ferrara"/></div>
    <div className="fg"><label className="fl">Indirizzo</label><input className="fi" value={f.location} onChange={e=>s("location",e.target.value)} placeholder="Es. Via Roma 4"/></div>
    <div className="fr">
      <div className="fg"><label className="fl">Data</label><input type="date" className="fi" value={f.date} onChange={e=>s("date",e.target.value)}/></div>
      <div className="fg"><label className="fl">Ora</label><input type="time" className="fi" value={f.time} onChange={e=>s("time",e.target.value)}/></div>
    </div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={()=>{if(f.title&&f.date){addVisit(f);onClose();}}}><i className="ti ti-plus"/> Aggiungi</button></div>
  </Modal>);
}

function AddMemberModal({onClose,editing=null}){
  const{addMember,updateMember}=useF();
  const[f,sf]=useState({name:editing?.name||"",initials:editing?.initials||"",role:editing?.role||"",bday:editing?.bday||"",blood:editing?.blood||"",cf:editing?.cf||"",phone:editing?.phone||"",color:editing?.color||COLORS[0].c,bg:editing?.bg||COLORS[0].bg});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{if(!f.name)return;if(editing)updateMember(editing.id,f);else addMember(f);onClose();};
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
        {COLORS.map((col,i)=><div key={i} className={`color-swatch ${f.color===col.c?"sel":""}`} style={{background:col.c}} onClick={()=>sf(p=>({...p,color:col.c,bg:col.bg}))}/>)}
      </div>
    </div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={submit}><i className={`ti ${editing?"ti-check":"ti-plus"}`}/>{editing?"Salva modifiche":"Aggiungi"}</button></div>
  </Modal>);
}

function AddExpenseModal({trip,onClose}){
  const{addExpense}=useF();
  const[f,sf]=useState({desc:"",cat:"transport",amount:"",date:new Date().toISOString().slice(0,10),person:""});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  return(<Modal title={`💸 Nuova spesa — ${trip.emoji} ${trip.name}`} onClose={onClose}>
    <div className="fg"><label className="fl">Descrizione *</label><input className="fi" value={f.desc} onChange={e=>s("desc",e.target.value)} placeholder="Es. Voli AR, Hotel, Cena..."/></div>
    <div className="fr">
      <div className="fg"><label className="fl">Categoria</label><select className="fi" value={f.cat} onChange={e=>s("cat",e.target.value)}>{Object.entries(EXP_CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
      <div className="fg"><label className="fl">Importo (€) *</label><input type="number" className="fi" value={f.amount} onChange={e=>s("amount",e.target.value)} placeholder="0.00"/></div>
    </div>
    <div className="fg"><label className="fl">Data</label><input type="date" className="fi" value={f.date} onChange={e=>s("date",e.target.value)}/></div>
    <div className="fa"><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-p" onClick={()=>{if(f.desc&&f.amount){addExpense(trip.id,f);onClose();}}}><i className="ti ti-plus"/> Aggiungi spesa</button></div>
  </Modal>);
}

/* ═══════════════════════════════════════════════════════════════
   MODALS — viaggi (NUOVI)
═══════════════════════════════════════════════════════════════ */
function TripFormModal({onClose,editing=null}){
  const{addTrip,updateTrip,family}=useF();
  const[f,sf]=useState({name:editing?.name||"",emoji:editing?.emoji||"✈️",dateFrom:editing?.dateFrom||"",dateTo:editing?.dateTo||"",status:editing?.status||"planning",budget:editing?.budget||"",notes:editing?.notes||"",persons:editing?.persons||[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const tog=id=>sf(p=>({...p,persons:p.persons.includes(id)?p.persons.filter(x=>x!==id):[...p.persons,id]}));
  const submit=()=>{
    if(!f.name.trim())return;
    if(editing)updateTrip(editing.id,f);
    else addTrip(f);
    onClose();
  };
  return(<Modal title={editing?"✏️ Modifica viaggio":"✈️ Nuovo viaggio"} onClose={onClose}>
    <div className="fr">
      <div className="fg"><label className="fl">Emoji</label><input className="fi" value={f.emoji} onChange={e=>s("emoji",e.target.value)} style={{textAlign:"center",fontSize:20}}/></div>
      <div className="fg" style={{flex:3}}><label className="fl">Destinazione *</label><input className="fi" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Es. Barcellona, Trentino..."/></div>
    </div>
    <div 
