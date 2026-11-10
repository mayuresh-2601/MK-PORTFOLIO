import { useState } from "react";
import { Mail, Send, ArrowUpRight } from "lucide-react";
import api from "../../api/axios";
import GithubIcon from "../../assets/GithubIcon";
import LinkedinIcon from "../../assets/LinkedinIcon";
import SEO from "../../components/common/SEO";

const contactRows = [
  {
    label: "Email",
    value: "kasarmayuresh99@gmail.com",
    href: "mailto:kasarmayuresh99@gmail.com",
    icon: Mail,
  },
  {
    label: "GitHub",
    value: "github.com/mayuresh-2601",
    href: "https://github.com/mayuresh-2601",
    icon: GithubIcon,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/mayuresh2601",
    href: "https://www.linkedin.com/in/mayuresh2601/",
    icon: LinkedinIcon,
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState({
    loading: false,
    success: "",
    error: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (status.loading) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setStatus({
        loading: false,
        success: "",
        error: "Please fill in all required fields.",
      });
      return;
    }

    try {
      setStatus({ loading: true, success: "", error: "" });

      const { data } = await api.post("/messages", payload);

      setStatus({
        loading: false,
        success: data?.message || "Your message has been sent successfully!",
        error: "",
      });

      resetForm();
    } catch (error) {
      setStatus({
        loading: false,
        success: "",
        error:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <section className="page page-section contact-section grid-acid">
      <SEO
        title="Contact Mayuresh Kasar | Hire a Full Stack Developer"
        description="Get in touch with Mayuresh Kasar for freelance work, collaborations or full stack development projects. Messages are delivered straight to the inbox."
        path="/contact"
      />

      <div className="section__inner">
        <div className="contact-grid">
          <div className="reveal">
            <p className="meta text-ink">Contact / 05</p>
            <h2 className="display contact-title">
              Get in
              <br />
              touch
            </h2>

            <p className="lede contact-lede">
              Have a project idea, freelance opportunity, or collaboration?
              Feel free to send me a message — I&apos;ll get back to you.
            </p>

            <div className="contact-rows">
              {contactRows.map((row) => {
                const Icon = row.icon;
                return (
                  <a
                    key={row.label}
                    href={row.href}
                    className="contact-row"
                    target={row.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      row.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    <span className="contact-row__icon">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="contact-row__label">{row.label}</span>
                      <span className="contact-row__value">{row.value}</span>
                    </span>
                  </a>
                );
              })}
            </div>

            <a href="#contact-form" className="btn btn--pink btn--pill">
              Start a project
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>

          <div
            className="contact-visual reveal"
            style={{ "--delay": "140ms" }}
          >
            <div className="contact-visual__grid" aria-hidden="true" />
            <div className="contact-visual__dot" aria-hidden="true" />
            <span
              className="badge-rotate"
              style={{ position: "absolute", top: "1.5rem", left: "1.5rem" }}
            >
              Open to work
            </span>
            <div className="contact-visual__label">
              <strong>
                Maharashtra
                <br />
                India
              </strong>
              <p className="meta">Remote / Worldwide</p>
            </div>
          </div>
        </div>

        <div className="contact-form-panel reveal" id="contact-form">
          <div className="section-head" style={{ marginBottom: "1.75rem" }}>
            <div>
              <p className="meta text-ink">Send a message / Direct</p>
              <h3 className="display" style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)" }}>
                Let&apos;s talk.
              </h3>
            </div>
            <p className="meta text-ink">Response within 24–48 hours</p>
          </div>

          {status.success && (
            <div
              className="form-status form-status--success"
              role="status"
            >
              {status.success}
            </div>
          )}

          {status.error && (
            <div className="form-status form-status--error" role="alert">
              {status.error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="contact-name">
                  Full name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  disabled={status.loading}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="contact-email">
                  Email address *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  disabled={status.loading}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field form-field--full">
                <label className="form-label" htmlFor="contact-subject">
                  Subject *
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  disabled={status.loading}
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Project discussion"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field form-field--full">
                <label className="form-label" htmlFor="contact-message">
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  name="message"
                  disabled={status.loading}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project..."
                  className="form-input"
                  style={{ resize: "vertical" }}
                  required
                />
              </div>

              <div className="form-field form-field--full">
                <button
                  type="submit"
                  disabled={status.loading}
                  className="btn btn--black btn--pill btn--wide"
                >
                  <Send size={17} aria-hidden="true" />
                  {status.loading ? "Sending message..." : "Send message"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
