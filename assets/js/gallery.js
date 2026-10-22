(function(){
  var doc=document,fine=matchMedia('(pointer: fine)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards=[].slice.call(doc.querySelectorAll('.gcard'));
  /* images: set data-src on a .g-art (or add src in markup) to replace the placeholder */
  cards.forEach(function(c){var a=c.querySelector('.g-art'),s=a.getAttribute('data-src');
    if(s){var im=new Image();im.src=s;im.alt=c.dataset.cap;im.loading='lazy';a.classList.remove('ph');a.textContent='';a.appendChild(im);}});
  /* reveal */
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.1});
  cards.forEach(function(c){io.observe(c);});
  /* tilt + sheen + image parallax */
  if(fine&&!reduced){cards.forEach(function(c){
    var b=c.querySelector('.g-inner');
    b.addEventListener('mousemove',function(e){
      var r=b.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      b.style.setProperty('--tilt-y',(x*7)+'deg');b.style.setProperty('--tilt-x',(-y*6)+'deg');
      b.style.setProperty('--ix',(-x*14)+'px');b.style.setProperty('--iy',(-y*10)+'px');
      b.style.setProperty('--lx',(x*60)+'%');
    });
    b.addEventListener('mouseleave',function(){['--tilt-x','--tilt-y','--ix','--iy'].forEach(function(p){b.style.setProperty(p,p.indexOf('t')>-1?'0deg':'0px');});b.style.setProperty('--lx','-60%');});
  });}
  /* filter */
  var tabs=[].slice.call(doc.querySelectorAll('.gal-tabs button'));
  function applyFilter(f){
    tabs.forEach(function(t){t.classList.toggle('on',t.dataset.f===f);});
    cards.forEach(function(c){c.classList.toggle('is-hidden',f!=='all'&&c.dataset.ev!==f);c.classList.add('in');});
    try{history.replaceState(null,'',f==='all'?location.pathname:'?event='+f);}catch(e){}
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){applyFilter(t.dataset.f);});});
  var q=(location.search.match(/event=([a-z]+)/)||[])[1];
  if(q&&tabs.some(function(t){return t.dataset.f===q;}))applyFilter(q);
  /* lightbox */
  var lb=doc.getElementById('lb'),art=doc.getElementById('lb-art'),cur=0,last=null;
  function vis(){return cards.filter(function(c){return !c.classList.contains('is-hidden');});}
  function show(i){var v=vis();cur=(i+v.length)%v.length;var c=v[cur],src=c.querySelector('.g-art').getAttribute('data-src');
    art.className='g-art '+(src?'':'ph '+c.dataset.tone);art.innerHTML=src?'<img src="'+src+'" alt="">':'<span class="gl">'+c.dataset.gl+'</span>';
    doc.getElementById('lb-ev').textContent=c.dataset.name;doc.getElementById('lb-cap').textContent=c.dataset.cap;}
  function open(c){last=c;show(vis().indexOf(c));lb.classList.add('open');doc.body.classList.add('lb-open');doc.getElementById('lb-x').focus();}
  function close(){lb.classList.remove('open');doc.body.classList.remove('lb-open');if(last)last.querySelector('.g-inner').focus();}
  cards.forEach(function(c){c.querySelector('.g-inner').addEventListener('click',function(){open(c);});});
  doc.getElementById('lb-x').addEventListener('click',close);
  doc.getElementById('lb-prev').addEventListener('click',function(){show(cur-1);});
  doc.getElementById('lb-next').addEventListener('click',function(){show(cur+1);});
  lb.addEventListener('click',function(e){if(e.target===lb)close();});
  doc.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;
    if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(cur-1);else if(e.key==='ArrowRight')show(cur+1);});
})();
