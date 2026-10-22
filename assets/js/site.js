'use strict';
(function(){
  var doc=document, body=doc.body, html=doc.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var isTop = window === window.top;

  /* ---------- PRELOADER ---------- */
  var loader=doc.getElementById('loader'), bar=doc.getElementById('loader-bar'), pctEl=doc.getElementById('loader-pct');
  var prog=0;
  var loadTimer=setInterval(function(){
    prog=Math.min(100, prog + Math.random()*18 + 6);
    bar.style.transform='scaleX('+(prog/100)+')';
    pctEl.textContent=String(Math.floor(prog)).padStart(2,'0');
    if(prog>=100){clearInterval(loadTimer);setTimeout(finish,280);}
  },110);
  if(reduced){clearInterval(loadTimer);prog=100;bar.style.transform='scaleX(1)';pctEl.textContent='100';setTimeout(finish,120);}
  var finished=false;
  function finish(){
    if(finished)return;finished=true;
    loader.classList.add('done');
    body.classList.add('loaded');
    doc.dispatchEvent(new Event('innovanta:ready'));
  }

  /* ---------- SPLIT CHARS (hero) — word-wrapped so wrapping stays natural ---------- */
  function charsOf(text,meta){
    var frag=doc.createDocumentFragment();
    text.split(/(\s+)/).forEach(function(tok){
      if(!tok)return;
      if(/^\s+$/.test(tok)){frag.appendChild(doc.createTextNode(tok));return;}
      var wEl=doc.createElement('span');wEl.className='w';
      tok.split('').forEach(function(ch){
        var s=doc.createElement('span');s.className='ch';s.textContent=ch;
        s.style.setProperty('--ci',meta.ci++);
        wEl.appendChild(s);
      });
      frag.appendChild(wEl);
    });
    return frag;
  }
  doc.querySelectorAll('[data-ch]').forEach(function(el){
    var meta={ci:0};
    var kids=[].slice.call(el.childNodes);
    var frag=doc.createDocumentFragment();
    kids.forEach(function(node){
      if(node.nodeType===3){frag.appendChild(charsOf(node.textContent,meta));}
      else if(node.nodeType===1){
        var txt=node.textContent;node.textContent='';
        node.appendChild(charsOf(txt,meta));
        frag.appendChild(node);
      }else{frag.appendChild(node);}
    });
    el.textContent='';el.appendChild(frag);
  });

  /* ---------- GRADIENT LINE: continuous gradient across per-char spans ---------- */
  var gLines=[].slice.call(doc.querySelectorAll('h1 .ln em'));
  function paintGradient(){
    gLines.forEach(function(em){
      var er=em.getBoundingClientRect();
      var spans=[].slice.call(em.querySelectorAll('.ch'));
      var w=Math.max(1,er.width);
      em.style.setProperty('--gw',w+'px');
      spans.forEach(function(s){
        var x=s.getBoundingClientRect().left-er.left;
        s.style.backgroundPositionX=(-x)+'px';
        s.style.backgroundSize=w+'px 100%';
      });
    });
  }
  paintGradient();
  doc.addEventListener('innovanta:ready',function(){paintGradient();setTimeout(paintGradient,600);setTimeout(paintGradient,1300);});
  window.addEventListener('resize',function(){clearTimeout(window.__pgT);window.__pgT=setTimeout(paintGradient,150);});
  if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(paintGradient);

  /* ---------- NAV ---------- */
  var nav=doc.getElementById('nav');
  function onScrollNav(){nav.classList.toggle('scrolled',window.scrollY>24);}
  window.addEventListener('scroll',onScrollNav,{passive:true});onScrollNav();

  var burger=doc.getElementById('burger'),menu=doc.getElementById('menu');
  burger.addEventListener('click',function(){
    var open=menu.classList.toggle('open');
    burger.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',open);
    body.classList.toggle('locked',open);
  });
  menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){
    menu.classList.remove('open');burger.classList.remove('open');body.classList.remove('locked');
  });});

  /* nav active section */
  var secIds=['about','pillars','opportunities','events','join'];
  var linkMap={};
  doc.querySelectorAll('.nav-links a').forEach(function(a){
    var id=(a.getAttribute('href')||'').replace('#','');linkMap[id]=a;
  });
  var secObs=new IntersectionObserver(function(es){
    es.forEach(function(e){
      var a=linkMap[e.target.id];if(!a)return;
      if(e.isIntersecting){for(var k in linkMap)linkMap[k].classList.remove('active');a.classList.add('active');}
    });
  },{rootMargin:'-45% 0px -50% 0px'});
  secIds.forEach(function(id){var el=doc.getElementById(id);if(el)secObs.observe(el);});

  /* ---------- REVEAL ---------- */
  var revObs=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');revObs.unobserve(e.target);}});
  },{rootMargin:'0px 0px -8% 0px',threshold:.08});
  doc.querySelectorAll('.reveal').forEach(function(el){revObs.observe(el);});

  /* ---------- WORD SCRUB ---------- */
  var scrubEls=[].slice.call(doc.querySelectorAll('[data-scrub]'));
  scrubEls.forEach(function(el){
    el.innerHTML=el.textContent.trim().split(/\s+/).map(function(w){return '<span class="word">'+w+'</span>';}).join(' ');
  });
  var scrubWords=scrubEls.map(function(el){return [].slice.call(el.querySelectorAll('.word'));});
  var scrubRAF=false;
  function scrub(){
    scrubRAF=false;
    scrubEls.forEach(function(el,i){
      var r=el.getBoundingClientRect();
      var vh=window.innerHeight;
      var p=(vh*0.82 - r.top)/(r.height + vh*0.22);
      p=Math.max(0,Math.min(1,p));
      var n=Math.round(p*scrubWords[i].length*1.25);
      scrubWords[i].forEach(function(w,j){w.classList.toggle('on',j<n);});
    });
  }
  window.addEventListener('scroll',function(){if(!scrubRAF){scrubRAF=true;requestAnimationFrame(scrub);}},{passive:true});
  window.addEventListener('resize',scrub);scrub();

  /* ---------- COUNTERS ---------- */
  var cObs=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;cObs.unobserve(e.target);
      var target=+e.target.getAttribute('data-count')||0;
      if(reduced){e.target.textContent=target;return;}
      var t0=null,dur=1600;
      function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/dur);var ease=1-Math.pow(1-p,3);
        e.target.textContent=Math.round(target*ease);if(p<1)requestAnimationFrame(step);}
      requestAnimationFrame(step);
    });
  },{threshold:.5});
  doc.querySelectorAll('[data-count]').forEach(function(el){cObs.observe(el);});

  /* ---------- CLOCK ---------- */
  function tickClock(){
    try{
      var f=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',weekday:'short',day:'2-digit',month:'short',hour12:false});
      var parts=f.formatToParts(new Date());
      var g=function(t){var x=parts.find(function(p){return p.type===t;});return x?x.value:'';};
      var str=g('hour')+':'+g('minute')+' · '+g('weekday')+' '+g('day')+' '+g('month');
      var c1=doc.getElementById('clock'),c2=doc.getElementById('clock2');
      if(c1)c1.textContent=str;if(c2)c2.textContent=g('hour')+':'+g('minute');
    }catch(e){}
  }
  tickClock();setInterval(tickClock,15000);

  /* ---------- DEADLINE COUNTDOWNS ---------- */
  doc.querySelectorAll('[data-deadline]').forEach(function(el){
    try{
      var d=new Date(el.getAttribute('data-deadline'));
      var days=Math.ceil((d-new Date())/86400000);
      el.textContent = days>1 ? '· in '+days+' days' : days===1 ? '· last day!' : '· closed';
      if(days<=1)el.style.color='#B26A00';
    }catch(e){}
  });

  /* ---------- FILTERS ---------- */
  var fbtns=doc.querySelectorAll('.filters button'),cards=doc.querySelectorAll('.ev-card');
  fbtns.forEach(function(b){b.addEventListener('click',function(){
    fbtns.forEach(function(x){x.classList.remove('on');});b.classList.add('on');
    var f=b.getAttribute('data-filter');
    cards.forEach(function(c,i){
      var show=(f==='all')||(c.getAttribute('data-kind')===f);
      c.classList.toggle('is-hidden',!show);
      if(show&&!reduced){c.classList.remove('fade-in');void c.offsetWidth;c.style.animationDelay=(i%4)*60+'ms';c.classList.add('fade-in');}
    });
  });});

  /* ---------- TOAST ---------- */
  var toast=doc.getElementById('toast'),toastMsg=doc.getElementById('toast-msg'),toastT=null;
  doc.addEventListener('click',function(e){
    var t=e.target.closest('[data-toast]');
    if(!t)return;
    if(t.getAttribute('href')==='#'||t.getAttribute('href')===null||t.getAttribute('href')&&t.getAttribute('href').indexOf('#')===0){e.preventDefault();}
    toastMsg.textContent=t.getAttribute('data-toast')||'Done ✓';
    toast.classList.add('show');
    clearTimeout(toastT);toastT=setTimeout(function(){toast.classList.remove('show');},2800);
  });

  /* ---------- JOIN FORM ---------- */
  var form=doc.getElementById('join-form'),msg=document.getElementById('form-msg');
  if(form){form.addEventListener('submit',function(e){
    e.preventDefault();
    var nameEl=form.querySelector('#jf-name'), emailEl=form.querySelector('#jf-email');
    var name=nameEl.value.trim(), email=emailEl.value.trim();
    var ok=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    if(!name){msg.textContent='Please tell us your name first.';msg.classList.add('err');return;}
    if(!ok){msg.textContent='That email doesn\u2019t look right — check it once.';msg.classList.add('err');return;}
    msg.classList.remove('err');
    msg.textContent='Welcome aboard, '+name.split(' ')[0]+' ✓ — we\u2019ll reach out at '+email+' within 48 hours.';
    form.reset();
  });}

  /* ---------- CURSOR ---------- */
  if(fine&&!reduced){
    var dot=doc.querySelector('.cursor'),ring=doc.querySelector('.cursor-ring');
    var mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
    window.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;},{passive:true});
    (function loop(){rx+=(mx-rx)*.16;ry+=(my-ry)*.16;
      dot.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';
      ring.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);})();
    doc.addEventListener('mouseover',function(e){
      body.classList.toggle('hovering',!!e.target.closest('a,button,[data-media],input,select,.pcard,.ev-card'));
    });
  }

  /* ---------- MAGNET BUTTONS ---------- */
  if(fine&&!reduced){
    doc.querySelectorAll('[data-magnet]').forEach(function(el){
      el.addEventListener('mousemove',function(e){
        var r=el.getBoundingClientRect();
        var x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;
        el.style.transform='translate('+(x*10)+'px,'+(y*8)+'px)';
      });
      el.addEventListener('mouseleave',function(){el.style.transform='';});
    });
  }

  /* ---------- OPP MEDIAL HOVER ---------- */
  var media=doc.getElementById('opp-media');
  if(media&&fine){
    var rows=doc.querySelectorAll('.opp-row');
    var cardsM=[].slice.call(media.querySelectorAll('.card'));
    var tx=0,ty=0,cx=0,cy=0,active=false;
    rows.forEach(function(row){
      row.addEventListener('mouseenter',function(){
        var idx=+row.getAttribute('data-media')-1;
        cardsM.forEach(function(c,i){c.hidden=(i!==idx);});
        media.classList.add('show');active=true;
      });
      row.addEventListener('mouseleave',function(){media.classList.remove('show');active=false;});
    });
    window.addEventListener('mousemove',function(e){tx=e.clientX;ty=e.clientY;},{passive:true});
    (function mloop(){cx+=(tx-cx)*.13;cy+=(ty-cy)*.13;
      if(active){media.style.left=cx+'px';media.style.top=cy+'px';}
      requestAnimationFrame(mloop);})();
  }

  /* ---------- WEBGL SHADER GRADIENTS ---------- */
  var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS=[
  'precision highp float;',
  'uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;uniform float u_dark;',
  'uniform vec3 u_c0,u_c1,u_c2,u_c3;',
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
  'float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));',
  'return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.1+vec2(9.3,4.7);a*=.5;}return v;}',
  'void main(){',
  'vec2 uv=(gl_FragCoord.xy-.5*u_res)/u_res.y;',
  'vec2 p=uv*1.35+.09*u_mouse;',
  'float t=u_time;',
  'vec2 q=vec2(fbm(p+t*.07),fbm(p+vec2(5.2,1.3)-t*.06));',
  'float f=fbm(p+1.7*q+vec2(1.7,9.2)*t*.045);',
  'vec3 col=mix(u_c0,u_c1,smoothstep(.18,.78,f+.3*q.x-.12));',
  'col=mix(col,u_c2,smoothstep(.32,.95,q.y+f*.55-.1));',
  'col=mix(col,u_c3,smoothstep(.6,1.3,p.y*.42+f*.9+u_dark*.1));',
  'col*=.97+.03*smoothstep(-.65,.9,uv.y);',
  'float g=hash(gl_FragCoord.xy+fract(u_time)*vec2(37.0,71.0));',
  'col+=(g-.5)*(u_dark>.5?.05:.028);',
  'gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  function hex(v){v=v.replace('#','');return [parseInt(v.substr(0,2),16)/255,parseInt(v.substr(2,2),16)/255,parseInt(v.substr(4,2),16)/255];}
  function makeShader(canvas,opts){
    if(!canvas)return null;
    var gl=null;
    try{gl=canvas.getContext('webgl',{antialias:false,alpha:false,depth:false,stencil:false,powerPreference:'low-power'})||canvas.getContext('experimental-webgl');}catch(e){}
    if(!gl){if(opts.fallback){var fb=opts.fallback();if(fb)fb.hidden=false;canvas.remove();}return null;}
    function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));return null;}return s;}
    var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);
    if(!vs||!fs){if(opts.fallback){var fb=opts.fallback();if(fb)fb.hidden=false;}return null;}
    var prog2=gl.createProgram();gl.attachShader(prog2,vs);gl.attachShader(prog2,fs);gl.linkProgram(prog2);
    if(!gl.getProgramParameter(prog2,gl.LINK_STATUS)){if(opts.fallback){var fb2=opts.fallback();if(fb2)fb2.hidden=false;}return null;}
    gl.useProgram(prog2);
    var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(prog2,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    var U={};['u_res','u_time','u_mouse','u_dark','u_c0','u_c1','u_c2','u_c3'].forEach(function(n){U[n]=gl.getUniformLocation(prog2,n);});
    gl.uniform3fv(U.u_c0,hex(opts.c0));gl.uniform3fv(U.u_c1,hex(opts.c1));gl.uniform3fv(U.u_c2,hex(opts.c2));gl.uniform3fv(U.u_c3,hex(opts.c3));
    gl.uniform1f(U.u_dark,opts.dark?1:0);
    var mouse=[0,0],tm=[0,0],speed=opts.speed||1;
    if(fine){window.addEventListener('mousemove',function(e){
      var r=canvas.getBoundingClientRect();
      tm=[((e.clientX-r.left)/r.width-.5)*1.4,(-((e.clientY-r.top)/r.height-.5))*1.4];
    },{passive:true});}
    function resize(){
      var dpr=Math.min(window.devicePixelRatio||1,opts.dark?1.2:1.6);
      var w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
      gl.uniform2f(U.u_res,canvas.width,canvas.height);
    }
    var time=opts.seed||0,visible=true,rafId=0;
    var vis=new IntersectionObserver(function(es){visible=es[0].isIntersecting;},{rootMargin:'120px'});
    vis.observe(canvas);
    function frame(){
      rafId=requestAnimationFrame(frame);
      if(!visible){return;}
      resize();
      mouse[0]+=(tm[0]-mouse[0])*.03;mouse[1]+=(tm[1]-mouse[1])*.03;
      if(!reduced)time+=0.016*speed;
      gl.uniform1f(U.u_time,time);
      gl.uniform2f(U.u_mouse,mouse[0],mouse[1]);
      gl.drawArrays(gl.TRIANGLES,0,3);
      if(reduced){cancelAnimationFrame(rafId);}
    }
    resize();frame();
    canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();cancelAnimationFrame(rafId);if(opts.fallback){var fb3=opts.fallback();if(fb3)fb3.hidden=false;}});
    return {gl:gl,resize:resize};
  }

  var heroCanvas=doc.getElementById('hero-gl');
  makeShader(heroCanvas,{
    c0:'#F8F5EE',c1:'#CDBBFF',c2:'#FFD9A6',c3:'#8F6BF0',speed:1,seed:3.7,
    fallback:function(){return doc.querySelector('.hero-fallback');}
  });
  var ctaCanvas=doc.getElementById('cta-gl');
  makeShader(ctaCanvas,{
    c0:'#0C0816',c1:'#3B1E8C',c2:'#7A4B12',c3:'#6D3BE0',dark:true,speed:1.4,seed:9.2
  });

  /* ---------- SMOOTH ANCHOR OFFSET ---------- */
  doc.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href');
      if(id.length<2)return;
      var el=doc.querySelector(id);
      if(!el)return;
      e.preventDefault();
      var y=el.getBoundingClientRect().top+window.scrollY-(id==='#home'?70:84);
      window.scrollTo({top:y,behavior:reduced?'auto':'smooth'});
    });
  });

  /* ---------- RESIZE FIX FOR CANVAS CSS ---------- */
  window.addEventListener('resize',function(){}, {passive:true});

  /* in top frame nothing else; keep isTop for future */
  if(!isTop){/* embedded in preview iframe — everything above already works */}
})();
