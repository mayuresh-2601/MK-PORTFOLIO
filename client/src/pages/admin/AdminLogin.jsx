import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, LoaderCircle, ArrowLeft } from "lucide-react";
import api, { setCsrfToken } from "../../api/axios";
import SEO from "../../components/common/SEO";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    totp: "",
  });

  // idle | submitting | error. A successful login navigates away, so there
  // is no success state to render.
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const totpRef = useRef(null);
  const submitting = status === "submitting";

  useEffect(() => {
    if (mfaRequired) {
      totpRef.current?.focus();
    }
  }, [mfaRequired]);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    if (status === "error") {
      setStatus("idle");
      setError("");
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const email = form.email.trim();

    if (!email || !form.password) {
      setStatus("error");
      setError("Please enter your email and password.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const { data } = await api.post("/auth/login", {
        email,
        password: form.password,
        totp: form.totp.trim(),
      });

      // The session itself is an HttpOnly cookie. Only the CSRF token is
      // kept in memory for state-changing requests.
      setCsrfToken(data.csrfToken);

      try {
        sessionStorage.setItem("portfolio_admin_hint", "1");
      } catch {
        // Cosmetic navigation hint only.
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (loginError) {
      const response = loginError?.response?.data;

      setStatus("error");

      if (response?.mfaRequired) {
        setMfaRequired(true);
      }

      setError(
        response?.message ||
          "Unable to login. Please try again."
      );
    }
  };

  return (
    <section className="login-page grid-acid">
      <SEO
        title="Admin Portal | Mayuresh Kasar"
        description="Restricted admin portal for managing portfolio projects, skills, certificates and contact messages."
        path="/admin"
        noIndex
      />

      <div style={{ width: "100%", maxWidth: "480px" }}>
        <Link
          to="/"
          className="meta text-ink"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            marginBottom: "1rem",
          }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to site
        </Link>

        <form onSubmit={handleLogin} className="login-card">
          <span className="login-card__icon">
            <ShieldCheck size={30} aria-hidden="true" />
          </span>

          <p className="meta text-pink">Restricted / Authorized only</p>
          <h1>
            Admin
            <br />
            portal
          </h1>

          <p className="login-card__lede">
            Sign in to manage projects, skills, and certificates from the
            dashboard.
          </p>

          {error && (
            <div
              className="form-status form-status--error"
              role="alert"
              style={{ marginBottom: "1.25rem" }}
            >
              {error}
            </div>
          )}

          <div className="login-field">
            <label className="login-label" htmlFor="admin-email">
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={submitting}
              required
              className="login-input"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={submitting}
              required
              className="login-input"
            />
          </div>

          {mfaRequired && (
            <div className="login-field">
              <label className="login-label" htmlFor="admin-totp">
                Authenticator code
              </label>
              <input
                ref={totpRef}
                id="admin-totp"
                type="text"
                name="totp"
                placeholder="6-digit code"
                value={form.totp}
                onChange={handleChange}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                disabled={submitting}
                required
                className="login-input"
              />
              <p className="meta" style={{ marginTop: "0.5rem" }}>
                Open your authenticator app and enter the current code.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn--acid btn--pill btn--wide"
            style={{ marginTop: "0.5rem" }}
          >
            {submitting ? (
              <>
                <LoaderCircle
                  className="spin"
                  size={18}
                  aria-hidden="true"
                />
                Authenticating...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
