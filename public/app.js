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
      `;
      list.appendChild(li);
    });
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
});
