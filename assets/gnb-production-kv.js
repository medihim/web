(function(){
  'use strict';
  var maps={
    company:{label:'MEDICAL ECOSYSTEM',nodes:['의료진','환자','글로벌 시장','기술·서비스'],result:'지속 가능한 의료 생태계'},
    business:{label:'GROWTH SYSTEM',nodes:['시장 진단','마케팅','상담·예약','CRM·운영'],result:'반복 가능한 성장'},
    platform:{label:'PATIENT JOURNEY',nodes:['탐색','상담','예약·방문','귀국 후 연결'],result:'안심할 수 있는 결정'},
    projects:{label:'EXECUTION LOOP',nodes:['문제 진단','구조 설계','현장 실행','데이터 개선'],result:'검증 가능한 성과'},
    insights:{label:'KNOWLEDGE FLOW',nodes:['시장 데이터','환자 행동','운영 경험','관점·해석'],result:'다음 의사결정'},
    careers:{label:'PEOPLE SYSTEM',nodes:['전문성','협업','실험','책임'],result:'함께 만드는 기준'}
  };
  document.querySelectorAll('.menu-kv').forEach(function(section){
    var data=maps[section.dataset.menu],stage=section.querySelector('.menu-kv-stage');
    if(!data||!stage||stage.querySelector('.menu-system-map'))return;
    var map=document.createElement('div');map.className='menu-system-map';map.setAttribute('aria-label',data.nodes.join(', ')+'을 연결해 '+data.result+'을 만드는 메디힘의 구조');
    map.innerHTML='<div class="menu-system-label">'+data.label+'</div><div class="menu-system-photo"><span>HUMAN EXPERIENCE</span></div><div class="menu-system-orbit"><span class="menu-system-node node-1">'+data.nodes[0]+'</span><span class="menu-system-node node-2">'+data.nodes[1]+'</span><span class="menu-system-node node-3">'+data.nodes[2]+'</span><span class="menu-system-node node-4">'+data.nodes[3]+'</span><span class="menu-system-core"><b>MEDIHIM</b><small>CONNECT · ORCHESTRATE</small></span></div><div class="menu-system-result"><small>CREATED VALUE</small><strong>'+data.result+'</strong></div>';
    stage.appendChild(map);
  });
})();