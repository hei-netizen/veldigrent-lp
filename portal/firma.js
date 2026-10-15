/* Firmavelger for den felles kundeportalen (Rask Flytting / Veldig Rent).
   Valget huskes (localStorage + ?firma=) og styrer hva Rapporter/Annonser viser.
   Elementer med data-firma-kun="vr|rf" vises bare for det firmaet. */
(()=>{
const F={rf:{navn:'Rask Flytting',logo:'/oppstart/logo-raskflytting.png',slug:'raskflytting'},
         vr:{navn:'Veldig Rent',logo:'/oppstart/logo.png',slug:'veldigrent'}};
const HOOK='https://hook.eu1.make.com/1arekwfeky6chrxvuop8iiuwwf0gi5bg';
const les=()=>{try{return localStorage.getItem('vr-rf-firma')}catch(e){return null}};
const skriv=v=>{try{localStorage.setItem('vr-rf-firma',v)}catch(e){}};
const q=new URLSearchParams(location.search).get('firma');
let firma=(q in F)?q:(les() in F?les():'vr');
skriv(firma);
document.documentElement.dataset.firma=firma;

function merk(){ /* rapporter: slug i lenken avgjør firma */
  document.querySelectorAll('a.ritem[href*="/rapporter/"]').forEach(a=>{
    for(const k in F) if(a.getAttribute('href').includes('-'+F[k].slug+'/')) a.dataset.firmaKun=k;});
  document.querySelectorAll('[data-firma-navn]').forEach(e=>e.textContent=F[firma].navn);
  document.querySelectorAll('a[href^="/portal/"],a[href^="/oppstart/"]').forEach(a=>{
    if(a.closest('.firma'))return;const u=new URL(a.href,location.origin);u.searchParams.set('firma',firma);a.href=u.pathname+u.search+u.hash;});
}
function velg(k,push){
  firma=k;skriv(k);document.documentElement.dataset.firma=k;
  document.querySelectorAll('.firma a').forEach(a=>a.setAttribute('aria-current',a.dataset.f===k));
  if(push){const u=new URL(location.href);u.searchParams.set('firma',k);history.replaceState(null,'',u.pathname+u.search+u.hash)}
  merk();dispatchEvent(new CustomEvent('firma',{detail:k}));
}
let data=null;
function tell(){ /* røde tall per firma + menyens Annonser-teller for valgt firma */
  if(!data)return;const n=k=>data.ider.filter(i=>i.startsWith(k+'_')&&!data.st[i]).length;
  document.querySelectorAll('.firma a').forEach(a=>{const t=a.querySelector('i'),v=n(a.dataset.f);t.textContent=v||'';v?t.setAttribute('aria-label',v+' annonser venter på svar'):t.removeAttribute('aria-label')});
  const b=document.querySelector('.pnav a[href^="/portal/annonser/"] .badge');if(b){const v=n(firma);b.textContent=v>99?'99+':v;b.hidden=!v}
}
addEventListener('firma',tell);
function bygg(){
  const h=document.querySelector('header');if(!h||document.querySelector('.firma'))return;
  const bar=document.createElement('div');bar.className='firma';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','Velg firma');
  bar.innerHTML='<div class="wrap">'+Object.entries(F).map(([k,v])=>
    `<a href="?firma=${k}" data-f="${k}" aria-current="${k===firma}"><img src="${v.logo}" alt=""><span><b>${v.navn}</b><small>${k===firma?'Valgt portal':'Bytt til denne'}</small></span><i></i></a>`).join('')+'</div>';
  h.after(bar);
  bar.querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();velg(a.dataset.f,true);
    bar.querySelectorAll('a small').forEach(s=>s.textContent=s.closest('a').dataset.f===firma?'Valgt portal':'Bytt til denne')});
  merk();setTimeout(tell,1500);
  /* røde tall: annonser som venter på svar, per firma (id-prefiks vr_/rf_) */
  Promise.all([fetch('/portal/annonser/ider.json').then(r=>r.json()),fetch(HOOK+'?handling=hent&kunde=veldigrent').then(r=>r.json()).catch(()=>({}))])
   .then(([ider,st])=>{data={ider,st};tell()}).catch(()=>{});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bygg):bygg();
})();
