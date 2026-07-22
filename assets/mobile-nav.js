(function(){
  'use strict';
  function ensureInstagramFooterLinks(){
    var footer=document.querySelector('footer .foot');
    if(!footer)return;
    var columns=footer.children;
    var target=null;
    for(var i=0;i<columns.length;i++){
      var heading=columns[i].querySelector&&columns[i].querySelector('h4');
      if(heading&&heading.textContent.trim()==='문의'){target=columns[i];break}
    }
    if(!target&&columns.length)target=columns[columns.length-1];
    if(!target)return;
    var channels=[
      {href:'https://www.instagram.com/medihim.kr/',text:'메디힘 Instagram ↗',label:'메디힘 인스타그램 새 창에서 열기'},
      {href:'https://www.instagram.com/ippeo_jp/',text:'이뻐 Japan Instagram ↗',label:'이뻐 일본 공식 인스타그램 새 창에서 열기'}
    ];
    for(var j=0;j<channels.length;j++){
      var channel=channels[j];
      if(target.querySelector('a[href="'+channel.href+'"]'))continue;
      var link=document.createElement('a');
      link.href=channel.href;
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.className='footer-instagram-link';
      link.setAttribute('aria-label',channel.label);
      link.textContent=channel.text;
      target.appendChild(link);
    }
  }
  function ensureFooterLegal(){
    var footer=document.querySelector('footer');
    if(!footer){
      footer=document.createElement('footer');
      footer.className='mh-legal-only';
      document.body.appendChild(footer);
    }
    if(footer.querySelector('.footer-legal'))return;
    var legal=document.createElement('div');
    legal.className='wrap footer-legal';
    legal.innerHTML='<address class="footer-company-info" aria-label="메디힘 사업자 정보">'+
      '<span><b>사업자번호</b> 512-86-03805</span>'+
      '<span><b>외국인환자 유치사업자 등록번호</b> A-2026-01-06978호</span>'+
      '<span><b>주소</b> 서울 서초구 잠원동 25-13 리더스빌딩 2F</span>'+
      '</address>'+
      '<p class="footer-content-rights">본 사이트의 모든 콘텐츠(텍스트, 이미지, 디자인, UI 등)의 저작권은 ㈜메디힘에 있으며, 사전 서면 동의 없이 전재, 전송, 복제, 배포, 스크래핑, 변형 및 상업적 이용을 금합니다.</p>'+
      '<p class="footer-copyright">Copyright © 2026 medihim Inc. All Rights Reserved.</p>';
    footer.appendChild(legal);
  }
  ensureInstagramFooterLinks();
  ensureFooterLegal();
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
