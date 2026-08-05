// src/services/authInterceptor.js
// Anexa automaticamente o token JWT em todas as requisicoes e trata expiracao.
import axios from 'axios';

export function getToken() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && user.token ? user.token : null;
  } catch (e) {
    return null;
  }
}

export function attachAuthInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Token expirado ou invalido: encerra a sessao local
      if (error && error.response && error.response.status === 401) {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('userLoggedOut'));
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// Aplica na instancia global do axios (usada direto em varios componentes)
attachAuthInterceptors(axios);

export default attachAuthInterceptors;
