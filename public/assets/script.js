let token = localStorage.getItem("authToken");
let currentUserId = localStorage.getItem("userId") ? Number(localStorage.getItem("userId")) : null;

function register() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.errors) {
        alert(data.errors[0].message);
      } else {
        alert("User registered successfully");
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  fetch("/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      // Save the token in the local storage
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        token = data.token;

        alert("User Logged In successfully");

        // Personalise the welcome message
        const username = data.userData?.username || "there";
        document.getElementById("welcome-msg").textContent = `Welcome, ${username}!`;

        // Track the logged-in user so we know which posts they own
        currentUserId = data.userData?.id || null;
        if (currentUserId) localStorage.setItem("userId", currentUserId);

        // Load categories, then the posts list
        loadCategories();
        fetchPosts();

        // Hide the auth card and show the app container as we're now logged in
        document.getElementById("auth-card").classList.add("hidden");
        document.getElementById("app-container").classList.remove("hidden");
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

function logout() {
  fetch("/api/users/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => {
    // Clear the token from the local storage as we're now logged out
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    token = null;
    currentUserId = null;
    document.getElementById("auth-card").classList.remove("hidden");
    document.getElementById("app-container").classList.add("hidden");
  });
}

function loadCategories() {
  fetch("/api/categories", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((categories) => {
      const postSelect = document.getElementById("post-category");
      const filterSelect = document.getElementById("category-filter");

      postSelect.innerHTML = '<option value="">No category</option>';
      filterSelect.innerHTML = '<option value="">All categories</option>';

      categories.forEach((cat) => {
        const postOption = document.createElement("option");
        postOption.value = cat.id;
        postOption.textContent = cat.category_name;
        postSelect.appendChild(postOption);

        const filterOption = document.createElement("option");
        filterOption.value = cat.id;
        filterOption.textContent = cat.category_name;
        filterSelect.appendChild(filterOption);
      });
    })
    .catch((error) => console.log(error));
}

function addCategory() {
  const input = document.getElementById("new-category-input");
  const category_name = input.value.trim();
  if (!category_name) return;

  fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ category_name }),
  })
    .then((res) => res.json())
    .then(() => {
      input.value = "";
      loadCategories();
    })
    .catch((error) => console.log(error));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function fetchPosts() {
  const categoryId = document.getElementById("category-filter")?.value;
  const query = categoryId ? `?categoryId=${categoryId}` : "";

  fetch(`/api/posts${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((posts) => {
      const postsContainer = document.getElementById("posts");
      postsContainer.innerHTML = "";
      posts.forEach((post) => {
        const div = document.createElement("div");
        div.className = "post-item";
        div.dataset.postId = post.id;
        div.dataset.postedBy = post.postedBy;

        const isOwner = currentUserId && post.userId === currentUserId;
        const categoryBadge = post.category
          ? `<span class="post-category-badge">${escapeHtml(post.category.category_name)}</span>`
          : "";
        const imageHtml = post.featuredImage
          ? `<img class="post-featured-image" src="${post.featuredImage}" alt="${escapeHtml(post.title)}">`
          : "";

        div.innerHTML = `
          ${imageHtml}
          <h3 class="post-title">${escapeHtml(post.title)}${categoryBadge}</h3>
          <p class="post-content">${escapeHtml(post.content)}</p>
          <small>By: ${escapeHtml(post.postedBy)} on ${new Date(
          post.createdOn
        ).toLocaleString()}</small>
          ${
            isOwner
              ? `<div class="post-actions">
                  <button class="btn-edit-post" onclick="startEditPost(${post.id})">Edit</button>
                  <button class="btn-delete-post" onclick="deletePost(${post.id})">Delete</button>
                </div>`
              : ""
          }
        `;
        postsContainer.appendChild(div);
      });
    });
}

function startEditPost(postId) {
  const postDiv = document.querySelector(`[data-post-id="${postId}"]`);
  const currentTitle = postDiv.querySelector(".post-title").textContent;
  const currentContent = postDiv.querySelector(".post-content").textContent;

  postDiv.innerHTML = `
    <input type="text" class="edit-title-input" value="${escapeHtml(currentTitle)}">
    <textarea class="edit-content-input">${escapeHtml(currentContent)}</textarea>
    <div class="post-actions">
      <button class="btn-save-post" onclick="saveEditPost(${postId})">Save</button>
      <button class="btn-cancel-post" onclick="fetchPosts()">Cancel</button>
    </div>
  `;
}

function saveEditPost(postId) {
  const postDiv = document.querySelector(`[data-post-id="${postId}"]`);
  const title = postDiv.querySelector(".edit-title-input").value;
  const content = postDiv.querySelector(".edit-content-input").value;
  const postedBy = postDiv.dataset.postedBy;

  fetch(`/api/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content, postedBy }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to update post");
      return res.json();
    })
    .then(() => fetchPosts())
    .catch((error) => {
      alert(error.message);
      console.log(error);
    });
}

function deletePost(postId) {
  if (!confirm("Delete this post? This can't be undone.")) return;

  fetch(`/api/posts/${postId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    })
    .then(() => fetchPosts())
    .catch((error) => {
      alert(error.message);
      console.log(error);
    });
}

function createPost() {
  const title = document.getElementById("post-title").value;
  const content = document.getElementById("post-content").value;
  const categoryId = document.getElementById("post-category").value || "";
  const imageInput = document.getElementById("post-image");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  formData.append("postedBy", "User");
  formData.append("categoryId", categoryId);
  if (imageInput.files[0]) {
    formData.append("featuredImage", imageInput.files[0]);
  }

  fetch("/api/posts", {
    method: "POST",
    headers: {
      // No Content-Type header here — the browser sets the correct
      // multipart/form-data boundary automatically for FormData
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
    .then((res) => res.json())
    .then(() => {
      alert("Post created successfully");
      document.getElementById("post-title").value = "";
      document.getElementById("post-content").value = "";
      imageInput.value = "";
      fetchPosts();
    })
    .catch((error) => {
      alert("Error creating post");
      console.log(error);
    });
}

// ── Dark / Light mode toggle ──
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

// ── Enter key submits login/register forms ──
function handleEnterKey(e, callback) {
  if (e.key === "Enter") {
    e.preventDefault();
    callback();
  }
}

["username", "email", "password"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("keydown", (e) => handleEnterKey(e, register));
});

["login-email", "login-password"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("keydown", (e) => handleEnterKey(e, login));
});