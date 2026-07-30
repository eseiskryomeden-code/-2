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
// script.js
// Announcements, Survey, Contact, Grades + Client-side Signup/Login (localStorage + SHA-256 hash)

// ----- 설정 -----
const ANN_KEY = 'school_site_announcements_v1';
const SURVEY_KEY = 'school_site_survey_v1';
const GRADES_KEY = 'school_site_grades_v1';
const USERS_KEY = 'school_site_users_v1';
const SESSION_KEY = 'school_site_session_v1';

// 교사(teacher)로 가입하려면 필요한 코드 (원하면 바꿔서 배포)
const TEACHER_SIGNUP_CODE = 'TEACHER2026';

// ----- 유틸 -----
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// SHA-256 해시(문자열 입력 -> hex 문자열 반환)
async function hashPassword(password){
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}

// ----- 사용자/세션 관리 (localStorage) -----
function loadUsers(){ const raw = localStorage.getItem(USERS_KEY); return raw ? JSON.parse(raw) : []; }
function saveUsers(arr){ localStorage.setItem(USERS_KEY, JSON.stringify(arr)); }

function getSession(){ const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; }
function setSession(obj){ if(obj) localStorage.setItem(SESSION_KEY, JSON.stringify(obj)); else localStorage.removeItem(SESSION_KEY); }

async function signup({username, nickname, password, role, teacherCode}){
  username = username.trim();
  if(!username || !password || password.length < 4) throw new Error('아이디와 4자 이상 비밀번호가 필요합니다.');
  const users = loadUsers();
  if(users.find(u => u.username === username)) throw new Error('이미 존재하는 아이디입니다.');
  if(role === 'teacher' && teacherCode !== TEACHER_SIGNUP_CODE) throw new Error('유효한 교사 가입 코드가 필요합니다.');
  const hash = await hashPassword(password);
  users.push({ username, nickname: nickname || username, passwordHash: hash, role });
  saveUsers(users);
  // 바로 로그인 시키기
  setSession({ username, nickname: nickname || username, role });
  return { username, nickname, role };
}

async function login({username, password}){
  const users = loadUsers();
  const u = users.find(x => x.username === username.trim());
  if(!u) throw new Error('아이디가 없습니다.');
  const hash = await hashPassword(password);
  if(hash !== u.passwordHash) throw new Error('비밀번호가 일치하지 않습니다.');
  setSession({ username: u.username, nickname: u.nickname, role: u.role });
  return { username: u.username, nickname: u.nickname, role: u.role };
}

function logout(){
  setSession(null);
}

// ----- UI 연결(요소 찾기) -----
const annListEl = document.getElementById('ann-list');
const addAnnBtn = document.getElementById('add-ann-btn');

const surveyForm = document.getElementById('survey-form');
const surveyResultDiv = document.getElementById('survey-result');

const contactForm = document.getElementById('contact-form');

const gradeListEl = document.getElementById('grade-list');
const gradeAdminEl = document.getElementById('grade-admin');
const gradeForm = document.getElementById('grade-form');

// auth UI
const loginUsernameEl = document.getElementById('login-username');
const loginPasswordEl = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const showSignupBtn = document.getElementById('show-signup-btn');

const signupArea = document.getElementById('signup-area');
const signupUsernameEl = document.getElementById('signup-username');
const signupNicknameEl = document.getElementById('signup-nickname');
const signupPasswordEl = document.getElementById('signup-password');
const signupPasswordConfirmEl = document.getElementById('signup-password-confirm');
const signupRoleEl = document.getElementById('signup-role');
const signupBtn = document.getElementById('signup-btn');
const cancelSignupBtn = document.getElementById('cancel-signup-btn');

const authInfoEl = document.getElementById('auth-info');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// ----- 공지 로직 (기존) -----
function loadAnns(){ const raw = localStorage.getItem(ANN_KEY); return raw ? JSON.parse(raw) : []; }
function saveAnns(list){ localStorage.setItem(ANN_KEY, JSON.stringify(list)); }
function renderAnns(){
  if(!annListEl) return;
  const list = loadAnns();
  annListEl.innerHTML = '';
  if(list.length === 0){ annListEl.innerHTML = '<li>등록된 공지사항이 없습니다.</li>'; return; }
  list.slice().reverse().forEach(a => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${escapeHtml(a.title)}</strong> <div class="small">${escapeHtml(a.time)}</div><div>${escapeHtml(a.text)}</div>`;
    annListEl.appendChild(li);
  });
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

// ----- Survey (local) -----
function loadSurvey(){ const raw = localStorage.getItem(SURVEY_KEY); return raw ? JSON.parse(raw) : []; }
function saveSurvey(arr){ localStorage.setItem(SURVEY_KEY, JSON.stringify(arr)); }
function updateSurveySummary(){ const arr = loadSurvey(); if(!surveyResultDiv) return; if(arr.length===0){ surveyResultDiv.textContent='응답이 없습니다.'; return; } const total=arr.length; const counts = {1:0,2:0,3:0,4:0,5:0}; arr.forEach(r=>counts[r.rating]=(counts[r.rating]||0)+1); surveyResultDiv.innerHTML=`총 응답: ${total} <br>5:${counts[5]} | 4:${counts[4]} | 3:${counts[3]} | 2:${counts[2]} | 1:${counts[1]}<div style="margin-top:8px;">최근 응답: ${escapeHtml(arr.slice(-1)[0].name||'익명')} - 평점 ${arr.slice(-1)[0].rating}</div>`; }
if(surveyForm){
  surveyForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('survey-name').value.trim();
    const rating = document.getElementById('survey-rating').value;
    const comment = document.getElementById('survey-comment').value.trim();
    if(!rating){ alert('만족도를 선택해주세요.'); return; }
    const arr = loadSurvey(); arr.push({name: name || '익명', rating: rating, comment: comment, time: new Date().toLocaleString()});
    saveSurvey(arr); updateSurveySummary(); surveyForm.reset(); alert('설문이 제출되었습니다. 감사합니다!');
  });
}

// ----- Contact -----
if(contactForm){
  contactForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('contact-name').value || '이름없음';
    const msg = document.getElementById('contact-msg').value || '';
    const subject = encodeURIComponent(`[대회 문의] ${name}`);
    const body = encodeURIComponent(msg + "\n\n- " + name);
    window.location.href = `mailto:youremail@example.com?subject=${subject}&body=${body}`;
  });
}

// ----- Grades board (local) -----
function loadGrades(){ const raw = localStorage.getItem(GRADES_KEY); return raw ? JSON.parse(raw) : []; }
function saveGrades(arr){ localStorage.setItem(GRADES_KEY, JSON.stringify(arr)); }
function renderGrades(){
  if(!gradeListEl) return;
  const arr = loadGrades();
  gradeListEl.innerHTML = '';
  if(arr.length === 0){ gradeListEl.innerHTML = '<div class="hint">등록된 게시글이 없습니다.</div>'; return; }
  arr.slice().reverse().forEach((g, idxRev) => {
    const idx = arr.length - 1 - idxRev;
    const item = document.createElement('div'); item.className = 'grade-item';
    item.innerHTML = `
      <h4>${escapeHtml(g.title)} <small style="font-weight:600;color:#6b7280">${escapeHtml(g.subject)}</small></h4>
      <div>${escapeHtml(g.desc)}</div>
      <div class="hint">제출기한: ${g.due || '없음'} | 작성자: ${escapeHtml(g.author || '관리자')} | ${g.time}</div>
    `;
    const session = getSession();
    const isTeacher = session && session.role === 'teacher';
    const isAuthor = session && session.username === g.author;
    if(isTeacher || isAuthor){
      const del = document.createElement('button'); del.textContent='삭제'; del.style.marginTop='6px';
      del.addEventListener('click', ()=>{ if(confirm('삭제하시겠습니까?')){ deleteGrade(idx); } });
      item.appendChild(del);
      const edit = document.createElement('button'); edit.textContent='수정'; edit.style.margin='6px';
      edit.addEventListener('click', ()=>{ editGrade(idx); });
      item.appendChild(edit);
    }
    gradeListEl.appendChild(item);
  });
}
function addGrade(obj){ const arr = loadGrades(); arr.push(obj); saveGrades(arr); renderGrades(); }
function deleteGrade(index){ const arr = loadGrades(); arr.splice(index,1); saveGrades(arr); renderGrades(); }
function editGrade(index){
  const arr = loadGrades(); const g = arr[index];
  const title = prompt('제목', g.title); if(title === null) return;
  const subject = prompt('과목', g.subject); if(subject === null) return;
  const desc = prompt('내용', g.desc); if(desc === null) return;
  const due = prompt('제출기한 (YYYY-MM-DD 또는 빈칸)', g.due || '');
  arr[index] = { ...g, title:title.trim(), subject:subject.trim(), desc:desc.trim(), due: due || null };
  saveGrades(arr); renderGrades();
}
if(gradeForm){
  gradeForm.addEventListener('submit', e=>{
    e.preventDefault();
    const session = getSession();
    if(!session || session.role !== 'teacher'){ alert('교사(관리자)로 로그인해야 작성할 수 있습니다.'); return; }
    const title = document.getElementById('grade-title').value.trim();
    const subject = document.getElementById('grade-subject').value.trim();
    const desc = document.getElementById('grade-desc').value.trim();
    const due = document.getElementById('grade-due').value || null;
    addGrade({ title, subject, desc, due, author: session.username, time: new Date().toLocaleString() });
    gradeForm.reset();
  });
}

// ----- Auth UI behaviors -----
function updateAuthUI(){
  const s = getSession();
  if(s){
    authInfoEl.textContent = `${escapeHtml(s.nickname)} (${escapeHtml(s.role)})`;
    loginBtn.style.display = 'none';
    showSignupBtn.style.display = 'none';
    adminLogoutBtn.style.display = 'inline-block';
    // show grade admin if teacher
    if(s.role === 'teacher') gradeAdminEl.style.display = 'block'; else gradeAdminEl.style.display = 'none';
  } else {
    authInfoEl.textContent = '';
    loginBtn.style.display = 'inline-block';
    showSignupBtn.style.display = 'inline-block';
    adminLogoutBtn.style.display = 'none';
    gradeAdminEl.style.display = 'none';
  }
}

// show/hide signup area
showSignupBtn && showSignupBtn.addEventListener('click', ()=>{
  signupArea.style.display = 'block';
});

// cancel signup
cancelSignupBtn && cancelSignupBtn.addEventListener('click', ()=>{
  signupArea.style.display = 'none';
});

// signup action
signupBtn && signupBtn.addEventListener('click', async ()=>{
  try{
    const username = signupUsernameEl.value.trim();
    const nickname = signupNicknameEl.value.trim();
    const pw = signupPasswordEl.value;
    const pw2 = signupPasswordConfirmEl.value;
    const role = signupRoleEl.value;
    if(pw !== pw2){ alert('비밀번호가 일치하지 않습니다.'); return; }
    await signup({ username, nickname, password: pw, role, teacherCode: role === 'teacher' ? prompt('교사 가입 코드를 입력하세요:') : null });
    alert('회원가입 및 로그인 완료되었습니다.');
    signupArea.style.display = 'none';
    // clear signup fields
    signupUsernameEl.value=''; signupNicknameEl.value=''; signupPasswordEl.value=''; signupPasswordConfirmEl.value='';
    updateAuthUI(); renderGrades();
  }catch(err){ alert(err.message || String(err)); }
});

// login action
loginBtn && loginBtn.addEventListener('click', async ()=>{
  try{
    const username = loginUsernameEl.value.trim();
    const pw = loginPasswordEl.value;
    await login({ username, password: pw });
    alert('로그인 성공');
    // clear login fields
    loginUsernameEl.value=''; loginPasswordEl.value='';
    updateAuthUI(); renderGrades();
  }catch(err){ alert(err.message || String(err)); }
});

// logout
adminLogoutBtn && adminLogoutBtn.addEventListener('click', ()=>{
  logout();
  updateAuthUI(); renderGrades();
});

// ----- 초기화 -----
renderAnns();
updateSurveySummary();
renderGrades();
updateAuthUI();
