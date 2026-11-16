import axios from "axios";


// API Base URL

// Always use same-origin `/api` requests. Vite proxies `/api` during
// development and preview, Nginx proxies it in Docker, and Vercel rewrites
// it to Render in production. Keeping the API on the site's own origin is
// what makes the HttpOnly session cookie first-party and avoids third-party
// cookie blocking. A direct cross-site API URL is deliberately not supported.
const API_URL = "";


// CSRF token
//
// The session cookie is HttpOnly, so JavaScript cannot read it. The matching
// CSRF token is returned by login and `/auth/session` and kept in memory only.
// It is not an authentication credential on its own.

let csrfToken = "";

export const setCsrfToken = (token) => {
  csrfToken = typeof token === "string" ? token : "";
};

export const clearCsrfToken = () => {
  csrfToken = "";
};


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
    config.headers = config.headers || {};

    const method = (config.method || "get").toLowerCase();
    const isSafeMethod =
      method === "get" || method === "head" || method === "options";

    if (!isSafeMethod && csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
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

const clearAdminHint = () => {
  try {
    sessionStorage.removeItem("portfolio_admin_hint");
  } catch {
    // Storage can be unavailable in locked-down browsers; the hint is
    // cosmetic and must never break the request pipeline.
  }
};

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
      const isSessionCheck = /\/auth\/session\/?$/.test(requestUrl);
      const path = window.location.pathname;

      clearCsrfToken();
      clearAdminHint();

      // Never reload the login screen after bad credentials — that would
      // erase the form error. The protected route handles its own redirect.
      if (
        !isLoginRequest &&
        !isSessionCheck &&
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
