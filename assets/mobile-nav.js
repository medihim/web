(function(){
  'use strict';
  if(document.querySelector('.mh-menu-toggle'))return;
  var nav=document.querySelector('header .nav');
  var source=nav&&nav.querySelector('.gnb');
  if(!nav||!source)return;
  var toggle=document.createElement('button');
  toggle.className='mh-menu-toggle';toggle.type='button';toggle.setAttribute('aria-label','전체 메뉴 열기');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','mh-mobile-menu');
  toggle.innerHTML='<span></span><span></span><span></span>';
  nav.appendChild(toggle);
  var menu=document.createElement('div');
  menu.className='mh-mobile-menu';menu.id='mh-mobile-menu';menu.setAttribute('aria-hidden','true');
  menu.innerHTML='<button class="mh-mobile-backdrop" type="button" aria-label="메뉴 닫기"></button><aside class="mh-mobile-panel" aria-label="모바일 전체 메뉴"><div class="mh-mobile-head"><b>MEDIHIM MENU</b><button class="mh-mobile-close" type="button" aria-label="메뉴 닫기">×</button></div><nav class="mh-mobile-nav">'+source.innerHTML+'</nav><a class="mh-mobile-cta" href="contact.html">메디힘에 문의하기 <span>↗</span></a><div class="mh-mobile-foot">MEDICAL ECOSYSTEM ORCHESTRATOR</div></aside>';
  document.body.appendChild(menu);
  var panel=menu.querySelector('.mh-mobile-panel');
  var closeBtn=menu.querySelector('.mh-mobile-close');
  var backdrop=menu.querySelector('.mh-mobile-backdrop');
  var lastFocus=null;
  function openMenu(){lastFocus=document.activeElement;menu.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','전체 메뉴 닫기');document.body.classList.add('mh-menu-open');requestAnimationFrame(function(){menu.classList.add('is-open');closeBtn.focus()})}
  function closeMenu(returnFocus){menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','전체 메뉴 열기');document.body.classList.remove('mh-menu-open');setTimeout(function(){menu.setAttribute('aria-hidden','true')},340);if(returnFocus!==false)(lastFocus||toggle).focus()}
  toggle.addEventListener('click',function(){if(menu.classList.contains('is-open'))closeMenu();else openMenu()});
  closeBtn.addEventListener('click',function(){closeMenu()});backdrop.addEventListener('click',function(){closeMenu()});
  menu.querySelectorAll('a').forEach(function(link){link.addEventListener('click',function(){closeMenu(false)})});
  document.addEventListener('keydown',function(event){if(!menu.classList.contains('is-open'))return;if(event.key==='Escape'){event.preventDefault();closeMenu();return}if(event.key==='Tab'){var items=Array.prototype.slice.call(panel.querySelectorAll('a,button')).filter(function(el){return !el.disabled&&el.offsetParent!==null});if(!items.length)return;var first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});
  window.addEventListener('resize',function(){if(window.innerWidth>900&&menu.classList.contains('is-open'))closeMenu(false)},{passive:true});
})();