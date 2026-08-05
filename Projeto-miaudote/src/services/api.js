import axios from 'axios';
import { API_URL } from '../config';
import { attachAuthInterceptors } from './authInterceptor';

const api = axios.create({
  baseURL: API_URL, // backend
});

attachAuthInterceptors(api);

export default api;
