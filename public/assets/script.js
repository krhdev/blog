let token = localStorage.getItem("authToken");
let currentUserId = localStorage.getItem("userId") ? Number(localStorage.getItem("userId")) : null;
let currentUsername = localStorage.getItem("username") || null;
let profileUserId = null;
let currentPage = 1;
let postContentEditor = null;

function updateHeaderForLoggedInUser(username) {
  document.getElementById("auth-toggle-btn").classList.add("hidden");
  document.getElementById("user-menu").classList.remove("hidden");
  document.getElementById("create-post-section").classList.remove("hidden");
  document.getElementById("welcome-msg").textContent = `Welcome, ${username}!`;
}

function updateHeaderForLoggedOutUser() {
  document.getElementById("auth-toggle-btn").classList.remove("hidden");
  document.getElementById("user-menu").classList.add("hidden");
  document.getElementById("create-post-section").classList.add("hidden");
}

function toggleAuthPanel() {
  document.getElementById("auth-panel").classList.toggle("hidden");
}

function closeAuthPanel() {
  document.getElementById("auth-panel").classList.add("hidden");
}

// Close the dropdown when clicking anywhere outside it
document.addEventListener("click", (event) => {
  const wrap = document.querySelector(".auth-dropdown-wrap");
  const panel = document.getElementById("auth-panel");
  if (wrap && panel && !wrap.contains(event.target)) {
    panel.classList.add("hidden");
  }
});

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
        alert("Registered! Check your email for a verification link, then log in.");
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
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        token = data.token;

        const username = data.userData?.username || "there";
        currentUserId = data.userData?.id || null;
        currentUsername = username;
        if (currentUserId) localStorage.setItem("userId", currentUserId);
        localStorage.setItem("username", username);

        updateHeaderForLoggedInUser(username);
        showVerificationBanner(data.userData?.verified);
        closeAuthPanel();
        loadCategories();
        fetchPosts();
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

function showVerificationBanner(isVerified) {
  const existing = document.getElementById("verify-banner");
  if (existing) existing.remove();

  if (isVerified) return;

  const banner = document.createElement("div");
  banner.id = "verify-banner";
  banner.className = "verify-banner";
  banner.innerHTML = `
    <span>Please verify your email to unlock full access — check your inbox.</span>
    <button onclick="resendVerification()">Resend email</button>
    <button class="verify-banner-close" onclick="document.getElementById('verify-banner').remove()">&times;</button>
  `;
  document.body.prepend(banner);
}

function resendVerification() {
  fetch("/api/users/resend-verification", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => alert(data.message))
    .catch((error) => console.log(error));
}

function toggleForgotPassword(event) {
  event.preventDefault();
  document.getElementById("forgot-password-form").classList.toggle("hidden");
}

function submitForgotPassword() {
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) return;

  fetch("/api/users/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      document.getElementById("forgot-email").value = "";
      document.getElementById("forgot-password-form").classList.add("hidden");
    })
    .catch((error) => console.log(error));
}

function logout() {
  fetch("/api/users/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    token = null;
    currentUserId = null;
    currentUsername = null;
    updateHeaderForLoggedOutUser();
    const banner = document.getElementById("verify-banner");
    if (banner) banner.remove();
    fetchPosts();
  });
}

function loadCategories() {
  fetch("/api/categories")
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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function sanitizeHtml(html) {
  if (typeof DOMPurify === "undefined") return escapeHtml(html || "");
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "u", "ol", "ul", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

function viewProfile(userId) {
  profileUserId = userId;

  fetch(`/api/users/${userId}`)
    .then((res) => res.json())
    .then((user) => {
      const joinDate = new Date(user.createdOn).toLocaleDateString();
      document.getElementById("profile-header").innerHTML = `
        <div class="profile-card">
          <button class="btn-back-to-posts" onclick="backToPosts()">&larr; Back to all posts</button>
          <h2 class="profile-username">Viewing ${escapeHtml(user.username)}'s profile</h2>
          <p class="profile-meta">Joined ${joinDate} &middot; ${user.postCount} post${user.postCount === 1 ? "" : "s"}</p>
        </div>
      `;
      document.getElementById("profile-header").classList.remove("hidden");
      document.getElementById("category-filter-row").classList.add("hidden");
      document.getElementById("posts-heading").textContent = `Posts by ${user.username}`;

      // Hide the post-creation form while viewing a profile
      const createSection = document.getElementById("create-post-section");
      if (createSection) createSection.classList.add("hidden");

      currentPage = 1;
      fetchPosts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
    .catch((error) => console.log(error));
}

function backToPosts() {
  profileUserId = null;
  document.getElementById("profile-header").classList.add("hidden");
  document.getElementById("profile-header").innerHTML = "";
  document.getElementById("category-filter-row").classList.remove("hidden");
  document.getElementById("posts-heading").textContent = "Posts";

  // Restore the post-creation form if logged in
  const createSection = document.getElementById("create-post-section");
  if (createSection && token) createSection.classList.remove("hidden");

  currentPage = 1;
  fetchPosts();
}

function fetchPosts() {
  const params = new URLSearchParams();

  if (profileUserId) {
    params.set("userId", profileUserId);
  } else {
    const categoryId = document.getElementById("category-filter")?.value;
    if (categoryId) params.set("categoryId", categoryId);
  }

  params.set("page", currentPage);

  fetch(`/api/posts?${params.toString()}`)
    .then((res) => res.json())
    .then((data) => {
      const posts = data.posts || [];
      const postsContainer = document.getElementById("posts");
      postsContainer.innerHTML = "";
      posts.forEach((post) => {
        const div = document.createElement("div");
        div.className = "post-item";
        div.dataset.postId = post.id;
        div.dataset.postedBy = post.postedBy;
        div.dataset.categoryId = post.categoryId || "";

        const isOwner = currentUserId && post.userId === currentUserId;
        const categoryBadge = post.category
          ? `<span class="post-category-badge">${escapeHtml(post.category.category_name)}</span>`
          : "";
        const imageHtml = post.featuredImage
          ? `<img class="post-featured-image" src="${post.featuredImage}" alt="${escapeHtml(post.title)}">`
          : "";

        const authorLink = post.author
          ? `<span class="post-author-link" onclick="viewProfile(${post.author.id})">${escapeHtml(post.author.username)}</span>`
          : escapeHtml(post.postedBy);

        div.innerHTML = `
          ${imageHtml}
          <h3 class="post-title"><span class="post-title-text">${escapeHtml(post.title)}</span>${categoryBadge}</h3>
          <div class="post-content">${sanitizeHtml(post.content)}</div>
          <small>By: ${authorLink} on ${new Date(
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
          <div class="comments-section">
            <div class="comments-list" id="comments-list-${post.id}"></div>
            ${
              token
                ? `<div class="comment-form">
                    <input type="text" id="comment-input-${post.id}" placeholder="Add a comment...">
                    <button onclick="addComment(${post.id})">Post</button>
                  </div>`
                : ""
            }
          </div>
        `;
        postsContainer.appendChild(div);
        loadComments(post.id);
      });

      renderPagination(data.currentPage, data.totalPages);
    });
}

function renderPagination(page, totalPages) {
  const container = document.getElementById("pagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <button class="btn-page-nav" ${page <= 1 ? "disabled" : ""} onclick="goToPage(${page - 1})">&larr; Prev</button>
    <span class="page-indicator">Page ${page} of ${totalPages}</span>
    <button class="btn-page-nav" ${page >= totalPages ? "disabled" : ""} onclick="goToPage(${page + 1})">Next &rarr;</button>
  `;
}

function goToPage(page) {
  currentPage = page;
  fetchPosts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetPageAndFetch() {
  currentPage = 1;
  fetchPosts();
}

function loadComments(postId) {
  fetch(`/api/comments/post/${postId}`)
    .then((res) => res.json())
    .then((comments) => {
      const list = document.getElementById(`comments-list-${postId}`);
      if (!list) return;

      if (comments.length === 0) {
        list.innerHTML = `<p class="no-comments">No comments yet.</p>`;
        return;
      }

      list.innerHTML = comments
        .map((comment) => {
          const isCommentOwner = currentUserId && comment.userId === currentUserId;
          return `
            <div class="comment-item" data-comment-id="${comment.id}">
              <span class="comment-author">${escapeHtml(comment.author?.username || "Unknown")}</span>
              <span class="comment-content">${escapeHtml(comment.content)}</span>
              <small class="comment-date">${new Date(comment.createdOn).toLocaleString()}</small>
              ${
                isCommentOwner
                  ? `<span class="comment-actions">
                      <button class="btn-edit-comment" onclick="startEditComment(${comment.id}, ${postId})">Edit</button>
                      <button class="btn-delete-comment" onclick="deleteComment(${comment.id}, ${postId})">Delete</button>
                    </span>`
                  : ""
              }
            </div>
          `;
        })
        .join("");
    })
    .catch((error) => console.log(error));
}

function startEditComment(commentId, postId) {
  const item = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
  const currentContent = item.querySelector(".comment-content").textContent;

  item.innerHTML = `
    <input type="text" class="edit-comment-input" value="${escapeHtml(currentContent)}">
    <span class="comment-actions">
      <button class="btn-save-comment" onclick="saveEditComment(${commentId}, ${postId})">Save</button>
      <button class="btn-cancel-comment" onclick="loadComments(${postId})">Cancel</button>
    </span>
  `;
}

function saveEditComment(commentId, postId) {
  const item = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
  const content = item.querySelector(".edit-comment-input").value;

  fetch(`/api/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to update comment");
      return res.json();
    })
    .then(() => loadComments(postId))
    .catch((error) => {
      alert(error.message);
      console.log(error);
    });
}

function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;

  fetch("/api/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, postId }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    })
    .then(() => {
      input.value = "";
      loadComments(postId);
    })
    .catch((error) => {
      alert(error.message);
      console.log(error);
    });
}

function deleteComment(commentId, postId) {
  if (!confirm("Delete this comment?")) return;

  fetch(`/api/comments/${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to delete comment");
      return res.json();
    })
    .then(() => loadComments(postId))
    .catch((error) => {
      alert(error.message);
      console.log(error);
    });
}

function startEditPost(postId) {
  const postDiv = document.querySelector(`[data-post-id="${postId}"]`);
  const currentTitle = postDiv.querySelector(".post-title-text").textContent;
  const currentContent = postDiv.querySelector(".post-content").textContent;
  const currentCategoryId = postDiv.dataset.categoryId;

  // Reuse the same category options already loaded in the create-post dropdown
  const sourceOptions = document.getElementById("post-category").innerHTML;

  postDiv.innerHTML = `
    <input type="text" class="edit-title-input" value="${escapeHtml(currentTitle)}">
    <textarea class="edit-content-input">${escapeHtml(currentContent)}</textarea>
    <select class="edit-category-input">${sourceOptions}</select>
    <div class="post-actions">
      <button class="btn-save-post" onclick="saveEditPost(${postId})">Save</button>
      <button class="btn-cancel-post" onclick="fetchPosts()">Cancel</button>
    </div>
  `;

  postDiv.querySelector(".edit-category-input").value = currentCategoryId;
}

function saveEditPost(postId) {
  const postDiv = document.querySelector(`[data-post-id="${postId}"]`);
  const title = postDiv.querySelector(".edit-title-input").value;
  const content = postDiv.querySelector(".edit-content-input").value;
  const categoryId = postDiv.querySelector(".edit-category-input").value;
  const postedBy = postDiv.dataset.postedBy;

  fetch(`/api/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content, postedBy, categoryId }),
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
  const content = postContentEditor ? postContentEditor.root.innerHTML : "";
  const categoryId = document.getElementById("post-category").value || "";
  const imageInput = document.getElementById("post-image");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  formData.append("postedBy", currentUsername || "User");
  formData.append("categoryId", categoryId);
  if (imageInput.files[0]) {
    formData.append("featuredImage", imageInput.files[0]);
  }

  fetch("/api/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
    .then((res) => res.json())
    .then(() => {
      alert("Post created successfully");
      document.getElementById("post-title").value = "";
      if (postContentEditor) postContentEditor.setText("");
      imageInput.value = "";
      currentPage = 1;
      fetchPosts();
    })
    .catch((error) => {
      alert("Error creating post");
      console.log(error);
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

// ── Page load: show posts publicly, restore session if logged in ──
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  fetchPosts();

  const editorEl = document.getElementById("post-content-editor");
  if (editorEl && typeof Quill !== "undefined") {
    postContentEditor = new Quill("#post-content-editor", {
      theme: "snow",
      placeholder: "Content",
      modules: {
        toolbar: [["bold", "italic"], [{ list: "ordered" }, { list: "bullet" }], ["link"]],
      },
    });
  }

  if (token && currentUsername) {
    updateHeaderForLoggedInUser(currentUsername);

    fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        showVerificationBanner(data.user?.verified);
        const checkbox = document.getElementById("digest-checkbox");
        if (checkbox) checkbox.checked = !!data.user?.digestSubscribed;
      })
      .catch((error) => console.log(error));
  } else {
    updateHeaderForLoggedOutUser();
  }
});

function toggleDigestSubscription() {
  const checkbox = document.getElementById("digest-checkbox");
  const digestSubscribed = checkbox.checked;

  fetch(`/api/users/${currentUserId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ digestSubscribed }),
  }).catch((error) => {
    console.log(error);
    checkbox.checked = !digestSubscribed; // revert on failure
  });
}