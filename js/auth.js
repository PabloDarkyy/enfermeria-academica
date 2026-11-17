// Pantalla de inicio de sesión. La decisión real de acceso la toma el servidor.
'use strict';
document.querySelector('.login-page').insertAdjacentHTML('afterbegin', Theme.button()); Theme.refresh();
const form = document.getElementById('login');
const err = document.getElementById('err');
const btn = document.getElementById('submit');

// Si ya hay una sesión activa, se va directo al panel correspondiente.
window.demoFetch('/api/auth/me', { credentials: 'same-origin' })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => { if (d) location.replace(d.user.rol === 'TUTOR' ? './tutor.html' : './estudiante.html'); })
  .catch(() => {});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.hidden = true;
  btn.disabled = true; btn.textContent = 'Ingresando…'; form.classList.remove('shake');
  try {
    const res = await window.demoFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username: form.username.value, password: form.password.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No pudimos iniciar sesión. Revisa tus credenciales.');
    location.href = data.destino;
  } catch (ex) {
    err.lastElementChild.textContent = ex instanceof TypeError ? 'No pudimos conectar con el servidor.' : ex.message;
    err.hidden = false;
    form.password.value = '';
    form.password.focus();
    btn.disabled = false; btn.textContent = 'Iniciar sesión'; void form.offsetWidth; form.classList.add('shake');
  }
});
