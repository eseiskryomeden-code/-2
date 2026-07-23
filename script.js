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
