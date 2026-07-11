(function(){
  'use strict';
  if(document.querySelector('.mh-scroll-control'))return;
  var control=document.createElement('div');
  control.className='mh-scroll-control';
  control.setAttribute('aria-label','페이지 스크롤 도구');
  control.innerHTML='<button class="mh-scroll-btn mh-scroll-down" type="button" aria-label="다음 콘텐츠로 이동"><small>SCROLL<br>DOWN</small><svg viewBox="0 0 24 32" fill="none" aria-hidden="true"><path d="M12 2v25M4 20l8 8 8-8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="mh-scroll-btn mh-scroll-top" type="button" aria-label="페이지 맨 위로 이동"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 14l7-7 7 7M12 7v12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>BACK TO TOP</span></button>';
  document.body.appendChild(control);
  var down=control.querySelector('.mh-scroll-down');
  var top=control.querySelector('.mh-scroll-top');
  function reduced(){return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches}
  function update(){
    var max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    var y=Math.max(0,window.scrollY||document.documentElement.scrollTop);
    var progress=Math.min(1,y/max);
    control.style.setProperty('--scroll-progress',(progress*360)+'deg');
    control.classList.toggle('is-scrolled',y>Math.min(260,window.innerHeight*.34));
    control.classList.toggle('is-bottom',progress>.97);
  }
  function nextSection(){
    var y=(window.scrollY||0)+90;
    var sections=Array.prototype.slice.call(document.querySelectorAll('main section, body > section'));
    var target=sections.find(function(section){return section.getBoundingClientRect().top+(window.scrollY||0)>y+80});
    var topY=target?target.getBoundingClientRect().top+(window.scrollY||0)-80:(window.scrollY||0)+window.innerHeight*.82;
    window.scrollTo({top:topY,behavior:reduced()?'auto':'smooth'});
  }
  down.addEventListener('click',nextSection);
  top.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduced()?'auto':'smooth'})});
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  update();
})();