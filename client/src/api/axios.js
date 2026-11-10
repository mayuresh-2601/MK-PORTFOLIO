import axios from "axios";


// API Base URL

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

// Leave VITE_API_BASE_URL unset for same-origin `/api` requests. Vite
// proxies `/api` during development and preview, Nginx proxies it in
// Docker, and split deployments (for example Vercel + Render) can set an
// explicit API origin. This avoids baking localhost into a production build.
const API_URL = (configuredApiUrl || "").replace(/\/$/, "");


// Axios Instance

const api = axios.create({
  baseURL: `${API_URL}/api`,
  // Render's free tier can take 30–60 seconds to wake from an idle
  // suspension. The UI shows a clear error only after this window.
  timeout: 60000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});


// Request Interceptor

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser automatically set multipart/form-data headers
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// Response Interceptor

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestConfig = error.config;

    // One automatic retry for idempotent reads when the API is waking up
    // (Render cold start) or a transient network failure occurs.
    const isNetworkFailure = !error.response;

    if (
      requestConfig &&
      !requestConfig._coldStartRetry &&
      isNetworkFailure &&
      (requestConfig.method || "get").toLowerCase() === "get"
    ) {
      requestConfig._coldStartRetry = true;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      return api(requestConfig);
    }

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      const isLoginRequest = /\/auth\/login\/?$/.test(requestUrl);
      const path = window.location.pathname;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Never reload the login screen after bad credentials — that would
      // erase the form error. Only kick unauthenticated admin pages out.
      if (
        !isLoginRequest &&
        path.startsWith("/admin") &&
        path !== "/admin"
      ) {
        window.location.replace("/admin");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
