// login.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById("container");
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");

  // --- Toggle panels (original toggle code preserved) ---
  document.getElementById('loginBtn').addEventListener('click', () => {
    document.getElementById('container').classList.remove("right-panel-active");
  });
  document.getElementById('registerBtn').addEventListener('click', () => {
    document.getElementById('container').classList.add("right-panel-active");
  });

  if (registerBtn) registerBtn.addEventListener("click", () => container.classList.add("active"));
  if (loginBtn) loginBtn.addEventListener("click", () => container.classList.remove("active"));

  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');

  // --- Validation ---
  function validateRegister(payload) {
    if (!payload.college || payload.college.trim() === "") return "College name is required";
    if (!payload.committee || payload.committee.trim() === "") return "Committee name is required";
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return "Valid email is required";
    if (!payload.contact || isNaN(payload.contact)) return "Contact must be a number";
    if (payload.password.length < 6) return "Password must be at least 6 characters";
    if (payload.password !== payload.confirmPassword) return "Passwords do not match";
    return null;
  }

  // --- Register ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(registerForm).entries());

      const errorMsg = validateRegister(payload);
      if (errorMsg) return alert("❌ " + errorMsg);

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
          const msg = data.errors ? data.errors.map(e => e.msg).join(', ') : "Registration failed";
          return alert("❌ " + msg);
        }

        // Store email for verification page
        localStorage.setItem('verifyEmail', data.email);
        alert("✅ Registration successful — verification code sent to your email");

        // Redirect to verification page
        location.href = 'verfication.html';
      } catch (err) {
        console.error(err);
        alert("❌ Network/server error during registration");
      }
    });
  }

  // --- Login ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(loginForm).entries());

      if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return alert("❌ Valid email is required");
      if (!payload.password) return alert("❌ Password is required");

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
          const msg = data.errors ? data.errors.map(e => e.msg).join(', ') : "Login failed";
          return alert("❌ " + msg);
        }

        localStorage.setItem('token', data.token);
        alert('✅ Login successful — redirecting to admin dashboard');
        location.href = 'admin.html';
      } catch (err) {
        console.error(err);
        alert("❌ Network/server error during login");
      }
    });
  }

  // --- Verification page handler ---
  const verifyForm = document.getElementById('verifyForm');
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = verifyForm.code.value;
      const email = localStorage.getItem('verifyEmail');
      if (!email) return alert("❌ Email not found. Please register again.");

      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json();

        if (!res.ok) {
          const msg = data.errors ? data.errors.map(e => e.msg).join(', ') : "Verification failed";
          return alert("❌ " + msg);
        }

        alert('✅ Registration successful — redirecting to admin dashboard');
        location.href = 'admin.html';
      } catch (err) {
        console.error(err);
        alert("❌ Network/server error during verification");
      }
    });
  }
});
