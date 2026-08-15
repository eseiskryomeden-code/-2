// script.js
// 아주 기본적인 공지 저장/표시 (localStorage 사용)
const ANN_KEY = 'school_site_announcements_v1';
const AUTH_KEY = 'school_site_auth_v1';
const USERS_KEY = 'school_site_users_v1';
const BOARD_KEY = 'school_site_board_posts_v1';
const memoryStorage = Object.create(null);

function getStorageValue(key){
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return memoryStorage[key] ?? null;
  }
}

function setStorageValue(key, value){
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    memoryStorage[key] = value;
  }
}

function removeStorageValue(key){
  try {
    localStorage.removeItem(key);
  } catch (error) {
    delete memoryStorage[key];
  }
}

const annListEl = document.getElementById('ann-list');
const addAnnBtn = document.getElementById('add-ann-btn');
const openAuthBtn = document.getElementById('open-auth-btn');
const closeAuthBtn = document.getElementById('close-auth-btn');
const authPanelSection = document.getElementById('auth-panel-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logout-btn');
const authStatusEl = document.getElementById('auth-status');
const loginUsernameEl = document.getElementById('login-username');
const loginPasswordEl = document.getElementById('login-password');
const signupUsernameEl = document.getElementById('signup-username');
const signupPasswordEl = document.getElementById('signup-password');
const signupConfirmEl = document.getElementById('signup-confirm');
const boardLists = {
  free: document.getElementById('board-list-free'),
  info: document.getElementById('board-list-info'),
  study: document.getElementById('board-list-study'),
  mentor: document.getElementById('board-list-mentor')
};
const boardDetailEl = document.getElementById('board-detail');
const boardDetailTitleEl = document.getElementById('board-detail-title');
const boardDetailMetaEl = document.getElementById('board-detail-meta');
const boardDetailContentEl = document.getElementById('board-detail-content');
const boardDetailActionsEl = document.getElementById('board-detail-actions');
const boardEditForm = document.getElementById('board-edit-form');
const boardEditTitleEl = document.getElementById('board-edit-title');
const boardEditContentEl = document.getElementById('board-edit-content');
const boardDetailCloseBtn = document.getElementById('board-detail-close');
const boardEditCancelBtn = document.getElementById('board-edit-cancel');
const boardCommentForm = document.getElementById('board-comment-form');
const boardCommentInputEl = document.getElementById('board-comment-input');
const boardCommentListEl = document.getElementById('board-comment-list');
const boardLikeBtn = document.getElementById('board-like-btn');
const boardLikeCountEl = document.getElementById('board-like-count');
const boardDislikeBtn = document.getElementById('board-dislike-btn');
const boardDislikeCountEl = document.getElementById('board-dislike-count');
let currentBoardPostId = null;

function loadAnns(){
  const raw = getStorageValue(ANN_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveAnns(list){
  setStorageValue(ANN_KEY, JSON.stringify(list));
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

function getAuth(){
  const raw = getStorageValue(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

function loadUsers(){
  const raw = getStorageValue(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function loadBoardPosts(){
  const raw = getStorageValue(BOARD_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveBoardPosts(posts){
  setStorageValue(BOARD_KEY, JSON.stringify(posts));
}

function saveUsers(users){
  setStorageValue(USERS_KEY, JSON.stringify(users));
}

function isLoggedIn(){
  return Boolean(getAuth());
}

function renderAuth(){
  const auth = getAuth();
  if(!authStatusEl) return;
  if(auth && auth.username){
    authStatusEl.textContent = `환영합니다, ${auth.username}님`;
    loginForm && (loginForm.hidden = true);
    logoutBtn && (logoutBtn.hidden = false);
    addAnnBtn && (addAnnBtn.disabled = false);
  } else {
    authStatusEl.textContent = '';
    loginForm && (loginForm.hidden = false);
    logoutBtn && (logoutBtn.hidden = true);
    addAnnBtn && (addAnnBtn.disabled = true);
  }
}

function setAuth(username){
  setStorageValue(AUTH_KEY, JSON.stringify({ username }));
  renderAuth();
}

function clearAuth(){
  removeStorageValue(AUTH_KEY);
  renderAuth();
}

function openAuthPanel(){
  if(authPanelSection){ authPanelSection.hidden = false; }
  document.body.classList.add('modal-open');
}

function closeAuthPanel(){
  if(authPanelSection){ authPanelSection.hidden = true; }
  document.body.classList.remove('modal-open');
}

loginForm && loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = loginUsernameEl ? loginUsernameEl.value.trim() : '';
  const password = loginPasswordEl ? loginPasswordEl.value : '';
  const users = loadUsers();
  const registered = users.find(user => user.username === username && user.password === password);
  if(username === 'admin' && password === '1234' || registered){
    setAuth(username);
    if(authStatusEl){ authStatusEl.textContent = '로그인되었습니다.'; }
    if(loginUsernameEl) loginUsernameEl.value = '';
    if(loginPasswordEl) loginPasswordEl.value = '';
  } else {
    if(authStatusEl){ authStatusEl.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.'; }
  }
});

openAuthBtn && openAuthBtn.addEventListener('click', () => {
  openAuthPanel();
});

closeAuthBtn && closeAuthBtn.addEventListener('click', () => {
  closeAuthPanel();
});

signupForm && signupForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = signupUsernameEl ? signupUsernameEl.value.trim() : '';
  const password = signupPasswordEl ? signupPasswordEl.value : '';
  const confirmPassword = signupConfirmEl ? signupConfirmEl.value : '';
  if(!username || !password){
    if(authStatusEl){ authStatusEl.textContent = '아이디와 비밀번호를 모두 입력하세요.'; }
    return;
  }
  if(password !== confirmPassword){
    if(authStatusEl){ authStatusEl.textContent = '비밀번호가 일치하지 않습니다.'; }
    return;
  }
  const users = loadUsers();
  if(users.some(user => user.username === username)){
    if(authStatusEl){ authStatusEl.textContent = '이미 사용 중인 아이디입니다.'; }
    return;
  }
  users.push({ username, password });
  saveUsers(users);
  setAuth(username);
  if(authStatusEl){ authStatusEl.textContent = '회원가입이 완료되었습니다.'; }
  signupForm.reset();
  closeAuthPanel();
});

logoutBtn && logoutBtn.addEventListener('click', () => {
  clearAuth();
  if(authStatusEl){ authStatusEl.textContent = '로그아웃되었습니다.'; }
});

addAnnBtn && addAnnBtn.addEventListener('click', () => {
  if(!isLoggedIn()){
    alert('공지 추가는 로그인 후 이용할 수 있습니다.');
    return;
  }
  const title = prompt('공지 제목을 입력하세요:');
  if(!title) return;
  const text = prompt('공지 내용을 입력하세요:');
  if(text === null) return;
  const list = loadAnns();
  list.push({title: title.trim(), text: text.trim(), time: new Date().toLocaleString()});
  saveAnns(list);
  renderAnns();
});

function renderBoard(){
  const posts = loadBoardPosts();
  Object.entries(boardLists).forEach(([key, listEl]) => {
    if(!listEl) return;
    const categoryPosts = posts.filter(post => post.category === key).slice().reverse();
    listEl.innerHTML = '';
    if(categoryPosts.length === 0){
      listEl.innerHTML = '<li>아직 작성된 글이 없습니다.</li>';
      return;
    }
    categoryPosts.forEach(post => {
      const li = document.createElement('li');
      const titleButton = document.createElement('button');
      titleButton.type = 'button';
      titleButton.className = 'board-post-link';
      titleButton.textContent = post.title;
      titleButton.addEventListener('click', () => openBoardDetail(post.id));
      li.appendChild(titleButton);
      const meta = document.createElement('div');
      meta.className = 'board-meta';
      meta.textContent = `${post.author} · ${post.time}`;
      li.appendChild(meta);
      const content = document.createElement('div');
      content.textContent = post.content;
      li.appendChild(content);
      listEl.appendChild(li);
    });
  });
  if(currentBoardPostId){
    const post = loadBoardPosts().find(item => item.id === currentBoardPostId);
    if(post){
      renderBoardDetail(post);
    } else {
      closeBoardDetail();
    }
  }
}

function closeBoardDetail(){
  currentBoardPostId = null;
  if(boardDetailEl){ boardDetailEl.hidden = true; }
  if(boardEditForm){ boardEditForm.hidden = true; }
  document.body.classList.remove('board-open');
}

function renderBoardDetail(post){
  if(!boardDetailEl || !boardDetailTitleEl || !boardDetailMetaEl || !boardDetailContentEl || !boardDetailActionsEl) return;
  currentBoardPostId = post.id;
  document.body.classList.add('board-open');
  boardDetailTitleEl.textContent = post.title;
  boardDetailMetaEl.textContent = `${post.author} · ${post.time}`;
  boardDetailContentEl.textContent = post.content;
  const auth = getAuth();
  const isOwner = auth && auth.username === post.author;
  if(isOwner){
    boardDetailActionsEl.innerHTML = `
      <button type="button" data-action="edit">수정</button>
      <button type="button" class="secondary" data-action="delete">삭제</button>
    `;
  } else {
    boardDetailActionsEl.innerHTML = '';
  }
  const likeCount = post.likes ? post.likes.length : 0;
  if(boardLikeCountEl){ boardLikeCountEl.textContent = `좋아요 ${likeCount}개`; }
  if(boardLikeBtn){
    const liked = auth && post.likes && post.likes.includes(auth.username);
    boardLikeBtn.textContent = liked ? '좋아요 취소 💔' : '좋아요 ❤️';
  }
  const dislikeCount = post.dislikes ? post.dislikes.length : 0;
  if(boardDislikeCountEl){ boardDislikeCountEl.textContent = `싫어요 ${dislikeCount}개`; }
  if(boardDislikeBtn){
    const disliked = auth && post.dislikes && post.dislikes.includes(auth.username);
    boardDislikeBtn.textContent = disliked ? '싫어요 취소 💔' : '싫어요 💔';
  }
  renderComments(post);
  boardEditForm && (boardEditForm.hidden = true);
  boardDetailEl.hidden = false;
}

function renderComments(post){
  if(!boardCommentListEl) return;
  boardCommentListEl.innerHTML = '';
  const comments = post.comments || [];
  const commentCountEl = document.getElementById('board-comment-count');
  if(commentCountEl) commentCountEl.textContent = comments.length;
  if(comments.length === 0){
    boardCommentListEl.innerHTML = '<li style="background:#fff;border-left:none;color:var(--muted);">아직 댓글이 없습니다.</li>';
    return;
  }
  comments.forEach(comment => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${escapeHtml(comment.author)}</strong><span style="color:var(--muted);"> · ${escapeHtml(comment.time)}</span><div>${escapeHtml(comment.text)}</div>`;
    boardCommentListEl.appendChild(li);
  });
}

boardDetailCloseBtn && boardDetailCloseBtn.addEventListener('click', closeBoardDetail);
boardLikeBtn && boardLikeBtn.addEventListener('click', () => {
  if(!isLoggedIn()){
    alert('로그인 후 좋아요를 누를 수 있습니다.');
    return;
  }
  const posts = loadBoardPosts();
  const post = posts.find(item => item.id === currentBoardPostId);
  if(!post) return;
  const auth = getAuth();
  if(!post.likes){ post.likes = []; }
  const index = post.likes.indexOf(auth.username);
  if(index >= 0){
    post.likes.splice(index, 1);
  } else {
    post.likes.push(auth.username);
    if(post.dislikes && post.dislikes.includes(auth.username)){
      post.dislikes.splice(post.dislikes.indexOf(auth.username), 1);
    }
  }
  saveBoardPosts(posts);
  renderBoard();
  renderBoardDetail(post);
});

boardDislikeBtn && boardDislikeBtn.addEventListener('click', () => {
  if(!isLoggedIn()){
    alert('로그인 후 싫어요를 누를 수 있습니다.');
    return;
  }
  const posts = loadBoardPosts();
  const post = posts.find(item => item.id === currentBoardPostId);
  if(!post) return;
  const auth = getAuth();
  if(!post.dislikes){ post.dislikes = []; }
  const index = post.dislikes.indexOf(auth.username);
  if(index >= 0){
    post.dislikes.splice(index, 1);
  } else {
    post.dislikes.push(auth.username);
    if(post.likes && post.likes.includes(auth.username)){
      post.likes.splice(post.likes.indexOf(auth.username), 1);
    }
  }
  saveBoardPosts(posts);
  renderBoard();
  renderBoardDetail(post);
});

boardCommentForm && boardCommentForm.addEventListener('submit', e => {
  e.preventDefault();
  if(!isLoggedIn()){
    alert('로그인 후 댓글을 작성할 수 있습니다.');
    return;
  }
  const posts = loadBoardPosts();
  const post = posts.find(item => item.id === currentBoardPostId);
  if(!post) return;
  const text = boardCommentInputEl ? boardCommentInputEl.value.trim() : '';
  if(!text){
    alert('댓글 내용을 입력하세요.');
    return;
  }
  if(!post.comments){ post.comments = []; }
  post.comments.push({
    author: getAuth().username,
    text,
    time: new Date().toLocaleString()
  });
  saveBoardPosts(posts);
  if(boardCommentInputEl) boardCommentInputEl.value = '';
  renderBoard();
  renderBoardDetail(post);
});

boardEditCancelBtn && boardEditCancelBtn.addEventListener('click', () => {
  if(boardEditForm){ boardEditForm.hidden = true; }
  if(boardDetailActionsEl){ boardDetailActionsEl.hidden = false; }
});

boardDetailActionsEl && boardDetailActionsEl.addEventListener('click', e => {
  const actionBtn = e.target.closest('button[data-action]');
  if(!actionBtn) return;
  const action = actionBtn.dataset.action;
  const posts = loadBoardPosts();
  const post = posts.find(item => item.id === currentBoardPostId);
  if(!post) return;
  if(action === 'delete'){
    const nextPosts = posts.filter(item => item.id !== currentBoardPostId);
    saveBoardPosts(nextPosts);
    renderBoard();
    closeBoardDetail();
    return;
  }
  if(action === 'edit'){
    if(boardEditTitleEl) boardEditTitleEl.value = post.title;
    if(boardEditContentEl) boardEditContentEl.value = post.content;
    if(boardEditForm) boardEditForm.hidden = false;
    if(boardDetailActionsEl) boardDetailActionsEl.hidden = true;
  }
});

boardEditForm && boardEditForm.addEventListener('submit', e => {
  e.preventDefault();
  const posts = loadBoardPosts();
  const post = posts.find(item => item.id === currentBoardPostId);
  if(!post) return;
  const title = boardEditTitleEl ? boardEditTitleEl.value.trim() : '';
  const content = boardEditContentEl ? boardEditContentEl.value.trim() : '';
  if(!title || !content){
    alert('제목과 내용을 모두 입력하세요.');
    return;
  }
  post.title = title;
  post.content = content;
  post.time = new Date().toLocaleString();
  saveBoardPosts(posts);
  renderBoard();
  renderBoardDetail(post);
});

function openBoardDetail(postId){
  const post = loadBoardPosts().find(item => item.id === postId);
  if(post){
    renderBoardDetail(post);
  }
}

document.querySelectorAll('.board-form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    if(!isLoggedIn()){
      alert('로그인 후 게시판에 글을 작성할 수 있습니다.');
      return;
    }
    const category = form.dataset.category;
    const titleInput = form.querySelector('input[name="board-title"]');
    const contentInput = form.querySelector('textarea[name="board-content"]');
    const title = titleInput ? titleInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';
    if(!title || !content){
      alert('제목과 내용을 모두 입력하세요.');
      return;
    }
    const posts = loadBoardPosts();
    posts.push({
      id: Date.now(),
      category,
      title,
      content,
      author: getAuth().username,
      time: new Date().toLocaleString()
    });
    saveBoardPosts(posts);
    form.reset();
    renderBoard();
  });
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

function initializeApp(){
  renderAnns();
  renderBoard();
  renderAuth();
}

document.addEventListener('DOMContentLoaded', initializeApp);
if(document.readyState === 'complete' || document.readyState === 'interactive'){
  initializeApp();
}
