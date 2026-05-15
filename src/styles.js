import { THEME } from "./constants.js";

export const buildCSS = (rtl) => {
  const d = rtl ? "rtl" : "ltr";
  const ta = rtl ? "right" : "left";
  return `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lora:ital@0;1&family=Source+Sans+3:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Source Sans 3',sans-serif;background:${THEME.cream};color:${THEME.espresso};direction:${d};}
.app{min-height:100vh;display:flex;flex-direction:column;}
/* Topbar */
.topbar{background:${THEME.espresso};color:${THEME.parchment};padding:0 1rem;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(44,26,14,.18);overflow:hidden;}
.logo{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:${THEME.gold};display:flex;align-items:center;gap:.4rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex-shrink:1;}
.logo-text{display:none;}
@media(min-width:480px){.logo-text{display:inline;}}
.topbar-right{display:flex;align-items:center;gap:.5rem;flex-shrink:0;}
.topbar-user{font-size:.8rem;color:${THEME.tan};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;}
/* Nav */
.nav-tabs{display:flex;border-bottom:2px solid ${THEME.parchment};background:#fff;position:sticky;top:56px;z-index:90;}
.nav-tab{flex:1;padding:.8rem;text-align:center;cursor:pointer;font-size:.88rem;font-weight:500;color:${THEME.brown};border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;}
.nav-tab.act{color:${THEME.rust};border-bottom-color:${THEME.rust};}
/* Main */
.main{flex:1;}
.page{max-width:960px;margin:0 auto;padding:1.5rem 1rem;}
.ph{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;gap:1rem;}
.pt{font-family:'Playfair Display',serif;font-size:1.6rem;color:${THEME.espresso};}
.ps{font-size:.88rem;color:${THEME.tan};font-family:'Lora',serif;font-style:italic;}
/* Buttons */
.btn{display:inline-flex;align-items:center;gap:.4rem;padding:.55rem 1.1rem;border-radius:7px;border:none;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-size:.88rem;font-weight:500;transition:all .15s;}
.btn-p{background:${THEME.rust};color:#fff;} .btn-p:hover{background:#a04e2f;}
.btn-s{background:transparent;color:${THEME.brown};border:1.5px solid ${THEME.tan};} .btn-s:hover{border-color:${THEME.brown};}
.btn-d{background:transparent;color:#c0392b;border:1.5px solid #f1aaa0;} .btn-d:hover{background:#fdf0ee;}
.btn-g{background:rgba(255,255,255,.12);color:${THEME.parchment};border:1px solid rgba(255,255,255,.2);}
.btn-ic{background:none;border:none;color:${THEME.brown};font-size:1.1rem;padding:.2rem .4rem;}
.btn-sm{padding:.35rem .75rem;font-size:.82rem;}
/* Fields */
.field{margin-bottom:1.2rem;}
.field label{display:block;font-size:.78rem;font-weight:600;color:${THEME.darkBrown};margin-bottom:.35rem;text-transform:uppercase;letter-spacing:.05em;}
.fi{width:100%;padding:.55rem .9rem;border:1.5px solid ${THEME.tan};border-radius:6px;font-size:.92rem;font-family:'Source Sans 3',sans-serif;background:#fff;outline:none;color:${THEME.espresso};direction:${d};text-align:${ta};}
.fi:focus{border-color:${THEME.brown};}
textarea.fi{resize:vertical;min-height:80px;}
/* Login */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:${THEME.cream};padding:1rem;}
.login-card{background:#fff;border-radius:14px;padding:2.5rem 2rem;width:100%;max-width:400px;box-shadow:0 8px 40px rgba(44,26,14,.12);border:1px solid ${THEME.parchment};}
.login-title{font-family:'Playfair Display',serif;font-size:1.8rem;color:${THEME.espresso};margin-bottom:.3rem;}
.login-sub{font-family:'Lora',serif;font-style:italic;color:${THEME.brown};margin-bottom:1.8rem;font-size:.95rem;}
/* Search */
.search-bar{display:flex;align-items:center;gap:.5rem;background:#fff;border:1.5px solid ${THEME.tan};border-radius:8px;padding:.5rem 1rem;margin-bottom:1rem;}
.search-bar input{border:none;background:transparent;outline:none;flex:1;font-size:.95rem;color:${THEME.espresso};font-family:'Source Sans 3',sans-serif;direction:${d};text-align:${ta};}
/* Filters */
.filter-bar{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem;align-items:center;}
.chip{padding:.3rem .8rem;border-radius:20px;border:1.5px solid ${THEME.tan};font-size:.8rem;cursor:pointer;background:#fff;color:${THEME.brown};transition:all .15s;}
.chip:hover{border-color:${THEME.brown};} .chip.act{background:${THEME.brown};color:#fff;border-color:${THEME.brown};}
.fl{font-size:.8rem;color:${THEME.brown};font-weight:500;}
/* Cards */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.4rem;}
.card{background:#fff;border-radius:10px;border:1px solid ${THEME.parchment};overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 2px 8px rgba(44,26,14,.07);}
.card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(44,26,14,.13);}
.card-cover{height:130px;background:${THEME.parchment};display:flex;align-items:center;justify-content:center;overflow:hidden;}
.card-cover img,.card-rimg img{width:100%;height:100%;object-fit:cover;}
.card-body{padding:1rem 1.1rem;}
.card-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:600;color:${THEME.espresso};margin-bottom:.3rem;word-break:break-word;overflow-wrap:break-word;}
.card-desc{font-size:.82rem;color:${THEME.brown};font-family:'Lora',serif;font-style:italic;line-height:1.4;}
.card-meta{display:flex;justify-content:space-between;align-items:center;margin-top:.8rem;padding-top:.7rem;border-top:1px solid ${THEME.parchment};}
.card-count{font-size:.78rem;color:${THEME.tan};}
.card-creator{font-size:.78rem;color:${THEME.sage};}
.card-rimg{height:160px;background:${THEME.parchment};display:flex;align-items:center;justify-content:center;overflow:hidden;}
.card-rtags{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.5rem;}
.tag{padding:.15rem .55rem;border-radius:12px;font-size:.72rem;font-weight:500;}
.tag-t{background:${THEME.parchment};color:${THEME.darkBrown};}
.tag-d{background:#fef3e2;color:#9a6600;}
.tag-c{background:#e8f0e4;color:#4a6741;}
/* Add card */
.add-card{border:2px dashed ${THEME.tan};border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;cursor:pointer;min-height:180px;color:${THEME.tan};transition:all .15s;background:transparent;}
.add-card:hover{border-color:${THEME.brown};color:${THEME.brown};background:rgba(212,184,150,.07);}
/* Modal */
.backdrop{position:fixed;inset:0;background:rgba(44,26,14,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;}
.modal{background:${THEME.cream};border-radius:12px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(44,26,14,.25);border:1px solid ${THEME.parchment};direction:${d};}
.modal-hd{padding:1.5rem 2rem 1rem;border-bottom:1px solid ${THEME.parchment};display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:${THEME.cream};z-index:1;}
.modal-title{font-family:'Playfair Display',serif;font-size:1.4rem;color:${THEME.espresso};}
.modal-body{padding:1.5rem 2rem;}
.modal-ft{padding:1rem 2rem 1.5rem;display:flex;justify-content:flex-end;gap:.7rem;border-top:1px solid ${THEME.parchment};}
/* Recipe detail */
.rdetail{max-width:780px;margin:0 auto;padding:2rem;}
.rhero{width:100%;max-height:340px;object-fit:cover;border-radius:10px;margin-bottom:1.5rem;}
.rtitle{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:700;color:${THEME.espresso};line-height:1.2;margin-bottom:.6rem;word-break:break-word;overflow-wrap:break-word;}
.rdesc{font-family:'Lora',serif;font-style:italic;color:${THEME.brown};font-size:1.05rem;line-height:1.6;margin-bottom:1rem;}
.rmeta-row{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem;}
.rsource{font-size:.82rem;color:${THEME.tan};font-style:italic;}
.rsec{margin-bottom:2rem;}
.rsec-title{font-family:'Playfair Display',serif;font-size:1.2rem;color:${THEME.darkBrown};margin-bottom:1rem;padding-bottom:.4rem;border-bottom:1.5px solid ${THEME.parchment};}
.ing-list{list-style:none;}
.ing-item{padding:.45rem 0;border-bottom:1px dotted ${THEME.parchment};font-size:.95rem;display:grid;grid-template-columns:3.5rem 4rem 1fr;gap:.3rem .8rem;align-items:baseline;}
.ing-qty{font-weight:500;color:${THEME.darkBrown};}
.ing-unit{color:${THEME.brown};font-size:.88rem;}
.ing-name{}
.step-list{list-style:none;}
.step-item{padding:1rem 0;border-bottom:1px solid ${THEME.parchment};display:flex;gap:1rem;}
.step-num{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:${THEME.tan};min-width:32px;line-height:1;margin-top:2px;}
.step-con{flex:1;}
.step-txt{font-size:.95rem;line-height:1.6;}
.step-img{width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin-top:.7rem;}
.notes-box{background:#fffbf3;border-left:3px solid ${THEME.gold};padding:1rem 1.2rem;border-radius:0 8px 8px 0;font-family:'Lora',serif;font-style:italic;color:${THEME.darkBrown};font-size:.95rem;line-height:1.6;}
.stat-row{display:flex;gap:1.5rem;flex-wrap:wrap;padding:.8rem 1rem;background:${THEME.warm};border-radius:8px;margin-bottom:1.5rem;}
.stat{font-size:.8rem;color:${THEME.brown};}
.stat strong{display:block;font-size:.72rem;color:${THEME.tan};text-transform:uppercase;letter-spacing:.05em;}
/* Permissions */
.perm-row{display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid ${THEME.parchment};font-size:.88rem;}
/* Image input */
.img-row{display:flex;gap:.5rem;margin-bottom:.5rem;flex-wrap:wrap;}
.img-previews{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem;}
.img-prev{position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1.5px solid ${THEME.tan};}
.img-prev img{width:100%;height:100%;object-fit:cover;}
.img-rm{position:absolute;top:2px;right:2px;background:rgba(44,26,14,.7);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.img-role{position:absolute;bottom:0;left:0;right:0;font-size:8px;background:rgba(44,26,14,.6);color:#fff;text-align:center;padding:1px;cursor:pointer;}
/* List editor */
.le{display:flex;flex-direction:column;gap:.5rem;}
.le-row{display:flex;gap:.4rem;align-items:center;}
.le-row input{flex:1;padding:.45rem .7rem;border:1.5px solid ${THEME.tan};border-radius:5px;font-size:.88rem;font-family:'Source Sans 3',sans-serif;background:#fff;outline:none;direction:${d};text-align:${ta};}
.le-row input:focus{border-color:${THEME.brown};}
.le-add{background:transparent;border:1.5px dashed ${THEME.tan};color:${THEME.brown};padding:.4rem .8rem;border-radius:5px;cursor:pointer;font-size:.82rem;font-family:'Source Sans 3',sans-serif;}
.le-add:hover{border-color:${THEME.brown};}
/* Source tabs */
.src-tabs{display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:1rem;}
.src-tab{padding:.5rem .3rem;text-align:center;cursor:pointer;font-size:.8rem;font-family:'Source Sans 3',sans-serif;background:#fff;color:${THEME.brown};border:1.5px solid ${THEME.tan};border-radius:6px;transition:all .15s;}
.src-tab:hover{background:${THEME.parchment};}
.src-tab.act{background:${THEME.brown};color:#fff;border-color:${THEME.brown};}
/* AI status */
.ai-st{background:${THEME.warm};border:1px solid ${THEME.tan};border-radius:6px;padding:.7rem 1rem;font-size:.85rem;color:${THEME.darkBrown};margin-bottom:1rem;display:flex;align-items:center;gap:.5rem;}
.spinner{width:18px;height:18px;border:2.5px solid ${THEME.tan};border-top-color:${THEME.rust};border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg);}}
/* Book detail */
.bk-hd{background:#fff;border-bottom:1px solid ${THEME.parchment};padding:1.5rem 2rem;display:flex;align-items:flex-start;gap:1.5rem;}
.bk-cover{width:100px;height:100px;border-radius:8px;border:2px solid ${THEME.parchment};flex-shrink:0;background:${THEME.parchment};display:flex;align-items:center;justify-content:center;font-size:2.5rem;overflow:hidden;}
.bk-cover img{width:100%;height:100%;object-fit:cover;}
.bk-name{font-family:'Playfair Display',serif;font-size:1.8rem;color:${THEME.espresso};}
.bk-desc{font-family:'Lora',serif;font-style:italic;color:${THEME.brown};font-size:.95rem;margin-top:.3rem;}
.bk-meta{font-size:.8rem;color:${THEME.tan};margin-top:.5rem;}
/* Misc */
.back-btn{display:inline-flex;align-items:center;gap:.4rem;color:${THEME.brown};background:none;border:none;cursor:pointer;font-size:.88rem;font-family:'Source Sans 3',sans-serif;padding:.3rem 0;margin-bottom:1rem;}
.back-btn:hover{color:${THEME.rust};}
.empty{text-align:center;padding:4rem 2rem;color:${THEME.tan};}
.empty-icon{font-size:3rem;margin-bottom:.8rem;}
.empty-txt{font-family:'Lora',serif;font-style:italic;}
.act-row{display:flex;gap:.5rem;}
.divider{height:1px;background:${THEME.parchment};margin:1.2rem 0;}
.bk-cbs{display:flex;flex-direction:column;gap:.4rem;max-height:150px;overflow-y:auto;padding:.3rem 0;}
.bk-cb{display:flex;align-items:center;gap:.5rem;font-size:.88rem;cursor:pointer;}
.sl{font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:${THEME.tan};margin-bottom:.5rem;}
/* Tag input */
.tag-wrap{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;border:1.5px solid ${THEME.tan};border-radius:6px;padding:.4rem .6rem;background:#fff;cursor:text;}
.tag-wrap input{border:none;outline:none;font-size:.88rem;font-family:'Source Sans 3',sans-serif;min-width:80px;flex:1;background:transparent;direction:${d};text-align:${ta};}
.tpill{display:inline-flex;align-items:center;gap:.3rem;padding:.15rem .5rem;background:${THEME.parchment};border-radius:12px;font-size:.78rem;color:${THEME.darkBrown};}
.tpill button{background:none;border:none;cursor:pointer;color:${THEME.brown};font-size:.8rem;padding:0;}
/* Step editor */
.step-ed{background:#fff;border:1.5px solid ${THEME.parchment};border-radius:8px;padding:.8rem;margin-bottom:.5rem;}
.step-ed-n{font-family:'Playfair Display',serif;font-size:1.1rem;color:${THEME.tan};font-weight:700;margin-bottom:.4rem;}
/* Toast */
.toast{position:fixed;bottom:2rem;right:2rem;background:${THEME.espresso};color:${THEME.parchment};padding:.7rem 1.2rem;border-radius:8px;font-size:.88rem;z-index:500;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:ti .2s ease;}
@keyframes ti{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
/* Translation banner */
.trans-banner{display:flex;align-items:center;gap:.7rem;background:${THEME.warm};border:1px solid ${THEME.tan};border-radius:8px;padding:.6rem 1rem;margin-bottom:1.2rem;font-size:.85rem;color:${THEME.darkBrown};}
/* Lang select */
.lang-sel{padding:.3rem .6rem;border:1.5px solid rgba(255,255,255,.2);border-radius:6px;font-size:.82rem;font-family:'Source Sans 3',sans-serif;background:rgba(255,255,255,.1);color:${THEME.parchment};outline:none;cursor:pointer;}
.lang-sel option{background:${THEME.espresso};color:${THEME.parchment};}
`;
};
