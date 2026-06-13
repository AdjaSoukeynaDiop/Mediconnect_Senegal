export const C = {
  primary:"#0d7a6e", primaryDark:"#065f52", primaryDeep:"#044840",
  primaryLight:"#14a896", primaryPale:"#e6f7f5", primaryMid:"#0a8f82",
  accent:"#1ecb88", accentWarm:"#f0a500",
  surface:"#ffffff", surfaceAlt:"#f8fdfc", bg:"#f2fbf9",
  text:"#0c2826", textMid:"#2a5e58", textLight:"#6a9e98",
  border:"#cce9e5", borderLight:"#e4f4f1",
  danger:"#c93535", warning:"#e07228",
};

export const F = {
  title: "'Bricolage Grotesque', sans-serif",
  body:  "'Outfit', sans-serif",
};

export const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Outfit',sans-serif;background:#f2fbf9;color:#0c2826;min-height:100vh;}
  button{font-family:inherit;cursor:pointer;border:none;}
  input,textarea,select{font-family:inherit;}
  ::selection{background:#e6f7f5;color:#065f52;}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#cce9e5;border-radius:3px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  .fade-up-1{animation:fadeUp 0.6s ease 0.1s both;}
  .fade-up-2{animation:fadeUp 0.6s ease 0.2s both;}
  .fade-up-3{animation:fadeUp 0.6s ease 0.3s both;}
  .fade-up-4{animation:fadeUp 0.6s ease 0.4s both;}
  table{width:100%;border-collapse:collapse;}
  thead tr{background:#f2fbf9;}
  th{padding:0.6rem 0.9rem;text-align:left;font-size:0.67rem;font-weight:600;color:#6a9e98;text-transform:uppercase;letter-spacing:0.07em;}
  td{padding:0.68rem 0.9rem;border-bottom:1px solid #e4f4f1;vertical-align:middle;font-size:0.8rem;}
  tbody tr{cursor:pointer;transition:background .12s;}
  tbody tr:hover{background:#e6f7f5;}
  tbody tr:last-child td{border-bottom:none;}
  .leaflet-container{font-family:'Outfit',sans-serif;z-index:1;}
  .leaflet-popup-content-wrapper{border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.12);font-family:'Outfit',sans-serif;}
  .leaflet-control-zoom a{font-family:sans-serif;}
`;
