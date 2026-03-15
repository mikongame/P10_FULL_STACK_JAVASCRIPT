import { isAuthenticated, logout, getUser } from '../utils/auth.js';

export const Header = () => {
  const header = document.createElement('header');
  header.className = 'main-header';
  
  const user = getUser();
  
  header.innerHTML = `
    <div class="header-content">
      <h1 class="logo" data-navigate="/">🎉 Eventify</h1>
      <nav class="main-nav">
        <a href="/" data-navigate="/">Eventos</a>
        ${isAuthenticated() ? `
          <a href="/create-event" data-navigate="/create-event">Crear Evento</a>
          <div class="user-menu">
            <span class="user-name">👋 ${user?.name || 'Usuario'}</span>
            <button id="logout-btn" class="logout-btn">Cerrar Sesión</button>
          </div>
        ` : `
          <a href="/login" data-navigate="/login" class="login-link">Iniciar Sesión</a>
        `}
      </nav>
    </div>
  `;
  
  header.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.getAttribute('data-navigate');
      window.navigateTo(path);
    });
  });
  
  const logoutBtn = header.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  return header;
};
