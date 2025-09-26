
const postsData = [
  {
    id: "p1",
    title: "Welcome to My Blog",
    date: "July 1, 2025",
    author: "john",
    excerpt: "A short introduction to my new responsive blog.",
    image: "https://picsum.photos/id/1018/800/400",
    tags: ["introduction","featured"],
    category: "Announcement",
    content: `# Welcome\nThis is a demo post to introduce the blog. Write in **Markdown** and it will render.`
  },
  {
    id: "p2",
    title: "5 Quick Design Tips",
    date: "July 12, 2025",
    author: "william",
    excerpt: "Practical tips to improve visual hierarchy and readability.",
    image: "https://picsum.photos/id/1/800/400",
    tags: ["design","tips"],
    category: "Design",
    content: `## 5 Quick Tips\n- Use consistent spacing\n- Choose a clear hierarchy\n\nEnjoy designing!`
  },
  {
    id: "p3",
    title: "A New Approach to UI/UX",
    date: "July 20, 2025",
    author: "sheeren",
    excerpt: "Insights into the latest trends in UI/UX design.",
    image: "https://picsum.photos/id/1015/800/400",
    tags: ["uiux","trending"],
    category: "UX",
    content: `## Trends\nModern UI/UX focuses on accessibility and clarity.`
  },
  {
    id: "p4",
    title: "Advanced CSS Techniques",
    date: "July 10, 2025",
    author: "Amit Agarwal",
    excerpt: "Enhance the styling of your web projects with powerful CSS techniques.",
    image: "image/blog.jpg",
    tags: ["css","featured"],
    category: "Development",
    content: `### CSS Tips\nUse variables, grid, and logical properties.`
  },
  {
    id: "p5",
    title: "Building Responsive Layouts",
    date: "August 1, 2025",
    author: "Yang yang",
    excerpt: "A practical guide to responsive web design.",
    image: "image/post.jpg",
    tags: ["responsive","design"],
    category: "Design",
    content: `Responsive layouts adapt to the viewport.`
  },
 
];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function saveLS(key, val){localStorage.setItem(key, JSON.stringify(val))}
function readLS(key, fallback=null){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback } catch(e){return fallback}}

let visibleCount = 3; 
let filtered = [...postsData]; 
let currentOpenPost = null;

document.addEventListener("DOMContentLoaded", () => {
  renderFeatured();
  renderPosts();
  renderSidebarLists();
  wireUI();
  restoreTheme();
  showNewsletterPopupDelayed();
});


function renderFeatured(){
  const featured = postsData[0];
  const cont = document.getElementById('featured');
  cont.innerHTML = `
    <img src="${featured.image}" alt="${escapeHTML(featured.title)}" class="media" />
    <div class="featured-meta">
      <h2>${escapeHTML(featured.title)}</h2>
      <p class="meta">${featured.date} • ${featured.author}</p>
      <p class="small">${escapeHTML(featured.excerpt)}</p>
      <div style="margin-top:0.6rem">
        <button class="btn" onclick="openPost('${featured.id}')">Read more</button>
      </div>
    </div>
  `;
}

function renderPosts(){
  const container = document.getElementById('postsList');
  container.innerHTML = '';
  const list = filtered.slice(0, visibleCount);
  if(list.length===0){
    container.innerHTML = '<p style="color:var(--muted)">No posts found.</p>';
    return;
  }
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <img class="thumb" src="${p.image}" alt="${escapeHTML(p.title)}" />
      <div>
        <h3>${escapeHTML(p.title)}</h3>
        <p class="meta">${p.date} • ${p.author}</p>
        <p class="small">${escapeHTML(p.excerpt)}</p>
        <div style="margin-top:0.6rem; display:flex; gap:0.5rem; align-items:center">
          <button class="btn" onclick="openPost('${p.id}')">Read</button>
          <button class="icon-btn" onclick="toggleLike('${p.id}')">👏 <span id="like-${p.id}">${getLikes(p.id)}</span></button>
          <div style="color:var(--muted); font-size:0.9rem">Tags: ${p.tags.map(t=>`<span class="chip">${t}</span>`).join(' ')}</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  document.getElementById('loadMore').style.display = (filtered.length>visibleCount) ? 'inline-block' : 'none';
}

function renderSidebarLists(){
  
  const categories = [...new Set(postsData.map(p=>p.category))];
  const catEl = document.getElementById('categories');
  catEl.innerHTML = categories.map(c => `<span class="chip" onclick="filterByCategory('${escapeJS(c)}')">${escapeHTML(c)}</span>`).join(' ');

  const tags = postsData.flatMap(p=>p.tags);
  const tagCounts = tags.reduce((acc,t)=>{acc[t]=(acc[t]||0)+1;return acc},{});
  const tagEl = document.getElementById('tagsCloud');
  tagEl.innerHTML = Object.keys(tagCounts).map(t => `<span class="tag" onclick="filterByTag('${escapeJS(t)}')">${escapeHTML(t)}</span>`).join(' ');

  const recent = postsData.slice(0,5);
  const rp = document.getElementById('recentPosts');
  rp.innerHTML = recent.map(r => `<li><a href="javascript:openPost('${r.id}')">${escapeHTML(r.title)}</a></li>`).join('');

  const trending = postsData.filter(p=>p.tags.includes('trending')).slice(0,3);
  const trendEl = document.getElementById('trendingList');
  trendEl.innerHTML = trending.map(t => `<div class="trendingItem"><img src="${t.image}" /><div><strong>${escapeHTML(t.title)}</strong><div class="meta">${t.date}</div></div></div>`).join('');

  const popular = postsData.slice().sort((a,b)=>getViews(b.id)-getViews(a.id)).slice(0,3);
  const popEl = document.getElementById('popularList');
  popEl.innerHTML = popular.map(p => `<div class="popularItem"><img src="${p.image}" /><div><strong>${escapeHTML(p.title)}</strong><div class="meta">${getViews(p.id)} views</div></div></div>`).join('');
}

function wireUI(){
 
  const topSearch = document.getElementById('topSearch');
  const ac = document.getElementById('autocomplete');
  topSearch.addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    if(!q){ ac.style.display='none'; return; }
    const matches = postsData.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)).slice(0,6);
    ac.innerHTML = matches.map(m => `<div class="item" onclick="openPost('${m.id}')">${escapeHTML(m.title)} <div class="meta" style="font-size:0.8rem">${escapeHTML(m.date)}</div></div>`).join('');
    ac.style.display = matches.length ? 'block' : 'none';
  });

  document.body.addEventListener('click', (ev)=>{
    if(!ev.target.closest('.search-wrapper')) ac.style.display='none';
  });

  $('#sideSearch').addEventListener('input', (e)=>{ applyFilter(e.target.value) });

  $('#loadMore').addEventListener('click', ()=>{ visibleCount += 3; renderPosts(); });

  $('#subscribeBtn').addEventListener('click', ()=>{
    const email = $('#subscribeEmail').value.trim();
    if(!email){ alert('Enter an email'); return; }
    saveLS('subscribedEmail', email);
    alert('Subscribed! (demo)');
  });

  $('#popupSubscribe').addEventListener('click', ()=>{
    const em = $('#popupEmail').value.trim();
    if(em){ saveLS('subscribedEmail', em); hidePopup(); alert('Subscribed — thanks!'); }
  });

  $('#popupClose').addEventListener('click', hidePopup);

  $('#themeToggle').addEventListener('click', toggleTheme);

  $('#hamburger').addEventListener('click', ()=> {
    const nav = document.getElementById('navLinks');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  });

  const st = $('#scrollTop');
  st.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  window.addEventListener('scroll', ()=> {
    st.style.display = window.scrollY>400 ? 'block' : 'none';
  });

  $('#sideSearch').addEventListener('keyup', (e)=> {
    if(e.key==='Enter') applyFilter(e.target.value);
  });

  $$('.share-btn').forEach(b=>{
    b.addEventListener('click', ()=> {
      const net = b.dataset.network;
      const url = encodeURIComponent(location.href);
      const text = encodeURIComponent(document.title);
      let shareUrl = '';
      if(net==='twitter') shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      if(net==='facebook') shareUrl = `https://www.facebook.com/sharer.php?u=${url}`;
      if(net==='linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      window.open(shareUrl,'_blank','width=600,height=450');
    })
  });

  $('#postComment').addEventListener('click', ()=>{
    const txt = $('#commentInput').value.trim(); if(!txt) return alert('Write something');
    addComment(currentOpenPost, {text:txt, date:new Date().toISOString()});
    $('#commentInput').value='';
    renderComments(currentOpenPost);
  });

  // modal close
  $('#modalClose').addEventListener('click', closeModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
}

function applyFilter(q=''){
  q = (q||'').toLowerCase();
  filtered = postsData.filter(p=>{
    return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.join(' ').toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });
  visibleCount = 3;
  renderPosts();
}

window.filterByCategory = function(cat){
  filtered = postsData.filter(p => p.category === cat);
  visibleCount = 3; renderPosts();
}
window.filterByTag = function(tag){
  filtered = postsData.filter(p => p.tags.includes(tag));
  visibleCount = 3; renderPosts();
}

window.openPost = function(id){
  const post = postsData.find(p => p.id === id);
  if(!post) return;
  currentOpenPost = id;

  incrementViews(id);

  const modal = $('#postModal');
  const container = $('#modalPost');
  container.innerHTML = `
    <h2>${escapeHTML(post.title)}</h2>
    <p class="meta">${post.date} • ${post.author}</p>
    <img style="width:100%; border-radius:10px; margin:0.6rem 0" src="${post.image}" />
    <div id="postContent">${marked.parse(post.content)}</div>
  `;

  $('#viewCount').innerText = getViews(id);
  $('#likeCount').innerText = getLikes(id);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  renderComments(id);
  renderRelated(id);
}

function closeModal(){
  $('#postModal').classList.add('hidden');
  $('#postModal').setAttribute('aria-hidden','true');
  currentOpenPost = null;
}


function likeKey(id){return `likes_${id}`}
function viewKey(id){return `views_${id}`}
function commentsKey(id){return `comments_${id}`}

function getLikes(id){ return readLS(likeKey(id)) || 0 }
function toggleLike(id){
  const key = likeKey(id);
  const next = (readLS(key) || 0) + 1;
  saveLS(key, next);
  document.getElementById(`like-${id}`).innerText = next;
  if(currentOpenPost===id) $('#likeCount').innerText = next;
}

function incrementViews(id){
  const k = viewKey(id);
  const v = (readLS(k) || 0) + 1;
  saveLS(k, v);
}

function getViews(id){ return readLS(viewKey(id)) || 0 }

function addComment(postId, comment){
  const list = readLS(commentsKey(postId)) || [];
  list.unshift(comment);
  saveLS(commentsKey(postId), list);
}

function renderComments(postId){
  const list = readLS(commentsKey(postId)) || [];
  const el = $('#commentsList');
  if(!el) return;
  el.innerHTML = list.map(c=>`<div class="comment"><div class="meta">${new Date(c.date).toLocaleString()}</div><div class="text">${escapeHTML(c.text)}</div></div>`).join('') || '<div class="small">No comments yet</div>';
}

function renderRelated(postId){
  const post = postsData.find(p=>p.id===postId);
  const related = postsData.filter(p => p.id !== postId && p.tags.some(t=>post.tags.includes(t))).slice(0,4);
  $('#relatedPosts').innerHTML = related.map(r=>`<div style="padding:0.4rem 0"><a href="javascript:openPost('${r.id}')">${escapeHTML(r.title)}</a><div class="meta">${escapeHTML(r.date)}</div></div>`).join('') || '<div class="small">No related posts</div>';
}

postsData.forEach(p =>{
});

function toggleTheme(){
  const current = readLS('theme') || 'dark';
  const next = current==='dark' ? 'light' : 'dark';
  setTheme(next);
}

function setTheme(t){
  saveLS('theme', t);
  if(t==='light'){
    document.documentElement.style.setProperty('--bg','#f6f8fa');
    document.documentElement.style.setProperty('--card','#ffffff');
    document.documentElement.style.setProperty('--text','#0b1220');
    document.documentElement.style.setProperty('--muted','#55606a');
    document.documentElement.style.setProperty('--accent','#3b82f6');
  } else {
  
    document.documentElement.style.removeProperty('--bg');
    document.documentElement.style.removeProperty('--card');
    document.documentElement.style.removeProperty('--text');
    document.documentElement.style.removeProperty('--muted');
    document.documentElement.style.removeProperty('--accent');
  }
  $('#themeToggle').innerText = t==='dark' ? '🌙' : '☀️';
  document.body.classList.toggle('light-theme', t==='light');
}

function restoreTheme(){
  const theme = readLS('theme') || 'dark';
  setTheme(theme);
}

function showNewsletterPopupDelayed(){
  const dismissed = readLS('newsletterDismissed');
  if(dismissed) return;
  setTimeout(()=> {
    const popup = $('#newsletterPopup');
    popup.classList.remove('hidden');
    popup.setAttribute('aria-hidden','false');
  }, 6000);
}

function hidePopup(){
  const dont = $('#dontShow').checked;
  if(dont) saveLS('newsletterDismissed', true);
  $('#newsletterPopup').classList.add('hidden');
  $('#newsletterPopup').setAttribute('aria-hidden','true');
}

function escapeHTML(s){ return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function escapeJS(s){ return String(s).replace(/'/g,"\\'") }

window.openPost = openPost;
window.toggleLike = toggleLike;

(function initAutocompleteSource(){
  const titles = postsData.map(p=>p.title);
})();

