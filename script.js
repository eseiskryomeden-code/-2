// script.js
// 아주 기본적인 공지 저장/표시 (localStorage 사용)
const ANN_KEY = 'school_site_announcements_v1';
const annListEl = document.getElementById('ann-list');
const addAnnBtn = document.getElementById('add-ann-btn');

function loadAnns(){
  const raw = localStorage.getItem(ANN_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveAnns(list){
  localStorage.setItem(ANN_KEY, JSON.stringify(list));
}
function renderAnns(){
  const list = loadAnns();
  if(!annListEl) return;
  annListEl.innerHTML = '';
  if(list.length === 0){
    annListEl.innerHTML = '<li>등록된 공지사항이 없습니다.</li>';
    return;
  }
  list.slice().reverse().forEach((a) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${escapeHtml(a.title)}</strong> <div class="small">${escapeHtml(a.time)}</div><div>${escapeHtml(a.text)}</div>`;
    annListEl.appendChild(li);
  });
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
addAnnBtn && addAnnBtn.addEventListener('click', () => {
  const title = prompt('공지 제목을 입력하세요:');
  if(!title) return;
  const text = prompt('공지 내용을 입력하세요:');
  if(text === null) return;
  const list = loadAnns();
  list.push({title: title.trim(), text: text.trim(), time: new Date().toLocaleString()});
  saveAnns(list);
  renderAnns();
});

// contact form -> 메일 열기 (간단)
const contactForm = document.getElementById('contact-form');
contactForm && contactForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('contact-name').value || '이름없음';
  const msg = document.getElementById('contact-msg').value || '';
  const subject = encodeURIComponent(`[대회 문의] ${name}`);
  const body = encodeURIComponent(msg + "\n\n- " + name);
  window.location.href = `mailto:youremail@example.com?subject=${subject}&body=${body}`;
});

renderAnns();
// 임시 관리자 로그인 (테스트용)
const ADMIN_PASSWORD = 'pass1234';
function isAdmin(){ return sessionStorage.getItem('isAdmin') === '1'; }
function setAdmin(flag){ sessionStorage.setItem('isAdmin', flag ? '1' : '0'); updateAdminUI(); }
// 기존에 grade-admin 요소가 있으면 보여주고, 아니면 숨김 처리
function updateAdminUI(){ const el = document.getElementById('grade-admin'); if(!el) return; if(isAdmin()) el.style.display='block'; else el.style.display='none'; }
// 간단 로그인 버튼 삽입(grade-list 바로 위)
(function addTempAdminButtons(){
  const gradeList = document.getElementById('grade-list'); if(!gradeList) return;
  const wrap = document.createElement('div'); wrap.style.margin='8px 0';
  const login = document.createElement('button'); login.textContent='임시 관리자 로그인';
  const logout = document.createElement('button'); logout.textContent='임시 관리자 로그아웃'; logout.style.display='none';
  wrap.appendChild(login); wrap.appendChild(logout);
  gradeList.parentNode.insertBefore(wrap, gradeList);
  login.addEventListener('click', ()=>{
    const pw = prompt('관리자 비밀번호 입력:');
    if(pw === ADMIN_PASSWORD){ setAdmin(true); login.style.display='none'; logout.style.display='inline-block'; alert('관리자 로그인 성공'); } else alert('비밀번호 틀림');
  });
  logout.addEventListener('click', ()=>{ setAdmin(false); login.style.display='inline-block'; logout.style.display='none'; alert('로그아웃'); });
  if(isAdmin()){ login.style.display='none'; logout.style.display='inline-block'; }
})();
