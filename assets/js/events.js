(function(){
  var doc=document,reel=doc.getElementById('reel'),pin=doc.getElementById('reel-pin'),world=doc.getElementById('reel-world');
  var works=[].slice.call(doc.querySelectorAll('.rw')),bg=doc.getElementById('reel-bg');
  var cur=doc.getElementById('reel-cur'),tot=doc.getElementById('reel-tot'),bar=doc.getElementById('reel-bar');
  var nview=doc.getElementById('nview'),rnote=doc.getElementById('reel-note'),sect=doc.getElementById('events');
  var relayout=function(){},setReelFilter=function(){};
  function setView(v){
    var normal=v==='normal';
    reel.hidden=normal;rnote.hidden=normal;nview.hidden=!normal;
    [].forEach.call(doc.querySelectorAll('.vswitch button'),function(b){var on=b.getAttribute('data-view')===v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
    window.scrollTo({top:sect.getBoundingClientRect().top+window.scrollY,behavior:'auto'});
    if(!normal)relayout();
  }
  [].forEach.call(doc.querySelectorAll('.vswitch button'),function(b){b.addEventListener('click',function(){setView(b.getAttribute('data-view'));});});
  /* keep the two filter groups and the grid cards in sync */
  var nfb=[].slice.call(doc.querySelectorAll('.nview .filters button'));
  nfb.forEach(function(b){b.addEventListener('click',function(){setReelFilter(b.getAttribute('data-filter'),true);});});
  function syncNormal(f){
    nfb.forEach(function(x){x.classList.toggle('on',x.getAttribute('data-filter')===f);});
    [].forEach.call(doc.querySelectorAll('.ev-card'),function(c){c.classList.toggle('is-hidden',f!=='all'&&c.getAttribute('data-kind')!==f);});
  }
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){reel.classList.add('static');
    [].forEach.call(doc.querySelectorAll('.reel-head .rfilters button'),function(b){b.addEventListener('click',function(){var f=b.getAttribute('data-filter');
      [].forEach.call(doc.querySelectorAll('.reel-head .rfilters button'),function(x){x.classList.toggle('on',x===b);});
      [].forEach.call(doc.querySelectorAll('.rw'),function(w){w.classList.toggle('is-hidden',f!=='all'&&w.getAttribute('data-kind')!==f);});syncNormal(f);});});
    return;}
  /* big faded word behind */
  var word=doc.createElement('div');word.className='reel-word';
  'EVENTS'.split('').forEach(function(ch){var i=doc.createElement('i');i.textContent=ch;word.appendChild(i);});
  bg.appendChild(word);var letters=[].slice.call(word.children);
  var vis=works.slice(),H=1,W=1,unit=1,wW=1,fw=1,fh=1,mobile=false,pos=0,target=0,raf=0,last=0,active=true;
  var FOV=40,DIST=6,AR=16/9;
  function sm(a,b,x){var t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);}
  function pose(e){ /* same spatial curve as the reference reel: e = index - position */
    var n=Math.max(0,e),s=Math.max(0,-e),wh=2*Math.tan(FOV*Math.PI/360)*DIST,ww=wh*W/H;
    return {
      x:e>=0?Math.sin(1.1*n)*ww*.74:-(.814*ww)*s*(1+.12*s),
      y:e>=0?Math.sin(.95*n)*wh*.2:-(.2*wh)*Math.sin(.95*s)*(1+.3*s),
      z:e>=0?-(3*n):3*s-s*s*.3,
      ry:e>=0?-(.55*Math.sin(Math.min(n,1.5))):s*(.55+.17*s),
      rz:e>=0?-(.16*Math.sin(1.2*n)):s*(.192+.048*s),
      op:e>=0?1-sm(1.9,3,n):1-sm(.66,1.05,s),
      cap:1-sm(.08,.4,Math.abs(e))};
  }
  function layout(){
    H=pin.clientHeight;W=pin.clientWidth;mobile=W<780;
    fh=Math.min(.54*H,W*(mobile?.9:.72)/AR);fw=fh*AR;
    var wh=2*Math.tan(FOV*Math.PI/360)*DIST;unit=wh/H;
    pin.style.setProperty('--fw',fw+'px');pin.style.setProperty('--fh',fh+'px');
    world.style.setProperty('--persp',(DIST/unit)+'px');
    reel.style.height=(H+Math.max(0,vis.length-1)*H*(mobile?.95:1.1))+'px';
    tot.textContent=String(vis.length).padStart(2,'0');
    readScroll();render(true);
  }
  function readScroll(){
    var top=reel.getBoundingClientRect().top+window.scrollY; /* document y of reel top */
    var d=H*(mobile?.95:1.1);
    target=vis.length>1?Math.min(vis.length-1,Math.max(0,(window.scrollY-top)/d)):0;
  }
  function render(force){
    var ci=Math.round(pos);
    vis.forEach(function(w,i){
      var p=pose(i-pos);
      w.style.transform='translate(-50%,-50%) translate3d('+(p.x/unit)+'px,'+(-p.y/unit)+'px,'+(p.z/unit)+'px) rotateY('+p.ry+'rad) rotateZ('+(-p.rz)+'rad)';
      w.style.opacity=p.op;w.style.visibility=p.op<.002?'hidden':'visible';
      w.querySelector('.rw-cap').style.opacity=p.cap;
      var isCur=i===ci;
      if(isCur){w.setAttribute('data-current','true');w.removeAttribute('aria-hidden');w.querySelector('a').tabIndex=0;}
      else{w.removeAttribute('data-current');w.setAttribute('aria-hidden','true');w.querySelector('a').tabIndex=-1;}
    });
    letters.forEach(function(l,i){var r=.95*pos-.55*i;
      l.style.transform='translate3d('+(.018*Math.sin(.7*r))+'em,'+(.07*Math.sin(r))+'em,0) rotate('+(1.4*Math.sin(.6*r))+'deg)';
      l.style.opacity=.075+.018*Math.cos(r);});
    cur.textContent=String(Math.min(vis.length,ci+1)).padStart(2,'0');
    bar.style.strokeDashoffset=vis.length>1?1-pos/(vis.length-1):0;
  }
  function tick(t){
    raf=0;var dt=Math.min(.1,(t-last)/1000||.016);last=t;
    pos+=(target-pos)*(1-Math.exp(-dt*7));
    if(Math.abs(target-pos)<.0004)pos=target;
    render();
    if(pos!==target&&active)raf=requestAnimationFrame(tick);
  }
  function kick(){readScroll();if(!raf&&active){last=performance.now();raf=requestAnimationFrame(tick);}}
  window.addEventListener('scroll',kick,{passive:true});
  window.addEventListener('resize',function(){clearTimeout(window.__rt);window.__rt=setTimeout(layout,120);});
  new IntersectionObserver(function(es){active=es[0].isIntersecting;if(active)kick();},{rootMargin:'200px 0px'}).observe(reel);
  /* filters rebuild the reel */
  var fb=[].slice.call(doc.querySelectorAll('.reel-head .rfilters button'));
  setReelFilter=function(f,fromNormal){
    fb.forEach(function(x){x.classList.toggle('on',x.getAttribute('data-filter')===f);});
    works.forEach(function(w){w.classList.toggle('is-hidden',f!=='all'&&w.getAttribute('data-kind')!==f);});
    vis=works.filter(function(w){return !w.classList.contains('is-hidden');});
    syncNormal(f);
    if(fromNormal)return; /* reel is hidden while the normal view is open; it re-lays out when shown */
    var top=reel.getBoundingClientRect().top+window.scrollY;
    pos=0;target=0;layout();
    window.scrollTo({top:Math.min(window.scrollY,top),behavior:'auto'});readScroll();pos=target;render();
  };
  fb.forEach(function(b){b.addEventListener('click',function(){setReelFilter(b.getAttribute('data-filter'));});});
  relayout=function(){pos=0;target=0;layout();pos=target;render();};
  layout();
  if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(layout);
})();
