// ═══════════════════════════════════════════════════════════════
// Record Room — Login Page Logic
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const alert = document.getElementById('login-alert');
  const loginBtn = document.getElementById('login-btn');
  const spinner = document.getElementById('login-spinner');
  const btnText = loginBtn.querySelector('.btn-text');

  // Check if already logged in
  fetch('/auth/me')
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        window.location.href = data.user.role === 'admin' ? '/admin' : '/user';
      }
    })
    .catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showAlert('Please fill in all fields.');
      return;
    }

    // Show loading state
    btnText.textContent = 'Entering...';
    spinner.style.display = 'block';
    loginBtn.disabled = true;

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        showAlert(data.error || 'Login failed.');
        resetButton();
        return;
      }

      // Success — redirect based on role
      btnText.textContent = 'Welcome!';
      
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? '/admin' : '/user';
      }, 500);

    } catch (err) {
      showAlert('Connection error. Please try again.');
      resetButton();
    }
  });

  function showAlert(message) {
    alert.textContent = message;
    alert.style.display = 'block';
    alert.classList.add('alert-error');

    setTimeout(() => {
      alert.style.display = 'none';
    }, 5000);
  }

  function resetButton() {
    btnText.textContent = 'Enter the Room';
    spinner.style.display = 'none';
    loginBtn.disabled = false;
  }
});
