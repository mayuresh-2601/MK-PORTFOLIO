import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api, { setCsrfToken } from "../../api/axios";

/**
 * The session lives in an HttpOnly cookie that JavaScript cannot inspect.
 * Ask the API once per protected mount instead of reading localStorage.
 */
export default function ProtectedRoute({ children }) {
  const [state, setState] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/auth/session")
      .then(({ data }) => {
        if (cancelled) return;

        setCsrfToken(data.csrfToken);

        try {
          sessionStorage.setItem("portfolio_admin_hint", "1");
        } catch {
          // Cosmetic only.
        }

        setState("authenticated");
      })
      .catch(() => {
        if (!cancelled) setState("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") {
    return (
      <section className="login-page grid-acid">
        <p className="meta" role="status">
          Checking admin session…
        </p>
      </section>
    );
  }

  if (state === "unauthenticated") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
