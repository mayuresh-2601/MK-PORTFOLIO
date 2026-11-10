import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, LoaderCircle, ArrowLeft } from "lucide-react";
import api from "../../api/axios";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loading) return;

    const email = form.email.trim();

    if (!email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("/auth/login", {
        email,
        password: form.password,
      });

      localStorage.setItem("token", data.token);

      navigate("/admin/dashboard", { replace: true });
    } catch (loginError) {
      setError(
        loginError?.response?.data?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page grid-acid">
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
              disabled={loading}
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
              disabled={loading}
              required
              className="login-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn--acid btn--pill btn--wide"
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? (
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
