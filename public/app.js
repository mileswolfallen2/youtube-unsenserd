// -------------------- Recommended Videos (Personalized) --------------------
async function loadRecommendedIndex() {
  const list = document.getElementById('recommendedVideos');
  if (!list) return;
  let videos = [];
  let res;
  try {
    res = await fetch('/api/recommended');
    if (res.ok) {
      videos = await res.json();
    } else {
      res = await fetch('/api/videos');
      videos = await res.json();
    }
  } catch {
    res = await fetch('/api/videos');
    videos = await res.json();
  }
  // Show top 6
  const top = videos.slice(0, 6);
  list.innerHTML = '';
  for (const v of top) {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.marginBottom = '1em';
    li.innerHTML = `
      <a href="watch.html?id=${v.id}" style="display:flex;align-items:center;text-decoration:none;color:inherit;">
        <img src="/thumbnails/${v.thumbnail}" width="80" height="60" style="object-fit:cover;border-radius:6px;margin-right:10px;">
        <div>
          <div style="font-weight:bold;">${v.title}</div>
          <div style="font-size:0.9em;color:#aaa;">by ${v.uploader}</div>
          <div style="font-size:0.9em;color:#aaa;">${v.likes?.length || 0} likes</div>
        </div>
      </a>
    `;
    list.appendChild(li);
  }
}
// -------------------- Watch Later & History (localStorage) --------------------
function getWatchLater() {
  return JSON.parse(localStorage.getItem('watchLater') || '[]');
}
function setWatchLater(arr) {
  localStorage.setItem('watchLater', JSON.stringify(arr));
}
function addToWatchLater(video) {
  let arr = getWatchLater();
  if (!arr.find(v => v.id === video.id)) {
    arr.unshift(video);
    setWatchLater(arr.slice(0, 20));
  }
  renderWatchLater();
}
function removeFromWatchLater(id) {
  let arr = getWatchLater().filter(v => v.id !== id);
  setWatchLater(arr);
  renderWatchLater();
}
function renderWatchLater() {
  const list = document.getElementById('watchLaterList');
  if (!list) return;
  const arr = getWatchLater();
  list.innerHTML = '';
  arr.forEach(v => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="watch.html?id=${v.id}">${v.title}</a> <button data-id="${v.id}" class="removeLater">✕</button>`;
    list.appendChild(li);
  });
  list.querySelectorAll('.removeLater').forEach(btn => {
    btn.onclick = e => removeFromWatchLater(btn.dataset.id);
  });
}

function getWatchHistory() {
  return JSON.parse(localStorage.getItem('watchHistory') || '[]');
}
function setWatchHistory(arr) {
  localStorage.setItem('watchHistory', JSON.stringify(arr));
}
function addToWatchHistory(video) {
  let arr = getWatchHistory();
  arr = arr.filter(v => v.id !== video.id);
  arr.unshift(video);
  setWatchHistory(arr.slice(0, 20));
  renderWatchHistory();
}
function renderWatchHistory() {
  const list = document.getElementById('watchHistoryList');
  if (!list) return;
  const arr = getWatchHistory();
  list.innerHTML = '';
  arr.forEach(v => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="watch.html?id=${v.id}">${v.title}</a>`;
    list.appendChild(li);
  });
}

// -------------------- Load Videos on Homepage --------------------
async function loadVideos() {
  try {
    const res = await fetch("/api/videos");
    const videos = await res.json();
    const list = document.getElementById("videoList");
    if (!list) return; // page doesn’t have video list

    list.innerHTML = "";
    videos.forEach(v => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="/thumbnails/${v.thumbnail}" width="120">
        <a href="watch.html?id=${v.id}">${v.title}</a>
        <small>by <a href="user.html?username=${v.uploader}">${v.uploader}</a></small>
        <button class="addLater" data-id="${v.id}">Watch Later</button>
      `;
      list.appendChild(li);
    });
    // Add event listeners for Watch Later
    list.querySelectorAll('.addLater').forEach(btn => {
      btn.onclick = async e => {
        const id = btn.dataset.id;
        const v = videos.find(v => v.id == id);
        if (v) addToWatchLater(v);
      };
    });
    renderWatchLater();
    renderWatchHistory();
  } catch (err) {
    console.error("Error loading videos:", err);
  }
}

// -------------------- Handle Login --------------------
async function loginUser(e) {
  e.preventDefault();
  const username = document.getElementById("loginUser").value;
  const password = document.getElementById("loginPass").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (data.success) {
    alert("Logged in as " + data.username);
    location.reload();
  } else {
    alert(data.error);
  }
}

// -------------------- Handle Register --------------------
async function registerUser(e) {
  e.preventDefault();
  const username = document.getElementById("regUser").value;
  const password = document.getElementById("regPass").value;

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (data.success) {
    alert("Account created! You can now log in.");
  } else {
    alert(data.error);
  }
}

// -------------------- Handle Logout --------------------
async function logoutUser() {
  const res = await fetch("/api/logout", { method: "POST" });
  const data = await res.json();
  if (data.success) {
    alert("Logged out");
    location.reload();
  }
}

// -------------------- Handle Video Upload --------------------
async function uploadVideo(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById("uploadForm"));

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (data.success) {
    alert("Video uploaded!");
    loadVideos(); // refresh video list
  } else {
    alert(data.error);
  }
}

// -------------------- Event Listeners --------------------
document.addEventListener("DOMContentLoaded", () => {
  // Homepage video list
  loadVideos();

  // Recommended sidebar
  loadRecommendedIndex();

  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", loginUser);

  // Register form
  const regForm = document.getElementById("registerForm");
  if (regForm) regForm.addEventListener("submit", registerUser);

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

  // Upload form
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) uploadForm.addEventListener("submit", uploadVideo);

  // Render watch later/history on all pages
  renderWatchLater();
  renderWatchHistory();
});
