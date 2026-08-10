import axios from 'axios';
import { API_URL } from '../config';
import { attachAuthInterceptors } from './authInterceptor';

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

attachAuthInterceptors(api);

// Aplica o mesmo interceptor no axios global, para os componentes
// que ainda importam 'axios' diretamente enviarem o token também.
attachAuthInterceptors(axios);

export default api;