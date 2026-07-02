// Gemini Sanctuary shared JS
(function(){
  const c = document.getElementById('starfield');
  if(!c) return;
  const ctx = c.getContext('2d');
  let stars = [];
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.floor(window.innerWidth * dpr);
    c.height = Math.floor(window.innerHeight * dpr);
    c.style.width = window.innerWidth + 'px';
    c.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stars = Array.from({length: reduce ? 80 : 200}, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.2,
      a: Math.random() * Math.PI * 2,
      s: Math.random() * 0.006 + 0.002
    }));
  }
  resize();
  window.addEventListener('resize', resize, {passive:true});
  function draw(){
    if(!document.getElementById('starfield')) return;
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    for(const s of stars){
      s.a += s.s;
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(220,195,145,${0.2 + Math.sin(s.a) * 0.25})`;
      ctx.fill();
    }
    if(!reduce) requestAnimationFrame(draw);
  }
  draw();
})();

function gsToast(msg){
  const el=document.createElement('div');
  el.className='toast';
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2500);
}

async function gsCopy(text){
  try{
    await navigator.clipboard.writeText(text);
    gsToast('已复制');
  }catch(e){
    const ta=document.createElement('textarea');
    ta.value=text;
    ta.style.position='fixed';
    ta.style.opacity='0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    gsToast('已复制');
  }
}
