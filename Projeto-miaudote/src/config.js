// src/config.js
// URL base da API.
// Em producao, defina REACT_APP_API_URL nas variaveis de ambiente do host
// (ex.: https://miaudote-api.onrender.com). Em desenvolvimento cai no localhost.
export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export default API_URL;
