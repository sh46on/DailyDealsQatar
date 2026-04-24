import axios from "axios";



const BASE_URL = "http://127.0.0.1:8000";

// AUTH API
export const API_URL = axios.create({
  baseURL: BASE_URL,
});
// AUTH API
export const API = axios.create({
  baseURL: BASE_URL+"/api",
  timeout: 10000,
});
// AUTH API
export const AUTH_API = axios.create({
  baseURL: BASE_URL+"/api/auth",
});

// MARKETPLACE API
export const MARKET_API = axios.create({
  baseURL: BASE_URL+"/marketplace",
});

// Attach token interceptor to BOTH
const attachToken = (api) => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

attachToken(API);
attachToken(API_URL);
attachToken(AUTH_API);
attachToken(MARKET_API);

export default BASE_URL;